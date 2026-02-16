import {
  parsePackageJson,
  getProperty,
  getObjectEntries,
  hasCommentContaining,
} from '../utils/packageJsonHelpers.mjs';
import { parsePackagePath } from '../utils/pathHelpers.mjs';

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce peerDependencies pattern for libraries',
    },
    messages: {
      externalShouldBePeer:
        'External dependency "{{name}}" should be in peerDependencies. Add "// dependency-bundled: {{name}} - [reason]" if this is intentional.',
      missingDevDep:
        'peerDependency "{{name}}" should also be in devDependencies with same version',
      versionMismatch:
        'Version mismatch for "{{name}}": peerDependencies has {{peerVersion}} but devDependencies has {{devVersion}}',
    },
  },

  create(context) {
    const filename = context.filename;
    if (!filename.endsWith('package.json')) return {};

    const pathInfo = parsePackagePath(filename);
    if (pathInfo.type !== 'libs') return {};

    return {
      Program(node) {
        const pkg = parsePackageJson(node);
        const deps = getProperty(pkg, 'dependencies');
        const peerDeps = getProperty(pkg, 'peerDependencies');
        const devDeps = getProperty(pkg, 'devDependencies');

        // Check dependencies for external packages
        if (deps) {
          for (const [name, versionNode] of getObjectEntries(deps)) {
            // Skip workspace packages (both @codygo and @bizsist namespaces)
            if (name.startsWith('@codygo/') || name.startsWith('@codygo-ai/') || name.startsWith('@bizsist/')) continue;

            // Check for bundled comment
            const hasBundledComment = hasCommentContaining(context, `dependency-bundled: ${name}`);

            if (!hasBundledComment) {
              context.report({
                node: versionNode,
                messageId: 'externalShouldBePeer',
                data: { name },
              });
            }
          }
        }

        // Check peerDeps have matching devDeps
        if (peerDeps) {
          const devDepsEntries = devDeps
            ? Object.fromEntries(
                getObjectEntries(devDeps).map(([k, v]) => [
                  k,
                  v.type === 'Literal' || v.type === 'JSONLiteral' ? v.value : undefined,
                ])
              )
            : {};

          for (const [name, peerVersionNode] of getObjectEntries(peerDeps)) {
            const peerVersion =
              peerVersionNode.type === 'Literal' || peerVersionNode.type === 'JSONLiteral'
                ? peerVersionNode.value
                : undefined;
            const devVersion = devDepsEntries[name];

            if (!devVersion) {
              context.report({
                node: peerVersionNode,
                messageId: 'missingDevDep',
                data: { name },
              });
            } else if (peerVersion !== devVersion) {
              context.report({
                node: peerVersionNode,
                messageId: 'versionMismatch',
                data: { name, peerVersion, devVersion },
              });
            }
          }
        }
      },
    };
  },
};
