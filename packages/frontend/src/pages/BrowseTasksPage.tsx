import React, { useEffect, useState } from 'react';
import {
  Typography,
  Card,
  Row,
  Col,
  Input,
  Select,
  Button,
  Tag,
  Space,
  Modal,
  message,
  Divider,
  Empty,
  Spin,
  Avatar,
} from 'antd';
import {
  SearchOutlined,
  SortAscendingOutlined,
  GroupOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  FlagOutlined,
  UserOutlined,
  TeamOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { taskApi } from '../api/task';
import { Task } from '../types';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { Search } = Input;

export const BrowseTasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [sortBy, setSortBy] = useState<'bounty' | 'deadline' | 'priority' | 'createdAt' | 'updatedAt'>('bounty');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [groupBy, setGroupBy] = useState<'none' | 'position' | 'tag' | 'complexity' | 'group' | 'projectGroup'>('none');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 50;

  useEffect(() => {
    loadTasks(true); // Reset to first page
  }, [sortBy, sortOrder, searchKeyword]);

  useEffect(() => {
    filterAndGroupTasks();
  }, [tasks, groupBy]);

  const loadTasks = async (reset: boolean = false) => {
    try {
      setLoading(true);
      const page = reset ? 1 : currentPage;
      
      const data = await taskApi.browseTasks({
        sortBy,
        sortOrder,
        search: searchKeyword || undefined,
        page,
        pageSize,
      });
      
      if (reset) {
        setTasks(data);
        setCurrentPage(1);
      } else {
        setTasks(prev => [...prev, ...data]);
      }
      
      // If we got less than pageSize, there are no more tasks
      setHasMore(data.length === pageSize);
    } catch (error) {
      message.error('加载任务列表失败');
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreTasks = () => {
    setCurrentPage(prev => prev + 1);
    loadTasks(false);
  };

  const filterAndGroupTasks = () => {
    // No client-side filtering needed anymore - search is done on backend
    setFilteredTasks(tasks);
  };

  const handleSearch = (value: string) => {
    setSearchKeyword(value);
    // loadTasks will be triggered by useEffect
  };

  const handleAcceptTask = async (taskId: string) => {
    try {
      await taskApi.acceptTask(taskId);
      message.success('任务承接成功');
      loadTasks();
      setDetailModalVisible(false);
    } catch (error) {
      message.error('承接任务失败');
      console.error('Failed to accept task:', error);
    }
  };

  const handleViewDetail = (task: Task) => {
    setSelectedTask(task);
    setDetailModalVisible(true);
  };

  const getComplexityColor = (complexity: number) => {
    const colors = ['green', 'blue', 'orange', 'red', 'purple'];
    return colors[complexity - 1] || 'default';
  };

  const getPriorityColor = (priority: number) => {
    const colors = ['default', 'blue', 'orange', 'red', 'magenta'];
    return colors[priority - 1] || 'default';
  };

  const groupTasks = () => {
    if (groupBy === 'none') {
      return { '所有任务': filteredTasks };
    }

    const grouped: Record<string, Task[]> = {};

    filteredTasks.forEach((task) => {
      let key = '';
      switch (groupBy) {
        case 'position':
          key = task.positionName || (task.positionId ? '未知岗位' : '无岗位要求');
          break;
        case 'tag':
          key = (task.tags && task.tags.length > 0) ? task.tags[0] : '无标签';
          break;
        case 'complexity':
          key = `复杂度 ${task.complexity}`;
          break;
        case 'group':
          key = task.groupName || '未分组';
          break;
        case 'projectGroup':
          key = task.projectGroupName || '无项目组';
          break;
      }

      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(task);
    });

    return grouped;
  };

  const groupedTasks = groupTasks();

  const renderTaskCard = (task: Task) => {
    const isGroupTask = !!task.groupName;
    const isProjectTask = !!task.projectGroupName;
    
    return (
      <Card
        key={task.id}
        hoverable
        onClick={() => handleViewDetail(task)}
        className="task-card"
        style={{ 
          marginBottom: 16,
          borderLeft: isGroupTask ? '4px solid #1890ff' : isProjectTask ? '4px solid #722ed1' : '4px solid transparent',
          transition: 'all 0.3s ease',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <Space align="start" style={{ width: '100%', justifyContent: 'space-between' }}>
              <Title level={4} style={{ marginBottom: 8, marginTop: 0 }}>
                {task.name}
              </Title>
              {isGroupTask && (
                <Tag color="blue" icon={<TeamOutlined />}>组群任务</Tag>
              )}
              {isProjectTask && (
                <Tag color="purple" icon={<GroupOutlined />}>项目任务</Tag>
              )}
            </Space>
            
            <Space size={8} style={{ marginBottom: 12 }}>
              <Avatar
                size={24}
                src={task.publisher?.avatarUrl || undefined}
                icon={!task.publisher?.avatarUrl ? <UserOutlined /> : undefined}
              />
              <Text type="secondary">
                {task.publisher?.username || '未知'}
              </Text>
              {isGroupTask && (
                <Tag color="blue">{task.groupName}</Tag>
              )}
              {isProjectTask && (
                <Tag color="purple">{task.projectGroupName}</Tag>
              )}
            </Space>
            
            <Paragraph
              ellipsis={{ rows: 2 }}
              style={{ color: '#666', marginBottom: 12 }}
            >
              {task.description || '无描述'}
            </Paragraph>
            
            <Space wrap>
              <Tag color={getComplexityColor(task.complexity)}>
                复杂度: {task.complexity}/5
              </Tag>
              <Tag color={getPriorityColor(task.priority)}>
                优先级: {task.priority}/5
              </Tag>
              {task.positionName && (
                <Tag icon={<UserOutlined />}>{task.positionName}</Tag>
              )}
              {task.tags && task.tags.map((tag) => (
                <Tag key={tag}>{tag}</Tag>
              ))}
            </Space>
          </div>
          
          <div style={{ marginLeft: 24, textAlign: 'right', minWidth: 140 }}>
            <div style={{ 
              fontSize: 28, 
              fontWeight: 700, 
              color: '#f5222d',
              marginBottom: 8,
              lineHeight: 1,
            }}>
              ${Number(task.bountyAmount || 0).toFixed(2)}
            </div>
            <Space orientation="vertical" size={4} style={{ width: '100%' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                <ClockCircleOutlined /> {dayjs(task.plannedEndDate).format('MM-DD')}
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                <ThunderboltOutlined /> {task.estimatedHours}h
              </Text>
            </Space>
            <Button
              type="primary"
              size="small"
              style={{ marginTop: 12, width: '100%' }}
              onClick={(e) => {
                e.stopPropagation();
                Modal.confirm({
                  title: '确定要承接这个任务吗？',
                  content: task.name,
                  onOk: () => handleAcceptTask(task.id),
                });
              }}
            >
              承接任务
            </Button>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="page-container fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <Title level={2} style={{ margin: 0 }}>浏览赏金任务</Title>
          <Text type="secondary">发现并承接适合您的任务</Text>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Search
              placeholder="搜索任务名称、描述或标签"
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              onSearch={handleSearch}
              onChange={(e) => setSearchKeyword(e.target.value)}
            />
          </Col>
          <Col xs={12} md={4}>
            <Select
              value={sortBy}
              onChange={setSortBy}
              style={{ width: '100%' }}
              size="large"
              suffixIcon={<SortAscendingOutlined />}
            >
              <Option value="bounty">
                <DollarOutlined /> 按赏金
              </Option>
              <Option value="deadline">
                <ClockCircleOutlined /> 按截止日期
              </Option>
              <Option value="priority">
                <FlagOutlined /> 按优先级
              </Option>
              <Option value="createdAt">创建时间</Option>
              <Option value="updatedAt">更新时间</Option>
            </Select>
          </Col>
          <Col xs={12} md={4}>
            <Select
              value={sortOrder}
              onChange={setSortOrder}
              style={{ width: '100%' }}
              size="large"
            >
              <Option value="desc">降序</Option>
              <Option value="asc">升序</Option>
            </Select>
          </Col>
          <Col xs={24} md={4}>
            <Select
              value={groupBy}
              onChange={setGroupBy}
              style={{ width: '100%' }}
              size="large"
              suffixIcon={<GroupOutlined />}
            >
              <Option value="none">不分组</Option>
              <Option value="position">按岗位</Option>
              <Option value="tag">按标签</Option>
              <Option value="complexity">按复杂度</Option>
              <Option value="group">按任务分组</Option>
              <Option value="projectGroup">按项目分组</Option>
            </Select>
          </Col>
        </Row>
      </Card>

      {/* Task List */}
      {loading && currentPage === 1 ? (
        <div style={{ textAlign: 'center', padding: 50 }}>
          <Spin size="large" />
        </div>
      ) : (
        <div>
          {Object.keys(groupedTasks).length === 0 ? (
            <Empty description="暂无可承接的任务" />
          ) : (
            <>
              {Object.entries(groupedTasks).map(([groupName, groupTasks]) => (
                <div key={groupName} style={{ marginBottom: 32 }}>
                  {groupBy !== 'none' && (
                    <Title level={4} style={{ marginBottom: 16, color: '#1890ff' }}>
                      {groupName} <Text type="secondary">({groupTasks.length})</Text>
                    </Title>
                  )}
                  {groupTasks.map(renderTaskCard)}
                </div>
              ))}
              
              {/* Load More Button */}
              {hasMore && (
                <div style={{ textAlign: 'center', marginTop: 24, marginBottom: 24 }}>
                  <Button
                    type="default"
                    size="large"
                    loading={loading}
                    onClick={loadMoreTasks}
                    style={{ minWidth: 200 }}
                  >
                    {loading ? '加载中...' : '加载更多任务'}
                  </Button>
                </div>
              )}
              
              {!hasMore && tasks.length > 0 && (
                <div style={{ textAlign: 'center', marginTop: 24, marginBottom: 24 }}>
                  <Text type="secondary">已显示所有任务</Text>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* 任务详情模态框 */}
      <Modal
        title="任务详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        width={700}
        footer={[
          <Button key="cancel" onClick={() => setDetailModalVisible(false)}>
            取消
          </Button>,
          <Button
            key="accept"
            type="primary"
            onClick={() => selectedTask && handleAcceptTask(selectedTask.id)}
          >
            承接任务
          </Button>,
        ]}
      >
        {selectedTask && (
          <div>
            <Title level={3}>{selectedTask.name}</Title>
            <div style={{ marginBottom: 16 }}>
              <Space wrap>
                <Tag color={getComplexityColor(selectedTask.complexity)}>
                  复杂度: {selectedTask.complexity}/5
                </Tag>
                <Tag color={getPriorityColor(selectedTask.priority)}>
                  优先级: {selectedTask.priority}/5
                </Tag>
                {selectedTask.positionName && (
                  <Tag icon={<UserOutlined />}>{selectedTask.positionName}</Tag>
                )}
                {selectedTask.tags && selectedTask.tags.map((tag) => (
                  <Tag key={tag}>{tag}</Tag>
                ))}
              </Space>
            </div>
            
            <Divider />
            
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Text strong>赏金金额：</Text>
                <div style={{ fontSize: 28, fontWeight: 'bold', color: '#ff4d4f' }}>
                  ${Number(selectedTask.bountyAmount || 0).toFixed(2)}
                </div>
              </Col>
              <Col span={12}>
                <Text strong>预估工时：</Text>
                <div style={{ fontSize: 28, fontWeight: 'bold' }}>
                  {selectedTask.estimatedHours}小时
                </div>
              </Col>
            </Row>

            <Divider />

            <div style={{ marginBottom: 12 }}>
              <Text strong>任务描述：</Text>
              <Paragraph style={{ marginTop: 8 }}>{selectedTask.description || '无描述'}</Paragraph>
            </div>

            <div style={{ marginBottom: 12 }}>
              <Text strong>发布者：</Text>
              <Space size={8} style={{ marginLeft: 8 }}>
                <Avatar
                  size={28}
                  src={selectedTask.publisher?.avatarUrl || undefined}
                  icon={!selectedTask.publisher?.avatarUrl ? <UserOutlined /> : undefined}
                />
                <div>
                  <div>{selectedTask.publisher?.username || '未知'}</div>
                  {selectedTask.publisher?.email && (
                    <Text type="secondary">{selectedTask.publisher.email}</Text>
                  )}
                </div>
              </Space>
            </div>

            <Row gutter={[16, 8]}>
              <Col span={12}>
                <Text type="secondary">计划开始：</Text>
                <Text>{dayjs(selectedTask.plannedStartDate).format('YYYY-MM-DD HH:mm')}</Text>
              </Col>
              <Col span={12}>
                <Text type="secondary">计划结束：</Text>
                <Text>{dayjs(selectedTask.plannedEndDate).format('YYYY-MM-DD HH:mm')}</Text>
              </Col>
              <Col span={12}>
                <Text type="secondary">创建时间：</Text>
                <Text>{dayjs(selectedTask.createdAt).format('YYYY-MM-DD HH:mm')}</Text>
              </Col>
              <Col span={12}>
                <Text type="secondary">可见性：</Text>
                <Text>{selectedTask.visibility}</Text>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
};
