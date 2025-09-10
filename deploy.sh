#!/bin/bash

# 部署脚本
echo "🚀 开始部署..."

# 1. 上传代码到服务器（不包括 node_modules）
echo "📤 上传代码..."
rsync -av --exclude='node_modules' --exclude='.git' --exclude='logs' . user@your-server:/path/to/app/

# 2. 在服务器上安装依赖
echo "📦 安装依赖..."
ssh user@your-server "cd /path/to/app && npm ci --only=production"

# 3. 重启服务
echo "🔄 重启服务..."
ssh user@your-server "cd /path/to/app && npm run pm2:restart"

echo "✅ 部署完成！"
