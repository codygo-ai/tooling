import { getWorkspaceConfig } from '../utils/getWorkspaceConfig.mjs';
import { parsePackageJson, getPropertyValue, getProperty } from '../utils/packageJsonHelpers.mjs';
import { parsePackagePath, isKebabCase } from '../utils/pathHelpers.mjs';

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce package directory structure and naming',
      category: 'Possible Errors',
    },
    messages: {
      invalidScope: 'Invalid scope "{{scope}}". Must be: {{validScopes}}',
      invalidType: 'Invalid type "{{type}}". Must be: {{validTypes}}',
      notKebabCase: 'Directory "{{name}}" must be kebab-case',
      nameMismatch: 'Package name should be "{{expected}}", got "{{actual}}"',
    },
    schema: [
      {
        type: 'object',
        properties: {
          namespace: { type: 'string' },
          scopes: { type: 'array', items: { type: 'string' } },
          types: { type: 'array', items: { type: 'string' } },
        },
      },
    ],
  },

  create(context) {
    const filename = context.filename;
    if (!filename.endsWith('package.json')) return {};

    const options = /** @type {any} */ (context.options[0] || {});
    const settings = /** @type {any} */ (context.settings?.mono || {});
    const autoConfig = getWorkspaceConfig(context);

    const config = {
      namespace: options.namespace || settings.namespace || autoConfig.namespace || '@wn',
      scopes: options.scopes || settings.scopes || autoConfig.scopes || [],
      types: options.types || settings.types || autoConfig.types || [],
    };

    return {
      Program(node) {
        const pathInfo = parsePackagePath(filename);

        if (!config.scopes.includes(pathInfo.scope)) {
          context.report({
            node,
            messageId: 'invalidScope',
            data: { scope: pathInfo.scope, validScopes: config.scopes.join(', ') },
          });
        }

        if (!config.types.includes(pathInfo.type)) {
          context.report({
            node,
            messageId: 'invalidType',
            data: { type: pathInfo.type, validTypes: config.types.join(', ') },
          });
        }

        if (!isKebabCase(pathInfo.packageName)) {
          context.report({
            node,
            messageId: 'notKebabCase',
            data: { name: pathInfo.packageName },
          });
        }

        const pkg = parsePackageJson(node);
        const actualName = getPropertyValue(pkg, 'name');
        const expectedName = `${config.namespace}/${pathInfo.packageName}`;

        if (actualName !== expectedName) {
          const nameNode = getProperty(pkg, 'name');
          if (nameNode) {
            context.report({
              node: nameNode,
              messageId: 'nameMismatch',
              data: { expected: expectedName, actual: actualName },
            });
          }
        }
      },
    };
  },
};
