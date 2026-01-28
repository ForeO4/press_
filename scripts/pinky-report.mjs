#!/usr/bin/env node

/**
 * Pinky Report Generator
 *
 * Parses Playwright JSON output and generates an actionable markdown report.
 *
 * Usage:
 *   node scripts/pinky-report.mjs
 *
 * Output:
 *   pinky/PINKY_REPORT.md
 */

import fs from 'fs';
import path from 'path';

const RESULTS_PATH = './pinky/results/pinky-results.json';
const REPORT_PATH = './pinky/PINKY_REPORT.md';
const SCREENSHOTS_DIR = './pinky/results/screenshots';

/**
 * Main report generation function
 */
async function generateReport() {
  console.log('[Pinky Report] Starting report generation...');

  // Check if results file exists
  if (!fs.existsSync(RESULTS_PATH)) {
    console.error(`[Pinky Report] Results file not found: ${RESULTS_PATH}`);
    console.error('[Pinky Report] Run "npm run cycle:pinky" first to generate test results.');
    process.exit(1);
  }

  // Read and parse results
  const resultsJson = fs.readFileSync(RESULTS_PATH, 'utf-8');
  const results = JSON.parse(resultsJson);

  // Generate report sections
  const report = [
    generateHeader(results),
    generateSummary(results),
    generateFailures(results),
    generateSlowTests(results),
    generateFlakyTests(results),
    generateScreenshots(),
    generateRecommendations(results),
    generateFooter(),
  ].join('\n\n');

  // Write report
  fs.writeFileSync(REPORT_PATH, report);
  console.log(`[Pinky Report] Report generated: ${REPORT_PATH}`);

  // Print summary to console
  printConsoleSummary(results);
}

/**
 * Generate report header
 */
function generateHeader(results) {
  const timestamp = new Date().toISOString();
  const duration = results.stats?.duration
    ? `${(results.stats.duration / 1000).toFixed(1)}s`
    : 'N/A';

  return `# Pinky Test Report

> "Gee, Brain, what do you want to do tonight?"
> "The same thing we do every night, Pinky - try to test the app!"

**Generated:** ${timestamp}
**Duration:** ${duration}
**Config:** pinky/pinky.config.ts`;
}

/**
 * Generate summary table
 */
function generateSummary(results) {
  const stats = results.stats || {};
  const suites = results.suites || [];

  // Count tests from suites
  let passed = 0;
  let failed = 0;
  let skipped = 0;
  let flaky = 0;

  function countTests(suite) {
    if (suite.specs) {
      for (const spec of suite.specs) {
        if (spec.tests) {
          for (const test of spec.tests) {
            const status = test.status || test.results?.[0]?.status;
            if (status === 'passed' || status === 'expected') passed++;
            else if (status === 'failed' || status === 'unexpected') failed++;
            else if (status === 'skipped') skipped++;
            else if (status === 'flaky') flaky++;
          }
        }
      }
    }
    if (suite.suites) {
      for (const child of suite.suites) {
        countTests(child);
      }
    }
  }

  for (const suite of suites) {
    countTests(suite);
  }

  // Use stats if available, otherwise use counted values
  passed = stats.expected ?? passed;
  failed = stats.unexpected ?? failed;
  skipped = stats.skipped ?? skipped;
  flaky = stats.flaky ?? flaky;

  const total = passed + failed + skipped + flaky;
  const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0.0';

  let status = '🟢 ALL PASSING';
  if (failed > 0) status = '🔴 FAILURES DETECTED';
  else if (flaky > 0) status = '🟡 FLAKY TESTS DETECTED';

  return `## Summary

| Metric | Value |
|--------|-------|
| **Status** | ${status} |
| **Total Tests** | ${total} |
| **Passed** | ${passed} ✅ |
| **Failed** | ${failed} ❌ |
| **Flaky** | ${flaky} ⚠️ |
| **Skipped** | ${skipped} ⏭️ |
| **Pass Rate** | ${passRate}% |`;
}

/**
 * Generate detailed failure analysis
 */
function generateFailures(results) {
  const failures = [];

  function findFailures(suite, suitePath = '') {
    const currentPath = suitePath
      ? `${suitePath} > ${suite.title || 'Suite'}`
      : suite.title || 'Suite';

    if (suite.specs) {
      for (const spec of suite.specs) {
        if (spec.tests) {
          for (const test of spec.tests) {
            const result = test.results?.[0];
            const status = test.status || result?.status;

            if (status === 'failed' || status === 'unexpected') {
              failures.push({
                title: spec.title,
                suite: currentPath,
                error: result?.error?.message || 'Unknown error',
                stack: result?.error?.stack || '',
                duration: result?.duration || 0,
              });
            }
          }
        }
      }
    }

    if (suite.suites) {
      for (const child of suite.suites) {
        findFailures(child, currentPath);
      }
    }
  }

  for (const suite of results.suites || []) {
    findFailures(suite);
  }

  if (failures.length === 0) {
    return `## Failures

No failures detected. 🎉`;
  }

  let md = `## Failures

Found ${failures.length} failing test(s):

`;

  for (const failure of failures) {
    md += `### ❌ ${failure.title}

**Suite:** ${failure.suite}
**Duration:** ${failure.duration}ms

\`\`\`
${failure.error}
\`\`\`

`;
  }

  return md;
}

/**
 * Generate slow tests report
 */
function generateSlowTests(results) {
  const tests = [];
  const SLOW_THRESHOLD = 10000; // 10 seconds

  function collectTests(suite, suitePath = '') {
    const currentPath = suitePath
      ? `${suitePath} > ${suite.title || 'Suite'}`
      : suite.title || 'Suite';

    if (suite.specs) {
      for (const spec of suite.specs) {
        if (spec.tests) {
          for (const test of spec.tests) {
            const result = test.results?.[0];
            const duration = result?.duration || 0;

            if (duration >= SLOW_THRESHOLD) {
              tests.push({
                title: spec.title,
                suite: currentPath,
                duration,
              });
            }
          }
        }
      }
    }

    if (suite.suites) {
      for (const child of suite.suites) {
        collectTests(child, currentPath);
      }
    }
  }

  for (const suite of results.suites || []) {
    collectTests(suite);
  }

  if (tests.length === 0) {
    return `## Slow Tests

No tests exceeded the ${SLOW_THRESHOLD / 1000}s threshold. ⚡`;
  }

  // Sort by duration descending
  tests.sort((a, b) => b.duration - a.duration);

  let md = `## Slow Tests

${tests.length} test(s) exceeded ${SLOW_THRESHOLD / 1000}s:

| Test | Duration |
|------|----------|
`;

  for (const test of tests) {
    md += `| ${test.title} | ${(test.duration / 1000).toFixed(1)}s |\n`;
  }

  return md;
}

/**
 * Generate flaky tests report
 */
function generateFlakyTests(results) {
  const flaky = [];

  function findFlaky(suite, suitePath = '') {
    const currentPath = suitePath
      ? `${suitePath} > ${suite.title || 'Suite'}`
      : suite.title || 'Suite';

    if (suite.specs) {
      for (const spec of suite.specs) {
        if (spec.tests) {
          for (const test of spec.tests) {
            if (test.status === 'flaky' || (test.results && test.results.length > 1)) {
              flaky.push({
                title: spec.title,
                suite: currentPath,
                attempts: test.results?.length || 1,
              });
            }
          }
        }
      }
    }

    if (suite.suites) {
      for (const child of suite.suites) {
        findFlaky(child, currentPath);
      }
    }
  }

  for (const suite of results.suites || []) {
    findFlaky(suite);
  }

  if (flaky.length === 0) {
    return `## Flaky Tests

No flaky tests detected. 🎯`;
  }

  let md = `## Flaky Tests

${flaky.length} flaky test(s) detected:

| Test | Attempts |
|------|----------|
`;

  for (const test of flaky) {
    md += `| ${test.title} | ${test.attempts} |\n`;
  }

  md += `
> ⚠️ Flaky tests indicate potential race conditions or timing issues.`;

  return md;
}

/**
 * Generate screenshot index
 */
function generateScreenshots() {
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    return `## Screenshots

No screenshots found. Ensure tests captured screenshots to \`pinky/results/screenshots/\`.`;
  }

  const files = fs.readdirSync(SCREENSHOTS_DIR).filter((f) => f.endsWith('.png'));

  if (files.length === 0) {
    return `## Screenshots

No screenshots captured.`;
  }

  // Group by test name (prefix before --)
  const groups = {};
  for (const file of files) {
    const match = file.match(/^([^-]+)--/);
    const group = match ? match[1] : 'misc';
    if (!groups[group]) groups[group] = [];
    groups[group].push(file);
  }

  let md = `## Screenshots

${files.length} screenshot(s) captured:

`;

  for (const [group, groupFiles] of Object.entries(groups)) {
    md += `### ${group}\n\n`;
    for (const file of groupFiles.sort()) {
      md += `- [\`${file}\`](./results/screenshots/${file})\n`;
    }
    md += '\n';
  }

  md += `
> View the HTML report at \`pinky/html-report/index.html\` for visual inspection.`;

  return md;
}

/**
 * Generate recommendations based on results
 */
function generateRecommendations(results) {
  const recommendations = [];

  const stats = results.stats || {};
  const failed = stats.unexpected ?? 0;
  const flaky = stats.flaky ?? 0;

  if (failed > 0) {
    recommendations.push(
      '🔧 **Fix failing tests** before merging. Check the Failures section above for details.'
    );
  }

  if (flaky > 0) {
    recommendations.push(
      '⏱️ **Investigate flaky tests** for race conditions. Consider adding explicit waits or improving selectors.'
    );
  }

  if (recommendations.length === 0) {
    recommendations.push('✨ All tests passing! Ready to merge.');
  }

  return `## Recommendations

${recommendations.map((r) => `- ${r}`).join('\n')}`;
}

/**
 * Generate footer
 */
function generateFooter() {
  return `---

*Generated by Pinky Report Generator*
*"NARF!" - Pinky*`;
}

/**
 * Print summary to console
 */
function printConsoleSummary(results) {
  const stats = results.stats || {};

  console.log('\n' + '='.repeat(50));
  console.log('PINKY TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`Passed:  ${stats.expected ?? 0}`);
  console.log(`Failed:  ${stats.unexpected ?? 0}`);
  console.log(`Flaky:   ${stats.flaky ?? 0}`);
  console.log(`Skipped: ${stats.skipped ?? 0}`);
  console.log('='.repeat(50));

  if ((stats.unexpected ?? 0) > 0) {
    console.log('❌ FAILURES DETECTED - See PINKY_REPORT.md for details');
  } else {
    console.log('✅ ALL TESTS PASSING');
  }

  console.log('');
}

// Run
generateReport().catch((err) => {
  console.error('[Pinky Report] Error:', err);
  process.exit(1);
});
