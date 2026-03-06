#!/usr/bin/env node

/**
 * 代码重复检测脚本
 * 检测项目中的重复代码模式并生成报告
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class CodeDuplicationDetector {
  constructor() {
    this.duplicates = new Map();
    this.patterns = new Map();
    this.fileContents = new Map();
    this.excludePatterns = [
      /node_modules/,
      /\.git/,
      /dist/,
      /build/,
      /coverage/,
      /\.log$/,
      /\.md$/,
      /\.json$/,
      /\.css$/,
      /\.sql$/
    ];
  }

  /**
   * 检查文件是否应该被排除
   */
  shouldExcludeFile(filePath) {
    return this.excludePatterns.some(pattern => pattern.test(filePath));
  }

  /**
   * 递归读取目录中的所有文件
   */
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
        if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
          files.push(fullPath);
        }
      }
    }
    
    return files;
  }

  /**
   * 读取文件内容并缓存
   */
  getFileContent(filePath) {
    if (!this.fileContents.has(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        this.fileContents.set(filePath, content);
      } catch (error) {
        console.warn(`Warning: Could not read file ${filePath}: ${error.message}`);
        return '';
      }
    }
    return this.fileContents.get(filePath) || '';
  }

  /**
   * 标准化代码行（移除空白和注释）
   */
  normalizeLine(line) {
    return line
      .trim()
      .replace(/\/\/.*$/, '') // 移除单行注释
      .replace(/\/\*.*?\*\//g, '') // 移除多行注释
      .replace(/\s+/g, ' ') // 标准化空白
      .trim();
  }

  /**
   * 检测函数级别的重复
   */
  detectFunctionDuplication(files) {
    const functionPatterns = new Map();
    
    for (const filePath of files) {
      const content = this.getFileContent(filePath);
      const lines = content.split('\n');
      
      // 查找函数定义
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const normalizedLine = this.normalizeLine(line);
        
        // 匹配函数定义模式
        const functionMatch = normalizedLine.match(/^(async\s+)?(function\s+\w+|const\s+\w+\s*=|async\s+\w+|export\s+(const|function)\s+\w+)/);
        
        if (functionMatch) {
          // 提取函数体
          const functionBody = this.extractFunctionBody(lines, i);
          if (functionBody.length > 5) { // 只检查超过5行的函数
            const hash = this.hashCode(functionBody.join('\n'));
            
            if (!functionPatterns.has(hash)) {
              functionPatterns.set(hash, []);
            }
            
            functionPatterns.get(hash).push({
              file: filePath,
              startLine: i + 1,
              endLine: i + functionBody.length,
              functionName: this.extractFunctionName(normalizedLine),
              body: functionBody
            });
          }
        }
      }
    }
    
    // 查找重复的函数
    for (const [hash, functions] of functionPatterns) {
      if (functions.length > 1) {
        this.duplicates.set(`function_${hash}`, {
          type: 'function',
          count: functions.length,
          locations: functions,
          similarity: 100
        });
      }
    }
  }

  /**
   * 提取函数体
   */
  extractFunctionBody(lines, startIndex) {
    const body = [];
    let braceCount = 0;
    let inFunction = false;
    
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      const normalizedLine = this.normalizeLine(line);
      
      if (normalizedLine.includes('{')) {
        inFunction = true;
        braceCount += (normalizedLine.match(/\{/g) || []).length;
      }
      
      if (inFunction) {
        body.push(normalizedLine);
        braceCount -= (normalizedLine.match(/\}/g) || []).length;
        
        if (braceCount <= 0) {
          break;
        }
      }
    }
    
    return body;
  }

  /**
   * 提取函数名
   */
  extractFunctionName(line) {
    const matches = line.match(/(?:function\s+(\w+)|const\s+(\w+)|export\s+(?:const|function)\s+(\w+))/);
    return matches ? (matches[1] || matches[2] || matches[3]) : 'anonymous';
  }

  /**
   * 检测代码块级别的重复
   */
  detectBlockDuplication(files) {
    const blockSize = 5; // 检查5行为一个块
    const blockPatterns = new Map();
    
    for (const filePath of files) {
      const content = this.getFileContent(filePath);
      const lines = content.split('\n').map(line => this.normalizeLine(line)).filter(line => line.length > 0);
      
      // 滑动窗口检查代码块
      for (let i = 0; i <= lines.length - blockSize; i++) {
        const block = lines.slice(i, i + blockSize);
        const blockText = block.join('\n');
        
        if (blockText.trim().length > 50) { // 只检查有意义的代码块
          const hash = this.hashCode(blockText);
          
          if (!blockPatterns.has(hash)) {
            blockPatterns.set(hash, []);
          }
          
          blockPatterns.get(hash).push({
            file: filePath,
            startLine: i + 1,
            endLine: i + blockSize,
            block: block
          });
        }
      }
    }
    
    // 查找重复的代码块
    for (const [hash, blocks] of blockPatterns) {
      if (blocks.length > 1) {
        this.duplicates.set(`block_${hash}`, {
          type: 'block',
          count: blocks.length,
          locations: blocks,
          similarity: 100
        });
      }
    }
  }

  /**
   * 检测错误处理模式的重复
   */
  detectErrorHandlingPatterns(files) {
    const errorPatterns = [];
    
    for (const filePath of files) {
      const content = this.getFileContent(filePath);
      const lines = content.split('\n');
      
      for (let i = 0; i < lines.length; i++) {
        const line = this.normalizeLine(lines[i]);
        
        // 检测 try-catch 模式
        if (line.includes('try {')) {
          const pattern = this.extractTryCatchPattern(lines, i);
          if (pattern) {
            errorPatterns.push({
              file: filePath,
              startLine: i + 1,
              pattern: pattern,
              type: 'try-catch'
            });
          }
        }
        
        // 检测 console.error 模式
        if (line.includes('console.error')) {
          errorPatterns.push({
            file: filePath,
            line: i + 1,
            pattern: line,
            type: 'console-error'
          });
        }
        
        // 检测 message.error 模式
        if (line.includes('message.error')) {
          errorPatterns.push({
            file: filePath,
            line: i + 1,
            pattern: line,
            type: 'message-error'
          });
        }
      }
    }
    
    // 分组相似的错误处理模式
    const groupedPatterns = this.groupSimilarPatterns(errorPatterns);
    
    for (const [pattern, occurrences] of groupedPatterns) {
      if (occurrences.length > 2) {
        this.duplicates.set(`error_pattern_${this.hashCode(pattern)}`, {
          type: 'error-handling',
          count: occurrences.length,
          locations: occurrences,
          pattern: pattern,
          similarity: 90
        });
      }
    }
  }

  /**
   * 提取 try-catch 模式
   */
  extractTryCatchPattern(lines, startIndex) {
    const pattern = [];
    let braceCount = 0;
    let inTry = false;
    
    for (let i = startIndex; i < lines.length && i < startIndex + 20; i++) {
      const line = this.normalizeLine(lines[i]);
      
      if (line.includes('try {')) {
        inTry = true;
        braceCount = 1;
        pattern.push('try {');
        continue;
      }
      
      if (inTry) {
        if (line.includes('catch')) {
          pattern.push('catch (error) {');
          continue;
        }
        
        if (line.includes('console.error') || line.includes('logger.error')) {
          pattern.push('error_logging');
        } else if (line.includes('throw')) {
          pattern.push('throw_error');
        } else if (line.includes('return')) {
          pattern.push('return_value');
        }
        
        braceCount += (line.match(/\{/g) || []).length;
        braceCount -= (line.match(/\}/g) || []).length;
        
        if (braceCount <= 0) {
          break;
        }
      }
    }
    
    return pattern.length > 2 ? pattern.join(' -> ') : null;
  }

  /**
   * 分组相似的模式
   */
  groupSimilarPatterns(patterns) {
    const groups = new Map();
    
    for (const pattern of patterns) {
      const key = pattern.type === 'try-catch' ? pattern.pattern : pattern.pattern.substring(0, 50);
      
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      
      groups.get(key).push(pattern);
    }
    
    return groups;
  }

  /**
   * 生成代码哈希
   */
  hashCode(str) {
    return crypto.createHash('md5').update(str).digest('hex').substring(0, 8);
  }

  /**
   * 生成报告
   */
  generateReport() {
    const report = {
      summary: {
        totalDuplicates: this.duplicates.size,
        functionDuplicates: 0,
        blockDuplicates: 0,
        errorHandlingDuplicates: 0
      },
      duplicates: []
    };
    
    for (const [id, duplicate] of this.duplicates) {
      report.duplicates.push({
        id,
        type: duplicate.type,
        count: duplicate.count,
        similarity: duplicate.similarity,
        locations: duplicate.locations.map(loc => ({
          file: path.relative(process.cwd(), loc.file),
          startLine: loc.startLine || loc.line,
          endLine: loc.endLine,
          functionName: loc.functionName
        }))
      });
      
      // 更新统计
      if (duplicate.type === 'function') {
        report.summary.functionDuplicates++;
      } else if (duplicate.type === 'block') {
        report.summary.blockDuplicates++;
      } else if (duplicate.type === 'error-handling') {
        report.summary.errorHandlingDuplicates++;
      }
    }
    
    // 按重复次数排序
    report.duplicates.sort((a, b) => b.count - a.count);
    
    return report;
  }

  /**
   * 运行检测
   */
  async run(projectPath = '.') {
    console.log('🔍 开始检测代码重复...');
    
    const files = this.readDirectory(projectPath);
    console.log(`📁 找到 ${files.length} 个代码文件`);
    
    console.log('🔍 检测函数级重复...');
    this.detectFunctionDuplication(files);
    
    console.log('🔍 检测代码块重复...');
    this.detectBlockDuplication(files);
    
    console.log('🔍 检测错误处理模式重复...');
    this.detectErrorHandlingPatterns(files);
    
    const report = this.generateReport();
    
    // 输出报告
    console.log('\n📊 代码重复检测报告');
    console.log('='.repeat(50));
    console.log(`总重复项: ${report.summary.totalDuplicates}`);
    console.log(`函数重复: ${report.summary.functionDuplicates}`);
    console.log(`代码块重复: ${report.summary.blockDuplicates}`);
    console.log(`错误处理重复: ${report.summary.errorHandlingDuplicates}`);
    
    if (report.duplicates.length > 0) {
      console.log('\n🔥 Top 10 重复项:');
      report.duplicates.slice(0, 10).forEach((dup, index) => {
        console.log(`\n${index + 1}. ${dup.type.toUpperCase()} - 重复 ${dup.count} 次`);
        dup.locations.forEach(loc => {
          console.log(`   📄 ${loc.file}:${loc.startLine}${loc.functionName ? ` (${loc.functionName})` : ''}`);
        });
      });
    }
    
    // 保存详细报告
    const reportPath = path.join(projectPath, 'code-duplication-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📋 详细报告已保存到: ${reportPath}`);
    
    return report;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const detector = new CodeDuplicationDetector();
  detector.run(process.argv[2] || '.').catch(console.error);
}

module.exports = CodeDuplicationDetector;