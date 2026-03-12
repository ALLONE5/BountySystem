@echo off
echo ========================================
echo 重启备份前端服务 (端口 5174)
echo ========================================
echo.

cd packages\frontend-bak

echo 正在启动备份前端...
echo 访问地址: http://localhost:5174
echo.
echo 按 Ctrl+C 停止服务
echo.

npm run dev
