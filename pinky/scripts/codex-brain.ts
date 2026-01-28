#!/usr/bin/env npx ts-node
/**
 * Codex Brain CLI
 *
 * "The same thing we do every night, Pinky - analyze the tests!"
 *
 * Usage:
 *   npx ts-node pinky/scripts/codex-brain.ts
 *   npx ts-node pinky/scripts/codex-brain.ts --quick
 *   npx ts-node pinky/scripts/codex-brain.ts --no-screenshots
 *   npx ts-node pinky/scripts/codex-brain.ts --generate src/components/Button.tsx
 */

import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

import { runCodexAnalysis, quickAnalysis, generateTests } from '../codex/workflow';

async function main() {
  const args = process.argv.slice(2);

  // Parse arguments
  const isQuick = args.includes('--quick');
  const noScreenshots = args.includes('--no-screenshots');
  const generateIdx = args.indexOf('--generate');
  const generatePath = generateIdx !== -1 ? args[generateIdx + 1] : null;

  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║           🧠 CODEX BRAIN - Test Analysis Suite            ║');
  console.log('║     "Are you pondering what I\'m pondering, Pinky?"       ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  try {
    if (generatePath) {
      // Test generation mode
      console.log(`Mode: Test Generation\n`);
      const result = await generateTests(generatePath, {
        category: 'generated',
      });
      console.log(`Generated ${result.testCount} tests for ${result.componentName}`);
      console.log(`Output: ${result.filePath}`);
      return;
    }

    if (isQuick) {
      // Quick analysis mode (no API calls)
      console.log('Mode: Quick Analysis (no API calls)\n');
      const result = await quickAnalysis();
      console.log(`Results: ${result.passed} passed, ${result.failed} failed\n`);
      console.log('Failures by pattern:');
      Array.from(result.failuresByPattern.entries()).forEach(([pattern, count]) => {
        console.log(`  ${pattern}: ${count}`);
      });
      return;
    }

    // Full analysis mode
    console.log('Mode: Full Analysis\n');
    const result = await runCodexAnalysis({
      includeScreenshots: !noScreenshots,
      maxFailures: 20,
      maxFixes: 10,
    });

    console.log('═══════════════════════════════════════════════════════════');
    console.log('                       SUMMARY');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`Total Tests:    ${result.failureReport.summary.totalTests}`);
    console.log(`Passed:         ${result.failureReport.summary.passed}`);
    console.log(`Failed:         ${result.failureReport.summary.failed}`);
    console.log(`Pass Rate:      ${result.failureReport.summary.passRate}`);
    console.log('');
    console.log(`Patterns Found: ${result.failureReport.patterns.length}`);
    console.log(`Fixes Suggested: ${result.fixReport.fixes.length}`);
    console.log('');
    console.log(`📝 Full report: ${result.reportPath}`);
    console.log('');

    // Show recommendation
    console.log('═══════════════════════════════════════════════════════════');
    console.log('                    RECOMMENDATION');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(result.fixReport.recommendation);
    console.log('');

    // Show top patterns
    if (result.failureReport.patterns.length > 0) {
      console.log('═══════════════════════════════════════════════════════════');
      console.log('                    TOP PATTERNS');
      console.log('═══════════════════════════════════════════════════════════');
      for (const pattern of result.failureReport.patterns.slice(0, 3)) {
        console.log(`• ${pattern.pattern} (${pattern.count} tests)`);
        console.log(`  Fix: ${pattern.suggestedFix}`);
        console.log('');
      }
    }

    // Show high-confidence fixes
    const highConfFixes = result.fixReport.fixes.filter(
      (f) => f.confidence === 'high'
    );
    if (highConfFixes.length > 0) {
      console.log('═══════════════════════════════════════════════════════════');
      console.log('                 HIGH-CONFIDENCE FIXES');
      console.log('═══════════════════════════════════════════════════════════');
      for (const fix of highConfFixes.slice(0, 3)) {
        console.log(`✅ ${fix.description}`);
        console.log(`   File: ${fix.filePath}`);
        console.log(`   For: ${fix.relatedFailure}`);
        console.log('');
      }
    }

    console.log('═══════════════════════════════════════════════════════════');
    console.log('                    NEXT STEPS');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('1. Review the full report at pinky/results/brain-report.md');
    console.log('2. Apply suggested fixes to your codebase');
    console.log('3. Re-run tests: npm run cycle:pinky');
    console.log('4. Repeat until green! 🎉');
    console.log('');
    console.log('"Narf!" - Pinky\n');

  } catch (error) {
    console.error('\n❌ Analysis failed:', error);

    if (error instanceof Error && error.message.includes('OPENAI_API_KEY')) {
      console.error('\n💡 Tip: Add your OpenAI API key to .env.local:');
      console.error('   OPENAI_API_KEY=sk-your-key-here\n');
    }

    process.exit(1);
  }
}

main();
