import fs from 'fs';
import path from 'path';

import { findUpSync } from 'find-up';

/**
 * Workspace configuration object.
 *
 * @typedef {Object} WorkspaceConfig
 * @property {string} namespace - Package namespace (e.g., '@codygo' or '@bizsist')
 * @property {string} rootPath - Absolute path to monorepo root
 * @property {string[]} scopes - Valid scope directories
 * @property {string[]} types - Valid type directories
 * @property {string} protocol - Workspace protocol
 */

/** @type {WorkspaceConfig | undefined} */
let cachedConfig = undefined;

/**
 * Get workspace configuration from root package.json.
 * Auto-detects namespace and merges with optional monoConfig.
 *
 * @param {import('eslint').Rule.RuleContext} context - ESLint context
 * @returns {WorkspaceConfig} Workspace configuration
 */
export function getWorkspaceConfig(context) {
  if (cachedConfig) return cachedConfig;

  const rootPkgPath = findUpSync('package.json', {
    cwd: context.cwd || process.cwd(),
  });

  if (!rootPkgPath) {
    return getDefaults();
  }

  const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, 'utf-8'));
  const namespace = rootPkg.name?.split('/')[0] || '@codygo';

  const config = {
    namespace,
    rootPath: path.dirname(rootPkgPath),
    scopes: ['common', 'client', 'server', 'devops'],
    types: ['apps', 'libs'],
    protocol: 'workspace:^',
    ...rootPkg.monoConfig,
  };

  cachedConfig = config;
  return config;
}

/**
 * Get default workspace configuration.
 *
 * @returns {WorkspaceConfig} Default configuration
 */
function getDefaults() {
  return {
    namespace: '@codygo',
    rootPath: process.cwd(),
    scopes: ['common', 'client', 'server', 'devops'],
    types: ['apps', 'libs'],
    protocol: 'workspace:^',
  };
}

/**
 * Clear cached configuration (for testing).
 *
 * @returns {void}
 */
export function clearCache() {
  cachedConfig = undefined;
}
