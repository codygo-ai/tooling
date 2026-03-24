/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        'index.ts files must only contain re-exports from local files — no logic, no external re-exports',
    },
    messages: {
      nonExportStatement:
        'index.ts must only contain re-exports. Found {{statementType}} at line {{line}}. Move implementation code to a separate file.',
      externalReExport:
        'index.ts must not re-export from external packages. "{{source}}" is not a local file. Move this to the consuming file or a dedicated wrapper module.',
    },
  },

  create(context) {
    const filename = context.filename;

    if (!filename.endsWith('index.ts') && !filename.endsWith('index.tsx')) {
      return {};
    }

    /** @param {import('estree').Node} node */
    function getStatementType(node) {
      if (node.type === 'FunctionDeclaration') return 'function declaration';
      if (node.type === 'VariableDeclaration') return 'variable declaration';
      if (node.type === 'ClassDeclaration') return 'class declaration';
      if (node.type === 'ExpressionStatement') return 'expression statement';
      return node.type;
    }

    /** @param {string} source */
    function isLocalSource(source) {
      return source.startsWith('./') || source.startsWith('../');
    }

    /** @param {import('estree').Node} node */
    function checkExternalReExport(node) {
      const source = node.source?.value;
      if (typeof source === 'string' && !isLocalSource(source)) {
        context.report({
          node,
          messageId: 'externalReExport',
          data: { source },
        });
      }
    }

    return {
      ExportNamedDeclaration(node) {
        if (node.source) {
          checkExternalReExport(node);
        }
      },
      ExportAllDeclaration(node) {
        checkExternalReExport(node);
      },
      Program(programNode) {
        for (const node of programNode.body) {
          if (
            node.type === 'ExportNamedDeclaration' ||
            node.type === 'ExportDefaultDeclaration' ||
            node.type === 'ExportAllDeclaration' ||
            node.type === 'ImportDeclaration' ||
            node.type === 'EmptyStatement'
          ) {
            continue;
          }
          context.report({
            node,
            messageId: 'nonExportStatement',
            data: {
              statementType: getStatementType(node),
              line: String(node.loc?.start.line ?? '?'),
            },
          });
        }
      },
    };
  },
};
