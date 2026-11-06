# 20 – UX-/UI-Kritik Bereich „Sortiment“ · Prüfung von `10-konzept-sortiment.md`

**Zweck:** Strenge Abnahmeprüfung des Sortiment-Konzepts gegen Nielsen-Heuristiken, WCAG 2.2 AA, iPad/Smartphone/Packtisch-Kiosk und die Leitlinien 01–05. Ergebnis: Note, Pflichtänderungen mit Abnahmekriterium, weitere Befunde, Klickzahlen Ist/Soll, Tastenbelegung, korrigierte Wireframes, Glossar, QA-Ergänzungen.
**Stand:** 2026-11-04 · Rolle: UX-/UI-Kritiker · Status: Prüfbericht, keine Entscheidung des Inhabers.
**Geprüft:** `10-konzept-sortiment.md` (§0–§12, 882 Zeilen, vollständig); `01-benchmark-prinzipien.md` (A3, A6, C1, D10); `02-ux-leitlinien.md` (§0, §2, §4–§11, §13–§16); `03-design-system.md` (§0, §1.5, §1.6, §5, §8.1, §8.7–§8.14, §8.18, §8.19); `04-motion.md` (§1, §2, §3.3–§3.8, §3.12–§3.14, §4); `05-informationsarchitektur.md` (§2, §3.7, §12.5, §14.1). Zum Abgleich der bereichsübergreifenden Festlegungen: `20-kritik-ux-faktura.md` §4 und §7, `20-kritik-ux-crm.md` §2.2. Keine fachliche oder rechtliche Prüfung (Urheberrecht, FAGG, Wettbewerbsrecht gehören in `21-kritik-fach-sortiment.md`). Keine Änderung an `backoffice/` oder `Backend-Import/`.

Schweregrad: **P1** = vor dem Bau ändern (Sackgasse, Außenwirkung ohne Sicherung, WCAG-Verstoß, Widerspruch, an dem der Bau-Agent hängen bleibt) · **P2** = vor der Abnahme · **P3** = Feinschliff. Heuristiken nach Nielsen: H1 Status sichtbar · H2 Sprache der Nutzer · H3 Kontrolle/Ausweg · H4 Konsistenz · H5 Fehlervermeidung · H6 Erkennen statt Erinnern · H7 Effizienz · H8 Minimalismus · H9 Fehler beheben · H10 Hilfe.

---

## 0. Urteil

**Note: 6 / 10.**

Das Konzept ist fachlich tief und ehrlich: Jede Funktion ist auf Feld oder Methode abgebildet, Lücken sind als „fehlt in App“ markiert (L1–L16, B1–B10). Die Ideen „Bereit für Website“-Checkliste, Freigabe-Schreibtisch, AB-Abgleich mit PDF daneben und „Preis bestätigen“ mit einem Klick sind gut und in Branchensoftware selten. Als Bauvorlage für ein Team ohne IT-Ausbildung ist es in dieser Fassung aber **zu dicht, zu tastaturlastig mit Kollisionen und an mehreren Stellen ohne Schutz vor Außenwirkung**:

1. **Ein Wort, vier Bedeutungen.** „Prüfen“ heißt hier: zur Freigabe geben (Produkt), automatisch durchrechnen (Preisliste), Rückfrage beim Hersteller (AB-Bewertung) und abgehakt (`AB geprüft`). „Freigabe“ heißt Urheberrecht (Bild), Preisfreigabe, Lieferzeitfreigabe, Workflow-Schritt (`AB freigeben`) und Berechtigung („Freigabe anfragen“). „Aktiv“, „Veröffentlicht“, „online“ und `website_sichtbar` stehen nebeneinander, ohne dass klar ist, was die Website zeigt und was der Shop verkauft (H2, H4).
2. **Ein Tastendruck oder ein Ziehen macht Dinge öffentlich.** Im Freigabe-Schreibtisch gibt `Enter` Bilder frei und `Backspace` lehnt ab (§2.9). Ein Kanban-Drop nach „Aktiv“ veröffentlicht ein Produkt ohne Dialog (§2.2). Undo setzt zwar den Datensatz zurück, die Website hat die Änderung über `website_aktualisieren` dann aber schon bekommen (H5).
3. **Tastenkürzel kollidieren** mit 02 §9, 03 §8.7, den bereichsübergreifenden Festlegungen aus den Kritiken zu Faktura und CRM und untereinander: `Alt+←/→` ist unter Windows Browser-Zurück, `[`/`]` klappt die Seitenleiste, `s` heißt in Produkte „Status“ und in Bestellungen „Senden“, `x` heißt „auswählen“ und im Abgleich „ablehnen“, `⇧=` lässt sich auf einer deutschen Tastatur nicht drücken, `g o` ist in 03 schon „Faktura › Offene Posten“.
4. **Die Übersicht zeigt dieselbe Zahl dreimal** („Preisstand veraltet 12“ als Chip, als Kennzahl und als Arbeitsvorrat-Kachel; dasselbe für AB ausständig und Freigaben). Dazu kommen 21 Blöcke auf einer Seite und Charts ohne Handlungsbezug. Das ist ein Admin-Dashboard alter Bauart, kein Posteingang wie bei Linear oder Shopify (H8).
5. **Produkt- und Markenakte haben 8 bzw. 9 Tabs** (03 §8.10: ab 6 Tabs ein `⋯`-Menü). Die Produktakte zeigt im Kopf, im Hinweisband und unter „Mehr“ dreimal dieselbe Aktion unter zwei Namen („Preis erfassen“, „Preis mit Stand hinzufügen“), und es gibt zwei Primärknöpfe in einem Sichtbereich.
6. **Neues Produkt = Assistent mit 4 Schritten** gegen 02 §4.3 (Neu-Dialog: Pflichtfelder plus 2–3 häufige). Dazu der Widerspruch „Esc = Entwurf behalten“, obwohl das Produkt erst am Ende angelegt wird.
7. **Bewegung verstößt gegen 04**: Zahlen zählen beim ersten Erscheinen hoch (04 P10), ein ungültiger Drop springt mit 320 ms Feder zurück (04 §3.4: 200 ms ease-out, keine Feder). Zwei Stellen nennen für denselben Fall verschiedene Werte (§2.2: 200 ms, §2.6 und QA 1: 320 ms).
8. **Barrierefreiheit:** Der Freigabe-Zustand der Bilder ist nur am farbigen Rand erkennbar, Reihenfolge der Bilder und Kategorienbaum gehen nur per Ziehen (WCAG 2.5.7), Δ-% in Sand-Text hat 4,15:1 (unter 4,5:1), und wo der Fokus nach dem Verschwinden einer freigegebenen Kachel landet, ist nicht festgelegt (2.4.3).

Nach den Pflichtänderungen in §1 ist eine **8** erreichbar. Fast alles davon sind Festlegungen in 10. Sechs Punkte brauchen die App oder das Fundament (§9).

| Dimension | Note | Kurzbegründung |
|---|---|---|
| Aufgabenfluss (Klicks, Wege) | 6 | Ziele gut gewählt, Klickzahlen aber zu niedrig gezählt (Basis wechselt zwischen Zentrale und Akte); Assistent statt Schnellanlage; AB-Pfad 7 statt 3 Klicks (§3) |
| Benennung / Sprache (H2) | 4 | „Prüfen“, „Freigabe“, „Aktiv/online“ mehrdeutig; Rohwerte ohne Umlaute (`Geprueft`, `Uebernommen`, `beschaedigt`, `freisteller`); Technikwörter in der Oberfläche (Claim-Guard, Slug, Website-Cache, Revalidate) |
| Konsistenz mit 01–05 und Nachbarbereichen | 5 | Kürzel, Statusfarben (Wareneingang, Preisliste), Pills statt Tabs, „Arbeitsvorrat“ statt „Zu tun“ wie in Faktura und Kundenkarte, Tabs > 6 |
| Tastatur | 5 | Viel Abdeckung, aber 14 Kollisionen (§4) und zwei Tasten, die sofort nach außen wirken |
| Touch / iPad / Kiosk | 7 | Kachelansicht, Kundenansicht, Kiosk-Stepper 64 px gut; Wischen zum Freigeben riskant, F-Tasten weichen von 02 §9.5 ab, Lieferung ohne bekannte Bestellung fehlt |
| Leer-/Lade-/Fehlerzustände | 6 | Listen gut; 14 Leerfälle und 9 Fehlerfälle fehlen (§2.4, §2.5) |
| Undo / Rückfragen | 5 | Muster vorhanden; AB-Bewertung ohne Undo, Veröffentlichen per Drop ohne Dialog, Undo hinter Website-Aktualisierung zu spät, Entwurf stornieren mit Dialog statt Undo |
| Barrierefreiheit WCAG 2.2 | 6 | Charts mit Tabellen-Umschalter, Status mit Text: gut; Rand-Farbe allein, Drag ohne Alternative, Sand-Text, Fokus nach Entfernen, `(o)(p)(x)` ohne Beschriftung |
| Visuelle Modernität | 6 | Freigabe-Schreibtisch und AB-Split-View sind zeitgemäß; Übersicht, 12-Spalten-Produktliste, Emoji/Unicode-Symbole und überladener Akten-Kopf nicht |
| Bewegung (04) | 6 | Token meist richtig; Hochzählen, Feder beim Rücksprung, Puls, Kachel-Abgang im Raster falsch oder unklar |

---

## 1. Pflichtänderungen (vor dem Bau, nach Wirkung sortiert)

| # | Befund (Fundstelle, Heuristik/WCAG) | Änderung in 10 | Abnahmekriterium |
|---|---|---|---|
| **P1** | **Außenwirkung per Einzeltaste und per Drop** (§2.9 `Enter` freigeben, `Backspace` ablehnen; §2.2 Kanban-Drop nach Aktiv; §7 Smartphone „Wischgesten links/rechts“ zum Freigeben). H5. Mit `Backspace` wird in 02 sonst ein Filterchip entfernt, und wer ein Wort löschen will, lehnt ein Bild ab. | (a) Freigaben: Entscheidungstasten `1` Freigeben · `3` Ablehnen (Grund Pflicht) wie in der CRM-Triage (A-CRM1) und Linear Triage; `Enter` öffnet die Lightbox, `Backspace` ohne Wirkung. (b) Kanban Produkte: Drop nach „Veröffentlicht“ öffnet denselben Dialog wie der Knopf (Checkliste, „n möglich – m blockiert“), nie stilles Umsetzen; das gilt in §2.6 schon für Bestellungen. (c) Smartphone: Wischen legt nur den Knopf frei („Freigeben“ / „Ablehnen“ sichtbar beschriftet), die Entscheidung braucht einen Tipp. | Kein Einzelzeichen außer `1`/`3` im fokussierten Freigabe-Raster ändert `freigabe`; E2E: Drop nach Veröffentlicht ohne Dialog-Bestätigung ruft den Workflow nie auf; Wischen allein ändert keinen Datensatz. |
| **P2** | **Undo kommt nach der Website-Aktualisierung** (§2.9 „Undo 8 s setzt die Bildzeilen zurück“, §3.1 Toast „Preis gespeichert · Website wird aktualisiert“ mit Undo; §8.1 `website_aktualisieren` bei jeder Änderung, Drossel 60 s). H3/H5: Ein versehentlich freigegebenes Bild kann bis zu 60 s auf der Website stehen, auch wenn sofort „Rückgängig“ gedrückt wird. | UI-Regel: Toast-Text unterscheidet „Gespeichert · Website folgt in 10 s · Rückgängig“; bei Undo innerhalb der 8 s wird keine Website-Aktualisierung mit dem alten Stand nötig. Dafür an die App (§9 A1): Revalidate für Bild-/Preis-/Status-Änderungen frühestens 10 s nach Speichern, mit Zusammenfassung mehrerer Änderungen (Debounce statt Drossel am Anfang). Bis dahin: Toast ohne „Website wird aktualisiert“, stattdessen Hinweis „Rückgängig nimmt die Änderung zurück, die Website kann sie kurz gezeigt haben“. | Staging: Freigeben → Undo nach 3 s → Website-API liefert das Bild zu keinem Zeitpunkt (mit App-Änderung); ohne App-Änderung steht der Hinweistext im Toast. |
| **P3** | **„Prüfen“ und „Freigabe“ mehrdeutig, „Aktiv/online“ unklar** (§1, §2.2, §3.1, §3.3, §4.1–§4.3). H2/H4. | Glossar §6 verbindlich übernehmen: Produkt-Workflow `Prüfen` → Knopf **„Zur Freigabe geben“**, Zustand `Geprueft` → Badge **„Wartet auf Freigabe“**; `Aktiv` → **„Veröffentlicht“** (Badge-Text, nicht nur Tooltip); `verkauf_online` → Chip **„Im Shop“**; `website_sichtbar = 0` → Chip **„Ausgeblendet“**. AB-Bewertung `pruefen` → **„Rückfrage“**; `AB geprueft` → **„AB bestätigt“**. Preisliste `pruefen` → **„Abgleichen“**. Berechtigungsanfrage überall **„Leitung bitten“** (02 §7.2; heute viermal „Freigabe anfragen“). | Kein UI-Text enthält „prüfen“ in mehr als einer Bedeutung; Text-Snapshot-Test gegen Glossar §6; Werte im Code bleiben unverändert. |
| **P4** | **Tastenkürzel kollidieren** (§2.1–§2.9, §3.3, §4.7, §7). H4/H7, WCAG 2.1.4. Vollständige Liste §4. Kritisch: `Alt+←/→` (Browser-Zurück), `[`/`]` (Seitenleiste), `s` = Senden in Bestellungen (öffnet Mail-Dialog statt Status), `x` = ablehnen im Abgleich (= auswählen in jeder Liste), `⇧=` (auf deutscher Tastatur nicht drückbar), `Shift+Enter` = zurück im Assistenten (in Textfeldern Zeilenumbruch), `g o` (03 §8.13 belegt). | Tastenbelegung §4 übernehmen. Grundregel wie Faktura-Kritik §4: Einzelbuchstaben gehören Shell und DataTable und bedeuten überall dasselbe; Bereichsaktionen = `Shift+Buchstabe`; Primäraktion der fokussierten Zeile = `Shift+Enter`; Aktionen, die eine Mail auslösen oder öffentlich wirken, haben **kein** Einzelkürzel (nur Knopf, Palette, `Shift+…` mit Dialog). | Kürzel-Registry-Test: kein Bereichskürzel überschreibt ein globales; `Alt+←/→` ohne App-Wirkung; alle Kürzel abschaltbar (Benutzer-Menü). |
| **P5** | **Neues Produkt als 4-Schritt-Assistent** (§2.3) gegen 02 §4.3; „Esc = Entwurf behalten“, obwohl erst am Ende angelegt wird (insert nach Schritt 4); `⌘Enter fertigstellen ab Schritt 1` und `Enter weiter` kollidieren in den Textfeldern von Schritt 3. H3/H5/H8. | Ersetzen durch **Schnellanlage-Dialog** (md 560 px): Marke*, Kategorie*, Herstellerbezeichnung*, Artikelnummer, „Weitere Angaben ▾“ (EAN, Typ, Collection). Dublettenprüfung live wie §2.3. Knöpfe „Anlegen“ / „Anlegen und öffnen“ (Primär). Danach führt die Akte: „Bereit für Website“-Checkliste mit den offenen Punkten (Bilder, Text, Preis, Lieferzeit) als nächste Schritte. Wireframe §5.4. Der Assistent entfällt; S2, A10, A11 und S3 bleiben Assistenten (T6). | Neues Produkt in ≤ 3 Klicks ab Sortiment plus 3 Pflichtfelder; nach „Anlegen“ existiert ein Entwurf (kein Datenverlust bei Esc danach); Esc im Dialog vor „Anlegen“ legt nichts an und fragt nur, wenn ≥ 1 Feld befüllt ist. |
| **P6** | **Übersicht dreifach redundant, 21 Blöcke** (§2.1, §5). H8, 02 §2.1 („Kennzahlen max. 6, die 2–3 wichtigsten Listen“). | Übersicht = **„Zu tun“-Posteingang** wie in Faktura und Kundenkarte (gleicher Name, gleiche Bedienung): eine Liste, gruppiert nach Art (AB einlesen · Abweichungen bewerten · Wareneingang erwartet · Preis läuft ab/veraltet · Wartet auf Freigabe · Bilder ohne Freigabe), je Gruppe max. 5 Zeilen + „alle n“, Zeilenaktion als sichtbarer Text-Knopf. Darüber **4** Kennzahlen ohne Doppelung mit „Zu tun“ (Veröffentlicht · Offene Bestellungen · Marken ohne Händlerstatus · Online ohne gültigen Preis). Charts nach `/sortiment/berichte` (eine Karte „Berichte“ mit 4 Links). Heute-Leiste nur in der Zentrale (05 §7.4), nicht doppelt im Bereich. Wireframe §5.1. | Jede Zahl erscheint auf der Seite genau einmal; ≤ 10 Blöcke; erster Bildschirm (1280 × 800) zeigt mindestens 3 Gruppen „Zu tun“ mit ihren Aktionen. |
| **P7** | **Akten mit 8/9/7 Tabs, doppelte Aktionen, zwei Primärknöpfe** (§3.1 Kopf + Band beide „[Preis erfassen]“; „Mehr“ mit „Preis mit Stand hinzufügen“ und „Vorschau auf Website“ doppelt zum Kopf; §3.3 „[Abweichungen bewerten]“ im Kopf und „[AB freigeben]“ als Primär im Tab). 03 §8.10, 02 §0.2, 02 §13. | Produktakte nach Shopify-Muster (Wireframe §5.2): **5 Tabs** Produkt · Ausführungen · Texte & SEO · Verwendung · Verlauf; Bilder, Preis, Lieferzeit und Stammdaten sind Abschnitte im Tab „Produkt“, rechts „Status & Website“ (Checkliste) und „Zuordnung“ (Marke, Kategorie, Welt, Typ); „System“ als Abschnitt unter „Mehr ▾ › Systemdaten“ (nur Leitung). Markenakte: 5 Tabs Marke · Händlerstatus & Claims · Bilder · Produkte · Einkauf (Lieferant, Bestellweg, Preislisten zusammengelegt; Website als Abschnitt in „Marke“). Lieferantenakte: 5 Tabs (Stammdaten+Ansprechpartner · Konditionen · Bestellungen · Leistung · Verlauf; Notizen als Abschnitt in Konditionen, nur Leitung). Je Sichtbereich ein Primärknopf; Hinweisbänder haben Text-Links, keine zweiten Primärknöpfe; eine Bezeichnung je Aktion („Preis erfassen“). In der Bestellakte ist „AB freigeben“ sekundär und deaktiviert („2 Abweichungen offen“), solange „Abweichungen bewerten“ primär ist. | Keine Akte > 6 Tabs; Text-Snapshot: jede Aktion hat überall dieselbe Bezeichnung; axe/Unit: höchstens ein `variant="primary"` je Region. |
| **P8** | **Bewegung gegen 04** (§5.1 „Zahl zählt beim ersten Erscheinen 400 ms hoch“ ↔ 04 P10/§3.7; §2.6 und QA 1 „Rücksprung 320 ms `--bo-ease-spring`“ ↔ 04 §3.4 „200 ms ease-out, kein Spring beim Zurück“; §3.3 „Sand-Puls 240 ms“ ↔ 04 P5; §2.9 Kachel-Abgang „Opacity/Höhe“ im Raster). | Tabelle §2.9 übernehmen. Kurz: kein Hochzählen beim Laden (nur bei Änderung nach dem Laden, 400 ms); ungültiger Drop und Abbruch 200 ms `--bo-ease-out`, die Feder 320 ms nur bei gültiger Ablage; „AB freigeben“ wird Primär durch Farbwechsel 160 ms (wie 04 §3.12), kein Puls; Kachel im Raster: Opazität 100 ms `--bo-ease-in`, Nachbarn per FLIP 200 ms `--bo-ease-out` (keine Höhenanimation im Grid). QA 1 auf 200 ms korrigieren. | Motion-Spec: Endzustand ≤ 400 ms; kein `--bo-ease-spring` außer bei gültiger Kanban-Ablage; Erstaufbau ohne Zahlenanimation (Screenshot-Diff bei Hydration). |
| **P9** | **Status nur über Farbe, Ziehen ohne Alternative** (§2.2 Bildspalte „Rand grün = freigegeben, orange = offen“; Kachel und Kanban „Freigabe-Punkt“; §2.3/§3.1 „Reihenfolge ziehen“; §2.11 Kategorienbaum „Ziehen ändert beides“). WCAG 1.4.1, 2.5.7; 03 §0.2. | Bildzustand mit Form + Text: Ecke unten rechts 16 px Icon `circle-check` (freigegeben) / `clock` (offen) / `circle-x` (abgelehnt) mit `aria-label`, in Akte und Raster zusätzlich Textzeile „Freigegeben“/„Freigabe offen“. Reihenfolge: je Bild Menü „Als Hauptbild“, „Nach vorn“, „Nach hinten“ + Tastatur `⌘⇧←/→` bei Fokus; Kategorien: Menü „Verschieben nach … (Elternkategorie)“ + „Nach oben/unten“ (`⌘⇧↑/↓`). | axe 0 serious; manuell: Reihenfolge und Baum allein mit Tastatur änderbar; Graustufen-Screenshot lässt alle Bildzustände unterscheiden. |
| **P10** | **AB-Bewertung ohne Undo und mit unbeschrifteten Optionen** (§3.3 „(o) (p) (x)“, Tasten `o/p/x`; §4.6 keine Undo-Spalte für Bewertungen). H3/H6, WCAG 1.3.1, 3.3.2. | Bewertung als Segment-Schalter je Zeile mit Text **„OK · Rückfrage · Ablehnen“** (`role="radiogroup"`, Ziel ≥ 24 × 24 px, Kürzel `1`/`2`/`3` als Tastenkappe im Segment); „Ablehnen“ für Mitarbeiter deaktiviert mit Tooltip „Nur Leitung“; nach `3` öffnet das Kommentarfeld der Zeile (Pflicht). Jede Bewertung mit Undo-Toast 8 s und `⌘Z` (Gegenaufruf `abweichung_bewerten` mit altem Wert); nach der Bewertung springt der Fokus auf die nächste offene Zeile. | Tastatur: 5 Zeilen mit `1`/`2`/`↓` in ≤ 10 Tastendrücken bewerten; `⌘Z` stellt die letzte Bewertung wieder her; Screenreader liest „Zeile 1 Termin, plus 17 Tage, Bewertung: OK, ausgewählt“. |
| **P11** | **Fehlende Leer- und Fehlerzustände** (§2.5, §2.8–§2.14, §3, §4.7, §7). 02 §0.7, 02 §16. | Texte aus §2.4 und §2.5 dieser Datei übernehmen (14 Leerfälle, 9 Fehlerfälle), darunter „Lieferung ohne bekannte Bestellung“ am Packtisch und „Senden fehlgeschlagen“. | Jede Route und jeder Tab zeigt laut 02 §7.1 drei unterscheidbare Leerfälle (wo zutreffend) und den Fehler am Ort der Arbeit; Mock-Szenarien für alle Fälle in §2.4/§2.5. |
| **P12** | **Rohwerte ohne Umlaute und Technikwörter in der Oberfläche** (§2.4 „Anfrage laeuft“, §2.8 „Vollstaendig“, §2.10 „Geprueft · Uebernommen“, §4.4 „beschaedigt“, §2.3 „freisteller“, Welt „Kueche“; „Claim-Guard“, „Slug“, „Website-Cache erneuern“, „Revalidate“ in §2.3, §2.14, §3.1, §4.5). 02 §7.2 („nie technische Begriffe“), H2. | Anzeige-Map Wert → Text (§6) als eine Datei je Bereich (`lib/backoffice/sortiment/texte.js`), nie Rohwert anzeigen. „Claim-Guard“ → „Händlerwort-Prüfung“; „Slug“ → „Web-Adresse“; „Website-Cache erneuern“ → „Website jetzt aktualisieren“; Ergebnistexte wie §4.5, ohne „Revalidate“. | Text-Snapshot: kein `ae/oe/ue` als Umlaut-Ersatz, keine der Technikwörter in sichtbarem Text (Ausnahme Tab „Systemdaten“ für Leitung). |

---

## 2. Weitere Befunde

### 2.1 Komplexität, Klicks, Benennung (P2 außer markiert)

| # | Fundstelle | Befund | Änderung |
|---|---|---|---|
| K1 | §1 Zielklickzahl | Zählbasis wechselt: teils ab Zentrale, teils ab Akte („Prüfen 1“, „Bilder 2“); Vorschau-Dialoge der Massenaktion (§4.6) nicht mitgezählt. | Einheitlich ab Zentrale nach 02 §1 zählen; Tabelle §3 dieser Datei ersetzt §1. |
| K2 | §2.2 Produktliste | 11 Datenspalten + Auswahl + `⋯` ≈ 1.200 px; bei 1280 px mit Seitenleiste 240 px bleiben ~1.000 px → horizontaler Scroll (WCAG 1.4.10 laut 02 §10 bis 1280 px ohne). | Standard 7 Spalten: Bild · Produkt (Zeile 2: Marke · Art.-Nr.) · Kategorie · Status (Badge + ggf. „Preis veraltet“) · Preis ab (Zeile 2: Stand) · Bilder („2 von 3 frei“) · Geändert. „Im Shop“ als zweites Badge in Status (03 §8.9: max. 2). iPad: 4 Prioritätsspalten Bild · Produkt · Status · Preis ab (02 §11.1). |
| K3 | §2.2 Spalte Stand | „12.04. ⚠“ orange und rot mit demselben Symbol; Bedeutung nur über Farbe. | Text statt Symbol: „läuft ab 12.10.“ (`warning-text`) bzw. „veraltet“ (`danger-text` + `triangle-alert`). |
| K4 | §2.2 Spalte Bilder | „0/2 ✗“ liest sich wie ein Fehler, „3/3 ✓“ wie erledigt, obwohl nur die Freigabe gemeint ist. | „0 von 2 frei“ / „alle frei“; leer: „kein Bild“. |
| K5 | §2.2 Kanban Produkte | Spalte „Aktiv“ mit mehreren hundert Karten (03 §8.8: max. 100 je Spalte) ist als Arbeitsfläche ohne Nutzen. | Kanban nur für den Freigabeweg: Entwurf · Wartet auf Freigabe · Veröffentlicht (letzte 14 Tage) · Pausiert; Hinweis in der Spalte „Ältere Veröffentlichte: Liste“. |
| K6 | §3.1 „Preis erfassen“-Dialog | 11 Felder auf einmal. | Sichtbar: Brutto*, Preisart*, Stand* (heute), Quelle* + URL. „Weitere Angaben ▾“: gilt ab, Ausführung, Variante, Beleg, Zusatztext. Vorbelegung aus der letzten Preiszeile (Preisart, Quelle, URL). |
| K7 | §3.1 Feld `freigegeben (ja)` im Preis-Dialog | Widerspruch zum Tab „Preise“ im Freigabe-Schreibtisch (Leitung): Wenn Mitarbeiter selbst „ja“ setzen, hat der Tab keinen Inhalt; wenn nicht, ist die Vorbelegung falsch. | Feld für Mitarbeiter nicht sichtbar; Regel als Inhaber-Entscheidung (§9 A4). Bis dahin: Mitarbeiter-Preise = „Freigabe offen“, Leitung = „freigegeben“. |
| K8 | §2.3 Schritt 2 / §3.1 Tab Bilder | Quelle-URL je Bild Pflicht: bei 10 Bildern 10 × Einfügen. | (a) Feld „Quelle für alle Bilder dieses Uploads“; (b) beim Ziehen eines Bildes aus dem Browser (Herstellerseite) `text/uri-list` auslesen und `quelle_url` vorbelegen, Abrufdatum = heute; (c) Einfügen aus der Zwischenablage (`⌘V` in der Dropzone). |
| K9 | §2.6 Bestellungen, Spalte AB „⚠ 9 T.“ | Abkürzung „T.“ und Symbol ohne Text. | „seit 9 Tagen“, ab Frist `danger-text` „9 Tage, Frist 5“. |
| K10 | §2.9 Kopf „Leitung“ | Rollenetikett rechts oben ohne Funktion. | Entfernen; für Mitarbeiter stattdessen Band „Nur ansehen – Freigeben darf die Leitung · Leitung bitten“. |
| K11 | §2.1 / 02 §9.1 Kürzel `g o` | `G O` ist in 03 §8.13 „Faktura › Offene Posten“. | Fundament vergibt; Vorschlag `G A` („Artikel“) oder `G W` („Ware“); bis zur Entscheidung kein Akkord, nur Palette. |
| K12 | §2.0 Unternavigation „Pills“ | 02 §2.1 schreibt Tabs mit Unterstrich vor. | Tabs nach 02 §2.1 / 03 §8.10; Zähler-Badge an „Freigaben“ und „Bestellungen“ bleibt. |
| K13 | §3.3 „Positionen nach dem Senden“ | Sperre nur in der UI, Leitung „Positionen ändern“ ohne Folgeführung. | Nach Änderung durch Leitung: Band „Positionen geändert nach dem Senden – Lieferant informieren“ mit Knopf „Änderung senden“ (Mail-Dialog mit Unterschieden). |
| K14 | §2.8 Wareneingang Status „Offen“ | Für einen erfassten Eingang sagt „Offen“ nichts. | Anzeige: „nichts erhalten“ (Offen) · „teilweise“ · „vollständig“ · „Reklamation“ (§6). |
| K15 | §4.4 Zustand „beschaedigt“ vs. „Transportschaden“ | Für Lagerpersonal ohne Erklärung nicht unterscheidbar. | Chips mit Untertitel: „Transportschaden – Verpackung/Ware beim Transport beschädigt“ · „Beschädigt – Ware ab Werk fehlerhaft“; Hilfe-Text unter den Chips bleibt. |
| K16 | §2.4 Marken-Liste „Beleg ✓/–“ | Spalte „Beleg“ ohne Bezug, wofür. | „Händlerbeleg“ als Spaltenkopf, Tooltip mit Belegart (Vertrag/URL/Notiz). |
| K17 | §2.1 Kacheltexte „Bilder ohne Freigabe – Marken (5)“ | Zählt Marken, Kachel sagt aber Bilder. | „5 Marken ohne Bildfreigabe“ und darunter „38 Produktbilder offen“. |
| K18 | §1.3 „Bildfreigabe der Marke erteilen“ zweimal (Marke-Tab und S4) | Zwei Wege mit verschiedenen Feldern (S4 erfasst Umfang, Tab nicht). | Ein Weg: Knopf „Freigabe erhalten“ (S4) in Markenakte und Freigabe-Schreibtisch; Statusfeld selbst nicht direkt editierbar. |

### 2.2 Tastatur (Ergänzung zu P4)

- **Sichtbarkeit:** Jeder Knopf zeigt sein Kürzel im Tooltip; `?` zeigt die Kürzel der Seite (02 §8). Keine Funktion nur per Kürzel: Die Schnellaktion in „Zu tun“ ist ein sichtbarer Text-Knopf (heute nur Hover/Fokus + `a`).
- **Einzeltasten in Feldern:** gelten in `input`, `textarea`, `contenteditable`, `[role=combobox]` nie (02 §9). Der Freigabe-Raster und die Abgleich-Tabelle sind `role="grid"`; die Entscheidungstasten `1`/`2`/`3` wirken nur bei Fokus im Grid. Die Listen-Statuschips `1–9` wirken dort nicht, das steht im Hilfe-Panel.
- **Fokusführung:** Nach Freigeben/Ablehnen einer Kachel springt der Fokus auf die nächste Kachel derselben Marke, sonst auf die erste der nächsten Marke, sonst auf den Leerzustand (WCAG 2.4.3). Nach dem Schließen von Dialog oder Sheet zurück zum Auslöser (QA 31 vorhanden).
- **A10 Werte übernehmen:** `⇧=` streichen. In einer leeren AB-Zelle `=` tippen übernimmt den Sollwert (Tabellenkalkulations-Logik, Feld `inputmode="text"`); Knopf „Alle wie bestellt“ ohne Kürzel.
- **Assistenten S2/A10/A11/S3:** `Enter` weiter außerhalb mehrzeiliger Felder, `⌘Enter` weiter auch aus Textfeldern, `⌘⇧Enter` sofort ausführen (nur im letzten Schritt aktiv), Zurück per Knopf oder Klick in die Schrittleiste (kein Kürzel). `Esc` = Abbrechen mit Rückfrage ab Schritt 2 (05 T6).
- **Packtisch (02 §9.5):** F4 ist dort „Etikett“. Foto auf `F7`, F6 „Buchen“ ist mit „Paket schließen“ verträglich (Abschluss). Abstimmung mit der Logistik-Kritik nötig (§9 A6).

### 2.3 Undo und Rückfragen (Ergänzung zu P1, P2, P10)

| Aktion | Heute in 10 | Soll |
|---|---|---|
| Bestellung (Entwurf) stornieren, Mitarbeiter | Bestätigung (§4.2) | Undo 8 s (umkehrbar; Entwurf ist intern). Bestätigung nur ab „Gesendet“ (Leitung, Grund + „Lieferant informiert“) |
| AB-Abweichung bewerten | kein Undo | Undo 8 s, `⌘Z` (P10) |
| Bild entfernen (Akte, Tab Bilder) | nicht beschrieben | Undo 8 s; bei freigegebenem Bild Text „Website zeigt es nach dem Rückgängig wieder“ |
| Bilder-Reihenfolge, Hauptbild | nicht beschrieben | Undo 8 s (alte Reihenfolge) |
| Ausführung inaktiv / Standard setzen | nicht beschrieben | Undo 8 s (alter Wert; bei Standard der vorherige Standard der Gruppe) |
| Kategorie verschieben (Baum) | nicht beschrieben | Undo 8 s; wenn `key` betroffen ist (Website-Adresse), Bestätigung |
| Abgleich neu erzeugen | ohne Rückfrage | Bestätigung nur, wenn bewertete Zeilen sich ändern würden: „2 Bewertungen gehen verloren (geänderte Werte)“ |
| Massen-Senden von Bestellungen | Vorschau-Dialog | Dialog listet Empfänger je Lieferant und PDF-Anzahl; Titel „5 Bestellungen an 3 Lieferanten senden?“ (02 §14) |
| Bildfreigabe anfordern (Mail) | Dialog | bleibt; zusätzlich „Nachfassen in 14 Tagen“ als Haken (Vorbereitung für L10) |
| Wareneingang buchen | Zusammenfassung, kein Weg zurück (L5) | Bestätigungsschritt bleibt (02 §6.2 Buchung); nach dem Buchen Knopf „Fehler gemeldet? Korrektur anfragen“ (PH Aufgabe an Leitung), bis L5 umgesetzt ist |
| Massenaktion Status (Prüfen/Pausieren) | Vorschau-Dialog + Undo | Vorschau-Dialog nur, wenn Zeilen übersprungen werden; sonst direkt mit Undo (02 §5 sagt „Dialog zeigt Vorschau“ nur bei nicht für alle zulässigen Aktionen) |

### 2.4 Leerzustände (Texte, je eine Aktion; 02 §7.1, 03 §8.18)

| Ort | Fall | Titel · Text | Aktion |
|---|---|---|---|
| Freigaben › Bilder (Leitung) | erledigt | „Alles erledigt“ · „Keine Bilder warten auf Freigabe.“ | – |
| Freigaben › Preise | erledigt | „Alles erledigt“ · „Keine Preise warten auf Freigabe.“ | – |
| Freigaben › Lieferzeiten | erledigt | „Alles erledigt“ · „Alle angezeigten Lieferzeiten sind freigegeben.“ | – |
| Freigaben, Marke links gewählt | gefiltert | „Keine offenen Bilder bei Bora.“ | „Alle Marken zeigen“ |
| Wareneingänge | nie | „Noch keine Wareneingänge. Sie entstehen aus einer Bestellung oder am Packtisch.“ | „Erwartete Lieferungen ansehen“ |
| Wareneingänge, Ansicht „Reklamiert“ | erledigt | „Keine offenen Reklamationen.“ | – |
| Kopfband „Erwartet diese Woche“ | leer | Band entfällt (keine leere Fläche) | – |
| Packtisch „Heute erwartet“ | leer | „Heute ist keine Lieferung angekündigt. Kommt trotzdem etwas: Lieferschein scannen.“ | „Lieferant wählen“ |
| Preislisten-Lauf, Chip „Über Schwelle“ | gefiltert | „Keine Zeile über 15 %.“ | „Alle Zeilen“ |
| Preislisten-Lauf, 0 Zeilen nach Einlesen | Fehlerähnlich | „Die Datei enthält keine lesbaren Zeilen.“ · „Erwartet: Artikelnummer und Preis je Zeile.“ | „Andere Datei wählen“, „Vorlage herunterladen“ |
| Kategorien (Baum) | nie | „Noch keine Kategorien. Kategorien bestimmen die Website-Adressen.“ | „Kategorie anlegen“ |
| Merkmale, Gruppe | nie | „Noch keine Farben.“ (je Gruppe) | „Farbe anlegen“ |
| Produktakte › Verwendung | nie | „Noch nirgends verwendet – kein Angebot, keine Bestellung, kein Verkauf.“ | – |
| Markenakte › Produkte | nie | „Noch keine Produkte von Bora.“ | „Produkt anlegen“ (Marke vorbelegt) |
| Lieferantenakte › Bestellungen | nie | „Noch keine Bestellung bei Bora GmbH.“ | „Neue Bestellung“ |
| Bestellakte › Wareneingänge | nie | „Noch nichts eingegangen. Termin laut AB: 18.12.2026.“ | „Wareneingang buchen“ (ab AB bestätigt) |
| Bestellakte › Auftragsbestätigung, ohne AB | nie | „Noch keine AB. Gesendet am 20.10.2026, Frist 5 Tage.“ | „AB einlesen“ |
| Abgleich ohne Abweichung | erledigt | „Keine Abweichung – die AB entspricht der Bestellung.“ | „AB bestätigen“ (Primär) |
| Berichte (T8) | gefiltert | „Keine Daten im Zeitraum.“ bzw. Bericht Preisstand: „Alle Preise sind aktuell.“ | „Zeitraum ändern“ |
| Palette ⌘K, Sortiment | 0 Treffer | „Nichts zu ‚xyz‘ gefunden“ | „Produkt ‚xyz‘ anlegen“ (mit Recht) |
| Side-Peek | Datensatz gelöscht | „Dieser Datensatz existiert nicht mehr.“ | „Schließen“ |

### 2.5 Fehlerfälle (Text + Weg, 02 §7.2)

| Fall | Ort | Text | Weg |
|---|---|---|---|
| Mailversand scheitert (Bestellung, Bildfreigabe, Reklamation) | Dialog | „Nicht gesendet: Der Mailserver hat nicht geantwortet. Status bleibt ‚Entwurf‘.“ | Dialog bleibt offen, „Erneut senden“, „Als gesendet markieren (anderer Weg)“ |
| Upload zu groß / falsches Format | Bildkachel | „Datei zu groß (max. … MB)“ bzw. „Nur JPG, PNG, WebP“ | Kachel rot mit „Andere Datei“; Rest der Uploads läuft weiter |
| Quelle-URL nicht erreichbar | Bild-/Preisfeld | „Adresse nicht erreichbar – trotzdem speichern?“ (nur Hinweis) | Speichern möglich, Hinweis in Verlauf |
| Preisliste: Kodierung/Trennzeichen | A11 Schritt 1 | „Umlaute unlesbar – Datei bitte als CSV UTF-8 speichern.“ | „Andere Datei wählen“, Kurzhilfe Excel → CSV |
| Preisliste: Übernehmen bricht ab (B6) | A11 Schritt 4 | „Nicht übernommen: Für 3 Produkte gibt es schon einen Preis mit diesem Datum.“ | Liste der 3 Zeilen, „Diese Zeilen auslassen und übernehmen“ |
| Freigabe gleichzeitig durch zweite Person | Freigaben | „Lena hat 4 dieser Bilder vor 1 Min. bearbeitet.“ | Kacheln aktualisieren, Auswahl bleibt für die übrigen |
| Scan unbekannt / keine offene Bestellung | Packtisch | „Keine offene Bestellung zu HB-2026-00099.“ | „Lieferant wählen“ (offene Bestellungen des Lieferanten als Kacheln), „Ohne Bestellung melden“ (Aufgabe an Sortiment, Foto Lieferschein) |
| Offline beim Buchen | Packtisch | Band „Offline – Eingang wird gebucht, sobald Verbindung da ist (1 wartend)“ (05 §12.5) | „Buchen“ bleibt aktiv, Status „wartet“; Rückkehr: „Wareneingang WE-… gebucht“ |
| Workflow-Sperre beim Veröffentlichen (Server lehnt trotz Vorprüfung ab) | Dialog Veröffentlichen | „2 Produkte nicht veröffentlicht: Marke Gaggenau ist nicht aktiv.“ | Liste mit Sprunglinks, Rest bleibt veröffentlicht |

### 2.6 Barrierefreiheit (Ergänzung zu P9, P10)

- **Kontrast:** Sand `#8a7a66` auf Weiß hat 4,15:1 (03 §1.6) und genügt nicht für Text. §4.7 A11 „Δ % farbig (rot über Schwelle, Sand darunter)“ → unter der Schwelle `ink-soft`, über der Schwelle `danger-text` + Icon. Sand nur für Flächen ≥ 3:1 und Icons.
- **Live-Regionen:** Zähler „n Abweichungen offen“ und „n Bilder offen“ mit `aria-live="polite"`, Wertwechsel direkt (kein Herunterzählen, 04 §3.7: ≤ 4 Stellen Unterschied → Direktwechsel). Massenfortschritt „12/40“ `role="status"`.
- **Bildraster:** Jede Kachel `role="gridcell"`, `aria-selected`, Name „X Pure, Freisteller, Freigabe offen, Quelle bora.com“. Lightbox `<dialog>` mit Fokusfalle, Alt-Text aus `alt_de` sichtbar unter dem Bild.
- **Bilder ohne Alt-Text:** Hinweis in der Checkliste „Bereit für Website“ („2 Bilder ohne Bildbeschreibung“, kein Blocker) – Website-Barrierefreiheit beginnt hier.
- **SEO-Zähler 60/160:** `aria-describedby` am Feld, über dem Limit Text „12 Zeichen zu lang“ + `warning-text`, nicht nur Farbe.
- **Charts:** Tabellen-Umschalter vorhanden – Charts liegen nach P6 im Bericht; dort gleiche Regel.
- **Zielgrößen:** `⋯` in Tabellenzeilen 28 px Sicht, 44 px Trefferfläche am iPad; Segment „OK · Rückfrage · Ablehnen“ ≥ 32 px Höhe.
- **Symbole im Text:** `✓ ✗ ⚠ ● ○ ◐ ⧉ 📄` aus den Wireframes werden lucide-Icons nach 03 §5 (`circle-check`, `circle-x`, `triangle-alert`, `copy`, `file-text`); kein Emoji (02 §14).

### 2.7 Visuelle Modernität (Maßstab Linear, Shopify Admin, Stripe Dashboard)

| Stelle | Heute | Soll |
|---|---|---|
| Übersicht | Kacheln + Karten + Charts, Zahlen dreifach | Posteingang „Zu tun“ (Linear Inbox, Shopify „Things to do“), 4 Kennzahlen, ruhige Haarlinien, Wireframe §5.1 |
| Produktakte | Kopf mit 3 Zeilen, Band, 8 Tabs, rechte Spalte | Shopify-Produktseite: links Medien · Titel/Text · Preis · Ausführungen, rechts Status & Website · Zuordnung · Verknüpfungen; Kopf einzeilig (Bild 40 px, Titel, Badges, Primär); Wireframe §5.2 |
| Produktliste | 12 Spalten, Unicode-Symbole | 7 Spalten, Bild 32 px, zweizeilige Zellen (Titel 14/500, Zeile 2 12 px `muted`), Badges nach 03 §8.9 |
| Freigabe-Schreibtisch | gut (Figma/Bildagentur-Muster) | Kachel 168 px bleibt; Auswahl-Fuß sticky mit Markenbeleg als Satz („Gilt mit Bildfreigabe Bora vom 12.03.2026“) statt Radio-Paar |
| AB-Abgleich | gut (Split View) | Tab blendet rechte Spalte (Verknüpfungen) aus und nutzt volle Breite; PDF links 40 %, Tabelle rechts 60 %; ab < 1280 px PDF als umschaltbarer Bereich „PDF · Tabelle“ |
| Kennzahl-Karten | 6 in 4er-Raster + 2 breite | 4 in einer Zeile, ohne Sparkline, wo keine Zeitreihe existiert (03 §8.14) |
| Produktbilder im Dunkelmodus | „auf Weiß“ ohne Angabe für dunkel | weiße Platte `#ffffff` mit Rand `line` und Radius 6 auch im Dunkelmodus (Freisteller brauchen Weiß), sonst wirken sie wie Lücken |

### 2.8 Mobile, iPad, Kiosk

- **Showroom-iPad „Kundenansicht“:** Zustand dauerhaft sichtbar (Kennzeichen „Kundenansicht“ im Kopf, 03 §8.9), Umschalten zurück nur mit Bestätigung durch Tippen auf „Mitarbeiteransicht“ und Neuladen der Seite, damit permlevel-1-Daten nicht im Speicher des Geräts bleiben. Standard beim Start des Showroom-Geräts: an.
- **Lightbox am iPad:** Wischen links/rechts blättert, zusätzlich Pfeil-Knöpfe 44 px (WCAG 2.5.7), Schließen oben rechts 44 px.
- **Smartphone:** Tabellen als Karten (gut). „Preis erfassen“ als Vollbild-Sheet mit `inputmode="decimal"`, Datumsfeld nativ. Bewertung AB als Segment (P10), keine Wischgesten.
- **Packtisch:** zusätzlicher Weg „Lieferant wählen“ (Kacheln mit Logo und Zahl offener Bestellungen), weil Lieferscheine oft nur die Kommission oder die eigene Nummer des Lieferanten tragen. Stepper `− / Menge / +` 64 px gut; Menge > Rest → Hinweis „mehr als bestellt (Rest 2)“ in `warning`, nicht gesperrt.
- **Kiosk-Fehler sichtbar ohne Tooltip:** Begründungen deaktivierter Knöpfe stehen als Text unter dem Knopf (03 §8.11: Kiosk ohne Tooltips), z. B. „Foto fehlt bei Position 2“.

### 2.9 Bewegung – Abgleich mit 04

| Stelle in 10 | Heute | Soll (04) |
|---|---|---|
| §5.1 Kennzahl beim ersten Erscheinen | 400 ms hochzählen | steht sofort (P10); 400 ms `--bo-ease-out` nur bei Änderung nach dem Laden |
| §2.6 Kanban-Rücksprung | 320 ms `--bo-ease-spring` | 200 ms `--bo-ease-out` (§3.4) |
| §10 QA 1 | „springt zurück (320 ms)“ | „springt zurück (200 ms)“ |
| §3.3 Primärwechsel „Sand-Puls 240 ms“ | Puls | Farbwechsel 160 ms `--bo-ease-out` (wie §3.12 Packtisch) |
| §3.3 Zähler „zählt sichtbar herunter (160 ms)“ | Animation | Direktwechsel + `aria-live` (§3.7: kleine Änderung) |
| §2.9 Kachel-Abgang | Rand 120 ms, Opacity/Höhe 160 ms, Nachbarn 200 ms | Rand 120 ms → Opazität 100 ms `--bo-ease-in` → Nachbarn FLIP 200 ms `--bo-ease-out`; reduziert: nur Opazität 120 ms |
| §2.3 Schrittwechsel | 160 ms, 8 px | richtig; im Assistenten-Fuß kein Versatz |
| §4.6 Massenaktionsleiste | 160 ms | richtig (02 §5); 03 §8.7 nennt 240 ms → 03 nachziehen (W11 Faktura-Kritik) |
| §3.1 Sheet „Preis erfassen“ | 200 / 120 ms | richtig (04 §3.5); 03 §8.11 „240 ms“ ist der Widerspruch |
| §4.7 S3 Erfolgsmoment | 400 ms | richtig; 04 §3.13 „Gilt für“ um „Wareneingang gebucht“ ergänzen |
| §2.2 Markierte Zeile 1200 ms | richtig | – |
| Undo-Balken | 8 s | 8 s (02 §6.1; 04 §2.3 „5000 ms“ ist der Widerspruch W5) |

---

## 3. Klickzahlen – Ist laut beschriebenem Weg und Soll nach den Änderungen

Zählweise 02 §1: Klicks/Enter ab Zentrale, ohne Suche, ohne Tippen in Felder; Bestätigen/Speichern zählt.

| Aufgabe | 10 nennt | Ist (gezählt) | Soll | Weg Soll |
|---|---|---|---|---|
| Veralteten Preis nachziehen (gleich geblieben) | 3 | 4 (Sortiment → Kachel → Schnellaktion → Speichern) | 3 | Zentrale „Zu tun: Preis läuft ab“ → „Preis bestätigen“ (Sheet, vorbelegt) → Speichern |
| Neuen Preis erfassen | 3 | 4 | 3 | wie oben, „Preis erfassen“ |
| Neues Produkt anlegen | 2 + Felder | 8 (Sortiment → Neu ▾ → Produkt → 4 × Weiter → Fertig) | 3 + 3 Felder | Sortiment → „+ Produkt“ → Anlegen und öffnen |
| Bilder ablegen | 2 (ab Akte) | 4 + Drop + n × Quelle | 4 + Drop | Sortiment → Produkte → Zeile → Drop (Abschnitt Bilder im Tab „Produkt“, Quelle einmal) |
| Produkt zur Freigabe geben | 1 (ab Akte) | 4 | 4 | Sortiment → Produkte → Zeile → „Zur Freigabe geben“ (oder Liste `Shift+Enter` = 3) |
| Bilder einer Marke freigeben (Leitung) | 2 | 5 (Sortiment → Freigaben → markieren → Freigeben → Vorschau bestätigen) | 3 | Zentrale „Zu tun: Bilder Bora (12)“ → „Alle 12 freigeben“ → Undo-Toast (Markenbeleg vorhanden; ohne Beleg +1 Upload) |
| Produkte veröffentlichen (Leitung) | 2 | 5 | 4 | Zentrale „Wartet auf Freigabe (6)“ → Alle → Veröffentlichen → Dialog bestätigen (bleibt: öffentlich) |
| AB erfassen und abgleichen | 3 | 7 (Sortiment → Kachel → Zeile → AB einlesen → Weiter → Abgleich erzeugen → Freigeben) | 5 | Zentrale „AB einlesen“ → Zeile-Aktion → A10 Schritt 1 Weiter → „Abgleich erzeugen“ → „AB bestätigen“ (ohne Abweichung) |
| Abweichung bewerten | 1 je Zeile | 1 je Zeile + 4 bis zur Tabelle | 1 je Zeile + 2 | Zentrale „Abweichungen bewerten“ → Zeile → `1/2/3` |
| Wareneingang buchen (Büro) | 2 | 5 (Sortiment → Bestellungen → Zeile → Wareneingang → Buchen) | 4 | Zentrale „Wareneingang erwartet“ → „Eingang buchen“ → „Alles ok“ → Buchen |
| Lieferung am Packtisch | 0 + Scan | 3 + Scan | 2 + Scan | Scan → „Alles ok“ → Buchen (F6) |
| Preis/Lieferzeit im Kundengespräch | 1 | 1 (⌘K + Enter) | 1 | unverändert |

---

## 4. Tastenbelegung Sortiment (Vorschlag, ersetzt die Kürzel in 10 §2–§4, §7)

Grundregel wie `20-kritik-ux-faktura.md` §4: Einzelbuchstaben gehören Shell und DataTable; Bereichsaktionen `Shift+Buchstabe`; Zeilen-Primäraktion `Shift+Enter`; Mails und öffentliche Wirkung nie auf einer Einzeltaste; nichts wirkt in Eingabefeldern; alles abschaltbar.

### 4.1 Kollisionen in 10 (Ist → Soll)

| Kürzel in 10 | Ort | Kollidiert mit | Soll |
|---|---|---|---|
| `Alt+←/→` Seite blättern | §2.2 | Browser-Zurück/Vor (Windows) | `←/→` bei Tabellenfokus (02 §9.2) |
| `e` CSV | §2.2 | 02 §9.1 `E` Bearbeiten | kein Kürzel (W7 Faktura-Kritik) |
| `p` Preis erfassen | §2.2 | Akte `p` Drucken (05 T5); in Bestellungen `p` PDF | `Shift+P` Preis erfassen; `p` bleibt Drucken/PDF-Vorschau |
| `v` Vorschau Website | §2.2 | – (Einzeltaste Bereich) | `Shift+V` |
| `s` Senden | §2.6 | 02 §9.2 `S` Status (in Produkte so verwendet) | `Shift+S` (öffnet Dialog) |
| `a` AB einlesen / Schnellaktion | §2.1, §2.6 | 02 §9.2 `A` Zuweisen | `Shift+A` AB einlesen; Schnellaktion `Shift+Enter` |
| `w` Wareneingang | §2.6 | – | `Shift+W` |
| `b` Bildfreigabe anfordern | §2.4 | `b` in Lieferanten = neue Bestellung | kein Kürzel (Mail); `Shift+B` = Neue Bestellung in Marke, Lieferant, Produkt |
| `l` Lieferant | §2.4 | – | `Shift+L` |
| `o` / `p` / `x` Bewertung | §3.3 | `x` = auswählen, `p` = Drucken | `1` OK · `2` Rückfrage · `3` Ablehnen (im Grid) |
| `Enter` freigeben, `Backspace` ablehnen | §2.9 | `Enter` = öffnen, `Backspace` = Chip entfernen | `1` Freigeben · `3` Ablehnen · `Enter` Lightbox |
| `Leertaste` markieren, `z` Lightbox | §2.9 | Liste: `Leertaste` = Peek, `x` = auswählen (W1) | `x` markieren · `Leertaste` Lightbox (= Peek) |
| `[` / `]` Marke wechseln | §2.9 | 02 §9.1 Seitenleiste | `Alt+↑/↓` (02 §9.1 „nächster Datensatz“) |
| `q` Quelle öffnen | §2.9 | Einzeltaste Bereich | `Shift+Q` |
| `⇧=` alle wie bestellt | §4.7 A10 | auf deutscher Tastatur nicht drückbar | Knopf; `=` in leerer Zelle |
| `Shift+Enter` zurück | §2.3 | Zeilenumbruch, Zeilen-Primäraktion | entfällt (P5); in Assistenten kein Zurück-Kürzel |
| `g o` | §2.1 | 03 §8.13 `G O` Faktura › Offene Posten | Fundament (K11) |
| `Shift+Klick` Peek | §2.2 | Bereichsauswahl (02 §5, 03 §8.7) | Peek per `Leertaste` oder Knopf `panel-right` in der Zeile |
| F4 Foto | §7 Packtisch | 02 §9.5 F4 Etikett | F7 Foto |

### 4.2 Belegung

| Kontext | Taste | Wirkung |
|---|---|---|
| Global | wie 02 §9.1 (`⌘K`, `/`, `?`, `g`+Buchstabe, `n`, `e`, `⌘S`, `⌘Enter`, `⌘Z`, `Esc`, `⌘P`, `[` `]`, `Alt+↑↓`) | unverändert |
| Liste (alle Sortiment-Listen) | `↑↓` `j k` · `Enter` · `Leertaste` · `x` · `Shift+↑↓` · `s` · `c` · `1–9` · `←→` · `Shift+Enter` | Zeile · öffnen · Side-Peek · auswählen · Bereich · Status · Kommentar · Ansicht/Chip · Seite · Zeilen-Primäraktion |
| Produkte | `Shift+P` · `Shift+V` · `Shift+B` | Preis erfassen · Website-Vorschau (de) · in Bestellung übernehmen |
| Marken / Lieferanten | `Shift+B` · `Shift+L` | Neue Bestellung · Lieferant öffnen/anlegen |
| Bestellungen | `Shift+S` · `Shift+A` · `Shift+W` · `p` | Senden (Dialog) · AB einlesen · Wareneingang buchen · PDF-Vorschau |
| Abgleich-Tabelle (Grid) | `↑↓` · `1` `2` `3` · `c` | Zeile · OK / Rückfrage / Ablehnen · Kommentar |
| Freigaben (Grid) | Pfeile · `x` · `Leertaste` · `1` · `3` · `Shift+Q` · `Alt+↑↓` | Kachel · markieren · Lightbox · Freigeben · Ablehnen · Quelle öffnen · Marke wechseln |
| Akte | `Alt+1…5` · `p` · `.` · `⌘Enter` | Tab · Drucken · Aktionsmenü · Primäraktion |
| Kanban | `←→` `↑↓` · `Enter` · `m` | Karte · öffnen · Verschieben-Menü (öffnet bei Zielen mit Dialog denselben Dialog wie der Drop) |
| Assistent | `Enter` · `⌘Enter` · `⌘⇧Enter` · `Esc` | weiter (außerhalb Textfeld) · weiter (überall) · ausführen (letzter Schritt) · abbrechen |
| Packtisch | F2 · F6 · F7 · F8 · Scan | Bestellung suchen · Buchen · Foto · Problem melden · Bestellung öffnen |

---

## 5. Korrigierte Wireframes

### 5.1 `/sortiment` – Bereichsstart „Zu tun“

```
┌ Zentrale › Sortiment                                                                [+ Neu ▾] ┐
│ Sortiment      Übersicht  Produkte  Marken  Bestellungen 8  Wareneingang  Freigaben 7  Mehr ▾  │  Tabs, Unterstrich 2 px Tinte
├───────────────────────┬───────────────────────┬───────────────────────┬──────────────────────┤
│ VERÖFFENTLICHT        │ OFFENE BESTELLUNGEN   │ MARKEN OHNE HÄNDLER-  │ IM SHOP OHNE GÜLTIGEN│  4 Kennzahlen, je Klick → Liste
│ 412                   │ 17                    │ STATUS  5             │ PREIS  3             │
│ +6 in 30 Tagen        │ Kein Vergleich        │                       │                      │
├───────────────────────┴───────────────────────┴───────────────────────┴──────────────────────┤
│ ZU TUN                                                     Meine · Alle          Berichte ↗  │
│ AB einlesen · 3                                                                              │
│   HB-2026-00041 · Gaggenau · Huber Küche · seit 9 Tagen, Frist 5            [AB einlesen]    │  Text-Knopf immer sichtbar
│   HB-2026-00044 · Ezarri · Hotel Seeblick · seit 6 Tagen                    [AB einlesen]    │
│ Abweichungen bewerten · 5                                                                    │
│   HB-2026-00038 · Bora · 2 offen                                            [Bewerten]       │
│ Wareneingang erwartet · 2                                                                    │
│   HB-2026-00033 · Ezarri · Termin 05.11.                                    [Eingang buchen] │
│ Preis läuft ab oder veraltet · 12                                                            │
│   Bora X Pure · 2.890,00 € UVP · veraltet seit 12.10.                       [Preis bestätigen]│
│   … alle 12                                                                                  │
│ Wartet auf Freigabe · 6        Bilder ohne Freigabe · 5 Marken                               │  Gruppen ohne Recht: „Leitung entscheidet“
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

Zeile: 40 px, Fokus mit `↑↓`, `Enter` öffnet das Objekt, `Shift+Enter` führt die Zeilenaktion aus. Gruppe leer → Gruppe entfällt; alle leer → „Alles erledigt – nichts zu tun im Sortiment.“ (Häkchen 32 px). Frischer Mandant → Karte „Erste Schritte“ (aus 10 §2.1, gut) an der Stelle von „Zu tun“. Laden: Kennzahlen und „Zu tun“ je eigener `<Suspense>`, Skeleton 4 Gruppen × 2 Zeilen.

### 5.2 Produktakte – Tab „Produkt“

```
┌ Sortiment › Produkte › Bora X Pure                                                                    ┐
│ [▣] Bora X Pure   ● Veröffentlicht  ● Im Shop                         [Preis erfassen ⇧P]  ⋯ Mehr      │  Kopf 56 px, 1 Primär
├ ⚠ Preis veraltet seit 12.10. – die Website zeigt keinen Preis.  Preis bestätigen →                   ┤  Band mit Text-Link
│ Produkt · Ausführungen 12 · Texte & SEO · Verwendung · Verlauf                                        │  5 Tabs, Alt+1…5
├────────────────────────────────────────────────────────────┬─────────────────────────────────────────┤
│ BILDER                                     [+ Bilder]       │ STATUS & WEBSITE                        │
│ ┌────┐ ┌────┐ ┌────┐ ┌ ─ ┐                                  │ ✓ Marke aktiv · Vertragshändler         │
│ │ ▣ ✓│ │ ▣ ✓│ │ ▣ ◷│  +    ◷ = Freigabe offen (Icon+Text)   │ ✓ Kategorie                              │
│ └────┘ └────┘ └────┘ └ ─ ┘  Reihenfolge: Menü oder ⌘⇧←/→     │ ✓ 2 Bilder freigegeben · 1 offen        │
│ PREIS                                                       │ ✕ Preis veraltet → Preis bestätigen     │
│ ab 2.890,00 € · UVP · Stand 12.04.2026 · veraltet          │ ✓ Deutscher Text · en fr it fehlen      │
│ [Preis bestätigen] [Preis erfassen]  Verlauf ▾ (Stufenlinie) │ ○ Lieferzeit nicht freigegeben          │
│ LIEFERZEIT & VERSAND                                        │ Website: aktualisiert vor 2 Min.        │
│ 6–8 Wochen · nicht freigegeben  [Freigeben] (Leitung)       │ Vorschau ▾ de en fr it                  │
│ STAMMDATEN (inline)                                         ├─────────────────────────────────────────┤
│ Art.-Nr. · EAN · Collection · Serie · Designer · Herst.-URL │ ZUORDNUNG                               │
│                                                             │ Marke Bora ↗ · Kategorie · Welt · Typ    │
│                                                             │ VERKNÜPFUNGEN                           │
│                                                             │ Anfragen 4 · Aufträge 2 · Bestellungen 1│
└────────────────────────────────────────────────────────────┴─────────────────────────────────────────┘
```

Unter 1280 px rutscht die rechte Spalte unter „Bilder“ (Status & Website zuerst). Lade-Zustand: Kopf echt, Abschnitte als Skeleton in Zielhöhe; Tabs außer „Produkt“ lazy mit eigenem Skeleton (05 T5).

### 5.3 Abgleich-Zeile (Bestellakte, Tab Auftragsbestätigung)

```
│ Pos │ Bezeichnung      │ Feld   │ Bestellt   │ AB         │ Abweichung        │ Bewertung                        │
│ 1   │ X Pure Edelstahl │ Termin │ 01.12.2026 │ 18.12.2026 │ +17 Tage          │ [ OK 1 | Rückfrage 2 | Ablehnen 3 ] │
│ 3   │ Umluftfilter     │ Preis  │ 189,00 €   │ 199,00 €   │ +10,00 € (+5,3 %) │ [ OK | ●Rückfrage | Ablehnen ]   │
│     │ Kommentar: „Rückfrage an Bora 25.10.“ · Lena · vor 2 Tagen                                          │
├ 2 offen (Rückfrage zählt als offen)                                [AB bestätigen] deaktiviert: „2 offen“ ┤
```

„Ablehnen“ für Mitarbeiter: Segment deaktiviert, sichtbarer Text „nur Leitung“ beim Fokus (Tooltip am Desktop, Text am iPad).

### 5.4 Schnellanlage „Neues Produkt“ (Dialog md 560 px)

```
┌ Neues Produkt ──────────────────────────────────────────────── ✕ ┐
│ Marke*        [Bora                ▾]  ● Vertragshändler · aktiv  │
│ Kategorie*    [Kochfeld mit Dunstabzug ▾]                         │
│ Bezeichnung*  [X Pure                                    ]        │
│ Art.-Nr.      [XPU                 ]                              │
│ ⓘ Gibt es schon: Bora X Pure (Veröffentlicht) · Öffnen ↗         │  Dublette live
│ Weitere Angaben ▾  (EAN, Typ, Collection, Serie, Designer)        │
│ Web-Adresse: /produkte/kochfeld-mit-dunstabzug/bora-x-pure        │
├───────────────────────────────────────────────────────────────────┤
│                             [Abbrechen] [Anlegen] [Anlegen und öffnen ⌘↵] │
└───────────────────────────────────────────────────────────────────┘
```

Fehler: Pflichtfeld leer → Text unter dem Feld, Fokus auf das erste; Server lehnt ab → Meldung am Feld, Dialog bleibt. Doppelklick-Schutz über `pending`; `idempotency_key` bleibt Lücke (10 §9.2).

### 5.5 Freigabe-Schreibtisch – Auswahl-Fuß

```
├ 2 markiert · Gilt mit Bildfreigabe Bora vom 12.03.2026 (Beleg ↗)    [Ablehnen 3] [Freigeben 1] · Esc ┤
├ 2 markiert · Gaggenau hat keine Bildfreigabe – Beleg für diese Bilder:  [Beleg hochladen]  [Freigeben] deaktiviert ┤
```

---

## 6. Glossar Oberfläche (Wert in Frappe → Anzeige)

| Objekt | Wert | Anzeige | Badge-Ton (03 §1.5) |
|---|---|---|---|
| Produkt | `Entwurf` | Entwurf | grau |
| Produkt | `Geprueft` | Wartet auf Freigabe | blau |
| Produkt | `Aktiv` | Veröffentlicht | grün |
| Produkt | `Pausiert` | Pausiert | orange |
| Produkt | `Ausgelaufen` | Ausgelaufen | grau (03 listet rot; Ende des Lebenslaufs ist kein Problem – 03 ändern, §7 W17) |
| Produkt | `verkauf_online = 1` | Im Shop | Chip |
| Produkt | `website_sichtbar = 0` | Ausgeblendet | Chip |
| Produkt | `preisstand_alt = 1` | Preis veraltet | orange |
| Workflow | `Prüfen` | Zur Freigabe geben | – |
| Bestellung | `AB geprueft` | AB bestätigt | türkis |
| Bestellung | `Teilgeliefert` | Teilweise geliefert | orange |
| AB-Bewertung | `ok` / `pruefen` / `abgelehnt` | OK / Rückfrage / Abgelehnt | grün / orange / rot |
| Wareneingang | `Offen` / `Teilweise` / `Vollstaendig` / `Reklamiert` | nichts erhalten / teilweise / vollständig / Reklamation | grau / orange / grün / rot (10 §2.8 „Teilweise blau“ ändern) |
| Position | `ok` / `beschaedigt` / `Transportschaden` / `falsch` / `fehlt` | in Ordnung / beschädigt ab Werk / Transportschaden / falscher Artikel / fehlt | – |
| Preisliste | `Hochgeladen` / `Geprueft` / `Uebernommen` / `Verworfen` | Eingelesen / Abgeglichen / Übernommen / Verworfen | blau / türkis / grün / grau, ohne Durchstreichen (nur `docstatus 2`, 03 §1.5) |
| Marke | `Anfrage laeuft` / `Keiner` / `Haendler` / `Vertragshaendler` | Anfrage läuft / kein Händlerstatus / Händler / Vertragshändler | blau / orange / grün / grün |
| Bild | `freisteller` / `ambiente` / `detail` | Freisteller / Ambiente / Detail | – |
| Bildfreigabe | `erteilt` / offen / abgelehnt | Freigegeben / Freigabe offen / Abgelehnt | grün `circle-check` / orange `clock` / rot `circle-x` |
| Welt | `Kueche` usw. | Küche usw. | – |
| Technik | Claim-Guard · Slug · Website-Cache erneuern · Revalidate | Händlerwort-Prüfung · Web-Adresse · Website jetzt aktualisieren · (nicht anzeigen) | – |
| Recht | Freigabe anfragen | Leitung bitten | – |

---

## 7. Widersprüche in 01–05, die Sortiment erbt (zusätzlich zu W1–W15 in `20-kritik-ux-faktura.md` §7)

| # | Widerspruch | Stellen | Vorschlag |
|---|---|---|---|
| W16 | Hochzählen von Kennzahlen: „zählen nicht hoch“ ↔ „400 ms bei Änderung nach dem Laden“ | 02 §13 ↔ 04 §3.7 | 04 gilt (nur nach dem Laden), 02 §13 anpassen |
| W17 | „Ausgelaufen“ rot ↔ Regel „Rot ist immer Abbruch/Problem“ | 03 §1.5 Tabelle ↔ 03 §1.5 Regel | Ausgelaufen grau |
| W18 | Kanban „fehlgeschlagen springt zurück 240 ms ease-quiet“ ↔ 200 ms `--bo-ease-out` | 03 §8.8 ↔ 04 §3.4 | 04 |
| W19 | Unternavigation „Tabs“ ↔ „Pills“ in Bereichskonzepten | 02 §2.1 ↔ 10 §2.0 (Sortiment) | Tabs |
| W20 | Kürzel `G O` als Beispiel vergeben, Bereichsakkorde unvollständig (Shop, Sortiment, Marketing, Personal, Kundenkarte fehlen) | 03 §8.13 ↔ 01 A3 / 02 §9.1 | Fundament legt vollständige Akkord-Liste fest |
| W21 | Packtisch F4 „Etikett“ ↔ Wareneingang braucht Foto | 02 §9.5 ↔ 10 §7 | F7 Foto, in 02 §9.5 ergänzen |
| W22 | „Bereichsstart = Kennzahlen + Heute + Listen“ ↔ Bereichskonzepte mit Heute-Leiste doppelt zur Zentrale | 02 §2.1 ↔ 05 §7.4 | Heute-Leiste nur Zentrale; Bereichsstart = Kennzahlen + „Zu tun“ |

---

## 8. Ergänzungen zur QA-Liste (10 §10)

| # | Kriterium | Prüfung |
|---|---|---|
| QS1 | Kein Einzelzeichen ändert eine Bildfreigabe außer `1`/`3` bei Fokus im Freigabe-Grid; `Enter` und `Backspace` dort ohne Schreibwirkung | E2E Tastatur |
| QS2 | Kanban-Drop nach „Veröffentlicht“ öffnet den Veröffentlichen-Dialog; Abbrechen → Karte 200 ms zurück, kein Serveraufruf | E2E + Netzwerk-Mock |
| QS3 | Undo einer Bildfreigabe innerhalb 8 s: Website-API liefert das Bild nie (mit App-Änderung §9 A1) bzw. Toast-Hinweis vorhanden (ohne) | Staging |
| QS4 | Kein sichtbarer Rohwert (`Geprueft`, `Uebernommen`, `beschaedigt`, `Kueche`, `freisteller`) und keine Technikwörter (§6) | Text-Snapshot aller Sortiment-Routen |
| QS5 | Produktliste bei 1280 × 800 mit offener Seitenleiste ohne horizontalen Scroll; bei 200 % Zoom erste Spalte fixiert | Playwright Viewport |
| QS6 | Bildreihenfolge, Hauptbild und Kategorienbaum vollständig per Tastatur änderbar; Undo stellt alte Reihenfolge her | E2E |
| QS7 | AB-Bewertung: `1/2/3` setzen, `⌘Z` nimmt zurück, Fokus springt auf nächste offene Zeile; „Ablehnen“ für Mitarbeiter deaktiviert mit sichtbarem Grund | E2E zwei Rollen |
| QS8 | Übersicht: jede Zahl genau einmal; ≤ 10 Blöcke; leere Gruppe erscheint nicht | Snapshot |
| QS9 | Keine Akte mit mehr als 6 Tabs; je Region höchstens ein Primärknopf | Unit/axe-Regel |
| QS10 | Erstaufbau der Übersicht ohne Zahlenanimation; Kennzahl-Änderung nach Aktion zählt 400 ms | Motion-Spec |
| QS11 | Packtisch: Scan ohne offene Bestellung zeigt „Lieferant wählen“ und „Ohne Bestellung melden“; offline bleibt „Buchen“ möglich mit Status „wartet“ | E2E Kiosk, Offline-Emulation |
| QS12 | Schnellanlage: Esc vor „Anlegen“ legt nichts an; nach „Anlegen“ existiert genau ein Entwurf auch bei Doppelklick | E2E |
| QS13 | Text in Sand kommt nicht vor (außer ≥ 18,66 px fett); Δ % unter Schwelle in `ink-soft` | Kontrast-Scan hell/dunkel |
| QS14 | Showroom-iPad: Kundenansicht beim Start an; nach Umschalten auf Mitarbeiteransicht kein EK im DOM vor dem Neuladen | E2E iPad-Profil |

---

## 9. Anfragen aus dieser Kritik

| # | An | Anfrage | Grund |
|---|---|---|---|
| A1 | App ph_sortiment | Website-Aktualisierung bei Bild-, Preis- und Statusänderungen frühestens 10 s nach Speichern, Änderungen zusammenfassen | Undo vor Außenwirkung (P2) |
| A2 | Fundament | Kürzel-Registry mit Konfliktprüfung, abschaltbare Einzeltasten, `role="grid"`-Scope für Entscheidungstasten | P4, WCAG 2.1.4 |
| A3 | Fundament | vollständige `G`-Akkord-Liste inkl. Sortiment (W20) | K11 |
| A4 | Inhaber | Wer darf Preise freigeben (Mitarbeiter mit Quelle-URL oder nur Leitung)? | K7 |
| A5 | Fundament / 03 | W16–W19, W22 in 02/03/04 nachziehen | Konsistenz |
| A6 | Logistik-Konzept/-Kritik | F-Tasten Packtisch für Wareneingang (F7 Foto) abstimmen | W21 |

---

## 10. Was gut ist (beim Bau nicht verwässern)

- **„Bereit für Website“-Checkliste** mit Sprung zur Lücke und denselben Regeln wie der Server (§3.1, §11.1).
- **„Preis bestätigen“** als eigene Aktion für den häufigsten Fall (gleicher Preis, neuer Stand) (§3.1, §4.6).
- **Blocker vorher zeigen:** deaktivierte Übergänge mit Grund im Klartext, Vorprüfung vor dem Senden (§0.1, §4).
- **Kanban-Bestellungen mit Drop-Regeln** statt stillem Statuswechsel (§2.6) – das Muster gilt künftig auch für Produkte (P1).
- **AB-Abgleich als Split-View** mit denselben Toleranzen und Texten wie der Server (§4.7 A10).
- **Wareneingang bucht erst bei „Buchen“** – die Entscheidung, `wareneingang_anlegen` nicht zu verwenden (§4.5, B2), ist richtig.
- **Leere Kacheln als „Alles erledigt“**, „Erste Schritte“ für einen frischen Mandanten (§2.1).
- **Ehrliche Lückenliste** L1–L16 und Befunde B1–B10 mit Fundstellen (§9.3, §12).
- **Showroom-Kundenansicht** blendet EK und Notizen aus (§7).
