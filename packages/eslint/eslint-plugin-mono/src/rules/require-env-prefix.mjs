/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce a configurable prefix on app-specific environment variables',
    },
    schema: [
      {
        type: 'object',
        properties: {
          prefix: {
            type: 'string',
            description: 'Required prefix for project-specific env vars (e.g. "CDG_")',
          },
          allowed: {
            type: 'array',
            items: { type: 'string' },
            description:
              'Exact names or prefix patterns (e.g. "AWS_*") exempt from the prefix requirement',
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      missingPrefix:
        'Environment variable "{{name}}" must use the {{prefix}} prefix. Only standard infra/third-party vars are exempt.',
      forbiddenPrefix:
        'Environment variable "{{name}}" is a whitelisted infra/third-party var and must NOT have the {{prefix}} prefix. Use "{{bare}}" instead.',
    },
  },
  create(context) {
    const prefix = context.options[0]?.prefix ?? 'CDG_';
    const allowed = context.options[0]?.allowed ?? [];
    const exactSet = new Set(allowed.filter((a) => !a.endsWith('*')));
    const prefixes = allowed.filter((a) => a.endsWith('*')).map((a) => a.slice(0, -1));

    function isWhitelisted(name) {
      if (exactSet.has(name)) return true;
      return prefixes.some((p) => name.startsWith(p));
    }

    return {
      MemberExpression(node) {
        if (
          node.object.type !== 'MemberExpression' ||
          node.object.object.type !== 'Identifier' ||
          node.object.object.name !== 'process' ||
          node.object.property.type !== 'Identifier' ||
          node.object.property.name !== 'env'
        )
          return;

        let name;
        if (!node.computed && node.property.type === 'Identifier') {
          name = node.property.name;
        } else if (
          node.computed &&
          node.property.type === 'Literal' &&
          typeof node.property.value === 'string'
        ) {
          name = node.property.value;
        } else {
          return;
        }

        if (name.startsWith(prefix)) {
          const bare = name.slice(prefix.length);
          if (isWhitelisted(bare)) {
            context.report({
              node: node.property,
              messageId: 'forbiddenPrefix',
              data: { name, bare, prefix },
            });
          }
          return;
        }

        if (!isWhitelisted(name)) {
          context.report({
            node: node.property,
            messageId: 'missingPrefix',
            data: { name, prefix },
          });
        }
      },
    };
  },
};
