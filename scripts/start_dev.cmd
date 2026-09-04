@echo off
echo ========================================================
echo Starting CreatorFlow AI Development Services...
echo ========================================================

start "CreatorFlow Backend API" cmd /k "cd /d %~dp0\..\backend && .\venv\Scripts\python manage.py runserver 0.0.0.0:8000"
start "CreatorFlow Frontend Next.js" cmd /k "cd /d %~dp0\..\frontend && npm run dev"

echo.
echo Both API server (http://localhost:8000) and Next.js Frontend (http://localhost:3000) launched!
