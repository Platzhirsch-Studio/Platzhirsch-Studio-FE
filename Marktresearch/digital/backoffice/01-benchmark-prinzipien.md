# 01 – Benchmark-Prinzipien für das Platzhirsch-Backoffice

**Zweck:** Prüfbare Bedienprinzipien für das eigene Next.js-Backoffice (`backoffice/`, Port 3100), abgeleitet aus dem, was moderne Admin-, CRM-, POS- und Werkzeug-Software konkret besser macht als klassische Warenwirtschaften. Jedes Prinzip ist eine Ja/Nein-Prüfung für Abnahme und Code-Review. Fachbereichs-Agenten (CRM, Faktura, Kassa, Logistik, …) bauen gegen diese Liste; das Fundament (`backoffice/src/components/Backoffice/`) deckt bereits einen Teil ab (Spalte „Fundament“).

**Stand:** 2026-11-04 · **Autor:** Benchmark-Analyst (Workflow) · **Status:** Vorschlag, keine Entscheidung des Inhabers

**Rahmen:** Platzhirsch Home Living, Lochau. Team ca. 10–15 Personen, keine IT-Profis. Ablauf nach SHD-Vorbild: Anfrage → Projekt → Angebot → Auftrag/AB → Anzahlung → Bestellung → Wareneingang → Tour → Lieferung/Montage → Service → Schlussrechnung → Mahnung → Export Kanzlei (`Backend-Import/referenz/VORBILD-SHD-sauter-held-2026-11-03.md`). Gestaltung: Tinte `#30373e`, Sand `#8a7a66`, Papier `#faf8f4`, Bodoni Moda nur für die Wortmarke, Instrument Sans für alles andere (`src/app/globals.css`, Token `--color-bo-*` in `backoffice/src/app/globals.css`).

**Verglichen:** Linear, Notion, Stripe Dashboard, Shopify Admin (Polaris / App Bridge), Lightspeed Retail X-Series, Square POS, Figma, Attio, Pipedrive, Odoo 17, SHD marahplus (nur Marketingtexte), Tribe/Loco (Möbelhandel, nicht öffentlich dokumentiert – keine belegbaren Aussagen, daher nicht zitiert).

**Lesart der Tabellen:** „Prüfung“ = so wird abgenommen. „Fundament“ = ✔ vorhanden, ◐ teilweise, ✘ fehlt (Stand Fundament-README 04.11.2026).

---

## 0. Was die Vorbilder gemeinsam haben (Kurzbefund)

| Muster | Wer | Was konkret anders ist als bei klassischer WaWi |
|---|---|---|
| Eine Befehlspalette für alles | Linear ⌘K, Odoo 17 Strg+K, Figma ⌘/ (Quick Actions), Notion ⌘P (Quick Find) | Navigation, Suche und Aktionen sind **ein** Eingabefeld; Menütiefe spielt keine Rolle mehr. |
| Tastatur als Erstklasse-Eingabe | Linear (G-Akkorde, `/` Suche, `?` Hilfe), Odoo (Alt+S speichern, Alt+C neu, Alt+J verwerfen), Stripe (`?` Kürzelliste), Figma (Strg+Shift+? Kürzel-Panel) | Jede Maus-Aktion hat ein Kürzel; die Kürzelliste ist **in der App** und durchsuchbar. |
| Speichern ohne Modus | Shopify (Save Bar erscheint bei ungespeicherten Änderungen: „Save“/„Discard“), Notion (keine Speichern-Taste, Undo ⌘Z), Linear (optimistisch, kein Spinner) | Kein „Bearbeiten“-Modus, kein Dialog „Wollen Sie speichern?“ – Zustand ist sichtbar, Rücknahme möglich. |
| Gespeicherte Ansichten statt Berichte | Shopify Index Filters (Tabs = gespeicherte Views, umbenennen/duplizieren/löschen), Attio (Views mit eigenem Filter/Sortierung, Tabelle + Kanban auf denselben Daten), Linear (Custom Views) | Mitarbeiter speichern ihre Filter als benannte Reiter; „Bericht“ ist nur eine gespeicherte Liste mit Summenzeile. |
| Gefühlte Geschwindigkeit durch lokale Daten | Linear (IndexedDB-Kopie, Schreibwarteschlange, Rebase bei Konflikt), Lightspeed X (Produkt-/Kundensuche offline aus lokalem Cache), Square (Offline-Zahlungen, später hochgeladen) | Warten ist die Ausnahme; die UI reagiert vor dem Server. |
| Kiosk = anderes Produkt in derselben App | Lightspeed X (offline nur Sell + Status), Square (Gerätemodi, Offline-Freigabe je Gerät im Dashboard) | Kassa/Packtisch haben große Ziele, wenige Wege, eigene Offline-Regeln. |
| Zeit als Signal, nicht als Spalte | Pipedrive (Sortierung nach nächster Aktivität, überfällig rot / heute grün; „Rotting“ färbt Karten nach Stillstand) | Listen zeigen, **was jetzt dran ist**, nicht nur was existiert. |

---

## A. Navigation und Orientierung

| Nr. | Prinzip | Prüfung | Begründung / Beispielquelle | Fundament |
|---|---|---|---|---|
| A1 | **Eine Befehlspalette (⌘K / Strg+K) öffnet von jeder Seite** und findet Datensätze (Nummer, Name, Telefon, E-Mail), Seiten und Aktionen („Neue Anfrage“, „Kassa öffnen“). Ergebnisgruppen: Aktionen, Zuletzt, Datensätze je DocType. ↑↓ Enter Esc. | Palette öffnet auf Zentrale, Liste, Formular, Kiosk-Verwaltung; „RE-2026-“ findet Rechnung, „Müller“ findet Kontakt und Projekt. | Linear: ⌘K führt jede Aktion aus oder springt zu jeder Seite ([linear.app/enablement](https://linear.app/enablement/guides/navigating-linear)). Odoo 17: Strg+K Command Palette ([odoo.com/documentation/17.0](https://www.odoo.com/documentation/17.0/applications/essentials/keyboard_shortcuts.html)). Figma: Quick Actions ⌘/ ([verpex.com](https://verpex.com/blog/marketing-tips/essential-figma-shortcuts-you-need-to-know)). | ✔ Shell, `suche.js` |
| A2 | **Paletten-Eingabe mit Präfix**: `>` nur Aktionen, `#` nur Belegnummern, `@` nur Personen. Ohne Präfix gemischt. | Eingabe „>neu“ zeigt nur Erstellen-Aktionen. | Muster aus VS Code / Linear; reduziert Treffermenge bei kleinem Team ohne Lernaufwand (Präfixe werden in der leeren Palette als Chips gezeigt). | ✘ |
| A3 | **G-Akkorde für Bereiche**: `G` dann `Z` Zentrale, `G P` Projekte, `G F` Faktura, `G L` Logistik, `G K` Kassa-Verwaltung, `G S` Service. Innerhalb 800 ms, Anzeige „G …“ unten links. | Akkord funktioniert außerhalb von Eingabefeldern; in Inputs nicht. | Linear „Go to“-Akkorde GI/GM/GA/GP ([pie-menu.com](https://www.pie-menu.com/shortcuts/linear)). | ✘ |
| A4 | **Seitenleiste zeigt nur Bereiche mit Rechten**, max. 9 Einträge + „Mehr“; aktiver Bereich hat Tinte-Balken 2 px links; einklappbar auf Icons (Zustand in localStorage). | Mitarbeiter Logistik sieht Zentrale, Logistik, Projekte (lesend), Personal (Selbstservice) – nicht Faktura. | Shopify Admin / Linear: Navigation nach Rolle; Rechte-Matrix `rechte.js` existiert. | ✔ Shell |
| A5 | **Brotkrumen sind klickbar und enden mit der Datensatznummer**, Titel der Seite = `<Belegnummer> · <Kunde>`; Browser-Tab-Titel identisch. | Tab zeigt „AB-2026-0042 · Fam. Huber – Platzhirsch“. | Shopify Admin: Ressourcenname als Seitentitel; erleichtert mehrere Tabs im kleinen Team. | ◐ Seitenkopf |
| A6 | **Jede Liste hat Tastatur-Navigation**: ↑/↓ (und j/k außerhalb von Inputs) wechseln die Zeile, Enter öffnet, Leertaste wählt, `x` wählt und springt weiter, Esc hebt Auswahl auf. Fokuszeile hat sichtbaren Rahmen 2 px Tinte. | Von der Palette in eine Liste springen und ohne Maus einen Datensatz öffnen. | Linear: Pfeiltasten zwischen Issues ([pie-menu.com](https://www.pie-menu.com/shortcuts/linear)); Odoo: Listennavigation per Tastatur ([odoo.com](https://www.odoo.com/documentation/17.0/applications/essentials/keyboard_shortcuts.html)). | ◐ DataTable (↑↓ Enter Leertaste) |
| A7 | **`?` öffnet die Kürzelhilfe** als durchsuchbares Overlay, kontextabhängig (Liste, Formular, Kanban, Kassa). | `?` auf Kanban zeigt Kanban-Kürzel oben. | Stripe Dashboard: `?` zeigt Kürzelliste ([stripe.com/docs/dashboard](https://stripe.com/en-dk/docs/dashboard)); Linear: durchsuchbares Shortcut-Hilfefenster ([linear.app/changelog](https://linear.app/changelog/2021-03-25-keyboard-shortcuts-help)); Figma: Strg+Shift+? ([verpex.com](https://verpex.com/blog/essential-figma-shortcuts-you-need-to-know)). | ✘ |
| A8 | **Zurück ist verlustfrei**: Browser-Zurück aus einem Formular führt in die Liste mit identischen Filtern, Seite und Scrollposition (Filter in URL-Query, Scroll in sessionStorage). | Liste Seite 3, Filter „Offen“, Datensatz öffnen, Zurück → Seite 3, „Offen“, gleiche Zeile sichtbar. | Shopify / Linear halten Listenzustand in der URL; Fundament filtert bereits per GET (`listenAbfrage`). | ◐ |
| A9 | **„Zuletzt“ und „Angeheftet“ in der Zentrale**: letzte 10 geöffnete Datensätze je Benutzer (Server-Store), anheften per Stern in Seitenkopf. | Nach Login stehen die letzten Vorgänge ohne Suche bereit. | Notion/Linear: Favoriten + Recent; passt zu „Infocenter/Auftragsmappe“ bei SHD. | ✘ |

## B. Suche

| Nr. | Prinzip | Prüfung | Begründung / Quelle | Fundament |
|---|---|---|---|---|
| B1 | **Suche ist fehlertolerant**: Belegnummern mit/ohne Präfix und Bindestriche („2026 0042“, „ab20260042“), Telefonnummern ohne Formatierung, Umlaut/ß-Varianten (Mueller = Müller). | Fünf Schreibweisen derselben Nummer finden denselben Beleg. | Lightspeed X: Produkt-/Kundensuche aus lokalem Index ([x-series-support](https://x-series-support.lightspeedhq.com/hc/articles/25534272395163)); Normalisierung muss serverseitig in `ph_core.api.suche` passieren. | ◐ `api/suche` |
| B2 | **Erste Treffer < 150 ms nach Tastendruck** (Debounce 120 ms, Abbruch alter Anfragen, zuletzt geöffnete Datensätze sofort aus Cache). | Messung in E2E: Zeit bis erste Ergebniszeile. | Linear: Lesen aus lokaler Kopie, kein Netz für Navigation ([performance.dev](https://performance.dev/what-makes-linear-feel-instant)). | ✘ |
| B3 | **Treffer zeigen Kontext**: Belegnummer, Kunde, Status-Badge, Betrag, Datum – in einer Zeile; Treffertext markiert (`<mark>`). | Zwei Rechnungen desselben Kunden sind ohne Öffnen unterscheidbar. | Stripe Dashboard-Suche zeigt Objekttyp + Betrag + Status. | ◐ |
| B4 | **Scanner ist Suche**: Jede Liste und die Palette nehmen Barcode/QR-Eingabe (schneller Zeichenstrom + Enter) und öffnen den Datensatz direkt (Produktpass, Lieferschein, Kundenkarte). | Scan eines Lieferschein-QR in der Zentrale öffnet den Lieferschein. | Lightspeed/Square: Scanner als Haupteingabe am POS; Fundament hat `useScanner` nur im Kiosk. | ◐ Kiosk-Hook |

## C. Listen und Tabellen

| Nr. | Prinzip | Prüfung | Begründung / Quelle | Fundament |
|---|---|---|---|---|
| C1 | **Gespeicherte Ansichten als Reiter über jeder Liste**: „Alle“, Systemansichten („Meine“, „Heute fällig“) und eigene (Filter + Sortierung + Spalten, pro Benutzer oder geteilt). Umbenennen, duplizieren, löschen im Reiter-Menü; Reiter hat stabile ID, nicht Index. | Mitarbeiter speichert „Offene AB ohne Anzahlung“ als Reiter; nach Neuladen vorhanden. | Shopify Index Filters: Tabs = Saved Views, create/rename/duplicate/delete ([polaris.shopify.com](https://polaris.shopify.com/components/selection-and-input/index-filters)); „Store a stable view ID“ ([shopify.dev](https://shopify.dev/docs/apps/build/app-home/migrate-from-polaris-react/index-filters)). Attio: Views mit eigenem Filter/Sortierung ([attio.com/help](https://attio.com/help/reference/managing-your-data/views)). | ✘ (Filterleiste nur ad hoc) |
| C2 | **Filterleiste in einer Zeile**: Volltext, Status-Chips (Mehrfach), Datum, dann „+ Filter“ mit Feldauswahl aus Meta. Aktive Filter als entfernbare Chips; „Zurücksetzen“ nur sichtbar, wenn Filter aktiv. | Kein Filter-Dialog; drei Klicks maximal bis zur Eingrenzung. | Shopify Index Filters, Linear Filter-Chips. | ◐ |
| C3 | **Auswahl und Massenaktionen**: Checkbox-Spalte, Kopf-Checkbox wählt Seite, Banner „Alle 312 wählen“ für die Gesamtmenge; Massenaktionen in schwebender Leiste unten (Status setzen, Drucken, Exportieren, Zuweisen), mit Anzahl und Esc zum Abbrechen. | „Alle“ ist eindeutig definiert (Seite vs. gesamte Abfrage) und sichtbar. | Shopify: „Define what all means“ ([shopify.dev](https://shopify.dev/docs/apps/build/app-home/migrate-from-polaris-react/select-all-actions.md)); Polaris-Hinweis, Massenaktionen nicht zu verstecken ([ownego polaris-vue](https://ownego.github.io/polaris-vue/components/IndexTable)). | ◐ |
| C4 | **Inline-Bearbeitung einfacher Felder in der Liste** (Status, Zuständig, Termin, Priorität) per Klick/Enter auf der Zelle, Speichern optimistisch, Fehler setzt zurück. Betrags- und Pflichtlogik-Felder bleiben im Formular. | Status in Liste ändern ohne Seitenwechsel, Undo-Toast erscheint. | Attio/Linear/Notion: Tabellen sind editierbar; spart für 10–15 Personen die meisten Formularaufrufe. | ✘ |
| C5 | **Tabelle und Kanban sind dieselbe Abfrage**: Umschalter im Seitenkopf (Liste / Karten / Kalender wo sinnvoll), Filter bleiben erhalten, URL `?ansicht=kanban`. | Umschalten verliert keinen Filter. | Attio: Table/Kanban auf denselben Records ([attio.com/help](https://attio.com/help/reference/managing-your-data/views)); Pipedrive Pipeline = Kanban der Deals ([support.pipedrive.com](https://support.pipedrive.com/en/article/pipeline-view)). | ◐ (Kanban separat) |
| C6 | **Zeit als Farbsignal**: Spalte „Nächster Schritt“ mit Fälligkeitspunkt (rot überfällig, Sand heute, grau später); Standardsortierung in Arbeits-Listen = nächster Schritt, nicht Erstellungsdatum. Karten ohne Bewegung > X Tage (je DocType konfigurierbar) erhalten „ruht seit 12 Tagen“-Hinweis. | Kanban „Angebote“ zeigt ruhende Karten mit Hinweis; Liste beginnt mit Überfälligem. | Pipedrive: Sortierung nach nächster Aktivität, überfällig rot/heute grün; Rotting färbt Kacheln ([support.pipedrive.com](https://support.pipedrive.com/en/article/the-rotting-feature)). | ✘ |
| C7 | **Summenzeile und Zähler**: Listen mit Beträgen zeigen Summe der gefilterten Menge und der Auswahl (Netto/Brutto nach Spaltenwahl), Zähler „312 Einträge“. | Offene-Posten-Liste zeigt Summe ohne Report-Aufruf. | Odoo Listen: Gruppierung mit Summen; ersetzt viele SHD-„Berichte“. | ✘ |
| C8 | **Gruppierung nach Feld** („Gruppieren nach Status/Kunde/Woche“), Gruppenköpfe einklappbar mit Anzahl und Summe. | Rechnungen nach Monat gruppiert mit Monatssumme. | Odoo/Notion/Linear-Gruppierung. | ✘ |
| C9 | **Spaltenwahl, -breite, -reihenfolge pro Benutzer und Ansicht**, Reset auf Standard; Nummern rechtsbündig, Tabellenziffern (`font-variant-numeric: tabular-nums`), Datum relativ („vor 2 Std.“) mit absolutem Tooltip. | Breite überlebt Neuladen; Beträge stehen untereinander. | Stripe/Shopify-Tabellen; Fundament speichert Spaltenwahl in localStorage. | ◐ |
| C10 | **Zeilen-Schnellmenü** (`…` oder Rechtsklick / Shift+F10): Öffnen in neuem Tab, Drucken, Duplizieren, Status setzen – ohne Formular. | Rechtsklick auf Zeile zeigt Menü; Tastatur erreicht es. | Linear/Attio Kontextmenüs; Notion-Blockmenü. | ✘ |
| C11 | **Leer-Zustände erklären und handeln**: Icon, ein Satz („Noch keine Lieferscheine für heute“), eine Primäraktion („Lieferschein anlegen“) oder Filter-Hinweis („Filter ‚Status‘ entfernen“). Nie leere Tabelle mit Kopfzeile allein. | Jede Liste hat zwei Leer-Varianten (keine Daten / kein Treffer). | Polaris Empty State; Linear Empty Views. | ✔ `Leer` |

## D. Formulare und Speichern

| Nr. | Prinzip | Prüfung | Begründung / Quelle | Fundament |
|---|---|---|---|---|
| D1 | **Kein Bearbeiten-Modus**: Felder sind direkt editierbar (bei Schreibrecht); Lesemodus nur bei gebuchten Belegen (docstatus 1) mit Hinweisband „Gebucht – nur Stornieren/Ändern-Kopie“. | Formular öffnen, tippen, fertig. | Shopify/Notion/Attio arbeiten ohne Edit-Modus; Frappe-Desk braucht ihn ebenfalls nicht. | ✔ |
| D2 | **Änderungen werden durch eine Speicherleiste sichtbar**: sobald ein Feld abweicht, erscheint oben eine Leiste „Ungespeichert · Speichern (Strg+S) · Verwerfen“, Einblenden 160 ms ease-out; Seitentitel erhält „•“. Verlassen mit ungespeicherten Änderungen fragt einmal. | Leiste erscheint beim ersten Tastendruck, verschwindet nach Speichern (200 ms). | Shopify Save Bar: erscheint bei ungespeicherten Änderungen, Verben ohne Substantiv „Save“/„Discard“ ([polaris.shopify.com](https://polaris.shopify.com/components/deprecated/contextual-save-bar), [shopify.dev App Bridge](https://shopify.dev/docs/api/app-bridge-library/apis/contextual-save-bar)). | ✘ |
| D3 | **Kleine Zustandsänderungen speichern implizit mit Undo-Toast** (Status, Zuweisung, Kanban-Zug, Checkbox in Liste): Toast unten links „Status → Versendet · Rückgängig (Z)“, 6 s, Pause bei Hover; Strg+Z im Toast-Zeitraum macht rückgängig. | Kanban-Zug zurücknehmbar ohne erneutes Ziehen. | Notion: Undo ⌘Z + Undo-Schaltfläche ([whalesync.com](https://whalesync.com/blog/how-to-undo-in-notion)); Linear: optimistisch ohne Spinner ([performance.dev](https://performance.dev/what-makes-linear-feel-instant)). | ◐ Toast ohne Undo |
| D4 | **Tastenkürzel im Formular**: Strg+S speichern, Strg+Enter speichern & schließen, Alt+N neu, Esc verwerfen (mit Rückfrage, wenn geändert), Strg+P drucken, Alt+→/← nächster/voriger Datensatz der Liste. | Alle Kürzel funktionieren mit Fokus im Textfeld außer Esc in Dropdowns. | Odoo 17: Alt+S speichern, Alt+C neu, Alt+J verwerfen ([odoo.com](https://www.odoo.com/documentation/17.0/applications/essentials/keyboard_shortcuts.html)); Linear: ↑↓/J K zwischen Issues. | ✘ |
| D5 | **Validierung inline beim Verlassen des Feldes**, Fehlerliste oben mit Sprung-Links beim Speichern; Pflichtfelder markiert; Fehlertext sagt, was zu tun ist („Postleitzahl: 4 Ziffern (AT) oder 5 (DE)“). Kein Fehler nur rot ohne Text. | Speichern mit zwei Fehlern zeigt Liste mit zwei Links; Klick fokussiert das Feld. | Polaris Form Validation; zod-Schema aus Meta liegt im Fundament. | ◐ |
| D6 | **Konflikt statt Überschreiben**: Speichert ein Kollege zwischenzeitlich, zeigt das Formular „Geändert von Anna um 14:02“ mit Feld-Diff und den Optionen „Neu laden“ / „Meine Werte übernehmen“ (nur unterschiedliche Felder). | Zwei Tabs, beide ändern, zweiter bekommt Diff, kein stummer Verlust. | Linear: Rebase lokaler Schreibvorgänge auf Server-Deltas ([performance.dev](https://performance.dev/what-makes-linear-feel-instant)); Fundament prüft `modified`. | ◐ |
| D7 | **Link-Felder sind Schnellsuche mit Anlegen**: Tippen → Vorschläge (Name + Zusatz + Status), Enter übernimmt, „+ ‚Huber Maria‘ anlegen“ als letzte Option öffnet Seitenpanel (Drawer) ohne Formular zu verlassen; Rücksprung füllt das Feld. | Kunde aus dem Angebot heraus anlegen, Angebot bleibt offen. | Odoo „Create and edit“, Attio Inline-Record; `/api/link` existiert. | ◐ |
| D8 | **Kindtabellen bedienbar wie Tabellenkalkulation**: Tab/Enter springen zellenweise, Enter in letzter Zelle legt Zeile an, Alt+↑/↓ verschiebt, Zeilenmenü dupliziert; Beträge aus Cent, Summenzeile live. | Positionen eines Angebots ohne Maus erfassen. | Odoo One2many-Editable; Lightspeed Sell-Grid. | ◐ |
| D9 | **Automatisches Entwurfs-Sichern** von „neu“-Formularen in sessionStorage (alle 5 s, pro Route) mit Hinweis „Entwurf vom 14:02 wiederherstellen?“. | Tab schließen, erneut öffnen → Entwurf angeboten. | Notion/Linear: keine verlorene Eingabe; wichtig bei iPad-Tab-Verlust. | ✘ |
| D10 | **Seitenpanel (Drawer) statt neuer Seite für Schnellansicht**: Klick in Liste mit Leertaste/Shift+Klick öffnet Datensatz rechts (420 px, Einblenden 200 ms cubic-bezier(.2,.8,.2,1)), Liste bleibt navigierbar (↑↓ wechselt Inhalt). | Fünf Anfragen nacheinander sichten ohne Seitenwechsel. | Linear Peek-Ansicht, Notion Side Peek, Attio Record-Preview. | ✘ |

## E. Aktionen, Workflow, Rückfragen

| Nr. | Prinzip | Prüfung | Begründung / Quelle | Fundament |
|---|---|---|---|---|
| E1 | **Genau eine Primäraktion je Seite**, in Tinte, rechts im Seitenkopf; alle weiteren als Sekundär/Overflow (`…`). Workflow-Übergänge zeigen den nächsten Schritt als Primäraktion („Anzahlungsrechnung erstellen“). | Keine Seite mit zwei Tinte-Buttons. | Polaris Page Actions; Fundament: „höchstens eine `variant=primary`“. | ✔ |
| E2 | **Irreversibles fragt genau einmal, reversibles nie**: Stornieren, Löschen, Mahnung versenden → Dialog mit Konsequenz in einem Satz und Primärverb („Stornieren“); Statuswechsel, Zuweisung → sofort + Undo-Toast. | Liste aller Aktionen mit Klassifikation reversibel/irreversibel je Bereich. | Shopify/Polaris Destructive Actions; Notion Undo. | ◐ `Bestaetigen` |
| E3 | **Mehrschritt-Aktionen laufen im Dialog mit Vorschau** (z. B. „Anzahlungen verrechnen“, „Zahlung zuordnen“, „Tour planen“): Schritt 1 Auswahl, Schritt 2 Vorschau mit Zahlen, Schritt 3 Ergebnis mit Links; Abbruch jederzeit, Fortschritt oben. | Keine Aktion, die ohne Vorschau Geld bewegt. | Stripe Refund-Dialog mit Betrag und Konsequenz; SHD rw7 Anzahlungsverrechnung als Ablauf. | ✘ |
| E4 | **Lange Aktionen (Export, PDF-Stapel, Preislistenimport) blockieren nicht**: Toast „Export läuft …“ → Glocke zeigt Ergebnis mit Download; Seite bleibt bedienbar. | Export von 5 000 Zeilen starten, weiterarbeiten, Benachrichtigung erhalten. | Shopify Exporte per E-Mail/Notification; Linear Hintergrundjobs. | ✘ |
| E5 | **Zeitleiste am Datensatz zeigt Menschen, nicht Technik**: „Anna hat Status auf Versendet gesetzt · vor 2 Std.“, Kommentare mit @Erwähnung, Anhänge mit Vorschau; technische Versionen eingeklappt. | Zeitleiste ohne JSON-Diff lesbar. | Linear Activity, Attio Timeline; `docinfo` liegt vor. | ◐ `Zeitleiste` |
| E6 | **Nächster-Schritt-Hinweis am Beleg**: Band oberhalb des Formulars mit Phasenleiste (Angebot → AB → Anzahlung → Bestellung → Lieferung → Rechnung) und fehlender Voraussetzung („Anzahlung offen: 3 200 €“). | Jede AB zeigt ihre Position im Ablauf. | SHD Infocenter/Auftragsmappe; Shopify Order-Timeline mit Status-Badges Payment/Fulfillment. | ✘ |

## F. Kiosk / POS (Kassa, Packtisch, Montage, Technik)

| Nr. | Prinzip | Prüfung | Begründung / Quelle | Fundament |
|---|---|---|---|---|
| F1 | **Kiosk zeigt nur, was offline funktioniert**: Kassa offline = Verkauf, Bon, Statusseite; Verwaltung ausgegraut mit Hinweis. Packtisch offline = Scannen und Abhaken (Warteschlange). | Netz trennen → Verkaufen weiter möglich, Verwaltung meldet „offline“. | Lightspeed X: offline nur Sell + Status, Quick Keys und Produktsuche weiter nutzbar ([x-series-support](https://x-series-support.lightspeedhq.com/hc/articles/25534272395163)). | ◐ `useVerbindung` |
| F2 | **Offline-Zahlungen nur mit Freigabe je Gerät und Betragsgrenze**, Warteschlange sichtbar („3 Zahlungen warten · 1 240 €“), Hochladen automatisch bei Verbindung, Warnung vor App-Neuinstallation/Logout mit offener Warteschlange. | Verwaltung → Gerät → „Offline-Zahlungen erlauben, max. 500 €“. | Square: Offline-Freigabe je Gerätemodus, Transaktionslimit, Upload binnen 24 h, Risiko beim Händler ([squareup.com/help 7777](https://squareup.com/help/us/en/article/7777-process-card-payments-with-offline-mode)). Lightspeed Payments: Offline vorab aktivieren ([x-series-support](https://x-series-support.lightspeedhq.com/hc/articles/25534272395163)). | ✘ (Kassa-Agent) |
| F3 | **Schnelltasten-Raster** auf der Kassa (konfigurierbare Kacheln je Standort: Lieferpauschale, Gutschein, Anzahlung auf AB, Musterverkauf), Kacheln ≥ 96 × 72 px, Bild oder Farbe, auch offline. | Layout in Verwaltung anlegen, erscheint am Gerät. | Lightspeed X Quick Keys (Sell > Settings) ([x-series-support](https://x-series-support.lightspeedhq.com/hc/articles/25534272395163)). | ✘ |
| F4 | **Touch-Ziele ≥ 48 px, Abstand ≥ 8 px, Schrift ≥ 18 px, Betrag ≥ 40 px**; keine Hover-Zustände als einzige Rückmeldung; Druck-Feedback 80 ms Skalierung 0.97. | Prüfung auf iPad 10,9″ im Querformat ohne Zoom. | Square/Lightspeed iPad-Register; Fundament: Kiosk ≥ 48 px. | ✔ |
| F5 | **Funktionstasten belegt und am Bildschirm angezeigt**: F2 Kunde, F4 Zahlung, F6 Rabatt (Leitung), F8 Bon parken, F9 Bon nachdrucken, F12 Bedienerwechsel; Legende unten (ein-/ausblendbar). | Kassenablauf komplett mit Tastatur + Scanner. | Klassische Kassensysteme + Lightspeed Keyboard Shortcuts ([retail-support.lightspeedhq.com](https://retail-support.lightspeedhq.com/hc/en-us/articles/228839547-Keyboard-shortcuts)). | ◐ `useTastenkuerzel` |
| F6 | **Bedienerwechsel in < 3 s**: PIN-Feld mit Ziffernblock, Benutzer-Kacheln mit Initialen, Rücksprung in denselben Bon; Idle-Sperre 15 min mit sanfter Abdunklung (400 ms). | Wechsel ohne Passwort, Bon bleibt. | Square/Lightspeed Passcode-Wechsel; Entscheidung Nr. 49. | ✔ `/wechsel` |
| F7 | **Montage/Technik mobil = eine Karte pro Einsatz**: Oben Kunde/Adresse (Tap → Navigation), Mitte Checkliste, unten große Buttons „Fotos“, „Unterschrift“, „Abschließen“; Fotos und Unterschrift werden offline gepuffert; Bericht ist mehrsprachig druckbar. | Einsatz ohne Netz abschließen, Sync bei Verbindung. | SHD mex: Navigation, Fotos vorher/nachher, Unterschrift, mehrsprachige Berichte (Vorbild-Datei). | ✘ (Projekte/Service-Agent) |
| F8 | **Verbindungs- und Druckerstatus sind immer sichtbar** (Kopfzeile: grüner/sandfarbener Punkt + Text „Online“/„Offline seit 14:02“, Drucker-Icon mit Zustand); Fehler beim Bon-Druck bietet „Erneut“ und „Als PDF“. | Drucker aus → Hinweis in < 5 s, Verkauf nicht blockiert. | Lightspeed: Fehlerbehebung Offline-Anzeige ([x-series-support](https://x-series-support.lightspeedhq.com/hc/articles/25534272395163)). | ◐ |

## G. Mobil und Tablet (Backoffice-Teil)

| Nr. | Prinzip | Prüfung | Begründung / Quelle | Fundament |
|---|---|---|---|---|
| G1 | **Jede Liste hat eine Kartendarstellung < 768 px**: Titel, zwei Nebenwerte, Status, Fälligkeit; Filter als Bottom-Sheet; Massenaktionen über Langdruck. | Rechnungsliste auf iPhone lesbar ohne horizontales Scrollen. | Shopify Admin Mobile, Attio Mobile. | ✘ |
| G2 | **Formular mobil = Abschnitte als Akkordeon, Primäraktion als Sticky-Footer**, Kindtabellen als Kartenliste mit „+ Position“. | AB auf iPad hochkant bearbeitbar. | Shopify Admin Mobile Order-Edit. | ✘ |
| G3 | **Kamera als Eingabe**: Foto-Feld öffnet Kamera direkt (`capture`), QR-Scan über Kamera, wenn kein Scanner. | Wareneingang-Foto in zwei Taps. | SHD mex Fotos; Square Scan per Kamera. | ✘ |

## H. Onboarding und Hilfe

| Nr. | Prinzip | Prüfung | Begründung / Quelle | Fundament |
|---|---|---|---|---|
| H1 | **Arbeitsplatz-Auswahl nach Login ist selbsterklärend**: Kacheln mit Icon, Name, Satz („Kassa – Verkauf am Tresen, Vollbild“), gemerkte Wahl vorausgewählt, Enter bestätigt. | Neuer Mitarbeiter wählt ohne Anleitung. | Square Gerätemodi; Entscheidung Nr. 49. | ✔ |
| H2 | **Jede Seite hat ein „?“-Panel mit drei Dingen**: Was ist das, nächste Schritte, Kürzel. Text aus Markdown je Route (`hilfe/<route>.md`), vom Fachbereich gepflegt. | Panel auf Liste, Formular, Kanban, Kiosk-Verwaltung vorhanden. | Linear Shortcut-Hilfe, Stripe Dashboard-Hilfe; ersetzt Schulungsunterlagen. | ◐ `hilfe` im Kiosk |
| H3 | **Leere Mandanten starten mit Beispielvorgang**: Zentrale zeigt bei 0 Datensätzen eine Checkliste „Erste Schritte“ (Kunde anlegen → Angebot → AB → Anzahlung), abhakbar, verschwindet nach Abschluss. | Frischer Mock zeigt Checkliste; nach 4 Schritten weg. | Shopify Setup-Guide im Admin. | ✘ |
| H4 | **Fachbegriffe einheitlich und deutsch**: Glossar (Anfrage, Projekt, Angebot, Auftragsbestätigung, Anzahlung, Lieferschein, Tour, Montage, Servicefall, Gutschrift); keine Frappe-Begriffe (Submit, Cancel, Amend → Buchen, Stornieren, Ändern-Kopie) in der Oberfläche. | Grep über `backoffice/src` nach „Submit“, „DocType“, „Doctype“ in UI-Strings ergibt 0 Treffer. | Frappe bleibt unsichtbar (Entscheidung Nr. 48). | ◐ |

## I. Fehler, Leer- und Ladezustände

| Nr. | Prinzip | Prüfung | Begründung / Quelle | Fundament |
|---|---|---|---|---|
| I1 | **Fehler nennen Ursache, Folge, Ausweg** in drei kurzen Zeilen plus Code klein; immer „Erneut versuchen“; nie Stacktrace, nie leere Seite. Rechtefehler sagen, wen man fragt („Nur Leitung Faktura – z. B. Anna“). | Frappe nicht erreichbar → Liste zeigt letzten Stand (wenn gecacht) + Fehlerband. | Polaris Banner Critical; `BackofficeError{code}` vorhanden. | ✔ `Fehler` |
| I2 | **Skeleton statt Spinner** für Listen/Formulare (gleiche Höhen wie Inhalt), erscheint erst nach 200 ms, Übergang Inhalt 120 ms Opacity. Kein Layout-Sprung (CLS = 0 auf Liste/Formular). | Lighthouse/E2E: CLS 0; Spinner nur in Buttons. | Linear/Stripe: Skeleton-Ladezustände. `DataTableSkeleton` vorhanden. | ◐ |
| I3 | **Optimistische UI mit Rückfall**: Zustandsänderungen sofort anzeigen, bei Serverfehler zurücksetzen + Toast „Konnte nicht gespeichert werden · Erneut“; nie doppelte Aktionen durch Doppelklick (Button sperrt 600 ms). | Netz drosseln, Status ändern → sofortige Anzeige, Rückfall bei Fehler. | Linear optimistische Schreibvorgänge ([performance.dev](https://performance.dev/what-makes-linear-feel-instant)). | ◐ Kanban |
| I4 | **Sitzungsablauf verliert keine Eingabe**: Bei 401 während des Speicherns wird der Entwurf gehalten, ein Login-Overlay erscheint, danach wird gespeichert. | Sitzung serverseitig beenden, Formular speichern → Login-Overlay, danach gespeichert. | Shopify/Linear: Re-Auth ohne Verlust. | ✘ |
| I5 | **Toasts: unten links, max. 3 gestapelt, 6 s (Fehler 10 s oder bis Klick), aria-live polite, Erfolgstoast mit Link zum Ergebnis** („Rechnung RE-2026-0120 erstellt · Öffnen“). | Jede Server Action, die etwas erzeugt, verlinkt das Ergebnis. | Stripe/Linear Toast-Muster. | ◐ |

## J. Geschwindigkeit und Technik (messbar)

| Nr. | Prinzip | Prüfung | Begründung / Quelle | Fundament |
|---|---|---|---|---|
| J1 | **Interaktion < 100 ms, Navigation < 300 ms (gecacht), Erstaufruf Liste < 1 s** im Büro-WLAN; Kennzahlen im E2E gemessen und als Budget im CI. | `tests/e2e` misst TTI Liste/Formular; Budget verletzt → Test rot. | Linear: Lesen lokal, Schreiben in Warteschlange ([performance.dev](https://performance.dev/what-makes-linear-feel-instant)). | ✘ |
| J2 | **Prefetch beim Hover/Fokus auf Zeile** (Datensatz-JSON nach 100 ms Hover), Zurück ohne Neuladen (Router-Cache), Listen-Antwort per `stale-while-revalidate` 30 s. | Zeile öffnen nach Hover fühlt sich sofort an. | Next.js Link-Prefetch; Linear Prefetch-Muster. | ✘ |
| J3 | **Lokaler Datensatz-Cache (IndexedDB) für Stammdaten** (Produkte, Kunden, Mitarbeiter, Preislisten) mit Versionsnummer; Suche darüber auch offline; Delta-Sync alle 60 s und bei Fokus. | Produktsuche in der Kassa offline mit Treffern. | Lightspeed X lokale Produkt-/Kundensuche ([x-series-support](https://x-series-support.lightspeedhq.com/hc/articles/25534272395163)); Linear IndexedDB ([performance.dev](https://performance.dev/what-makes-linear-feel-instant)). | ✘ |
| J4 | **Animationen kurz und zweckgebunden**: Ein-/Ausblenden 120–200 ms, Drawer/Dialog 200–240 ms `cubic-bezier(.2,.8,.2,1)`, Listenumsortierung 180 ms FLIP, keine Animation > 300 ms, `prefers-reduced-motion` schaltet alles auf 0 ms. Keine Dekorationsanimationen im Backoffice. | CSS-Grep: keine `transition` > 300 ms; Reduced-Motion-Test. | Linear/Figma/Stripe: Bewegung nur als Rückmeldung. | ◐ |
| J5 | **Dichte umschaltbar** („Kompakt / Normal“, Zeilenhöhe 32 / 40 px, Schrift 13 / 14 px), Standard Normal, Kiosk immer groß. | Umschalter im Benutzer-Menü, in localStorage. | Linear/Notion Density; kleines Team mit sehr unterschiedlichen Nutzern. | ✘ |

---

## Reihenfolge für die Umsetzung (Vorschlag, nach Wirkung je Aufwand)

1. **Sofort, Fundament:** D2 Speicherleiste · D3 Undo-Toast · D4 Formular-Kürzel · A7 `?`-Hilfe · C6 Zeit-Signal · I5 Ergebnis-Links · J4 Animationsregeln.
2. **Vor dem ersten Fachbereich:** C1 Gespeicherte Ansichten · C3 Massenaktionen vollständig · D10 Drawer · A6 j/k · B1 fehlertolerante Suche · E6 Phasenleiste.
3. **Mit Kassa/Packtisch:** F1–F3, F8, J3 lokaler Stammdaten-Cache.
4. **Später:** C4 Inline-Edit · C7/C8 Summen/Gruppen · A3 G-Akkorde · J5 Dichte · H3 Erste Schritte.

## Nicht übernehmen (bewusst)

- **Notion-artige freie Seiten/Blöcke**: zu offen für Belegdaten; nur in Kommentaren und Notizfeldern Markdown.
- **Figma-Multiplayer-Cursor**: kein Nutzen bei Belegbearbeitung; Konflikt-Diff (D6) reicht.
- **Odoo-Vielfalt an Ansichten** (Pivot, Graph, Gantt je Liste): nur Liste/Kanban/Kalender; Auswertung über Summenzeile und wenige Reports.
- **Linear-vollständige Lokalkopie aller Daten**: Belegdaten bleiben serverseitig (Rechte, Volumen); lokal nur Stammdaten und Offline-Warteschlangen (J3, F2).

## Quellen

- Linear Navigation: https://linear.app/enablement/guides/navigating-linear · Kürzelhilfe: https://linear.app/changelog/2021-03-25-keyboard-shortcuts-help · Kürzelliste (Drittquelle): https://www.pie-menu.com/shortcuts/linear
- Linear Sync/Geschwindigkeit (Drittanalyse): https://performance.dev/what-makes-linear-feel-instant
- Shopify Polaris Save Bar: https://polaris.shopify.com/components/deprecated/contextual-save-bar · App Bridge: https://shopify.dev/docs/api/app-bridge-library/apis/contextual-save-bar · Index Filters: https://polaris.shopify.com/components/selection-and-input/index-filters · Select-all: https://shopify.dev/docs/apps/build/app-home/migrate-from-polaris-react/select-all-actions.md · Saved-View-IDs: https://shopify.dev/docs/apps/build/app-home/migrate-from-polaris-react/index-filters
- Stripe Dashboard (`?` Kürzel): https://stripe.com/en-dk/docs/dashboard
- Odoo 17 Kürzel: https://www.odoo.com/documentation/17.0/applications/essentials/keyboard_shortcuts.html
- Notion Undo/Quick Find (Drittquellen): https://whalesync.com/blog/how-to-undo-in-notion · https://www.notionapps.com/blog/undo-in-notion-tips-shortcuts/
- Attio Datenmodell/Views: https://attio.com/help/reference/managing-your-data/views · https://attio.com/help/reference/attio-101/attios-data-model/understanding-records
- Pipedrive Rotting: https://support.pipedrive.com/en/article/the-rotting-feature · Pipeline-Ansicht: https://support.pipedrive.com/en/article/pipeline-view
- Lightspeed X-Series Offline: https://x-series-support.lightspeedhq.com/hc/articles/25534272395163 · Kürzel (Retail): https://retail-support.lightspeedhq.com/hc/en-us/articles/228839547-Keyboard-shortcuts
- Square Offline-Zahlungen: https://squareup.com/help/us/en/article/7777-process-card-payments-with-offline-mode
- Figma Kürzel (Drittquelle): https://verpex.com/blog/marketing-tips/essential-figma-shortcuts-you-need-to-know
- SHD marahplus: `Backend-Import/referenz/VORBILD-SHD-sauter-held-2026-11-03.md` (Marketingtexte, keine Feldlisten)
- Fundament: `Marktresearch/digital/backoffice/PLAN-NEXT-BACKOFFICE.md`, `backoffice/src/components/Backoffice/README.md`

Hinweis zur Belegbarkeit: Linear j/k und Figma ⌘/ stammen aus Drittquellen; offizielle Seiten nennen Pfeiltasten bzw. zeigen Quick Actions nur im Produkt. Tribe/Loco ohne öffentliche Dokumentation, daher ohne Prinzipien aus diesen Produkten.
