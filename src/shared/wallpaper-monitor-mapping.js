'use strict';

function getVirtualBounds(monitors) {
  const valid = monitors.filter(hasBounds);
  if (valid.length === 0) return null;
  const left = Math.min(...valid.map(monitor => monitor.x));
  const top = Math.min(...valid.map(monitor => monitor.y));
  const right = Math.max(...valid.map(monitor => monitor.x + monitor.width));
  const bottom = Math.max(...valid.map(monitor => monitor.y + monitor.height));
  return { x: left, y: top, width: right - left, height: bottom - top };
}

function mapWallpapersToDisplays(entries, monitors, displays, screenToDipPoint) {
  const monitorById = new Map(monitors.map(monitor => [String(monitor.id), monitor]));
  const virtualBounds = getVirtualBounds(monitors);
  const assignedDisplayIndexes = new Set();
  const assignments = [];

  for (const [monitorId, imagePath] of entries) {
    const monitor = monitorById.get(String(monitorId));
    if (!monitor) continue;
    const displayIndex = findDisplayIndex(
      monitor,
      displays,
      assignedDisplayIndexes,
      screenToDipPoint,
      monitors.indexOf(monitor)
    );
    if (displayIndex < 0) continue;

    const display = displays[displayIndex];
    assignedDisplayIndexes.add(displayIndex);
    assignments.push({
      displayIndex,
      sync: {
        media: imagePath,
        position: monitor.position || 'fill',
        monitorBounds: pickBounds(monitor),
        virtualBounds: virtualBounds || pickBounds(monitor),
        scaleFactor: display.scaleFactor || 1
      }
    });
  }

  return assignments;
}

function findDisplayIndex(monitor, displays, assigned, screenToDipPoint, fallbackIndex) {
  if (hasBounds(monitor) && typeof screenToDipPoint === 'function') {
    const physicalCenter = {
      x: Math.round(monitor.x + monitor.width / 2),
      y: Math.round(monitor.y + monitor.height / 2)
    };
    const dipCenter = screenToDipPoint(physicalCenter);
    const containingIndex = displays.findIndex((display, index) => (
      !assigned.has(index) && containsPoint(display.bounds, dipCenter)
    ));
    if (containingIndex >= 0) return containingIndex;
  }

  const sizeMatchIndex = displays.findIndex((display, index) => {
    if (assigned.has(index)) return false;
    const scaleFactor = display.scaleFactor || 1;
    return Math.abs(display.bounds.width * scaleFactor - monitor.width) <= 2
      && Math.abs(display.bounds.height * scaleFactor - monitor.height) <= 2;
  });
  if (sizeMatchIndex >= 0) return sizeMatchIndex;
  if (fallbackIndex < displays.length && !assigned.has(fallbackIndex)) return fallbackIndex;
  return displays.findIndex((_display, index) => !assigned.has(index));
}

function hasBounds(value) {
  return value
    && Number.isFinite(value.x)
    && Number.isFinite(value.y)
    && Number.isFinite(value.width)
    && Number.isFinite(value.height)
    && value.width > 0
    && value.height > 0;
}

function containsPoint(bounds, point) {
  return point.x >= bounds.x
    && point.x < bounds.x + bounds.width
    && point.y >= bounds.y
    && point.y < bounds.y + bounds.height;
}

function pickBounds(value) {
  return { x: value.x, y: value.y, width: value.width, height: value.height };
}

module.exports = {
  getVirtualBounds,
  mapWallpapersToDisplays
};
