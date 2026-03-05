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
  Tag,
  Descriptions,
  Alert,
  Table,
} from 'antd';
import { PlusOutlined, CheckCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { bountyApi, BountyAlgorithm, BountyAlgorithmCreateDTO } from '../../api/bounty';
import { PageHeaderBar } from '../../components/common/PageHeaderBar';
import { TableCard } from '../../components/common/TableCard';
import { CrudFormModal } from '../../components/common/CrudFormModal';
import { useCrudOperations } from '../../hooks/useCrudOperations';
import { useModalState } from '../../hooks/useModalState';
import { formRules } from '../../utils/formRules';

const { Paragraph, Text } = Typography;
const { TextArea } = Input;

export const BountyAlgorithmPage: React.FC = () => {
  const [currentAlgorithm, setCurrentAlgorithm] = useState<BountyAlgorithm | null>(null);
  const [form] = Form.useForm();

  const toNumber = (value: any, fallback = 0) => {
    if (typeof value === 'number') return Number.isFinite(value) ? value : fallback;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const normalizeAlgorithm = (algo: BountyAlgorithm): BountyAlgorithm => ({
    ...algo,
    baseAmount: toNumber(algo.baseAmount),
    urgencyWeight: toNumber(algo.urgencyWeight),
    importanceWeight: toNumber(algo.importanceWeight),
    durationWeight: toNumber(algo.durationWeight),
    remainingDaysWeight: toNumber(algo.remainingDaysWeight, 0),
  });

  // 使用CRUD Hook管理数据操作
  const {
    data: algorithms,
    loading,
    create,
    loadAll,
  } = useCrudOperations<BountyAlgorithm>({
    fetchAll: async () => {
      const data = await bountyApi.getAllAlgorithms();
      return data.map(normalizeAlgorithm);
    },
    create: async (data) => {
      const formattedData: BountyAlgorithmCreateDTO = {
        version: data.version as string,
        baseAmount: data.baseAmount as number,
        urgencyWeight: data.urgencyWeight as number,
        importanceWeight: data.importanceWeight as number,
        durationWeight: data.durationWeight as number,
        remainingDaysWeight: data.remainingDaysWeight as number || 0,
        formula: data.formula as string,
        effectiveFrom: (data.effectiveFrom as any)?.toDate?.() || data.effectiveFrom as Date,
      };
      const result = await bountyApi.createAlgorithm(formattedData);
      loadCurrentAlgorithm();
      return normalizeAlgorithm(result);
    },
    successMessages: {
      create: '算法创建成功',
    },
    errorMessages: {
      fetch: '加载算法列表失败',
      create: '创建算法失败',
    },
  });

  // 使用Modal Hook管理模态框状态
  const createModal = useModalState();
  const previewModal = useModalState<BountyAlgorithm>();

  useEffect(() => {
    loadAll();
    loadCurrentAlgorithm();
  }, [loadAll]);

  const loadCurrentAlgorithm = async () => {
    try {
      const data = await bountyApi.getCurrentAlgorithm();
      setCurrentAlgorithm(normalizeAlgorithm(data));
    } catch (error: any) {
      console.error('Failed to load current algorithm:', error);
    }
  };

  const handleAdd = () => {
    form.resetFields();
    form.setFieldsValue({
      formula: 'baseAmount + (urgency * urgencyWeight) + (importance * importanceWeight) + (duration * durationWeight) + (remainingDays * remainingDaysWeight)',
      effectiveFrom: dayjs(),
      remainingDaysWeight: 5.0,
    });
    createModal.open();
  };

  const handleSubmit = async (values: any) => {
    const result = await create(values);
    if (result) {
      createModal.close();
      form.resetFields();
    }
  };

  const isCurrentAlgorithm = (algorithm: BountyAlgorithm) => {
    return currentAlgorithm?.id === algorithm.id;
  };

  const columns: ColumnsType<BountyAlgorithm> = [
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
      render: (version: string, record: BountyAlgorithm) => (
        <Space>
          <Button
            type="link"
            onClick={() => previewModal.open(record)}
            style={{ padding: 0 }}
          >
            {version}
          </Button>
          {isCurrentAlgorithm(record) && (
            <Tag color="green" icon={<CheckCircleOutlined />}>
              当前生效
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: '基础金额',
      dataIndex: 'baseAmount',
      key: 'baseAmount',
      render: (amount: number) => `¥${toNumber(amount).toFixed(2)}`,
    },
    {
      title: '紧急度权重',
      dataIndex: 'urgencyWeight',
      key: 'urgencyWeight',
      render: (weight: number) => toNumber(weight).toFixed(4),
    },
    {
      title: '重要度权重',
      dataIndex: 'importanceWeight',
      key: 'importanceWeight',
      render: (weight: number) => toNumber(weight).toFixed(4),
    },
    {
      title: '工时权重',
      dataIndex: 'durationWeight',
      key: 'durationWeight',
      render: (weight: number) => toNumber(weight).toFixed(4),
    },
    {
      title: '剩余天数权重',
      dataIndex: 'remainingDaysWeight',
      key: 'remainingDaysWeight',
      render: (weight: number) => toNumber(weight, 0).toFixed(4),
    },
    {
      title: '生效时间',
      dataIndex: 'effectiveFrom',
      key: 'effectiveFrom',
      render: (date: Date) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: Date) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
  ];

  // 计算示例赏金
  const calculateExampleBounty = (algorithm: BountyAlgorithm, urgency: number, importance: number, duration: number) => {
    const base = toNumber(algorithm.baseAmount);
    const urgencyW = toNumber(algorithm.urgencyWeight);
    const importanceW = toNumber(algorithm.importanceWeight);
    const durationW = toNumber(algorithm.durationWeight);

    return (base + urgency * urgencyW + importance * importanceW + duration * durationW).toFixed(2);
  };

  return (
    <div>
      <PageHeaderBar
        title="赏金算法管理"
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            创建新算法
          </Button>
        }
      />

      <Alert
        title="赏金算法说明"
        description={
          <div>
            <Paragraph>
              赏金算法用于自动计算任务的赏金金额。算法基于以下参数：
            </Paragraph>
            <ul>
              <li><strong>基础金额</strong>: 所有任务的基础赏金</li>
              <li><strong>紧急度权重</strong>: 根据截止日期计算的紧急度系数（1-5）</li>
              <li><strong>重要度权重</strong>: 任务优先级系数（1-5）</li>
              <li><strong>工时权重</strong>: 预估工时系数</li>
              <li><strong>剩余天数权重</strong>: 任务剩余天数系数</li>
            </ul>
            {currentAlgorithm && (
              <Paragraph>
                <Text type="secondary">
                  当前生效算法 ({currentAlgorithm.version})：
                </Text>
                <br />
                <Text code style={{ whiteSpace: 'pre-wrap', fontSize: '12px' }}>
                  {currentAlgorithm.formula}
                </Text>
              </Paragraph>
            )}
            {!currentAlgorithm && (
              <Paragraph>
                <Text type="warning">
                  暂无生效的算法，请创建新算法
                </Text>
              </Paragraph>
            )}
          </div>
        }
        type="info"
        icon={<InfoCircleOutlined />}
        style={{ marginBottom: 16 }}
      />

      <TableCard
        columns={columns}
        dataSource={algorithms}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 个算法版本`,
        }}
      />

      {/* 创建算法模态框 */}
      <CrudFormModal
        title="创建赏金算法"
        open={createModal.visible}
        onCancel={createModal.close}
        onSubmit={handleSubmit}
        okText="创建"
        width={700}
        formProps={{ form }}
      >
        <Form.Item
          name="version"
          label="版本号"
          rules={[formRules.required('请输入版本号')]}
          extra="例如：v1.0, v2.0, v2.1"
        >
          <Input placeholder="v1.0" />
        </Form.Item>

        <Form.Item
          name="baseAmount"
          label="基础金额（¥）"
          rules={[
            formRules.required('请输入基础金额'),
            formRules.min(0, '基础金额不能为负数'),
          ]}
          extra="所有任务的基础赏金金额"
        >
          <InputNumber
            min={0}
            step={10}
            style={{ width: '100%' }}
            placeholder="100"
          />
        </Form.Item>

        <Form.Item
          name="urgencyWeight"
          label="紧急度权重"
          rules={[
            formRules.required('请输入紧急度权重'),
            formRules.min(0, '权重不能为负数'),
          ]}
          extra="紧急度系数（1-5）的权重"
        >
          <InputNumber
            min={0}
            step={0.1}
            style={{ width: '100%' }}
            placeholder="10"
          />
        </Form.Item>

        <Form.Item
          name="importanceWeight"
          label="重要度权重"
          rules={[
            formRules.required('请输入重要度权重'),
            formRules.min(0, '权重不能为负数'),
          ]}
          extra="优先级（1-5）的权重"
        >
          <InputNumber
            min={0}
            step={0.1}
            style={{ width: '100%' }}
            placeholder="20"
          />
        </Form.Item>

        <Form.Item
          name="durationWeight"
          label="工时权重"
          rules={[
            formRules.required('请输入工时权重'),
            formRules.min(0, '权重不能为负数'),
          ]}
          extra="预估工时的权重"
        >
          <InputNumber
            min={0}
            step={0.1}
            style={{ width: '100%' }}
            placeholder="5"
          />
        </Form.Item>

        <Form.Item
          name="remainingDaysWeight"
          label="剩余天数权重"
          rules={[
            formRules.required('请输入剩余天数权重'),
            formRules.min(0, '权重不能为负数'),
          ]}
          extra="剩余天数的权重"
        >
          <InputNumber
            min={0}
            step={0.1}
            style={{ width: '100%' }}
            placeholder="5"
          />
        </Form.Item>

          <Form.Item
            name="formula"
            label="计算公式"
            rules={[formRules.required('请输入计算公式')]}
            extra="用于文档说明的公式描述"
          >
            <TextArea
              rows={3}
              placeholder="baseAmount + (urgency * urgencyWeight) + (importance * importanceWeight) + (duration * durationWeight) + (remainingDays * remainingDaysWeight)"
            />
          </Form.Item>

        <Form.Item
          name="effectiveFrom"
          label="生效时间"
          rules={[formRules.required('请选择生效时间')]}
          extra="算法从此时间开始生效，影响新创建的任务"
        >
          <DatePicker
            showTime
            format="YYYY-MM-DD HH:mm"
            style={{ width: '100%' }}
          />
        </Form.Item>
      </CrudFormModal>

      {/* 算法详情模态框 */}
      <Modal
        title="算法详情"
        open={previewModal.visible}
        onCancel={previewModal.close}
        footer={[
          <Button key="close" type="primary" onClick={previewModal.close}>
            关闭
          </Button>,
        ]}
        width={800}
      >
        {previewModal.data && (
          <div>
            <Descriptions column={2} bordered>
              <Descriptions.Item label="版本号" span={2}>
                <Space>
                  {previewModal.data.version}
                  {isCurrentAlgorithm(previewModal.data) && (
                    <Tag color="green" icon={<CheckCircleOutlined />}>
                      当前生效
                    </Tag>
                  )}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="基础金额">
                ${previewModal.data.baseAmount.toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label="紧急度权重">
                {previewModal.data.urgencyWeight.toFixed(4)}
              </Descriptions.Item>
              <Descriptions.Item label="重要度权重">
                {previewModal.data.importanceWeight.toFixed(4)}
              </Descriptions.Item>
              <Descriptions.Item label="工时权重">
                {previewModal.data.durationWeight.toFixed(4)}
              </Descriptions.Item>
              <Descriptions.Item label="剩余天数权重">
                {toNumber(previewModal.data.remainingDaysWeight, 0).toFixed(4)}
              </Descriptions.Item>
              <Descriptions.Item label="计算公式" span={2}>
                <Text code style={{ whiteSpace: 'pre-wrap' }}>
                  {previewModal.data.formula}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="生效时间">
                {dayjs(previewModal.data.effectiveFrom).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {dayjs(previewModal.data.createdAt).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="算法ID" span={2}>
                <Text code style={{ fontSize: '12px' }}>{previewModal.data.id}</Text>
              </Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: 24 }}>
              <Text strong>赏金计算示例</Text>
              <Table
                size="small"
                style={{ marginTop: 8 }}
                dataSource={[
                  {
                    key: '1',
                    scenario: '低优先级，长期任务',
                    urgency: 1,
                    importance: 2,
                    duration: 5,
                  },
                  {
                    key: '2',
                    scenario: '中等优先级，中期任务',
                    urgency: 3,
                    importance: 3,
                    duration: 10,
                  },
                  {
                    key: '3',
                    scenario: '高优先级，紧急任务',
                    urgency: 5,
                    importance: 5,
                    duration: 20,
                  },
                ]}
                columns={[
                  {
                    title: '场景',
                    dataIndex: 'scenario',
                    key: 'scenario',
                  },
                  {
                    title: '紧急度',
                    dataIndex: 'urgency',
                    key: 'urgency',
                  },
                  {
                    title: '重要度',
                    dataIndex: 'importance',
                    key: 'importance',
                  },
                  {
                    title: '工时',
                    dataIndex: 'duration',
                    key: 'duration',
                    render: (hours: number) => `${hours}小时`,
                  },
                  {
                    title: '计算赏金',
                    key: 'bounty',
                    render: (_: any, record: any) => (
                      <Text strong>
                        ${calculateExampleBounty(
                          previewModal.data!,
                          record.urgency,
                          record.importance,
                          record.duration
                        )}
                      </Text>
                    ),
                  },
                ]}
                pagination={false}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
