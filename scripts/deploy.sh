#!/usr/bin/env bash
# scripts/deploy.sh — R4-plattform-ci (Masterplan AP1.6)
# Release-Ordner + atomarer Symlink-Wechsel + pm2 reload + Healthcheck mit
# automatischem Rollback. Läuft VON HAND auf dem Server (nicht in CI).
#
#   scripts/deploy.sh deploy [git-ref]      # Standard-Ref: main
#   scripts/deploy.sh rollback [release]    # Standard: das Release vor "current"
#   scripts/deploy.sh list
#   DRY_RUN=1 scripts/deploy.sh deploy      # zeigt nur, was passieren würde
#
# Verzeichnisse (alle unter APP_ROOT, per Umgebung änderbar):
#   repo.git/            Spiegel des Git-Repos (einmalig: git clone --mirror <url> repo.git)
#   releases/<stamp>-<sha>/   ein vollständiger Build je Release
#   current -> releases/…     Symlink, auf den pm2 zeigt
#   shared/.env.production    Server-Umgebung (SERVER, Schlüssel) – nie im Repo
#   shared/.data/             Laufzeitdaten (Uploads, Portal), überleben Releases
#   shared/public-ezarri/     Ezarri-Medien (Kopie von public/ezarri, nicht im Repo)
#   shared/ecosystem.deploy.cjs  von diesem Skript erzeugt (cwd = current)
#
# Warum ecosystem.deploy.cjs: pm2 merkt sich das Arbeitsverzeichnis. Wird es aus
# dem aufgelösten Symlink gelesen, liefe nach "pm2 reload" das alte Release
# weiter. Mit cwd = ".../current" (als Pfad, nicht aufgelöst) startet jeder
# Reload im aktuellen Ziel des Symlinks.
#
# Kurze Downtime: pm2 läuft laut ecosystem.config.js im Modus "fork" mit
# instances: 1. "pm2 reload" ist damit ein Neustart des einen Prozesses
# (einige Sekunden 502 über nginx), KEIN Zero-Downtime-Reload. Für echtes
# Zero-Downtime bräuchte es exec_mode "cluster" oder zwei Ports hinter nginx.
#
# Bindung: Next lauscht nur auf BIND_HOST (Standard 127.0.0.1), nie auf allen
# Schnittstellen. Das Rate-Limit (/cmx, /api/shop-search) vertraut dem LETZTEN
# Eintrag von X-Forwarded-For; das ist nur sicher, wenn ausschließlich nginx
# Port $PORT erreicht. nginx-Vorlage: tools/ci/nginx-platzhirsch.conf.example.
#
# Voraussetzungen: bash ≥ 4, git, node/npm (Version wie in CI), pm2, curl, flock.
set -Eeuo pipefail
IFS=$'\n\t'

APP_ROOT="${APP_ROOT:-/var/www/platzhirsch}"
REPO_DIR="${REPO_DIR:-$APP_ROOT/repo.git}"
RELEASES="$APP_ROOT/releases"
SHARED="$APP_ROOT/shared"
CURRENT="$APP_ROOT/current"
PM2_APP="${PM2_APP:-Platzhirsch-Studio-Website}"
PORT="${PORT:-3000}"
BIND_HOST="${BIND_HOST:-127.0.0.1}"
KEEP_RELEASES="${KEEP_RELEASES:-5}"
# Tor: nur Seiten ohne Backoffice-Abhängigkeit. /de/produkte hängt am
# Backoffice (bei Last 504) und würde ein gutes Release zurückrollen; es wird
# darum nur gewarnt (HEALTH_WARN_URLS).
HEALTH_URLS="${HEALTH_URLS:-http://127.0.0.1:$PORT/de}"
HEALTH_WARN_URLS="${HEALTH_WARN_URLS:-http://127.0.0.1:$PORT/de/produkte}"
HEALTH_TIMEOUT="${HEALTH_TIMEOUT:-120}"   # Sekunden bis alle URLs 200 liefern
DRY_RUN="${DRY_RUN:-0}"
LOCK_FILE="$APP_ROOT/.deploy.lock"
SWITCHED=0   # 1, sobald "current" in diesem Lauf umgestellt wurde

log() { printf '[deploy %s] %s\n' "$(date +%H:%M:%S)" "$*" >&2; }
die() { log "FEHLER: $*"; exit 1; }

# Führt einen Befehl aus oder zeigt ihn nur (DRY_RUN=1).
run() {
  if [[ "$DRY_RUN" == "1" ]]; then
    printf '[dry-run] %q' "$1" >&2; shift; printf ' %q' "$@" >&2; printf '\n' >&2
  else
    "$@"
  fi
}

# Wie run, aber im angegebenen Ordner (Subshell, ändert das eigene cwd nicht).
run_in() {
  local dir="$1"
  shift
  if [[ "$DRY_RUN" == "1" ]]; then
    printf '[dry-run] (cd %q &&' "$dir" >&2; printf ' %q' "$@" >&2; printf ')\n' >&2
  else
    (cd "$dir" && "$@")
  fi
}

on_error() {
  local code=$? line=${1:-?}
  if ((SWITCHED)); then
    log "Abbruch in Zeile $line (Exit $code) NACH dem Umschalten: \"current\" zeigt auf $(current_release || true). Bitte \"scripts/deploy.sh rollback\" ausführen."
  else
    log "Abbruch in Zeile $line (Exit $code). \"current\" wurde nicht umgestellt."
  fi
  exit "$code"
}
trap 'on_error $LINENO' ERR

require() {
  local cmd
  for cmd in "$@"; do command -v "$cmd" >/dev/null 2>&1 || die "$cmd fehlt"; done
}

with_lock() {
  # DRY_RUN legt nichts an, auch keine Sperrdatei.
  if [[ "$DRY_RUN" == "1" ]]; then log "[dry-run] Sperre $LOCK_FILE"; return 0; fi
  mkdir -p "$APP_ROOT"
  exec 9>"$LOCK_FILE"
  flock -n 9 || die "Ein anderer Deploy läuft gerade ($LOCK_FILE)."
}

# Release-Namen, älteste zuerst (Zeitstempel vorne → lexikografisch = zeitlich).
list_releases() {
  [[ -d "$RELEASES" ]] || return 0
  find "$RELEASES" -mindepth 1 -maxdepth 1 -type d -name '20[0-9][0-9]*' -printf '%f\n' | sort
}

current_release() {
  [[ -L "$CURRENT" ]] || return 0
  basename "$(readlink -f "$CURRENT")"
}

# Atomarer Wechsel: neuer Symlink unter Temp-Namen, dann rename(2) über "current".
switch_to() {
  local target="$RELEASES/$1"
  # Im DRY_RUN existiert der neue Ordner nicht (nichts wird angelegt).
  [[ "$DRY_RUN" == "1" || -d "$target" ]] || die "Release $1 gibt es nicht"
  run ln -sfn "$target" "$CURRENT.tmp" || return 1
  run mv -Tf "$CURRENT.tmp" "$CURRENT" || return 1
  SWITCHED=1
  log "current -> $1"
}

write_pm2_config() {
  local file="$SHARED/ecosystem.deploy.cjs"
  if [[ "$DRY_RUN" == "1" ]]; then log "[dry-run] schreibe $file"; return 0; fi
  cat >"$file" <<EOF
// Erzeugt von scripts/deploy.sh – nicht von Hand ändern.
// Übernimmt ecosystem.config.js des aktiven Releases, setzt aber cwd auf den
// Symlink, damit "pm2 reload" immer das aktuelle Release startet.
const path = require("path");
const current = ${CURRENT@Q};
const base = require(path.join(current, "ecosystem.config.js"));
module.exports = {
  apps: base.apps.map((app) => ({
    ...app,
    name: ${PM2_APP@Q},
    cwd: current,
    // Nur lokal lauschen: nginx ist der einzige Weg von außen (Rate-Limit
    // vertraut X-Forwarded-For nur hinter nginx).
    args: ["start", "-H", ${BIND_HOST@Q}, "-p", ${PORT@Q}],
    env: { ...(app.env || {}), PORT: ${PORT@Q}, HOSTNAME: ${BIND_HOST@Q} },
  })),
};
EOF
}

# Alle Schritte mit "|| return 1": In "if ! pm2_reload" ist set -e
# abgeschaltet; ohne die expliziten Returns liefe die Funktion nach einem
# Fehler weiter und meldete Erfolg.
pm2_reload() {
  write_pm2_config || return 1
  # startOrReload: startet beim ersten Mal, danach Neustart (fork, siehe oben).
  run pm2 startOrReload "$SHARED/ecosystem.deploy.cjs" --update-env || return 1
  run pm2 save || return 1
}

# Warnt, wenn Next auf einer öffentlichen Adresse lauscht (Rate-Limit wäre
# per gefälschtem X-Forwarded-For umgehbar). Bricht nicht ab.
check_bind() {
  if [[ "$DRY_RUN" == "1" ]] || ! command -v ss >/dev/null 2>&1; then return 0; fi
  local listeners
  listeners=$(ss -ltnH "sport = :$PORT" 2>/dev/null | awk '{print $4}' || true)
  if grep -Eq '^(0\.0\.0\.0|\*|\[::\]|::):' <<<"$listeners"; then
    log "WARNUNG: Port $PORT lauscht öffentlich ($(tr '\n' ' ' <<<"$listeners")). Nur $BIND_HOST binden und per Firewall sperren."
  fi
  return 0
}

# Prüft und schaltet bei Rot auf $2 zurück. Ein fehlgeschlagener Reload zählt
# wie ein roter Healthcheck (vorher: ERR-Trap, "current" blieb auf dem neuen
# Release stehen).
reload_or_rollback() {
  local name="$1" prev="$2"
  if pm2_reload && healthcheck; then
    check_bind
    return 0
  fi
  log "Release $name: pm2-Reload oder Healthcheck rot"
  if [[ -z "$prev" ]]; then
    die "Release $name ist rot und es gibt kein Vorgänger-Release. Bitte von Hand prüfen (pm2 logs $PM2_APP)."
  fi
  log "Rollback auf $prev"
  switch_to "$prev" || die "Umschalten auf $prev fehlgeschlagen – current zeigt noch auf $name!"
  if pm2_reload && healthcheck; then
    die "Release $name ist rot, $prev läuft wieder. Der Ordner $name bleibt zur Analyse liegen."
  fi
  die "Auch das vorige Release $prev antwortet nicht – bitte von Hand prüfen (pm2 logs $PM2_APP)."
}

# Nur Hinweis, kein Tor: Seiten, die am Backoffice hängen.
warn_urls() {
  local url code
  local -a urls
  IFS=' ' read -r -a urls <<<"$HEALTH_WARN_URLS"
  for url in "${urls[@]}"; do
    [[ -n "$url" ]] || continue
    code=$(curl -s -o /dev/null -m 20 -w '%{http_code}' "$url" || true)
    [[ "$code" == "200" ]] || log "WARNUNG: $url -> ${code:-keine Antwort} (Backoffice? kein Rollback)"
  done
  return 0
}

healthcheck() {
  if [[ "$DRY_RUN" == "1" ]]; then log "[dry-run] healthcheck: $HEALTH_URLS"; return 0; fi
  local deadline=$((SECONDS + HEALTH_TIMEOUT)) url code ok
  local -a urls
  IFS=' ' read -r -a urls <<<"$HEALTH_URLS"
  while ((SECONDS < deadline)); do
    ok=1
    for url in "${urls[@]}"; do
      code=$(curl -s -o /dev/null -m 20 -w '%{http_code}' "$url" || true)
      if [[ "$code" != "200" ]]; then ok=0; break; fi
    done
    if ((ok)); then
      log "healthcheck ok: ${urls[*]}"
      warn_urls
      return 0
    fi
    sleep 3
  done
  log "healthcheck fehlgeschlagen: $url -> ${code:-keine Antwort}"
  return 1
}

# Besucher-Einblicke (QA Technik P1-1, QA Recht P2-1): Rohdaten höchstens 14
# Tage. Bei jedem Deploy: alte Rohdaten löschen und prüfen; ist der Schalter
# NEXT_PUBLIC_EINBLICKE=1 gesetzt, MUSS EINBLICKE_CRON_SECRET (≥ 24 Zeichen)
# da sein, und der Cron-Eintrag 03:30 (tools/einblicke/cron.sh) wird
# idempotent angelegt. Ohne Schalter wird nur gelöscht. Bricht nicht ab.
ensure_einblicke() {
  local env_file="$SHARED/.env.production" on secret line
  on=$(grep -E '^NEXT_PUBLIC_EINBLICKE=' "$env_file" 2>/dev/null | tail -n1 | cut -d= -f2- | tr -d '"'"'" || true)
  secret=$(grep -E '^EINBLICKE_CRON_SECRET=' "$env_file" 2>/dev/null | tail -n1 | cut -d= -f2- | tr -d '"'"'" || true)
  run_in "$CURRENT" node tools/einblicke/tagesabschluss.mjs --pruefen ||
    log "WARNUNG: Einblicke-Rohdaten älter als 14 Tage liegen noch unter $SHARED/.data/einblicke/roh"
  [[ "$on" == "1" ]] || return 0
  if (( ${#secret} < 24 )); then
    log "WARNUNG: NEXT_PUBLIC_EINBLICKE=1, aber EINBLICKE_CRON_SECRET fehlt in $env_file (mind. 24 Zeichen) – kein Tagesabschluss."
  fi
  line="30 3 * * * /usr/bin/env bash $CURRENT/tools/einblicke/cron.sh >> $SHARED/.data/einblicke/cron.log 2>&1 # platzhirsch-einblicke"
  if ! command -v crontab >/dev/null 2>&1; then
    log "WARNUNG: crontab fehlt – Cron für den Einblicke-Tagesabschluss von Hand einrichten: $line"
    return 0
  fi
  if crontab -l 2>/dev/null | grep -qF "# platzhirsch-einblicke"; then return 0; fi
  if [[ "$DRY_RUN" == "1" ]]; then log "[dry-run] crontab += $line"; return 0; fi
  mkdir -p "$SHARED/.data/einblicke"
  { crontab -l 2>/dev/null || true; printf '%s\n' "$line"; } | crontab - && log "Cron eingerichtet: Einblicke-Tagesabschluss 03:30"
  return 0
}

# Alte Releases löschen, nie "current" und nie das Release davor.
cleanup() {
  local -a all
  mapfile -t all < <(list_releases)
  local count=${#all[@]} keep=$KEEP_RELEASES cur prev="" i name
  ((keep >= 2)) || keep=2
  ((count > keep)) || return 0
  cur=$(current_release)
  for ((i = 0; i < count; i++)); do
    if [[ "${all[i]}" == "$cur" && i -gt 0 ]]; then prev="${all[i-1]}"; fi
  done
  for ((i = 0; i < count - keep; i++)); do
    name="${all[i]}"
    if [[ "$name" == "$cur" || "$name" == "$prev" ]]; then continue; fi
    # Schutz: nur echte Release-Ordner direkt unter $RELEASES.
    [[ "$name" =~ ^20[0-9]{6}-[0-9]{6}-[0-9a-f]{7,40}$ ]] || { log "überspringe unerwarteten Ordner $name"; continue; }
    log "lösche altes Release $name"
    run rm -rf -- "${RELEASES:?}/${name:?}"
  done
}

cmd_deploy() {
  local ref="${1:-main}" sha stamp name dir prev
  require git npm pm2 curl flock tar
  with_lock
  [[ -d "$REPO_DIR" ]] || die "$REPO_DIR fehlt (einmalig: git clone --mirror <url> $REPO_DIR)"
  [[ -f "$SHARED/.env.production" ]] || die "$SHARED/.env.production fehlt"
  run mkdir -p "$RELEASES" "$SHARED/.data"

  run git --git-dir="$REPO_DIR" fetch --prune origin '+refs/heads/*:refs/heads/*' '+refs/tags/*:refs/tags/*'
  sha=$(git --git-dir="$REPO_DIR" rev-parse --verify "$ref^{commit}") || die "Ref $ref unbekannt"
  stamp=$(date +%Y%m%d-%H%M%S)
  name="$stamp-${sha:0:12}"
  dir="$RELEASES/$name"
  prev=$(current_release)
  log "Release $name aus $ref ($sha), vorher: ${prev:-keins}"

  # 1) Quelltext exakt dieses Commits (ohne .git) in den neuen Ordner.
  run mkdir -p "$dir"
  if [[ "$DRY_RUN" == "1" ]]; then
    log "[dry-run] git archive $sha | tar -x -C $dir"
  else
    git --git-dir="$REPO_DIR" archive --format=tar "$sha" | tar -x -C "$dir"
    printf '%s\n' "$sha" >"$dir/REVISION"
  fi

  # 2) Geteilte Dateien verlinken (Umgebung, Laufzeitdaten).
  run ln -sfn "$SHARED/.env.production" "$dir/.env.production"
  run ln -sfn "$SHARED/.data" "$dir/.data"
  # Ezarri-Welt (~560 MB Bilder/Videos/PDFs, nicht im Repo, .gitignore):
  # einmalig nach $SHARED/public-ezarri kopieren (integration.md), hier verlinkt.
  if [[ -d "$SHARED/public-ezarri" ]]; then
    run ln -sfn "$SHARED/public-ezarri" "$dir/public/ezarri"
  elif [[ "$DRY_RUN" == "1" ]]; then
    log "[dry-run] $SHARED/public-ezarri fehlt – vor dem echten Deploy anlegen (integration.md)"
  else
    die "$SHARED/public-ezarri fehlt (Kopie von public/ezarri, siehe integration.md)"
  fi

  # 3) Abhängigkeiten und Build im neuen Ordner. Der Build-Cache des
  #    Vorgängers beschleunigt den Build, ist aber optional.
  if [[ -n "$prev" && -d "$RELEASES/$prev/.next/cache" ]]; then
    run mkdir -p "$dir/.next"
    run cp -a "$RELEASES/$prev/.next/cache" "$dir/.next/cache"
  fi
  run_in "$dir" npm ci --no-audit --no-fund
  run_in "$dir" npm run build

  # 4) Umschalten, neu laden, prüfen. Bei rotem Reload ODER Healthcheck sofort zurück.
  switch_to "$name"
  reload_or_rollback "$name" "$prev"
  ensure_einblicke || true
  cleanup
  log "fertig: $name ist live"
}

cmd_rollback() {
  local target="${1:-}" cur i
  local -a all
  require pm2 curl flock
  with_lock
  cur=$(current_release)
  mapfile -t all < <(list_releases)
  if [[ -z "$target" ]]; then
    for ((i = 1; i < ${#all[@]}; i++)); do
      if [[ "${all[i]}" == "$cur" ]]; then target="${all[i-1]}"; fi
    done
  fi
  [[ -n "$target" ]] || die "Kein Release vor ${cur:-?} gefunden. Verfügbar: ${all[*]:-keine}"
  [[ "$target" != "$cur" ]] || die "$target ist bereits aktiv"
  log "rollback: $cur -> $target"
  switch_to "$target"
  if ! pm2_reload || ! healthcheck; then
    die "Rollback-Ziel $target antwortet nicht (current zeigt jetzt darauf; ggf. erneut rollback <release>)."
  fi
  check_bind
  log "fertig: $target ist live"
}

cmd_list() {
  local cur name
  cur=$(current_release)
  while IFS= read -r name; do
    [[ -n "$name" ]] || continue
    if [[ "$name" == "$cur" ]]; then printf '* %s (current)\n' "$name"; else printf '  %s\n' "$name"; fi
  done < <(list_releases)
}

main() {
  local cmd="${1:-}"
  shift || true
  case "$cmd" in
    deploy) cmd_deploy "$@" ;;
    rollback) cmd_rollback "$@" ;;
    list) cmd_list ;;
    healthcheck) healthcheck ;;
    *)
      sed -n '2,12p' "$0" | sed 's/^# \{0,1\}//'
      exit 2
      ;;
  esac
}

# Nur ausführen, wenn direkt gestartet. "source scripts/deploy.sh" lädt nur die
# Funktionen (tests/unit/r4-ci-pipeline.test.mjs prüft so den Rollback-Ablauf).
if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  main "$@"
fi
