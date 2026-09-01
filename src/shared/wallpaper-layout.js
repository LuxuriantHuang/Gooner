'use strict';

const SUPPORTED_POSITIONS = new Set(['center', 'tile', 'stretch', 'fit', 'fill', 'span']);

function normalizeWallpaperPosition(position) {
  const normalized = String(position || '').toLowerCase();
  return SUPPORTED_POSITIONS.has(normalized) ? normalized : 'fill';
}

function calculateWallpaperStyle({
  position,
  imageWidth,
  imageHeight,
  monitorBounds,
  virtualBounds,
  scaleFactor = 1
}) {
  const mode = normalizeWallpaperPosition(position);
  const ratio = Number.isFinite(scaleFactor) && scaleFactor > 0 ? scaleFactor : 1;
  const monitor = monitorBounds || { x: 0, y: 0, width: 0, height: 0 };
  const virtual = virtualBounds || monitor;
  const style = {
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center center',
    backgroundSize: 'cover'
  };

  if (mode === 'fit') {
    style.backgroundSize = 'contain';
  } else if (mode === 'stretch') {
    style.backgroundSize = '100% 100%';
  } else if (mode === 'center' && imageWidth > 0 && imageHeight > 0) {
    style.backgroundSize = `${imageWidth / ratio}px ${imageHeight / ratio}px`;
  } else if (mode === 'tile' && imageWidth > 0 && imageHeight > 0) {
    const offsetX = -positiveModulo(monitor.x - virtual.x, imageWidth) / ratio;
    const offsetY = -positiveModulo(monitor.y - virtual.y, imageHeight) / ratio;
    style.backgroundRepeat = 'repeat';
    style.backgroundPosition = `${offsetX}px ${offsetY}px`;
    style.backgroundSize = `${imageWidth / ratio}px ${imageHeight / ratio}px`;
  } else if (mode === 'span' && imageWidth > 0 && imageHeight > 0) {
    const imageScale = Math.max(virtual.width / imageWidth, virtual.height / imageHeight);
    const renderedWidth = imageWidth * imageScale;
    const renderedHeight = imageHeight * imageScale;
    const imageLeft = virtual.x + (virtual.width - renderedWidth) / 2;
    const imageTop = virtual.y + (virtual.height - renderedHeight) / 2;
    style.backgroundPosition = `${(imageLeft - monitor.x) / ratio}px ${(imageTop - monitor.y) / ratio}px`;
    style.backgroundSize = `${renderedWidth / ratio}px ${renderedHeight / ratio}px`;
  }

  return style;
}

function positiveModulo(value, divisor) {
  return ((value % divisor) + divisor) % divisor;
}

module.exports = {
  calculateWallpaperStyle,
  normalizeWallpaperPosition
};
