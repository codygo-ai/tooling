import { resolve } from 'path';

import { getWorkspaceConfig } from '../utils/getWorkspaceConfig.mjs';
import {
  parsePackageJson,
  getProperty,
  getObjectEntries,
  hasCommentContaining,
} from '../utils/packageJsonHelpers.mjs';

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce devDependencies only in root package.json',
    },
    fixable: 'code',
    messages: {
      devDepsInPackage:
        'devDependencies should only be in root package.json. Add "// devDeps-exception: [reason]" if needed.',
    },
  },

  create(context) {
    const filepath = context.filename;
    if (!filepath.endsWith('package.json')) return {};

    // Check if this is root package.json
    // Handle both relative (tests) and absolute (real usage) paths
    if (filepath === 'package.json') return {};

    const workspaceConfig = getWorkspaceConfig(context);
    const rootPackageJson = resolve(workspaceConfig.rootPath, 'package.json');
    // Resolve filepath to absolute (works for both relative and absolute)
    const cwd = context.cwd || process.cwd();
    const resolvedFilePath = resolve(cwd, filepath);
    const isRoot = resolvedFilePath === rootPackageJson;
    if (isRoot) return {};

    return {
      Program(node) {
        const pkg = parsePackageJson(node);
        const devDepsNode = getProperty(pkg, 'devDependencies');
        const peerDepsNode = getProperty(pkg, 'peerDependencies');

        if (devDepsNode) {
          const hasException = hasCommentContaining(context, 'devDeps-exception:');

          // Get peer dependency names
          const peerDepNames = new Set();
          if (peerDepsNode) {
            const peerDepsEntries = getObjectEntries(peerDepsNode);
            for (const [name] of peerDepsEntries) {
              peerDepNames.add(name);
            }
          }

          // Get dev dependency names
          const devDepsEntries = getObjectEntries(devDepsNode);
          // Only allow devDependencies that match peerDependencies or are workspace packages
          const nonPeerDevDeps = devDepsEntries.filter(
            ([name]) =>
              !peerDepNames.has(name) &&
              !name.startsWith('@codygo/') &&
              !name.startsWith('@codygo-ai/') &&
              !name.startsWith('@bizsist/')
          );

          // Report error if there are devDependencies that don't match peerDependencies
          // (unless exception comment exists)
          if (nonPeerDevDeps.length > 0 && !hasException) {
            context.report({
              node: devDepsNode,
              messageId: 'devDepsInPackage',
              // fix(fixer) {
              //   return fixer.remove(devDepsNode);
              // },
            });
          }
        }
      },
    };
  },
};
