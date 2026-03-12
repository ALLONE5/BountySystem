import { MessageInstance } from 'antd/es/message/interface';

// 全局message实例，用于在非组件上下文中显示消息
let globalMessageInstance: MessageInstance | null = null;

// 设置全局message实例（由App组件调用）
export const setGlobalMessage = (messageInstance: MessageInstance) => {
  globalMessageInstance = messageInstance;
};

// 全局message方法
export const message = {
  success: (content: string) => {
    if (globalMessageInstance) {
      globalMessageInstance.success(content);
    } else {
      console.warn('Message instance not initialized. Content:', content);
    }
  },
  error: (content: string) => {
    if (globalMessageInstance) {
      globalMessageInstance.error(content);
    } else {
      console.warn('Message instance not initialized. Content:', content);
    }
  },
  warning: (content: string) => {
    if (globalMessageInstance) {
      globalMessageInstance.warning(content);
    } else {
      console.warn('Message instance not initialized. Content:', content);
    }
  },
  info: (content: string) => {
    if (globalMessageInstance) {
      globalMessageInstance.info(content);
    } else {
      console.warn('Message instance not initialized. Content:', content);
    }
  },
  loading: (content: string) => {
    if (globalMessageInstance) {
      return globalMessageInstance.loading(content);
    } else {
      console.warn('Message instance not initialized. Content:', content);
      return () => {}; // Return empty cleanup function
    }
  },
};

export default message;