/**
 * 终极表格固定列不透明修复工具
 * 使用内联样式强制覆盖所有可能的透明度设置
 */

class UltimateOpaqueFixedColumns {
  private intervalId: number | null = null;
  private observer: MutationObserver | null = null;
  private isActive = false;
  private lastFixTime = 0;

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
    this.ultimateFix();

    // 超高频率定时器 - 每25ms检查一次
    this.intervalId = window.setInterval(() => {
      this.ultimateFix();
    }, 25);

    // 设置DOM观察器
    this.setupObserver();

    // 监听所有可能的事件
    this.setupEventListeners();

    console.log('[UltimateOpaqueFixedColumns] 终极不透明修复已启动');
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

    console.log('[UltimateOpaqueFixedColumns] 终极不透明修复已停止');
  }

  private ultimateFix() {
    try {
      const now = Date.now();
      if (now - this.lastFixTime < 20) return; // 防止过度执行
      this.lastFixTime = now;

      // 获取当前主题
      const isDark = this.isDarkTheme();
      const colors = this.getThemeColors(isDark);

      // 查找所有固定列
      const fixedCells = document.querySelectorAll('.ant-table-cell-fix-left, .ant-table-cell-fix-right');

      fixedCells.forEach((cell) => {
        const element = cell as HTMLElement;
        const row = element.closest('tr');
        const isHovered = row?.matches(':hover') || false;
        const bgColor = isHovered ? colors.hoverBg : colors.normalBg;

        // 应用终极样式
        this.applyUltimateStyles(element, bgColor, colors, isDark);
      });

      // 强制重绘
      this.forceRepaint();

    } catch (error) {
      console.warn('[UltimateOpaqueFixedColumns] 修复过程中出现错误:', error);
    }
  }

  private isDarkTheme(): boolean {
    return document.documentElement.getAttribute('data-theme') === 'dark' ||
           document.body.classList.contains('dark') ||
           document.documentElement.classList.contains('dark') ||
           window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  private getThemeColors(isDark: boolean) {
    return {
      normalBg: isDark ? '#1e293b' : '#ffffff',
      hoverBg: isDark ? '#334155' : '#f8fafc',
      borderColor: isDark ? '#374151' : '#e5e7eb',
      shadowOpacity: isDark ? '0.3' : '0.1'
    };
  }

  private applyUltimateStyles(element: HTMLElement, bgColor: string, colors: any, _isDark: boolean) {
    const isLeft = element.classList.contains('ant-table-cell-fix-left');
    const isRight = element.classList.contains('ant-table-cell-fix-right');

    // 移除所有可能的透明度相关属性
    element.style.removeProperty('opacity');
    element.style.removeProperty('filter');
    element.style.removeProperty('backdrop-filter');
    element.style.removeProperty('-webkit-backdrop-filter');
    element.style.removeProperty('mix-blend-mode');

    // 强制设置基础样式
    const criticalStyles = [
      ['background', bgColor, 'important'],
      ['background-color', bgColor, 'important'],
      ['background-image', 'none', 'important'],
      ['opacity', '1', 'important'],
      ['filter', 'none', 'important'],
      ['backdrop-filter', 'none', 'important'],
      ['-webkit-backdrop-filter', 'none', 'important'],
      ['mix-blend-mode', 'normal', 'important'],
      ['position', 'sticky', 'important'],
      ['z-index', '999999999', 'important'],
      ['isolation', 'isolate', 'important'],
      ['contain', 'layout style paint', 'important'],
      ['transform', 'translateZ(0) translate3d(0, 0, 0)', 'important'],
      ['will-change', 'auto', 'important'],
      ['backface-visibility', 'hidden', 'important'],
      ['-webkit-backface-visibility', 'hidden', 'important'],
      ['clip-path', 'inset(0)', 'important'],
      ['-webkit-clip-path', 'inset(0)', 'important']
    ];

    // 应用所有关键样式
    criticalStyles.forEach(([property, value, priority]) => {
      element.style.setProperty(property, value, priority);
    });

    // 设置边框和阴影
    if (isLeft) {
      element.style.setProperty('border-right', `2px solid ${colors.borderColor}`, 'important');
      element.style.setProperty('box-shadow', 
        `2px 0 8px rgba(0, 0, 0, ${colors.shadowOpacity}), 0 0 0 5000px ${bgColor}`, 'important');
      element.style.setProperty('outline', `5000px solid ${bgColor}`, 'important');
      element.style.setProperty('outline-offset', '-5000px', 'important');
    } else if (isRight) {
      element.style.setProperty('border-left', `2px solid ${colors.borderColor}`, 'important');
      element.style.setProperty('box-shadow', 
        `-2px 0 8px rgba(0, 0, 0, ${colors.shadowOpacity}), 0 0 0 5000px ${bgColor}`, 'important');
      element.style.setProperty('outline', `5000px solid ${bgColor}`, 'important');
      element.style.setProperty('outline-offset', '-5000px', 'important');
    }

    // 创建动态伪元素样式
    this.createDynamicPseudoStyles(element, bgColor);

    // 确保子元素不透明
    this.fixChildElements(element);

    // 强制触发重绘
    element.offsetHeight;
  }

  private createDynamicPseudoStyles(element: HTMLElement, bgColor: string) {
    const cellId = element.getAttribute('data-ultimate-cell-id') || 
                   `ultimate-cell-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    element.setAttribute('data-ultimate-cell-id', cellId);

    // 移除现有样式
    const existingStyle = document.querySelector(`style[data-ultimate-opaque="${cellId}"]`);
    if (existingStyle) {
      existingStyle.remove();
    }

    // 创建新的伪元素样式
    const style = document.createElement('style');
    style.setAttribute('data-ultimate-opaque', cellId);
    style.textContent = `
      [data-ultimate-cell-id="${cellId}"]::before {
        content: '' !important;
        position: absolute !important;
        top: -15000px !important;
        left: -15000px !important;
        right: -15000px !important;
        bottom: -15000px !important;
        width: 30000px !important;
        height: 30000px !important;
        background: ${bgColor} !important;
        background-color: ${bgColor} !important;
        z-index: -1 !important;
        pointer-events: none !important;
        opacity: 1 !important;
        display: block !important;
      }
      
      [data-ultimate-cell-id="${cellId}"]::after {
        content: '' !important;
        position: absolute !important;
        top: -12000px !important;
        left: -12000px !important;
        right: -12000px !important;
        bottom: -12000px !important;
        width: 24000px !important;
        height: 24000px !important;
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

  private fixChildElements(element: HTMLElement) {
    const children = element.querySelectorAll('*');
    children.forEach((child) => {
      const childElement = child as HTMLElement;
      childElement.style.setProperty('position', 'relative', 'important');
      childElement.style.setProperty('z-index', '100', 'important');
      childElement.style.setProperty('background', 'transparent', 'important');
      childElement.style.setProperty('opacity', '1', 'important');
      childElement.style.setProperty('filter', 'none', 'important');
      childElement.style.setProperty('backdrop-filter', 'none', 'important');
      childElement.style.setProperty('-webkit-backdrop-filter', 'none', 'important');
      childElement.style.setProperty('mix-blend-mode', 'normal', 'important');
    });
  }

  private forceRepaint() {
    const tables = document.querySelectorAll('.task-table-wrapper .ant-table');
    tables.forEach((table) => {
      const element = table as HTMLElement;
      const originalTransform = element.style.transform;
      element.style.transform = 'translateZ(0) translate3d(0.1px, 0, 0)';
      element.offsetHeight; // 触发重绘
      element.style.transform = originalTransform;
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
              target.classList?.contains('ant-table-cell-fix-right') ||
              target.closest?.('.task-table-wrapper')) {
            shouldUpdate = true;
          }
        }
      });

      if (shouldUpdate) {
        setTimeout(() => this.ultimateFix(), 1);
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
      this.ultimateFix();
    }, { passive: true });

    // 窗口调整事件
    window.addEventListener('resize', () => {
      setTimeout(() => this.ultimateFix(), 5);
    });

    // 鼠标事件
    document.addEventListener('mouseover', (e) => {
      const target = e.target as Element;
      if (target.closest('.ant-table-row') || target.closest('.task-table-wrapper')) {
        setTimeout(() => this.ultimateFix(), 1);
      }
    }, { passive: true });

    document.addEventListener('mouseout', (e) => {
      const target = e.target as Element;
      if (target.closest('.ant-table-row') || target.closest('.task-table-wrapper')) {
        setTimeout(() => this.ultimateFix(), 1);
      }
    }, { passive: true });

    // 表格滚动事件
    const setupTableScrollListeners = () => {
      const tableContainers = document.querySelectorAll('.ant-table-body, .task-table-wrapper');
      tableContainers.forEach(container => {
        container.addEventListener('scroll', () => {
          this.ultimateFix();
        }, { passive: true });
      });
    };

    setupTableScrollListeners();
    
    // 定期重新设置滚动监听器
    setInterval(setupTableScrollListeners, 500);

    // 主题变化监听
    const htmlElement = document.documentElement;
    const themeObserver = new MutationObserver(() => {
      setTimeout(() => this.ultimateFix(), 5);
    });

    themeObserver.observe(htmlElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'class']
    });

    // 媒体查询监听
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    darkModeQuery.addEventListener('change', () => {
      setTimeout(() => this.ultimateFix(), 5);
    });
  }

  // 手动触发修复
  public forceUpdate() {
    this.ultimateFix();
  }

  // 清理所有伪元素样式
  public cleanup() {
    const styles = document.querySelectorAll('style[data-ultimate-opaque]');
    styles.forEach(style => style.remove());
  }

  // 获取状态信息
  public getStatus() {
    return {
      isActive: this.isActive,
      fixedCellsCount: document.querySelectorAll('.ant-table-cell-fix-left, .ant-table-cell-fix-right').length,
      lastFixTime: this.lastFixTime
    };
  }
}

// 创建全局实例
const ultimateOpaqueFixedColumns = new UltimateOpaqueFixedColumns();

// 导出实例
export default ultimateOpaqueFixedColumns;

// 在window对象上暴露实例，方便调试
if (typeof window !== 'undefined') {
  (window as any).ultimateOpaqueFixedColumns = ultimateOpaqueFixedColumns;
}