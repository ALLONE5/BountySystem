import React, { useState } from 'react';
import {
  Form,
  Input,
  InputNumber,
  DatePicker,
  Select,
  Button,
  Space,
  Divider,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { Task, Visibility, Position } from '../../types';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { projectGroupApi } from '../../api/projectGroup';
import { BaseFormModal } from '../common/BaseFormModal';

const { TextArea } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface TaskEditModalProps {
  visible: boolean;
  task: Task | null;
  positions: Position[];
  projectGroups: any[];
  onClose: () => void;
  onSubmit: (taskData: any) => Promise<void>;
  onProjectGroupsUpdate: () => Promise<void>;
}

export const TaskEditModal: React.FC<TaskEditModalProps> = ({
  visible,
  task,
  positions,
  projectGroups,
  onClose,
  onSubmit,
  onProjectGroupsUpdate,
}) => {
  const [form] = Form.useForm();
  const [newProjectGroupName, setNewProjectGroupName] = useState('');
  const [addingProjectGroup, setAddingProjectGroup] = useState(false);
  const [loading, setLoading] = useState(false);
  const { handleAsyncError } = useErrorHandler();

  React.useEffect(() => {
    if (visible && task) {
      form.setFieldsValue({
        name: task.name,
        description: task.description,
        tags: task.tags,
        dateRange: [dayjs(task.plannedStartDate), dayjs(task.plannedEndDate)],
        estimatedHours: task.estimatedHours,
        complexity: task.complexity,
        priority: task.priority,
        visibility: task.visibility,
        positionId: task.positionId,
        projectGroupId: task.projectGroupId,
      });
    } else if (visible && !task) {
      form.resetFields();
    }
  }, [visible, task, form]);

  const handleAddProjectGroup = async () => {
    if (!newProjectGroupName || newProjectGroupName.trim().length === 0) {
      return;
    }

    await handleAsyncError(
      async () => {
        setAddingProjectGroup(true);
        const newGroup = await projectGroupApi.createProjectGroup({
          name: newProjectGroupName.trim(),
        });
        setNewProjectGroupName('');
        await onProjectGroupsUpdate();
        form.setFieldsValue({
          projectGroupId: newGroup.id,
        });
      },
      'TaskEditModal.addProjectGroup',
      '项目分组创建成功',
      '创建项目分组失败'
    );
    setAddingProjectGroup(false);
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const taskData: any = {
        name: values.name,
        description: values.description,
        tags: values.tags,
        plannedStartDate: values.dateRange[0].toISOString(),
        plannedEndDate: values.dateRange[1].toISOString(),
        estimatedHours: values.estimatedHours,
        complexity: values.complexity,
        priority: values.priority,
        visibility: values.visibility,
        positionId: values.positionId,
        projectGroupId: values.projectGroupId || null,
      };
      await onSubmit(taskData);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseFormModal
      visible={visible}
      title={task ? "编辑任务" : "创建任务"}
      form={form}
      onSubmit={handleSubmit}
      onCancel={onClose}
      loading={loading}
      width={600}
    >
      <Form.Item
        name="name"
        label="任务名称"
        rules={[{ required: true, message: '请输入任务名称' }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="description"
        label="任务描述"
        rules={[{ required: true, message: '请输入任务描述' }]}
      >
        <TextArea rows={4} />
      </Form.Item>
      <Form.Item name="tags" label="标签">
        <Select mode="tags" placeholder="输入标签后按回车">
        </Select>
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
      <Form.Item
        name="visibility"
        label="可见性"
        rules={[{ required: true, message: '请选择可见性' }]}
      >
        <Select>
          <Option value={Visibility.PUBLIC}>公开</Option>
          <Option value={Visibility.POSITION_ONLY}>仅特定岗位</Option>
          <Option value={Visibility.PRIVATE}>私有</Option>
        </Select>
      </Form.Item>
      <Form.Item
        noStyle
        shouldUpdate={(prevValues, currentValues) => prevValues.visibility !== currentValues.visibility}
      >
        {({ getFieldValue }) => {
          const visibility = getFieldValue('visibility');
          return (
            <Form.Item
              name="positionId"
              label="岗位限制"
              rules={[{ 
                required: visibility === Visibility.POSITION_ONLY, 
                message: '当可见性为"仅特定岗位"时，必须选择岗位' 
              }]}
              tooltip="选择岗位后，只有具备该岗位的用户才能承接此任务。如果可见性为'仅特定岗位'，则只有具备该岗位的用户能看到此任务。"
            >
              <Select allowClear placeholder="选择岗位（可选）">
                {(Array.isArray(positions) ? positions : []).map(p => (
                  <Option key={p.id} value={p.id}>{p.name}</Option>
                ))}
              </Select>
            </Form.Item>
          );
        }}
      </Form.Item>
      <Form.Item
        name="projectGroupId"
        label="项目分组"
        tooltip="将任务归类到项目分组中，便于管理和查看"
      >
        <Select 
          allowClear 
          placeholder="选择项目分组（可选）"
          dropdownRender={(menu) => (
            <>
              {menu}
              <Divider style={{ margin: '8px 0' }} />
              <Space style={{ padding: '0 8px 4px' }}>
                <Input
                  placeholder="输入新分组名称"
                  value={newProjectGroupName}
                  onChange={(e) => setNewProjectGroupName(e.target.value)}
                  onPressEnter={handleAddProjectGroup}
                  style={{ flex: 1 }}
                />
                <Button
                  type="text"
                  icon={<PlusOutlined />}
                  onClick={handleAddProjectGroup}
                  loading={addingProjectGroup}
                >
                  新增
                </Button>
              </Space>
            </>
          )}
        >
          {(Array.isArray(projectGroups) ? projectGroups : []).map(pg => (
            <Option key={pg.id} value={pg.id}>{pg.name}</Option>
          ))}
        </Select>
      </Form.Item>
    </BaseFormModal>
  );
};