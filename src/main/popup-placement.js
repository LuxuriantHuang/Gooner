'use strict';

function boundsOverlap(a, b, gap = 12) {
  return a.x < b.x + b.width + gap
    && a.x + a.width + gap > b.x
    && a.y < b.y + b.height + gap
    && a.y + a.height + gap > b.y;
}

function findNonOverlappingPopupBounds(area, width, height, occupied, { attempts = 40, random = Math.random } = {}) {
  const overflowX = Math.floor(width * 0.3);
  const overflowY = Math.floor(height * 0.3);
  const minX = area.x - overflowX;
  const minY = area.y - overflowY;
  const maxX = Math.max(minX, area.x + area.width - width + overflowX);
  const maxY = Math.max(minY, area.y + area.height - height + overflowY);
  const taken = occupied || [];
  const fits = (x, y) => {
    const bounds = { x, y, width, height };
    return taken.every(existing => !boundsOverlap(bounds, existing));
  };

  for (let i = 0; i < attempts; i++) {
    const x = Math.round(minX + random() * (maxX - minX));
    const y = Math.round(minY + random() * (maxY - minY));
    if (fits(x, y)) return { x, y, width, height };
  }
  if (taken.length === 0) return { x: minX, y: minY, width, height };

  const makePositions = (min, max) => {
    const stride = Math.max(1, Math.ceil((max - min) / 12));
    const positions = [];
    for (let value = min; value <= max; value += stride) positions.push(value);
    if (positions.at(-1) !== max) positions.push(max);
    return positions;
  };
  for (const y of makePositions(minY, maxY)) {
    for (const x of makePositions(minX, maxX)) {
      if (fits(x, y)) return { x, y, width, height };
    }
  }
  return null;
}

function findPopupPlacementWithEviction(area, width, height, orderedPopups, options) {
  const remaining = [...orderedPopups];
  const evicted = [];
  let bounds = findNonOverlappingPopupBounds(area, width, height, remaining.map(item => item.bounds), options);
  while (!bounds && remaining.length > 0) {
    evicted.push(remaining.shift());
    bounds = findNonOverlappingPopupBounds(area, width, height, remaining.map(item => item.bounds), options);
  }
  return { bounds, evicted };
}

module.exports = { boundsOverlap, findNonOverlappingPopupBounds, findPopupPlacementWithEviction };
