module.exports = {
  apps: [{
    name: 'automaton-backend',
    script: './dist/ui-server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    min_uptime: '10s',
    max_restarts: 10,
    env: {
      NODE_ENV: 'development',
      PORT: 5555,
      WS_PORT: 5556
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5555,
      WS_PORT: 5556
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
    restart_delay: 4000
  }]
};