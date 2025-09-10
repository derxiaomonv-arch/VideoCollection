# 🚀 VideoDL 部署指南

## 📋 部署前检查清单

### ✅ 必须修改的配置项

**⚠️ 重要：部署前必须修改以下配置，否则存在安全风险！**

1. **修改密码** (在服务器环境变量中):
   ```bash
   export PASSWORD_HASH="your_strong_password_here"
   ```

2. **修改API密钥** (在服务器环境变量中):
   ```bash
   export DEFAULT_AK="your_api_key_here"
   ```

3. **配置允许的域名** (生产环境):
   ```bash
   export ALLOWED_ORIGINS="https://yourdomain.com,https://www.yourdomain.com"
   ```

## 🎯 部署方法一：传统服务器部署

### 1. 服务器要求
- Node.js 18+ 
- PM2 (可选，推荐)
- 2GB+ 内存
- 10GB+ 磁盘空间

### 2. 上传文件
将以下文件上传到服务器：
```
server.js
index.html
style.css
script.js
package.json
config.js
ecosystem.config.js
env.example
```

### 3. 安装依赖
```bash
npm install
```

### 4. 配置环境变量
```bash
# 复制环境变量模板
cp env.example .env

# 编辑配置文件
nano .env
```

在 `.env` 文件中设置：
```bash
NODE_ENV=production
PORT=3000
PASSWORD_HASH=YOUR_STRONG_PASSWORD
DEFAULT_AK=YOUR_API_KEY
ALLOWED_ORIGINS=https://yourdomain.com
DOUYIN_API_BASE=http://159.65.102.137
API_TIMEOUT=15000
ENABLE_CORS=true
LOG_LEVEL=warn
```

### 5. 创建日志目录
```bash
mkdir -p logs
```

### 6. 启动服务

**方法A: 使用PM2 (推荐)**
```bash
# 安装PM2
npm install -g pm2

# 启动应用
pm2 start ecosystem.config.js --env production

# 查看状态
pm2 status

# 查看日志
pm2 logs video-dl
```

**方法B: 直接启动**
```bash
NODE_ENV=production npm start
```

### 7. 设置反向代理 (可选)

**Nginx 配置示例:**
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 🐳 部署方法二：Docker部署

### 1. 构建镜像
```bash
docker build -t video-dl .
```

### 2. 运行容器
```bash
docker run -d \
  --name video-dl \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e PASSWORD_HASH=YOUR_STRONG_PASSWORD \
  -e DEFAULT_AK=YOUR_API_KEY \
  -e ALLOWED_ORIGINS=https://yourdomain.com \
  video-dl
```

## 🔧 部署后验证

### 1. 健康检查
```bash
curl http://localhost:3000/health
```

应该返回：
```json
{
  "status": "ok",
  "timestamp": "2025-09-10T...",
  "uptime": 123.456,
  "version": "1.0.0"
}
```

### 2. 功能测试
1. 访问 `http://your-server:3000`
2. 输入密码
3. 测试解析一个抖音链接

## 📊 监控和维护

### PM2 常用命令
```bash
# 查看状态
pm2 status

# 重启应用
pm2 restart video-dl

# 停止应用
pm2 stop video-dl

# 查看日志
pm2 logs video-dl

# 监控
pm2 monit
```

### 日志文件位置
- 错误日志: `./logs/err.log`
- 输出日志: `./logs/out.log`
- 综合日志: `./logs/combined.log`

## ⚠️ 安全注意事项

1. **定期更新密码和API密钥**
2. **使用HTTPS** - 在生产环境配置SSL证书
3. **防火墙配置** - 仅开放必要端口
4. **定期备份** - 定期备份配置文件
5. **监控日志** - 定期检查错误日志
6. **限制访问** - 考虑使用IP白名单

## 🐛 常见问题

### Q: 无法获取aweme_id
**A:** 检查API服务是否可访问:
```bash
curl "http://159.65.102.137/api/douyin/web/get_aweme_id?url=https://v.douyin.com/test"
```

### Q: 前端显示404
**A:** 确保所有静态文件都已上传，检查文件权限

### Q: PM2启动失败
**A:** 检查Node.js版本，确保依赖已正确安装

### Q: CORS错误
**A:** 检查 `ALLOWED_ORIGINS` 环境变量配置

## 📞 技术支持

如遇到部署问题，请检查：
1. 服务器日志: `pm2 logs video-dl`
2. 系统日志: `/var/log/syslog`
3. 网络连接: `curl` 测试API可访问性
