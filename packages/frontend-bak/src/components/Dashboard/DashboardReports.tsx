/**
 * 仪表盘报告生成组件
 * 提供任务报告生成功能
 */

import React, { useState } from 'react';
import { Card, Button, Select, Input } from 'antd';
import { FileTextOutlined } from '@ant-design/icons';
import { taskApi } from '../../api/task';
import { useErrorHandler } from '../../hooks/useErrorHandler';

const { Option } = Select;

export const DashboardReports: React.FC = () => {
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly' | 'total'>('monthly');
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportContent, setReportContent] = useState<string>('');
  const { handleAsyncError } = useErrorHandler();

  const handleGenerateReport = async () => {
    await handleAsyncError(
      async () => {
        setGeneratingReport(true);
        const reportContent = await taskApi.generateReport({
          type: reportType,
        });
        setReportContent(reportContent);
      },
      'DashboardReports.generateReport',
      '报告已生成，请在下方查看',
      '生成报告失败'
    ).finally(() => {
      setGeneratingReport(false);
    });
  };

  return (
    <Card className="report-card">
      <div className="report-header">
        <div className="report-title">
          <FileTextOutlined />
          <span>生成任务报告</span>
        </div>
        <div className="report-controls">
          <Select
            value={reportType}
            onChange={setReportType}
            className="report-select"
          >
            <Option value="daily">日报</Option>
            <Option value="weekly">周报</Option>
            <Option value="monthly">月报</Option>
            <Option value="total">总报</Option>
          </Select>
          <Button 
            type="primary"
            icon={<FileTextOutlined />} 
            onClick={handleGenerateReport}
            loading={generatingReport}
            className="generate-btn"
          >
            生成报告
          </Button>
        </div>
      </div>
      
      <div className="report-content">
        <Input.TextArea
          value={reportContent}
          placeholder="点击上方按钮生成报告，报告内容将显示在这里..."
          autoSize={{ minRows: 8, maxRows: 20 }}
          readOnly
          className="report-textarea"
        />
        <div className="report-hint">
          报告将包含所选时间段内的任务统计、完成情况和赏金收入等信息
        </div>
      </div>
    </Card>
  );
};