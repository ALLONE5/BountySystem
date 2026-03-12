/**
 * 表格固定列完全不透明修复工具
 * 确保固定列100%不透明，完全遮挡下方内容
 */

interface OpaqueFixOptions {
  lightBg?: string;
  darkBg?: string;
  lightHoverBg?: string;
  darkHoverBg?: string;
  forceUpdate?: boolean;
}

class TableFixedColumnOpaqueFix {
  private observer: MutationObserver | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private themeObserver: MutationObserver | null = null;
  private isActive = false;
  private options: Required<OpaqueFixOptions>;

  constructor(options: OpaqueFixOptions = {}) {
    this.options = {
      lightBg: options.lightBg || '#ffffff',
      darkBg: options.darkBg || '#1e293b',
      lightHoverBg: options.lightHoverBg || '#f8fafc',
      darkHoverBg: options.darkHoverBg || '#334155',
      forceUpdate: options.forceUpdate || false
    };
  }

  /**
   * 启动不透明修复
   */
  public start(): void {
    if (this.isActive) {
      return;
    }

    this.isActive = true;
    this.applyOpaqueStyles();
    this.setupObservers();
    this.setupEventListeners();

    console.log('[TableFixedColumnOpaqueFix] 不透明修复已启动');
  }

  /**
   * 停止不透明修复
   */
  public stop(): void {
    if (!this.isActive) {
      return;
    }

    this.isActive = false;
    this.cleanup();

    console.log('[TableFixedColumnOpaqueFix] 不透明修复已停止');
  }

  /**
   * 应用不透明样式
   */
  private applyOpaqueStyles(): void {
    const fixedCells = document.querySelectorAll('.ant-table-cell-fix-left, .ant-table-cell-fix-right');
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    
    fixedCells.forEach((cell) => {
      const element = cell as HTMLElement;
      this.applyOpaqueStyleToCell(element, isDark);
    });

    // 强制重绘
    if (this.options.forceUpdate) {
      this.forceRepaint();
    }
  }

  /**
   * 为单个单元格应用不透明样式
   */
  private applyOpaqueStyleToCell(element: HTMLElement, isDark: boolean): void {
    const isLeft = element.classList.contains('ant-table-cell-fix-left');
    const isRight = element.classList.contains('ant-table-cell-fix-right');
    
    if (!isLeft && !isRight) return;

    const bgColor = isDark ? this.options.darkBg : this.options.lightBg;
    const borderColor = isDark ? '#374151' : '#e5e7eb';
    
    // 基础样式
    element.style.setProperty('background', bgColor, 'important');
    element.style.setProperty('background-color', bgColor, 'important');
    element.style.setProperty('background-image', 'none', 'important');
    element.style.setProperty('opacity', '1', 'important');
    element.style.setProperty('backdrop-filter', 'none', 'important');
    element.style.setProperty('-webkit-backdrop-filter', 'none', 'important');
    element.style.setProperty('filter', 'none', 'important');
    element.style.setProperty('position', 'sticky', 'important');
    element.style.setProperty('z-index', '999999', 'important');
    element.style.setProperty('isolation', 'isolate', 'important');
    element.style.setProperty('mix-blend-mode', 'normal', 'important');

    // 创建巨大的box-shadow覆盖层
    const shadowLayers = [
      `0 0 0 2000px ${bgColor}`,
      `inset 0 0 0 2000px ${bgColor}`,
      `0 -2000px 0 2000px ${bgColor}`,
      `0 2000px 0 2000px ${bgColor}`,
      `-2000px 0 0 2000px ${bgColor}`,
      `2000px 0 0 2000px ${bgColor}`
    ];

    // 添加边框阴影
    if (isLeft) {
      shadowLayers.unshift(`2px 0 8px rgba(0, 0, 0, ${isDark ? '0.3' : '0.1'})`);
      element.style.setProperty('border-right', `2px solid ${borderColor}`, 'important');
    } else if (isRight) {
      shadowLayers.unshift(`-2px 0 8px rgba(0, 0, 0, ${isDark ? '0.3' : '0.1'})`);
      element.style.setProperty('border-left', `2px solid ${borderColor}`, 'important');
    }

    element.style.setProperty('box-shadow', shadowLayers.join(', '), 'important');

    // 添加伪元素背景保护
    this.addPseudoElementProtection(element, bgColor);

    // 处理悬停状态
    this.setupHoverHandling(element, isDark);
  }

  /**
   * 添加伪元素背景保护
   */
  private addPseudoElementProtection(element: HTMLElement, bgColor: string): void {
    // 移除现有的伪元素样式
    const existingStyle = element.querySelector('style[data-opaque-fix]');
    if (existingStyle) {
      existingStyle.remove();
    }

    // 创建新的伪元素样式
    const style = document.createElement('style');
    style.setAttribute('data-opaque-fix', 'true');
    style.textContent = `
      .ant-table-cell-fix-left::before,
      .ant-table-cell-fix-right::before {
        content: '' !important;
        position: absolute !important;
        top: -5000px !important;
        left: -5000px !important;
        right: -5000px !important;
        bottom: -5000px !important;
        background: ${bgColor} !important;
        background-color: ${bgColor} !important;
        z-index: -1 !important;
        pointer-events: none !important;
        opacity: 1 !important;
      }
      
      .ant-table-cell-fix-left::after,
      .ant-table-cell-fix-right::after {
        content: '' !important;
        position: absolute !important;
        top: -3000px !important;
        left: -3000px !important;
        right: -3000px !important;
        bottom: -3000px !important;
        background: ${bgColor} !important;
        background-color: ${bgColor} !important;
        z-index: -2 !important;
        pointer-events: none !important;
        opacity: 1 !important;
      }
    `;

    document.head.appendChild(style);
  }

  /**
   * 设置悬停处理
   */
  private setupHoverHandling(element: HTMLElement, isDark: boolean): void {
    const row = element.closest('tr');
    if (!row) return;

    const hoverBg = isDark ? this.options.darkHoverBg : this.options.lightHoverBg;
    const normalBg = isDark ? this.options.darkBg : this.options.lightBg;

    // 移除现有的事件监听器
    row.removeEventListener('mouseenter', this.handleRowHover);
    row.removeEventListener('mouseleave', this.handleRowLeave);

    // 添加新的事件监听器
    const handleRowHover = () => {
      const fixedCells = row.querySelectorAll('.ant-table-cell-fix-left, .ant-table-cell-fix-right');
      fixedCells.forEach((cell) => {
        const cellElement = cell as HTMLElement;
        this.updateCellBackground(cellElement, hoverBg, isDark, true);
      });
    };

    const handleRowLeave = () => {
      const fixedCells = row.querySelectorAll('.ant-table-cell-fix-left, .ant-table-cell-fix-right');
      fixedCells.forEach((cell) => {
        const cellElement = cell as HTMLElement;
        this.updateCellBackground(cellElement, normalBg, isDark, false);
      });
    };

    row.addEventListener('mouseenter', handleRowHover);
    row.addEventListener('mouseleave', handleRowLeave);
  }

  /**
   * 更新单元格背景
   */
  private updateCellBackground(element: HTMLElement, bgColor: string, isDark: boolean, isHover: boolean): void {
    const isLeft = element.classList.contains('ant-table-cell-fix-left');
    const isRight = element.classList.contains('ant-table-cell-fix-right');
    
    element.style.setProperty('background', bgColor, 'important');
    element.style.setProperty('background-color', bgColor, 'important');

    // 更新box-shadow
    const shadowLayers = [
      `0 0 0 2000px ${bgColor}`,
      `inset 0 0 0 2000px ${bgColor}`,
      `0 -2000px 0 2000px ${bgColor}`,
      `0 2000px 0 2000px ${bgColor}`,
      `-2000px 0 0 2000px ${bgColor}`,
      `2000px 0 0 2000px ${bgColor}`
    ];

    // 添加边框阴影
    if (isLeft) {
      shadowLayers.unshift(`2px 0 8px rgba(0, 0, 0, ${isDark ? (isHover ? '0.4' : '0.3') : (isHover ? '0.15' : '0.1')})`);
    } else if (isRight) {
      shadowLayers.unshift(`-2px 0 8px rgba(0, 0, 0, ${isDark ? (isHover ? '0.4' : '0.3') : (isHover ? '0.15' : '0.1')})`);
    }

    element.style.setProperty('box-shadow', shadowLayers.join(', '), 'important');
  }

  /**
   * 设置观察器
   */
  private setupObservers(): void {
    // DOM变化观察器
    this.observer = new MutationObserver((mutations) => {
      let shouldUpdate = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          const addedNodes = Array.from(mutation.addedNodes);
          const hasTableNodes = addedNodes.some(node => 
            node.nodeType === Node.ELEMENT_NODE &&
            ((node as Element).classList.contains('ant-table-cell-fix-left') ||
             (node as Element).classList.contains('ant-table-cell-fix-right') ||
             (node as Element).querySelector('.ant-table-cell-fix-left, .ant-table-cell-fix-right'))
          );
          
          if (hasTableNodes) {
            shouldUpdate = true;
          }
        }
      });

      if (shouldUpdate) {
        setTimeout(() => this.applyOpaqueStyles(), 50);
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // 窗口大小变化观察器
    this.resizeObserver = new ResizeObserver(() => {
      setTimeout(() => this.applyOpaqueStyles(), 100);
    });

    const tableContainers = document.querySelectorAll('.ant-table-container');
    tableContainers.forEach(container => {
      this.resizeObserver!.observe(container);
    });

    // 主题变化观察器
    this.themeObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
          setTimeout(() => this.applyOpaqueStyles(), 50);
        }
      });
    });

    this.themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // 滚动事件
    document.addEventListener('scroll', this.handleScroll, { passive: true });
    
    // 窗口调整事件
    window.addEventListener('resize', this.handleResize);
    
    // 表格滚动事件
    const tableContainers = document.querySelectorAll('.ant-table-body');
    tableContainers.forEach(container => {
      container.addEventListener('scroll', this.handleTableScroll, { passive: true });
    });
  }

  /**
   * 处理滚动事件
   */
  private handleScroll = (): void => {
    if (this.isActive) {
      setTimeout(() => this.applyOpaqueStyles(), 10);
    }
  };

  /**
   * 处理窗口调整事件
   */
  private handleResize = (): void => {
    if (this.isActive) {
      setTimeout(() => this.applyOpaqueStyles(), 100);
    }
  };

  /**
   * 处理表格滚动事件
   */
  private handleTableScroll = (): void => {
    if (this.isActive) {
      setTimeout(() => this.applyOpaqueStyles(), 10);
    }
  };

  /**
   * 处理行悬停事件
   */
  private handleRowHover = (): void => {
    // 这个方法会被动态绑定，实际实现在setupHoverHandling中
  };

  /**
   * 处理行离开事件
   */
  private handleRowLeave = (): void => {
    // 这个方法会被动态绑定，实际实现在setupHoverHandling中
  };

  /**
   * 强制重绘
   */
  private forceRepaint(): void {
    const fixedCells = document.querySelectorAll('.ant-table-cell-fix-left, .ant-table-cell-fix-right');
    fixedCells.forEach((cell) => {
      const element = cell as HTMLElement;
      element.style.transform = 'translateZ(0)';
      element.offsetHeight; // 触发重绘
      element.style.transform = '';
    });
  }

  /**
   * 清理资源
   */
  private cleanup(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    if (this.themeObserver) {
      this.themeObserver.disconnect();
      this.themeObserver = null;
    }

    document.removeEventListener('scroll', this.handleScroll);
    window.removeEventListener('resize', this.handleResize);

    const tableContainers = document.querySelectorAll('.ant-table-body');
    tableContainers.forEach(container => {
      container.removeEventListener('scroll', this.handleTableScroll);
    });

    // 移除伪元素样式
    const opaqueStyles = document.querySelectorAll('style[data-opaque-fix]');
    opaqueStyles.forEach(style => style.remove());
  }

  /**
   * 手动触发修复
   */
  public refresh(): void {
    if (this.isActive) {
      this.applyOpaqueStyles();
    }
  }

  /**
   * 更新配置
   */
  public updateOptions(newOptions: Partial<OpaqueFixOptions>): void {
    this.options = { ...this.options, ...newOptions };
    if (this.isActive) {
      this.applyOpaqueStyles();
    }
  }
}

// 创建全局实例
const tableFixedColumnOpaqueFix = new TableFixedColumnOpaqueFix();

// 导出工具函数
export const startOpaqueFixedColumnFix = (options?: OpaqueFixOptions): void => {
  tableFixedColumnOpaqueFix.updateOptions(options || {});
  tableFixedColumnOpaqueFix.start();
};

export const stopOpaqueFixedColumnFix = (): void => {
  tableFixedColumnOpaqueFix.stop();
};

export const refreshOpaqueFixedColumnFix = (): void => {
  tableFixedColumnOpaqueFix.refresh();
};

export default tableFixedColumnOpaqueFix;