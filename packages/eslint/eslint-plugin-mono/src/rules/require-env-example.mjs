import fs from 'fs';
import path from 'path';

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Require .env.example file in package directories',
    },
    messages: {
      missingEnvExample:
        'Missing required .env.example file in package directory. Create .env.example to document required environment variables for this package.',
    },
  },

  create(context) {
    // Only check package.json files
    if (!context.filename.endsWith('package.json')) return {};

    return {
      Program(node) {
        const packageDir = path.dirname(context.filename);
        const envExamplePath = path.join(packageDir, '.env.example');

        if (!fs.existsSync(envExamplePath)) {
          context.report({
            node,
            messageId: 'missingEnvExample',
          });
        }
      },
    };
  },
};
