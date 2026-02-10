import { Pool } from 'pg';
import { logger } from '../config/logger.js';
import { Avatar, AvatarCreateDTO, AvatarUpdateDTO } from '../models/Avatar.js';
import { RankingService } from './RankingService.js';
import { RankingPeriod } from '../models/Ranking.js';
import { AppError } from '../utils/errors.js';
import { CacheService } from './CacheService.js';
export class AvatarService {
  private rankingService: RankingService;

  constructor(private pool: Pool) {
    this.rankingService = new RankingService(pool);
  }

  /**
   * Create a new avatar
   */
  async createAvatar(data: AvatarCreateDTO): Promise<Avatar> {
    const query = `
      INSERT INTO avatars (name, image_url, required_rank)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const params = [data.name, data.imageUrl, data.requiredRank];

    const result = await this.pool.query(query, params);
    return this.mapRowToAvatar(result.rows[0]);
  }

  /**
   * Get avatar by ID
   */
  async getAvatarById(id: string): Promise<Avatar | null> {
    const query = 'SELECT * FROM avatars WHERE id = $1';
    const result = await this.pool.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToAvatar(result.rows[0]);
  }

  /**
   * Get all avatars
   */
  async getAllAvatars(): Promise<Avatar[]> {
    const query = 'SELECT * FROM avatars ORDER BY required_rank ASC';
    const result = await this.pool.query(query);
    return result.rows.map(this.mapRowToAvatar);
  }

  /**
   * Update avatar
   */
  async updateAvatar(id: string, data: AvatarUpdateDTO): Promise<Avatar> {
    const avatar = await this.getAvatarById(id);
    if (!avatar) {
      throw new AppError('NOT_FOUND', 'Avatar not found', 404);
    }

    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      params.push(data.name);
    }

    if (data.imageUrl !== undefined) {
      updates.push(`image_url = $${paramIndex++}`);
      params.push(data.imageUrl);
    }

    if (data.requiredRank !== undefined) {
      updates.push(`required_rank = $${paramIndex++}`);
      params.push(data.requiredRank);
    }

    if (updates.length === 0) {
      return avatar;
    }

    params.push(id);
    const query = `
      UPDATE avatars
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await this.pool.query(query, params);
    return this.mapRowToAvatar(result.rows[0]);
  }

  /**
   * Delete avatar
   */
  async deleteAvatar(id: string): Promise<void> {
    const result = await this.pool.query('DELETE FROM avatars WHERE id = $1', [
      id,
    ]);

    if (result.rowCount === 0) {
      throw new AppError('NOT_FOUND', 'Avatar not found', 404);
    }
  }

  /**
   * Get available avatars for a user based on their ranking
   * Uses last month's ranking to determine unlocked avatars
   */
  async getAvailableAvatarsForUser(userId: string): Promise<Avatar[]> {
    // Get user's ranking from last month
    const now = new Date();
    const lastMonth = now.getMonth() === 0 ? 12 : now.getMonth();
    const lastMonthYear =
      now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

    const userRanking = await this.rankingService.getUserRanking(
      userId,
      RankingPeriod.MONTHLY,
      lastMonthYear,
      lastMonth
    );

    // If the user has no ranking (e.g., new or no completed tasks last month), allow all avatars.
    if (!userRanking) {
      const all = await this.getAllAvatars();
      return all;
    }

    const userRank = userRanking.rank;

    // Users can access avatars where required_rank >= their rank (higher required_rank means easier to unlock)
    const query = `
      SELECT * FROM avatars
      WHERE required_rank >= $1
      ORDER BY required_rank ASC
    `;

    const result = await this.pool.query(query, [userRank]);
    return result.rows.map(this.mapRowToAvatar);
  }

  /**
   * Check if user can select a specific avatar
   */
  async canUserSelectAvatar(
    userId: string,
    avatarId: string
  ): Promise<boolean> {
    const avatar = await this.getAvatarById(avatarId);
    if (!avatar) {
      return false;
    }

    const availableAvatars = await this.getAvailableAvatarsForUser(userId);
    return availableAvatars.some((a) => a.id === avatarId);
  }

  /**
   * Select avatar for user
   */
  async selectAvatarForUser(
    userId: string,
    avatarId: string
  ): Promise<void> {
    // Verify avatar exists
    const avatar = await this.getAvatarById(avatarId);
    if (!avatar) {
      throw new AppError('NOT_FOUND', 'Avatar not found', 404);
    }

    // Check if user can select this avatar
    const canSelect = await this.canUserSelectAvatar(userId, avatarId);
    if (!canSelect) {
      throw new AppError(
        'AVATAR_LOCKED',
        'Avatar is locked. Improve your ranking to unlock this avatar.',
        403
      );
    }

    // Update user's avatar
    const query = 'UPDATE users SET avatar_id = $1 WHERE id = $2';
    const result = await this.pool.query(query, [avatarId, userId]);

    if (result.rowCount === 0) {
      throw new AppError('NOT_FOUND', 'User not found', 404);
    }

    // Invalidate related caches so the new avatar shows up immediately
    try {
      await Promise.all([
        CacheService.invalidateUserProfile(userId),
        CacheService.invalidateUserAvatars(userId),
      ]);
    } catch (cacheError) {
      logger.warn('Failed to invalidate avatar caches:', cacheError);
    }
  }

  /**
   * Get user's current avatar
   */
  async getUserAvatar(userId: string): Promise<Avatar | null> {
    const query = `
      SELECT a.* FROM avatars a
      JOIN users u ON u.avatar_id = a.id
      WHERE u.id = $1
    `;

    const result = await this.pool.query(query, [userId]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToAvatar(result.rows[0]);
  }

  /**
   * Update avatar unlock permissions for all users based on last month's rankings
   * This should be called at the beginning of each month
   */
  async updateAvatarUnlockPermissions(): Promise<void> {
    // This is handled automatically by the getAvailableAvatarsForUser method
    // which checks the user's last month ranking
    // No database updates needed as permissions are calculated on-demand
    
    // However, we could cache this information if needed for performance
    // For now, we'll just ensure rankings are up to date
    const now = new Date();
    const lastMonth = now.getMonth() === 0 ? 12 : now.getMonth();
    const lastMonthYear =
      now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

    await this.rankingService.calculateRankings(
      RankingPeriod.MONTHLY,
      lastMonthYear,
      lastMonth
    );
  }

  private mapRowToAvatar(row: any): Avatar {
    return {
      id: row.id,
      name: row.name,
      imageUrl: row.image_url,
      requiredRank: row.required_rank,
      createdAt: row.created_at,
    };
  }
}
