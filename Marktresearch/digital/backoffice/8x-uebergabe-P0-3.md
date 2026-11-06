# 8x – Übergabe Team P0-3 (Fundament v2: verzögerter Commit, Toast v2, Ausstehend – G-03)

**Stand:** 2026-11-04 · Auftrag: MASTER § 4 G-03 komplett (Server + Client, `/api/undo-commit`, Toast v2 im Lounge-Material, `Ausstehend`). Maßstab Gestaltung: `art-direction/lounge.md`. In meinem Schreibbereich lag noch nichts von einem früheren Lauf außer dem alten `Toast.js` (v1); er ist ersetzt, die API `useToast().zeige(text, {art, dauer})` / `entferne` / `ToastBeimLaden` bleibt gleich, deshalb musste kein Aufrufer angepasst werden.

## Gebaut

| Datei | Inhalt |
|---|---|
| `src/lib/backoffice/commit/kern.js` | Server-Kern (rein): `erzeugeCommitDienst({store, aktion, …})` → `plane` (Token `c_…`, Frist, Doppelplanungs-Schutz über `schluessel`, Args JSON ≤ 16 kB), `fuehreAus` (genau einmal über Sperre `c:l:<token>` = `wertSetzenWennFrei`, Besitzprüfung, gespeichertes Ergebnis für jeden weiteren Aufruf), `verwerfe`, `nachlauf` (30 s nach der Frist, nie still verworfen), `status`, `meldungen`/`quittiereMeldung` (Glocke), `protokoll` (ohne Werte); `pruefeAnfrage()` der Route |
| `src/lib/backoffice/commit/konstanten.js` | browsertaugliche Werte (8 s / Kiosk 6 s, Nachlauf 30 s, Pause max. 20 s), `objektSchluessel`, `istToken` |
| `src/lib/backoffice/commit/server.js` | Anbindung an `sessionStore()` (P0-8, Redis-fertig, Namensraum `c:`), Nachlauf-Wecker im Prozess + Anstoß bei jeder Anfrage, Sitzung für den Nachlauf (Frappe-sid aus dem Store, nie in der Absicht), Kommentar „Info“ am Datensatz bei Nachlauf/Beacon; `planeCommit`, `fuehreCommitsAus`, `verwerfeCommits`, `commitStatus`, `commitMeldungen`, `commitMeldungQuittieren`, `commitProtokoll` |
| `src/lib/backoffice/commit/actions.js` | Server Actions `commitAction`, `verwerfeCommit`, `commitStatusAction`, `planeDemoCommit` (nur Mock + Admin) |
| `src/lib/backoffice/commit/aktionen/` | Register: `index.js` + `fundament.js` (`fundament.workflow`, `fundament.methode`, `fundament.demo`) + **leere Teildatei je Bereich** (14) – Bereiche tragen nur dort ein; `pruefeAktionen()` |
| `src/lib/backoffice/commit/warteschlange.js` | Client-Queue (rein): Vorgang = Undo-Toast, Queue je Datensatz (Folgeaktion speichert die vorige sofort), Zusammenfassen (`gruppe`/`sammel`), Pause gedeckelt, `flush(objekt?)`, `beaconAlle()`, Verwerfen mit 3 Wiederholungen, `behalteZeilen()` |
| `src/lib/backoffice/commit/{kontext,useVerzoegerterCommit}.js` | `useVerzoegerterCommit()` → `{starte, flush, ausstehend}`, `useAusstehend`, `useCommitEreignis` |
| `src/lib/backoffice/commit/texte.js` | alle Texte (Toast, Ausstehend, Fehler, Demo) |
| `src/app/api/undo-commit/route.js` | `POST`, Origin + Sitzung (`requireApiSession`), Body `text/plain` (sendBeacon): ausführen · `verwerfen` · `status` · `demo-plane` (Mock + Admin) |
| `src/components/Backoffice/Toast.js` | Toast v2: Lounge-Material (`bo-material-stark`, Radius 20, 360 px, kein Rahmen), Symbol im Materialkreis, Arten ok/info 4 s · warnung 6 s · fehler bleibt · undo 8 s/Kiosk 6 s, Balken 2 px Cognac (Timer im JS ist die Wahrheit), Pause bei Zeiger/Fokus/Berührung, Stapel 3/Kiosk 2 + „n weitere Meldungen“, Zusammenfassen („3-mal“), reduzierte Bewegung „Rückgängig (6 s)“, Tasten `Z`/`Strg+Z`/`F8` über das Kürzel-Register, `Esc` nie; Backoffice unten rechts, Telefon über der Tab-Kapsel, Kiosk unten Mitte bzw. `useToastAnker()`/`toastAnker`; `pagehide`/`visibilitychange` → Beacon, Navigation → `flush()`; Schließen eines Undo-Toasts speichert; im Kundenmodus (`data-bo-kundenmodus="an"`, P0-7) ausgeblendet; `ToastKarte` als reine Darstellung |
| `src/components/Backoffice/Ausstehend.js` | Pille „wird in 6 s gespeichert“ (gestrichelter Ring, Restzeit-Ring 12 px, Pillenhöhe), `nurSymbol`; `useCommitMarke` (1200 ms Salbei nach dem Speichern), `useBehalteZeilen`, `useOffeneObjekte` |
| `src/components/Backoffice/Demo/commit.js` + Zeile in `lib/backoffice/demo-register.js` | Demo: Anfragen-Liste mit Annehmen/Fehlerfall/Alle annehmen (Zusammenfassen), Meldungsarten, ruhende Ansicht aller Zustände, Zustand am Server |
| `src/components/Backoffice/README.md` | Abschnitt „Rückmeldung und Rückgängig (Team P0-3, G-03)“ |
| `tests/unit/backoffice-commit.test.mjs`, `tests/e2e/backoffice-commit.spec.js` | **außerhalb des Schreibbereichs, neue Dateien** (MASTER G-03 verlangt Unit + E2E) |

## Tests

- Unit: `node --test "tests/unit/**/*.test.mjs"` → **179/179 grün**, davon 20 neu (Idempotenz auch gleichzeitig, Verwerfen ↔ Ausführen, fremde Tokens, Schlüssel, Nachlauf mit/ohne Sitzung, Fehlercodes ohne interne Texte, Route-Eingaben, Register, Queue: Ablauf, Undo ohne Server-Aufruf, Pause + Deckel < Nachlauf, Gruppe, Queue je Datensatz, Beacon, Netzfehler, Verwerfen-Wiederholung, `behalteZeilen`).
- ESLint: **0** auf allen eigenen Dateien.
- E2E `backoffice-commit.spec.js` desktop + ipad: **10/10 grün** (Route 401/403/400, Undo innerhalb 8 s → verworfen und nie ausgeführt, Ablauf → ausgeführt, Taste Z, „Jetzt ausführen“, **Tab schließen → ausgeführt per Beacon**, Toast 360 px / Material / Radius 20 / ohne Rahmen / keine Versalien, Zusammenfassen, Fehler bleibt und übersteht Esc). Bestehende `backoffice.spec.js` + `backoffice-motion.spec.js` desktop: 16 grün, 2 übersprungen (Demos ohne Einbindung) – Kanban-Toast ≤ 8,5 s weg bleibt erfüllt.
- **Achtung Testumgebung:** :3100 hängt seit ca. 16:13 an einer veralteten Fehlermeldung aus dem Shell-Umbau (Glocke `./ereignisse`, Datei ist längst korrigiert) und liefert für jede Route 500 – nicht neu gestartet (Auftrag). Alle E2E/Bilder liefen gegen einen **Spiegel** des aktuellen `backoffice` im Scratchpad (`next dev --webpack -p 3103`, Mock, `node_modules`/`Backend-Import` als Verknüpfung). Nach dem Neustart von :3100 bitte einmal `PW_WORKERS=1 npx playwright test -c playwright.config.js tests/e2e/backoffice-commit.spec.js --project=desktop --project=ipad` wiederholen.
- Bilder selbst gesichtet und neben `entwurf-lounge/1-zentrale` und `2-anfragen` gelegt: Toast-Karten haben dieselbe Material-/Schattensprache wie Leiste und Vorschau-Panel, Rückgängig-Pille wie die aktive Reiter-Pille (hell Tinte, dunkel hell), Status/Ausstehend-Pillen in Pillenhöhe, keine Rahmen, keine Versalien. Überlauf 0 in allen 12 Aufnahmen; keine Konsolenfehler.

## Offene Punkte

1. **:3100 neu starten** (blockiert alle Teams, siehe oben).
2. **KioskShell (P0-6):** übergibt noch nichts – Kiosk wird über den Pfad erkannt (`/kassa`, `/packtisch`, `/montage`, `/technik`, nicht `/kassa/verwaltung`). Kassa/Packtisch binden ihre Meldungsstelle mit `useToastAnker("#…")` oder `<ToastProvider kiosk toastAnker=…>`; Kiosk-Bereiche planen mit `ms: COMMIT_MS_KIOSK`.
3. **Glocke (P0-7):** `commitMeldungen(session)` / `commitMeldungQuittieren` aus `commit/server.js` in die Glocke („System“) aufnehmen.
4. **Protokoll (Zentrale):** `commitProtokoll()` in `/protokoll` mischen (nur Admin); der Nachlauf schreibt zusätzlich einen „Info“-Kommentar an den Datensatz.
5. **Demo-Einbindung** `/einstellungen?tab=system&baustein=commit` (Zentrale/L0) – bis dahin zeigt die Spec die Shell über den Entwicklungs-Haken `window.__phBoToast`.
6. **Bereiche (Gate G0):** keine eigene Undo-Route und keine Gegenaktion (K-30); Aktionen in `commit/aktionen/<bereich>.js`, planen mit `planeCommit`, Client `starte`/`flush` (Muster im README).
7. **Redis:** `schluesselListe("c:o:")` muss in `RedisSessionStore` per SCAN arbeiten (P0-8 hat das zugesagt); mehrere Instanzen sind über die Sperre sicher, der Nachlauf läuft in jeder Instanz.
8. **WebKit-Bild:** Playwright-WebKit zeichnet die Unschärfe nicht; deshalb trägt die Toast-Fläche 92 % Kachelfarbe (auf echten Geräten mit Unschärfe darüber).

## Abweichungen vom Konzept

- `/api/undo-commit` kennt zusätzlich `status` und `demo-plane` (nur Mock + Admin) – für Wiederaufnahme, Demo und E2E.
- Schließen (×) eines Undo-Toasts **speichert** statt zu verwerfen (Q-C4 „nie still verworfen“); Rückgängig nur über den Knopf/`Z`.
- Pause bei Zeiger ist auf 20 s gedeckelt, damit der Client immer vor dem Server-Nachlauf entscheidet.
- WebKit (iPad) meldet das Schließen eines Tabs teils so, dass die Queue noch selbst speichert statt per Beacon – Ergebnis gleich (ausgeführt).

## Fähigkeiten-Stand

Keine Fachaktionen, keine neuen Fähigkeiten. `fundament.demo` wirkt nur im Mock; im Frappe-Modus führen `fundament.workflow`/`fundament.methode` mit der Benutzer-Sitzung aus (Frappe prüft Rechte); im Nachlauf ohne gültige Sitzung → fehlgeschlagen + Meldung (Frappe-Modus).

## Neue Fragen

- Inhaber: Nr. 51 (Undo-Dauer 8 s/6 s, Schließen speichert), Nr. 52 (gescheitertes Speichern zusätzlich in der Glocke).
- Steuerberater: keine.

## Screenshot-Ordner

`backoffice/qa-screenshots/p0-3-commit/`: `toast--{desktop,ipad-quer,iphone}--{hell,dunkel}[--reduziert].png` (echte Shell, Stapel ok/Warnung/Undo), `stapel-…` (mit Fehler), `teil-…` (Ausschnitt), `p0-3-commit--{desktop,iphone}--{hell,dunkel}.png` + `teil-zustaende`/`teil-ausstehend` (Demo als SSR-Vorschau mit dem CSS des Dev-Servers).
