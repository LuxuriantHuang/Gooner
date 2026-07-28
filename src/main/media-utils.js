const { promisify } = require('util');
const { imageSize } = require('image-size');
const sizeOfAsync = promisify(imageSize);

/**
 * Finds a media file from the array that best fits the target monitor's aspect ratio.
 * This is used to prevent aggressive cropping on fullscreen images.
 */
async function findBestMediaForDisplay(mediaFiles, monitor, config = {}) {
  if (!mediaFiles || mediaFiles.length === 0) return null;

  const images = mediaFiles.filter(f => f.match(/\.(jpg|jpeg|png|webp|bmp)$/i));
  if (images.length === 0) return mediaFiles[Math.floor(Math.random() * mediaFiles.length)];

  const maxRatioDeviation = config.maxRatioDeviation ?? 0.3;
  const minResolution = config.minResolution ?? 0;

  let bestImage = null;

  // Try 50 random candidates to find one that fits the aspect ratio
  for (let i = 0; i < 50; i++) {
    const candidate = images[Math.floor(Math.random() * images.length)];
    try {
      const dimensions = await sizeOfAsync(candidate);
      if (!dimensions || !dimensions.width || !dimensions.height) continue;
      
      const ratio = dimensions.width / dimensions.height;
      const targetRatio = monitor.width / monitor.height;
      
      if (isNaN(targetRatio)) continue;

      const ratioDeviation = Math.abs(ratio - targetRatio) / targetRatio;
      if (ratioDeviation > maxRatioDeviation) continue;

      const shortEdge = Math.min(dimensions.width, dimensions.height);
      const minRes = minResolution || 0;
      
      if (minRes > 0 && shortEdge < minRes) continue;

      bestImage = candidate;
      break;
    } catch (e) {
      // Unreadable image, skip
      continue;
    }
  }
  
  // Fallback if no strict match found
  if (!bestImage) {
    bestImage = images[Math.floor(Math.random() * images.length)];
  }

  return bestImage;
}

module.exports = {
  findBestMediaForDisplay
};
