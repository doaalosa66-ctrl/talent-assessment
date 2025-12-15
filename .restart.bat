@echo off
echo 正在停止所有Node进程...
taskkill /F /IM node.exe 2>nul

echo 等待3秒...
timeout /t 3 /nobreak >nul

echo 启动后端服务...
cd backend
start "Backend Server" cmd /k "npm start"

cd..
echo 完成！后端服务已在新窗口中启动
pause
