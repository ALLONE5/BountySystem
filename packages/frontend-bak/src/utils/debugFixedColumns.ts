/**
 * 表格固定列调试工具
 * 用于检查和诊断固定列透明度问题
 */

interface FixedColumnDebugInfo {
  element: HTMLElement;
  selector: string;
  computedStyles: {
    background: string;
    backgroundColor: string;
    backgroundImage: string;
    opacity: string;
    zIndex: string;
    position: string;
    boxShadow: string;
    outline: string;
  };
  inlineStyles: {
    background: string;
    backgroundColor: string;
    backgroundImage: string;
    opacity: string;
  };
  isVisible: boolean;
  boundingRect: DOMRect;
}

class DebugFixedColumns {
  public analyzeFixedColumns(): FixedColumnDebugInfo[] {
    const selectors = [
      '.ant-table-cell-fix-left',
      '.ant-table-cell-fix-right',
      'td.ant-table-cell-fix-left',
      'td.ant-table-cell-fix-right',
      'th.ant-table-cell-fix-left',
      'th.ant-table-cell-fix-right'
    ];

    const results: FixedColumnDebugInfo[] = [];

    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        const htmlElement = element as HTMLElement;
        const computedStyle = getComputedStyle(htmlElement);
        const rect = htmlElement.getBoundingClientRect();

        results.push({
          element: htmlElement,
          selector,
          computedStyles: {
            background: computedStyle.background,
            backgroundColor: computedStyle.backgroundColor,
            backgroundImage: computedStyle.backgroundImage,
            opacity: computedStyle.opacity,
            zIndex: computedStyle.zIndex,
            position: computedStyle.position,
            boxShadow: computedStyle.boxShadow,
            outline: computedStyle.outline,
          },
          inlineStyles: {
            background: htmlElement.style.background,
            backgroundColor: htmlElement.style.backgroundColor,
            backgroundImage: htmlElement.style.backgroundImage,
            opacity: htmlElement.style.opacity,
          },
          isVisible: rect.width > 0 && rect.height > 0,
          boundingRect: rect
        });
      });
    });

    return results;
  }

  public printDebugInfo(): void {
    const info = this.analyzeFixedColumns();
    
    console.group('🔍 Fixed Columns Debug Info');
    console.log(`Found ${info.length} fixed column elements`);
    
    info.forEach((item, index) => {
      console.group(`📋 Element ${index + 1}: ${item.selector}`);
      console.log('Element:', item.element);
      console.log('Is Visible:', item.isVisible);
      console.log('Bounding Rect:', item.boundingRect);
      
      console.group('💻 Computed Styles');
      Object.entries(item.computedStyles).forEach(([key, value]) => {
        console.log(`${key}:`, value);
      });
      console.groupEnd();
      
      console.group('🎨 Inline Styles');
      Object.entries(item.inlineStyles).forEach(([key, value]) => {
        if (value) {
          console.log(`${key}:`, value);
        }
      });
      console.groupEnd();
      
      console.groupEnd();
    });
    
    console.groupEnd();
  }

  public checkTransparency(): { transparent: FixedColumnDebugInfo[], opaque: FixedColumnDebugInfo[] } {
    const info = this.analyzeFixedColumns();
    const transparent: FixedColumnDebugInfo[] = [];
    const opaque: FixedColumnDebugInfo[] = [];

    info.forEach(item => {
      const opacity = parseFloat(item.computedStyles.opacity);
      const hasBackground = item.computedStyles.backgroundColor !== 'rgba(0, 0, 0, 0)' && 
                           item.computedStyles.backgroundColor !== 'transparent';
      
      if (opacity < 1 || !hasBackground) {
        transparent.push(item);
      } else {
        opaque.push(item);
      }
    });

    return { transparent, opaque };
  }

  public forceFixAll(): void {
    console.log('🔧 Force fixing all fixed columns...');
    
    const selectors = [
      '.ant-table-cell-fix-left',
      '.ant-table-cell-fix-right',
      'td.ant-table-cell-fix-left',
      'td.ant-table-cell-fix-right',
      'th.ant-table-cell-fix-left',
      'th.ant-table-cell-fix-right'
    ];

    let fixedCount = 0;

    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        const htmlElement = element as HTMLElement;
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const bgColor = isDark ? '#1e293b' : '#ffffff';

        // 强制设置样式
        htmlElement.style.setProperty('background', bgColor, 'important');
        htmlElement.style.setProperty('background-color', bgColor, 'important');
        htmlElement.style.setProperty('background-image', 'none', 'important');
        htmlElement.style.setProperty('opacity', '1', 'important');
        htmlElement.style.setProperty('z-index', '999999999', 'important');
        htmlElement.style.setProperty('box-shadow', `0 0 0 10000px ${bgColor}`, 'important');
        htmlElement.style.setProperty('outline', `10000px solid ${bgColor}`, 'important');
        htmlElement.style.setProperty('outline-offset', '-10000px', 'important');

        fixedCount++;
      });
    });

    console.log(`✅ Fixed ${fixedCount} elements`);
  }

  public generateReport(): string {
    const info = this.analyzeFixedColumns();
    const { transparent, opaque } = this.checkTransparency();
    
    let report = '# Fixed Columns Debug Report\n\n';
    report += `**Total Elements Found**: ${info.length}\n`;
    report += `**Opaque Elements**: ${opaque.length}\n`;
    report += `**Transparent Elements**: ${transparent.length}\n\n`;
    
    if (transparent.length > 0) {
      report += '## ⚠️ Transparent Elements (Need Fixing)\n\n';
      transparent.forEach((item, index) => {
        report += `### Element ${index + 1}: ${item.selector}\n`;
        report += `- **Background Color**: ${item.computedStyles.backgroundColor}\n`;
        report += `- **Opacity**: ${item.computedStyles.opacity}\n`;
        report += `- **Z-Index**: ${item.computedStyles.zIndex}\n`;
        report += `- **Box Shadow**: ${item.computedStyles.boxShadow.substring(0, 100)}...\n\n`;
      });
    }
    
    if (opaque.length > 0) {
      report += '## ✅ Opaque Elements (Working Correctly)\n\n';
      opaque.forEach((item, index) => {
        report += `### Element ${index + 1}: ${item.selector}\n`;
        report += `- **Background Color**: ${item.computedStyles.backgroundColor}\n`;
        report += `- **Opacity**: ${item.computedStyles.opacity}\n\n`;
      });
    }
    
    return report;
  }
}

// 创建全局实例
const debugFixedColumns = new DebugFixedColumns();

// 导出实例
export default debugFixedColumns;

// 在window对象上暴露实例，方便调试
if (typeof window !== 'undefined') {
  (window as any).debugFixedColumns = debugFixedColumns;
  
  // 添加快捷调试命令
  (window as any).checkFixedColumns = () => debugFixedColumns.printDebugInfo();
  (window as any).fixAllColumns = () => debugFixedColumns.forceFixAll();
  (window as any).checkTransparency = () => {
    const result = debugFixedColumns.checkTransparency();
    console.log('Transparent elements:', result.transparent.length);
    console.log('Opaque elements:', result.opaque.length);
    return result;
  };
}