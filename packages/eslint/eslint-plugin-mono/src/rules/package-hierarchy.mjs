import { ESLintUtils } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(
  (name) =>
    `https://github.com/worknet/mono/tree/main/devops/apps/mono-configs/eslint-plugin-mono/src/rules/${name}.mjs`
);

export default createRule({
  name: 'package-hierarchy',
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforces package hierarchy',
    },
    messages: {
      wrongSuffixForLocation:
        'Package "{{name}}" is in {{location}} but has wrong suffix. Expected {{expected}}, got {{actual}}',
    },
    schema: [],
  },
  defaultOptions: [],
  create() {
    // Rule disabled - no longer enforcing suffix requirements
    return {};
  },
});
