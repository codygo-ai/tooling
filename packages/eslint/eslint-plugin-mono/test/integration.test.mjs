import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import plugin from '../src/index.mjs';

test('plugin exports all required rules', () => {
  assert.ok(plugin.rules, 'Plugin should export rules object');

  const expectedRules = [
    'app-error-required-props',
    'package-structure',
    'package-json-schema',
    'package-naming',
    'package-hierarchy',
    'workspace-protocol',
    'dev-deps-location',
    'peer-deps-pattern',
    'required-files',
    'no-forbidden-imports',
    'enforce-tilde-imports',
    'no-js-extension',
    'prefer-function-declaration',
    'prefer-minimal-checks',
    'prefer-optional-chaining',
    'env-vars-at-top',
    'require-env-example',
    'no-dotenv',
    'index-exports-only',
  ];

  for (const ruleName of expectedRules) {
    assert.ok(plugin.rules[ruleName], `Plugin should export rule: ${ruleName}`);
    assert.ok(plugin.rules[ruleName].meta, `Rule ${ruleName} should have meta`);
    assert.ok(plugin.rules[ruleName].create, `Rule ${ruleName} should have create function`);
  }

  assert.equal(
    Object.keys(plugin.rules).length,
    expectedRules.length,
    `Should have exactly ${expectedRules.length} rules`
  );
});

test('all rules have proper metadata', () => {
  for (const [ruleName, ruleModule] of Object.entries(plugin.rules)) {
    assert.ok(ruleModule.meta.type, `${ruleName} should have type`);
    assert.ok(ruleModule.meta.docs, `${ruleName} should have docs`);
    assert.ok(ruleModule.meta.docs.description, `${ruleName} should have description`);

    if (ruleModule.meta.fixable) {
      assert.equal(ruleModule.meta.fixable, 'code', `${ruleName} fixable should be 'code'`);
    }

    if (ruleModule.meta.messages) {
      assert.ok(
        Object.keys(ruleModule.meta.messages).length > 0,
        `${ruleName} should have at least one message`
      );
    }
  }
});
