/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Keep all process.env.XXX at top of files as constants with proper defaults',
    },
    messages: {
      notAtTop:
        "process.env.{{varName}} must be declared at the top of the file as a const. Move it to the top with other env vars, e.g.: const {{varName}} = process.env.{{varName}} ?? '{{varName}}_missing';",
      missingDefault:
        "process.env.{{varName}} is missing a default value. Add a default using ?? operator, e.g.: const {{varName}} = process.env.{{varName}} ?? '{{varName}}_missing';",
      invalidDefault:
        "process.env.{{varName}} uses 'undefined' as default. Use '{{varName}}_missing' instead to make missing env vars obvious, e.g.: const {{varName}} = process.env.{{varName}} ?? '{{varName}}_missing';",
    },
  },

  create(context) {
    const filename = context.filename;

    // Skip non-source files (but allow test files and <input>)
    if (
      filename !== '<input>' &&
      !filename.includes('test') &&
      !/\.(ts|tsx|js|jsx)$/.test(filename)
    ) {
      return {};
    }

    let lastImportLine = 0;
    const envVarDeclarations = new Map(); // Map of line number to env var name

    /**
     * Check if node is a process.env access
     * @param {import('estree').Node} node
     * @returns {boolean}
     */
    function isProcessEnvAccess(node) {
      if (node.type !== 'MemberExpression') return false;

      // Check for process.env.XXX pattern
      if (
        node.object.type === 'MemberExpression' &&
        node.object.object.type === 'Identifier' &&
        node.object.object.name === 'process' &&
        node.object.property.type === 'Identifier' &&
        node.object.property.name === 'env'
      ) {
        return true;
      }

      return false;
    }

    /**
     * Extract env var name from process.env.XXX
     * @param {import('estree').MemberExpression} node
     * @returns {string | undefined}
     */
    function getEnvVarName(node) {
      if (isProcessEnvAccess(node) && node.property.type === 'Identifier') {
        return node.property.name;
      }
      return undefined;
    }

    /**
     * Check if node is in top-level const declaration
     * @param {import('estree').Node} node
     * @returns {boolean}
     */
    function isTopLevelConst(node) {
      let parent = node.parent;
      while (parent) {
        if (parent.type === 'VariableDeclarator') {
          const varDecl = parent.parent;
          if (varDecl.type === 'VariableDeclaration' && varDecl.kind === 'const') {
            // Check if it's at top level (not inside function/class)
            let checkParent = varDecl.parent;
            while (checkParent) {
              if (
                checkParent.type === 'FunctionDeclaration' ||
                checkParent.type === 'FunctionExpression' ||
                checkParent.type === 'ArrowFunctionExpression' ||
                checkParent.type === 'ClassDeclaration' ||
                checkParent.type === 'ClassExpression' ||
                checkParent.type === 'MethodDefinition'
              ) {
                return false;
              }
              if (checkParent.type === 'Program') {
                return true;
              }
              checkParent = checkParent.parent;
            }
          }
        }
        parent = parent.parent;
      }
      return false;
    }

    /**
     * Check if a const declaration contains process.env access
     * @param {import('estree').VariableDeclaration} varDecl
     * @returns {string | undefined} env var name if found
     */
    function getEnvVarFromConstDeclaration(varDecl) {
      for (const declarator of varDecl.declarations) {
        if (declarator.init && isProcessEnvAccess(declarator.init)) {
          return getEnvVarName(declarator.init);
        }
        // Also check for ?? operator pattern: process.env.XXX ?? 'default'
        if (
          declarator.init &&
          declarator.init.type === 'LogicalExpression' &&
          declarator.init.operator === '??' &&
          isProcessEnvAccess(declarator.init.left)
        ) {
          return getEnvVarName(declarator.init.left);
        }
      }
      return undefined;
    }

    return {
      Program(node) {
        // Find last import line and track env var declarations
        const statements = node.body;
        let foundNonImportExport = false;

        for (let i = 0; i < statements.length; i++) {
          const stmt = statements[i];

          // Track imports
          if (
            stmt.type === 'ImportDeclaration' ||
            (stmt.type === 'ExportNamedDeclaration' && stmt.source) ||
            stmt.type === 'ExportAllDeclaration'
          ) {
            lastImportLine = Math.max(lastImportLine, stmt.loc.end.line);
            continue;
          }

          // Track env var const declarations
          if (stmt.type === 'VariableDeclaration' && stmt.kind === 'const') {
            const envVarName = getEnvVarFromConstDeclaration(stmt);
            if (envVarName) {
              envVarDeclarations.set(stmt.loc.start.line, {
                line: stmt.loc.start.line,
                name: envVarName,
                node: stmt,
              });
            }
            // If we found an env var, it should be right after imports
            if (envVarName && foundNonImportExport) {
              context.report({
                node: stmt,
                messageId: 'notAtTop',
                data: { varName: envVarName },
              });
            }
            continue;
          }

          // Check for other top-level statements (exports without source are allowed)
          if (stmt.type !== 'ExportNamedDeclaration' && stmt.type !== 'ExportDefaultDeclaration') {
            foundNonImportExport = true;
            // If we hit non-import/export/const, check if any env vars come after
            for (const [line, envVar] of envVarDeclarations.entries()) {
              if (line > stmt.loc.start.line) {
                context.report({
                  node: envVar.node,
                  messageId: 'notAtTop',
                  data: { varName: envVar.name },
                });
              }
            }
          }
        }

        // Check that all env var declarations come right after imports
        for (const envVar of envVarDeclarations.values()) {
          // Allow some gap for blank lines, but env vars should be within reasonable distance
          // (e.g., within 10 lines of last import)
          if (envVar.line > lastImportLine + 10) {
            context.report({
              node: envVar.node,
              messageId: 'notAtTop',
              data: { varName: envVar.name },
            });
          }
        }
      },

      MemberExpression(node) {
        if (!isProcessEnvAccess(node)) return;

        const envVarName = getEnvVarName(node);
        if (!envVarName) return;

        // Check if it's in a top-level const declaration
        if (!isTopLevelConst(node)) {
          context.report({
            node,
            messageId: 'notAtTop',
            data: { varName: envVarName },
          });
          return;
        }

        // Find the const declaration containing this env var
        let varDecl = node.parent;
        while (varDecl) {
          if (varDecl.type === 'VariableDeclarator') {
            const parentDecl = varDecl.parent;
            if (
              parentDecl.type === 'VariableDeclaration' &&
              parentDecl.kind === 'const' &&
              parentDecl.parent.type === 'Program'
            ) {
              // Check if this const declaration is right after imports
              // Allow up to 5 lines gap for blank lines
              if (parentDecl.loc.start.line > lastImportLine + 5) {
                context.report({
                  node: parentDecl,
                  messageId: 'notAtTop',
                  data: { varName: envVarName },
                });
              }
              break;
            }
          }
          varDecl = varDecl.parent;
        }

        // Check for default value pattern (Rule 19)
        // Only require default when process.env is used directly or with ?? operator
        // Skip if used in comparisons (===, !==, etc.) or other expressions
        const parentNode = node.parent;

        // Skip if parent is a BinaryExpression (comparisons like ===, !==)
        if (parentNode.type === 'BinaryExpression') {
          return; // Comparisons don't need defaults
        }

        // Check if parent is LogicalExpression with ?? operator
        let defaultValue = undefined;
        if (parentNode.type === 'LogicalExpression' && parentNode.operator === '??') {
          defaultValue = parentNode.right;
        }

        // If no ?? operator, check if it's used directly (needs default)
        if (!defaultValue && parentNode.type !== 'LogicalExpression') {
          // No default provided - should use XXX_missing
          // Point to the variable declarator for better context
          let declarator = node.parent;
          while (declarator && declarator.type !== 'VariableDeclarator') {
            declarator = declarator.parent;
          }

          context.report({
            node: declarator || node,
            messageId: 'missingDefault',
            data: { varName: envVarName },
          });
        } else if (defaultValue) {
          // Check if default is undefined (either Literal with undefined value or Identifier named 'undefined')
          const isUndefined =
            (defaultValue.type === 'Literal' && defaultValue.value === undefined) ||
            (defaultValue.type === 'Identifier' && defaultValue.name === 'undefined');

          if (isUndefined) {
            // Has ?? undefined - should be ?? 'XXX_missing'
            context.report({
              node: defaultValue,
              messageId: 'invalidDefault',
              data: { varName: envVarName },
            });
          }
        }
      },
    };
  },
};
