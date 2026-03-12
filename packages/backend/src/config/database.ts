import pg from 'pg';
import { config } from './env.js';
import { logger } from './logger.js';

const { Pool } = pg;

export const pool = new Pool({
  host: config.database.host,
  port: config.database.port,
  database: config.database.database,
  user: config.database.user,
  password: config.database.password,
  ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
  
  // 优化的连接池配置
  min: config.database.poolMin || 5,        // 最小连接数增加到5
  max: config.database.poolMax || 30,       // 最大连接数增加到30
  idleTimeoutMillis: config.database.idleTimeout || 30000,
  connectionTimeoutMillis: config.database.connectionTimeout || 5000,
  
  // 性能优化配置
  allowExitOnIdle: true,                    // 允许在空闲时退出
  maxUses: 7500,                           // 每个连接最大使用次数
  
  // 查询优化配置
  query_timeout: 30000,                    // 查询超时30秒
  statement_timeout: 30000,                // 语句超时30秒
  
  // 应用名称，便于监控
  application_name: 'bounty_hunter_backend'
});

pool.on('error', (err) => {
  logger.error('Unexpected database error:', err);
});

export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.info('Executed query', { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    logger.error('Database query error:', { text, error });
    throw error;
  }
};

export const getClient = async () => {
  const client = await pool.connect();
  const originalRelease = client.release.bind(client);
  
  let released = false;
  
  client.release = () => {
    if (released) {
      logger.warn('Client release called multiple times');
      return;
    }
    released = true;
    originalRelease();
  };
  
  return client;
};

export const testConnection = async (): Promise<boolean> => {
  try {
    const result = await query('SELECT NOW()');
    logger.info('Database connection successful:', result.rows[0]);
    return true;
  } catch (error) {
    logger.error('Database connection failed:', error);
    return false;
  }
};
