import { message as antdMessage } from 'antd';

// 全局message实例，用于在非组件上下文中显示消息
export const message = {
  success: (content: string) => antdMessage.success(content),
  error: (content: string) => antdMessage.error(content),
  warning: (content: string) => antdMessage.warning(content),
  info: (content: string) => antdMessage.info(content),
  loading: (content: string) => antdMessage.loading(content),
};

export default message;