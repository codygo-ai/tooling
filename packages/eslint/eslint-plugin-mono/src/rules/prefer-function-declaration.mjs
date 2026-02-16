/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Prefer function declarations over arrow functions at top level',
    },
    fixable: undefined,
    messages: {
      preferFunctionDeclaration:
        'Use function declaration instead of arrow function or function expression at top level.',
    },
  },

  create(context) {
    /**
     * Check if node is at top level (not inside a function/class)
     *
     * @param {import('estree').Node} node - The node to check
     * @returns {boolean} True if at top level
     */
    function isTopLevel(node) {
      let parent = node.parent;

      while (parent) {
        // If inside a function or class method, it's not top level
        if (
          parent.type === 'FunctionDeclaration' ||
          parent.type === 'FunctionExpression' ||
          parent.type === 'ArrowFunctionExpression' ||
          parent.type === 'ClassMethod' ||
          parent.type === 'MethodDefinition'
        ) {
          return false;
        }

        // If we reach Program, we're at top level
        if (parent.type === 'Program') {
          return true;
        }

        parent = parent.parent;
      }

      return false;
    }

    return {
      VariableDeclarator(node) {
        // Only check const declarations
        if (node.parent.kind !== 'const') return;

        // Check if it's an arrow function or function expression
        const init = node.init;
        const isArrowFunction = init && init.type === 'ArrowFunctionExpression';
        const isFunctionExpression = init && init.type === 'FunctionExpression';

        // Flag if it's at top level (arrow functions in callbacks are not at top level, so they're allowed)
        if ((isArrowFunction || isFunctionExpression) && isTopLevel(node)) {
          context.report({
            node,
            messageId: 'preferFunctionDeclaration',
          });
        }
      },
    };
  },
};
