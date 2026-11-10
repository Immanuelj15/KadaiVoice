# KadaiVoice AI - PowerShell Launcher
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "         Launching KadaiVoice AI Platform               " -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Cyan

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Start Backend
Write-Host "Starting Backend on http://localhost:5000 ..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptDir\backend'; npm start"

# Start Frontend
Write-Host "Starting Frontend on http://localhost:3000 ..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptDir\frontend'; npm run dev"

Write-Host ""
Write-Host "Frontend URL:  http://localhost:3000" -ForegroundColor Cyan
Write-Host "Demo Login:    demo@kadaivoice.ai / admin123" -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Cyan

