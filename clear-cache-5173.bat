@echo off
echo ========================================
echo 清除 5173 前端缓存并重启
echo ========================================
echo.

cd packages\frontend

echo [1/4] 停止现有进程...
taskkill /F /IM node.exe /T 2>nul
timeout /t 2 /nobreak >nul

echo [2/4] 删除 node_modules\.vite 缓存...
if exist node_modules\.vite (
    rmdir /s /q node_modules\.vite
    echo     已删除 node_modules\.vite
) else (
    echo     node_modules\.vite 不存在
)

echo [3/4] 删除 dist 目录...
if exist dist (
    rmdir /s /q dist
    echo     已删除 dist
) else (
    echo     dist 不存在
)

echo [4/4] 启动开发服务器...
echo.
echo ========================================
echo 正在启动 http://localhost:5173
echo 请在浏览器中按 Ctrl+Shift+R 强制刷新
echo ========================================
echo.

start cmd /k "npm run dev"

echo.
echo 完成！请等待服务器启动...
pause
