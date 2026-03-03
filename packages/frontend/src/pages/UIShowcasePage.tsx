import React from 'react';
import { Card, Button, Row, Col, Statistic, Avatar, List, Tag } from 'antd';
import { UserOutlined, TrophyOutlined, DollarOutlined, TeamOutlined } from '@ant-design/icons';
import './UIShowcasePage.css';

export const UIShowcasePage: React.FC = () => {
  // 模拟数据
  const stats = [
    { title: '总任务数', value: 1234, icon: <TrophyOutlined />, color: '#5865f2' },
    { title: '总奖金', value: 98765, prefix: '¥', icon: <DollarOutlined />, color: '#57f287' },
    { title: '活跃用户', value: 456, icon: <UserOutlined />, color: '#fee75c' },
    { title: '团队数量', value: 89, icon: <TeamOutlined />, color: '#ed4245' },
  ];

  const tasks = [
    { id: 1, title: '开发新功能模块', reward: 5000, status: '进行中', type: '开发' },
    { id: 2, title: 'UI设计优化', reward: 3000, status: '待接取', type: '设计' },
    { id: 3, title: '系统性能优化', reward: 8000, status: '已完成', type: '优化' },
    { id: 4, title: '数据库设计', reward: 4500, status: '进行中', type: '数据库' },
  ];

  const users = [
    { name: '张三', score: 9850, rank: 1, avatar: '👨‍💻' },
    { name: '李四', score: 8760, rank: 2, avatar: '👩‍💻' },
    { name: '王五', score: 7650, rank: 3, avatar: '👨‍🎨' },
    { name: '赵六', score: 6540, rank: 4, avatar: '👩‍🔬' },
  ];

  return (
    <div className="ui-showcase">
      <div className="showcase-header">
        <h1 className="showcase-title text-gradient">🎨 现代化 UI 展示</h1>
        <p className="showcase-subtitle">Discord & Midjourney 风格的现代化界面设计</p>
      </div>

      {/* 统计卡片区域 */}
      <div className="stats-section">
        <h2 className="section-title">📊 统计概览</h2>
        <Row gutter={[24, 24]}>
          {stats.map((stat, index) => (
            <Col xs={24} sm={12} lg={6} key={index}>
              <Card className="glass-card stat-card" hoverable>
                <div className="stat-content">
                  <div className="stat-icon" style={{ color: stat.color }}>
                    {stat.icon}
                  </div>
                  <div className="stat-info">
                    <Statistic
                      title={stat.title}
                      value={stat.value}
                      prefix={stat.prefix}
                      valueStyle={{ color: stat.color, fontWeight: 'bold' }}
                    />
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {/* 任务网格区域 */}
      <div className="tasks-section">
        <h2 className="section-title">🎯 任务展示</h2>
        <div className="midjourney-grid">
          {tasks.map((task) => (
            <Card key={task.id} className="midjourney-card task-card" hoverable>
              <div className="task-header">
                <h3 className="task-title">{task.title}</h3>
                <Tag color={task.status === '已完成' ? 'success' : task.status === '进行中' ? 'processing' : 'default'}>
                  {task.status}
                </Tag>
              </div>
              <div className="task-content">
                <div className="task-type">
                  <Tag color="blue">{task.type}</Tag>
                </div>
                <div className="task-reward">
                  <span className="reward-label">奖金:</span>
                  <span className="reward-amount">¥{task.reward.toLocaleString()}</span>
                </div>
              </div>
              <div className="task-actions">
                <Button className="discord-button-primary" size="small">
                  查看详情
                </Button>
                <Button className="glass-button" size="small">
                  申请任务
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* 排行榜区域 */}
      <div className="ranking-section">
        <h2 className="section-title">🏆 用户排行榜</h2>
        <Card className="discord-card ranking-card">
          <List
            dataSource={users}
            renderItem={(user) => (
              <List.Item className="ranking-item">
                <div className="ranking-content">
                  <div className="ranking-left">
                    <div className="rank-badge" style={{
                      background: user.rank === 1 ? '#ffd700' : user.rank === 2 ? '#c0c0c0' : user.rank === 3 ? '#cd7f32' : '#666'
                    }}>
                      #{user.rank}
                    </div>
                    <Avatar size={40} style={{ backgroundColor: '#5865f2' }}>
                      {user.avatar}
                    </Avatar>
                    <div className="user-info">
                      <div className="user-name">{user.name}</div>
                      <div className="user-score">{user.score.toLocaleString()} 分</div>
                    </div>
                  </div>
                  <div className="ranking-right">
                    <Button className="discord-button-success" size="small">
                      查看资料
                    </Button>
                  </div>
                </div>
              </List.Item>
            )}
          />
        </Card>
      </div>

      {/* 按钮展示区域 */}
      <div className="buttons-section">
        <h2 className="section-title">🎨 按钮样式展示</h2>
        <Card className="glass-card buttons-card">
          <div className="button-group">
            <h3>Discord 风格按钮</h3>
            <div className="button-row">
              <Button className="discord-button-primary">主要按钮</Button>
              <Button className="discord-button-success">成功按钮</Button>
              <Button className="discord-button-danger">危险按钮</Button>
            </div>
          </div>
          
          <div className="button-group">
            <h3>玻璃态按钮</h3>
            <div className="button-row">
              <Button className="glass-button">玻璃按钮</Button>
              <Button className="glass-button animate-shimmer">闪光效果</Button>
              <Button className="glass-button animate-float">浮动效果</Button>
            </div>
          </div>
          
          <div className="button-group">
            <h3>Midjourney 风格按钮</h3>
            <div className="button-row">
              <Button className="midjourney-button">渐变按钮</Button>
              <Button className="midjourney-button animate-pulse">脉冲效果</Button>
            </div>
          </div>
        </Card>
      </div>

      {/* 特效展示区域 */}
      <div className="effects-section">
        <h2 className="section-title">✨ 特效展示</h2>
        <Row gutter={[24, 24]}>
          <Col xs={24} md={8}>
            <Card className="glass-card shadow-glass" hoverable>
              <h3>玻璃态效果</h3>
              <p>半透明背景，模糊效果，优雅边框</p>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card className="discord-card shadow-glass-lg" hoverable>
              <h3>Discord 风格</h3>
              <p>深色主题，现代化设计，流畅动画</p>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card className="midjourney-card shadow-glass-xl" hoverable>
              <h3>Midjourney 风格</h3>
              <p>渐变色彩，网格布局，艺术感设计</p>
            </Card>
          </Col>
        </Row>
      </div>

      {/* 文字效果展示 */}
      <div className="text-effects-section">
        <h2 className="section-title">📝 文字效果展示</h2>
        <Card className="glass-card text-effects-card">
          <div className="text-examples">
            <h1 className="text-gradient">渐变文字效果</h1>
            <div className="border-gradient">
              <p>边框渐变效果</p>
            </div>
            <p className="animate-shimmer">闪光文字效果</p>
            <p className="animate-pulse">脉冲文字效果</p>
          </div>
        </Card>
      </div>
    </div>
  );
};