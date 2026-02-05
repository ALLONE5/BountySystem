# 待接受任务提醒功能

## 更新日期
2026-02-04

## 功能概述

在"我的悬赏"页面中，对已指派但还未被承接的任务（状态为 `PENDING_ACCEPTANCE`）进行视觉提醒，帮助发布者快速识别等待响应的任务。

## 实现的提醒方式

### 1. 统计卡片提醒 ⭐

在页面顶部的统计卡片中新增"待接受"卡片：

```
┌─────────────┬─────────────┬─────────────┬─────────────┬─────────────┐
│ 总悬赏金额  │ 发布的任务  │  待接受 ⚠️  │  进行中     │  已完成     │
│  $1,000.00  │     10      │     3       │     5       │     2       │
└─────────────┴─────────────┴─────────────┴─────────────┴─────────────┘
```

**特点**：
- 橙色边框（`#fa8c16`）突出显示
- 用户图标前缀
- 点击卡片时显示提示信息
- 数字显示待接受任务的数量

### 2. 任务名称高亮提醒 ⭐⭐

在任务列表中，待接受的任务会有特殊的视觉效果：

**视觉效果**：
- 浅橙色背景（`#fff7e6`）
- 橙色边框（`#ffd591`）
- 橙色文字（`#fa8c16`）
- 时钟图标（⏰）前缀

**示例**：
```
┌────────────────────────────────────────┐
│ ⏰ 实现用户认证功能                     │  ← 橙色高亮
│ 需要实现JWT认证和权限控制...           │
└────────────────────────────────────────┘
```

### 3. 操作列状态标签 ⭐

在操作列中显示"待接受"标签：

```
操作列：
┌──────────┐
│ ⏰ 待接受 │  ← 橙色警告标签
└──────────┘
```

**特点**：
- 替代"指派"按钮
- 橙色警告标签
- 时钟图标
- 清晰的状态指示

## 用户体验流程

### 发布者视角

```
1. 进入"我的悬赏"页面
   ↓
2. 查看顶部统计卡片
   - 看到"待接受: 3"
   - 点击卡片查看提示
   ↓
3. 浏览任务列表
   - 待接受的任务有橙色背景
   - 任务名称前有时钟图标
   - 操作列显示"待接受"标签
   ↓
4. 点击任务查看详情
   - 查看被指派用户信息
   - 等待用户响应
```

### 被指派用户视角

```
1. 收到任务指派通知
   ↓
2. 进入"任务邀请"页面
   ↓
3. 查看任务详情
   ↓
4. 选择：接受 / 拒绝
   ↓
5. 发布者看到任务状态更新
```

## 技术实现

### 1. TaskListPage.tsx

**任务名称列**：
```typescript
render: (text: string, record: Task) => {
  const isPendingAcceptance = record.status === TaskStatus.PENDING_ACCEPTANCE;
  
  return (
    <div 
      style={{ 
        backgroundColor: isPendingAcceptance ? '#fff7e6' : 'transparent',
        border: isPendingAcceptance ? '1px solid #ffd591' : 'none',
        padding: '4px',
        borderRadius: '4px'
      }}
    >
      <div style={{ 
        color: isPendingAcceptance ? '#fa8c16' : '#1890ff',
        display: 'flex',
        alignItems: 'center',
        gap: '4px'
      }}>
        {isPendingAcceptance && <ClockCircleOutlined />}
        {text}
      </div>
    </div>
  );
}
```

**操作列**：
```typescript
render: (_, record) => {
  const isPendingAcceptance = record.status === TaskStatus.PENDING_ACCEPTANCE;
  
  if (isPendingAcceptance) {
    return (
      <Tag color="warning" icon={<ClockCircleOutlined />}>
        待接受
      </Tag>
    );
  }
  
  // ... 其他逻辑
}
```

### 2. PublishedTasksPage.tsx

**统计数据**：
```typescript
const stats = React.useMemo(() => ({
  totalTasks: tasks.length,
  totalBounty: tasks.reduce((sum, task) => sum + Number(task.bountyAmount || 0), 0),
  inProgress: tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length,
  completed: tasks.filter(t => t.status === TaskStatus.COMPLETED).length,
  pendingAcceptance: tasks.filter(t => t.status === TaskStatus.PENDING_ACCEPTANCE).length,
}), [tasks]);
```

**待接受卡片**：
```typescript
<Card 
  style={{ 
    borderLeft: '4px solid #fa8c16',
    cursor: stats.pendingAcceptance > 0 ? 'pointer' : 'default'
  }}
  onClick={() => {
    if (stats.pendingAcceptance > 0) {
      message.info('这些任务已指派给用户，等待对方接受');
    }
  }}
>
  <Statistic
    title="待接受"
    value={stats.pendingAcceptance}
    valueStyle={{ color: '#fa8c16' }}
    prefix={<UserOutlined />}
  />
</Card>
```

## 颜色方案

| 元素 | 颜色 | 用途 |
|------|------|------|
| 背景色 | `#fff7e6` | 任务名称背景 |
| 边框色 | `#ffd591` | 任务名称边框 |
| 文字色 | `#fa8c16` | 任务名称、统计数字 |
| 卡片边框 | `#fa8c16` | 统计卡片左边框 |

**设计理念**：
- 使用橙色系表示"警告/等待"状态
- 与其他状态（蓝色-进行中、绿色-已完成）形成对比
- 不过于刺眼，但足够引起注意

## 状态对比

| 状态 | 颜色 | 图标 | 含义 |
|------|------|------|------|
| NOT_STARTED | 灰色 | - | 未开始 |
| AVAILABLE | 绿色 | - | 可承接 |
| PENDING_ACCEPTANCE | 橙色 | ⏰ | 待接受（已指派） |
| IN_PROGRESS | 黄色 | 🔄 | 进行中 |
| COMPLETED | 绿色 | ✓ | 已完成 |

## 修改的文件

1. **packages/frontend/src/pages/TaskListPage.tsx**
   - 任务名称列：添加待接受状态的视觉效果
   - 操作列：显示"待接受"标签

2. **packages/frontend/src/pages/PublishedTasksPage.tsx**
   - 统计数据：添加 `pendingAcceptance` 计数
   - 统计卡片：新增"待接受"卡片
   - 布局调整：从 4 列改为 5 列

## 使用场景

### 场景 1：批量指派任务

发布者指派了多个任务给不同用户：
1. 顶部显示"待接受: 5"
2. 列表中 5 个任务都有橙色高亮
3. 发布者可以快速识别哪些任务还在等待响应

### 场景 2：跟进未响应任务

发布者想要跟进未响应的任务：
1. 点击"待接受"卡片查看提示
2. 在列表中找到橙色高亮的任务
3. 点击任务查看详情
4. 联系被指派用户催促响应

### 场景 3：监控任务进度

发布者定期检查任务状态：
1. 快速扫描统计卡片
2. 如果"待接受"数字较大，说明需要关注
3. 如果"待接受"数字为 0，说明所有指派都已响应

## 后续优化建议

### 1. 超时提醒

对于超过一定时间（如 24 小时）未响应的任务：
- 更醒目的视觉效果（红色）
- 自动发送催促通知
- 提供"取消指派"选项

### 2. 批量操作

添加批量操作功能：
- 批量取消指派
- 批量重新指派
- 批量发送催促通知

### 3. 筛选功能

添加状态筛选：
- 只显示待接受的任务
- 按指派时间排序
- 按被指派用户分组

### 4. 通知增强

增强通知功能：
- 定期提醒发布者有待接受的任务
- 提醒被指派用户尽快响应
- 超时自动取消指派

## 测试建议

### 测试步骤

1. **创建测试任务**
   ```bash
   # 创建一个任务
   # 指派给某个用户
   # 不要让该用户接受
   ```

2. **验证视觉效果**
   - 检查统计卡片是否显示"待接受: 1"
   - 检查任务列表中是否有橙色高亮
   - 检查操作列是否显示"待接受"标签

3. **测试交互**
   - 点击"待接受"卡片
   - 点击任务查看详情
   - 让用户接受任务，验证状态更新

4. **测试边界情况**
   - 没有待接受任务时（显示 0）
   - 有多个待接受任务时
   - 任务被接受后状态变化

## 总结

通过三种视觉提醒方式（统计卡片、任务高亮、状态标签），发布者可以快速识别和跟进已指派但未被承接的任务，提高任务管理效率。

橙色的视觉设计既能引起注意，又不会过于刺眼，符合"警告/等待"的语义。
