const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Logo Display Issue...\n');

// 问题分析：
console.log('📋 Problem Analysis:');
console.log('1. SystemConfigContext uses VITE_API_BASE_URL (undefined)');
console.log('2. API client uses VITE_API_URL (also not set)');
console.log('3. Logo URL construction is inconsistent');
console.log('4. Need to standardize the base URL for logo images\n');

// 解决方案：
console.log('🛠️  Solution:');
console.log('1. Update SystemConfigContext to use consistent base URL');
console.log('2. Ensure logo URLs are constructed correctly');
console.log('3. Add proper fallback for development environment\n');

// 修复SystemConfigContext
const systemConfigPath = 'packages/frontend/src/contexts/SystemConfigContext.tsx';
if (fs.existsSync(systemConfigPath)) {
  let content = fs.readFileSync(systemConfigPath, 'utf8');
  
  // 替换VITE_API_BASE_URL为正确的环境变量或默认值
  const oldCode = `      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';`;
  const newCode = `      const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';`;
  
  if (content.includes(oldCode)) {
    content = content.replace(oldCode, newCode);
    fs.writeFileSync(systemConfigPath, content);
    console.log('✅ Updated SystemConfigContext.tsx');
  } else {
    console.log('⚠️  SystemConfigContext.tsx already updated or pattern not found');
  }
} else {
  console.log('❌ SystemConfigContext.tsx not found');
}

console.log('\n🎯 Expected Result:');
console.log('- Logo URLs will be constructed as: http://localhost:3000/uploads/logos/xxx.png');
console.log('- This matches the backend static file serving configuration');
console.log('- Frontend will properly display logos from database configuration');

console.log('\n✅ Fix applied! Please restart the frontend development server.');
console.log('   cd packages/frontend && npm run dev');