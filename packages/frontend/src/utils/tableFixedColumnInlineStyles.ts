/**
 * 表格固定列内联样式强制修复
 * 直接操作DOM元素的style属性，确保样式生效
 */

export function applyFixedColumnInlineStyles() {
  // 查找所有固定列元素
  const fixedRightCells = document.querySelectorAll('.ant-table-cell-fix-right');
  const fixedLeftCells = document.querySelectorAll('.ant-table-cell-fix-left');
  
  const isDarkTheme = document.documentElement.getAttribute('data-theme') === 'dark';
  const backgroundColor = isDarkTheme ? '#0f172a' : '#ffffff';
  const hoverBackgroundColor = isDarkTheme ? '#334155' : '#eff6ff';
  
  // 处理右固定列
  fixedRightCells.forEach((cell) => {
    const element = cell as HTMLElement;
    const row = element.closest('tr');
    const isHovered = row?.matches(':hover') || false;
    const isHeader = element.tagName.toLowerCase() === 'th';
    
    const currentBg = isHovered && !isHeader ? hoverBackgroundColor : backgroundColor;
    
    // 直接设置内联样式
    element.style.cssText = `
      background: ${currentBg} !important;
      background-color: ${currentBg} !important;
      background-image: none !important;
      position: sticky !important;
      z-index: ${isHeader ? '100000' : '99999'} !important;
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
      filter: none !important;
      opacity: 1 !important;
      border-left: 15px solid #3b82f6 !important;
      box-shadow: -35px 0 80px rgba(0, 0, 0, 0.9) !important;
    `;
    
    // 添加悬停监听器
    if (row && !isHeader) {
      const handleMouseEnter = () => {
        element.style.backgroundColor = hoverBackgroundColor;
        element.style.background = hoverBackgroundColor;
      };
      
      const handleMouseLeave = () => {
        element.style.backgroundColor = backgroundColor;
        element.style.background = backgroundColor;
      };
      
      row.removeEventListener('mouseenter', handleMouseEnter);
      row.removeEventListener('mouseleave', handleMouseLeave);
      row.addEventListener('mouseenter', handleMouseEnter);
      row.addEventListener('mouseleave', handleMouseLeave);
    }
  });
  
  // 处理左固定列
  fixedLeftCells.forEach((cell) => {
    const element = cell as HTMLElement;
    const row = element.closest('tr');
    const isHovered = row?.matches(':hover') || false;
    const isHeader = element.tagName.toLowerCase() === 'th';
    
    const currentBg = isHovered && !isHeader ? hoverBackgroundColor : backgroundColor;
    
    // 直接设置内联样式
    element.style.cssText = `
      background: ${currentBg} !important;
      background-color: ${currentBg} !important;
      background-image: none !important;
      position: sticky !important;
      z-index: ${isHeader ? '100000' : '99999'} !important;
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
      filter: none !important;
      opacity: 1 !important;
      border-right: 15px solid #3b82f6 !important;
      box-shadow: 35px 0 80px rgba(0, 0, 0, 0.9) !important;
    `;
    
    // 添加悬停监听器
    if (row && !isHeader) {
      const handleMouseEnter = () => {
        element.style.backgroundColor = hoverBackgroundColor;
        element.style.background = hoverBackgroundColor;
      };
      
      const handleMouseLeave = () => {
        element.style.backgroundColor = backgroundColor;
        element.style.background = backgroundColor;
      };
      
      row.removeEventListener('mouseenter', handleMouseEnter);
      row.removeEventListener('mouseleave', handleMouseLeave);
      row.addEventListener('mouseenter', handleMouseEnter);
      row.addEventListener('mouseleave', handleMouseLeave);
    }
  });
  
  console.log(`Applied inline styles to ${fixedRightCells.length + fixedLeftCells.length} fixed column cells`);
}

// 创建观察器监听DOM变化
let observer: MutationObserver | null = null;

export function startFixedColumnInlineStylesWatcher() {
  if (observer) return;
  
  // 立即应用样式
  applyFixedColumnInlineStyles();
  
  // 创建观察器
  observer = new MutationObserver((mutations) => {
    let shouldApply = false;
    
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            if (element.classList?.contains('ant-table') || 
                element.querySelector?.('.ant-table') ||
                element.classList?.contains('ant-table-cell-fix-right') ||
                element.classList?.contains('ant-table-cell-fix-left')) {
              shouldApply = true;
            }
          }
        });
      }
    });
    
    if (shouldApply) {
      setTimeout(applyFixedColumnInlineStyles, 50);
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // 定期强制刷新
  setInterval(applyFixedColumnInlineStyles, 2000);
  
  console.log('Fixed column inline styles watcher started');
}

export function stopFixedColumnInlineStylesWatcher() {
  if (observer) {
    observer.disconnect();
    observer = null;
    console.log('Fixed column inline styles watcher stopped');
  }
}

// 自动启动
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(startFixedColumnInlineStylesWatcher, 100);
    });
  } else {
    setTimeout(startFixedColumnInlineStylesWatcher, 100);
  }
}