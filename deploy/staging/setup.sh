#!/usr/bin/env bash
# deploy/staging/setup.sh – Ein-Befehl-Staging: Image bauen, Dienste starten, Site anlegen,
# 12 PH-Apps in README-Reihenfolge installieren, migrieren, Fixtures laden, Testmodus setzen,
# API-Benutzer website@/backoffice@ anlegen und Token ausgeben.
#
#   ./setup.sh               Standard: stoppt bei der ersten App, die nicht installiert werden kann
#   ./setup.sh --weiter      bei Fehlern weitermachen und fehlgeschlagene Apps am Ende erneut versuchen
#                            (zeigt alle Befunde eines Laufs, z. B. Workflow-States aus späteren Apps)
#   ./setup.sh --ohne-build  vorhandenes Image verwenden
#
# Voraussetzungen (Ubuntu 24.04): Docker Engine + Compose-Plugin v2, openssl. Kein Zugriff auf
# Produktionsserver; alle Daten bleiben in Docker-Volumes dieses Projekts.
set -Eeuo pipefail
cd "$(dirname "$0")"

WEITER=0
BUILD=1
for arg in "$@"; do
  case "$arg" in
    --weiter) WEITER=1 ;;
    --ohne-build) BUILD=0 ;;
    -h|--help) sed -n '2,13p' "$0"; exit 0 ;;
    *) echo "Unbekannte Option: $arg" >&2; exit 2 ;;
  esac
done

APPS=(ph_core ph_crm ph_sortiment ph_projekte ph_shop ph_faktura ph_logistik ph_personal ph_marketing ph_kassa ph_service ph_kundenkarte)
ERG="ergebnisse"
mkdir -p "$ERG/install"
LOG="$ERG/setup-$(date +%Y%m%d-%H%M%S).log"
exec > >(tee -a "$LOG") 2>&1

log() { printf '\n[setup %s] %s\n' "$(date +%H:%M:%S)" "$*"; }
die() { log "FEHLER: $*"; log "Protokoll: deploy/staging/$LOG"; exit 1; }
trap 'die "Abbruch in Zeile $LINENO"' ERR

command -v docker >/dev/null || die "docker fehlt (sudo apt install docker.io docker-compose-v2)"
docker compose version >/dev/null 2>&1 || die "docker compose (v2) fehlt"
command -v openssl >/dev/null || die "openssl fehlt"

# 1) .env anlegen (nur beim ersten Mal) – Staging-Passwörter zufällig, nie im Repo.
if [[ ! -f .env ]]; then
  log ".env fehlt – lege sie mit Zufallspasswörtern an"
  umask 077
  cat > .env <<EOF
COMPOSE_PROJECT_NAME=ph-staging
FRAPPE_BRANCH=version-15
SITE_NAME=staging.platzhirsch.local
DB_ROOT_PASSWORD=$(openssl rand -hex 24)
ADMIN_PASSWORD=$(openssl rand -hex 12)
STAGING_BIND=127.0.0.1
STAGING_PORT=8080
PH_WALLET=1
EOF
  umask 022
fi
set -a; . ./.env; set +a
SITE="${SITE_NAME:-staging.platzhirsch.local}"

DC=(docker compose)
bench() { "${DC[@]}" exec -T backend bench "$@"; }
helper() { "${DC[@]}" exec -T -w /home/frappe/frappe-bench/sites backend ../env/bin/python /opt/ph-deploy/ph_staging.py "$@"; }

# 2) Image bauen und Dienste starten.
if [[ "$BUILD" == "1" ]]; then
  log "Baue Frappe-Image (Frappe ${FRAPPE_BRANCH:-version-15} + 12 PH-Apps) – beim ersten Mal 10–20 Minuten"
  "${DC[@]}" build backend
fi
log "Starte MariaDB, Redis, configurator"
"${DC[@]}" up -d db redis-cache redis-queue
"${DC[@]}" up configurator --exit-code-from configurator || die "configurator fehlgeschlagen"
log "Starte backend, websocket, worker, scheduler, frontend"
"${DC[@]}" up -d --renew-anon-volumes backend websocket queue-short queue-long scheduler frontend

for i in $(seq 1 60); do
  if "${DC[@]}" exec -T backend bash -c 'test -f sites/common_site_config.json' 2>/dev/null; then break; fi
  sleep 2
done

# 3) Site anlegen (nur wenn noch nicht vorhanden).
if "${DC[@]}" exec -T backend test -d "sites/$SITE"; then
  log "Site $SITE existiert bereits – überspringe new-site (./reset.sh für einen frischen Stand)"
else
  log "Lege Site $SITE an"
  bench new-site "$SITE" \
    --mariadb-user-host-login-scope='%' \
    --db-root-username=root \
    --db-root-password="$DB_ROOT_PASSWORD" \
    --admin-password="$ADMIN_PASSWORD" \
    --set-default
fi

# 4) Site-Konfiguration für Tests (Developer Mode, Tests erlaubt, keine echten Mails, Testmodus-Schlüssel).
log "Setze Staging-Konfiguration (developer_mode, allow_tests, mute_emails, Test-Umgebungen)"
bench --site "$SITE" set-config -p developer_mode 1
bench --site "$SITE" set-config -p allow_tests True
bench --site "$SITE" set-config -p mute_emails 1
bench --site "$SITE" set-config -p ph_stripe_livemode 0
bench --site "$SITE" set-config ph_letmeship_env test
bench --site "$SITE" set-config ph_atrust_env test
bench --site "$SITE" set-config -p pause_scheduler 0

# 5) Apps in exakt der README-Reihenfolge (Backend-Import/README.md §2).
installiert() { bench --site "$SITE" list-apps 2>/dev/null | awk '{print $1}' | grep -qx "$1"; }
install_app() {
  local app="$1" datei="$ERG/install/$1.log"
  if installiert "$app"; then log "$app ist bereits installiert"; return 0; fi
  log "install-app $app"
  if bench --site "$SITE" install-app "$app" >"$datei" 2>&1; then
    log "$app ok"; return 0
  fi
  log "$app FEHLGESCHLAGEN – letzte Zeilen aus $datei:"
  tail -n 25 "$datei" || true
  return 1
}

trap - ERR
FEHLER=()
for app in "${APPS[@]}"; do
  if ! install_app "$app"; then
    FEHLER+=("$app")
    if [[ "$WEITER" != "1" ]]; then
      die "Installation bei $app gestoppt (README: '|| break'). Befund melden (README.md 'Befunde zurückmelden'); mit --weiter alle Befunde sammeln."
    fi
  fi
done

# Zweiter Durchgang: Apps, deren Fixtures auf Workflow-States/DocTypes späterer Apps zeigen,
# laufen oft durch, sobald die späteren Apps da sind. Das ist trotzdem ein Befund (Reihenfolge!).
if (( ${#FEHLER[@]} )); then
  log "Zweiter Versuch für: ${FEHLER[*]}"
  NOCH=()
  for app in "${FEHLER[@]}"; do
    if ! install_app "$app"; then NOCH+=("$app"); else
      echo "$app: erst im zweiten Durchgang installiert (Abhängigkeit auf spätere App)" >> "$ERG/befunde.txt"
    fi
  done
  FEHLER=("${NOCH[@]+"${NOCH[@]}"}")
fi
trap 'die "Abbruch in Zeile $LINENO"' ERR

# 6) Migration, Fixtures, Cache.
log "bench migrate"
bench --site "$SITE" migrate 2>&1 | tee "$ERG/install/migrate.log" | tail -n 30
log "Fixtures aller Apps erneut laden (sync_fixtures)"
bench --site "$SITE" execute frappe.utils.fixtures.sync_fixtures 2>&1 | tee "$ERG/install/fixtures.log" | tail -n 20
bench --site "$SITE" clear-cache

# 7) Testmodus-Flags, Integrationsbenutzer, Token.
log "PH Einstellungen (testmodus=1, api_aktiv=1), Kassa-Terminal im Testmodus, Benutzer website@/backoffice@"
helper konfigurieren "$SITE"
log "Erzeuge API-Token (neues Secret bei jedem Lauf)"
WEB_TOKEN=$(helper token "$SITE" website@platzhirsch.studio | tail -n 1)
BO_TOKEN=$(helper token "$SITE" backoffice@platzhirsch.studio | tail -n 1)
umask 077
cat > "$ERG/tokens.env" <<EOF
# Staging-Token ($(date '+%Y-%m-%d %H:%M')) – NUR Staging, nie in Produktion verwenden, nie ins Repo.
# Website (.env.local gegen Staging):
SERVER=http://localhost:${STAGING_PORT:-8080}
API_KEY=${WEB_TOKEN%%:*}
API_SECRET=${WEB_TOKEN#*:}
FRAPPE_API_KEY=${WEB_TOKEN%%:*}
FRAPPE_API_SECRET=${WEB_TOKEN#*:}
# Backoffice (backoffice/.env.local gegen Staging):
BACKOFFICE_MODE=frappe
BACKOFFICE_FRAPPE_URL=http://localhost:${STAGING_PORT:-8080}
BACKOFFICE_FRAPPE_TOKEN=${BO_TOKEN}
EOF
umask 022

# 8) Backup des frischen Stands + Zustand.
log "Backup des frischen Stands (bench backup --with-files)"
bench --site "$SITE" backup --with-files | tail -n 6
log "Zustand"
helper pruefen "$SITE" | tee "$ERG/zustand.json"

log "Fertig."
cat <<EOF

  Desk:        http://${STAGING_BIND:-127.0.0.1}:${STAGING_PORT:-8080}/app   (Benutzer Administrator, Passwort: ADMIN_PASSWORD in deploy/staging/.env)
               vom eigenen Rechner: ssh -L ${STAGING_PORT:-8080}:127.0.0.1:${STAGING_PORT:-8080} <server>
  Ping:        curl -H "Authorization: token <API_KEY>:<API_SECRET>" http://127.0.0.1:${STAGING_PORT:-8080}/api/method/ph_core.api.health.ping
  Token:       deploy/staging/$ERG/tokens.env (chmod 600)
  Tests:       ./test.sh
  Protokoll:   deploy/staging/$LOG
EOF
if (( ${#FEHLER[@]} )); then
  log "NICHT installiert: ${FEHLER[*]} – Logs in $ERG/install/<app>.log"
  exit 1
fi
