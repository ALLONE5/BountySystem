#!/usr/bin/env node

/**
 * 前端组件重构脚本
 * 批量重构前端组件，应用新的 Hook 和最佳实践
 */

const fs = require('fs');
const path = require('path');

class FrontendComponentRefactor {
  constructor() {
    this.refactoredFiles = 0;
    this.totalReplacements = 0;
    this.excludePatterns = [
      /node_modules/,
      /\.git/,
      /dist/,
      /build/,
      /coverage/,
      /scripts/,
      /useErrorHandler\.ts/,
      /useDataFetch\.ts/,
      /logger\.ts/
    ];
  }

  shouldExcludeFile(filePath) {
    return this.excludePatterns.some(pattern => pattern.test(filePath));
  }

  readDirectory(dirPath, files = []) {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        if (!this.shouldExcludeFile(fullPath)) {
          this.readDirectory(fullPath, files);
        }
      } else if (stat.isFile() && !this.shouldExcludeFile(fullPath)) {
        if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
          files.push(fullPath);
        }
      }
    }
    
    return files;
  }

  refactorComponent(filePath, content) {
    let modified = false;
    let newContent = content;
    
    // 检查是否是 React 组件文件
    if (!content.includes('React.FC') && !content.includes('function ') && !content.includes('const ')) {
      return { content: newContent, modified: false };
    }

    // 1. 添加必要的导入
    const hasErrorHandlerImport = content.includes('useErrorHandler');
    const hasDataFetchImport = content.includes('useDataFetch');
    
    if (!hasErrorHandlerImport && (content.includes('try {') || content.includes('catch'))) {
      const importMatch = content.match(/^import.*from.*['"];$/gm);
      if (importMatch && importMatch.length > 0) {
        const lastImport = importMatch[importMatch.length - 1];
        const lastImportIndex = content.indexOf(lastImport) + lastImport.length;
        
        newContent = newContent.slice(0, lastImportIndex) + 
                    `\nimport { useErrorHandler } from '../hooks/useErrorHandler';` + 
                    newContent.slice(lastImportIndex);
        modified = true;
      }
    }

    // 2. 重构数据获取模式
    const dataFetchPatterns = [
      // 模式1: useState + useEffect + API 调用
      {
        pattern: /const \[(\w+), set(\w+)\] = useState<([^>]*)>\(([^)]*)\);\s*const \[(\w+), set(\w+)\] = useState<boolean>\(false\);\s*const \[(\w+), set(\w+)\] = useState<([^>]*)>\(null\);\s*useEffect\(\(\) => \{[^}]*async[^}]*\(\) => \{[^}]*try[^}]*set\w+\(true\);[^}]*const[^}]*await[^}]*\([^)]*\);[^}]*set\w+\([^)]*\);[^}]*\} catch[^}]*\{[^}]*set\w+\([^)]*\);[^}]*\} finally[^}]*\{[^}]*set\w+\(false\);[^}]*\}[^}]*\}[^}]*\(\);[^}]*\}, \[[^\]]*\]\);/gs,
        replacement: (match) => {
          this.totalReplacements++;
          return `const { data: $1, loading: $5, error: $7, refetch } = useDataFetch(
    () => apiCall(),
    [],
    {
      errorMessage: '数据加载失败',
      context: 'ComponentName.fetchData'
    }
  );`;
        }
      }
    ];

    // 应用数据获取模式重构
    for (const { pattern, replacement } of dataFetchPatterns) {
      if (pattern.test(newContent)) {
        newContent = newContent.replace(pattern, replacement);
        modified = true;
      }
    }

    // 3. 重构错误处理模式
    const errorHandlingPatterns = [
      // 模式1: try-catch with message.error
      {
        pattern: /try\s*\{([^}]*)\}\s*catch\s*\([^)]*error[^)]*\)\s*\{[^}]*message\.error\([^)]*\);?[^}]*\}/gs,
        replacement: (match, tryBlock) => {
          this.totalReplacements++;
          return `await handleAsyncError(async () => {${tryBlock}}, 'operation', undefined, '操作失败')`;
        }
      },
      // 模式2: 简单的错误处理
      {
        pattern: /catch\s*\([^)]*error[^)]*\)\s*\{[^}]*console\.error\([^)]*\);?[^}]*message\.error\([^)]*\);?[^}]*\}/gs,
        replacement: (match) => {
          this.totalReplacements++;
          return `catch (error) { handleError(error, '操作失败', { context: 'operation' }); }`;
        }
      }
    ];

    // 应用错误处理模式重构
    for (const { pattern, replacement } of errorHandlingPatterns) {
      if (pattern.test(newContent)) {
        newContent = newContent.replace(pattern, replacement);
        modified = true;
      }
    }

    // 4. 在组件函数中添加 Hook
    if (!hasErrorHandlerImport && content.includes('React.FC')) {
      const componentMatch = newContent.match(/export const \w+: React\.FC[^=]*= \([^)]*\) => \{/);
      if (componentMatch) {
        const hookInsertPoint = componentMatch.index + componentMatch[0].length;
        newContent = newContent.slice(0, hookInsertPoint) + 
                    `\n  const { handleError, handleAsyncError } = useErrorHandler();` + 
                    newContent.slice(hookInsertPoint);
        modified = true;
      }
    }

    // 5. 重构常见的加载状态模式
    const loadingPatterns = [
      // 模式: setLoading(true) ... setLoading(false)
      {
        pattern: /setLoading\(true\);([^}]*?)setLoading\(false\);/gs,
        replacement: (match, content) => {
          if (content.includes('await') && content.includes('try')) {
            this.totalReplacements++;
            return `await handleAsyncError(async () => {${content}}, 'operation')`;
          }
          return match;
        }
      }
    ];

    // 应用加载状态模式重构
    for (const { pattern, replacement } of loadingPatterns) {
      if (pattern.test(newContent)) {
        newContent = newContent.replace(pattern, replacement);
        modified = true;
      }
    }

    return { content: newContent, modified };
  }

  refactorFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // 只处理前端文件
      if (!filePath.includes('packages/frontend/')) {
        return false;
      }

      const result = this.refactorComponent(filePath, content);

      if (result.modified) {
        fs.writeFileSync(filePath, result.content, 'utf8');
        this.refactoredFiles++;
        return true;
      }

      return false;
    } catch (error) {
      console.error(`Error refactoring file ${filePath}:`, error.message);
      return false;
    }
  }

  generateRefactorReport(files) {
    const report = {
      totalFiles: files.length,
      refactoredFiles: this.refactoredFiles,
      totalReplacements: this.totalReplacements,
      refactoredFilesList: [],
      recommendations: []
    };

    // 分析需要手动处理的文件
    for (const filePath of files) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // 检查复杂的状态管理
        if (content.includes('useState') && content.match(/useState/g).length > 5) {
          report.recommendations.push({
            file: path.relative('.', filePath),
            issue: '复杂状态管理',
            suggestion: '考虑使用 useReducer 或状态管理库'
          });
        }

        // 检查大型组件
        const lines = content.split('\n').length;
        if (lines > 300) {
          report.recommendations.push({
            file: path.relative('.', filePath),
            issue: '组件过大',
            suggestion: `组件有 ${lines} 行，建议拆分为更小的组件`
          });
        }

        // 检查内联样式
        if (content.includes('style={{')) {
          const styleCount = (content.match(/style=\{\{/g) || []).length;
          if (styleCount > 3) {
            report.recommendations.push({
              file: path.relative('.', filePath),
              issue: '过多内联样式',
              suggestion: `发现 ${styleCount} 个内联样式，建议使用 CSS 类`
            });
          }
        }
      } catch (error) {
        // 忽略读取错误
      }
    }

    return report;
  }

  async run(projectPath = '.') {
    console.log('🔧 开始重构前端组件...');
    
    const files = this.readDirectory(path.join(projectPath, 'packages/frontend/src'));
    console.log(`📁 找到 ${files.length} 个前端文件`);
    
    for (const filePath of files) {
      const refactored = this.refactorFile(filePath);
      if (refactored) {
        console.log(`✅ 重构: ${path.relative(projectPath, filePath)}`);
      }
    }
    
    // 生成重构报告
    const report = this.generateRefactorReport(files);
    
    console.log('\n📊 重构完成!');
    console.log(`重构文件数: ${report.refactoredFiles}/${report.totalFiles}`);
    console.log(`总替换数: ${report.totalReplacements}`);
    
    if (report.recommendations.length > 0) {
      console.log('\n💡 优化建议:');
      report.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec.file}`);
        console.log(`   问题: ${rec.issue}`);
        console.log(`   建议: ${rec.suggestion}`);
      });
    }
    
    // 保存详细报告
    fs.writeFileSync(
      path.join(projectPath, 'FRONTEND_REFACTOR_REPORT.json'),
      JSON.stringify(report, null, 2)
    );
    
    return report;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const refactor = new FrontendComponentRefactor();
  refactor.run(process.argv[2] || '.').catch(console.error);
}

module.exports = FrontendComponentRefactor;