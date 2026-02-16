/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Prefer minimal truthy/falsy checks over verbose null/undefined checks',
    },
    messages: {
      preferMinimalCheck: "Use '{{suggestion}}' instead of verbose null/undefined check.",
    },
  },

  create(context) {
    /**
     * Check if binary expression checks for null or undefined
     *
     * @param {any} node
     * @returns {boolean} True if checks null or undefined
     */
    function checksNullOrUndefined(node) {
      if (node.type !== 'BinaryExpression') return false;
      if (node.operator !== '===' && node.operator !== '!==') return false;

      const leftIsNull = node.left.type === 'Literal' && node.left.value === null;
      const leftIsUndefined = node.left.type === 'Identifier' && node.left.name === 'undefined';
      const rightIsNull = node.right.type === 'Literal' && node.right.value === null;
      const rightIsUndefined = node.right.type === 'Identifier' && node.right.name === 'undefined';

      return leftIsNull || leftIsUndefined || rightIsNull || rightIsUndefined;
    }

    /**
     * Get the variable name from a binary expression checking null/undefined
     *
     * @param {any} node - Binary expression node
     * @returns {string | undefined} Variable name or undefined
     */
    function getVariableName(node) {
      if (node.type !== 'BinaryExpression') return undefined;
      if (node.left.type === 'Identifier') return node.left.name;
      if (node.right.type === 'Identifier') return node.right.name;
      return undefined;
    }

    /**
     * Get the suggestion for a logical expression
     *
     * @param {any} node - Logical expression node
     * @returns {string | undefined} Suggestion string or undefined
     */
    function getSuggestion(node) {
      // Pattern: value === undefined || value === null (or reversed)
      if (node.operator === '||') {
        const left = node.left;
        const right = node.right;

        if (
          left.type === 'BinaryExpression' &&
          right.type === 'BinaryExpression' &&
          checksNullOrUndefined(left) &&
          checksNullOrUndefined(right)
        ) {
          const leftVar = getVariableName(left);
          const rightVar = getVariableName(right);

          if (leftVar && rightVar && leftVar === rightVar) {
            return `!${leftVar}`;
          }
        }
      }

      // Pattern: value !== undefined && value !== null (or reversed)
      if (node.operator === '&&') {
        const left = node.left;
        const right = node.right;

        if (
          left.type === 'BinaryExpression' &&
          right.type === 'BinaryExpression' &&
          checksNullOrUndefined(left) &&
          checksNullOrUndefined(right)
        ) {
          const leftVar = getVariableName(left);
          const rightVar = getVariableName(right);

          if (leftVar && rightVar && leftVar === rightVar) {
            return `!!${leftVar} or Boolean(${leftVar})`;
          }
        }
      }

      return undefined;
    }

    return {
      LogicalExpression(node) {
        const suggestion = getSuggestion(node);

        if (suggestion) {
          context.report({
            node,
            messageId: 'preferMinimalCheck',
            data: { suggestion },
          });
        }
      },
    };
  },
};
