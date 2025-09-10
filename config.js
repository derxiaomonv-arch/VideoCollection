// 配置文件
const config = {
  // 服务器配置
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // API配置
  douyinApiBase: process.env.DOUYIN_API_BASE || 'http://159.65.102.137',
  apiTimeout: parseInt(process.env.API_TIMEOUT) || 10000,
  
  // 安全配置
  passwordHash: process.env.PASSWORD_HASH || '123456', // 生产环境请更改
  allowedOrigins: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['*'],
  enableCors: process.env.ENABLE_CORS !== 'false',
  
  // 日志配置
  logLevel: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'warn' : 'info'),
  
  // 开发环境标识
  isDevelopment: process.env.NODE_ENV !== 'production'
};

module.exports = config;
