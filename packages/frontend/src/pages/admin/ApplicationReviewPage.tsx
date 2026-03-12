import React, { useEffect, useState } from 'react';
import { Button, Space, Modal, Form, Input, Tabs, Descriptions } from 'antd';
import { CheckOutlined, CloseOutlined, EyeOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { adminApi } from '../../api/admin';
import type { PositionApplication } from '../../types';
import { PageHeaderBar } from '../../components/common/PageHeaderBar';
import { TableCard } from '../../components/common/TableCard';
import { StatusTag } from '../../components/common/StatusTag';
import { logger } from '../../utils/logger';
import { message } from '../../utils/message';
const { TextArea } = Input;

export const ApplicationReviewPage: React.FC = () => {
  const [applications, setApplications] = useState<PositionApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<PositionApplication | null>(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [form] = Form.useForm();

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getApplications();
      setApplications(data.applications);
    } catch (error: any) {
      message.error(error.response?.data?.message || '加载申请列表失败');
      logger.error('Failed to load applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (application: PositionApplication) => {
    try {
      const data = await adminApi.getApplicationDetails(application.id);
      setSelectedApplication(data.application);
      form.setFieldsValue({
        reviewComment: '',
      });
      setReviewModalVisible(true);
    } catch (error: any) {
      message.error(error.response?.data?.message || '加载申请详情失败');
      logger.error('Failed to load application details:', error);
    }
  };

  // Parse and format the application reason for display
  const formatReason = (reason: string | null | undefined): string => {
    if (!reason) return '无';
    
    try {
      const parsed = JSON.parse(reason);
      if (parsed.type === 'replacement') {
        const oldPositions = parsed.oldPositions || '无';
        const newPosition = parsed.newPosition || '未知岗位';
        return `岗位变更申请：${oldPositions} → ${newPosition}`;
      } else if (parsed.type === 'removal-only') {
        const oldPositions = parsed.oldPositions || '无';
        const remainingPosition = parsed.remainingPosition || '未知岗位';
        return `岗位移除申请：移除 ${oldPositions}，保留 ${remainingPosition}`;
      }
    } catch (e) {
      // Not JSON, return as-is
    }
    
    return reason;
  };

  const handleApprove = async () => {
    if (!selectedApplication) return;

    try {
      const values = await form.validateFields();
      await adminApi.reviewApplication(selectedApplication.id, {
        approved: true,
        reviewComment: values.reviewComment || undefined,
      });
      message.success('申请已批准');
      setReviewModalVisible(false);
      loadApplications();
      // Trigger event to update badge count in MainLayout
      window.dispatchEvent(new Event('application-reviewed'));
    } catch (error: any) {
      message.error(error.response?.data?.message || '批准申请失败');
      logger.error('Failed to approve application:', error);
    }
  };

  const handleReject = async () => {
    if (!selectedApplication) return;

    try {
      const values = await form.validateFields(['reviewComment']);
      if (!values.reviewComment?.trim()) {
        message.error('拒绝申请时必须提供拒绝理由');
        return;
      }

      await adminApi.reviewApplication(selectedApplication.id, {
        approved: false,
        reviewComment: values.reviewComment,
      });
      message.success('申请已拒绝');
      setReviewModalVisible(false);
      loadApplications();
      // Trigger event to update badge count in MainLayout
      window.dispatchEvent(new Event('application-reviewed'));
    } catch (error: any) {
      message.error(error.response?.data?.message || '拒绝申请失败');
      logger.error('Failed to reject application:', error);
    }
  };

  const filteredApplications = applications.filter((app) => {
    if (activeTab === 'all') return true;
    return app.status === activeTab;
  });

  const columns: ColumnsType<PositionApplication> = [
    {
      title: '申请人',
      key: 'user',
      render: (_, record: PositionApplication) => (
        <div>
          <div>{record.user?.username || '未知用户'}</div>
          <div style={{ fontSize: '12px', color: '#999' }}>{record.user?.email}</div>
        </div>
      ),
    },
    {
      title: '申请岗位',
      key: 'position',
      render: (_, record: PositionApplication) => record.position?.name || '未知岗位',
    },
    {
      title: '申请理由',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
      render: (reason: string) => formatReason(reason),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <StatusTag value={status} />,
    },
    {
      title: '申请时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: Date) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      render: (_, record: PositionApplication) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
          >
            查看
          </Button>
          {record.status === 'pending' && (
            <>
              <Button
                type="link"
                size="small"
                icon={<CheckOutlined />}
                onClick={() => {
                  setSelectedApplication(record);
                  Modal.confirm({
                    title: '确定要批准此申请吗？',
                    content: `批准 ${record.user?.username || '该用户'} 的岗位申请`,
                    onOk: async () => {
                      try {
                        await adminApi.reviewApplication(record.id, {
                          approved: true,
                        });
                        message.success('申请已批准');
                        loadApplications();
                        // Trigger event to update badge count in MainLayout
                        window.dispatchEvent(new Event('application-reviewed'));
                      } catch (error: any) {
                        message.error(error.response?.data?.message || '批准申请失败');
                      }
                    },
                  });
                }}
              >
                批准
              </Button>
              <Button
                type="link"
                size="small"
                danger
                icon={<CloseOutlined />}
                onClick={() => handleViewDetails(record)}
              >
                拒绝
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  const pendingCount = applications.filter(app => app.status === 'pending').length;
  const approvedCount = applications.filter(app => app.status === 'approved').length;
  const rejectedCount = applications.filter(app => app.status === 'rejected').length;

  return (
    <div>
      <PageHeaderBar title="岗位申请审核" />

      <TableCard
        columns={columns}
        dataSource={filteredApplications}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条申请`,
        }}
        cardProps={{
          extra: (
            <Tabs 
              activeKey={activeTab} 
              onChange={setActiveTab} 
              style={{ marginBottom: -8 }}
              items={[
                { key: 'pending', label: `待审核 (${pendingCount})` },
                { key: 'approved', label: `已批准 (${approvedCount})` },
                { key: 'rejected', label: `已拒绝 (${rejectedCount})` },
                { key: 'all', label: `全部 (${applications.length})` }
              ]}
            />
          ),
        }}
      />

      {/* 审核申请模态框 */}
      <Modal
        title="审核申请"
        open={reviewModalVisible}
        onCancel={() => setReviewModalVisible(false)}
        footer={
          selectedApplication?.status === 'pending' ? [
            <Button key="cancel" onClick={() => setReviewModalVisible(false)}>
              取消
            </Button>,
            <Button key="reject" danger icon={<CloseOutlined />} onClick={handleReject}>
              拒绝
            </Button>,
            <Button key="approve" type="primary" icon={<CheckOutlined />} onClick={handleApprove}>
              批准
            </Button>,
          ] : [
            <Button key="close" type="primary" onClick={() => setReviewModalVisible(false)}>
              关闭
            </Button>,
          ]
        }
        width={700}
      >
        {selectedApplication && (
          <div>
            <Descriptions column={1} bordered>
              <Descriptions.Item label="申请人">
                {selectedApplication.user?.username || '未知用户'}
              </Descriptions.Item>
              <Descriptions.Item label="邮箱">
                {selectedApplication.user?.email || '未知'}
              </Descriptions.Item>
              <Descriptions.Item label="申请岗位">
                <strong>{selectedApplication.position?.name || '未知岗位'}</strong>
              </Descriptions.Item>
              <Descriptions.Item label="岗位描述">
                {selectedApplication.position?.description || '无描述'}
              </Descriptions.Item>
              <Descriptions.Item label="申请理由">
                <div style={{ whiteSpace: 'pre-wrap', backgroundColor: '#f5f5f5', padding: '8px', borderRadius: '4px' }}>
                  {formatReason(selectedApplication.reason)}
                </div>
              </Descriptions.Item>
              <Descriptions.Item label="申请状态">
                <StatusTag value={selectedApplication.status} />
              </Descriptions.Item>
              <Descriptions.Item label="申请时间">
                {dayjs(selectedApplication.createdAt).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              {selectedApplication.reviewedAt && (
                <Descriptions.Item label="审核时间">
                  {dayjs(selectedApplication.reviewedAt).format('YYYY-MM-DD HH:mm:ss')}
                </Descriptions.Item>
              )}
              {selectedApplication.reviewComment && (
                <Descriptions.Item label="审核意见">
                  <div style={{ whiteSpace: 'pre-wrap', backgroundColor: '#f5f5f5', padding: '8px', borderRadius: '4px' }}>
                    {selectedApplication.reviewComment}
                  </div>
                </Descriptions.Item>
              )}
            </Descriptions>

            {selectedApplication.status === 'pending' && (
              <div style={{ marginTop: 16 }}>
                <Form form={form} layout="vertical">
                  <Form.Item
                    name="reviewComment"
                    label="审核意见"
                    extra="拒绝申请时必须填写理由"
                  >
                    <TextArea
                      rows={4}
                      placeholder="请输入审核意见（拒绝时必填）"
                    />
                  </Form.Item>
                </Form>
              </div>
            )}

            {selectedApplication.status !== 'pending' && (
              <div style={{ marginTop: 16, padding: '12px', backgroundColor: '#f0f0f0', borderRadius: '4px', textAlign: 'center' }}>
                此申请已被审核，无法再次操作
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
