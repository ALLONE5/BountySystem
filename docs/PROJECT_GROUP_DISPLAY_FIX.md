# 项目组显示重复问题修复

## 问题描述

在"我的任务"和"我发布的任务"页面中，项目组标签出现了重复显示的问题：
- 在任务名称列中显示了项目组标签
- 在单独的"项目组"列中也显示了项目组标签

这导致每个任务显示了两个相同的项目组标签，造成视觉混乱。

## 问题截图

用户反馈的问题：每个任务同时显示了多个项目组标签。

## 根本原因

在 `AssignedTasksPage.tsx` 和 `PublishedTasksPage.tsx` 中，任务名称列的渲染逻辑同时显示了：
1. 任务组标签（groupName）- 蓝色，团队图标
2. 项目组标签（projectGroupName）- 紫色，文件夹图标

而表格中还有一个单独的"项目组"列，也显示了项目组标签，导致重复。

## 修复方案

### 设计原则
- **任务名称列**: 只显示任务组标签（如果有）
- **项目组列**: 显示项目组标签（如果有）
- **避免重复**: 同一信息不在多个地方重复显示

### 修复内容

#### 1. AssignedTasksPage.tsx

**修复前:**
```tsx
{
  title: '任务名称',
  dataIndex: 'name',
  key: 'name',
  render: (name: string, record: Task) => (
    <Space>
      <Button type="link" onClick={() => handleViewTaskDetail(record)}>
        {name}
      </Button>
      {record.groupName && (
        <Tag color="geekblue" icon={<TeamOutlined />}>
          {record.groupName}
        </Tag>
      )}
      {record.projectGroupName && (  // ❌ 重复显示
        <Tag color="purple" icon={<FolderOutlined />}>
          {record.projectGroupName}
        </Tag>
      )}
    </Space>
  ),
}
```

**修复后:**
```tsx
{
  title: '任务名称',
  dataIndex: 'name',
  key: 'name',
  render: (name: string, record: Task) => (
    <Space>
      <Button type="link" onClick={() => handleViewTaskDetail(record)}>
        {name}
      </Button>
      {record.groupName && (
        <Tag color="geekblue" icon={<TeamOutlined />}>
          {record.groupName}
        </Tag>
      )}
      {/* 移除了项目组标签，避免与"项目组"列重复 */}
    </Space>
  ),
}
```

#### 2. PublishedTasksPage.tsx

**修复前:**
```tsx
{
  title: '任务名称',
  dataIndex: 'name',
  key: 'name',
  render: (name: string, record: Task) => (
    <Space direction="vertical" size={0}>
      <Button type="link" onClick={() => handleViewDetail(record)}>
        {name}
      </Button>
      <Space size={4}>
        {record.groupName && (
          <Tag color="geekblue" icon={<TeamOutlined />}>
            {record.groupName}
          </Tag>
        )}
        {record.projectGroupName && (  // ❌ 重复显示
          <Tag color="purple" icon={<FolderOutlined />}>
            {record.projectGroupName}
          </Tag>
        )}
      </Space>
    </Space>
  ),
}
```

**修复后:**
```tsx
{
  title: '任务名称',
  dataIndex: 'name',
  key: 'name',
  render: (name: string, record: Task) => (
    <Space direction="vertical" size={0}>
      <Button type="link" onClick={() => handleViewDetail(record)}>
        {name}
      </Button>
      <Space size={4}>
        {record.groupName && (
          <Tag color="geekblue" icon={<TeamOutlined />}>
            {record.groupName}
          </Tag>
        )}
        {/* 移除了项目组标签，避免与"项目组"列重复 */}
      </Space>
    </Space>
  ),
}
```

#### 3. BrowseTasksPage.tsx

BrowseTasksPage 使用卡片视图，不存在此问题。它的设计是合理的：
- 在标题旁边显示"项目任务"标签（表示这是一个项目任务）
- 在发布者信息下方显示具体的项目组名称

这种设计在卡片视图中是合理的，因为没有单独的列来显示项目组信息。

## 修复后的显示效果

### 表格视图（我的任务 / 我发布的任务）

| 任务名称 | 项目组 | 状态 | 赏金 | 进度 | 操作 |
|---------|--------|------|------|------|------|
| 权限管理系统 [任务组标签] | [企业管理系统] | 进行中 | ¥800.00 | 45% | 更新进度 |
| 支付接口集成 | [电商平台开发] | 进行中 | ¥1000.00 | 60% | 更新进度 |

### 卡片视图（赏金任务）

```
┌─────────────────────────────────────────┐
│ 数据报告生成 [项目任务]                  │
│ 👤 admin  [数据分析平台]                │
│ 开发自动化数据报告生成功能...            │
│ [复杂度: 3/5] [优先级: 3/5] ¥800.00    │
└─────────────────────────────────────────┘
```

## 标签使用规范

### 任务组标签（Task Group）
- **颜色**: 蓝色 (geekblue)
- **图标**: TeamOutlined (团队图标)
- **位置**: 任务名称旁边
- **含义**: 表示任务属于某个任务组（多个任务的集合）

### 项目组标签（Project Group）
- **颜色**: 紫色 (purple)
- **图标**: FolderOutlined (文件夹图标)
- **位置**: 
  - 表格视图：单独的"项目组"列
  - 卡片视图：发布者信息下方
- **含义**: 表示任务属于某个项目组（项目的分类）

## 测试验证

### 测试步骤
1. 登录测试账号（developer1 / Password123）
2. 访问"我的任务"页面
3. 检查每个任务的显示：
   - 任务名称列：只显示任务名称和任务组标签（如果有）
   - 项目组列：显示项目组标签（如果有）
   - 不应该出现重复的项目组标签

4. 登录测试账号（admin / Password123）
5. 访问"我发布的任务"页面
6. 进行相同的检查

### 预期结果
- ✅ 每个任务的项目组信息只显示一次
- ✅ 任务组标签（蓝色）和项目组标签（紫色）清晰区分
- ✅ 视觉效果清晰，不混乱

## 相关文件

- `packages/frontend/src/pages/AssignedTasksPage.tsx` - 已修复
- `packages/frontend/src/pages/PublishedTasksPage.tsx` - 已修复
- `packages/frontend/src/pages/BrowseTasksPage.tsx` - 无需修改（设计合理）

## 修复时间

2026-01-29

## 相关文档

- [项目组功能分析](./PROJECT_GROUP_FEATURE_ANALYSIS.md)
- [项目组功能实现](./PROJECT_GROUP_FEATURE_IMPLEMENTATION.md)
- [丰富测试数据注入总结](./RICH_TEST_DATA_SEEDING_SUMMARY.md)
- [项目组功能测试指南](./TESTING_PROJECT_GROUP_FEATURES.md)
