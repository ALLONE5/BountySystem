# CSS 导入调用流程详解

## 概述
CSS 导入在 React 应用中的工作方式是**全局加载**，而不是按需加载。当 CSS 文件被导入时，其中的所有样式规则都会被应用到整个应用。

---

## 1. 导入位置

### App.tsx（应用入口）
```typescript
import './styles/global-theme.css';
import './styles/search-bar.css';
import './styles/collapse.css';
import './styles/glassmorphism.css';
```

**为什么在 App.tsx 导入？**
- App.tsx 是应用的根组件，在应用启动时首先被加载
- 在这里导入的 CSS 会在应用初始化时立即加载
- 确保所有子组件都能访问这些全局样式

---

## 2. 调用流程

### 流程图
```
应用启动
  ↓
main.tsx 加载 App 组件
  ↓
App.tsx 执行
  ↓
导入 CSS 文件（全局加载）
  ├─ global-theme.css
  ├─ search-bar.css
  ├─ collapse.css
  └─ glassmorphism.css
  ↓
CSS 规则被应用到 DOM
  ↓
ThemeProvider 初始化
  ├─ 读取 localStorage 中的主题设置
  ├─ 设置 data-theme 属性到 <html>
  └─ 应用 CSS 变量
  ↓
组件渲染
  ├─ ModernLayout 使用 glass-card 类
  ├─ 输入框使用 .ant-input 类
  ├─ Collapse 使用 .ant-collapse 类
  └─ 其他组件使用相应的类
  ↓
CSS 选择器匹配
  ├─ [data-theme='light'] .ant-input
  ├─ [data-theme='dark'] .ant-input
  ├─ [data-theme='cyberpunk'] .ant-input
  └─ 其他主题特定选择器
  ↓
样式应用到元素
```

---

## 3. 详细调用机制

### 3.1 global-theme.css 的调用

**导入方式**：全局导入
```typescript
import './styles/global-theme.css';
```

**调用流程**：
```
1. CSS 文件加载
   ↓
2. CSS 变量定义（:root 和 [data-theme='xxx']）
   ↓
3. ThemeContext 设置 data-theme 属性
   ├─ root.setAttribute('data-theme', themeMode)
   └─ 可能的值：'light', 'dark', 'cyberpunk'
   ↓
4. CSS 选择器匹配
   ├─ [data-theme='light'] .ant-table
   ├─ [data-theme='dark'] .ant-table
   └─ [data-theme='cyberpunk'] .ant-table
   ↓
5. 样式应用
   └─ 根据当前主题应用相应的颜色和样式
```

**使用示例**：
```typescript
// ThemeContext.tsx
useEffect(() => {
  const root = document.documentElement;
  
  // 设置 CSS 变量
  Object.entries(theme.colors).forEach(([key, value]) => {
    root.style.setProperty(`--color-${key}`, value);
  });

  // 设置主题属性
  root.setAttribute('data-theme', themeMode);
}, [themeMode]);
```

**CSS 规则示例**：
```css
/* global-theme.css */
[data-theme='dark'] {
  --color-bg-primary: #0d0d12;
  --color-primary: #00d9ff;
}

[data-theme='dark'] .ant-table {
  background: var(--color-bg-secondary);
}

[data-theme='cyberpunk'] .ant-table {
  background: linear-gradient(135deg, rgba(0, 242, 255, 0.1), rgba(255, 0, 229, 0.05));
}
```

---

### 3.2 search-bar.css 的调用

**导入方式**：全局导入
```typescript
import './styles/search-bar.css';
```

**调用流程**：
```
1. CSS 文件加载
   ↓
2. 定义 .ant-input 的基础样式
   ├─ background: var(--color-bg-tertiary)
   ├─ border-color: var(--color-border-secondary)
   └─ color: var(--color-text-primary)
   ↓
3. 定义主题特定的样式
   ├─ [data-theme='cyberpunk'] .ant-input
   ├─ [data-theme='dark'] .ant-input
   └─ [data-theme='light'] .ant-input
   ↓
4. 当用户在搜索框输入时
   ├─ 触发 :hover 伪类
   ├─ 触发 :focus 伪类
   └─ 应用相应的样式
   ↓
5. 样式应用
   └─ 输入框显示主题相应的颜色
```

**使用示例**：
```typescript
// ModernLayout.tsx
<Search
  placeholder="搜索任务、用户、组群..."
  allowClear
  style={{ width: 400, maxWidth: '100%' }}
  size="middle"
/>
```

**CSS 规则示例**：
```css
/* search-bar.css */
.ant-input {
  background: var(--color-bg-tertiary) !important;
  border-color: var(--color-border-secondary) !important;
  color: var(--color-text-primary) !important;
}

[data-theme='cyberpunk'] .ant-input {
  background: #1f1f2e !important;
  border: 1px solid rgba(0, 242, 255, 0.5) !important;
  box-shadow: inset 0 0 8px rgba(0, 242, 255, 0.1) !important;
}

.ant-input:focus {
  border-color: var(--color-primary) !important;
  box-shadow: 0 0 0 2px rgba(0, 242, 255, 0.1) !important;
}
```

---

### 3.3 collapse.css 的调用

**导入方式**：全局导入
```typescript
import './styles/collapse.css';
```

**调用流程**：
```
1. CSS 文件加载
   ↓
2. 定义 .ant-collapse 的基础样式
   ├─ background: transparent
   └─ border: none
   ↓
3. 定义主题特定的样式
   ├─ [data-theme='cyberpunk'] .ant-collapse-header
   ├─ [data-theme='dark'] .ant-collapse-header
   └─ [data-theme='light'] .ant-collapse-header
   ↓
4. 当用户点击 Collapse 时
   ├─ 展开/折叠动画
   ├─ 应用 .ant-collapse-content 样式
   └─ 显示/隐藏内容
   ↓
5. 样式应用
   └─ Collapse 显示主题相应的颜色
```

**使用示例**：
```typescript
// TaskListPage.tsx
<Collapse
  activeKey={expandedProjects}
  onChange={(keys) => setExpandedProjects(keys as string[])}
  items={projectItems}
/>
```

**CSS 规则示例**：
```css
/* collapse.css */
.ant-collapse {
  background: transparent !important;
  border: none !important;
}

[data-theme='cyberpunk'] .ant-collapse-header {
  background: rgba(26, 13, 26, 0.8) !important;
  color: #ffffff !important;
  border: 1px solid rgba(0, 242, 255, 0.2) !important;
}

[data-theme='dark'] .ant-collapse-header {
  background: #1f2937 !important;
  color: #f8fafc !important;
  border: 1px solid rgba(0, 242, 255, 0.1) !important;
}
```

---

### 3.4 glassmorphism.css 的调用

**导入方式**：
1. 全局导入（App.tsx）
2. 局部导入（ModernLayout.tsx）

```typescript
// App.tsx
import './styles/glassmorphism.css';

// ModernLayout.tsx
import '../styles/glassmorphism.css';
```

**调用流程**：
```
1. CSS 文件加载
   ↓
2. 定义 CSS 变量
   ├─ --glass-blur: 20px
   ├─ --glass-opacity: 0.8
   └─ 其他变量
   ↓
3. 定义玻璃态类
   ├─ .glass - 基础玻璃效果
   ├─ .glass-card - 卡片玻璃效果
   ├─ .glass-button - 按钮玻璃效果
   └─ 其他类
   ↓
4. 当组件使用 glass-card 类时
   ├─ 应用 backdrop-filter: blur(20px)
   ├─ 应用 border 和 box-shadow
   └─ 应用悬停效果
   ↓
5. 样式应用
   └─ 元素显示玻璃态效果
```

**使用示例**：
```typescript
// ModernLayout.tsx
<Content className="modern-content">
  <div className="content-wrapper glass-card">
    <Outlet />
  </div>
</Content>
```

**CSS 规则示例**：
```css
/* glassmorphism.css */
.glass-card {
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid rgba(255, 255, 255, var(--glass-border-opacity));
  box-shadow: var(--glass-shadow);
  background: rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
}

.glass-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
  border-color: rgba(255, 255, 255, 0.3);
}
```

---

## 4. 主题切换流程

### 用户切换主题时的调用流程

```
用户点击主题切换按钮
  ↓
BottomNavLayout 中的 setThemeMode() 被调用
  ↓
ThemeContext 的 setThemeMode() 更新状态
  ├─ setThemeModeState(mode)
  └─ localStorage.setItem('theme', mode)
  ↓
useEffect 监听 themeMode 变化
  ↓
document.documentElement.setAttribute('data-theme', themeMode)
  ↓
CSS 选择器重新匹配
  ├─ [data-theme='light'] 选择器匹配
  ├─ [data-theme='dark'] 选择器匹配
  └─ [data-theme='cyberpunk'] 选择器匹配
  ↓
样式立即应用到所有元素
  ├─ 输入框颜色改变
  ├─ 表格背景改变
  ├─ Collapse 样式改变
  └─ 玻璃态效果改变
  ↓
UI 更新完成
```

**代码示例**：
```typescript
// ThemeContext.tsx
useEffect(() => {
  const root = document.documentElement;
  
  // 设置主题属性 - 这是关键！
  root.setAttribute('data-theme', themeMode);
  
  // CSS 选择器会立即匹配新的主题
  // 例如：[data-theme='dark'] .ant-input 会被应用
}, [themeMode]);
```

---

## 5. CSS 变量的使用

### CSS 变量定义
```css
/* global-theme.css */
[data-theme='dark'] {
  --color-bg-primary: #0d0d12;
  --color-bg-secondary: #1a1a24;
  --color-primary: #00d9ff;
  --color-text-primary: #e8e8f0;
}
```

### CSS 变量使用
```css
/* search-bar.css */
.ant-input {
  background: var(--color-bg-tertiary) !important;
  color: var(--color-text-primary) !important;
}
```

### 变量继承流程
```
1. global-theme.css 定义变量
   ├─ --color-bg-primary
   ├─ --color-primary
   └─ 其他变量
   ↓
2. 其他 CSS 文件引用变量
   ├─ search-bar.css: background: var(--color-bg-tertiary)
   ├─ collapse.css: color: var(--color-text-primary)
   └─ glassmorphism.css: border-color: var(--color-primary)
   ↓
3. 主题切换时
   ├─ data-theme 属性改变
   ├─ 新的 CSS 变量值被应用
   └─ 所有引用这些变量的样式自动更新
```

---

## 6. 优先级和覆盖

### CSS 优先级顺序
```
1. global-theme.css（最先加载，优先级最低）
   ├─ 定义基础变量
   └─ 定义全局样式
   ↓
2. search-bar.css
   ├─ 覆盖输入框样式
   └─ 使用 !important 确保优先级
   ↓
3. collapse.css
   ├─ 覆盖 Collapse 样式
   └─ 使用 !important 确保优先级
   ↓
4. glassmorphism.css
   ├─ 定义玻璃态效果
   └─ 使用 !important 确保优先级
   ↓
5. 组件内联样式（最后加载，优先级最高）
   ├─ ModernLayout.css
   ├─ BottomNavLayout.css
   └─ 其他组件样式
```

### 为什么使用 !important？
```css
/* 确保主题样式不被其他样式覆盖 */
.ant-input {
  background: var(--color-bg-tertiary) !important;
  border-color: var(--color-border-secondary) !important;
  color: var(--color-text-primary) !important;
}
```

---

## 7. 实际应用示例

### 完整的样式应用流程

```
用户打开应用
  ↓
App.tsx 加载
  ├─ 导入 global-theme.css
  ├─ 导入 search-bar.css
  ├─ 导入 collapse.css
  └─ 导入 glassmorphism.css
  ↓
ThemeProvider 初始化
  ├─ 读取 localStorage 中的主题（默认 'light'）
  ├─ 设置 document.documentElement.setAttribute('data-theme', 'light')
  └─ 设置 CSS 变量
  ↓
ModernLayout 渲染
  ├─ 搜索框使用 .ant-input 类
  │  └─ CSS 匹配：[data-theme='light'] .ant-input
  │     └─ 应用亮色主题样式
  │
  ├─ 内容区域使用 glass-card 类
  │  └─ CSS 匹配：.glass-card
  │     └─ 应用玻璃态效果
  │
  └─ 任务列表使用 .ant-collapse 类
     └─ CSS 匹配：[data-theme='light'] .ant-collapse
        └─ 应用亮色主题样式
  ↓
用户切换到暗色主题
  ├─ setThemeMode('dark') 被调用
  ├─ document.documentElement.setAttribute('data-theme', 'dark')
  └─ CSS 选择器重新匹配
     ├─ [data-theme='dark'] .ant-input
     ├─ [data-theme='dark'] .ant-collapse
     └─ 所有样式立即更新
  ↓
UI 显示暗色主题
```

---

## 8. 总结

### CSS 导入的调用方式

| 文件 | 导入位置 | 调用方式 | 触发条件 |
|------|--------|--------|--------|
| global-theme.css | App.tsx | 全局加载 | 应用启动 |
| search-bar.css | App.tsx | 全局加载 | 应用启动 |
| collapse.css | App.tsx | 全局加载 | 应用启动 |
| glassmorphism.css | App.tsx + ModernLayout.tsx | 全局加载 | 应用启动 |

### 关键机制

1. **全局加载**：所有 CSS 在应用启动时加载，不是按需加载
2. **主题属性**：通过 `data-theme` 属性切换主题
3. **CSS 变量**：使用 CSS 变量实现主题颜色的动态切换
4. **选择器匹配**：`[data-theme='xxx']` 选择器根据主题属性匹配
5. **优先级**：使用 `!important` 确保主题样式优先级

### 性能考虑

- ✅ 所有 CSS 在启动时加载，避免运行时加载延迟
- ✅ 主题切换时只改变 `data-theme` 属性，不需要重新加载 CSS
- ✅ CSS 变量使浏览器自动更新样式，性能最优
- ✅ 没有额外的 JavaScript 计算，完全由 CSS 处理

---

## 9. 调试技巧

### 检查当前主题
```javascript
// 在浏览器控制台运行
document.documentElement.getAttribute('data-theme')
// 输出：'light' 或 'dark' 或 'cyberpunk'
```

### 检查 CSS 变量
```javascript
// 在浏览器控制台运行
getComputedStyle(document.documentElement).getPropertyValue('--color-primary')
// 输出：'#00d9ff' 或其他颜色值
```

### 检查应用的样式
```javascript
// 在浏览器控制台运行
getComputedStyle(document.querySelector('.ant-input'))
// 输出：所有应用的样式
```

### 强制切换主题（测试）
```javascript
// 在浏览器控制台运行
document.documentElement.setAttribute('data-theme', 'cyberpunk')
// 立即切换到赛博朋克主题
```
