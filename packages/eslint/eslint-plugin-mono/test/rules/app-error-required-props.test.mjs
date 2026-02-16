import rule from '../../src/rules/app-error-required-props.mjs';
import { EnhancedRuleTester } from '../utils/enhanced-rule-tester.mjs';

const ruleTester = new EnhancedRuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
});

ruleTester.run('app-error-required-props', rule, {
  valid: [
    {
      name: 'AppError with all required properties inside catch (cause, context, code)',
      code: `
        try {
          await riskyOperation();
        } catch (error) {
          throw new AppError('Failed to detach', {
            code: 'CDP_DETACH_ERROR',
            cause: error,
            context: { threadId, userId, tabId },
          });
        }
      `,
    },
    {
      name: 'AppError outside catch block - cause not required (context, code)',
      code: `
        throw new AppError('Operation failed', {
          code: 'OPERATION_ERROR',
          context: { operationId, timestamp },
        });
      `,
    },
    {
      name: 'AppError outside catch with cause (optional)',
      code: `
        throw new AppError('Operation failed', {
          code: 'OPERATION_ERROR',
          cause: originalError,
          context: { operationId, timestamp },
        });
      `,
    },
    {
      name: 'Regular Error (not AppError) - should not trigger rule',
      code: `
        throw new Error('Regular error');
      `,
    },
    {
      name: 'Multiple error classes with errorClassNames config',
      code: `
        throw new CustomError('Failed', {
          code: 'ERROR_CODE',
          context: { data: 'value' },
        });
      `,
      options: [{ errorClassNames: ['AppError', 'CustomError'] }],
    },
    {
      name: 'Regex pattern matching error class names',
      code: `
        throw new MyAppError('Failed', {
          code: 'ERROR_CODE',
          context: { data: 'value' },
        });
      `,
      options: [{ errorClassNames: ['/.*Error$/'] }],
    },
    {
      name: 'Regex pattern with flags',
      code: `
        throw new apperror('Failed', {
          code: 'ERROR_CODE',
          context: { data: 'value' },
        });
      `,
      options: [{ errorClassNames: ['/^apperror$/i'] }],
    },
  ],

  invalid: [
    {
      name: 'AppError without options object - should report missingAll',
      code: `
        throw new AppError('Failed');
      `,
      errors: [
        {
          messageId: 'missingAll',
        },
      ],
    },
    {
      name: 'AppError missing context and code outside catch - should report missingProperties',
      code: `
        throw new AppError('Failed', {});
      `,
      errors: [
        {
          messageId: 'missingProperties',
          data: { errorClass: 'AppError', missing: 'context, code' },
        },
      ],
    },
    {
      name: 'AppError missing cause inside catch block - should report missingCause',
      code: `
        try {
          await riskyOperation();
        } catch (error) {
          throw new AppError('Failed', {
            code: 'ERROR_CODE',
            context: { data: 'value' },
          });
        }
      `,
      errors: [
        {
          messageId: 'missingCause',
        },
      ],
    },
    {
      name: 'AppError missing context only - should report missingContext',
      code: `
        throw new AppError('Failed', {
          code: 'ERROR_CODE',
        });
      `,
      errors: [
        {
          messageId: 'missingContext',
        },
      ],
    },
    {
      name: 'AppError missing code only - should report missingCode',
      code: `
        throw new AppError('Failed', {
          context: { data: 'value' },
        });
      `,
      errors: [
        {
          messageId: 'missingCode',
        },
      ],
    },
    {
      name: 'AppError inside catch missing cause and context - should report missingProperties',
      code: `
        try {
          await riskyOperation();
        } catch (error) {
          throw new AppError('Failed', {
            code: 'ERROR_CODE',
          });
        }
      `,
      errors: [
        {
          messageId: 'missingProperties',
          data: { errorClass: 'AppError', missing: 'cause, context' },
        },
      ],
    },
    {
      name: 'Multiple error classes - CustomError missing properties',
      code: `
        throw new CustomError('Failed', {
          code: 'ERROR_CODE',
        });
      `,
      options: [{ errorClassNames: ['AppError', 'CustomError'] }],
      errors: [
        {
          messageId: 'missingContext',
        },
      ],
    },
    {
      name: 'Regex pattern matching - MyAppError missing properties',
      code: `
        throw new MyAppError('Failed', {
          code: 'ERROR_CODE',
        });
      `,
      options: [{ errorClassNames: ['/.*Error$/'] }],
      errors: [
        {
          messageId: 'missingContext',
        },
      ],
    },
  ],
});
