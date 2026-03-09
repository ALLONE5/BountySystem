/**
 * 暴力修复表格固定列透明度问题
 * 使用最直接的方法强制覆盖所有可能的样式
 */

class BruteForceFixedColumnFix {
  private intervalId: number | null = null;
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
    this.bruteForceFix();

    // 极高频率定时器 - 每10ms检查一次
    this.intervalId = window.setInterval(() => {
      this.bruteForceFix();
    }, 10);

    console.log('[BruteForceFixedColumnFix] 暴力修复已启动');
  }

  public stop() {
    if (!this.isActive) return;
    this.isActive = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    console.log('[BruteForceFixedColumnFix] 暴力修复已停止');
  }

  private bruteForceFix() {
    try {
      // 获取所有可能的固定列选择器
      const selectors = [
        '.ant-table-cell-fix-left',
        '.ant-table-cell-fix-right',
        '.ant-table-thead .ant-table-cell-fix-left',
        '.ant-table-thead .ant-table-cell-fix-right',
        '.ant-table-tbody .ant-table-cell-fix-left',
        '.ant-table-tbody .ant-table-cell-fix-right',
        'td.ant-table-cell-fix-left',
        'td.ant-table-cell-fix-right',
        'th.ant-table-cell-fix-left',
        'th.ant-table-cell-fix-right'
      ];

      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
          this.applyBruteForceStyles(element as HTMLElement);
        });
      });

    } catch (error) {
      console.warn('[BruteForceFixedColumnFix] 修复过程中出现错误:', error);
    }
  }

  private applyBruteForceStyles(element: HTMLElement) {
    if (!element) return;

    // 获取当前主题
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark' ||
                   document.body.classList.contains('dark') ||
                   document.documentElement.classList.contains('dark');

    const row = element.closest('tr');
    const isHovered = row?.matches(':hover') || false;

    // 确定背景色
    let bgColor: string;
    if (isDark) {
      bgColor = isHovered ? '#334155' : '#1e293b';
    } else {
      bgColor = isHovered ? '#f8fafc' : '#ffffff';
    }

    // 暴力设置所有可能的背景相关属性
    const styles = [
      'background',
      'background-color',
      'background-image',
      'backgroundColor'
    ];

    styles.forEach(prop => {
      if (prop === 'background-image') {
        element.style.setProperty(prop, 'none', 'important');
      } else {
        element.style.setProperty(prop, bgColor, 'important');
      }
    });

    // 暴力设置透明度相关属性
    element.style.setProperty('opacity', '1', 'important');
    element.style.setProperty('filter', 'none', 'important');
    element.style.setProperty('backdrop-filter', 'none', 'important');
    element.style.setProperty('-webkit-backdrop-filter', 'none', 'important');
    element.style.setProperty('mix-blend-mode', 'normal', 'important');

    // 暴力设置定位相关属性
    element.style.setProperty('position', 'sticky', 'important');
    element.style.setProperty('z-index', '999999999', 'important');
    element.style.setProperty('isolation', 'isolate', 'important');

    // 创建超大阴影覆盖
    const shadowLayers = [
      `0 0 0 10000px ${bgColor}`,
      `inset 0 0 0 10000px ${bgColor}`,
      `0 -10000px 0 10000px ${bgColor}`,
      `0 10000px 0 10000px ${bgColor}`,
      `-10000px 0 0 10000px ${bgColor}`,
      `10000px 0 0 10000px ${bgColor}`
    ];

    element.style.setProperty('box-shadow', shadowLayers.join(', '), 'important');

    // 使用outline创建额外覆盖
    element.style.setProperty('outline', `10000px solid ${bgColor}`, 'important');
    element.style.setProperty('outline-offset', '-10000px', 'important');

    // 设置边框
    const borderColor = isDark ? '#374151' : '#e5e7eb';
    if (element.classList.contains('ant-table-cell-fix-left')) {
      element.style.setProperty('border-right', `2px solid ${borderColor}`, 'important');
    }
    if (element.classList.contains('ant-table-cell-fix-right')) {
      element.style.setProperty('border-left', `2px solid ${borderColor}`, 'important');
    }

    // 强制重绘
    element.style.setProperty('transform', 'translateZ(0) translate3d(0, 0, 0)', 'important');
    element.style.setProperty('will-change', 'auto', 'important');
    element.style.setProperty('backface-visibility', 'hidden', 'important');
    element.style.setProperty('-webkit-backface-visibility', 'hidden', 'important');

    // 处理子元素
    const children = element.querySelectorAll('*');
    children.forEach(child => {
      const childElement = child as HTMLElement;
      childElement.style.setProperty('position', 'relative', 'important');
      childElement.style.setProperty('z-index', '100', 'important');
      childElement.style.setProperty('background', 'transparent', 'important');
      childElement.style.setProperty('opacity', '1', 'important');
    });

    // 触发重绘
    element.offsetHeight;
  }

  // 手动触发修复
  public forceUpdate() {
    this.bruteForceFix();
  }
}

// 创建全局实例
const bruteForceFixedColumnFix = new BruteForceFixedColumnFix();

// 导出实例
export default bruteForceFixedColumnFix;

// 在window对象上暴露实例，方便调试
if (typeof window !== 'undefined') {
  (window as any).bruteForceFixedColumnFix = bruteForceFixedColumnFix;
}