import React from 'react';
import { Result, Button } from 'antd';

export const FallbackPage: React.FC = () => {
  return (
    <Result
      status="info"
      title="页面正在开发中"
      subTitle="此页面正在开发中，请稍后再试。"
      extra={
        <Button type="primary" onClick={() => window.location.href = '/dashboard'}>
          返回首页
        </Button>
      }
    />
  );
};