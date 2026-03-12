@echo off
echo ========================================
echo 前端按钮对比调试工具
echo ========================================
echo.
echo 此脚本将帮助你对比两个前端的按钮显示情况
echo.
echo 当前情况：
echo - 5173（工作前端）：按钮较少
echo - 5174（备份前端）：按钮完整
echo.
echo ========================================
echo 调试步骤
echo ========================================
echo.
echo 1. 确保两个前端都在运行
echo    - 工作前端：http://localhost:5173
echo    - 备份前端：http://localhost:5174
echo.
echo 2. 打开两个浏览器窗口（或标签页）
echo    - 窗口1：访问 http://localhost:5173
echo    - 窗口2：访问 http://localhost:5174
echo.
echo 3. 在两个窗口中都登录 admin 账号
echo.
echo 4. 在两个窗口中都打开开发者工具（F12）
echo.
echo 5. 在两个窗口中都切换到 Console 标签
echo.
echo 6. 在两个窗口中都导航到"我的悬赏"页面
echo.
echo 7. 对比控制台日志输出
echo.
echo ========================================
echo 需要对比的日志
echo ========================================
echo.
echo Props 对比：
echo   [5173 TaskListTable] Props: {...}
echo   [TaskListTable] Props: {...}
echo.
echo 任务状态对比（每个任务）：
echo   [5173 TaskListTable] Task xxx: {...}
echo   [TaskListTable] Task xxx: {...}
echo.
echo 按钮结果对比（每个任务）：
echo   [5173 TaskListTable] Task xxx final buttons: [...]
echo   [TaskListTable] Task xxx final buttons: [...]
echo.
echo ========================================
echo 关键检查点
echo ========================================
echo.
echo 1. Props 是否一致？
echo    - showAssignButton
echo    - hasOnPublishTask
echo    - hasOnEditTask
echo    - hasOnDeleteTask
echo    - isPublishedTasksPage
echo    - hasUser
echo.
echo 2. 任务状态是否一致？
echo    - status
echo    - publisherId
echo    - isPublisher
echo.
echo 3. 按钮条件是否一致？
echo    - canPublish
echo    - canAssign
echo    - canDelete
echo.
echo 4. 最终按钮列表是否一致？
echo    - 5174 应该有：["publish", "edit", "assign", "delete"]
echo    - 5173 缺少哪些？
echo.
echo ========================================
echo 按任意键开始启动前端...
echo ========================================
pause

echo.
echo [1/2] 启动工作前端（5173）...
start "工作前端 5173" cmd /k "cd packages\frontend && npm run dev"
timeout /t 3 /nobreak >nul

echo [2/2] 启动备份前端（5174）...
start "备份前端 5174" cmd /k "cd packages\frontend-bak && npm run dev"

echo.
echo ========================================
echo 前端已启动！
echo ========================================
echo.
echo 工作前端：http://localhost:5173
echo 备份前端：http://localhost:5174
echo.
echo 请按照上述步骤进行对比调试
echo.
pause
