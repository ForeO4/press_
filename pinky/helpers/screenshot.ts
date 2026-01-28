import { Page, TestInfo } from '@playwright/test';
import path from 'path';

/**
 * Screenshot metadata attached to each capture
 */
interface ScreenshotMetadata {
  step: string;
  timestamp: string;
  url: string;
  viewport: { width: number; height: number };
  testName: string;
}

/**
 * PinkyScreenshot - Captures screenshots with step numbering and metadata
 *
 * Usage:
 * ```typescript
 * const screenshot = new PinkyScreenshot(page, 'auth-flow');
 * await screenshot.capture('01-login-form');
 * await screenshot.capture('02-after-submit');
 * ```
 */
export class PinkyScreenshot {
  private page: Page;
  private testName: string;
  private stepCount: number = 0;
  private captures: ScreenshotMetadata[] = [];

  constructor(page: Page, testName: string) {
    this.page = page;
    this.testName = testName;
  }

  /**
   * Capture a screenshot with metadata
   * @param stepName - Descriptive name for this step (e.g., '01-login-form')
   * @param options - Additional screenshot options
   */
  async capture(
    stepName: string,
    options: { fullPage?: boolean; clip?: { x: number; y: number; width: number; height: number } } = {}
  ): Promise<string> {
    this.stepCount++;

    const viewport = this.page.viewportSize() || { width: 0, height: 0 };
    const metadata: ScreenshotMetadata = {
      step: stepName,
      timestamp: new Date().toISOString(),
      url: this.page.url(),
      viewport,
      testName: this.testName,
    };

    this.captures.push(metadata);

    // Generate filename with test name and step
    const filename = `${this.testName}--${stepName}.png`;

    // Take the screenshot
    await this.page.screenshot({
      path: path.join('pinky', 'results', 'screenshots', filename),
      fullPage: options.fullPage ?? false,
      ...options,
    });

    // Log for debugging
    console.log(`[Pinky] Screenshot: ${filename} @ ${metadata.url}`);

    return filename;
  }

  /**
   * Capture a full-page screenshot
   */
  async captureFullPage(stepName: string): Promise<string> {
    return this.capture(stepName, { fullPage: true });
  }

  /**
   * Capture a screenshot of a specific element
   */
  async captureElement(stepName: string, selector: string): Promise<string | null> {
    const element = this.page.locator(selector);
    const isVisible = await element.isVisible().catch(() => false);

    if (!isVisible) {
      console.warn(`[Pinky] Element not visible for screenshot: ${selector}`);
      return null;
    }

    const boundingBox = await element.boundingBox();
    if (!boundingBox) {
      console.warn(`[Pinky] Could not get bounding box for: ${selector}`);
      return null;
    }

    return this.capture(stepName, {
      clip: {
        x: boundingBox.x,
        y: boundingBox.y,
        width: boundingBox.width,
        height: boundingBox.height,
      },
    });
  }

  /**
   * Get all captured screenshot metadata
   */
  getCaptures(): ScreenshotMetadata[] {
    return [...this.captures];
  }

  /**
   * Get the count of screenshots taken
   */
  getCount(): number {
    return this.stepCount;
  }

  /**
   * Generate a summary of all captures for logging
   */
  summary(): string {
    const lines = [
      `[Pinky] Screenshot Summary for: ${this.testName}`,
      `[Pinky] Total captures: ${this.stepCount}`,
      ...this.captures.map((c, i) => `[Pinky]   ${i + 1}. ${c.step} @ ${c.url}`),
    ];
    return lines.join('\n');
  }
}

/**
 * Convenience function for quick screenshots in tests
 */
export async function pinkySnap(
  page: Page,
  name: string,
  options: { fullPage?: boolean } = {}
): Promise<void> {
  const timestamp = Date.now();
  const filename = `snap--${name}--${timestamp}.png`;

  await page.screenshot({
    path: path.join('pinky', 'results', 'screenshots', filename),
    fullPage: options.fullPage ?? false,
  });

  console.log(`[Pinky] Snap: ${filename}`);
}
