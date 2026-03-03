# 主题系统快速参考

## 🎨 三个主题

### 暗色主题 (夜行猎人) 🌙
```
背景: #0a0b10 → #161821 → #1f2937
文字: #f8fafc (浅灰色)
主色: #00f2ff (青色)
特点: 专业、舒适、易读
```

### 赛博朋克主题 (赛博战士) 🎮
```
背景: #0a0a0f → #1a0d1a → #2d1b2d (紫色系)
文字: #ffffff (纯白色)
主色: #00f2ff (青色) + #ff00e5 (洋红色)
特点: 未来感、发光效果、渐变
```

### 亮色主题 (日光战士) ☀️
```
背景: #ffffff → #f8fafc → #f1f5f9
文字: #0f172a (深色)
主色: #0ea5e9 (蓝色)
特点: 明亮、清爽、正式
```

## 🔧 核心文件

| 文件 | 功能 |
|------|------|
| `packages/frontend/src/theme/index.ts` | Ant Design主题配置 |
| `packages/frontend/src/styles/global-theme.css` | CSS变量和组件样式 |
| `packages/frontend/src/contexts/ThemeContext.tsx` | 主题上下文 |
| `packages/frontend/src/App.tsx` | 应用入口 |

## 📝 CSS变量

### 背景色
```css
--color-bg-primary      /* 主背景 */
--color-bg-secondary    /* 次级背景 */
--color-bg-tertiary     /* 三级背景 */
--color-bg-glass        /* 玻璃态背景 */
```

### 文字色
```css
--color-text-primary    /* 主文字 */
--color-text-secondary  /* 次级文字 */
--color-text-tertiary   /* 三级文字 */
--color-text-inverse    /* 反色文字 */
```

### 功能色
```css
--color-primary         /* 主色 */
--color-secondary       /* 次色 */
--color-accent          /* 强调色 */
--color-success         /* 成功色 */
--color-warning         /* 警告色 */
--color-danger          /* 危险色 */
--color-info            /* 信息色 */
```

### 边框色
```css
--color-border-primary      /* 主边框 */
--color-border-secondary    /* 次级边框 */
--color-divider             /* 分割线 */
```

## 🎯 使用方式

### 在CSS中使用变量
```css
.my-element {
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-primary);
}
```

### 在React中切换主题
```typescript
import { useTheme } from './contexts/ThemeContext';

function MyComponent() {
  const { themeMode, setThemeMode } = useTheme();
  
  return (
    <button onClick={() => setThemeMode('cyberpunk')}>
      切换到赛博朋克
    </button>
  );
}
```

### 在localStorage中保存主题
```javascript
// 保存主题
localStorage.setItem('theme', 'cyberpunk');

// 读取主题
const theme = localStorage.getItem('theme');
```

## 📊 组件样式覆盖

### 表格
```css
.ant-table-thead > tr > th {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
}

.ant-table-tbody > tr > td {
  color: var(--color-text-primary);
}

.ant-table-tbody > tr:hover > td {
  background: var(--color-bg-tertiary);
}
```

### 输入框
```css
.ant-input {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
  border-color: var(--color-border-secondary);
}

.ant-input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(0, 242, 255, 0.1);
}
```

### 按钮
```css
.ant-btn-primary {
  background: var(--color-primary);
  border-color: var(--color-primary);
}

[data-theme='cyberpunk'] .ant-btn-primary {
  box-shadow: 0 0 10px rgba(0, 242, 255, 0.5);
}
```

## 🚀 快速切换

### 方法1: 系统配置
1. 管理功能 → 系统配置
2. 选择主题
3. 保存配置
4. 刷新页面

### 方法2: 开发者工具
```javascript
// 暗色
localStorage.setItem('theme', 'dark');
window.location.reload();

// 赛博朋克
localStorage.setItem('theme', 'cyberpunk');
window.location.reload();

// 亮色
localStorage.setItem('theme', 'light');
window.location.reload();
```

## 🎨 赛博朋克特殊效果

### 按钮发光
```css
[data-theme='cyberpunk'] .ant-btn-primary {
  box-shadow: 0 0 10px rgba(0, 242, 255, 0.5),
              inset 0 0 10px rgba(0, 242, 255, 0.1);
  border: 1px solid rgba(0, 242, 255, 0.8);
}
```

### 表头渐变
```css
[data-theme='cyberpunk'] .ant-table-thead > tr > th {
  background: linear-gradient(135deg, 
              rgba(0, 242, 255, 0.1),
              rgba(255, 0, 229, 0.05));
  border-left: 2px solid rgba(0, 242, 255, 0.4);
}
```

### 行悬停发光
```css
[data-theme='cyberpunk'] .ant-table-tbody > tr:hover > td {
  background: rgba(0, 242, 255, 0.05);
  box-shadow: inset 0 0 10px rgba(0, 242, 255, 0.1);
}
```

## 📱 响应式

### 移动设备优化
```css
@media (max-width: 768px) {
  .ant-table {
    font-size: 12px;
  }
  
  .ant-table-thead > tr > th {
    padding: 8px 4px;
  }
}
```

## 🔍 调试技巧

### 查看当前主题
```javascript
document.documentElement.getAttribute('data-theme');
```

### 查看CSS变量
```javascript
getComputedStyle(document.documentElement)
  .getPropertyValue('--color-primary');
```

### 强制刷新主题
```javascript
localStorage.removeItem('theme');
window.location.reload();
```

## ⚡ 性能优化

- ✅ 使用CSS变量，无需重新渲染
- ✅ 主题切换只更新CSS属性
- ✅ 支持系统偏好设置
- ✅ 响应式设计

## 🐛 常见问题

### Q: 主题没有生效？
A: 清除缓存 (Ctrl+Shift+Delete) 并强制刷新 (Ctrl+F5)

### Q: 表格文字看不清？
A: 确保选择了正确的主题，检查浏览器缩放

### Q: 按钮没有发光？
A: 确保选择了赛博朋克主题，检查浏览器硬件加速

### Q: 如何添加新主题？
A: 在 `themes.ts` 中添加新主题，在 `global-theme.css` 中添加CSS变量

## 📚 相关文档

- `DARK_CYBERPUNK_THEME_OPTIMIZATION.md` - 详细说明
- `THEME_TESTING_GUIDE.md` - 测试指南
- `THEME_OPTIMIZATION_SUMMARY.md` - 完成总结

---

**最后更新**: 2026-03-02  
**版本**: v1.0.0
