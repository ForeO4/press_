/**
 * Fix Generator using Codex
 *
 * Takes failure analysis and generates fix suggestions as diffs.
 * Reads relevant source files to provide context-aware fixes.
 */

import * as fs from 'fs';
import * as path from 'path';
import { createChatCompletion, MODELS } from './client';
import { FailureDetail, FailurePattern } from './failure-analyzer';

export interface FixSuggestion {
  /** File to modify */
  filePath: string;
  /** Description of the fix */
  description: string;
  /** Original code snippet */
  original?: string;
  /** Suggested replacement */
  replacement?: string;
  /** Full diff in unified format */
  diff: string;
  /** Confidence level */
  confidence: 'high' | 'medium' | 'low';
  /** Related failure */
  relatedFailure: string;
}

export interface FixReport {
  /** Summary of suggested fixes */
  summary: string;
  /** Individual fix suggestions */
  fixes: FixSuggestion[];
  /** Fixes by category */
  categories: {
    testFixes: FixSuggestion[];
    appFixes: FixSuggestion[];
    configFixes: FixSuggestion[];
  };
  /** Overall recommendation */
  recommendation: string;
  generatedAt: string;
}

const SYSTEM_PROMPT = `You are a code fix generator for Playwright E2E tests and React applications.
Your job is to analyze test failures and suggest specific code fixes.

Guidelines:
1. Prefer minimal, targeted fixes over large refactors
2. Fix test issues when tests are flaky or poorly written
3. Fix app issues when the app has bugs
4. Suggest configuration changes when environments are misconfigured
5. Provide fixes as unified diffs when possible

Be specific and actionable. Include exact code changes.`;

/**
 * Read a source file safely
 */
export function readSourceFile(filePath: string): string | null {
  try {
    // Handle relative paths from test files
    const absolutePath = path.isAbsolute(filePath)
      ? filePath
      : path.resolve(process.cwd(), filePath);

    if (!fs.existsSync(absolutePath)) {
      return null;
    }
    return fs.readFileSync(absolutePath, 'utf-8');
  } catch {
    return null;
  }
}

/**
 * Extract file path from error location
 */
export function extractFilePath(failure: FailureDetail): string | null {
  // Try to extract file path from stack trace
  if (failure.errorStack) {
    const match = failure.errorStack.match(/at\s+.*?\s+\(([^:)]+):\d+:\d+\)/);
    if (match) {
      return match[1];
    }
  }

  // Fall back to test file
  return failure.file;
}

/**
 * Generate a fix for a single failure
 */
export async function generateFix(
  failure: FailureDetail,
  projectRoot: string = process.cwd()
): Promise<FixSuggestion[]> {
  const fixes: FixSuggestion[] = [];

  // Get the test file content
  const testFilePath = path.join(projectRoot, 'pinky/tests', failure.file);
  const testFileContent = readSourceFile(testFilePath);

  // Try to get the error source file
  const errorFilePath = extractFilePath(failure);
  const errorFileContent = errorFilePath ? readSourceFile(errorFilePath) : null;

  // Build the prompt
  const prompt = `Generate a fix for this test failure:

Test: ${failure.testName}
Suite: ${failure.suiteName}
File: ${failure.file}:${failure.line}
Error: ${failure.errorMessage}

${failure.suggestedCause ? `Analysis: ${failure.suggestedCause}` : ''}
${failure.screenshotAnalysis ? `Screenshot: ${failure.screenshotAnalysis}` : ''}

${testFileContent ? `Test file content (excerpt around line ${failure.line}):\n\`\`\`typescript\n${extractContextLines(testFileContent, failure.line, 15)}\n\`\`\`` : ''}

${errorFileContent && errorFilePath ? `Source file (${errorFilePath}):\n\`\`\`typescript\n${errorFileContent.slice(0, 2000)}\n\`\`\`` : ''}

Provide 1-2 specific fixes. For each fix:
1. State which file to modify
2. Describe the fix
3. Show the original code
4. Show the replacement code
5. Rate your confidence (high/medium/low)

Format each fix as:
FILE: <file path>
DESCRIPTION: <what the fix does>
CONFIDENCE: <high/medium/low>
ORIGINAL:
\`\`\`
<original code>
\`\`\`
REPLACEMENT:
\`\`\`
<replacement code>
\`\`\`
---`;

  const response = await createChatCompletion(
    [{ role: 'user', content: prompt }],
    {
      model: MODELS.GPT4O_MINI,
      systemPrompt: SYSTEM_PROMPT,
      temperature: 0.2,
      maxTokens: 2000,
    }
  );

  // Parse fixes from response
  const fixBlocks = response.content.split('---').filter((b) => b.trim());

  for (const block of fixBlocks) {
    const fileMatch = block.match(/FILE:\s*(.+)/i);
    const descMatch = block.match(/DESCRIPTION:\s*(.+)/i);
    const confMatch = block.match(/CONFIDENCE:\s*(\w+)/i);
    const originalMatch = block.match(/ORIGINAL:\s*```[\w]*\n([\s\S]*?)```/i);
    const replacementMatch = block.match(/REPLACEMENT:\s*```[\w]*\n([\s\S]*?)```/i);

    if (fileMatch && descMatch) {
      const original = originalMatch?.[1]?.trim();
      const replacement = replacementMatch?.[1]?.trim();
      const confStr = confMatch?.[1]?.toLowerCase() || 'medium';
      const confidence = ['high', 'medium', 'low'].includes(confStr)
        ? (confStr as 'high' | 'medium' | 'low')
        : 'medium';

      fixes.push({
        filePath: fileMatch[1].trim(),
        description: descMatch[1].trim(),
        original,
        replacement,
        diff: generateUnifiedDiff(original, replacement, fileMatch[1].trim()),
        confidence,
        relatedFailure: failure.testName,
      });
    }
  }

  return fixes;
}

/**
 * Generate fixes based on identified patterns
 */
export async function generatePatternFixes(
  patterns: FailurePattern[]
): Promise<FixSuggestion[]> {
  const fixes: FixSuggestion[] = [];

  for (const pattern of patterns) {
    if (pattern.suggestedFix && pattern.count > 1) {
      // For patterns affecting multiple tests, suggest a systematic fix
      const prompt = `A test pattern is affecting ${pattern.count} tests:

Pattern: ${pattern.pattern}
Affected tests: ${pattern.affectedTests.join(', ')}
Initial suggestion: ${pattern.suggestedFix}

Provide a more detailed fix recommendation. If it requires code changes, show them.
If it's a configuration or environment issue, explain what to check.

Format:
FILE: <file path or "N/A" for non-code fixes>
DESCRIPTION: <detailed fix description>
CONFIDENCE: <high/medium/low>`;

      const response = await createChatCompletion(
        [{ role: 'user', content: prompt }],
        {
          model: MODELS.GPT4O_MINI,
          systemPrompt: SYSTEM_PROMPT,
          temperature: 0.3,
          maxTokens: 1000,
        }
      );

      const fileMatch = response.content.match(/FILE:\s*(.+)/i);
      const descMatch = response.content.match(/DESCRIPTION:\s*([\s\S]+?)(?=CONFIDENCE:|$)/i);
      const confMatch = response.content.match(/CONFIDENCE:\s*(\w+)/i);

      if (descMatch) {
        const confStr = confMatch?.[1]?.toLowerCase() || 'medium';
        const confidence = ['high', 'medium', 'low'].includes(confStr)
          ? (confStr as 'high' | 'medium' | 'low')
          : 'medium';

        fixes.push({
          filePath: fileMatch?.[1]?.trim() || 'N/A',
          description: descMatch[1].trim(),
          diff: '',
          confidence,
          relatedFailure: `Pattern: ${pattern.pattern} (${pattern.count} tests)`,
        });
      }
    }
  }

  return fixes;
}

/**
 * Generate a complete fix report
 */
export async function generateFixReport(
  failures: FailureDetail[],
  patterns: FailurePattern[],
  options: { maxFixes?: number; projectRoot?: string } = {}
): Promise<FixReport> {
  const { maxFixes = 10, projectRoot = process.cwd() } = options;

  // Generate fixes for individual failures (prioritize by severity)
  const sortedFailures = [...failures].sort((a, b) => {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  const fixes: FixSuggestion[] = [];

  // Generate fixes for top failures
  for (const failure of sortedFailures.slice(0, maxFixes)) {
    const failureFixes = await generateFix(failure, projectRoot);
    fixes.push(...failureFixes);
    console.log(`  Generated ${failureFixes.length} fixes for: ${failure.testName}`);
  }

  // Generate pattern-based fixes
  const patternFixes = await generatePatternFixes(patterns);
  fixes.push(...patternFixes);

  // Categorize fixes
  const categories = {
    testFixes: fixes.filter((f) => f.filePath.includes('.pinky.') || f.filePath.includes('/tests/')),
    appFixes: fixes.filter((f) => f.filePath.includes('/src/') || f.filePath.includes('/app/')),
    configFixes: fixes.filter(
      (f) =>
        f.filePath.includes('config') ||
        f.filePath.includes('.env') ||
        f.filePath === 'N/A'
    ),
  };

  // Generate overall recommendation
  const recommendation = generateRecommendation(failures, patterns, fixes);

  return {
    summary: `Generated ${fixes.length} fix suggestions for ${failures.length} failures`,
    fixes,
    categories,
    recommendation,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Extract lines around a target line number
 */
function extractContextLines(
  content: string,
  targetLine: number,
  contextLines: number
): string {
  const lines = content.split('\n');
  const start = Math.max(0, targetLine - contextLines - 1);
  const end = Math.min(lines.length, targetLine + contextLines);
  return lines
    .slice(start, end)
    .map((line, i) => `${start + i + 1}: ${line}`)
    .join('\n');
}

/**
 * Generate a simple unified diff
 */
function generateUnifiedDiff(
  original: string | undefined,
  replacement: string | undefined,
  filePath: string
): string {
  if (!original || !replacement) {
    return '';
  }

  const originalLines = original.split('\n');
  const replacementLines = replacement.split('\n');

  let diff = `--- a/${filePath}\n+++ b/${filePath}\n@@ -1,${originalLines.length} +1,${replacementLines.length} @@\n`;

  for (const line of originalLines) {
    diff += `-${line}\n`;
  }
  for (const line of replacementLines) {
    diff += `+${line}\n`;
  }

  return diff;
}

/**
 * Generate overall recommendation based on analysis
 */
function generateRecommendation(
  failures: FailureDetail[],
  patterns: FailurePattern[],
  fixes: FixSuggestion[]
): string {
  const criticalCount = failures.filter((f) => f.severity === 'critical').length;
  const highConfidenceFixes = fixes.filter((f) => f.confidence === 'high').length;

  if (criticalCount > 0) {
    return `⚠️ ${criticalCount} critical failures require immediate attention. Focus on high-confidence fixes first.`;
  }

  if (patterns.length > 0 && patterns[0].count > 3) {
    return `📊 A pattern affects ${patterns[0].count} tests: "${patterns[0].pattern}". Fixing this pattern will resolve multiple failures.`;
  }

  if (highConfidenceFixes > 0) {
    return `✅ ${highConfidenceFixes} high-confidence fixes available. These are likely to resolve the issues.`;
  }

  return `🔍 Review the suggested fixes and apply them based on your understanding of the codebase.`;
}
