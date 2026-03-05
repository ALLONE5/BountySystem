import React, { useState } from 'react';
import { Tabs, Row, Col, Card, Button, Space, Avatar, Badge, Statistic, Progress } from 'antd';
import {
  UserOutlined,
  FileTextOutlined,
  TeamOutlined,
  DollarOutlined,
  TrophyOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const { TabPane } = Tabs;

export const MyWorkspacePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');

  // 个人资料数据
  const [profileData, setProfileData] = useState({
    totalBounty: 12450,
    completedTasks: 89,
    publishedTasks: 156,
    joinedGroups: 12,
    currentRank: 5,
    weeklyProgress: 75,
  });

  // 我的悬赏数据
  const [myBounties, setMyBounties] = useState([
    {
      id: '1',
      title: '前端界面优化',
      description: '需要对现有界面进行优化，提升用户体验',
      bounty: 800,
      status: 'open',
      priority: 'high',
      applicants: 5,
      deadline: '2024-03-15',
      createdAt: '2024-03-01',
    },
    {
      id: '2',
      title: '数据库性能调优',
      description: '优化数据库查询性能，提升系统响应速度',
      bounty: 1200,
      status: 'in_progress',
      priority: 'medium',
      applicants: 3,
      assignee: 'TechExpert',
      deadline: '2024-03-20',
      createdAt: '2024-02-28',
    },
  ]);

  // 我的任务数据
  const [myTasks, setMyTasks] = useState([
    {
      id: '3',
      title: 'API接口开发',
      description: '开发用户管理相关的API接口',
      bounty: 600,
      status: 'in_progress',
      priority: 'high',
      progress: 65,
      publisher: 'ProjectManager',
      deadline: '2024-03-18',
      createdAt: '2024-03-05',
    },
    {
      id: '4',
      title: '移动端适配',
      description: '将现有网站适配到移动端设备',
      bounty: 900,
      status: 'completed',
      priority: 'medium',
      progress: 100,
      publisher: 'Designer',
      completedAt: '2024-03-02',
      createdAt: '2024-02-25',
    },
  ]);

  // 我的组群数据
  const [myGroups, setMyGroups] = useState([
    {
      id: '1',
      name: '前端开发团队',
      description: '专注于前端技术开发和创新',
      memberCount: 15,
      taskCount: 23,
      role: 'member',
      avatar: null,
      isActive: true,
    },
    {
      id: '2',
      name: '全栈开发组',
      description: '全栈技术交流与项目协作',
      memberCount: 28,
      taskCount: 45,
      role: 'admin',
      avatar: null,
      isActive: true,
    },
    {
      id: '3',
      name: 'UI/UX设计组',
      description: '用户界面和体验设计',
      memberCount: 12,
      taskCount: 18,
      role: 'member',
      avatar: null,
      isActive: false,
    },
  ]);

  const handleTaskView = (taskId: string) => {
    navigate(`/tasks/${taskId}`);
  };

  const handleTaskEdit = (taskId: string) => {
    navigate(`/tasks/edit/${taskId}`);
  };

  const handleGroupView = (groupId: string) => {
    navigate(`/groups/${groupId}`);
  };

  // 个人资料标签页
  const renderProfileTab = () => (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={8}>
          <Card title="个人信息">
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <Avatar size={80} src={user?.avatarUrl} icon={<UserOutlined />} />
              <h3 style={{ margin: '16px 0 8px', color: 'var(--color-text-primary)' }}>
                {user?.username}
              </h3>
              <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
                {user?.email}
              </p>
              <Badge 
                status="success" 
                text="在线" 
                style={{ color: 'var(--color-success)', marginTop: 8 }}
              />
            </div>
            <div style={{ marginTop: 16 }}>
              <Button 
                type="primary" 
                block 
                onClick={() => navigate('/profile')}
              >
                编辑资料
              </Button>
            </div>
          </Card>
        </Col>
        
        <Col xs={24} lg={16}>
          <Row gutter={[16, 16]}>
            <Col xs={12} sm={8}>
              <Card>
                <Statistic
                  title="总赏金"
                  value={`¥${profileData.totalBounty}`}
                  prefix={<DollarOutlined />}
                />
              </Card>
            </Col>
            <Col xs={12} sm={8}>
              <Card>
                <Statistic
                  title="完成任务"
                  value={profileData.completedTasks}
                  prefix={<CheckCircleOutlined />}
                />
              </Card>
            </Col>
            <Col xs={12} sm={8}>
              <Card>
                <Statistic
                  title="当前排名"
                  value={`#${profileData.currentRank}`}
                  prefix={<TrophyOutlined />}
                />
              </Card>
            </Col>
            <Col xs={12} sm={8}>
              <Card>
                <Statistic
                  title="发布任务"
                  value={profileData.publishedTasks}
                  prefix={<FileTextOutlined />}
                />
              </Card>
            </Col>
            <Col xs={12} sm={8}>
              <Card>
                <Statistic
                  title="加入组群"
                  value={profileData.joinedGroups}
                  prefix={<TeamOutlined />}
                />
              </Card>
            </Col>
            <Col xs={12} sm={8}>
              <Card>
                <Statistic
                  title="本周进度"
                  value={profileData.weeklyProgress}
                  suffix="%"
                  valueStyle={{ color: 'var(--color-success)' }}
                />
                <Progress 
                  percent={profileData.weeklyProgress} 
                  size="small" 
                  style={{ marginTop: 8 }}
                />
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>
    </div>
  );

  // 我的悬赏标签页
  const renderMyBountiesTab = () => (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ color: 'var(--color-text-primary)', margin: 0 }}>我发布的悬赏</h3>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={() => navigate('/tasks/create')}
        >
          发布新悬赏
        </Button>
      </div>
      
      <Row gutter={[16, 16]}>
        {myBounties.map(bounty => (
          <Col xs={24} lg={12} key={bounty.id}>
            <Card>
              <div style={{ marginBottom: 12 }}>
                <h4 style={{ color: 'var(--color-text-primary)', margin: '0 0 8px 0' }}>
                  {bounty.title}
                </h4>
                <p style={{ color: 'var(--color-text-secondary)', margin: '0 0 8px 0' }}>
                  {bounty.description}
                </p>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <Badge 
                    color={bounty.status === 'open' ? 'blue' : bounty.status === 'in_progress' ? 'orange' : 'green'}
                    text={bounty.status}
                  />
                  <Badge 
                    color={bounty.priority === 'high' ? 'red' : bounty.priority === 'medium' ? 'orange' : 'blue'}
                    text={bounty.priority}
                  />
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <DollarOutlined style={{ color: 'var(--color-success)' }} />
                  <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>
                    ¥{bounty.bounty}
                  </span>
                </div>
                <div style={{ color: 'var(--color-text-tertiary)', fontSize: '12px' }}>
                  {bounty.applicants} 人申请
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ color: 'var(--color-text-tertiary)', fontSize: '12px' }}>
                  截止: {bounty.deadline}
                </div>
                <Space>
                  <Button 
                    type="default" 
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={() => handleTaskView(bounty.id)}
                  >
                    查看
                  </Button>
                  <Button 
                    type="primary" 
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => handleTaskEdit(bounty.id)}
                  >
                    管理
                  </Button>
                </Space>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );

  // 我的任务标签页
  const renderMyTasksTab = () => (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ color: 'var(--color-text-primary)', margin: 0 }}>我接受的任务</h3>
      </div>
      
      <Row gutter={[16, 16]}>
        {myTasks.map(task => (
          <Col xs={24} lg={12} key={task.id}>
            <Card>
              <div style={{ marginBottom: 12 }}>
                <h4 style={{ color: 'var(--color-text-primary)', margin: '0 0 8px 0' }}>
                  {task.title}
                </h4>
                <p style={{ color: 'var(--color-text-secondary)', margin: '0 0 8px 0' }}>
                  {task.description}
                </p>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <Badge 
                    color={task.status === 'in_progress' ? 'orange' : task.status === 'completed' ? 'green' : 'blue'}
                    text={task.status}
                  />
                  <Badge 
                    color={task.priority === 'high' ? 'red' : task.priority === 'medium' ? 'orange' : 'blue'}
                    text={task.priority}
                  />
                </div>
              </div>
              
              {task.progress !== undefined && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: 'var(--color-text-secondary)', fontSize: '12px' }}>进度</span>
                    <span style={{ color: 'var(--color-text-secondary)', fontSize: '12px' }}>{task.progress}%</span>
                  </div>
                  <Progress percent={task.progress} size="small" />
                </div>
              )}
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <DollarOutlined style={{ color: 'var(--color-success)' }} />
                  <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>
                    ¥{task.bounty}
                  </span>
                </div>
                <div style={{ color: 'var(--color-text-tertiary)', fontSize: '12px' }}>
                  发布者: {task.publisher}
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ color: 'var(--color-text-tertiary)', fontSize: '12px' }}>
                  {task.status === 'completed' ? `完成于: ${task.completedAt}` : `截止: ${task.deadline}`}
                </div>
                <Space>
                  <Button 
                    type="default" 
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={() => handleTaskView(task.id)}
                  >
                    查看
                  </Button>
                  {task.status === 'in_progress' && (
                    <Button 
                      type="primary" 
                      size="small"
                    >
                      提交
                    </Button>
                  )}
                </Space>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );

  // 我的组群标签页
  const renderMyGroupsTab = () => (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ color: 'var(--color-text-primary)', margin: 0 }}>我的组群</h3>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={() => navigate('/groups/create')}
        >
          创建组群
        </Button>
      </div>
      
      <Row gutter={[16, 16]}>
        {myGroups.map(group => (
          <Col xs={24} lg={12} key={group.id}>
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <Avatar size={48} src={group.avatar} icon={<TeamOutlined />} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <h4 style={{ color: 'var(--color-text-primary)', margin: 0 }}>
                      {group.name}
                    </h4>
                    <Badge 
                      status={group.isActive ? 'success' : 'default'}
                      text={group.isActive ? '活跃' : '不活跃'}
                    />
                  </div>
                  <p style={{ color: 'var(--color-text-secondary)', margin: 0, fontSize: '13px' }}>
                    {group.description}
                  </p>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>
                    {group.memberCount}
                  </div>
                  <div style={{ color: 'var(--color-text-tertiary)', fontSize: '11px' }}>
                    成员
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>
                    {group.taskCount}
                  </div>
                  <div style={{ color: 'var(--color-text-tertiary)', fontSize: '11px' }}>
                    任务
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <Badge 
                    color={group.role === 'admin' ? 'red' : 'blue'}
                    text={group.role === 'admin' ? '管理员' : '成员'}
                  />
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Space>
                  <Button 
                    type="default" 
                    size="small"
                    onClick={() => handleGroupView(group.id)}
                  >
                    进入组群
                  </Button>
                  {group.role === 'admin' && (
                    <Button 
                      type="primary" 
                      size="small"
                    >
                      管理
                    </Button>
                  )}
                </Space>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );

  return (
    <div className="my-workspace-page">
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ color: 'var(--color-text-primary)', margin: 0 }}>
          我的工作台
        </h2>
        <p style={{ color: 'var(--color-text-secondary)', margin: '8px 0 0 0' }}>
          管理您的个人信息、悬赏、任务和组群
        </p>
      </div>

      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        size="large"
      >
        <TabPane 
          tab={
            <span>
              <UserOutlined />
              个人资料
            </span>
          } 
          key="profile"
        >
          {renderProfileTab()}
        </TabPane>
        
        <TabPane 
          tab={
            <span>
              <DollarOutlined />
              我的悬赏
            </span>
          } 
          key="bounties"
        >
          {renderMyBountiesTab()}
        </TabPane>
        
        <TabPane 
          tab={
            <span>
              <FileTextOutlined />
              我的任务
            </span>
          } 
          key="tasks"
        >
          {renderMyTasksTab()}
        </TabPane>
        
        <TabPane 
          tab={
            <span>
              <TeamOutlined />
              我的组群
            </span>
          } 
          key="groups"
        >
          {renderMyGroupsTab()}
        </TabPane>
      </Tabs>
    </div>
  );
};