import { pool } from '../config/database.js';
import { logger } from '../config/logger.js';
import {
  Position,
  PositionCreateDTO,
  PositionUpdateDTO,
  UserPosition,
  PositionApplication,
  PositionApplicationCreateDTO,
  PositionApplicationReviewDTO,
  ApplicationStatus,
} from '../models/Position.js';
import { AppError } from '../utils/errors.js';
import { NotificationService } from './NotificationService.js';
import { IPositionRepository } from '../repositories/PositionRepository.js';
import { PermissionChecker } from '../utils/PermissionChecker.js';
import { PositionMapper } from '../utils/mappers/PositionMapper.js';
import { Validator } from '../utils/Validator.js';
import { OwnershipValidator } from '../utils/OwnershipValidator.js';
export class PositionService {
  private readonly notificationService: NotificationService;
  private readonly applicationSelect = `
    SELECT pa.id, pa.user_id, pa.position_id, pa.reason, pa.status,
           pa.reviewed_by, pa.review_comment,
           pa.created_at, pa.reviewed_at, pa.updated_at,
           u.id as "user.id", u.username as "user.username", u.email as "user.email",
           u.avatar_id as "user.avatarId", u.role as "user.role",
           u.created_at as "user.createdAt", u.last_login as "user.lastLogin",
           p.id as "position.id", p.name as "position.name", p.description as "position.description",
           p.required_skills as "position.requiredSkills"
    FROM position_applications pa
    LEFT JOIN users u ON pa.user_id = u.id
    LEFT JOIN positions p ON pa.position_id = p.id
  `;

  constructor(
    private positionRepository?: IPositionRepository,
    private permissionChecker?: PermissionChecker
  ) {
    this.notificationService = new NotificationService();
  }

  /**
   * Create a new position
   * Requirements: 6.4
   */
  async createPosition(positionData: PositionCreateDTO): Promise<any> {
    const { name, description, requiredSkills = [] } = positionData;

    const query = `
      INSERT INTO positions (name, description, required_skills)
      VALUES ($1, $2, $3)
      RETURNING id, name, description, required_skills as "requiredSkills",
                created_at as "createdAt", updated_at as "updatedAt"
    `;

    const result = await pool.query(query, [name, description || null, requiredSkills]);
    return PositionMapper.toDTO(result.rows[0]);
  }

  /**
   * Get position by ID
   * Requirements: 6.4, 6.5
   */
  async getPositionById(positionId: string): Promise<any | null> {
    // Use repository if available, otherwise fall back to direct query
    let position: Position | null;
    
    if (this.positionRepository) {
      position = await this.positionRepository.findById(positionId);
    } else {
      // Fallback to direct query for backward compatibility
      const query = `
        SELECT id, name, description, required_skills as "requiredSkills",
               created_at as "createdAt", updated_at as "updatedAt"
        FROM positions
        WHERE id = $1
      `;

      const result = await pool.query(query, [positionId]);
      position = result.rows[0] || null;
    }

    return position ? PositionMapper.toDTO(position) : null;
  }

  /**
   * Get all positions
   * Requirements: 6.4
   */
  async getAllPositions(): Promise<any[]> {
    const query = `
      SELECT id, name, description, required_skills as "requiredSkills",
             created_at as "createdAt", updated_at as "updatedAt"
      FROM positions
      ORDER BY name
    `;

    const result = await pool.query(query);
    return PositionMapper.toDTOList(result.rows);
  }

  /**
   * Update position
   * Requirements: 6.4, 6.5, 6.8
   */
  async updatePosition(positionId: string, updates: PositionUpdateDTO): Promise<any> {
    // Use repository if available, otherwise fall back to direct query
    let updatedPosition: Position;
    
    if (this.positionRepository) {
      const position = await this.positionRepository.findById(positionId);
      if (!position) {
        throw new AppError('NOT_FOUND', 'Position not found', 404);
      }

      // Map DTO fields to model fields
      const updateData: Partial<Position> = {};
      if (updates.name !== undefined) {
        updateData.name = updates.name;
      }
      if (updates.description !== undefined) {
        updateData.description = updates.description;
      }
      if (updates.requiredSkills !== undefined) {
        updateData.requiredSkills = updates.requiredSkills;
      }

      updatedPosition = await this.positionRepository.update(positionId, updateData);
    } else {
      // Fallback to direct query for backward compatibility
      const fields: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (updates.name !== undefined) {
        fields.push(`name = $${paramCount++}`);
        values.push(updates.name);
      }

      if (updates.description !== undefined) {
        fields.push(`description = $${paramCount++}`);
        values.push(updates.description);
      }

      if (updates.requiredSkills !== undefined) {
        fields.push(`required_skills = $${paramCount++}`);
        values.push(updates.requiredSkills);
      }

      fields.push(`updated_at = NOW()`);
      values.push(positionId);

      const query = `
        UPDATE positions
        SET ${fields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING id, name, description, required_skills as "requiredSkills",
                  created_at as "createdAt", updated_at as "updatedAt"
      `;

      const result = await pool.query(query, values);
      
      if (result.rows.length === 0) {
        throw new AppError('NOT_FOUND', 'Position not found', 404);
      }

      updatedPosition = result.rows[0];
    }

    return PositionMapper.toDTO(updatedPosition);
  }

  /**
   * Update position ranking
   * Requirements: 6.4, 6.5
   * Note: This is a placeholder as the current schema doesn't have a ranking field
   */
  async updateRanking(positionId: string, ranking: number): Promise<any> {
    // Use repository if available
    let position: Position;
    
    if (this.positionRepository) {
      position = await this.positionRepository.updateRanking(positionId, ranking);
    } else {
      // Fallback: just return the position unchanged
      const pos = await this.getPositionById(positionId);
      if (!pos) {
        throw new AppError('NOT_FOUND', 'Position not found', 404);
      }
      
      logger.warn('updateRanking: positions table does not have a ranking column');
      // Return the raw position since getPositionById already returns a DTO
      return pos;
    }

    return PositionMapper.toDTO(position);
  }

  /**
   * Delete position
   */
  async deletePosition(positionId: string): Promise<void> {
    const query = 'DELETE FROM positions WHERE id = $1';
    const result = await pool.query(query, [positionId]);

    if (result.rowCount === 0) {
      throw new AppError('NOT_FOUND', 'Position not found', 404);
    }
  }

  /**
   * Get user's positions
   * Requirements: 6.4
   */
  async getUserPositions(userId: string): Promise<any[]> {
    // Use repository if available
    let positions: Position[];
    
    if (this.positionRepository) {
      positions = await this.positionRepository.findByUser(userId);
    } else {
      // Fallback to direct query
      const query = `
        SELECT p.id, p.name, p.description, p.required_skills as "requiredSkills",
               p.created_at as "createdAt", p.updated_at as "updatedAt"
        FROM positions p
        INNER JOIN user_positions up ON p.id = up.position_id
        WHERE up.user_id = $1
        ORDER BY up.granted_at DESC
      `;

      const result = await pool.query(query, [userId]);
      positions = result.rows;
    }

    return PositionMapper.toDTOList(positions);
  }

  /**
   * Check if user has a specific position
   */
  async userHasPosition(userId: string, positionId: string): Promise<boolean> {
    const query = `
      SELECT 1 FROM user_positions
      WHERE user_id = $1 AND position_id = $2
    `;

    const result = await pool.query(query, [userId, positionId]);
    return result.rows.length > 0;
  }

  /**
   * Get count of user's positions
   */
  async getUserPositionCount(userId: string): Promise<number> {
    const query = `
      SELECT COUNT(*) as count
      FROM user_positions
      WHERE user_id = $1
    `;

    const result = await pool.query(query, [userId]);
    return parseInt(result.rows[0].count, 10);
  }

  /**
   * Apply for a position
   * Validates that user doesn't already have 3 positions
   * Requirements: 6.4
   */
  async applyForPosition(applicationData: PositionApplicationCreateDTO): Promise<any> {
    const { userId, positionId, reason } = applicationData;

    // Check if user already has this position
    const hasPosition = await this.userHasPosition(userId, positionId);
    if (hasPosition) {
      throw new AppError('CONFLICT', 'User already has this position', 400);
    }

    // Check if user already has a pending application for this position
    const existingApplication = await this.getPendingApplication(userId, positionId);
    if (existingApplication) {
      throw new AppError('CONFLICT', 'User already has a pending application for this position', 400);
    }

    // Check position count (will be enforced by trigger, but we check early for better error message)
    const positionCount = await this.getUserPositionCount(userId);
    // Use Validator to check position limit
    Validator.custom(
      positionCount,
      (count) => count < 3,
      'Position count',
      'User cannot have more than 3 positions'
    );

    // Verify position exists - this now returns a DTO
    const position = await this.getPositionById(positionId);
    if (!position) {
      throw new AppError('NOT_FOUND', 'Position not found', 404);
    }

    const query = `
      INSERT INTO position_applications (user_id, position_id, reason, status)
      VALUES ($1, $2, $3, $4)
      RETURNING id, user_id as "userId", position_id as "positionId", reason, status,
                reviewed_by as "reviewedBy", review_comment as "reviewComment",
                created_at as "createdAt", reviewed_at as "reviewedAt", updated_at as "updatedAt"
    `;

    const result = await pool.query(query, [userId, positionId, reason || null, ApplicationStatus.PENDING]);

    const application = this.mapApplicationRow(result.rows[0]);

    // Notify relevant admins that a review is required
    await this.notifyAdminsReviewRequired(positionId, userId, position.name);

    return PositionMapper.toApplicationDTO(application);
  }

  /**
   * Request position replacement (batch operation)
   * This creates applications for new positions with metadata indicating it's a replacement
   * If only removing positions (no new positions), creates a single removal application
   * Requirements: 6.4
   */
  async requestPositionReplacement(
    userId: string,
    positionsToRemove: string[],
    positionsToAdd: string[]
  ): Promise<any[]> {
    // Validate that final count doesn't exceed 3
    const currentPositions = await this.getUserPositions(userId);
    const currentPositionIds = currentPositions.map((p: any) => p.id);
    
    // Calculate final position count
    const remainingPositions = currentPositionIds.filter(
      (id: string) => !positionsToRemove.includes(id)
    );
    const finalCount = remainingPositions.length + positionsToAdd.length;
    
    // Use Validator to check final count doesn't exceed 3
    Validator.custom(
      finalCount,
      (count) => count <= 3,
      'Final position count',
      `Final position count (${finalCount}) would exceed the limit of 3 positions`
    );
    
    // Use Validator to check at least one position remains
    Validator.custom(
      finalCount,
      (count) => count > 0,
      'Final position count',
      'Cannot remove all positions. At least one position must remain.'
    );

    // Get position names for better display
    const positionsToRemoveNames: string[] = [];
    for (const posId of positionsToRemove) {
      const pos = currentPositions.find((p: any) => p.id === posId);
      if (pos) {
        positionsToRemoveNames.push(pos.name);
      }
    }

    // Create applications for new positions
    const applications: any[] = [];
    
    // If only removing positions (no new positions to add), create a special removal application
    if (positionsToAdd.length === 0 && positionsToRemove.length > 0) {
      // Create a removal-only application using one of the remaining positions as the "target"
      // This is just for the application record; the actual removal happens on approval
      const remainingPositionId = remainingPositions[0];
      const remainingPosition = currentPositions.find((p: any) => p.id === remainingPositionId);
      
      if (!remainingPosition) {
        throw new AppError('NOT_FOUND', 'No remaining position found', 404);
      }

      const replacementData = {
        type: 'removal-only',
        positionsToRemove,
        positionsToRemoveNames,
        oldPositions: positionsToRemoveNames.join(', '),
        remainingPosition: remainingPosition.name,
      };
      
      const reason = JSON.stringify(replacementData);
      
      const query = `
        INSERT INTO position_applications (user_id, position_id, reason, status)
        VALUES ($1, $2, $3, $4)
        RETURNING id, user_id as "userId", position_id as "positionId", reason, status,
                  reviewed_by as "reviewedBy", review_comment as "reviewComment",
                  created_at as "createdAt", reviewed_at as "reviewedAt", updated_at as "updatedAt"
      `;

      const result = await pool.query(query, [userId, remainingPositionId, reason, 'pending']);
      const application = this.mapApplicationRow(result.rows[0]);
      applications.push(PositionMapper.toApplicationDTO(application));

      // Notify admins about the removal request
      await this.notifyAdminsReviewRequired(remainingPositionId, userId, remainingPosition.name);
      
      return applications;
    }
    
    // Normal case: adding new positions (with or without removals)
    for (const positionId of positionsToAdd) {
      // Check if user already has this position
      const hasPosition = await this.userHasPosition(userId, positionId);
      if (hasPosition) {
        continue; // Skip positions user already has
      }

      // Check if user already has a pending application
      const existingApplication = await this.getPendingApplication(userId, positionId);
      if (existingApplication) {
        continue; // Skip if already applied
      }

      // Verify position exists
      const position = await this.getPositionById(positionId);
      if (!position) {
        throw new AppError('NOT_FOUND', `Position ${positionId} not found`, 404);
      }

      // Create application with replacement metadata in JSON format
      const replacementData = {
        type: 'replacement',
        positionsToRemove,
        positionsToRemoveNames,
        oldPositions: positionsToRemoveNames.join(', ') || '无',
        newPosition: position.name,
      };
      
      const reason = JSON.stringify(replacementData);
      
      const query = `
        INSERT INTO position_applications (user_id, position_id, reason, status)
        VALUES ($1, $2, $3, $4)
        RETURNING id, user_id as "userId", position_id as "positionId", reason, status,
                  reviewed_by as "reviewedBy", review_comment as "reviewComment",
                  created_at as "createdAt", reviewed_at as "reviewedAt", updated_at as "updatedAt"
      `;

      const result = await pool.query(query, [userId, positionId, reason, 'pending']);
      const application = this.mapApplicationRow(result.rows[0]);
      applications.push(PositionMapper.toApplicationDTO(application));

      // Notify admins
      await this.notifyAdminsReviewRequired(positionId, userId, position.name);
    }

    return applications;
  }

  /**
   * Get pending application for user and position
   * Requirements: 6.4
   */
  async getPendingApplication(userId: string, positionId: string): Promise<any | null> {
    const query = `
      ${this.applicationSelect}
      WHERE pa.user_id = $1 AND pa.position_id = $2 AND pa.status = $3
    `;

    const result = await pool.query(query, [userId, positionId, ApplicationStatus.PENDING]);
    const application = result.rows[0] ? this.mapApplicationRow(result.rows[0]) : null;
    return application ? PositionMapper.toApplicationDTO(application) : null;
  }

  /**
   * Get application by ID
   * Requirements: 6.4
   */
  async getApplicationById(applicationId: string): Promise<any | null> {
    const query = `
      ${this.applicationSelect}
      WHERE pa.id = $1
    `;

    const result = await pool.query(query, [applicationId]);
    const application = result.rows[0] ? this.mapApplicationRow(result.rows[0]) : null;
    return application ? PositionMapper.toApplicationDTO(application) : null;
  }

  /**
   * Get all applications for a user
   * Requirements: 6.4
   */
  async getUserApplications(userId: string): Promise<any[]> {
    const query = `
      ${this.applicationSelect}
      WHERE pa.user_id = $1
      ORDER BY pa.created_at DESC
    `;

    const result = await pool.query(query, [userId]);
    const applications = result.rows.map((row) => this.mapApplicationRow(row));
    return PositionMapper.toApplicationDTOList(applications);
  }

  /**
   * Get pending applications for a position
   * Requirements: 6.4
   */
  async getPendingApplicationsForPosition(positionId: string): Promise<any[]> {
    const query = `
      ${this.applicationSelect}
      WHERE pa.position_id = $1 AND pa.status = $2
      ORDER BY pa.created_at ASC
    `;

    const result = await pool.query(query, [positionId, ApplicationStatus.PENDING]);
    const applications = result.rows.map((row) => this.mapApplicationRow(row));
    return PositionMapper.toApplicationDTOList(applications);
  }

  /**
   * Review position application (approve or reject)
   * If approved, grants the position to the user
   * Requirements: 6.4
   */
  async reviewApplication(reviewData: PositionApplicationReviewDTO): Promise<any> {
    const { applicationId, reviewerId, approved, reviewComment } = reviewData;

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get the application
      const appQuery = `
        SELECT id, user_id as "userId", position_id as "positionId", reason, status,
               reviewed_by as "reviewedBy", review_comment as "reviewComment",
               created_at as "createdAt", reviewed_at as "reviewedAt", updated_at as "updatedAt"
        FROM position_applications
        WHERE id = $1
        FOR UPDATE
      `;

      const appResult = await client.query(appQuery, [applicationId]);

      if (appResult.rows.length === 0) {
        throw new AppError('NOT_FOUND', 'Application not found', 404);
      }

      const application = appResult.rows[0];

      // Use Validator to check application status
      Validator.custom(
        application.status,
        (status) => status === ApplicationStatus.PENDING,
        'Application status',
        'Application has already been reviewed'
      );

      const newStatus = approved ? ApplicationStatus.APPROVED : ApplicationStatus.REJECTED;

      // Update application status
      const updateQuery = `
        UPDATE position_applications
        SET status = $1, reviewed_by = $2, review_comment = $3, reviewed_at = NOW(), updated_at = NOW()
        WHERE id = $4
        RETURNING id, user_id as "userId", position_id as "positionId", reason, status,
                  reviewed_by as "reviewedBy", review_comment as "reviewComment",
                  created_at as "createdAt", reviewed_at as "reviewedAt", updated_at as "updatedAt"
      `;

      await client.query(updateQuery, [
        newStatus,
        reviewerId,
        reviewComment || null,
        applicationId,
      ]);

      // If approved, grant the position to the user
      if (approved) {
        // Check if this is a replacement or removal-only application
        let isReplacement = false;
        let isRemovalOnly = false;
        let positionsToRemove: string[] = [];
        
        try {
          const reasonData = JSON.parse(application.reason);
          if (reasonData.type === 'replacement' && Array.isArray(reasonData.positionsToRemove)) {
            isReplacement = true;
            positionsToRemove = reasonData.positionsToRemove;
          } else if (reasonData.type === 'removal-only' && Array.isArray(reasonData.positionsToRemove)) {
            isRemovalOnly = true;
            positionsToRemove = reasonData.positionsToRemove;
          }
        } catch (e) {
          // Not a JSON reason, treat as regular application
        }

        // If it's a replacement or removal-only, remove old positions first
        if ((isReplacement || isRemovalOnly) && positionsToRemove.length > 0) {
          for (const posIdToRemove of positionsToRemove) {
            const removeQuery = `
              DELETE FROM user_positions
              WHERE user_id = $1 AND position_id = $2
            `;
            await client.query(removeQuery, [application.userId, posIdToRemove]);
          }
        }

        // For removal-only applications, we don't grant a new position
        // For regular and replacement applications, grant the new position
        if (!isRemovalOnly) {
          try {
            const grantQuery = `
              INSERT INTO user_positions (user_id, position_id)
              VALUES ($1, $2)
              ON CONFLICT (user_id, position_id) DO NOTHING
            `;

            await client.query(grantQuery, [application.userId, application.positionId]);
          } catch (error: any) {
            // If the trigger rejects due to position limit, we need to handle it
            if (error.message && error.message.includes('cannot have more than 3 positions')) {
              throw new AppError('VALIDATION_ERROR', 'User cannot have more than 3 positions', 400);
            }
            throw error;
          }
        }
      }

      const enrichedResult = await client.query(
        `${this.applicationSelect}
         WHERE pa.id = $1`,
        [applicationId]
      );

      await client.query('COMMIT');

      // Notify user about the review result
      const finalApplication = this.mapApplicationRow(enrichedResult.rows[0]);
      
      if (finalApplication.position && finalApplication.userId) {
        if (approved) {
          await this.notificationService.notifyPositionApproved(finalApplication.userId, finalApplication.position.name);
        } else {
          await this.notificationService.notifyPositionRejected(finalApplication.userId, finalApplication.position.name, reviewComment);
        }
      }

      return PositionMapper.toApplicationDTO(finalApplication);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Grant position to user directly (without application process)
   */
  async grantPosition(userId: string, positionId: string): Promise<UserPosition> {
    // Check if user already has this position
    const hasPosition = await this.userHasPosition(userId, positionId);
    if (hasPosition) {
      throw new AppError('CONFLICT', 'User already has this position', 400);
    }

    // The trigger will enforce the 3-position limit
    const query = `
      INSERT INTO user_positions (user_id, position_id)
      VALUES ($1, $2)
      RETURNING id, user_id as "userId", position_id as "positionId", granted_at as "grantedAt"
    `;

    try {
      const result = await pool.query(query, [userId, positionId]);
      return result.rows[0];
    } catch (error: any) {
      if (error.message && error.message.includes('cannot have more than 3 positions')) {
        throw new AppError('VALIDATION_ERROR', 'User cannot have more than 3 positions', 400);
      }
      throw error;
    }
  }

  /**
   * Revoke position from user
   */
  async revokePosition(userId: string, positionId: string): Promise<void> {
    const query = 'DELETE FROM user_positions WHERE user_id = $1 AND position_id = $2';
    const result = await pool.query(query, [userId, positionId]);

    if (result.rowCount === 0) {
      throw new AppError('NOT_FOUND', 'User does not have this position', 404);
    }
  }

  /**
   * Get all pending applications (for super admin)
   * Requirements: 6.4, 17.1
   */
  async getAllPendingApplications(): Promise<any[]> {
    const query = `
      ${this.applicationSelect}
      WHERE pa.status = $1
      ORDER BY pa.created_at ASC
    `;

    const result = await pool.query(query, [ApplicationStatus.PENDING]);
    const applications = result.rows.map((row) => this.mapApplicationRow(row));
    return PositionMapper.toApplicationDTOList(applications);
  }

  /**
   * Get all applications (all statuses, for super admin)
   * Requirements: 6.4, 17.1
   */
  async getAllApplications(): Promise<any[]> {
    const query = `
      ${this.applicationSelect}
      ORDER BY pa.created_at DESC
    `;

    const result = await pool.query(query);
    const applications = result.rows.map((row) => this.mapApplicationRow(row));
    return PositionMapper.toApplicationDTOList(applications);
  }

  /**
   * Get pending applications by position IDs (for position admin)
   * Requirements: 6.4, 17.1
   */
  async getPendingApplicationsByPositions(positionIds: string[]): Promise<any[]> {
    if (positionIds.length === 0) {
      return [];
    }

    const query = `
      ${this.applicationSelect}
      WHERE pa.status = $1 AND pa.position_id = ANY($2)
      ORDER BY pa.created_at ASC
    `;

    const result = await pool.query(query, [ApplicationStatus.PENDING, positionIds]);
    const applications = result.rows.map((row) => this.mapApplicationRow(row));
    return PositionMapper.toApplicationDTOList(applications);
  }

  /**
   * Get applications by position IDs (all statuses, for position admin)
   * Requirements: 6.4, 17.1
   */
  async getApplicationsByPositions(positionIds: string[]): Promise<any[]> {
    if (positionIds.length === 0) {
      return [];
    }

    const query = `
      ${this.applicationSelect}
      WHERE pa.position_id = ANY($1)
      ORDER BY pa.created_at DESC
    `;

    const result = await pool.query(query, [positionIds]);
    const applications = result.rows.map((row) => this.mapApplicationRow(row));
    return PositionMapper.toApplicationDTOList(applications);
  }

  /**
   * Review application (simplified interface for admin routes)
   * Requirements: 6.4, 17.3, 17.4
   */
  async reviewApplicationSimple(
    applicationId: string,
    reviewerId: string,
    approved: boolean,
    reviewComment?: string
  ): Promise<any> {
    return this.reviewApplication({
      applicationId,
      reviewerId,
      approved,
      reviewComment,
    });
  }

  private mapApplicationRow(row: any): PositionApplication {
    const user = row['user.id']
      ? {
          id: row['user.id'],
          username: row['user.username'],
          email: row['user.email'],
          avatarId: row['user.avatarId'],
          role: row['user.role'],
          createdAt: row['user.createdAt'],
          lastLogin: row['user.lastLogin'],
        }
      : undefined;

    const position = row['position.id']
      ? {
          id: row['position.id'],
          name: row['position.name'],
          description: row['position.description'],
          requiredSkills: row['position.requiredSkills'] ?? [],
        }
      : undefined;

    return {
      id: row.id,
      userId: row.user_id ?? row.userId,
      positionId: row.position_id ?? row.positionId,
      reason: row.reason ?? null,
      status: row.status,
      reviewedBy: row.reviewed_by ?? row.reviewedBy ?? null,
      reviewComment: row.review_comment ?? row.reviewComment ?? null,
      createdAt: row.created_at ?? row.createdAt,
      reviewedAt: row.reviewed_at ?? row.reviewedAt ?? null,
      updatedAt: row.updated_at ?? row.updatedAt,
      user,
      position,
    };
  }

  private async notifyAdminsReviewRequired(positionId: string, applicantId: string, positionName: string) {
    // Get applicant username
    const userResult = await pool.query('SELECT username FROM users WHERE id = $1', [applicantId]);
    const applicantName = userResult.rows[0]?.username || '用户';

    // Collect admins: super admins + position admins for this position
    const adminQuery = `
      SELECT DISTINCT id FROM (
        SELECT id FROM users WHERE role = 'super_admin'
        UNION
        SELECT admin_id as id FROM position_admins WHERE position_id = $1
      ) admins
    `;

    const adminResult = await pool.query(adminQuery, [positionId]);
    const adminIds = adminResult.rows.map((row: any) => row.id).filter(Boolean);

    if (adminIds.length === 0) return;

    const title = '有新的审核请求';
    const message = `${applicantName} 申请了岗位 ${positionName}，请及时审核。`;

    await this.notificationService.notifyAdminsReviewRequired(adminIds, title, message);
  }
}
