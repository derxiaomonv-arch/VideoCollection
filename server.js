const express = require('express');
const https = require('https');
const http = require('http');
const url = require('url');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 静态资源
app.use(express.static(__dirname));

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

app.listen(PORT, () => {
  console.log('Server listening on http://localhost:' + PORT);
});


