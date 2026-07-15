@echo off
chcp 65001 >nul
echo ============================================
echo   艾尔德兰编年史：裂隙纪元 - 生产模式
echo ============================================
echo.
echo 说明：后端自带静态文件服务，无需启动前端开发服务器
echo       直接访问 http://localhost:3001 即可游玩
echo.

:: 构建前端
echo [1/3] 构建前端...
cd /d "%~dp0client"
call npm run build
if errorlevel 1 (
    echo [错误] 前端构建失败！
    pause
    exit /b 1
)
echo [完成] 前端构建成功
echo.

:: 启动后端（生产模式下后端会直接托管前端文件）
echo [2/3] 启动后端服务 (端口 3001)...
echo.
start "艾尔德兰-服务器" cmd /k "cd /d "%~dp0server" && node index.js"

:: 等待启动
echo 等待服务启动...
timeout /t 3 /nobreak >nul
echo.
echo ============================================
echo   启动完成！游玩地址:
echo   http://localhost:3001
echo ============================================
echo.
start http://localhost:3001
