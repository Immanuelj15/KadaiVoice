@echo off
title KadaiVoice AI - Launch Launcher
echo ========================================================
echo           Launching KadaiVoice AI Platform
echo ========================================================
echo.
echo Starting Backend Server on http://localhost:5000 ...
start "KadaiVoice AI - Backend (Port 5000)" cmd /k "cd backend && npm start"

echo Starting Frontend Web App on http://localhost:3000 ...
start "KadaiVoice AI - Frontend (Port 3000)" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================================
echo All services launched!
echo.
echo Open in browser: http://localhost:3000
echo Demo Login:      demo@kadaivoice.ai / admin123
echo ========================================================
echo.
pause

