import { Ranking, UserRankingInfo, RankingPeriod } from '../../models/Ranking.js';

export class RankingMapper {
  /**
   * Map database row to Ranking model
   */
  static mapRowToRanking(row: any): Ranking {
    if (!row) return null;

    return {
      id: row.id,
      userId: row.user_id,
      period: row.period,
      year: row.year,
      month: row.month,
      quarter: row.quarter,
      totalBounty: parseFloat(row.total_bounty),
      completedTasksCount: parseInt(row.completed_tasks_count || '0'),
      rank: row.rank,
      calculatedAt: row.calculated_at
    };
  }

  /**
   * Map Ranking model to database row
   */
  static mapRankingToRow(ranking: Partial<Ranking>): any {
    const row: any = {};

    if (ranking.id !== undefined) row.id = ranking.id;
    if (ranking.userId !== undefined) row.user_id = ranking.userId;
    if (ranking.period !== undefined) row.period = ranking.period;
    if (ranking.year !== undefined) row.year = ranking.year;
    if (ranking.month !== undefined) row.month = ranking.month;
    if (ranking.quarter !== undefined) row.quarter = ranking.quarter;
    if (ranking.totalBounty !== undefined) row.total_bounty = ranking.totalBounty;
    if (ranking.completedTasksCount !== undefined) row.completed_tasks_count = ranking.completedTasksCount;
    if (ranking.rank !== undefined) row.rank = ranking.rank;
    if (ranking.calculatedAt !== undefined) row.calculated_at = ranking.calculatedAt;

    return row;
  }

  /**
   * Map database row to UserRankingInfo model
   */
  static mapRowToUserRankingInfo(row: any): UserRankingInfo {
    if (!row) return null;

    return {
      userId: row.user_id,
      username: row['user.username'] || row.username,
      avatarId: row['user.avatarId'] || row.avatar_id,
      avatarUrl: row['user.avatarUrl'] || row.avatar_url,
      totalBounty: parseFloat(row.total_bounty),
      completedTasksCount: parseInt(row.completed_tasks_count || '0'),
      rank: row.rank,
      period: row.period,
      year: row.year,
      month: row.month,
      quarter: row.quarter,
      user: row['user.id'] ? {
        id: row['user.id'],
        username: row['user.username'],
        email: row['user.email'],
        avatarId: row['user.avatarId'],
        avatarUrl: row['user.avatarUrl'],
        role: row['user.role'],
        createdAt: row['user.createdAt'],
        lastLogin: row['user.lastLogin']
      } : undefined
    };
  }

  /**
   * Map array of database rows to Ranking models
   */
  static mapRowsToRankings(rows: any[]): Ranking[] {
    return rows.map(row => this.mapRowToRanking(row)).filter(ranking => ranking !== null);
  }

  /**
   * Map array of database rows to UserRankingInfo models
   */
  static mapRowsToUserRankingInfos(rows: any[]): UserRankingInfo[] {
    return rows.map(row => this.mapRowToUserRankingInfo(row)).filter(info => info !== null);
  }

  /**
   * Format period for display
   */
  static formatPeriod(period: RankingPeriod, year?: number, month?: number, quarter?: number): string {
    switch (period) {
      case RankingPeriod.MONTHLY:
        if (year && month) {
          const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
          ];
          return `${monthNames[month - 1]} ${year}`;
        }
        return 'Monthly';
      
      case RankingPeriod.QUARTERLY:
        if (year && quarter) {
          return `Q${quarter} ${year}`;
        }
        return 'Quarterly';
      
      case RankingPeriod.ALL_TIME:
        return 'All Time';
      
      default:
        return 'Unknown';
    }
  }

  /**
   * Format bounty amount for display
   */
  static formatBounty(amount: number): string {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`;
    } else {
      return `$${amount.toFixed(2)}`;
    }
  }

  /**
   * Format rank for display
   */
  static formatRank(rank: number): string {
    if (rank === 1) return '1st';
    if (rank === 2) return '2nd';
    if (rank === 3) return '3rd';
    return `${rank}th`;
  }

  /**
   * Get rank badge color
   */
  static getRankBadgeColor(rank: number): string {
    if (rank === 1) return 'gold';
    if (rank === 2) return 'silver';
    if (rank === 3) return 'bronze';
    if (rank <= 10) return 'blue';
    if (rank <= 50) return 'green';
    return 'gray';
  }

  /**
   * Calculate rank change (requires previous ranking)
   */
  static calculateRankChange(currentRank: number, previousRank?: number): {
    change: number;
    direction: 'up' | 'down' | 'same' | 'new';
  } {
    if (previousRank === undefined) {
      return { change: 0, direction: 'new' };
    }

    const change = previousRank - currentRank; // Positive means rank improved (lower number)
    
    if (change > 0) {
      return { change, direction: 'up' };
    } else if (change < 0) {
      return { change: Math.abs(change), direction: 'down' };
    } else {
      return { change: 0, direction: 'same' };
    }
  }

  /**
   * Get current period info
   */
  static getCurrentPeriodInfo(): {
    monthly: { year: number; month: number };
    quarterly: { year: number; quarter: number };
    yearly: { year: number };
  } {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const quarter = Math.floor(now.getMonth() / 3) + 1;

    return {
      monthly: { year, month },
      quarterly: { year, quarter },
      yearly: { year }
    };
  }
}