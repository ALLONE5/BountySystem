import React, { useEffect, useState } from 'react';
import {
  Typography,
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Tag,
  Drawer,
  Descriptions,
  Progress,
  Avatar,
  Tooltip,
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SearchOutlined,
  ReloadOutlined,
  PlusOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { adminApi, UpdateTaskRequest } from '../../api/admin';
import { taskApi } from '../../api/task';
import { userApi } from '../../api/user';
import { Task, TaskStatus, Visibility, User } from '../../types';
import { UserDetailsDrawer } from '../../components/admin/UserDetailsDrawer';
import { useAuthStore } from '../../store/authStore';
import { TaskViews } from '../../components/TaskViews';
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
  const [assigneeFallback, setAssigneeFallback] = useState<{ username: string; avatarUrl?: string } | null>(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('list');
  const [progressValue, setProgressValue] = useState<number>(0);
  const [updatingProgress, setUpdatingProgress] = useState(false);
  const [addAssistantSubmitting, setAddAssistantSubmitting] = useState(false);

  const [form] = Form.useForm();
  const [addAssistantForm] = Form.useForm();

  // 使用CRUD Hook管理任务数据
  const {
    data: tasks,
    loading,
    update,
    deleteItem,
    loadAll: loadTasks,
    selectedItem: selectedTask,
    setSelectedItem: setSelectedTask,
  } = useCrudOperations<Task>({
    fetchAll: async () => {
      const data = await adminApi.getTasks();
      return data.tasks;
    },
    update: async (id, data) => {
      const updateData: UpdateTaskRequest = {
        name: data.name as string,
        description: data.description as string,
        tags: data.tags as string[],
        plannedStartDate: data.plannedStartDate as Date,
        plannedEndDate: data.plannedEndDate as Date,
        estimatedHours: data.estimatedHours as number,
        complexity: data.complexity as number,
        priority: data.priority as number,
        visibility: data.visibility as Visibility,
      };
      await adminApi.updateTask(id, updateData);
      return { ...selectedTask!, ...data } as Task;
    },
    delete: adminApi.deleteTask,
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


  const handleViewDetails = async (task: Task) => {
    const data = await adminApi.getTaskDetails(task.id);
    setSelectedTask(data.task);
    setProgressValue(data.task.progress || 0);
    
    // Fetch assistants
    try {
      const assistantsData = await taskApi.getAssistants(task.id);
      setAssistants(assistantsData);
    } catch (err) {
      console.error('Failed to load assistants:', err);
      setAssistants([]);
    }

    // Fallback: fetch assignee user if missing
    if (!data.task.assignee && data.task.assigneeId) {
      try {
        const user = await userApi.getUser(data.task.assigneeId);
        setAssigneeFallback({ username: user.username, avatarUrl: user.avatarUrl });
      } catch {
        setAssigneeFallback(null);
      }
    } else {
      setAssigneeFallback(null);
    }

    taskDrawer.open(data.task);
  };

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

  const handleViewUser = async (userId: string) => {
    const data = await adminApi.getUserDetails(userId);
    userDrawer.open(data.user);
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

  const getStatusTag = (status: TaskStatus) => {
    const statusMap = {
      [TaskStatus.NOT_STARTED]: { color: 'default', text: '未开始' },
      [TaskStatus.AVAILABLE]: { color: 'green', text: '可承接' },
      [TaskStatus.IN_PROGRESS]: { color: 'processing', text: '进行中' },
      [TaskStatus.COMPLETED]: { color: 'success', text: '已完成' },
      [TaskStatus.ABANDONED]: { color: 'error', text: '已放弃' },
    };
    const config = statusMap[status];
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

  const columns: ColumnsType<Task> = [
    {
      title: '任务名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      ellipsis: true,
      render: (name: string, record: Task) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetails(record)}
          style={{ padding: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%', display: 'inline-block', verticalAlign: 'middle' }}
        >
          {name}
        </Button>
      ),
    },
    {
      title: '发布人',
      dataIndex: ['publisher', 'username'],
      key: 'publisher',
      width: 120,
      ellipsis: true,
      render: (text: string, record: Task) => (
        record.publisher ? (
          <Button
            type="link"
            icon={<UserOutlined />}
            onClick={() => handleViewUser(record.publisher!.id)}
            style={{ padding: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%', display: 'inline-block', verticalAlign: 'middle' }}
          >
            {text}
          </Button>
        ) : '-'
      ),
    },
    {
      title: '承接人',
      dataIndex: ['assignee', 'username'],
      key: 'assignee',
      width: 120,
      ellipsis: true,
      render: (text: string, record: Task) => (
        record.assignee ? (
          <Button
            type="link"
            icon={<UserOutlined />}
            onClick={() => handleViewUser(record.assignee!.id)}
            style={{ padding: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%', display: 'inline-block', verticalAlign: 'middle' }}
          >
            {text}
          </Button>
        ) : '-'
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: TaskStatus) => getStatusTag(status),
    },
    {
      title: '赏金',
      dataIndex: 'bountyAmount',
      key: 'bountyAmount',
      width: 100,
      render: (amount: number) => `¥${Number(amount || 0).toFixed(2)}`,
    },
    {
      title: '进度',
      dataIndex: 'progress',
      key: 'progress',
      width: 150,
      render: (progress: number) => (
        <Progress percent={progress} size="small" style={{ minWidth: 100 }} />
      ),
    },
    {
      title: '可见性',
      dataIndex: 'visibility',
      key: 'visibility',
      width: 100,
      render: (visibility: Visibility) => getVisibilityTag(visibility),
    },
    {
      title: '截止日期',
      dataIndex: 'plannedEndDate',
      key: 'plannedEndDate',
      width: 120,
      render: (date: Date) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 150,
      render: (_, record: Task) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => {
              Modal.confirm({
                title: '确定要删除此任务吗？',
                content: '此操作不可撤销',
                onOk: () => handleDelete(record.id),
              });
            }}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>任务管理</Title>
      
      <TaskViews
        tasks={tasks}
        loading={loading}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        listView={
          <Card>
            <Space style={{ marginBottom: 16 }}>
              <Input
                placeholder="搜索任务名称或描述"
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                style={{ width: 250 }}
                allowClear
              />
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                style={{ width: 120 }}
              >
                <Option value="all">所有状态</Option>
                <Option value={TaskStatus.NOT_STARTED}>未开始</Option>
                <Option value={TaskStatus.AVAILABLE}>可承接</Option>
                <Option value={TaskStatus.IN_PROGRESS}>进行中</Option>
                <Option value={TaskStatus.COMPLETED}>已完成</Option>
                <Option value={TaskStatus.ABANDONED}>已放弃</Option>
              </Select>
              <Button icon={<ReloadOutlined />} onClick={loadTasks}>
                刷新
              </Button>
            </Space>

            <Table
              columns={columns}
              dataSource={tasks.filter(task => {
                const matchesSearch = task.name.toLowerCase().includes(searchText.toLowerCase()) || 
                                      task.description.toLowerCase().includes(searchText.toLowerCase());
                const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
                return matchesSearch && matchesStatus;
              })}
              rowKey="id"
              loading={loading}
              pagination={{
                showSizeChanger: true,
                showTotal: (total) => `共 ${total} 条`,
              }}
            />
          </Card>
        }
      />

      {/* 任务详情抽屉 */}
      <Drawer
        title="任务详情"
        placement="right"
        width={700}
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
                  ) : assigneeFallback ? (
                    <div style={{ display: 'flex', alignItems: 'center', marginRight: 16 }}>
                      <Tooltip title="Assignee">
                        <Avatar src={assigneeFallback.avatarUrl} icon={<UserOutlined />} style={{ border: '2px solid #1890ff' }} />
                      </Tooltip>
                      <span style={{ marginLeft: 8 }}>{assigneeFallback.username}</span>
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
    </div>
  );
};
