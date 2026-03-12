/**
 * 改进的 BaseRepository
 * 提供统一的错误处理、日志记录和性能监控
 */

import { Pool, PoolClient } from 'pg';
import { pool } from '../config/database.js';
import { logger } from '../config/logger.js';
import { HandleError } from '../utils/decorators/handleError.js';

export abstract class ImprovedBaseRepository<T> {
  protected abstract tableName: string;
  protected pool: Pool;

  constructor(dbPool: Pool = pool) {
    this.pool = dbPool;
  }

  /**
   * 执行数据库操作的统一错误处理包装器
   */
  protected async executeQuery<R>(
    operation: string,
    queryFn: () => Promise<R>,
    context?: Record<string, any>
  ): Promise<R> {
    const startTime = Date.now();
    
    try {
      const result = await queryFn();
      const duration = Date.now() - startTime;
      
      logger.info('Repository operation completed', {
        repository: this.constructor.name,
        operation,
        duration,
        tableName: this.tableName,
        ...context
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error('Repository operation failed', {
        repository: this.constructor.name,
        operation,
        duration,
        tableName: this.tableName,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        ...context
      });
      
      throw error;
    }
  }

  /**
   * 执行事务操作的统一包装器
   */
  protected async executeTransaction<R>(
    operation: string,
    transactionFn: (client: PoolClient) => Promise<R>,
    context?: Record<string, any>
  ): Promise<R> {
    return this.executeQuery(`transaction_${operation}`, async () => {
      const client = await this.pool.connect();
      
      try {
        await client.query('BEGIN');
        const result = await transactionFn(client);
        await client.query('COMMIT');
        
        logger.info('Transaction completed successfully', {
          repository: this.constructor.name,
          operation,
          tableName: this.tableName,
          ...context
        });
        
        return result;
      } catch (error) {
        await client.query('ROLLBACK');
        
        logger.error('Transaction rolled back', {
          repository: this.constructor.name,
          operation,
          tableName: this.tableName,
          error: error instanceof Error ? error.message : String(error),
          ...context
        });
        
        throw error;
      } finally {
        client.release();
      }
    });
  }

  /**
   * 抽象方法：将数据库行映射为模型对象
   */
  protected abstract mapRowToModel(row: any): T;

  /**
   * 通用的根据ID查找方法
   */
  @HandleError({ context: 'BaseRepository.findById' })
  async findById(id: string): Promise<T | null> {
    return this.executeQuery('findById', async () => {
      const query = `SELECT * FROM ${this.tableName} WHERE id = $1`;
      const result = await this.pool.query(query, [id]);
      return result.rows.length > 0 ? this.mapRowToModel(result.rows[0]) : null;
    }, { id });
  }

  /**
   * 通用的查找所有方法
   */
  @HandleError({ context: 'BaseRepository.findAll' })
  async findAll(filters?: Record<string, any>): Promise<T[]> {
    return this.executeQuery('findAll', async () => {
      let query = `SELECT * FROM ${this.tableName}`;
      const params: any[] = [];
      
      if (filters && Object.keys(filters).length > 0) {
        const conditions: string[] = [];
        let paramIndex = 1;
        
        for (const [key, value] of Object.entries(filters)) {
          if (value !== undefined && value !== null) {
            conditions.push(`${key} = $${paramIndex}`);
            params.push(value);
            paramIndex++;
          }
        }
        
        if (conditions.length > 0) {
          query += ` WHERE ${conditions.join(' AND ')}`;
        }
      }
      
      query += ' ORDER BY created_at DESC';
      
      const result = await this.pool.query(query, params);
      return result.rows.map(row => this.mapRowToModel(row));
    }, { filters, resultCount: 'pending' });
  }

  /**
   * 通用的创建方法
   */
  @HandleError({ context: 'BaseRepository.create' })
  async create(data: Partial<T>): Promise<T> {
    return this.executeQuery('create', async () => {
      const fields = Object.keys(data).filter(key => data[key as keyof T] !== undefined);
      const values = fields.map(key => data[key as keyof T]);
      const placeholders = fields.map((_, index) => `$${index + 1}`);
      
      const query = `
        INSERT INTO ${this.tableName} (${fields.join(', ')})
        VALUES (${placeholders.join(', ')})
        RETURNING *
      `;
      
      const result = await this.pool.query(query, values);
      return this.mapRowToModel(result.rows[0]);
    }, { fieldsCount: Object.keys(data).length });
  }

  /**
   * 通用的更新方法
   */
  @HandleError({ context: 'BaseRepository.update' })
  async update(id: string, data: Partial<T>): Promise<T | null> {
    return this.executeQuery('update', async () => {
      const fields = Object.keys(data).filter(key => data[key as keyof T] !== undefined);
      
      if (fields.length === 0) {
        throw new Error('No fields to update');
      }
      
      const values = fields.map(key => data[key as keyof T]);
      const setClause = fields.map((field, index) => `${field} = $${index + 1}`);
      
      const query = `
        UPDATE ${this.tableName}
        SET ${setClause.join(', ')}, updated_at = NOW()
        WHERE id = $${fields.length + 1}
        RETURNING *
      `;
      
      const result = await this.pool.query(query, [...values, id]);
      return result.rows.length > 0 ? this.mapRowToModel(result.rows[0]) : null;
    }, { id, fieldsCount: Object.keys(data).length });
  }

  /**
   * 通用的删除方法
   */
  @HandleError({ context: 'BaseRepository.delete' })
  async delete(id: string): Promise<boolean> {
    return this.executeQuery('delete', async () => {
      const query = `DELETE FROM ${this.tableName} WHERE id = $1`;
      const result = await this.pool.query(query, [id]);
      return (result.rowCount ?? 0) > 0;
    }, { id });
  }

  /**
   * 通用的计数方法
   */
  @HandleError({ context: 'BaseRepository.count' })
  async count(filters?: Record<string, any>): Promise<number> {
    return this.executeQuery('count', async () => {
      let query = `SELECT COUNT(*) as count FROM ${this.tableName}`;
      const params: any[] = [];
      
      if (filters && Object.keys(filters).length > 0) {
        const conditions: string[] = [];
        let paramIndex = 1;
        
        for (const [key, value] of Object.entries(filters)) {
          if (value !== undefined && value !== null) {
            conditions.push(`${key} = $${paramIndex}`);
            params.push(value);
            paramIndex++;
          }
        }
        
        if (conditions.length > 0) {
          query += ` WHERE ${conditions.join(' AND ')}`;
        }
      }
      
      const result = await this.pool.query(query, params);
      return parseInt(result.rows[0].count);
    }, { filters });
  }

  /**
   * 通用的分页查询方法
   */
  @HandleError({ context: 'BaseRepository.findWithPagination' })
  async findWithPagination(
    page: number = 1,
    pageSize: number = 20,
    filters?: Record<string, any>,
    orderBy: string = 'created_at DESC'
  ): Promise<{ data: T[]; total: number; page: number; pageSize: number }> {
    return this.executeQuery('findWithPagination', async () => {
      const offset = (page - 1) * pageSize;
      
      // 构建基础查询
      let baseQuery = `FROM ${this.tableName}`;
      const params: any[] = [];
      
      if (filters && Object.keys(filters).length > 0) {
        const conditions: string[] = [];
        let paramIndex = 1;
        
        for (const [key, value] of Object.entries(filters)) {
          if (value !== undefined && value !== null) {
            conditions.push(`${key} = $${paramIndex}`);
            params.push(value);
            paramIndex++;
          }
        }
        
        if (conditions.length > 0) {
          baseQuery += ` WHERE ${conditions.join(' AND ')}`;
        }
      }
      
      // 获取总数
      const countQuery = `SELECT COUNT(*) as count ${baseQuery}`;
      const countResult = await this.pool.query(countQuery, params);
      const total = parseInt(countResult.rows[0].count);
      
      // 获取分页数据
      const dataQuery = `SELECT * ${baseQuery} ORDER BY ${orderBy} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      const dataResult = await this.pool.query(dataQuery, [...params, pageSize, offset]);
      const data = dataResult.rows.map(row => this.mapRowToModel(row));
      
      return {
        data,
        total,
        page,
        pageSize
      };
    }, { page, pageSize, filters });
  }

  /**
   * 批量插入方法
   */
  @HandleError({ context: 'BaseRepository.bulkInsert' })
  async bulkInsert(items: Partial<T>[]): Promise<T[]> {
    if (items.length === 0) {
      return [];
    }

    return this.executeTransaction('bulkInsert', async (client) => {
      const results: T[] = [];
      
      for (const item of items) {
        const fields = Object.keys(item).filter(key => item[key as keyof T] !== undefined);
        const values = fields.map(key => item[key as keyof T]);
        const placeholders = fields.map((_, index) => `$${index + 1}`);
        
        const query = `
          INSERT INTO ${this.tableName} (${fields.join(', ')})
          VALUES (${placeholders.join(', ')})
          RETURNING *
        `;
        
        const result = await client.query(query, values);
        results.push(this.mapRowToModel(result.rows[0]));
      }
      
      return results;
    }, { itemsCount: items.length });
  }

  /**
   * 批量更新方法
   */
  @HandleError({ context: 'BaseRepository.bulkUpdate' })
  async bulkUpdate(updates: Array<{ id: string; data: Partial<T> }>): Promise<T[]> {
    if (updates.length === 0) {
      return [];
    }

    return this.executeTransaction('bulkUpdate', async (client) => {
      const results: T[] = [];
      
      for (const { id, data } of updates) {
        const fields = Object.keys(data).filter(key => data[key as keyof T] !== undefined);
        
        if (fields.length > 0) {
          const values = fields.map(key => data[key as keyof T]);
          const setClause = fields.map((field, index) => `${field} = $${index + 1}`);
          
          const query = `
            UPDATE ${this.tableName}
            SET ${setClause.join(', ')}, updated_at = NOW()
            WHERE id = $${fields.length + 1}
            RETURNING *
          `;
          
          const result = await client.query(query, [...values, id]);
          if (result.rows.length > 0) {
            results.push(this.mapRowToModel(result.rows[0]));
          }
        }
      }
      
      return results;
    }, { updatesCount: updates.length });
  }

  /**
   * 执行原始SQL查询
   */
  @HandleError({ context: 'BaseRepository.rawQuery' })
  async rawQuery<R = any>(
    query: string,
    params?: any[],
    operation: string = 'rawQuery'
  ): Promise<R[]> {
    return this.executeQuery(operation, async () => {
      const result = await this.pool.query(query, params);
      return result.rows;
    }, { query: query.substring(0, 100) + '...', paramsCount: params?.length || 0 });
  }
}