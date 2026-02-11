import React, { useEffect, useState } from 'react';
import { Drawer, Table, Select, Pagination, Card, Statistic, Row, Col, Alert, Button, Space, Tag, Typography, Spin } from 'antd';
import { ReloadOutlined, DollarOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { bountyApi, BountyTransactionWithDetails, BountySummary } from '../api/bounty';
import { TransactionType } from '../types';
import { formatBounty } from '../utils/formatters';

const { Text } = Typography;

/**
 * Props interface for BountyHistoryDrawer component
 */
interface BountyHistoryDrawerProps {
  visible: boolean;
  userId: string;
  onClose: () => void;
}

/**
 * Internal state interface for the drawer
 */
interface BountyHistoryDrawerState {
  transactions: BountyTransactionWithDetails[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  pageSize: number;
  totalCount: number;
  selectedType: TransactionType | 'all';
  summary: BountySummary | null;
}

/**
 * Transaction type display labels
 */
const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  [TransactionType.TASK_COMPLETION]: '任务完成',
  [TransactionType.EXTRA_REWARD]: '额外奖励',
  [TransactionType.ASSISTANT_SHARE]: '协作者分成',
  [TransactionType.REFUND]: '退款'
};

/**
 * Transaction type colors for tags
 */
const TRANSACTION_TYPE_COLORS: Record<TransactionType, string> = {
  [TransactionType.TASK_COMPLETION]: 'green',
  [TransactionType.EXTRA_REWARD]: 'blue',
  [TransactionType.ASSISTANT_SHARE]: 'purple',
  [TransactionType.REFUND]: 'orange'
};

/**
 * BountyHistoryDrawer Component
 * 
 * Displays a user's complete bounty transaction history in a drawer.
 * Features:
 * - Paginated transaction table
 * - Transaction type filtering
 * - Summary statistics (total earned, total spent)
 * - Responsive design for mobile and desktop
 * 
 * Requirements: 2.1, 2.4, 7.6, 7.7
 */
export const BountyHistoryDrawer: React.FC<BountyHistoryDrawerProps> = ({
  visible,
  userId,
  onClose,
}) => {
  // State management
  const [state, setState] = useState<BountyHistoryDrawerState>({
    transactions: [],
    loading: false,
    error: null,
    currentPage: 1,
    pageSize: 20,
    totalCount: 0,
    selectedType: 'all',
    summary: null,
  });

  /**
   * Fetch transaction history from API
   */
  const fetchTransactionHistory = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await bountyApi.getUserTransactionHistory(
        userId,
        state.currentPage,
        state.pageSize,
        state.selectedType === 'all' ? undefined : state.selectedType
      );
      
      setState(prev => ({
        ...prev,
        transactions: response.transactions,
        totalCount: response.pagination.totalCount,
        summary: response.summary,
        loading: false,
      }));
    } catch (error: any) {
      console.error('Failed to fetch transaction history:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.response?.data?.message || '加载交易历史失败',
      }));
    }
  };

  /**
   * Effect: Fetch data when drawer opens or filters change
   */
  useEffect(() => {
    if (visible && userId) {
      fetchTransactionHistory();
    }
  }, [visible, userId, state.currentPage, state.selectedType]);

  /**
   * Effect: Reset state when drawer closes
   */
  useEffect(() => {
    if (!visible) {
      setState({
        transactions: [],
        loading: false,
        error: null,
        currentPage: 1,
        pageSize: 20,
        totalCount: 0,
        selectedType: 'all',
        summary: null,
      });
    }
  }, [visible]);

  /**
   * Handle page change
   */
  const handlePageChange = (page: number) => {
    setState(prev => ({ ...prev, currentPage: page }));
  };

  /**
   * Handle transaction type filter change
   */
  const handleTypeFilterChange = (value: TransactionType | 'all') => {
    setState(prev => ({
      ...prev,
      selectedType: value,
      currentPage: 1, // Reset to first page when filter changes
    }));
  };

  /**
   * Handle retry after error
   */
  const handleRetry = () => {
    fetchTransactionHistory();
  };

  /**
   * Determine if transaction is incoming (earned) or outgoing (spent)
   */
  const isIncoming = (transaction: BountyTransactionWithDetails): boolean => {
    return transaction.toUserId === userId;
  };

  /**
   * Format amount with sign based on transaction direction
   */
  const formatAmount = (transaction: BountyTransactionWithDetails): string => {
    const amount = transaction.amount;
    const incoming = isIncoming(transaction);
    return incoming ? `+${formatBounty(amount)}` : `-${formatBounty(amount)}`;
  };

  /**
   * Get amount color based on transaction direction
   */
  const getAmountColor = (transaction: BountyTransactionWithDetails): string => {
    return isIncoming(transaction) ? '#52c41a' : '#ff4d4f';
  };

  /**
   * Table columns configuration
   */
  const columns = [
    {
      title: '日期',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: Date) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '任务名称',
      dataIndex: 'taskName',
      key: 'taskName',
      ellipsis: true,
      render: (taskName: string) => taskName || '-',
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      align: 'right' as const,
      render: (_: number, record: BountyTransactionWithDetails) => (
        <Text strong style={{ color: getAmountColor(record) }}>
          {formatAmount(record)}
        </Text>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: TransactionType) => (
        <Tag color={TRANSACTION_TYPE_COLORS[type]}>
          {TRANSACTION_TYPE_LABELS[type]}
        </Tag>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (description: string | null) => description || '-',
    },
  ];

  /**
   * Render summary statistics section
   */
  const renderSummary = () => {
    if (!state.summary) return null;

    return (
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Statistic
              title="总收入"
              value={state.summary.totalEarned}
              precision={0}
              prefix={<ArrowUpOutlined style={{ color: '#52c41a' }} />}
              suffix="赏金"
              styles={{ content: { color: '#52c41a' } }}
            />
          </Col>
          <Col xs={24} sm={8}>
            <Statistic
              title="总支出"
              value={state.summary.totalSpent}
              precision={0}
              prefix={<ArrowDownOutlined style={{ color: '#ff4d4f' }} />}
              suffix="赏金"
              styles={{ content: { color: '#ff4d4f' } }}
            />
          </Col>
          <Col xs={24} sm={8}>
            <Statistic
              title="净余额"
              value={state.summary.netBalance}
              precision={0}
              prefix={<DollarOutlined />}
              suffix="赏金"
              styles={{ content: { color: state.summary.netBalance >= 0 ? '#52c41a' : '#ff4d4f' } }}
            />
          </Col>
        </Row>
      </Card>
    );
  };

  /**
   * Render filter controls
   */
  const renderFilters = () => {
    return (
      <Space style={{ marginBottom: 16 }}>
        <Text>交易类型：</Text>
        <Select
          value={state.selectedType}
          onChange={handleTypeFilterChange}
          style={{ width: 150 }}
        >
          <Select.Option value="all">全部</Select.Option>
          <Select.Option value={TransactionType.TASK_COMPLETION}>
            {TRANSACTION_TYPE_LABELS[TransactionType.TASK_COMPLETION]}
          </Select.Option>
          <Select.Option value={TransactionType.EXTRA_REWARD}>
            {TRANSACTION_TYPE_LABELS[TransactionType.EXTRA_REWARD]}
          </Select.Option>
          <Select.Option value={TransactionType.ASSISTANT_SHARE}>
            {TRANSACTION_TYPE_LABELS[TransactionType.ASSISTANT_SHARE]}
          </Select.Option>
          <Select.Option value={TransactionType.REFUND}>
            {TRANSACTION_TYPE_LABELS[TransactionType.REFUND]}
          </Select.Option>
        </Select>
      </Space>
    );
  };

  /**
   * Render error state
   */
  const renderError = () => {
    if (!state.error) return null;

    return (
      <Alert
        message="加载失败"
        description={state.error}
        type="error"
        showIcon
        action={
          <Button size="small" onClick={handleRetry} icon={<ReloadOutlined />}>
            重试
          </Button>
        }
        style={{ marginBottom: 16 }}
      />
    );
  };

  /**
   * Render empty state
   */
  const renderEmpty = () => {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <Text type="secondary">暂无交易记录</Text>
      </div>
    );
  };

  /**
   * Render pagination controls
   */
  const renderPagination = () => {
    if (state.totalCount <= state.pageSize) return null;

    return (
      <div style={{ textAlign: 'right', marginTop: 16 }}>
        <Pagination
          current={state.currentPage}
          pageSize={state.pageSize}
          total={state.totalCount}
          onChange={handlePageChange}
          showSizeChanger={false}
          showTotal={(total) => `共 ${total} 条记录`}
        />
      </div>
    );
  };

  /**
   * Render drawer content
   */
  const renderContent = () => {
    if (state.loading) {
      return (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large">
            <div style={{ padding: '20px' }}>加载中...</div>
          </Spin>
        </div>
      );
    }

    if (state.error) {
      return renderError();
    }

    if (state.transactions.length === 0) {
      return renderEmpty();
    }

    return (
      <>
        {renderSummary()}
        {renderFilters()}
        <Table
          columns={columns}
          dataSource={state.transactions}
          rowKey="id"
          pagination={false}
          loading={state.loading}
          scroll={{ x: 800 }}
        />
        {renderPagination()}
      </>
    );
  };

  return (
    <Drawer
      title="赏金交易历史"
      placement="right"
      size={window.innerWidth > 768 ? 'large' : 'default'}
      onClose={onClose}
      open={visible}
    >
      {renderContent()}
    </Drawer>
  );
};
