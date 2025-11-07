const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

module.exports = {
  apps: [{
    name: 'automaton-backend',
    script: './dist/ui-server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: process.env.MAX_MEMORY_RESTART || '1G',
    min_uptime: process.env.MIN_UPTIME || '10s',
    max_restarts: parseInt(process.env.MAX_RESTARTS) || 10,
    env: {
      NODE_ENV: 'development',
      PORT: process.env.PORT || 3000,
      WS_PORT: process.env.WS_PORT || 3001
    },
    env_production: {
      NODE_ENV: process.env.NODE_ENV || 'production',
      PORT: process.env.PORT || 3000,
      WS_PORT: process.env.WS_PORT || 3001,
      DOMAIN: process.env.DOMAIN_COM || 'universallifeprotocol.com',
      BASE_URL: process.env.BASE_URL_COM || 'https://universallifeprotocol.com',
      API_URL: process.env.API_URL_COM || 'https://universallifeprotocol.com/api',
      WS_URL: process.env.WS_URL_COM || 'wss://universallifeprotocol.com',
      REDIS_URL: process.env.REDIS_URL || 'redis://redis:6379',
      REDIS_PASSWORD: process.env.REDIS_PASSWORD || 'automaton123',
      LOG_LEVEL: process.env.LOG_LEVEL || 'info',
      JWT_SECRET: process.env.JWT_SECRET,
      SESSION_SECRET: process.env.SESSION_SECRET,
      CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
      ENABLE_MONITORING: process.env.ENABLE_MONITORING === 'true',
      ENABLE_SSL: process.env.ENABLE_SSL === 'true',
      ENABLE_RATE_LIMITING: process.env.ENABLE_RATE_LIMITING === 'true',
      ENABLE_WEBSOCKETS: process.env.ENABLE_WEBSOCKETS === 'true'
    },
    env_net: {
      NODE_ENV: process.env.NODE_ENV || 'production',
      PORT: process.env.PORT || 3000,
      WS_PORT: process.env.WS_PORT || 3001,
      DOMAIN: process.env.DOMAIN_NET || 'universallifeprotocol.net',
      BASE_URL: process.env.BASE_URL_NET || 'https://universallifeprotocol.net',
      API_URL: process.env.API_URL_NET || 'https://universallifeprotocol.net/api',
      WS_URL: process.env.WS_URL_NET || 'wss://universallifeprotocol.net',
      REDIS_URL: process.env.REDIS_URL || 'redis://redis:6379',
      REDIS_PASSWORD: process.env.REDIS_PASSWORD || 'automaton123',
      LOG_LEVEL: process.env.LOG_LEVEL || 'info',
      JWT_SECRET: process.env.JWT_SECRET,
      SESSION_SECRET: process.env.SESSION_SECRET,
      CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
      ENABLE_MONITORING: process.env.ENABLE_MONITORING === 'true',
      ENABLE_SSL: process.env.ENABLE_SSL === 'true',
      ENABLE_RATE_LIMITING: process.env.ENABLE_RATE_LIMITING === 'true',
      ENABLE_WEBSOCKETS: process.env.ENABLE_WEBSOCKETS === 'true'
    },
    env_online: {
      NODE_ENV: process.env.NODE_ENV || 'production',
      PORT: process.env.PORT || 3000,
      WS_PORT: process.env.WS_PORT || 3001,
      DOMAIN: process.env.DOMAIN_ONLINE || 'universallifeprotocol.online',
      BASE_URL: process.env.BASE_URL_ONLINE || 'https://universallifeprotocol.online',
      API_URL: process.env.API_URL_ONLINE || 'https://universallifeprotocol.online/api',
      WS_URL: process.env.WS_URL_ONLINE || 'wss://universallifeprotocol.online',
      REDIS_URL: process.env.REDIS_URL || 'redis://redis:6379',
      REDIS_PASSWORD: process.env.REDIS_PASSWORD || 'automaton123',
      LOG_LEVEL: process.env.LOG_LEVEL || 'info',
      JWT_SECRET: process.env.JWT_SECRET,
      SESSION_SECRET: process.env.SESSION_SECRET,
      CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
      ENABLE_MONITORING: process.env.ENABLE_MONITORING === 'true',
      ENABLE_SSL: process.env.ENABLE_SSL === 'true',
      ENABLE_RATE_LIMITING: process.env.ENABLE_RATE_LIMITING === 'true',
      ENABLE_WEBSOCKETS: process.env.ENABLE_WEBSOCKETS === 'true'
    },
    error_file: './logs/automaton-error.log',
    out_file: './logs/automaton-out.log',
    log_file: './logs/automaton-combined.log',
    time: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000,
    restart_delay: parseInt(process.env.RESTART_DELAY) || 4000
  }]
};