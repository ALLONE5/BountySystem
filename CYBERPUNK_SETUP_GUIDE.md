# 赛博朋克主题设置指南

## 当前状态

✅ **前端已完成**:
- 赛博朋克主题已添加到系统配置页面
- 赛博朋克动画已添加到动画选项
- 前端默认使用赛博朋克主题

⚠️ **数据库约束需要更新**:
- 数据库CHECK约束不支持新的'cyberpunk'和'matrix'值
- 需要手动更新数据库约束

## 快速体验赛博朋克主题

### 方法1：浏览器本地存储（推荐 - 立即生效）

1. 打开浏览器访问 http://localhost:5173
2. 按 F12 打开开发者工具
3. 在控制台中执行：
```javascript
localStorage.setItem('theme', 'cyberpunk');
localStorage.setItem('animation-style', 'cyberpunk');
window.location.reload();
```

### 方法2：使用主题切换器

1. 打开 `cyberpunk-theme-toggle.html` 文件
2. 点击"启用赛博朋克主题"按钮
3. 刷新应用页面

### 方法3：通过系统配置（需要数据库更新）

1. 登录开发者账户：
   - 用户名: `dev_test_840023`
   - 密码: `DevTest123`

2. 进入"管理功能" → "系统配置"

3. 在"默认主题模式"下拉菜单中选择"赛博朋克主题 (赛博战士)"

4. 在"动画风格"下拉菜单中选择"赛博朋克"

5. 点击"保存配置"

**注意**: 如果第3步失败，说明数据库约束还需要更新

## 数据库约束更新

如果你看到错误信息 "关系 \"system_config\" 的新列违反了检查约束"，需要更新数据库约束。

### 使用SQL工具更新（如pgAdmin、DBeaver等）

执行以下SQL语句：

```sql
-- 删除旧约束
ALTER TABLE system_config DROP CONSTRAINT IF EXISTS system_config_animation_style_check;
ALTER TABLE system_config DROP CONSTRAINT IF EXISTS system_config_default_theme_check;

-- 添加新约束
ALTER TABLE system_config ADD CONSTRAINT system_config_animation_style_check 
CHECK (animation_style IN ('none', 'minimal', 'scanline', 'particles', 'hexagon', 'datastream', 'hologram', 'ripple', 'cyberpunk', 'matrix'));

ALTER TABLE system_config ADD CONSTRAINT system_config_default_theme_check 
CHECK (default_theme IN ('light', 'dark', 'cyberpunk'));
```

## 赛博朋克主题特色

一旦成功切换，你将看到：

### 视觉效果
- 🎨 **霓虹配色**: 青色 (#00f2ff) 和洋红色 (#ff00e5)
- 💫 **玻璃态效果**: 模糊背景和透明卡片
- ✨ **发光边框**: 所有UI元素都有霓虹发光效果
- 🌊 **动画效果**: 赛博网格、故障艺术、矩阵雨滴

### 字体
- 显示字体: Orbitron (未来主义)
- 正文字体: JetBrains Mono (编程字体)

### 动画选项
- **赛博朋克**: 网格脉冲、霓虹线条、故障闪烁
- **矩阵雨滴**: 数字下落、数字噪声

## 故障排除

### 问题1: 系统配置页面没有赛博朋克选项

**解决方案**: 
- 清除浏览器缓存 (Ctrl+Shift+Delete)
- 强制刷新页面 (Ctrl+F5)
- 重启前端服务

### 问题2: 保存配置时出现约束错误

**解决方案**:
- 使用SQL工具更新数据库约束（见上面的SQL语句）
- 或使用方法1（浏览器本地存储）临时体验

### 问题3: 主题没有生效

**解决方案**:
- 确保浏览器允许localStorage
- 检查浏览器控制台是否有错误
- 尝试清除localStorage后重新设置

## 开发者账户

- **用户名**: dev_test_840023
- **密码**: DevTest123
- **角色**: 开发者 (可访问系统配置)

## 文件位置

- 前端主题定义: `packages/frontend/src/styles/themes.ts`
- 赛博朋克组件: `packages/frontend/src/components/cyberpunk/`
- 动画效果: `packages/frontend/src/components/animations/`
- 系统配置页面: `packages/frontend/src/pages/admin/SystemConfigPage.tsx`
- 主题上下文: `packages/frontend/src/contexts/ThemeContext.tsx`

## 下一步

1. ✅ 前端实现完成
2. ⏳ 数据库约束更新（可选，用于持久化配置）
3. 🎉 享受赛博朋克主题！

---

**最后更新**: 2026-03-02
**版本**: v1.0.0-cyberpunk