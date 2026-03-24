import path from 'path';

import { getFirstLevelDir } from '../utils/pathHelpers.mjs';

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'problem',
    fixable: 'code',
    docs: {
      description: 'Enforce ~/ vs relative imports based on context',
    },
    messages: {
      noTildeInLibs: 'Libraries must not use ~/ imports - use relative paths',
      useTildeForCrossDir: 'Use ~/ for cross-directory imports in applications',
      useRelativeForSameDir: 'Use relative imports within same directory tree',
    },
  },

  create(context) {
    return {
      ImportDeclaration(node) {
        const importPath = node.source.value;
        if (typeof importPath !== 'string') return;

        const currentFile = context.filename;

        // Skip external packages
        if (!importPath.startsWith('.') && !importPath.startsWith('~/')) {
          return;
        }

        const isApp = currentFile.includes('/apps/');
        const isLib = currentFile.includes('/libs/');

        if (!isApp && !isLib) return;

        // Rule: Libraries never use ~/
        if (isLib && importPath.startsWith('~/')) {
          context.report({
            node: node.source,
            messageId: 'noTildeInLibs',
            fix(fixer) {
              const relativePath = convertTildeToRelative(currentFile, importPath);
              return fixer.replaceText(node.source, `'${relativePath}'`);
            },
          });
          return;
        }

        // For apps: Check if same directory tree or cross-directory
        if (isApp) {
          const isDirectlyUnderSrc = isDirectlyUnderSrcDir(currentFile);
          const usesTilde = importPath.startsWith('~/');
          const isRelative = importPath.startsWith('.');

          // Files directly under src/ must use relative imports
          if (isDirectlyUnderSrc) {
            if (usesTilde) {
              context.report({
                node: node.source,
                messageId: 'useRelativeForSameDir',
                fix(fixer) {
                  const relativePath = convertTildeToRelative(currentFile, importPath);
                  return fixer.replaceText(node.source, `'${relativePath}'`);
                },
              });
            }
            return;
          }

          // Files under src/**/* can use ~/ for cross-directory imports
          if (isRelative) {
            const isSameTree = checkSameDirectoryTree(currentFile, importPath);

            if (!isSameTree) {
              context.report({
                node: node.source,
                messageId: 'useTildeForCrossDir',
                fix(fixer) {
                  const tildePath = convertRelativeToTilde(currentFile, importPath);
                  if (tildePath) {
                    return fixer.replaceText(node.source, `'${tildePath}'`);
                  }
                  return undefined;
                },
              });
            }
          }

          if (usesTilde) {
            const isSameTree = checkSameTreeFromTilde(currentFile, importPath);

            if (isSameTree) {
              context.report({
                node: node.source,
                messageId: 'useRelativeForSameDir',
                fix(fixer) {
                  const relativePath = convertTildeToRelative(currentFile, importPath);
                  return fixer.replaceText(node.source, `'${relativePath}'`);
                },
              });
            }
          }
        }
      },
    };
  },
};

/**
 * Check if relative import crosses directory boundaries.
 *
 * @param {string} currentFile - Current file path
 * @param {string} importPath - Relative import path
 * @returns {boolean} True if same directory tree
 */
function checkSameDirectoryTree(currentFile, importPath) {
  const currentDir = getFirstLevelDir(currentFile);
  if (!currentDir) return true;

  // Resolve the import path
  const currentFileDir = path.dirname(currentFile);
  const resolvedPath = path.resolve(currentFileDir, importPath);
  const targetDir = getFirstLevelDir(resolvedPath);

  return currentDir === targetDir;
}

/**
 * Check if file is directly under src/ (not in a subdirectory).
 *
 * @param {string} filepath - File path
 * @returns {boolean} True if directly under src/
 */
function isDirectlyUnderSrcDir(filepath) {
  const parts = filepath.split('/');
  const srcIndex = parts.indexOf('src');

  if (srcIndex === -1 || srcIndex === parts.length - 1) {
    return false;
  }

  // Check if there's only one part after src/ (the filename)
  // e.g., src/main.ts -> true, src/auth/login.ts -> false
  return srcIndex + 2 === parts.length;
}

/**
 * Check if tilde import is in same directory tree.
 *
 * @param {string} currentFile - Current file path
 * @param {string} importPath - Tilde import path
 * @returns {boolean} True if same directory tree
 */
function checkSameTreeFromTilde(currentFile, importPath) {
  const currentDir = getFirstLevelDir(currentFile);
  if (!currentDir) return false;

  // Extract directory from ~/dir/file
  const tildePathParts = importPath.replace(/^~\//, '').split('/');
  const targetDir = tildePathParts[0];

  return currentDir === targetDir;
}

/**
 * Convert tilde import to relative.
 *
 * @param {string} currentFile - Current file path
 * @param {string} tildePath - Tilde import path
 * @returns {string} Relative path
 */
/**
 * Convert relative import to tilde path.
 *
 * @param {string} currentFile - Current file path
 * @param {string} relativePath - Relative import path
 * @returns {string | undefined} Tilde path or undefined if can't convert
 */
function convertRelativeToTilde(currentFile, relativePath) {
  const absFile = path.isAbsolute(currentFile) ? currentFile : path.resolve(currentFile);
  const parts = absFile.split('/');
  const srcIndex = parts.lastIndexOf('src');
  if (srcIndex === -1) return undefined;

  const srcPath = parts.slice(0, srcIndex + 1).join('/');
  const currentDir = path.dirname(absFile);
  const absolutePath = path.resolve(currentDir, relativePath);

  if (!absolutePath.startsWith(srcPath + '/')) return undefined;

  const relativeToSrc = absolutePath.slice(srcPath.length + 1);
  return '~/' + relativeToSrc;
}

function convertTildeToRelative(currentFile, tildePath) {
  // Find src/ directory in current file
  const parts = currentFile.split('/');
  const srcIndex = parts.indexOf('src');

  if (srcIndex === -1) return tildePath;

  // Build path to src/
  const srcPath = parts.slice(0, srcIndex + 1).join('/');
  const currentDir = path.dirname(currentFile);

  // Convert ~/path to src/path
  const absolutePath = tildePath.replace(/^~\//, srcPath + '/');

  // Make relative from current directory
  let relativePath = path.relative(currentDir, absolutePath);

  // Ensure it starts with ./
  if (!relativePath.startsWith('.')) {
    relativePath = './' + relativePath;
  }

  return relativePath;
}
