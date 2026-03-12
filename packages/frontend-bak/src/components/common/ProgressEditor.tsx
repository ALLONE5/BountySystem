import React from 'react';
import { Slider, Button, Typography, Space } from 'antd';

const { Text } = Typography;

interface ProgressEditorProps {
  value: number;
  onChange: (val: number) => void;
  onSave: () => void;
  loading?: boolean;
  min?: number;
  max?: number;
}

export const ProgressEditor: React.FC<ProgressEditorProps> = ({
  value,
  onChange,
  onSave,
  loading = false,
  min = 0,
  max = 100,
}) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, maxWidth: 450 }}>
      <Slider
        style={{ flex: 1, minWidth: 200 }}
        value={value}
        onChange={onChange}
        min={min}
        max={max}
      />
      <Text style={{ width: 50, textAlign: 'right' }}>{value}%</Text>
      <Space>
        <Button size="small" type="primary" loading={loading} onClick={onSave}>
          保存
        </Button>
      </Space>
    </div>
  );
};
