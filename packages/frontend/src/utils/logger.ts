export interface LogContext {
  userId?: string;
  taskId?: string;
  groupId?: string;
  error?: Error | string;
  [key: string]: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  info(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      console.log(`[INFO] ${message}`, context);
    }
    // In production, could send to logging service
  }

  warn(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      console.warn(`[WARN] ${message}`, context);
    }
    // In production, could send to logging service
  }

  error(message: string, context?: LogContext) {
    const sanitizedContext = this.sanitizeContext(context);
    
    if (this.isDevelopment) {
      console.error(`[ERROR] ${message}`, sanitizedContext);
    }
    
    // In production, send to error reporting service
    // Example: Sentry, LogRocket, etc.
  }

  debug(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      console.debug(`[DEBUG] ${message}`, context);
    }
  }

  private sanitizeContext(context?: LogContext): LogContext | undefined {
    if (!context) return undefined;
    
    // Remove sensitive information
    const sanitized = { ...context };
    delete sanitized.password;
    delete sanitized.token;
    delete sanitized.secret;
    
    // Convert Error objects to serializable format
    if (sanitized.error instanceof Error) {
      sanitized.errorMessage = sanitized.error.message;
      sanitized.stack = sanitized.error.stack;
      delete sanitized.error;
    }
    
    return sanitized;
  }
}

export const logger = new Logger();