import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { getWorkspaceConfig, clearCache } from '../../src/utils/getWorkspaceConfig.mjs';

test('getWorkspaceConfig returns config object', () => {
  clearCache();

  const mockContext = {
    getCwd: () => process.cwd(),
  };

  const config = getWorkspaceConfig(mockContext);

  assert.ok(config, 'Should return config');
  assert.ok(config.namespace, 'Should have namespace');
  assert.ok(Array.isArray(config.scopes), 'Should have scopes array');
  assert.ok(Array.isArray(config.types), 'Should have types array');
  assert.ok(config.protocol, 'Should have protocol');
  assert.ok(config.rootPath, 'Should have rootPath');
});

test('getWorkspaceConfig auto-detects namespace', () => {
  clearCache();

  const mockContext = {
    getCwd: () => process.cwd(),
  };

  const config = getWorkspaceConfig(mockContext);

  // Should detect @codygo-ai namespace from nearest package.json (@codygo-ai/eslint-plugin-mono)
  // When run from the plugin directory, it finds this package first
  assert.equal(config.namespace, '@codygo-ai', 'Should detect @codygo-ai namespace from nearest package.json');
});

test('getWorkspaceConfig caches result', () => {
  clearCache();

  const mockContext = {
    getCwd: () => process.cwd(),
  };

  const config1 = getWorkspaceConfig(mockContext);
  const config2 = getWorkspaceConfig(mockContext);

  assert.equal(config1, config2, 'Should return same cached object');
});

test('clearCache clears the cached config', () => {
  const mockContext = {
    getCwd: () => process.cwd(),
  };

  const config1 = getWorkspaceConfig(mockContext);
  clearCache();
  const config2 = getWorkspaceConfig(mockContext);

  // They won't be the same object reference after clearing
  assert.notEqual(config1, config2, 'Should create new object after cache clear');
  assert.deepEqual(config1, config2, 'But should have same values');
});
