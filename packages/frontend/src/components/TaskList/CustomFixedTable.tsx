/**
 * 自定义固定列表格组件
 * 使用CSS Grid布局彻底解决固定列重叠问题
 */

import React, { useEffect, useRef } from 'react';
import { Table, ConfigProvider } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type { FilterValue, SorterResult } from 'antd/es/table/interface';
import { Task } from '../../types';

interface CustomFixedTableProps {
  columns: ColumnsType<Task>;
  dataSource: Task[];
  rowKey: string;
  loading: boolean;
  pagination: TablePaginationConfig;
  onChange: (
    pagination: TablePaginationConfig,
    filters: Record<string, FilterValue | null>,
    sorter: SorterResult<Task> | SorterResult<Task>[]
  ) => void;
  onRow: (record: Task) => any;
  rowClassName: () => string;
  scroll: { x: number };
  size: 'small' | 'middle' | 'large';
  className: string;
}

export const CustomFixedTable: React.FC<CustomFixedTableProps> = (props) => {
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const applyCustomFixedStyles = () => {
      if (!tableRef.current) return;

      const table = tableRef.current.querySelector('.ant-table');
      if (!table) return;

      // 移除Antd的固定列样式
      const fixedCells = table.querySelectorAll('.ant-table-cell-fix-right, .ant-table-cell-fix-left');
      fixedCells.forEach((cell) => {
        const element = cell as HTMLElement;
        element.style.position = 'static';
        element.style.zIndex = 'auto';
      });

      // 应用自定义Grid布局
      const tableBody = table.querySelector('.ant-table-tbody');
      const tableHeader = table.querySelector('.ant-table-thead');
      
      if (tableBody) {
        (tableBody as HTMLElement).style.cssText = `
          display: block;
          overflow-x: auto;
          white-space: nowrap;
        `;
      }

      if (tableHeader) {
        (tableHeader as HTMLElement).style.cssText = `
          display: block;
          overflow-x: auto;
          white-space: nowrap;
        `;
      }

      // 为每一行应用Grid布局
      const rows = table.querySelectorAll('tr');
      rows.forEach((row) => {
        const element = row as HTMLElement;
        element.style.cssText = `
          display: grid;
          grid-template-columns: 200px 100px 120px 150px 100px 100px 100px 150px 150px 150px 200px;
          min-width: 1500px;
        `;

        // 固定最后一列（操作列）
        const cells = row.querySelectorAll('td, th');
        if (cells.length > 0) {
          const lastCell = cells[cells.length - 1] as HTMLElement;
          lastCell.style.cssText = `
            position: sticky;
            right: 0;
            background: #ffffff;
            z-index: 999;
            border-left: 3px solid #3b82f6;
            box-shadow: -10px 0 20px rgba(0, 0, 0, 0.1);
          `;

          // 暗色主题适配
          if (document.documentElement.getAttribute('data-theme') === 'dark') {
            lastCell.style.background = '#0f172a';
          }
        }
      });
    };

    // 初始应用
    setTimeout(applyCustomFixedStyles, 100);

    // 监听数据变化
    const observer = new MutationObserver(applyCustomFixedStyles);
    if (tableRef.current) {
      observer.observe(tableRef.current, {
        childList: true,
        subtree: true
      });
    }

    return () => observer.disconnect();
  }, [props.dataSource, props.loading]);

  return (
    <div ref={tableRef} className="custom-fixed-table-wrapper">
      <ConfigProvider
        theme={{
          components: {
            Table: {
              // 禁用Antd的固定列功能
              cellFixedBackground: 'transparent',
            }
          }
        }}
      >
        <Table
          {...props}
          // 移除固定列配置
          columns={props.columns.map(col => ({
            ...col,
            fixed: undefined // 移除所有fixed配置
          }))}
        />
      </ConfigProvider>
      
      <style jsx>{`
        .custom-fixed-table-wrapper .ant-table-wrapper {
          overflow: visible;
        }
        
        .custom-fixed-table-wrapper .ant-table-container {
          overflow: visible;
        }
        
        .custom-fixed-table-wrapper .ant-table-content {
          overflow-x: auto;
          overflow-y: visible;
        }
        
        .custom-fixed-table-wrapper .ant-table {
          min-width: 1500px;
        }
        
        .custom-fixed-table-wrapper .ant-table-thead > tr,
        .custom-fixed-table-wrapper .ant-table-tbody > tr {
          display: grid !important;
          grid-template-columns: 200px 100px 120px 150px 100px 100px 100px 150px 150px 150px 200px !important;
          min-width: 1500px !important;
        }
        
        .custom-fixed-table-wrapper .ant-table-tbody > tr > td:last-child,
        .custom-fixed-table-wrapper .ant-table-thead > tr > th:last-child {
          position: sticky !important;
          right: 0 !important;
          background: #ffffff !important;
          z-index: 999 !important;
          border-left: 3px solid #3b82f6 !important;
          box-shadow: -10px 0 20px rgba(0, 0, 0, 0.1) !important;
        }
        
        [data-theme="dark"] .custom-fixed-table-wrapper .ant-table-tbody > tr > td:last-child,
        [data-theme="dark"] .custom-fixed-table-wrapper .ant-table-thead > tr > th:last-child {
          background: #0f172a !important;
        }
        
        .custom-fixed-table-wrapper .ant-table-tbody > tr:hover > td:last-child {
          background: #eff6ff !important;
        }
        
        [data-theme="dark"] .custom-fixed-table-wrapper .ant-table-tbody > tr:hover > td:last-child {
          background: #334155 !important;
        }
      `}</style>
    </div>
  );
};