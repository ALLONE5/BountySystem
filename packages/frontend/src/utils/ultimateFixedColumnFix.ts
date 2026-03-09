/**
 * 终极固定列修复方案
 * 使用JavaScript直接操作DOM，强制设置样式
 */

class UltimateFixedColumnFixer {
  private isRunning = false;
  private intervalId: number | null = null;

  start() {
    if (this.isRunning) return;
    this.isRunning = true;

    // 立即执行一次
    this.fixAllFixedColumns();

    // 每500ms执行一次强制修复
    this.intervalId = window.setInterval(() => {
      this.fixAllFixedColumns();
    }, 500);

    console.log('UltimateFixedColumnFixer started');
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('UltimateFixedColumnFixer stopped');
  }

  private fixAllFixedColumns() {
    // 查找所有表格
    const tables = document.querySelectorAll('.ant-table');
    
    tables.forEach(table => {
      this.fixTableFixedColumns(table as HTMLElement);
    });
  }

  private fixTableFixedColumns(table: HTMLElement) {
    // 查找所有固定列
    const fixedRightCells = table.querySelectorAll('.ant-table-cell-fix-right');
    const fixedLeftCells = table.querySelectorAll('.ant-table-cell-fix-left');
    
    const isDarkTheme = document.documentElement.getAttribute('data-theme') === 'dark';
    
    // 修复右固定列
    fixedRightCells.forEach(cell => {
      this.applyUltimateFixedStyles(cell as HTMLElement, 'right', isDarkTheme);
    });
    
    // 修复左固定列
    fixedLeftCells.forEach(cell => {
      this.applyUltimateFixedStyles(cell as HTMLElement, 'left', isDarkTheme);
    });
  }

  private applyUltimateFixedStyles(element: HTMLElement, direction: 'left' | 'right', isDarkTheme: boolean) {
    const row = element.closest('tr');
    const isHeader = element.tagName.toLowerCase() === 'th';
    const isHovered = row?.matches(':hover') || false;
    
    // 计算背景颜色
    let backgroundColor: string;
    if (isDarkTheme) {
      backgroundColor = isHovered && !isHeader ? '#334155' : (isHeader ? '#1e293b' : '#0f172a');
    } else {
      backgroundColor = isHovered && !isHeader ? '#eff6ff' : '#ffffff';
    }

    // 强制设置所有可能的背景属性
    const backgroundProperties = [
      'background',
      'backgroundColor',
      'background-color',
      'backgroundImage',
      'background-image'
    ];

    backgroundProperties.forEach(prop => {
      if (prop.includes('Image') || prop.includes('image')) {
        (element.style as any)[prop] = 'none';
      } else {
        (element.style as any)[prop] = backgroundColor;
      }
    });

    // 强制设置定位和层级
    element.style.position = 'sticky';
    element.style.zIndex = isHeader ? '10000' : '9999';
    
    // 移除任何透明效果
    element.style.backdropFilter = 'none';
    (element.style as any).webkitBackdropFilter = 'none';
    element.style.filter = 'none';
    element.style.opacity = '1';

    // 设置边框和阴影
    if (direction === 'right') {
      element.style.borderLeft = '5px solid #3b82f6';
      element.style.boxShadow = '-15px 0 30px rgba(0, 0, 0, 0.5)';
    } else {
      element.style.borderRight = '5px solid #3b82f6';
      element.style.boxShadow = '15px 0 30px rgba(0, 0, 0, 0.5)';
    }

    // 强制设置CSS变量（如果存在）
    element.style.setProperty('--ant-table-bg', backgroundColor);
    element.style.setProperty('--ant-table-header-bg', backgroundColor);

    // 处理子元素
    this.fixChildElements(element);

    // 添加自定义属性标记
    element.setAttribute('data-fixed-column-fixed', 'true');
  }

  private fixChildElements(parent: HTMLElement) {
    const children = parent.querySelectorAll('*');
    children.forEach(child => {
      const element = child as HTMLElement;
      
      // 移除子元素的背景透明效果
      element.style.backdropFilter = 'none';
      (element.style as any).webkitBackdropFilter = 'none';
      element.style.filter = 'none';
      
      // 如果是按钮，设置特殊样式
      if (element.classList.contains('ant-btn')) {
        element.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
        element.style.border = '1px solid rgba(59, 130, 246, 0.3)';
        element.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
      }
    });
  }

  // 手动触发修复
  forceFixNow() {
    this.fixAllFixedColumns();
  }
}

// 创建全局实例
export const ultimateFixedColumnFixer = new UltimateFixedColumnFixer();

// 自动启动
if (typeof window !== 'undefined') {
  // 等待DOM加载完成
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => ultimateFixedColumnFixer.start(), 200);
    });
  } else {
    setTimeout(() => ultimateFixedColumnFixer.start(), 200);
  }

  // 监听主题变化
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && 
          mutation.attributeName === 'data-theme' &&
          mutation.target === document.documentElement) {
        // 主题变化时立即修复
        setTimeout(() => ultimateFixedColumnFixer.forceFixNow(), 50);
      }
    });
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme']
  });
}