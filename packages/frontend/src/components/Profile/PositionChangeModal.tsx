import React, { useState } from 'react';
import { Modal, Form, Select, Typography, Tag } from 'antd';
import { Position } from '../../types';
import { useErrorHandler } from '../../hooks/useErrorHandler';

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
  const [selectedPositions, setSelectedPositions] = useState<string[]>([]);
  const [positionError, setPositionError] = useState<string>('');
  const { handleAsyncError } = useErrorHandler();

  React.useEffect(() => {
    if (visible) {
      // Pre-populate with current positions
      setSelectedPositions(userPositions.map(pos => pos.id));
      setPositionError('');
    }
  }, [visible, userPositions]);

  const handleSubmit = async () => {
    setPositionError('');
    
    if (!selectedPositions || selectedPositions.length === 0) {
      setPositionError('请至少选择一个岗位');
      return;
    }
    
    if (selectedPositions.length > 3) {
      setPositionError('最多只能选择3个岗位');
      return;
    }
    
    const currentPositionIds = userPositions.map(pos => pos.id);
    const hasChanged = 
      selectedPositions.length !== currentPositionIds.length ||
      selectedPositions.some(posId => !currentPositionIds.includes(posId));

    if (!hasChanged) {
      setPositionError('岗位未发生变化');
      return;
    }

    await handleAsyncError(
      async () => {
        await onSubmit(selectedPositions);
        handleClose();
      },
      'PositionChangeModal.submit',
      undefined,
      undefined
    );
  };

  const handleClose = () => {
    setSelectedPositions([]);
    setPositionError('');
    onClose();
  };

  const handlePositionChange = (value: string[]) => {
    setSelectedPositions(value);
    if (positionError) {
      setPositionError('');
    }
  };

  return (
    <Modal
      title="申请岗位变更"
      open={visible}
      onOk={handleSubmit}
      onCancel={handleClose}
      okText="提交申请"
      cancelText="取消"
    >
      <div style={{ marginBottom: 16 }}>
        <Text>当前岗位: </Text>
        {userPositions.length > 0 ? (
          userPositions.map((pos) => (
            <Tag key={pos.id} color="green">
              {pos.name}
            </Tag>
          ))
        ) : (
          <Text type="secondary">暂无岗位</Text>
        )}
      </div>
      <Form layout="vertical">
        <Form.Item 
          label="选择岗位" 
          required 
          help={positionError || "最多可选择3个岗位"}
          validateStatus={positionError ? 'error' : ''}
        >
          <Select
            mode="multiple"
            placeholder="请选择岗位（可多选、可删减）"
            value={selectedPositions}
            onChange={handlePositionChange}
            showSearch
          >
            {allPositions.map((pos) => (
              <Option key={pos.id} value={pos.id}>
                {pos.name}
              </Option>
            ))}
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};