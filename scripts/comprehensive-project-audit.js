const fs = require('fs');
const path = require('path');

const results = {
  unusedFiles: [],
  duplicateCode: [],
  largeFiles: [],
  todoComments: [],
  consoleStatements: [],
  deprecatedPatterns: [],
  missingTests: [],
  redundantDependencies: [],
  unusedImports: [],
  documentationIssues: []
};

// 检查未使用的文件
function checkUnusedFiles() {
  const suspiciousPatterns = [
    'table-fixed-column',
    'fixedColumn',
    'opaque',
    'nuclear',
    'brute',
    'ultimate'
  ];
  
  const frontendUtils = path.join(__dirname, '../packages/frontend/src/utils');
  const frontendStyles = path.join(__dirname, '../packages/frontend/src/styles');
  
  [frontendUtils, frontendStyles].forEach(dir => {
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        if (suspiciousPatterns.some(pattern => file.includes(pattern))) {
          results.unusedFiles.push({
            file: path.join(dir, file),
            reason: 'Suspicious pattern - likely unused table fix attempt'
          });
        }
      });
    }
  });
}

// 检查大文件
function checkLargeFiles() {
  const checkDir = (dir, basePath = '') => {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const fullPath = path.join(dir, file);
      const relativePath = path.join(basePath, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !file.includes('node_modules') && !file.includes('.git')) {
        checkDir(fullPath, relativePath);
      } else if (stat.isFile() && (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js'))) {
        const sizeKB = stat.size / 1024;
        if (sizeKB > 50) {
          results.largeFiles.push({
            file: relativePath,
            size: `${sizeKB.toFixed(2)} KB`,
            lines: fs.readFileSync(fullPath, 'utf-8').split('\n').length
          });
        }
      }
    });
  };
  
  checkDir(path.join(__dirname, '../packages/frontend/src'), 'frontend/src');
  checkDir(path.join(__dirname, '../packages/backend/src'), 'backend/src');
}

// 检查 TODO 注释
function checkTodoComments() {
  const searchDir = (dir, basePath = '') => {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const fullPath = path.join(dir, file);
      const relativePath = path.join(basePath, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !file.includes('node_modules') && !file.includes('.git')) {
        searchDir(fullPath, relativePath);
      } else if (stat.isFile() && (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js'))) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const lines = content.split('\n');
        lines.forEach((line, index) => {
          if (line.includes('TODO') || line.includes('FIXME') || line.includes('HACK')) {
            results.todoComments.push({
              file: relativePath,
              line: index + 1,
              comment: line.trim()
            });
          }
        });
      }
    });
  };
  
  searchDir(path.join(__dirname, '../packages/frontend/src'), 'frontend/src');
  searchDir(path.join(__dirname, '../packages/backend/src'), 'backend/src');
}

// 检查 console 语句
function checkConsoleStatements() {
  const searchDir = (dir, basePath = '') => {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const fullPath = path.join(dir, file);
      const relativePath = path.join(basePath, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !file.includes('node_modules') && !file.includes('.git') && !file.includes('test')) {
        searchDir(fullPath, relativePath);
      } else if (stat.isFile() && (file.endsWith('.ts') || file.endsWith('.tsx')) && !file.includes('.test.')) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const lines = content.split('\n');
        lines.forEach((line, index) => {
          if (line.includes('console.log') || line.includes('console.error') || line.includes('console.warn')) {
            if (!line.trim().startsWith('//')) {
              results.consoleStatements.push({
                file: relativePath,
                line: index + 1,
                statement: line.trim()
              });
            }
          }
        });
      }
    });
  };
  
  searchDir(path.join(__dirname, '../packages/frontend/src'), 'frontend/src');
  searchDir(path.join(__dirname, '../packages/backend/src'), 'backend/src');
}

// 检查废弃的模式
function checkDeprecatedPatterns() {
  const patterns = [
    { pattern: 'StatsCard', reason: 'Should use Card + Statistic instead' },
    { pattern: 'bordered={false}', reason: 'Should use variant="borderless" in Ant Design v5' },
    { pattern: 'message.success', reason: 'Should use custom message utility' }
  ];
  
  const searchDir = (dir, basePath = '') => {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const fullPath = path.join(dir, file);
      const relativePath = path.join(basePath, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !file.includes('node_modules') && !file.includes('.git')) {
        searchDir(fullPath, relativePath);
      } else if (stat.isFile() && (file.endsWith('.ts') || file.endsWith('.tsx'))) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        patterns.forEach(({ pattern, reason }) => {
          if (content.includes(pattern) && !file.includes('StatsCard.tsx')) {
            results.deprecatedPatterns.push({
              file: relativePath,
              pattern,
              reason
            });
          }
        });
      }
    });
  };
  
  searchDir(path.join(__dirname, '../packages/frontend/src'), 'frontend/src');
}

// 检查缺失的测试
function checkMissingTests() {
  const srcDir = path.join(__dirname, '../packages/backend/src/services');
  if (!fs.existsSync(srcDir)) return;
  
  const files = fs.readdirSync(srcDir);
  files.forEach(file => {
    if (file.endsWith('.ts') && !file.endsWith('.test.ts')) {
      const testFile = file.replace('.ts', '.test.ts');
      if (!files.includes(testFile)) {
        results.missingTests.push({
          service: file,
          expectedTest: testFile
        });
      }
    }
  });
}

// 检查根目录的报告文件
function checkDocumentationFiles() {
  const rootDir = path.join(__dirname, '..');
  const files = fs.readdirSync(rootDir);
  
  const reportFiles = files.filter(f => 
    f.endsWith('.md') && 
    (f.includes('REPORT') || f.includes('SUMMARY') || f.includes('COMPLETE') || f.includes('FIX'))
  );
  
  results.documentationIssues.push({
    count: reportFiles.length,
    files: reportFiles,
    suggestion: 'Consider moving to docs/reports/ directory'
  });
}

// 运行所有检查
console.log('🔍 Starting comprehensive project audit...\n');

console.log('1. Checking for unused files...');
checkUnusedFiles();

console.log('2. Checking for large files...');
checkLargeFiles();

console.log('3. Checking for TODO comments...');
checkTodoComments();

console.log('4. Checking for console statements...');
checkConsoleStatements();

console.log('5. Checking for deprecated patterns...');
checkDeprecatedPatterns();

console.log('6. Checking for missing tests...');
checkMissingTests();

console.log('7. Checking documentation files...');
checkDocumentationFiles();

// 输出结果
console.log('\n📊 Audit Results:\n');

console.log(`🗑️  Unused/Suspicious Files: ${results.unusedFiles.length}`);
if (results.unusedFiles.length > 0) {
  console.log('   Files that may be unused:');
  results.unusedFiles.slice(0, 10).forEach(item => {
    console.log(`   - ${path.basename(item.file)}: ${item.reason}`);
  });
  if (results.unusedFiles.length > 10) {
    console.log(`   ... and ${results.unusedFiles.length - 10} more`);
  }
}

console.log(`\n📏 Large Files (>50KB): ${results.largeFiles.length}`);
if (results.largeFiles.length > 0) {
  results.largeFiles.slice(0, 5).forEach(item => {
    console.log(`   - ${item.file}: ${item.size} (${item.lines} lines)`);
  });
}

console.log(`\n📝 TODO Comments: ${results.todoComments.length}`);
if (results.todoComments.length > 0) {
  results.todoComments.slice(0, 5).forEach(item => {
    console.log(`   - ${item.file}:${item.line}`);
  });
}

console.log(`\n🐛 Console Statements: ${results.consoleStatements.length}`);
if (results.consoleStatements.length > 0) {
  results.consoleStatements.slice(0, 5).forEach(item => {
    console.log(`   - ${item.file}:${item.line}`);
  });
}

console.log(`\n⚠️  Deprecated Patterns: ${results.deprecatedPatterns.length}`);
if (results.deprecatedPatterns.length > 0) {
  results.deprecatedPatterns.forEach(item => {
    console.log(`   - ${item.file}: ${item.pattern}`);
  });
}

console.log(`\n🧪 Missing Tests: ${results.missingTests.length}`);
if (results.missingTests.length > 0) {
  results.missingTests.slice(0, 5).forEach(item => {
    console.log(`   - ${item.service} (missing ${item.expectedTest})`);
  });
}

console.log(`\n📄 Documentation Files in Root: ${results.documentationIssues[0]?.count || 0}`);

// 保存详细报告
const reportPath = path.join(__dirname, '../PROJECT_AUDIT_DETAILED_REPORT.json');
fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
console.log(`\n✅ Detailed report saved to: PROJECT_AUDIT_DETAILED_REPORT.json`);
