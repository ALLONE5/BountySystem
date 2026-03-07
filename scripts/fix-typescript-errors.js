#!/usr/bin/env node

/**
 * TypeScript错误修复脚本
 * 自动修复常见的TypeScript编译错误
 */

const fs = require('fs');
const path = require('path');

class TypeScriptErrorFixer {
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

  async fixLoggerImports() {
    this.log('修复logger导入问题...');
    
    const filesToFix = [
      'packages/frontend/src/components/BountyHistoryDrawer.tsx',
      'packages/frontend/src/components/common/InviteMemberModal.tsx',
      'packages/frontend/src/components/ErrorBoundary.tsx',
      'packages/frontend/src/components/Settings/TimezoneSettings.tsx',
      'packages/frontend/src/components/TaskAssistants.tsx',
      'packages/frontend/src/components/TaskDetailDrawer.tsx',
      'packages/frontend/src/contexts/NotificationContext.tsx',
      'packages/frontend/src/hooks/useCrudOperations.ts',
      'packages/frontend/src/hooks/useWebSocket.ts'
    ];

    for (const filePath of filesToFix) {
      if (fs.existsSync(filePath)) {
        await this.addLoggerImport(filePath);
      }
    }
  }

  async addLoggerImport(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // 检查是否已经导入了logger
      if (content.includes("import { logger }")) {
        return false;
      }

      // 找到导入语句的位置
      const importMatch = content.match(/^import.*from.*['"];$/gm);
      if (importMatch && importMatch.length > 0) {
        const lastImport = importMatch[importMatch.length - 1];
        const lastImportIndex = content.indexOf(lastImport) + lastImport.length;
        
        const newContent = content.slice(0, lastImportIndex) + 
                          `\nimport { logger } from '../utils/logger';` + 
                          content.slice(lastImportIndex);
        
        fs.writeFileSync(filePath, newContent, 'utf8');
        this.fixedFiles++;
        this.totalFixes++;
        this.log(`Added logger import to: ${path.relative('.', filePath)}`);
        return true;
      }
    } catch (error) {
      this.errors.push(`Logger import error in ${filePath}: ${error.message}`);
    }
    return false;
  }

  async fixAnimationTypeErrors() {
    this.log('修复动画类型错误...');
    
    const animationFile = 'packages/frontend/src/components/animations/AnimationEffects.tsx';
    if (fs.existsSync(animationFile)) {
      let content = fs.readFileSync(animationFile, 'utf8');
      
      // 修复AnimationStyle类型定义
      const typeDefPattern = /type AnimationStyle = 'minimal' \| 'scanline';/;
      if (typeDefPattern.test(content)) {
        content = content.replace(
          typeDefPattern,
          `type AnimationStyle = 'minimal' | 'scanline' | 'particles' | 'hexagon' | 'datastream' | 'hologram' | 'ripple' | 'matrix';`
        );
        
        fs.writeFileSync(animationFile, content, 'utf8');
        this.fixedFiles++;
        this.totalFixes++;
        this.log('Fixed AnimationStyle type definition');
      }
    }
  }

  async fixGanttChartErrors() {
    this.log('修复Gantt图表类型错误...');
    
    const ganttFile = 'packages/frontend/src/components/Gantt/GanttChart.tsx';
    if (fs.existsSync(ganttFile)) {
      let content = fs.readFileSync(ganttFile, 'utf8');
      let modified = false;

      // 修复日期类型错误
      const dateFixPatterns = [
        {
          pattern: /new Date\(t\.plannedStartDate\)/g,
          replacement: 'new Date(t.plannedStartDate || new Date())'
        },
        {
          pattern: /new Date\(t\.plannedEndDate\)/g,
          replacement: 'new Date(t.plannedEndDate || new Date())'
        },
        {
          pattern: /new Date\(d\.plannedStartDate\)/g,
          replacement: 'new Date(d.plannedStartDate || new Date())'
        },
        {
          pattern: /new Date\(d\.plannedEndDate\)/g,
          replacement: 'new Date(d.plannedEndDate || new Date())'
        }
      ];

      for (const { pattern, replacement } of dateFixPatterns) {
        if (pattern.test(content)) {
          content = content.replace(pattern, replacement);
          modified = true;
        }
      }

      // 修复progress可能为undefined的问题
      const progressPattern = /sum \+ t\.progress/g;
      if (progressPattern.test(content)) {
        content = content.replace(progressPattern, 'sum + (t.progress || 0)');
        modified = true;
      }

      if (modified) {
        fs.writeFileSync(ganttFile, content, 'utf8');
        this.fixedFiles++;
        this.totalFixes += 3;
        this.log('Fixed GanttChart type errors');
      }
    }
  }

  async fixUserTypeErrors() {
    this.log('修复User类型错误...');
    
    const testFile = 'packages/frontend/src/components/ProtectedRoute.test.tsx';
    if (fs.existsSync(testFile)) {
      let content = fs.readFileSync(testFile, 'utf8');
      
      // 修复mockUser对象，添加缺失的属性
      const mockUserPattern = /const mockUser = \{[\s\S]*?\};/;
      const mockUserMatch = content.match(mockUserPattern);
      
      if (mockUserMatch) {
        const newMockUser = `const mockUser = {
    id: 'test-user-id',
    username: 'testuser',
    email: 'test@example.com',
    avatarId: 'avatar-1',
    role: UserRole.USER,
    positions: [],
    balance: 100,
    bounty: 0,
    createdAt: new Date(),
    lastLogin: new Date(),
    updatedAt: new Date()
  };`;
        
        content = content.replace(mockUserPattern, newMockUser);
        fs.writeFileSync(testFile, content, 'utf8');
        this.fixedFiles++;
        this.totalFixes++;
        this.log('Fixed User type in ProtectedRoute test');
      }
    }
  }

  async fixTaskDetailDrawerProps() {
    this.log('修复TaskDetailDrawer属性错误...');
    
    const taskDetailFile = 'packages/frontend/src/components/TaskDetailDrawer.tsx';
    if (fs.existsSync(taskDetailFile)) {
      let content = fs.readFileSync(taskDetailFile, 'utf8');
      
      // 修复editSubtaskModalVisible属性名
      const propPattern = /editSubtaskModalVisible=/g;
      if (propPattern.test(content)) {
        content = content.replace(propPattern, 'editModalVisible=');
        fs.writeFileSync(taskDetailFile, content, 'utf8');
        this.fixedFiles++;
        this.totalFixes++;
        this.log('Fixed TaskDetailDrawer props');
      }
    }
  }

  async fixAdminPageErrors() {
    this.log('修复管理页面错误...');
    
    const adminFiles = [
      'packages/frontend/src/pages/admin/ApplicationReviewPage.tsx',
      'packages/frontend/src/pages/admin/PositionManagementPage.tsx',
      'packages/frontend/src/pages/admin/UserManagementPage.tsx'
    ];

    for (const filePath of adminFiles) {
      if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        // 修复PositionApplication导入
        if (content.includes('PositionApplication') && !content.includes('import type')) {
          content = content.replace(
            /import \{ ([^}]*), PositionApplication \}/,
            'import { $1 }\nimport type { PositionApplication }'
          );
          modified = true;
        }

        // 修复Position导入
        if (content.includes(', Position }') && !content.includes('import type')) {
          content = content.replace(
            /import \{ ([^}]*), Position \}/,
            'import { $1 }\nimport type { Position }'
          );
          modified = true;
        }

        if (modified) {
          fs.writeFileSync(filePath, content, 'utf8');
          this.fixedFiles++;
          this.totalFixes++;
          this.log(`Fixed imports in: ${path.basename(filePath)}`);
        }
      }
    }
  }

  async fixTaskManagementErrors() {
    this.log('修复任务管理页面错误...');
    
    const taskMgmtFile = 'packages/frontend/src/pages/admin/TaskManagementPage.tsx';
    if (fs.existsSync(taskMgmtFile)) {
      let content = fs.readFileSync(taskMgmtFile, 'utf8');
      let modified = false;

      // 修复日期类型转换
      const datePatterns = [
        {
          pattern: /plannedStartDate: data\.plannedStartDate as Date,/,
          replacement: 'plannedStartDate: data.plannedStartDate ? new Date(data.plannedStartDate) : undefined,'
        },
        {
          pattern: /plannedEndDate: data\.plannedEndDate as Date,/,
          replacement: 'plannedEndDate: data.plannedEndDate ? new Date(data.plannedEndDate) : undefined,'
        }
      ];

      for (const { pattern, replacement } of datePatterns) {
        if (pattern.test(content)) {
          content = content.replace(pattern, replacement);
          modified = true;
        }
      }

      // 修复状态映射问题
      const statusMapPattern = /const config = statusMap\[status\];/;
      if (statusMapPattern.test(content)) {
        content = content.replace(
          statusMapPattern,
          'const config = statusMap[status as keyof typeof statusMap] || { color: "default", text: status };'
        );
        modified = true;
      }

      if (modified) {
        fs.writeFileSync(taskMgmtFile, content, 'utf8');
        this.fixedFiles++;
        this.totalFixes += 2;
        this.log('Fixed TaskManagementPage errors');
      }
    }
  }

  async generateReport() {
    const reportPath = 'TYPESCRIPT_ERRORS_FIX_REPORT.md';
    const timestamp = new Date().toISOString();
    
    const report = `# TypeScript错误修复报告

## 执行时间
${timestamp}

## 修复统计
- 修复文件数: ${this.fixedFiles}
- 总修复数: ${this.totalFixes}
- 错误数: ${this.errors.length}

## 修复内容

### 1. Logger导入问题
- 为所有使用logger的文件添加正确的导入语句
- 统一导入路径为 '../utils/logger'

### 2. 动画类型定义
- 扩展AnimationStyle类型定义
- 支持所有动画效果类型

### 3. Gantt图表类型安全
- 修复日期字段可能为undefined的问题
- 添加默认值处理

### 4. 用户类型完整性
- 修复测试文件中的User对象定义
- 添加缺失的bounty和updatedAt属性

### 5. 组件属性修复
- 修复TaskDetailDrawer组件的属性名称
- 确保属性名称一致性

### 6. 管理页面导入
- 修复类型导入问题
- 使用import type语法

## 发现的错误
${this.errors.length > 0 ? this.errors.map(error => `- ${error}`).join('\n') : '无错误'}

## 下一步建议
1. 运行TypeScript编译检查剩余错误
2. 完善组件类型定义
3. 添加更严格的类型检查
`;

    fs.writeFileSync(reportPath, report, 'utf8');
    this.log(`修复报告已生成: ${reportPath}`, 'success');
  }

  async run() {
    this.log('🚀 开始修复TypeScript错误...');
    
    await this.fixLoggerImports();
    await this.fixAnimationTypeErrors();
    await this.fixGanttChartErrors();
    await this.fixUserTypeErrors();
    await this.fixTaskDetailDrawerProps();
    await this.fixAdminPageErrors();
    await this.fixTaskManagementErrors();
    
    await this.generateReport();
    
    this.log('✅ TypeScript错误修复完成!', 'success');
    this.log(`修复文件数: ${this.fixedFiles}`);
    this.log(`总修复数: ${this.totalFixes}`);
    
    if (this.errors.length > 0) {
      this.log(`发现 ${this.errors.length} 个问题，请查看报告`, 'error');
    }
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const fixer = new TypeScriptErrorFixer();
  fixer.run().catch(console.error);
}

module.exports = TypeScriptErrorFixer;