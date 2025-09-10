@echo off
echo 正在准备部署文件...

:: 创建部署目录
if not exist "deploy" mkdir deploy

:: 复制必需文件
copy server.js deploy\
copy index.html deploy\
copy style.css deploy\
copy script.js deploy\
copy package.json deploy\
copy config.js deploy\
copy ecosystem.config.js deploy\

echo 部署文件已准备完成！
echo 文件位置：%CD%\deploy\
echo.
echo 接下来请将 deploy 文件夹中的所有文件上传到服务器
pause
