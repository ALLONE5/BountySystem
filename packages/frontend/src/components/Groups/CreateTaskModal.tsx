import React from 'react';
import { Form, Input, DatePicker, InputNumber, Select } from 'antd';
import { BaseFormModal } from '../common';
import { useErrorHandler } from '../../hooks/useErrorHandler';

const { TextArea } = Input;
const { RangePicker } = DatePicker;
const { Option } = Select;

interface CreateTaskModalProps {
  visible: boolean;
  loading: boolean;
  onClose: () => void;
  onSubmit: (values: any) => Promise<void>;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  visible,
  loading,
  onClose,
  onSubmit,
}) => {
  const [form] = Form.useForm();
  const { handleAsyncError } = useErrorHandler();

  const handleSubmit = async (values: any) => {
    await handleAsyncError(
      () => onSubmit(values),
      'CreateTaskModal.submit',
      '任务创建成功',
      '创建任务失败'
    );
    onClose();
  };

  return (
    <BaseFormModal
      visible={visible}
      title="创建组群任务"
      form={form}
      loading={loading}
      onSubmit={handleSubmit}
      onCancel={onClose}
      okText="创建任务"
      width={600}
    >
      <Form.Item
        name="name"
        label="任务名称"
        rules={[{ required: true, message: '请输入任务名称' }]}
      >
        <Input placeholder="请输入任务名称" />
      </Form.Item>

      <Form.Item
        name="description"
        label="任务描述"
        rules={[{ required: true, message: '请输入任务描述' }]}
      >
        <TextArea rows={4} placeholder="请输入任务描述" />
      </Form.Item>

      <Form.Item name="tags" label="标签">
        <Select mode="tags" placeholder="输入标签后按回车" />
      </Form.Item>

      <Form.Item
        name="dateRange"
        label="计划时间"
        rules={[{ required: true, message: '请选择计划时间' }]}
      >
        <RangePicker style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item
        name="estimatedHours"
        label="预估工时（小时）"
        rules={[{ required: true, message: '请输入预估工时' }]}
      >
        <InputNumber min={0} style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item
        name="complexity"
        label="复杂度"
        rules={[{ required: true, message: '请选择复杂度' }]}
      >
        <Select>
          <Option value={1}>1 - 非常简单</Option>
          <Option value={2}>2 - 简单</Option>
          <Option value={3}>3 - 中等</Option>
          <Option value={4}>4 - 复杂</Option>
          <Option value={5}>5 - 非常复杂</Option>
        </Select>
      </Form.Item>

      <Form.Item
        name="priority"
        label="优先级"
        rules={[{ required: true, message: '请选择优先级' }]}
      >
        <Select>
          <Option value={1}>1 - 最低</Option>
          <Option value={2}>2 - 低</Option>
          <Option value={3}>3 - 中</Option>
          <Option value={4}>4 - 高</Option>
          <Option value={5}>5 - 最高</Option>
        </Select>
      </Form.Item>
    </BaseFormModal>
  );
};
