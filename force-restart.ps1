# 强制重启服务脚本
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "强制重启路之音智能人才评估系统" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 停止所有node进程
Write-Host "[1/3] 停止现有服务..." -ForegroundColor Yellow
Stop-Process -Name node -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# 启动后端
Write-Host "[2/3] 启动后端服务..." -ForegroundColor Yellow
Set-Location backend
Start-Process cmd -ArgumentList "/k", "node src/index.js" -WindowStyle Normal
Start-Sleep -Seconds 3
Set-Location ..

# 启动前端
Write-Host "[3/3] 启动前端服务..." -ForegroundColor Yellow
Set-Location frontend
Start-Process cmd -ArgumentList "/k", "npm run dev" -WindowStyle Normal
Set-Location ..

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ 服务重启完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "前端地址: http://localhost:3000" -ForegroundColor White
Write-Host "后端地址: http://localhost:3001" -ForegroundColor White
Write-Host ""
Write-Host "请在新窗口中查看服务日志" -ForegroundColor Yellow
Write-Host "后端日志应显示: '1. 并行处理岗位分析和简历解析...'" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "按任意键退出..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
