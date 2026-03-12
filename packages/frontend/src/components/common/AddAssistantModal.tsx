import React, { useRef, useState } from 'react';
import { Form, Select, Spin, InputNumber, Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { BaseFormModal } from './BaseFormModal';

export interface AssistantOption {
  id: string;
  username: string;
  email?: string;
  avatarUrl?: string;
}

interface AddAssistantModalProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (values: { assistantId: string; bountyAllocation: number }) => Promise<void> | void;
  searchUsers: (keyword: string) => Promise<AssistantOption[]>;
  loading?: boolean;
  initialAllocation?: number;
}

export const AddAssistantModal: React.FC<AddAssistantModalProps> = ({
  visible,
  onCancel,
  onSubmit,
  searchUsers,
  loading = false,
  initialAllocation = 10,
}) => {
  const [form] = Form.useForm();
  const [options, setOptions] = useState<AssistantOption[]>([]);
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

  const handleSubmit = async (values: { assistantId: string; bountyAllocation: number }) => {
    await onSubmit(values);
  };

  React.useEffect(() => {
    if (visible) {
      form.setFieldsValue({ bountyAllocation: initialAllocation });
    }
  }, [visible, initialAllocation, form]);

  return (
    <BaseFormModal
      visible={visible}
      title="添加协作者"
      form={form}
      onSubmit={handleSubmit}
      onCancel={onCancel}
      okText="确认添加"
      cancelText="取消"
      loading={loading}
    >
      <Form.Item 
        name="assistantId" 
        label="用户" 
        rules={[{ required: true, message: '请选择用户' }]}
      >
        <Select
          showSearch
          placeholder="搜索用户"
          filterOption={false}
          onSearch={handleSearch}
          notFoundContent={searching ? <Spin size="small" /> : null}
          options={options.map(u => ({
            label: (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Avatar size="small" src={u.avatarUrl} icon={<UserOutlined />} style={{ marginRight: 8 }} />
                {u.username}{u.email ? ` (${u.email})` : ''}
              </div>
            ),
            value: u.id,
          }))}
        />
      </Form.Item>
      
      <Form.Item 
        name="bountyAllocation" 
        label="赏金分配 (%)" 
        rules={[{ required: true, message: '请输入分配比例' }]}
      >
        <InputNumber min={1} max={100} style={{ width: '100%' }} />
      </Form.Item>
    </BaseFormModal>
  );
};
