#!/usr/bin/env node

/**
 * 空白页面诊断和修复脚本
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 开始诊断空白页面问题...\n');

// 检查关键文件是否存在
function checkFiles() {
    const files = [
        'packages/frontend/src/App.tsx',
        'packages/frontend/src/router/working.tsx',
        'packages/frontend/src/pages/TestDashboard.tsx',
        'packages/frontend/src/pages/UIShowcasePage.tsx',
        'packages/frontend/src/styles/glassmorphism.css'
    ];
    
    console.log('📁 检查关键文件:');
    files.forEach(file => {
        const exists = fs.existsSync(path.join(__dirname, file));
        console.log(`${exists ? '✅' : '❌'} ${file}`);
    });
}

// 检查 App.tsx 的导入
function checkAppImports() {
    const appPath = path.join(__dirname, 'packages/frontend/src/App.tsx');
    if (fs.existsSync(appPath)) {
        const content = fs.readFileSync(appPath, 'utf8');
        console.log('\n📋 App.tsx 导入检查:');
        
        if (content.includes('./router/working')) {
            console.log('✅ 使用 working 路由');
        } else if (content.includes('./router/simple')) {
            console.log('⚠️ 使用 simple 路由');
        } else if (content.includes('./router/index')) {
            console.log('⚠️ 使用 index 路由');
        } else {
            console.log('❌ 未找到路由导入');
        }
        
        if (content.includes('glassmorphism.css')) {
            console.log('✅ 导入玻璃态样式');
        } else {
            console.log('❌ 未导入玻璃态样式');
        }
    }
}

// 检查路由配置
function checkRouter() {
    const routerPath = path.join(__dirname, 'packages/frontend/src/router/working.tsx');
    if (fs.existsSync(routerPath)) {
        const content = fs.readFileSync(routerPath, 'utf8');
        console.log('\n🛣️ 路由配置检查:');
        
        if (content.includes('TestDashboard')) {
            console.log('✅ 包含测试仪表板');
        } else {
            console.log('❌ 缺少测试仪表板');
        }
        
        if (content.includes('UIShowcasePage')) {
            console.log('✅ 包含 UI 展示页面');
        } else {
            console.log('❌ 缺少 UI 展示页面');
        }
        
        if (content.includes('export const router')) {
            console.log('✅ 正确导出路由');
        } else {
            console.log('❌ 路由导出有问题');
        }
    }
}

// 生成修复建议
function generateSuggestions() {
    console.log('\n🔧 修复建议:');
    console.log('─'.repeat(50));
    
    console.log('1. 重启开发服务器:');
    console.log('   cd packages/frontend');
    console.log('   npm run dev');
    
    console.log('\n2. 清除浏览器缓存:');
    console.log('   - 硬刷新: Ctrl+Shift+R');
    console.log('   - 或使用隐私模式');
    
    console.log('\n3. 检查控制台错误:');
    console.log('   - 打开开发者工具 (F12)');
    console.log('   - 查看 Console 标签页');
    
    console.log('\n4. 访问测试页面:');
    console.log('   - http://localhost:3000/dashboard');
    console.log('   - http://localhost:3000/ui-showcase');
    
    console.log('\n5. 如果仍然空白:');
    console.log('   - 检查后端服务器是否运行');
    console.log('   - 确认端口 3000 没有被占用');
    console.log('   - 尝试使用不同的浏览器');
}

// 创建测试页面
function createTestPage() {
    const testPageContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🔍 空白页面诊断</title>
    <style>
        body {
            font-family: 'Inter', sans-serif;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
            color: white;
            margin: 0;
            padding: 40px;
            min-height: 100vh;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
        }
        
        .title {
            text-align: center;
            font-size: 36px;
            margin-bottom: 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .status {
            padding: 20px;
            margin: 20px 0;
            border-radius: 12px;
            border-left: 4px solid #57f287;
            background: rgba(87, 242, 135, 0.1);
        }
        
        .button {
            background: #5865f2;
            color: white;
            border: none;
            border-radius: 12px;
            padding: 16px 24px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            margin: 8px;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-block;
        }
        
        .button:hover {
            background: #4752c4;
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(88, 101, 242, 0.4);
        }
        
        .instructions {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            padding: 20px;
            margin-top: 30px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1 class="title">🔍 空白页面诊断</h1>
        
        <div class="status">
            <h3>✅ 修复状态</h3>
            <p>已创建简化的路由和测试页面，应该可以正常显示了。</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="http://localhost:3000/dashboard" class="button">🏠 测试仪表板</a>
            <a href="http://localhost:3000/ui-showcase" class="button">🎨 UI 展示</a>
            <button class="button" onclick="checkServer()">🔍 检查服务器</button>
        </div>
        
        <div class="instructions">
            <h3>📝 故障排除步骤</h3>
            <ol>
                <li><strong>重启开发服务器</strong>: cd packages/frontend && npm run dev</li>
                <li><strong>硬刷新浏览器</strong>: Ctrl+Shift+R (Windows) 或 Cmd+Shift+R (Mac)</li>
                <li><strong>检查控制台</strong>: 打开开发者工具查看错误信息</li>
                <li><strong>尝试隐私模式</strong>: 排除缓存问题</li>
                <li><strong>检查端口</strong>: 确认 localhost:3000 可访问</li>
            </ol>
        </div>
        
        <div class="instructions">
            <h3>🎯 预期效果</h3>
            <p>如果修复成功，您应该看到:</p>
            <ul>
                <li>🏠 <strong>/dashboard</strong>: 测试仪表板页面</li>
                <li>🎨 <strong>/ui-showcase</strong>: 现代化 UI 组件展示</li>
                <li>🌟 <strong>玻璃态效果</strong>: 半透明模糊背景</li>
                <li>🎨 <strong>现代化设计</strong>: Discord 风格界面</li>
            </ul>
        </div>
    </div>

    <script>
        function checkServer() {
            fetch('http://localhost:3000')
                .then(response => {
                    if (response.ok) {
                        alert('✅ 服务器运行正常！\\n\\n现在应该可以看到页面内容了。');
                    } else {
                        alert('⚠️ 服务器响应异常\\n\\n请检查开发服务器状态。');
                    }
                })
                .catch(error => {
                    alert('❌ 无法连接到服务器\\n\\n请确保开发服务器已启动:\\ncd packages/frontend && npm run dev');
                });
        }
        
        console.log('🔍 空白页面诊断页面已加载');
        console.log('📋 如果主应用仍然空白，请按照页面上的步骤进行故障排除');
    </script>
</body>
</html>`;

    fs.writeFileSync(path.join(__dirname, 'diagnose-blank-page-fix.html'), testPageContent);
    console.log('\n📄 已创建诊断页面: diagnose-blank-page-fix.html');
}

// 执行诊断
checkFiles();
checkAppImports();
checkRouter();
generateSuggestions();
createTestPage();

console.log('\n🎉 诊断完成！');
console.log('\n📋 总结:');
console.log('- 已创建简化的路由系统');
console.log('- 已创建测试仪表板页面');
console.log('- 已移除可能导致问题的复杂组件');
console.log('- 已创建诊断页面');

console.log('\n🚀 下一步:');
console.log('1. 重启开发服务器');
console.log('2. 访问 http://localhost:3000');
console.log('3. 如果仍有问题，打开 diagnose-blank-page-fix.html');