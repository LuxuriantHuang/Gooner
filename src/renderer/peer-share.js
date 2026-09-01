// 渲染进程「联机共享」模块：管理房间加入/离开、WebRTC 建连、文件发送与接收。
//
// 分工边界（务必保持）：
// - 主进程 (`peer-share-service.js`) 只负责 DHT 房间发现 + 信令的可靠投递，不碰媒体数据。
// - 本模块在 renderer 里用 SimplePeer 建立真正的 WebRTC DataChannel，通过 window.peerShare
//   把 offer/answer/ice 转交给主进程投递给对端；文件内容完全走 DataChannel，不经过 IPC/主进程。
// - 接收到的文件只在内存里用 Blob 拼装出 <img>/<video> 可用的 URL，随时可撤销释放，不写入磁盘。
(function () {
  "use strict";

  const CHUNK_SIZE = 64 * 1024;

  const state = {
    active: false,
    roomCode: "",
    selfPeerId: "",
    peers: new Map(), // peerId -> { simplePeer, connected }
    peerDisplayNames: new Map(), // peerId -> 对端设置的显示昵称
    incomingTransfers: new Map(), // transferId -> { offer, chunks, receivedSize, fromPeerId }
    outgoingTransfers: new Map(), // transferId -> { file, peerId }
    unsubscribeSignal: null,
    onStatusChange: function () {},
    onIncomingOffer: function () {},
    onIncomingProgress: function () {},
    onIncomingComplete: function () {}
  };

  function getPeerShareApi() {
    return window.peerShare;
  }

  function notifyStatus() {
    state.onStatusChange({
      active: state.active,
      roomCode: state.roomCode,
      selfPeerId: state.selfPeerId,
      peerCount: state.peers.size
    });
  }

  async function joinRoom(roomCode) {
    const api = getPeerShareApi();
    if (!api) return { ok: false, errorKey: "peer.error.notSupported" };

    // 重复点击“加入房间”会导致主进程分配新的 peerId、旧的信令/连接残留，
    // 对端因此会看到同一个人的多条连接。先彻底离开一次旧房间再加入，保证幂等。
    if (state.active) {
      await leaveRoom();
    }

    const result = await api.join(roomCode);
    if (!result || !result.ok) {
      return result || { ok: false, errorKey: "peer.error.joinFailed" };
    }

    state.active = true;
    state.roomCode = result.roomCode;
    state.selfPeerId = result.peerId;

    if (state.unsubscribeSignal) {
      state.unsubscribeSignal();
    }
    state.unsubscribeSignal = api.onSignal(function (data) {
      handleIncomingSignal(data.fromPeerId, data.payload);
    });

    pollPeerList();
    notifyStatus();
    return { ok: true, ...result };
  }

  async function leaveRoom() {
    const api = getPeerShareApi();
    if (api) {
      await api.leave();
    }
    if (state.unsubscribeSignal) {
      state.unsubscribeSignal();
      state.unsubscribeSignal = null;
    }
    for (const entry of state.peers.values()) {
      try { entry.simplePeer.destroy(); } catch (_e) {}
    }
    state.peers.clear();
    state.peerDisplayNames.clear();
    state.incomingTransfers.clear();
    state.outgoingTransfers.clear();
    state.active = false;
    state.roomCode = "";
    state.selfPeerId = "";
    notifyStatus();
  }

  let pollTimer = null;
  function pollPeerList() {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(async function () {
      if (!state.active) return;
      const api = getPeerShareApi();
      if (!api) return;
      const peers = await api.listPeers();
      for (const p of peers) {
        state.peerDisplayNames.set(p.peerId, p.displayName || "");
        if (!state.peers.has(p.peerId)) {
          // 双方都会在轮询里看到对方，如果都以 initiator=true 建连，会产生
          // 同时互发 offer 的竞态（glare），导致连接反复建立又断开。
          // 用 peerId 字典序决定唯一的发起方：只有 selfPeerId 更小的一侧主动发起，
          // 另一侧被动等待对方的 signal 到来后再以 initiator=false 建连（见 handleIncomingSignal）。
          const shouldInitiate = state.selfPeerId < p.peerId;
          if (shouldInitiate) {
            createPeerConnection(p.peerId, true);
          }
        }
      }
      notifyStatus();
    }, 5000);
  }

  function createPeerConnection(peerId, initiator) {
    if (!window.SimplePeer) {
      console.error("[PeerShare] SimplePeer library not loaded.");
      return null;
    }
    const sp = new window.SimplePeer({ initiator, trickle: true });
    const entry = { simplePeer: sp, connected: false };
    state.peers.set(peerId, entry);

    sp.on("signal", function (signalData) {
      const api = getPeerShareApi();
      if (api) api.sendSignal(peerId, { type: "webrtc-signal", data: signalData });
    });
    sp.on("connect", function () {
      entry.connected = true;
      notifyStatus();
    });
    sp.on("data", function (data) {
      handleDataChannelMessage(peerId, data);
    });
    sp.on("close", function () {
      state.peers.delete(peerId);
      notifyStatus();
    });
    sp.on("error", function (error) {
      console.warn("[PeerShare] simple-peer error:", error && error.message);
    });

    return entry;
  }

  function handleIncomingSignal(fromPeerId, payload) {
    if (!payload || payload.type !== "webrtc-signal") return;
    let entry = state.peers.get(fromPeerId);
    if (!entry) {
      entry = createPeerConnection(fromPeerId, false);
    }
    if (entry) {
      try { entry.simplePeer.signal(payload.data); } catch (error) {
        console.warn("[PeerShare] failed to apply signal:", error && error.message);
      }
    }
  }

  // ── 应用层帧：1 字节类型前缀。0x01 = JSON 控制帧，0x02 = 二进制分片帧 ──
  function encodeControlFrame(obj) {
    const json = new TextEncoder().encode(JSON.stringify(obj));
    const buf = new Uint8Array(1 + json.length);
    buf[0] = 0x01;
    buf.set(json, 1);
    return buf;
  }

  function encodeChunkFrame(transferId, chunkIndex, payload) {
    const idBytes = hexToBytes(transferId);
    const header = new Uint8Array(1 + idBytes.length + 4);
    header[0] = 0x02;
    header.set(idBytes, 1);
    new DataView(header.buffer).setUint32(1 + idBytes.length, chunkIndex, false);
    const out = new Uint8Array(header.length + payload.length);
    out.set(header, 0);
    out.set(payload, header.length);
    return out;
  }

  function decodeFrame(buffer) {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    if (bytes.length < 1) return null;
    if (bytes[0] === 0x01) {
      try {
        return { type: "control", payload: JSON.parse(new TextDecoder().decode(bytes.slice(1))) };
      } catch (_e) {
        return null;
      }
    }
    if (bytes[0] === 0x02) {
      if (bytes.length < 13) return null;
      const transferId = bytesToHex(bytes.slice(1, 9));
      const chunkIndex = new DataView(bytes.buffer, bytes.byteOffset).getUint32(9, false);
      const payload = bytes.slice(13);
      return { type: "chunk", transferId, chunkIndex, payload };
    }
    return null;
  }

  function hexToBytes(hex) {
    const out = new Uint8Array(hex.length / 2);
    for (let i = 0; i < out.length; i++) {
      out[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return out;
  }

  function bytesToHex(bytes) {
    let out = "";
    for (let i = 0; i < bytes.length; i++) {
      out += bytes[i].toString(16).padStart(2, "0");
    }
    return out;
  }

  // ── 发送文件：先发 file-offer 控制帧，等待对端 accept，再逐片发送 ──
  async function sendFile(peerId, file) {
    const api = getPeerShareApi();
    if (!api) return { ok: false, errorKey: "peer.error.notSupported" };
    const entry = state.peers.get(peerId);
    if (!entry || !entry.connected) {
      return { ok: false, errorKey: "peer.error.peerNotConnected" };
    }

    const built = await api.buildFileOffer({
      fileName: file.name,
      size: file.size,
      mimeType: file.type
    });
    if (!built || !built.validation || !built.validation.ok) {
      return { ok: false, errorKey: (built && built.validation && built.validation.errorKey) || "peer.error.malformedOffer" };
    }

    const offer = built.offer;
    state.outgoingTransfers.set(offer.transferId, { file, peerId });
    entry.simplePeer.send(encodeControlFrame(offer));
    return { ok: true, transferId: offer.transferId };
  }

  async function streamFileChunks(peerId, transferId) {
    const entry = state.peers.get(peerId);
    const outgoing = state.outgoingTransfers.get(transferId);
    if (!entry || !outgoing) return;

    const file = outgoing.file;
    const totalChunks = Math.max(1, Math.ceil(file.size / CHUNK_SIZE));
    for (let i = 0; i < totalChunks; i++) {
      if (!entry.connected) break;
      const start = i * CHUNK_SIZE;
      const blob = file.slice(start, start + CHUNK_SIZE);
      const buf = new Uint8Array(await blob.arrayBuffer());
      entry.simplePeer.send(encodeChunkFrame(transferId, i, buf));
      // 简单背压：等待发送队列不过载，避免一次性把大文件全部塞进内核缓冲区。
      await waitForBufferedAmountLow(entry.simplePeer);
    }
    entry.simplePeer.send(encodeControlFrame({ type: "file-complete", transferId }));
    state.outgoingTransfers.delete(transferId);
  }

  function waitForBufferedAmountLow(sp) {
    return new Promise(function (resolve) {
      const channel = sp._channel;
      if (!channel || channel.bufferedAmount < 1024 * 1024) {
        resolve();
        return;
      }
      const check = function () {
        if (channel.bufferedAmount < 1024 * 1024) {
          resolve();
        } else {
          setTimeout(check, 50);
        }
      };
      check();
    });
  }

  function handleDataChannelMessage(fromPeerId, data) {
    const frame = decodeFrame(data);
    if (!frame) return;

    if (frame.type === "control") {
      const payload = frame.payload;
      if (payload.type === "file-offer") {
        state.incomingTransfers.set(payload.transferId, {
          offer: payload,
          chunks: [],
          receivedSize: 0,
          fromPeerId
        });
        state.onIncomingOffer(fromPeerId, payload);
      } else if (payload.type === "file-accept") {
        streamFileChunks(payload.toPeerId || fromPeerId, payload.transferId);
      } else if (payload.type === "file-reject") {
        state.outgoingTransfers.delete(payload.transferId);
      } else if (payload.type === "file-complete") {
        finalizeIncomingTransfer(payload.transferId);
      }
      return;
    }

    if (frame.type === "chunk") {
      const incoming = state.incomingTransfers.get(frame.transferId);
      if (!incoming) return;
      incoming.chunks[frame.chunkIndex] = frame.payload;
      incoming.receivedSize += frame.payload.length;
      state.onIncomingProgress(frame.transferId, incoming.receivedSize, incoming.offer.size);
    }
  }

  function acceptIncomingTransfer(transferId) {
    const incoming = state.incomingTransfers.get(transferId);
    if (!incoming) return;
    const entry = state.peers.get(incoming.fromPeerId);
    if (entry && entry.connected) {
      entry.simplePeer.send(encodeControlFrame({ type: "file-accept", transferId }));
    }
  }

  function rejectIncomingTransfer(transferId) {
    const incoming = state.incomingTransfers.get(transferId);
    if (!incoming) return;
    const entry = state.peers.get(incoming.fromPeerId);
    if (entry && entry.connected) {
      entry.simplePeer.send(encodeControlFrame({ type: "file-reject", transferId }));
    }
    state.incomingTransfers.delete(transferId);
  }

  function finalizeIncomingTransfer(transferId) {
    const incoming = state.incomingTransfers.get(transferId);
    if (!incoming) return;
    // 只在内存里拼装 Blob，交给调用方生成可撤销的 Object URL；不写入磁盘。
    const blob = new Blob(incoming.chunks, { type: incoming.offer.mimeType || "application/octet-stream" });
    state.incomingTransfers.delete(transferId);
    state.onIncomingComplete(transferId, blob, incoming.offer);
  }

  window.PeerShareUI = {
    joinRoom,
    leaveRoom,
    sendFile,
    acceptIncomingTransfer,
    rejectIncomingTransfer,
    getState: function () {
      return {
        active: state.active,
        roomCode: state.roomCode,
        selfPeerId: state.selfPeerId,
        peers: Array.from(state.peers.keys()),
        peerDisplayNames: Object.fromEntries(state.peerDisplayNames)
      };
    },
    setCallbacks: function (callbacks) {
      if (callbacks.onStatusChange) state.onStatusChange = callbacks.onStatusChange;
      if (callbacks.onIncomingOffer) state.onIncomingOffer = callbacks.onIncomingOffer;
      if (callbacks.onIncomingProgress) state.onIncomingProgress = callbacks.onIncomingProgress;
      if (callbacks.onIncomingComplete) state.onIncomingComplete = callbacks.onIncomingComplete;
    }
  };
})();
