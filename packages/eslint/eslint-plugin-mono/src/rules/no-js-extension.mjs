/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'problem',
    fixable: 'code',
    docs: {
      description: 'Disallow .js extension in import statements',
    },
    messages: {
      noJsExtension: "Do not use '.js' extension in imports. Remove the extension.",
    },
  },

  create(context) {
    return {
      ImportDeclaration(node) {
        const importPath = node.source.value;
        if (typeof importPath !== 'string') return;

        // Check if import path ends with .js
        if (importPath.endsWith('.js') && !importPath.endsWith('.json')) {
          context.report({
            node: node.source,
            messageId: 'noJsExtension',
            fix(fixer) {
              const fixed = importPath.slice(0, -3);
              return fixer.replaceText(node.source, `'${fixed}'`);
            },
          });
        }
      },
    };
  },
};
