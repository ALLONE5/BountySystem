import type { Task, TaskStatus, Visibility } from '../../models/Task.js';
import { UserMapper } from './UserMapper.js';

/**
 * Task data mapper
 * Transforms Task models to DTOs with proper type conversions
 */
export class TaskMapper {
  /**
   * Map Task model to DTO
   * Handles nested object transformations (publisher, assignee, positions)
   * Handles null/undefined values gracefully
   */
  static toDTO(task: any): any {
    if (!task) return null;

    return {
      id: task.id,
      name: task.name,
      description: task.description ?? null,
      parentId: task.parentId ?? task.parent_id ?? null,
      depth: task.depth ?? 0,
      isExecutable: task.isExecutable ?? task.is_executable ?? false,
      
      // Task attributes
      tags: task.tags ?? [],
      createdAt: task.createdAt ?? task.created_at,
      plannedStartDate: task.plannedStartDate ?? task.planned_start_date ?? null,
      plannedEndDate: task.plannedEndDate ?? task.planned_end_date ?? null,
      actualStartDate: task.actualStartDate ?? task.actual_start_date ?? null,
      actualEndDate: task.actualEndDate ?? task.actual_end_date ?? null,
      estimatedHours: task.estimatedHours ?? task.estimated_hours ?? null,
      complexity: task.complexity ?? null,
      priority: task.priority ?? null,
      status: task.status ?? TaskStatus.NOT_STARTED,
      positionId: task.positionId ?? task.position_id ?? null,
      visibility: task.visibility ?? Visibility.PUBLIC,
      
      // Bounty information
      bountyAmount: task.bountyAmount ?? task.bounty_amount ?? 0,
      bountyAlgorithmVersion: task.bountyAlgorithmVersion ?? task.bounty_algorithm_version ?? null,
      isBountySettled: task.isBountySettled ?? task.is_bounty_settled ?? false,
      
      // Relationships
      publisherId: task.publisherId ?? task.publisher_id,
      assigneeId: task.assigneeId ?? task.assignee_id ?? null,
      groupId: task.groupId ?? task.group_id ?? null,
      groupName: task.groupName ?? task.group_name ?? undefined,
      projectGroupId: task.projectGroupId ?? task.project_group_id ?? null,
      projectGroupName: task.projectGroupName ?? task.project_group_name ?? undefined,
      
      // Nested objects
      publisher: task.publisher ? UserMapper.toUserResponse(task.publisher) : undefined,
      assignee: task.assignee ? UserMapper.toUserResponse(task.assignee) : undefined,
      
      // Progress tracking
      progress: task.progress ?? 0,
      progressLocked: task.progressLocked ?? task.progress_locked ?? false,
      
      // Aggregated statistics
      aggregatedEstimatedHours: task.aggregatedEstimatedHours ?? task.aggregated_estimated_hours ?? null,
      aggregatedComplexity: task.aggregatedComplexity ?? task.aggregated_complexity ?? null,
      
      updatedAt: task.updatedAt ?? task.updated_at,
    };
  }

  /**
   * Map array of Task models to DTOs
   */
  static toDTOList(tasks: any[]): any[] {
    if (!tasks || !Array.isArray(tasks)) return [];
    return tasks.map(task => this.toDTO(task));
  }

  /**
   * Get SELECT fields for task query
   */
  static getSelectFields(alias: string = 't'): string[] {
    return [
      `${alias}.id`,
      `${alias}.name`,
      `${alias}.description`,
      `${alias}.parent_id as "parentId"`,
      `${alias}.depth`,
      `${alias}.is_executable as "isExecutable"`,
      `${alias}.tags`,
      `${alias}.created_at as "createdAt"`,
      `${alias}.planned_start_date as "plannedStartDate"`,
      `${alias}.planned_end_date as "plannedEndDate"`,
      `${alias}.actual_start_date as "actualStartDate"`,
      `${alias}.actual_end_date as "actualEndDate"`,
      `${alias}.estimated_hours as "estimatedHours"`,
      `${alias}.complexity`,
      `${alias}.priority`,
      `${alias}.status`,
      `${alias}.position_id as "positionId"`,
      `${alias}.visibility`,
      `${alias}.bounty_amount as "bountyAmount"`,
      `${alias}.bounty_algorithm_version as "bountyAlgorithmVersion"`,
      `${alias}.is_bounty_settled as "isBountySettled"`,
      `${alias}.publisher_id as "publisherId"`,
      `${alias}.assignee_id as "assigneeId"`,
      `${alias}.group_id as "groupId"`,
      `${alias}.project_group_id as "projectGroupId"`,
      `${alias}.progress`,
      `${alias}.progress_locked as "progressLocked"`,
      `${alias}.aggregated_estimated_hours as "aggregatedEstimatedHours"`,
      `${alias}.aggregated_complexity as "aggregatedComplexity"`,
      `${alias}.updated_at as "updatedAt"`,
    ];
  }
}
