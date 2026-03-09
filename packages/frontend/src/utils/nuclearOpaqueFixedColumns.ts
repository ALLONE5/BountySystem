/**
 * 核武器级表格固定列不透明修复工具
 * 使用最强力的方法确保固定列100%不透明
 */

class NuclearOpaqueFixedColumns {
  private intervalId: number | null = null;
  private observer: MutationObserver | null = null;
  private isActive = false;

  constructor() {
    this.init();
  }

  private init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.start());
    } else {
      this.start();
    }
  }

  public start() {
    if (this.isActive) return;
    this.isActive = true;

    // 立即执行修复
    this.nuclearFix();

    // 高频率定时器 - 每50ms检查一次
    this.intervalId = window.setInterval(() => {
      this.nuclearFix();
    }, 50);

    // 设置DOM观察器
    this.setupObserver();

    // 监听所有可能的事件
    this.setupEventListeners();

    console.log('[NuclearOpaqueFixedColumns] 核武器级不透明修复已启动');
  }

  public stop() {
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

    console.log('[NuclearOpaqueFixedColumns] 核武器级不透明修复已停止');
  }

  private nuclearFix() {
    try {
      // 获取当前主题
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark' ||
                     document.body.classList.contains('dark') ||
                     document.documentElement.classList.contains('dark');

      const lightBg = '#ffffff';
      const darkBg = '#1e293b';
      const lightHoverBg = '#f8fafc';
      const darkHoverBg = '#334155';

      const currentBg = isDark ? darkBg : lightBg;
      const currentHoverBg = isDark ? darkHoverBg : lightHoverBg;

      // 查找所有固定列
      const fixedCells = document.querySelectorAll('.ant-table-cell-fix-left, .ant-table-cell-fix-right');

      fixedCells.forEach((cell) => {
        const element = cell as HTMLElement;
        const row = element.closest('tr');
        const isHovered = row?.matches(':hover') || false;
        const bgColor = isHovered ? currentHoverBg : currentBg;

        // 核武器级样式应用
        this.applyNuclearStyles(element, bgColor, isDark);
      });

      // 强制重绘所有表格
      this.forceRepaintTables();

    } catch (error) {
      console.warn('[NuclearOpaqueFixedColumns] 修复过程中出现错误:', error);
    }
  }

  private applyNuclearStyles(element: HTMLElement, bgColor: string, isDark: boolean) {
    const isLeft = element.classList.contains('ant-table-cell-fix-left');
    const isRight = element.classList.contains('ant-table-cell-fix-right');

    // 基础样式 - 使用最高优先级
    const styles = {
      'background': bgColor,
      'background-color': bgColor,
      'background-image': 'none',
      'opacity': '1',
      'filter': 'none',
      'backdrop-filter': 'none',
      '-webkit-backdrop-filter': 'none',
      'mix-blend-mode': 'normal',
      'position': 'sticky',
      'z-index': '999999999',
      'isolation': 'isolate',
      'contain': 'layout style paint',
      'transform': 'translateZ(0) translate3d(0, 0, 0)',
      'will-change': 'auto',
      'backface-visibility': 'hidden',
      '-webkit-backface-visibility': 'hidden'
    };

    // 应用所有样式
    Object.entries(styles).forEach(([property, value]) => {
      element.style.setProperty(property, value, 'important');
    });

    // 创建超大box-shadow
    const shadowLayers = [
      `0 0 0 5000px ${bgColor}`,
      `inset 0 0 0 5000px ${bgColor}`,
      `0 -5000px 0 5000px ${bgColor}`,
      `0 5000px 0 5000px ${bgColor}`,
      `-5000px 0 0 5000px ${bgColor}`,
      `5000px 0 0 5000px ${bgColor}`,
      `0 0 0 10000px ${bgColor}`,
      `inset 0 0 0 10000px ${bgColor}`
    ];

    // 添加边框阴影
    const borderColor = isDark ? '#374151' : '#e5e7eb';
    if (isLeft) {
      shadowLayers.unshift(`2px 0 8px rgba(0, 0, 0, ${isDark ? '0.3' : '0.1'})`);
      element.style.setProperty('border-right', `2px solid ${borderColor}`, 'important');
    } else if (isRight) {
      shadowLayers.unshift(`-2px 0 8px rgba(0, 0, 0, ${isDark ? '0.3' : '0.1'})`);
      element.style.setProperty('border-left', `2px solid ${borderColor}`, 'important');
    }

    element.style.setProperty('box-shadow', shadowLayers.join(', '), 'important');

    // 使用outline创建额外覆盖
    element.style.setProperty('outline', `5000px solid ${bgColor}`, 'important');
    element.style.setProperty('outline-offset', '-5000px', 'important');

    // 创建动态伪元素样式
    this.createPseudoElementStyles(element, bgColor);

    // 确保内容在最上层
    const children = element.querySelectorAll('*');
    children.forEach((child) => {
      const childElement = child as HTMLElement;
      childElement.style.setProperty('position', 'relative', 'important');
      childElement.style.setProperty('z-index', '100', 'important');
      childElement.style.setProperty('background', 'transparent', 'important');
      childElement.style.setProperty('opacity', '1', 'important');
    });
  }

  private createPseudoElementStyles(element: HTMLElement, bgColor: string) {
    // 移除现有的伪元素样式
    const existingStyle = document.querySelector(`style[data-nuclear-opaque="${element.getAttribute('data-cell-id')}"]`);
    if (existingStyle) {
      existingStyle.remove();
    }

    // 为元素创建唯一ID
    const cellId = `cell-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    element.setAttribute('data-cell-id', cellId);

    // 创建伪元素样式
    const style = document.createElement('style');
    style.setAttribute('data-nuclear-opaque', cellId);
    style.textContent = `
      [data-cell-id="${cellId}"]::before {
        content: '' !important;
        position: absolute !important;
        top: -10000px !important;
        left: -10000px !important;
        right: -10000px !important;
        bottom: -10000px !important;
        width: 20000px !important;
        height: 20000px !important;
        background: ${bgColor} !important;
        background-color: ${bgColor} !important;
        z-index: -1 !important;
        pointer-events: none !important;
        opacity: 1 !important;
        display: block !important;
      }
      
      [data-cell-id="${cellId}"]::after {
        content: '' !important;
        position: absolute !important;
        top: -8000px !important;
        left: -8000px !important;
        right: -8000px !important;
        bottom: -8000px !important;
        width: 16000px !important;
        height: 16000px !important;
        background: ${bgColor} !important;
        background-color: ${bgColor} !important;
        z-index: -2 !important;
        pointer-events: none !important;
        opacity: 1 !important;
        display: block !important;
      }
    `;

    document.head.appendChild(style);
  }

  private forceRepaintTables() {
    const tables = document.querySelectorAll('.ant-table');
    tables.forEach((table) => {
      const element = table as HTMLElement;
      element.style.transform = 'translateZ(0)';
      element.offsetHeight; // 触发重绘
      element.style.transform = '';
    });
  }

  private setupObserver() {
    this.observer = new MutationObserver((mutations) => {
      let shouldUpdate = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' || mutation.type === 'attributes') {
          const target = mutation.target as Element;
          if (target.classList?.contains('ant-table') || 
              target.closest?.('.ant-table') ||
              target.classList?.contains('ant-table-cell-fix-left') ||
              target.classList?.contains('ant-table-cell-fix-right')) {
            shouldUpdate = true;
          }
        }
      });

      if (shouldUpdate) {
        setTimeout(() => this.nuclearFix(), 1);
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'data-theme']
    });
  }

  private setupEventListeners() {
    // 滚动事件
    document.addEventListener('scroll', () => {
      this.nuclearFix();
    }, { passive: true });

    // 窗口调整事件
    window.addEventListener('resize', () => {
      setTimeout(() => this.nuclearFix(), 10);
    });

    // 鼠标事件
    document.addEventListener('mouseover', (e) => {
      const target = e.target as Element;
      if (target.closest('.ant-table-row')) {
        setTimeout(() => this.nuclearFix(), 1);
      }
    }, { passive: true });

    document.addEventListener('mouseout', (e) => {
      const target = e.target as Element;
      if (target.closest('.ant-table-row')) {
        setTimeout(() => this.nuclearFix(), 1);
      }
    }, { passive: true });

    // 表格滚动事件
    const setupTableScrollListeners = () => {
      const tableContainers = document.querySelectorAll('.ant-table-body');
      tableContainers.forEach(container => {
        container.addEventListener('scroll', () => {
          this.nuclearFix();
        }, { passive: true });
      });
    };

    setupTableScrollListeners();
    
    // 定期重新设置滚动监听器
    setInterval(setupTableScrollListeners, 1000);

    // 主题变化监听
    const htmlElement = document.documentElement;
    const themeObserver = new MutationObserver(() => {
      setTimeout(() => this.nuclearFix(), 10);
    });

    themeObserver.observe(htmlElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'class']
    });
  }

  // 手动触发修复
  public forceUpdate() {
    this.nuclearFix();
  }

  // 清理所有伪元素样式
  public cleanup() {
    const styles = document.querySelectorAll('style[data-nuclear-opaque]');
    styles.forEach(style => style.remove());
  }
}

// 创建全局实例
const nuclearOpaqueFixedColumns = new NuclearOpaqueFixedColumns();

// 导出实例
export default nuclearOpaqueFixedColumns;

// 在window对象上暴露实例，方便调试
if (typeof window !== 'undefined') {
  (window as any).nuclearOpaqueFixedColumns = nuclearOpaqueFixedColumns;
}