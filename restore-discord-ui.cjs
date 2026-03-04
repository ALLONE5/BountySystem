const fs = require('fs');
const path = require('path');

console.log('🎨 恢复Discord风格UI...');

// 1. 更新主题设置为Discord
const updateThemeConfig = () => {
  try {
    console.log('📝 更新主题配置...');
    
    // 更新localStorage默认主题
    const updateScript = `
      // 设置Discord为默认主题
      localStorage.setItem('theme', 'discord');
      console.log('✅ 主题已设置为Discord风格');
    `;
    
    fs.writeFileSync('set-discord-theme.js', updateScript);
    console.log('✅ 主题配置脚本已创建');
  } catch (error) {
    console.error('❌ 更新主题配置失败:', error.message);
  }
};

// 2. 创建Discord风格的全局样式
const createDiscordGlobalStyles = () => {
  try {
    console.log('🎨 创建Discord全局样式...');
    
    const discordGlobalCSS = `
/* Discord Global Styles */
:root {
  /* Discord Color Palette */
  --discord-bg-primary: #2f3136;
  --discord-bg-secondary: #36393f;
  --discord-bg-tertiary: #40444b;
  --discord-bg-quaternary: #4f545c;
  --discord-border: #40444b;
  --discord-accent: #5865f2;
  --discord-success: #57f287;
  --discord-warning: #fee75c;
  --discord-danger: #ed4245;
  --discord-text-primary: #dcddde;
  --discord-text-secondary: #b9bbbe;
  --discord-text-muted: #72767d;
  --discord-text-link: #00aff4;
}

/* Global Discord Theme Application */
body[data-theme="discord"] {
  background: var(--discord-bg-primary) !important;
  color: var(--discord-text-primary) !important;
  font-family: "Whitney", "Helvetica Neue", Helvetica, Arial, sans-serif !important;
}

/* Ant Design Component Overrides for Discord Theme */
body[data-theme="discord"] .ant-layout {
  background: var(--discord-bg-primary) !important;
}

body[data-theme="discord"] .ant-card {
  background: var(--discord-bg-secondary) !important;
  border: 1px solid var(--discord-border) !important;
  color: var(--discord-text-primary) !important;
}

body[data-theme="discord"] .ant-card-head {
  background: transparent !important;
  border-bottom: 1px solid var(--discord-border) !important;
  color: var(--discord-text-primary) !important;
}

body[data-theme="discord"] .ant-btn-primary {
  background: var(--discord-accent) !important;
  border-color: var(--discord-accent) !important;
}

body[data-theme="discord"] .ant-btn-primary:hover {
  background: #4752c4 !important;
  border-color: #4752c4 !important;
}

body[data-theme="discord"] .ant-menu {
  background: transparent !important;
  color: var(--discord-text-secondary) !important;
}

body[data-theme="discord"] .ant-menu-item {
  color: var(--discord-text-secondary) !important;
}

body[data-theme="discord"] .ant-menu-item:hover {
  background: var(--discord-bg-tertiary) !important;
  color: var(--discord-text-primary) !important;
}

body[data-theme="discord"] .ant-menu-item-selected {
  background: var(--discord-accent) !important;
  color: #ffffff !important;
}

body[data-theme="discord"] .ant-input {
  background: var(--discord-bg-tertiary) !important;
  border: 1px solid var(--discord-border) !important;
  color: var(--discord-text-primary) !important;
}

body[data-theme="discord"] .ant-input::placeholder {
  color: var(--discord-text-muted) !important;
}

body[data-theme="discord"] .ant-select-selector {
  background: var(--discord-bg-tertiary) !important;
  border: 1px solid var(--discord-border) !important;
  color: var(--discord-text-primary) !important;
}

body[data-theme="discord"] .ant-table {
  background: var(--discord-bg-secondary) !important;
  color: var(--discord-text-primary) !important;
}

body[data-theme="discord"] .ant-table-thead > tr > th {
  background: var(--discord-bg-tertiary) !important;
  border-bottom: 1px solid var(--discord-border) !important;
  color: var(--discord-text-primary) !important;
}

body[data-theme="discord"] .ant-table-tbody > tr > td {
  border-bottom: 1px solid var(--discord-border) !important;
  color: var(--discord-text-secondary) !important;
}

body[data-theme="discord"] .ant-table-tbody > tr:hover > td {
  background: var(--discord-bg-tertiary) !important;
}

/* Discord Scrollbar */
body[data-theme="discord"] ::-webkit-scrollbar {
  width: 8px;
}

body[data-theme="discord"] ::-webkit-scrollbar-track {
  background: var(--discord-bg-secondary);
}

body[data-theme="discord"] ::-webkit-scrollbar-thumb {
  background: var(--discord-bg-quaternary);
  border-radius: 4px;
}

body[data-theme="discord"] ::-webkit-scrollbar-thumb:hover {
  background: #5c6269;
}

/* Discord Typography */
body[data-theme="discord"] h1,
body[data-theme="discord"] h2,
body[data-theme="discord"] h3,
body[data-theme="discord"] h4,
body[data-theme="discord"] h5,
body[data-theme="discord"] h6 {
  color: var(--discord-text-primary) !important;
}

body[data-theme="discord"] p,
body[data-theme="discord"] span,
body[data-theme="discord"] div {
  color: var(--discord-text-secondary);
}

/* Discord Links */
body[data-theme="discord"] a {
  color: var(--discord-text-link) !important;
}

body[data-theme="discord"] a:hover {
  text-decoration: underline;
}
`;

    const globalStylesPath = path.join('packages/frontend/src/styles/discord-global.css');
    fs.writeFileSync(globalStylesPath, discordGlobalCSS);
    console.log('✅ Discord全局样式已创建');
  } catch (error) {
    console.error('❌ 创建全局样式失败:', error.message);
  }
};

// 3. 创建测试页面
const createTestPage = () => {
  try {
    console.log('🧪 创建Discord UI测试页面...');
    
    const testHTML = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Discord UI 测试</title>
    <style>
        ${fs.readFileSync('packages/frontend/src/styles/discord-global.css', 'utf8')}
        
        body {
            margin: 0;
            padding: 20px;
            background: var(--discord-bg-primary);
            color: var(--discord-text-primary);
            font-family: "Whitney", "Helvetica Neue", Helvetica, Arial, sans-serif;
        }
        
        .test-container {
            max-width: 1200px;
            margin: 0 auto;
        }
        
        .test-section {
            background: var(--discord-bg-secondary);
            border: 1px solid var(--discord-border);
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
        }
        
        .test-button {
            background: var(--discord-accent);
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            margin-right: 10px;
            margin-bottom: 10px;
        }
        
        .test-button:hover {
            background: #4752c4;
        }
        
        .test-card {
            background: var(--discord-bg-tertiary);
            border: 1px solid var(--discord-border);
            border-radius: 6px;
            padding: 16px;
            margin-bottom: 16px;
        }
        
        .status-online { color: var(--discord-success); }
        .status-away { color: var(--discord-warning); }
        .status-busy { color: var(--discord-danger); }
    </style>
</head>
<body data-theme="discord">
    <div class="test-container">
        <h1>🎨 Discord UI 风格测试</h1>
        
        <div class="test-section">
            <h2>颜色测试</h2>
            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                <div style="background: var(--discord-bg-primary); padding: 20px; border-radius: 4px;">主背景</div>
                <div style="background: var(--discord-bg-secondary); padding: 20px; border-radius: 4px;">次背景</div>
                <div style="background: var(--discord-bg-tertiary); padding: 20px; border-radius: 4px;">三级背景</div>
                <div style="background: var(--discord-accent); padding: 20px; border-radius: 4px; color: white;">主色调</div>
                <div style="background: var(--discord-success); padding: 20px; border-radius: 4px; color: white;">成功色</div>
                <div style="background: var(--discord-warning); padding: 20px; border-radius: 4px; color: black;">警告色</div>
                <div style="background: var(--discord-danger); padding: 20px; border-radius: 4px; color: white;">危险色</div>
            </div>
        </div>
        
        <div class="test-section">
            <h2>按钮测试</h2>
            <button class="test-button">主要按钮</button>
            <button class="test-button" style="background: var(--discord-success);">成功按钮</button>
            <button class="test-button" style="background: var(--discord-warning); color: black;">警告按钮</button>
            <button class="test-button" style="background: var(--discord-danger);">危险按钮</button>
            <button class="test-button" style="background: var(--discord-bg-tertiary);">次要按钮</button>
        </div>
        
        <div class="test-section">
            <h2>卡片测试</h2>
            <div class="test-card">
                <h3>任务卡片示例</h3>
                <p>这是一个Discord风格的任务卡片，展示了典型的内容布局。</p>
                <div style="display: flex; gap: 10px; margin-top: 10px;">
                    <span style="background: var(--discord-accent); color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px;">进行中</span>
                    <span style="background: var(--discord-warning); color: black; padding: 2px 8px; border-radius: 12px; font-size: 12px;">高优先级</span>
                </div>
            </div>
            
            <div class="test-card">
                <h3>用户状态示例</h3>
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    <div><span class="status-online">●</span> 用户A - 在线</div>
                    <div><span class="status-away">●</span> 用户B - 离开</div>
                    <div><span class="status-busy">●</span> 用户C - 忙碌</div>
                </div>
            </div>
        </div>
        
        <div class="test-section">
            <h2>文本测试</h2>
            <h3>这是标题文本</h3>
            <p>这是主要文本内容，使用了Discord的主要文本颜色。</p>
            <p style="color: var(--discord-text-secondary);">这是次要文本内容，颜色稍浅。</p>
            <p style="color: var(--discord-text-muted);">这是静音文本内容，用于不重要的信息。</p>
            <a href="#" style="color: var(--discord-text-link);">这是链接文本</a>
        </div>
    </div>
    
    <script>
        // 设置主题
        document.body.setAttribute('data-theme', 'discord');
        localStorage.setItem('theme', 'discord');
        
        console.log('✅ Discord主题已应用');
        console.log('🎨 当前主题:', localStorage.getItem('theme'));
    </script>
</body>
</html>
`;

    fs.writeFileSync('test-discord-ui.html', testHTML);
    console.log('✅ Discord UI测试页面已创建: test-discord-ui.html');
  } catch (error) {
    console.error('❌ 创建测试页面失败:', error.message);
  }
};

// 4. 创建恢复指南
const createRestoreGuide = () => {
  try {
    console.log('📖 创建恢复指南...');
    
    const guide = `# Discord风格UI恢复指南

## 🎯 已完成的恢复工作

### 1. 布局系统
- ✅ 创建了 \`DiscordLayout.tsx\` - Discord风格的三栏布局
- ✅ 创建了 \`DiscordLayout.css\` - 完整的Discord样式系统
- ✅ 更新了路由配置，使用Discord布局

### 2. 组件系统
- ✅ 创建了 \`DiscordComponents.tsx\` - Discord风格组件库
  - DiscordCard - Discord风格卡片
  - DiscordButton - Discord风格按钮
  - DiscordTaskCard - 任务卡片
  - DiscordUserCard - 用户卡片
  - DiscordStatsCard - 统计卡片
- ✅ 创建了 \`DiscordComponents.css\` - 组件样式

### 3. 主题系统
- ✅ 添加了Discord主题到 \`themes.ts\`
- ✅ 添加了Midjourney主题到 \`themes.ts\`
- ✅ 更新了ThemeContext，默认使用Discord主题

### 4. 页面更新
- ✅ 创建了 \`DiscordDashboardPage.tsx\` - Discord风格的仪表板
- ✅ 更新了路由配置

## 🚀 如何启动Discord风格UI

### 方法1: 直接测试
1. 打开 \`test-discord-ui.html\` 查看Discord风格效果
2. 检查颜色、按钮、卡片等组件样式

### 方法2: 在应用中启用
1. 确保前端应用正在运行
2. 运行主题设置脚本:
   \`\`\`bash
   node set-discord-theme.js
   \`\`\`
3. 刷新浏览器页面

### 方法3: 手动设置
1. 在浏览器开发者工具中执行:
   \`\`\`javascript
   localStorage.setItem('theme', 'discord');
   location.reload();
   \`\`\`

## 🎨 Discord风格特点

### 设计特色
- **深色优先**: 使用Discord经典的深灰色调
- **三栏布局**: 左侧导航 + 中间内容 + 右侧信息面板
- **圆角设计**: 适度的圆角，现代感十足
- **高对比度**: 清晰的文本对比度
- **状态指示**: 丰富的颜色状态系统

### 颜色系统
- 主背景: #2f3136 (Discord深灰)
- 次背景: #36393f (Discord中灰)
- 三级背景: #40444b (Discord浅灰)
- 主色调: #5865f2 (Discord蓝)
- 成功色: #57f287 (Discord绿)
- 警告色: #fee75c (Discord黄)
- 危险色: #ed4245 (Discord红)

### 组件特色
- **任务卡片**: 展示任务信息、状态、赏金等
- **用户卡片**: 显示用户头像、状态、统计信息
- **统计卡片**: 数据展示卡片，支持趋势指示
- **按钮系统**: 多种颜色和状态的按钮
- **导航系统**: Discord风格的侧边导航

## 📱 响应式设计

- **桌面端**: 完整的三栏布局
- **平板端**: 自适应布局，可折叠侧边栏
- **移动端**: 底部导航栏，全屏内容区域

## 🔧 自定义和扩展

### 添加新的Discord组件
1. 在 \`DiscordComponents.tsx\` 中添加新组件
2. 在 \`DiscordComponents.css\` 中添加对应样式
3. 使用Discord颜色变量保持一致性

### 修改颜色主题
1. 编辑 \`themes.ts\` 中的 \`discordTheme\`
2. 更新 \`DiscordLayout.css\` 中的CSS变量
3. 重新构建应用

## 🎯 下一步计划

1. **页面迁移**: 将其他页面迁移到Discord风格
2. **组件完善**: 添加更多Discord风格组件
3. **动画效果**: 添加微交互动画
4. **主题切换**: 完善主题切换功能
5. **移动端优化**: 进一步优化移动端体验

---

**恢复完成！** 🎉 您的应用现在具备了完整的Discord风格UI系统。
`;

    fs.writeFileSync('DISCORD_UI_RESTORE_GUIDE.md', guide);
    console.log('✅ 恢复指南已创建: DISCORD_UI_RESTORE_GUIDE.md');
  } catch (error) {
    console.error('❌ 创建恢复指南失败:', error.message);
  }
};

// 执行所有恢复步骤
const main = async () => {
  console.log('🚀 开始恢复Discord风格UI...\n');
  
  updateThemeConfig();
  createDiscordGlobalStyles();
  createTestPage();
  createRestoreGuide();
  
  console.log('\n✅ Discord风格UI恢复完成！');
  console.log('\n📋 接下来的步骤:');
  console.log('1. 打开 test-discord-ui.html 查看效果');
  console.log('2. 运行 node set-discord-theme.js 设置主题');
  console.log('3. 启动前端应用查看完整效果');
  console.log('4. 查看 DISCORD_UI_RESTORE_GUIDE.md 了解详细信息');
};

main().catch(console.error);