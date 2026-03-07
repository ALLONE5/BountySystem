import { Pool, PoolClient } from 'pg';
import { pool } from '../config/database.js';
import { QueryBuilder } from '../utils/QueryBuilder.js';
import { Validator } from '../utils/Validator.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

/**
 * Convert camelCase to snake_case
 */
function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

/**
 * Generic Repository Interface
 * Defines the contract for all repository implementations
 */
export interface IRepository<T> {
  findById(id: number): Promise<T | null>;
  findAll(filters?: Record<string, any>): Promise<T[]>;
  create(data: Partial<T>, client?: PoolClient): Promise<T>;
  update(id: number, data: Partial<T>, client?: PoolClient): Promise<T>;
  delete(id: number, client?: PoolClient): Promise<void>;
}

/**
 * Base Repository Class
 * Provides common CRUD operations for all entities
 * Uses QueryBuilder for SQL construction and Validator for input validation
 */
export abstract class BaseRepository<T extends { id?: number }> implements IRepository<T> {
  protected tableName: string;
  protected queryBuilder: QueryBuilder;
  protected validator: Validator;
  protected pool: Pool;

  constructor(tableName: string) {
    this.tableName = tableName;
    this.queryBuilder = new QueryBuilder();
    this.validator = new Validator();
    this.pool = pool;
  }

  /**
   * Get all column names for the table (to be implemented by subclasses)
   */
  protected abstract getColumns(): string[];

  /**
   * Get the primary key column name (defaults to 'id')
   */
  protected getPrimaryKey(): string {
    return 'id';
  }

  /**
   * Transform database row to model object (to be implemented by subclasses)
   */
  protected abstract mapRowToModel(row: any): T;

  /**
   * Validate data before create/update (to be implemented by subclasses)
   */
  protected abstract validateData(data: Partial<T>, isUpdate?: boolean): void;

  /**
   * Find entity by ID
   */
  async findById(id: number): Promise<T | null> {
    let client: PoolClient | null = null;
    
    try {
      // Validate ID
      Validator.required(id, 'id');
      Validator.positive(id, 'id');

      client = await this.pool.connect();
      
      const columns = this.getColumns();
      const query = new QueryBuilder()
        .select(...columns.map(col => `${this.tableName}.${col}`))
        .from(this.tableName)
        .where(`${this.tableName}.${this.getPrimaryKey()} = $1`)
        .build();

      const result = await client.query(query, [id]);

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToModel(result.rows[0]);
    } catch (error) {
      logger.error(`Error finding ${this.tableName} by id:`, error);
      throw error;
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  /**
   * Find all entities with optional filters
   */
  async findAll(filters?: Record<string, any>): Promise<T[]> {
    let client: PoolClient | null = null;
    
    try {
      client = await this.pool.connect();
      
      const columns = this.getColumns();
      const queryBuilder = new QueryBuilder()
        .select(...columns.map(col => `${this.tableName}.${col}`))
        .from(this.tableName);

      // Apply filters if provided
      if (filters) {
        let paramIndex = 1;
        const params: any[] = [];

        for (const [key, value] of Object.entries(filters)) {
          if (value !== undefined && value !== null) {
            queryBuilder.where(`${this.tableName}.${key} = $${paramIndex}`);
            params.push(value);
            paramIndex++;
          }
        }

        const query = queryBuilder.build();
        const result = await client.query(query, params);
        return result.rows.map(row => this.mapRowToModel(row));
      }

      const query = queryBuilder.build();
      const result = await client.query(query);
      return result.rows.map(row => this.mapRowToModel(row));
    } catch (error) {
      logger.error(`Error finding all ${this.tableName}:`, error);
      throw error;
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  /**
   * Create a new entity
   */
  async create(data: Partial<T>, client?: PoolClient): Promise<T> {
    const shouldReleaseClient = !client;
    let localClient = client;
    
    try {
      // Validate data
      this.validateData(data, false);

      if (!localClient) {
        localClient = await this.pool.connect();
      }

      // Build INSERT query with snake_case column names
      const keys = Object.keys(data).filter(key => data[key as keyof T] !== undefined);
      const snakeKeys = keys.map(key => toSnakeCase(key));
      const values = keys.map(key => data[key as keyof T]);
      const placeholders = keys.map((_, index) => `$${index + 1}`);

      const query = `
        INSERT INTO ${this.tableName} (${snakeKeys.join(', ')})
        VALUES (${placeholders.join(', ')})
        RETURNING *
      `;

      const result = await localClient.query(query, values);

      if (result.rows.length === 0) {
        throw new Error(`Failed to create ${this.tableName}`);
      }

      return this.mapRowToModel(result.rows[0]);
    } catch (error) {
      logger.error(`Error creating ${this.tableName}:`, error);
      throw error;
    } finally {
      if (shouldReleaseClient && localClient) {
        localClient.release();
      }
    }
  }

  /**
   * Update an existing entity
   */
  async update(id: number, data: Partial<T>, client?: PoolClient): Promise<T> {
    const shouldReleaseClient = !client;
    let localClient = client;
    
    try {
      // Validate ID
      Validator.required(id, 'id');
      Validator.positive(id, 'id');

      // Validate data
      this.validateData(data, true);

      if (!localClient) {
        localClient = await this.pool.connect();
      }

      // Check if entity exists
      const existsQuery = `SELECT ${this.getPrimaryKey()} FROM ${this.tableName} WHERE ${this.getPrimaryKey()} = $1`;
      const existsResult = await localClient.query(existsQuery, [id]);
      
      if (existsResult.rows.length === 0) {
        throw new NotFoundError(this.tableName);
      }

      // Build UPDATE query
      const keys = Object.keys(data).filter(key => data[key as keyof T] !== undefined);
      
      if (keys.length === 0) {
        throw new ValidationError('No fields to update');
      }

      const values = keys.map(key => data[key as keyof T]);
      const setClause = keys.map((key, index) => `${key} = $${index + 1}`).join(', ');

      const query = `
        UPDATE ${this.tableName}
        SET ${setClause}
        WHERE ${this.getPrimaryKey()} = $${keys.length + 1}
        RETURNING *
      `;

      const result = await localClient.query(query, [...values, id]);

      if (result.rows.length === 0) {
        throw new NotFoundError(this.tableName);
      }

      return this.mapRowToModel(result.rows[0]);
    } catch (error) {
      logger.error(`Error updating ${this.tableName}:`, error);
      throw error;
    } finally {
      if (shouldReleaseClient && localClient) {
        localClient.release();
      }
    }
  }

  /**
   * Delete an entity
   */
  async delete(id: number, client?: PoolClient): Promise<void> {
    const shouldReleaseClient = !client;
    let localClient = client;
    
    try {
      // Validate ID
      Validator.required(id, 'id');
      Validator.positive(id, 'id');

      if (!localClient) {
        localClient = await this.pool.connect();
      }

      // Check if entity exists
      const existsQuery = `SELECT ${this.getPrimaryKey()} FROM ${this.tableName} WHERE ${this.getPrimaryKey()} = $1`;
      const existsResult = await localClient.query(existsQuery, [id]);
      
      if (existsResult.rows.length === 0) {
        throw new NotFoundError(this.tableName);
      }

      const query = `DELETE FROM ${this.tableName} WHERE ${this.getPrimaryKey()} = $1`;
      await localClient.query(query, [id]);
    } catch (error) {
      logger.error(`Error deleting ${this.tableName}:`, error);
      throw error;
    } finally {
      if (shouldReleaseClient && localClient) {
        localClient.release();
      }
    }
  }

  /**
   * Execute a custom query with connection management
   */
  protected async executeQuery<R = any>(
    query: string,
    params?: any[],
    client?: PoolClient
  ): Promise<R[]> {
    const shouldReleaseClient = !client;
    let localClient = client;
    
    try {
      if (!localClient) {
        localClient = await this.pool.connect();
      }

      const result = await localClient.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error(`Error executing query on ${this.tableName}:`, error);
      throw error;
    } finally {
      if (shouldReleaseClient && localClient) {
        localClient.release();
      }
    }
  }
}
