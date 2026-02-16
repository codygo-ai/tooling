/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'AppError must include cause, context, and code properties',
    },
    messages: {
      missingAll:
        '{{errorClass}} requires an options object with "cause", "context", and "code" properties. Example: new {{errorClass}}("message", { cause: error, context: {...}, code: "ERROR_CODE" })',
      missingCause:
        '{{errorClass}} options object is missing required "cause" property (original error)',
      missingContext:
        '{{errorClass}} options object is missing required "context" property (relevant data)',
      missingCode:
        '{{errorClass}} options object is missing required "code" property (error identification string)',
      missingProperties:
        '{{errorClass}} options object is missing: {{missing}}. Required: cause, context, code',
    },
    schema: [
      {
        type: 'object',
        properties: {
          errorClassNames: {
            type: 'array',
            items: {
              type: 'string',
            },
            description:
              'Array of error class names or regex patterns (e.g., ["AppError", "/.*Error$/"])',
          },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    const options = context.options[0] || {};

    const errorClassNames = Array.isArray(options?.errorClassNames)
      ? options.errorClassNames
      : ['AppError'];

    // Compile regex patterns and create matchers
    const matchers = errorClassNames.map((/** @type {string} */ pattern) => {
      // Check if it's a regex pattern (starts and ends with /)
      if (typeof pattern === 'string' && pattern.startsWith('/') && pattern.endsWith('/')) {
        // Extract flags if present (e.g., /pattern/i)
        const lastSlash = pattern.lastIndexOf('/');
        const flags = pattern.slice(lastSlash + 1);
        const actualPattern = pattern.slice(1, lastSlash);
        try {
          return { type: 'regex', pattern: new RegExp(actualPattern, flags), original: pattern };
        } catch {
          // Invalid regex, treat as literal string
          return { type: 'literal', pattern, original: pattern };
        }
      }
      // Literal string match
      return { type: 'literal', pattern, original: pattern };
    });

    /**
     * Check if identifier name matches any configured pattern
     * @param {string} name
     * @returns {string | undefined} Returns the matched pattern name if found, undefined otherwise
     */
    function matchesErrorClass(name) {
      for (const matcher of matchers) {
        if (matcher.type === 'regex') {
          if (matcher.pattern.test(name)) {
            return matcher.original;
          }
        } else if (matcher.type === 'literal') {
          if (matcher.pattern === name) {
            return matcher.original;
          }
        }
      }
      return undefined;
    }

    /**
     * Check if node is a NewExpression with one of the configured error classes
     * @param {import('estree').Node} node
     * @returns {string | undefined} Returns the matched error class name if found, undefined otherwise
     */
    function getErrorClassName(node) {
      if (node.type !== 'NewExpression') return undefined;

      if (node.callee.type === 'Identifier') {
        const matched = matchesErrorClass(node.callee.name);
        if (matched) {
          return node.callee.name;
        }
      }

      return undefined;
    }

    /**
     * Check if node is inside a catch block
     * @param {import('estree').Node} node
     * @returns {boolean}
     */
    function isInsideCatchBlock(node) {
      // Traverse up the AST using parent references
      // @ts-expect-error - parent property exists at runtime in ESLint's AST
      let current = node.parent;
      while (current) {
        if (current.type === 'CatchClause') {
          return true;
        }
        current = current.parent;
      }

      return false;
    }

    /**
     * Get object expression from NewExpression arguments
     * @param {import('estree').NewExpression} node
     * @returns {import('estree').ObjectExpression | undefined}
     */
    function getOptionsObject(node) {
      if (node.arguments.length === 0) return undefined;

      // AppError typically has (message, options) or just (options)
      // Check all arguments for an ObjectExpression
      for (const arg of node.arguments) {
        if (arg.type === 'ObjectExpression') {
          return arg;
        }
      }

      return undefined;
    }

    /**
     * Get property value from object expression
     * @param {import('estree').ObjectExpression} obj
     * @param {string} key
     * @returns {import('estree').Node | undefined}
     */
    function getPropertyValue(obj, key) {
      for (const prop of obj.properties) {
        if (prop.type === 'Property' && prop.key.type === 'Identifier' && prop.key.name === key) {
          return prop.value;
        }
      }
      return undefined;
    }

    return {
      NewExpression(node) {
        const errorClassName = getErrorClassName(node);
        if (!errorClassName) return;

        const optionsObj = getOptionsObject(node);
        const isInCatch = isInsideCatchBlock(node);

        if (!optionsObj) {
          // No options object - report single comprehensive error
          context.report({
            node,
            messageId: 'missingAll',
            data: { errorClass: errorClassName },
          });
          return;
        }

        // Check for required properties
        const cause = getPropertyValue(optionsObj, 'cause');
        const contextProp = getPropertyValue(optionsObj, 'context');
        const code = getPropertyValue(optionsObj, 'code');

        const missing = [];
        // Only require cause if inside a catch block
        if (isInCatch && !cause) missing.push('cause');
        if (!contextProp) missing.push('context');
        if (!code) missing.push('code');

        // If multiple missing, report once with all missing properties
        if (missing.length > 1) {
          context.report({
            node: optionsObj,
            messageId: 'missingProperties',
            data: {
              errorClass: errorClassName,
              missing: missing.join(', '),
            },
          });
        } else {
          // Single missing property - report specific error
          if (isInCatch && !cause) {
            context.report({
              node: optionsObj,
              messageId: 'missingCause',
              data: { errorClass: errorClassName },
            });
          }
          if (!contextProp) {
            context.report({
              node: optionsObj,
              messageId: 'missingContext',
              data: { errorClass: errorClassName },
            });
          }
          if (!code) {
            context.report({
              node: optionsObj,
              messageId: 'missingCode',
              data: { errorClass: errorClassName },
            });
          }
        }
      },
    };
  },
};
