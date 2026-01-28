/**
 * Codex Workflow Orchestrator
 *
 * Main entry point for Codex-powered test analysis and generation.
 * Coordinates the analysis pipeline and generates reports.
 */

import * as fs from 'fs';
import * as path from 'path';
import { isConfigured } from './client';
import {
  generateFailureReport,
  FailureReport,
  readTestResults,
  extractFailures,
} from './failure-analyzer';
import { generateFixReport, FixReport } from './fix-generator';
import { generateAndWriteTests, GeneratedTest } from './test-generator';

export interface CodexAnalysisResult {
  /** Failure analysis report */
  failureReport: FailureReport;
  /** Fix suggestions report */
  fixReport: FixReport;
  /** Path to generated markdown report */
  reportPath: string;
  /** Total API tokens used */
  tokensUsed: number;
}

export interface AnalysisOptions {
  /** Path to results JSON */
  resultsPath?: string;
  /** Output directory for reports */
  outputDir?: string;
  /** Include screenshot analysis (uses vision API) */
  includeScreenshots?: boolean;
  /** Maximum failures to analyze */
  maxFailures?: number;
  /** Maximum fixes to generate */
  maxFixes?: number;
}

/**
 * Run the full Codex analysis pipeline
 *
 * 1. Parse test results
 * 2. Analyze failures with Codex
 * 3. Identify patterns
 * 4. Generate fix suggestions
 * 5. Output markdown report
 */
export async function runCodexAnalysis(
  options: AnalysisOptions = {}
): Promise<CodexAnalysisResult> {
  const {
    resultsPath,
    outputDir = path.join(__dirname, '../results'),
    includeScreenshots = true,
    maxFailures = 20,
    maxFixes = 10,
  } = options;

  // Check configuration
  if (!isConfigured()) {
    throw new Error(
      'OpenAI API key not configured. Add OPENAI_API_KEY to .env.local'
    );
  }

  console.log('🧠 Starting Codex analysis...\n');

  // Step 1: Generate failure report
  console.log('📊 Analyzing test failures...');
  const failureReport = await generateFailureReport(resultsPath, {
    includeScreenshots,
    maxFailures,
  });

  console.log(
    `\n   Found ${failureReport.summary.failed}/${failureReport.summary.totalTests} failed tests`
  );
  console.log(`   Identified ${failureReport.patterns.length} patterns\n`);

  // Step 2: Generate fix suggestions
  console.log('🔧 Generating fix suggestions...');
  const fixReport = await generateFixReport(
    failureReport.failures,
    failureReport.patterns,
    { maxFixes }
  );

  console.log(`\n   Generated ${fixReport.fixes.length} fix suggestions\n`);

  // Step 3: Generate markdown report
  console.log('📝 Writing report...');
  const reportPath = path.join(outputDir, 'brain-report.md');
  const reportContent = generateMarkdownReport(failureReport, fixReport);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  fs.writeFileSync(reportPath, reportContent, 'utf-8');

  console.log(`\n✅ Report saved to: ${reportPath}\n`);

  return {
    failureReport,
    fixReport,
    reportPath,
    tokensUsed: 0, // TODO: Track actual token usage
  };
}

/**
 * Generate tests for a component using Codex
 */
export async function generateTests(
  componentPath: string,
  options: {
    outputDir?: string;
    category?: string;
    context?: string;
  } = {}
): Promise<GeneratedTest> {
  if (!isConfigured()) {
    throw new Error(
      'OpenAI API key not configured. Add OPENAI_API_KEY to .env.local'
    );
  }

  console.log(`🧪 Generating tests for: ${componentPath}\n`);

  const result = await generateAndWriteTests({
    componentPath,
    outputDir: options.outputDir,
    category: options.category,
    context: options.context,
  });

  console.log(`✅ Generated ${result.testCount} tests: ${result.filePath}\n`);

  return result;
}

/**
 * Quick analysis without fix generation
 * Useful for CI pipelines to get quick failure summary
 */
export async function quickAnalysis(
  resultsPath?: string
): Promise<{ passed: number; failed: number; failuresByPattern: Map<string, number> }> {
  const results = await readTestResults(resultsPath);
  const failures = extractFailures(results);

  // Quick pattern detection without API calls
  const patternCounts = new Map<string, number>();

  for (const failure of failures) {
    const errorType = categorizeError(failure.result.error?.message || '');
    patternCounts.set(errorType, (patternCounts.get(errorType) || 0) + 1);
  }

  let totalTests = 0;
  let passedTests = 0;

  function countTests(suite: { specs?: Array<{ ok: boolean; tests: unknown[] }>; suites?: unknown[] }) {
    const specs = suite.specs as Array<{ ok: boolean; tests: unknown[] }> | undefined;
    if (specs) {
      for (const spec of specs) {
        totalTests += spec.tests.length;
        if (spec.ok) {
          passedTests += spec.tests.length;
        }
      }
    }
    const suites = suite.suites as unknown[] | undefined;
    if (suites) {
      for (const nestedSuite of suites) {
        countTests(nestedSuite as { specs?: Array<{ ok: boolean; tests: unknown[] }>; suites?: unknown[] });
      }
    }
  }

  for (const suite of results.suites) {
    countTests(suite);
  }

  return {
    passed: passedTests,
    failed: totalTests - passedTests,
    failuresByPattern: patternCounts,
  };
}

/**
 * Categorize error by type (without API calls)
 */
function categorizeError(errorMessage: string): string {
  if (errorMessage.includes('Timeout')) {
    return 'Timeout';
  }
  if (errorMessage.includes('waitForURL') || errorMessage.includes('navigation')) {
    return 'Navigation';
  }
  if (errorMessage.includes('locator') || errorMessage.includes('selector')) {
    return 'Element Not Found';
  }
  if (errorMessage.includes('expect') || errorMessage.includes('assertion')) {
    return 'Assertion Failed';
  }
  if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    return 'Network Error';
  }
  return 'Other';
}

/**
 * Generate a markdown report from analysis results
 */
function generateMarkdownReport(
  failureReport: FailureReport,
  fixReport: FixReport
): string {
  const { summary, failures, patterns } = failureReport;
  const { fixes, categories, recommendation } = fixReport;

  let md = `# 🧠 Brain Report - Codex Analysis

Generated: ${new Date().toLocaleString()}

## Summary

| Metric | Value |
|--------|-------|
| Total Tests | ${summary.totalTests} |
| Passed | ${summary.passed} |
| Failed | ${summary.failed} |
| Pass Rate | ${summary.passRate} |
| Projects | ${summary.projects.join(', ')} |

## Recommendation

${recommendation}

---

## Failure Patterns

`;

  if (patterns.length === 0) {
    md += '_No clear patterns identified._\n\n';
  } else {
    for (const pattern of patterns) {
      md += `### ${pattern.pattern}\n\n`;
      md += `- **Affected Tests:** ${pattern.count}\n`;
      md += `- **Suggested Fix:** ${pattern.suggestedFix}\n`;
      md += `- **Tests:** ${pattern.affectedTests.slice(0, 5).join(', ')}${pattern.affectedTests.length > 5 ? '...' : ''}\n\n`;
    }
  }

  md += `---

## Failures by Severity

`;

  const bySeverity = {
    critical: failures.filter((f) => f.severity === 'critical'),
    high: failures.filter((f) => f.severity === 'high'),
    medium: failures.filter((f) => f.severity === 'medium'),
    low: failures.filter((f) => f.severity === 'low'),
  };

  for (const [severity, items] of Object.entries(bySeverity)) {
    if (items.length > 0) {
      const icon =
        severity === 'critical'
          ? '🔴'
          : severity === 'high'
            ? '🟠'
            : severity === 'medium'
              ? '🟡'
              : '🟢';
      md += `### ${icon} ${severity.charAt(0).toUpperCase() + severity.slice(1)} (${items.length})\n\n`;

      for (const item of items) {
        md += `#### ${item.testName}\n\n`;
        md += `- **File:** \`${item.file}:${item.line}\`\n`;
        md += `- **Project:** ${item.project}\n`;
        md += `- **Cause:** ${item.suggestedCause}\n`;
        if (item.screenshotAnalysis) {
          md += `- **Screenshot:** ${item.screenshotAnalysis}\n`;
        }
        md += `- **Error:** \`${item.errorMessage.slice(0, 100)}${item.errorMessage.length > 100 ? '...' : ''}\`\n\n`;
      }
    }
  }

  md += `---

## Suggested Fixes

`;

  if (fixes.length === 0) {
    md += '_No fixes suggested._\n\n';
  } else {
    // Group by category
    if (categories.testFixes.length > 0) {
      md += `### Test Fixes (${categories.testFixes.length})\n\n`;
      for (const fix of categories.testFixes) {
        md += formatFix(fix);
      }
    }

    if (categories.appFixes.length > 0) {
      md += `### App Fixes (${categories.appFixes.length})\n\n`;
      for (const fix of categories.appFixes) {
        md += formatFix(fix);
      }
    }

    if (categories.configFixes.length > 0) {
      md += `### Config/Environment Fixes (${categories.configFixes.length})\n\n`;
      for (const fix of categories.configFixes) {
        md += formatFix(fix);
      }
    }
  }

  md += `---

## Next Steps

1. Review the suggested fixes above
2. Apply high-confidence fixes first
3. Re-run the test suite: \`npm run cycle:pinky\`
4. Iterate until all critical failures are resolved

---

_Generated by Codex Brain - Saving tokens since 2026 🤖_
`;

  return md;
}

/**
 * Format a single fix suggestion for markdown
 */
function formatFix(fix: FixReport['fixes'][0]): string {
  const confidenceIcon =
    fix.confidence === 'high' ? '✅' : fix.confidence === 'medium' ? '⚠️' : '❓';

  let md = `#### ${confidenceIcon} ${fix.description}\n\n`;
  md += `- **File:** \`${fix.filePath}\`\n`;
  md += `- **Confidence:** ${fix.confidence}\n`;
  md += `- **Related:** ${fix.relatedFailure}\n\n`;

  if (fix.diff) {
    md += '```diff\n' + fix.diff + '```\n\n';
  }

  return md;
}
