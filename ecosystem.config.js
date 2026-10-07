module.exports = {
  apps: [{
    name: 'Platzhirsch-Studio-Website',
    script: 'node_modules/.bin/next',
    args: 'start',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    instances: 1,
    exec_mode: 'fork',
    max_memory_restart: '1G',
    error_file: '/var/log/Platzhirsch-Studio-Website-error.log',
    out_file: '/var/log/Platzhirsch-Studio-Website-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    autorestart: true,
    restart_delay: 1000
  }]
}
