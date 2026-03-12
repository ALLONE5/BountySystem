@echo off
echo ========================================
echo 前端对比工具
echo ========================================
echo.
echo 正在检查备份前端依赖...

if not exist "packages\frontend-bak\node_modules" (
    echo 首次运行，需要安装备份前端依赖...
    cd packages\frontend-bak
    call npm install
    cd ..\..
    echo.
)

echo.
echo 启动两个前端进行对比...
echo.
echo 当前前端: http://localhost:5173
echo 备份前端: http://localhost:5174
echo.
echo 按 Ctrl+C 停止所有服务
echo.

node scripts/start-both-frontends.js
