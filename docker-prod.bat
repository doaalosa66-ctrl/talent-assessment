@echo off
REM ========================================
REM 生产环境 - 构建和运行脚本
REM ========================================

echo ========================================
echo 构建生产环境 Docker 镜像
echo ========================================

echo.
echo [1/2] 构建后端生产镜像（禁用 nodemon）...
docker build --target production -t talent-backend:prod ./backend
if %errorlevel% neq 0 (
    echo 后端生产镜像构建失败！
    exit /b 1
)

echo.
echo [2/2] 构建前端生产镜像（Nginx 静态服务）...
docker build --target production -t talent-frontend:prod ./frontend
if %errorlevel% neq 0 (
    echo 前端生产镜像构建失败！
    exit /b 1
)

echo.
echo ========================================
echo 镜像构建完成！
echo ========================================
docker images | findstr "talent"

echo.
echo ========================================
echo 启动生产环境容器
echo ========================================

REM 停止并删除旧容器（如果存在）
docker stop talent-backend-prod talent-frontend-prod 2>nul
docker rm talent-backend-prod talent-frontend-prod 2>nul

REM 创建 Docker 网络（如果不存在）
docker network create talent-network 2>nul

echo.
echo 启动后端容器（生产模式，无热重载）...
docker run -d ^
  --name talent-backend-prod ^
  --network talent-network ^
  -p 3001:3001 ^
  -e DEEPSEEK_API_KEY=sk-ced27076f4d447789a2356f1cec68021 ^
  -e DB_HOST=host.docker.internal ^
  -e DB_PORT=5433 ^
  -e DB_NAME=talent_assessment ^
  -e DB_USER=talent_user ^
  -e DB_PASSWORD=talent_password_2024 ^
  -e PORT=3001 ^
  -e NODE_ENV=production ^
  --restart unless-stopped ^
  talent-backend:prod

echo.
echo 启动前端容器（生产模式，Nginx 服务）...
docker run -d ^
  --name talent-frontend-prod ^
  --network talent-network ^
  -p 3000:3000 ^
  --restart unless-stopped ^
  talent-frontend:prod

echo.
echo ========================================
echo 生产环境已启动！
echo ========================================
echo 前端地址: http://localhost:3000
echo 后端地址: http://localhost:3001
echo.
echo 查看容器状态:
docker ps --filter "name=talent-.*-prod" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo.
echo 健康检查:
timeout /t 5 /nobreak >nul
docker ps --filter "name=talent-.*-prod" --format "table {{.Names}}\t{{.Status}}"

echo.
echo 查看日志:
echo   docker logs -f talent-backend-prod
echo   docker logs -f talent-frontend-prod
