module.exports = {
  apps: [{
    name: 'siloq-dashboard',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/siloq-dashboard',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/siloq-dashboard/error.log',
    out_file: '/var/log/siloq-dashboard/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '1G',
    watch: false,
    ignore_watch: ['node_modules', '.next', 'logs']
  }]
}
