# 头部Logo和搜索框修改完成

## 修改内容

### 1. 去除搜索框
- **ModernLayout.tsx**: 移除了头部中心区域的搜索框和相关导入
- **ModernHeader.tsx**: 移除了桌面端和移动端的搜索功能，包括：
  - 搜索输入框
  - 搜索按钮
  - 移动端搜索覆盖层
  - 搜索相关的状态变量和函数
  - 不再使用的导入（Input, SearchOutlined等）

### 2. 更新Logo和名称
将所有"赏金猎人"相关文本更新为"赏金test"，涉及以下文件：

#### 布局组件
- `packages/frontend/src/layouts/ModernLayout.tsx` - 头部logo文本
- `packages/frontend/src/layouts/SafeBottomNavLayout.tsx` - 默认站点名称
- `packages/frontend/src/layouts/DiscordLayout.tsx` - logo文本
- `packages/frontend/src/layouts/BottomNavLayout.tsx` - 默认站点名称

#### 页面组件
- `packages/frontend/src/pages/SimpleSettingsPage.tsx` - 版本信息
- `packages/frontend/src/pages/DiscordRankingPage.tsx` - 排行榜标题和描述
- `packages/frontend/src/pages/auth/SimpleLoginPage.tsx` - 登录页标题
- `packages/frontend/src/pages/auth/LoginPage.tsx` - 登录页标题
- `packages/frontend/src/pages/admin/SystemConfigPage.tsx` - 配置页占位符

#### 导航组件
- `packages/frontend/src/components/navigation/SideNavigation.tsx` - 系统名称
- `packages/frontend/src/components/navigation/ModernHeader.tsx` - 站点名称

#### 配置文件
- `packages/frontend/src/contexts/SystemConfigContext.tsx` - 默认站点名称
- `packages/frontend/src/contexts/SimpleSystemConfigContext.tsx` - 默认站点名称

## 修改详情

### Logo文本更新
```typescript
// 修改前
<div className="logo-text">赏金猎人</div>

// 修改后  
<div className="logo-text">赏金test</div>
```

### 搜索框移除
```typescript
// 修改前
<div className="header-center">
  {!isMobile && (
    <div className="search-container">
      <SearchOutlined className="search-icon" />
      <Input placeholder="搜索任务、用户、组群..." />
    </div>
  )}
</div>

// 修改后
<div className="header-center">
  {/* 搜索框已移除 */}
</div>
```

### 系统配置更新
```typescript
// 修改前
siteName: '赏金猎人平台'

// 修改后
siteName: '赏金test平台'
```

## 影响范围
- ✅ 头部导航栏logo和名称已更新
- ✅ 所有布局组件中的默认名称已更新
- ✅ 登录页面标题已更新
- ✅ 系统配置默认值已更新
- ✅ 搜索功能已完全移除
- ✅ 不再使用的导入已清理

## 验证方式
1. 访问前端页面 http://localhost:5173
2. 确认头部显示"赏金test"而不是"赏金猎人"
3. 确认搜索框已不存在
4. 检查各个页面的标题和名称是否正确更新

所有修改已完成，头部现在显示"赏金test"并且搜索框已被移除！