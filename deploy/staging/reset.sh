#!/usr/bin/env bash
# deploy/staging/reset.sh – Staging komplett verwerfen (Container + Volumes: Datenbank, Site, Logs).
#
#   ./reset.sh            fragt nach
#   ./reset.sh -y         ohne Rückfrage
#   ./reset.sh -y --alles zusätzlich ergebnisse/ und .env löschen (neue Passwörter beim nächsten setup.sh)
#
# Danach: ./setup.sh  (frische Site, alle Apps neu). Betrifft NUR das Compose-Projekt dieses Ordners.
set -Eeuo pipefail
cd "$(dirname "$0")"

JA=0; ALLES=0
for arg in "$@"; do
  case "$arg" in
    -y|--ja) JA=1 ;;
    --alles) ALLES=1 ;;
    -h|--help) sed -n '2,8p' "$0"; exit 0 ;;
    *) echo "Unbekannte Option: $arg" >&2; exit 2 ;;
  esac
done

if [[ -f .env ]]; then set -a; . ./.env; set +a; fi
PROJEKT="${COMPOSE_PROJECT_NAME:-ph-staging}"

if [[ "$JA" != "1" ]]; then
  read -r -p "Staging '$PROJEKT' mit allen Daten (Volumes) löschen? [ja/NEIN] " antwort
  [[ "$antwort" == "ja" ]] || { echo "Abgebrochen."; exit 1; }
fi

# DB_ROOT_PASSWORD wird von compose für die Interpolation verlangt – beim Löschen egal.
DB_ROOT_PASSWORD="${DB_ROOT_PASSWORD:-reset}" docker compose down -v --remove-orphans
if [[ "$ALLES" == "1" ]]; then
  rm -rf -- ergebnisse .env
  echo "ergebnisse/ und .env gelöscht."
fi
echo "Staging zurückgesetzt. Neu aufbauen: ./setup.sh --ohne-build (Image bleibt erhalten)"
