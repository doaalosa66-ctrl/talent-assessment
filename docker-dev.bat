@echo off
REM ========================================
REM 开发环境 - 构建和运行脚本
REM ========================================

echo ========================================
echo 构建开发环境 Docker 镜像
echo ========================================

echo.
echo [1/2] 构建后端开发镜像...
docker build --target development -t talent-backend:dev ./backend
if %errorlevel% neq 0 (
    echo 后端开发镜像构建失败！
    exit /b 1
)

echo.
echo [2/2] 构建前端开发镜像...
docker build --target development -t talent-frontend:dev ./frontend
if %errorlevel% neq 0 (
    echo 前端开发镜像构建失败！
    exit /b 1
)

echo.
echo ========================================
echo 镜像构建完成！
echo ========================================
docker images | findstr "talent"

echo.
echo ========================================
echo 启动开发环境容器
echo ========================================

REM 停止并删除旧容器（如果存在）
docker stop talent-backend talent-frontend 2>nul
docker rm talent-backend talent-frontend 2>nul

echo.
echo 启动后端容器（开发模式，支持热重载）...
docker run -d ^
  --name talent-backend ^
  -p 3001:3001 ^
  -e DEEPSEEK_API_KEY=sk-ced27076f4d447789a2356f1cec68021 ^
  -e DB_HOST=host.docker.internal ^
  -e DB_PORT=5433 ^
  -e DB_NAME=talent_assessment ^
  -e DB_USER=talent_user ^
  -e DB_PASSWORD=talent_password_2024 ^
  -e PORT=3001 ^
  -e NODE_ENV=development ^
  -v "%cd%\backend\src:/app/src" ^
  talent-backend:dev

echo.
echo 启动前端容器（开发模式，支持热重载）...
docker run -d ^
  --name talent-frontend ^
  -p 3000:3000 ^
  -v "%cd%\frontend\src:/app/src" ^
  talent-frontend:dev

echo.
echo ========================================
echo 开发环境已启动！
echo ========================================
echo 前端地址: http://localhost:3000
echo 后端地址: http://localhost:3001
echo.
echo 查看容器状态:
docker ps --filter "name=talent-" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo.
echo 查看日志:
echo   docker logs -f talent-backend
echo   docker logs -f talent-frontend
