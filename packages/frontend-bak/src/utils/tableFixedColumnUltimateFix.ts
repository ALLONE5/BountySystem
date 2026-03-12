/**
 * 表格固定列终极修复工具
 * 彻底解决固定列内容重叠问题
 */

class TableFixedColumnUltimateFixer {
  private observer: MutationObserver | null = null;
  private intervalId: number | null = null;
  private isActive = false;

  /**
   * 启动修复器
   */
  start() {
    if (this.isActive) return;
    this.isActive = true;

    // 立即执行修复
    this.executeUltimateFix();

    // 设置定时器持续修复
    this.intervalId = window.setInterval(() => {
      this.executeUltimateFix();
    }, 200);

    // 监听DOM变化
    this.observer = new MutationObserver((mutations) => {
      let needsFix = false;
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' || mutation.type === 'attributes') {
          const target = mutation.target as Element;
          if (target.classList?.contains('ant-table') || 
              target.querySelector?.('.ant-table') ||
              target.closest?.('.ant-table')) {
            needsFix = true;
          }
        }
      });
      
      if (needsFix) {
        setTimeout(() => this.executeUltimateFix(), 50);
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'data-theme']
    });

    console.log('TableFixedColumnUltimateFixer started');
  }

  /**
   * 停止修复器
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    
    this.isActive = false;
    console.log('TableFixedColumnUltimateFixer stopped');
  }

  /**
   * 执行终极修复
   */
  private executeUltimateFix() {
    const tables = document.querySelectorAll('.ant-table');
    tables.forEach(table => this.fixTable(table as HTMLElement));
  }

  /**
   * 修复单个表格
   */
  private fixTable(table: HTMLElement) {
    const fixedLeftCells = table.querySelectorAll('.ant-table-cell-fix-left');
    const fixedRightCells = table.querySelectorAll('.ant-table-cell-fix-right');
    
    const isDarkTheme = document.documentElement.getAttribute('data-theme') === 'dark';
    
    // 修复左固定列
    fixedLeftCells.forEach(cell => {
      this.applyUltimateFixedStyles(cell as HTMLElement, 'left', isDarkTheme);
    });
    
    // 修复右固定列
    fixedRightCells.forEach(cell => {
      this.applyUltimateFixedStyles(cell as HTMLElement, 'right', isDarkTheme);
    });
  }

  /**
   * 应用终极固定样式
   */
  private applyUltimateFixedStyles(element: HTMLElement, direction: 'left' | 'right', isDarkTheme: boolean) {
    const row = element.closest('tr');
    const isHeader = element.tagName.toLowerCase() === 'th';
    const isHovered = row?.matches(':hover') || false;
    
    // 计算背景颜色
    let backgroundColor: string;
    let hoverBackgroundColor: string;
    
    if (isDarkTheme) {
      backgroundColor = isHeader ? '#1e293b' : '#1e293b';
      hoverBackgroundColor = '#334155';
    } else {
      backgroundColor = '#ffffff';
      hoverBackgroundColor = '#f8fafc';
    }
    
    const finalBackgroundColor = isHovered && !isHeader ? hoverBackgroundColor : backgroundColor;

    // 强制设置所有背景相关属性
    const backgroundStyles = {
      background: finalBackgroundColor,
      backgroundColor: finalBackgroundColor,
      backgroundImage: 'none',
      backgroundAttachment: 'scroll',
      backgroundClip: 'border-box',
      backgroundOrigin: 'padding-box',
      backgroundPosition: '0% 0%',
      backgroundRepeat: 'repeat',
      backgroundSize: 'auto'
    };

    // 强制设置定位和层级
    const positionStyles = {
      position: 'sticky',
      zIndex: isHeader ? '10000' : '9999',
      isolation: 'isolate'
    };

    // 移除透明效果
    const transparencyStyles = {
      backdropFilter: 'none',
      webkitBackdropFilter: 'none',
      filter: 'none',
      opacity: '1'
    };

    // 设置边框和阴影
    const borderStyles = direction === 'right' 
      ? {
          borderLeft: '2px solid #e5e7eb',
          boxShadow: `-2px 0 8px rgba(0, 0, 0, 0.1), 0 0 0 1000px ${finalBackgroundColor}`
        }
      : {
          borderRight: '2px solid #e5e7eb',
          boxShadow: `2px 0 8px rgba(0, 0, 0, 0.1), 0 0 0 1000px ${finalBackgroundColor}`
        };

    // 应用所有样式
    Object.assign(element.style, backgroundStyles, positionStyles, transparencyStyles, borderStyles);

    // 强制设置CSS变量
    element.style.setProperty('--ant-table-bg', finalBackgroundColor);
    element.style.setProperty('--ant-table-header-bg', finalBackgroundColor);
    element.style.setProperty('--ant-table-row-hover-bg', finalBackgroundColor);

    // 创建背景保护层
    this.createBackgroundProtection(element, finalBackgroundColor);

    // 修复子元素
    this.fixChildElements(element, finalBackgroundColor, isDarkTheme);

    // 添加悬停监听器
    if (row && !isHeader) {
      this.addHoverListener(row, element, direction, isDarkTheme);
    }

    // 标记已修复
    element.setAttribute('data-ultimate-fixed', 'true');
  }

  /**
   * 创建背景保护层
   */
  private createBackgroundProtection(element: HTMLElement, backgroundColor: string) {
    // 移除现有的保护层
    const existingProtection = element.querySelector('.ultimate-bg-protection');
    if (existingProtection) {
      existingProtection.remove();
    }

    // 创建新的保护层
    const protection = document.createElement('div');
    protection.className = 'ultimate-bg-protection';
    protection.style.cssText = `
      position: absolute !important;
      top: -200px !important;
      left: -200px !important;
      right: -200px !important;
      bottom: -200px !important;
      background: ${backgroundColor} !important;
      background-color: ${backgroundColor} !important;
      background-image: none !important;
      z-index: -10 !important;
      pointer-events: none !important;
      opacity: 1 !important;
    `;

    // 确保父元素有相对定位
    if (getComputedStyle(element).position === 'static') {
      element.style.position = 'relative';
    }

    element.appendChild(protection);
  }

  /**
   * 修复子元素
   */
  private fixChildElements(parent: HTMLElement, backgroundColor: string, isDarkTheme: boolean) {
    const children = parent.querySelectorAll('*');
    
    children.forEach(child => {
      const element = child as HTMLElement;
      
      // 移除透明效果
      element.style.backdropFilter = 'none';
      (element.style as any).webkitBackdropFilter = 'none';
      element.style.filter = 'none';
      
      // 确保相对定位
      if (getComputedStyle(element).position === 'static') {
        element.style.position = 'relative';
        element.style.zIndex = '1';
      }
      
      // 特殊处理按钮
      if (element.classList.contains('ant-btn')) {
        const btnBg = isDarkTheme ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)';
        const btnBorder = isDarkTheme ? '#475569' : '#d1d5db';
        const btnColor = isDarkTheme ? '#ffffff' : 'inherit';
        
        element.style.background = btnBg;
        element.style.backgroundColor = btnBg;
        element.style.border = `1px solid ${btnBorder}`;
        element.style.color = btnColor;
        element.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
        element.style.position = 'relative';
        element.style.zIndex = '10';
      }
      
      // 特殊处理标签
      if (element.classList.contains('ant-tag')) {
        element.style.position = 'relative';
        element.style.zIndex = '5';
      }
    });
  }

  /**
   * 添加悬停监听器
   */
  private addHoverListener(row: HTMLElement, cell: HTMLElement, direction: 'left' | 'right', isDarkTheme: boolean) {
    const handleMouseEnter = () => {
      setTimeout(() => this.applyUltimateFixedStyles(cell, direction, isDarkTheme), 10);
    };

    const handleMouseLeave = () => {
      setTimeout(() => this.applyUltimateFixedStyles(cell, direction, isDarkTheme), 10);
    };

    // 移除现有监听器
    row.removeEventListener('mouseenter', handleMouseEnter);
    row.removeEventListener('mouseleave', handleMouseLeave);

    // 添加新监听器
    row.addEventListener('mouseenter', handleMouseEnter);
    row.addEventListener('mouseleave', handleMouseLeave);
  }

  /**
   * 手动触发修复
   */
  forceFixNow() {
    this.executeUltimateFix();
  }

  /**
   * 重置所有修复
   */
  reset() {
    const fixedCells = document.querySelectorAll('[data-ultimate-fixed="true"]');
    fixedCells.forEach(cell => {
      cell.removeAttribute('data-ultimate-fixed');
      const protection = cell.querySelector('.ultimate-bg-protection');
      if (protection) {
        protection.remove();
      }
    });
    
    this.executeUltimateFix();
  }
}

// 创建全局实例
export const tableFixedColumnUltimateFixer = new TableFixedColumnUltimateFixer();

// 自动启动
if (typeof window !== 'undefined') {
  const startFixer = () => {
    setTimeout(() => {
      tableFixedColumnUltimateFixer.start();
    }, 100);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startFixer);
  } else {
    startFixer();
  }

  // 监听主题变化
  const themeObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && 
          mutation.attributeName === 'data-theme' &&
          mutation.target === document.documentElement) {
        setTimeout(() => {
          tableFixedColumnUltimateFixer.reset();
        }, 50);
      }
    });
  });

  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme']
  });

  // 监听窗口大小变化
  window.addEventListener('resize', () => {
    setTimeout(() => {
      tableFixedColumnUltimateFixer.forceFixNow();
    }, 100);
  });
}