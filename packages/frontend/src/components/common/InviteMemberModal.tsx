import React, { useRef, useState } from 'react';
import { Form, Select, Spin, Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { BaseFormModal } from './BaseFormModal';
import { logger } from '../../utils/logger';
import { message } from '../../utils/message';

export interface UserOption {
  id: string;
  username: string;
  email?: string;
  avatarUrl?: string;
}

interface InviteMemberModalProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (userId: string) => Promise<void>;
  searchUsers: (keyword: string) => Promise<UserOption[]>;
  loading?: boolean;
}

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
  visible,
  onCancel,
  onSubmit,
  searchUsers,
  loading = false,
}) => {
  const [form] = Form.useForm();
  const [options, setOptions] = useState<UserOption[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout>();

  const handleSearch = (value: string) => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!value) {
      setOptions([]);
      return;
    }
    setSearching(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await searchUsers(value);
        setOptions(res);
      } finally {
        setSearching(false);
      }
    }, 400);
  };

  const handleSubmit = async (values: { userId: string }) => {
    try {
      await onSubmit(values.userId);
      message.success('邀请已发送');
      onCancel();
    } catch (error) {
      // Error handling should be done by parent or here if specific
      logger.error(String(error));
    }
  };

  return (
    <BaseFormModal
      visible={visible}
      title="邀请成员"
      form={form}
      onSubmit={handleSubmit}
      onCancel={onCancel}
      okText="发送邀请"
      cancelText="取消"
      loading={loading}
    >
      <Form.Item 
        name="userId" 
        label="搜索用户 (支持用户名、邮箱或ID)" 
        rules={[{ required: true, message: '请选择用户' }]}
      >
        <Select
          showSearch
          placeholder="输入用户名、邮箱或ID搜索"
          filterOption={false}
          onSearch={handleSearch}
          notFoundContent={searching ? <Spin size="small" /> : null}
          options={options.map(u => ({
            label: (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Avatar size="small" src={u.avatarUrl} icon={<UserOutlined />} style={{ marginRight: 8 }} />
                <div>
                  <div>{u.username}</div>
                  <div style={{ fontSize: 12, color: '#999' }}>{u.email}</div>
                  <div style={{ fontSize: 10, color: '#ccc' }}>ID: {u.id}</div>
                </div>
              </div>
            ),
            value: u.id,
          }))}
          style={{ width: '100%' }}
        />
      </Form.Item>
    </BaseFormModal>
  );
};
