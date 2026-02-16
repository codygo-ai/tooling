/**
 * Package path information.
 *
 * @typedef {Object} PackagePathInfo
 * @property {string} scope - Scope directory (common|client|server|devops)
 * @property {string} type - Type directory (apps|libs)
 * @property {string} packageName - Package directory name
 * @property {string | undefined} group - Optional package group
 * @property {boolean} isValid - True if path matches pattern
 */

/**
 * Parse package.json filepath and extract all path information.
 * Pattern: {scope}/{type}/[{group}/]{packageName}/package.json
 *
 * @param {string} filepath - Path to package.json (absolute or relative)
 * @returns {PackagePathInfo} Parsed path information
 *
 * @example
 * parsePackagePath('server/apps/api/package.json')
 * // { scope: 'server', type: 'apps', packageName: 'api', group: null, isValid: true }
 *
 * parsePackagePath('server/libs/aws/s3/package.json')
 * // { scope: 'server', type: 'libs', packageName: 's3', group: 'aws', isValid: true }
 */
export function parsePackagePath(filepath) {
  // Handle absolute paths by finding workspace root
  let relativePath = filepath;
  if (filepath.startsWith('/')) {
    // Find workspace root by looking for package.json in parent directories
    const parts = filepath.split('/').filter((p) => p !== 'package.json');
    // Look for the pattern: .../worknet-mono/{scope}/{type}/...
    const monoIndex = parts.indexOf('worknet-mono');
    if (monoIndex !== -1 && monoIndex < parts.length - 3) {
      // Extract path relative to worknet-mono
      relativePath = parts.slice(monoIndex + 1).join('/') + '/package.json';
    }
  }

  const parts = relativePath.split('/').filter((p) => p !== 'package.json');

  if (parts.length < 3) {
    return {
      scope: parts[0] || '',
      type: parts[1] || '',
      packageName: parts[2] || '',
      group: undefined,
      isValid: false,
    };
  }

  const [scope, type, ...rest] = parts;
  const packageName = rest[rest.length - 1];
  const group = rest.length > 1 ? rest[0] : undefined;

  return {
    scope,
    type,
    packageName,
    group,
    isValid: true,
  };
}

/**
 * Check if string is kebab-case.
 *
 * @param {string} str - String to validate
 * @returns {boolean} True if kebab-case
 *
 * @example
 * isKebabCase('my-package')   // true
 * isKebabCase('MyPackage')    // false
 */
export function isKebabCase(str) {
  return /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(str);
}

/**
 * Get first-level directory under src/ from filepath.
 *
 * @param {string} filepath - File path
 * @returns {string | undefined} First directory under src/
 *
 * @example
 * getFirstLevelDir('src/auth/login.ts')  // 'auth'
 * getFirstLevelDir('src/auth/utils/validate.ts')  // 'auth'
 */
export function getFirstLevelDir(filepath) {
  const parts = filepath.split('/');
  const srcIndex = parts.indexOf('src');

  if (srcIndex === -1 || srcIndex === parts.length - 1) {
    return undefined;
  }

  return parts[srcIndex + 1];
}
