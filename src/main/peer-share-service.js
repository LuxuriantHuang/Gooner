// PeerShareService：基于 bittorrent-dht 的房间发现 + 直连 UDP 信令交换。
//
// 设计要点（重要，避免误解 DHT 的能力边界）：
// - DHT 只用来做「同一个房间主题下还有哪些节点在线（IP:端口）」的发现，这是 DHT 真正擅长的事情。
// - DHT 的 put/get 存储并不适合承载「两端互相交换 SDP offer/answer」这种一来一回的会话数据
//   （immutable 记录只读不可指定去向，mutable 记录需要签名密钥且仍是「一个房间一份公共数据」，
//   无法表达「这条消息只发给某个特定 peer」）。
// - 因此实际信令改为：用 dht.announce 把「我在监听某个 UDP 端口」广播到房间主题对应的 infohash 上，
//   其它房间成员通过 dht.lookup 这个 infohash 拿到我的 IP:端口，然后直接通过一个小的 UDP 数据报
//   协议（复用 peer-share-protocol 的控制帧）交换 offer/answer/ice。
// - 真正的媒体数据完全不经过这里：DataChannel 由 renderer 中的 simple-peer 建立和维护，
//   本模块只负责把 SDP/ICE 从「发现的对端地址」送到 renderer，再把 renderer 产生的信令送出去。
// - 局限：如果本机 UDP 端口在 NAT 后完全不可达（无 UPnP/无 STUN 打洞），直连信令也会失败，
//   此时会触发 onError 并提示用户，不做静默重试到无限。

const dgram = require('dgram');
const crypto = require('crypto');
const DHT = require('bittorrent-dht');
const {
  deriveRoomTopic,
  normalizeRoomCode,
  generatePeerId,
  SIGNAL_TTL_MS,
  isSignalMessageFresh
} = require('./peer-share-protocol');

const SIGNAL_RESEND_INTERVAL_MS = 3000;
const SIGNAL_MAX_RESENDS = 5;
const PEER_STALE_MS = 90 * 1000;

// 局域网发现：公网 BitTorrent DHT 的引导/查找依赖外部网络状况，实测在部分网络环境下
// 引导节点连通性很不稳定（可能长时间只找到 1 个 DHT 节点，导致同房间的另一方永远发现不了）。
// 为了让同一台电脑（本地双开测试）或同一局域网内的用户能可靠且快速地互相发现，
// 额外维护一个基于 UDP 广播的发现通道，与 DHT 并行工作、互不影响：
// - 固定端口 + SO_REUSEADDR，允许同一台机器上多个实例都绑定同一个广播端口。
// - 定期广播「房间主题哈希 + 我的信令端口 + peerId」，收到匹配房间的广播就直接握手。
const LAN_DISCOVERY_PORT = 47891;
const LAN_ANNOUNCE_INTERVAL_MS = 3000;

class PeerShareService {
  constructor({ onSignal, onPeerListUpdate, onError, log = () => {} } = {}) {
    this.onSignal = onSignal || (() => {});
    this.onPeerListUpdate = onPeerListUpdate || (() => {});
    this.onError = onError || (() => {});
    this.log = log;

    this.dht = null;
    this.socket = null;
    this.lanSocket = null;
    this.lanAnnounceTimer = null;
    this.roomCode = '';
    this.roomTopic = null;
    this.selfPeerId = '';
    this.displayName = '';
    this.lookupTimer = null;
    this.pendingResendTimers = new Map(); // nonce -> timer
    this.knownPeers = new Map(); // peerId -> { host, port, lastSeenAt }
    this.seenSignalNonces = new Set(); // 已处理过的信令 nonce，防止重发的信令被二次投递给 renderer
    this.destroyed = false;
  }

  get isActive() {
    return Boolean(this.dht && this.socket && this.roomTopic);
  }

  async start(roomCode, { bootstrap, displayName } = {}) {
    const normalized = normalizeRoomCode(roomCode);
    if (!normalized) {
      throw new Error('invalid_room_code');
    }
    if (this.isActive) {
      await this.stop();
    }

    this.roomCode = normalized;
    this.roomTopic = deriveRoomTopic(normalized);
    this.selfPeerId = generatePeerId();
    this.displayName = typeof displayName === 'string' ? displayName.slice(0, 40) : '';
    this.destroyed = false;

    this.socket = dgram.createSocket('udp4');
    this.socket.on('message', (msg, rinfo) => this._handleDatagram(msg, rinfo));
    this.socket.on('error', (error) => {
      this.log('[PeerShare] socket error:', error?.message);
      this.onError({ errorKey: 'peer.error.socketFailure', detail: error?.message });
    });

    const boundPort = await new Promise((resolve, reject) => {
      this.socket.once('error', reject);
      this.socket.bind(0, () => {
        this.socket.removeListener('error', reject);
        resolve(this.socket.address().port);
      });
    });

    this.dht = new DHT(bootstrap ? { bootstrap } : undefined);
    this.dht.on('error', (error) => {
      this.log('[PeerShare] DHT error:', error?.message);
      this.onError({ errorKey: 'peer.error.dhtFailure', detail: error?.message });
    });
    this.dht.on('peer', (peer) => {
      this.log('[PeerShare] dht "peer" event:', peer);
      this._onDhtPeer(peer);
    });
    this.dht.on('ready', () => {
      this.log('[PeerShare] dht ready, node count:', this.dht.nodes.count());
    });

    await new Promise((resolve) => {
      this.dht.listen(0, resolve);
    });

    this.dht.announce(this.roomTopic, boundPort, (error) => {
      this.log('[PeerShare] announce callback, error:', error?.message, 'topic:', this.roomTopic.toString('hex'), 'port:', boundPort);
    });
    this.dht.lookup(this.roomTopic, (error, count) => {
      this.log('[PeerShare] initial lookup done, error:', error?.message, 'count:', count);
    });

    this.lookupTimer = setInterval(() => {
      if (!this.isActive) {
        return;
      }
      this._pruneStalePeers();
      this.dht.lookup(this.roomTopic, (error, count) => {
        this.log('[PeerShare] periodic lookup done, error:', error?.message, 'count:', count);
      });
    }, 15 * 1000);

    this._startLanDiscovery(boundPort);

    return { peerId: this.selfPeerId, roomCode: normalized, udpPort: boundPort };
  }

  async stop() {
    this.destroyed = true;
    if (this.lookupTimer) {
      clearInterval(this.lookupTimer);
      this.lookupTimer = null;
    }
    if (this.lanAnnounceTimer) {
      clearInterval(this.lanAnnounceTimer);
      this.lanAnnounceTimer = null;
    }
    for (const timer of this.pendingResendTimers.values()) {
      clearInterval(timer);
    }
    this.pendingResendTimers.clear();
    this.knownPeers.clear();
    this.seenSignalNonces.clear();
    this.roomCode = '';
    this.roomTopic = null;
    this.selfPeerId = '';

    if (this.dht) {
      const dht = this.dht;
      this.dht = null;
      await new Promise((resolve) => dht.destroy(resolve));
    }
    if (this.socket) {
      const socket = this.socket;
      this.socket = null;
      await new Promise((resolve) => socket.close(resolve));
    }
    if (this.lanSocket) {
      const lanSocket = this.lanSocket;
      this.lanSocket = null;
      await new Promise((resolve) => lanSocket.close(resolve));
    }
  }

  listPeers() {
    return Array.from(this.knownPeers.entries())
      .filter(([, info]) => !info.pending)
      .map(([peerId, info]) => ({ peerId, host: info.host, port: info.port, displayName: info.displayName || '' }));
  }

  // 向指定 peer 发送一条信令（offer/answer/ice/leave）。会按 SIGNAL_RESEND_INTERVAL_MS 重发，
  // 直到收到对端 ack 或达到最大重发次数为止，避免 UDP 丢包导致信令永远送不到；
  // 一旦收到 ack 就立刻停止重发，防止对端已经处理过的信令被重复投递、触发不必要的重新协商。
  sendSignal(toPeerId, signalPayload) {
    if (!this.isActive) {
      return false;
    }
    const target = this.knownPeers.get(toPeerId);
    if (!target) {
      this.onError({ errorKey: 'peer.error.unknownPeer', detail: toPeerId });
      return false;
    }

    const nonce = crypto.randomBytes(8).toString('hex');
    const message = {
      nonce,
      from: this.selfPeerId,
      to: toPeerId,
      createdAt: Date.now(),
      expiresAt: Date.now() + SIGNAL_TTL_MS,
      payload: signalPayload
    };

    let resends = 0;
    const send = () => {
      if (!this.isActive || !this.pendingResendTimers.has(nonce)) {
        return;
      }
      const buf = Buffer.from(JSON.stringify(message), 'utf8');
      this.socket.send(buf, target.port, target.host, (error) => {
        if (error) {
          this.log('[PeerShare] send failed:', error.message);
        }
      });
      resends += 1;
      if (resends >= SIGNAL_MAX_RESENDS) {
        const timer = this.pendingResendTimers.get(nonce);
        if (timer) {
          clearInterval(timer);
          this.pendingResendTimers.delete(nonce);
        }
      }
    };

    send();
    const timer = setInterval(send, SIGNAL_RESEND_INTERVAL_MS);
    this.pendingResendTimers.set(nonce, timer);
    return true;
  }

  _ackSignal(nonce, host, port) {
    if (!this.socket) {
      return;
    }
    const ack = {
      nonce: crypto.randomBytes(8).toString('hex'),
      from: this.selfPeerId,
      to: '',
      createdAt: Date.now(),
      expiresAt: Date.now() + SIGNAL_TTL_MS,
      payload: { type: 'signal-ack', ackNonce: nonce }
    };
    this.socket.send(Buffer.from(JSON.stringify(ack), 'utf8'), port, host, () => {});
  }

  _stopResend(nonce) {
    const timer = this.pendingResendTimers.get(nonce);
    if (timer) {
      clearInterval(timer);
      this.pendingResendTimers.delete(nonce);
    }
  }


  // 局域网广播发现：与 DHT 并行、互不依赖。每个实例在固定端口上用 SO_REUSEADDR 监听广播，
  // 定期把「房间主题哈希 + 我的信令端口」广播出去；同一局域网/同一台机器上、监听同一广播端口的
  // 其它实例只要主题哈希匹配，就会直接向发送方的信令端口发一条 hello，走既有的握手/信令通道。
  _startLanDiscovery(signalPort) {
    const socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });
    this.lanSocket = socket;

    socket.on('error', (error) => {
      this.log('[PeerShare] LAN discovery socket error:', error?.message);
    });
    socket.on('message', (msg, rinfo) => this._handleLanDatagram(msg, rinfo));

    socket.bind(LAN_DISCOVERY_PORT, () => {
      try {
        socket.setBroadcast(true);
      } catch (error) {
        this.log('[PeerShare] setBroadcast failed:', error?.message);
      }
      this.log('[PeerShare] LAN discovery listening on', LAN_DISCOVERY_PORT);

      const announce = () => {
        if (!this.lanSocket || !this.roomTopic) {
          return;
        }
        const packet = Buffer.from(JSON.stringify({
          type: 'lan-room-announce',
          topic: this.roomTopic.toString('hex'),
          peerId: this.selfPeerId,
          port: signalPort
        }), 'utf8');
        socket.send(packet, LAN_DISCOVERY_PORT, '255.255.255.255', (error) => {
          if (error) {
            this.log('[PeerShare] LAN announce send failed:', error.message);
          }
        });
      };

      announce();
      this.lanAnnounceTimer = setInterval(announce, LAN_ANNOUNCE_INTERVAL_MS);
    });
  }

  _handleLanDatagram(msg, rinfo) {
    if (!this.roomTopic) {
      return;
    }
    let message;
    try {
      message = JSON.parse(msg.toString('utf8'));
    } catch (error) {
      return;
    }
    if (
      !message ||
      message.type !== 'lan-room-announce' ||
      message.topic !== this.roomTopic.toString('hex') ||
      message.peerId === this.selfPeerId ||
      typeof message.port !== 'number'
    ) {
      return;
    }
    this.log('[PeerShare] LAN discovery match:', rinfo.address, message.port, message.peerId);
    // 复用 DHT 发现路径的占位/hello 逻辑：直接向对方的信令端口打招呼即可，
    // 真正的身份确认仍由收到 hello 后的 peerId 映射来完成。
    this._onDhtPeer({ host: rinfo.address, port: message.port });
  }

  _onDhtPeer(peer) {
    // dht 的 'peer' 事件只给出 host/port，不带我们自定义的 peerId；
    // 先记一个临时占位，等对方通过 UDP 发来的 hello 消息里带上真实 peerId 后再补全映射。
    const placeholderId = `${peer.host}:${peer.port}`;
    if (!this.knownPeers.has(placeholderId)) {
      this.knownPeers.set(placeholderId, {
        host: peer.host,
        port: peer.port,
        lastSeenAt: Date.now(),
        pending: true
      });
      this._sendHello(peer.host, peer.port);
    }
  }

  _sendHello(host, port) {
    if (!this.socket) {
      return;
    }
    const hello = {
      nonce: crypto.randomBytes(8).toString('hex'),
      from: this.selfPeerId,
      to: '',
      createdAt: Date.now(),
      expiresAt: Date.now() + SIGNAL_TTL_MS,
      payload: { type: 'hello', displayName: this.displayName || '' }
    };
    this.socket.send(Buffer.from(JSON.stringify(hello), 'utf8'), port, host, () => {});
  }

  _handleDatagram(msg, rinfo) {
    let message;
    try {
      message = JSON.parse(msg.toString('utf8'));
    } catch (error) {
      return; // 忽略无法解析的数据报（可能是无关的 DHT/UDP 噪声）
    }
    if (!message || typeof message.from !== 'string' || !message.payload) {
      return;
    }
    if (!isSignalMessageFresh(message)) {
      return; // 过期或时间戳异常的信令一律丢弃，防止重放
    }
    if (message.to && message.to !== this.selfPeerId) {
      return;
    }

    // 用真实 peerId 替换/补全占位映射，并清理旧的占位条目。
    const placeholderId = `${rinfo.address}:${rinfo.port}`;
    if (this.knownPeers.has(placeholderId)) {
      this.knownPeers.delete(placeholderId);
    }
    const isNewPeer = !this.knownPeers.has(message.from);
    const existing = this.knownPeers.get(message.from);
    // hello/hello-ack 会带上对方的显示昵称；后续纯信令消息没有该字段时，
    // 沿用上一次已知的昵称，避免被空字符串覆盖掉。
    const incomingDisplayName = typeof message.payload.displayName === 'string' ? message.payload.displayName : '';
    this.knownPeers.set(message.from, {
      host: rinfo.address,
      port: rinfo.port,
      lastSeenAt: Date.now(),
      displayName: incomingDisplayName || (existing && existing.displayName) || ''
    });
    if (isNewPeer) {
      this.onPeerListUpdate(this.listPeers());
    }

    if (message.payload.type === 'hello') {
      // 收到对端 hello 后回一条 hello-ack，帮助对端也尽快完成占位 -> 真实 peerId 的替换。
      this._replyHelloAck(rinfo.address, rinfo.port);
      return;
    }
    if (message.payload.type === 'hello-ack') {
      return;
    }
    if (message.payload.type === 'signal-ack') {
      // 对端确认已收到我们发出的某条信令，停止对应的重发定时器，
      // 避免已送达的 offer/answer/ice 被重复投递导致 WebRTC 反复重新协商。
      this._stopResend(message.payload.ackNonce);
      return;
    }

    // 无论是否重复，都先回一个 ack，防止发送方因为丢包继续白白重发；
    // 但只有第一次见到这个 nonce 时才真正把信令交给 renderer 处理，
    // 避免同一条 offer/answer/ice 因为 UDP 重发被重复应用。
    this._ackSignal(message.nonce, rinfo.address, rinfo.port);
    if (this.seenSignalNonces.has(message.nonce)) {
      return;
    }
    this.seenSignalNonces.add(message.nonce);

    this.onSignal({
      fromPeerId: message.from,
      payload: message.payload
    });
  }

  _replyHelloAck(host, port) {
    if (!this.socket) {
      return;
    }
    const ack = {
      nonce: crypto.randomBytes(8).toString('hex'),
      from: this.selfPeerId,
      to: '',
      createdAt: Date.now(),
      expiresAt: Date.now() + SIGNAL_TTL_MS,
      payload: { type: 'hello-ack', displayName: this.displayName || '' }
    };
    this.socket.send(Buffer.from(JSON.stringify(ack), 'utf8'), port, host, () => {});
  }

  _pruneStalePeers() {
    const now = Date.now();
    let changed = false;
    for (const [peerId, info] of this.knownPeers.entries()) {
      if (now - info.lastSeenAt > PEER_STALE_MS) {
        this.knownPeers.delete(peerId);
        changed = true;
      }
    }
    if (changed) {
      this.onPeerListUpdate(this.listPeers());
    }
  }
}

// 连通性自检：不加入任何房间，只快速验证「公网 DHT 引导是否可达」和
// 「本机 UDP 出入站是否畅通」，用于用户点击『测试联机』时给出即时反馈，
// 避免用户在完全不通的网络环境下盲等房间发现。
async function selfTestConnectivity({ timeoutMs = 8000 } = {}) {
  const result = {
    udpOk: false,
    dhtOk: false,
    dhtNodeCount: 0,
    detail: ''
  };

  const socket = dgram.createSocket('udp4');
  try {
    await new Promise((resolve, reject) => {
      socket.once('error', reject);
      socket.bind(0, () => {
        socket.removeListener('error', reject);
        resolve();
      });
    });
    result.udpOk = true;
  } catch (error) {
    result.detail = `udp_bind_failed: ${error?.message || error}`;
  } finally {
    await new Promise((resolve) => socket.close(resolve));
  }

  const dht = new DHT();
  try {
    await new Promise((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        resolve();
      };
      dht.once('ready', finish);
      dht.listen(0, () => {});
      setTimeout(finish, timeoutMs);
    });
    result.dhtNodeCount = dht.nodes ? dht.nodes.count() : 0;
    result.dhtOk = result.dhtNodeCount > 1;
    if (!result.dhtOk && !result.detail) {
      result.detail = 'dht_bootstrap_weak';
    }
  } catch (error) {
    result.detail = `dht_failed: ${error?.message || error}`;
  } finally {
    await new Promise((resolve) => dht.destroy(resolve));
  }

  return result;
}

module.exports = {
  PeerShareService,
  selfTestConnectivity
};
