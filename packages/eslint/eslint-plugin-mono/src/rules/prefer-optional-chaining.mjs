/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Prefer optional chaining instead of redundant truthy checks before property access',
    },
    messages: {
      preferOptionalChaining: "Use optional chaining '{{replacement}}' instead of '{{original}}'",
    },
  },

  create(context) {
    const sourceCode = context.sourceCode;

    /**
     * Extract property path from a member expression (supports nested: obj.prop.nested)
     * @param {any} node
     * @returns {string[] | undefined} Array of property names, e.g. ['obj', 'prop', 'nested']
     */
    function extractPropertyPath(node) {
      if (node.type === 'Identifier') {
        return [node.name];
      }
      if (node.type === 'MemberExpression') {
        const objectPath = extractPropertyPath(node.object);
        if (!objectPath) return undefined;
        if (node.property.type === 'Identifier') {
          return [...objectPath, node.property.name];
        }
        if (node.property.type === 'Literal' && typeof node.property.value === 'string') {
          return [...objectPath, node.property.value];
        }
      }
      return undefined;
    }

    /**
     * Check if two property paths are the same
     * @param {string[]} path1
     * @param {string[]} path2
     * @returns {boolean}
     */
    function arePathsEqual(path1, path2) {
      if (path1.length !== path2.length) return false;
      return path1.every((part, i) => part === path2[i]);
    }

    /**
     * Convert property path to optional chaining string
     * @param {string[]} path
     * @returns {string}
     */
    function pathToOptionalChaining(path) {
      if (path.length === 0) return '';
      if (path.length === 1) return path[0];
      return `${path[0]}?.${path.slice(1).join('?.')}`;
    }

    /**
     * Check if node uses the same property path (supports nested)
     * @param {any} node
     * @param {string[]} targetPath
     * @returns {boolean}
     */
    function usesPropertyPath(node, targetPath) {
      const nodePath = extractPropertyPath(node);
      return nodePath !== undefined && arePathsEqual(nodePath, targetPath);
    }

    /**
     * Check if node is a typeof check
     * @param {any} node
     * @param {string[]} targetPath
     * @returns {{type: string} | undefined}
     */
    function isTypeofCheck(node, targetPath) {
      if (node.type !== 'BinaryExpression') return undefined;
      if (node.operator !== '===' && node.operator !== '!==') return undefined;

      // Check if right side is a string literal
      if (node.right.type !== 'Literal' || typeof node.right.value !== 'string') {
        return undefined;
      }

      // Check if left side is typeof expression
      if (node.left.type !== 'UnaryExpression' || node.left.operator !== 'typeof') {
        return undefined;
      }

      // Check if typeof target matches our property path
      if (!usesPropertyPath(node.left.argument, targetPath)) return undefined;

      return { type: node.right.value };
    }

    /**
     * Check if node is an instanceof check
     * @param {any} node
     * @param {string[]} targetPath
     * @returns {{type: string} | undefined}
     */
    function isInstanceofCheck(node, targetPath) {
      if (node.type !== 'BinaryExpression') return undefined;
      if (node.operator !== 'instanceof') return undefined;

      // Check if left side matches our property path
      if (!usesPropertyPath(node.left, targetPath)) return undefined;

      const sourceCode = context.sourceCode;
      return { type: sourceCode.getText(node.right) };
    }

    /**
     * Check if node is an Array.isArray call
     * @param {any} node
     * @param {string[]} targetPath
     * @returns {boolean}
     */
    function isArrayIsArrayCheck(node, targetPath) {
      if (node.type !== 'CallExpression') return false;
      if (node.callee.type !== 'MemberExpression') return false;
      if (node.callee.object.type !== 'Identifier' || node.callee.object.name !== 'Array') {
        return false;
      }
      if (node.callee.property.type !== 'Identifier' || node.callee.property.name !== 'isArray') {
        return false;
      }

      if (node.arguments.length !== 1) return false;
      return usesPropertyPath(node.arguments[0], targetPath);
    }

    /**
     * Check if node is a comparison with the property path
     * @param {any} node
     * @param {string[]} targetPath
     * @returns {{operator: string, value: string} | undefined}
     */
    function isPropertyComparison(node, targetPath) {
      if (node.type !== 'BinaryExpression') return undefined;

      // Check if left side is the property access
      if (usesPropertyPath(node.left, targetPath)) {
        return {
          operator: node.operator,
          value: sourceCode.getText(node.right),
        };
      }

      return undefined;
    }

    /**
     * Check if node is a method call on the property path
     * @param {any} node
     * @param {string[]} targetPath
     * @returns {{method: string, args: string} | undefined}
     */
    function isMethodCall(node, targetPath) {
      if (node.type !== 'CallExpression') return undefined;
      if (node.callee.type !== 'MemberExpression') return undefined;

      // Check if the object of the call matches our property path
      const callObjectPath = extractPropertyPath(node.callee.object);
      if (!callObjectPath || !arePathsEqual(callObjectPath, targetPath)) return undefined;

      // Get method name
      if (node.callee.property.type !== 'Identifier') return undefined;

      const sourceCode = context.sourceCode;
      // Get the arguments text
      const calleeText = sourceCode.getText(node.callee);
      const fullText = sourceCode.getText(node);
      const argsText = fullText.slice(calleeText.length);

      return {
        method: node.callee.property.name,
        args: argsText,
      };
    }

    /**
     * Check if node is a member access on the property path (e.g., obj.prop.length)
     * @param {any} node
     * @param {string[]} targetPath
     * @returns {{member: string} | undefined}
     */
    function isMemberAccess(node, targetPath) {
      if (node.type !== 'MemberExpression') return undefined;

      // Check if the object matches our property path
      const objectPath = extractPropertyPath(node.object);
      if (!objectPath || !arePathsEqual(objectPath, targetPath)) return undefined;

      // Get member name
      if (node.property.type === 'Identifier') {
        return { member: node.property.name };
      }
      if (node.property.type === 'Literal' && typeof node.property.value === 'string') {
        return { member: node.property.value };
      }

      return undefined;
    }

    /**
     * Generate replacement text for a right-hand side expression
     * @param {any} rightNode
     * @param {string[]} propertyPath
     * @returns {string | undefined}
     */
    function generateReplacement(rightNode, propertyPath) {
      const optionalPath = pathToOptionalChaining(propertyPath);

      // typeof check
      const typeofInfo = isTypeofCheck(rightNode, propertyPath);
      if (typeofInfo) {
        const typeText = sourceCode.getText(/** @type {any} */ (rightNode).right);
        return `typeof ${optionalPath} === ${typeText}`;
      }

      // instanceof check
      const instanceofInfo = isInstanceofCheck(rightNode, propertyPath);
      if (instanceofInfo) {
        return `${optionalPath} instanceof ${instanceofInfo.type}`;
      }

      // Array.isArray check
      if (isArrayIsArrayCheck(rightNode, propertyPath)) {
        return `Array.isArray(${optionalPath})`;
      }

      // Comparison
      const comparison = isPropertyComparison(rightNode, propertyPath);
      if (comparison) {
        return `${optionalPath} ${comparison.operator} ${comparison.value}`;
      }

      // Method call
      const methodCall = isMethodCall(rightNode, propertyPath);
      if (methodCall) {
        return `${optionalPath}?.${methodCall.method}${methodCall.args}`;
      }

      // Member access
      const memberAccess = isMemberAccess(rightNode, propertyPath);
      if (memberAccess) {
        return `${optionalPath}?.${memberAccess.member}`;
      }

      // Simple property access (same as left)
      const rightPath = extractPropertyPath(rightNode);
      if (rightPath && arePathsEqual(rightPath, propertyPath)) {
        return optionalPath;
      }

      return undefined;
    }

    return {
      LogicalExpression(node) {
        if (node.operator !== '&&') return;

        const left = node.left;
        const right = node.right;

        // Extract property path from left side
        const leftPath = extractPropertyPath(left);
        if (!leftPath || leftPath.length === 0) return;

        // Generate replacement for the right side
        const replacement = generateReplacement(right, leftPath);
        if (!replacement) return;

        // Generate the full replacement
        const original = sourceCode.getText(node);
        const fullReplacement = replacement;

        context.report({
          node,
          messageId: 'preferOptionalChaining',
          data: {
            original,
            replacement: fullReplacement,
          },
        });
      },
    };
  },
};
