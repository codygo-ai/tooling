/**
 * ESLint plugin for monorepo structure validation.
 *
 * @module @codygo-ai/eslint-plugin-mono
 */

import appErrorRequiredProps from './rules/app-error-required-props.mjs';
import devDepsLocation from './rules/dev-deps-location.mjs';
import enforceTildeImports from './rules/enforce-tilde-imports.mjs';
import envVarsAtTop from './rules/env-vars-at-top.mjs';
import indexExportsOnly from './rules/index-exports-only.mjs';
import noDotenv from './rules/no-dotenv.mjs';
import noForbiddenImports from './rules/no-forbidden-imports.mjs';
import noJsExtension from './rules/no-js-extension.mjs';
import packageHierarchy from './rules/package-hierarchy.mjs';
import packageJsonSchema from './rules/package-json-schema.mjs';
import packageNaming from './rules/package-naming.mjs';
import packageStructure from './rules/package-structure.mjs';
import peerDepsPattern from './rules/peer-deps-pattern.mjs';
import preferFunctionDeclaration from './rules/prefer-function-declaration.mjs';
import preferMinimalChecks from './rules/prefer-minimal-checks.mjs';
import preferOptionalChaining from './rules/prefer-optional-chaining.mjs';
import requireEnvExample from './rules/require-env-example.mjs';
import requireEnvPrefix from './rules/require-env-prefix.mjs';
import requiredFiles from './rules/required-files.mjs';
import workspaceProtocol from './rules/workspace-protocol.mjs';

/** @type {import('eslint').ESLint.Plugin} */
export default {
  rules: {
    'app-error-required-props': appErrorRequiredProps,
    'package-structure': packageStructure,
    'package-json-schema': packageJsonSchema,
    'package-naming': packageNaming,
    'package-hierarchy': packageHierarchy,
    'workspace-protocol': workspaceProtocol,
    'dev-deps-location': devDepsLocation,
    'peer-deps-pattern': peerDepsPattern,
    'required-files': requiredFiles,
    'no-forbidden-imports': noForbiddenImports,
    'enforce-tilde-imports': enforceTildeImports,
    'no-js-extension': noJsExtension,
    'prefer-function-declaration': preferFunctionDeclaration,
    'prefer-minimal-checks': preferMinimalChecks,
    'prefer-optional-chaining': preferOptionalChaining,
    'env-vars-at-top': envVarsAtTop,
    'require-env-example': requireEnvExample,
    'require-env-prefix': requireEnvPrefix,
    'no-dotenv': noDotenv,
    'index-exports-only': indexExportsOnly,
  },
};
