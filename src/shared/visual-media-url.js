'use strict';

const { pathToFileURL } = require('node:url');

function toMediaUrl(media) {
  if (typeof media !== 'string' || media.length === 0) return '';
  if (/^(https?:|file:|data:|blob:)/i.test(media)) return media;
  return pathToFileURL(media).href;
}

function isVideoMedia(media) {
  if (typeof media !== 'string' || media.length === 0) return false;
  try {
    const pathname = new URL(media, 'file:///').pathname;
    return /\.(mp4|webm|ogg|mov|mkv)$/i.test(decodeURIComponent(pathname));
  } catch (_error) {
    return /\.(mp4|webm|ogg|mov|mkv)$/i.test(media.split(/[?#]/, 1)[0]);
  }
}

module.exports = { toMediaUrl, isVideoMedia };
