import fs from 'fs';
import path from 'path';

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce required configuration files exist',
    },
    messages: {
      missingFile: 'Missing required file: {{file}}',
    },
    schema: [
      {
        type: 'object',
        properties: {
          files: { type: 'array', items: { type: 'string' } },
        },
      },
    ],
  },

  create(context) {
    if (!context.filename.endsWith('package.json')) return {};

    const options = context.options[0] || {};
    const { files = [] } = options;

    return {
      Program(node) {
        const packageDir = path.dirname(context.filename);

        for (const file of files) {
          const filePath = path.join(packageDir, file);

          if (!fs.existsSync(filePath)) {
            context.report({
              node,
              messageId: 'missingFile',
              data: { file },
            });
          }
        }
      },
    };
  },
};
