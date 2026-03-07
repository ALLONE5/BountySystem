#!/usr/bin/env node

/**
 * 修复缓存装饰器导入脚本
 * 为使用缓存装饰器但缺少导入的Service文件添加正确的导入
 */

const fs = require('fs');
const path = require('path');

class CacheImportFixer {
  constructor() {
    this.fixedFiles = 0;
    this.totalFixes = 0;
    this.errors = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : '📝';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async fixCacheImports() {
    this.log('修复缓存装饰器导入...');
    
    const serviceFiles = [
      'packages/backend/src/services/PositionService.ts',
      'packages/backend/src/services/RankingService.ts'
    ];

    for (const filePath of serviceFiles) {
      if (fs.existsSync(filePath)) {
        await this.fixServiceCacheImports(filePath);
      }
    }
  }

  async fixServiceCacheImports(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      let newContent = content;
      let modified = false;

      // 检查是否使用了缓存装饰器但没有导入
      const usesCacheDecorators = 
        content.includes('@Cache(') || 
        content.includes('@RankingCache(') || 
        content.includes('@UserCache(') || 
        content.includes('@TaskCache(') || 
        content.includes('@NotificationCache(') ||
        content.includes('@CacheEvict(');

      const hasImport = content.includes('import { Cache') || content.includes('import { RankingCache');

      if (usesCacheDecorators && !hasImport) {
        // 添加缓存装饰器导入
        const loggerImportMatch = content.match(/import.*logger.*from.*['"]\.\.\/config\/logger\.js['"];/);
        if (loggerImportMatch) {
          const importLine = loggerImportMatch[0];
          let newImport = importLine;
          
          // 根据文件名确定需要导入的装饰器
          if (filePath.includes('RankingService')) {
            newImport += '\nimport { RankingCache, CacheEvict } from \'../utils/decorators/cache.js\';';
          } else if (filePath.includes('PositionService')) {
            newImport += '\nimport { Cache, CacheEvict } from \'../utils/decorators/cache.js\';';
          } else {
            newImport += '\nimport { Cache, CacheEvict } from \'../utils/decorators/cache.js\';';
          }
          
          newContent = newContent.replace(importLine, newImport);
          modified = true;
        } else {
          // 如果没有logger导入，在第一个导入后添加
          const firstImportMatch = content.match(/^import.*from.*['"];$/m);
          if (firstImportMatch) {
            const importLine = firstImportMatch[0];
            let newImport = importLine;
            
            if (filePath.includes('RankingService')) {
              newImport += '\nimport { RankingCache, CacheEvict } from \'../utils/decorators/cache.js\';';
            } else {
              newImport += '\nimport { Cache, CacheEvict } from \'../utils/decorators/cache.js\';';
            }
            
            newContent = newContent.replace(importLine, newImport);
            modified = true;
          }
        }
      }

      if (modified) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        this.fixedFiles++;
        this.totalFixes++;
        this.log(`修复缓存导入: ${path.relative('.', filePath)}`);
      }
    } catch (error) {
      this.errors.push(`修复${filePath}失败: ${error.message}`);
    }
  }

  async run() {
    this.log('🚀 开始修复缓存装饰器导入...');
    
    await this.fixCacheImports();
    
    this.log('✅ 缓存装饰器导入修复完成!', 'success');
    this.log(`修复文件数: ${this.fixedFiles}`);
    this.log(`总修复数: ${this.totalFixes}`);
    
    if (this.errors.length > 0) {
      this.log(`发现 ${this.errors.length} 个问题`, 'error');
      this.errors.forEach(error => this.log(error, 'error'));
    }
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const fixer = new CacheImportFixer();
  fixer.run().catch(console.error);
}

module.exports = CacheImportFixer;