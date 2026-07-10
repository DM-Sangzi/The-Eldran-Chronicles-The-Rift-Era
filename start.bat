@echo off
echo ============================================
echo   艾尔德兰编年史：裂隙纪元 - 启动脚本
echo ============================================
echo.
echo [1/2] 启动后端服务 (端口 3001)...
start "艾尔德兰-后端" cmd /k "cd /d "%~dp0server" && node index.js"
echo [2/2] 启动前端服务 (端口 5173)...
start "艾尔德兰-前端" cmd /k "cd /d "%~dp0client" && npx vite --host"
echo.
echo 等待服务启动...
timeout /t 5 /nobreak >nul
echo.
echo ============================================
echo   启动完成！
echo   后端: http://localhost:3001
echo   前端: http://localhost:5173
echo ============================================
echo.
timeout /t 2 /nobreak >nul
start http://localhost:5173
