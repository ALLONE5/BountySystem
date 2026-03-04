import React, { useEffect, useState } from 'react';
import {
  Typography,
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Select,
  message,
  Card,
  Statistic,
  Row,
  Col,
  Avatar,
  Spin,
  Divider,
} from 'antd';
import {
  PlusOutlined,
  DollarOutlined,
  ProjectOutlined,
  CheckCircleOutlined,
  UserOutlined,
  SearchOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { 
  DiscordCard, 
  DiscordButton, 
  DiscordTaskCard,
  DiscordStatsCard 
} from '../components/discord/DiscordComponents';
import { taskApi } from '../api/task';
import { positionApi, Position } from '../api/position';
import { projectGroupApi } from '../api/projectGroup';
import { userApi } from '../api/user';
import { Task, TaskStatus, Visibility, User } from '../types';
import { TaskViews } from '../components/TaskViews';
import { TaskDetailDrawer } from '../components/TaskDetailDrawer';
// TaskListPage uses statusConfig for consistent status display
import { TaskListPage } from './TaskListPage';

const { Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const PublishedTasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [projectGroups, setProjectGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activeTab, setActiveTab] = useState('list');
  const [form] = Form.useForm();
  const [newProjectGroupName, setNewProjectGroupName] = useState('');
  const [addingProjectGroup, setAddingProjectGroup] = useState(false);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [assigningTask, setAssigningTask] = useState<Task | null>(null);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>();
  const [assignLoading, setAssignLoading] = useState(false);

  useEffect(() => {
    loadTasks();
    loadPositions();
    loadProjectGroups();
  }, []);

  const loadPositions = async () => {
    try {
      const data = await positionApi.getAllPositions();
      setPositions(data);
    } catch (error) {
      console.error('Failed to load positions:', error);
    }
  };

  const loadProjectGroups = async () => {
    try {
      const data = await projectGroupApi.getAllProjectGroups();
      setProjectGroups(data);
    } catch (error) {
      console.error('Failed to load project groups:', error);
    }
  };

  const handleAddProjectGroup = async () => {
    if (!newProjectGroupName || newProjectGroupName.trim().length === 0) {
      message.error('请输入项目分组名称');
      return;
    }
    setAddingProjectGroup(true);
    try {
      const newGroup = await projectGroupApi.createProjectGroup({
        name: newProjectGroupName.trim(),
      });
      message.success('项目分组创建成功');
      setNewProjectGroupName('');
      await loadProjectGroups();
      form.setFieldsValue({
        projectGroupId: newGroup.id,
      });
    } catch (error: any) {
      message.error(error.response?.data?.error || '创建项目分组失败');
      console.error('Failed to create project group:', error);
    } finally {
      setAddingProjectGroup(false);
    }
  };

  const loadTasks = async () => {
    try {
      setLoading(true);
      const data = await taskApi.getPublishedTasks();
      setTasks(data);
    } catch (error) {
      message.error('加载任务列表失败');
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskClick = async (taskId: string) => {
    try {
      const task = await taskApi.getTask(taskId);
      setSelectedTask(task);
      setDetailDrawerVisible(true);
    } catch (error) {
      message.error('加载任务详情失败');
      console.error(error);
    }
  };

  const handleTaskUpdated = async () => {
    await loadTasks();
  };

  useEffect(() => {
    if (selectedTask && detailDrawerVisible) {
      const updatedTask = tasks.find(t => t.id === selectedTask.id);
      if (updatedTask) {
        setSelectedTask(updatedTask);
      }
    }
  }, [tasks]);

  const handleCreate = () => {
    setSelectedTask(null);
    form.resetFields();
    setEditModalVisible(true);
  };

  const handleEdit = (task: Task) => {
    setSelectedTask(task);
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
    setEditModalVisible(true);
  };

  const handleSearchUsers = debounce(async (query: string) => {
    if (!query || query.trim().length < 2) {
      setUsers([]);
      return;
    }
    setSearchingUsers(true);
    try {
      const results = await userApi.searchUsers(query);
      setUsers(results);
    } catch (error) {
      console.error('Failed to search users:', error);
      message.error('搜索用户失败');
    } finally {
      setSearchingUsers(false);
    }
  }, 300);

  const handleAssignTask = (task: Task) => {
    setAssigningTask(task);
    setSelectedUserId(undefined);
    setUsers([]);
    setAssignModalVisible(true);
  };

  const handleAssignConfirm = async () => {
    if (!assigningTask || !selectedUserId) {
      message.error('请选择要指派的用户');
      return;
    }
    setAssignLoading(true);
    try {
      await taskApi.assignTaskToUser(assigningTask.id, selectedUserId);
      message.success('任务指派成功，已发送邀请通知');
      setAssignModalVisible(false);
      setAssigningTask(null);
      setSelectedUserId(undefined);
      setUsers([]);
      loadTasks();
    } catch (error: any) {
      message.error(error.response?.data?.error || '指派任务失败');
      console.error('Failed to assign task:', error);
    } finally {
      setAssignLoading(false);
    }
  };

  const handlePublishTask = (task: Task) => {
    Modal.confirm({
      title: '发布任务',
      content: '是否由您自己承接此任务？',
      okText: '是，我来做',
      cancelText: '否，发布给他人',
      onOk: async () => {
        try {
          await taskApi.publishTask(task.id, true);
          message.success('任务已发布并由您承接');
          loadTasks();
        } catch (error) {
          message.error('发布任务失败');
          console.error('Failed to publish task:', error);
        }
      },
      onCancel: async () => {
        try {
          await taskApi.publishTask(task.id, false);
          message.success('任务已发布到赏金任务列表');
          loadTasks();
        } catch (error) {
          message.error('发布任务失败');
          console.error('Failed to publish task:', error);
        }
      },
    });
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      await taskApi.completeTask(taskId);
      message.success('任务已完成');
      loadTasks();
    } catch (error: any) {
      message.error(error.response?.data?.error || '完成任务失败');
      console.error('Failed to complete task:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await taskApi.deleteTask(taskId);
      message.success('任务已删除');
      loadTasks();
    } catch (error: any) {
      message.error(error.response?.data?.error || '删除任务失败');
      console.error('Failed to delete task:', error);
    }
  };

  const handleEditSubmit = async () => {
    try {
      const values = await form.validateFields();
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
      if (selectedTask) {
        await taskApi.updateTask(selectedTask.id, taskData);
        message.success('任务更新成功');
      } else {
        await taskApi.createTask(taskData);
        message.success('任务创建成功');
      }
      setEditModalVisible(false);
      form.resetFields();
      loadTasks();
    } catch (error) {
      message.error(selectedTask ? '更新任务失败' : '创建任务失败');
      console.error('Failed to save task:', error);
    }
  };

  const stats = React.useMemo(() => ({
    totalTasks: tasks.length,
    totalBounty: tasks.reduce((sum, task) => sum + Number(task.bountyAmount || 0), 0),
    inProgress: tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length,
    completed: tasks.filter(t => t.status === TaskStatus.COMPLETED).length,
    pendingAcceptance: tasks.filter(t => t.status === TaskStatus.PENDING_ACCEPTANCE).length,
  }), [tasks]);

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <div className="flex-between">
          <div>
            <h1 className="page-title">我的悬赏</h1>
            <p className="page-description">管理您发布的所有任务</p>
          </div>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleCreate}
            size="large"
          >
            创建任务
          </Button>
        </div>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6} lg={4}>
          <Card 
            bordered={false} 
            hoverable 
            style={{ 
              borderLeft: '4px solid #cf1322',
              transition: 'all 0.3s'
            }}
          >
            <Statistic
              title="总悬赏金额"
              value={stats.totalBounty}
              precision={2}
              prefix={<DollarOutlined style={{ fontSize: '20px' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6} lg={4}>
          <Card 
            bordered={false} 
            hoverable 
            style={{ 
              borderLeft: '4px solid #1890ff',
              transition: 'all 0.3s'
            }}
          >
            <Statistic
              title="发布的任务"
              value={stats.totalTasks}
              prefix={<ProjectOutlined style={{ fontSize: '20px', color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6} lg={4}>
          <Card 
            bordered={false} 
            hoverable 
            style={{ 
              borderLeft: '4px solid #fa8c16',
              transition: 'all 0.3s',
              cursor: stats.pendingAcceptance > 0 ? 'pointer' : 'default'
            }}
            onClick={() => {
              if (stats.pendingAcceptance > 0) {
                message.info('这些任务已指派给用户，等待对方接受');
              }
            }}
          >
            <Statistic
              title="待接受"
              value={stats.pendingAcceptance}
              prefix={<UserOutlined style={{ fontSize: '20px' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6} lg={4}>
          <Card 
            bordered={false} 
            hoverable 
            style={{ 
              borderLeft: '4px solid #faad14',
              transition: 'all 0.3s'
            }}
          >
            <Statistic
              title="进行中"
              value={stats.inProgress}
              prefix={<PlayCircleOutlined style={{ fontSize: '20px' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6} lg={4}>
          <Card 
            bordered={false} 
            hoverable 
            style={{ 
              borderLeft: '4px solid #52c41a',
              transition: 'all 0.3s'
            }}
          >
            <Statistic
              title="已完成"
              value={stats.completed}
              prefix={<CheckCircleOutlined style={{ fontSize: '20px' }} />}
            />
          </Card>
        </Col>
      </Row>

        <TaskViews
        tasks={tasks}
        loading={loading}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        listView={
          <TaskListPage 
            tasks={tasks} 
            loading={loading} 
            hideFilters={true} 
            onTaskUpdated={handleTaskUpdated}
            showAssignButton={true}
            onAssignTask={handleAssignTask}
            onPublishTask={handlePublishTask}
            onCompleteTask={handleCompleteTask}
            onEditTask={handleEdit}
            onDeleteTask={handleDeleteTask}
            isPublishedTasksPage={true}
          />
        }
      />
      <Modal
        title={selectedTask ? "编辑任务" : "创建任务"}
        open={editModalVisible}
        onOk={handleEditSubmit}
        onCancel={() => {
          setEditModalVisible(false);
          form.resetFields();
        }}
        width={600}
      >
        <Form form={form} layout="vertical">
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
                    {positions.map(p => (
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
              {projectGroups.map(pg => (
                <Option key={pg.id} value={pg.id}>{pg.name}</Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="指派任务"
        open={assignModalVisible}
        onOk={handleAssignConfirm}
        onCancel={() => {
          setAssignModalVisible(false);
          setAssigningTask(null);
          setSelectedUserId(undefined);
          setUsers([]);
        }}
        okText="确认指派"
        cancelText="取消"
        confirmLoading={assignLoading}
      >
        <Space style={{ width: '100%', flexDirection: 'column' }}>
          <div>
            <Text strong>任务名称：</Text>
            <Text>{assigningTask?.name}</Text>
          </div>
          <div style={{ width: '100%' }}>
            <Text strong>选择用户：</Text>
            <Select
              showSearch
              placeholder="搜索用户（输入用户名或邮箱）"
              style={{ width: '100%', marginTop: 8 }}
              value={selectedUserId}
              onChange={setSelectedUserId}
              onSearch={handleSearchUsers}
              loading={searchingUsers}
              notFoundContent={searchingUsers ? <Spin size="small" /> : null}
              suffixIcon={<SearchOutlined />}
              filterOption={false}
            >
              {users.map(user => (
                <Option key={user.id} value={user.id}>
                  <Space>
                    <Avatar src={user.avatarUrl} size="small" icon={<UserOutlined />} />
                    <span>{user.username}</span>
                    <Text type="secondary">({user.email})</Text>
                  </Space>
                </Option>
              ))}
            </Select>
          </div>
          <div style={{ marginTop: 16 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              提示：指派后任务将自动设置为私有，被指派用户会收到通知
            </Text>
          </div>
        </Space>
      </Modal>

      <TaskDetailDrawer
        task={selectedTask}
        visible={detailDrawerVisible}
        onClose={() => setDetailDrawerVisible(false)}
        onTaskUpdated={handleTaskUpdated}
        onTaskClick={handleTaskClick}
      />
    </div>
  );
};

export default PublishedTasksPage;
