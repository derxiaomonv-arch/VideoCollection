# 抖音去水印下载工具

一个简洁美观的抖音视频去水印下载工具，支持视频和封面下载。

## 功能特性

- 🎬 支持抖音视频去水印下载
- 🖼️ 支持封面图片下载
- 🔗 支持在线观看和链接复制
- 📱 响应式设计，支持移动端
- 🔐 密码保护访问
- 🎨 现代化UI设计

## 部署说明

### 环境要求

- Node.js >= 14.0.0
- npm 或 yarn

### 本地开发

```bash
# 安装依赖
npm install

# 开发模式启动
npm run dev

# 生产模式启动
npm run prod
```

### 生产部署

#### 使用 PM2 (推荐)

```bash
# 安装 PM2
npm install -g pm2

# 启动应用
npm run pm2:start

# 重启应用
npm run pm2:restart

# 停止应用
npm run pm2:stop
```

#### 使用 Docker

```bash
# 构建镜像
docker build -t video-dl .

# 运行容器
docker run -d -p 3000:3000 --name video-dl video-dl
```

### 环境变量配置

创建 `.env` 文件：

```bash
# 服务器配置
PORT=3000
NODE_ENV=production

# API配置
DOUYIN_API_BASE=http://159.65.102.137
API_TIMEOUT=10000

# 安全配置
PASSWORD_HASH=your_secure_password

# 日志配置
LOG_LEVEL=warn
```

### 访问地址

启动后访问：http://localhost:3000

默认密码：123456 (生产环境请修改)

## 安全注意事项

1. **修改默认密码**：在生产环境中修改 `config.js` 中的密码
2. **使用HTTPS**：建议在反向代理中启用HTTPS
3. **限制访问**：可以添加IP白名单或防火墙规则
4. **定期更新**：保持依赖包更新到最新版本

## 监控和日志

- 健康检查端点：`/health`
- 日志文件位置：`./logs/`
- PM2 监控：`pm2 monit`

## 许可证

仅供学习交流使用，请勿用于商业用途。
