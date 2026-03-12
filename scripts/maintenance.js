#!/usr/bin/env node

/**
 * 项目维护工具
 * 统一的维护脚本，包含常用的维护功能
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');

// 显示帮助信息
function showHelp() {
  console.log(`
📦 项目维护工具

用法: node scripts/maintenance.js <command>

命令:
  audit          - 运行项目审计，检查未使用的文件
  clean-temp     - 清理临时文件和备份文件
  clean-cache    - 清理前端和后端缓存
  clean-debug    - 清理代码中的调试日志
  check-types    - 检查 TypeScript 类型错误
  check-imports  - 检查未使用的导入
  list-scripts   - 列出所有可用的脚本
  help           - 显示此帮助信息

示例:
  node scripts/maintenance.js audit
  node scripts/maintenance.js clean-temp
  node scripts/maintenance.js clean-cache
  node scripts/maintenance.js clean-debug
  node scripts/maintenance.js check-types
`);
}

// 运行项目审计
function runAudit() {
  console.log('🔍 运行项目审计...\n');
  
  try {
    execSync('node scripts/comprehensive-project-audit.js', {
      cwd: rootDir,
      stdio: 'inherit'
    });
  } catch (error) {
    console.error('❌ 审计失败');
    process.exit(1);
  }
}

// 清理临时文件
function cleanTemp() {
  console.log('🧹 清理临时文件...\n');
  
  let totalDeleted = 0;
  
  // 查找临时文件
  const findTempFiles = (dir, extensions = ['.bak', '.old', '.tmp', '.swp', '.swo']) => {
    const files = [];
    
    const walk = (currentDir) => {
      if (currentDir.includes('node_modules') || currentDir.includes('.git')) {
        return;
      }
      
      try {
        const items = fs.readdirSync(currentDir);
        items.forEach(item => {
          const fullPath = path.join(currentDir, item);
          try {
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
              walk(fullPath);
            } else {
              const ext = path.extname(item);
              if (extensions.includes(ext) || item.endsWith('~')) {
                files.push(fullPath);
              }
            }
          } catch (err) {
            // Skip
          }
        });
      } catch (error) {
        // Skip
      }
    };
    
    walk(dir);
    return files;
  };
  
  const packagesDir = path.join(rootDir, 'packages');
  const tempFiles = findTempFiles(packagesDir);
  
  if (tempFiles.length > 0) {
    console.log(`   发现 ${tempFiles.length} 个临时文件:`);
    tempFiles.forEach(file => {
      const relativePath = path.relative(rootDir, file);
      console.log(`   - ${relativePath}`);
      try {
        fs.unlinkSync(file);
        console.log(`     ✅ 已删除`);
        totalDeleted++;
      } catch (error) {
        console.log(`     ❌ 删除失败: ${error.message}`);
      }
    });
  } else {
    console.log('   ✅ 未发现临时文件');
  }
  
  console.log(`\n   总共删除: ${totalDeleted} 个文件\n`);
}

// 检查 TypeScript 类型
function checkTypes() {
  console.log('🔍 检查 TypeScript 类型...\n');
  
  console.log('检查前端...');
  try {
    execSync('npx tsc --noEmit', {
      cwd: path.join(rootDir, 'packages/frontend'),
      stdio: 'inherit'
    });
    console.log('✅ 前端类型检查通过\n');
  } catch (error) {
    console.error('❌ 前端类型检查失败\n');
  }
  
  console.log('检查后端...');
  try {
    execSync('npx tsc --noEmit', {
      cwd: path.join(rootDir, 'packages/backend'),
      stdio: 'inherit'
    });
    console.log('✅ 后端类型检查通过\n');
  } catch (error) {
    console.error('❌ 后端类型检查失败\n');
  }
}

// 检查未使用的导入
function checkImports() {
  console.log('🔍 检查未使用的导入...\n');
  console.log('提示: 使用 ESLint 或 TypeScript 编译器检查未使用的导入');
  console.log('运行: npx eslint . --ext .ts,.tsx\n');
}

// 列出所有脚本
function listScripts() {
  console.log('📋 可用的脚本:\n');
  
  console.log('维护脚本 (scripts/):');
  const scriptsDir = path.join(rootDir, 'scripts');
  if (fs.existsSync(scriptsDir)) {
    const scripts = fs.readdirSync(scriptsDir).filter(f => f.endsWith('.js'));
    scripts.forEach(script => {
      console.log(`  - ${script}`);
    });
  }
  
  console.log('\n后端脚本 (packages/backend/scripts/):');
  const backendScriptsDir = path.join(rootDir, 'packages/backend/scripts');
  if (fs.existsSync(backendScriptsDir)) {
    const scripts = fs.readdirSync(backendScriptsDir);
    scripts.forEach(script => {
      const type = script.includes('seed') || script.includes('test') ? '(种子/测试)' : '(工具)';
      console.log(`  - ${script} ${type}`);
    });
  }
  
  console.log();
}

// 清理缓存
function cleanCache() {
  console.log('🧹 清理缓存...\n');
  
  const cacheDirs = [
    'packages/frontend/node_modules/.vite',
    'packages/frontend/dist',
    'packages/backend/dist',
    'packages/backend/node_modules/.cache'
  ];
  
  let totalDeleted = 0;
  
  cacheDirs.forEach(dir => {
    const fullPath = path.join(rootDir, dir);
    if (fs.existsSync(fullPath)) {
      console.log(`   删除: ${dir}`);
      try {
        fs.rmSync(fullPath, { recursive: true, force: true });
        console.log(`     ✅ 已删除`);
        totalDeleted++;
      } catch (error) {
        console.log(`     ❌ 删除失败: ${error.message}`);
      }
    } else {
      console.log(`   ✓ ${dir} 不存在`);
    }
  });
  
  console.log(`\n   总共删除: ${totalDeleted} 个缓存目录\n`);
}

// 清理调试日志
function cleanDebugLogs() {
  console.log('🧹 清理调试日志...\n');
  console.log('提示: 这将扫描代码中的 console.log 语句');
  console.log('建议手动审查后再删除\n');
  
  try {
    execSync('node scripts/comprehensive-project-audit.js', {
      cwd: rootDir,
      stdio: 'inherit'
    });
  } catch (error) {
    console.error('❌ 审计失败');
  }
}

// 主函数
function main() {
  const command = process.argv[2];
  
  if (!command || command === 'help') {
    showHelp();
    return;
  }
  
  switch (command) {
    case 'audit':
      runAudit();
      break;
    case 'clean-temp':
      cleanTemp();
      break;
    case 'clean-cache':
      cleanCache();
      break;
    case 'clean-debug':
      cleanDebugLogs();
      break;
    case 'check-types':
      checkTypes();
      break;
    case 'check-imports':
      checkImports();
      break;
    case 'list-scripts':
      listScripts();
      break;
    default:
      console.error(`❌ 未知命令: ${command}`);
      console.log('运行 "node scripts/maintenance.js help" 查看帮助\n');
      process.exit(1);
  }
}

main();
