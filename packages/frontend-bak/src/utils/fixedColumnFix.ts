/**
 * 表格固定列重叠问题的JavaScript动态修复
 * 当CSS无法完全解决时，使用JavaScript强制设置样式
 */

export class FixedColumnFixer {
  private observer: MutationObserver | null = null;
  private isActive = false;

  /**
   * 启动固定列修复器
   */
  start() {
    if (this.isActive) return;
    this.isActive = true;

    // 立即修复现有元素
    this.fixExistingElements();

    // 监听DOM变化，修复新添加的元素
    this.observer = new MutationObserver((mutations) => {
      let shouldFix = false;
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              if (element.classList?.contains('ant-table') || 
                  element.querySelector?.('.ant-table')) {
                shouldFix = true;
              }
            }
          });
        }
      });
      
      if (shouldFix) {
        // 延迟执行，确保DOM完全渲染
        setTimeout(() => this.fixExistingElements(), 100);
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    console.log('FixedColumnFixer started');
  }

  /**
   * 停止固定列修复器
   */
  stop() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.isActive = false;
    console.log('FixedColumnFixer stopped');
  }

  /**
   * 修复现有的固定列元素
   */
  private fixExistingElements() {
    // 查找所有固定列元素
    const fixedCells = document.querySelectorAll('.ant-table-cell-fix-right, .ant-table-cell-fix-left');
    
    fixedCells.forEach((cell) => {
      this.applyFixedColumnStyles(cell as HTMLElement);
    });

    console.log(`Fixed ${fixedCells.length} fixed column cells`);
  }

  /**
   * 应用固定列样式
   */
  private applyFixedColumnStyles(element: HTMLElement) {
    const isDarkTheme = document.documentElement.getAttribute('data-theme') === 'dark';
    const isHeader = element.tagName.toLowerCase() === 'th';
    
    // 基础样式
    const baseStyles = {
      position: 'sticky',
      zIndex: isHeader ? '100000' : '99999',
      backdropFilter: 'none',
      WebkitBackdropFilter: 'none',
      filter: 'none',
      opacity: '1'
    };

    // 背景颜色
    let backgroundColor: string;
    let borderColor: string;
    
    if (isDarkTheme) {
      backgroundColor = isHeader ? '#1e293b' : '#0f172a';
      borderColor = '#3b82f6';
    } else {
      backgroundColor = '#ffffff';
      borderColor = isHeader ? '#3b82f6' : '#f1f5f9';
    }

    // 悬停状态检测
    const row = element.closest('tr');
    const isHovered = row?.matches(':hover') || false;
    
    if (isHovered && !isHeader) {
      backgroundColor = isDarkTheme ? '#334155' : '#eff6ff';
      borderColor = '#3b82f6';
    }

    // 应用样式
    Object.assign(element.style, baseStyles, {
      backgroundColor,
      borderLeft: `10px solid ${borderColor}`,
      boxShadow: '-25px 0 60px rgba(0, 0, 0, 0.8)'
    });

    // 添加伪元素背景保护
    this.addBackgroundProtection(element, backgroundColor);

    // 监听悬停状态变化
    if (row && !isHeader) {
      this.addHoverListeners(row, element);
    }
  }

  /**
   * 添加背景保护层
   */
  private addBackgroundProtection(element: HTMLElement, backgroundColor: string) {
    // 移除现有的保护层
    const existingBefore = element.querySelector('.fixed-column-bg-before');
    const existingAfter = element.querySelector('.fixed-column-bg-after');
    
    if (existingBefore) existingBefore.remove();
    if (existingAfter) existingAfter.remove();

    // 创建背景保护层
    const bgBefore = document.createElement('div');
    bgBefore.className = 'fixed-column-bg-before';
    bgBefore.style.cssText = `
      position: absolute;
      top: -20px;
      left: -20px;
      right: -20px;
      bottom: -20px;
      background: ${backgroundColor};
      z-index: -1;
      pointer-events: none;
    `;

    const bgAfter = document.createElement('div');
    bgAfter.className = 'fixed-column-bg-after';
    bgAfter.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: ${backgroundColor};
      z-index: -2;
      pointer-events: none;
    `;

    // 确保元素有相对定位
    if (getComputedStyle(element).position === 'static') {
      element.style.position = 'relative';
    }

    element.appendChild(bgBefore);
    element.appendChild(bgAfter);
  }

  /**
   * 添加悬停监听器
   */
  private addHoverListeners(row: HTMLElement, cell: HTMLElement) {
    const handleMouseEnter = () => {
      setTimeout(() => this.applyFixedColumnStyles(cell), 10);
    };

    const handleMouseLeave = () => {
      setTimeout(() => this.applyFixedColumnStyles(cell), 10);
    };

    // 移除现有监听器
    row.removeEventListener('mouseenter', handleMouseEnter);
    row.removeEventListener('mouseleave', handleMouseLeave);

    // 添加新监听器
    row.addEventListener('mouseenter', handleMouseEnter);
    row.addEventListener('mouseleave', handleMouseLeave);
  }

  /**
   * 强制刷新所有固定列
   */
  refresh() {
    this.fixExistingElements();
  }
}

// 创建全局实例
export const fixedColumnFixer = new FixedColumnFixer();

// 自动启动（在DOM加载完成后）
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => fixedColumnFixer.start(), 500);
    });
  } else {
    setTimeout(() => fixedColumnFixer.start(), 500);
  }
}