/**
 * Codex Integration Module
 *
 * Public API for Codex-powered test analysis and generation.
 */

// Client
export { isConfigured, MODELS, CodexError } from './client';

// Failure Analysis
export {
  generateFailureReport,
  readTestResults,
  extractFailures,
  type FailureReport,
  type FailureDetail,
  type FailurePattern,
  type FailureSummary,
} from './failure-analyzer';

// Fix Generation
export {
  generateFixReport,
  generateFix,
  type FixReport,
  type FixSuggestion,
} from './fix-generator';

// Test Generation
export {
  generateTests as generateTestFile,
  generateAndWriteTests,
  batchGenerateTests,
  type GeneratedTest,
} from './test-generator';

// Workflow
export {
  runCodexAnalysis,
  generateTests,
  quickAnalysis,
  type CodexAnalysisResult,
  type AnalysisOptions,
} from './workflow';
