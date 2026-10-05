(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.GoonerShortcutRecorder = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const MODIFIERS = new Set(['Control', 'Alt', 'Shift', 'Meta']);

  function formatKeyEvent(event) {
    if (MODIFIERS.has(event.key)) return null;
    const parts = [];
    if (event.ctrlKey) parts.push('Ctrl');
    if (event.altKey) parts.push('Alt');
    if (event.shiftKey) parts.push('Shift');
    if (event.metaKey) parts.push('Super');
    const key = event.key;
    if (key === ' ') parts.push('Space');
    else if (key === 'ArrowUp') parts.push('Up');
    else if (key === 'ArrowDown') parts.push('Down');
    else if (key === 'ArrowLeft') parts.push('Left');
    else if (key === 'ArrowRight') parts.push('Right');
    else if (key.length === 1) parts.push(key.toUpperCase());
    else if (key.length > 1 && key[0] === 'F') parts.push(key.toUpperCase());
    else parts.push(key);
    return parts.join('+');
  }

  return { formatKeyEvent };
}));
