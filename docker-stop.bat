@echo off
REM ========================================
REM 停止所有容器脚本
REM ========================================

echo ========================================
echo 停止所有 Talent Assessment 容器
echo ========================================

echo.
echo 停止开发环境容器...
docker stop talent-backend talent-frontend 2>nul
docker rm talent-backend talent-frontend 2>nul

echo.
echo 停止生产环境容器...
docker stop talent-backend-prod talent-frontend-prod 2>nul
docker rm talent-backend-prod talent-frontend-prod 2>nul

echo.
echo 停止 docker-compose 容器（如果存在）...
docker stop talent_assessment_backend talent_assessment_frontend 2>nul

echo.
echo ========================================
echo 所有容器已停止！
echo ========================================

echo.
echo 当前运行的容器:
docker ps --filter "name=talent" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
