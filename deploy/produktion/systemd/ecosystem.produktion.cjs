// deploy/produktion/systemd/ecosystem.produktion.cjs – PM2-Alternative zu den systemd-Units.
// Website wie heute (ecosystem.config.js / scripts/deploy.sh), dazu der eigene Prozess für das Backoffice
// (PLAN-NEXT-BACKOFFICE.md §7). Pfade auf den Release-Symlink "current" (nicht aufgelöst), damit
// "pm2 reload" das neue Release startet. Start:
//   pm2 start deploy/produktion/systemd/ecosystem.produktion.cjs && pm2 save && pm2 startup systemd
// Umgebung: Next liest .env.production im jeweiligen cwd (Website: Symlink auf shared/.env.production;
// Backoffice: backoffice/.env.production). Keine Werte in dieser Datei.
module.exports = {
  apps: [
    {
      name: "Platzhirsch-Studio-Website",
      cwd: "/var/www/platzhirsch/current",
      script: "node_modules/next/dist/bin/next",
      args: "start -H 127.0.0.1 -p 3000",
      env: { NODE_ENV: "production", PORT: 3000, NEXT_TELEMETRY_DISABLED: 1 },
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "1G",
      error_file: "/var/log/Platzhirsch-Studio-Website-error.log",
      out_file: "/var/log/Platzhirsch-Studio-Website-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      autorestart: true,
      restart_delay: 1000,
    },
    {
      // Eigener Host empfohlen; auf demselben Host nur in der Übergangszeit.
      // Genau EINE Instanz: Sitzungen liegen im Prozessspeicher (auth/store.js).
      name: "platzhirsch-backoffice",
      cwd: "/var/www/platzhirsch-backoffice/current/backoffice",
      script: "../node_modules/next/dist/bin/next",
      args: "start -H 127.0.0.1 -p 3100",
      env: { NODE_ENV: "production", PORT: 3100, NEXT_TELEMETRY_DISABLED: 1 },
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "768M",
      error_file: "/var/log/platzhirsch-backoffice-error.log",
      out_file: "/var/log/platzhirsch-backoffice-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      autorestart: true,
      restart_delay: 1000,
    },
  ],
};
