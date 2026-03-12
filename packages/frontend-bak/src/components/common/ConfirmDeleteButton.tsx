import React from 'react';
import { Button, Popconfirm } from 'antd';
import type { ButtonProps } from 'antd';
import type { PopconfirmProps } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';

interface ConfirmDeleteButtonProps {
  onConfirm: () => void | Promise<void>;
  title?: React.ReactNode;
  content?: React.ReactNode;
  buttonText?: React.ReactNode;
  buttonProps?: ButtonProps;
  popconfirmProps?: PopconfirmProps;
}

export const ConfirmDeleteButton: React.FC<ConfirmDeleteButtonProps> = ({
  onConfirm,
  title = '确定要删除吗？',
  content = '此操作不可撤销',
  buttonText = '删除',
  buttonProps,
  popconfirmProps,
}) => {
  return (
    <Popconfirm
      title={title}
      description={content}
      onConfirm={onConfirm}
      okText="确定"
      cancelText="取消"
      {...popconfirmProps}
    >
      <Button danger icon={<DeleteOutlined />} {...buttonProps}>
        {buttonText}
      </Button>
    </Popconfirm>
  );
};
