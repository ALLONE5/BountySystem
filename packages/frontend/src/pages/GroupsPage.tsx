import React, { useEffect, useState } from 'react';
import {
  Typography,
  Card,
  List,
  Button,
  Drawer,
  Empty,
  message,
  Space,
  Modal,
  Form,
  Input,
  DatePicker,
  InputNumber,
  Select,
  Row,
  Col,
  Statistic,
} from 'antd';
import {
  EyeOutlined,
  TeamOutlined,
  PlusOutlined,
  UserAddOutlined,
  UserOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { groupApi } from '../api/group';
import { userApi } from '../api/user';
import { taskApi } from '../api/task';
import { TaskGroup, Task, TaskStatus } from '../types';
import { StatusTag } from '../components/common/StatusTag';
import { UserChip } from '../components/common/UserChip';
import { InviteMemberModal, UserOption } from '../components/common/InviteMemberModal';
import { TaskViews } from '../components/TaskViews';
import { TaskListPage } from './TaskListPage';
import { TaskDetailDrawer } from '../components/TaskDetailDrawer';
import { useAuthStore } from '../store/authStore';

const { Title, Text: AntText } = Typography;

export const GroupsPage: React.FC = () => {
  const { user } = useAuthStore();
  const [groups, setGroups] = useState<TaskGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<TaskGroup | null>(null);
  const [groupTasks, setGroupTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [createTaskModalVisible, setCreateTaskModalVisible] = useState(false);
  const [createTaskLoading, setCreateTaskLoading] = useState(false);
  const [taskDetailDrawerVisible, setTaskDetailDrawerVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [form] = Form.useForm();
  const [taskForm] = Form.useForm();

  const getAvatarUrl = (avatarUrl?: string, seed?: string) => {
    if (avatarUrl) return avatarUrl;
    if (seed) return `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(seed)}`;
    return undefined;
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const data = await groupApi.getUserGroups();
      setGroups(data || []);
    } catch (error) {
      console.error('Failed to load groups:', error);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewGroup = async (group: TaskGroup) => {
    try {
      setLoadingTasks(true);
      const [details, members, tasks] = await Promise.all([
        groupApi.getGroup(group.id),
        groupApi.getGroupMembers(group.id),
        groupApi.getGroupTasks(group.id),
      ]);

      console.log('[GroupsPage] Loaded group tasks:', tasks.length, 'tasks');
      console.log('[GroupsPage] Tasks with parentId:', tasks.filter(t => t.parentId).length);
      console.log('[GroupsPage] Top-level tasks:', tasks.filter(t => !t.parentId).length);

      setSelectedGroup({ ...details, members });
      setGroupTasks(tasks);
      setDrawerVisible(true);
    } catch (error) {
      message.error('加载组群详情失败');
      console.error('Failed to load group details:', error);
    } finally {
      setLoadingTasks(false);
    }
  };

  const handleCreateGroup = async (values: { name: string }) => {
    try {
      setCreateLoading(true);
      await groupApi.createGroup(values.name);
      message.success('Group created successfully');
      setCreateModalVisible(false);
      form.resetFields();
      loadGroups();
    } catch (error) {
      console.error('Failed to create group:', error);
      message.error('Failed to create group');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleInviteMember = async (userId: string) => {
    if (!selectedGroup) return;
    try {
      setInviteLoading(true);
      await groupApi.inviteMember(selectedGroup.id, userId);
      message.success('Invitation sent successfully');
      setInviteModalVisible(false);
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to invite member');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleSearchUsers = async (keyword: string): Promise<UserOption[]> => {
    if (!keyword) return [];
    try {
      const users = await userApi.searchUsers(keyword);
      return users.map(u => ({
        id: u.id,
        username: u.username,
        email: u.email,
        avatarUrl: u.avatarUrl
      }));
    } catch (error) {
      console.error('Failed to search users:', error);
      return [];
    }
  };

  const handleCreateTask = async (values: any) => {
    if (!selectedGroup) return;
    try {
      setCreateTaskLoading(true);
      
      const taskData = {
        name: values.name,
        description: values.description,
        tags: values.tags || [],
        plannedStartDate: values.dateRange[0].toISOString(),
        plannedEndDate: values.dateRange[1].toISOString(),
        estimatedHours: values.estimatedHours,
        complexity: values.complexity,
        priority: values.priority,
      };

      await groupApi.createGroupTask(selectedGroup.id, taskData);
      message.success('任务创建成功');
      setCreateTaskModalVisible(false);
      taskForm.resetFields();
      
      // 刷新组群任务列表
      const tasks = await groupApi.getGroupTasks(selectedGroup.id);
      setGroupTasks(tasks);
    } catch (error: any) {
      message.error(error.response?.data?.error || '创建任务失败');
      console.error('Failed to create task:', error);
    } finally {
      setCreateTaskLoading(false);
    }
  };

  const handleAcceptTask = async (taskId: string) => {
    if (!selectedGroup) return;
    try {
      await groupApi.acceptGroupTask(selectedGroup.id, taskId);
      message.success('任务承接成功');
      
      // 刷新组群任务列表
      const tasks = await groupApi.getGroupTasks(selectedGroup.id);
      setGroupTasks(tasks);
    } catch (error: any) {
      message.error(error.response?.data?.error || '承接任务失败');
      console.error('Failed to accept task:', error);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    Modal.confirm({
      title: '确定要完成这个任务吗？',
      content: '完成任务后将无法再更新进度，此操作可能需要几秒钟时间',
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          await taskApi.completeTask(taskId);
          message.success('任务已完成');
          
          // 刷新组群任务列表
          if (selectedGroup) {
            const tasks = await groupApi.getGroupTasks(selectedGroup.id);
            setGroupTasks(tasks);
          }
        } catch (error) {
          message.error('完成任务失败');
          console.error('Failed to complete task:', error);
          throw error;
        }
      },
    });
  };

  const handleAbandonTask = async (taskId: string) => {
    try {
      await taskApi.abandonTask(taskId);
      message.success('任务已放弃');
      
      // 刷新组群任务列表
      if (selectedGroup) {
        const tasks = await groupApi.getGroupTasks(selectedGroup.id);
        setGroupTasks(tasks);
      }
    } catch (error) {
      message.error('放弃任务失败');
      console.error('Failed to abandon task:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await taskApi.deleteTask(taskId);
      message.success('任务已删除');
      
      // 刷新组群任务列表
      if (selectedGroup) {
        const tasks = await groupApi.getGroupTasks(selectedGroup.id);
        setGroupTasks(tasks);
      }
    } catch (error: any) {
      message.error(error.response?.data?.error || '删除任务失败');
      console.error('Failed to delete task:', error);
    }
  };

  const handleTaskUpdated = async () => {
    if (selectedGroup) {
      const tasks = await groupApi.getGroupTasks(selectedGroup.id);
      setGroupTasks(tasks);
    }
  };

  const handleTaskClick = async (taskId: string) => {
    try {
      const task = await taskApi.getTask(taskId);
      setSelectedTask(task);
      setTaskDetailDrawerVisible(true);
    } catch (error) {
      message.error('加载任务详情失败');
      console.error(error);
    }
  };

  // Calculate statistics
  const stats = {
    total: groupTasks.length,
    inProgress: groupTasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length,
    completed: groupTasks.filter(t => t.status === TaskStatus.COMPLETED).length,
    totalBounty: groupTasks.reduce((sum, t) => sum + (Number(t.bountyAmount) || 0), 0),
  };

  return (
    <div className="page-container fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <Title level={2} style={{ margin: 0 }}>
            <TeamOutlined /> 我的组群
          </Title>
          <AntText type="secondary">管理您的团队协作组群</AntText>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={() => setCreateModalVisible(true)}
        >
          创建组群
        </Button>
      </div>

      <List
        loading={loading}
        grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4 }}
        dataSource={groups}
        locale={{ emptyText: <Empty description="暂无组群" /> }}
        renderItem={(group) => (
          <List.Item>
            <Card
              hoverable
              className="task-card"
              onClick={() => handleViewGroup(group)}
              style={{ borderLeft: '4px solid #1890ff' }}
              actions={[
                <Button
                  type="link"
                  icon={<EyeOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewGroup(group);
                  }}
                >
                  查看详情
                </Button>,
              ]}
            >
              <Card.Meta
                avatar={<TeamOutlined style={{ fontSize: 32, color: '#1890ff' }} />}
                title={<AntText strong style={{ fontSize: 16 }}>{group.name}</AntText>}
                description={
                  <Space direction="vertical" size={4}>
                    <AntText type="secondary">
                      <UserOutlined /> 成员数: {group.members?.length || group.memberIds?.length || 0}
                    </AntText>
                    <AntText type="secondary">
                      创建时间: {dayjs(group.createdAt).format('YYYY-MM-DD')}
                    </AntText>
                  </Space>
                }
              />
            </Card>
          </List.Item>
        )}
      />

      {/* 组群详情抽屉 */}
      <Drawer
        title="组群详情"
        placement="right"
        width={1000}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
      >
        {selectedGroup && (
          <div>
            <Title level={4}>{selectedGroup.name}</Title>
            
            <Card 
              title="成员列表" 
              style={{ marginBottom: 16 }}
              extra={
                selectedGroup.creatorId === user?.id && (
                  <Button 
                    type="primary" 
                    size="small" 
                    icon={<UserAddOutlined />}
                    onClick={() => setInviteModalVisible(true)}
                  >
                    邀请成员
                  </Button>
                )
              }
            >
              {selectedGroup.members && selectedGroup.members.length > 0 ? (
                <Space wrap>
                  {selectedGroup.members.map((member) => (
                    <UserChip
                      key={member.id}
                      avatarUrl={getAvatarUrl(member.avatarUrl, member.avatarId || member.username)}
                      username={member.username}
                      tip={member.email}
                      size={40}
                      extra={<StatusTag value={member.role as any} />}
                    />
                  ))}
                </Space>
              ) : (
                <Empty description="暂无成员" />
              )}
            </Card>

            {/* Statistics Cards */}
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col xs={24} sm={12} lg={6}>
                <Card className="stat-card" style={{ borderLeft: '4px solid #1890ff' }}>
                  <Statistic
                    title="总任务数"
                    value={stats.total}
                    prefix={<ClockCircleOutlined style={{ color: '#1890ff', fontSize: 20 }} />}
                    valueStyle={{ fontSize: 24, fontWeight: 600 }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card className="stat-card" style={{ borderLeft: '4px solid #faad14' }}>
                  <Statistic
                    title="进行中"
                    value={stats.inProgress}
                    prefix={<PlayCircleOutlined style={{ color: '#faad14', fontSize: 20 }} />}
                    valueStyle={{ fontSize: 24, fontWeight: 600 }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card className="stat-card" style={{ borderLeft: '4px solid #52c41a' }}>
                  <Statistic
                    title="已完成"
                    value={stats.completed}
                    prefix={<CheckCircleOutlined style={{ color: '#52c41a', fontSize: 20 }} />}
                    valueStyle={{ fontSize: 24, fontWeight: 600 }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card className="stat-card" style={{ borderLeft: '4px solid #f5222d' }}>
                  <Statistic
                    title="总赏金"
                    value={stats.totalBounty}
                    prefix="$"
                    precision={2}
                    valueStyle={{ fontSize: 24, fontWeight: 600, color: '#f5222d' }}
                  />
                </Card>
              </Col>
            </Row>

            <Card 
              title="组群任务" 
              extra={
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setCreateTaskModalVisible(true)}
                >
                  创建任务
                </Button>
              }
            >
              <TaskViews
                tasks={groupTasks}
                loading={loadingTasks}
                listView={
                  <TaskListPage
                    key={selectedGroup.id}
                    tasks={groupTasks}
                    loading={loadingTasks}
                    hideFilters
                    showAcceptButton
                    isGroupTasksPage
                    onAcceptTask={handleAcceptTask}
                    onCompleteTask={handleCompleteTask}
                    onAbandonTask={handleAbandonTask}
                    onDeleteTask={handleDeleteTask}
                    onTaskUpdated={handleTaskUpdated}
                  />
                }
              />
            </Card>

          </div>
        )}
      </Drawer>

      {/* 任务详情抽屉 */}
      <TaskDetailDrawer
        task={selectedTask}
        visible={taskDetailDrawerVisible}
        onClose={() => setTaskDetailDrawerVisible(false)}
        onTaskUpdated={handleTaskUpdated}
        onTaskClick={handleTaskClick}
      />

      {/* 创建组群模态框 */}
      <Modal
        title="创建组群"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateGroup}
        >
          <Form.Item
            name="name"
            label="组群名称"
            rules={[{ required: true, message: '请输入组群名称' }]}
          >
            <Input placeholder="请输入组群名称" />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={createLoading}
              block
            >
              创建组群
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* 邀请成员模态框 */}
      <InviteMemberModal
        open={inviteModalVisible}
        onCancel={() => setInviteModalVisible(false)}
        onSubmit={handleInviteMember}
        loading={inviteLoading}
        searchUsers={handleSearchUsers}
      />

      {/* 创建任务模态框 */}
      <Modal
        title="创建组群任务"
        open={createTaskModalVisible}
        onCancel={() => {
          setCreateTaskModalVisible(false);
          taskForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={taskForm}
          layout="vertical"
          onFinish={handleCreateTask}
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
            <Input.TextArea rows={4} placeholder="请输入任务描述" />
          </Form.Item>

          <Form.Item name="tags" label="标签">
            <Select mode="tags" placeholder="输入标签后按回车" />
          </Form.Item>

          <Form.Item
            name="dateRange"
            label="计划时间"
            rules={[{ required: true, message: '请选择计划时间' }]}
          >
            <DatePicker.RangePicker style={{ width: '100%' }} />
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
              <Select.Option value={1}>1 - 非常简单</Select.Option>
              <Select.Option value={2}>2 - 简单</Select.Option>
              <Select.Option value={3}>3 - 中等</Select.Option>
              <Select.Option value={4}>4 - 复杂</Select.Option>
              <Select.Option value={5}>5 - 非常复杂</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="priority"
            label="优先级"
            rules={[{ required: true, message: '请选择优先级' }]}
          >
            <Select>
              <Select.Option value={1}>1 - 最低</Select.Option>
              <Select.Option value={2}>2 - 低</Select.Option>
              <Select.Option value={3}>3 - 中</Select.Option>
              <Select.Option value={4}>4 - 高</Select.Option>
              <Select.Option value={5}>5 - 最高</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={createTaskLoading}
              >
                创建任务
              </Button>
              <Button onClick={() => {
                setCreateTaskModalVisible(false);
                taskForm.resetFields();
              }}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
