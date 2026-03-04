import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Input, Select, Tag, Badge, Space, message, Pagination, Spin } from 'antd';
import {
  SearchOutlined,
  FilterOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  UserOutlined,
  EyeOutlined,
  HeartOutlined,
  HeartFilled,
  ThunderboltOutlined,
  FireOutlined,
  StarOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { 
  DiscordCard, 
  DiscordButton, 
  DiscordTaskCard, 
  DiscordStatsCard 
} from '../../components/discord/DiscordComponents';

const { Search } = Input;
const { Option } = Select;

interface BountyTask {
  id: string;
  title: string;
  description: string;
  bounty: number;
  status: string;
  priority: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  category: string;
  tags: string[];
  publisher: {
    username: string;
    avatarUrl?: string;
    rating: number;
  };
  applicants: number;
  maxApplicants?: number;
  deadline: string;
  createdAt: string;
  estimatedHours?: number;
  requirements: string[];
  isFavorite?: boolean;
  isHot?: boolean;
  isUrgent?: boolean;
}

export const BountyHuntingPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [selectedSort, setSelectedSort] = useState('latest');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(12);
  const [favorites, setFavorites] = useState<string[]>([]);

  // 统计数据
  const [stats, setStats] = useState({
    totalBounties: 1248,
    totalReward: 2456780,
    activeHunters: 892,
    completedToday: 45,
  });

  // 赏金任务数据
  const [bountyTasks, setBountyTasks] = useState<BountyTask[]>([
    {
      id: '1',
      title: '🔥 高优先级：电商平台前端重构',
      description: '需要将现有的电商平台前端进行全面重构，使用最新的React 18和TypeScript技术栈，要求有丰富的电商项目经验。',
      bounty: 15000,
      status: 'open',
      priority: 'high',
      difficulty: 'expert',
      category: 'frontend',
      tags: ['React', 'TypeScript', '电商', '重构'],
      publisher: {
        username: 'TechCorp',
        rating: 4.9,
      },
      applicants: 12,
      maxApplicants: 3,
      deadline: '2024-04-15',
      createdAt: '2024-03-01',
      estimatedHours: 120,
      requirements: ['5年以上前端经验', 'React专家级', '电商项目经验', '团队协作能力'],
      isHot: true,
      isUrgent: true,
    },
    {
      id: '2',
      title: '⚡ 快速任务：API接口优化',
      description: '优化现有的用户管理API接口，提升响应速度和并发处理能力，需要有Node.js和数据库优化经验。',
      bounty: 3500,
      status: 'open',
      priority: 'medium',
      difficulty: 'medium',
      category: 'backend',
      tags: ['Node.js', 'API', '性能优化', 'MySQL'],
      publisher: {
        username: 'StartupTeam',
        rating: 4.6,
      },
      applicants: 8,
      maxApplicants: 2,
      deadline: '2024-03-25',
      createdAt: '2024-03-05',
      estimatedHours: 40,
      requirements: ['Node.js熟练', '数据库优化经验', 'API设计经验'],
      isHot: true,
    },
    {
      id: '3',
      title: '🎨 UI/UX设计：移动应用界面设计',
      description: '为一款健身类移动应用设计完整的UI界面，包括用户注册、训练计划、数据统计等核心功能页面。',
      bounty: 8000,
      status: 'open',
      priority: 'medium',
      difficulty: 'medium',
      category: 'design',
      tags: ['UI设计', 'UX设计', '移动端', 'Figma'],
      publisher: {
        username: 'FitnessApp',
        rating: 4.7,
      },
      applicants: 15,
      maxApplicants: 5,
      deadline: '2024-04-01',
      createdAt: '2024-02-28',
      estimatedHours: 60,
      requirements: ['UI/UX设计经验', 'Figma熟练', '移动端设计经验', '健身行业了解'],
    },
    {
      id: '4',
      title: '🔧 DevOps：自动化部署流水线搭建',
      description: '为微服务架构搭建完整的CI/CD流水线，包括代码检查、自动测试、容器化部署等环节。',
      bounty: 6500,
      status: 'open',
      priority: 'high',
      difficulty: 'hard',
      category: 'devops',
      tags: ['Docker', 'Kubernetes', 'CI/CD', 'Jenkins'],
      publisher: {
        username: 'CloudTech',
        rating: 4.8,
      },
      applicants: 6,
      maxApplicants: 2,
      deadline: '2024-04-10',
      createdAt: '2024-03-03',
      estimatedHours: 80,
      requirements: ['Docker熟练', 'K8s经验', 'CI/CD实践经验', '微服务架构理解'],
      isUrgent: true,
    },
    {
      id: '5',
      title: '📱 小程序开发：在线教育平台',
      description: '开发一款在线教育微信小程序，包括课程展示、视频播放、在线支付、学习进度跟踪等功能。',
      bounty: 12000,
      status: 'open',
      priority: 'medium',
      difficulty: 'hard',
      category: 'miniprogram',
      tags: ['微信小程序', '在线教育', '支付', '视频'],
      publisher: {
        username: 'EduPlatform',
        rating: 4.5,
      },
      applicants: 9,
      maxApplicants: 3,
      deadline: '2024-04-20',
      createdAt: '2024-02-25',
      estimatedHours: 100,
      requirements: ['小程序开发经验', '支付接口对接', '视频播放实现', '教育行业理解'],
    },
    {
      id: '6',
      title: '🤖 AI集成：智能客服机器人',
      description: '集成GPT API开发智能客服机器人，能够处理常见问题咨询、订单查询、售后服务等场景。',
      bounty: 9500,
      status: 'open',
      priority: 'high',
      difficulty: 'expert',
      category: 'ai',
      tags: ['GPT', 'AI', '自然语言处理', 'API集成'],
      publisher: {
        username: 'AIInnovate',
        rating: 4.9,
      },
      applicants: 4,
      maxApplicants: 2,
      deadline: '2024-04-05',
      createdAt: '2024-03-02',
      estimatedHours: 70,
      requirements: ['AI/M