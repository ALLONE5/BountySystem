import winston from 'winston';

// Simple logger to avoid circular dependency issues
const simpleLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.colorize(),
    winston.format.printf(({ timestamp, level, message, ...meta }: any) => {
      let msg = `${timestamp} [${level}]: ${message}`;
      if (Object.keys(meta).length > 0) {
        msg += ` ${JSON.stringify(meta)}`;
      }
      return msg;
    })
  ),
  transports: [
    new winston.transports.Console()
  ],
  exitOnError: false,
});

// Export logger
export const logger = {
  info: (message: string, meta?: any) => simpleLogger.info(message, meta),
  error: (message: string, meta?: any) => simpleLogger.error(message, meta),
  warn: (message: string, meta?: any) => simpleLogger.warn(message, meta),
  debug: (message: string, meta?: any) => simpleLogger.debug(message, meta),
};

// Create a stream for Morgan HTTP logging
export const morganStream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

// Helper functions for structured logging
export const logError = (message: string, error: Error, meta?: any) => {
  logger.error(message, {
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name,
    },
    ...meta,
  });
};

export const logInfo = (message: string, meta?: any) => {
  logger.info(message, meta);
};

export const logWarn = (message: string, meta?: any) => {
  logger.warn(message, meta);
};

export const logDebug = (message: string, meta?: any) => {
  logger.debug(message, meta);
};

export default logger;