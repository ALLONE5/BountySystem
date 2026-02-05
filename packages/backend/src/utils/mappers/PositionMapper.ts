import { Position, PositionApplication, ApplicationStatus } from '../../models/Position.js';
import { UserMapper } from './UserMapper.js';

/**
 * Position data mapper
 * Transforms Position models to DTOs with proper type conversions
 */
export class PositionMapper {
  /**
   * Map Position model to DTO
   * Handles null/undefined values gracefully
   */
  static toDTO(position: any): any {
    if (!position) return null;

    return {
      id: position.id,
      name: position.name,
      description: position.description ?? null,
      requiredSkills: position.requiredSkills ?? position.required_skills ?? [],
      createdAt: position.createdAt ?? position.created_at,
      updatedAt: position.updatedAt ?? position.updated_at,
    };
  }

  /**
   * Map array of Position models to DTOs
   */
  static toDTOList(positions: any[]): any[] {
    if (!positions || !Array.isArray(positions)) return [];
    return positions.map(position => this.toDTO(position));
  }

  /**
   * Map PositionApplication model to DTO
   * Handles nested object transformations (user, position)
   */
  static toApplicationDTO(application: any): any {
    if (!application) return null;

    return {
      id: application.id,
      userId: application.userId ?? application.user_id,
      positionId: application.positionId ?? application.position_id,
      reason: application.reason ?? null,
      status: application.status ?? ApplicationStatus.PENDING,
      reviewedBy: application.reviewedBy ?? application.reviewed_by ?? null,
      reviewComment: application.reviewComment ?? application.review_comment ?? null,
      createdAt: application.createdAt ?? application.created_at,
      reviewedAt: application.reviewedAt ?? application.reviewed_at ?? null,
      updatedAt: application.updatedAt ?? application.updated_at,
      user: application.user ? UserMapper.toUserResponse(application.user) : undefined,
      position: application.position ? this.toDTO(application.position) : undefined,
    };
  }

  /**
   * Map array of PositionApplication models to DTOs
   */
  static toApplicationDTOList(applications: any[]): any[] {
    if (!applications || !Array.isArray(applications)) return [];
    return applications.map(application => this.toApplicationDTO(application));
  }

  /**
   * Extract position from joined query with prefix
   */
  static extractPositionFromJoin(row: any, prefix: string): any | undefined {
    const idKey = `${prefix}.id`;
    if (!row[idKey]) return undefined;

    return {
      id: row[idKey],
      name: row[`${prefix}.name`],
      description: row[`${prefix}.description`],
      requiredSkills: row[`${prefix}.requiredSkills`],
      createdAt: row[`${prefix}.createdAt`],
      updatedAt: row[`${prefix}.updatedAt`],
    };
  }

  /**
   * Get SELECT fields for position query
   */
  static getSelectFields(alias: string = 'p'): string[] {
    return [
      `${alias}.id`,
      `${alias}.name`,
      `${alias}.description`,
      `${alias}.required_skills as "requiredSkills"`,
      `${alias}.created_at as "createdAt"`,
      `${alias}.updated_at as "updatedAt"`,
    ];
  }

  /**
   * Get SELECT fields for joined position (with prefix)
   */
  static getJoinedSelectFields(alias: string, prefix: string): string[] {
    return [
      `${alias}.id as "${prefix}.id"`,
      `${alias}.name as "${prefix}.name"`,
      `${alias}.description as "${prefix}.description"`,
      `${alias}.required_skills as "${prefix}.requiredSkills"`,
      `${alias}.created_at as "${prefix}.createdAt"`,
      `${alias}.updated_at as "${prefix}.updatedAt"`,
    ];
  }

  /**
   * Get SELECT fields for position application query
   */
  static getApplicationSelectFields(alias: string = 'pa'): string[] {
    return [
      `${alias}.id`,
      `${alias}.user_id as "userId"`,
      `${alias}.position_id as "positionId"`,
      `${alias}.reason`,
      `${alias}.status`,
      `${alias}.reviewed_by as "reviewedBy"`,
      `${alias}.review_comment as "reviewComment"`,
      `${alias}.created_at as "createdAt"`,
      `${alias}.reviewed_at as "reviewedAt"`,
      `${alias}.updated_at as "updatedAt"`,
    ];
  }
}
