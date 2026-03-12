import React from 'react';
import { Card, Tabs } from 'antd';
import { Ranking } from '../../types';
import { RankingTable } from './RankingTable';
import { RankingFilters } from './RankingFilters';

interface RankingTabsProps {
  activeTab: 'monthly' | 'quarterly' | 'all_time';
  rankings: Ranking[];
  loading: boolean;
  currentUserId?: string;
  year: number;
  month: number;
  quarter: number;
  onTabChange: (tab: 'monthly' | 'quarterly' | 'all_time') => void;
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
  onQuarterChange: (quarter: number) => void;
}

export const RankingTabs: React.FC<RankingTabsProps> = ({
  activeTab,
  rankings,
  loading,
  currentUserId,
  year,
  month,
  quarter,
  onTabChange,
  onYearChange,
  onMonthChange,
  onQuarterChange,
}) => {
  return (
    <Card className="ranking-list-card">
      <Tabs
        activeKey={activeTab}
        onChange={(key) => onTabChange(key as 'monthly' | 'quarterly' | 'all_time')}
        className="ranking-tabs"
        tabBarExtraContent={
          <RankingFilters
            activeTab={activeTab}
            year={year}
            month={month}
            quarter={quarter}
            onYearChange={onYearChange}
            onMonthChange={onMonthChange}
            onQuarterChange={onQuarterChange}
          />
        }
        items={[
          {
            key: 'monthly',
            label: '本月排名',
            children: (
              <RankingTable
                rankings={rankings}
                loading={loading}
                currentUserId={currentUserId}
              />
            )
          },
          {
            key: 'quarterly',
            label: '本季度排名',
            children: (
              <RankingTable
                rankings={rankings}
                loading={loading}
                currentUserId={currentUserId}
              />
            )
          },
          {
            key: 'all_time',
            label: '总累积排名',
            children: (
              <RankingTable
                rankings={rankings}
                loading={loading}
                currentUserId={currentUserId}
              />
            )
          }
        ]}
      />
    </Card>
  );
};