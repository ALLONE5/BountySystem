/**
 * 表格固定列绝对修复方案
 * 针对用户反馈的固定列内容重叠问题的终极解决方案
 */

class TableFixedColumnAbsoluteFixer {
  private observer: MutationObserver | null = null;
  private intervalId: number | null = null;
  private isActive = false;

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window === 'undefined') return;

    // 等待DOM完全加载
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.start();
      });
    } else {
      this.start();
    }
  }

  start() {
    if (this.isActive) return;
    this.isActive = true;

    console.log('🔧 TableFixedColumnAbsoluteFixer: Starting absolute fix...');

    // 立即执行修复
    this.applyAbsoluteFix();

    // 设置定期修复（每300ms）
    this.intervalId = window.setInterval(() => {
      this.applyAbsoluteFix();
    }, 300);

    // 监听DOM变化
    this.observer = new MutationObserver((mutations) => {
      let shouldFix = false;
      
      mutations.forEach((mutation) => {
        // 检查是否有表格相关的变化
        if (mutation.type === 'childList') {
          const addedNodes = Array.from(mutation.addedNodes);
          const hasTableChanges = addedNodes.some(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              return element.classList.contains('ant-table') ||
                     element.querySelector('.ant-table') ||
                     element.classList.contains('ant-table-cell-fix-right') ||
                     element.classList.contains('ant-table-cell-fix-left');
            }
            return false;
          });
          
          if (hasTableChanges) {
            shouldFix = true;
          }
        }
        
        // 检查主题变化
        if (mutation.type === 'attributes' && 
            mutation.attributeName === 'data-theme') {
          shouldFix = true;
        }
      });

      if (shouldFix) {
        setTimeout(() => this.applyAbsoluteFix(), 50);
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-theme', 'class']
    });

    // 监听主题变化
    this.observeThemeChanges();
  }

  stop() {
    if (!this.isActive) return;
    this.isActive = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    console.log('🔧 TableFixedColumnAbsoluteFixer: Stopped');
  }

  private observeThemeChanges() {
    const themeObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && 
            mutation.attributeName === 'data-theme' &&
            mutation.target === document.documentElement) {
          console.log('🎨 Theme changed, applying absolute fix...');
          setTimeout(() => this.applyAbsoluteFix(), 100);
        }
      });
    });

    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });
  }

  private applyAbsoluteFix() {
    try {
      // 查找所有表格
      const tables = document.querySelectorAll('.ant-table-wrapper');
      let fixedCount = 0;

      tables.forEach(tableWrapper => {
        const fixedCells = tableWrapper.querySelectorAll(
          '.ant-table-cell-fix-right, .ant-table-cell-fix-left'
        );

        fixedCells.forEach(cell => {
          this.applyAbsoluteFixToCell(cell as HTMLElement);
          fixedCount++;
        });
      });

      if (fixedCount > 0) {
        console.log(`🔧 Applied absolute fix to ${fixedCount} fixed column cells`);
      }
    } catch (error) {
      console.error('🚨 Error in applyAbsoluteFix:', error);
    }
  }

  private applyAbsoluteFixToCell(cell: HTMLElement) {
    const isRightFixed = cell.classList.contains('ant-table-cell-fix-right');
    const isLeftFixed = cell.classList.contains('ant-table-cell-fix-left');
    const isHeader = cell.tagName.toLowerCase() === 'th';
    const row = cell.closest('tr');
    const isHovered = row?.matches(':hover') || false;
    
    // 检测主题
    const isDarkTheme = document.documentElement.getAttribute('data-theme') === 'dark' ||
                       document.body.classList.contains('dark') ||
                       document.body.getAttribute('data-theme') === 'dark';

    // 计算背景颜色 - 使用完全不透明的颜色
    let backgroundColor: string;
    let borderColor = '#3b82f6';
    
    if (isDarkTheme) {
      if (isHeader) {
        backgroundColor = '#1e293b'; // 深色主题表头
      } else if (isHovered) {
        backgroundColor = '#334155'; // 深色主题悬停
      } else {
        backgroundColor = '#0f172a'; // 深色主题普通
      }
    } else {
      if (isHeader) {
        backgroundColor = '#f8fafc'; // 亮色主题表头
      } else if (isHovered) {
        backgroundColor = '#eff6ff'; // 亮色主题悬停
      } else {
        backgroundColor = '#ffffff'; // 亮色主题普通
      }
    }

    // 🔥 关键修复：强制设置所有可能的背景属性
    const backgroundStyles = {
      'background': backgroundColor,
      'background-color': backgroundColor,
      'backgroundColor': backgroundColor,
      'background-image': 'none',
      'backgroundImage': 'none',
      'background-attachment': 'initial',
      'background-blend-mode': 'initial',
      'background-clip': 'initial',
      'background-origin': 'initial',
      'background-position': 'initial',
      'background-repeat': 'initial',
      'background-size': 'initial'
    };

    // 应用所有背景样式
    Object.entries(backgroundStyles).forEach(([property, value]) => {
      try {
        (cell.style as any)[property] = value;
        cell.style.setProperty(property.replace(/([A-Z])/g, '-$1').toLowerCase(), value, 'important');
      } catch (e) {
        // 忽略设置失败的属性
      }
    });

    // 🔥 强制定位和层级
    cell.style.setProperty('position', 'sticky', 'important');
    cell.style.setProperty('z-index', isHeader ? '10001' : '10000', 'important');

    // 🔥 移除所有透明效果
    const transparencyStyles = {
      'opacity': '1',
      'backdrop-filter': 'none',
      'webkitBackdropFilter': 'none',
      'filter': 'none',
      'mix-blend-mode': 'initial'
    };

    Object.entries(transparencyStyles).forEach(([property, value]) => {
      try {
        (cell.style as any)[property] = value;
        cell.style.setProperty(property.replace(/([A-Z])/g, '-$1').toLowerCase(), value, 'important');
      } catch (e) {
        // 忽略设置失败的属性
      }
    });

    // 🔥 设置边框和阴影增强视觉分离
    if (isRightFixed) {
      cell.style.setProperty('border-left', `8px solid ${borderColor}`, 'important');
      cell.style.setProperty('box-shadow', '-20px 0 40px rgba(0, 0, 0, 0.6)', 'important');
    } else if (isLeftFixed) {
      cell.style.setProperty('border-right', `8px solid ${borderColor}`, 'important');
      cell.style.setProperty('box-shadow', '20px 0 40px rgba(0, 0, 0, 0.6)', 'important');
    }

    // 🔥 强制设置CSS变量
    const cssVariables = [
      '--ant-table-bg',
      '--ant-table-header-bg',
      '--ant-table-row-hover-bg',
      '--ant-table-header-color',
      '--ant-table-body-bg'
    ];

    cssVariables.forEach(variable => {
      cell.style.setProperty(variable, backgroundColor, 'important');
    });

    // 🔥 处理伪元素 - 创建额外的背景保护层
    this.createBackgroundProtectionLayer(cell, backgroundColor);

    // 🔥 修复子元素
    this.fixChildElements(cell, backgroundColor, isDarkTheme);

    // 标记已修复
    cell.setAttribute('data-absolute-fixed', 'true');
    cell.setAttribute('data-fix-timestamp', Date.now().toString());
  }

  private createBackgroundProtectionLayer(cell: HTMLElement, backgroundColor: string) {
    // 移除旧的保护层
    const existingLayer = cell.querySelector('.fixed-column-protection-layer');
    if (existingLayer) {
      existingLayer.remove();
    }

    // 创建新的保护层
    const protectionLayer = document.createElement('div');
    protectionLayer.className = 'fixed-column-protection-layer';
    protectionLayer.style.cssText = `
      position: absolute !important;
      top: -10px !important;
      left: -10px !important;
      right: -10px !important;
      bottom: -10px !important;
      background: ${backgroundColor} !important;
      z-index: -1 !important;
      pointer-events: none !important;
      border-radius: 0 !important;
      box-shadow: none !important;
    `;

    cell.style.position = 'relative';
    cell.insertBefore(protectionLayer, cell.firstChild);
  }

  private fixChildElements(parent: HTMLElement, backgroundColor: string, isDarkTheme: boolean) {
    const children = parent.querySelectorAll('*');
    
    children.forEach(child => {
      const element = child as HTMLElement;
      
      // 移除子元素的透明效果
      element.style.setProperty('backdrop-filter', 'none', 'important');
      element.style.setProperty('-webkit-backdrop-filter', 'none', 'important');
      element.style.setProperty('filter', 'none', 'important');
      
      // 特殊处理按钮
      if (element.classList.contains('ant-btn')) {
        const buttonBg = isDarkTheme ? 'rgba(51, 65, 85, 0.9)' : 'rgba(255, 255, 255, 0.9)';
        element.style.setProperty('background-color', buttonBg, 'important');
        element.style.setProperty('border', '1px solid rgba(59, 130, 246, 0.5)', 'important');
        element.style.setProperty('box-shadow', '0 2px 8px rgba(0, 0, 0, 0.15)', 'important');
      }

      // 特殊处理标签
      if (element.classList.contains('ant-tag')) {
        element.style.setProperty('background-color', 'rgba(59, 130, 246, 0.1)', 'important');
        element.style.setProperty('border', '1px solid rgba(59, 130, 246, 0.3)', 'important');
      }
    });
  }

  // 公共方法：手动触发修复
  public forceFixNow() {
    console.log('🔧 Force fixing fixed columns now...');
    this.applyAbsoluteFix();
  }

  // 公共方法：获取修复状态
  public getStatus() {
    return {
      isActive: this.isActive,
      hasObserver: !!this.observer,
      hasInterval: !!this.intervalId
    };
  }
}

// 创建全局实例
export const tableFixedColumnAbsoluteFixer = new TableFixedColumnAbsoluteFixer();

// 导出给全局使用
if (typeof window !== 'undefined') {
  (window as any).tableFixedColumnAbsoluteFixer = tableFixedColumnAbsoluteFixer;
}

export default tableFixedColumnAbsoluteFixer;