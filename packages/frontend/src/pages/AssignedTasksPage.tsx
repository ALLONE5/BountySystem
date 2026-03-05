import React, { useEffect, useState } from 'react';
import {
  Typography,
  Button,
  Space,
  Tag,
  Modal,
  Slider,
  message,
  Progress,
  Card,
  Row,
  Col,
  Statistic,
  Tabs,
  List,
  Avatar,
  Empty,
  Input,
  Badge,
  Select,
} from 'antd';
import {
  TeamOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FolderOutlined,
  MailOutlined,
  UserOutlined,
  DollarOutlined,
  EyeOutlined,
  CheckOutlined,
  CloseOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { taskApi } from '../api/task';
import { groupApi } from '../api/group';
import { Task, TaskStatus } from '../types';
import { TaskViews } from '../components/TaskViews';
import { TaskDetailDrawer } from '../components/TaskDetailDrawer';
import { StatusBadge } from '../components/common/StatusBadge';
import { TaskListPage } from './TaskListPage';

const { Title, Text } = Typography;
const { TextArea } = Input;

export const AssignedTasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [invitations, setInvitations] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [invitationsLoading, setInvitationsLoading] = useState(false);
  const [progressModalVisible, setProgressModalVisible] = useState(false);
  const [taskDetailDrawerVisible, setTaskDetailDrawerVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [progressValue, setProgressValue] = useState(0);
  const [activeTab, setActiveTab] = useState<'assigned' | 'invitations'>('assigned');
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [convertToGroupModalVisible, setConvertToGroupModalVisible] = useState(false);
  const [userGroups, setUserGroups] = useState<any[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>();
  const [convertingToGroup, setConvertingToGroup] = useState(false);
  const [taskToConvert, setTaskToConvert] = useState<Task | null>(null);

  useEffect(() => {
    loadTasks();
    loadInvitations();
    loadUserGroups();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const data = await taskApi.getAssignedTasks();
      setTasks(data);
    } catch (error) {
      message.error('加载任务列表失败');
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadInvitations = async () => {
    try {
      setInvitationsLoading(true);
      const data = await taskApi.getTaskInvitations();
      setInvitations(data);
    } catch (error) {
      message.error('加载任务邀请失败');
      console.error('Failed to load invitations:', error);
    } finally {
      setInvitationsLoading(false);
    }
  };

  const loadUserGroups = async () => {
    try {
      const data = await groupApi.getUserGroups();
      setUserGroups(data);
    } catch (error) {
      console.error('Failed to load user groups:', error);
    }
  };

  // 计算每个任务的子任务数量
  const getSubtaskCount = (taskId: string): number => {
    return tasks.filter(t => t.parentId === taskId).length;
  };

  const handleUpdateProgress = (task: Task) => {
    setSelectedTask(task);
    setProgressValue(task.progress || 0);
    setProgressModalVisible(true);
  };

  const handleProgressSubmit = async () => {
    if (!selectedTask) return;

    try {
      await taskApi.updateProgress(selectedTask.id, progressValue);
      message.success('进度更新成功');
      setProgressModalVisible(false);
      loadTasks();
    } catch (error) {
      message.error('更新进度失败');
      console.error('Failed to update progress:', error);
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
          loadTasks();
        } catch (error) {
          message.error('完成任务失败');
          console.error('Failed to complete task:', error);
          throw error;
        }
      },
    });
  };

  const handleViewTaskDetail = (task: Task) => {
    setSelectedTask(task);
    setTaskDetailDrawerVisible(true);
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

  const handleTaskUpdated = async () => {
    await loadTasks();
  };

  const handleJoinGroup = (task: Task) => {
    setTaskToConvert(task);
    // If task already has a group, set it as selected (view mode)
    // Otherwise, leave it undefined (select mode)
    setSelectedGroupId(task.groupId || undefined);
    setConvertToGroupModalVisible(true);
  };

  const handleConvertToGroupConfirm = async () => {
    // If task already has a group, just close the modal (view mode)
    if (taskToConvert?.groupId) {
      setConvertToGroupModalVisible(false);
      setTaskToConvert(null);
      return;
    }

    // Otherwise, proceed with conversion
    if (!taskToConvert || !selectedGroupId) {
      message.error('请选择要关联的组群');
      return;
    }

    setConvertingToGroup(true);
    try {
      await groupApi.convertTaskToGroupTask(selectedGroupId, taskToConvert.id);
      message.success('任务已加入群组');
      setConvertToGroupModalVisible(false);
      setSelectedGroupId(undefined);
      setTaskToConvert(null);
      await loadTasks();
    } catch (error: any) {
      message.error(error.response?.data?.error || '转换失败');
      console.error('Failed to convert task to group task:', error);
    } finally {
      setConvertingToGroup(false);
    }
  };

  const handleAcceptInvitation = async (task: Task) => {
    setActionLoading(task.id);
    try {
      await taskApi.acceptTaskAssignment(task.id);
      message.success('已接受任务');
      await loadInvitations();
      await loadTasks(); // Refresh assigned tasks as well
      // Trigger event to update invitation count in MainLayout
      window.dispatchEvent(new Event('invitation-updated'));
    } catch (error: any) {
      message.error(error.response?.data?.message || '接受任务失败');
      console.error('Failed to accept task:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectInvitationClick = (task: Task) => {
    setSelectedTask(task);
    setRejectReason('');
    setRejectModalVisible(true);
  };

  const handleRejectInvitationConfirm = async () => {
    if (!selectedTask) return;

    setActionLoading(selectedTask.id);
    try {
      await taskApi.rejectTaskAssignment(selectedTask.id, rejectReason);
      message.success('已拒绝任务');
      setRejectModalVisible(false);
      setSelectedTask(null);
      setRejectReason('');
      await loadInvitations();
      // Trigger event to update invitation count in MainLayout
      window.dispatchEvent(new Event('invitation-updated'));
    } catch (error: any) {
      message.error(error.response?.data?.message || '拒绝任务失败');
      console.error('Failed to reject task:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const formatBounty = (amount: number) => {
    return `¥${Number(amount || 0).toFixed(2)}`;
  };

  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return '-';
    return dayjs(date).format('YYYY-MM-DD');
  };

  // Update selected task when tasks array changes
  useEffect(() => {
    if (selectedTask && taskDetailDrawerVisible) {
      const updatedTask = tasks.find(t => t.id === selectedTask.id);
      if (updatedTask) {
        setSelectedTask(updatedTask);
      }
    }
  }, [tasks]);

  // Calculate statistics
  const stats = {
    total: tasks.length,
    inProgress: tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length,
    completed: tasks.filter(t => t.status === TaskStatus.COMPLETED).length,
    totalBounty: tasks.reduce((sum, t) => sum + (Number(t.bountyAmount) || 0), 0),
    invitations: invitations.length,
  };

  // @ts-expect-error - Unused columns definition kept for reference
  const _columns: ColumnsType<Task> = [
    {
      title: '任务名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Task) => {
        const subtaskCount = getSubtaskCount(record.id);
        
        return (
          <Space>
            <Button
              type="link"
              onClick={() => handleViewTaskDetail(record)}
              style={{ padding: 0 }}
            >
              {name}
            </Button>
            {subtaskCount > 0 && (
              <Badge 
                count={subtaskCount} 
                style={{ 
                  backgroundColor: '#52c41a',
                }} 
                title={`${subtaskCount}个子任务`}
              />
            )}
            {record.groupName && (
              <Tag color="geekblue" icon={<TeamOutlined />}>
                {record.groupName}
              </Tag>
            )}
          </Space>
        );
      },
    },
    {
      title: '项目组',
      dataIndex: 'projectGroupName',
      key: 'projectGroupName',
      width: 150,
      render: (name: string) => name ? (
        <Tag color="purple" icon={<FolderOutlined />}>{name}</Tag>
      ) : <Text type="secondary">无</Text>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: TaskStatus) => <StatusBadge status={status} />,
    },
    {
      title: '赏金',
      dataIndex: 'bountyAmount',
      key: 'bountyAmount',
      render: (amount: number) => `$${Number(amount || 0).toFixed(2)}`,
    },
    {
      title: '进度',
      dataIndex: 'progress',
      key: 'progress',
      render: (progress: number) => (
        <Progress percent={progress} size="small" style={{ minWidth: 100 }} />
      ),
    },
    {
      title: '截止日期',
      dataIndex: 'plannedEndDate',
      key: 'plannedEndDate',
      render: (date: Date) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          {record.status === TaskStatus.IN_PROGRESS && (
            <Button
              type="link"
              size="small"
              onClick={() => handleUpdateProgress(record)}
            >
              更新进度
            </Button>
          )}
        </Space>
      ),
    },
  ];



  return (
    <div className="page-container fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <Title level={2} style={{ margin: 0 }}>我的任务</Title>
          <Text type="secondary">查看和管理您承接的任务及任务邀请</Text>
        </div>
      </div>

      {/* Statistics Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card" style={{ borderLeft: '4px solid #1890ff' }}>
            <Statistic
              title="总任务数"
              value={stats.total}
              prefix={<ClockCircleOutlined style={{ color: '#1890ff', fontSize: 20 }} />}
              styles={{ content: { fontSize: 24, fontWeight: 600 } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card" style={{ borderLeft: '4px solid #faad14' }}>
            <Statistic
              title="进行中"
              value={stats.inProgress}
              prefix={<PlayCircleOutlined style={{ color: '#faad14', fontSize: 20 }} />}
              styles={{ content: { fontSize: 24, fontWeight: 600 } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card" style={{ borderLeft: '4px solid #52c41a' }}>
            <Statistic
              title="已完成"
              value={stats.completed}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a', fontSize: 20 }} />}
              styles={{ content: { fontSize: 24, fontWeight: 600 } }}
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
              styles={{ content: { fontSize: 24, fontWeight: 600, color: '#f5222d' } }}
            />
          </Card>
        </Col>
      </Row>

      {/* Tabs for Assigned Tasks and Invitations */}
      <Card>
        <Tabs 
          activeKey={activeTab} 
          onChange={(key) => setActiveTab(key as 'assigned' | 'invitations')}
          items={[
            {
              key: 'assigned',
              label: (
                <span style={{ fontSize: 15 }}>
                  <CheckCircleOutlined /> 已承接任务
                </span>
              ),
              children: (
                <TaskViews
                  tasks={tasks}
                  loading={loading}
                  listView={
                    <TaskListPage 
                      tasks={tasks} 
                      loading={loading} 
                      hideFilters={true} 
                      onTaskUpdated={handleTaskUpdated}
                      onCompleteTask={handleCompleteTask}
                      onJoinGroup={handleJoinGroup}
                      userGroups={userGroups}
                    />
                  }
                />
              ),
            },
            {
              key: 'invitations',
              label: (
                <span style={{ fontSize: 15 }}>
                  <MailOutlined /> 任务邀请
                  {stats.invitations > 0 && (
                    <Badge count={stats.invitations} style={{ marginLeft: 8 }} />
                  )}
                </span>
              ),
              children: invitationsLoading ? (
                <div style={{ textAlign: 'center', padding: '50px 0' }}>
                  <Empty description="加载中..." />
                </div>
              ) : invitations.length === 0 ? (
                <Empty
                  description="暂无任务邀请"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  style={{ padding: '50px 0' }}
                />
              ) : (
                <List
                  dataSource={invitations}
                  renderItem={(task) => (
                    <List.Item
                      key={task.id}
                      actions={[
                        <Button
                          key="accept"
                          type="primary"
                          icon={<CheckOutlined />}
                          onClick={() => handleAcceptInvitation(task)}
                          loading={actionLoading === task.id}
                        >
                          接受
                        </Button>,
                        <Button
                          key="reject"
                          danger
                          icon={<CloseOutlined />}
                          onClick={() => handleRejectInvitationClick(task)}
                          loading={actionLoading === task.id}
                        >
                          拒绝
                        </Button>,
                        <Button
                          key="view"
                          icon={<EyeOutlined />}
                          onClick={() => {
                            setSelectedTask(task);
                            setTaskDetailDrawerVisible(true);
                          }}
                        >
                          查看详情
                        </Button>,
                      ]}
                    >
                      <List.Item.Meta
                        avatar={
                          <Avatar
                            size={64}
                            src={task.publisher?.avatarUrl}
                            icon={<UserOutlined />}
                          />
                        }
                        title={
                          <Space>
                            <Text strong style={{ fontSize: '16px' }}>
                              {task.name}
                            </Text>
                            <Tag color="orange">待接受</Tag>
                          </Space>
                        }
                        description={
                          <Space orientation="vertical" size="small" style={{ width: '100%' }}>
                            <Text type="secondary">{task.description || '无描述'}</Text>
                            
                            <Space wrap>
                              <Space>
                                <UserOutlined />
                                <Text>发布者: {task.publisher?.username}</Text>
                              </Space>
                              
                              <Space>
                                <DollarOutlined />
                                <Text>赏金: {formatBounty(task.bountyAmount || task.bounty)}</Text>
                              </Space>
                              
                              {task.estimatedHours && (
                                <Space>
                                  <ClockCircleOutlined />
                                  <Text>预估工时: {task.estimatedHours}小时</Text>
                                </Space>
                              )}
                            </Space>

                            {(task.plannedStartDate || task.plannedEndDate) && (
                              <Space>
                                <Text type="secondary">
                                  计划时间: {formatDate(task.plannedStartDate)} 至 {formatDate(task.plannedEndDate)}
                                </Text>
                              </Space>
                            )}

                            {task.tags && task.tags.length > 0 && (
                              <Space wrap>
                                {task.tags.map((tag) => (
                                  <Tag key={tag}>{tag}</Tag>
                                ))}
                              </Space>
                            )}
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              ),
            },
          ]}
        />
      </Card>

      {/* 更新进度模态框 */}
      <Modal
        title="更新任务进度"
        open={progressModalVisible}
        onOk={handleProgressSubmit}
        onCancel={() => setProgressModalVisible(false)}
      >
        {selectedTask && (
          <div>
            <p><strong>任务：</strong>{selectedTask.name}</p>
            <p><strong>当前进度：</strong>{selectedTask.progress}%</p>
            <div style={{ marginTop: 20 }}>
              <p>新进度：</p>
              <Slider
                value={progressValue}
                onChange={setProgressValue}
                marks={{
                  0: '0%',
                  25: '25%',
                  50: '50%',
                  75: '75%',
                  100: '100%',
                }}
              />
              <div style={{ textAlign: 'center', marginTop: 10, fontSize: 24, fontWeight: 'bold' }}>
                {progressValue}%
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* 拒绝任务邀请模态框 */}
      <Modal
        title="拒绝任务邀请"
        open={rejectModalVisible}
        onOk={handleRejectInvitationConfirm}
        onCancel={() => {
          setRejectModalVisible(false);
          setSelectedTask(null);
          setRejectReason('');
        }}
        okText="确认拒绝"
        cancelText="取消"
        okButtonProps={{ danger: true, loading: actionLoading === selectedTask?.id }}
      >
        <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
          <Text>您确定要拒绝任务 "{selectedTask?.name}" 吗？</Text>
          
          <div>
            <Text>拒绝原因（可选）：</Text>
            <TextArea
              rows={4}
              placeholder="请输入拒绝原因，这将发送给任务发布者"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              maxLength={500}
              showCount
            />
          </div>
        </Space>
      </Modal>

      {/* 任务详情抽屉 */}
      <TaskDetailDrawer
        task={selectedTask}
        visible={taskDetailDrawerVisible}
        onClose={() => setTaskDetailDrawerVisible(false)}
        onUpdateProgress={handleUpdateProgress}
        onCompleteTask={handleCompleteTask}
        onTaskUpdated={handleTaskUpdated}
        onTaskClick={handleTaskClick}
      />

      {/* 群组模态框 */}
      <Modal
        title={taskToConvert?.groupId ? "任务群组" : "加入群组"}
        open={convertToGroupModalVisible}
        onOk={handleConvertToGroupConfirm}
        onCancel={() => {
          setConvertToGroupModalVisible(false);
          setSelectedGroupId(undefined);
          setTaskToConvert(null);
        }}
        okText={taskToConvert?.groupId ? "关闭" : "确认加入"}
        cancelText={taskToConvert?.groupId ? null : "取消"}
        confirmLoading={convertingToGroup}
        footer={taskToConvert?.groupId ? [
          <Button key="close" type="primary" onClick={() => {
            setConvertToGroupModalVisible(false);
            setTaskToConvert(null);
          }}>
            关闭
          </Button>
        ] : undefined}
      >
        <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
          {taskToConvert?.groupId ? (
            // View mode: Show current group information
            <>
              <Text>此任务已关联到以下群组：</Text>
              
              <div style={{ padding: 16, background: '#f0f2f5', borderRadius: 4 }}>
                <Space orientation="vertical" size="small" style={{ width: '100%' }}>
                  <div>
                    <Text strong style={{ fontSize: 16 }}>
                      <TeamOutlined /> {taskToConvert.groupName || '未知群组'}
                    </Text>
                  </div>
                  {userGroups.find(g => g.id === taskToConvert.groupId) && (
                    <Text type="secondary">
                      成员数：{userGroups.find(g => g.id === taskToConvert.groupId)?.members?.length || 0} 人
                    </Text>
                  )}
                </Space>
              </div>

              <div style={{ marginTop: 16, padding: 12, background: '#e6f7ff', borderRadius: 4, borderLeft: '3px solid #1890ff' }}>
                <Text style={{ fontSize: 12, color: '#096dd9' }}>
                  <strong>说明：</strong>
                  <br />
                  • 群组中的所有成员都可以查看此任务
                  <br />
                  • 您仍然是任务的承接者
                  <br />
                  • 任务关联的群组不可更改
                </Text>
              </div>
            </>
          ) : (
            // Select mode: Allow joining a group
            <>
              <Text>将任务 "{taskToConvert?.name}" 加入群组后，组群中的所有成员都可以查看和协作此任务。</Text>
              
              <div>
                <Text strong>选择组群：</Text>
                <Select
                  placeholder="请选择要关联的组群"
                  value={selectedGroupId}
                  onChange={setSelectedGroupId}
                  style={{ width: '100%', marginTop: 8 }}
                >
                  {userGroups.map(group => (
                    <Select.Option key={group.id} value={group.id}>
                      <Space>
                        <TeamOutlined />
                        <span>{group.name}</span>
                        <Text type="secondary">({group.members?.length || 0} 成员)</Text>
                      </Space>
                    </Select.Option>
                  ))}
                </Select>
              </div>

              <div style={{ marginTop: 16, padding: 12, background: '#fff7e6', borderRadius: 4, borderLeft: '3px solid #faad14' }}>
                <Text style={{ fontSize: 12, color: '#d46b08' }}>
                  <strong>注意：</strong>
                  <br />
                  • 加入后，您仍然是任务的承接者
                  <br />
                  • 组群成员可以查看任务详情和进度
                  <br />
                  • 此操作不可撤销
                </Text>
              </div>
            </>
          )}
        </Space>
      </Modal>
    </div>
  );
};
