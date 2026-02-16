/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow dotenv package. Use node --env-file-if-exists instead',
    },
    messages: {
      noDotenvImport:
        "Don't import or require 'dotenv' package. Use Node.js built-in: 'node --env-file-if-exists .env script.js' instead. Remove the dotenv dependency from package.json.",
      noDotenvConfig:
        "Don't call dotenv.config(). Use Node.js built-in: 'node --env-file-if-exists .env script.js' instead. Remove dotenv import/require and the dotenv dependency.",
    },
  },

  create(context) {
    return {
      ImportDeclaration(node) {
        if (node.source.value === 'dotenv') {
          context.report({
            node,
            messageId: 'noDotenvImport',
          });
        }
      },

      CallExpression(node) {
        // Check for require('dotenv').config() first (most specific)
        if (
          node.callee.type === 'MemberExpression' &&
          node.callee.object.type === 'CallExpression' &&
          node.callee.object.callee.type === 'Identifier' &&
          node.callee.object.callee.name === 'require' &&
          node.callee.object.arguments.length > 0 &&
          node.callee.object.arguments[0].type === 'Literal' &&
          node.callee.object.arguments[0].value === 'dotenv' &&
          node.callee.property.type === 'Identifier' &&
          node.callee.property.name === 'config'
        ) {
          context.report({
            node,
            messageId: 'noDotenvConfig',
          });
          return; // Don't check further
        }

        // Check for dotenv.config()
        if (
          node.callee.type === 'MemberExpression' &&
          node.callee.object.type === 'Identifier' &&
          node.callee.object.name === 'dotenv' &&
          node.callee.property.type === 'Identifier' &&
          node.callee.property.name === 'config'
        ) {
          context.report({
            node,
            messageId: 'noDotenvConfig',
          });
          return; // Don't check further
        }

        // Check for require('dotenv') - but only if not part of member expression
        if (
          node.callee.type === 'Identifier' &&
          node.callee.name === 'require' &&
          node.arguments.length > 0 &&
          node.arguments[0].type === 'Literal' &&
          node.arguments[0].value === 'dotenv' &&
          node.parent.type !== 'MemberExpression' // Not part of require('dotenv').config()
        ) {
          context.report({
            node,
            messageId: 'noDotenvImport',
          });
        }
      },
    };
  },
};
