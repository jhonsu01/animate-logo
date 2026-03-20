@echo off
title AnimateLogo
echo.
echo  ========================================
echo   AnimateLogo - Logo Animation Studio
echo  ========================================
echo.
cd /d "%~dp0"

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo  [ERROR] Node.js no encontrado. Instala Node.js desde https://nodejs.org
    pause
    exit /b 1
)

if not exist node_modules (
    echo  Instalando dependencias...
    npm install
    echo.
)

echo  Iniciando servidor...
echo  Abre http://localhost:3000 en tu navegador
echo.
node server.js
pause
