import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { TaskMapper } from './TaskMapper.js';
import { GroupMapper } from './GroupMapper.js';
import { PositionMapper } from './PositionMapper.js';
import { UserMapper } from './UserMapper.js';
import { TaskStatus, Visibility } from '../../models/Task.js';
import { ApplicationStatus } from '../../models/Position.js';

// Feature: backend-refactoring, Property 1: Mapper Consistency
// For any valid model object (Task, ProjectGroup, or Position), mapping it to a DTO 
// should produce an object with all required fields populated and correct type conversions applied

describe('Mapper Consistency Property Tests', () => {
  describe('TaskMapper', () => {
    // Feature: backend-refactoring, Property 1: Mapper Consistency
    it('should consistently map Task models to DTOs with all required fields', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            description: fc.oneof(fc.string(), fc.constant(null)),
            parent_id: fc.oneof(fc.uuid(), fc.constant(null)),
            depth: fc.integer({ min: 0, max: 10 }),
            is_executable: fc.boolean(),
            tags: fc.array(fc.string()),
            created_at: fc.date(),
            planned_start_date: fc.oneof(fc.date(), fc.constant(null)),
            planned_end_date: fc.oneof(fc.date(), fc.constant(null)),
            actual_start_date: fc.oneof(fc.date(), fc.constant(null)),
            actual_end_date: fc.oneof(fc.date(), fc.constant(null)),
            estimated_hours: fc.oneof(fc.integer({ min: 0, max: 1000 }), fc.constant(null)),
            complexity: fc.oneof(fc.integer({ min: 1, max: 10 }), fc.constant(null)),
            priority: fc.oneof(fc.integer({ min: 1, max: 5 }), fc.constant(null)),
            status: fc.constantFrom(...Object.values(TaskStatus)),
            position_id: fc.oneof(fc.uuid(), fc.constant(null)),
            visibility: fc.constantFrom(...Object.values(Visibility)),
            bounty_amount: fc.integer({ min: 0, max: 100000 }),
            bounty_algorithm_version: fc.oneof(fc.string(), fc.constant(null)),
            is_bounty_settled: fc.boolean(),
            publisher_id: fc.uuid(),
            assignee_id: fc.oneof(fc.uuid(), fc.constant(null)),
            group_id: fc.oneof(fc.uuid(), fc.constant(null)),
            project_group_id: fc.oneof(fc.uuid(), fc.constant(null)),
            progress: fc.integer({ min: 0, max: 100 }),
            progress_locked: fc.boolean(),
            aggregated_estimated_hours: fc.oneof(fc.integer({ min: 0, max: 10000 }), fc.constant(null)),
            aggregated_complexity: fc.oneof(fc.integer({ min: 1, max: 100 }), fc.constant(null)),
            updated_at: fc.date(),
          }),
          (task) => {
            const dto = TaskMapper.toDTO(task);
            
            // Verify all required fields are present
            expect(dto).toBeDefined();
            expect(dto.id).toBe(task.id);
            expect(dto.name).toBe(task.name);
            expect(dto.description).toBe(task.description);
            
            // Verify snake_case to camelCase conversion
            expect(dto.parentId).toBe(task.parent_id);
            expect(dto.isExecutable).toBe(task.is_executable);
            expect(dto.createdAt).toBe(task.created_at);
            expect(dto.plannedStartDate).toBe(task.planned_start_date);
            expect(dto.plannedEndDate).toBe(task.planned_end_date);
            expect(dto.actualStartDate).toBe(task.actual_start_date);
            expect(dto.actualEndDate).toBe(task.actual_end_date);
            expect(dto.estimatedHours).toBe(task.estimated_hours);
            expect(dto.positionId).toBe(task.position_id);
            expect(dto.bountyAmount).toBe(task.bounty_amount);
            expect(dto.bountyAlgorithmVersion).toBe(task.bounty_algorithm_version);
            expect(dto.isBountySettled).toBe(task.is_bounty_settled);
            expect(dto.publisherId).toBe(task.publisher_id);
            expect(dto.assigneeId).toBe(task.assignee_id);
            expect(dto.groupId).toBe(task.group_id);
            expect(dto.projectGroupId).toBe(task.project_group_id);
            expect(dto.progressLocked).toBe(task.progress_locked);
            expect(dto.aggregatedEstimatedHours).toBe(task.aggregated_estimated_hours);
            expect(dto.aggregatedComplexity).toBe(task.aggregated_complexity);
            expect(dto.updatedAt).toBe(task.updated_at);
            
            // Verify arrays and enums
            expect(dto.tags).toEqual(task.tags);
            expect(dto.status).toBe(task.status);
            expect(dto.visibility).toBe(task.visibility);
            expect(dto.depth).toBe(task.depth);
            expect(dto.complexity).toBe(task.complexity);
            expect(dto.priority).toBe(task.priority);
            expect(dto.progress).toBe(task.progress);
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: backend-refactoring, Property 1: Mapper Consistency
    it('should handle null/undefined values gracefully in Task mapping', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1 }),
            publisher_id: fc.uuid(),
            created_at: fc.date(),
            updated_at: fc.date(),
          }),
          (minimalTask) => {
            const dto = TaskMapper.toDTO(minimalTask);
            
            // Required fields should be present
            expect(dto.id).toBe(minimalTask.id);
            expect(dto.name).toBe(minimalTask.name);
            expect(dto.publisherId).toBe(minimalTask.publisher_id);
            
            // Optional fields should have default values
            expect(dto.description).toBe(null);
            expect(dto.parentId).toBe(null);
            expect(dto.depth).toBe(0);
            expect(dto.isExecutable).toBe(false);
            expect(dto.tags).toEqual([]);
            expect(dto.bountyAmount).toBe(0);
            expect(dto.isBountySettled).toBe(false);
            expect(dto.progress).toBe(0);
            expect(dto.progressLocked).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: backend-refactoring, Property 1: Mapper Consistency
    it('should consistently map arrays of Tasks to DTOs', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 1 }),
              publisher_id: fc.uuid(),
              created_at: fc.date(),
              updated_at: fc.date(),
              status: fc.constantFrom(...Object.values(TaskStatus)),
            }),
            { maxLength: 10 }
          ),
          (tasks) => {
            const dtos = TaskMapper.toDTOList(tasks);
            
            expect(dtos).toHaveLength(tasks.length);
            dtos.forEach((dto, index) => {
              expect(dto.id).toBe(tasks[index].id);
              expect(dto.name).toBe(tasks[index].name);
              expect(dto.status).toBe(tasks[index].status);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('GroupMapper', () => {
    // Feature: backend-refactoring, Property 1: Mapper Consistency
    it('should consistently map ProjectGroup models to DTOs with all required fields', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            description: fc.oneof(fc.string(), fc.constant(null)),
            created_at: fc.date(),
            updated_at: fc.date(),
          }),
          (group) => {
            const dto = GroupMapper.toDTO(group);
            
            // Verify all required fields are present
            expect(dto).toBeDefined();
            expect(dto.id).toBe(group.id);
            expect(dto.name).toBe(group.name);
            expect(dto.description).toBe(group.description);
            
            // Verify snake_case to camelCase conversion
            expect(dto.createdAt).toBe(group.created_at);
            expect(dto.updatedAt).toBe(group.updated_at);
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: backend-refactoring, Property 1: Mapper Consistency
    it('should handle null/undefined values gracefully in ProjectGroup mapping', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1 }),
            created_at: fc.date(),
            updated_at: fc.date(),
          }),
          (minimalGroup) => {
            const dto = GroupMapper.toDTO(minimalGroup);
            
            // Required fields should be present
            expect(dto.id).toBe(minimalGroup.id);
            expect(dto.name).toBe(minimalGroup.name);
            
            // Optional fields should have default values
            expect(dto.description).toBe(null);
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: backend-refactoring, Property 1: Mapper Consistency
    it('should consistently map arrays of ProjectGroups to DTOs', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 1 }),
              created_at: fc.date(),
              updated_at: fc.date(),
            }),
            { maxLength: 10 }
          ),
          (groups) => {
            const dtos = GroupMapper.toDTOList(groups);
            
            expect(dtos).toHaveLength(groups.length);
            dtos.forEach((dto, index) => {
              expect(dto.id).toBe(groups[index].id);
              expect(dto.name).toBe(groups[index].name);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('PositionMapper', () => {
    // Feature: backend-refactoring, Property 1: Mapper Consistency
    it('should consistently map Position models to DTOs with all required fields', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            description: fc.oneof(fc.string(), fc.constant(null)),
            required_skills: fc.array(fc.string()),
            created_at: fc.date(),
            updated_at: fc.date(),
          }),
          (position) => {
            const dto = PositionMapper.toDTO(position);
            
            // Verify all required fields are present
            expect(dto).toBeDefined();
            expect(dto.id).toBe(position.id);
            expect(dto.name).toBe(position.name);
            expect(dto.description).toBe(position.description);
            
            // Verify snake_case to camelCase conversion
            expect(dto.requiredSkills).toEqual(position.required_skills);
            expect(dto.createdAt).toBe(position.created_at);
            expect(dto.updatedAt).toBe(position.updated_at);
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: backend-refactoring, Property 1: Mapper Consistency
    it('should handle null/undefined values gracefully in Position mapping', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1 }),
            created_at: fc.date(),
            updated_at: fc.date(),
          }),
          (minimalPosition) => {
            const dto = PositionMapper.toDTO(minimalPosition);
            
            // Required fields should be present
            expect(dto.id).toBe(minimalPosition.id);
            expect(dto.name).toBe(minimalPosition.name);
            
            // Optional fields should have default values
            expect(dto.description).toBe(null);
            expect(dto.requiredSkills).toEqual([]);
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: backend-refactoring, Property 1: Mapper Consistency
    it('should consistently map arrays of Positions to DTOs', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 1 }),
              created_at: fc.date(),
              updated_at: fc.date(),
            }),
            { maxLength: 10 }
          ),
          (positions) => {
            const dtos = PositionMapper.toDTOList(positions);
            
            expect(dtos).toHaveLength(positions.length);
            dtos.forEach((dto, index) => {
              expect(dto.id).toBe(positions[index].id);
              expect(dto.name).toBe(positions[index].name);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: backend-refactoring, Property 1: Mapper Consistency
    it('should consistently map PositionApplication models to DTOs', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.uuid(),
            user_id: fc.uuid(),
            position_id: fc.uuid(),
            reason: fc.oneof(fc.string(), fc.constant(null)),
            status: fc.constantFrom(...Object.values(ApplicationStatus)),
            reviewed_by: fc.oneof(fc.uuid(), fc.constant(null)),
            review_comment: fc.oneof(fc.string(), fc.constant(null)),
            created_at: fc.date(),
            reviewed_at: fc.oneof(fc.date(), fc.constant(null)),
            updated_at: fc.date(),
          }),
          (application) => {
            const dto = PositionMapper.toApplicationDTO(application);
            
            // Verify all required fields are present
            expect(dto).toBeDefined();
            expect(dto.id).toBe(application.id);
            expect(dto.userId).toBe(application.user_id);
            expect(dto.positionId).toBe(application.position_id);
            expect(dto.reason).toBe(application.reason);
            expect(dto.status).toBe(application.status);
            expect(dto.reviewedBy).toBe(application.reviewed_by);
            expect(dto.reviewComment).toBe(application.review_comment);
            expect(dto.createdAt).toBe(application.created_at);
            expect(dto.reviewedAt).toBe(application.reviewed_at);
            expect(dto.updatedAt).toBe(application.updated_at);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Nested Object Transformations', () => {
    // Feature: backend-refactoring, Property 1: Mapper Consistency
    it('should handle nested user objects in Task mapping', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1 }),
            publisher_id: fc.uuid(),
            created_at: fc.date(),
            updated_at: fc.date(),
            publisher: fc.record({
              id: fc.uuid(),
              username: fc.string({ minLength: 1 }),
              email: fc.emailAddress(),
              role: fc.constantFrom('user', 'admin'),
              created_at: fc.date(),
            }),
          }),
          (task) => {
            const dto = TaskMapper.toDTO(task);
            
            expect(dto.publisher).toBeDefined();
            expect(dto.publisher.id).toBe(task.publisher.id);
            expect(dto.publisher.username).toBe(task.publisher.username);
            expect(dto.publisher.email).toBe(task.publisher.email);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Edge Cases', () => {
    // Feature: backend-refactoring, Property 1: Mapper Consistency
    it('should return null for null input in all mappers', () => {
      expect(TaskMapper.toDTO(null)).toBe(null);
      expect(GroupMapper.toDTO(null)).toBe(null);
      expect(PositionMapper.toDTO(null)).toBe(null);
      expect(UserMapper.toUserResponse(null)).toBe(null);
    });

    // Feature: backend-refactoring, Property 1: Mapper Consistency
    it('should return empty array for null/undefined array input', () => {
      expect(TaskMapper.toDTOList(null as any)).toEqual([]);
      expect(TaskMapper.toDTOList(undefined as any)).toEqual([]);
      expect(GroupMapper.toDTOList(null as any)).toEqual([]);
      expect(PositionMapper.toDTOList(null as any)).toEqual([]);
    });

    // Feature: backend-refactoring, Property 1: Mapper Consistency
    it('should handle empty arrays correctly', () => {
      expect(TaskMapper.toDTOList([])).toEqual([]);
      expect(GroupMapper.toDTOList([])).toEqual([]);
      expect(PositionMapper.toDTOList([])).toEqual([]);
    });
  });
});
