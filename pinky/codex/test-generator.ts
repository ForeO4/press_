/**
 * Test Generator using Codex
 *
 * Generates Pinky test skeletons from component source code.
 * Outputs `.pinky.ts` files that can be run with Playwright.
 */

import * as fs from 'fs';
import * as path from 'path';
import { createChatCompletion, MODELS } from './client';

export interface TestGenerationOptions {
  /** Component file path */
  componentPath: string;
  /** Output directory for generated tests */
  outputDir?: string;
  /** Test category (happy-path, narf, etc.) */
  category?: string;
  /** Additional context about the component */
  context?: string;
}

export interface GeneratedTest {
  /** Output file path */
  filePath: string;
  /** Generated test content */
  content: string;
  /** Component name */
  componentName: string;
  /** Number of test cases generated */
  testCount: number;
}

const SYSTEM_PROMPT = `You are a Playwright test generator for the Pinky testing framework.
Your job is to generate comprehensive E2E tests based on React component source code.

Follow these patterns:
1. Use test.describe() to group related tests
2. Each test should be independent and focus on one behavior
3. Use meaningful test names that describe the user action and expected outcome
4. Include setup (beforeEach) for common operations like login
5. Use data-testid attributes when available, fall back to accessible selectors
6. Always take screenshots at key checkpoints
7. Handle async operations properly with waitFor

Output format: Pure TypeScript code for a .pinky.ts file, no markdown code blocks.`;

/**
 * Read component source code
 */
export async function readComponentSource(
  componentPath: string
): Promise<string> {
  const absolutePath = path.resolve(componentPath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Component file not found: ${absolutePath}`);
  }
  return fs.readFileSync(absolutePath, 'utf-8');
}

/**
 * Generate a test file name from component path
 */
export function generateTestFileName(
  componentPath: string,
  category = 'generated'
): string {
  const baseName = path.basename(componentPath, path.extname(componentPath));
  // Convert PascalCase/camelCase to kebab-case
  const kebabName = baseName
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase();
  return `${category}/${kebabName}.pinky.ts`;
}

/**
 * Generate Pinky tests from component source
 */
export async function generateTests(
  options: TestGenerationOptions
): Promise<GeneratedTest> {
  const { componentPath, outputDir, category = 'generated', context = '' } = options;

  // Read component source
  const sourceCode = await readComponentSource(componentPath);
  const componentName = path.basename(componentPath, path.extname(componentPath));

  // Build the prompt
  const userPrompt = `Generate Pinky (Playwright) E2E tests for this React component.

Component: ${componentName}
File: ${componentPath}
${context ? `Context: ${context}` : ''}

Source code:
\`\`\`typescript
${sourceCode}
\`\`\`

Generate comprehensive tests that:
1. Test the happy path (normal user flow)
2. Test edge cases and error states
3. Test accessibility where applicable
4. Include proper setup and teardown

Use these imports:
- import { test, expect } from '@playwright/test';
- import { loginAsTestUser } from '../helpers/auth';
- import { takeNamedScreenshot } from '../helpers/screenshot';

Make tests realistic and focused on user behavior, not implementation details.`;

  // Call Codex
  const response = await createChatCompletion(
    [{ role: 'user', content: userPrompt }],
    {
      model: MODELS.GPT4O_MINI,
      systemPrompt: SYSTEM_PROMPT,
      temperature: 0.3,
      maxTokens: 8192,
    }
  );

  // Clean up response (remove markdown code blocks if present)
  let content = response.content.trim();
  if (content.startsWith('```typescript')) {
    content = content.replace(/^```typescript\n?/, '').replace(/\n?```$/, '');
  } else if (content.startsWith('```')) {
    content = content.replace(/^```\w*\n?/, '').replace(/\n?```$/, '');
  }

  // Generate output path
  const testFileName = generateTestFileName(componentPath, category);
  const baseOutputDir = outputDir || path.join(__dirname, '../tests');
  const filePath = path.join(baseOutputDir, testFileName);

  // Count test cases (rough estimate)
  const testCount = (content.match(/test\(/g) || []).length;

  return {
    filePath,
    content,
    componentName,
    testCount,
  };
}

/**
 * Write generated test to file
 */
export async function writeGeneratedTest(
  test: GeneratedTest
): Promise<void> {
  const dir = path.dirname(test.filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(test.filePath, test.content, 'utf-8');
}

/**
 * Generate and write tests for a component
 */
export async function generateAndWriteTests(
  options: TestGenerationOptions
): Promise<GeneratedTest> {
  const generated = await generateTests(options);
  await writeGeneratedTest(generated);
  return generated;
}

/**
 * Batch generate tests for multiple components
 */
export async function batchGenerateTests(
  componentPaths: string[],
  options: Omit<TestGenerationOptions, 'componentPath'> = {}
): Promise<GeneratedTest[]> {
  const results: GeneratedTest[] = [];

  for (const componentPath of componentPaths) {
    try {
      const generated = await generateAndWriteTests({
        ...options,
        componentPath,
      });
      results.push(generated);
      console.log(`✓ Generated ${generated.testCount} tests for ${generated.componentName}`);
    } catch (error) {
      console.error(`✗ Failed to generate tests for ${componentPath}:`, error);
    }
  }

  return results;
}
