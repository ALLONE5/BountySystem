import { describe, it, expect } from 'vitest';
import { PermissionService, PageAccess } from './PermissionService.js';
import { UserRole } from '../models/User.js';

describe('PermissionService', () => {
  const permissionService = new PermissionService();

  describe('canAccessPage', () => {
    describe('Regular User', () => {
      it('should allow access to common pages', () => {
        expect(permissionService.canAccessPage(UserRole.USER, PageAccess.PERSONAL)).toBe(true);
        expect(permissionService.canAccessPage(UserRole.USER, PageAccess.PUBLISHED_TASKS)).toBe(true);
        expect(permissionService.canAccessPage(UserRole.USER, PageAccess.ACCEPTED_TASKS)).toBe(true);
        expect(permissionService.canAccessPage(UserRole.USER, PageAccess.BOUNTY_TASKS)).toBe(true);
        expect(permissionService.canAccessPage(UserRole.USER, PageAccess.RANKING)).toBe(true);
      });

      it('should deny access to admin pages', () => {
        expect(permissionService.canAccessPage(UserRole.USER, PageAccess.USER_MANAGEMENT)).toBe(false);
        expect(permissionService.canAccessPage(UserRole.USER, PageAccess.TASK_MANAGEMENT)).toBe(false);
        expect(permissionService.canAccessPage(UserRole.USER, PageAccess.AUDIT_OPERATIONS)).toBe(false);
      });
    });

    describe('Position Admin', () => {
      it('should allow access to common pages', () => {
        expect(permissionService.canAccessPage(UserRole.POSITION_ADMIN, PageAccess.PERSONAL)).toBe(true);
        expect(permissionService.canAccessPage(UserRole.POSITION_ADMIN, PageAccess.PUBLISHED_TASKS)).toBe(true);
        expect(permissionService.canAccessPage(UserRole.POSITION_ADMIN, PageAccess.ACCEPTED_TASKS)).toBe(true);
        expect(permissionService.canAccessPage(UserRole.POSITION_ADMIN, PageAccess.BOUNTY_TASKS)).toBe(true);
        expect(permissionService.canAccessPage(UserRole.POSITION_ADMIN, PageAccess.RANKING)).toBe(true);
      });

      it('should allow access to admin pages', () => {
        expect(permissionService.canAccessPage(UserRole.POSITION_ADMIN, PageAccess.USER_MANAGEMENT)).toBe(true);
        expect(permissionService.canAccessPage(UserRole.POSITION_ADMIN, PageAccess.TASK_MANAGEMENT)).toBe(true);
        expect(permissionService.canAccessPage(UserRole.POSITION_ADMIN, PageAccess.AUDIT_OPERATIONS)).toBe(true);
      });
    });

    describe('Super Admin', () => {
      it('should allow access to all pages', () => {
        expect(permissionService.canAccessPage(UserRole.SUPER_ADMIN, PageAccess.PERSONAL)).toBe(true);
        expect(permissionService.canAccessPage(UserRole.SUPER_ADMIN, PageAccess.PUBLISHED_TASKS)).toBe(true);
        expect(permissionService.canAccessPage(UserRole.SUPER_ADMIN, PageAccess.ACCEPTED_TASKS)).toBe(true);
        expect(permissionService.canAccessPage(UserRole.SUPER_ADMIN, PageAccess.BOUNTY_TASKS)).toBe(true);
        expect(permissionService.canAccessPage(UserRole.SUPER_ADMIN, PageAccess.RANKING)).toBe(true);
        expect(permissionService.canAccessPage(UserRole.SUPER_ADMIN, PageAccess.USER_MANAGEMENT)).toBe(true);
        expect(permissionService.canAccessPage(UserRole.SUPER_ADMIN, PageAccess.TASK_MANAGEMENT)).toBe(true);
        expect(permissionService.canAccessPage(UserRole.SUPER_ADMIN, PageAccess.AUDIT_OPERATIONS)).toBe(true);
      });
    });
  });

  describe('verifyRole', () => {
    it('should not throw for valid role', () => {
      expect(() => {
        permissionService.verifyRole(UserRole.SUPER_ADMIN, [UserRole.SUPER_ADMIN]);
      }).not.toThrow();
    });

    it('should throw for invalid role', () => {
      expect(() => {
        permissionService.verifyRole(UserRole.USER, [UserRole.SUPER_ADMIN]);
      }).toThrow('Insufficient permissions');
    });

    it('should accept multiple valid roles', () => {
      expect(() => {
        permissionService.verifyRole(UserRole.POSITION_ADMIN, [UserRole.POSITION_ADMIN, UserRole.SUPER_ADMIN]);
      }).not.toThrow();
    });
  });

  describe('verifyPageAccess', () => {
    it('should not throw for valid page access', () => {
      expect(() => {
        permissionService.verifyPageAccess(UserRole.USER, PageAccess.PERSONAL);
      }).not.toThrow();
    });

    it('should throw for invalid page access', () => {
      expect(() => {
        permissionService.verifyPageAccess(UserRole.USER, PageAccess.USER_MANAGEMENT);
      }).toThrow('Access denied');
    });
  });
});
