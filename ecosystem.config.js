module.exports = {
  apps: [{
    name: 'video-dl',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
      DOUYIN_API_BASE: 'http://159.65.102.137',
      API_TIMEOUT: 15000,
      PASSWORD_HASH: 'CHANGE_THIS_STRONG_PASSWORD_IN_PRODUCTION',
      DEFAULT_AK: 'CHANGE_THIS_API_KEY_IN_PRODUCTION',
      ALLOWED_ORIGINS: 'https://yourdomain.com,https://www.yourdomain.com',
      ENABLE_CORS: 'true',
      LOG_LEVEL: 'warn'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
