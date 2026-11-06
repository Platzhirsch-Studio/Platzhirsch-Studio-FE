# UI-Kit Backoffice (`backoffice/src/components/Backoffice/`)

Bausteine des eigenen Backoffice (Next.js 16, React 19, Tailwind 4). Gestaltung: **Lounge** (Inhaber-Freigabe Nr. 51/53, `art-direction/lounge.md`;
Tinte `#30373e` auf Kalk, Materialtöne Cognac/Salbei/Eiche, Bodoni Moda nur Wortmarke, SF/Inter), hell/dunkel per
`prefers-color-scheme` (Variablen `--color-bo-*` in `src/app/globals.css`), kompakt am Desktop,
bedienbar am iPad (Touch-Ziele ≥ 44 px, Kiosk ≥ 48 px).

Für Fachbereichs-Agenten gilt: **eigene Seiten unter `src/app/<bereich>/`, eigene Komponenten unter
`src/components/Backoffice/<Bereich>/`, eigene Logik unter `src/lib/backoffice/<bereich>/`** – die
Bausteine hier werden importiert, nicht kopiert. Jede Seite prüft die Sitzung selbst (kein Schutz im Layout).

## Server/Client-Grenze und Rechte – Grundmuster einer Seite

```jsx
// src/app/crm/anfragen/page.js (Server Component)
import { requireDocRecht, requireSession } from "@/lib/backoffice/auth/dal";
import { backoffice, ladeMeta } from "@/lib/backoffice/frappe";
import { listenFelder, listenSpalten, statusTon } from "@/lib/backoffice/frappe/meta";
import { listenAbfrage } from "@/lib/backoffice/listen";
import { darfDoc } from "@/lib/backoffice/auth/rechte";
import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import DataTable from "@/components/Backoffice/DataTable/DataTable";
import Filterleiste from "@/components/Backoffice/DataTable/Filterleiste";

export const dynamic = "force-dynamic";

export default async function Anfragen({ searchParams }) {
  const sp = await searchParams;
  const session = await requireSession("/crm/anfragen");          // ohne Sitzung → /login?next=
  const client = backoffice(session);                              // Mock oder Frappe, an die Sitzung gebunden
  const meta = await ladeMeta(client, "PH Anfrage");               // Mock: JSON-Datei, Frappe: getdoctype
  await requireDocRecht(meta, "read", "/crm/anfragen");            // ohne Recht → /kein-zugriff
  const params = Object.fromEntries(Object.entries(sp).map(([k, v]) => [k, String(v)]));
  const a = listenAbfrage(params, meta);                           // seite/sort/status/von/bis/q → Frappe-Filter
  const [zeilen, gesamt] = await Promise.all([
    client.getList("PH Anfrage", { fields: listenFelder(meta), filters: a.filters, orFilters: a.orFilters, orderBy: a.orderBy, limit: a.limit, start: a.start }),
    client.count("PH Anfrage", { filters: a.filters, orFilters: a.orFilters }),
  ]);
  const toene = Object.fromEntries(meta.statusOptionen.map((s) => [s, statusTon(meta, s, client.index)]));
  return (
    <Shell session={session} breit>
      <Seitenkopf titel="Anfragen" krumen={[{ titel: "Zentrale", href: "/" }, { titel: "CRM", href: "/crm" }, { titel: "Anfragen" }]} />
      <Filterleiste basis="/crm/anfragen" params={params} statusWerte={meta.statusOptionen} statusTon={toene} />
      <DataTable doctype="PH Anfrage" spalten={listenSpalten(meta)} zeilen={zeilen} gesamt={gesamt} seite={a.seite} groesse={a.groesse}
        sortFeld={a.sortFeld} richtung={a.richtung} basis="/crm/anfragen" params={params}
        zeilenBasis="/d/ph-anfrage" statusTon={toene} darfExport={darfDoc(session, meta, "export")} />
    </Shell>
  );
}
```

Regeln:

- **Server Components** laden Daten (`backoffice(session)`), rendern `Shell`, `Seitenkopf`, Charts, `Kennzahl`, `Leer`.
- **Client Components** (`"use client"`) sind `DataTable`, `Filterleiste`, `Kanban`, `Formular`, `Fehler`, `Toast`, `Bestaetigen`, `KioskShell`. Sie bekommen **nur serialisierbare Props** – keine Funktionen (außer Server Actions). Links werden deshalb als Basis-Strings übergeben (`zeilenBasis`, `hrefBasis`, `nachSpeichernBasis`) und in der Komponente mit dem Datensatznamen zusammengesetzt.
- **Mutationen nur über Server Actions** (`src/lib/backoffice/actions.js` oder eigene `src/lib/backoffice/<bereich>/actions.js` mit `"use server"`). Jede Action ruft `requireSession()` und prüft `darfDoc()` erneut. Rückgabe immer `{ ok:true, … }` oder `{ ok:false, code, message, fehler? }` – nie werfen.
- **Rechte**: Navigation über `darf(session, bereich, aktion)`, DocTypes über `darfDoc(session, meta, aktion)`, Workflow-Buttons über `client.getTransitions()`. Im Frappe-Modus prüft Frappe zusätzlich mit der Benutzer-Sitzung.
- **Texte**: Deutsch, kurz, neutral. Keine Superlative, keine erfundenen Zahlen. Beträge immer aus Cent (`cent()` aus `@/lib/backoffice/format`).
- **Keine Entwicklertexte in der UI**: DocType-Namen nie roh („PH Anfrage“, `meta.name`) anzeigen, sondern `doctypeLabel()`; Labels/Status/Optionstexte über `anzeige()`; Metadaten-`description` nur als Hilfetext/Tooltip über `hilfetext()` (liefert `null` für technische Texte mit „DocType“, `ph_…`, `snake_case`, Code-Pfaden …). Lange Texte mit `line-clamp-*` klammern statt per `slice` mitten im Wort kürzen.

## Komponenten

| Komponente | Art | Props (Auszug) | Zweck |
|---|---|---|---|
| `Shell/Shell` | Server | `session`, `breit?`, `kopfSlot?` | **Shell v2 im Lounge-Stil (Team P0-7):** schwebende Icon-Leiste links (Bereiche nach Rechten, aktiv = Tinte-Kreis, Benutzermenü unten; Strg+B zeigt Namen; Telefon: Tab-Kapsel unten), durchscheinende Kopfzeile (Wortmarke · Pillen-Reiter der Unterbereiche · Slot · Suche · Glocke · Neu · Hilfe), Testband im Inhalt, Befehlspalette v2, Glocke v2 + Freigaben, Kundenmodus, Sitzungs-Hinweis. Details im Abschnitt „Shell v2 (Team P0-7)“. |
| `Kiosk/KioskShell` | Client | `titel`, `geraet`, `benutzer`, `kuerzel`, `onScan`, `hilfe` (+ v2: `kontext`, `kopfSlot`, `status`, `baender`, `scanAus`, `toastAnker`, `idleMs`) | **Kiosk-Kern v2 im Lounge-Stil (Team P0-6)** – Details im Abschnitt „Eingabe, Kalender und Kiosk v2“. |
| `Kiosk/KioskPlatzhalter` | Client | `titel`, `geraet`, `benutzer`, `icon`, `links[{titel, href, text?, icon?}]` | Neutraler Inhalt, bis der Fachbereich den Arbeitsplatz baut: „Dieser Arbeitsplatz wird eingerichtet“, Such-/Scanfeld (F2; Enter/Scan sucht in `links[0]`), Kacheln zu den Listen. Die Links liefert `kioskLinks(session, [{doctype, text, icon}])` aus `src/app/(kiosk)/kiosk.js` (nur DocTypes mit Leserecht). |
| `Kiosk/hooks` | Client | `useTastenkuerzel({ F2: fn, "ctrl+p": fn })`, `useScanner(onScan)`, `useVollbild()`, `useVerbindung()`, `useDruck()`, `useUhr()`, `useLebenszeichen(aktiv)` | Tastenkürzel-Registry, Scanner-Wedge, Vollbild-API, Online-Status (`/api/ping`), Druck-Hook. **Hydration-sicher:** `useVollbild().verfuegbar` ist beim Server-Rendern und Hydrieren `false` (useSyncExternalStore; vorher Ursache der Plakette „1 Issue“); `useUhr()` liefert jetzt **`{ text, iso }`** (vorher String) und ist bis nach dem Einhängen leer. `useLebenszeichen(aktiv)` → `{ gesperrt }`. |
| `Seitenkopf` | Server | `titel`, `untertitel?`, `hilfe?`, `krumen[]`, `aktionen?` (oder Kinder / `aktion`) | **Lounge v2 (Team P0-5b), Details im Abschnitt „Seitenmuster“.** **Ein Seitenkopf-Muster überall:** Brotkrumen, Titel (h1), Untertitel; ab 640 px stehen die Aktionen immer rechts neben dem Titel (Raster `1fr auto`), darunter in eigener Zeile. `hilfe` = Metadaten-Beschreibung → Info-Symbol mit Tooltip (technische Texte werden verworfen). Reihenfolge der Aktionen: Ansicht-Umschalter (`Segment`), Nebenaktionen, zuletzt höchstens eine `variant="primary"`. |
| `Segment` | Client | `label`, `optionen[{wert, titel, href?, icon?, testid?, deaktiviert?}]`, `aktiv` (Links) bzw. `wert` + `onWechsel` / `name` (Auswahl), `groesse` `m|s` | **Link-Gruppe** (mit `href`; Liste/Kanban, Zeiträume – auch aus Server-Seiten) als `nav` mit `aria-current`, oder **Auswahl** (ohne `href`; Netto/Brutto, Dichte) als `role="radiogroup"` mit ←/→/Pos1/Ende. Marker gleitet 200 ms, Höhe folgt der Dichte. Dazu `DichteSchalter`, `useDichte()`, `setzeDichte()`, `DICHTE_SKRIPT` (siehe Team P0-2). |
| `DataTable/DataTable` | Client | `doctype`, `spalten`, `zeilen`, `gesamt`, `seite`, `groesse`, `sortFeld`, `richtung`, `basis`, `params`, `zeilenBasis`, `statusTon`, `darfExport`, `massenaktionen[]`, `filterDaten` | **Lounge v2 (Team P0-5b), Details im Abschnitt „Seitenmuster“.** Serverseitig paginierte Tabelle: Sortier-/Paging-Links („1–25 von 30“), Spaltenwahl (localStorage, schließt bei Klick daneben/Esc), Zeilenauswahl + Massenaktionen, CSV-Export (nur mit `export`-Recht), Status-Badges, Tastatur (↑/↓/Enter/Leertaste). Nr.-, Datums-, Zahl- und Status-Spalten brechen nicht um; Texte zweizeilig geklammert (`title` = voller Text). **Unter 768 px Kartenliste** (`data-testid="karten-liste"`): Nr. (nowrap, mono), Titel (erste Textspalte, 2 Zeilen), Status, bis zu 2 Nebenfelder, Änderungszeit relativ. `DataTableSkeleton` für `loading.js`. |
| `DataTable/Filterleiste` | Client | `basis`, `params`, `statusWerte`, `statusTon`, `datumsLabel`, `zusatz` | **Lounge v2 (Team P0-5b), Details im Abschnitt „Seitenmuster“.** Status-Chips (Mehrfach, Punkt in Statusfarbe, Text mit Umlauten, URL mit Originalwert), Zeitraum von/bis als `Datumsfeld` (Wert ISO), Freitext mit Lupe – reines GET, Server filtert (`listenAbfrage`). Am Telefon zweispaltig. |
| `Kanban/Kanban` | Client | `doctype`, `spalten[{status, karten}]`, `kartenFelder`, `titelFeld`, `statusTon`, `uebergaenge`, `hrefBasis`, `wipLimit` | **Lounge v2 (Team P0-5b), Details im Abschnitt „Seitenmuster“.** Spalten fest 300 px, waagrechter Scroll mit **Randverlauf und Blätter-Knöpfen** (nur wenn es in die Richtung weitergeht). Drag & Drop mit Maus/Stift (Auto-Scroll am Rand); Touch: Wischen scrollt, Verschieben über das Menü (⋯). **Tastatur:** Karte fokussieren, ←/→ verschiebt in die nächste erlaubte Spalte, M öffnet „Verschieben nach …“ (↑/↓/Esc), Enter öffnet; Ansage über Live-Region. Optimistisch, WIP-Zähler, leere Spalte gestrichelt. Mit `uebergaenge` läuft `workflowAktionAction`, sonst `setzeWertAction(status)`. |
| `Formular/Formular` | Client | `meta`, `kinderMeta`, `doc`, `neu`, `nurLesen`, `listeHref`, `nachSpeichernBasis` | **Lounge v2 (Team P0-5b), Details im Abschnitt „Seitenmuster“.** Generisches Dokumentformular aus Meta (Tab/Section/Column Break → Tabs (←/→)/Abschnitte/Spalten), alle Frappe-Feldtypen inkl. Link mit Suche (`/api/link`), Cent-Felder in €, Kindtabellen inline, zod-Validierung aus Meta, Konflikt über `modified`, `depends_on`. **Speicherleiste** (`data-testid="speicherleiste"`): liegt in der Inhaltsspalte (nie über der Seitenleiste) am Formularende; sobald es etwas zu speichern gibt (neu/geändert), haftet sie unten (`sticky bottom-3`, Schatten) und belegt Platz im Fluss – das letzte Feld bleibt frei. Primärknopf dann aktiv; ohne Änderungen deaktiviert mit Hinweis „Keine Änderungen“. Strg+S / ⌘S speichert. |
| `Formular/Feld` | Client | `feld`, `wert`, `onChange`, `fehler?`, `nurLesen?`, `prefix?`, `ohneLabel?` | Ein Feld nach Frappe-Typ. Label/Optionstexte über `anzeige()`, Werte unverändert; Hilfetext nur über `hilfetext()`. `ohneLabel` (Kindtabellen): Label nur als `aria-label`. Date/Datetime → `Datumsfeld`. |
| `Formular/Datumsfeld` | Client | `id?`, `name?`, `value?` / `defaultValue?`, `onChange(iso)`, `mitZeit?`, `zeitLabel?` (Standard „Uhrzeit“), `gruppeLabelId?`, `disabled?`, `required?`, `invalid?`, `describedBy?`, `kompakt?`, `aria-label?` | **Deutsches Datumsfeld** statt `type="date"`: Eingabe `TT.MM.JJJJ` (auch „4.11.“, „041126“, „heute“, „morgen“, „+3“, ISO), Kalender-Popover über den angesetzten Knopf (eigenes Ziel ≥ 24 px, keine Überlappung) oder ↓/Alt+↓; im Kalender Pfeile, Bild↑/↓ (Monat), Umschalt+Bild↑/↓ (Jahr), Pos1/Ende, Enter, Esc; „Heute“/„Leeren“. **Wert immer ISO** (`JJJJ-MM-TT`, mit `mitZeit` `JJJJ-MM-TT HH:MM`); mit `name` zusätzlich verstecktes Feld für GET/FormData. `mitZeit`: Zeitfeld `HH:MM` (↑/↓ 15 min); Datum und Zeit bilden eine Gruppe (`role="group"`, `aria-labelledby={gruppeLabelId}`), das Datumsfeld heißt wie das Label, das Zeitfeld nur „Uhrzeit“; „04.11.2026 10:00“ bzw. „2026-11-04T10:00“ im Datumsfeld setzt beides. Ungültig → „Datum im Format TT.MM.JJJJ“. Logik testbar in `lib/backoffice/datum.js` (`parseDatum`, `parseZeit`, `isoZuDeutsch`, `monatsRaster`, `verschiebe`). |
| `Formular/Kindtabelle` | Client | `feld`, `kindMeta`, `zeilen`, `onChange`, `nurLesen?`, `fehler?` | Inline bearbeitbar, scrollt waagrecht in ihrem Rahmen (`min-w-0` bis zur Seite), #-Spalte bleibt links stehen, Zellen ohne sichtbares Label (nur `aria-label` „Label Zeile n“). |
| `Formular/WorkflowLeiste` | Client | `doctype`, `name`, `status`, `ton`, `docstatus`, `transitions`, `aktionen[]`, `rechte`, `submittable`, `druckHref`, `listeHref` | Status, erlaubte Workflow-Übergänge, Buchen/Stornieren, **registrierte Fachbereichs-Buttons** (`aktionen: [{ id, titel, method:"rechnung_erstellen", args, gefaehrlich }]` → `run_doc_method`), Löschen, Druck. Irreversible Aktionen fragen nach (`Bestaetigen`). |
| `Formular/Zeitleiste` | Client | `doctype`, `name`, `docinfo`, `darfSchreiben` | Kommentare, Änderungen (Versionen), Anhänge aus `getDocMitInfo().docinfo`; neuer Kommentar. |
| `Charts` | Server | `Balken`, `Linie`, `Donut`, `Sparkline`, `KeineDaten`, `ChartSkeleton`, `Zahlkarte` – `punkte:[{label, wert}]`, `format` (Funktion oder Name `zahl|dezimal|cent|cent-rund|prozent`), `hoehe` (px), `einblenden` | Ohne Bibliothek und ohne Client-JS. **Alle Beschriftungen sind HTML-Text in festen Pixelgrößen** (11/12 px, tabellarisch). Balken: Nulllinie mit negativen Werten (`--color-chart-negativ`), `hervorheben="letzter"` (Serie 2), ab 9 Balken nur Maximum + letzter beschriftet. Linie: 1,5 px, Punkte bis 12 Werte, `vergleich` (Vorjahr gestrichelt) mit Legende. Donut: ≤ 5 Teile (Rest „Weitere“), Prozent in der Legende. Farben nur Token `--color-chart-1…5`, `-seq-1…5`. Tabelle als `<details>`, leerer Zustand mit Achsenkreuz. Bewegung nur mit `einblenden` (04 P10). Rechenlogik testbar in `Charts/logik.js`. |
| `Kennzahl` | Server (+ Client-Kind `Charts/Zahl`) | `titel`, `wert` (Zahl/Text/null), `format`, `einheit`, `zusatz`, `href`, `trend{richtung, text, gut?}` (null = „Kein Vergleich“), `verlauf[]`, `ziel{wert, ziel, text}`, `hilfe`, `laedt`, `fehler`, `kiosk` | Kennzahl-Karte 03 §8.14: Zahl zählt nur bei Änderung nach dem Laden 400 ms hoch (nie beim Seitenaufbau, Kiosk nie), Trendfarbe nach Bedeutung (`gut:"niedrig"` für Überfälliges), Sparkline 64×20, Zielbalken 4 px, Skeleton, Fehlerfuß „Nicht geladen · Erneut“. Ganze Karte ist Link (Hover 1 px hoch). |
| `StatusBadge` | Server/Client | `wert`, `ton` (`grau|blau|tuerkis|orange|gruen|rot|lila`), `groesse` `xs|sm`, `text?`, `beschreibung?`, `gebucht?`, `storniert?` | Pille Farbe + Text + Form (03 §1.5): Punkt (blau/orange/lila), halber Punkt (türkis), Haken (grün), Dreieck (rot), Ring (grau); Flächen aus den Status-Tints `--color-bo-*-soft/-text`. `gebucht` → Schloss, `storniert` → durchgestrichen. Text über `anzeige()`. |
| `Leer` (`art`: `leer|gefiltert|erledigt|recht`, `groesse` `seite|karte`, `aktion`, `nebenaktion`, `zuruecksetzenHref`), `Fehler` (`code`, `message`, `kompakt`, `autoErneut`, `wartezeit`, `zurueckHref`, `anmeldenHref`, `nummer`, `aktion`), `Bestaetigen`, `Toast` (`useToast().zeige(text, { art:"ok"|"fehler"|"info" })`), `Knopf` (`variant`: `primary|secondary|ghost|danger|danger-solid|link`, `size`: `s|m|l|kiosk`, `href`, `icon`, `iconRechts`, `label` (Nur-Icon), `kuerzel`, **`laedt`**, **`grund`**) | – | Leer: drei Fälle nach Q-E2 (+ kein Recht), 240 px bzw. 160 px in Karten. Fehler: je Code ein Muster nach 02 §7.2 ohne Technikbegriff (Code nur als `data-fehler-code`), Countdown bei `rate_limited`, Auto-Wiederholen 2/4/8 s. Knopf: Höhe nach Dichte, Spinner ohne Breitensprung, gesperrt während `laedt`, `grund` als sichtbarer Satz unter dem deaktivierten Knopf (Q-I5). |
| `BereichStart` | Server | `slug`, `pfad` | **Lounge v2 (Team P0-5b), Details im Abschnitt „Seitenmuster“.** Startseite eines Bereichs, bis der Fachbereich eine eigene liefert: Kacheln je Liste (ganze Kachel ist Link, Anzahl offen/gesamt, Kanban/Neu als Nebenaktionen), Beschreibung nur über `hilfetext()`, zweizeilig geklammert; ohne freigegebene Listen „Dieser Bereich wird eingerichtet“. |

## Anzeige-Labels (`src/lib/backoffice/labels.js`)

Zentrale Label-Funktion für alles, was aus Frappe-Metadaten angezeigt wird – **nur Anzeige, nie für Werte, die zurückgeschrieben werden** (Select-Werte, Status, Namen, URL-Parameter bleiben unverändert):

- `anzeige(text)` – Umschreibungen → Umlaute nach Regel + Ausnahmeliste („Beratungsgespraech“ → „Beratungsgespräch“, „Verfuegbarkeit“, „Geprueft“, „Bestaetigt“, „Uebergeben“ …). Unverändert bleiben Diphthonge und „qu“ (Steuer, Dauer, Neue, Quelle, Queue), `-uell`/`-uenz` (manuell, aktuell, Sequenz), Versal-Kürzel (AES), Fremdwort-Endungen und die Ausnahmeliste (Michael, Israel, Poet, zuerst …). Unterstriche → Leerzeichen; technische Klammerzusätze mit `snake_case` entfallen („Website-Slug (path_field)“ → „Website-Slug“).
- `doctypeLabel("PH Beratungsgespraech")` → „Beratungsgespräch“; `rollenLabel("PH CRM Leitung")` → „CRM Leitung“.
- `hilfetext(description)` → bereinigter Hilfetext oder `null`, wenn er interne Hinweise enthält (DocType, `ph_…`, `path_field`, `snake_case`, Datei-/Code-Pfade, Frappe, Agent, API …). `istTechnisch(text)` prüft nur.
- Eingebaut in `Feld`, `Formular` (Tabs/Abschnitte), `Kindtabelle`, `DataTable` (Kopf, Karten, Massenaktionen), `Filterleiste`, `StatusBadge`, `Kanban`, `WorkflowLeiste`, `Zeitleiste` (Feld-Labels statt Feldnamen, Prop `feldLabels`), `Seitenleiste`, `Befehlspalette`, `Seitenkopf` (`hilfe`), `BereichStart`. Tests: `tests/unit/backoffice-labels.test.mjs`, `backoffice-datum.test.mjs`.

## Gestaltung und Bewegung (Kurzregeln für Fachbereiche)

- Flächen: **Lounge** – Kacheln ohne Rahmen auf Kalk-Fläche, getragen von weichem Schatten; Regeln, Token und Bausteine im Abschnitt „Grundbausteine v2 im Lounge-Stil (Team P0-2)“. Alte Muster (`rounded-[10px] border border-bo-line`) nicht mehr neu verwenden.
- Bewegung 120–200 ms, nur opacity/transform (+ Farbe): Klassen `bo-pop` (Menü/Popover), `bo-rise` (Toast), `bo-fade` (Scrim), `dialog.bo-dialog`; an Elementen mit Übergängen zusätzlich `bo-motion`. Unter `prefers-reduced-motion` entfallen Transform/Opacity-Animationen, Farbübergänge bleiben.
- Tooltip ohne JS: `className="bo-tip" data-tip="Text"` + `aria-label` (Tooltip ist nie einzige Informationsquelle).
- Mobil: Raster immer mit `grid-cols-1` (= `minmax(0,1fr)`) und `min-w-0` an Karten/Spalten; Listen am Telefon als Karten, breite Tabellen waagrecht scrollend in ihrem Rahmen.

## Datenschicht (`src/lib/backoffice/`)

- `frappe/index.js`: `backoffice(session)` → `MockClient` oder `FrappeClient` (gleiche Schnittstelle), `backofficeService()` (Service-Token, nur Systemaufgaben), `ladeMeta`, `ladeWorkflow`, `ladeKinderMeta`, `doctypeAusSegment`.
- Client-Methoden: `getList(doctype, {fields, filters, orFilters, orderBy, limit, start})`, `count`, `getDoc`, `getDocMitInfo` (doc + docinfo), `insert`, `save(doctype, werte, {modified})`, `setValue`, `delete`, `submit`, `cancel`, `getTransitions`, `workflowAction(doctype, name, action)`, `getKanban`, `call(method, args)`, `runDocMethod(doctype, name, method, args)`, `searchLink`, `getReport(name, filters)`, `kommentar`, `uploadFile`, `getFile`, `getPdf` (Frappe), `getMeta`/`getWorkflow` (Frappe).
- Filter wie Frappe: `[["status","in",["Neu","Qualifiziert"]], ["eingang","between",[von,bis]]]` oder `{ status: "Neu" }`. Operatoren: `= != like not like in not in > >= < <= between is`.
- Fehler: `BackofficeError` mit `code` (`invalid | forbidden | not_found | conflict | rate_limited | unavailable | auth`), Text aus Frappe `_server_messages` (ohne HTML). In Server Actions mit `istBackofficeError(err)` abbilden, nie den rohen Fehler in den Client geben.
- Hilfen: `format.js` (`cent`, `euroZuCent`, `datum`, `datumZeit`, `relativ`, `doctypeSlug`), `listen.js` (`listenAbfrage`, `mitParametern`), `validierung.js` (`validiere`, `schemaAusMeta`), `csv.js`, `dashboard.js` (Kennzahlen-Muster). Navigation, Palette, Kürzel, Seed und QA-Routen sind seit P0-1 **Register mit Teildateien je Bereich** – siehe Abschnitt „Register und Fähigkeiten (Team P0-1)“; `bereiche.js`, `suche.js`, `mock/seed.js`, `tools/qa/routen.mjs` sind nur noch Kompatibilitäts-Exporte (nichts eintragen).

## Fachbereichs-Buttons registrieren

```jsx
<WorkflowLeiste … aktionen={[
  { id: "rechnung", titel: "Rechnung erstellen", method: "rechnung_erstellen" },          // Dokumentmethode (run_doc_method)
  { id: "etikett", titel: "Etikett erzeugen", method: "etikett_erzeugen", args: { format: "A6" } },
  { id: "erstatten", titel: "Rückerstatten", method: "erstatten", gefaehrlich: true },   // mit Rückfrage
  { id: "zahlung", titel: "Zahlung buchen", href: "/faktura/zahlungen/neu?rechnung=RE-…" }, // eigene Seite
]} />
```

Im Mock protokolliert `runDocMethod` nur einen Kommentar (ohne Wirkung); im Frappe-Modus läuft die Server-Methode der ph_*-App.

## Kiosk-Arbeitsplätze (Entscheidung Nr. 49)

- Routen: `src/app/(kiosk)/kassa|packtisch|montage|technik/page.js` – Zugang über `kioskZugang(slug)` (`src/app/(kiosk)/kiosk.js`), Inhalt in `KioskShell`.
- Nach dem Login: `/arbeitsplatz` (Kacheln nach Rollen, Cookie `ph_bo_arbeitsplatz`), registriertes Gerät (`/geraet`, Cookie `ph_bo_geraet`) startet direkt im zugeordneten Arbeitsplatz.
- Bedienerwechsel `/wechsel`: Bediener über `bedienerListe({ standort, alleStandorte: true })` (ph_core `list_operators` am registrierten Gerät; Mock: Demo-Benutzer), Suche nach Name/Rolle, Standortfilter (Standard: Standort des Geräts), PIN mit Zifferntastatur; neue Sitzung mit Idle-Timeout 15 min (`KIOSK_IDLE_SECONDS`). Leere Liste (Frappe ohne Gerät) → Hinweis „Bedienerwechsel nur an einem registrierten Gerät“.
- Gerät `/geraet`: Status über `getGeraetStatus()` (gesperrt → Hinweis), Daten mit Geräte-Nr. und „zuletzt gesehen“; Admin/Leitungen (`darfGeraeteVerwalten(session)` aus `auth/rechte.js`, gleiche Regel in `geraetRegistrierenAction`) registrieren und sehen alle Geräte (`geraeteListe({ session })`) mit Sperren/Entsperren (`geraetSperrenAction({ geraet, sperren, grund })`).
- `/benutzer`: kompakte Tabelle (Telefon: Karten) mit Suche und Rollenfilter; Admin bearbeitet Rollen über das Zeilenmenü (⋯) → Dialog mit Rollen-Chips (entfernen ×, hinzufügen per Auswahl), jede Änderung wirkt sofort (`rolleAendernAction`).
- Offline: `useVerbindung()` zeigt den Status; der Offline-Puffer (IndexedDB) ist Aufgabe des Kassa-Agenten (PLAN).

## Anmeldung und Rate-Limit

`anmeldenAction` zählt nur **Fehlversuche** (Schlüssel `login:<ipHash>:<ipHash(email)>`): 50 je 10 min in Entwicklung, 5 in Produktion (`LOGIN_RATE_LIMIT` in `config.js`; `rateLimitStatus()` prüft ohne zu zählen). Erfolgreiche Anmeldungen – auch viele E2E-Läufe hintereinander – verbrauchen kein Kontingent. Bedienerwechsel (`bedienerWechselAction`) analog.

## Tests

- Unit: `npm run test:unit` (node --test, `tests/unit/backoffice-*.test.mjs`): Session/Rechte, Mock-Client (Filter, Paging, Workflow, Nummernkreise), Meta-Leser (echte JSONs), Frappe-Fehlerbild und -Client (fetch-Attrappe), Formate, CSV, Listen-Parameter, Validierung.
- E2E: `PW_WORKERS=1 npx playwright test -c playwright.config.js --project=desktop --project=ipad` (Dev-Server :3100 im Mock-Modus).

## Plattform, Lint-Regeln und Budgets (Team P0-9)

- **Playwright-Projekte** (`playwright.config.js`): `desktop` (Chrome 1440×900) und `ipad` (WebKit 834×1194) laufen mit allen Specs. Zusätzlich: `reducedMotion` (Chrome 1440×900, `prefers-reduced-motion: reduce`, Q-H6) nur für Tests mit Tag `@bewegung`/`@screenshot` oder „bewegung“/„screenshot“ im Datei-/Testnamen; `ipad-quer` (1180×820) und `ipad-hoch` (820×1180), beide WebKit mit Touch, für `@kiosk`/`@tablet` bzw. „kiosk“ im Namen (Lounge-Kiosk: Kassa/Packtisch iPad quer); `kundendisplay` (Chrome 1920×1080, DPR 1, ohne Touch; Lounge §10) für `@kundendisplay` bzw. „kassa-display“/„kunden-display“ im Namen – dieselben Tests laufen zusätzlich in `ipad-hoch` (Display hochkant, wie die Lounge-Screenshots 1920×1080 und 820×1180). Tag setzen: `test.describe("…", { tag: "@kundendisplay" }, () => …)`. Muster dürfen den Projektnamen nicht ohne `@` enthalten (Playwright vergleicht ihn mit). `PW_ALLE=1` hebt die Filter auf.
- **ESLint-Regeln** (`eslint.config.mjs`, Inline-Plugin `platzhirsch`, kein Paket): `platzhirsch/keine-hex-farbe` (Fehler in `src/components/**` und `src/app/**`: keine `#abc`/`#aabbcc`, auch nicht in Tailwind-Klassen `text-[#…]`; Farben nur über Token aus `globals.css` bzw. die Lounge-Token in `lounge.css` – CSS-Dateien prüft ESLint nicht; erlaubt ist nur der Wert eines `<input type="color">`; Musterdaten `src/components/Entwurf/**/data.js` ausgenommen), `platzhirsch/kein-datum-input` (Fehler in `src/**`: kein `<input type="date|datetime-local|month|week">`, stattdessen `Formular/Datumsfeld`) und neu `platzhirsch/keine-versalien` (Warnung: Tailwind-Klasse `uppercase` bzw. `textTransform: "uppercase"` – Lounge verlangt Etiketten in Satzschreibung; wird Fehler, sobald der Altbestand umgestellt ist). Die frühere Warn-Ausnahme für `Charts/index.js` und `StatusBadge.js` ist entfernt (P0-2 hat die Token umgestellt).
- **Budgets** (`tools/qa/budget.mjs`, Q-L2): `cd backoffice && node tools/qa/budget.mjs [ordner] [--nur "^/kassa"] [--vergleich alt/budget.json] [--streng]`. Misst je Route den Netzwerk-Transfer in einem frischen Chromium-Kontext (gzip): JS ≤ 180 kB, Kassa ≤ 250 kB, CSS ≤ 60 kB. Im Dev werden Dev-Werkzeuge abgezogen; über Budget heißt dort „im Build prüfen“ (React-Development-Build, nicht minifiziert), die Spalte „App + Bibl.“ dient dem Vergleich zwischen Läufen. Gegen `next start` gilt das Urteil verbindlich (Exit 1 bei Verstoß). In Specs: `import { messeSeite, bewerte } from "../../tools/qa/budget.mjs"`.

## Bewegung (Team Q2, G-31)

Maßstab **art-direction/lounge.md § 8/9** (Federn statt linearer Übergänge, Druck-Feder, Kachel-Hover, Staffel, Panel/Sheet mit Feder, Zahl hochzählen, Häkchen zeichnen); wo Lounge schweigt, 04-motion.md und MASTER Q-H1…Q-H8 (nie blockieren, abbrechen statt stapeln, Kiosk, reduzierte Bewegung). **CSS:** `src/app/bo-motion.css` (in `src/app/layout.js` nach `globals.css` geladen). **JS:** `components/Backoffice/motion.js` (`"use client"`; Komponenten daraus dürfen Server-Seiten direkt rendern). Demo: `/einstellungen?tab=system&baustein=motion` (Register `lib/backoffice/demo-register.js`; Einbindung in die Einstellungsseite steht noch aus). Spec: `tests/e2e/backoffice-motion.spec.js`.

**Arbeitsteilung mit globals.css (P0-2):** Die Bewegung der Lounge-Bausteine steht am Baustein in globals.css – `.bo-knopf`/`.bo-rund`/`.bo-pfeil` (Druck-Feder 0,97/0,94/0,92, Pfeil dreht 45°), `.bo-kachel--lift` (Hub 2 px), `.bo-seg__ind`, `.bo-schalter__daumen`, `.bo-tip`, `.bo-bento[data-einblenden]` (Staffel), `.bo-chart-*`. Diese Klassen nicht doppeln und `.bo-druck` nicht zusätzlich an diese Bausteine hängen. bo-motion.css liefert alles andere.

- **Federn:** `--bo-feder` (ζ 0,72: Knöpfe, Indikatoren, Panels) und `--bo-feder-sanft` (ζ 0,9: Einblenden) – als Alias auf `--ease-feder`/`--ease-feder-weich` aus globals.css, Werte identisch mit dem Entwurf; ohne `linear()`-Unterstützung Ersatzkurven. Dauern `--bo-dur-feder 620` (= `--bo-dauer-feder`), `--bo-dur-feder-kurz 420` (= `--bo-dauer-weich`), `--bo-dur-druck 80`, `--bo-dur-erscheinen 700`, `--bo-dur-wachsen 900`, `--bo-dur-haken 520` nach `--bo-haken-verzoegerung 220`, `--bo-dur-zaehlen 900`, `--bo-staffel 30` (Kiosk 25).
- **Funktionsdauern (Q-H1-Namen):** `--bo-dur-ack 50 · fast 120 · base 160 · move 200 · slow 240 · spring 420 · draw 520`, `--bo-dur-markiert 1200`, `--bo-spinner-delay 300`; Kurven `--bo-ease-out/-in/-inout/-linear`, `--bo-ease-spring` (= `--bo-feder`). In Komponenten nur Token, keine Zahlen.
- **Reduzierte Bewegung:** Ortswechsel stehen nur unter `prefers-reduced-motion: no-preference`; bei `reduce` sind alle Feder-, Druck-, Haken-, Zähl- und Staffel-Dauern 0, Blenden (`erscheinen`, `wachsen`, `base`) 120 ms. Zahlen stehen sofort final, Häkchen gezeichnet, kein Eindrücken, keine Staffel. Information nie nur in Bewegung (Scan: Ring + Text + Symbol).
- **Erstzustand:** Erscheinen/Staffel und `useHochzaehlen` laufen beim Erscheinen (Lounge). Hart geladene Seiten zählen nicht (Hydration erkannt), Navigationen in der App schon; die Kassa-Summe zählt nie (`kiosk`).

| Klasse / Attribut | Wirkung |
|---|---|
| `.bo-druck` (+ `.bo-druck-rund` 0,94 · `.bo-druck-klein` 0,88 · `.bo-druck-flaeche` 0,98; Standard 0,97) | Druck-Feder für Ziele ohne Baustein (Kassa-Plus, Stepper, Chips, Zeilen): eindrücken 80 ms, Feder zurück; `.bo-druck-traeger` gibt als Kachel mit nach |
| `.bo-staffel` (Eltern) | Kinder erscheinen mit sanfter Feder (12 px, scale .985), je 30 ms, ab dem 8. gleich – für Listen, Reise-Spalten, Produktkacheln (Bento: `Bento` aus Kachel.js) |
| `.bo-erscheinen` + `style={staffel(i, ab)}` | einzelnes Element mit Staffel-Index (Deckel 10) und optionalem Versatz |
| `.bo-panel` | Vorschau-Panel/Warenkorb gleitet mit Feder von rechts (24 px, scale .985, 620 ms) |
| `.bo-neu` | neueste Zeile federt herein (Kassa-Korb, Kundendisplay, Packtisch) |
| `.bo-anim-pop` (mit `key={wert}`) | Zähler-Badge springt mit Feder auf |
| `.bo-gleiter` | eigener gleitender Indikator (Reiter, Leisten) – über `useGleiter` |
| `.bo-wachsen-y` / `.bo-wachsen-x` + `style={staffel(i)}` | Balken wachsen aus der Grundlinie (900 ms, ab 200 ms, +40 ms je Balken) |
| `.bo-plus-dreh` | „+“ dreht beim Hover 90° |
| `.bo-ring-bogen` | Fortschrittsring folgt dem Wert mit Feder (`stroke-dashoffset`) |
| `.bo-welle` (zweimal) | Kontaktlos-Welle am Kundendisplay |
| `.bo-anim-eintrag` / `-fade` | nachträglich neuer Listeneintrag (Opazität + 4 px), Staffel 2./3. Kind; `data-bo-viele="true"` ohne Staffel |
| `.bo-row` / `.bo-markierbar` + `data-markiert="true\|warn\|ok"` | Hervorhebung Akzent/Warn/Salbei, 1200 ms abklingend (`markiere(el, {ton})`) |
| `data-bo-wartet="true"` | gleiche Route lädt: nach 300 ms Opazität 0,6 |
| `dialog.bo-dialog` | sichtbar in 160 ms (Opazität), Form federt `scale .96→1`; Schließen 120 ms (`allow-discrete`). Löst die Keyframes aus globals.css ab |
| `dialog.bo-sheet` / `[data-seite="unten"]` | Sheet rechts (24 px) bzw. von unten (40 px, scale .96) mit Feder; Schließen 120 ms |
| `.bo-menue` | Menü/Popover/Kontextmenü: sanfte Feder von −4 px, scale .98; `--bo-menue-ursprung` |
| `.bo-toast` (`data-geht`, `data-pausiert`, `data-rueckgaengig`), `.bo-toast-balken` (`--undo-ms`, 8000ms) | Toast federt ein (12 px), aus 120 ms; Balken hält bei Hover/Fokus, steht bei `reduce` (Timer im JS ist die Wahrheit) |
| `.bo-kanban-geist`, `.bo-kanban-platzhalter` | gezogene Karte (fixed, Schatten `--bo-sh-float`) und Platzhalter |
| `.bo-scan[data-ergebnis="bereit\|erkannt\|unbekannt\|doppelt"]` (`--bo-scan-grund` = Grundschatten) | Ring statt Rahmen; „unbekannt“ schüttelt 420 ms mit Feder (nicht bei `reduce`) |
| `.bo-erfolg`, `.bo-tick` (`<Haken>`; eigene SVG mit `pathLength="1"`), `.bo-erfolg-schritte` | Erfolgsmoment federt herein; Häkchen zeichnet sich nach 220 ms in 520 ms; Knöpfe ab 320 ms |
| `.bo-anim-wachsen`, `.bo-anim-zeichnen`, `.bo-anim-enthuellen` | ältere Diagramm-Klassen (jetzt mit sanfter Feder); neu: `.bo-wachsen-y/-x` bzw. `.bo-chart-*` |
| `[data-druck="druckt"] .bo-druck-blatt` | Bon-Druck: Blatt läuft aus dem Symbol |
| `.bo-anim-puls`, `.bo-subnav[data-zu]` | Glocke-Puls; Auf-/Zuklappen über `grid-template-rows` |
| `[data-bo-kiosk]` | Kiosk: Staffel 25 ms, Listen ohne Staffel, Toast von oben |

`motion.js`:

| Export | Zweck |
|---|---|
| `DAUER`, `KURVE`, `FEDER`, `FEDER_SANFT`, `SPRING` (= `FEDER`), `SPRING_ERSATZ` | gleiche Werte wie die Token (WAAPI kennt kein `var()`) |
| `reduziert()`, `useReduziert()`, `dauer(ms)`, `blende(ms)`, `stufe(i, n, {kiosk})`, `staffel(i, ab)` | Reduzierung (Funktion bzw. Hook); Ortswechsel-Dauer; Blende ≤ 120 ms; Listen-Staffel (max. 3 Stufen); Inline-Stil `--i` |
| `animiere(el, keyframes, opts)` | `element.animate` mit Reduzierung und **Abbruch statt Stapeln**; `easing`: `"aus"\|"ein"\|"inout"\|"feder"\|"feder-sanft"` oder CSS-Text |
| `eintritt(el)`, `abgang(el)` | per JS erscheinen (12 px, sanfte Feder, 700 ms) bzw. vor dem Entfernen ausblenden und zusammenschieben |
| `merke(el)` + `flip(el, vorher, {feder})`, `lande(geist, ziel, {gueltig})` | FLIP (200 ms; `feder: true` 420 ms Feder) und Kanban-Landung (Feder; ungültig 200 ms ohne Feder) |
| `zaehle(von, nach, onWert, {dauer, dez, direktAb})`, `zwischenwert(von, nach, t, dez)` | Zählen (ausklingend, quartisch), Abbruch-Funktion für `useEffect` |
| `useHochzaehlen(wert, {beimErscheinen, kiosk, dez})`, `<ZahlHoch wert dez prefix suffix waehrung kiosk />` | Zahl zählt beim Erscheinen von 0 (900 ms), bei Änderung vom alten Wert (520 ms); Screenreader hört nur den Endwert |
| `useGleiter(wert, {selektor})` → `{ref, indikator}` | misst das aktive Kind (`aria-selected/-checked/-current/-pressed`, `data-aktiv`) und liefert Props für den Indikator; erster Stand ohne Gleiten |
| `<Haken groesse strich titel />` | Häkchen, das sich zeichnet (neu zeichnen: `key` ändern) |
| `markiere(el, {ton})` | Zeilen-Hervorhebung neu starten (`"warn"`, `"ok"`) |
| `SeitenUebergang` | `<ViewTransition enter/exit="bo-seite" default="none">` um den Seiteninhalt **in der Shell** (`<main>`), nicht im Layout: alt 120 ms aus, neu 12 px mit sanfter Feder; Browser-Zurück ohne Übergang |
| `SkelettHuelle`, `InhaltHuelle`, `Wechsel({schluessel, name})` | Suspense-Skelett aus / Inhalt ein (nur Blende); Crossfade am gleichen Ort |

View Transitions (Next 16.4.1, `import { ViewTransition } from "react"`): `::view-transition { pointer-events: none }`; die Kopfzeile der Shell heißt per CSS `bo-kopf` und wechselt ohne Blende, der Wurzel-Schnappschuss (Leiste) ebenso – die Leiste bleibt unbenannt und damit während des Übergangs klickbar. Bei `reduce` nur 120-ms-Blende. Kiosk: kein `SeitenUebergang`.

## Grundbausteine v2 im Lounge-Stil (Team P0-2)

**Maßstab (Inhaber-Entscheidungen Nr. 51/53):** `Marktresearch/digital/backoffice/art-direction/lounge.md`, Entwurfscode `src/app/entwurf/lounge/` + `src/components/Entwurf/Lounge/`, Screenshots `qa-screenshots/entwurf-lounge/`. Wo 03-design-system.md visuell abweicht, gilt Lounge. Nie: dunkler Seitenblock, umrandete Kästen-Raster, VERSALIEN-Etiketten, Bootstrap-Anmutung.
Demo aller Zustände: `/einstellungen?tab=system&baustein=grundbausteine` (nur Admin, nur Mock; Register `lib/backoffice/demo-register.js`; Einbindung in `/einstellungen` steht noch aus – Besitzer Zentrale/L0). Aufnahmen: `qa-screenshots/p0-2-lounge/`.

**Gestaltungsregeln für Fachbereiche (kurz):**
- Gliedern über **Fläche + Schatten + Abstand**, nie über Rahmen/Linien. Inhalt in `Kachel` (Radius 28, Innenabstand 24, Schatten `--bo-sh-tile`) auf der Kalk-Fläche; Unterkarten `Kachel eingelassen` (Radius 20). Zeilen/Felder 14–16, Knöpfe Pille, Rundknöpfe rund.
- Je Bildschirm **eine** Hauptaktion in Tinte (`Knopf variant="primary"`), höchstens **zwei** `Akzentkachel`n (Cognac/Salbei).
- Bezeichnungen 13/500 gedämpft, **nie VERSALIEN**; Titel: `bo-titel-gross` (34/600), `bo-titel` (22/600), `bo-titel-kachel` (17/600), Begrüßung `bo-gruss` (56/300). Alle Zahlen `tabular-nums` (gilt global), große Zahlen leicht (`bo-zahl-gross` 34/400, `bo-zahl-akzent` 64/300).
- Status immer Punkt/Symbol + Wort (`StatusBadge`, `Pille`). Farbe nur mit Bedeutung.
- Schatten nur über Laufzeit-Variablen: `shadow-(--bo-sh-tile)` bzw. `--bo-sh-btn|card|lift|float|ink` – **nicht** `shadow-bo-*`-Utilities für Neues (Tailwind schreibt Theme-Schatten fest; die Verweise `--shadow-bo*` funktionieren, sind aber nur Altbestand).
- Material (Leiste, Kopf, Sheets): `.bo-material` / `.bo-material-stark` (blur 32/40, saturate 180 %, 0,5-px-Lichtkante); Glas auf Bildern: `.bo-glas`.
- Bewegung der Bausteine steht am Baustein (Druck-Feder, Kachel-Hub, Pfeil 45°, Segment-Indikator, Schalter-Daumen, Bento-Staffel, Chart-Wachsen, Tooltip); alles Übrige in `bo-motion.css` (Team Q2). Federn: `ease-feder` / `ease-feder-weich`, Dauern `--bo-dauer-feder` (620 ms), `--bo-dauer-weich` (420 ms), `--bo-dauer-druck` (80 ms).
- Tooltip ohne JS: `className="bo-tip" data-tip="Text"` + `aria-label` (Tinte-Pille, gleitet mit Feder ein; nie einzige Informationsquelle).

**Token** (`src/app/globals.css`):
- Flächen/Rollen: `bo-bg` Kalk `#ebe7e0` (+ Licht-Verläufe `--bo-canvas-glow`), `bo-surface` Kachel `#fbfaf8`, `-surface-2` eingelassen, `-surface-3`, Text `#30373e` / `-soft #5b626a` / `-faint #62686f`, Linien 8/14 % Tinte, Füllungen `bo-fill` (5 %) / `bo-fill-2` (8 %), Material `bo-mat`, `-mat-strong`, `-mat-edge`, Glas `bo-glass`, `-glass-edge`, Fokus Cognac. Dunkel eigens gewählt (`#121416` / `#1b1e21`, Aktiv-Pille hell), per System oder `html[data-theme]` – beide Dunkel-Blöcke gleich (Unit-Test).
- Materialtöne (Punkt / `-text` / `-soft`): `bo-cognac`, `bo-eiche`, `bo-salbei`, `bo-messing`, `bo-see`, `bo-stein`, `bo-nuss`, `bo-travertin`, `bo-ziegel` (nur Problem). Status-Rollen zeigen darauf: info→Cognac, progress→See, warning→Eiche, success→Salbei, special→Messing, neutral→Stein, danger→Ziegel. Alte Namen (`bo-ok`, `bo-warn`, `st-*`, `bo-info-*` …) bleiben gültig.
- Avatare `--bo-av-<material>` (Verlauf) + `--bo-av-<material>-fg`; Akzentkacheln `--bo-ak-cognac|salbei` + `bo-ak-*-text(-2)`.
- Diagramme: `chart-1…5` = Tinte, Cognac, See, Eiche, Salbei; `chart-soft` (16 % Tinte), `chart-hi`, `chart-seq-1…5`, `chart-negativ`, `-grid`, `-axis`.
- Radien: `rounded-bo-ctl` 12 · `-zeile` 16 · `-karte` 20 · `-kachel` 28 · `-fenster` 32 · `rounded-pill`; Altnamen `rounded-bo-xs|bo|bo-lg|bo-xl` = 6/12/20/28. `corner-shape: superellipse(1.35)` als progressive Verbesserung an Kachel/Akzent/Material.
- Schrift: `-apple-system`/SF, dann **Inter** (`--font-inter`, sobald `lib/fonts.js` sie lädt), dann Instrument Sans. Bodoni Moda nur Wortmarke (`bo-wortmarke`, gesperrt 0,3 em). Strichstärke der Icons 1,75 (ab `size-8` 1,5).
- Haarlinie `--bo-hair` (1 px, Retina 0,5 px).

**Dichte**: `--bo-row-h`, `--bo-control-h-s/-/-l`, `--bo-key-h`, `--bo-cell-px`, `--bo-card-p`, `--bo-font-table`, `--bo-gap`, `--bo-segment-h` (40/44/52), dazu neu `--bo-font-body` (14/15/16), `--bo-kachel-p` (24, Kiosk 20), `--bo-kachel-p-dicht`, `--bo-bento-gap` (24, Kiosk 16), `--bo-rund` (40/44/48), `--bo-rund-s`, `--bo-pille-h` (26/28/32). Kompakt bei Maus, komfortabel bei Touch, `html[data-dichte]` erzwingt, `[data-dichte="kiosk"]` je Teilbaum fix. Umschalten: `<DichteSchalter />` / `setzeDichte()`; `DICHTE_SKRIPT` in den `<head>`.

**Bausteine:**

| Baustein | Datei | Kern-API |
|---|---|---|
| `Knopf` | `Knopf.js` | unverändert (`variant`, `size`, `href`, `icon`, `iconRechts`, `label`, `kuerzel`, `laedt`, `grund`); jetzt Pille ohne Rahmen, Druck-Feder 0,97 |
| `RundKnopf` | `Knopf.js` | `icon`, `label` (Pflicht), `href?`, `aktiv?`, `umschalter?` (aria-pressed), `badge?` (Zahl oder `true` = Punkt), `groesse` `s|m|l`, `flach?`, `kuerzel?` |
| `PfeilKnopf` | `Knopf.js` | `href?` / `onClick?`, `label` („Öffnen“), `hell?` (auf Cognac), `nurOptik?` (wenn die ganze Kachel Link ist), `groesse` |
| `Kachel` | `Kachel.js` | `titel`, `unter`, `werkzeuge`, `fuss`, `href` (Pfeil unten rechts), `lift`, `dicht`, `flach`, `eingelassen`, `as`, `ebene`, `titelId` |
| `Bento` | `Kachel.js` | 12 Spalten, Kinder mit `md:col-span-*` (Telefon einspaltig, Akzentkacheln `col-span-6`), `einblenden` (Staffel 30 ms, Standard an; Kiosk/reduziert aus) |
| `Akzentkachel` | `Kachel.js` | `ton` `cognac|salbei`, `titel`, `text`, `zahl` (zählt hoch), `format`, `einheit`, `href`, `kiosk` |
| `Kennzahl` | `Kennzahl.js` | bisherige Props + `ton` (`cognac|salbei` = Akzent), `hochzaehlen` (Standard an, außer Kiosk). Kachel 13/500 + Zahl 34/400 (schmal 28), Trend als weiche Pille, `href` → Pfeil-Knopf |
| `Zahl` | `Charts/Zahl.js` | `hochzaehlen`: zählt beim Erscheinen im Sichtbereich 900 ms von 0 (bis dahin Endwert unsichtbar am Platz, ohne Skript/bei reduzierter Bewegung sofort); Änderungen danach 400 ms |
| `StatusBadge` | `StatusBadge.js` | unverändert + `groesse` `m` (28); Töne auf Materialien abgebildet, Formen bleiben (Haken, Dreieck, Ring, halber Punkt) |
| `Pille` | `StatusBadge.js` | `material` (`MATERIALIEN`), `punkt?`, `groesse` – für Stufe/Bereich/Kanal ohne Status-Bedeutung |
| `Avatar`, `AvatarReihe` | `Avatar.js` | `name`/`kuerzel`, `material` (sonst stabil aus dem Namen), `groesse`, `ring`, `dekorativ`; Reihe: `personen[]`, `max`, `groesse`, `mehr`, `label`. Helfer `initialen()`, `materialFuer()` |
| `Segment` | `Segment.js` | bisherige API + `optionen[].anzahl` (Zähler), `variante` `tinte|hell`, `breit` (gleich breite Segmente). iOS-Kapsel, Indikator federt auf transform + Breite |
| `Schalter` | `Schalter.js` | `label`, `an` + `onWechsel` oder `standard`, `beschreibung`, `name` (verstecktes Feld „1“/„0“), `deaktiviert`, `groesse` `m|s`, `zeile` (ganze Zeile klickbar; `false` = nur Schalter) – `role="switch"` |
| `Leer` | `Leer.js` | unverändert; eingelassene Fläche statt gestricheltem Rahmen, Symbol im weichen Kreis |
| `Fehler` | `Fehler.js` | unverändert; randlose Ziegel-/Eiche-Fläche, Symbol im Kreis |
| `Charts` | `Charts/index.js` | bisherige API + `laufend` (Balken schraffiert), `kachel={false}` (in vorhandene Kachel einbetten); `hervorheben` = Bezugszeitraum in Tinte, Rest 16 %; Linie 2 px Tinte mit Verlauf; Tooltip-Pille je Balken; `FARBEN.cognac|see|eiche|salbei|weich` (Altnamen bleiben) |

```jsx
<Bento>
  <Kachel className="md:col-span-5" titel="Braucht deine Antwort" href="/crm/angebote/AN-2026-0012"
    fuss={<AvatarReihe personen={["Lena Moosbrugger", "Sarah Bösch"]} />}>…</Kachel>
  <Akzentkachel className="col-span-6 md:col-span-2" ton="cognac" titel="Neu seit gestern"
    text="Anfragen warten auf den Erstkontakt." zahl={7} href="/crm/anfragen?status=Neu" />
  <Kennzahl className="md:col-span-3" titel="Offene Angebote" wert={18640000} format="cent-rund" href="/crm/angebote" />
  <Balken className="md:col-span-4" titel="Umsatz" punkte={…} hervorheben={4} laufend="letzter" />
</Bento>
<Segment label="Status" wert={s} onWechsel={setS} optionen={[{ wert: "alle", titel: "Alle", anzahl: 24 }, …]} />
<Schalter label="Beleg per E-Mail senden" name="beleg_mail" standard />
```

Tests: `tests/unit/backoffice-grundbausteine.test.mjs` (Formate, Zählregel, Chart-Geometrie, Dunkel-Blöcke gleich, Dichte vollständig, nur definierte Token/keine Hex-Werte), E2E `tests/e2e/backoffice-grundbausteine.spec.js` (Token-Erwartungen auf Lounge-Werte nachgezogen).

## Register und Fähigkeiten (Team P0-1, G-01 · G-02 · G-04 · G-22)

**Regel für Bereiche:** Jeder Bereich schreibt nur in seine eigenen Teildateien (MASTER § 3.5); die `index`-Dateien setzen zusammen und werden nie von Bereichen geändert. Alle Teildateien für die vierzehn Bereiche existieren bereits (leer, wo noch nichts eingetragen ist): die zwölf Fachbereiche nach Q-B2, danach **Ablage** (`ablage`, App `ph_ablage`, Dateien und Ordner) und **E-Mails** (Slug `posteingang`, App `ph_microsoft`, nicht zugeordnete Mails nach Entscheidung Nr. 52 – das Wort „Posteingang“ erscheint nie in der Oberfläche, 10-konzept-crm § 15). Konsistenz prüft `tests/unit/backoffice-register.test.mjs` (doppelte Slugs, Routen, Kürzel, Nummernmuster, Seed-Besitz, QA-Pfade).

| Register | Teildatei des Bereichs | Inhalt | Zusammengesetzt in |
|---|---|---|---|
| Bereiche / Navigation / Routen | `lib/backoffice/bereiche/<b>.js` | `{ slug, titel, icon, app, module[], rollenName, rollen?{"PH CRM Mitarbeiter": "mitarbeiter"}, startseite, doctypes[], navigation?[{titel, href, icon?, doctype?, recht?}], kanban?[], routen?{ "PH …": (name?) => href } }` – `rollenName` = eigene Rollen „PH <rollenName> Mitarbeiter/Leitung“, `rollen` = weitere Fachrollen mit Zugriff laut DocType-`permissions` (z. B. CRM in Ablage und E-Mails); `auth/rechte.js` liest beides (`ROLLEN_NAMEN`, `ZUSATZ_ROLLEN`), keine fest verdrahtete Rollenliste mehr. Zentrale zusätzlich `seiten{aufgaben, benachrichtigungen, einstellungen, druck, verwaltung}` | `bereiche/index.js`: `BEREICHE` (Reihenfolge Q-B2), `ROUTEN`, `kanonischeRoute(doctype, name?)`, `umleitungFuerD()` (307 von `/d/<slug>[/<name>]`, Admin behält mit `?generisch=1` die generische Seite; `neu` leitet nie um), `navigationFuer(b, { erlaubt })` (Einträge mit `recht` nach Rechten), `pruefeBereiche()` (auch: Rollenname doppelt, Stufe ungültig, DocType in zwei Fachbereichen). Bereich ohne Navigation erscheint nicht in der Seitenleiste. |
| Palette | `lib/backoffice/suche/<b>.js` | `schnellaktionen[{id:"<b>.…", titel, href, recht:{aktion, doctype?}, rang, kuerzel?}]`, `nummernmuster[{serie:"RE-.YYYY.-.#####" \| regex, doctype}]`, `hilfe[{titel, pfad}]` | `suche/register.js` (browsertauglich: `SCHNELLAKTIONEN`, `NUMMERNMUSTER`, `HILFE`, `nummerErkennen(text)`), `suche/index.js` (Server-Suche `suche()`, `pruefeSuche()`); `suche/muster.js` (`ausSerie`, `beispielAusSerie`) |
| Kürzel | `lib/backoffice/kuerzel/<b>.js` | `[{ kontext:"liste"\|"akte"\|"karten"\|"zentrale"\|"kiosk-…", taste:"shift+r", id:"<b>.…", titel, aussenwirkung?, nurDialog? }]` – das Register hängt `@<b>` an den Kontext. Backoffice nur `shift+<buchstabe>`; Mail/Geld/Außenwirkung nur mit `nurDialog`; Kiosk F-Tasten, keine Buchstaben. Kassa (§ 2.5) und Packtisch (§ 6.6) sind schon eingetragen. | `kuerzel/index.js` (`KUERZEL`, `aufloesen`, `registriere`, `gZiele(session)`, `pruefeRegister()`), Logik `kuerzel/kern.js`, Fundament-Tasten `kuerzel/global.js` (Q-F2…Q-F4, Q-F7, G-Ziele K-10) |
| Mock-Seed | `lib/backoffice/mock/seed/<b>.js` | `anzahl{doctype:n}`, `kern{doctype:(doc,{i,r,ctx,person})=>…}`, `export default (db, hilfe) => …` (Nachlauf, eigener Zufall `hilfe.rng`), `nach[]` | `mock/seed/index.js` (`baueDatenbank`, `pruefeSeed`), Grundlage `mock/seed/basis.js`. **Die Zufallsfolge läuft über alle DocTypes** – Reihenfolge der `r`-Aufrufe in bestehenden `kern`-Funktionen nicht ändern; Neues gehört in den Nachlauf. Ablage und E-Mails haben deshalb nur Nachläufe (Ordnerbaum je Projekt mit Vorlage 01–08 und Beispieldateien inkl. Papierkorb/Check-out; drei Postfächer, weitere Adressen und Sperren) – nicht zugeordnete Mails speichert `ph_microsoft` nie, sie gehören in den Mock-Pfad von `mails_unzugeordnet`. |
| QA-Routen | `tools/qa/routen/<b>.mjs` | `[{ pfad, titel, rang?, ohneSitzung?, ersterDatensatz?, kern? }]` (Startseite + Navigation kommen automatisch) | `tools/qa/routen/index.mjs` (`alleRouten`, `pruefeRouten`); Baustein-Demos automatisch aus `demo-register.js` (`routen/fundament.mjs`) |
| Arbeitsplätze | – (nur Zentrale) | `lib/backoffice/arbeitsplaetze.js`: `{slug, titel, beschreibung, icon, href/route, kiosk, rollen[], ziffer 1–5, nurWenn?(session)}` | gelesen von `auth/rechte.js` (`erlaubteArbeitsplaetze`) |
| Betrieb (Q-A8) | – | `config.js` → `BETRIEB` / `betrieb("vierAugenGrenzeCent")`: Inhaber-Standards M-06…M-17, Blindzählung | – |

**Kürzel im Client:** `useKuerzel(kontext, { "<id>": (e, eintrag) => … })` aus `@/lib/backoffice/kuerzel/useKuerzel` – Handler über die ID, die Taste steht nur im Register; Rückgabe `false` lässt das Ereignis weiterlaufen. Einzeltasten wirken nie in `input, textarea, select, [contenteditable], [data-scan]`, Strg+Z bleibt im Feld Text-Rückgängig, Zeichenfolgen schneller als 20 ms (Scanner) lösen keine Einzeltasten aus. `useEinzeltasten()` (Schalter, `localStorage` `ph-bo:einzeltasten`, Standard an), `useFolge()`, `useMac()` (⌘-Anzeige hydrationssicher), `oeffneKuerzelDialog()`.

| Komponente | Art | Props | Zweck |
|---|---|---|---|
| `Kuerzel/KuerzelWurzel` | Client | `ziele` (= `gZiele(session)`) | In der `Shell` eingebunden: `Strg+/` Kürzel-Dialog, `G` + Buchstabe springt (Ziele nur für sichtbare Bereiche und vorhandene Seiten), Zielzeile unten links (12 px, Tinte-Karte Radius 20 mit `shadow-bo-ink`, gefüllte Tastenkappen, bricht um, `Esc` oder 1,5 s brechen ab). |
| `Kuerzel/KuerzelDialog` | Client | `offen`, `onSchliessen`, `ziele` | Durchsuchbar (Fokus im Suchfeld), gruppiert nach Kontext („Akte · Faktura“), Gruppen als eine Zeile („1 bis 9“), gleiche Wirkung als „Strg Z oder Z“, Schalter „Einzeltasten-Kürzel“ als iOS-Schalter (`bo-schalter`, `role=switch`) in eingelassener Karte; Kiosk-Tasten nicht hier (F1). Lounge: `bo-material-stark`, Radius 28, ohne Rahmen und Trennlinien, Pillen-Suche `bo-suche`, Abschnittstitel in Satzschreibung, Zeilen-Hover als Fläche. md 560 px, oben verankert. |
| `Kuerzel/KuerzelKnopf` | Client | `variant`, `size`, Kinder | Knopf „Tastenkürzel“ (öffnet den Dialog der Shell, für Hilfe-Panel/Benutzermenü). |
| `Faehigkeit` | Server (async) | `session`, `id`, `katalog?`, `client?`, `status?`, Kinder oder `({ an, deaktiviert, grund, status }) => …` | G-04/Q-A7: an → Kind; aus + erwartet → Kind deaktiviert + Hinweis; aus + nicht erwartet oder ohne Recht → nichts. Mit Funktions-Kind: `<Knopf disabled={deaktiviert} grund={grund}>` (auch für Links). Im Mock (nicht Produktion) überstimmt das Cookie `ph_bo_faehigkeiten` (QA-Lauf „alle an/aus“ ohne Neustart). |
| `FaehigkeitHinweis` | Server/Client | `status`, `id?` | Zeile „Noch nicht verfügbar – {Ersatzweg}“ (12 px, Ersatzweg als Link), ohne Server-Importe. |

**Fähigkeiten definieren** (Bereich, in `lib/backoffice/<b>/faehigkeiten.js`): `export const KASSA = definiereFaehigkeiten("kassa", { retoure: { titel, probe: { methode: "ph_kassa.…" } | { doctype, feld? } | { doctype, docmethode } | [...], ersatz: { titel, href }, erwartet?: false, grund?, recht?: { bereich, aktion } } })` → `await faehigkeit(session, "kassa.retoure", { katalog: KASSA, client })` liefert `{ an, erwartet, grund, ersatz, quelle }`; `darstellung(status)` = `an | deaktiviert | aus`. Quelle: Mock-Schalter `BACKOFFICE_MOCK_FAEHIGKEITEN` (`alle`, `keine`, `alle,-kassa.retoure`, `kassa.*`), sonst Probe gegen `Backend-Import` (DocType-JSON, Feld, `@frappe.whitelist`-Funktion); Frappe: `getMeta`-Probe (Cache 5 min), Methoden nur mit `get: true` (lesend) per Probeaufruf, sonst Freigabe durch den Betrieb in `BACKOFFICE_FAEHIGKEITEN` (dort wirkt `alle` nicht). Unbekannte ID → aus und ausgeblendet.

**Code-Erkennung** (`lib/backoffice/codes.js`, browsertauglich): `erkenneCode(text, { abholcode? })` → `{ art, wert, doctype?, name?, … }` für Event-QR `PHE1.…`, RKSV-QR `_R1-AT…`, Gutschein `PH-XXXX-XXXX-XXXX-XXXX` (Test `TEST-PH-…`), Kundenkarte `KK-XXXXXX`, Belegnummern aller Nummernkreise, Kassenbeleg `<Kasse>-000123`, EAN/GTIN mit Prüfziffer, Lageretikett `<Lagerort>/<Platz>`, Website-Link (Slug), Abholcode (nur mit Option). Formate exakt aus den Frappe-Apps.

**Hinweis für `.bo-schalter`:** Die Klasse hat (Stand P0-2) keine Grundregel – der Knopf braucht `inline-flex`, sonst bekommt die Spur als Inline-Element keine Breite und der Daumen rutscht aus der Karte.

Demo: `/einstellungen?tab=system&baustein=register` (Eintrag `register` in `demo-register.js`, Lounge-Kacheln; Einbindung in die Einstellungsseite steht bei Zentrale/L0 noch aus). Tests: `backoffice-register.test.mjs`, `backoffice-register-faehigkeiten.test.mjs`. Screenshots: `qa-screenshots/p01-register-v2/`.

## Sitzung, Freigabe und Vorlieben (Team P0-8, G-25)

Alles in `src/lib/backoffice/auth/`; keine UI-Bausteine (der Freigabe-Schritt im Dialog und das Benutzermenü bauen Kassa bzw. P0-7 im Lounge-Stil auf diese Schnittstellen).

**Sitzungs-Store** (`store.js`, `store-redis.js`, `redis.js`): `sessionStore()` liefert `MemorySessionStore` (Mock/Entwicklung) oder – sobald `BACKOFFICE_REDIS_URL` gesetzt ist – `RedisSessionStore` (Präfix `BACKOFFICE_REDIS_PREFIX`, Standard `ph-bo:`; Redis ≥ 6.0, paketloser RESP-Client). Beide erfüllen dieselbe Schnittstelle (typedef in `store.js`):
- Sitzungen `set/get/touch/update/delete`, Geräte-Cache `geraetSetzen/-Lesen/-Loeschen/geraeteListe` – unverändert, alle Aufrufer laufen weiter.
- Allgemeine Werte für Fundament-Module: `wertSetzen(k, wert, {ttlSekunden})`, `wertSetzenWennFrei` (Sperre/„genau einmal“), `wertLesen`, `wertNehmen` (atomar lesen + löschen), `wertLoeschen`, `schluesselListe(praefix)`, `gesundheit()`. Schlüssel `<namensraum>:<rest>`; vergeben: `k:` Kurzsitzung, `v:` Vorlieben, **`c:` Commit-Register (P0-3: `planeCommit` → `wertSetzen("c:"+token, absicht, {ttlSekunden})`, `commitAction` → `wertNehmen`, Nachlauf → `schluesselListe("c:")`)**.
- Redis-Ausfall → `BackofficeError("unavailable")` (fail-closed, nie still angemeldet). `get()` liefert Kopien (auch im Speicher).

**Kurzsitzung / „Freigabe am Ende“** (`kurzsitzung.js`): Zwecke `kassa.freigabe`, `logistik.leitungsfreigabe`, `projekte.leitungsfreigabe` (Leitung, Vier-Augen), `personal.stempeln-fuer` (Person bestätigt sich selbst).
```js
const session = await requireRecht("kassa", "write");
const art = freigabeArt("kassa.freigabe");          // "pin" | "passwort" → welches Feld der Freigabe-Schritt zeigt
const r = await freigeben({ zweck: "kassa.freigabe", benutzer, pin, passwort, sitzung: session },
  async (person) => backoffice(personAlsSitzung(person)).call("…", args));
// r.freigabe = { zweck, user, name, art, zeit, text: "Freigegeben von Julia" } → Protokoll/Toast
```
Zweistufig: `sitzungMitPin({benutzer, pin, zweck, sitzung, ttl: 60})` → `{token, ablauf, name}`; danach `mitKurzsitzung(token, {zweck, sitzung}, fn)` (einmal, an Zweck und Arbeitsplatz-Sitzung gebunden, max. 300 s), Abbruch `kurzsitzungVerwerfen(token)`. Mock: PIN. Frappe: Leitungsfreigaben mit Passwort, bis ph_core P9 (`sitzung_mit_pin`) da ist; Stempeln per `verify_pin`. Fehlversuche je Person + Arbeitsplatz begrenzt. Texte in `auth/texte.js`.

**Vorlieben je Benutzer** (`vorlieben.js`, Server Actions in `vorlieben-aktion.js`): `{ theme: system|hell|dunkel, dichte: auto|kompakt|komfortabel, einzeltasten: true|false }`, im Store unter `v:<user-hash>`, gespiegelt in Cookies `ph_bo_theme`, `ph_bo_dichte`, `ph_bo_einzeltasten`.
- Server: `const v = await getVorlieben()` (`dal.js`) → `<html {...vorliebenHtmlAttribute(v)}>` und `<script dangerouslySetInnerHTML={{ __html: vorliebenSkript(v) }} />` im `<head>` (schreibt die Werte in die localStorage-Schlüssel, die `Segment.js` und `kuerzel/useKuerzel.js` lesen; kein Flackern).
- Client (Benutzermenü): nach dem lokalen Umschalten (`setzeDichte`, `setzeEinzeltasten`, Theme) zusätzlich `vorliebeSpeichernAction({ dichte: "kompakt" })` – dann gilt die Wahl auch auf anderen Geräten. `vorliebenLadenAction()` für Einstellungsseiten.

## Overlays im Lounge-Stil (Team P0-4, G-06 · G-07 · G-08)

**Maßstab:** `art-direction/lounge.md` §6/§8/§9 (Material, Sheet mit Griff, Feder). Ein Einstieg: `import { Popover, Menue, MenuePunkt, MenueTrenner, MenueGruppe, Kontextmenue, Tooltip, Dialog, Fakten, Sheet, Peek, useListenPeek, usePanel, Lightbox, Bestaetigen } from "@/components/Backoffice/Overlay"`. Alles Client-Komponenten. Form/Material in `Overlay/overlay.css` (Präfix `bo-ov-`, nur Token), Öffnen/Schließen-Bewegung aus `bo-motion.css` (`dialog.bo-dialog`, `dialog.bo-sheet`, `.bo-menue`), reine Logik in `Overlay/logik.js` (unit-getestet), Texte in `Overlay/texte.js`.

**Regeln:** Unter 640 px wird alles zum Bottom-Sheet mit Griff 40×5 (Ziehen nach unten schließt, sonst federt es zurück). Popover/Menüs liegen im Top-Layer (`popover="manual"`) und bleiben im DOM beim Auslöser – damit funktionieren sie auch in Dialogen und Sheets. Gesperrte Menüeinträge nennen ihren Grund sichtbar (Q-I5); fehlende Backend-Fähigkeit → Eintrag gesperrt mit Grund oder weglassen, nie ohne Wirkung. Je Overlay höchstens eine Primäraktion in Tinte.

| Baustein | Kern-API | Verhalten |
|---|---|---|
| `Popover` | `ausloeser={(p) => <Knopf {...p}>…</Knopf>}`, `label`, `rolle` `dialog\|menu`, `platzierung` (`unten-start` … `oben-ende`, `rechts-mitte`), `fokusfalle`, `breite`, `offen`/`onOffen` (optional gesteuert), Kinder oder `({schliessen}) => …` | Material blur 40, Radius 20, Flip + 8 px Abstand, Nachführen bei Scroll/Größe; Esc, Klick daneben, Tab hinaus (ohne Fokusfalle) schließen; Fokus zurück zum Auslöser |
| `Menue` + `MenuePunkt` / `MenueTrenner` / `MenueGruppe` | Punkt: `icon`, `onWaehlen` oder `href`, `kuerzel`, `gefaehrlich`, `deaktiviert` + `grund`, `gewaehlt` (Häkchen, `menuitemradio`), `offenLassen` | `role="menu"`, ↑/↓ mit Umbruch, Pos1/Ende, Anfangsbuchstaben; ↓ am Auslöser öffnet; Zeilen 40 (Touch 44), Radius 14, Fläche statt Linie |
| `Kontextmenue` | `label`, `inhalt` (Menüpunkte), Kind = ein Element | Rechtsklick, langes Drücken (500 ms), Umschalt+F10/Kontextmenü-Taste; am Zeiger, kippt an den Rändern |
| `Tooltip` | `text`, `platzierung` (Standard `oben-mitte`), `aus`; Kind = fokussierbares Element | Tinte-Pille max. 240 px, 400 ms, Gruppe sofort, nur Maus/Tastaturfokus, im Kiosk aus, Esc/Scroll schließt, `aria-describedby`. Für `Knopf`/`RundKnopf` genügt deren `label` (CSS-Tooltip) |
| `Dialog` | `offen`, `onSchliessen(grund)`, `titel`, `text`, `groesse` `sm\|md\|lg` (400/560/800), `fuss`, `sperren`, `scrimSchliesst`, `kopf`, `rolle` | nativer `<dialog>`, Radius 32, Material, Scrim mit Unschärfe; `sperren`: kein Esc/Scrim/Ziehen |
| `Bestaetigen` | wie bisher (`offen`, `titel`, `text`, `bestaetigen`, `abbrechen`, `gefaehrlich`, `laeuft`, `onBestaetigen`, `onAbbrechen`) + `fakten[{label, wert}]`, `groesse`, `symbol` | zentriert wie ein iOS-Hinweis, Titel als Frage, Fakten-Karte, `[Abbrechen] [Primär]` gleich breit; gefährlich → Ziegel + Fokus auf Abbrechen; während `laeuft` Esc wirkungslos; am Telefon Knöpfe untereinander, Primär oben |
| `Sheet` | `offen`, `onSchliessen`, `titel`, `unter`, `groesse` `sm\|md\|lg` (400/480/640), `vollseite` (maximize-2), `werkzeuge`, `fuss`, `ungespeichert`, `panel` | schwebende Karte rechts (12 px Rand, Radius 28), Kopf 56, leichter Scrim; `ungespeichert` → Rückfrage „Ungespeicherte Änderungen verwerfen?“; `panel` spiegelt `?panel=<name>` (`usePanel(name)` öffnet beim Laden) |
| `Peek` + `useListenPeek({anzahl, panel})` | `peek`, `eintraege`, `titel(e)`, `unter(e)`, `vollseite(e)`, `fuss(e)`, Kinder `(e) => …`; Liste: `<tbody {...peek.listenProps}>`, Zeile `{...peek.zeilenProps(i)} onClick={() => peek.oeffne(i)}` | nicht modal (Liste bleibt bedienbar), Leertaste öffnet, J/K bzw. ↑/↓ blättert (auch auf der Zeile), Zeile `data-peek-aktiv` (Fläche + 3-px-Tinte-Kante), „2 von 5“, Esc schließt, Fokus zurück zur Zeile |
| `Lightbox` | `offen`, `onSchliessen`, `medien[{src, titel, typ?, alt?, vorschau?, quelle?, freigabe?{text, ton ok\|warn\|aus, download?}, download?}]`, `start`, `titel`, `herunterladen` (Recht), `onIndex` | dunkle Bühne in beiden Schemata, Glas-Bedienung; ←/→, Pos1/Ende, +/− bzw. 1×/2×, Klick zoomt an der Stelle, Ziehen verschiebt; PDF im Rahmen + „In neuem Tab öffnen“; Quelle · Freigabe als Zeile; Miniaturen; Download nur mit Recht **und** Freigabe |

```jsx
<Menue label="Aktionen" ausloeser={(p) => <Knopf {...p} icon="Ellipsis" label="Aktionen" />}>
  <MenuePunkt icon="Pencil" kuerzel="E" onWaehlen={bearbeiten}>Bearbeiten</MenuePunkt>
  <MenuePunkt icon="Download" deaktiviert grund="Noch nicht verfügbar – Export über die Faktura">An DATEV übergeben</MenuePunkt>
  <MenueTrenner />
  <MenuePunkt icon="Trash2" gefaehrlich onWaehlen={() => setFrage(true)}>Stornieren</MenuePunkt>
</Menue>
<Bestaetigen offen={frage} titel="AN-2026-0012 stornieren?" fakten={[{ label: "Kunde", wert: "Stadler" }]} bestaetigen="Stornieren" gefaehrlich laeuft={pending} onBestaetigen={stornieren} onAbbrechen={() => setFrage(false)} />
```

Demo: `/einstellungen?tab=system&baustein=overlay` (Eintrag `overlay` in `demo-register.js`; Einbindung in die Einstellungsseite steht bei Zentrale/L0 noch aus). Tests: `tests/unit/backoffice-overlay.test.mjs`, `tests/e2e/backoffice-overlay.spec.js` (überspringt, solange die Demo nicht eingebunden ist). Aufnahmen: `qa-screenshots/p0-4-overlay/`.

## Rückmeldung und Rückgängig (Team P0-3, G-03)

**Regel (Q-C3):** Workflow-Übergänge, Mails/Benachrichtigungen, Außenwirkung (Website, Hersteller, Kunde) und Geldzuordnungen laufen als **verzögerter Commit** – die Bereichs-Action plant, der Client zeigt 8 s (Kiosk 6 s) „Rückgängig“, danach führt der Server **genau einmal** aus. Einfache Feldwerte ohne Folge (Zuständig, Notiz, Fällig …) speichern sofort und zeigen nur `zeige(…)`. Keine Bereichs-Route für Undo (K-30), keine eigene Gegenaktion.

```js
// lib/backoffice/commit/aktionen/crm.js – nur der Bereich schreibt hier (Name beginnt mit "crm.")
const aktionen = {
  "crm.anfrage-annehmen": async ({ client, args, revalidiere }) => {
    await client.workflowAction("PH Anfrage", args.name, "Annehmen");   // läuft mit der Sitzung des Benutzers
    revalidiere("/crm/anfragen");
    return { name: args.name };                                          // oder { ok:false, code, message }
  },
};
// lib/backoffice/crm/actions.js ("use server") – Recht prüfen, dann planen
const r = await planeCommit(session, { action: "crm.anfrage-annehmen", args: { name }, schluessel: `annehmen:${name}`,
  objekt: { doctype: "PH Anfrage", name }, titel: `Annehmen von ${name}` });   // → { ok, token, frist, ms, objekt }
// Client
const { starte, flush } = useVerzoegerterCommit();
setStatus("Angenommen");                                                // optimistisch
starte("Anfrage angenommen", { token: r.token, ms: r.ms, objekt: r.objekt, gruppe: "crm.annehmen",
  sammel: (n) => `${n} Anfragen angenommen`, fehlerText: `Annehmen von ${name}`,
  onVerworfen: () => setStatus(alt), onFehler: () => setStatus(alt) });
await flush({ doctype: "PH Anfrage", name });                          // vor jeder Folgeaktion am selben Datensatz (Q-C4)
```

Für Workflow-Übergänge und Dokumentmethoden ohne eigene Logik gibt es `fundament.workflow` (`args {doctype, name, aktion, pfad?}`) und `fundament.methode` (`args {doctype, name, methode, args?, pfad?}`).

| Baustein | Datei | Kern-API |
|---|---|---|
| Server-Kern | `lib/backoffice/commit/kern.js` (rein, Tests) | `erzeugeCommitDienst({store, aktion, …})` → `plane`, `fuehreAus` (Sperre `c:l:<token>` über `wertSetzenWennFrei` = genau einmal), `verwerfe`, `nachlauf` (offene Tokens 30 s nach der Frist, Quelle „nachlauf“, Kommentar „Info“ am Datensatz), `status`, `meldungen`/`quittiereMeldung` (Glocke), `protokoll` (ohne Werte); `pruefeAnfrage(text)` |
| Server-Anbindung | `lib/backoffice/commit/server.js` (`server-only`) | `planeCommit(session, {action, args, schluessel, objekt, titel, ms})` (wirft TypeError bei unbekannter Aktion/nicht JSON-fähigen Args), `fuehreCommitsAus`, `verwerfeCommits`, `commitStatus`, **`commitMeldungen(session)`**, `commitMeldungQuittieren`, `commitProtokoll`, `nachlaufAnstossen()`. Store = `sessionStore()` (P0-8, Redis mit `BACKOFFICE_REDIS_URL`), Namensraum `c:` |
| Server Actions | `lib/backoffice/commit/actions.js` | `commitAction({token\|tokens})`, `verwerfeCommit(…)`, `commitStatusAction(…)`, `planeDemoCommit(…)` (nur Mock + Admin) |
| Register | `lib/backoffice/commit/aktionen/<bereich>.js` + `index.js` | je Bereich ein Objekt `name → async (ctx)`; `ctx = {session, client, args, objekt, quelle, revalidiere}`; `pruefeAktionen()` |
| Route | `app/api/undo-commit/route.js` | `POST` (Origin + Sitzung, Body `text/plain` mit JSON, sendBeacon-tauglich): `{tokens}` ausführen · `{art:"verwerfen", tokens}` · `{art:"status", tokens}` · `{art:"demo-plane", daten}` (Mock + Admin) |
| Client-Queue | `lib/backoffice/commit/warteschlange.js` (rein, Tests) | Vorgang = ein Undo-Toast; Queue je Datensatz, `gruppe`/`sammel`, Pause gedeckelt (20 s < Nachlauf), `flush(objekt?)`, `beaconAlle()`, Verwerfen mit 3 Wiederholungen; `behalteZeilen()` |
| Hooks | `lib/backoffice/commit/useVerzoegerterCommit.js` | `useVerzoegerterCommit()` → `{starte, flush, ausstehend}` (ohne Provider: sofort ausführen), `useAusstehend(objekt)`, `useCommitEreignis(fn)` |
| `ToastProvider`, `useToast`, `useToastAnker`, `ToastKarte`, `ToastBeimLaden` | `Toast.js` | siehe unten |
| `Ausstehend`, `useCommitMarke`, `useBehalteZeilen`, `useOffeneObjekte` | `Ausstehend.js` | siehe unten |

**Toast v2** (`useToast().zeige(text, { art, dauer, unter, icon, aktion:{titel, onClick} })` – API wie bisher, `art` jetzt `ok | info` (4 s) · `warnung` (6 s) · `fehler` (bleibt bis geschlossen); Undo-Toasts nur über `starte`). Lounge: Material-Karte `bo-material-stark` (blur 40, 0,5-px-Lichtkante), Radius 20, **360 px**, ohne Rahmen; Symbol im weichen Materialkreis (Salbei/Eiche/Ziegel/Füllung), Text 14/500, Unterzeile 13; „Rückgängig“ als kleine Tinte-Pille, „Jetzt ausführen“ als ruhiger Textknopf; Balken 2 px Cognac (`.bo-toast-balken`, läuft linear, hält bei Zeiger/Fokus/Berührung). Stapel 3 (Kiosk 2): gleichartige werden zusammengefasst („3-mal“), Undo/Warnung/Fehler werden nie verdrängt, darüber Pille „2 weitere Meldungen“. Schließen eines Undo-Toasts **führt aus** (nie still verwerfen). Reduzierte Bewegung: kein Balken, „Rückgängig (6 s)“ zählt. Tasten aus dem Register: `Z`, `Strg/⌘+Z` (jüngster Undo), `F8` (Meldung fokussieren), Kiosk `Strg+Z`; `Esc` berührt Toasts nie. Ort: Backoffice unten rechts (Telefon unten Mitte über der Safe-Area), Kiosk unten Mitte; `useToastAnker("#kassa-meldungen" | "oben-mitte" | …)` bindet die Meldungen einer Seite an eine Stelle (Portal). Kiosk-Erkennung über den Pfad (`/kassa`, `/packtisch`, `/montage`, `/technik`; nicht `/kassa/verwaltung`) oder `<ToastProvider kiosk toastAnker=…>`. Seite verlassen/verborgen → `sendBeacon`; Navigation in der App → `flush()`. Fehler nach Ablauf → Fehler-Toast „Annehmen von AN-… hat nicht geklappt – {Grund}“ + `onFehler` (Datensatz zurück) + Eintrag in `commitMeldungen` (Glocke, P0-7). Netz weg → Warnung, der Server-Nachlauf übernimmt.

**`Ausstehend`** (`<Ausstehend objekt={{doctype, name}} nurSymbol? />`): weiche Pille in Pillenhöhe (26/28/32), Füllung 5 % Tinte, gestrichelter Ring, 12/500 gedämpft, Restzeit-Ring 12 px – „wird in 6 s gespeichert“ · „Speichern angehalten“ · „wird gespeichert …“; rendert nichts, wenn nichts aussteht. `useCommitMarke(objekt)` → Ref für Zeile/Karte (`.bo-row`/`.bo-markierbar`), nach dem Speichern 1200 ms Salbei. `useBehalteZeilen(zeilen, (z) => "PH Anfrage:" + z.name)` hält Zeilen, die aus dem Filter fallen, bis zum Commit an ihrer Stelle.

Demo: `/einstellungen?tab=system&baustein=commit` (Eintrag `commit` in `demo-register.js`; Einbindung in die Einstellungsseite steht bei Zentrale/L0 noch aus). Entwicklungs-Haken `window.__phBoToast` (`zeige`, `starte`, `flush`, nur außerhalb des Produktions-Builds) für E2E und Abnahme-Bilder. Tests: `tests/unit/backoffice-commit.test.mjs`, `tests/e2e/backoffice-commit.spec.js`.

## Shell v2 im Lounge-Stil (Team P0-7, G-15 · G-20 · G-26 · G-27)

Maßstab `art-direction/lounge.md` § 4/6/8/9/12, Screenshots `qa-screenshots/entwurf-lounge/` und `qa-screenshots/p0-7-shell/`. Jede Seite bekommt die Hülle über `<Shell session={session}>` – keine Seite muss etwas ändern. CSS: `Shell/shell.css` (Präfix `bo-schale`, nur Token aus globals.css), Texte `Shell/texte.js`.

| Teil | Datei | Verhalten |
|---|---|---|
| Leiste | `Shell/Leiste.js` | Material-Kapsel 72 breit, 16 vom Rand, Radius 36; Bodoni-„P“ oben; Bereiche als Kreise 48 (bei vielen Bereichen und niedrigen Fenstern 40/36), aktiv = Tinte-Kreis mit Schatten, Tooltip-Pille rechts mit Feder; unten Namen ein/aus (Strg+B, `[`/`]`), Hell/Dunkel, eigener Avatar = Benutzermenü. Bereichsname ist Inhalt (Screenreader), nicht `aria-label`. Telefon: Tab-Kapsel unten, waagrecht scrollbar. |
| Kopfzeile | `Shell/Kopfzeile.js` | 88 hoch, sticky; ab 8 px Scroll Material (blur 32, Haarlinie). Bleibt `header` direkt vor `main#bo-inhalt` (View-Transition `bo-kopf`). Unter 1100 px Reiter in zweiter Reihe. |
| Pillen-Reiter | `Shell/Reiter.js`, `Shell/navigation.js` | Unterbereiche = `navigationFuer()` des aktiven Bereichs (nach Rechten). Aktiv = längster passender Navigationseintrag; Pille in Tinte gleitet (`useGleiter`). Höchstens 6 sichtbar, Rest unter „Mehr“. |
| Kopfzeilen-Slot | `Shell kopfSlot` | z. B. `<Shell session={s} kopfSlot={<><Stempelpille /><KundenmodusKnopf /></>}>` (Personal, CRM, Faktura, Projekte). |
| Befehlspalette v2 | `Shell/Befehlspalette.js`, `Shell/logik.js` | Strg/⌘+K oder runder Such-Knopf; `oeffnePalette(text)` von überall (z. B. Scanner-Code). Präfixe `>` Aktionen · `/` Bereiche · `#` Nummer · `@` Person · `?` Hilfe als Chip (Rücktaste entfernt); Betrag „1.234,50“ erkannt (Suche im Backend fehlt, siehe Übergabe); Enter wartet bis 600 ms auf den ersten Treffer; auf `/d/<slug>/<name>` Gruppe „Dieser Datensatz“. `data-testid`: `palette-oeffnen`, `palette-eingabe`. |
| Glocke v2 | `Shell/Glocke.js`, `lib/backoffice/benachrichtigungen.js` | Reiter Für mich · Team · System, Gruppen Heute/Gestern/Älter, Lesezustand, Tasten ↑↓ Enter ←→ R Umschalt+R F Esc (Kontext `glocke`). Quellen: Freigaben, eigene offene Aufgaben, Aufgaben ohne Zuständigkeit (Team), Frappe „Notification Log“ (nur Frappe). Zähler federt nur bei Zunahme. |
| Ereignisse | `app/api/ereignisse/route.js`, `Shell/ereignisstrom.js` | SSE `event: glocke {anzahl, stand}` (Server fragt gebündelt je Sitzung alle 30 s, Puffer 20 s, Strom 5 min, `retry` 60 s), `event: sitzung` bei Ablauf; `?einmal=1` = JSON (Rückfall-Polling 60 s). Client startet 4 s nach dem Laden (QA „networkidle“), pausiert bei verborgenem Tab. `useEreignisse({ onGlocke, onSitzung })`. |
| Freigaben | `lib/backoffice/freigaben/index.js`, `Shell/FreigabeEintrag.js` | Register `FREIGABE_BEREICHE` (Bereiche liefern `freigaben/<bereich>.js`, Import-Zeile trägt P0-7/L0 ein): `{art:"<bereich>.<name>", titel, geldwirksam, folge?, recht?, laden(session, client), freigeben(session, client, {name, token}), ablehnen(session, client, {name, grund})}`. Standard-Recht: Leitung des Bereichs (`cancel`). Eintrag: Antragsteller, Objekt-Chip, Betrag, Grund; geldwirksam → `Bestaetigen` mit Betrag/Folge; Ablehnen mit Pflichtgrund (≥ 5 Zeichen) und 8 s Rückgängig (beim Verlassen wird gesendet); eigener Antrag → gesperrt mit „Eigener Antrag – zweite Person nötig“. Server Actions `freigebenAction`, `ablehnenAction` (`Shell/aktionen.js`). |
| Neu-Menü | `Shell/NeuMenu.js` | Plus-Knopf, Taste `N`: Schnellaktionen „Neu …“ aus dem Paletten-Register nach Rechten. |
| Hilfe-Panel | `Shell/HilfePanel.js`, `lib/backoffice/hilfe.js`, `app/hilfe/` | Taste `?` oder Knopf; Sheet 480 (P0-4) mit Artikel der Seite aus `backoffice/hilfe/<bereich>/<seite>.md` (Kandidaten spezifisch → allgemein, z. B. `crm/anfragen-akte`, `crm/anfragen`, `crm/start`; Listen `d/<slug>`, `allgemein/liste`), „Was kann ich hier tun?“ (Unterbereiche + Aktionen nach Rechten), Kürzel der Seite. `GET /hilfe/inhalt?pfad=` bzw. `?q=` (Palette `?`). Übersicht `/hilfe`, Artikel `/hilfe/<bereich>/<seite>`. Markdown: Titel, `##`, Absätze, Listen, **fett** – kein HTML. `oeffneHilfe()` von überall. |
| Benutzermenü | `Shell/BenutzerMenu.js` | Name, Rollen; Arbeitsplätze (Ziffer 1–5 bei offenem Menü, `arbeitsplatzWaehlenAction`); Dieses Gerät; PIN ändern (Dialog, `pinSetzenAction` → ph_core `set_pin`); Darstellung Hell · Dunkel · System; Dichte; Einzeltasten-Kürzel; Tastenkürzel; **Abmelden = POST `/auth/microsoft/abmelden`** (beendet Backoffice + Frappe, bei Microsoft-Anmeldung auch Microsoft). Vorlieben lokal sofort, dann je Person über `vorliebeSpeichernAction` (P0-8). `data-testid`: `benutzer-menu`, `abmelden`, `thema-hell|dunkel|system`. |
| Thema | `Shell/Thema.js` | `html[data-theme]`, Speicher `ph_bo_theme` (hell/dunkel/system wie P0-8). `ThemaSkripte` fügt Thema- und Dichte-Skript per `useServerInsertedHTML` vor dem ersten Paint ein. `useThema()`, `setzeThema()`. |
| Testband | `Shell/Testband.js` | Eiche-Pille als erste Zeile im Inhalt (unter der Kopfzeile, rechts der Leiste) – überdeckt nichts (QA-Befund 10). |
| Sitzung | `Shell/SitzungsHinweis.js` | 2 min vor Ablauf Pille „Neu anmelden“; abgelaufen → Dialog, Anmelden im neuen Fenster, Eingaben bleiben (Q-E5). |
| Kundenmodus | `Kundenmodus/` | `KundenmodusKnopf` (Slot/Akte) startet; `html[data-bo-kundenmodus="an"]` blendet Leiste, Reiter, Werkzeuge, Palette, Kürzel, Testband und alles in **`<NurIntern>`** aus (server- und client-tauglich: Margen, EK, interne Notizen), Schrift +2 px. Rückkehr: **Langdruck 800 ms auf die Wortmarke + PIN** (`BedienerRueckkehr`, M-10; ohne registriertes Gerät im Frappe-Modus genügt der Langdruck). `useKundenmodus()`, `istKundenmodus()` (z. B. für Toasts). Je Tab in sessionStorage. Server-Seiten importieren `Kundenmodus/NurIntern` direkt (nicht das `index.js`). |
| Erstbesuch | `Erstbesuch.js` | `<Erstbesuch text="…" mehrHref? route? titel? />` unter dem Seitenkopf: 1–2 Sätze, „Mehr“ (Hilfe-Panel oder Link), „Verstanden“; gemerkt je Benutzer-Hash und Route (`ph-bo:<hash>:erstbesuch:<route>`). Nie Touren. |

Nur Entwicklung: `data-entwicklung` hebt die Leiste unten um 48 px an, damit das Next-Symbol nicht über dem Avatar liegt (im Betrieb ohne Wirkung).
Demo: `/einstellungen?tab=system&baustein=shell` (Register-Zeile `shell`). Tests: `tests/unit/backoffice-shell.test.mjs`, `tests/e2e/backoffice-shell.spec.js`.


## Akte und Vorgang im Lounge-Stil (Team P0-5a, G-12 · G-14 · G-16 · G-28)

Maßstab: `art-direction/lounge.md` §6 („Hero mit Glas-Kacheln“, „Kundenreise“), §8 und §12 sowie die Entwurfs-Kundenakte (`qa-screenshots/entwurf-lounge/3-kundenakte--*`). CSS steht in `Akte/akte.css` (Präfix `bo-akte-`, `bo-reise-`, `bo-bezuege-`, `bo-ergebnis-`, `bo-person-`, nur Token). Die Logik liegt ohne React in `lib/backoffice/akte/` (`vorgang.js`, `geruest.js`, `slots.js`, `person.js`, `ergebnis.js`, Texte in `texte.js`) und in `lib/backoffice/bezuege.js`. Einstieg: `import { AkteGeruest, AkteKopf, AkteHero, GlasKachel, GlasKnopf, GlasChip, Band, RechteSpalte, AkteTabs, Vorgangsleiste, Bezuege, AkteSlotListe } from "@/components/Backoffice/Akte"`. `AkteSlots` (Server) kommt aus `@/components/Backoffice/Akte/Slots`.

| Baustein | Datei | Kern-API |
|---|---|---|
| `AkteGeruest` | `Akte/Akte.js` | Slots `kopf`, `hero`, `band`, `reiter`, `vorgang` (`vorgangOben`), `rechts`, `seiteAktiv`, Kinder = Inhalt des aktiven Reiters. Rechte Spalte ab 1280 px sticky; darunter ersetzt sie bei `?tab=seite` den Inhalt (Q-B6). |
| `AkteKopf` | `Akte/Akte.js` | `zurueck{href,titel}` (Rundknopf), `krumen[]` (max. 3), `rechts` (Kundenkarten-Stufe, Status). Ohne Hero zusätzlich `titel` (h1), `nummer`, `status`, `betrag{cent|text,unter}`, `aktionen` (ein Primär + ⋯), `ebene` 1/2 |
| `AkteHero` | `Akte/Akte.js` | `bild{src,alt,position}`, `ueber`, `titel` (h1, weiß 48), `unter`, `chips[{icon,text}]`, `aktionen` (`GlasKnopf`, einer `hell`), `kacheln[]` (max. 4 `GlasKachel`: `titel`, `wert`, `unter`, `balken{anteil,label}`, `person`, `mittel`, `href`), `ebene`. Ohne Bild: Travertin-Fläche, Tinte-Text (kein Ersatzfoto). Unter 1100 px wandert die Glasplatte unter den Titel. |
| `Band` | `Akte/Akte.js` | `ton` `gefahr|warnung|info|neutral`, `titel`, `text`, `aktion`. Höchstens eines: `waehleBand(kandidaten[{rang,…}])` aus `lib/backoffice/akte/geruest`. |
| `AkteTabs` | `Akte/AkteTabs.js` (Client) | `tabs[{id,titel,anzahl}]` (max. 6), `aktiv` (`aktiverTab(tabs, sp.tab)`), `basis`, `params`, `param` (Standard `tab`), `mitSeite` (Knopf „Details“ unter 1280 px), `rechts` (Stufen-Pille). iOS-Segment mit Links, `Alt+1…6` über das Kürzel-Register. |
| `RechteSpalte` | `Akte/Akte.js` | `aktivitaet`, `details`, `bezuege` (je eine Kachel), Kinder davor (Beträge, Positionen), `kachel{…}` für Werkzeuge je Gruppe. |
| `Vorgangsleiste` | `Akte/Vorgangsleiste.js` (Client) | `schritte[{id,titel,zustand?,datum?,plan?,objekte[{titel,href,info}],aufgaben[{titel,person,datum,zustand,href}]}]`, `titel` („Kundenreise“, „Vorgang“, „Belegkette“), `personen?`, `naechster{titel, aktion|blocker{text,href,linkText}}`, `werkzeuge`, `kompakt` (+`mitText`), `ohneKachel`, `ohneKopf`. Zustände `erledigt|aktuell|teilweise|offen|uebersprungen` (auch `fertig`/`aktiv`); fehlt er, wird er aus den Aufgaben abgeleitet. Stufen ohne Aufgaben bekommen eine Karte aus dem letzten Beleg („noch keins“). Linien als SVG-Bezier (ResizeObserver), offen gestrichelt; Stufenname mit Belegen = Knopf mit Popover; aktuelle Stufe `aria-current="step"`; Telefon: senkrechte Liste mit Knotenlinie. |
| `Bezuege` | `Akte/Bezuege.js` | `gruppen` aus `ladeBezuege()`/`gruppiereBezuege()` (`lib/backoffice/bezuege.js`): Gehört zu · Vorher · Folgt daraus; Zähler, „+“ nur mit Anlegerecht, „nicht verknüpft“/„kein Zugriff“ als stille Zeile. |
| `AkteSlots` / `AkteSlotListe` | `Akte/Slots.js` (Server) / `Akte/SlotListe.js` | Slots eines Reiters, je Slot eigene Kachel, eigener Suspense-Rand und eigener Fehlerblock; `leer` → ruhiger Satz. |
| `ErgebnisKarte` | `Ergebnis/ErgebnisKarte.js` | `titel` (Vergangenheit + Objekt), `unter`, `zahl{titel,cent|text}`, `dokumente[{titel,info,href,icon}]`, `weiter{titel,href|onClick,kuerzel}`, `aktionen[]` (insgesamt max. 3 Knöpfe, Weiter rechts in Tinte), `kompakt`, `ohneKachel`, `primaer`. Häkchen zeichnet sich (`Haken` aus motion.js), `role="status"`. |
| `PersonZelle` | `PersonZelle.js` | `person` (Name oder `{name,kuerzel,material,rolle,abwesend}`), `groesse` 24/32, `rolle`, `eigen`, `nurAvatar`, `href`, `leerText`. Fremde Abwesenheit nur „abwesend“, die eigene mit Art und Ende; ohne Person „Niemand zugewiesen“. |

**Slot-API v1 (eingefroren 04.11.2026)** – Bereiche liefern Abschnitte für Kundenakte (`akte: "kunde"`, Reiter `uebersicht · aktivitaet · vorgaenge · projekte-belege · service · mehr`) und Auftragsmappe (`akte: "projekt"`, Reiter `uebersicht · positionen · planung · belege-lieferung · montage · dateien`). Datei `lib/backoffice/akte/slots/<bereich>.js`, Default-Export = Liste, eine Zeile in `akte/slots/index.js`:

```js
export default [{
  id: "faktura.belege", bereich: "faktura", akte: "kunde", tab: "projekte-belege", reihenfolge: 20,
  titel: "Belege",
  recht: (session) => darf(session, "faktura"),                 // optional; false/Fehler → unsichtbar
  lade: async (session, id, { client }) => client.getList("PH Rechnung", { filters: [["kontakt", "=", id]] }),
  Komponente: BelegeAbschnitt,                                    // bekommt { daten, id, akte, tab }, nie die Sitzung
  breite: "voll", leer: (d) => d.length === 0, leerText: "Noch keine Belege.", zeitlimitMs: 4000,
}];
```

Seite: `<AkteSlots akte="kunde" tab={tab} id={kontakt} session={session} ctx={{ client }} />`. Prüfen: `pruefeSlots(liste)` (Unit-Test je Bereich). Änderungen nur additiv; Brüche nur mit Version 2 und Übergabeprotokoll.

**Bezüge** (`lib/backoffice/bezuege.js`, server-seitig): `bezugsTabelle(metaIndex())` aus den DocType-JSONs (Link-Felder, Custom Fields, Dynamic Links, `links`-Abschnitte), `bezuegeVon(doctype)`, `gruppiereBezuege({doctype, doc, index, session, nachher?})`, `ladeBezuege({client, …, maxAbfragen: 6})` (Q-L3), `datensatzHref`, `listeHref` (`?f_<feld>=`), `anlegenHref`. Fehlendes Leserecht blendet Folgedokumente aus.

Demos (nur Admin, nur Mock): `/einstellungen?tab=system&baustein=akte|vorgangsleiste|ergebnis|person`. Tests: `tests/unit/backoffice-akte.test.mjs`, `tests/e2e/backoffice-akte.spec.js` (übersprungen, solange die Demos nicht in `/einstellungen` eingebunden sind). Aufnahmen: `qa-screenshots/p0-5a-akte/`.

## Drucken, Informieren, Leitung, Kassa im Lounge-Stil (Team P0-5c, G-05 · G-17 · G-18 · G-19)

Maßstab `art-direction/lounge.md` (Sheet mit Griff, Material, eingelassene Karten, eine Primäraktion in Tinte). Demo: `/einstellungen?tab=system&baustein=druck-informieren` (Register-Zeile `druck-informieren`; Einbindung in `/einstellungen` steht bei Zentrale/L0 aus). Aufnahmen: `qa-screenshots/p0-5c-druck-informieren/`. Tests: `tests/unit/backoffice-p05c.test.mjs`, `tests/e2e/backoffice-p05c.spec.js` (überspringt ohne Demo-Einbindung; `PW_DEMO_PFAD` überschreibt den Pfad).

| Baustein | Datei | Kern-API | Verhalten |
|---|---|---|---|
| `DruckPanel` | `Druck/DruckPanel.js` | `offen`, `onSchliessen`, `doctype`, `name`, `titel?`, `formate?` (Zusatz), `format?`, `pdf` (Frappe-Modus), `perEmail?()`, `emailGrund?`, `drucker?{name, erreichbar}`, `testdaten?` | Sheet 800 px: Format als Segment (≤ 4) bzw. Auswahl, „Mehrere Formate“ → Chips für Sammeldruck, Zoom Breite · 100 % · Seite, Leuchttisch mit weißem Papier, Ausgabe-Karte, Fehlerband „Drucker nicht erreichbar“ + „Als PDF öffnen“, Warteschlange dieses Objekts, Fuß Link kopieren · PDF · Per E-Mail · **Drucken** (`Strg/⌘+Enter`). PDF ohne Frappe: Knopf fehlt, Satz im Fuß. PDF-Fehler → automatisch HTML-Vorschau. |
| `useDruckTaste({kontext})` / `DruckKnopf` | `Druck/DruckPanel.js` | `[offen, setOffen]`; `DruckKnopf` = Knopf + Panel | `Strg/⌘+P` öffnet das Panel statt des Browserdrucks (Kürzel `akte.drucken` / `kiosk.drucken`). |
| `druckeFormat`, `ladeDruckDokument` | `Druck/DruckPanel.js` | `{doctype, name, format, pdf}` | **Die App sendet `X-Frame-Options: DENY`** – deshalb nie `iframe src` auf eigene Seiten: HTML-Druckansicht per fetch → `srcdoc` (Suspense-Segmente ohne Skripte aufgelöst, `<base>`, Werkzeugleiste ausgeblendet, `sandbox="allow-same-origin allow-modals"`), Frappe-PDF als blob-URL. |
| `DruckMenue` | `Druck/DruckMenue.js` | `eintraege[{id: lieferschein\|packliste\|etikett\|bon, name?, onDrucken?, deaktiviert?, grund?}]`, `pdf`, `groesse` | Kiosk-Variante als Menü; Einträge ohne Objekt/Weg gesperrt mit Grund. |
| `useDruckWarteschlange` | `Druck/warteschlange.js` | `{auftraege, hinzu, setze, entferne}` | IndexedDB `ph_bo_druck` je Gerät (Rückfall Speicher), für `/druck?tab=warteschlange` (Zentrale). |
| Register + Logik | `lib/backoffice/druck/index.js` (rein) | `DRUCKFORMATE`, `formateFuer`, `formatTitel`, `papierFuer`, `druckHref`, `pdfHref`, `vorschauMassstab`, `neuerAuftrag`, `auftragWeiter`, `sammelAuftraege`, `gruppenStand`, `raeumeAuf`, `KIOSK_DRUCK` | Formate exakt aus Backend-Import (Unit-Test gleicht ab). Neue Formate kommen über die App-Fixtures, nicht hier. |
| `Informieren` | `Informieren/Informieren.js` | `objekt{doctype,name,titel}`, `empfaenger{name,email,telefon,bevorzugt}`, `vorlagen[{id,titel,betreff,text,methode?{name,args?,felder?{an,betreff,nachricht}}}]`, `werte`, `versand` (Server), `pfad`, `briefHref?`, `offen`, `informiert?` | Chip „Kunde nicht informiert · Informieren …“ (Eiche, ⋯ „Nicht nötig“) → Sheet: Empfänger-Karte, Kanal E-Mail · Telefon · Brief (Segment), Vorlage, Vorschau wie eine Mail, „Bearbeiten“ nur wenn der Weg freien Text annimmt; Senden = verzögerter Commit 8 s; danach Chip „Kunde informiert · E-Mail heute 14:05“ (Salbei) bzw. „Nicht gesendet · Erneut senden“. Telefon/Brief = Zeitleisteneintrag. Ohne E-Mail: E-Mail gesperrt mit Satz + Ausweg. Platzhalter ohne Wert bleiben sichtbar und werden gemeldet. |
| `InformierenChip`, `InformierenSheet` | `Informieren/Informieren.js` | einzeln (z. B. „Per E-Mail“ aus dem Druckpanel) | |
| Server | `Informieren/server.js` (`server-only`) | `informierenVersand(session)` → `{exchange}`, `darfLeitungBitten(session)`, `leitungFinden`, `mailSendenCommit` | Weg: Exchange (`ph_microsoft.api.mail_senden`, Postfach der Person) **erst wenn P0-3 `"fundament.mail": mailSendenCommit` einträgt**, sonst Sende-Methode des Bereichs am Dokument über `fundament.methode` (Mailversand des Servers). |
| Actions | `Informieren/aktionen.js` | `informierenPlanenAction`, `informierenErfassenAction`, `leitungBittenAction`, `leitungStatusAction` | prüfen Sitzung + Schreibrecht am Objekt bzw. `create` auf PH Aufgabe, validieren, werfen nie. |
| `LeitungBitten` | `LeitungBitten.js` | `erlaubt` (Server: `darfLeitungBitten`), `bereich`, `bereichTitel?`, `aktion`, `aktionTitel`, `objekt`, `angefragt?`, `variante` `knopf\|menue` | prüft vor dem Öffnen, ob heute schon gefragt wurde (→ „Bereits angefragt · …“), sonst Dialog sm mit Anliegen (Zitatstrich Cognac) + Kommentar → PH Aufgabe an die Bereichsleitung mit Bezug; danach „Angefragt bei Leitung · heute 09:14 · Aufgabe öffnen“. Ohne Recht: nichts. |
| `AnDieKassa` | `AnDieKassa.js` | `variante` `zahlung\|erstattung\|gutschein`, `kunde?`, `beleg?`, `session` (Server) oder `darf` (Client, `darfAnDieKassa(session)`), `flaeche?` | „Bar oder Karte? **An der Kassa kassieren →**“ → `/kassa?kunde=&beleg=[&art=]`; ohne Kassa-Arbeitsplatz nur „Das erledigt die Kassa.“ |

```jsx
// Server-Seite einer Akte
const [darfBitten, versand] = await Promise.all([darfLeitungBitten(session), informierenVersand(session)]);
<Informieren objekt={{ doctype: "PH Projekt", name, titel }} empfaenger={…} vorlagen={PROJEKT_VORLAGEN} werte={…} versand={versand} offen={!doc.kunde_informiert_am} />
<DruckKnopf doctype="PH Rechnung" name={name} titel={`Rechnung ${name}`} pdf={client.modus === "frappe"} perEmail={…} />
<LeitungBitten variante="menue" erlaubt={darfBitten} bereich="faktura" bereichTitel="Faktura" aktion="freigeben" aktionTitel="Rechnung freigeben" objekt={{ doctype: "PH Rechnung", name }} />
<AnDieKassa session={session} kunde={doc.kontakt} beleg={name} />
```

## Seitenmuster im Lounge-Stil (Team P0-5b, G-09 · G-10 · G-11 · G-13 · G-29)

Maßstab Lounge (Nr. 51/53). Seitenkopf, Liste, Formular und Kanban sind umgestellt – alle bestehenden Seiten bekommen die neue Optik ohne Änderung (API rückwärtskompatibel, nur neue optionale Props). Demo: `/einstellungen?tab=system&baustein=seitenmuster` (Zeile `seitenmuster` im demo-register; Einbindung in `/einstellungen` steht bei Zentrale/L0 aus). Aufnahmen: `qa-screenshots/p0-5b-seitenmuster/`.

| Baustein | Datei | Kern-API |
|---|---|---|
| `Seitenkopf` | `Seitenkopf.js` (Server) | bisher + `ueber` (leichte Zeile über dem Titel), `zurueck` (href; Standard: ab vier Krumen der vorletzte = runder Zurück-Knopf wie Lounge-Akte), `kennzahlen[{wert, text}]` (≤ 3, 22/500 mit Haarlinien rechts), `titelZusatz` (Pille neben dem Titel), `unternav` (Zeile darunter), `variante` `gross` (34/600, Standard) \| `gruss` (56/300 zweizeilig). Pfad 13/500 ohne aktuelle Seite (max. 3, Q-B9), keine Linien, keine Kästen. |
| `Unternav` | `Unternav.js` (Client) | `eintraege[{titel, href, zaehler?, recht?, testid?}]`, `aktiv?` (sonst aus dem Pfad), `label`, `max` (7), `groesse` `m|s`. Kapsel 8 % Tinte, aktive Pille Tinte gleitet (useGleiter), Zähler gedimmt, Rest unter „Mehr“ (Menü P0-4), waagrecht scrollbar mit Randverlauf, `aria-current`. Pillen statt 2-px-Unterstrich (Lounge vor Q-B3). Logik `ZuTun/logik.js` (`teileUnternav`, `aktiverEintrag`). |
| `ZuTun` | `ZuTun/ZuTun.js` (Server) | `quellen[]`, `session`, `client`, `titel`, `unter`, `alleHref` (kürzt auf 5 + „Alle anzeigen“), `sicht` + `sichtBasis` (Chips Alle · Für mich · Team über `?zutun=`), `zeitlimitMs`. Jede Quelle eigener `<Suspense>` mit Zeilen-Skelett; 0 → Zeile entfällt; Fehler/Zeitlimit nur in ihrer Zeile („Konnte nicht geladen werden · Erneut“); keine Zeile → „Alles erledigt“ (CSS `:has`, ohne Client-Zustand). Zeile: Symbolkreis in Materialfläche, Satz 15/600, Nebenzeile, Zähler, genau ein Knopf (`href` oder Server Action `action({id})` über `ZuTunAktion`). |
| Zu-tun-Register | `lib/backoffice/aufgaben/index.js` (rein) | Bereiche liefern `aufgaben/<bereich>.js` (Default-Export Array) und melden die Importzeile an P0-5/L0 (`ZUTUN_BEREICHE`). Definition: `{ id:"<bereich>.<name>", icon, ton?, satz:(n)=>…, unter?, sichten?, recht?, rang?, zaehle:({session, client})=>n, lade?, knopf:{titel, href|action} }`. Helfer `pruefeQuellen`, `sichtbareQuellen`, `zaehleQuelle` (8 s, wirft nie), `zeileAus`, `mitZeitlimit`, `generischeQuellen(bereich, listen, {texte, aufgaben, anzeige})` (fällige eigene Aufgaben, Einträge im ersten Ablaufschritt – nur echte Zahlen). |
| `BereichStart` | `BereichStart.js` (Server) | bisher + `sicht`, `sichtChips`. Seitenkopf groß, oben „Zu tun“ (Register des Bereichs, sonst generisch), darunter „Listen“ als schwebende Kacheln (ganze Kachel Link, Zahl offen 34/400, Pfeil, Kanban/Neu als Pillen). `data-testid="bereich-kacheln"` bleibt. |
| `BerichtSeite` | `Bericht/BerichtSeite.js` (Server) + `BerichtTeile.js` (Client) + `aktionen.js` + `logik.js` | `bericht`, `bereich`, `titel`, `krumen`, `filter{basis, params, zeitraum, felder[{name,label,optionen}]}`, `ergebnis` (= `await ladeBericht(() => …)`: `ok|zeitlimit|fehler`), `spalten` (`summe:false` schließt aus), `diagramme` (Charts im Bento), `darfExport`, `pdfHref` (ohne → deaktiviert mit „Noch nicht verfügbar – als CSV exportieren“). Tabelle in Kachel ohne Paging mit Summenzeile; CSV nur mit Export-Recht über `berichtExportAction` (prüft Recht, protokolliert im Server-Log); Leer „Keine Daten im Zeitraum“, Zeitlimit 8 s „Zeitraum eingrenzen“. |
| `ZweiKlickKnopf` | `ZweiKlickKnopf.js` (Client) | `verb`, Kinder, `onBestaetigt`, `icon`, `size`, `variant`, `laedt`, `disabled`, `grund`, `fenster` (3000). Erster Klick → „Wirklich {Verb}?“ in weicher Ziegel-Fläche mit auslaufendem Balken, zweiter führt aus; Esc/Fokusverlust bricht ab; Ansage `aria-live`. Nur wo ein Konzept es verlangt (Shop § 3.4). |
| `Speicherleiste`, `SpeicherAnzeige` | `Formular/Speicherleiste.js` (Client) | `zuSpeichern`, `geaendert`, `laedt`, `neu`, `onSpeichern?` (sonst submit), `onVerwerfen?`, `abbrechenHref`, `stand`, `autosave?`, `speichernText`. Ruht flach („Keine Änderungen“), haftet bei Änderungen als Material-Kapsel unten (sticky, belegt Platz, Telefon über der Tab-Kapsel): „Ungespeichert · Verwerfen · Speichern“ + Strg S. `SpeicherAnzeige autosave={…}`: „Gespeichert 14:05“ / „Nicht gespeichert“ (Eiche) / Fehler mit „Erneut“. |
| `useAutosave` | `Formular/useAutosave.js` (Client), Logik `Formular/autosave.js` | `useAutosave({ speichern, verzoegerung=1000, aktiv, beacon?, startZeit, tastenkuerzel })` → `{ status, zeit, fehler, offen, aendern(werte), jetzt(), verwerfen() }`. Nie zwei Läufe gleichzeitig, Änderungen währenddessen werden nachgeholt; `pagehide`/`visibilitychange` speichert Offenes sofort (Q-C4), Strg/⌘+S. |
| `Formular` | `Formular/Formular.js` | bisher + `autosave` (Entwürfe speichern 1 s nach der Eingabe, Q-D1; Standard aus, bis die Seiten es setzen) + `onSpeichern` (eigene Action/Demo). Reiter als Kapsel mit gleitender Pille, Abschnitte als Kacheln (Radius 28), Felder als eingelassene Flächen (Radius 14, Fokus-Ring), Labels 13/500; Speicherleiste mit „Verwerfen“. `Kindtabelle` eingelassen ohne Rahmen, `WorkflowLeiste` schwebende Karte (Radius 24), `Zeitleiste` = „Verlauf“ mit Symbolkreisen und Avataren, `Datumsfeld` mit Kalenderknopf im Feld und schwebendem Kalender. |
| `DataTable` | `DataTable/DataTable.js` | bisher + `bildFeld` (Bild 48 × 48, Radius 14 je Zeile), `titelFeld`, `unterFelder[]`, `avatar` (Standard an), `zusammenfassen` (Nr. + Titel in einer Kopfzelle, Standard an), `zeilenHref(z)`, `dicht`, `ohneKachel`, `testid` (`liste`). Tabelle in schwebender Kachel (Radius 28, ohne Rahmen), Zeilen 72, Hover/Fokus als gerundete Fläche, Auswahl mit Tinte-Kante, Personen-Spalten (Link auf User oder Feldname wie `zugewiesen_an`, `berater`) mit Avatar, Status als Pille 28. Massenaktionen als Material-Kapsel unten. Telefon: Karten mit Avatar/Bild. Logik `DataTable/logik.js`. Bestehende testids bleiben (`tabelle-gesamt`, `csv-export`, `karten-liste`). |
| `Filterleiste` | `DataTable/Filterleiste.js` | unverändert in der API. Status als Pillen in einer Kapsel (Tinte = gewählt), Pillen-Suche, Knopf „Zeitraum“ öffnet schwebende Karte mit zwei Datumsfeldern, runder Filter-Knopf, „Zurücksetzen“. |
| `Kanban` | `Kanban/Kanban.js` | bisher + `onVerschiebe({name, von, nach, action})` (ersetzt die Server Action). Spalten als eingelassene Flächen (Radius 24), Karten schweben (Radius 20, Kartenschatten, Hub 2 px), Ziel-Spalte mit Tinte-Kontur, Person mit Avatar, Menü „Verschieben nach“ als Material. Tastatur und Touch-Weg unverändert. |

Texte: `ZuTun/texte.js` (Zu tun, Bereichsstart, Seitenkopf/Unternav/Zwei-Klick), `Formular/texte.js`, `DataTable/texte.js`, `Kanban/texte.js`, `Bericht/texte.js`. CSS je Ordner (`formular.css`, `datatable.css`, `kanban.css`, `zutun.css`), nur Token. Tests: `tests/unit/backoffice-seitenmuster.test.mjs` (15), `tests/e2e/backoffice-seitenmuster.spec.js` (5; Demo-Test überspringt, bis die Demo eingebunden ist – Pfad für Spiegel per `P05B_DEMO_PFAD`).

## Eingabe, Kalender und Kiosk v2 (Team P0-6, G-21 · G-22 · G-23 · G-24 · G-30)

Maßstab Lounge (§6, §7.4/§7.5, §8, §12): Kiosk mit schwebender Statuszeile als Material-Kapsel, runde Ziele ≥ 44 px, Kiosk-Dichte fix; Kalender wie Apple Kalender (ruhige Fläche, Einträge als weiche Materialflächen, heute als Tinte-Kreis, Jetzt-Linie in Cognac). Demo: `/einstellungen?tab=system&baustein=eingabe` (Register-Eintrag `eingabe`; die Einbindung in die Einstellungsseite fehlt weiter – Zentrale/L0). Aufnahmen: `qa-screenshots/p0-6-eingabe-kiosk/` (Kiosk-Routen) und `…/vorschau/` (Demo + Kiosk-Vorschau). Tests: `tests/unit/backoffice-eingabe-kiosk.test.mjs`, `tests/e2e/backoffice-eingabe-kiosk.spec.js`. CSS je Ordner (`kalender.css` Präfix `bo-kal-`, `eingabe.css` `bo-ein-`, `kiosk.css` `bo-ki-`), Texte in `texte.js` je Ordner.

| Baustein | Datei | Kern-API |
|---|---|---|
| `Kalender` | `Kalender/Kalender.js` | `eintraege[{id, quelle, titel, start, ende?, ganztag?, personen?, ort?, href?, verschiebbar?}]` (Quellen `termin · montage · einsatz · tour · abwesenheit · social · event`; Abwesenheit zeigt nie die Art), `quellen?`, `ansicht`/`startAnsicht` (`tag|woche|monat`), `datum`/`startDatum`, `von`/`bis` („07:00“), `onNeu({start, ende, tag})`, `onOeffnen(e)`, `onVerschieben(e, {start, ende})` (ohne → kein Umplanen), `jetzt?`, `hoehe?`. `role="grid"`, Roving-Fokus, ←→↑↓, Pos1/Ende, Bild↑/↓, `T`, `W/M/D`, Enter (öffnen bzw. neu), Umschalt+Enter (umplanen). Ziehen mit Maus/Stift (15-min-Raster), Touch und Tastatur über Kontextmenü bzw. Dialog „Umplanen …“. Kollision = Symbol + Text. |
| `Slotraster` | `Kalender/Slotraster.js` | `tage[]`, `belegt[]` (Einträge), `von`, `bis`, `dauer`, `schritt` (30), `wert`, `onWahl({start, ende})`, `jetzt`, `max` (8, Rest „n weitere Zeiten“). Radiogruppe mit Pfeiltasten. |
| `Raster` | `Kalender/Raster.js` | `von`, `bis` (Tage), `zeilen[{id, titel, unter?, icon?, balken[{id, titel, start, ende, material?/quelle?, verschiebbar?}]}]`, `onOeffnen`, `onNeu({zeile, tag})`, `onVerschieben(b, {start, ende}, zeile)`, `spalte` (64). Basis für Plantafel und Mini-Gantt; Balken auf Bahnen, Umschalt+←/→ verschiebt. |
| Logik | `Kalender/logik.js`, `lib/backoffice/datum.js` | `normalisiere`, `layoutTag`, `kollisionen`, `freieSlots`, `zeitraum`, `bewegeFokus`, `balkenLage`, `bahnen`; Datum neu: `wochenStart`, `wochenTage`, `kalenderwoche`, `zeitZuMinuten`, `plusMinuten`, `minutenZwischen`, `tageZwischen`, `zerlegeDatumZeit`, `tagKurz`, `tagLang`, `spanneTitel` (bestehende Exporte unverändert). |
| `BetragFeld` | `Eingabe/BetragFeld.js` | `value`/`defaultValue` (Cent), `onChange(cent)`, `name` (verstecktes Feld mit Cent), `negativ`, `maxCent`, `waehrung`, `fehler`. Komma-Modell, `inputmode="decimal"`, Fehler „Betrag im Format 1.234,50“ unter dem Feld. Logik `Eingabe/betrag.js` (`parseBetrag`, `formatBetrag`, `parseMenge` ganzzahlig). |
| `ScanTor` | `Eingabe/ScanTor.js` | `<ScanTor modus="kiosk|backoffice" onScan gesperrt abholcode onAnsage />` bzw. `useScanTor(…)`; `useScanFeld(ref, fn)` für Felder mit `data-scan="ja"`. Folgen < 30 ms + Enter = Scan; Scan-Zeichen lösen nie Kürzel aus (ein Einzelzeichen außerhalb von Feldern wird ~35 ms zurückgehalten und dann unverändert weitergegeben). Backoffice außerhalb von Feldern → Befehlspalette mit dem Code; Kiosk global, Opt-out `data-scan="nein"`. Erkennung über `lib/backoffice/codes.js`. **Die Shell sollte einmal `<ScanTor />` einhängen (P0-7).** |
| `ScanFeld` | `Eingabe/ScanFeld.js` | großes Pillenfeld (64), `onScan(code, erkannt, quelle)`, `zuletzt{text, ergebnis}`, `ergebnis` (`bereit|erkannt|unbekannt|doppelt` = Ring + Text, Fehlscan wackelt), `kamera`. |
| `KameraScan` | `Eingabe/KameraScan.js` | `offen`, `onSchliessen`, `onScan`. Rückkamera, Rahmen, Taschenlampe (wo vorhanden), Leser über `BarcodeDetector`; ohne Erlaubnis/Kamera/Leser ein ehrlicher Satz + Eingabefeld („Kamera nicht erlaubt – Nummer eintippen“). Safari hat keinen eingebauten Leser (Inhaber-Frage 60). |
| `Unterschrift` | `Eingabe/Unterschrift.js` | `erklaerung` (Pflicht), `name`, `alternativen[{wert, titel, feld?, fotoPflicht?}]`, `aktion` (Server Action, z. B. `unterschriftSpeichernAction({doctype, name, feld, …})`), `gesetzt` (nur Anzeige), `ziel`. Fläche 100 % × 200, Grundlinie gestrichelt, „Löschen“ ghost, „Übernehmen“ 48; Ergebnis PNG + SHA-256 + Zeit; einmal gesetzt nicht änderbar. |
| `FotoAufnahme` | `Eingabe/FotoAufnahme.js` | `label`, `ziel{doctype, name}`, `aktion` (Standard `dateiHochladenAction`, privat), `warteschlange` (Kiosk), `hochladen`, `max`, `onAenderung`. Kamera (`capture="environment"`) oder Datei, Vorschau 96, EXIF-Zeit, je Datei „Upload fehlgeschlagen – erneut“. |
| Server Actions | `Eingabe/aktionen.js` | `dateiHochladenAction(formData)`, `unterschriftSpeichernAction(p)` – Sitzung, Prüfwert und „schon gesetzt?“ werden serverseitig geprüft; Mock-Pfad über den MockClient bzw. ohne Ziel eine Demo-Antwort. |
| `KioskShell` v2 | `Kiosk/KioskShell.js` | bisherige API (`titel`, `geraet`, `benutzer`, `kuerzel`, `onScan`, `hilfe`) + `kontext`, `kopfSlot`, `status{text, ton}`, `baender[{art, text, aktion?}]`, `scanAus`, `toastAnker`, `idleMs` (15 min, 0 = aus), `zurueckHref`. Statuszeile (Zurück · Wortmarke · Arbeitsplatz/Gerät/Kontext · Slot · Status · Uhr · Bediener · Hilfe F1 · Hell/Dunkel · Mehr · Sperren), Band-Stapel (Q-J4), Idle-Band 30 s + Sperrbild, `data-tastatur`, Live-Region (`useKiosk().ansagen`), Warteschlangen-Pille. Kürzel über das Register (`kiosk.hilfe`, `kiosk.bediener`, `kiosk.vollbild`, `kiosk.drucken`). Schmal: Kurzform, Slot in eigener Zeile, Hell/Dunkel und Sperren im Menü. |
| Kiosk-Bausteine | `Kiosk/Zahlentastatur.js`, `Stepper48.js`, `Wischaktion.js`, `Positionsgrid.js` | `Zahlentastatur{wert, onWert, onUebernehmen, einheit, dezimalen, negativ, spalte4[{titel, wert|onClick, primaer}], uebernehmen, global}` (Tasten 64, physische Tastatur); `Stepper48{wert, onWert, min, max, label}`; `Wischaktion{links, rechts, knoepfe}` (Ziele immer auch als Knopf); `Positionsgrid{label, spalten, zeilen[{id, ton, label, zellen}], aktiv, onOeffnen}` (`role="grid"`, Roving-Tabindex). |
| Hooks | `Kiosk/hooks.js`, `Kiosk/warteschlange.js` | neu: `useEingabesperre(schluessel, 300)` (Q-J5), `useTastatur()`, `useIdle({idleMs, warnMs})`; `useScanner` jetzt mit 30 ms. Warteschlange (IndexedDB, Rückfall Speicher): `einreihen({art, daten, meta})`, `registriereSender(art, fn)`, `useWarteschlange()` → `{eintraege, text}` („2 Fotos werden gesendet“). |
| Kundendisplay-Kanal | `lib/backoffice/kanal/` | Client `browser.js`: `useKundendisplaySender(kasse, {anrede})` → `senden(nachricht)`, `useKundendisplay(kasse)` → `{nachricht, verbunden, quelle}`; gleiches Gerät BroadcastChannel `ph-kassa-<Kasse>`, sonst SSE `/api/kassa/display?kasse=…` mit Rückfall Polling 2 s, still > 15 s → „Anzeige pausiert“. `protokoll.js` bereinigt datensparsam (nur Positionen, Beträge, Zahlart, Kundenkarten-Stufe + Vorteile; Name nur nach `kundendisplay_anrede`, nie Anrede). Server: `hub.js` (Verteiler im Prozess), `route.js` (GET/POST; einzuhängen als `src/app/api/kassa/display/route.js` mit `export { GET, POST } from "@/lib/backoffice/kanal/route"`). |
