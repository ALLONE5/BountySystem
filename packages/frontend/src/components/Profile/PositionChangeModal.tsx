import React, { useState } from 'react';
import { Form, Select, Typography, Tag } from 'antd';
import { Position } from '../../types';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { BaseFormModal } from '../common/BaseFormModal';

const { Text } = Typography;
const { Option } = Select;

interface PositionChangeModalProps {
  visible: boolean;
  userPositions: Position[];
  allPositions: Position[];
  onClose: () => void;
  onSubmit: (selectedPositions: string[]) => Promise<void>;
}

export const PositionChangeModal: React.FC<PositionChangeModalProps> = ({
  visible,
  userPositions,
  allPositions,
  onClose,
  onSubmit,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { handleAsyncError } = useErrorHandler();

  React.useEffect(() => {
    if (visible && userPositions) {
      // Pre-populate with current positions
      form.setFieldsValue({
        positions: userPositions.map(pos => pos.id)
      });
    }
  }, [visible, userPositions, form]);

  const handleSubmit = async (values: { positions: string[] }) => {
    const { positions } = values;
    
    if (!positions || positions.length === 0) {
      form.setFields([{
        name: 'positions',
        errors: ['请至少选择一个岗位']
      }]);
      return;
    }
    
    if (positions.length > 3) {
      form.setFields([{
        name: 'positions',
        errors: ['最多只能选择3个岗位']
      }]);
      return;
    }
    
    const currentPositionIds = userPositions ? userPositions.map(pos => pos.id) : [];
    const hasChanged = 
      positions.length !== currentPositionIds.length ||
      positions.some(posId => !currentPositionIds.includes(posId));

    if (!hasChanged) {
      form.setFields([{
        name: 'positions',
        errors: ['岗位未发生变化']
      }]);
      return;
    }

    setLoading(true);
    try {
      await handleAsyncError(
        async () => {
          await onSubmit(positions);
        },
        'PositionChangeModal.submit'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <Text>当前岗位: </Text>
        {userPositions && userPositions.length > 0 ? (
          userPositions.map((pos) => (
            <Tag key={pos.id} color="green">
              {pos.name}
            </Tag>
          ))
        ) : (
          <Text type="secondary">暂无岗位</Text>
        )}
      </div>
      
      <BaseFormModal
        visible={visible}
        title="申请岗位变更"
        form={form}
        onSubmit={handleSubmit}
        onCancel={onClose}
        okText="提交申请"
        cancelText="取消"
        loading={loading}
      >
        <Form.Item 
          name="positions"
          label="选择岗位" 
          rules={[
            { required: true, message: '请至少选择一个岗位' },
            { 
              validator: (_, value) => {
                if (value && value.length > 3) {
                  return Promise.reject('最多只能选择3个岗位');
                }
                return Promise.resolve();
              }
            }
          ]}
          help="最多可选择3个岗位"
        >
          <Select
            mode="multiple"
            placeholder="请选择岗位（可多选、可删减）"
            showSearch
          >
            {allPositions && allPositions.map((pos) => (
              <Option key={pos.id} value={pos.id}>
                {pos.name}
              </Option>
            ))}
          </Select>
        </Form.Item>
      </BaseFormModal>
    </>
  );
};