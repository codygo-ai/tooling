const ARTICLE_URL =
  'https://codygo.com/blog/how-adding-a-simple-indexts-increases-your-code-quality/';

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Prevent forbidden import patterns',
      url: ARTICLE_URL,
    },
    messages: {
      noIndexResolving:
        'Importing "{{importPath}}" resolves through index.ts. ' +
        'Files inside a directory import siblings by name (e.g. "./myFile"). ' +
        'Files outside import through the directory path (e.g. "../myDir"). ' +
        'Never use ".", "..", "./", trailing slashes, or "/index" — these all resolve through the index.ts sentinel. ' +
        `See: ${ARTICLE_URL}`,
      noSrcImport:
        'Do not import from /src in package paths. Use the package export instead: "{{suggestion}}".',
    },
  },

  create(context) {
    /** @param {import('estree').Node} node */
    function check(node) {
      const importPath = node.source?.value;
      if (typeof importPath !== 'string') return;

      if (resolvesToIndex(importPath)) {
        context.report({
          node: node.source,
          messageId: 'noIndexResolving',
          data: { importPath },
        });
        return;
      }

      const suggestion = getSrcSuggestion(importPath);
      if (suggestion) {
        context.report({
          node: node.source,
          messageId: 'noSrcImport',
          data: { importPath, suggestion },
        });
      }
    }

    return {
      ImportDeclaration: check,
      ExportNamedDeclaration(node) {
        if (node.source) check(node);
      },
      ExportAllDeclaration: check,
    };
  },
};

/**
 * Returns true if the import path resolves through an index.ts file.
 *
 * Banned patterns:
 *   .                    → resolves to ./index.ts
 *   ./                   → resolves to ./index.ts
 *   ..                   → resolves to ../index.ts
 *   ../                  → resolves to ../index.ts
 *   ../..                → resolves to ../../index.ts
 *   ../../               → same with trailing slash
 *   ./index              → explicit index import
 *   ../index             → explicit parent index import
 *   ../../foo/index      → explicit deep index import
 *   @scope/pkg/index     → package index import
 *   ./foo/               → trailing slash resolves to foo/index.ts
 *   ../foo/              → trailing slash resolves to foo/index.ts
 *   ../foo/bar/../baz/   → path with .. segments and trailing slash
 *   index                → bare index import
 *
 * @param {string} p - import path
 * @returns {boolean}
 */
function resolvesToIndex(p) {
  // Bare "index"
  if (p === 'index') return true;

  // Ends with /index or IS ./index or ../index
  if (p.endsWith('/index')) return true;

  // Trailing slash — resolves to dir/index.ts
  if (p.endsWith('/')) return true;

  // Bare dot/dotdot: ".", "..", "../..", "../../..", etc. (with or without trailing slash)
  if (/^\.?\/?$/.test(p) || /^(\.\.\/?)+$/.test(p)) return true;

  return false;
}

/** @scope/pkg/src/foo → @scope/pkg/foo */
function getSrcSuggestion(p) {
  const m = p.match(/^(@[^/]+\/[^/]+)\/src\/(.*)/);
  return m ? (m[2] ? `${m[1]}/${m[2]}` : m[1]) : undefined;
}
