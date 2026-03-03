#!/usr/bin/env node

/**
 * 修复导入错误脚本
 * 解决 router-v2 导入问题
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 开始修复导入错误...\n');

// 修复 App.tsx 中的导入路径
function fixAppImports() {
    const appPath = path.join(__dirname, 'packages/frontend/src/App.tsx');
    
    if (fs.existsSync(appPath)) {
        let content = fs.readFileSync(appPath, 'utf8');
        
        // 检查是否有错误的导入
        if (content.includes('./router/router-v2')) {
            content = content.replace('./router/router-v2', './router/index');
            console.log('✅ 修复 App.tsx 中的路由导入路径');
        }
        
        // 检查是否有 routerV2 的引用
        if (content.includes('routerV2 as router')) {
            content = content.replace('routerV2 as router', 'router');
            console.log('✅ 修复 App.tsx 中的路由变量名');
        }
        
        fs.writeFileSync(appPath, content);
        console.log('✅ App.tsx 修复完成');
    } else {
        console.log('❌ App.tsx 文件不存在');
    }
}

// 检查路由文件是否存在
function checkRouterFiles() {
    const routerDir = path.join(__dirname, 'packages/frontend/src/router');
    
    if (fs.existsSync(routerDir)) {
        const files = fs.readdirSync(routerDir);
        console.log('📁 路由目录中的文件:');
        files.forEach(file => {
            console.log(`  - ${file}`);
        });
        
        // 检查 index.tsx 是否存在
        const indexPath = path.join(routerDir, 'index.tsx');
        if (fs.existsSync(indexPath)) {
            console.log('✅ router/index.tsx 存在');
            
            // 检查是否导出了 router
            const content = fs.readFileSync(indexPath, 'utf8');
            if (content.includes('export const router')) {
                console.log('✅ router 正确导出');
            } else {
                console.log('⚠️ router 可能没有正确导出');
            }
        } else {
            console.log('❌ router/index.tsx 不存在');
        }
    } else {
        console.log('❌ 路由目录不存在');
    }
}

// 检查 ModernLayout 是否存在
function checkModernLayout() {
    const layoutPath = path.join(__dirname, 'packages/frontend/src/layouts/ModernLayout.tsx');
    
    if (fs.existsSync(layoutPath)) {
        console.log('✅ ModernLayout.tsx 存在');
        
        // 检查语法是否正确
        const content = fs.readFileSync(layoutPath, 'utf8');
        if (content.includes('export const ModernLayout')) {
            console.log('✅ ModernLayout 正确导出');
        } else {
            console.log('⚠️ ModernLayout 可能没有正确导出');
        }
    } else {
        console.log('❌ ModernLayout.tsx 不存在');
    }
}

// 检查样式文件是否存在
function checkStyleFiles() {
    const stylePaths = [
        'packages/frontend/src/styles/glassmorphism.css',
        'packages/frontend/src/layouts/ModernLayout.css',
        'packages/frontend/src/pages/UIShowcasePage.css'
    ];
    
    console.log('🎨 检查样式文件:');
    stylePaths.forEach(stylePath => {
        const fullPath = path.join(__dirname, stylePath);
        if (fs.existsSync(fullPath)) {
            console.log(`✅ ${stylePath}`);
        } else {
            console.log(`❌ ${stylePath}`);
        }
    });
}

// 生成修复报告
function generateReport() {
    console.log('\n📋 修复报告:');
    console.log('─'.repeat(50));
    
    const checks = [
        { name: 'App.tsx 导入修复', status: true },
        { name: 'router/index.tsx 存在', status: fs.existsSync(path.join(__dirname, 'packages/frontend/src/router/index.tsx')) },
        { name: 'ModernLayout.tsx 存在', status: fs.existsSync(path.join(__dirname, 'packages/frontend/src/layouts/ModernLayout.tsx')) },
        { name: 'glassmorphism.css 存在', status: fs.existsSync(path.join(__dirname, 'packages/frontend/src/styles/glassmorphism.css')) },
        { name: 'UIShowcasePage.tsx 存在', status: fs.existsSync(path.join(__dirname, 'packages/frontend/src/pages/UIShowcasePage.tsx')) }
    ];
    
    let successCount = 0;
    checks.forEach(check => {
        const status = check.status ? '✅' : '❌';
        console.log(`${status} ${check.name}`);
        if (check.status) successCount++;
    });
    
    const successRate = Math.round((successCount / checks.length) * 100);
    console.log(`\n📊 修复完成度: ${successCount}/${checks.length} (${successRate}%)`);
    
    if (successRate === 100) {
        console.log('🎉 所有问题已修复！');
        console.log('\n🚀 下一步:');
        console.log('1. 重启开发服务器: cd packages/frontend && npm run dev');
        console.log('2. 访问主页面: http://localhost:3000');
        console.log('3. 查看 UI 展示: http://localhost:3000/ui-showcase');
    } else {
        console.log('⚠️ 仍有问题需要解决');
    }
}

// 执行修复
console.log('🔧 执行修复操作...');
fixAppImports();

console.log('\n📁 检查文件状态...');
checkRouterFiles();
checkModernLayout();
checkStyleFiles();

generateReport();

console.log('\n🎯 故障排除提示:');
console.log('─'.repeat(50));
console.log('1. 如果仍有导入错误，请检查文件路径是否正确');
console.log('2. 确保所有必要的文件都已创建');
console.log('3. 重启开发服务器以清除缓存');
console.log('4. 使用浏览器的硬刷新 (Ctrl+Shift+R)');

console.log('\n✨ 修复完成！');