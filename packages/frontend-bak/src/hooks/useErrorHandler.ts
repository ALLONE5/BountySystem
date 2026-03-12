/**
 * 统一错误处理 Hook
 * 提供一致的错误处理和用户反馈机制
 */

import { useCallback } from 'react';
import { message } from 'antd';
import { logger } from '../utils/logger';

export interface ErrorHandlerOptions {
  showMessage?: boolean;
  logError?: boolean;
  context?: string;
}

export const useErrorHandler = () => {
  const handleError = useCallback((
    error: any, 
    defaultMessage?: string,
    options: ErrorHandlerOptions = {}
  ) => {
    const {
      showMessage = true,
      logError = true,
      context = 'unknown'
    } = options;

    // 提取错误信息
    const errorMessage = error.response?.data?.message || 
                        error.message || 
                        defaultMessage || 
                        '操作失败';

    // 显示用户友好的错误消息
    if (showMessage) {
      message.error(errorMessage);
    }

    // 记录详细的错误日志
    if (logError) {
      logger.error('Operation failed', {
        context,
        message: errorMessage,
        originalError: error.message,
        stack: error.stack,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
        method: error.config?.method
      });
    }

    return errorMessage;
  }, []);

  const handleAsyncError = useCallback(async (
    asyncFn: () => Promise<any>,
    context: string,
    successMessage?: string,
    errorMessage?: string
  ) => {
    try {
      const result = await asyncFn();
      if (successMessage) {
        message.success(successMessage);
      }
      return result;
    } catch (error) {
      handleError(error, errorMessage, { context });
      throw error;
    }
  }, [handleError]);

  return { 
    handleError, 
    handleAsyncError 
  };
};