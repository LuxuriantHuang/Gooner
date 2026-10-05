const test = require('node:test');
const assert = require('node:assert/strict');
const { buildAiEndpoint } = require('../src/main/ai-service');
const { normalizeAiConfig } = require('../src/main/config-store');

test('buildAiEndpoint uses the configured OpenAI-compatible base URL', () => {
  assert.equal(
    buildAiEndpoint({ apiBaseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/' }, 'chat/completions'),
    'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions'
  );
});

test('buildAiEndpoint falls back to DeepSeek and accepts an endpoint path', () => {
  assert.equal(buildAiEndpoint({}, 'models'), 'https://api.deepseek.com/models');
  assert.equal(buildAiEndpoint({ apiBaseUrl: 'http://localhost:1234/v1' }, '/models'), 'http://localhost:1234/v1/models');
});

test('normalizeAiConfig preserves a custom API base URL and defaults to DeepSeek', () => {
  assert.equal(normalizeAiConfig({ apiBaseUrl: 'https://example.test/v1/' }).apiBaseUrl, 'https://example.test/v1/');
  assert.equal(normalizeAiConfig({}).apiBaseUrl, 'https://api.deepseek.com');
});
