import React from 'react';
import { Select } from 'antd';

const { Option } = Select;

interface RankingFiltersProps {
  activeTab: 'monthly' | 'quarterly' | 'all_time';
  year: number;
  month: number;
  quarter: number;
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
  onQuarterChange: (quarter: number) => void;
}

export const RankingFilters: React.FC<RankingFiltersProps> = ({
  activeTab,
  year,
  month,
  quarter,
  onYearChange,
  onMonthChange,
  onQuarterChange,
}) => {
  if (activeTab === 'all_time') {
    return null;
  }

  return (
    <div className="tab-controls">
      <Select
        value={year}
        onChange={onYearChange}
        className="year-select"
      >
        {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((y) => (
          <Option key={y} value={y}>
            {y}年
          </Option>
        ))}
      </Select>
      
      {activeTab === 'monthly' && (
        <Select
          value={month}
          onChange={onMonthChange}
          className="month-select"
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <Option key={m} value={m}>
              {m}月
            </Option>
          ))}
        </Select>
      )}
      
      {activeTab === 'quarterly' && (
        <Select
          value={quarter}
          onChange={onQuarterChange}
          className="quarter-select"
        >
          <Option value={1}>第1季度</Option>
          <Option value={2}>第2季度</Option>
          <Option value={3}>第3季度</Option>
          <Option value={4}>第4季度</Option>
        </Select>
      )}
    </div>
  );
};