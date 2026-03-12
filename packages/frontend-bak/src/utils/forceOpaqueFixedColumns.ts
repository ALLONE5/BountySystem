/**
 * 强制表格固定列不透明工具
 * 动态监控和修复固定列的透明度问题
 */

class ForceOpaqueFixedColumns {
  private observer: MutationObserver | null = null;
  private isActive = false;
  private intervalId: number | null = null;

  constructor() {
    this.init();
  }

  private init() {
    // 等待DOM加载完成
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.start());
    } else {
      this.start();
    }
  }

  private start() {
    if (this.isActive) return;
    this.isActive = true;

    // 立即执行一次修复
    this.forceOpaque();

    // 设置定时器持续监控
    this.intervalId = window.setInterval(() => {
      this.forceOpaque();
    }, 100);

    // 设置DOM变化监听器
    this.setupMutationObserver();

    // 监听主题变化
    this.setupThemeListener();

    // 监听窗口大小变化
    window.addEventListener('resize', () => {
      setTimeout(() => this.forceOpaque(), 50);
    });

    // 监听滚动事件
    document.addEventListener('scroll', () => {
      this.forceOpaque();
    }, { passive: true });
  }

  private setupMutationObserver() {
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
        setTimeout(() => this.forceOpaque(), 10);
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'data-theme']
    });
  }

  private setupThemeListener() {
    // 监听data-theme属性变化
    const htmlElement = document.documentElement;
    const observer = new MutationObserver(() => {
      setTimeout(() => this.forceOpaque(), 50);
    });

    observer.observe(htmlElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'class']
    });

    // 监听body的class变化（某些主题切换可能修改body）
    const bodyObserver = new MutationObserver(() => {
      setTimeout(() => this.forceOpaque(), 50);
    });

    bodyObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ['class', 'data-theme']
    });
  }

  private forceOpaque() {
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
      const fixedCells = document.querySelectorAll(
        '.ant-table-cell-fix-left, .ant-table-cell-fix-right'
      );

      fixedCells.forEach((cell) => {
        const element = cell as HTMLElement;
        const isHovered = element.closest('tr')?.matches(':hover') || false;
        const bgColor = isHovered ? currentHoverBg : currentBg;

        // 强制设置样式
        element.style.setProperty('background', bgColor, 'important');
        element.style.setProperty('background-color', bgColor, 'important');
        element.style.setProperty('background-image', 'none', 'important');
        element.style.setProperty('opacity', '1', 'important');
        element.style.setProperty('filter', 'none', 'important');
        element.style.setProperty('backdrop-filter', 'none', 'important');
        element.style.setProperty('-webkit-backdrop-filter', 'none', 'important');
        element.style.setProperty('mix-blend-mode', 'normal', 'important');
        element.style.setProperty('position', 'sticky', 'important');
        element.style.setProperty('z-index', '999999', 'important');
        element.style.setProperty('isolation', 'isolate', 'important');

        // 设置巨大的box-shadow来创建不透明背景
        const isLeft = element.classList.contains('ant-table-cell-fix-left');
        const isRight = element.classList.contains('ant-table-cell-fix-right');

        let boxShadow = `0 0 0 2000px ${bgColor}, inset 0 0 0 2000px ${bgColor}, 0 0 0 4000px ${bgColor}`;

        if (isLeft) {
          const borderColor = isDark ? '#374151' : '#e5e7eb';
          element.style.setProperty('border-right', `2px solid ${borderColor}`, 'important');
          boxShadow = `2px 0 8px rgba(0, 0, 0, ${isDark ? '0.3' : '0.1'}), ${boxShadow}`;
        } else if (isRight) {
          const borderColor = isDark ? '#374151' : '#e5e7eb';
          element.style.setProperty('border-left', `2px solid ${borderColor}`, 'important');
          boxShadow = `-2px 0 8px rgba(0, 0, 0, ${isDark ? '0.3' : '0.1'}), ${boxShadow}`;
        }

        element.style.setProperty('box-shadow', boxShadow, 'important');

        // 确保内容也是不透明的
        const children = element.querySelectorAll('*');
        children.forEach((child) => {
          const childElement = child as HTMLElement;
          childElement.style.setProperty('position', 'relative', 'important');
          childElement.style.setProperty('z-index', '1', 'important');
          childElement.style.setProperty('backdrop-filter', 'none', 'important');
          childElement.style.setProperty('-webkit-backdrop-filter', 'none', 'important');
        });
      });

      // 特殊处理表格容器
      const tableWrappers = document.querySelectorAll('.ant-table-wrapper');
      tableWrappers.forEach((wrapper) => {
        const element = wrapper as HTMLElement;
        element.style.setProperty('position', 'relative', 'important');
        element.style.setProperty('z-index', '1', 'important');
      });

      const tableContainers = document.querySelectorAll('.ant-table-container');
      tableContainers.forEach((container) => {
        const element = container as HTMLElement;
        element.style.setProperty('position', 'relative', 'important');
        element.style.setProperty('z-index', '2', 'important');
      });

      const tableContents = document.querySelectorAll('.ant-table-content');
      tableContents.forEach((content) => {
        const element = content as HTMLElement;
        element.style.setProperty('position', 'relative', 'important');
        element.style.setProperty('z-index', '3', 'important');
      });

    } catch (error) {
      console.warn('ForceOpaqueFixedColumns: Error applying opaque styles:', error);
    }
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
  }

  public restart() {
    this.stop();
    setTimeout(() => this.start(), 100);
  }

  // 手动触发修复
  public forceUpdate() {
    this.forceOpaque();
  }
}

// 创建全局实例
const forceOpaqueFixedColumns = new ForceOpaqueFixedColumns();

// 导出实例供外部使用
export default forceOpaqueFixedColumns;

// 在window对象上暴露实例，方便调试
if (typeof window !== 'undefined') {
  (window as any).forceOpaqueFixedColumns = forceOpaqueFixedColumns;
}