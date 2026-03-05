/**
 * 统一的日志工具类
 * 用于替换项目中的 console.log/error 调用
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

class Logger {
  private static instance: Logger;
  private logLevel: LogLevel;
  private isDevelopment: boolean;

  private constructor() {
    this.isDevelopment = import.meta.env.DEV || import.meta.env.NODE_ENV === 'development';
    this.logLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.WARN;
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  public setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }

  private formatMessage(level: string, message: string, context?: any): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | Context: ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level}] ${message}${contextStr}`;
  }

  public debug(message: string, context?: any): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(this.formatMessage('DEBUG', message, context));
    }
  }

  public info(message: string, context?: any): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(this.formatMessage('INFO', message, context));
    }
  }

  public warn(message: string, context?: any): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage('WARN', message, context));
    }
  }

  public error(message: string, error?: Error | any, context?: any): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const errorStr = error instanceof Error ? error.stack : JSON.stringify(error);
      const fullContext = { ...context, error: errorStr };
      console.error(this.formatMessage('ERROR', message, fullContext));
    }
  }

  // 便捷方法用于组件渲染日志
  public componentRender(componentName: string, props?: any): void {
    this.debug(`${componentName} rendered`, props);
  }

  // 便捷方法用于API调用日志
  public apiCall(method: string, url: string, data?: any): void {
    this.debug(`API ${method} ${url}`, data);
  }

  // 便捷方法用于状态更新日志
  public stateUpdate(component: string, state: any): void {
    this.debug(`${component} state updated`, state);
  }
}

// 导出单例实例
export const logger = Logger.getInstance();

// 导出便捷方法
export const log = {
  debug: (message: string, context?: any) => logger.debug(message, context),
  info: (message: string, context?: any) => logger.info(message, context),
  warn: (message: string, context?: any) => logger.warn(message, context),
  error: (message: string, error?: Error | any, context?: any) => logger.error(message, error, context),
  componentRender: (componentName: string, props?: any) => logger.componentRender(componentName, props),
  apiCall: (method: string, url: string, data?: any) => logger.apiCall(method, url, data),
  stateUpdate: (component: string, state: any) => logger.stateUpdate(component, state),
};