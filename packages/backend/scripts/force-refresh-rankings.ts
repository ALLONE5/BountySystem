
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Mock environment variables BEFORE importing anything that uses env.ts
// This is crucial because env.ts validates process.env immediately upon import
Object.assign(process.env, {
  NODE_ENV: 'development',
  PORT: '3001',
  DATABASE_URL: 'postgresql://postgres:password@localhost:5432/bounty_hunter',
  JWT_SECRET: 'test-secret-for-scripts-must-be-long-enough',
  CORS_ORIGIN: 'http://localhost:5173'
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file if it exists (will overwrite mocks if present)
config({ path: path.resolve(__dirname, '../.env') });

async function main() {
  try {
    console.log('Starting ranking refresh...');
    
    // Dynamic import to ensure env vars are set before module load
    const { RankingService } = await import('../src/services/RankingService');
    const { Pool } = await import('pg');
    
    const pool = new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'bounty_hunter',
      password: process.env.DB_PASSWORD || 'postgres',
      port: parseInt(process.env.DB_PORT || '5432'),
    });

    const rankingService = new RankingService(pool);
    await rankingService.updateAllRankings();
    
    console.log('Successfully refreshed all rankings');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Error refreshing rankings:', error);
    process.exit(1);
  }
}

main();
