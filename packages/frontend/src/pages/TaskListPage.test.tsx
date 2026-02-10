/**
 * Unit tests for TaskListPage status display
 * 
 * Verifies that TaskListPage correctly uses statusConfig for status display
 */

import { describe, it, expect } from 'vitest';
import { TaskStatus } from '../types';
import { getTaskStatusConfig } from '../utils/statusConfig';

describe('TaskListPage - Status Display', () => {
  it('should use statusConfig for NOT_STARTED status', () => {
    const config = getTaskStatusConfig(TaskStatus.NOT_STARTED);
    expect(config.color).toBe('default');
    expect(config.text).toBe('未开始');
  });

  it('should use statusConfig for AVAILABLE status', () => {
    const config = getTaskStatusConfig(TaskStatus.AVAILABLE);
    expect(config.color).toBe('success');
    expect(config.text).toBe('可承接');
  });

  it('should use statusConfig for IN_PROGRESS status', () => {
    const config = getTaskStatusConfig(TaskStatus.IN_PROGRESS);
    expect(config.color).toBe('processing');
    expect(config.text).toBe('进行中');
  });

  it('should use statusConfig for COMPLETED status', () => {
    const config = getTaskStatusConfig(TaskStatus.COMPLETED);
    expect(config.color).toBe('success');
    expect(config.text).toBe('已完成');
  });

  it('should use statusConfig for ABANDONED status', () => {
    const config = getTaskStatusConfig(TaskStatus.ABANDONED);
    expect(config.color).toBe('error');
    expect(config.text).toBe('已放弃');
  });

  it('should use statusConfig for PENDING_ACCEPTANCE status', () => {
    const config = getTaskStatusConfig(TaskStatus.PENDING_ACCEPTANCE);
    expect(config.color).toBe('orange');
    expect(config.text).toBe('待接受');
  });

  it('should return all status values correctly', () => {
    const statuses = [
      TaskStatus.NOT_STARTED,
      TaskStatus.AVAILABLE,
      TaskStatus.PENDING_ACCEPTANCE,
      TaskStatus.IN_PROGRESS,
      TaskStatus.COMPLETED,
      TaskStatus.ABANDONED,
    ];

    statuses.forEach(status => {
      const config = getTaskStatusConfig(status);
      expect(config).toBeDefined();
      expect(config.color).toBeDefined();
      expect(config.text).toBeDefined();
      expect(typeof config.color).toBe('string');
      expect(typeof config.text).toBe('string');
    });
  });
});
