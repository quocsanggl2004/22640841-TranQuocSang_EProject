@echo off
echo Setting up EProject Microservices...
echo.

REM Check if Node.js is installed
node --version > nul 2>&1
if errorlevel 1 (
    echo Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

echo Installing dependencies for all services...
call npm run install:all

echo.
echo Creating .env file from example...
if not exist .env (
    copy .env.example .env
    echo .env file created. Please update it with your configuration.
) else (
    echo .env file already exists.
)

echo.
echo Setup complete!
echo.
echo To start the services:
echo   - Development mode: npm run dev
echo   - Production mode:  npm start
echo   - With Docker:      npm run docker:up
echo.
echo Health check URLs:
echo   - API Gateway: http://localhost:3000/health
echo   - Auth Service: http://localhost:3001/health
echo   - Product Service: http://localhost:3002/health
echo   - Order Service: http://localhost:3003/health
echo.

choice /M "Do you want to start the services in development mode now"
if errorlevel 2 goto end
if errorlevel 1 goto start

:start
echo Starting all services in development mode...
npm run dev

:end
pause