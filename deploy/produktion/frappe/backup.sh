#!/usr/bin/env bash
# deploy/produktion/frappe/backup.sh – nächtliches Backup der Frappe-Site inkl. Dateien, Kopie auf den Host,
# Aufräumen, optional Offsite (rclone) und Heartbeat. Aufruf per Cron (backup.cron), läuft als root
# oder als Benutzer in der Gruppe docker.
#
# OFFSITE IST PFLICHT: ein Backup nur auf demselben Server schützt nicht vor Plattenausfall, Löschung
# oder Ransomware. Empfohlen: Hetzner Storage Box / S3-kompatibler Speicher in einem anderen Rechenzentrum,
# per rclone (rclone config → Remote anlegen, BACKUP_RCLONE_REMOTE setzen), mit Versionierung/Object-Lock.
# Backups enthalten Personendaten (DSGVO) – Offsite-Ziel nur mit AV-Vertrag und Verschlüsselung
# (rclone "crypt"-Remote).
set -Eeuo pipefail
cd "$(dirname "$0")"
set -a; . ./.env; set +a
SITE="${SITE_NAME:?SITE_NAME fehlt}"
ZIEL="${BACKUP_DIR:-/srv/platzhirsch/backups/frappe}"
TAGE="${BACKUP_KEEP_DAYS:-14}"
STAMP=$(date +%Y%m%d-%H%M%S)
BOX="/home/frappe/frappe-bench/sites/$SITE/private/backups"

log() { printf '[backup %s] %s\n' "$(date '+%F %T')" "$*"; }
fail() { log "FEHLER: $*"; exit 1; }
trap 'fail "Abbruch in Zeile $LINENO"' ERR

mkdir -p "$ZIEL/$STAMP"
log "bench backup --with-files ($SITE)"
docker compose exec -T backend bench --site "$SITE" backup --with-files --compress

# Nur die Dateien dieses Laufs holen: neueste Datenbank-Datei bestimmt das Präfix
# (<zeit>-<site>), dazu gehören <präfix>-files.*, <präfix>-private-files.*, <präfix>-site_config_backup.json.
mapfile -t DATEIEN < <(docker compose exec -T backend bash -c \
  "cd '$BOX' && db=\$(ls -1t *-database.sql.gz | head -n 1) && p=\${db%-database.sql.gz} && ls -1 \"\$p\"-*" | tr -d '\r')
(( ${#DATEIEN[@]} >= 3 )) || fail "unerwartet wenige Backup-Dateien: ${DATEIEN[*]-}"
for f in "${DATEIEN[@]}"; do
  docker compose cp "backend:$BOX/$f" "$ZIEL/$STAMP/$f"
done
chmod -R go-rwx "$ZIEL/$STAMP"
( cd "$ZIEL/$STAMP" && sha256sum -- * > SHA256SUMS )
log "lokal: $ZIEL/$STAMP (${#DATEIEN[@]} Dateien)"

# Im Container nur die letzten 3 Tage behalten (Volume nicht volllaufen lassen).
docker compose exec -T backend bash -c "find '$BOX' -type f -mtime +3 -delete"
# Auf dem Host nach BACKUP_KEEP_DAYS aufräumen.
find "$ZIEL" -mindepth 1 -maxdepth 1 -type d -mtime "+$TAGE" -exec rm -rf -- {} +

if [[ -n "${BACKUP_RCLONE_REMOTE:-}" ]]; then
  command -v rclone >/dev/null || fail "rclone fehlt (apt install rclone)"
  log "Offsite: rclone copy → $BACKUP_RCLONE_REMOTE/$STAMP"
  rclone copy "$ZIEL/$STAMP" "$BACKUP_RCLONE_REMOTE/$STAMP" --checksum
else
  log "WARNUNG: BACKUP_RCLONE_REMOTE leer – kein Offsite-Backup!"
fi

if [[ -n "${BACKUP_HEARTBEAT_URL:-}" ]]; then
  curl -fsS -m 10 --retry 3 "$BACKUP_HEARTBEAT_URL" >/dev/null || log "Heartbeat nicht erreichbar"
fi
log "fertig"
