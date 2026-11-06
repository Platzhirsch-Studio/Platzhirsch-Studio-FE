# Staging – erster echter Test der 12 PH-Apps

Ein Befehl baut eine leere Frappe-v15-Umgebung (ohne ERPNext) mit allen Apps aus `Backend-Import/`, installiert sie in der Pflicht-Reihenfolge und lässt die Tests laufen. **Keine Verbindung zum produktiven Backoffice**, keine echten Mails (`mute_emails`, `testmodus`), Stripe/LetMeShip/A-Trust nur im Testmodus.

```bash
# auf dem Staging-Server (Ubuntu 24.04), im Repo-Klon:
cd deploy/staging
./setup.sh          # Image bauen, Site anlegen, 12 Apps installieren, Token ausgeben
./test.sh           # run-tests für alle 12 Apps + Logiktests + tools/check.py → ergebnisse/tests-<zeit>/
./reset.sh -y       # alles verwerfen (Volumes), danach ./setup.sh --ohne-build
```

Nach dem Klonen unter Windows/ohne Ausführungsrecht einmal: `chmod +x *.sh ../produktion/frappe/*.sh`.

## Dateien

| Datei | Zweck |
|---|---|
| `docker-compose.yml` | backend (gunicorn :8000), frontend (Nginx :8080 → Host `127.0.0.1:8080`), websocket (socketio :9000), queue-short, queue-long, scheduler, configurator (einmalig), MariaDB 10.6, Redis cache + queue. Muster wie `frappe_docker/pwd.yml`. |
| `Containerfile.frappe` | Image `platzhirsch/frappe-ph:staging`: `frappe/build:version-15` → `bench init` (nur Frappe) → `Backend-Import/ph_*` als lokale Apps nach `apps/`, `pip install -e` (liest `pyproject.toml`: `stripe`, `cryptography`, `qrcode`; `ph_kundenkarte[wallet]` optional) → Prüfimport `stripe, cryptography, qrcode, pyqrcode, requests` → `bench build --production` → Laufzeit `frappe/base:version-15` (enthält wkhtmltopdf 0.12.6 patched Qt und nginx). Mit `PH_DEV_TOOLS=1` zusätzlich `unittest-xml-reporting` usw. (für `run-tests --junit-xml-output`). Build-Kontext = Repo-Root. |
| `Containerfile.frappe.dockerignore` | begrenzt den Kontext auf die 12 App-Ordner |
| `setup.sh` | `.env` mit Zufallspasswörtern → Build → `new-site staging.platzhirsch.local` → `developer_mode`, `allow_tests`, `mute_emails`, `ph_stripe_livemode=0`, `ph_letmeship_env=test`, `ph_atrust_env=test` → `install-app` je App in README-Reihenfolge → `migrate` → `sync_fixtures` → PH Einstellungen `testmodus=1`, `api_aktiv=1`, Kassa-Terminal `terminal_testmodus=1` → Benutzer `website@platzhirsch.studio` (PH Website Integration) und `backoffice@platzhirsch.studio` (System Manager + PH Backoffice-Admin) → API-Token nach `ergebnisse/tokens.env` (chmod 600) → `backup --with-files` → Zustandsbericht |
| `test.sh` | `bench --site … run-tests --app <app> --junit-xml-output` für alle 12 Apps nacheinander (kein Abbruch, außer `--stopp`), reine Logiktests je App (`python -m unittest discover`), `tools/check.py`, Frappe-Error-Log → `zusammenfassung.md` |
| `reset.sh` | `docker compose down -v` (Datenbank, Site, Logs weg); `--alles` löscht auch `ergebnisse/` und `.env` |
| `scripts/ph_staging.py` | Helfer im Container (Einstellungen setzen, Benutzer, Token, Zustand, JUnit-Bericht) |

Optionen: `./setup.sh --weiter` sammelt **alle** Installationsfehler eines Laufs und versucht fehlgeschlagene Apps am Ende ein zweites Mal (Befund in `ergebnisse/befunde.txt`); `./test.sh ph_crm ph_shop` testet nur diese Apps.

## Hardware-Bedarf

| | Minimum | Empfohlen |
|---|---|---|
| CPU | 2 vCPU | 4 vCPU (Image-Build und `run-tests` sind CPU-lastig) |
| RAM | 4 GB + 4 GB Swap | 8 GB (Build mit Node/esbuild ~3 GB, MariaDB 1 GB, gunicorn + Worker 1–2 GB) |
| Disk | 30 GB SSD | 50 GB SSD (Images ~3 GB, Build-Cache ~4 GB, DB + Backups + Testläufe) |
| Netz | ausgehend zu GitHub (frappe), PyPI, npm-Registry, Docker Hub während des Builds | |
| Dauer | erster Build 10–20 min, Installation der 12 Apps 5–15 min, Tests 10–40 min | |

Software: `sudo apt install docker.io docker-compose-v2 openssl git` (oder Docker CE aus dem offiziellen Repo; Compose v2 und BuildKit nötig). Nutzer in die Gruppe `docker` oder `sudo ./setup.sh`.

## Ablauf im Detail

1. Repo auf den Staging-Server klonen (nur `Backend-Import/` und `deploy/` werden gebraucht).
2. `cd deploy/staging && ./setup.sh` – am Ende stehen URL, Desk-Zugang und Token-Datei im Terminal.
3. Desk prüfen per SSH-Tunnel: `ssh -L 8080:127.0.0.1:8080 <server>` → http://localhost:8080/app (Administrator, Passwort `ADMIN_PASSWORD` aus `.env`). Erstlauf-Checkliste: `Backend-Import/README.md` §4 (Firma, PH Einstellungen, Rollenprofile, Druckformat-PDF).
4. `./test.sh` → `ergebnisse/tests-<zeit>/zusammenfassung.md`.
5. Website/Backoffice lokal gegen Staging: Werte aus `ergebnisse/tokens.env` in `.env.local` bzw. `backoffice/.env.local` (Tunnel offen lassen).
6. Neuer Stand der Apps: `git pull && ./setup.sh` (baut neu, installiert fehlende Apps, migriert). Für einen sauberen Erstinstallations-Test: `./reset.sh -y && ./setup.sh --ohne-build` nach einem Build.

Die echte Migration (M1 = Staging aus **Backup der Produktiv-Site**) ist ein zweiter Schritt: Backup-Dateien in den Container kopieren, `bench --site … restore …` (README §6), danach `install-app` je App. Dieser Ordner testet zuerst die **leere** Installation.

## Typische Fehler beim ersten Installieren

| Symptom (in `ergebnisse/install/<app>.log`) | Ursache | Abhilfe / wer |
|---|---|---|
| `LinkValidationError: Could not find Workflow State: PH …` beim Import von `workflow.json` | Fixture-Reihenfolge: Frappe importiert die Fixture-Dateien einer App nach Dateinamen, `workflow.json` kann vor `workflow_state.json` laufen; oder der State gehört einer **späteren** App (Integrationsbericht 04.11.: `PH Abgesagt` ph_personal↔ph_marketing, `PH Angebot` ph_crm↔ph_personal, `PH Beendet` ph_marketing↔ph_service) | `./setup.sh --weiter` zeigt, ob der zweite Durchgang hilft. Dauerhaft: State nach ph_core verschieben (ANFRAGEN-AN-CORE.md) oder in der eigenen `workflow_state.json` mitliefern – App-Agent |
| `DocType PH … not found` beim Import von `custom_field.json` | Custom Field auf eine DocType, deren App noch nicht installiert ist (fehlt in `required_apps`) | `required_apps` der App ergänzen oder Feld in die spätere App verschieben (CONVENTIONS §10) – App-Agent |
| `Workflow State … already exists` / `DuplicateEntryError` auf Workflow Action Master | zwei Apps liefern denselben globalen Namen mit anderem Inhalt | Namen nur in **einer** App (ph_core) führen, andere verweisen – ph_core-Agent |
| `Role … not found` | Rolle nicht in `ph_core/fixtures/role.json` | Rolle in ph_core ergänzen – ph_core-Agent |
| `ImportError` / `ModuleNotFoundError` im Log | Python-Abhängigkeit fehlt in `pyproject.toml` oder Tippfehler im Hook-Pfad | App-Agent; Image neu bauen |
| `Testing is disabled for the site` | `allow_tests` fehlt | `setup.sh` erneut (setzt es) |
| `Access denied for user 'root'` | `.env` geändert, Volume mit altem Passwort | `./reset.sh -y` |
| `run-tests` hängt bei `Making Test Records` | `test_dependencies` zeigen im Kreis oder auf ERPNext-DocTypes (Company, Customer …) | App-Agent (kein ERPNext!) |
| Assets 404 im Desk nach neuem Image | altes anonymes Assets-Volume | `setup.sh` startet mit `--renew-anon-volumes`; sonst `docker compose up -d --renew-anon-volumes` |
| Build bricht bei `bench build` ab | defekte Datei in `public/` einer App | Log des Builds an den App-Agenten |

## Befunde an die App-Agenten zurückmelden

Je Befund eine Zeile in `Backend-Import/INTEGRATION-BEFUNDE-CORE.md` (betrifft ph_core oder mehrere Apps) bzw. im Abschnitt „Befunde“ der App-README, Format:

```
- [staging <YYYY-MM-DD>] <app> · <install|migrate|fixtures|test> · <Datei/Test> · <erste Fehlerzeile> · Log: deploy/staging/ergebnisse/<…>.log
```

Beilegen: `ergebnisse/tests-<zeit>/zusammenfassung.md`, die betroffenen `<app>.log` / `install/<app>.log`, `zustand.json` (Error Log). **Nichts aus `tokens.env` oder `.env` weitergeben.** Grün gilt erst, wenn `./reset.sh -y && ./setup.sh --ohne-build && ./test.sh` ohne `--weiter` durchläuft.

## Nicht geprüft (kein Docker auf dem Entwicklungsrechner)

Diese Dateien wurden nur statisch geprüft (YAML-Parser, `bash -n`, `python -m py_compile`). Insbesondere die genauen Optionsnamen von `bench new-site` (`--mariadb-user-host-login-scope`, `--db-root-password`) und `run-tests --junit-xml-output` stammen aus Frappe v15 / frappe_docker und sind beim ersten Lauf zu bestätigen.
