import { strictEqual, ok } from 'node:assert';
import { test } from 'node:test';

import plugin from '../src/index.mjs';

test('plugin exports rules correctly', () => {
  ok(plugin, 'Plugin should be defined');
  ok(plugin.rules, 'Plugin should have rules property');
  strictEqual(typeof plugin.rules, 'object', 'Rules should be an object');

  // Check that key rules exist
  ok(plugin.rules['package-naming'], 'Should export package-naming rule');
  ok(plugin.rules['package-hierarchy'], 'Should export package-hierarchy rule');
  ok(plugin.rules['package-structure'], 'Should export package-structure rule');
  ok(plugin.rules['app-error-required-props'], 'Should export app-error-required-props rule');

  // Should have at least these rules
  ok(Object.keys(plugin.rules).length >= 4, 'Should export at least 4 rules');
});

test('plugin rules are functions', () => {
  for (const [ruleName, ruleModule] of Object.entries(plugin.rules)) {
    strictEqual(
      typeof ruleModule.create,
      'function',
      `${ruleName} rule should have create function`
    );
  }
});
