# 任务邀请功能合并到"我的任务"界面

## 概述
将独立的"任务邀请"页面合并到"我的任务"（AssignedTasksPage）界面中，通过Tab标签页的方式展示，提供更统一的用户体验。

## 实现内容

### 1. AssignedTasksPage 增强
**文件**: `packages/frontend/src/pages/AssignedTasksPage.tsx`

#### 新增功能
- **双Tab布局**: 
  - "已承接任务" - 显示用户已接受的任务
  - "任务邀请" - 显示待接受的任务邀请（带Badge数量提示）

- **任务邀请列表**:
  - 显示发布者头像和信息
  - 显示任务详情（赏金、工时、时间、标签）
  - 提供"接受"、"拒绝"、"查看详情"操作按钮

- **新增状态管理**:
  ```typescript
  const [invitations, setInvitations] = useState<Task[]>([]);
  const [invitationsLoading, setInvitationsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'assigned' | 'invitations'>('assigned');
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  ```

- **新增处理函数**:
  - `loadInvitations()` - 加载任务邀请列表
  - `handleAcceptInvitation()` - 接受任务邀请
  - `handleRejectInvitationClick()` - 打开拒绝确认对话框
  - `handleRejectInvitationConfirm()` - 确认拒绝任务邀请
  - `formatBounty()` - 格式化赏金显示
  - `formatDate()` - 格式化日期显示

- **拒绝任务模态框**:
  - 可选填写拒绝原因（最多500字）
  - 原因会发送给任务发布者

#### 统计卡片更新
- 保留原有的4个统计卡片（总任务数、进行中、已完成、总赏金）
- 邀请数量通过Tab标签上的Badge显示

### 2. MainLayout 菜单更新
**文件**: `packages/frontend/src/layouts/MainLayout.tsx`

#### 变更内容
- **移除**: 独立的"任务邀请"菜单项
- **更新**: "我的任务"菜单项现在显示邀请数量Badge
  ```typescript
  {
    key: 'assigned-tasks',
    icon: <CheckSquareOutlined />,
    label: (
      <Space>
        我的任务
        {invitationCount > 0 && (
          <Badge count={invitationCount} size="small" />
        )}
      </Space>
    ),
    onClick: () => navigate('/tasks/assigned'),
  }
  ```

- **保留**: 邀请数量的自动刷新机制（每30秒）
- **移除**: 不再使用的 `MailOutlined` 图标导入

### 3. 路由配置更新
**文件**: `packages/frontend/src/router/index.tsx`

#### 变更内容
- **移除**: `/tasks/invitations` 路由
- **移除**: `TaskInvitationsPage` 组件导入
- 所有任务邀请功能现在通过 `/tasks/assigned` 路由访问

### 4. 通知页面导航更新
**文件**: `packages/frontend/src/pages/NotificationPage.tsx`

#### 变更内容
- 任务邀请通知点击后导航到 `/tasks/assigned`（原来是 `/tasks/invitations`）
- 用户会看到"我的任务"页面，可以切换到"任务邀请"Tab查看详情

## 用户体验改进

### 优点
1. **统一界面**: 所有与"我的任务"相关的内容集中在一个页面
2. **减少导航**: 不需要在多个页面间切换
3. **清晰分类**: Tab标签清晰区分"已承接"和"待接受"
4. **视觉提示**: Badge数量提示让用户快速了解待处理邀请
5. **操作便捷**: 在同一页面可以查看邀请并快速接受/拒绝

### 功能保留
- ✅ 所有原有的任务邀请功能完整保留
- ✅ 接受/拒绝任务邀请
- ✅ 查看任务详情
- ✅ 拒绝原因填写
- ✅ 实时数量更新
- ✅ 通知中心快速操作

## 技术细节

### 数据加载
```typescript
useEffect(() => {
  loadTasks();        // 加载已承接任务
  loadInvitations();  // 加载任务邀请
}, []);
```

### Tab切换
使用Ant Design的Tabs组件，支持：
- 键盘导航
- 响应式布局
- Badge数量提示
- 独立的loading状态

### 状态同步
- 接受邀请后自动刷新两个列表
- 拒绝邀请后只刷新邀请列表
- 保持TaskDetailDrawer的统一使用

## 文件变更清单

### 修改的文件
1. `packages/frontend/src/pages/AssignedTasksPage.tsx` - 主要功能实现
2. `packages/frontend/src/layouts/MainLayout.tsx` - 菜单更新
3. `packages/frontend/src/router/index.tsx` - 路由配置
4. `packages/frontend/src/pages/NotificationPage.tsx` - 导航更新

### 保留但不再使用的文件
- `packages/frontend/src/pages/TaskInvitationsPage.tsx` - 可以删除或保留作为参考

## 测试建议

### 功能测试
1. ✅ 访问"我的任务"页面，验证两个Tab都能正常显示
2. ✅ 验证邀请数量Badge显示正确
3. ✅ 测试接受任务邀请功能
4. ✅ 测试拒绝任务邀请功能（带/不带原因）
5. ✅ 验证任务详情抽屉正常工作
6. ✅ 验证通知点击导航到正确页面
7. ✅ 验证数据自动刷新

### UI测试
1. ✅ 验证响应式布局
2. ✅ 验证Badge样式
3. ✅ 验证Tab切换动画
4. ✅ 验证空状态显示
5. ✅ 验证Loading状态

## 后续优化建议

### 可选增强
1. **URL参数支持**: 支持 `/tasks/assigned?tab=invitations` 直接打开邀请Tab
2. **自动切换**: 从通知点击进入时自动切换到相应Tab
3. **批量操作**: 支持批量接受/拒绝邀请
4. **筛选排序**: 为邀请列表添加筛选和排序功能
5. **快速预览**: 鼠标悬停显示任务快速预览

## 状态
**已完成** ✅ - 所有功能已实现并通过TypeScript编译检查

## 兼容性
- 向后兼容：旧的 `/tasks/invitations` 路由已移除，但不影响现有功能
- 数据兼容：使用相同的API接口，无需后端修改
- 通知兼容：通知系统已更新导航路径
