/**
 * Unit tests for TaskInvitationsPage status display
 * 
 * Verifies that TaskInvitationsPage correctly uses statusConfig for invitation status display
 */

import { describe, it, expect } from 'vitest';
import { InvitationStatus } from '../types';
import { getInvitationStatusConfig } from '../utils/statusConfig';

describe('TaskInvitationsPage - Invitation Status Display', () => {
  it('should use statusConfig for PENDING invitation status', () => {
    const config = getInvitationStatusConfig(InvitationStatus.PENDING);
    expect(config.color).toBe('orange');
    expect(config.text).toBe('待接受');
  });

  it('should use statusConfig for ACCEPTED invitation status', () => {
    const config = getInvitationStatusConfig(InvitationStatus.ACCEPTED);
    expect(config.color).toBe('green');
    expect(config.text).toBe('已接受');
  });

  it('should use statusConfig for REJECTED invitation status', () => {
    const config = getInvitationStatusConfig(InvitationStatus.REJECTED);
    expect(config.color).toBe('red');
    expect(config.text).toBe('已拒绝');
  });

  it('should return all invitation status values correctly', () => {
    const statuses = [
      InvitationStatus.PENDING,
      InvitationStatus.ACCEPTED,
      InvitationStatus.REJECTED,
    ];

    statuses.forEach(status => {
      const config = getInvitationStatusConfig(status);
      expect(config).toBeDefined();
      expect(config.color).toBeDefined();
      expect(config.text).toBeDefined();
      expect(typeof config.color).toBe('string');
      expect(typeof config.text).toBe('string');
    });
  });

  it('should have icon property for all invitation statuses', () => {
    const statuses = [
      InvitationStatus.PENDING,
      InvitationStatus.ACCEPTED,
      InvitationStatus.REJECTED,
    ];

    statuses.forEach(status => {
      const config = getInvitationStatusConfig(status);
      expect(config.icon).toBeDefined();
      expect(typeof config.icon).toBe('string');
    });
  });
});
