/**
 * ActionLogger - Logs actions with timing for Pinky tests
 *
 * Tracks:
 * - Action name and description
 * - Execution time
 * - Success/failure status
 * - Error messages on failure
 *
 * Usage:
 * ```typescript
 * const logger = new ActionLogger('auth-flow');
 *
 * await logger.action('Click login button', async () => {
 *   await page.click('#login');
 * });
 *
 * await logger.action('Fill email', async () => {
 *   await page.fill('#email', 'test@example.com');
 * });
 *
 * logger.summary();
 * ```
 */

interface ActionRecord {
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
  status: 'success' | 'failure';
  error?: string;
}

interface ActionStats {
  total: number;
  passed: number;
  failed: number;
  totalDuration: number;
  avgDuration: number;
  slowest: { name: string; duration: number } | null;
}

export class ActionLogger {
  private testName: string;
  private actions: ActionRecord[] = [];
  private startTime: number;

  constructor(testName: string) {
    this.testName = testName;
    this.startTime = Date.now();
  }

  /**
   * Execute and log an action with timing
   */
  async action<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const startTime = Date.now();

    try {
      const result = await fn();
      const endTime = Date.now();
      const duration = endTime - startTime;

      this.actions.push({
        name,
        startTime,
        endTime,
        duration,
        status: 'success',
      });

      console.log(`[Pinky] ✓ ${name} (${duration}ms)`);
      return result;
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      this.actions.push({
        name,
        startTime,
        endTime,
        duration,
        status: 'failure',
        error: errorMessage,
      });

      console.log(`[Pinky] ✗ ${name} (${duration}ms) - ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Log an action that has already completed (for external timing)
   */
  logCompleted(name: string, durationMs: number, success: boolean, error?: string): void {
    const endTime = Date.now();
    this.actions.push({
      name,
      startTime: endTime - durationMs,
      endTime,
      duration: durationMs,
      status: success ? 'success' : 'failure',
      error,
    });

    const symbol = success ? '✓' : '✗';
    console.log(`[Pinky] ${symbol} ${name} (${durationMs}ms)`);
  }

  /**
   * Get statistics for all logged actions
   */
  getStats(): ActionStats {
    const passed = this.actions.filter((a) => a.status === 'success').length;
    const failed = this.actions.filter((a) => a.status === 'failure').length;
    const totalDuration = this.actions.reduce((sum, a) => sum + a.duration, 0);
    const slowest = this.actions.reduce<{ name: string; duration: number } | null>(
      (max, a) => (!max || a.duration > max.duration ? { name: a.name, duration: a.duration } : max),
      null
    );

    return {
      total: this.actions.length,
      passed,
      failed,
      totalDuration,
      avgDuration: this.actions.length > 0 ? totalDuration / this.actions.length : 0,
      slowest,
    };
  }

  /**
   * Get all action records
   */
  getActions(): ActionRecord[] {
    return [...this.actions];
  }

  /**
   * Get failed actions only
   */
  getFailures(): ActionRecord[] {
    return this.actions.filter((a) => a.status === 'failure');
  }

  /**
   * Print a summary of all actions to console
   */
  summary(): void {
    const stats = this.getStats();
    const totalTestTime = Date.now() - this.startTime;

    console.log('\n' + '='.repeat(60));
    console.log(`[Pinky] ACTION SUMMARY: ${this.testName}`);
    console.log('='.repeat(60));
    console.log(`Total actions: ${stats.total}`);
    console.log(`Passed: ${stats.passed} | Failed: ${stats.failed}`);
    console.log(`Total action time: ${stats.totalDuration}ms`);
    console.log(`Average action time: ${Math.round(stats.avgDuration)}ms`);
    console.log(`Total test time: ${totalTestTime}ms`);

    if (stats.slowest) {
      console.log(`Slowest action: "${stats.slowest.name}" (${stats.slowest.duration}ms)`);
    }

    const failures = this.getFailures();
    if (failures.length > 0) {
      console.log('\nFailed actions:');
      failures.forEach((f) => {
        console.log(`  - ${f.name}: ${f.error}`);
      });
    }

    console.log('='.repeat(60) + '\n');
  }

  /**
   * Export actions as JSON for report generation
   */
  toJSON(): object {
    return {
      testName: this.testName,
      startTime: this.startTime,
      endTime: Date.now(),
      stats: this.getStats(),
      actions: this.actions,
    };
  }
}

/**
 * Create a simple timer for measuring operations
 */
export function createTimer() {
  const start = Date.now();
  return {
    elapsed: () => Date.now() - start,
    log: (label: string) => console.log(`[Pinky] Timer: ${label} - ${Date.now() - start}ms`),
  };
}
