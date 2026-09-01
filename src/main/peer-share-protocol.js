// 联机分享的应用层协议：房间主题派生、信令消息校验、文件元数据、分片大小与限制。
// 这里只定义纯数据结构和校验逻辑，不直接依赖 Electron / 网络实现，方便单测。

const crypto = require('crypto');

const PROTOCOL_VERSION = 1;
const CHUNK_SIZE = 64 * 1024; // 64KB，DataChannel friendly
const SIGNAL_TTL_MS = 30 * 1000; // 信令消息在 DHT 上的存活时间上限
const ROOM_TOPIC_SALT = 'gooner-peer-share-v1';
const MAX_ROOM_CODE_LENGTH = 64;
// 公共大厅房间码：所有开启联机共享的用户默认都会加入这里，方便直接互相发现和交流；
// 想小范围交流时，用户可以生成/输入自己的房间码创建独立小房间，不会与大厅互通。
const PUBLIC_ROOM_CODE = 'gooner-public-lobby';
const ALLOWED_MEDIA_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp',
  '.mp4', '.webm', '.ogg', '.mov', '.mkv'
]);

function deriveRoomTopic(roomCode) {
  const normalized = normalizeRoomCode(roomCode);
  if (!normalized) {
    throw new Error('invalid_room_code');
  }
  // 房间码本身不会被广播；DHT 上只存主题哈希，避免枚举房间码反推内容。
  return crypto.createHash('sha1').update(`${ROOM_TOPIC_SALT}:${normalized}`).digest();
}

function normalizeRoomCode(roomCode) {
  if (typeof roomCode !== 'string') {
    return '';
  }
  const trimmed = roomCode.trim();
  if (!trimmed || trimmed.length > MAX_ROOM_CODE_LENGTH) {
    return '';
  }
  // 只允许可见 ASCII，避免奇怪的控制字符进入房间码/主题派生。
  if (!/^[\x21-\x7e]+$/.test(trimmed)) {
    return '';
  }
  return trimmed;
}

function generateRoomCode() {
  return crypto.randomBytes(9).toString('base64url');
}

function generatePeerId() {
  return crypto.randomBytes(12).toString('hex');
}

function generateTransferId() {
  return crypto.randomBytes(8).toString('hex');
}

function sanitizeFileName(name) {
  if (typeof name !== 'string') {
    return 'file';
  }
  const base = name.replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').trim();
  return base.slice(0, 200) || 'file';
}

function getExtension(name) {
  const match = /\.[^.]+$/.exec(typeof name === 'string' ? name : '');
  return match ? match[0].toLowerCase() : '';
}

function isAllowedMediaFile(name) {
  return ALLOWED_MEDIA_EXTENSIONS.has(getExtension(name));
}

function getMediaKindFromExtension(name) {
  const ext = getExtension(name);
  if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'].includes(ext)) return 'image';
  if (['.mp4', '.webm', '.ogg', '.mov', '.mkv'].includes(ext)) return 'video';
  return null;
}

function buildFileOffer({ transferId, fileName, size, mimeType, sha256 }) {
  return {
    v: PROTOCOL_VERSION,
    type: 'file-offer',
    transferId,
    fileName: sanitizeFileName(fileName),
    size: Number(size) || 0,
    mimeType: typeof mimeType === 'string' ? mimeType.slice(0, 100) : '',
    sha256: typeof sha256 === 'string' ? sha256 : '',
    kind: getMediaKindFromExtension(fileName)
  };
}

function validateFileOffer(offer, { maxFileSizeBytes } = {}) {
  if (!offer || offer.type !== 'file-offer' || offer.v !== PROTOCOL_VERSION) {
    return { ok: false, errorKey: 'peer.error.protocolMismatch' };
  }
  if (!offer.transferId || typeof offer.transferId !== 'string') {
    return { ok: false, errorKey: 'peer.error.malformedOffer' };
  }
  if (!isAllowedMediaFile(offer.fileName)) {
    return { ok: false, errorKey: 'peer.error.unsupportedType' };
  }
  if (!Number.isFinite(offer.size) || offer.size <= 0) {
    return { ok: false, errorKey: 'peer.error.malformedOffer' };
  }
  if (maxFileSizeBytes && offer.size > maxFileSizeBytes) {
    return { ok: false, errorKey: 'peer.error.fileTooLarge' };
  }
  return { ok: true };
}

function getChunkCount(size) {
  return Math.max(1, Math.ceil(size / CHUNK_SIZE));
}

function isSignalMessageFresh(message, nowMs = Date.now()) {
  return typeof message?.expiresAt === 'number' && message.expiresAt > nowMs;
}

const CONTROL_FRAME = 0x01;
const CHUNK_FRAME = 0x02;

function encodeControlFrame(payload) {
  const json = Buffer.from(JSON.stringify(payload), 'utf8');
  return Buffer.concat([Buffer.from([CONTROL_FRAME]), json]);
}

function encodeChunkFrame(transferIdHex, chunkIndex, payload) {
  const idBuf = Buffer.from(transferIdHex, 'hex');
  const indexBuf = Buffer.alloc(4);
  indexBuf.writeUInt32BE(chunkIndex, 0);
  return Buffer.concat([Buffer.from([CHUNK_FRAME]), idBuf, indexBuf, payload]);
}

function decodeFrame(buffer) {
  if (!buffer || buffer.length < 1) {
    return null;
  }
  const type = buffer[0];
  if (type === CONTROL_FRAME) {
    try {
      return { type: 'control', payload: JSON.parse(buffer.slice(1).toString('utf8')) };
    } catch (_error) {
      return null;
    }
  }
  if (type === CHUNK_FRAME) {
    if (buffer.length < 13) {
      return null;
    }
    const transferId = buffer.slice(1, 9).toString('hex');
    const chunkIndex = buffer.readUInt32BE(9);
    const payload = buffer.slice(13);
    return { type: 'chunk', transferId, chunkIndex, payload };
  }
  return null;
}

module.exports = {
  PROTOCOL_VERSION,
  CHUNK_SIZE,
  SIGNAL_TTL_MS,
  MAX_ROOM_CODE_LENGTH,
  PUBLIC_ROOM_CODE,
  ALLOWED_MEDIA_EXTENSIONS,
  deriveRoomTopic,
  normalizeRoomCode,
  generateRoomCode,
  generatePeerId,
  generateTransferId,
  sanitizeFileName,
  getExtension,
  isAllowedMediaFile,
  getMediaKindFromExtension,
  buildFileOffer,
  validateFileOffer,
  getChunkCount,
  isSignalMessageFresh,
  encodeControlFrame,
  encodeChunkFrame,
  decodeFrame
};
