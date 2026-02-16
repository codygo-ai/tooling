import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { parsePackagePath, isKebabCase, getFirstLevelDir } from '../../src/utils/pathHelpers.mjs';

test('parsePackagePath extracts all path information', () => {
  const result = parsePackagePath('server/apps/api/package.json');

  assert.equal(result.scope, 'server');
  assert.equal(result.type, 'apps');
  assert.equal(result.packageName, 'api');
  assert.equal(result.group, undefined);
  assert.equal(result.isValid, true);
});

test('parsePackagePath handles grouped packages', () => {
  const result = parsePackagePath('server/libs/aws/s3/package.json');

  assert.equal(result.scope, 'server');
  assert.equal(result.type, 'libs');
  assert.equal(result.packageName, 's3');
  assert.equal(result.group, 'aws');
  assert.equal(result.isValid, true);
});

test('parsePackagePath handles invalid paths', () => {
  const result = parsePackagePath('invalid/package.json');

  assert.equal(result.isValid, false);
});

test('isKebabCase validates correctly', () => {
  assert.equal(isKebabCase('my-package'), true);
  assert.equal(isKebabCase('my-package-v2'), true);
  assert.equal(isKebabCase('api'), true);

  assert.equal(isKebabCase('MyPackage'), false);
  assert.equal(isKebabCase('my_package'), false);
  assert.equal(isKebabCase('my-Package'), false);
  assert.equal(isKebabCase('123-package'), false);
  assert.equal(isKebabCase('-package'), false);
});

test('getFirstLevelDir extracts correct directory', () => {
  assert.equal(getFirstLevelDir('src/auth/login.ts'), 'auth');
  assert.equal(getFirstLevelDir('src/auth/utils/validate.ts'), 'auth');
  assert.equal(getFirstLevelDir('src/users/profile.ts'), 'users');
  assert.equal(getFirstLevelDir('config/app.ts'), undefined);
  assert.equal(getFirstLevelDir('src'), undefined);
});
