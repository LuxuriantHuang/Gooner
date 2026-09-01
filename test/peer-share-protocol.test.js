'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  PROTOCOL_VERSION,
  CHUNK_SIZE,
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
} = require('../src/main/peer-share-protocol');

test('normalizeRoomCode accepts valid printable ASCII and rejects invalid input', () => {
  assert.equal(normalizeRoomCode('  abc-123  '), 'abc-123');
  assert.equal(normalizeRoomCode(''), '');
  assert.equal(normalizeRoomCode('   '), '');
  assert.equal(normalizeRoomCode(null), '');
  assert.equal(normalizeRoomCode('a'.repeat(65)), '');
  assert.equal(normalizeRoomCode('room\tcode'), '');
  assert.equal(normalizeRoomCode('房间码'), '');
});

test('deriveRoomTopic is deterministic for the same room code and differs across codes', () => {
  const topicA1 = deriveRoomTopic('room-a');
  const topicA2 = deriveRoomTopic('room-a');
  const topicB = deriveRoomTopic('room-b');

  assert.equal(topicA1.equals(topicA2), true);
  assert.equal(topicA1.equals(topicB), false);
  assert.throws(() => deriveRoomTopic(''), /invalid_room_code/);
});

test('generateRoomCode and generatePeerId/generateTransferId produce usable unique-ish values', () => {
  const roomCode = generateRoomCode();
  assert.equal(normalizeRoomCode(roomCode), roomCode);

  const peerId1 = generatePeerId();
  const peerId2 = generatePeerId();
  assert.notEqual(peerId1, peerId2);
  assert.match(peerId1, /^[0-9a-f]+$/);

  const transferId = generateTransferId();
  assert.match(transferId, /^[0-9a-f]{16}$/);
});

test('sanitizeFileName strips unsafe characters and enforces length cap', () => {
  assert.equal(sanitizeFileName('normal.jpg'), 'normal.jpg');
  assert.equal(sanitizeFileName('a/b\\c:d*e?f"g<h>i|j.png'), 'a_b_c_d_e_f_g_h_i_j.png');
  assert.equal(sanitizeFileName(''), 'file');
  assert.equal(sanitizeFileName(null), 'file');
  assert.equal(sanitizeFileName('a'.repeat(500)).length, 200);
});

test('getExtension/isAllowedMediaFile/getMediaKindFromExtension classify files correctly', () => {
  assert.equal(getExtension('photo.JPG'), '.jpg');
  assert.equal(getExtension('no-extension'), '');
  assert.equal(isAllowedMediaFile('clip.mp4'), true);
  assert.equal(isAllowedMediaFile('archive.zip'), false);
  assert.equal(getMediaKindFromExtension('a.png'), 'image');
  assert.equal(getMediaKindFromExtension('a.mkv'), 'video');
  assert.equal(getMediaKindFromExtension('a.zip'), null);
});

test('buildFileOffer/validateFileOffer round-trip for valid offers', () => {
  const offer = buildFileOffer({
    transferId: generateTransferId(),
    fileName: 'vacation.png',
    size: 1024,
    mimeType: 'image/png',
    sha256: 'a'.repeat(64)
  });

  assert.equal(offer.v, PROTOCOL_VERSION);
  assert.equal(offer.kind, 'image');
  assert.equal(validateFileOffer(offer).ok, true);
});

test('validateFileOffer rejects malformed, unsupported, oversized and version-mismatched offers', () => {
  const baseOffer = buildFileOffer({
    transferId: generateTransferId(),
    fileName: 'clip.mp4',
    size: 5000
  });

  assert.equal(validateFileOffer({ ...baseOffer, v: 999 }).ok, false);
  assert.equal(validateFileOffer({ ...baseOffer, transferId: '' }).ok, false);
  assert.equal(validateFileOffer({ ...baseOffer, fileName: 'evil.exe' }).ok, false);
  assert.equal(validateFileOffer({ ...baseOffer, size: -1 }).ok, false);
  assert.equal(validateFileOffer({ ...baseOffer, size: Infinity }).ok, false);

  const tooLarge = validateFileOffer(baseOffer, { maxFileSizeBytes: 100 });
  assert.equal(tooLarge.ok, false);
  assert.equal(tooLarge.errorKey, 'peer.error.fileTooLarge');

  const withinLimit = validateFileOffer(baseOffer, { maxFileSizeBytes: 100000 });
  assert.equal(withinLimit.ok, true);
});

test('getChunkCount computes the expected number of chunks', () => {
  assert.equal(getChunkCount(0), 1);
  assert.equal(getChunkCount(1), 1);
  assert.equal(getChunkCount(CHUNK_SIZE), 1);
  assert.equal(getChunkCount(CHUNK_SIZE + 1), 2);
  assert.equal(getChunkCount(CHUNK_SIZE * 3), 3);
});

test('isSignalMessageFresh distinguishes expired and live signals', () => {
  const now = Date.now();
  assert.equal(isSignalMessageFresh({ expiresAt: now + 1000 }, now), true);
  assert.equal(isSignalMessageFresh({ expiresAt: now - 1000 }, now), false);
  assert.equal(isSignalMessageFresh({}, now), false);
  assert.equal(isSignalMessageFresh(null, now), false);
});

test('encodeControlFrame/decodeFrame round-trip JSON control payloads', () => {
  const payload = { type: 'file-offer', transferId: 'abc123' };
  const frame = encodeControlFrame(payload);
  const decoded = decodeFrame(frame);

  assert.equal(decoded.type, 'control');
  assert.deepEqual(decoded.payload, payload);
});

test('encodeChunkFrame/decodeFrame round-trip binary chunk payloads', () => {
  const transferId = generateTransferId();
  const chunkPayload = Buffer.from('hello world', 'utf8');
  const frame = encodeChunkFrame(transferId, 7, chunkPayload);
  const decoded = decodeFrame(frame);

  assert.equal(decoded.type, 'chunk');
  assert.equal(decoded.transferId, transferId);
  assert.equal(decoded.chunkIndex, 7);
  assert.equal(decoded.payload.equals(chunkPayload), true);
});

test('decodeFrame returns null for malformed or unknown frames', () => {
  assert.equal(decodeFrame(null), null);
  assert.equal(decodeFrame(Buffer.alloc(0)), null);
  assert.equal(decodeFrame(Buffer.from([0xff, 1, 2, 3])), null);
  assert.equal(decodeFrame(Buffer.from([0x02, 1, 2])), null); // too short for chunk frame
  assert.equal(decodeFrame(Buffer.concat([Buffer.from([0x01]), Buffer.from('not json')])), null);
});
