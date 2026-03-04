# ModernLayout 底部导航显示问题修复

## 问题描述
ModernLayout 在桌面端也显示了底部导航栏（红色导航条），这个导航栏应该只在移动设备上显示。

## 根本原因
1. **CSS 类名不匹配**: TSX 文件中使用的类名是 `modern-mobile-nav`，但 CSS 文件中定义的是 `mobile-bottom-nav`
2. **JavaScript 检测不可靠**: 依赖 JavaScript 的 `isMobile` 状态来控制显示，可能存在状态同步问题
3. **CSS 显示逻辑**: CSS 中底部导航默认就是 `display: flex`，没有正确的媒体查询控制

## 解决方案

### 1. 修复 CSS 类名匹配
将 TSX 中的类名从 `modern-mobile-nav` 改为 `mobile-bottom-nav`，与 CSS 保持一致。

### 2. 使用 CSS 媒体查询控制显示
```css
.mobile-bottom-nav {
  display: none; /* 默认隐藏 */
  /* 其他样式... */
}

/* 只在移动端显示底部导航 */
@media (max-width: 767px) {
  .mobile-bottom-nav {
    display: flex;
  }
}
```

### 3. 简化 TSX 逻辑
移除 JavaScript 条件判断，让 CSS 媒体查询完全控制显示：
```tsx
{/* 移动端底部导航 - 通过CSS媒体查询控制显示 */}
<div className="mobile-bottom-nav">
  {/* 导航项... */}
</div>
```

## 修改的文件
1. `packages/frontend/src/layouts/ModernLayout.tsx`
   - 修复类名匹配
   - 移除 JavaScript 条件判断
   - 简化导航项结构（移除文字标签）

2. `packages/frontend/src/layouts/ModernLayout.css`
   - 设置默认 `display: none`
   - 添加媒体查询控制显示

## 结果
- ✅ 桌面端不再显示底部导航
- ✅ 移动端（屏幕宽度 < 768px）正常显示底部导航
- ✅ 响应式设计更加可靠
- ✅ 减少了 JavaScript 依赖，提高性能

## 测试方法
1. 在桌面端（宽度 > 768px）访问页面，底部导航应该隐藏
2. 使用浏览器开发者工具切换到移动设备视图，底部导航应该显示
3. 调整浏览器窗口大小，在 768px 临界点应该能看到导航的显示/隐藏切换