@echo off
echo ========================================
echo 重启路之音智能人才评估系统
echo ========================================
echo.

:: 停止所有node进程
echo [1/3] 停止现有服务...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

:: 启动后端
echo [2/3] 启动后端服务...
cd backend
start "Backend" cmd /k "node src/index.js"
timeout /t 3 /nobreak >nul
cd ..

:: 启动前端
echo [3/3] 启动前端服务...
cd frontend
start "Frontend" cmd /k "npm run dev"
cd ..

echo.
echo ========================================
echo ✅ 服务重启完成！
echo ========================================
echo.
echo 前端地址: http://localhost:3000
echo 后端地址: http://localhost:3001
echo.
echo 请在新窗口中查看服务日志
echo ========================================
pause
