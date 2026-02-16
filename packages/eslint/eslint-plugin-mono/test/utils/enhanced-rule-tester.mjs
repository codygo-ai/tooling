import { strict as assert } from 'node:assert';

import { RuleTester } from 'eslint';

/**
 * Enhanced RuleTester that provides better error reporting
 * Completely replaces default output with structured, human-readable format
 */
export class EnhancedRuleTester extends RuleTester {
  constructor(options) {
    super(options);
    this._testResults = [];
    this._suppressOutput = false; // Don't suppress - we want output to be captured
  }

  run(ruleName, rule, tests) {
    // Reset results for this rule
    this._testResults = [];

    // Add names to test cases if not present
    const namedValid = (tests.valid || []).map((testCase, index) => ({
      ...testCase,
      name: testCase.name || `Valid test case ${index + 1}`,
    }));

    const namedInvalid = (tests.invalid || []).map((testCase, index) => ({
      ...testCase,
      name: testCase.name || `Invalid test case ${index + 1}`,
    }));

    // Run valid tests individually to catch failures with context
    for (const testCase of namedValid) {
      try {
        super.run(ruleName, rule, {
          valid: [testCase],
          invalid: [],
        });
        this._testResults.push({
          ruleName,
          testCase,
          type: 'valid',
          passed: true,
          error: undefined,
        });
      } catch (error) {
        this._testResults.push({
          ruleName,
          testCase,
          type: 'valid',
          passed: false,
          error,
        });
      }
    }

    // Run invalid tests individually to catch failures with context
    for (const testCase of namedInvalid) {
      try {
        super.run(ruleName, rule, {
          valid: [],
          invalid: [testCase],
        });
        this._testResults.push({
          ruleName,
          testCase,
          type: 'invalid',
          passed: true,
          error: undefined,
        });
      } catch (error) {
        this._testResults.push({
          ruleName,
          testCase,
          type: 'invalid',
          passed: false,
          error,
        });
      }
    }

    // Display our structured output
    this._displayResults(ruleName);

    // Throw if any tests failed
    const failures = this._testResults.filter((r) => !r.passed);
    if (failures.length > 0) {
      const error = new Error(`${failures.length} test(s) failed`);
      error.failures = failures;
      throw error;
    }
  }

  /**
   * Display structured test results
   */
  _displayResults(ruleName) {
    const passed = this._testResults.filter((r) => r.passed);
    const failed = this._testResults.filter((r) => !r.passed);

    // Output to stderr so it's captured by our test runner
    const output = [];

    // Display rule header
    output.push('');
    output.push(`\x1b[1mRule: ${ruleName}\x1b[0m`);
    output.push('─'.repeat(60));

    // Display passed tests
    if (passed.length > 0) {
      for (const result of passed) {
        const icon = result.type === 'valid' ? '✓' : '✓';
        const typeLabel = result.type === 'valid' ? 'Valid' : 'Invalid';
        output.push(`  \x1b[32m${icon}\x1b[0m [${typeLabel}] ${result.testCase.name}`);
      }
    }

    // Display failed tests with details
    if (failed.length > 0) {
      for (const result of failed) {
        const icon = '✗';
        const typeLabel = result.type === 'valid' ? 'Valid' : 'Invalid';
        output.push(`  \x1b[31m${icon}\x1b[0m [${typeLabel}] ${result.testCase.name}`);
        output.push(...this._getFailureDetails(result));
      }
    }

    // Display summary for this rule
    const total = this._testResults.length;
    const failCount = failed.length;

    if (failCount === 0) {
      output.push(`\x1b[32m✓ All ${total} test(s) passed\x1b[0m`);
    } else {
      output.push(`\x1b[31m✗ ${failCount} of ${total} test(s) failed\x1b[0m`);
    }
    output.push('');

    // Write to stderr using console.error so it's captured by our test runner
    // console.error writes to stderr and will be captured by spawn
    const outputText = output.join('\n');
    console.error(outputText);
  }

  /**
   * Get detailed failure information as array of lines
   */
  _getFailureDetails(result) {
    const { testCase, error, type } = result;

    const lines = [
      '',
      '  ' + '═'.repeat(58),
      `  \x1b[1m❌ Test Failure Details\x1b[0m`,
      '  ' + '═'.repeat(58),
      '',
      `  \x1b[1mTest Type:\x1b[0m ${type === 'valid' ? '✅ Valid (should pass)' : '❌ Invalid (should fail)'}`,
      `  \x1b[1mTest Case:\x1b[0m ${testCase.name || 'Unnamed test case'}`,
      '',
    ];

    // Show the code being tested
    if (testCase.code) {
      lines.push('  \x1b[1mCode being tested:\x1b[0m');
      lines.push('  ' + '─'.repeat(56));
      const codeLines = testCase.code.trim().split('\n');
      codeLines.forEach((line, i) => {
        lines.push(`  ${String(i + 1).padStart(3, ' ')} | ${line}`);
      });
      lines.push('  ' + '─'.repeat(56));
      lines.push('');
    }

    // Show filename if present
    if (testCase.filename) {
      lines.push(`  \x1b[1mFilename:\x1b[0m ${testCase.filename}`);
      lines.push('');
    }

    // Show expected errors for invalid test cases
    if (type === 'invalid' && testCase.errors) {
      lines.push('  \x1b[1mExpected errors:\x1b[0m');
      lines.push(
        '  ' +
          JSON.stringify(testCase.errors, undefined, 2)
            .split('\n')
            .map((l) => '  ' + l)
            .join('\n')
      );
      lines.push('');
    }

    // Show expected output if present
    if (testCase.output !== undefined) {
      lines.push('  \x1b[1mExpected output:\x1b[0m');
      lines.push('  ' + '─'.repeat(56));
      const outputLines = testCase.output.trim().split('\n');
      outputLines.forEach((line, i) => {
        lines.push(`  ${String(i + 1).padStart(3, ' ')} | ${line}`);
      });
      lines.push('  ' + '─'.repeat(56));
      lines.push('');
    }

    // Show the actual error details
    if (error instanceof assert.AssertionError) {
      if (error.message && error.generatedMessage === false) {
        lines.push('  \x1b[1mError:\x1b[0m');
        lines.push(`  \x1b[31m${error.message}\x1b[0m`);
        lines.push('');
      }

      if (error.expected || error.actual) {
        lines.push('  \x1b[1mExpected:\x1b[0m');
        if (typeof error.expected === 'number') {
          lines.push(`  \x1b[32m${error.expected}\x1b[0m`);
        } else {
          const expectedStr = JSON.stringify(error.expected, undefined, 2);
          lines.push('  \x1b[32m' + expectedStr.split('\n').join('\n  \x1b[32m') + '\x1b[0m');
        }
        lines.push('');
        lines.push('  \x1b[1mActual:\x1b[0m');
        if (typeof error.actual === 'number') {
          lines.push(`  \x1b[31m${error.actual}\x1b[0m`);
        } else {
          const actualStr = JSON.stringify(error.actual, undefined, 2);
          lines.push('  \x1b[31m' + actualStr.split('\n').join('\n  \x1b[31m') + '\x1b[0m');
        }
        lines.push('');
      }

      if (error.operator) {
        lines.push(`  \x1b[1mOperator:\x1b[0m ${error.operator}`);
        lines.push('');
      }
    } else if (error.message) {
      lines.push('  \x1b[1mError:\x1b[0m');
      // Extract the main error message, skip stack trace
      const mainMessage = error.message.split('\n')[0];
      lines.push(`  \x1b[31m${mainMessage}\x1b[0m`);
      lines.push('');
    }

    lines.push('  ' + '═'.repeat(58));
    lines.push('');

    return lines;
  }
}
