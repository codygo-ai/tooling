import { readFileSync, statSync } from 'fs';
import { join, dirname } from 'path';

import { ESLintUtils } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(
  (name) =>
    `https://github.com/codygo-ai/bizsist-mono/tree/main/devops/apps/eslint/eslint-plugin-mono/src/rules/${name}.mjs`
);

export default createRule({
  name: 'package-naming',
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforces package naming convention',
    },
    messages: {
      invalidNamespace: 'Package name "{{name}}" must use @codygo, @codygo-ai or @bizsist namespace',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const filename = context.filename;
    const packageJsonPath = findPackageJson(filename);

    if (!packageJsonPath) {
      return {};
    }

    try {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      const packageName = packageJson.name;

      if (!packageName) {
        return {};
      }

      // Check namespace - allow both @codygo (infrastructure) and @bizsist (applications)
      const validPrefixes = ['@codygo/', '@codygo-ai/', '@bizsist/'];
      if (!validPrefixes.some((prefix) => packageName.startsWith(prefix))) {
        context.report({
          node: context.sourceCode.ast,
          messageId: 'invalidNamespace',
          data: { name: packageName },
        });
      }
    } catch {
      // Silently fail if package.json can't be read
    }

    return {};
  },
});

/**
 * @param {string} filePath - File path
 * @returns {string | undefined} Package.json path
 */
function findPackageJson(filePath) {
  let currentDir = filePath.startsWith('/') ? dirname(filePath) : process.cwd();
  const rootDir = process.cwd();

  while (currentDir !== rootDir && currentDir !== '/') {
    const packageJsonPath = join(currentDir, 'package.json');
    try {
      const stats = statSync(packageJsonPath);
      if (stats.isFile()) {
        return packageJsonPath;
      }
    } catch {
      // Continue searching
    }
    currentDir = dirname(currentDir);
  }

  // Check root as fallback
  const rootPackageJson = join(rootDir, 'package.json');
  try {
    const stats = statSync(rootPackageJson);
    if (stats.isFile()) {
      return rootPackageJson;
    }
  } catch {
    // Not found
  }

  return undefined;
}
