#!/bin/bash

# VideoDL 生产环境部署脚本
echo "🚀 开始部署 VideoDL 到生产环境..."

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js 18+"
    exit 1
fi

# 检查npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm 未安装"
    exit 1
fi

# 安装依赖
echo "📦 安装依赖..."
npm install

# 创建必要目录
echo "📁 创建目录..."
mkdir -p logs

# 检查环境变量文件
if [ ! -f ".env" ]; then
    echo "⚠️  未找到 .env 文件，复制模板..."
    cp env.example .env
    echo "❗ 请编辑 .env 文件设置正确的环境变量！"
    echo "   特别重要: PASSWORD_HASH, DEFAULT_AK, ALLOWED_ORIGINS"
    read -p "按回车键继续..."
fi

# 检查PM2
if ! command -v pm2 &> /dev/null; then
    echo "📦 安装 PM2..."
    npm install -g pm2
fi

# 停止旧进程
echo "🛑 停止旧进程..."
pm2 stop video-dl 2>/dev/null || true

# 启动应用
echo "🚀 启动应用..."
pm2 start ecosystem.config.js --env production

# 保存PM2配置
pm2 save

# 设置PM2开机自启
pm2 startup

echo "✅ 部署完成！"
echo ""
echo "📊 应用状态:"
pm2 status

echo ""
echo "📋 重要提醒:"
echo "1. 请确认已修改 .env 文件中的密码和API密钥"
echo "2. 访问 http://localhost:3000/health 检查服务状态"
echo "3. 查看日志: pm2 logs video-dl"
echo "4. 如需要外网访问，请配置防火墙和反向代理"
