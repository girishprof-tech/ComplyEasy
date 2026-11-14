@echo off
echo Starting ComplyEasy (Venture)...

cd /d "%~dp0"

set "JAVA_EXE=java"
if exist "C:\Program Files\Eclipse Adoptium\jdk-21.0.13.9-hotspot\bin\java.exe" (
    set "JAVA_EXE=C:\Program Files\Eclipse Adoptium\jdk-21.0.13.9-hotspot\bin\java.exe"
)

echo [1/2] Starting Spring Boot Backend on http://localhost:8787 ...
start "ComplyEasy Backend" cmd /k "cd /d "%~dp0backend" && "%JAVA_EXE%" -jar target\venture-backend-1.0.0.jar"

timeout /t 3 /nobreak >nul

echo [2/2] Starting Frontend Dev Server on http://localhost:5173 ...
start "ComplyEasy Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo Both servers are starting up!
echo Frontend (Vite with HMR): http://localhost:5173
echo Backend API + Static App: http://localhost:8787
echo.

