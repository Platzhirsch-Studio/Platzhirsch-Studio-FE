# Produktion – Vorlage für drei getrennte Hosts

Inhaber-Entscheidung Nr. 48 + Ergänzung: Website, Backoffice und Frappe laufen **getrennt** (PLAN-NEXT-BACKOFFICE.md §2/§7). Alles hier ist Vorlage – nichts wurde gestartet oder gegen einen Server geprüft.

```
Internet ──TLS──► Host A  platzhirsch.studio (+ www → Apex)   Caddy/Nginx → 127.0.0.1:3000  Website (Next.js)
         ──TLS──► Host B  backoffice.platzhirsch.studio        Caddy/Nginx → 127.0.0.1:3100  Backoffice (Next.js)
                                                               optional nur VPN/Admin-IPs
         ──TLS──► Host C  backend.platzhirsch.studio           Caddy/Nginx → 127.0.0.1:8080  Frappe-Nginx → gunicorn/socketio
                                                               nur Host A + Host B + Admin-IPs (+ Stripe-Webhook-Pfad)
Host A/B ──privates Netz (z. B. 10.0.0.0/16)──► Host C
```

| Ordner | Inhalt |
|---|---|
| `website/` | `Containerfile` (Build-Kontext Repo-Root, `.env.production` als BuildKit-Secret, `public/ezarri` als benannter Build-Kontext), `Containerfile.dockerignore`, `compose.yml`, `.env.example` (alle `process.env`-Namen aus `src/`) |
| `backoffice/` | `Containerfile` (Repo-Root, `npm ci` im Root, `next build` in `backoffice/`), `Containerfile.dockerignore`, `compose.yml`, `.env.example` |
| `frappe/` | `compose.yml` (wie Staging, Image ohne Testwerkzeuge, kein Developer Mode), `einrichten.sh` (Site, Apps, `--update`, `--token`), `backup.sh` + `backup.cron` (`bench backup --with-files`, Offsite per rclone), `.env.example` (inkl. Liste der `site_config`-Schlüssel) |
| `caddy/` | `Caddyfile` (global, Snippets) + `website.caddy` / `backoffice.caddy` / `backend.caddy` – je Host nur die eigene Datei verlinken; `caddy.env.example` |
| `nginx/` | Alternative zu Caddy: `website.conf`, `backoffice.conf`, `backend.conf`, Snippets `platzhirsch-sicherheit.conf`, `platzhirsch-proxy.conf`, `backend-erlaubt.conf` |
| `systemd/` | Hosts ohne Docker: `platzhirsch-website.service`, `platzhirsch-backoffice.service`, PM2-Variante `ecosystem.produktion.cjs` |

## Host-Größen (Start)

| Host | CPU | RAM | Disk | Bemerkung |
|---|---|---|---|---|
| A Website | 4 vCPU | 8 GB | 80 GB SSD | Build braucht ~4–6 GB RAM und lädt Produktdaten von `SERVER`; Image ~2,5 GB inkl. `public/ezarri` |
| B Backoffice | 2 vCPU | 4 GB | 40 GB SSD | eine Instanz (Sitzungen im Prozessspeicher) |
| C Frappe | 4 vCPU | 8–16 GB | 160 GB SSD | MariaDB + Dateien (Produktbilder) + 14 Tage Backups lokal; Offsite zusätzlich |

Kleiner Start auf einem Host ist möglich (alle drei `*.caddy` verlinken, 8 vCPU/16 GB) – die Trennung bleibt dann logisch (Ports nur auf 127.0.0.1).

## Ablauf je Host (Docker)

```bash
# alle Hosts
sudo apt install docker.io docker-compose-v2 git ufw
sudo ufw default deny incoming && sudo ufw allow 22/tcp && sudo ufw allow 80,443/tcp && sudo ufw enable
sudo git clone <repo-url> /srv/platzhirsch/repo
# Caddy ≥ 2.7 aus dem offiziellen Caddy-Repo (Ubuntu 24.04 liefert 2.6 – {args[0]} in den Snippets braucht 2.7+)

# Host C – Frappe
cd /srv/platzhirsch/repo/deploy/produktion/frappe
cp .env.example .env && chmod 600 .env   # Werte eintragen (openssl rand -hex 32)
./einrichten.sh
sudo cp backup.cron /etc/cron.d/platzhirsch-frappe-backup

# Host A – Website
sudo mkdir -p /srv/platzhirsch/website/{data,public-ezarri} && sudo chown -R 1000:1000 /srv/platzhirsch/website/data
#   .env.production nach /srv/platzhirsch/website/ (aus website/.env.example), public/ezarri dorthin kopieren
cd /srv/platzhirsch/repo/deploy/produktion/website
export GIT_SHA=$(git rev-parse --short=12 HEAD); docker compose build && docker compose up -d

# Host B – Backoffice
cd /srv/platzhirsch/repo/deploy/produktion/backoffice
export GIT_SHA=$(git rev-parse --short=12 HEAD); docker compose build && docker compose up -d
```

Verbindung A/B → C über das private Netz: auf Host A und B in `/etc/hosts` `10.0.0.4 backend.platzhirsch.studio` (private Adresse von C) eintragen. Dann bleibt `SERVER=https://backend.platzhirsch.studio` bzw. `BACKOFFICE_FRAPPE_URL=…` gültig (Zertifikat passt), und in `WEBSITE_IPS`/`BACKOFFICE_IPS` stehen die **privaten** Adressen. Ohne privates Netz: öffentliche IPv4/IPv6 von A und B eintragen.

## Ohne Docker

- Website/Backoffice: `systemd/*.service` oder `systemd/ecosystem.produktion.cjs` (PM2); Release-Wechsel weiter mit `scripts/deploy.sh` (Website). Für das Backoffice braucht `scripts/deploy.sh` einen zweiten Prozess bzw. eine Kopie mit `cwd: backoffice` – Änderung an `scripts/` ist **nicht** Teil dieses Pakets.
- Frappe: klassische Bench (`bench init --frappe-branch version-15`, Apps wie in `Backend-Import/README.md` §2 per `bench get-app /srv/platzhirsch/repo/Backend-Import/<app>`), dann `sudo bench setup production <user>` (Supervisor + Nginx) und `bench setup nginx` auf Port 8080 hinter Caddy, oder Caddy weglassen und `bench setup lets-encrypt`. Backup-Cron: `bench --site <site> backup --with-files` + rclone wie in `frappe/backup.sh`.

## Nötige Änderungen außerhalb von `deploy/` (bewusst NICHT umgesetzt)

1. **`output: "standalone"` fehlt** in `next.config.js` (Website) und `backoffice/next.config.js`. Die Containerfiles funktionieren ohne (ganzer Projektordner + `next start`), die Images sind aber groß (Root-`node_modules` mit three, react-pdf, sharp …). Mit standalone: `output: "standalone"` setzen, im Backoffice zusätzlich `outputFileTracingRoot: path.join(__dirname, "..")`; dann nur `.next/standalone`, `.next/static` und `public/` kopieren und `node server.js` starten. Achtung Website: der Server liest zur Laufzeit aus `process.cwd()` (`src/content/ratgeber`, `src/lib/stilfinder/fonts|materials|pdfWorker.mjs`, `public/…`) – diese Pfade müssten per `outputFileTracingIncludes` mitgenommen und geprüft werden.
2. **Domain-Tausch `backoffice.` ↔ `backend.`**: Heute ist `backoffice.platzhirsch.studio` das **produktive Frappe**. `src/lib/apiBaseUrl.js` (`DEFAULT_BACKOFFICE`), `next.config.js` (`images.remotePatterns`, CSP `img-src`) und `.github/workflows/ci.yml` (`SERVER`-Standard) zeigen darauf. Bevor der DNS-Name auf das Next-Backoffice wechselt: Website mit `SERVER=https://backend.platzhirsch.studio` bauen und die drei Stellen anpassen; direkte Bild-URLs auf den Backend-Host funktionieren nach der IP-Sperre nicht mehr (nur über `/cmx`).
3. **Backoffice-Sitzungsspeicher** ist In-Memory (`backoffice/src/lib/backoffice/auth/store.js`): Neustart = alle abgemeldet, keine zweite Instanz. Für Zero-Downtime: Store auf Redis/Frappe umstellen.
4. **`scripts/deploy.sh`** kennt nur die Website (PM2-Prozess `Platzhirsch-Studio-Website`).

## Sicherheit (Kurz)

- Next-Ports 3000/3100 und Frappe 8080 lauschen nur auf `127.0.0.1` (Compose `127.0.0.1:…`, systemd `-H 127.0.0.1`); `ufw` erlaubt nur 22/80/443.
- `X-Forwarded-For` wird vom Proxy **überschrieben** (Rate-Limits der Apps nehmen den letzten Eintrag).
- HSTS mit `preload` erst eintragen lassen (hstspreload.org), wenn **alle** Subdomains dauerhaft HTTPS haben.
- Backend: Desk `/app` nur von Admin-IPs; alle Admin-Konten mit 2FA (`PH Geschäftsführung`, `PH Backoffice-Admin`, CONVENTIONS §4); `website@`/`backoffice@` ohne Passwort-Login nutzen (nur Token).
- Geheimnisse nur in `.env`/`.env.production` (chmod 600) und `site_config.json`; nie im Repo, nie im Image (Website: BuildKit-Secret).
