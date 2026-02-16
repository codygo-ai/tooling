import { getWorkspaceConfig } from '../utils/getWorkspaceConfig.mjs';
import { parsePackageJson, getProperty, getObjectEntries } from '../utils/packageJsonHelpers.mjs';

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce workspace protocol for internal dependencies',
    },
    messages: {
      wrongProtocol: 'Workspace dependency "{{name}}" must use "{{protocol}}", got "{{actual}}"',
    },
    schema: [
      {
        type: 'object',
        properties: {
          namespace: { type: 'string' },
          protocol: { type: 'string', enum: ['workspace:^', 'workspace:*', 'workspace:~'] },
        },
      },
    ],
  },

  create(context) {
    if (!context.filename.endsWith('package.json')) return {};

    const options = /** @type {any} */ (context.options[0] || {});
    const settings = /** @type {any} */ (context.settings?.mono || {});
    const autoConfig = getWorkspaceConfig(context);

    const config = {
      namespace: options.namespace || settings.namespace || autoConfig.namespace || '@wn',
      protocol: options.protocol || settings.protocol || autoConfig.protocol || 'workspace:^',
    };

    return {
      Program(node) {
        const pkg = parsePackageJson(node);

        for (const depType of ['dependencies', 'devDependencies', 'peerDependencies']) {
          const deps = getProperty(pkg, depType);
          if (!deps) continue;

          for (const [name, versionNode] of getObjectEntries(deps)) {
            if (name.startsWith(config.namespace + '/')) {
              const version =
                versionNode.type === 'Literal' || versionNode.type === 'JSONLiteral'
                  ? versionNode.value
                  : undefined;

              if (version !== config.protocol) {
                context.report({
                  node: versionNode,
                  messageId: 'wrongProtocol',
                  data: { name, protocol: config.protocol, actual: version },
                });
              }
            }
          }
        }
      },
    };
  },
};
