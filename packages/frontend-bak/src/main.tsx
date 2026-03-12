import React from 'react';
import ReactDOM from 'react-dom/client';
import 'antd/dist/reset.css';
import './styles/global.css';
import App from './App';
import { setupTokenRefresh } from './utils/tokenRefresh';

// 设置 token 刷新机制
setupTokenRefresh();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
