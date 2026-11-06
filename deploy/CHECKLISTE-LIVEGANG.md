# Checkliste Livegang – Website, Backoffice, Frappe

Für Inhaber (I) und IT/Betreiber (IT). Reihenfolge einhalten; jeder Schritt hat ein Prüfkriterium (✔). Technische Details: `deploy/produktion/README.md`, Staging: `deploy/staging/README.md`, Migration: `Backend-Import/README.md` §7 (M1–M10).

Stand 04.11.2026 · Grundsatz: **zuerst Staging grün, dann Produktion**; jede Umstellung mit frischem Backup und Rückweg.

---

## 0. Voraussetzungen (vor jeder Bestellung)

- [ ] (IT) Staging läuft: `deploy/staging/setup.sh` und `test.sh` ohne `--weiter` grün; Befunde an die App-Agenten gemeldet und erledigt. ✔ `ergebnisse/tests-*/zusammenfassung.md` ohne rote Zeile.
- [ ] (I) Abnahme aller Workspaces/Backoffice-Bereiche auf Staging (Backend-Import/README.md §7 „Abnahme durch den Inhaber je Workspace“).
- [ ] (I) Offene Freigaben geklärt: AGB/Rechtstexte, Kundenkarte Stufe 2 **nicht** aktiv (Anwalt/Steuerberater), Kassa erst nach Steuerberater-OK.

## 1. Server bestellen

- [ ] (I/IT) Anbieter mit Rechenzentrum in der EU und AV-Vertrag (z. B. Hetzner DE/FI, Exoscale AT). AV-Vertrag abschließen und ablegen.
- [ ] (IT) Drei Server (Größen: `produktion/README.md` „Host-Größen“), Ubuntu 24.04 LTS, **privates Netz** zwischen allen dreien, Firewall des Anbieters: nur 22/80/443 eingehend.
- [ ] (IT) Snapshots/Backups des Anbieters für Host C aktivieren (zusätzlich zu `backup.sh`).
- [ ] (IT) SSH nur mit Schlüssel (`PasswordAuthentication no`), eigener Benutzer, `unattended-upgrades` an, Zeitzone `timedatectl set-timezone Europe/Vienna`.
- [ ] (IT) Offsite-Speicher für Backups bestellen (anderer Anbieter oder anderes Rechenzentrum, z. B. Storage Box/S3 mit Versionierung). ✔ `rclone lsd <remote>:` funktioniert.

## 2. DNS

- [ ] (IT) TTL der betroffenen Einträge 24 h vorher auf 300 s senken.
- [ ] (IT) `backend.platzhirsch.studio` A/AAAA → Host C (neu, stört nichts).
- [ ] (IT) **Domain-Tausch planen:** `backoffice.platzhirsch.studio` ist heute das produktive Frappe. Erst wenn die Website mit `SERVER=https://backend.platzhirsch.studio` läuft und `src/lib/apiBaseUrl.js`, `next.config.js` (remotePatterns, CSP), `ci.yml` angepasst sind (produktion/README.md „Nötige Änderungen“ 2), `backoffice.` → Host B umstellen.
- [ ] (IT) `platzhirsch.studio` und `www` → Host A erst im Wartungsfenster (Schritt 9).
- [ ] (IT) CAA-Eintrag `0 issue "letsencrypt.org"`. ✔ `dig +short CAA platzhirsch.studio`.

## 3. Zertifikate

- [ ] (IT) Caddy: automatisch beim ersten Aufruf (Port 80/443 offen, DNS zeigt auf den Host). Nginx: `certbot --nginx -d <name>`; Erneuerung `systemctl list-timers | grep certbot`.
- [ ] (IT) ✔ `curl -sI https://backend.platzhirsch.studio` aus dem Internet → 403 (gesperrt), vom Website-Host → 200/302. ✔ SSL Labs mindestens A.
- [ ] (IT) HSTS-Preload erst beantragen, wenn alle Subdomains dauerhaft HTTPS sind.

## 4. Secrets erzeugen

Nur auf dem jeweiligen Server erzeugen und eintragen, nie per Mail/Chat, nie ins Repo. Ablage zusätzlich im Passwortmanager des Inhabers.

```bash
openssl rand -hex 32   # je Secret einmal ausführen
```

| Secret | wohin | Bemerkung |
|---|---|---|
| `DB_ROOT_PASSWORD`, `ADMIN_PASSWORD` | Host C `frappe/.env` | Administrator danach mit 2FA |
| `BACKOFFICE_SESSION_SECRET` | Host B `.env.production` | ≥ 32 Zeichen, sonst Anmeldung gesperrt |
| `PORTAL_SESSION_SECRET`, `UPLOAD_TOKEN_SECRET`, `BOOKING_LINK_SECRET`, `CONCIERGE_SECRET`, `AGENT_SECRET`, `KUECHENPLANER_SECRET`, `SOFAPLANER_SECRET`, `LABS_SECRET`, `EINBLICKE_CRON_SECRET`, `PAYMENTS_ADMIN_SECRET`, `RAUM_TEAM_TOKEN` | Host A `.env.production` | je eigenes Secret |
| `REVALIDATE_SECRET` = `ph_website_revalidate_secret` | Host A **und** Host C (`bench --site … set-config`) | gleicher Wert auf beiden Seiten |
| `PAYMENTS_LINK_SECRET` = `ph_payments_link_secret` | Host A **und** Host C | gleicher Wert |
| API-Token `website@` | Host C: `./einrichten.sh --token website@platzhirsch.studio` → Host A `API_KEY`/`API_SECRET` (+ `FRAPPE_*`) | |
| API-Token `backoffice@` | `./einrichten.sh --token backoffice@platzhirsch.studio` → Host B `BACKOFFICE_FRAPPE_TOKEN` (`key:secret`) | |
| `ph_kassa_aes_key_<kassen_id>` | Host C site_config | 32 Byte Base64: `openssl rand -base64 32`; **Kopie offline sicher verwahren** (ohne ihn ist das DEP nicht prüfbar) |

✔ `ls -l` zeigt `-rw-------` für alle Env-Dateien; `grep -r "sk_live" /srv/platzhirsch/repo` findet nichts.

## 5. Stripe

- [ ] (I) Stripe-Konto live verifiziert, Auszahlungskonto hinterlegt.
- [ ] (IT) Webhook-Endpunkt anlegen (Dashboard → Entwickler → Webhooks):
  - heute (Website verarbeitet): `https://platzhirsch.studio/api/stripe/webhook` → Secret in `STRIPE_WEBHOOK_SECRET` (Host A)
  - nach M6/M9 (Frappe verarbeitet): `https://backend.platzhirsch.studio/api/method/ph_shop.api.stripe.webhook` → Secret in `ph_stripe_webhook_secret` (Host C). Dieser Pfad ist im Proxy als einzige öffentliche Ausnahme freigegeben.
  - Ereignisse laut `Backend-Import/ph_shop/README.md`; nie beide Endpunkte gleichzeitig für dieselben Ereignisse buchen lassen.
- [ ] (IT) `ph_stripe_secret_key`, `ph_stripe_livemode 1` erst im Umschaltfenster (Schritt 9). ✔ Testzahlung mit echter Karte über 1 €, danach Rückerstattung aus dem Backoffice.
- [ ] (IT) Stripe Terminal (Kassa): Standort anlegen → `ph_stripe_terminal_location`, Lesegerät registrieren.

## 6. Resend (Mail)

- [ ] (IT) Domain `platzhirsch.studio` (oder Subdomain `mail.`) in Resend hinzufügen; SPF-, DKIM- und Return-Path-Einträge im DNS setzen; DMARC `v=DMARC1; p=quarantine; rua=mailto:…`.
- [ ] (IT) API-Key mit „Sending access“ nur für diese Domain → `ph_resend_api_key` (Host C) und die `*_MAIL_API_KEY` der Website (Host A); Absender `ph_mail_from` / `*_MAIL_FROM`.
- [ ] ✔ Resend zeigt „Verified“; Testmail aus Staging (`testmodus` → nur ans Team-Postfach) und aus Produktion an eine interne Adresse; mail-tester.com ≥ 9/10.

## 7. Kassa: A-Trust und FinanzOnline (RKSV)

Erst nach Freigabe durch Steuerberater. Reihenfolge laut `Backend-Import/ph_kassa/README.md`.

- [ ] (I) A-Trust **a.sign RK Online** bestellen (Signaturerstellungseinheit, Zertifikat auf die Firma, UID ATU70035339) → Zugang `ph_atrust_user`, `ph_atrust_password`, `ph_atrust_env produktiv` (Host C).
- [ ] (I/Steuerberater) In **FinanzOnline** (Registrierkassen → Registrierung): zuerst die Signaturerstellungseinheit (Zertifikatsseriennummer), dann die Kasse (Kassen-ID wie in PH Kasse, AES-Schlüssel-Prüfwert) melden.
- [ ] (IT) `ph_kassa_aes_key_<kassen_id>` gesetzt (Schritt 4), Trainingsmodus aus, `terminal_testmodus` aus.
- [ ] (I) **Startbeleg** erstellen und mit der BMF-App „Belegcheck“ prüfen. ✔ Prüfung erfolgreich; Startbeleg + Prüfergebnis 7 Jahre aufbewahren.
- [ ] (IT) DEP-Export (DEP7) einmal ausführen und extern sichern; danach mindestens quartalsweise (gesetzliche Pflicht) – im Backup-Plan eintragen.
- [ ] (I) Ausfall-Ablauf ausdrucken (Signatur ausgefallen > 48 h → FinanzOnline melden; Papier-Belege; Nacherfassung).

## 8. Datenmigration aus dem bestehenden Backoffice

Plan: `Backend-Import/README.md` §7, Schritte **M1–M10**. Zusammengefasst:

- [ ] (IT) **M1** Backup der produktiven Site (`bench --site <prod> backup --with-files`) → auf Host C einspielen statt leerer Site (`bench --site backend.platzhirsch.studio restore …` mit `--with-public-files`/`--with-private-files`), dann `einrichten.sh` (installiert die 12 Apps, Backup vor jeder App). Vorher genau diesen Ablauf auf Staging mit demselben Backup proben.
- [ ] (App-Teams) **M2–M8** Importe (Marken/Kategorien → Produkte (1.765) + Bilder → Anfragen/Newsletter (ohne DOI gekennzeichnet) → Karriere → Shop/Zahlungen + Stripe-Backfill → Mail-Vorlagen/Kundenreisen/Events → Service/Tagebuch/Wunschliste). ✔ Zählvergleich alt/neu je DocType, Stichproben durch den Inhaber.
- [ ] (I) Abnahme je Workspace/Backoffice-Bereich.
- [ ] (Website) **M9** Umstellung per Konfiguration (`SERVER`, `API_KEY`, `API_SECRET`, `PORTAL_ADAPTER=frappe`, `BOOKING_PROVIDER=frappe`, `PAYMENTS_BACKOFFICE=frappe`, …) – neu bauen (NEXT_PUBLIC_*/SERVER wirken beim Build).
- [ ] (IT) **M10** alte Schreibmethoden in `platzhirsch_studio` abschalten/weiterleiten; altes System 3 Monate nur lesend behalten.

## 9. Umschalten (Wartungsfenster, z. B. Sonntag früh)

1. [ ] Ankündigung an das Team; Kassa geschlossen; `bench --site <alt> set-maintenance-mode on`.
2. [ ] Letztes Backup alt + neu (Host C: `./backup.sh`), Offsite-Kopie ✔.
3. [ ] Delta-Import seit M1 (Anfragen, Bestellungen der letzten Tage).
4. [ ] PH Einstellungen: `testmodus` **aus**, `api_aktiv` **an**; `ph_stripe_livemode 1`; Mails nicht stummgeschaltet (`mute_emails` nicht gesetzt).
5. [ ] Website-Image mit Produktions-`.env.production` bauen und starten; DNS umstellen (Schritt 2).
6. [ ] Rauchtest (✔ jeweils): Startseite, Produktliste und -seite mit Bildern (`/cmx`), Kontaktformular → PH Anfrage, Terminbuchung, Newsletter-DOI-Mail, Shop-Bestellung mit Testkarte im Livemodus 1 € + Erstattung, Kundenportal-Login, Backoffice-Login mit 2FA, Kassa-Testbon im Trainingsmodus, Revalidate (Produkt im Backoffice ändern → Website aktualisiert in ≤ 1 min).
7. [ ] Monitoring scharf (Schritt 11), dann Wartungsmodus aus.

## 10. Rollback

Entscheidungsregel: Rauchtest in Schritt 9.6 rot und nicht in 30 min behebbar → zurück.

- **Website:** vorheriges Image `WEBSITE_TAG=<alter SHA> docker compose up -d` (Host A) bzw. `scripts/deploy.sh rollback`. Konfiguration auf den alten Stand (`SERVER` zurück) erfordert einen neuen Build mit der alten `.env.production` – deshalb das Image des letzten guten Stands **vor** dem Umschalten bauen und taggen.
- **Backoffice:** `BACKOFFICE_TAG=<alter SHA> docker compose up -d`; im Notfall DNS `backoffice.` zurück auf das alte Frappe.
- **Frappe-Daten:** Wartungsmodus an → `bench --site <site> restore <db.sql.gz> --with-public-files … --with-private-files …` (Backup aus Schritt 9.2) → `migrate` → Wartungsmodus aus. Einzelne App nie in Produktion deinstallieren (löscht Daten).
- **DNS:** TTL ist 300 s (Schritt 2) – Einträge zurückstellen.
- **Stripe:** Webhook-Endpunkt zurück auf den vorherigen; während des Rückwegs eingegangene Ereignisse im Stripe-Dashboard erneut senden.
- **Kassa:** RKSV-Belegkette nie zurückspielen. Ist der Kassa-Betrieb gestartet, wird nur nach vorne korrigiert (Storno-/Nullbeleg); Rollback der Datenbank vorher mit dem Steuerberater klären.
- ✔ Rollback einmal auf Staging geprobt (Datum eintragen: ________).

## 11. Monitoring

- [ ] **Uptime** (extern, z. B. UptimeRobot/Better Stack, EU-Standort): `https://platzhirsch.studio/de` (200, Inhalt „Platzhirsch“), `https://backoffice.platzhirsch.studio/api/ping`, Frappe über `GET /api/method/ph_core.api.health.ping` mit Token **vom Website-Host aus** (Cron + Heartbeat, weil das Backend öffentlich gesperrt ist), Zertifikatsablauf < 14 Tage. Alarm per Mail + SMS an IT und Inhaber.
- [ ] **Backup-Heartbeat**: `BACKUP_HEARTBEAT_URL` (Alarm, wenn das nächtliche Backup ausbleibt).
- [ ] **Fehlerlogs**: `docker compose logs --since 1h website|backoffice` bzw. `journalctl -u platzhirsch-*`; Caddy `/var/log/caddy/*.log`; Frappe `logs/` (`frappe.web.log`, `worker.error.log`, `scheduler.log`). Täglicher Blick auf 5xx: `jq 'select(.status>=500)' /var/log/caddy/website.log | wc -l`.
- [ ] **Frappe Error Log** (Desk → Error Log; `PH Einstellungen.fehler_email` setzen) und **PH API Protokoll** (Fehlercodes 4xx/5xx der Website-Aufrufe); Scheduler-Status `bench --site <site> doctor`.
- [ ] Ressourcen: Plattenfüllstand < 80 % (Backups!), RAM/Swap, MariaDB-Größe – Anbieter-Monitoring oder `netdata`.
- [ ] Wöchentlich (I): Kennzahlen im Backoffice plausibel; monatlich (IT): Updates (`apt`, Images neu bauen, Frappe-Patch-Release auf Staging zuerst).

## 12. Backups und Wiederherstellungstest

- [ ] (IT) `backup.cron` aktiv, `BACKUP_RCLONE_REMOTE` gesetzt (verschlüsseltes rclone-„crypt“-Remote), 14 Tage lokal, Offsite mit Versionierung ≥ 30 Tage. ✔ Am Folgetag Dateien lokal und offsite vorhanden, `SHA256SUMS` stimmt.
- [ ] (IT) Website-Laufzeitdaten `/srv/platzhirsch/website/data` (Uploads, Portal, Shop-Store) und `public-ezarri` ebenfalls täglich offsite (`rclone sync`); Backoffice hat keine eigenen Daten.
- [ ] (IT) `.env`-Dateien und `site_config.json` verschlüsselt im Passwortmanager (ohne sie ist ein Backup nicht startbar; `site_config_backup.json` liegt dem Frappe-Backup bei).
- [ ] (IT) **Wiederherstellungstest** vor dem Livegang und danach **vierteljährlich**: neuestes Offsite-Backup auf Staging holen → `bench --site staging.platzhirsch.local restore … --with-public-files … --with-private-files …` → `migrate` → Stichprobe (letzte Bestellung, letzter Kassenbeleg, ein Produktbild, ein PDF-Druck). Dauer notieren (Ziel RTO ≤ 4 h, RPO ≤ 24 h). ✔ Protokoll: Datum ______, Dauer ______, Ergebnis ______.
- [ ] (I) DEP-Export der Kassa quartalsweise extern gesichert (Schritt 7).
