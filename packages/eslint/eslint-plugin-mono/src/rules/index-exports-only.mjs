/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'index.ts files must only contain exports',
    },
    messages: {
      nonExportStatement:
        'index.ts files must only contain export statements, imports, and comments. Found {{statementType}} at line {{line}}. Move implementation code to a separate file.',
    },
  },

  create(context) {
    const filename = context.filename;

    // Only check index.ts files
    if (!filename.endsWith('index.ts') && !filename.endsWith('index.tsx')) {
      return {};
    }

    /**
     * Check if a statement is an export statement
     * @param {import('estree').Node} node
     * @returns {boolean}
     */
    function isExportStatement(node) {
      return (
        node.type === 'ExportNamedDeclaration' ||
        node.type === 'ExportDefaultDeclaration' ||
        node.type === 'ExportAllDeclaration'
      );
    }

    /**
     * Check if a statement is allowed (exports, imports, comments)
     * @param {import('estree').Node} node
     * @returns {boolean}
     */
    function isAllowedStatement(node) {
      // Export statements are allowed
      if (isExportStatement(node)) return true;

      // Import statements are allowed
      if (node.type === 'ImportDeclaration') return true;

      // Empty statements are allowed
      if (node.type === 'EmptyStatement') return true;

      // Type-only exports/imports are allowed
      if (node.type === 'ExportNamedDeclaration' && node.exportKind === 'type') return true;
      if (node.type === 'ImportDeclaration' && node.importKind === 'type') return true;

      return false;
    }

    /**
     * Get statement type name for error message
     * @param {import('estree').Node} node
     * @returns {string}
     */
    function getStatementType(node) {
      if (node.type === 'FunctionDeclaration') return 'function declaration';
      if (node.type === 'VariableDeclaration') return 'variable declaration';
      if (node.type === 'ClassDeclaration') return 'class declaration';
      if (node.type === 'ExpressionStatement') return 'expression statement';
      return node.type;
    }

    return {
      Program(node) {
        for (const statement of node.body) {
          if (!isAllowedStatement(statement)) {
            context.report({
              node: statement,
              messageId: 'nonExportStatement',
              data: {
                statementType: getStatementType(statement),
                line: statement.loc.start.line,
              },
            });
          }
        }
      },
    };
  },
};
