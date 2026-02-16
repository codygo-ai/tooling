import fs from 'fs';
import path from 'path';

import { getWorkspaceConfig } from '../utils/getWorkspaceConfig.mjs';

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Prevent forbidden import patterns',
    },
    messages: {
      noIndexImport: 'Do not import from /index - import from the file directly',
      noDotImport: 'Do not import from "." - be explicit about the file',
      noDotSlashImport: 'Do not import from "./" - be explicit about the file',
      noSrcImport: 'Do not import from /src in package names',
      useIndexFile:
        'If index.ts exists in directory, import from directory instead of file directly. Use "{{directory}}" instead of "{{filePath}}"',
    },
  },

  create(context) {
    return {
      ImportDeclaration(node) {
        const importPath = node.source.value;
        if (typeof importPath !== 'string') return;

        // Rule 4.1: No /index imports
        if (importPath.endsWith('/index')) {
          context.report({
            node: node.source,
            messageId: 'noIndexImport',
          });
        }

        // Rule 4.2: No . imports
        if (importPath === '.') {
          context.report({
            node: node.source,
            messageId: 'noDotImport',
          });
        }

        // Rule 4.2: No ./ imports
        if (importPath === './') {
          context.report({
            node: node.source,
            messageId: 'noDotSlashImport',
          });
        }

        // Rule 4.3: No /src in workspace package imports
        if (/@(codygo|bizsist)\/[^/]+\/src\//.test(importPath)) {
          context.report({
            node: node.source,
            messageId: 'noSrcImport',
          });
        }

        // Rule 23: If index.ts exists in directory, use it
        checkIndexFileUsage(context, importPath, node);
      },
    };
  },
};

/**
 * Check if import should use index.ts from directory.
 *
 * @param {import('eslint').Rule.RuleContext} context - ESLint context
 * @param {string} importPath - Import path
 * @param {import('estree').ImportDeclaration} node - Import node
 * @returns {void}
 */
function checkIndexFileUsage(context, importPath, node) {
  const currentFile = context.filename;
  const currentDir = path.dirname(currentFile);

  // Handle relative imports (./ or ../)
  if (importPath.startsWith('./') || importPath.startsWith('../')) {
    // Try to find the actual file with extensions
    const extensions = ['.ts', '.tsx', '.js', '.jsx', ''];
    let actualFilePath = undefined;

    for (const ext of extensions) {
      const testPath = path.resolve(currentDir, importPath + ext);
      if (fs.existsSync(testPath)) {
        const stats = fs.statSync(testPath);
        if (stats.isFile()) {
          actualFilePath = testPath;
          break;
        }
      }
    }

    if (actualFilePath) {
      const parentDir = path.dirname(actualFilePath);

      // IMPORTANT: Files within the same directory should import directly from each other,
      // NOT through index.ts. index.ts is only for external consumers.
      // Skip the index.ts check if the imported file is in the same directory as the current file.
      if (path.resolve(currentDir) === path.resolve(parentDir)) {
        return;
      }

      const indexPath = path.join(parentDir, 'index.ts');
      const indexPathTsx = path.join(parentDir, 'index.tsx');

      // Check if index.ts or index.tsx exists in parent directory
      if (fs.existsSync(indexPath) || fs.existsSync(indexPathTsx)) {
        // Get the directory path relative to current file
        const relativeDir = path.relative(currentDir, parentDir);
        const directoryPath = relativeDir.startsWith('.') ? relativeDir : './' + relativeDir;

        // Normalize path separators
        const normalizedDir = directoryPath.replace(/\\/g, '/');

        context.report({
          node: node.source,
          messageId: 'useIndexFile',
          data: {
            directory: normalizedDir,
            filePath: importPath,
          },
        });
      }
    }
    return;
  }

  // Handle workspace package imports (e.g., @codygo/*, @bizsist/*)
  const workspaceConfig = getWorkspaceConfig(context);
  if (importPath.startsWith(workspaceConfig.namespace + '/')) {
    const packagePath = importPath.replace(workspaceConfig.namespace + '/', '');
    const parts = packagePath.split('/');

    // If there's a subpath (e.g., @codygo/utils/string), check if utils has index.ts
    if (parts.length > 1) {
      const packageName = parts[0];
      const subpath = parts.slice(1).join('/');

      // Find the package directory
      const packageDir = findPackageDirectory(workspaceConfig, packageName);
      if (packageDir) {
        // Check if the subpath is a file (not a directory)
        const subpathFull = path.join(packageDir, 'src', subpath);

        if (fs.existsSync(subpathFull)) {
          const stats = fs.statSync(subpathFull);
          if (stats.isFile()) {
            // Check if the directory containing this file has index.ts
            const fileDir = path.dirname(subpathFull);
            const indexPath = path.join(fileDir, 'index.ts');
            const indexPathTsx = path.join(fileDir, 'index.tsx');

            if (fs.existsSync(indexPath) || fs.existsSync(indexPathTsx)) {
              // Get the directory path relative to src
              const srcDir = path.join(packageDir, 'src');
              const relativeDir = path.relative(srcDir, fileDir);
              const exportPath =
                relativeDir === '.'
                  ? workspaceConfig.namespace + '/' + packageName
                  : workspaceConfig.namespace +
                    '/' +
                    packageName +
                    '/' +
                    relativeDir.replace(/\\/g, '/');

              context.report({
                node: node.source,
                messageId: 'useIndexFile',
                data: {
                  directory: exportPath,
                  filePath: importPath,
                },
              });
            }
          }
        }
      }
    }
  }
}

/**
 * Find package directory in workspace.
 *
 * @param {import('../utils/getWorkspaceConfig.mjs').WorkspaceConfig} workspaceConfig - Workspace config
 * @param {string} packageName - Package name
 * @returns {string | undefined} Package directory path or undefined
 */
function findPackageDirectory(workspaceConfig, packageName) {
  for (const scope of workspaceConfig.scopes) {
    for (const type of workspaceConfig.types) {
      // Check direct package
      const directPath = path.join(workspaceConfig.rootPath, scope, type, packageName);
      if (fs.existsSync(path.join(directPath, 'package.json'))) {
        return directPath;
      }

      // Check grouped packages
      const scopeTypePath = path.join(workspaceConfig.rootPath, scope, type);
      if (fs.existsSync(scopeTypePath)) {
        const entries = fs.readdirSync(scopeTypePath, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory()) {
            const groupedPath = path.join(scopeTypePath, entry.name, packageName);
            if (fs.existsSync(path.join(groupedPath, 'package.json'))) {
              return groupedPath;
            }
          }
        }
      }
    }
  }
  return undefined;
}
