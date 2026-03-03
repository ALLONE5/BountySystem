#!/usr/bin/env node

/**
 * 强制 UI 刷新脚本
 * 清除所有可能的缓存并强制重新加载现代化 UI
 */

const fs = require('fs');
const path = require('path');

console.log('🔄 开始强制刷新现代化 UI...\n');

// 添加缓存破坏器到关键文件
function addCacheBuster() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const cacheBuster = `/* CACHE BUSTER: ${timestamp} - MODERN UI FORCE REFRESH */\n`;
    
    console.log('📝 添加缓存破坏器...');
    
    // 更新 App.tsx
    const appPath = path.join(__dirname, 'packages/frontend/src/App.tsx');
    if (fs.existsSync(appPath)) {
        let appContent = fs.readFileSync(appPath, 'utf8');
        
        // 移除旧的缓存破坏器
        appContent = appContent.replace(/\/\* CACHE BUSTER:.*?\*\/\n/g, '');
        
        // 添加新的缓存破坏器
        const importIndex = appContent.indexOf("import './styles/glassmorphism.css';");
        if (importIndex !== -1) {
            const beforeImport = appContent.substring(0, importIndex);
            const afterImport = appContent.substring(importIndex);
            appContent = beforeImport + cacheBuster + afterImport;
            
            fs.writeFileSync(appPath, appContent);
            console.log('✅ App.tsx 缓存破坏器已添加');
        }
    }
    
    // 更新路由文件
    const routerPath = path.join(__dirname, 'packages/frontend/src/router/router-v2.tsx');
    if (fs.existsSync(routerPath)) {
        let routerContent = fs.readFileSync(routerPath, 'utf8');
        
        // 移除旧的缓存破坏器
        routerContent = routerContent.replace(/\/\* CACHE BUSTER:.*?\*\/\n/g, '');
        
        // 添加新的缓存破坏器
        const importIndex = routerContent.indexOf("import { ModernLayout }");
        if (importIndex !== -1) {
            const beforeImport = routerContent.substring(0, importIndex);
            const afterImport = routerContent.substring(importIndex);
            routerContent = beforeImport + cacheBuster + afterImport;
            
            fs.writeFileSync(routerPath, routerContent);
            console.log('✅ router-v2.tsx 缓存破坏器已添加');
        }
    }
    
    // 更新 ModernLayout
    const layoutPath = path.join(__dirname, 'packages/frontend/src/layouts/ModernLayout.tsx');
    if (fs.existsSync(layoutPath)) {
        let layoutContent = fs.readFileSync(layoutPath, 'utf8');
        
        // 移除旧的缓存破坏器
        layoutContent = layoutContent.replace(/\/\* CACHE BUSTER:.*?\*\/\n/g, '');
        
        // 添加新的缓存破坏器
        const importIndex = layoutContent.indexOf("import React");
        if (importIndex !== -1) {
            const beforeImport = layoutContent.substring(0, importIndex);
            const afterImport = layoutContent.substring(importIndex);
            layoutContent = beforeImport + cacheBuster + afterImport;
            
            fs.writeFileSync(layoutPath, layoutContent);
            console.log('✅ ModernLayout.tsx 缓存破坏器已添加');
        }
    }
}

// 创建强制刷新的 HTML 页面
function createForceRefreshPage() {
    const refreshPageContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🎨 现代化 UI 强制刷新</title>
    <style>
        body {
            font-family: 'Inter', sans-serif;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
            color: white;
            margin: 0;
            padding: 40px;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .container {
            text-align: center;
            max-width: 600px;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
        }
        
        .title {
            font-size: 48px;
            margin-bottom: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .subtitle {
            font-size: 24px;
            margin-bottom: 30px;
            opacity: 0.9;
        }
        
        .button {
            background: #5865f2;
            color: white;
            border: none;
            border-radius: 12px;
            padding: 16px 32px;
            font-size: 18px;
            font-weight: 600;
            cursor: pointer;
            margin: 10px;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-block;
        }
        
        .button:hover {
            background: #4752c4;
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(88, 101, 242, 0.4);
        }
        
        .button.secondary {
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.3);
        }
        
        .button.secondary:hover {
            background: rgba(255, 255, 255, 0.2);
            box-shadow: 0 8px 25px rgba(255, 255, 255, 0.2);
        }
        
        .steps {
            text-align: left;
            margin-top: 30px;
            padding: 20px;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 12px;
        }
        
        .step {
            margin: 10px 0;
            padding: 8px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .step:last-child {
            border-bottom: none;
        }
        
        .status {
            margin-top: 20px;
            padding: 15px;
            border-radius: 8px;
            background: rgba(87, 242, 135, 0.2);
            border: 1px solid rgba(87, 242, 135, 0.3);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="title">🎨</div>
        <h1 class="subtitle">现代化 UI 强制刷新</h1>
        <p>您的现代化 UI 已经完成集成，如果看不到变化，请按以下步骤操作：</p>
        
        <div class="steps">
            <div class="step">1️⃣ 点击下方按钮清除缓存</div>
            <div class="step">2️⃣ 硬刷新浏览器 (Ctrl+Shift+R)</div>
            <div class="step">3️⃣ 访问主应用查看效果</div>
        </div>
        
        <div style="margin-top: 30px;">
            <button class="button" onclick="clearAllCache()">🧹 清除所有缓存</button>
            <a href="http://localhost:3000" class="button">🚀 打开主应用</a>
            <a href="http://localhost:3000/ui-showcase" class="button secondary">🎨 UI 展示</a>
        </div>
        
        <div id="status" class="status" style="display: none;">
            <strong>✅ 缓存已清除！</strong><br>
            现在请硬刷新浏览器 (Ctrl+Shift+R) 并访问主应用
        </div>
    </div>

    <script>
        function clearAllCache() {
            // 清除 localStorage
            localStorage.clear();
            
            // 清除 sessionStorage  
            sessionStorage.clear();
            
            // 清除 cookies
            document.cookie.split(";").forEach(function(c) { 
                document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
            });
            
            // 尝试清除 Service Worker
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(registrations => {
                    registrations.forEach(registration => {
                        registration.unregister();
                    });
                });
            }
            
            // 显示状态
            document.getElementById('status').style.display = 'block';
            
            // 3秒后自动跳转
            setTimeout(() => {
                window.location.href = 'http://localhost:3000';
            }, 3000);
        }
        
        // 页面加载时的提示
        console.log('🎨 现代化 UI 强制刷新页面已加载');
        console.log('📋 如果主应用看不到现代化界面，请点击"清除所有缓存"按钮');
    </script>
</body>
</html>`;

    fs.writeFileSync(path.join(__dirname, 'force-ui-refresh.html'), refreshPageContent);
    console.log('✅ 强制刷新页面已创建: force-ui-refresh.html');
}

// 执行强制刷新操作
console.log('🎯 执行强制刷新操作...');
addCacheBuster();
createForceRefreshPage();

console.log('\n🎉 强制刷新完成！');
console.log('\n📋 下一步操作:');
console.log('1. 打开 force-ui-refresh.html 页面');
console.log('2. 点击"清除所有缓存"按钮');
console.log('3. 硬刷新浏览器 (Ctrl+Shift+R)');
console.log('4. 访问 http://localhost:3000 查看现代化界面');

console.log('\n✨ 预期效果:');
console.log('• Discord 风格的深色侧边导航');
console.log('• 玻璃态半透明主内容区域');
console.log('• 现代化的头部导航栏');
console.log('• 流畅的悬停和点击动画');

console.log('\n🔧 如果仍然看不到变化:');
console.log('1. 重启开发服务器: cd packages/frontend && npm run dev');
console.log('2. 使用隐私模式打开浏览器');
console.log('3. 检查浏览器控制台是否有错误');
console.log('4. 确认访问的是 http://localhost:3000 而不是其他端口');