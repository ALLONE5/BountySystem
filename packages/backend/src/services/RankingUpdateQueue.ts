import { RankingService } from './RankingService.js';
import { logger } from '../config/logger.js';
import { pool } from '../config/database.js';

/**
 * Ranking Update Queue with Debouncing
 * 
 * This service manages ranking updates with a debounce mechanism to ensure:
 * 1. Rankings are updated quickly after task completion (within 2 seconds)
 * 2. Multiple rapid completions are batched together
 * 3. No unnecessary duplicate calculations
 */
export class RankingUpdateQueue {
  private rankingService: RankingService;
  private updateTimer: NodeJS.Timeout | null = null;
  private pendingUpdate: boolean = false;
  private readonly DEBOUNCE_DELAY = 2000; // 2 seconds
  private isUpdating: boolean = false;

  constructor() {
    this.rankingService = new RankingService(pool);
  }

  /**
   * Schedule a ranking update with debouncing
   * 
   * If multiple tasks are completed within 2 seconds, only one update will be triggered
   * The update will happen 2 seconds after the last task completion
   */
  scheduleUpdate(): void {
    // Mark that we have a pending update
    this.pendingUpdate = true;

    // Clear existing timer if any
    if (this.updateTimer) {
      clearTimeout(this.updateTimer);
    }

    // Schedule new update
    this.updateTimer = setTimeout(() => {
      this.executeUpdate();
    }, this.DEBOUNCE_DELAY);

    logger.debug('Ranking update scheduled', {
      delay: this.DEBOUNCE_DELAY,
      pendingUpdate: this.pendingUpdate,
    });
  }

  /**
   * Execute the ranking update
   * This method ensures only one update runs at a time
   */
  private async executeUpdate(): Promise<void> {
    // If already updating, skip this execution
    if (this.isUpdating) {
      logger.debug('Ranking update already in progress, skipping');
      return;
    }

    // If no pending update, skip
    if (!this.pendingUpdate) {
      logger.debug('No pending ranking update');
      return;
    }

    this.isUpdating = true;
    this.pendingUpdate = false;

    const startTime = Date.now();
    
    try {
      logger.info('Starting ranking update');
      
      // Update all rankings (monthly, quarterly, all-time)
      await this.rankingService.updateAllRankings();
      
      const duration = Date.now() - startTime;
      logger.info('Ranking update completed', { duration });
    } catch (error) {
      logger.error('Failed to update rankings', { error });
    } finally {
      this.isUpdating = false;
      this.updateTimer = null;
    }
  }

  /**
   * Force immediate update (bypass debouncing)
   * Used for manual refresh or critical updates
   */
  async forceUpdate(): Promise<void> {
    // Clear any pending timer
    if (this.updateTimer) {
      clearTimeout(this.updateTimer);
      this.updateTimer = null;
    }

    this.pendingUpdate = true;
    await this.executeUpdate();
  }

  /**
   * Check if an update is currently in progress
   */
  isUpdateInProgress(): boolean {
    return this.isUpdating;
  }

  /**
   * Check if an update is pending
   */
  hasPendingUpdate(): boolean {
    return this.pendingUpdate || this.updateTimer !== null;
  }

  /**
   * Get the current debounce delay
   */
  getDebounceDelay(): number {
    return this.DEBOUNCE_DELAY;
  }
}

// Singleton instance
export const rankingUpdateQueue = new RankingUpdateQueue();
