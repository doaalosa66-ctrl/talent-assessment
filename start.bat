@echo off
echo ========================================
echo 路之音智能人才评估系统启动中...
echo ========================================
echo.

:: 检查node是否安装
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [错误] 未检测到Node.js，请先安装Node.js
    pause
    exit /b 1
)

:: 检查是否已安装依赖
if not exist "node_modules" (
    echo [提示] 首次运行，正在安装依赖...
    call npm install
)

if not exist "backend\node_modules" (
    echo [提示] 正在安装后端依赖...
    cd backend
    call npm install
    cd ..
)

if not exist "frontend\node_modules" (
    echo [提示] 正在安装前端依赖...
    cd frontend
    call npm install
    cd ..
)

:: 创建uploads目录
if not exist "backend\uploads" (
    mkdir backend\uploads
)

echo.
echo ========================================
echo 依赖检查完成，正在启动服务...
echo ========================================
echo.
echo [前端] http://localhost:3000
echo [后端] http://localhost:3001
echo.
echo 按 Ctrl+C 停止服务
echo ========================================
echo.

:: 启动开发服务
call npm run dev
