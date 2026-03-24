import fs from 'fs';
import path from 'path';

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Require env example file in application package directories',
    },
    schema: [
      {
        type: 'object',
        properties: {
          filename: {
            type: 'string',
            description: 'Name of the env example file (default: .env.sample)',
          },
          appsOnly: {
            type: 'boolean',
            description: 'Only check packages under */apps/* directories (default: true)',
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      missingEnvFile:
        'Missing required {{filename}} file in package directory. Create {{filename}} to document required environment variables for this application.',
    },
  },

  create(context) {
    if (!context.filename.endsWith('package.json')) return {};

    const options = context.options[0] || {};
    const filename = options.filename ?? '.env.sample';
    const appsOnly = options.appsOnly ?? true;

    return {
      Program(node) {
        const packageDir = path.dirname(context.filename);

        if (appsOnly && !packageDir.includes('/apps/')) {
          return;
        }

        const envFilePath = path.join(packageDir, filename);

        if (!fs.existsSync(envFilePath)) {
          context.report({
            node,
            messageId: 'missingEnvFile',
            data: { filename },
          });
        }
      },
    };
  },
};
