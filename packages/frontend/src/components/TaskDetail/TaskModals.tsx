/**
 * 任务相关模态框组件
 * 管理所有任务相关的模态框
 */

import React from 'react';
import { Modal, Form, Input, Select, DatePicker, InputNumber, Space, Divider, Button, Card, Typography } from 'antd';
import { PlusOutlined, TeamOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { Task, Visibility } from '../../types';
import { AddAssistantModal } from '../common/AddAssistantModal';

const { Text } = Typography;

interface TaskModalsProps {
  // 编辑任务模态框
  editModalVisible: boolean;
  editForm: any;
  positions: any[];
  projectGroups: any[];
  newProjectGroupName: string;
  addingProjectGroup: boolean;
  onEditSubmit: () => void;
  onEditCancel: () => void;
  onAddProjectGroup: () => void;
  setNewProjectGroupName: (name: string) => void;

  // 创建子任务模态框
  createSubtaskVisible: boolean;
  subtaskForm: any;
  task: Task | null;
  onCreateSubtask: (values: any) => void;
  onCreateSubtaskCancel: () => void;

  // 添加协作者模态框
  addAssistantModalVisible: boolean;
  addAssistantSubmitting: boolean;
  onAddAssistant: (values: any) => void;
  onAddAssistantCancel: () => void;
  searchUsers: (keyword: string) => Promise<any[]>;

  // 拒绝邀请模态框
  rejectInvitationModalVisible: boolean;
  rejectInvitationReason: string;
  invitationActionLoading: boolean;
  onRejectInvitationConfirm: () => void;
  onRejectInvitationCancel: () => void;
  setRejectInvitationReason: (reason: string) => void;

  // 群组模态框
  convertToGroupModalVisible: boolean;
  userGroups: any[];
  selectedGroupId?: string;
  convertingToGroup: boolean;
  onConvertToGroupConfirm: () => void;
  onConvertToGroupCancel: () => void;
  setSelectedGroupId: (id: string | undefined) => void;

  // 额外奖赏模态框
  bonusModalVisible: boolean;
  bonusForm: any;
  addingBonus: boolean;
  onSubmitBonus: (values: any) => void;
  onBonusCancel: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const TaskModals: React.FC<TaskModalsProps> = ({
  // 编辑任务
  editModalVisible,
  editForm,
  positions,
  projectGroups,
  newProjectGroupName,
  addingProjectGroup,
  onEditSubmit,
  onEditCancel,
  onAddProjectGroup,
  setNewProjectGroupName,

  // 创建子任务
  createSubtaskVisible,
  subtaskForm,
  task,
  onCreateSubtask,
  onCreateSubtaskCancel,

  // 添加协作者
  addAssistantModalVisible,
  addAssistantSubmitting,
  onAddAssistant,
  onAddAssistantCancel,
  searchUsers,

  // 拒绝邀请
  rejectInvitationModalVisible,
  rejectInvitationReason,
  invitationActionLoading,
  onRejectInvitationConfirm,
  onRejectInvitationCancel,
  setRejectInvitationReason,

  // 群组
  convertToGroupModalVisible,
  userGroups,
  selectedGroupId,
  convertingToGroup,
  onConvertToGroupConfirm,
  onConvertToGroupCancel,
  setSelectedGroupId,

  // 额外奖赏
  bonusModalVisible,
  bonusForm,
  addingBonus,
  onSubmitBonus,
  onBonusCancel
}) => {
  return (
    <>
      {/* 添加协作者 */}
      <AddAssistantModal
        visible={addAssistantModalVisible}
        onCancel={onAddAssistantCancel}
        onSubmit={onAddAssistant}
        loading={addAssistantSubmitting}
        searchUsers={searchUsers}
      />

      {/* 编辑任务 */}
      <Modal
        title="编辑任务"
        open={editModalVisible}
        onOk={onEditSubmit}
        onCancel={onEditCancel}
        width={600}
      >
        <Form form={editForm} layout="vertical">
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
            <Input.TextArea rows={4} />
          </Form.Item>
          
          <Form.Item name="tags" label="标签">
            <Select mode="tags" placeholder="输入标签后按回车" />
          </Form.Item>
          
          <Form.Item
            name="dateRange"
            label="计划时间"
            rules={[{ required: true, message: '请选择计划时间' }]}
          >
            <DatePicker.RangePicker style={{ width: '100%' }} />
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
              <Select.Option value={1}>1 - 非常简单</Select.Option>
              <Select.Option value={2}>2 - 简单</Select.Option>
              <Select.Option value={3}>3 - 中等</Select.Option>
              <Select.Option value={4}>4 - 复杂</Select.Option>
              <Select.Option value={5}>5 - 非常复杂</Select.Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="priority"
            label="优先级"
            rules={[{ required: true, message: '请选择优先级' }]}
          >
            <Select>
              <Select.Option value={1}>1 - 最低</Select.Option>
              <Select.Option value={2}>2 - 低</Select.Option>
              <Select.Option value={3}>3 - 中</Select.Option>
              <Select.Option value={4}>4 - 高</Select.Option>
              <Select.Option value={5}>5 - 最高</Select.Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="visibility"
            label="可见性"
            rules={[{ required: true, message: '请选择可见性' }]}
          >
            <Select>
              <Select.Option value={Visibility.PUBLIC}>公开</Select.Option>
              <Select.Option value={Visibility.POSITION_ONLY}>仅特定岗位</Select.Option>
              <Select.Option value={Visibility.PRIVATE}>私有</Select.Option>
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
                      <Select.Option key={p.id} value={p.id}>{p.name}</Select.Option>
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
                      onPressEnter={onAddProjectGroup}
                      style={{ flex: 1 }}
                    />
                    <Button
                      type="text"
                      icon={<PlusOutlined />}
                      onClick={onAddProjectGroup}
                      loading={addingProjectGroup}
                    >
                      新增
                    </Button>
                  </Space>
                </>
              )}
            >
              {projectGroups.map(pg => (
                <Select.Option key={pg.id} value={pg.id}>{pg.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 创建子任务 */}
      <Modal
        title="创建子任务"
        open={createSubtaskVisible}
        onCancel={onCreateSubtaskCancel}
        onOk={() => subtaskForm.submit()}
        width={600}
      >
        {task && (
          <>
            <Card size="small" style={{ marginBottom: 16, backgroundColor: '#f0f2f5' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                <strong>母任务约束：</strong>
              </Text>
              <div style={{ marginTop: 8 }}>
                {task.assignee && (
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      • 负责人：{task.assignee.username}（子任务将自动继承）
                    </Text>
                  </div>
                )}
                {task.plannedStartDate && task.plannedEndDate && (
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      • 时间范围：{dayjs(task.plannedStartDate).format('YYYY-MM-DD')} ~ {dayjs(task.plannedEndDate).format('YYYY-MM-DD')}
                    </Text>
                  </div>
                )}
                {task.estimatedHours && (
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      • 最大工时：{task.estimatedHours} 小时
                    </Text>
                  </div>
                )}
              </div>
            </Card>
            <Form
              form={subtaskForm}
              layout="vertical"
              onFinish={onCreateSubtask}
            >
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
                <Input.TextArea rows={4} />
              </Form.Item>
              
              <Form.Item name="tags" label="标签">
                <Select mode="tags" placeholder="输入标签后按回车" />
              </Form.Item>

              <Form.Item
                name="dateRange"
                label="计划时间"
                rules={[
                  { required: true, message: '请选择计划时间' },
                  {
                    validator: (_, value) => {
                      if (!value || value.length !== 2) return Promise.resolve();
                      if (!task.plannedStartDate || !task.plannedEndDate) return Promise.resolve();
                      
                      const subtaskStart = dayjs(value[0]);
                      const subtaskEnd = dayjs(value[1]);
                      const parentStart = dayjs(task.plannedStartDate);
                      const parentEnd = dayjs(task.plannedEndDate);
                      
                      if (subtaskStart.isBefore(parentStart)) {
                        return Promise.reject(new Error(`开始时间不能早于母任务开始时间 (${parentStart.format('YYYY-MM-DD')})`));
                      }
                      
                      if (subtaskEnd.isAfter(parentEnd)) {
                        return Promise.reject(new Error(`结束时间不能晚于母任务结束时间 (${parentEnd.format('YYYY-MM-DD')})`));
                      }
                      
                      return Promise.resolve();
                    }
                  }
                ]}
              >
                <DatePicker.RangePicker 
                  style={{ width: '100%' }}
                  disabledDate={(current) => {
                    if (!task.plannedStartDate || !task.plannedEndDate) return false;
                    const parentStart = dayjs(task.plannedStartDate).startOf('day');
                    const parentEnd = dayjs(task.plannedEndDate).endOf('day');
                    return current && (current.isBefore(parentStart) || current.isAfter(parentEnd));
                  }}
                />
              </Form.Item>

              <Form.Item
                name="estimatedHours"
                label="预估工时（小时）"
                rules={[
                  { required: true, message: '请输入预估工时' },
                  {
                    validator: (_, value) => {
                      if (!value) return Promise.resolve();
                      if (!task.estimatedHours) return Promise.resolve();
                      
                      if (value > task.estimatedHours) {
                        return Promise.reject(new Error(`工时不能超过母任务工时 (${task.estimatedHours}h)`));
                      }
                      return Promise.resolve();
                    }
                  }
                ]}
              >
                <InputNumber 
                  min={0} 
                  max={task.estimatedHours || undefined}
                  style={{ width: '100%' }}
                />
              </Form.Item>
              
              <Form.Item
                name="complexity"
                label="复杂度"
                rules={[{ required: true, message: '请选择复杂度' }]}
              >
                <Select>
                  <Select.Option value={1}>1 - 非常简单</Select.Option>
                  <Select.Option value={2}>2 - 简单</Select.Option>
                  <Select.Option value={3}>3 - 中等</Select.Option>
                  <Select.Option value={4}>4 - 复杂</Select.Option>
                  <Select.Option value={5}>5 - 非常复杂</Select.Option>
                </Select>
              </Form.Item>
              
              <Form.Item
                name="priority"
                label="优先级"
                rules={[{ required: true, message: '请选择优先级' }]}
              >
                <Select>
                  <Select.Option value={1}>1 - 最低</Select.Option>
                  <Select.Option value={2}>2 - 低</Select.Option>
                  <Select.Option value={3}>3 - 中</Select.Option>
                  <Select.Option value={4}>4 - 高</Select.Option>
                  <Select.Option value={5}>5 - 最高</Select.Option>
                </Select>
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>

      {/* 拒绝任务邀请模态框 */}
      <Modal
        title="拒绝任务邀请"
        open={rejectInvitationModalVisible}
        onOk={onRejectInvitationConfirm}
        onCancel={onRejectInvitationCancel}
        okText="确认拒绝"
        cancelText="取消"
        okButtonProps={{ danger: true, loading: invitationActionLoading }}
      >
        <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
          <Text>您确定要拒绝任务 "{task?.name}" 吗？</Text>
          
          <div>
            <Text>拒绝原因（可选）：</Text>
            <Input.TextArea
              rows={4}
              placeholder="请输入拒绝原因，这将发送给任务发布者"
              value={rejectInvitationReason}
              onChange={(e) => setRejectInvitationReason(e.target.value)}
              maxLength={500}
              showCount
            />
          </div>
        </Space>
      </Modal>

      {/* 群组模态框 */}
      <Modal
        title={task?.groupId ? "任务群组" : "加入群组"}
        open={convertToGroupModalVisible}
        onOk={onConvertToGroupConfirm}
        onCancel={onConvertToGroupCancel}
        okText={task?.groupId ? "关闭" : "确认加入"}
        cancelText={task?.groupId ? undefined : "取消"}
        confirmLoading={convertingToGroup}
      >
        <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
          {task?.groupId ? (
            // View mode: Show current group information
            <>
              <Text>此任务已关联到以下群组：</Text>
              
              <div style={{ padding: 16, background: '#f0f2f5', borderRadius: 4 }}>
                <Space orientation="vertical" size="small" style={{ width: '100%' }}>
                  <div>
                    <Text strong style={{ fontSize: 16 }}>
                      <TeamOutlined /> {task.groupName || '未知群组'}
                    </Text>
                  </div>
                  {userGroups.find(g => g.id === task.groupId) && (
                    <Text type="secondary">
                      成员数：{userGroups.find(g => g.id === task.groupId)?.members?.length || 0} 人
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
              <Text>将任务 "{task?.name}" 加入群组后，组群中的所有成员都可以查看和协作此任务。</Text>
              
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

      {/* 额外奖赏模态框 */}
      <Modal
        title="添加额外奖赏"
        open={bonusModalVisible}
        onCancel={onBonusCancel}
        onOk={() => bonusForm.submit()}
        okText="确认发放"
        cancelText="取消"
        confirmLoading={addingBonus}
      >
        <Form
          form={bonusForm}
          layout="vertical"
          onFinish={onSubmitBonus}
        >
          <Form.Item
            name="amount"
            label="额外奖赏金额"
            rules={[
              { required: true, message: '请输入奖赏金额' },
              { type: 'number', min: 0.01, message: '金额必须大于0' },
            ]}
            extra={task && `当前任务赏金: ${task.bountyAmount || 0}`}
          >
            <InputNumber
              min={0.01}
              step={10}
              precision={2}
              style={{ width: '100%' }}
              prefix="$"
              placeholder="请输入额外奖赏金额"
            />
          </Form.Item>

          <Form.Item
            name="reason"
            label="奖赏原因"
            extra="可选，说明发放额外奖赏的原因"
          >
            <Input.TextArea
              rows={3}
              placeholder="例如：任务完成质量优秀，提前完成等"
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};