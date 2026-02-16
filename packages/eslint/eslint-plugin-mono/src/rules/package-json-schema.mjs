import fs from 'fs';
import path from 'path';

import {
  parsePackageJson,
  getProperty,
  getPropertyValue,
  hasProperty,
  getObjectEntries,
} from '../utils/packageJsonHelpers.mjs';

/**
 * Check if a package is a TypeScript project
 * @param {string} packageDir - Directory containing package.json
 * @returns {boolean} True if TypeScript project
 */
function isTypeScriptProject(packageDir) {
  // Check for tsconfig.json
  const tsconfigPath = path.join(packageDir, 'tsconfig.json');
  if (fs.existsSync(tsconfigPath)) {
    return true;
  }

  // Check for .ts or .tsx files in src/
  const srcDir = path.join(packageDir, 'src');
  if (fs.existsSync(srcDir)) {
    try {
      const files = fs.readdirSync(srcDir, { recursive: true });
      return files.some(
        (file) => typeof file === 'string' && (file.endsWith('.ts') || file.endsWith('.tsx'))
      );
    } catch {
      // If we can't read the directory, assume not TypeScript
      return false;
    }
  }

  return false;
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce package.json schema based on package type',
    },
    messages: {
      missingField: 'Missing required field: {{field}}',
      forbiddenField: 'Field "{{field}}" should not be present',
      wrongValue: 'Field "{{field}}" should be {{expected}}, got {{actual}}',
      missingScript: 'Missing required script: {{script}}',
      forbiddenScript: 'Script "{{script}}" should not be present',
      exportsRequired: 'Library must have "exports" field',
      exportsMissingTypes: 'exports["{{key}}"] missing "types" field',
      exportsMissingDefault: 'exports["{{key}}"] missing "default" field',
      mainExportNeedsIndex: 'exports["."] requires src/index.ts file',
    },
    schema: [
      {
        type: 'object',
        properties: {
          requiredFields: { type: 'array', items: { type: 'string' } },
          forbiddenFields: { type: 'array', items: { type: 'string' } },
          fieldValues: { type: 'object' },
          requiredScripts: { type: 'array', items: { type: 'string' } },
          forbiddenScripts: { type: 'array', items: { type: 'string' } },
          exports: {
            type: 'object',
            properties: {
              required: { type: 'boolean' },
              requireTypesAndDefault: { type: 'boolean' },
              mainRequiresIndexFile: { type: 'boolean' },
            },
          },
        },
      },
    ],
  },

  create(context) {
    if (!context.filename.endsWith('package.json')) return {};

    const options = context.options[0] || {};
    const {
      requiredFields = [],
      forbiddenFields = [],
      fieldValues = {},
      requiredScripts = [],
      forbiddenScripts = [],
      exports: exportsConfig = {},
    } = options;

    const packageDir = path.dirname(context.filename);
    const isTS = isTypeScriptProject(packageDir);

    return {
      Program(node) {
        const pkg = parsePackageJson(node);

        // Check required fields
        for (const field of requiredFields) {
          if (!hasProperty(pkg, field)) {
            context.report({
              node,
              messageId: 'missingField',
              data: { field },
            });
          }
        }

        // Check forbidden fields
        for (const field of forbiddenFields) {
          // Allow 'types' field for JavaScript projects
          if (field === 'types' && !isTS) {
            continue;
          }
          const fieldNode = getProperty(pkg, field);
          if (fieldNode) {
            context.report({
              node: fieldNode.value || fieldNode,
              messageId: 'forbiddenField',
              data: { field },
            });
          }
        }

        // Check field values
        for (const [field, expectedValue] of Object.entries(fieldValues)) {
          const actualValue = getPropertyValue(pkg, field);
          if (actualValue !== expectedValue) {
            const fieldNode = getProperty(pkg, field);
            if (fieldNode) {
              context.report({
                node: fieldNode,
                messageId: 'wrongValue',
                data: {
                  field,
                  expected: JSON.stringify(expectedValue),
                  actual: JSON.stringify(actualValue),
                },
              });
            }
          }
        }

        // Check scripts
        const scriptsProperty = getProperty(pkg, 'scripts');
        const scripts = scriptsProperty?.value; // Get the actual object value

        for (const script of requiredScripts) {
          // Only require check-typing for TypeScript projects
          if (script === 'check-typing' && !isTS) {
            continue;
          }
          if (!scripts || !hasProperty(scripts, script)) {
            context.report({
              node: scriptsProperty || node,
              messageId: 'missingScript',
              data: { script },
            });
          }
        }

        for (const script of forbiddenScripts) {
          if (scripts) {
            const scriptNode = getProperty(scripts, script);
            if (scriptNode) {
              context.report({
                node: scriptNode,
                messageId: 'forbiddenScript',
                data: { script },
              });
            }
          }
        }

        // Check exports
        if (exportsConfig.required) {
          const exports = getProperty(pkg, 'exports');
          if (!exports) {
            context.report({
              node,
              messageId: 'exportsRequired',
            });
          } else if (exportsConfig.requireTypesAndDefault) {
            // Check each export has types and default
            for (const [key, valueNode] of getObjectEntries(exports)) {
              if (
                valueNode.type === 'ObjectExpression' ||
                valueNode.type === 'JSONObjectExpression'
              ) {
                const hasTypes = hasProperty(valueNode, 'types');
                const hasDefault = hasProperty(valueNode, 'default');

                // Only require 'types' field for TypeScript projects
                if (!hasTypes && isTS) {
                  context.report({
                    node: valueNode,
                    messageId: 'exportsMissingTypes',
                    data: { key },
                  });
                }

                if (!hasDefault) {
                  context.report({
                    node: valueNode,
                    messageId: 'exportsMissingDefault',
                    data: { key },
                  });
                }
              }
            }

            // Check if exports["."] requires src/index.ts (only for TypeScript)
            if (exportsConfig.mainRequiresIndexFile && isTS) {
              const mainExport = getPropertyValue(exports, '.');
              if (mainExport) {
                const indexPath = path.join(packageDir, 'src/index.ts');

                if (!fs.existsSync(indexPath)) {
                  context.report({
                    node: getProperty(exports, '.'),
                    messageId: 'mainExportNeedsIndex',
                  });
                }
              }
            }
          }
        }
      },
    };
  },
};
