#!/usr/bin/env bash
# tools/einblicke/cron.sh – täglicher Tagesabschluss der Besucher-Einblicke
# (QA Technik P1-1). Wird von scripts/deploy.sh als Cron-Eintrag 03:30
# eingerichtet (ensure_einblicke) und läuft im Ordner "current":
#
#   30 3 * * * /usr/bin/env bash /var/www/platzhirsch/current/tools/einblicke/cron.sh >> /var/www/platzhirsch/shared/.data/einblicke/cron.log 2>&1
#
# Liest EINBLICKE_CRON_SECRET und PORT aus .env.production (nie in der
# Crontab, nie auf der Kommandozeile von curl: das Secret geht über stdin).
# Ohne Secret: nur löschen (Rohdaten + Pool > 14 Tage), ohne Aggregate.
set -Eeuo pipefail
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_FILE="${ENV_FILE:-$APP_DIR/.env.production}"
secret=""
port="${PORT:-3000}"
if [[ -f "$ENV_FILE" ]]; then
  secret=$(grep -E '^EINBLICKE_CRON_SECRET=' "$ENV_FILE" | tail -n1 | cut -d= -f2- | tr -d '"'"'" || true)
  p=$(grep -E '^PORT=' "$ENV_FILE" | tail -n1 | cut -d= -f2- | tr -d '"'"'" || true)
  [[ -n "$p" ]] && port="$p"
fi
stamp() { date '+%Y-%m-%d %H:%M:%S'; }
if (( ${#secret} >= 24 )); then
  code=$(printf 'header = "Authorization: Bearer %s"\n' "$secret" |
    curl -s -o /dev/null -w '%{http_code}' -m 280 -X POST -K - "http://127.0.0.1:$port/api/einblicke/tagesabschluss" || true)
  echo "[$(stamp)] tagesabschluss -> HTTP ${code:-keine Antwort}"
  [[ "$code" == "200" ]] && exit 0
fi
# Kein Secret oder Route nicht erreichbar: die 14-Tage-Grenze trotzdem durchsetzen.
cd "$APP_DIR"
echo "[$(stamp)] nur löschen (ohne Secret oder Fehler beim Abschluss)"
node tools/einblicke/tagesabschluss.mjs --nur-loeschen
[[ ${#secret} -ge 24 ]] || { echo "[$(stamp)] WARNUNG: EINBLICKE_CRON_SECRET fehlt – keine Aggregate"; exit 1; }
exit 1
