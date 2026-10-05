'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { toMediaUrl, isVideoMedia } = require('../src/shared/visual-media-url');

test('keeps remote and existing file URLs intact', () => {
  assert.equal(toMediaUrl('https://cdn.example.test/photo.jpg?token=abc'), 'https://cdn.example.test/photo.jpg?token=abc');
  assert.equal(toMediaUrl('file:///C:/media/photo.jpg'), 'file:///C:/media/photo.jpg');
});

test('converts a raw local path to a file URL', () => {
  assert.equal(toMediaUrl('C:\\media\\photo one.jpg'), 'file:///C:/media/photo%20one.jpg');
});

test('detects video type from URL paths even when query parameters are present', () => {
  assert.equal(isVideoMedia('https://cdn.example.test/clip.webm?token=abc'), true);
  assert.equal(isVideoMedia('file:///C:/media/clip.mp4'), true);
  assert.equal(isVideoMedia('https://cdn.example.test/photo.jpg?token=abc'), false);
});
