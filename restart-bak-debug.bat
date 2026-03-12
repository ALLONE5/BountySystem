@echo off
echo ========================================
echo 重启备份前端（带调试日志）
echo ========================================
echo.

echo [1/3] 停止现有进程...
taskkill /F /IM node.exe /FI "WINDOWTITLE eq npm*" 2>nul
timeout /t 2 /nobreak >nul

echo [2/3] 清除缓存...
cd packages\frontend-bak
if exist .vite rmdir /s /q .vite
if exist dist rmdir /s /q dist
if exist node_modules\.vite rmdir /s /q node_modules\.vite
echo 缓存已清除

echo [3/3] 启动开发服务器...
echo.
echo ========================================
echo 服务器将在 http://localhost:5174 启动
echo 请打开浏览器控制台查看调试日志
echo ========================================
echo.
npm run dev

pause
