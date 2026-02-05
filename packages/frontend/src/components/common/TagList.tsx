import { Tag, Space } from 'antd';
import React from 'react';

export interface TagItem {
  key: React.Key;
  label: React.ReactNode;
  color?: string;
}

interface TagListProps {
  items?: TagItem[] | string[];
  color?: string;
  emptyText?: React.ReactNode;
  direction?: 'horizontal' | 'vertical';
  wrap?: boolean;
  size?: number;
  renderLabel?: (item: TagItem | string) => React.ReactNode;
}

export const TagList: React.FC<TagListProps> = ({
  items,
  color,
  emptyText = <span style={{ color: '#999' }}>无</span>,
  direction = 'horizontal',
  wrap = true,
  size = 4,
  renderLabel,
}) => {
  if (!items || items.length === 0) return <>{emptyText}</>;

  const normalized = items.map((item) =>
    typeof item === 'string' ? { key: item, label: item, color } : item,
  );

  return (
    <Space direction={direction} size={[0, size]} wrap={wrap}>
      {normalized.map((item) => (
        <Tag key={item.key} color={item.color || color}>
          {renderLabel ? renderLabel(item) : item.label}
        </Tag>
      ))}
    </Space>
  );
};
