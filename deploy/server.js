const express = require('express');
const https = require('https');
const http = require('http');
const url = require('url');
const path = require('path');
const config = require('./config');

const app = express();
const PORT = config.port;

// 日志函数
const log = {
  info: (msg, ...args) => {
    if (config.isDevelopment) {
      console.log(msg, ...args);
    }
  },
  warn: (msg, ...args) => {
    console.warn(msg, ...args);
  },
  error: (msg, ...args) => {
    console.error(msg, ...args);
  }
};

// 静态资源
app.use(express.static(__dirname));

// 安全中间件
app.use((req, res, next) => {
  // 安全头
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // CORS配置
  if (config.enableCors) {
    const origin = req.headers.origin;
    if (config.allowedOrigins.includes('*') || config.allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin || '*');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
  
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  
  next();
});

// 解析JSON请求体（限制大小）
app.use(express.json({ limit: '1mb' }));

// 健康检查端点
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: require('./package.json').version
  });
});

// 配置端点（仅提供前端需要的配置）
app.get('/api/config', (req, res) => {
  res.json({
    password: config.passwordHash,
    defaultAK: process.env.DEFAULT_AK || '568360ea4b91487bbe19abab119af9ab'
  });
});

// 代理下载/直链打开，透传必要头部
app.get('/proxy', (req, res) => {
  const target = req.query.target;
  if (!target) {
    res.status(400).send('missing target');
    return;
  }
  try {
    const parsed = url.parse(target);
    const client = (parsed.protocol === 'https:') ? https : http;
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36',
      'Referer': 'https://www.ixigua.com/',
      'Origin': 'https://www.ixigua.com',
      'Accept': '*/*',
      'Accept-Language': 'zh-CN,zh;q=0.9'
    };

    const request = client.get(target, { headers }, (upstream) => {
      // 透传状态码与部分头（避免 CORS 暴露敏感）
      res.status(upstream.statusCode || 200);
      const contentType = upstream.headers['content-type'];
      if (contentType) res.setHeader('Content-Type', contentType);
      // 强制允许跨域供前端 fetch blob
      res.setHeader('Access-Control-Allow-Origin', '*');
      upstream.pipe(res);
    });

    request.on('error', (err) => {
      res.status(502).send('proxy error: ' + err.message);
    });
  } catch (e) {
    res.status(400).send('bad target');
  }
});

// API代理端点：获取aweme_id
app.post('/api/get_aweme_id', async (req, res) => {
  try {
    const { url } = req.body;
    log.info('接收到URL参数:', url);
    
    if (!url) {
      return res.status(400).json({ error: '缺少URL参数' });
    }

    // 使用配置中的API地址
    const apiUrl = `${config.douyinApiBase}/api/douyin/web/get_aweme_id?url=${encodeURIComponent(url)}`;
    log.info('正在请求API:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: config.apiTimeout
    });
    
    log.info('API响应状态:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      log.error('API返回错误:', response.status, errorText);
      return res.status(response.status).json({ error: `API错误: ${response.status} ${errorText}` });
    }

    const data = await response.json();
    log.info('API返回数据:', data);
    res.json(data);
  } catch (error) {
    log.error('获取aweme_id失败:', error);
    res.status(500).json({ error: '获取aweme_id失败: ' + error.message });
  }
});

// API代理端点：获取视频信息
app.get('/api/fetch_video', async (req, res) => {
  try {
    const { aweme_id } = req.query;
    log.info('接收到aweme_id参数:', aweme_id);
    
    if (!aweme_id) {
      return res.status(400).json({ error: '缺少aweme_id参数' });
    }

    const apiUrl = `${config.douyinApiBase}/api/douyin/web/fetch_one_video?aweme_id=${encodeURIComponent(aweme_id)}`;
    log.info('正在请求视频信息API:', apiUrl);
    
    const response = await fetch(apiUrl, {
      timeout: config.apiTimeout
    });
    
    log.info('视频API响应状态:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      log.error('视频API返回错误:', response.status, errorText);
      return res.status(response.status).json({ error: `视频API错误: ${response.status} ${errorText}` });
    }
    
    const data = await response.json();
    log.info('视频API返回数据结构正常');
    res.json(data);
  } catch (error) {
    log.error('获取视频信息失败:', error);
    res.status(500).json({ error: '获取视频信息失败: ' + error.message });
  }
});

// 全局错误处理
app.use((error, req, res, next) => {
  log.error('Unhandled error:', error);
  res.status(500).json({
    error: config.isDevelopment ? error.message : 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
    timestamp: new Date().toISOString()
  });
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('收到SIGTERM信号，正在优雅关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('收到SIGINT信号，正在优雅关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running in ${config.nodeEnv} mode on http://localhost:${PORT}`);
  if (config.isDevelopment) {
    console.log('📝 Development logs enabled');
  }
  console.log(`📊 Process ID: ${process.pid}`);
});


