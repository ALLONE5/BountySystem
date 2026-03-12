@echo off
echo ========================================
echo 清除缓存并重启备份前端
echo ========================================
echo.

cd packages\frontend-bak

echo [1/4] 删除 node_modules/.vite 缓存...
if exist "node_modules\.vite" (
    rmdir /s /q "node_modules\.vite"
    echo ✓ Vite 缓存已删除
) else (
    echo ✓ Vite 缓存不存在，跳过
)

echo.
echo [2/4] 删除 dist 目录...
if exist "dist" (
    rmdir /s /q "dist"
    echo ✓ dist 目录已删除
) else (
    echo ✓ dist 目录不存在，跳过
)

echo.
echo [3/4] 清除 npm 缓存...
npm cache clean --force
echo ✓ npm 缓存已清除

echo.
echo [4/4] 启动备份前端服务...
echo.
echo ========================================
echo 服务启动中...
echo 访问地址: http://localhost:5174
echo.
echo 重要提示：
echo 1. 在浏览器中按 Ctrl+Shift+Delete 清除浏览器缓存
echo 2. 或按 F12 打开开发者工具，右键刷新按钮选择"清空缓存并硬性重新加载"
echo 3. 查看控制台是否有蓝色的 [LoginPage] 和 [AuthContext] 日志
echo.
echo 按 Ctrl+C 停止服务
echo ========================================
echo.

npm run dev
