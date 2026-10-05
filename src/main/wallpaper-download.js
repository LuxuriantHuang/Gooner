const fs = require('node:fs/promises');
const path = require('node:path');
const { createHash, randomUUID } = require('node:crypto');
const { net, nativeImage } = require('electron');

const MAX_DOWNLOAD_BYTES = 32 * 1024 * 1024;

async function prepareWallpaper(source, cacheDir) {
  if (!/^https?:\/\//i.test(source)) return source;
  const target = path.join(cacheDir, createHash('sha256').update(source).digest('hex') + '.png');
  try {
    const cached = nativeImage.createFromBuffer(await fs.readFile(target));
    if (!cached.isEmpty()) return target;
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  // Electron networking respects the user's system proxy.
  const response = await net.fetch(source, { signal: AbortSignal.timeout(15000) });
  if (!response.ok) {
    await response.body?.cancel();
    throw new Error(`HTTP ${response.status}`);
  }
  if (Number(response.headers.get('content-length')) > MAX_DOWNLOAD_BYTES) {
    await response.body?.cancel();
    throw new Error('Wallpaper exceeds 32 MB');
  }
  if (!response.body) throw new Error('Empty wallpaper response');
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > MAX_DOWNLOAD_BYTES) throw new Error('Wallpaper exceeds 32 MB');
      chunks.push(Buffer.from(value));
    }
  } finally {
    await reader.cancel();
    reader.releaseLock();
  }
  const image = nativeImage.createFromBuffer(Buffer.concat(chunks));
  if (image.isEmpty()) throw new Error('Downloaded wallpaper is not a valid image');
  await fs.mkdir(cacheDir, { recursive: true });
  // Convert URL images to a format supported by Windows wallpaper APIs.
  const temporary = target + `.${randomUUID()}.tmp`;
  try {
    await fs.writeFile(temporary, image.toPNG());
    await fs.rename(temporary, target);
  } finally {
    await fs.rm(temporary, { force: true });
  }
  return target;
}

module.exports = { prepareWallpaper };
