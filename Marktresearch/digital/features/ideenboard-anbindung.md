# Ideenboard – Anbindung an Termin, Beratung und Wunschliste (Übergabe-Notiz)

**Stand:** 29.10.2026 · **Von:** Team Website (Pinterest/Ideenboard) · **An:** Termin-Team (`src/lib/booking`, `src/app/[locale]/termin`), Forms-Team (`/beratung`), Service-Team (Wunschliste)
**Grundlage:** Inhaber-Entscheidung Nr. 14 („Beim Online-Termin hängt er das Board an, Harald sieht es vor dem Gespräch“).

Das Ideenboard-Team hat **keine Datei** von Termin, Beratung oder Wunschliste geändert. Die Anbindung läuft über einen Query-Parameter und eine Lesefunktion.

## 1. Was beim Termin ankommt

„Termin mit Ideenboard buchen“ auf `/[locale]/ideenboard` erstellt (oder aktualisiert) den geheimen Teilen-Link und navigiert dann:

- `BOOKING_PROVIDER=frappe` → `/<locale>/termin?ideenboard=<shareId>`
- sonst → Beratungsanfrage `/<locale>/beratung?ideenboard=<shareId>` (übersetzte Pfade aus `ROUTES.beratung`)

`shareId` = 32 Zeichen base64url (`/^[A-Za-z0-9_-]{32}$/`, `TOKEN_RE` in `src/lib/ideenboard/config.js`). Der Parameter-Name steht als `TERMIN_PARAM` in derselben Datei.

**Stand Nachbessern 29.10.2026 (QA Technik P0):** Der Knopf „Termin mit Ideenboard buchen“ ist **ausgeblendet**, solange `IDEENBOARD_TERMIN` nicht `on` ist (`ideenboardTerminConnected()` in `src/lib/ideenboard/mode.js`). Bis dahin zeigt das Board den ehrlichen Weg: „Teilen-Link erstellen und in die Terminanfrage ins Nachrichtenfeld einfügen“ + Link zur Terminanfrage. **Sobald /termin bzw. /beratung den Parameter liest (Schritte unten), im Deploy `IDEENBOARD_TERMIN=on` setzen** – dann erscheint der Primärknopf.

## 2. Was das Termin-Team tun muss (klein)

1. Auf `/termin` (bzw. im Buchungsformular) `searchParams.ideenboard` lesen, gegen `TOKEN_RE` prüfen.
2. Server-seitig prüfen, ob das Board existiert:
   ```js
   import { getSharedBoard } from "@/lib/ideenboard/service";
   const board = await getSharedBoard(shareId); // null = unbekannt/widerrufen/abgelaufen
   ```
   oder per HTTP: `GET /api/ideenboard/shared/<shareId>` → `{ ok, board: { updatedAt, cards[] } }` (404 sonst).
3. Im Formular sichtbar zeigen: „Ihr Ideenboard (n Karten) wird angehängt“ + Haken zum Abwählen.
4. In der Buchung **nur den Link** speichern, z. B. Feld `ideenboard_url = https://platzhirsch.studio/<locale>/ideenboard/<shareId>` (nicht die Karten kopieren). Harald öffnet den Link vor dem Gespräch; widerruft die Kundin, ist er tot (Datenminimierung).
5. In der Studio-Mail/Frappe-Notiz den Link aufnehmen. Optional: `board.cards.length` und die Typen (Möbel, Ezarri-Mischung, Stil-Finder …) als Zusammenfassung.

Für `/beratung` (Forms-Team) gilt dasselbe: `?ideenboard=` lesen und als Link in die Anfrage übernehmen (wie heute `?stil=`).

## 3. Datenschutz-Punkte für die Kanzlei-Ergänzung

- Board liegt im **localStorage** (`ph-ideenboard`), geschrieben erst nach Klick „Zum Ideenboard“. Kein Tracking.
- Auf den Server (Dev: `.data/ideenboard/`, Produktion: nur mit `IDEENBOARD_LOCAL_DIR`) kommt es erst mit „Teilen-Link erstellen“ oder „Termin mit Ideenboard buchen“. Gespeichert: Karten (Titel, Links, Bildpfade, Notizen), Zeitstempel, **Hashes** der Schlüssel. Keine Namen/E-Mail/Telefon.
- Teilen-Seite `noindex, nofollow`, `referrer: no-referrer`; „Link widerrufen“ löscht die Server-Fassung sofort; Löschung automatisch 12 Monate nach letzter Änderung (Frist von Kanzlei/Inhaber zu bestätigen, `RETENTION_MONTHS`).
- Notizen sind Freitext: Hinweis in der Datenschutzerklärung, dass Kundinnen dort keine sensiblen Daten eintragen sollen.
- **Aktive Löschung:** abgelaufene Boards löscht der Server beim ersten Zugriff nach dem Start und danach alle 6 Std.; zusätzlich täglicher Cron `IDEENBOARD_LOCAL_DIR=… node tools/ideenboard/sweep.mjs` (DSGVO Speicherbegrenzung, QA Technik P1-3).
- Teilen-Hinweis (korrigiert, QA Recht P2-1): „Wir fügen keine Kontaktdaten hinzu. Bitte schreiben Sie keine persönlichen Angaben in die Notizen.“
- „Auf Pinterest merken“: reiner Link, vor dem Klick keine Verbindung zu Pinterest → keine Einwilligung nötig; nach dem Klick gilt Pinterests Datenschutz (Hinweis im `title` des Links und im Seitentext).

## 4. Wunschliste (Service-Team)

Gleiches Teilen-Schema (192-Bit-Token, nur Hash gespeichert, Verwaltungsschlüssel `<id>.<secret>`), aber **eigene Dateien** (`src/lib/ideenboard/ids.js`, `localStore.js`), damit niemand die Wunschliste-Dateien anfassen muss. Gemeinsame Bibliothek wäre später möglich (`src/lib/share/`), Vorschlag – nicht nötig für den Start.
Die Merkliste wird nur **gelesen** (`useCart().cartItems`, „Möbel aus der Merkliste holen“). Ein Link „Zum Ideenboard“ auf der Merkliste-Seite (`CartPage`) wäre sinnvoll – Entscheidung beim Merkliste-/Service-Team.

## 5. Produktion

- `IDEENBOARD_LOCAL_DIR=/srv/platzhirsch/ideenboard` (gesichertes Volume), sonst ist Teilen in Produktion aus (Board im Browser geht trotzdem; Knopf „Termin mit Ideenboard buchen“ ist dann deaktiviert mit Hinweis).
- `IDEENBOARD_MODE=off` schaltet Teilen ab.
- Später Frappe-Adapter mit gleicher Schnittstelle wie `localStore.js` (create/get/getByShare/update/remove) – **nicht** ins produktive Backoffice schreiben, bevor der Frappe-Entwickler einen Doctype dafür anlegt.

## 6. Entwurf für die Kanzlei (Datenschutzerklärung, nicht veröffentlicht)

> **Ideenboard.** Sie können auf unserer Website Möbel, Raumbilder, Ezarri-Mischungen, Ihr Stil-Finder-Ergebnis und Notizen auf einem Ideenboard sammeln. Das Board wird nur in Ihrem Browser gespeichert (localStorage), und zwar erst, wenn Sie „Zum Ideenboard“ wählen. Erstellen Sie einen Teilen-Link, speichern wir eine Kopie des Boards (Karten, Links, Bildpfade, Ihre Notizen, Zeitstempel) auf unserem Server. Den Link kennt nur, wem Sie ihn geben; wir speichern ihn nur verschlüsselt (Hash). Sie können den Link jederzeit widerrufen, dann löschen wir die Kopie sofort; spätestens löschen wir sie 12 Monate nach der letzten Änderung. Fügen Sie den Link Ihrer Terminanfrage bei, sieht Harald Menghin das Board vor dem Gespräch. Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (auf Ihre Anfrage). Bitte tragen Sie in Notizen keine persönlichen oder sensiblen Angaben ein. *[anwaltlich prüfen: Frist, Rechtsgrundlage]*
>
> **„Auf Pinterest merken“.** Der Knopf ist ein einfacher Link. Vor Ihrem Klick wird nichts von Pinterest geladen und keine Daten an Pinterest übertragen. Erst mit dem Klick öffnet sich Pinterest (Pinterest Europe Ltd., Dublin) in einem neuen Tab; dort gilt die Datenschutzerklärung von Pinterest. *[anwaltlich prüfen]*

Datei des Kanzlei-Entwurfs: `src/components/LegalDrafts/docs/datenschutz.js` (Legal-Team) – Übernahme dort nach Freigabe.
