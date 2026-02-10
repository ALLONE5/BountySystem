import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RankingUpdateQueue } from './RankingUpdateQueue.js';

describe('RankingUpdateQueue', () => {
  let queue: RankingUpdateQueue;

  beforeEach(() => {
    queue = new RankingUpdateQueue();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should schedule an update with debouncing', () => {
    expect(queue.hasPendingUpdate()).toBe(false);

    queue.scheduleUpdate();

    expect(queue.hasPendingUpdate()).toBe(true);
  });

  it('should reset timer when scheduling multiple updates', () => {
    queue.scheduleUpdate();
    
    // Advance time by 1 second
    vi.advanceTimersByTime(1000);
    
    // Schedule another update (should reset timer)
    queue.scheduleUpdate();
    
    // Advance time by 1.5 seconds (total 2.5s from first schedule)
    vi.advanceTimersByTime(1500);
    
    // Update should not have executed yet (only 1.5s since last schedule)
    expect(queue.hasPendingUpdate()).toBe(true);
  });

  it('should execute update after debounce delay', async () => {
    queue.scheduleUpdate();

    expect(queue.hasPendingUpdate()).toBe(true);

    // Advance time by 2 seconds (debounce delay)
    await vi.advanceTimersByTimeAsync(2000);

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(queue.hasPendingUpdate()).toBe(false);
  });

  it('should not execute multiple updates simultaneously', async () => {
    // Schedule first update
    queue.scheduleUpdate();

    // Advance time to trigger first update
    await vi.advanceTimersByTimeAsync(2000);

    // Check that update is in progress
    expect(queue.isUpdateInProgress()).toBe(true);

    // Schedule second update while first is in progress
    queue.scheduleUpdate();

    // Second update should be pending but not executing
    expect(queue.hasPendingUpdate()).toBe(true);
  });

  it('should return correct debounce delay', () => {
    expect(queue.getDebounceDelay()).toBe(2000);
  });

  it('should force immediate update', async () => {
    queue.scheduleUpdate();

    expect(queue.hasPendingUpdate()).toBe(true);

    // Force update (should bypass debouncing)
    await queue.forceUpdate();

    // Update should be completed
    expect(queue.hasPendingUpdate()).toBe(false);
    expect(queue.isUpdateInProgress()).toBe(false);
  });

  it('should clear timer when forcing update', async () => {
    queue.scheduleUpdate();

    // Advance time by 1 second (not enough to trigger)
    vi.advanceTimersByTime(1000);

    expect(queue.hasPendingUpdate()).toBe(true);

    // Force update
    await queue.forceUpdate();

    // Timer should be cleared
    expect(queue.hasPendingUpdate()).toBe(false);

    // Advancing time further should not trigger anything
    await vi.advanceTimersByTimeAsync(2000);

    expect(queue.hasPendingUpdate()).toBe(false);
  });
});
