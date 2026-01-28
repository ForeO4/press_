/**
 * Failure Analyzer using Codex
 *
 * Parses pinky-results.json, analyzes failed tests with screenshots,
 * and produces structured failure reports.
 */

import * as fs from 'fs';
import * as path from 'path';
import { createChatCompletion, createVisionCompletion, MODELS } from './client';

// Types matching Playwright JSON reporter output
interface PlaywrightResult {
  config: {
    projects: Array<{ name: string; id: string }>;
  };
  suites: PlaywrightSuite[];
}

interface PlaywrightSuite {
  title: string;
  file: string;
  suites?: PlaywrightSuite[];
  specs?: PlaywrightSpec[];
}

interface PlaywrightSpec {
  title: string;
  file: string;
  line: number;
  ok: boolean;
  tests: PlaywrightTest[];
}

interface PlaywrightTest {
  projectName: string;
  expectedStatus: string;
  status: string;
  results: PlaywrightTestResult[];
}

interface PlaywrightTestResult {
  status: 'passed' | 'failed' | 'timedOut' | 'skipped';
  duration: number;
  retry: number;
  error?: {
    message: string;
    stack?: string;
    snippet?: string;
  };
  attachments?: Array<{
    name: string;
    contentType: string;
    path: string;
  }>;
}

// Output types
export interface FailureReport {
  summary: FailureSummary;
  failures: FailureDetail[];
  patterns: FailurePattern[];
  generatedAt: string;
}

export interface FailureSummary {
  totalTests: number;
  passed: number;
  failed: number;
  passRate: string;
  projects: string[];
}

export interface FailureDetail {
  testName: string;
  suiteName: string;
  file: string;
  line: number;
  project: string;
  errorMessage: string;
  errorStack?: string;
  screenshotPath?: string;
  screenshotAnalysis?: string;
  suggestedCause: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export interface FailurePattern {
  pattern: string;
  count: number;
  affectedTests: string[];
  suggestedFix: string;
}

const SYSTEM_PROMPT = `You are a test failure analyst for Playwright E2E tests.
Your job is to analyze test failures and identify:
1. The root cause of the failure
2. Whether it's a test issue, app bug, or environment problem
3. Patterns across multiple failures
4. Suggested fixes

Be concise but thorough. Focus on actionable insights.`;

/**
 * Read and parse pinky-results.json
 */
export async function readTestResults(
  resultsPath?: string
): Promise<PlaywrightResult> {
  const defaultPath = path.join(__dirname, '../results/pinky-results.json');
  const filePath = resultsPath || defaultPath;

  if (!fs.existsSync(filePath)) {
    throw new Error(`Results file not found: ${filePath}`);
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content);
}

/**
 * Extract failed tests from results
 */
export function extractFailures(
  results: PlaywrightResult
): Array<{
  spec: PlaywrightSpec;
  test: PlaywrightTest;
  result: PlaywrightTestResult;
  suitePath: string[];
}> {
  const failures: Array<{
    spec: PlaywrightSpec;
    test: PlaywrightTest;
    result: PlaywrightTestResult;
    suitePath: string[];
  }> = [];

  function traverseSuite(suite: PlaywrightSuite, suitePath: string[] = []) {
    const currentPath = [...suitePath, suite.title];

    // Check specs in this suite
    if (suite.specs) {
      for (const spec of suite.specs) {
        if (!spec.ok) {
          for (const test of spec.tests) {
            // Get the final result (last retry)
            const finalResult = test.results[test.results.length - 1];
            if (finalResult && finalResult.status === 'failed') {
              failures.push({
                spec,
                test,
                result: finalResult,
                suitePath: currentPath,
              });
            }
          }
        }
      }
    }

    // Recurse into nested suites
    if (suite.suites) {
      for (const nestedSuite of suite.suites) {
        traverseSuite(nestedSuite, currentPath);
      }
    }
  }

  for (const suite of results.suites) {
    traverseSuite(suite);
  }

  return failures;
}

/**
 * Read screenshot as base64
 */
export function readScreenshotBase64(screenshotPath: string): string | null {
  try {
    if (!fs.existsSync(screenshotPath)) {
      return null;
    }
    const buffer = fs.readFileSync(screenshotPath);
    return buffer.toString('base64');
  } catch {
    return null;
  }
}

/**
 * Analyze a single failure with Codex
 */
export async function analyzeFailure(
  failure: {
    spec: PlaywrightSpec;
    test: PlaywrightTest;
    result: PlaywrightTestResult;
    suitePath: string[];
  },
  includeScreenshot = true
): Promise<FailureDetail> {
  const { spec, test, result, suitePath } = failure;
  const errorMessage = result.error?.message || 'Unknown error';
  const errorStack = result.error?.stack;

  // Find screenshot attachment
  const screenshotAttachment = result.attachments?.find(
    (a) => a.name === 'screenshot' && a.contentType === 'image/png'
  );

  let screenshotAnalysis: string | undefined;

  // Analyze screenshot if available
  if (includeScreenshot && screenshotAttachment?.path) {
    const imageBase64 = readScreenshotBase64(screenshotAttachment.path);
    if (imageBase64) {
      const visionPrompt = `Analyze this screenshot from a failed Playwright test.
Test: ${spec.title}
Error: ${errorMessage}

What do you see? Is there:
1. An error message visible?
2. Unexpected UI state?
3. Loading state that didn't resolve?
4. Missing elements?

Be concise (2-3 sentences max).`;

      try {
        const visionResponse = await createVisionCompletion(visionPrompt, imageBase64, {
          maxTokens: 500,
        });
        screenshotAnalysis = visionResponse.content;
      } catch (error) {
        console.warn('Failed to analyze screenshot:', error);
      }
    }
  }

  // Analyze the failure
  const analysisPrompt = `Analyze this test failure:

Test: ${spec.title}
Suite: ${suitePath.join(' > ')}
Project: ${test.projectName}
File: ${spec.file}:${spec.line}

Error:
${errorMessage}

${errorStack ? `Stack trace:\n${errorStack.slice(0, 1000)}` : ''}

${screenshotAnalysis ? `Screenshot analysis:\n${screenshotAnalysis}` : ''}

Provide:
1. Suggested cause (one sentence)
2. Severity (critical/high/medium/low)

Format response as:
CAUSE: <cause>
SEVERITY: <severity>`;

  const response = await createChatCompletion(
    [{ role: 'user', content: analysisPrompt }],
    {
      model: MODELS.GPT4O_MINI,
      systemPrompt: SYSTEM_PROMPT,
      temperature: 0.2,
      maxTokens: 500,
    }
  );

  // Parse response
  const causeMatch = response.content.match(/CAUSE:\s*(.+)/i);
  const severityMatch = response.content.match(/SEVERITY:\s*(\w+)/i);

  const suggestedCause = causeMatch?.[1]?.trim() || 'Unable to determine cause';
  const severityStr = severityMatch?.[1]?.toLowerCase() || 'medium';
  const severity = ['critical', 'high', 'medium', 'low'].includes(severityStr)
    ? (severityStr as 'critical' | 'high' | 'medium' | 'low')
    : 'medium';

  return {
    testName: spec.title,
    suiteName: suitePath.join(' > '),
    file: spec.file,
    line: spec.line,
    project: test.projectName,
    errorMessage,
    errorStack,
    screenshotPath: screenshotAttachment?.path,
    screenshotAnalysis,
    suggestedCause,
    severity,
  };
}

/**
 * Identify patterns across failures
 */
export async function identifyPatterns(
  failures: FailureDetail[]
): Promise<FailurePattern[]> {
  if (failures.length === 0) {
    return [];
  }

  const failureSummaries = failures.map((f) => ({
    test: f.testName,
    error: f.errorMessage.slice(0, 200),
    cause: f.suggestedCause,
  }));

  const prompt = `Analyze these test failures and identify common patterns:

${JSON.stringify(failureSummaries, null, 2)}

Identify 1-3 patterns. For each pattern provide:
1. Pattern name (short description)
2. Count of affected tests
3. List of affected test names
4. Suggested fix (one sentence)

Format each pattern as:
PATTERN: <name>
COUNT: <number>
TESTS: <comma-separated test names>
FIX: <suggested fix>

---`;

  const response = await createChatCompletion(
    [{ role: 'user', content: prompt }],
    {
      model: MODELS.GPT4O_MINI,
      systemPrompt: SYSTEM_PROMPT,
      temperature: 0.2,
      maxTokens: 1000,
    }
  );

  // Parse patterns from response
  const patterns: FailurePattern[] = [];
  const patternBlocks = response.content.split('---').filter((b) => b.trim());

  for (const block of patternBlocks) {
    const patternMatch = block.match(/PATTERN:\s*(.+)/i);
    const countMatch = block.match(/COUNT:\s*(\d+)/i);
    const testsMatch = block.match(/TESTS:\s*(.+)/i);
    const fixMatch = block.match(/FIX:\s*(.+)/i);

    if (patternMatch && countMatch) {
      patterns.push({
        pattern: patternMatch[1].trim(),
        count: parseInt(countMatch[1], 10),
        affectedTests: testsMatch?.[1]?.split(',').map((t) => t.trim()) || [],
        suggestedFix: fixMatch?.[1]?.trim() || 'No fix suggested',
      });
    }
  }

  return patterns;
}

/**
 * Generate a complete failure report
 */
export async function generateFailureReport(
  resultsPath?: string,
  options: { includeScreenshots?: boolean; maxFailures?: number } = {}
): Promise<FailureReport> {
  const { includeScreenshots = true, maxFailures = 20 } = options;

  // Read results
  const results = await readTestResults(resultsPath);

  // Extract failures
  const allFailures = extractFailures(results);

  // Calculate summary
  let totalTests = 0;
  let passedTests = 0;

  function countTests(suite: PlaywrightSuite) {
    if (suite.specs) {
      for (const spec of suite.specs) {
        totalTests += spec.tests.length;
        if (spec.ok) {
          passedTests += spec.tests.length;
        }
      }
    }
    if (suite.suites) {
      for (const nestedSuite of suite.suites) {
        countTests(nestedSuite);
      }
    }
  }

  for (const suite of results.suites) {
    countTests(suite);
  }

  const summary: FailureSummary = {
    totalTests,
    passed: passedTests,
    failed: totalTests - passedTests,
    passRate: `${((passedTests / totalTests) * 100).toFixed(1)}%`,
    projects: results.config.projects.map((p) => p.name),
  };

  // Analyze failures (limit to prevent excessive API calls)
  const failuresToAnalyze = allFailures.slice(0, maxFailures);
  const failures: FailureDetail[] = [];

  for (const failure of failuresToAnalyze) {
    const detail = await analyzeFailure(failure, includeScreenshots);
    failures.push(detail);
    console.log(`  Analyzed: ${detail.testName} [${detail.severity}]`);
  }

  // Identify patterns
  const patterns = await identifyPatterns(failures);

  return {
    summary,
    failures,
    patterns,
    generatedAt: new Date().toISOString(),
  };
}
