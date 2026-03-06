/**
 * 错误处理装饰器
 * 提供统一的方法级错误处理和日志记录
 */

import { logger } from '../../config/logger.js';

export interface ErrorHandlerOptions {
  logLevel?: 'error' | 'warn' | 'info';
  includeArgs?: boolean;
  rethrow?: boolean;
  context?: string;
}

/**
 * 方法错误处理装饰器
 */
export const HandleError = (options: ErrorHandlerOptions = {}) => {
  const {
    logLevel = 'error',
    includeArgs = false,
    rethrow = true,
    context
  } = options;

  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const errorContext = context || `${target.constructor.name}.${propertyKey}`;
      
      try {
        return await originalMethod.apply(this, args);
      } catch (error) {
        const logData: any = {
          context: errorContext,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        };

        if (includeArgs && args.length > 0) {
          logData.args = args.map(arg => {
            // 避免记录敏感信息
            if (typeof arg === 'object' && arg !== null) {
              const sanitized = { ...arg };
              if (sanitized.password) sanitized.password = '[REDACTED]';
              if (sanitized.token) sanitized.token = '[REDACTED]';
              return sanitized;
            }
            return arg;
          });
        }

        logger[logLevel]('Method execution failed', logData);
        
        if (rethrow) {
          throw error;
        }
        
        return null;
      }
    };
    
    return descriptor;
  };
};

/**
 * 类级错误处理装饰器
 */
export const HandleClassErrors = (options: ErrorHandlerOptions = {}) => {
  return (constructor: Function) => {
    const prototype = constructor.prototype;
    const methodNames = Object.getOwnPropertyNames(prototype);

    methodNames.forEach(methodName => {
      if (methodName !== 'constructor' && typeof prototype[methodName] === 'function') {
        const originalMethod = prototype[methodName];
        
        prototype[methodName] = async function (...args: any[]) {
          const errorContext = options.context || `${constructor.name}.${methodName}`;
          
          try {
            return await originalMethod.apply(this, args);
          } catch (error) {
            logger.error('Class method execution failed', {
              context: errorContext,
              error: error instanceof Error ? error.message : String(error),
              stack: error instanceof Error ? error.stack : undefined
            });
            
            throw error;
          }
        };
      }
    });
  };
};