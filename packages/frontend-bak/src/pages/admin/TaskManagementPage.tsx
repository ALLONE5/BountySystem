import React, { useEffect, useState } from 'react';
import {
  Typography,
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Drawer,
  Descriptions,
  Avatar,
  Tooltip,
  Tag,
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  UserOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { adminApi, UpdateTaskRequest } from '../../api/admin';
import { taskApi } from '../../api/task';
import { userApi } from '../../api/user';
import { Task, TaskStatus, Visibility, User } from '../../types';
import { UserDetailsDrawer } from '../../components/admin/UserDetailsDrawer';
import { useAuthStore } from '../../store/authStore';
import { TaskViews } from '../../components/TaskViews';
import { TaskListPage } from '../TaskListPage';
import { ProgressEditor } from '../../components/common/ProgressEditor';
import { AddAssistantModal } from '../../components/common/AddAssistantModal';
import { useCrudOperations } from '../../hooks/useCrudOperations';
import { useModalState } from '../../hooks/useModalState';
import { formRules } from '../../utils/formRules';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface Assistant {
  id: string;
  user_id: string;
  username: string;
  avatar_url?: string;
  bounty_allocation: number;
}

export const TaskManagementPage: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [activeTab, setActiveTab] = useState('list');
  const [progressValue, setProgressValue] = useState<number>(0);
  const [updatingProgress, setUpdatingProgress] = useState(false);
  const [addAssistantSubmitting, setAddAssistantSubmitting] = useState(false);
  const [bonusModalVisible, setBonusModalVisible] = useState(false);
  const [addingBonus, setAddingBonus] = useState(false);

  const [form] = Form.useForm();
  const [addAssistantForm] = Form.useForm();
  const [bonusForm] = Form.useForm();

  // 使用CRUD Hook管理任务数据
  const {
    data: tasks,
    loading,
    update,
    deleteItem,
    loadAll: loadTasks,
    selectedItem: selectedTask,
    setSelectedItem: setSelectedTask,
  }: {
    data: Task[];
    loading: boolean;
    update: (id: string, data: Partial<Task>) => Promise<Task | null>;
    deleteItem: (id: string) => Promise<boolean>;
    loadAll: () => Promise<void>;
    selectedItem: Task | null;
    setSelectedItem: (item: Task | null) => void;
  } = useCrudOperations<Task>({
    fetchAll: async () => {
      const data = await adminApi.getTasks();
      return data.tasks;
    },
    update: async (id, data): Promise<Task> => {
      const updateData: UpdateTaskRequest = {
        name: data.name as string,
        description: data.description as string,
        tags: data.tags as string[],
        plannedStartDate: data.plannedStartDate ? new Date(data.plannedStartDate) : undefined,
        plannedEndDate: data.plannedEndDate ? new Date(data.plannedEndDate) : undefined,
        estimatedHours: data.estimatedHours as number,
        complexity: data.complexity as number,
        priority: data.priority as number,
        visibility: data.visibility as Visibility,
      };
      await adminApi.updateTask(id, updateData);
      return { ...selectedTask!, ...data } as Task;
    },
    delete: async (id: string) => {
      await adminApi.deleteTask(id);
    },
    successMessages: {
      update: '任务信息更新成功',
      delete: '任务删除成功',
    },
    errorMessages: {
      fetch: '加载任务列表失败',
      update: '更新任务信息失败',
      delete: '删除任务失败',
    },
  });

  // 使用Modal Hook管理模态框状态
  const taskDrawer = useModalState<Task>();
  const userDrawer = useModalState<User>();
  const editModal = useModalState<Task>();
  const addAssistantModal = useModalState();

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);


  const handleAddAssistant = async (values: { assistantId: string; bountyAllocation: number }) => {
    if (!selectedTask) return;
    setAddAssistantSubmitting(true);
    try {
      await taskApi.addAssistant(selectedTask.id, values.assistantId, values.bountyAllocation);
      addAssistantModal.close();
      addAssistantForm.resetFields();
      const assistantsData = await taskApi.getAssistants(selectedTask.id);
      setAssistants(assistantsData);
    } finally {
      setAddAssistantSubmitting(false);
    }
  };

  const handleUpdateProgress = async () => {
    if (!selectedTask) return;
    setUpdatingProgress(true);
    try {
      const updated = await taskApi.updateProgress(selectedTask.id, progressValue);
      setSelectedTask(updated);
      await loadTasks();
    } finally {
      setUpdatingProgress(false);
    }
  };

  const handleEdit = (task: Task) => {
    setSelectedTask(task);
    form.setFieldsValue({
      name: task.name,
      description: task.description,
      tags: task.tags?.join(', '),
      plannedStartDate: dayjs(task.plannedStartDate),
      plannedEndDate: dayjs(task.plannedEndDate),
      estimatedHours: task.estimatedHours,
      complexity: task.complexity,
      priority: task.priority,
      visibility: task.visibility,
    });
    editModal.open(task);
  };

  const handleSubmitEdit = async (values: any) => {
    if (!selectedTask) return;

    const updateData = {
      ...values,
      tags: values.tags ? values.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t) : [],
      plannedStartDate: values.plannedStartDate?.toDate(),
      plannedEndDate: values.plannedEndDate?.toDate(),
    };

    const result = await update(selectedTask.id, updateData);
    if (result) {
      editModal.close();
      form.resetFields();
    }
  };

  const handleDelete = async (taskId: string) => {
    const success = await deleteItem(taskId);
    if (success && selectedTask?.id === taskId) {
      taskDrawer.close();
      setSelectedTask(null);
    }
  };

  const handleAddBonus = () => {
    bonusForm.resetFields();
    setBonusModalVisible(true);
  };

  const handleSubmitBonus = async (values: { amount: number; reason?: string }) => {
    if (!selectedTask) return;
    
    setAddingBonus(true);
    try {
      await taskApi.addBonusReward(selectedTask.id, values.amount, values.reason);
      
      // Reload task details
      const data = await adminApi.getTaskDetails(selectedTask.id);
      setSelectedTask(data.task);
      
      // Reload task list
      await loadTasks();
      
      setBonusModalVisible(false);
      bonusForm.resetFields();
    } finally {
      setAddingBonus(false);
    }
  };

  const getStatusTag = (status: TaskStatus) => {
    const statusMap = {
      [TaskStatus.NOT_STARTED]: { color: 'default', text: '未开始' },
      [TaskStatus.AVAILABLE]: { color: 'green', text: '可承接' },
      [TaskStatus.PENDING_ACCEPTANCE]: { color: 'warning', text: '待接受' },
      [TaskStatus.IN_PROGRESS]: { color: 'processing', text: '进行中' },
      [TaskStatus.COMPLETED]: { color: 'success', text: '已完成' },
    };
    const config = statusMap[status as keyof typeof statusMap] || { color: "default", text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const getVisibilityTag = (visibility: Visibility) => {
    const visibilityMap = {
      [Visibility.PUBLIC]: { color: 'blue', text: '公开' },
      [Visibility.POSITION_ONLY]: { color: 'orange', text: '仅岗位' },
      [Visibility.PRIVATE]: { color: 'red', text: '私有' },
    };
    const config = visibilityMap[visibility];
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>任务管理</Title>
      
      <TaskViews
        tasks={tasks}
        loading={loading}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        listView={
          <TaskListPage
            tasks={tasks}
            loading={loading}
            hideFilters={false}
            onTaskUpdated={loadTasks}
          />
        }
      />

      {/* 任务详情抽屉 */}
      <Drawer
        title="任务详情"
        placement="right"
        size="large"
        onClose={taskDrawer.close}
        open={taskDrawer.visible}
      >
        {taskDrawer.data && (
          <div>
            <Title level={4}>{taskDrawer.data.name}</Title>
            <Descriptions column={1} bordered style={{ marginTop: 16 }}>
              <Descriptions.Item label="发布人">
                {taskDrawer.data.publisher?.username || taskDrawer.data.publisherId}
              </Descriptions.Item>
              <Descriptions.Item label="承接人">
                <Space wrap>
                  {taskDrawer.data.assignee ? (
                    <div style={{ display: 'flex', alignItems: 'center', marginRight: 16 }}>
                      <Tooltip title="Assignee">
                        <Avatar src={taskDrawer.data.assignee.avatarUrl} icon={<UserOutlined />} style={{ border: '2px solid #1890ff' }} />
                      </Tooltip>
                      <span style={{ marginLeft: 8 }}>{taskDrawer.data.assignee.username}</span>
                    </div>
                  ) : (
                    taskDrawer.data.assigneeId ? taskDrawer.data.assigneeId : <span style={{ color: '#999' }}>未分配</span>
                  )}

                  <Button size="small" type="dashed" icon={<PlusOutlined />} onClick={addAssistantModal.open}>
                    添加协作者
                  </Button>
                  
                  {assistants.map(assistant => (
                    <div key={assistant.id} style={{ display: 'flex', alignItems: 'center', marginRight: 16 }}>
                      <Tooltip title={`Assistant (Bounty: ${assistant.bounty_allocation}%)`}>
                        <Avatar src={assistant.avatar_url} icon={<UserOutlined />} size="small" />
                      </Tooltip>
                      <span style={{ marginLeft: 4, fontSize: 12, color: '#666' }}>
                        {assistant.username} ({assistant.bounty_allocation}%)
                      </span>
                    </div>
                  ))}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="状态">{getStatusTag(taskDrawer.data.status)}</Descriptions.Item>
              <Descriptions.Item label="描述">
                <div style={{ whiteSpace: 'pre-wrap' }}>{taskDrawer.data.description}</div>
              </Descriptions.Item>
              <Descriptions.Item label="赏金">
                ${Number(taskDrawer.data.bountyAmount || 0).toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label="进度">
                <ProgressEditor
                  value={progressValue}
                  onChange={setProgressValue}
                  onSave={handleUpdateProgress}
                  loading={updatingProgress}
                />
              </Descriptions.Item>
              <Descriptions.Item label="可见性">
                {getVisibilityTag(taskDrawer.data.visibility)}
              </Descriptions.Item>
              <Descriptions.Item label="复杂度">{taskDrawer.data.complexity}/5</Descriptions.Item>
              <Descriptions.Item label="优先级">{taskDrawer.data.priority}/5</Descriptions.Item>
              <Descriptions.Item label="预估工时">{taskDrawer.data.estimatedHours}小时</Descriptions.Item>
              <Descriptions.Item label="标签">
                {taskDrawer.data.tags && taskDrawer.data.tags.length > 0 ? (
                  taskDrawer.data.tags.map(tag => <Tag key={tag}>{tag}</Tag>)
                ) : (
                  <span style={{ color: '#999' }}>无</span>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="计划开始">
                {dayjs(taskDrawer.data.plannedStartDate).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="计划结束">
                {dayjs(taskDrawer.data.plannedEndDate).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
              {taskDrawer.data.actualStartDate && (
                <Descriptions.Item label="实际开始">
                  {dayjs(taskDrawer.data.actualStartDate).format('YYYY-MM-DD HH:mm')}
                </Descriptions.Item>
              )}
              {taskDrawer.data.actualEndDate && (
                <Descriptions.Item label="实际结束">
                  {dayjs(taskDrawer.data.actualEndDate).format('YYYY-MM-DD HH:mm')}
                </Descriptions.Item>
              )}
              <Descriptions.Item label="任务ID">
                <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{taskDrawer.data.id}</span>
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {dayjs(taskDrawer.data.createdAt).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: 24, display: 'flex', gap: 8 }}>
              <Button type="primary" icon={<EditOutlined />} onClick={() => {
                taskDrawer.close();
                handleEdit(taskDrawer.data!);
              }}>
                编辑任务
              </Button>
              {taskDrawer.data.status === TaskStatus.COMPLETED && (
                <Button 
                  type="default" 
                  icon={<DollarOutlined />} 
                  onClick={handleAddBonus}
                  style={{ borderColor: '#faad14', color: '#faad14' }}
                >
                  额外奖赏
                </Button>
              )}
              <Button danger icon={<DeleteOutlined />} onClick={() => {
                Modal.confirm({
                  title: '确定要删除此任务吗？',
                  content: '此操作不可撤销',
                  onOk: () => handleDelete(taskDrawer.data!.id),
                });
              }}>
                删除任务
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      {/* 用户详情抽屉 */}
      <UserDetailsDrawer
        user={userDrawer.data}
        open={userDrawer.visible}
        onClose={userDrawer.close}
        currentUser={currentUser}
        onEdit={() => {}}
        onDelete={() => {}}
      />

      {/* 添加协作者 */}
      <AddAssistantModal
        open={addAssistantModal.visible}
        onCancel={addAssistantModal.close}
        loading={addAssistantSubmitting}
        searchUsers={async (keyword) => {
          const users = await userApi.searchUsers(keyword);
          return users as any;
        }}
        onSubmit={handleAddAssistant}
      />

      {/* 编辑任务模态框 */}
      <Modal
        title="编辑任务"
        open={editModal.visible}
        onCancel={editModal.close}
        onOk={() => form.submit()}
        okText="保存"
        cancelText="取消"
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmitEdit}
        >
          <Form.Item
            name="name"
            label="任务名称"
            rules={[formRules.required('请输入任务名称')]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="description"
            label="任务描述"
          >
            <TextArea rows={4} />
          </Form.Item>

          <Form.Item
            name="tags"
            label="标签"
            extra="多个标签用逗号分隔"
          >
            <Input placeholder="例如：前端, React, 紧急" />
          </Form.Item>

          <Form.Item
            name="visibility"
            label="可见性"
            rules={[formRules.required('请选择可见性')]}
          >
            <Select>
              <Option value={Visibility.PUBLIC}>公开</Option>
              <Option value={Visibility.POSITION_ONLY}>仅岗位</Option>
              <Option value={Visibility.PRIVATE}>私有</Option>
            </Select>
          </Form.Item>

          <Space style={{ width: '100%' }}>
            <Form.Item
              name="complexity"
              label="复杂度"
              rules={[formRules.required('请输入复杂度')]}
            >
              <InputNumber min={1} max={5} />
            </Form.Item>

            <Form.Item
              name="priority"
              label="优先级"
              rules={[formRules.required('请输入优先级')]}
            >
              <InputNumber min={1} max={5} />
            </Form.Item>

            <Form.Item
              name="estimatedHours"
              label="预估工时"
              rules={[formRules.required('请输入预估工时')]}
            >
              <InputNumber min={0} step={0.5} addonAfter="小时" />
            </Form.Item>
          </Space>

          <Space style={{ width: '100%' }}>
            <Form.Item
              name="plannedStartDate"
              label="计划开始时间"
              rules={[formRules.required('请选择计划开始时间')]}
            >
              <DatePicker showTime format="YYYY-MM-DD HH:mm" />
            </Form.Item>

            <Form.Item
              name="plannedEndDate"
              label="计划结束时间"
              rules={[formRules.required('请选择计划结束时间')]}
            >
              <DatePicker showTime format="YYYY-MM-DD HH:mm" />
            </Form.Item>
          </Space>
        </Form>
      </Modal>

      {/* 额外奖赏模态框 */}
      <Modal
        title="添加额外奖赏"
        open={bonusModalVisible}
        onCancel={() => {
          setBonusModalVisible(false);
          bonusForm.resetFields();
        }}
        onOk={() => bonusForm.submit()}
        okText="确认发放"
        cancelText="取消"
        confirmLoading={addingBonus}
      >
        <Form
          form={bonusForm}
          layout="vertical"
          onFinish={handleSubmitBonus}
        >
          <Form.Item
            name="amount"
            label="额外奖赏金额"
            rules={[
              { required: true, message: '请输入奖赏金额' },
              { type: 'number', min: 0.01, message: '金额必须大于0' },
            ]}
            extra={selectedTask && `当前任务赏金: $${Number(selectedTask.bountyAmount || 0).toFixed(2)}`}
          >
            <InputNumber
              min={0.01}
              step={10}
              precision={2}
              style={{ width: '100%' }}
              prefix="$"
              placeholder="请输入额外奖赏金额"
            />
          </Form.Item>

          <Form.Item
            name="reason"
            label="奖赏原因"
            extra="可选，说明发放额外奖赏的原因"
          >
            <TextArea
              rows={3}
              placeholder="例如：任务完成质量优秀，提前完成等"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
