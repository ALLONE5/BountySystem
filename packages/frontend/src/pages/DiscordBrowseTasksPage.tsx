import React, { useState, useEffect } from 'react';
import { Row, Col, Input, Select, Button, Space, message, Spin, Empty, Pagination } from 'antd';
import {
  SearchOutlined,
  FilterOutlined,
  ReloadOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { taskApi } from '../api/task';
import { 
  DiscordCard, 
  DiscordButton, 
  DiscordTaskCard,
  DiscordStatsCard 
} from '../components/discord/DiscordComponents';
import { logger } from '../utils/logger';

const { Search } = Input;
const { Option } = Select;

interface BrowseTask {
  id: string;
  title: string;
  description: string;
  bounty: number;
  status: string;
  priority: string;
  publisher: {
    username: string;
    avatarUrl?: string;
  };
  createdAt: string;
  deadline?: string;
  tags?: string[];
  visibility: string;
}

interface TaskFilters {
  search?: string;
  status?: string;
  priority?: string;
  minBounty?: number;
  maxBounty?: number;
  tags?: string[];
}

export const DiscordBrowseTasksPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<BrowseTask[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<BrowseTask[]>([]);
  const [filters, setFilters] = useState<TaskFilters>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(12);
  const [totalTasks, setTotalTasks] = useState(0);

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [tasks, filters]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      
      // 模拟加载公开任务数据
      const mockTasks: BrowseTask[] = [
        {
          id: '1',
          title: '开发移动端应用界面',
          description: '需要开发一个现代化的移动端应用界面，要求使用React Native技术栈，支持iOS和Android平台。',
          bounty: 1200,
          status: 'open',
          priority: 'high',
          publisher: {
            username: 'TechCompany',
            avatarUrl: undefined,
          },
          createdAt: new Date().toISOString(),
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          tags: ['React Native', '移动开发', 'UI/UX'],
          visibility: 'public',
        },
        {
          id: '2',
          title: '数据分析报告制作',
          description: '分析用户行为数据，制作详细的数据分析报告，包含可视化图表和业务建议。',
          bounty: 800,
          status: 'open',
          priority: 'medium',
          publisher: {
            username: 'DataTeam',
            avatarUrl: undefined,
          },
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          tags: ['数据分析', 'Python', '可视化'],
          visibility: 'public',
        },
        {
          id: '3',
          title: 'API接口开发',
          description: '开发RESTful API接口，包含用户认证、数据CRUD操作等功能。',
          bounty: 1000,
          status: 'open',
          priority: 'high',
          publisher: {
            username: 'BackendTeam',
            avatarUrl: undefined,
          },
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
          tags: ['Node.js', 'API', '后端开发'],
          visibility: 'public',
        },
        {
          id: '4',
          title: '网站SEO优化',
          description: '对现有网站进行SEO优化，提升搜索引擎排名和网站流量。',
          bounty: 600,
          status: 'open',
          priority: 'medium',
          publisher: {
            username: 'MarketingTeam',
            avatarUrl: undefined,
          },
          createdAt: new Date(Date.now() - 259200000).toISOString(),
          tags: ['SEO', '网站优化', '营销'],
          visibility: 'public',
        },
        {
          id: '5',
          title: '区块链智能合约开发',
          description: '开发以太坊智能合约，实现代币发行和交易功能。',
          bounty: 2000,
          status: 'open',
          priority: 'high',
          publisher: {
            username: 'BlockchainCorp',
            avatarUrl: undefined,
          },
          createdAt: new Date(Date.now() - 345600000).toISOString(),
          deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          tags: ['区块链', 'Solidity', '智能合约'],
          visibility: 'public',
        },
        {
          id: '6',
          title: '机器学习模型训练',
          description: '训练图像识别机器学习模型，要求准确率达到95%以上。',
          bounty: 1500,
          status: 'open',
          priority: 'high',
          publisher: {
            username: 'AILab',
            avatarUrl: undefined,
          },
          createdAt: new Date(Date.now() - 432000000).toISOString(),
          deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
          tags: ['机器学习', 'Python', 'TensorFlow'],
          visibility: 'public',
        },
      ];

      setTasks(mockTasks);
      setTotalTasks(mockTasks.length);
    } catch (error) {
      message.error('加载任务失败');
      logger.error('Failed to load browse tasks', { error });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...tasks];

    // 搜索过滤
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(searchLower) ||
        task.description.toLowerCase().includes(searchLower) ||
        task.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // 状态过滤
    if (filters.status) {
      filtered = filtered.filter(task => task.status === filters.status);
    }

    // 优先级过滤
    if (filters.priority) {
      filtered = filtered.filter(task => task.priority === filters.priority);
    }

    // 赏金范围过滤
    if (filters.minBounty) {
      filtered = filtered.filter(task => task.bounty >= filters.minBounty!);
    }
    if (filters.maxBounty) {
      filtered = filtered.filter(task => task.bounty <= filters.maxBounty!);
    }

    setFilteredTasks(filtered);
    setCurrentPage(1);
  };

  const handleSearch = (value: string) => {
    setFilters({ ...filters, search: value });
  };

  const handleFilterChange = (key: keyof TaskFilters, value: any) => {
    setFilters({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    setFilters({});
  };

  const handleTaskView = (taskId: string) => {
    navigate(`/tasks/${taskId}`);
  };

  const handleTaskApply = (taskId: string) => {
    message.success(`已申请任务 ${taskId}`);
  };

  // 分页数据
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedTasks = filteredTasks.slice(startIndex, endIndex);

  // 统计数据
  const stats = {
    totalTasks: filteredTasks.length,
    highPriorityTasks: filteredTasks.filter(t => t.priority === 'high').length,
    totalBounty: filteredTasks.reduce((sum, t) => sum + t.bounty, 0),
    avgBounty: filteredTasks.length > 0 ? Math.round(filteredTasks.reduce((sum, t) => sum + t.bounty, 0) / filteredTasks.length) : 0,
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="discord-browse-tasks">
      {/* 页面标题 */}
      <DiscordCard style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, color: 'var(--discord-text-primary)' }}>
              🎯 浏览赏金任务
            </h2>
            <p style={{ margin: '8px 0 0 0', color: 'var(--discord-text-secondary)' }}>
              发现有趣的任务，赚取丰厚赏金
            </p>
          </div>
          <DiscordButton 
            type="primary" 
            icon={<ReloadOutlined />}
            onClick={loadTasks}
            loading={loading}
          >
            刷新
          </DiscordButton>
        </div>
      </DiscordCard>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <DiscordStatsCard
            title="可用任务"
            value={stats.totalTasks}
            icon={<SearchOutlined />}
            color="primary"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <DiscordStatsCard
            title="高优先级"
            value={stats.highPriorityTasks}
            icon={<ClockCircleOutlined />}
            color="danger"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <DiscordStatsCard
            title="总赏金"
            value={`¥${stats.totalBounty}`}
            icon={<DollarOutlined />}
            color="warning"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <DiscordStatsCard
            title="平均赏金"
            value={`¥${stats.avgBounty}`}
            icon={<DollarOutlined />}
            color="success"
          />
        </Col>
      </Row>

      {/* 搜索和过滤 */}
      <DiscordCard style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={8}>
            <Search
              placeholder="搜索任务标题、描述或标签..."
              allowClear
              onSearch={handleSearch}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={12} md={4}>
            <Select
              placeholder="状态"
              allowClear
              style={{ width: '100%' }}
              onChange={(value) => handleFilterChange('status', value)}
              value={filters.status}
            >
              <Option value="open">开放</Option>
              <Option value="in_progress">进行中</Option>
              <Option value="completed">已完成</Option>
            </Select>
          </Col>
          <Col xs={12} md={4}>
            <Select
              placeholder="优先级"
              allowClear
              style={{ width: '100%' }}
              onChange={(value) => handleFilterChange('priority', value)}
              value={filters.priority}
            >
              <Option value="high">高</Option>
              <Option value="medium">中</Option>
              <Option value="low">低</Option>
            </Select>
          </Col>
          <Col xs={24} md={8}>
            <Space>
              <DiscordButton 
                type="secondary" 
                icon={<FilterOutlined />}
                onClick={clearFilters}
              >
                清除过滤
              </DiscordButton>
            </Space>
          </Col>
        </Row>
      </DiscordCard>

      {/* 任务列表 */}
      {paginatedTasks.length === 0 ? (
        <DiscordCard>
          <Empty 
            description="没有找到匹配的任务"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </DiscordCard>
      ) : (
        <>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            {paginatedTasks.map(task => (
              <Col xs={24} lg={12} key={task.id}>
                <DiscordTaskCard
                  task={task}
                  onView={handleTaskView}
                  onAssign={handleTaskApply}
                />
              </Col>
            ))}
          </Row>

          {/* 分页 */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={filteredTasks.length}
              onChange={setCurrentPage}
              showSizeChanger={false}
              showQuickJumper
              showTotal={(total, range) => 
                `第 ${range[0]}-${range[1]} 项，共 ${total} 项任务`
              }
            />
          </div>
        </>
      )}
    </div>
  );
};