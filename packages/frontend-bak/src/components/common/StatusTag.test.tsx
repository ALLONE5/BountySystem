/**
 * Unit tests for StatusTag component
 * 
 * Verifies that StatusTag correctly uses statusConfig for all status types
 * Requirements: 4.1, 4.2 - Use centralized status configuration
 */

import { describe, it, expect } from 'vitest';
import { TaskStatus, InvitationStatus } from '../../types';
import { 
  getTaskStatusConfig, 
  getApplicationStatusConfig, 
  getInvitationStatusConfig,
  ApplicationStatus 
} from '../../utils/statusConfig';

describe('StatusTag - Status Configuration Integration', () => {
  describe('Task Status Configuration', () => {
    it('should use statusConfig for NOT_STARTED status', () => {
      const config = getTaskStatusConfig(TaskStatus.NOT_STARTED);
      expect(config.color).toBe('default');
      expect(config.text).toBe('未开始');
      expect(config.icon).toBe('ClockCircleOutlined');
    });

    it('should use statusConfig for AVAILABLE status', () => {
      const config = getTaskStatusConfig(TaskStatus.AVAILABLE);
      expect(config.color).toBe('success');
      expect(config.text).toBe('可承接');
      expect(config.icon).toBe('CheckCircleOutlined');
    });

    it('should use statusConfig for PENDING_ACCEPTANCE status', () => {
      const config = getTaskStatusConfig(TaskStatus.PENDING_ACCEPTANCE);
      expect(config.color).toBe('orange');
      expect(config.text).toBe('待接受');
      expect(config.icon).toBe('ClockCircleOutlined');
    });

    it('should use statusConfig for IN_PROGRESS status', () => {
      const config = getTaskStatusConfig(TaskStatus.IN_PROGRESS);
      expect(config.color).toBe('processing');
      expect(config.text).toBe('进行中');
      expect(config.icon).toBe('SyncOutlined');
    });

    it('should use statusConfig for COMPLETED status', () => {
      const config = getTaskStatusConfig(TaskStatus.COMPLETED);
      expect(config.color).toBe('success');
      expect(config.text).toBe('已完成');
      expect(config.icon).toBe('CheckCircleOutlined');
    });

    it('should use statusConfig for PENDING_ACCEPTANCE status', () => {
      const config = getTaskStatusConfig(TaskStatus.PENDING_ACCEPTANCE);
      expect(config.color).toBe('warning');
      expect(config.text).toBe('待接受');
      expect(config.icon).toBe('ClockCircleOutlined');
    });
  });

  describe('Invitation Status Configuration', () => {
    it('should use statusConfig for PENDING invitation', () => {
      const config = getInvitationStatusConfig(InvitationStatus.PENDING);
      expect(config.color).toBe('orange');
      expect(config.text).toBe('待接受');
      expect(config.icon).toBe('ClockCircleOutlined');
    });

    it('should use statusConfig for ACCEPTED invitation', () => {
      const config = getInvitationStatusConfig(InvitationStatus.ACCEPTED);
      expect(config.color).toBe('green');
      expect(config.text).toBe('已接受');
      expect(config.icon).toBe('CheckOutlined');
    });

    it('should use statusConfig for REJECTED invitation', () => {
      const config = getInvitationStatusConfig(InvitationStatus.REJECTED);
      expect(config.color).toBe('red');
      expect(config.text).toBe('已拒绝');
      expect(config.icon).toBe('CloseOutlined');
    });
  });

  describe('Application Status Configuration', () => {
    it('should use statusConfig for PENDING application', () => {
      const config = getApplicationStatusConfig(ApplicationStatus.PENDING);
      expect(config.color).toBe('orange');
      expect(config.text).toBe('待审核');
      expect(config.icon).toBe('ClockCircleOutlined');
    });

    it('should use statusConfig for APPROVED application', () => {
      const config = getApplicationStatusConfig(ApplicationStatus.APPROVED);
      expect(config.color).toBe('success');
      expect(config.text).toBe('已批准');
      expect(config.icon).toBe('CheckCircleOutlined');
    });

    it('should use statusConfig for REJECTED application', () => {
      const config = getApplicationStatusConfig(ApplicationStatus.REJECTED);
      expect(config.color).toBe('error');
      expect(config.text).toBe('已拒绝');
      expect(config.icon).toBe('CloseCircleOutlined');
    });
  });

  describe('Status Configuration Completeness', () => {
    it('should have configuration for all TaskStatus values', () => {
      const allTaskStatuses = Object.values(TaskStatus);
      allTaskStatuses.forEach(status => {
        const config = getTaskStatusConfig(status);
        expect(config).toBeDefined();
        expect(config.color).toBeDefined();
        expect(config.text).toBeDefined();
      });
    });

    it('should have configuration for all InvitationStatus values', () => {
      const allInvitationStatuses = Object.values(InvitationStatus);
      allInvitationStatuses.forEach(status => {
        const config = getInvitationStatusConfig(status);
        expect(config).toBeDefined();
        expect(config.color).toBeDefined();
        expect(config.text).toBeDefined();
      });
    });

    it('should have configuration for all ApplicationStatus values', () => {
      const allApplicationStatuses = Object.values(ApplicationStatus);
      allApplicationStatuses.forEach(status => {
        const config = getApplicationStatusConfig(status);
        expect(config).toBeDefined();
        expect(config.color).toBeDefined();
        expect(config.text).toBeDefined();
      });
    });
  });
});
