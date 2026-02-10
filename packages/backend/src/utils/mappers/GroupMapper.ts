import type { TaskGroup, TaskGroupWithMembers, GroupMemberDetail } from '../../models/TaskGroup.js';
import { UserMapper } from './UserMapper.js';

/**
 * TaskGroup data mapper
 * Transforms TaskGroup models to DTOs with proper type conversions
 */
export class GroupMapper {
  /**
   * Map TaskGroup model to DTO
   * Handles null/undefined values gracefully
   */
  static toDTO(group: any): any {
    if (!group) return null;

    return {
      id: group.id,
      name: group.name,
      description: group.description ?? null,
      creatorId: group.creatorId ?? group.creator_id,
      createdAt: group.createdAt ?? group.created_at,
      updatedAt: group.updatedAt ?? group.updated_at,
    };
  }

  /**
   * Map TaskGroupWithMembers model to DTO
   * Handles nested object transformations (members)
   */
  static toWithMembersDTO(group: any): any {
    if (!group) return null;

    return {
      ...this.toDTO(group),
      memberIds: group.memberIds ?? [],
      members: group.members ? this.mapMembersToDTOList(group.members) : undefined,
    };
  }

  /**
   * Map GroupMemberDetail to DTO
   */
  static mapMemberToDTO(member: any): any {
    if (!member) return null;

    return {
      id: member.id,
      groupId: member.groupId ?? member.group_id,
      userId: member.userId ?? member.user_id,
      joinedAt: member.joinedAt ?? member.joined_at,
      username: member.username,
      email: member.email,
      role: member.role,
      avatarId: member.avatarId ?? member.avatar_id,
    };
  }

  /**
   * Map array of GroupMemberDetail to DTOs
   */
  static mapMembersToDTOList(members: any[]): any[] {
    if (!members || !Array.isArray(members)) return [];
    return members.map(member => this.mapMemberToDTO(member));
  }

  /**
   * Map array of TaskGroup models to DTOs
   */
  static toDTOList(groups: any[]): any[] {
    if (!groups || !Array.isArray(groups)) return [];
    return groups.map(group => this.toDTO(group));
  }

  /**
   * Map array of TaskGroupWithMembers models to DTOs
   */
  static toWithMembersDTOList(groups: any[]): any[] {
    if (!groups || !Array.isArray(groups)) return [];
    return groups.map(group => this.toWithMembersDTO(group));
  }

  /**
   * Get SELECT fields for group query
   */
  static getSelectFields(alias: string = 'tg'): string[] {
    return [
      `${alias}.id`,
      `${alias}.name`,
      `${alias}.description`,
      `${alias}.creator_id as "creatorId"`,
      `${alias}.created_at as "createdAt"`,
      `${alias}.updated_at as "updatedAt"`,
    ];
  }
}
