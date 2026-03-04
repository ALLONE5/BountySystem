import { createLogger, format, transports } from 'winston';

export interface LogContext {
  userId?: string;
  taskId?: string;
  groupId?: string;
  requestId?: string;
  error?: Error | string;
  stack?: string;
  [key: string]: any;
}

class Logger {
  private logger = createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: format.combine(
      format.timestamp(),
      format.errors({ stack: true }),
      format.json()
    ),
    defaultMeta: { service: 'task-management-backend' },
    transports: [
      new transports.File({ filename: 'logs/error.log', level: 'error' }),
      new transports.File({ filename: 'logs/combined.log' }),
    ],
  });

  constructor() {
    if (process.env.NODE_ENV !== 'production') {
      this.logger.add(new transports.Console({
        format: format.combine(
          format.colorize(),
          format.simple()
        )
      }));
    }
  }

  info(message: string, context?: LogContext) {
    this.logger.info(message, this.sanitizeContext(context));
  }

  warn(message: string, context?: LogContext) {
    this.logger.warn(message, this.sanitizeContext(context));
  }

  error(message: string, context?: LogContext) {
    const sanitizedContext = this.sanitizeContext(context);
    if (sanitizedContext?.error instanceof Error) {
      sanitizedContext.errorMessage = sanitizedContext.error.message;
      sanitizedContext.stack = sanitizedContext.error.stack;
      delete sanitizedContext.error;
    }
    this.logger.error(message, sanitizedContext);
  }

  debug(message: string, context?: LogContext) {
    this.logger.debug(message, this.sanitizeContext(context));
  }

  private sanitizeContext(context?: LogContext): LogContext | undefined {
    if (!context) return undefined;
    
    // Remove sensitive information
    const sanitized = { ...context };
    delete sanitized.password;
    delete sanitized.token;
    delete sanitized.secret;
    
    return sanitized;
  }
}

export const logger = new Logger();