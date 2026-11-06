#!/usr/bin/env bash
# deploy/staging/test.sh – Tests aller 12 PH-Apps auf der Staging-Site, nacheinander, mit Bericht.
#
#   ./test.sh                     alle Apps (bricht NICHT beim ersten Fehler ab – voller Überblick)
#   ./test.sh ph_crm ph_shop      nur diese Apps
#   ./test.sh --stopp             beim ersten roten App-Lauf aufhören (wie README §5 '|| break')
#   ./test.sh --ohne-logik        nur Site-Tests (ohne die reinen unittest-Logiktests je App)
#
# Ergebnis: ergebnisse/tests-<zeit>/  <app>.xml (JUnit), <app>.log, logik-<app>.log, status.tsv,
#           zusammenfassung.md (Tabelle + Liste der roten Tests) und check.log (tools/check.py, falls python3).
# Exit 0 nur, wenn alle Läufe grün sind.
set -Euo pipefail
cd "$(dirname "$0")"
[[ -f .env ]] || { echo "deploy/staging/.env fehlt – zuerst ./setup.sh" >&2; exit 2; }
set -a; . ./.env; set +a
SITE="${SITE_NAME:-staging.platzhirsch.local}"

ALLE=(ph_core ph_crm ph_sortiment ph_projekte ph_shop ph_faktura ph_logistik ph_personal ph_marketing ph_kassa ph_service ph_kundenkarte)
STOPP=0; LOGIK=1; APPS=()
for arg in "$@"; do
  case "$arg" in
    --stopp) STOPP=1 ;;
    --ohne-logik) LOGIK=0 ;;
    -h|--help) sed -n '2,12p' "$0"; exit 0 ;;
    ph_*) APPS+=("$arg") ;;
    *) echo "Unbekannte Option: $arg" >&2; exit 2 ;;
  esac
done
(( ${#APPS[@]} )) || APPS=("${ALLE[@]}")

DC=(docker compose)
STAMP=$(date +%Y%m%d-%H%M%S)
HOST_DIR="ergebnisse/tests-$STAMP"
BOX_DIR="/home/frappe/frappe-bench/logs/ph-tests-$STAMP"   # logs-Volume
mkdir -p "$HOST_DIR"
"${DC[@]}" exec -T backend mkdir -p "$BOX_DIR"
: > "$HOST_DIR/status.tsv"

"${DC[@]}" ps --status running backend | grep -q backend || { echo "backend läuft nicht – ./setup.sh" >&2; exit 2; }

ROT=0
for app in "${APPS[@]}"; do
  echo "== $app: bench --site $SITE run-tests --app $app"
  start=$(date +%s)
  "${DC[@]}" exec -T backend bench --site "$SITE" run-tests --app "$app" \
      --junit-xml-output "$BOX_DIR/$app.xml" >"$HOST_DIR/$app.log" 2>&1
  code=$?
  dauer=$(( $(date +%s) - start ))
  printf '%s\t%s\t%s\n' "$app" "$code" "$dauer" >> "$HOST_DIR/status.tsv"
  "${DC[@]}" exec -T backend bash -c "printf '%s\t%s\t%s\n' '$app' '$code' '$dauer' >> '$BOX_DIR/status.tsv'"
  if [[ $code -eq 0 ]]; then echo "   grün (${dauer}s)"; else echo "   ROT (Exit $code, ${dauer}s) – $HOST_DIR/$app.log"; ROT=1; tail -n 15 "$HOST_DIR/$app.log"; fi

  # Reine Logiktests ohne Site (CONVENTIONS §15) – nur wenn die App einen tests/-Ordner hat.
  if [[ "$LOGIK" == "1" ]] && "${DC[@]}" exec -T backend test -d "apps/$app/$app/tests"; then
    if "${DC[@]}" exec -T -w "/home/frappe/frappe-bench/apps/$app" -e PYTHONPATH=. backend \
         ../../env/bin/python -m unittest discover -s "$app/tests" -t . >"$HOST_DIR/logik-$app.log" 2>&1; then
      echo "   Logiktests grün"
    else
      echo "   Logiktests ROT – $HOST_DIR/logik-$app.log"; ROT=1
    fi
  fi
  if [[ $ROT -eq 1 && $STOPP -eq 1 ]]; then echo "--stopp: höre nach $app auf"; break; fi
done

# JUnit-Dateien holen und Zusammenfassung bauen (Python im Container, kein Python auf dem Host nötig).
"${DC[@]}" exec -T -w /home/frappe/frappe-bench/sites backend \
  ../env/bin/python /opt/ph-deploy/ph_staging.py testbericht "$BOX_DIR" >/dev/null || true
"${DC[@]}" cp "backend:$BOX_DIR/." "$HOST_DIR/" >/dev/null 2>&1 || true

# Statische Prüfung aller Apps vom Host aus (falls python3 da ist).
if command -v python3 >/dev/null; then
  python3 -I ../../Backend-Import/tools/check.py >"$HOST_DIR/check.log" 2>&1 || ROT=1
  echo "tools/check.py: $HOST_DIR/check.log"
fi

# Frappe Error Log als Teil des Berichts (Fehler, die Tests nicht direkt zeigen).
"${DC[@]}" exec -T -w /home/frappe/frappe-bench/sites backend \
  ../env/bin/python /opt/ph-deploy/ph_staging.py pruefen "$SITE" >"$HOST_DIR/zustand.json" 2>&1 || true

echo
cat "$HOST_DIR/zusammenfassung.md" 2>/dev/null || echo "(keine zusammenfassung.md – siehe Logs in $HOST_DIR)"
echo
echo "Bericht: deploy/staging/$HOST_DIR/"
exit $ROT
