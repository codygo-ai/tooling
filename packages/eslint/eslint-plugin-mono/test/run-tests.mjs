import { spawn } from 'node:child_process';
import { readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';

const testDir = import.meta.dirname;

/**
 * Recursively find all test files
 */
async function findTestFiles(dir) {
  const files = [];
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      const subFiles = await findTestFiles(fullPath);
      files.push(...subFiles);
    } else if (entry.isFile() && entry.name.endsWith('.test.mjs')) {
      files.push(fullPath);
    }
  }

  return files;
}

// Find all test files
const testFiles = await findTestFiles(testDir);

console.log('\n\x1b[1mRunning ESLint Plugin Tests\x1b[0m');
console.log('═'.repeat(60));
console.log('');

let totalPassed = 0;
let totalFailed = 0;
const failedFiles = [];

// Run each test file individually to capture output
for (const testFilePath of testFiles.sort()) {
  // Suppress Node's test runner output by capturing it
  const result = await new Promise((resolve) => {
    const child = spawn('node', ['--test', testFilePath], {
      cwd: testDir,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, NODE_NO_WARNINGS: '1' },
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      resolve({
        code,
        stdout,
        stderr,
        testFilePath,
      });
    });
  });

  // Extract relative path for display
  const relativePath = relative(testDir, testFilePath);

  // Check if test passed (exit code 0) or failed (non-zero)
  if (result.code === 0) {
    totalPassed++;
    // Only show file name for passed tests, not the full output
    console.log(`\x1b[32m✓\x1b[0m ${relativePath}`);
  } else {
    totalFailed++;
    failedFiles.push({ testFile: relativePath, result });
    console.log(`\x1b[31m✗\x1b[0m ${relativePath}`);

    // Show our enhanced output (from EnhancedRuleTester - goes to stderr)
    // EnhancedRuleTester outputs directly to stderr via console.error
    const output = result.stderr || result.stdout || '';

    if (output) {
      const lines = output.split('\n');
      const cleanLines = [];
      let inStructuredBlock = false;
      let inEnhancedOutput = false;
      let foundEnhancedOutput = false;

      for (const line of lines) {
        const trimmed = line.trim();

        // Detect EnhancedRuleTester output start
        if (
          trimmed.includes('Rule:') ||
          trimmed.includes('Test Type:') ||
          trimmed.includes('Test Case:') ||
          trimmed.includes('Code being tested:') ||
          trimmed.includes('Test Failure Details')
        ) {
          inEnhancedOutput = true;
          foundEnhancedOutput = true;
        }

        // Skip Node test runner structured output blocks (TAP format)
        if (
          !inEnhancedOutput &&
          (trimmed.startsWith('duration_ms:') ||
            trimmed.startsWith('location:') ||
            trimmed.startsWith('failureType:') ||
            trimmed.startsWith('exitCode:') ||
            trimmed.startsWith('signal:') ||
            (trimmed.startsWith('error:') &&
              !trimmed.includes('Test') &&
              !trimmed.includes('Rule')) ||
            trimmed.startsWith('code:') ||
            trimmed === '---' ||
            trimmed === '...')
        ) {
          inStructuredBlock = true;
          continue;
        }

        // End of structured block
        if (inStructuredBlock && trimmed === '') {
          inStructuredBlock = false;
          continue;
        }

        if (inStructuredBlock && !inEnhancedOutput) {
          continue;
        }

        // Once in EnhancedRuleTester output, keep everything until stack traces
        if (inEnhancedOutput) {
          // Stop at stack traces
          if (
            (line.includes('at ') &&
              (line.includes('node_modules') || line.includes('node:internal'))) ||
            line.includes('ModuleLoader') ||
            line.includes('testInvalidTemplate')
          ) {
            break;
          }
          cleanLines.push(line);
          continue;
        }

        // Keep EnhancedRuleTester patterns even if not yet detected
        if (
          trimmed.startsWith('Rule:') ||
          trimmed.startsWith('Test Type:') ||
          trimmed.startsWith('Test Case:') ||
          trimmed.startsWith('Code being tested:') ||
          trimmed.startsWith('Filename:') ||
          trimmed.startsWith('Expected errors:') ||
          trimmed.startsWith('Expected output:') ||
          trimmed.startsWith('Expected:') ||
          trimmed.startsWith('Actual:') ||
          trimmed.startsWith('Error:') ||
          trimmed.startsWith('Operator:') ||
          trimmed.startsWith('═') ||
          trimmed.startsWith('─') ||
          /^\s+\d+\s+\|/.test(trimmed) || // Line numbers: "   1 | code"
          /^\s+\[Valid\]/.test(trimmed) || // [Valid] labels
          /^\s+\[Invalid\]/.test(trimmed) || // [Invalid] labels
          /^\s+✓/.test(trimmed) || // Checkmarks
          /^\s+✗/.test(trimmed) || // X marks
          /^\s+❌/.test(trimmed) || // Failure emoji
          /^\s+✅/.test(trimmed) // Success emoji
        ) {
          foundEnhancedOutput = true;
          cleanLines.push(line);
          continue;
        }

        // Filter out Node.js test runner noise, but keep error messages
        const isErrorLine =
          trimmed.includes('Error:') ||
          trimmed.includes('Cannot find') ||
          trimmed.includes('ERR_') ||
          (trimmed.startsWith('#') && (trimmed.includes('Error') || trimmed.includes('at ')));

        if (
          !isErrorLine &&
          (line.includes('Node.js v') ||
            line.includes('TAP version') ||
            (trimmed.startsWith('#') && !trimmed.includes('Error') && !trimmed.includes('at ')) ||
            trimmed.startsWith('ok ') ||
            trimmed.startsWith('not ok ') ||
            trimmed.startsWith('ℹ ') ||
            (line.includes('node:internal/') && !line.includes('Error:')) ||
            line.includes('at ModuleLoader') ||
            line.includes('at testInvalidTemplate') ||
            line.includes('at EnhancedRuleTester') ||
            line.includes('at RuleTester') ||
            line.includes('Subtest:') ||
            (trimmed === '' &&
              cleanLines.length > 0 &&
              cleanLines[cleanLines.length - 1].trim() === ''))
        ) {
          continue;
        }

        // Keep useful error messages if no EnhancedRuleTester output found
        if (!foundEnhancedOutput && trimmed !== '') {
          // Keep module errors, assertion errors, and useful messages
          const isUsefulError =
            trimmed.includes('Cannot find package') ||
            trimmed.includes('Cannot find module') ||
            trimmed.includes('ERR_MODULE_NOT_FOUND') ||
            trimmed.includes('ERR_PACKAGE_PATH_NOT_EXPORTED') ||
            trimmed.includes('!==') ||
            trimmed.includes('===') ||
            trimmed.includes('AssertionError') ||
            trimmed.includes('Error:') ||
            (trimmed.startsWith('#') && (trimmed.includes('Error') || trimmed.includes('at '))) ||
            (trimmed.length > 10 &&
              trimmed.length < 300 &&
              !line.includes('node:internal/modules') &&
              !line.includes('ModuleLoader') &&
              !line.includes('TAP version'));

          if (isUsefulError) {
            cleanLines.push(line);
          }
        }
      }

      // Remove trailing empty lines
      while (cleanLines.length > 0 && cleanLines[cleanLines.length - 1].trim() === '') {
        cleanLines.pop();
      }

      if (cleanLines.length > 0) {
        console.log('');
        console.log(cleanLines.join('\n'));
        console.log('');
      }
    }
  }
}

// Summary
console.log('');
console.log('═'.repeat(60));
console.log('\x1b[1mTest Summary\x1b[0m');
console.log('═'.repeat(60));
console.log(`Total tests: ${testFiles.length}`);
console.log(`\x1b[32mPassed: ${totalPassed}\x1b[0m`);
if (totalFailed > 0) {
  console.log(`\x1b[31mFailed: ${totalFailed}\x1b[0m`);
  console.log('');
  console.log('\x1b[1mFailed tests:\x1b[0m');
  for (const { testFile } of failedFiles) {
    console.log(`  \x1b[31m✗\x1b[0m ${testFile}`);
  }
  process.exit(1);
} else {
  console.log(`\x1b[32m✓ All tests passed!\x1b[0m`);
  process.exit(0);
}
