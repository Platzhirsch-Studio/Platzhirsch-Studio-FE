# Feature: KI-Concierge (Labs)

Stand: 26.10.2026 · Seite: `/de/labs/concierge` (nur `de`, `noindex, nofollow`) · Masterplan: Welle 3, „KI-Concierge (Beta)“

## Was gebaut ist

Ein digitaler Einrichtungsberater auf Basis der Claude API (Modell `claude-opus-5-5`):

- **Chat mit Streaming** (NDJSON) – Text erscheint Wort für Wort, Statuszeile („Katalog wird durchsucht …“) während Tool-Aufrufen.
- **Katalog-Tools (nur lesen)**: Produktsuche, Kategorien, Produkte einer Kategorie (optional je Marke), Markenliste, Markenüberblick (Kategorien + Kollektionen), Showroom-Infos, „Termin anfragen“ (Übergabe an Menschen → `/de/beratung?quelle=concierge`).
- **Produktkarten im Antwortfluss** (Bild, Marke, Name, Kategorie, Link), horizontal wischbar mit Scroll-Snap.
- **Übergabekarte**: Button „Termin anfragen“, Telefon, optionale KI-Notiz der Wünsche zum Kopieren (gekennzeichnet als KI-Entwurf, wird nicht gespeichert).
- **Vorschlags-Chips** beim Start, „Neu“ zum Zurücksetzen, Stopp-Button während der Antwort.
- **Mobil**: Bottom-Sheet über schwebenden Button „Concierge fragen“, Wischen am Griff nach unten oder Escape schließt, Hintergrund gesperrt, Fokus wird hinein- und zurückgeführt. **Desktop**: Panel fest neben dem Intro.
- **Einwilligung** vor dem ersten Satz (KI-Hinweis, Übermittlung an Anthropic, Link Datenschutz); optional zweite Checkbox „Verlauf speichern“. Ohne diese Checkbox wird **nichts** gespeichert.
- **Modi**: `live` (API-Key vorhanden), `mock` (`CONCIERGE_MOCK=1`: feste Beispielantworten, aber echte Katalogdaten), `unavailable` (kein Key: freundlicher Hinweis + Link zur Beratung; in Entwicklung zusätzlich Button „Mock-Modus testen“).

## Dateien

| Pfad | Zweck |
|---|---|
| `src/app/[locale]/labs/concierge/page.js` | Server-Seite (Intro, Art.-50-Hinweis, Modus ermitteln) |
| `src/components/Labs/Concierge/Concierge.js` | Client-Chat (Panel/Bottom-Sheet, Consent, Streaming-Parser) |
| `src/components/Labs/Concierge/ProductCards.js` | Produktkarten |
| `src/components/Labs/Concierge/RichText.js` | Sicheres Mini-Markdown (fett, Listen, nur interne Links), kein `dangerouslySetInnerHTML` |
| `src/components/Labs/Concierge/concierge.module.css` | Styles (mobil zuerst, reduced motion) |
| `src/app/api/labs/concierge/route.js` | `GET` Modus · `POST` Chat (Stream) |
| `src/app/api/labs/concierge/consent/route.js` | `POST` stellt signiertes Einwilligungs-Token aus |
| `src/lib/concierge/config.js` | Modell, Effort, Limits, Rate-Limit, Consent-Version, Modus |
| `src/lib/concierge/systemPrompt.js` | Eingefrorener Systemprompt |
| `src/lib/concierge/tools.js` | Tool-Definitionen + zod-Validierung + Ausführung |
| `src/lib/concierge/catalog.js` | **Adapter-Schicht** zu Frappe (über `src/lib/api`) |
| `src/lib/concierge/showroom.js` | Showroom-Fakten aus `src/lib/site.js` (+ Öffnungszeiten) |
| `src/lib/concierge/run.js` | Agent-Schleife (Streaming, Tool Use, Fallback, Stop-Gründe) |
| `src/lib/concierge/mock.js` | Mock-Modus |
| `src/lib/concierge/rateLimit.js` | Verdrahtung: Client-IP, `checkChat`/`checkConsent` (async), `setLimitStore()` |
| `src/lib/concierge/limiter.js` | Gleitendes Fenster + Tagesbudget über der Speicher-Schnittstelle, Ersatz im Arbeitsspeicher bei Speicherausfall (rein, testbar) |
| `src/lib/concierge/limitStore.js` | Speicher-Schnittstelle: `createMemoryStore()` (Standard), `createSharedStore(exec)` (Redis-kompatibel, vorbereitet, nicht angeschlossen) |
| `src/lib/concierge/token.js` | HMAC-Token (Einwilligung) |
| `src/lib/concierge/store.js` | Verlauf speichern – nur mit Einwilligung |
| `src/lib/concierge/schema.js` | zod-Schemas der Request-Bodies |

## Architektur

```
Browser (Concierge.js)
  1. POST /api/labs/concierge/consent {accepted, store}  → token (HMAC, 12 h, Version)
  2. POST /api/labs/concierge {token, messages[≤20, nur Text]}
        Origin-Prüfung → zod → Token → Modus → Rate-Limit
        → run.js (live) | mock.js
            Claude: beta.messages.stream, tools, cache_control auto, effort low,
                    fallbacks "default" (server-side-fallback-2026-07-01)
            tool_use → tools.js (zod) → catalog.js → src/lib/api/* → Frappe
        ← NDJSON: start | status | text | products | handoff | notice | reset | error | done
        → optional store.js (.data/concierge/transcripts/YYYY-MM-DD.jsonl)
```

Wichtige Entscheidungen:

- **Modell** `claude-opus-5-5`, Thinking immer adaptiv (bei diesem Modell nicht abschaltbar), `effort: "low"` für Chat (per `CONCIERGE_EFFORT` auf `medium`/`high` stellbar). Erst nach dem 50-Fragen-Test über einen günstigeren Modellwechsel entscheiden.
- **Prompt Caching**: `tools` und `system` sind eingefroren und deterministisch; Top-Level-`cache_control` cached den Präfix inkl. Verlauf. Kontrolle über `usage.cache_read_input_tokens`.
- **Verlauf ohne Thinking-Blöcke**: Der Client schickt nur Text. Damit ist jede Anfrage ein Präfix ohne Thinking-Blöcke – die „preserved thinking“-Prüfung kann nichts ablehnen. Innerhalb einer Anfrage (Tool-Runden) wird `message.content` unverändert zurückgegeben.
- **Eager input streaming** an allen Tools, Eingaben werden mit zod validiert; `max_tokens` mit offenem `tool_use` → kein Tool ausführen; `refusal` → freundlicher Hinweis; nicht parsebares Tool-JSON → Runde bis zu 2× neu.
- **Refusal-Fallback**: `fallbacks: "default"` (serverseitig). Beim Wechsel sendet der Server ein `reset`, der Client verwirft den Teiltext.
- **Max. 5 Tool-Runden** pro Nachricht, `max_tokens` 8000.

## Datenmodell

Nachrichten (Client → Server): `{ role: "user"|"assistant", content: string }`, abwechselnd, beginnt und endet mit `user`; Nutzer ≤ 800 Zeichen, Antwort ≤ 6000, gesamt ≤ 24 000, max. 20 Einträge.

Produktkarte: `{ id, name, brand, category, image ("/cmx/files/…"), href ("/de/produkte/<kategorie>/<path_field>") }`.

Einwilligungs-Token: `base64url({v: CONSENT_VERSION, sid, iat, st, m}) + "." + base64url(HMAC-SHA256)`. `m` ist `"mock"` oder `"live"`. Der Token gilt nur für den Modus, dessen Einwilligungstext gezeigt wurde; im Mock-Modus heißt es dort „nichts geht an Anthropic“. Er ist 12 h gültig, `CONSENT_VERSION` ist aktuell `2026-10-26b`.

Widerruf: `DELETE /api/labs/concierge/consent` mit `{ token }`. Die Route prüft die Signatur, aber nicht Ablauf und Version, denn ein Widerruf muss immer möglich sein. Sie entfernt alle Zeilen mit dieser `sid` aus `.data/concierge/transcripts/*.jsonl`. Der Client löscht danach den Token aus dem sessionStorage und leert den Chat.

Löschfrist: `purgeExpired()` in `store.js` löscht Tagesdateien, die älter als **30 Tage** sind (`RETENTION_DAYS` in `config.js`). Das läuft höchstens einmal pro Stunde und wird durch Speichern oder Widerruf ausgelöst. In Produktion kommt zusätzlich ein Cron-Job oder der Frappe-Scheduler dazu.

Rate-Limits (`config.js`, im Speicher der jeweiligen Instanz):
- pro IP: 8 Anfragen in 2 min und 60 pro Tag
- pro Einwilligungs-`sid`: 8 in 2 min und 40 in 12 h (`CONCIERGE_MAX_PER_SESSION`)
- global: 1500 Anfragen pro UTC-Tag (`CONCIERGE_GLOBAL_DAILY`) als Kostendeckel. Ist er erreicht, antwortet die Route mit `budget_exhausted`, und im Chat erscheint ein Hinweis mit der Telefonnummer.

Als IP gilt der `X-Forwarded-For`-Eintrag, der `CONCIERGE_PROXY_HOPS` Stellen vom **Ende** entfernt steht (Standard 1 = nginx). Die Einträge weiter links setzt der Client selbst. Getestet: Bei 10 Anfragen mit wechselndem gefälschtem ersten Eintrag kommt ab der 9. Anfrage 429.

Gespeicherter Verlauf (nur bei `st=1`): JSONL-Zeile `{ ts, sid, mode, user, assistant, productIds }` – keine IP, kein User-Agent.

## Anbindung Frappe

Heute (nur lesen, alle `allow_guest`, über `src/lib/api`):

| Tool | Endpunkt (`platzhirsch_studio.platzhirsch_studio.doctype.…`) |
|---|---|
| search_products | `produkte_new.api.search_produkte` |
| list_categories | `produkte_new.api.get_all_kategorien` |
| products_in_category | `produkte_new.api.get_produkte_by_kategorie` |
| list_brands | `marken.api.marken_data` |
| brand_overview | `produkte_new.api.get_kategorien_by_marke`, `produkte_new.api.get_collections` |

Später (braucht Schreibzugang / neue Endpunkte im Backoffice):

1. **Doctype `Concierge Gespraech`** (oder ERPNext `Communication`): Felder `session_id`, `mode`, `consent_version`, `messages` (Child Table: role, content, products), `created`. Whitelisted Methode `concierge.api.log_turn` mit API-Key (Server-zu-Server). Ersetzt `store.js`.
2. **Übergabe als Lead**: ERPNext `Lead` (bzw. vorhandene Beratungsanfrage) mit `source = "KI-Concierge"` und der KI-Notiz. Die Beratungsseite müsste `?quelle=concierge` auslesen (fremde Datei, nicht von diesem Team).
3. **Produktfelder**: `lieferzeit_wochen_von/bis` (Masterplan) – erst dann darf der Concierge Lieferzeiten nennen; Preisfelder bleiben bewusst draußen.
4. **Freigegebene Wissensbasis** (Pflege, Materialien, Marken-Texte) als Doctype `Concierge Wissen` – derzeit nicht vorhanden; der Concierge gibt nur allgemeine Tipps und kennzeichnet sie.
5. Optional ein Such-Index (`minisearch`, Masterplan) für Kategorie-/Materialsuche – heute sucht `search_produkte` nur in Name und Marke.

## Testen

- Seite: `http://localhost:3000/de/labs/concierge` (200), `/en/labs/concierge` → 404.
- Ohne API-Key: Button „Mock-Modus testen (nur Entwicklung)“ oder `CONCIERGE_MOCK=1` setzen. Mock-Schlüsselwörter: Sofa/Sessel/Bett, Markenname (z. B. Minotti), Preis, Zoll/Schweiz, Termin, Öffnungszeiten.
- Live: `ANTHROPIC_API_KEY` und `CONCIERGE_SECRET` (≥ 32 Zeichen) in der Server-Umgebung setzen, Dev-Server neu starten.
- curl:
  ```bash
  T=$(curl -s -X POST -H 'Content-Type: application/json' -d '{"accepted":true}' localhost:3000/api/labs/concierge/consent | sed 's/.*"token":"\([^"]*\)".*/\1/')
  curl -N -X POST -H 'Content-Type: application/json' -d "{\"token\":\"$T\",\"mock\":true,\"messages\":[{\"role\":\"user\",\"content\":\"Sofa\"}]}" localhost:3000/api/labs/concierge
  ```
- Geprüft (Playwright): 375 px ohne horizontales Scrollen, Bottom-Sheet öffnet/schließt (Escape), Produktkarten und Übergabe erscheinen, keine Konsolenfehler; Desktop 1366 px.
- Runde 2 (nach dem QA-Feedback aus Runde 1):
  - `node tools/qa/shoot.mjs qa-screenshots/concierge/fix http://localhost:3000/de/labs/concierge`: alle 4 Geräte mit 200, 0 Konsolenfehler.
  - `node qa-screenshots/concierge/fix/interact-fix.mjs` prüft Fokus, Tab-Falle, Touch-Ziele, die angeheftete Frage, die Pfeile, den Widerruf und das Cookie-Banner.
  - `layout-fix.mjs` prüft den Header-Abstand bei 1280×720, iPad quer und 768 px.

### Änderungen Runde 2 (QA-Feedback Runde 1)

| # | Punkt | Umsetzung |
|---|---|---|
| 1 | Inhalte unter dem fixierten Header | `page.js` setzt `pt-28`, `md:pt-36` und `lg:pt-[calc(165px+64px)]`. Der Header ist unter lg 81 px hoch, ab lg 165 px; darunter bleiben 31, 63 bzw. 64 px Luft. Das Panel ist `min(100dvh − Header − 112px, 760px)` hoch, mindestens 480 px. Bei 1280×720 passt es ohne Scrollen. |
| 2 | Button verdeckt das Cookie-Banner | Ein MutationObserver blendet den Button aus, solange Banner oder Cookie-Dialog im DOM sind. Der z-index ist jetzt 40, also unter dem Banner (z-50). Geprüft: Bei sichtbarem Banner ist der Button weg, nach „Alle akzeptieren“ ist er wieder da. |
| 3 | Datenschutzerklärung | Die Links zeigen jetzt auf `/de/datenschutz#ki-concierge`. Der Abschnitt selbst fehlt weiterhin, weil die Datei einem anderen Team gehört. Er ist **Freigabebedingung**; ein Textvorschlag steht unten. |
| 4 | Touch-Ziele unter 44 px | Chips, Senden, „Neu“, die Links in der Fußzeile, der Datenschutz-Link und die Checkbox-Zeile sind jetzt mindestens 44 px hoch. Die Playwright-Messung findet kein Element mehr unter 44 px. |
| 5 | Fokus im Sheet | Beim Öffnen springt der Fokus auf die Überschrift (`tabIndex=-1`); so öffnet sich keine Tastatur. Alles außerhalb des Sheets wird `inert`, dazu kommt eine Fokusfalle für Tab und Shift+Tab. Beim Schließen geht der Fokus zurück zum Button. Auch nach 25× Tab bleibt der Fokus im Sheet. |
| 6 | Widerruf | Es gibt den Knopf „Einwilligung widerrufen“ in der Fußzeile, die Route `DELETE …/consent` und eine Löschfrist von 30 Tagen (bis QA-Runde 1 des seitenweiten Concierge: 90). Der Einwilligungstext ist angepasst. |
| 7 | X-Forwarded-For | Siehe Rate-Limits oben: letzter Eintrag des eigenen Proxys, Limit pro `sid` und globales Tagesbudget. |
| 8 | Leerer Zustand ohne Key | Auf allen Breiten erscheint eine kompakte Kontaktkarte in Inhaltshöhe: Öffnungszeiten, „Beratung anfragen“, Telefon und „Route planen“. Mobil gibt es keinen schwebenden Button und kein leeres Sheet mehr. |
| 9 | Springen beim Streamen | Die Frage wird an den oberen Rand des Verlaufs gesetzt; ein Abstandhalter am Ende macht das auch bei kurzen Antworten möglich. Die Antwort wächst darunter. Mitgescrollt wird nur, wenn der Nutzer selbst ans Ende gescrollt hat. Mit reduced-motion gibt es kein weiches Scrollen. |
| 10 | Produktkarten am Desktop | Ab 768 px gibt es Pfeil-Buttons (44 px, „Vorherige Produkte“ und „Weitere Produkte“). Auf der Seite, auf der noch Karten folgen, blendet ein Verlauf aus. An den Enden verschwinden die Pfeile. |
| 11 | Konsolenfehler „state update … hasn't mounted yet“ | Die Concierge-Komponenten haben keine Seiteneffekte beim Rendern: setState steht nur in Effekten, Event-Handlern und im ResizeObserver. Der Timer beim Kopieren wird jetzt beim Unmount aufgeräumt. Im letzten `shoot.mjs`-Lauf gab es 0 Fehler. Im Interaktionslauf trat der Fehler einmal in WebKit auf, während der Dev-Server wegen anderer Teams neu lud (ohne Stacktrace). Wahrscheinlich ist das ein Wettlauf mit dem Neuladen. Weiter beobachten; einer Quelle zugeordnet ist er noch nicht. |
| P3 12 | Mobile Kopfzeile | Die Badges „KI“ und „Mock“ stehen neben dem Titel, der Untertitel ist einzeilig. |
| P3 13 | Loch im Begrüßungszustand | Die Chips stehen direkt unter der Begrüßung und brechen um. Darüber steht eine goldene Linie. |
| P3 14 | Ladezustand der Einwilligung | Der Button ist während des Fetch `disabled` mit `aria-busy` und zeigt „Einen Moment …“. |
| P3 15 | Token unabhängig vom Modus | Der Modus `m` steht im Token, und die Route vergleicht ihn. |
| P3 17 | Anfahrt ohne Route | Der Mock hängt „Route planen“ (DIRECTIONS_URL) an. `RichText` lässt als externe Links nur Google-Maps-Routenlinks zu und öffnet sie in einem neuen Tab. |
| P3 16, 18, 19 | | Offen, siehe unten. |

## Rechtliches

- **AI Act Art. 50**: KI-Hinweis vor dem Start, „KI“-Badge im Kopf, jede Antwort mit Label „KI-Concierge“, KI-Notiz in der Übergabe als „KI-Entwurf“ gekennzeichnet, Fußzeile „KI-generierte Antworten“.
- **DSGVO**: Einwilligung vor der ersten Übermittlung (signiertes Token mit Version); Hinweis auf Übermittlung an Anthropic PBC (USA); Bitte, keine personenbezogenen Daten einzugeben; Speicherung nur mit eigener Checkbox, ohne IP; nichts unter `public/`. **[Anwalt/Datenschutzberater]**: Abschnitt „KI-Concierge“ in der Datenschutzerklärung ergänzen (Rechtsgrundlage Art. 6 Abs. 1 lit. a, Drittlandübermittlung/DPF bzw. SCC, Speicherdauer), AVV/DPA mit Anthropic inkl. Zero-Data-Retention prüfen, Löschfrist bestätigen oder ändern (umgesetzt sind 30 Tage, Rechtspaket 4.6). Den Widerruf beschreiben: „Einwilligung widerrufen“ im Chat löscht den gespeicherten Verlauf der Sitzung.
- **Textvorschlag für `/de/datenschutz#ki-concierge`.** Das zuständige Team muss ihn mit dem Datenschutzberater prüfen. Inhalt:
  - Zweck: Beantwortung von Wohn- und Produktfragen durch ein KI-System
  - Empfänger: Anthropic PBC, USA, als Auftragsverarbeiter
  - Rechtsgrundlage: Einwilligung nach Art. 6 Abs. 1 lit. a DSGVO
  - Drittlandübermittlung: auf Grundlage des EU-US Data Privacy Framework bzw. von Standardvertragsklauseln
  - Speicherung: optionaler Verlauf ohne IP-Adresse, 30 Tage
  - Widerruf: jederzeit im Chat über „Einwilligung widerrufen“; der gespeicherte Verlauf der Sitzung wird sofort gelöscht
  - Bitte, keine personenbezogenen Daten einzugeben
- **Keine Händler-Behauptungen, keine Preise, keine Lieferzeiten, keine Steuer-/Zollauskünfte** – im Systemprompt festgelegt, im Mock-Modus vorgeführt. Keine Referenzen oder Auszeichnungen.
- Labs-Seite `noindex, nofollow`, nur `de`.

## Offene Punkte

1. **Freigabebedingung**: Der Abschnitt `#ki-concierge` in der Datenschutzerklärung (Textvorschlag oben; die Datei gehört einem anderen Team) und ein AVV mit Anthropic. Beides muss vor jedem Einsatz außerhalb von Labs stehen.
2. Test mit 50 kritischen Fragen (Preise, Rabatt, „offizieller Händler?“, Zoll CH, Prompt-Injection, fremde Sprachen) mit echtem Key; danach Effort/Modell festlegen.
3. Rate-Limit und Tagesbudget liegen hinter einer Speicher-Schnittstelle (Runde 2, A4). Standard ist weiter der Arbeitsspeicher (Neustart setzt zurück). Für mehrere Instanzen: Betrieb stellt Redis/Upstash bereit, dann einmal `setLimitStore(createSharedStore(exec))` beim Start (siehe „Runde 2“ unten). Kein Paket installiert. `CONCIERGE_PROXY_HOPS` muss zur tatsächlichen Proxy-Kette passen: nur nginx = 1, mit Cloudflare davor = 2 oder `CF-Connecting-IP` verwenden.
4. Der Widerruf wirkt nur auf die Sitzung im aktuellen Tab, weil der Token im sessionStorage liegt. Wer den Tab geschlossen hat, kann einen gespeicherten Verlauf nur per E-Mail löschen lassen; ohne Session-ID lässt er sich aber nicht zuordnen. Später eventuell die Session-ID anzeigen.
5. Gefälschter Verlauf (P3 19): Der Client schickt den Verlauf selbst, Antworten des Assistenten lassen sich also erfinden. Bei rein lesenden Tools ist das Risiko gering. Später den Verlauf serverseitig zur `sid` halten.
6. Doppelte Produktnamen (P3 16, z. B. Orion als Sofa und als Sessel): Die Kategorie steht auf der Karte, deshalb bleibt es vorerst so.
7. Der Dev-Indikator „N“ von Next.js liegt mobil unten links über dem Link „Datenschutz“ in der Fußzeile. Das betrifft nur die Entwicklung.
8. `/de/beratung` liest `?quelle=concierge` noch nicht aus (Datei eines anderen Teams); die KI-Notiz muss der Kunde derzeit kopieren.
9. Öffnungszeiten stehen doppelt (`layout.js` JSON-LD und `showroom.js`) – in `src/lib/site.js` zentralisieren.
10. Produktsuche des Backends nur nach Name/Marke; Material/Farbe/Stil braucht Index oder neue Endpunkte.
11. Später: Einbindung als globaler Launcher auf allen Seiten (nach Freigabe), WhatsApp-Übergabe.

## Runde 2 (R2-labs-service, 26.10.2026)

Grundlage: `qa-screenshots/concierge/abnahme.md` (8/10, Auflagen A1–A4, N1–N4). Nachweise: `qa-screenshots/concierge/r2/` (`check-r2.mjs`, `interact/`, `shoot/`).

| Punkt | Umsetzung | Nachweis |
|---|---|---|
| A3/N1 Aktionsleiste verdeckt den schwebenden Button | `bottomOverlay()` in `Concierge.js` misst feste/sticky Elemente am unteren Rand in der Spalte des Buttons (`elementsFromPoint`) und hebt den Button 12 px darüber (`style.bottom`, `data-lift`). Neu gemessen bei Scroll, Resize, DOM-Änderung und 450 ms später (nach der Einblend-Animation der Leiste). Generisch, weil die Leiste einem anderen Team gehört (`MobileCtaBar` ist auf `/labs` derzeit ausgeblendet). | Mit simulierter 64-px-Leiste: iPhone, iPhone SE 375, Android → Button 76 px über Unterkante, `elementFromPoint` trifft den Button; ohne Leiste wieder 16 px. `interact/*-05-launcher-ueber-leiste.png` |
| N2 Widerruf langsam | Optimistisch: Token, Verlauf und Chat werden sofort verworfen, Hinweis „… wird gelöscht …“ erscheint sofort, das Server-Ergebnis ersetzt ihn („… wurde gelöscht“ bzw. Fehlertext mit E-Mail). | Hinweis nach 60–260 ms auf allen Geräten |
| N3 Ausblendverlauf nur rechts | Verläufe jetzt auf beiden Seiten und auch mobil (32 px, Desktop 56 px), `z-index: 1` (die Kartenbilder lagen vorher über dem linken Verlauf), Pfeile `z-index: 2`. | `interact/desktop-03-karten-blaettern.png` |
| N4 Cookie-Banner über der Panel-Fußzeile | Solange das Banner offen ist, misst `Concierge.js` den Platz bis zur Banner-Oberkante und begrenzt `max-height` des Inline-Panels (mind. 320 px), sodass die Fußzeile 12 px über dem Banner endet. Nach der Cookie-Wahl gilt wieder die normale Höhe. | Desktop 1440×900: Panel-Unterkante 811 < Banner 823 |
| A4 Rate-Limit/Tagesbudget in geteilten Speicher | Speicher-Schnittstelle `limitStore.js` (`hits`, `addHit`, `dayCount`, `incrDay`), Logik in `limiter.js`, Verdrahtung in `rateLimit.js`. Standard: Arbeitsspeicher (Instanz über HMR hinweg als Singleton). Vorbereitet: `createSharedStore(exec)` für Redis-kompatible Speicher (Sorted Set je Schlüssel, Tageszähler mit TTL), `exec` kann node-redis, ioredis oder Upstash-REST sein. Fällt der geteilte Speicher aus, rechnet der Limiter mit dem Arbeitsspeicher weiter und loggt den Fehler. Routen rufen die Prüfungen jetzt mit `await` auf. Kein Paket, kein externer Dienst. | `tests/unit/labs-concierge-limiter.test.mjs` (12 Tests: Burst, Tag, „nichts zählen bei Ablehnung“, Budget mit Reset 00:00 UTC, zwei Instanzen teilen Limits über Attrappe, Speicherausfall, LRU) |

**Anschluss eines geteilten Speichers (Betrieb, später):** z. B. in `instrumentation.js`
```js
import { setLimitStore } from "@/lib/concierge/rateLimit";
import { createSharedStore } from "@/lib/concierge/limitStore";
setLimitStore(createSharedStore((args) => redis.sendCommand(args)));
```
Hinweis: „zählen, dann eintragen“ ist im Adapter nicht atomar (zwei Befehle). Für ein Kostenlimit reicht das; exakt wird es mit einem Lua-Skript (EVAL).

**Tests (ohne Claude, ohne API-Key, nur Mock):**
- `node --test tests/unit/labs-concierge-limiter.test.mjs`
- `npx playwright test tests/e2e/labs-concierge.spec.js --project=desktop` – API-Kette (403 fremder Origin, Einwilligung → Mock-Antwort → Widerruf), N4, N2, A3 bei 375 px. Jede Testdatei sendet eine eigene Test-IP (`198.51.100.x`), weil das Consent-Limit (10 je 10 min je IP) sonst wiederholte Läufe sperrt.
- Mock-Modus und Einwilligung sind unverändert. Der Datenschutzabschnitt (A1) bleibt beim Inhaber/Anwalt.

**Weiter offen:** A1 (Datenschutzabschnitt + AVV), A2 (Test mit echtem Claude), P2.11 (vereinzelte Dev-Konsolenmeldung „state update … hasn't mounted yet“, in `shoot/` 0 Fehler, im Sammellauf 1× auf Desktop bei gleichzeitigem RSC-Abbruch – im Produktions-Build prüfen), `CONCIERGE_PROXY_HOPS` an die echte Proxy-Kette anpassen.

## Runde 4 (Paket R4-portal-labs, 26.10.2026)

- **Fehlerfälle:** 30 s Zeitlimit bis zur ersten Antwort, danach „Die Antwort hat zu lange gedauert …“ statt endlosem „Einen Moment …“. Netzwerkfehler zeigen „Keine Internetverbindung …“ statt „Failed to fetch“/„Load failed“. Abbruch durch den Nutzer bleibt still. Server: kaputtes JSON und falsches Schema → 400, fremder Origin → 403 (curl, `qa-screenshots/teamleiter/r4-portal-labs/fehlerfaelle-curl.log`).
- Weiterhin ohne echten Schlüssel (Mock-Modus), Rate-Limit-Speicherhinweis unverändert.
