#!/usr/bin/env node

/**
 * 同时启动两个前端进行对比
 * - 当前前端: http://localhost:5173
 * - 备份前端: http://localhost:5174
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 启动两个前端进行对比...\n');

// 启动当前前端
console.log('📦 启动当前前端 (端口 5173)...');
const frontend = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, '../packages/frontend'),
  shell: true,
  stdio: 'inherit'
});

// 启动备份前端
console.log('📦 启动备份前端 (端口 5174)...\n');
const frontendBak = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, '../packages/frontend-bak'),
  shell: true,
  stdio: 'inherit'
});

console.log('✅ 两个前端已启动！\n');
console.log('📍 访问地址:');
console.log('   当前前端: http://localhost:5173');
console.log('   备份前端: http://localhost:5174\n');
console.log('💡 提示: 按 Ctrl+C 停止所有服务\n');

// 处理退出
process.on('SIGINT', () => {
  console.log('\n\n🛑 停止所有前端服务...');
  frontend.kill();
  frontendBak.kill();
  process.exit();
});

frontend.on('exit', (code) => {
  if (code !== 0) {
    console.error('❌ 当前前端退出，代码:', code);
  }
});

frontendBak.on('exit', (code) => {
  if (code !== 0) {
    console.error('❌ 备份前端退出，代码:', code);
  }
});
