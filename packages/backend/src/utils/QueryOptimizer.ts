/**
 * 查询优化器
 * 提供查询性能优化工具和缓存策略
 */

import { Pool, PoolClient } from 'pg';
import { logger } from '../config/logger.js';
import { CacheService } from '../services/CacheService.js';

export interface QueryOptions {
  useCache?: boolean;
  cacheTTL?: number;
  cacheKey?: string;
  timeout?: number;
  explain?: boolean;
}

export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
  executionTime: number;
  fromCache: boolean;
  queryPlan?: any;
}

export class QueryOptimizer {
  private pool: Pool;
  private cacheService: CacheService;
  private slowQueryThreshold: number = 1000; // 1秒

  constructor(pool: Pool, cacheService: CacheService) {
    this.pool = pool;
    this.cacheService = cacheService;
  }

  /**
   * 执行优化查询
   */
  async executeOptimized<T = any>(
    sql: string,
    params: any[] = [],
    options: QueryOptions = {}
  ): Promise<QueryResult<T>> {
    const startTime = Date.now();
    const cacheKey = options.cacheKey || this.generateCacheKey(sql, params);

    // 尝试从缓存获取
    if (options.useCache !== false) {
      const cached = await this.cacheService.get<{ rows: T[]; rowCount: number }>(cacheKey);
      if (cached) {
        return {
          rows: cached.rows,
          rowCount: cached.rowCount,
          executionTime: Date.now() - startTime,
          fromCache: true
        };
      }
    }

    let client: PoolClient | undefined;
    try {
      client = await this.pool.connect();
      
      // 设置查询超时
      if (options.timeout) {
        await client.query(`SET statement_timeout = ${options.timeout}`);
      }

      let result;
      let queryPlan;

      // 如果需要执行计划分析
      if (options.explain) {
        const explainResult = await client.query(
          `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${sql}`,
          params
        );
        queryPlan = explainResult.rows[0]['QUERY PLAN'][0];
        
        // 执行实际查询
        result = await client.query(sql, params);
      } else {
        result = await client.query(sql, params);
      }

      const executionTime = Date.now() - startTime;

      // 记录慢查询
      if (executionTime > this.slowQueryThreshold) {
        logger.warn('Slow query detected', {
          sql: sql.substring(0, 200),
          executionTime,
          params: params.length
        });
      }

      const queryResult: QueryResult<T> = {
        rows: result.rows,
        rowCount: result.rowCount || 0,
        executionTime,
        fromCache: false,
        queryPlan
      };

      // 缓存结果
      if (options.useCache !== false && result.rows.length > 0) {
        const ttl = options.cacheTTL || 300; // 默认5分钟
        await this.cacheService.set(cacheKey, {
          rows: result.rows,
          rowCount: result.rowCount
        }, ttl);
      }

      return queryResult;

    } finally {
      if (client) {
        client.release();
      }
    }
  }

  /**
   * 批量查询优化
   */
  async executeBatch<T = any>(
    queries: Array<{ sql: string; params?: any[]; options?: QueryOptions }>
  ): Promise<QueryResult<T>[]> {
    const results: QueryResult<T>[] = [];
    
    // 并行执行查询
    const promises = queries.map(query => 
      this.executeOptimized<T>(query.sql, query.params, query.options)
    );

    const batchResults = await Promise.all(promises);
    return batchResults;
  }

  /**
   * 分页查询优化
   */
  async executePaginated<T = any>(
    sql: string,
    params: any[] = [],
    page: number = 1,
    limit: number = 20,
    options: QueryOptions = {}
  ): Promise<{
    data: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    executionTime: number;
  }> {
    const offset = (page - 1) * limit;
    
    // 构建分页查询
    const paginatedSql = `${sql} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    const paginatedParams = [...params, limit, offset];

    // 构建计数查询
    const countSql = `SELECT COUNT(*) as total FROM (${sql}) as count_query`;
    
    // 并行执行数据查询和计数查询
    const [dataResult, countResult] = await Promise.all([
      this.executeOptimized<T>(paginatedSql, paginatedParams, options),
      this.executeOptimized<{ total: string }>(countSql, params, {
        ...options,
        cacheKey: options.cacheKey ? `${options.cacheKey}_count` : undefined
      })
    ]);

    const total = parseInt(countResult.rows[0]?.total || '0');
    const totalPages = Math.ceil(total / limit);

    return {
      data: dataResult.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages
      },
      executionTime: dataResult.executionTime + countResult.executionTime
    };
  }

  /**
   * 聚合查询优化
   */
  async executeAggregation<T = any>(
    sql: string,
    params: any[] = [],
    options: QueryOptions = {}
  ): Promise<QueryResult<T>> {
    // 聚合查询通常适合缓存更长时间
    const aggregationOptions: QueryOptions = {
      useCache: true,
      cacheTTL: 1800, // 30分钟
      ...options
    };

    return this.executeOptimized<T>(sql, params, aggregationOptions);
  }

  /**
   * 事务查询优化
   */
  async executeTransaction<T = any>(
    queries: Array<{ sql: string; params?: any[] }>,
    options: QueryOptions = {}
  ): Promise<QueryResult<T>[]> {
    let client: PoolClient | undefined;
    const results: QueryResult<T>[] = [];
    const startTime = Date.now();

    try {
      client = await this.pool.connect();
      await client.query('BEGIN');

      for (const query of queries) {
        const queryStartTime = Date.now();
        const result = await client.query(query.sql, query.params || []);
        const executionTime = Date.now() - queryStartTime;

        results.push({
          rows: result.rows,
          rowCount: result.rowCount || 0,
          executionTime,
          fromCache: false
        });
      }

      await client.query('COMMIT');
      
      const totalTime = Date.now() - startTime;
      logger.info('Transaction completed', {
        queries: queries.length,
        totalTime
      });

      return results;

    } catch (error) {
      if (client) {
        await client.query('ROLLBACK');
      }
      logger.error('Transaction failed', { error });
      throw error;
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  /**
   * 查询性能分析
   */
  async analyzeQuery(sql: string, params: any[] = []): Promise<{
    executionTime: number;
    planningTime: number;
    cost: number;
    scanType: string;
    indexUsage: boolean;
    recommendations: string[];
  }> {
    const result = await this.executeOptimized(sql, params, { explain: true });
    const plan = result.queryPlan;

    if (!plan) {
      throw new Error('Query plan not available');
    }

    const recommendations: string[] = [];
    const scanType = plan.Plan?.['Node Type'] || 'Unknown';
    const indexUsage = scanType.includes('Index');

    // 生成优化建议
    if (!indexUsage && result.executionTime > 100) {
      recommendations.push('考虑添加索引以避免顺序扫描');
    }

    if (result.executionTime > this.slowQueryThreshold) {
      recommendations.push('查询执行时间过长，需要优化');
    }

    if (plan.Plan?.['Total Cost'] > 1000) {
      recommendations.push('查询成本较高，考虑重写查询或添加索引');
    }

    return {
      executionTime: result.executionTime,
      planningTime: plan['Planning Time'] || 0,
      cost: plan.Plan?.['Total Cost'] || 0,
      scanType,
      indexUsage,
      recommendations
    };
  }

  /**
   * 生成缓存键
   */
  private generateCacheKey(sql: string, params: any[]): string {
    const hash = require('crypto')
      .createHash('md5')
      .update(sql + JSON.stringify(params))
      .digest('hex');
    return `query:${hash}`;
  }

  /**
   * 清理查询缓存
   */
  async clearQueryCache(pattern?: string): Promise<void> {
    if (pattern) {
      await this.cacheService.deletePattern(`query:*${pattern}*`);
    } else {
      await this.cacheService.deletePattern('query:*');
    }
  }

  /**
   * 获取查询统计
   */
  async getQueryStats(): Promise<{
    slowQueries: number;
    cacheHitRate: number;
    avgExecutionTime: number;
  }> {
    // 这里可以从监控服务获取统计数据
    return {
      slowQueries: 0,
      cacheHitRate: 0.8,
      avgExecutionTime: 50
    };
  }

  /**
   * 设置慢查询阈值
   */
  setSlowQueryThreshold(threshold: number): void {
    this.slowQueryThreshold = threshold;
  }
}

// 查询构建器辅助类
export class QueryBuilder {
  private selectFields: string[] = [];
  private fromTable: string = '';
  private joinClauses: string[] = [];
  private whereConditions: string[] = [];
  private orderByFields: string[] = [];
  private limitValue?: number;
  private offsetValue?: number;
  private params: any[] = [];

  select(fields: string | string[]): this {
    if (Array.isArray(fields)) {
      this.selectFields.push(...fields);
    } else {
      this.selectFields.push(fields);
    }
    return this;
  }

  from(table: string): this {
    this.fromTable = table;
    return this;
  }

  join(table: string, condition: string): this {
    this.joinClauses.push(`JOIN ${table} ON ${condition}`);
    return this;
  }

  leftJoin(table: string, condition: string): this {
    this.joinClauses.push(`LEFT JOIN ${table} ON ${condition}`);
    return this;
  }

  where(condition: string, value?: any): this {
    if (value !== undefined) {
      this.params.push(value);
      this.whereConditions.push(`${condition} $${this.params.length}`);
    } else {
      this.whereConditions.push(condition);
    }
    return this;
  }

  orderBy(field: string, direction: 'ASC' | 'DESC' = 'ASC'): this {
    this.orderByFields.push(`${field} ${direction}`);
    return this;
  }

  limit(count: number): this {
    this.limitValue = count;
    return this;
  }

  offset(count: number): this {
    this.offsetValue = count;
    return this;
  }

  build(): { sql: string; params: any[] } {
    let sql = `SELECT ${this.selectFields.join(', ')} FROM ${this.fromTable}`;
    
    if (this.joinClauses.length > 0) {
      sql += ` ${this.joinClauses.join(' ')}`;
    }

    if (this.whereConditions.length > 0) {
      sql += ` WHERE ${this.whereConditions.join(' AND ')}`;
    }

    if (this.orderByFields.length > 0) {
      sql += ` ORDER BY ${this.orderByFields.join(', ')}`;
    }

    if (this.limitValue) {
      this.params.push(this.limitValue);
      sql += ` LIMIT $${this.params.length}`;
    }

    if (this.offsetValue) {
      this.params.push(this.offsetValue);
      sql += ` OFFSET $${this.params.length}`;
    }

    return { sql, params: this.params };
  }
}