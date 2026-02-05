// PM2 Ecosystem Configuration for Production Deployment
// Install PM2: npm install -g pm2
// Start: pm2 start ecosystem.config.js
// Monitor: pm2 monit
// Logs: pm2 logs
// Restart: pm2 restart bounty-hunter-api
// Stop: pm2 stop bounty-hunter-api

module.exports = {
  apps: [
    {
      name: 'bounty-hunter-api',
      script: './dist/index.js',
      instances: 'max', // Use all available CPU cores
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '500M',
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'dist'],
      
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      
      // Environment-specific settings
      env_production: {
        NODE_ENV: 'production',
      },
      env_staging: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'bounty-hunter-worker',
      script: './dist/workers/startWorkers.js',
      instances: 2, // Run 2 worker instances
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
      },
      error_file: './logs/pm2-worker-error.log',
      out_file: './logs/pm2-worker-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '500M',
      watch: false,
      
      // Graceful shutdown
      kill_timeout: 5000,
      
      // Environment-specific settings
      env_production: {
        NODE_ENV: 'production',
      },
      env_staging: {
        NODE_ENV: 'production',
      },
    },
  ],
};
