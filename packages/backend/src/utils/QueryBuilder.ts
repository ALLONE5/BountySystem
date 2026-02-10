/**
 * SQL Query Builder
 * Provides a fluent interface for building SQL queries
 * Reduces code duplication and improves maintainability
 */
export class QueryBuilder {
  private selectFields: string[] = [];
  private fromTable: string = '';
  private joins: Array<{ type: string; table: string; on: string }> = [];
  private whereClauses: string[] = [];
  private groupByFields: string[] = [];
  private havingClauses: string[] = [];
  private orderByFields: Array<{ field: string; direction: 'ASC' | 'DESC' }> = [];
  private limitValue?: number;
  private offsetValue?: number;

  /**
   * Add SELECT fields
   */
  select(...fields: string[]): this {
    this.selectFields.push(...fields);
    return this;
  }

  /**
   * Set FROM table
   */
  from(table: string): this {
    this.fromTable = table;
    return this;
  }

  /**
   * Add LEFT JOIN
   */
  leftJoin(table: string, on: string): this {
    this.joins.push({ type: 'LEFT JOIN', table, on });
    return this;
  }

  /**
   * Add INNER JOIN
   */
  innerJoin(table: string, on: string): this {
    this.joins.push({ type: 'INNER JOIN', table, on });
    return this;
  }

  /**
   * Add RIGHT JOIN
   */
  rightJoin(table: string, on: string): this {
    this.joins.push({ type: 'RIGHT JOIN', table, on });
    return this;
  }

  /**
   * Add WHERE clause
   */
  where(condition: string): this {
    this.whereClauses.push(condition);
    return this;
  }

  /**
   * Add WHERE clause with AND
   */
  andWhere(condition: string): this {
    return this.where(condition);
  }

  /**
   * Add WHERE clause with OR
   */
  orWhere(condition: string): this {
    if (this.whereClauses.length > 0) {
      const lastClause = this.whereClauses.pop()!;
      this.whereClauses.push(`(${lastClause}) OR (${condition})`);
    } else {
      this.whereClauses.push(condition);
    }
    return this;
  }

  /**
   * Add GROUP BY fields
   */
  groupBy(...fields: string[]): this {
    this.groupByFields.push(...fields);
    return this;
  }

  /**
   * Add HAVING clause
   */
  having(condition: string): this {
    this.havingClauses.push(condition);
    return this;
  }

  /**
   * Add ORDER BY field
   */
  orderBy(field: string, direction: 'ASC' | 'DESC' = 'ASC'): this {
    this.orderByFields.push({ field, direction });
    return this;
  }

  /**
   * Set LIMIT
   */
  limit(value: number): this {
    this.limitValue = value;
    return this;
  }

  /**
   * Set OFFSET
   */
  offset(value: number): this {
    this.offsetValue = value;
    return this;
  }

  /**
   * Build the final SQL query
   */
  build(): string {
    if (!this.fromTable) {
      throw new Error('FROM table is required');
    }

    if (this.selectFields.length === 0) {
      throw new Error('SELECT fields are required');
    }

    let query = `SELECT ${this.selectFields.join(', ')} FROM ${this.fromTable}`;

    // Add JOINs
    if (this.joins.length > 0) {
      query += ' ' + this.joins
        .map(j => `${j.type} ${j.table} ON ${j.on}`)
        .join(' ');
    }

    // Add WHERE
    if (this.whereClauses.length > 0) {
      query += ' WHERE ' + this.whereClauses.join(' AND ');
    }

    // Add GROUP BY
    if (this.groupByFields.length > 0) {
      query += ' GROUP BY ' + this.groupByFields.join(', ');
    }

    // Add HAVING
    if (this.havingClauses.length > 0) {
      query += ' HAVING ' + this.havingClauses.join(' AND ');
    }

    // Add ORDER BY
    if (this.orderByFields.length > 0) {
      query += ' ORDER BY ' + this.orderByFields
        .map(o => `${o.field} ${o.direction}`)
        .join(', ');
    }

    // Add LIMIT
    if (this.limitValue !== undefined) {
      query += ` LIMIT ${this.limitValue}`;
    }

    // Add OFFSET
    if (this.offsetValue !== undefined) {
      query += ` OFFSET ${this.offsetValue}`;
    }

    return query;
  }

  /**
   * Build a COUNT query
   */
  buildCount(countField: string = '*'): string {
    const originalSelect = [...this.selectFields];
    this.selectFields = [`COUNT(${countField}) as count`];
    
    // Remove ORDER BY for count queries (not needed and can slow down)
    const originalOrderBy = [...this.orderByFields];
    this.orderByFields = [];
    
    // Remove LIMIT and OFFSET for count queries
    const originalLimit = this.limitValue;
    const originalOffset = this.offsetValue;
    this.limitValue = undefined;
    this.offsetValue = undefined;

    const query = this.build();

    // Restore original values
    this.selectFields = originalSelect;
    this.orderByFields = originalOrderBy;
    this.limitValue = originalLimit;
    this.offsetValue = originalOffset;

    return query;
  }

  /**
   * Clone the query builder
   */
  clone(): QueryBuilder {
    const cloned = new QueryBuilder();
    cloned.selectFields = [...this.selectFields];
    cloned.fromTable = this.fromTable;
    cloned.joins = [...this.joins];
    cloned.whereClauses = [...this.whereClauses];
    cloned.groupByFields = [...this.groupByFields];
    cloned.havingClauses = [...this.havingClauses];
    cloned.orderByFields = [...this.orderByFields];
    cloned.limitValue = this.limitValue;
    cloned.offsetValue = this.offsetValue;
    return cloned;
  }

  /**
   * Reset the query builder
   */
  reset(): this {
    this.selectFields = [];
    this.fromTable = '';
    this.joins = [];
    this.whereClauses = [];
    this.groupByFields = [];
    this.havingClauses = [];
    this.orderByFields = [];
    this.limitValue = undefined;
    this.offsetValue = undefined;
    return this;
  }
}
