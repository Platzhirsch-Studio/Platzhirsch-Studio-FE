#!/usr/bin/env bash
# deploy/produktion/frappe/einrichten.sh – Frappe-Backend auf dem Produktions-Host einrichten oder aktualisieren.
# Wie deploy/staging/setup.sh, aber: kein developer_mode, kein allow_tests, kein mute_emails,
# testmodus bleibt AN und die Website-API AUS, bis der Inhaber den Livegang freigibt.
# Vor jedem install-app/migrate ein Backup (Backend-Import/README.md §6).
#
#   ./einrichten.sh                 neue Site anlegen (falls fehlt) und fehlende Apps installieren
#   ./einrichten.sh --update        nur Image neu bauen, Backup, migrate (Wartungsmodus an/aus)
#   ./einrichten.sh --token <email> neues API-Secret für website@ / backoffice@ (einmalige Ausgabe)
set -Eeuo pipefail
cd "$(dirname "$0")"
[[ -f .env ]] || { echo ".env fehlt (Vorlage .env.example)"; exit 2; }
set -a; . ./.env; set +a
: "${SITE_NAME:?SITE_NAME fehlt in .env}"
SITE="$SITE_NAME"
APPS=(ph_core ph_crm ph_sortiment ph_projekte ph_shop ph_faktura ph_logistik ph_personal ph_marketing ph_kassa ph_service ph_kundenkarte)
DC=(docker compose)
bench() { "${DC[@]}" exec -T backend bench "$@"; }
helper() { "${DC[@]}" exec -T -w /home/frappe/frappe-bench/sites backend ../env/bin/python /opt/ph-deploy/ph_staging.py "$@"; }
log() { printf '\n[einrichten %s] %s\n' "$(date +%H:%M:%S)" "$*"; }

if [[ "${1:-}" == "--token" ]]; then
  [[ -n "${2:-}" ]] || { echo "E-Mail fehlt"; exit 2; }
  echo "Neues Token für $2 (altes wird ungültig) – nur in die .env des jeweiligen Dienstes eintragen:"
  helper token "$SITE" "$2" | tail -n 1
  exit 0
fi

log "Image bauen (ohne Testwerkzeuge)"
"${DC[@]}" build backend
"${DC[@]}" up -d db redis-cache redis-queue
"${DC[@]}" up configurator --exit-code-from configurator
"${DC[@]}" up -d --renew-anon-volumes backend websocket queue-short queue-long scheduler frontend

if [[ "${1:-}" == "--update" ]]; then
  log "Wartungsmodus an, Backup, migrate"
  bench --site "$SITE" set-maintenance-mode on
  bench --site "$SITE" backup --with-files
  if bench --site "$SITE" migrate; then
    bench --site "$SITE" clear-cache
    bench --site "$SITE" set-maintenance-mode off
    log "Update fertig"
  else
    log "migrate FEHLGESCHLAGEN – Wartungsmodus bleibt an. Rollback: CHECKLISTE-LIVEGANG.md Abschnitt Rollback"
    exit 1
  fi
  exit 0
fi

if ! "${DC[@]}" exec -T backend test -d "sites/$SITE"; then
  log "Neue Site $SITE"
  bench new-site "$SITE" \
    --mariadb-user-host-login-scope='%' \
    --db-root-username=root \
    --db-root-password="$DB_ROOT_PASSWORD" \
    --admin-password="$ADMIN_PASSWORD" \
    --set-default
  # M1 (Migration aus der bestehenden Site): statt leerer Site das Backup einspielen, siehe CHECKLISTE.
fi

bench --site "$SITE" set-config -p developer_mode 0
bench --site "$SITE" set-config -p allow_tests False
bench --site "$SITE" set-config host_name "https://$SITE"
bench --site "$SITE" enable-scheduler

installiert() { bench --site "$SITE" list-apps 2>/dev/null | awk '{print $1}' | grep -qx "$1"; }
for app in "${APPS[@]}"; do
  if installiert "$app"; then continue; fi
  log "Backup vor install-app $app"
  bench --site "$SITE" backup --with-files >/dev/null
  log "install-app $app"
  bench --site "$SITE" install-app "$app" || { log "$app fehlgeschlagen – STOPP (keine weiteren Apps). Backup liegt vor."; exit 1; }
done

bench --site "$SITE" migrate
bench --site "$SITE" clear-cache
helper konfigurieren "$SITE" --produktion
helper pruefen "$SITE"

cat <<EOF

Fertig. Nächste Schritte (CHECKLISTE-LIVEGANG.md):
  - Administrator-Passwort ändern, 2FA aktivieren (System Settings → Two Factor Authentication)
  - Schlüssel setzen: bench --site $SITE set-config <ph_…> <wert>   (Namen: .env.example)
  - Token: ./einrichten.sh --token website@platzhirsch.studio  bzw.  backoffice@platzhirsch.studio
  - Backup-Cron: backup.cron nach /etc/cron.d/platzhirsch-frappe-backup
EOF
