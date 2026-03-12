import { Card } from 'antd';
import type { CardProps } from 'antd';
import type { TableProps } from 'antd/es/table';
import { Table } from 'antd';

interface TableCardProps<RecordType> extends TableProps<RecordType> {
  cardProps?: CardProps;
}

export function TableCard<RecordType extends object = any>({
  cardProps,
  pagination,
  scroll,
  ...tableProps
}: TableCardProps<RecordType>) {
  return (
    <Card {...cardProps}>
      <Table
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
          ...(pagination as object),
        }}
        scroll={{ x: 1000, ...(scroll as object) }}
        {...tableProps}
      />
    </Card>
  );
}
