# 21 – Fachkritik Service (Konzept `10-konzept-service.md` gegen `Backend-Import/ph_service`)

**Zweck:** Fachliche, rechtliche und buchhalterische Prüfung des Service-Konzepts (Fassung 2) gegen den tatsächlichen Datenbestand der Frappe-App `ph_service` (README, 21 DocType-JSONs, Controller, `api/`, `utils/`, Fixtures, Reports, Scheduler) und die Nachbar-Apps, die das Konzept berührt (`ph_faktura` PH Gutschrift/PH Rechnung, `ph_crm` PH Kontakt). Ergebnis: Note, Befunde, Pflichtänderungen mit DocType/Feld/Methode.
**Stand:** 2026-11-04 · Rolle: Fachkritiker Möbelhandel (AT-Recht: VGG/ABGB-Gewährleistung, § 933b ABGB, UGB, KSchG, FAGG, UStG § 11/§ 16, BAO/RKSV, DSGVO, ArbVG/AVRAG, GlBG; Buchhaltung) + Frappe-Datenprüfer · Status: Prüfbericht, keine Inhaber-Entscheidung.

**Geprüft (gelesen):** `10-konzept-service.md` (vollständig, §0–§13) · `ph_service/README.md` · alle DocType-JSONs (Felder, Pflicht, read-only, permlevel, Rechte) · Controller `ph_servicefall.py` (708 Zeilen, Stand der Prüfung), `ph_serviceeinsatz.py`, `ph_ersatzteil.py`, `ph_ersatzteilbestellung.py`, `ph_lieferantenregress.py`, `ph_pflege_abo.py`, `ph_serviceauftrag.py` · `fristen.py`, `kommunikation.py`, `tasks.py`, `ereignisse.py`, `kennzahlen.py`, `install.py`, `hooks.py` · `utils/` (`sla.py`, `kulanz.py`, `regress.py`, `schritte.py`, `aufbewahrung.py`, `einsatz.py`, `medien.py`) · `api/__init__.py` (Portal + Website) · Fixtures `workflow.json`, `email_template.json`, `custom_field.json` · Reports `ph_reklamationsquote_je_marke.py`, `ph_servicekosten.py` · Querprüfung `ph_faktura`: `ph_gutschrift.json/.py`, `ph_beleg_position.json`, `ph_rechnung.json` (`mahnsperre`), `ph_mahnung.py`.

**Wichtiger Hinweis zum Datenstand:** `ph_service` wird **während dieser Prüfung** geändert (Git: 12 Dateien `M`, `utils/` und zwei Testdateien `??`, nicht committet; `ph_servicefall.py` wuchs zwischen zwei Lesevorgängen von 573 auf 708 Zeilen). Mehrere Lücken aus Konzept §12 sind dadurch bereits geschlossen, andere Felder existieren schon ohne Methode. Alle Befunde beziehen sich auf den Dateistand am 2026-11-04 zum Prüfzeitpunkt; §1 listet, was das Konzept deshalb nachziehen muss.

**Lesart der Markierungen:** **[FALSCH]** Konzept behauptet etwas, das der Code (nicht mehr) hergibt · **[FEHLT-DATEN]** UI-Funktion ohne Feld/Methode · **[UNGENUTZT]** Daten/Methode vorhanden, Konzept nutzt sie nicht · **[RECHT]** Verstoß/Risiko · **[BUCH]** Buchhaltungslogik · **[PROZESS]** fehlender Pflichtprozess · **[RAND]** fehlender Randfall · Schwere **K** = vor Bau klären (blockiert oder rechtswidrig), **H** = vor Produktivgang, **M** = Qualität.

---

## 0. Ergebnis in Kürze

| Kriterium | Bewertung |
|---|---|
| Oberfläche, Zustände, Kürzel, Leer-/Fehlerzustände, Motion | sehr gut, konkret, testbar (45 QA-Punkte) |
| Abgleich mit `ph_service` | in Fassung 2 gründlich, aber durch den Parallelumbau **teilweise veraltet**: 9 Annahmen stimmen nicht mehr, 6 neue Datenbereiche (SLA, Kulanz-Status, Regress-Abgleich, Medientyp, Aufbewahrung, Sachart) fehlen im Konzept (§1, §3) |
| Fristenlogik Gewährleistung | rechnet Ampel und Beweislast gegen **heute** statt gegen den Zeitpunkt des Hervorkommens/der Meldung → rechtzeitig gemeldete Mängel erscheinen als „Abgelaufen – nur Kulanz“ (R-01, **K**) |
| Regress § 933b / Mängelrüge § 377 UGB | Lieferant wird erst **nach** Erledigung informiert; „Gemeldet“ wird als Fristwahrung behandelt (R-02, R-03, **K**) |
| Pflichtprozesse Möbelhandel (Austausch, Wandlung/Rückabwicklung, kostenpflichtige Reparatur, Mahnsperre, Abo-Abrechnung) | im Konzept **nicht** vorhanden; der Service endet an der Gutschrift-Schaltfläche (§6) |
| Buchhaltung | Gutschrift aus dem Servicefall wird mit **0 % USt** und brutto = netto angelegt; Kulanz kann doppelt in die Kosten fließen; keine Währung (B-01 … B-08) |
| DSGVO | Fotos gehen standardmäßig an den Lieferanten (`an_lieferant` Standard 1); „Widerruf erfassen“ wie im Konzept beschrieben wird vom Controller **rückgängig gemacht** (R-05, R-06, **K**) |
| Randfälle Storno/Teillieferung/Anzahlung/Retoure/CHF/ohne E-Mail | überwiegend nicht behandelt; Kunde ohne E-Mail kann vom Mitarbeiter **nicht geschlossen** werden (§7) |

**Note: 6 / 10.** Als UX-Konzept 8–9. Gedrückt wird die Note durch zwei Rechtsfehler mit Kundenwirkung (Fristampel gegen „heute“, Widerruf wird überschrieben), die falsche Regress-Reihenfolge, das Fehlen jeder Abwicklung nach der Entscheidung (Austausch, Rückabwicklung, Kostenpflicht) und die USt-lose Gutschrift. Mit den Pflichtänderungen in §8 (K und H) erreichbar: 8–9.

---

## 1. Falsche oder veraltete Annahmen im Konzept [FALSCH]

| # | Stelle im Konzept | Behauptung | Tatsächlich im Code (Prüfstand) | Folge / Pflichtänderung |
|---|---|---|---|---|
| F1 | §0.1 P11, §2.11, §2.14, QA 33 | Fehlerkatalog ist nach Installation leer, „Prüfung abschließen“ blockiert | `install.py.after_install → fehlerkatalog_anlegen()` legt 12 Bereiche und rund 58 Codes an (README Z. 24). Es fehlt nur der Code `<BER>-99 Sonstiges` | Leerzustand bleibt als Rückfall, aber „Standardkatalog übernehmen“ und der Erstbetriebs-Knopf „Fehlerkatalog einrichten“ entfallen; Anfrage an ph_service reduziert sich auf `-99`-Codes im Seed + `PH Fehlerbereich.after_insert` |
| F2 | §1.1, §2.3, §3.4 Übergangsregel, §9, §12 P1 | `erstreaktion_erfassen` fehlt; Übergang über Kommentar `[erstreaktion]` | Methode existiert (`erstreaktion_erfassen(kanal, notiz)`, setzt `erstreaktion_am/_kanal/_notiz`, Verlauf, schließt ToDos „Reaktionsfrist“). `before_insert` setzt `erstreaktion_am` **automatisch** bei `kanal in (Telefon, Showroom)`, wenn `PH Service Einstellungen.telefon_ist_erstreaktion = 1` (Standard 1) und `quelle` backoffice | (a) Kommentar-Übergangsregel, Fußnote „Zählung der App“, QA 26 streichen. (b) Der S1-Schalter „Erstreaktion erfolgt“ ist **wirkungslos**, solange der Server bei Telefon immer setzt → Schalter entfernen oder als Parameter `erstreaktion_erfolgt` an `insert` durchreichen und `before_insert` daran binden (P-14) |
| F3 | §3.4 Dialog „Erstreaktion erfassen“: Kanal *Telefon/Showroom/Rückruf* | Showroom ist wählbar | `erstreaktion_erfassen` erlaubt nur `Telefon, Vor Ort, Rückruf, E-Mail, Portal`; „Showroom“ → `Unbekannter Kanal.` | Dialog-Werte: Telefon · Vor Ort (Showroom) · Rückruf; gespeichert `Vor Ort` |
| F4 | §1.2, §4.5, §9, §12 P1, QA 41 | `kulanz_freigeben()` fehlt, Glocke braucht 3 Klicks über die Akte | `kulanz_freigeben(kommentar, betrag_cent)` existiert inkl. Betragsabgleich (Fehler bei zwischenzeitlicher Änderung), dazu `kulanz_anfordern()` und `kulanz_ablehnen(grund)`; Felder `kulanz_freigabe_status` (Nicht noetig/Angefordert/Freigegeben/Abgelehnt), `kulanz_angefordert_am`, `kulanz_freigegeben_cent`, `kulanz_abgelehnt_cent`, `kulanz_freigabe_kommentar` | Übergangsweg „Akte mit `?fokus=kulanz`“ streichen; Glocke ruft `kulanz_freigeben(betrag_cent=<angezeigter Betrag>)`. **Neu im Konzept nötig:** Knopf „Ablehnen“ in der Glocke (Dialog sm, Grund Pflicht) und Zustand „Kulanz abgelehnt“ im Nächster-Schritt (Mitarbeiter erhält ToDo, Betrag ändern → neue Anforderung) |
| F5 | §4.1, §9, §12 | Vorlagen „Ablehnung“ und „frei“ fehlen; Ablehnung über `vorlage="abschluss"` | `kunde_informieren(vorlage, zusatz, betreff)` akzeptiert `eingang, termin, abschluss, ablehnung, frei`; Templates „PH Service Ablehnung“, „PH Service Nachricht“, „PH Service Servicebericht“ im Fixture | Workaround „Betreff lautet Abschluss“ streichen; „Ablehnung mitteilen“ = `vorlage="ablehnung"` |
| F6 | §0 Nr. 6 Standardwerte, §2.13, §10 Nr. 1, §12 P2 | Reaktionsfrist fest 2 Werktage ohne Feiertage; Feiertage fehlen | `utils/sla.py`: Reaktions- **und Lösungsfrist je Priorität** (`sla_reaktion_*`, `sla_loesung_*`), Werktage ohne Wochenende **und** Feiertage (`feiertage()` aus ph_crm), Felder `frist_loesung`, `sla_status` (Im Plan/Gefaehrdet/Verletzt/Erfuellt), `sla_reaktion_verletzt`, `sla_loesung_verletzt`, `sla_eskalationsstufe`; Methode `sla_info()`; Prioritätswechsel berechnet Fristen neu | Konzept braucht ein **SLA-Band** in Akte/Liste (§3 U-01), Einstellungen-Karte „SLA“ und QA „Prioritätswechsel → neue Frist + Verlauf `SLA`“ |
| F7 | §3.4, §9 Zeile „Nächster Schritt“ | Regel nur clientseitig (`naechsterSchritt.js`), Aggregat fehlt | `utils/schritte.naechster_schritt(fall)` existiert serverseitig mit **anderer Reihenfolge** (Regress vor Kunde informieren; kein Schritt „Gutschrift erstellen“; Fälligkeit Rückfall `frist_loesung`), aber nicht whitelisted | Zwei Regelwerke laufen auseinander. Eine Quelle: Server-Logik whitelisten (`ph_service.api.naechste_schritte(names)`), Client nur Anzeige; §3.4 an die Server-Reihenfolge angleichen und fehlende Zeilen (Gutschrift, Kulanz abgelehnt, Rückabwicklung §6) dort ergänzen |
| F8 | §2.6, QA 14 | Bewegungsart „Inventur“ im Dialog | Child-Select `PH Ersatzteil Bewegung.art` kennt nur `Zugang/Verbrauch/Korrektur/Retoure`; `buchen()` wandelt Inventur in Korrektur um – funktioniert. **Aber:** „Korrektur“ und „Retoure“ haben Vorzeichen **+1**, Menge ≤ 0 wird abgewiesen → Schwund/Bruch und Rücksendung an den Hersteller sind **nicht** buchbar (nur über Inventur) | Dialog: Arten „Zugang · Verbrauch · Rücksendung an Lieferant (−) · Rückgabe vom Kunden (+) · Inventur (Zählwert)“; Pflichtänderung P-21 |
| F9 | §2.8, §1.4 | Buchhaltung extern sieht im Regress den Fall (Fristen-Punkt, regressfähige Kosten) | Rolle `PH Buchhaltung extern` hat **nur** auf PH Lieferantenregress `read, export`, auf PH Servicefall **keine** Rechte | Rechte Spalte der Regress-Akte für diese Rolle aus Regress-Feldern speisen (Betrag, Frist) oder Servicefall-Leserecht (permlevel 0) per Custom DocPerm; sonst 403 im Akte-Aggregat |
| F10 | §2.8 / §1.2 „Regress verrechnet: Gutschriftnummer tippen“ | Verrechnung über Workflow mit Nummer | Code bietet `gutschrift_erfassen(betrag_cent, nummer, datum, beleg, eingangsrechnung)` mit Teilbeträgen und Abgleich (`abgleich_status` Offen/Ausgeglichen/Unterdeckung/Ueberdeckung/Ausgebucht, `differenz_cent`, `quote_promille`) und `differenz_ausbuchen(grund)` (Leitung). Der Workflow-Weg „Regress verrechnet“ setzt `betrag_erhalten_cent = betrag_anerkannt_cent` **ohne Zahlungsnachweis** | Konzept-Primär „Regress verrechnet“ ersetzen durch „Gutschrift/Zahlung erfassen“ (Dialog md: Betrag*, Nummer, Datum*, Beleg, Eingangsrechnung); Workflow-Übergang nur noch für Formen ohne Geldfluss (B-05) |
| F11 | §2.4, §4.2, §12 P2 | `umplanen()` und `abbrechen()` fehlen, Status über `set_value` | Felder `umgeplant_am`, `abbruch_grund`, `planschluessel` (unique), `unterschrift_art` (Unterschrift/Name bestätigt/Verweigert/Kunde abwesend), `bericht_gesendet_am` existieren bereits, **Methoden noch nicht** | `set_value status` aus der UI streichen (umgeht `_status`, Verlauf, Ereignis); auf Methoden warten bzw. als K-Anfrage führen (P-12). `unterschrift_art` in Technik-Abschluss abbilden (vier Kacheln statt Canvas + Häkchen) |
| F12 | §2.13 Einstellungen | 6 Karten mit genannten Feldern | Einstellungen enthalten zusätzlich SLA (9 Felder), `telefon_ist_erstreaktion`, `ersatzteil_ueberfaellig_tage`, `wartung_automatisch`, `wartung_vorlauf_tage`, `einsatz_takt_min`, `einsatz_puffer_min`, `techniker_tag_von/_bis`, `regress_toleranz_cent`, `portal_videos_max`, `portal_video_max_mb`, Vorlagen `ablehnung/frei/servicebericht` | Karten „SLA“ und „Einsatzplanung“ ergänzen; „Kommunikation“ = 8 Vorlagen |

---

## 2. UI-Funktionen ohne Datenfeld oder Methode [FEHLT-DATEN]

Nur Punkte, die das Konzept **nicht** schon als „fehlt in App ph_service“ markiert hat.

| # | UI-Funktion (Konzept) | Was fehlt | Vorschlag DocType/Feld/Methode |
|---|---|---|---|
| D1 | §2.2 Spalte „Fristen ● 612 Tage“, §3.2 Kompaktvariante `tage_rest` | `tage_rest` ist **kein Feld**; `fristen_status` wird nur beim Speichern berechnet und veraltet täglich (Fall ohne Bewegung zeigt nach Monaten noch „Vermutung“) | Liste rechnet `tage_rest` clientseitig aus `gewaehrleistung_bis`; `fristen_status` per Scheduler täglich neu (`tasks.fristen_pruefen` → `db_set fristen_status`) **oder** Liste zeigt nur Datum, nie den gespeicherten Status |
| D2 | §3.2 Fristband „Eingabe: `fristen_info()`“ | `fristen_info()` ruft `fr.fristen()` **ohne** `sachart`, ohne `gewaehrleistung_monate` und `vermutung_monate` aus den Einstellungen → weicht für unbewegliche Sachen (36 Monate) und geänderte Einstellungen von den gespeicherten Feldern ab | `fristen_info` mit denselben Argumenten wie `_fristen_berechnen` aufrufen (P-02); Fristband zeigt `sachart` |
| D3 | §2.3/§3.1 Fristen-Felder | Feld `sachart` (Beweglich/Unbeweglich) existiert, Konzept zeigt es **nirgends** – relevant für Bad, Küche, eingebaute Sauna, Pool-Technik, Hotelausbau | Tab „Mangel & Fristen“: Segment „Sache: beweglich · fest eingebaut“ mit Tooltip „Fest eingebaut (z. B. eingemauert) – Gewährleistung 3 Jahre, Abgrenzung Kanzlei“; S1-Vollständig Schritt ③ |
| D4 | §3.1 Kosten-Karte „− An Kunden“ | `kosten_kunde_cent` ist eine Zahl ohne Beleg: keine Rechnung, keine Zahlung, kein Kostenvoranschlag | `PH Servicefall.kostenvoranschlag` (Link PH Angebot), `kosten_rechnung` (Link PH Rechnung), Methode `kosten_verrechnen()` → Entwurf PH Rechnung; `kosten_kunde_cent` read-only aus der Rechnung (§6 P-R3) |
| D5 | §2.9 Konditionen, §2.10 Serviceauftrag | Kein Weg zur Rechnung (Abo „Je Termin/Jährlich im Voraus“, Winterlager); Workflow „Abrechnen“ (Serviceauftrag) hat **keine Bedingung** | `PH Pflege Abo.rechnung_erstellen(zeitraum)`, `PH Serviceauftrag.rechnung_erstellen()`; Workflow-Bedingung `doc.rechnung` für „Abrechnen“ |
| D6 | §3.1 Bezüge „Stück“ | Kein Bezug auf die **Position** von Lieferschein/Rechnung/AB → Teilmenge, Wandlung einer Position, Reklamationsquote je Position nicht abbildbar | `PH Servicefall.beleg_position` (Data: `name` der PH Beleg Position) + `positions_menge`; S1-Bezugsvorschlag listet Positionen statt Belege |
| D7 | §3.4 „Erledigt, `kunde_informiert_am` leer → Kunde informieren“ | `kunde_informiert_am` wird **nur** durch Mail gesetzt; Kunde ohne E-Mail → Workflow „Schließen“ (Mitarbeiter: `kunde_informiert_am or abnahme_bestaetigt`) unerreichbar | Methode `kunde_informiert_erfassen(kanal: Telefon/Brief/Persönlich, notiz)` + Felder `kunde_informiert_kanal`, `kunde_informiert_notiz` (§7 R-E1) |
| D8 | §2.3 S1 Art-Segment | Art-Werte `Mangel … Serviceauftrag` decken **Falschlieferung/Fehlmenge** (Codes TRA-03/TRA-04 im Seed) und **Widerruf (FAGG)** nicht als eigene Vorgänge ab | Art `Falschlieferung/Fehlmenge` → Weiterleitung an ph_logistik (Nachlieferung), kein Gewährleistungsfall; Art „Rücktritt/Widerruf“ → Hinweis + Link in ph_shop/ph_faktura, **kein** Servicefall (§6 P-R6) |
| D9 | §2.7 Stornieren Bestellung | `stornieren(grund)` setzt **alle** Fall-Zeilen auf Benötigt, auch bereits eingetroffene; prüft den Status nicht (auch „Geliefert“ stornierbar) | Nur Positionen mit `menge_erhalten < menge` zurücksetzen; Storno ab `Geliefert` sperren; bei `Teilgeliefert` nur Rest stornieren (`rest_stornieren`) |
| D10 | §7 Technik-Abschluss Ersatzteile „aus_bestand“ vorbelegt | `PH Serviceeinsatz Ersatzteil.aus_bestand` Standard 1; Kommissionsteile (Kostenträger ≠ Lager) bekommen beim Wareneingang **keinen** Zugang → Verbrauch macht Bestand negativ → `buchen()` wirft → ganzer `abschliessen`-Aufruf rollt zurück, Offline-Warteschlange hängt | Vorbelegung `aus_bestand = 1` nur für Fall-Zeilen mit Status `Aus Bestand`; Zeilen `Eingetroffen` (Kommission) mit `aus_bestand = 0`; Server: `_ersatzteile_abbuchen` vor `save()` prüfen und als Teilfehler melden statt Abbruch (P-20) |
| D11 | §2.5 Abschluss-Tab, §3.1 Abnahme | `abnahme_unterschrift`, `abnahme_bestaetigt`, `abnahme_name`, `unterschrift_kunde` sind **nicht** read-only – Mitarbeiter kann eine Unterschrift nachträglich ersetzen | Felder `read_only`, Änderung nur über `abnahme_erfassen`; zweites Erfassen nur Leitung mit Grund (Beweiswert der Abnahme) |
| D12 | §2.5/§7 Einsatz-Zeiten | Arbeitszeit = `abfahrt − ankunft` ohne Pause, Anfahrt = `anfahrt_min × 2`; `utils/einsatz.zeiten()` mit Takt/Pause existiert, wird nicht benutzt | Techniker-Abschluss Schritt „Zeiten prüfen“ (Pause, Anfahrt), Server nutzt `utils/einsatz.zeiten` |
| D13 | §2.4 A14 „freie Zelle“ | `utils/einsatz.freie_fenster()` existiert (Tag 08–17, Takt, Puffer aus Einstellungen), nicht whitelisted | `ph_service.api.freie_fenster(techniker, datum, dauer_min)` freigeben; Konzept §9-Lücke „freie_slots_techniker“ darauf umstellen |

---

## 3. Daten im Code, die das Konzept nicht nutzt [UNGENUTZT]

| # | Datenbereich | Was es kann | Konzept-Ergänzung (Komponente, Zustände) |
|---|---|---|---|
| U-01 | SLA (`frist_loesung`, `sla_status`, `sla_*_verletzt`, `sla_info()`) | Lösungsfrist je Priorität, Status Im Plan/Gefährdet/Verletzt/Erfüllt | **SLA-Zeile** unter der Phasenleiste: „Lösung bis 24.11. · noch 6 Werktage“ (Ton: Im Plan `muted`, Gefährdet `warning-text`, Verletzt `danger-text` + Icon `clock`); zählt im Rang „ein rotes Signal je Zeile“ zwischen „Reaktion überfällig“ und „Fristen abgelaufen“; Reiter „SLA gefährdet“ in `/service/faelle` |
| U-02 | Kulanz-Status (4 Werte) | Freigabe deckt nur den freigegebenen Betrag; Erhöhung → neue Anforderung | Banner-Text je Status; Erhöhung nach Freigabe zeigt Inline-Hinweis „Neuer Betrag 720,00 € – Freigabe gilt für 620,00 € · Freigabe neu anfragen“ |
| U-03 | Regress-Abgleich (`abgleich_status`, `differenz_cent`, `quote_promille`, `gutschrift_datum`, `ausgebucht_*`) | Teilgutschriften, Unter-/Überdeckung, Ausbuchen mit Grund | Regress-Liste Spalte „Abgleich“ (Badge), Reiter „Unterdeckung“; Akte-Karte „Soll 1.200,00 € · Ist 900,00 € · fehlt 300,00 €“ + Knöpfe „Gutschrift erfassen“, „Differenz ausbuchen“ (Leitung, Dialog rot, Grund Pflicht, kein Undo) |
| U-04 | `PH Servicefall Foto.medientyp` (Bild/Video/PDF), Portal-Videos | Kunde kann Videos und PDFs schicken | Galerie: Video-Kachel mit Play-Icon und Dauer, PDF-Kachel mit Dateiname; Betrachter spielt Video ohne Autoplay; Upload-Grenzen aus `portal_video_max_mb` |
| U-05 | `utils/aufbewahrung.py` (Löschen/Anonymisieren nach Fristen) | Regel je Fall/Vertrag/Einsatz | Nicht verdrahtet (kein Scheduler, keine Methode). Konzept braucht DSGVO-Ansicht (R-07) |
| U-06 | `uebergabe_quelle` | Zeigt, aus welchem Beleg das Übergabedatum stammt | Fristband-Statuszeile: „Übergabe 14.03.2026 aus Lieferschein LS-… (zugestellt)“ – Pflicht, weil die Quelle die Frist bestimmt (R-04) |
| U-07 | `quelle`/`ip_hash`/`idempotency_key` | Herkunft Website/Portal | Kennzeichen „Website“ vs. „Portal“ getrennt (Website-Meldungen sind nicht authentifiziert, §4 R-08) |

---

## 4. Recht [RECHT]

| ID | Schwere | Recht | Konzeptstelle | Befund (Code) | Pflichtänderung |
|---|---|---|---|---|---|
| R-01 | **K** | § 10/§ 11 VGG, § 924/§ 933 ABGB | §3.2 Fristband, §3.1 Banner „Fristen abgelaufen → Nur Kulanz oder kostenpflichtig – Art prüfen“, §3.4 letzte Zeile, Liste Spalte Fristen | `fristen()` bestimmt Status und Beweislast mit `heute`. Maßgeblich für Gewährleistung ist, ob der Mangel innerhalb der Frist hervorgekommen/geltend gemacht ist, für die Vermutung (§ 11 VGG), ob er innerhalb eines Jahres **hervorkommt**. Ein am 10.03.2028 gemeldeter Mangel (Übergabe 14.03.2026) steht ab 15.03.2028 auf „Verjährungsfrist“, ab 15.06.2028 auf „Abgelaufen“ – das Banner fordert dann „Art auf Kulanz prüfen“, obwohl der Anspruch rechtzeitig erhoben wurde | Zwei Bezugsdaten trennen: **Anspruchsstatus** gegen `gemeldet_am` (bzw. `erstauftreten`, wenn früher) → `fristen_status_bei_meldung` (neu, read-only, beim Insert fixiert); **Verjährungswarnung** gegen heute nur für die gerichtliche Geltendmachung (`verjaehrung_bis`). Banner „nur Kulanz“ ausschließlich, wenn `fristen_status_bei_meldung = Abgelaufen`. Beweislast aus `erstauftreten`/`gemeldet_am` ≤ `beweislast_bis`. Wortlaut von Kanzlei bestätigen (Fragen §10 K1) |
| R-02 | **K** | § 377 UGB (Mängelrüge gegenüber dem Lieferanten, beiderseitig unternehmensbezogen) | §3.4 „Erledigt … → Lieferant informieren (S4)“, S4 Start „Erledigt mit lieferantenrelevant“, §2.8 Leerzustand | Platzhirsch ist gegenüber dem Lieferanten selbst Käufer. Versteckte Mängel sind dem Lieferanten nach Hervorkommen binnen angemessener Frist anzuzeigen, sonst drohen Gewährleistungsansprüche gegen ihn verloren zu gehen. Das Konzept informiert den Lieferanten **erst nach der eigenen Erledigung**, oft Wochen nach der Prüfung | Zweistufig: **(1) Mängelanzeige an Lieferant** sofort nach „Prüfung abschließen“ mit `mangel_bestaetigt in (Ja, Teilweise)` und `lieferantenrelevant` (neuer Nächster-Schritt in „Geprüft“/„Entscheidung“, Fälligkeit = Prüfdatum + `ruege_tage` aus Einstellungen, Standard vom Inhaber/Kanzlei); Methode `maengelanzeige_senden(empfaenger, zusatz)` → Felder `maengelanzeige_am`, `maengelanzeige_an`. **(2) Regressforderung** (Betrag) nach Erledigung wie bisher. Wareneingangs-Schäden (Art Transportschaden, Kanal Wareneingang): Anzeige am selben Tag |
| R-03 | **K** | § 933b ABGB (Rückgriff: 2 Monate ab Erfüllung, absolut 5 Jahre; Geltendmachung) | §0 Nr. 5, §2.8, Fristband „Regressfrist“, Reiter „Frist ≤ 14 Tage“ | Workflow „Beim Lieferanten melden“ (E-Mail) setzt `Gemeldet`; Fristanzeige und Scheduler behandeln den Regress danach als gewahrt. Nach dem Wortlaut ist der Rückgriff **gerichtlich** geltend zu machen, sofern der Vormann nicht anerkennt oder auf den Einwand verzichtet (Kanzlei bestätigen). Zusätzlich setzt § 933b einen Gewährleistungsfall gegenüber einem **Verbraucher** voraus; Kulanzleistungen und Unternehmerkunden (Hotel, Yacht) fallen nicht darunter | Felder `PH Lieferantenregress.rechtsgrundlage` Select (§ 933b ABGB · Gewährleistung Kaufvertrag · Garantie Hersteller · Kulanz Hersteller), `anerkenntnis_schriftlich` Check + `anerkenntnis_beleg` Attach, `verjaehrungsverzicht_bis` Date, `klage_eingebracht_am` Date. Fristampel bleibt rot bis eines davon gesetzt ist; Text „Gemeldet – Frist nicht gewahrt, bis Anerkenntnis oder Klage“. `regress_frist_bis` im Fall nur berechnen, wenn `kundentyp = Verbraucher` und `entscheidung in (Verbesserung, Austausch, Preisminderung, Wandlung)`; sonst Text „Kein § 933b – Vertragsansprüche gegen Lieferant prüfen“ |
| R-04 | **H** | § 933 ABGB / VGG (Fristbeginn mit Übergabe) | §2.3 Bezug, §3.2 | `_bezug_uebernehmen` nimmt **zuerst** `PH Lieferschein.zugestellt_am`, dann `PH Montageauftrag.abgenommen_am`. Bei Küche/Bad mit Montage durch Platzhirsch ist die Übergabe in der Regel die Fertigstellung, nicht die Zustellung → Frist beginnt zu früh, zum Nachteil des Kunden | Reihenfolge: Montage-Abnahme > Projektübergabe > Zustellung > Produktpass; Konzept zeigt `uebergabe_quelle` (U-06) und erlaubt Umschalten der Quelle (Select mit den gefundenen Daten); Kanzlei bestätigt Regel für Werklieferung (§10 K2) |
| R-05 | **K** | Art. 7 Abs 1 und 3 DSGVO (Nachweis, Widerruf), § 174 TKG 2021 | §2.9 Tab Einwilligung „Widerruf erfassen (setzt `nachkauf_widerrufen_am`)“, QA 43 | `PHPflegeAbo._einwilligung_pruefen`: ist `nachkauf_einwilligung = 1` und `nachkauf_widerrufen_am` gesetzt, wird das als **neue Einwilligung** gewertet: `nachkauf_einwilligung_am = jetzt`, `nachkauf_widerrufen_am = None`. Der Konzept-Weg löscht also den Widerruf und erzeugt eine Einwilligung ohne Erklärung des Kunden | „Widerruf erfassen“ setzt **`nachkauf_einwilligung = 0`** (Controller setzt dann `widerrufen_am`). Controller: Erneute Einwilligung nur über Methode `einwilligung_erfassen(textversion, quelle, nachweis)` mit Pflicht `nachkauf_textversion` + Nachweis (Portal-Klick, unterschriebenes Formular), nie durch Häkchen; Felder read-only für alle außer dieser Methode. QA: „Widerruf → nach Speichern `nachkauf_einwilligung=0`, `widerrufen_am` gesetzt, Scheduler erzeugt keinen Nachkauf-Hinweis“ |
| R-06 | **K** | Art. 5 Abs 1 lit c, Art. 6, Art. 13 DSGVO (Datenminimierung, Übermittlung an Dritte) | §4.4 S4 „Fotoschritt entfällt, wenn alle Fotos markiert“ | `PH Servicefall Foto.an_lieferant` Standard **1** → jedes Foto (auch Kundenfotos aus der Wohnung, mit Personen, Kennzeichen, Hausnummer) ist vorgewählt; der Auswahlschritt entfällt damit praktisch immer | Standard `an_lieferant = 0` für `quelle in (Kunde, Techniker)`, `1` nur für `Intern`/`Wareneingang`; S4-Fotoschritt **immer** zeigen, wenn mindestens ein Kundenfoto dabei ist, mit Hinweis „Nur das Produkt zeigen – Personen und Wohnungsdetails nicht senden“; Eingangsbestätigung/Datenschutzinfo nennt „Weitergabe von Fotos an den Hersteller zur Reklamation“ (Art. 13) – Text Kanzlei |
| R-07 | **H** | Art. 15, Art. 17 DSGVO; § 132 BAO | Konzept hat **keine** Auskunft/Löschung im Service | `utils/aufbewahrung.py` liefert Regeln, ist aber nicht verdrahtet. `vertrag()` anonymisiert beendete Pflege-Abos **sofort** – damit gehen der Einwilligungsnachweis (Art. 7 Abs 1) und vertragsbezogene Unterlagen verloren | (a) Kundenakte-Auskunft (Art. 15) muss Servicefälle, Fotos, Unterschriften, Einsätze, Abos, Regress-Mails enthalten → `ph_service.api.auskunft(kontakt)`. (b) Monatlicher Löschlauf `tasks.aufbewahrung_pruefen` mit Vorschau-Liste für die Leitung (`/service/einstellungen?tab=aufbewahrung`: Tabelle Fall · Aktion · Grund · Frist; Knopf „Anonymisieren (n)“, Dialog rot, kein Undo). (c) `vertrag()`: Einwilligungsnachweis 3 Jahre nach Widerruf/Ende aufbewahren (Kanzlei), Rechnungsbezug 7 Jahre |
| R-08 | **H** | Art. 32 DSGVO, Zuordnung | §8 Portal/Website, Reiter „Neu von Kunden“ | `create_service_case` (Website, ohne Login) sucht `PH Kontakt` **nur per E-Mail** und hängt den Fall an diesen Kontakt (inkl. `portal_sichtbar`) – wer eine fremde Adresse eintippt, legt Fälle in fremden Kundenakten an; neue Kontakte bekommen `status = Kunde` | Website-Fälle mit unbestätigter E-Mail: `kontakt_bestaetigt = 0`, `portal_sichtbar = 0`, Kennzeichen „Zuordnung prüfen“ in der Akte (neutral) + Knopf „Zuordnung bestätigen“; Statusabfrage nur über Referenz + E-Mail (vorhanden); neuer Kontakt `status = Interessent` |
| R-09 | **H** | FAGG §§ 4, 10, 11, 16, 18 (Fern-/Auswärtsgeschäft) | §2.9 Pflege-Abo „Angeboten → Aktiv“, §2.10 Serviceauftrag, §7 Technik | Pflege-/Wartungsverträge und Winterlager entstehen über Portal/Website/Telefon (Fernabsatz) oder beim Kunden (außerhalb der Geschäftsräume). Keine Felder für Vertragsabschlussweg, Belehrung, 14-Tage-Rücktritt, Zustimmung zum vorzeitigen Beginn, Wertersatz | Felder auf PH Pflege Abo und PH Serviceauftrag: `abschlussweg` Select (Geschäftsraum · Fernabsatz · Außerhalb Geschäftsraum), `belehrung_am` Datetime, `belehrung_version` Data, `vorzeitiger_beginn_zustimmung_am` Datetime, `ruecktritt_am` Datetime, `ruecktritt_bis` (berechnet). Workflow „Aktivieren“/„Beauftragen“ bei Verbraucher + nicht Geschäftsraum nur mit `belehrung_am`; erster Einsatz vor `ruecktritt_bis` nur mit Zustimmung vorzeitiger Beginn. Ausnahme dringende Reparatur auf Kundenwunsch (§ 18 FAGG) als Häkchen mit Begründung – Kanzlei |
| R-10 | **H** | § 15 KSchG (Kündigung Dauerschuldverhältnisse), § 6 KSchG | §2.9 Konditionen | `mindestlaufzeit_monate`, `kuendigungsfrist_monate` (Standard 1) ohne Prüfung; Verbraucher können Verträge über wiederkehrende Leistungen mit über einem Jahr Laufzeit nach dem ersten Jahr kündigen (Fristen laut § 15 KSchG – Kanzlei); keine Verlängerungslogik | Validierung bei `kundentyp`-äquivalent Verbraucher (aus PH Kontakt): Hinweis/Fehler, wenn Mindestlaufzeit oder Frist die gesetzliche Kündigungsmöglichkeit einschränkt; Feld `verlaengerung` Select (keine · jährlich) + `verlaengerung_hinweis_am` (Hinweispflicht vor Ablauf); Kündigung durch Kunden als Methode `kuendigung_erfassen(eingang_am, zum)` mit berechnetem frühesten Termin |
| R-11 | **H** | § 5 KSchG, § 1170a ABGB (Kostenvoranschlag) | §3.4 „Fristen abgelaufen → kostenpflichtig“, Einsatz-Ergebnis „Kein Mangel festgestellt“ | Kein Prozess. Wird eine Anfahrt/Prüfung verrechnet, obwohl kein Mangel vorliegt oder die Frist abgelaufen ist, braucht es vorher den Hinweis auf die Kostenpflicht; ein Kostenvoranschlag ist im Zweifel unentgeltlich | S2-Entscheidung „Kostenpflichtig“ (neu, §6 P-R3) nur mit `kosten_hinweis_am` + `kosten_hinweis_kanal`; Einsatzplanung A14 bei `fristen_status_bei_meldung = Abgelaufen` oder Art Serviceauftrag: Pflichtschalter „Kunde über Kosten informiert (Anfahrt/Stunde)“ |
| R-12 | **H** | § 131b/§ 132a BAO, RKSV | §7 Technik mobil | Konzept sieht **kein** Inkasso vor (richtig). Es sagt es aber nicht: Techniker werden vor Ort nach Bar-/Kartenzahlung gefragt (Pflegemittel, Anfahrt) | Ausdrückliche Regel in §7: „Technik mobil kassiert nicht.“ Schirm „Ich“ zeigt Hinweis „Zahlung vor Ort: nur per Rechnung oder über die Kassa“; Verkauf vor Ort → Auftrag an Kassa/Faktura (§6 P-R3). Ein späteres Inkasso nur über ph_kassa mit signiertem Beleg |
| R-13 | **M** | § 96/§ 96a ArbVG, § 10 AVRAG, Art. 88 DSGVO | §7 Statusknöpfe (Unterwegs/Angekommen mit Zeit), Zufriedenheit je Einsatz, Wochenübersicht je Techniker | Zeitstempel und Kundenbewertung je Techniker sind auswertbar (Leistungs-/Verhaltenskontrolle). Ohne Betriebsrat ist die Zustimmung der Mitarbeiter nötig, wenn die Maßnahme die Menschenwürde berührt (Kanzlei) | Keine Berichte „je Techniker“ (Zeit, Zufriedenheit) im Konzept ohne Inhaber-/Kanzleientscheid; Zufriedenheit nur je Fall/Marke auswerten; Hinweis im Erstbesuchs-Satz `/technik`, welche Daten erfasst werden |
| R-14 | **M** | GlBG Teil III (Zugang zu Dienstleistungen) | Texte „Fam. Huber“, Anrede in Vorlagen | Kein Verstoß erkennbar. Anrede kommt aus Vorlagen, nicht aus Pflichtfeldern | Vorlagen mit neutraler Anrede-Rückfall („Guten Tag {Vorname Nachname}“), wenn PH Kontakt keine Anrede hat; kein Pflichtfeld Geschlecht |
| R-15 | **M** | § 9b KSchG (Garantie), VGG | §2.3 Art „Garantie“ | Garantiefall (Hersteller) und Gewährleistung (Platzhirsch) laufen parallel; der Kunde darf wählen. Konzept führt Garantie als Art, aber ohne Hinweis, dass Gewährleistung daneben besteht | S2: bei Art „Garantie“ und laufender Gewährleistung Inline-Hinweis „Gewährleistung läuft parallel – Kunde wählt“; Ablehnungsgrund „Garantie abgelaufen“ nur, wenn auch Gewährleistung abgelaufen (`fristen_status_bei_meldung`) |

---

## 5. Buchhaltung [BUCH]

| ID | Schwere | Konzeptstelle | Befund (Code) | Pflichtänderung |
|---|---|---|---|---|
| B-01 | **K** | §3.4 „Gutschrift erstellen“, §4.1 Dialog „Gutschrift-Entwurf über 120,00 € zu RE-… anlegen?“ | `gutschrift_erstellen` legt PH Gutschrift mit Position `ust_satz_promille = 0`, `brutto_cent = netto_cent = betrag` und `ignore_mandatory` an. Eine Preisminderung ist eine Entgeltminderung: die USt der Originalrechnung ist zu berichtigen (§ 16 UStG), der Korrekturbeleg nennt Originalrechnung und Steuerbetrag (§ 11 UStG). Mit 0 % bleibt die USt zu hoch abgeführt bzw. der Kunde erhält zu viel/zu wenig | Gutschrift-Positionen aus der Rechnung ableiten: USt-Satz der betroffenen Position (D6 `beleg_position`) bzw. anteilig nach `ust_aufteilung`; Betrag im Servicefall als **brutto** erfasst (Feld-Label „Betrag brutto (an den Kunden)“) und netto/USt im Beleg berechnet; kein `ignore_mandatory`. Dialog zeigt: „Rechnung RE-… vom 14.03.2026 · Gutschrift 120,00 € brutto · davon USt 20,00 € · Erstattung: Rückzahlung / Verrechnung / keine“ (`erstattung_art` aus PH Gutschrift) |
| B-02 | **H** | §3.1 Kosten-Karte, Tab Kosten | `_kosten_summieren`: Kosten-Zeilen der Art `Kulanz`/`Preisminderung` **plus** `kulanz_cent + preisminderung_cent` → wer die Entscheidung erfasst und zusätzlich eine Kostenzeile anlegt, zählt doppelt. `gutschrift_erstellen` nimmt `preisminderung_cent or kulanz_cent` – sind beide gesetzt, wird nur einer gutgeschrieben | Kosten-Arten `Kulanz`/`Preisminderung` aus dem Select für manuelle Zeilen entfernen (nur aus Entscheidung); Validierung „nur einer der Beträge“ oder zwei Gutschriftpositionen |
| B-03 | **H** | §2.12 Reports „Netto €“, §5 GF-Kachel „Nettokosten Monat“ | „Netto“ bedeutet hier Kosten nach Regress, nicht „ohne USt“. Kostenzeilen haben keine Angabe netto/brutto; Einsatzkosten = Minuten × `stundensatz_cent` (Standard 7 500, ein Verrechnungssatz, keine interne Kostengröße). `PH Servicekosten` gruppiert nach `gemeldet_am`, nicht nach Kostendatum | Spaltentitel „Kosten nach Regress“; alle Kostenbeträge **netto (ohne USt)** festlegen und so beschriften; zwei Sätze trennen: `kostensatz_intern_cent` (Controlling) und `stundensatz_cent` (Weiterverrechnung/Regress); Monatsbericht nach `PH Servicefall Kosten.datum` |
| B-04 | **H** | §2.8, Regress-Form „Gutschrift / Ersatzlieferung / Reparatur durch Hersteller / Verrechnung mit Rechnung“ | Steuerlich unterschiedlich: Gutschrift des Lieferanten auf die Einkaufsrechnung = Entgeltminderung (Vorsteuer berichtigen); Ersatz der eigenen Reparaturkosten kann echter Schadenersatz sein (nicht steuerbar). Felder dafür fehlen; `eingangsrechnung` nur Link | `PH Lieferantenregress.steuerliche_art` Select (Entgeltminderung Einkauf · Schadenersatz · Ersatzlieferung) + `vorsteuer_korrektur_cent`; Übergabe an Buchhaltung über CSV mit diesen Spalten; Zuordnung durch StB (§10 S1) |
| B-05 | **H** | §2.8 „Regress verrechnet (Leitung)“ | Workflow-Weg setzt `betrag_erhalten_cent = betrag_anerkannt_cent`, auch bei Form „Gutschrift“ mit bloßer `gutschrift_nummer` – Forderung gilt als bezahlt ohne Beleg/Zahlung | Workflow-Bedingung „Regress verrechnet“: `form in (Ersatzlieferung kostenlos, Reparatur durch Hersteller)` **oder** `betrag_erhalten_cent` über `gutschrift_erfassen`; Konzept-Primär = „Gutschrift/Zahlung erfassen“ (F10) |
| B-06 | **H** | §2.6 Ersatzteile Bestand | Eigenes Ersatzteillager in `PH Ersatzteil.bewegungen` neben `ph_logistik` PH Lagerbestand; Kategorie „Pflegemittel“ ist auch Verkaufsware. Zwei Bestände desselben Artikels, zwei Inventuren; Bestandsbewertung (`ek_cent` permlevel 1) ohne Bewertungsdatum | Abgrenzung festlegen: Ersatzteile (nicht verkäuflich) in ph_service, **Verkaufsware inkl. Pflegemittel nur ph_logistik**; `PH Ersatzteil.produkt` gesetzt → Bestand nicht hier führen (`bestand_fuehren = 0` erzwingen). Jahresinventur-Report „Ersatzteile zum Stichtag (Menge × EK)“ |
| B-07 | **M** | §5 Kennzahlen | Keine Datengrundlage für die Gewährleistungsrückstellung zum Bilanzstichtag (offene Fälle mit erwarteten Kosten) | Report „Offene Gewährleistung zum Stichtag“ (Fälle offen, Entscheidung, erwartete Kosten = Ersatzteile Benötigt × EK + geplante Einsätze × Kostensatz); Feld `erwartete_kosten_cent` (Leitung) |
| B-08 | **M** | Reklamationsquote je Marke | Nenner = Positionen aus PH Rechnung `docstatus = 1`; stornierte Rechnungen (Storno über PH Gutschrift Art „Storno“) zählen weiter | Positionen voll stornierter Rechnungen abziehen (Gutschrift Art Storno, `docstatus = 1`) |

---

## 6. Fehlende Pflichtprozesse [PROZESS]

Der Service endet im Konzept bei „Gutschrift erstellen“ bzw. „Einsatz planen“. Für einen Möbelhandel mit Küche, Bad, Outdoor, Hotel und Yacht fehlen die Abwicklungen nach der Entscheidung. Jede Zeile = neuer Assistent oder neue Zeile in §3.4.

### P-R1 Austausch (Ersatzlieferung) – Assistent S9 „Austausch abwickeln“

| Schritt | Inhalt | Daten |
|---|---|---|
| ① Ersatzware | Herstellerbestellung (nicht Ersatzteilbestellung) für Produkt/Ausführung; Kommission = Fall | Methode `PH Servicefall.austausch_bestellen()` → PH Herstellerbestellung (ph_logistik) mit `servicefall`; Feld `austausch_bestellung` |
| ② Lieferung + Rücknahme | Lieferschein **0 €** an Kunden (keine Rechnung), Abholung Altware im selben Termin (Tour) | `PH Lieferschein` mit `servicefall`, Position „Ersatzlieferung“; Rücknahme als Wareneingang Retoure mit Zustand (B-Ware/Entsorgung/Rücksendung Hersteller) |
| ③ Fristen | Neue Übergabe des Ersatzstücks dokumentieren (Fristbeginn für das Ersatzstück – Kanzlei) | `ersatz_uebergabe_datum` |
| Zustände | Ergebniskarte mit Teilschritten ✓/✗ (P17-Regel); Fall bleibt „In Bearbeitung“, bis Altware zurück **und** Ersatz zugestellt | Nächster Schritt: „Ersatz erwartet am …“ / „Altware abholen“ |

### P-R2 Wandlung / Vertragsauflösung – Assistent S10 „Rückabwicklung“

1. Umfang: ganze Rechnung oder Positionen (D6), Menge.
2. Rücknahme: Abholtermin (A14-Kalender, Art „Abholung“ neu), Zustand, Wareneingang Retoure (ph_logistik), Lagerbuchung.
3. Geld: PH Gutschrift Art **Storno** (voll) bzw. **Teilgutschrift** mit USt der Positionen, `erstattung_art` Rückzahlung (PH Zahlung) oder Verrechnung; Anzahlung (§7 R-A1) beachten.
4. Folgen in einem Satz: „nimmt 1 Sofa zurück, storniert 2.400,00 € inkl. 400,00 € USt, zahlt 2.400,00 € an den Kunden zurück“.
5. Dialog rot, kein Undo; Teilfehler wie P17; Fall wird erst „Erledigt“, wenn Rücknahme gebucht und Erstattung ausgelöst.

### P-R3 Kostenpflichtige Leistung (außerhalb Gewährleistung, kein Mangel, Serviceauftrag)

- Entscheidung „Kostenpflichtig“ (neuer Select-Wert `entscheidung`) – nur mit `kosten_hinweis_am` (R-11).
- Kostenvoranschlag: `PH Servicefall.angebot_erstellen()` → PH Angebot (ph_faktura); Kunde nimmt an (Portal/Unterschrift) → `kosten_freigabe_am`.
- Abrechnung: `kosten_verrechnen()` → Entwurf PH Rechnung aus Einsatzzeiten (`zeit_abrechenbar_min` × `stundensatz_cent`), Anfahrtspauschale, Ersatzteilen mit `kostentraeger = Kunde` (VK `vk_cent`); `kosten_kunde_cent` read-only aus der Rechnung.
- Nächster Schritt „Rechnung stellen“ nach Einsatz-Ergebnis bei Entscheidung Kostenpflichtig; Schließen erst mit `kosten_rechnung` (Leitung ohne).

### P-R4 Mahnsperre bei offener Reklamation (Zurückbehaltungsrecht des Kunden, § 1052 ABGB)

- Beim Anlegen eines Falls mit `rechnung` (oder `auftrag` mit offener Schlussrechnung) und `art in (Mangel, Montagefehler, Transportschaden)`: Vorschlag „Mahnsperre setzen?“ (Schalter in S1 „Weitere Angaben“, vorbelegt an) → `PH Rechnung.mahnsperre = 1`, `mahnsperre_grund = "Servicefall PH-SRV-…"`.
- Beim Schließen/Ablehnen: Hinweis „Mahnsperre auf RE-… aufheben?“ (Dialog sm, Standard Ja). Methode `mahnsperre_setzen(an: bool)` in ph_service (schreibt über ph_faktura-API).
- Akte rechte Spalte: Rechnung-Chip mit „Mahnsperre“ (neutral, Icon `pause`).

### P-R5 Transportschaden an Frachtführer/Versicherung

- Art „Transportschaden“ mit `lieferschein` einer Fremdspedition: Frist für die Schadensanzeige an den Frachtführer (bei internationalem Straßentransport CMR Art. 30: äußerlich erkennbare Schäden bei Ablieferung, sonst binnen 7 Tagen; national laut Vertrag/AÖSp – StB/Kanzlei).
- Felder `frachtfuehrer`, `vorbehalt_bei_ablieferung` Check, `schadensanzeige_am`, `versicherung_meldung_am`; Fristband zusätzliche Raute „Anzeige Frachtführer bis …“.
- Bei eigener Zustellung (Platzhirsch-Tour): kein Regress, Versicherung prüfen.

### P-R6 Abgrenzung Widerruf/Rücktritt (FAGG) und Falschlieferung

- S1: Art-Kachel „Rückgabe ohne Mangel (Widerruf)“ führt **nicht** zu einem Servicefall, sondern zeigt: „Widerruf innerhalb 14 Tagen ab Erhalt läuft über die Bestellung“ + Knopf „Zur Bestellung“ (ph_shop/ph_faktura). Fehlercodes TRA-03/TRA-04 (Falschlieferung, Fehlmenge) → Weiterleitung an Logistik „Nachlieferung anlegen“, Fall optional verknüpft.

### P-R7 Abo- und Serviceauftrag-Abrechnung

- PH Pflege Abo `abrechnung` Je Termin → nach Einsatzabschluss Entwurf Rechnung; Jährlich im Voraus → Vorausrechnung bei Aktivierung/Verlängerung, bei Kündigung anteilige Gutschrift (Methode `abrechnen_bis(datum)`); Jährlich nachträglich → Scheduler am Vertragsjahrestag.
- PH Serviceauftrag: Workflow „Abrechnen“ nur mit `rechnung` (D5); Storno nach „Beauftragt“ mit bereits gestellter Rechnung → Storno-Gutschrift.
- Winterlager: Verwahrung – Feld `versichert_bis`/`haftung_hinweis_version` auf der Übernahmeliste (Kanzlei).

### P-R8 Servicefall falsch angelegt / Doppelt

- Heute nur „Abgelehnt“ (Leitung, Begründung, Abschlussbericht) → verfälscht Ablehnungsquote und Kundentext. Neuer Endzustand **„Storniert“** (Grund: Doppelt · Falsch angelegt · Zurückgezogen vom Kunden), Mitarbeiter innerhalb 24 h nach Anlage, sonst Leitung; zählt in keiner Quote; Doppelt → Pflichtfeld `duplikat_von` (Link PH Servicefall), Fotos/Verlauf werden übernommen.

---

## 7. Randfälle [RAND]

| Fall | Was passiert heute (Code) | Was das Konzept braucht |
|---|---|---|
| **R-S1 Storno Rechnung** nach Servicefall-Gutschrift | Zwei Gutschriften auf dieselbe Rechnung möglich (Servicefall prüft nur `self.gutschrift`) | `gutschrift_erstellen`: Summe aller Gutschriften zur Rechnung ≤ Rechnungsbetrag; Fall-Chip „Rechnung storniert“ (danger-soft) + Nächster Schritt „Gutschrift prüfen“ |
| **R-S2 Storno Gutschrift** (amended/cancelled) | `PH Servicefall.gutschrift` zeigt weiter auf den stornierten Beleg | Hook `PH Gutschrift.on_cancel` → `servicefall.gutschrift = None` + Verlauf |
| **R-S3 Storno Auftrag** bei offenem Fall (z. B. Montagefehler vor Schlussrechnung) | kein Bezug | Banner im Fall „Auftrag AB-… storniert – Fall prüfen“ |
| **R-S4 Storno Ersatzteilbestellung** nach Teillieferung | alle Zeilen zurück auf Benötigt (D9) | nur Rest; Dialog nennt „3 von 5 erhalten – 2 werden storniert“ |
| **R-S5 Einsatz abbrechen** | keine Methode (F11) | `abbrechen(grund)`; Fall-Nächster-Schritt „Neuen Einsatz planen“ |
| **R-T1 Teillieferung** | ein `uebergabe_datum` je Fall; Lieferschein vor Montage bevorzugt (R-04) | Bezug je Position (D6); Fristbeginn je gelieferter Position; Hinweis „Weitere Positionen noch nicht geliefert – Fehlmenge ist kein Mangel“ (P-R6) |
| **R-T2 Mangel an Ware noch nicht vollständig geliefert/montiert** (Küche) | Fall wird Gewährleistungsfall | S1: wenn `projekt`/`auftrag` nicht übergeben → Art-Vorschlag „Montagefehler/Nacharbeit vor Übergabe“, Fristband zeigt „Übergabe steht aus – Frist beginnt erst mit Übergabe“ (grau, kein Rot) |
| **R-A1 Anzahlung, keine Schlussrechnung** | `gutschrift_erstellen` wirft „braucht verknüpfte Rechnung“ | Preisminderung vor Schlussrechnung = Abzugsposition in der Schlussrechnung: Methode `minderung_vormerken()` schreibt Position in PH Auftragsbestaetigung (ph_faktura) mit Bezug Fall; Nächster Schritt „Minderung in Schlussrechnung“ statt „Gutschrift“ |
| **R-A2 Rückabwicklung nach Anzahlung** | – | P-R2: Erstattung = Summe bezahlter Beträge (Anzahlung + Schlusszahlung), Anzahlungsrechnung mit stornieren |
| **R-A3 Kunde hält Restzahlung zurück** | Mahnlauf läuft weiter | P-R4 Mahnsperre |
| **R-R1 Retoure Ersatzteil an Hersteller** (Altteil zurück für Garantie) | „Retoure“ bucht +; kein Feld Altteil | Bewegungsarten F8; `PH Servicefall Ersatzteil.altteil_zurueck` Select (nicht nötig · offen · gesendet am …) + Nächster-Schritt-Zeile „Altteil an Hersteller senden“ |
| **R-R2 Retoure Kundenware** (Wandlung, Austausch) | kein Prozess | P-R1/P-R2 |
| **R-R3 Rückgabe ohne Mangel** (Widerruf) | würde als Servicefall „Mangel“ erfasst | P-R6 |
| **R-W1 Kunde/Rechnung in CHF** | keine Währung in PH Servicefall, Kosten, Regress, Ersatzteil, Bestellung, Pflege Abo, Serviceauftrag; `gutschrift_erstellen` übergibt EUR-Cent, PH Gutschrift übernimmt aber `waehrung` der Rechnung → Betrag wird als CHF-Cent gebucht | `PH Servicefall.waehrung` (Link Currency, read-only aus Rechnung/AB, Standard EUR); `preisminderung_cent`/`kulanz_cent` in Fallwährung; Kosten immer EUR (intern) mit Hinweis; Anzeige „120,00 CHF“; Gutschrift in Rechnungswährung; Umrechnung für Kostenreport zum Belegdatum (Kurs laut StB) |
| **R-W2 Lieferant in CHF** (Regress, Ersatzteil-EK) | Beträge als EUR | `PH Lieferantenregress.waehrung`, `kurs`, `betrag_*_eur_cent`; `PH Ersatzteilbestellung.waehrung`; Abgleich (`utils/regress.abgleich`) in Belegwährung |
| **R-W3 Einsatz in der Schweiz** (Kunde Grenzregion, Hotel) | `einsatz_land` Standard Österreich, keine Folge | Bei `einsatz_land != Österreich` Hinweis im A14 „Einsatz im Ausland: Leistungsort, MWST/USt und Zoll für mitgenommene Teile prüfen (StB)“; Ersatzteile über die Grenze → Vermerk `ausfuhr_noetig`; kein Einsatz ohne Freigabe Leitung |
| **R-E1 Kunde ohne E-Mail** | Eingangsbestätigung ausgegraut (gut); Terminvorschlag, Abschluss, Ablehnung, „frei“ werfen „Keine E-Mail-Adresse hinterlegt“; Mitarbeiter kann **nicht schließen** (D7); Wartungserinnerung an `kontakt_email` leer | Kanal-Wahl in jedem Kundenkontakt-Dialog: **E-Mail · Brief · Telefon · Persönlich**. Brief = PDF der Vorlage (Druckformat je Vorlage, Adressfeld DIN 5008 / Fensterkuvert) über `/druck/…` + `kunde_informiert_erfassen(kanal="Brief")`. Telefon/Persönlich = Notiz Pflicht. Abnahmebestätigung ausgedruckt mitgeben (Kachel in S5 „Ausgedruckt übergeben“). Pflege-Abo ohne E-Mail: Erinnerung als ToDo „Kunde anrufen“ (Scheduler-Rückfall `_vormerken` prüfen) |
| **R-E2 Kunde ohne E-Mail meldet über Website** | `create_service_case` verlangt E-Mail (richtig) | – |
| **R-E3 E-Mail unzustellbar** | „gesendet“ wird angezeigt, `kunde_informiert_am` gesetzt | Zustellstatus (Konzept §9 bereits Anfrage); bis dahin `kunde_informiert_am` erst nach Zustellung **oder** Hinweis „ungeprüft“ im Abschluss; Bounce → ToDo „anderen Kanal wählen“ |
| **R-U1 Unternehmerkunde (Hotel, Yacht, Architekt)** | `kundentyp` aus `kontaktart`; Gewährleistung global 24 Monate | Feld `gewaehrleistung_vertrag_monate` (aus AB/AGB B2B, wenn abweichend vereinbart) mit Vorrang vor Einstellung; Hinweis § 377 UGB (Kunde muss rügen) bleibt; kein § 933b (R-03) |
| **R-U2 Yacht/Ausland** (Einsatzort Hafen IT/HR) | wie R-W3 | wie R-W3; `einsatz_land` als Select (Länderliste) statt Data |
| **R-K1 Kulanz erhöht nach Freigabe** | Controller fordert neu an (gut) | Konzept-Text U-02 |
| **R-K2 Kulanz an Unternehmer ohne Rechnung** (Projektgeschäft) | Gutschrift wirft | wie R-A1 |

---

## 8. Pflichtänderungen (konkret, mit DocType/Feld/Methode)

| Nr | Schwere | Ziel | Änderung | Ort |
|---|---|---|---|---|
| P-01 | **K** | Fristampel rechtlich korrekt | Neues Feld `PH Servicefall.fristen_status_bei_meldung` (Select wie `fristen_status`, read-only, beim Insert aus `gemeldet_am`/`erstauftreten` berechnet, Änderung nur durch Leitung mit Grund); `fristen()` bekommt Parameter `stichtag`; Banner „nur Kulanz“, Ablehnungsgrund „Frist abgelaufen“ und Fristband-Statuszeile nutzen den Meldezustand; „heute“-Ampel nur für Verjährung der Geltendmachung | ph_service + Konzept §3.1/§3.2/§3.4/§4.4 S2 |
| P-02 | **K** | Fristband = gespeicherte Werte | `fristen_info()` mit `sachart`, `gewaehrleistung_monate`, `vermutung_*` aus Einstellungen wie `_fristen_berechnen`; Fristband zeigt `sachart`, `uebergabe_quelle` | ph_service + Konzept §3.2 |
| P-03 | **K** | Mängelanzeige an Lieferant rechtzeitig | `maengelanzeige_senden()` + Felder `maengelanzeige_am/_an`, Einstellung `ruege_tage`; §3.4 neue Zeile in Geprüft/Entscheidung; S4 trennt „Mängelanzeige“ (früh, ohne Betrag) und „Regressforderung“ (nach Erledigung) | ph_service + Konzept §3.4/§4.4 |
| P-04 | **K** | Regress-Frist ehrlich | Felder `rechtsgrundlage`, `anerkenntnis_schriftlich`, `anerkenntnis_beleg`, `verjaehrungsverzicht_bis`, `klage_eingebracht_am` auf PH Lieferantenregress; Ampel bleibt rot bis einer gesetzt; `regress_frist_bis` nur bei Verbraucher + Gewährleistungsentscheidung | ph_service + Konzept §2.8 |
| P-05 | **K** | Widerruf Nachkauf bleibt Widerruf | Konzept: „Widerruf erfassen“ setzt `nachkauf_einwilligung = 0`; Controller: Wiedererteilung nur über `einwilligung_erfassen(textversion, nachweis)`, Felder read-only | ph_service + Konzept §2.9/QA 43 |
| P-06 | **K** | Fotos an Lieferant nur bewusst | `PH Servicefall Foto.an_lieferant` Standard 0 (Kunde/Techniker), S4-Fotoschritt Pflicht bei Kundenfotos, Hinweistext; Datenschutzinfo Kanzlei | ph_service + Konzept §4.4 S4 |
| P-07 | **K** | Gutschrift mit USt | `gutschrift_erstellen`: USt-Satz aus Rechnungsposition/Aufteilung, Betrag brutto, `waehrung` der Rechnung, kein `ignore_mandatory`; Dialog mit USt-Anteil und `erstattung_art` | ph_service (+ ph_faktura-Schnittstelle) + Konzept §4.1 |
| P-08 | **H** | Kosten nicht doppelt | Kostenarten Kulanz/Preisminderung nur aus Entscheidung; Validierung Einzelbetrag; Beträge netto beschriften; `kostensatz_intern_cent` getrennt | ph_service + Konzept §3.1 |
| P-09 | **H** | Kunde ohne E-Mail | `kunde_informiert_erfassen(kanal, notiz)` + Felder; Kanal-Wahl in allen Kundenkontakt-Dialogen; Brief-Druckformate je Vorlage | ph_service + Konzept §3.4/§4.1/§4.4 S5/§6 |
| P-10 | **H** | Abwicklung nach Entscheidung | Assistenten S9 Austausch, S10 Rückabwicklung, Entscheidung „Kostenpflichtig“ mit KV und Rechnung (§6 P-R1–P-R3) | ph_service, ph_logistik, ph_faktura + Konzept §4.4 |
| P-11 | **H** | Mahnsperre | `mahnsperre_setzen(an)`; S1-Schalter, Abschluss-Hinweis, Chip | ph_service ↔ ph_faktura + Konzept §2.3/§3.1 |
| P-12 | **H** | Einsatz-Status nur über Methoden | `umplanen(datum, zeit_von, zeit_bis, techniker)` (setzt `umgeplant_am`, leert `bestaetigt_kunde_am`), `abbrechen(grund)` (setzt `abbruch_grund`); UI ohne `set_value status` | ph_service + Konzept §2.4/§4.2 |
| P-13 | **H** | Regress-Verrechnung belegt | Workflow-Bedingung (B-05); Primär „Gutschrift/Zahlung erfassen“ (`gutschrift_erfassen`); Abgleich-Anzeige (U-03); `steuerliche_art` (B-04); Währung (R-W2) | ph_service + Konzept §2.8 |
| P-14 | **H** | Erstreaktion eindeutig | S1-Schalter an Server binden (`erstreaktion_erfolgt` beim Insert) oder entfernen; Kommentar-Übergangsregel streichen (F2/F3) | ph_service + Konzept §2.3/§3.4/QA 26 |
| P-15 | **H** | FAGG/KSchG bei Verträgen | Felder `abschlussweg`, `belehrung_am/_version`, `vorzeitiger_beginn_zustimmung_am`, `ruecktritt_am` (Pflege Abo, Serviceauftrag); Workflow-Bedingungen; § 15 KSchG-Prüfung, `kuendigung_erfassen` | ph_service + Konzept §2.9/§2.10 |
| P-16 | **H** | DSGVO Auskunft + Löschung | `api.auskunft(kontakt)`; Scheduler `aufbewahrung_pruefen` mit Vorschau für Leitung; Einwilligungsnachweis nicht sofort anonymisieren | ph_service + Konzept §2.13 (neuer Tab „Aufbewahrung“) |
| P-17 | **H** | Website-Zuordnung | `kontakt_bestaetigt`, Portal-Sichtbarkeit erst nach Bestätigung, neuer Kontakt `Interessent` | ph_service + Konzept §3.1 |
| P-18 | **H** | Fristbeginn | Reihenfolge Übergabequelle (Montage-Abnahme zuerst), Umschalten in der UI | ph_service + Konzept §3.2 |
| P-19 | **H** | Abrechnung Verträge | `rechnung_erstellen` für Pflege Abo/Serviceauftrag, Workflow „Abrechnen“ nur mit `rechnung` | ph_service + Konzept §2.9/§2.10 |
| P-20 | **H** | Technik-Abschluss bricht nicht | `aus_bestand` nur für „Aus Bestand“-Zeilen; Bestandsfehler als Teilfehler (Einsatz bleibt Erledigt, Bestandszeile als offene Aufgabe) | ph_service + Konzept §7 |
| P-21 | **M** | Ersatzteil-Bewegungen vollständig | Arten „Rücksendung an Lieferant (−)“, „Schwund/Bruch (−)“, „Rückgabe vom Kunden (+)“; Abgrenzung Verkaufsware (B-06) | ph_service + Konzept §2.6 |
| P-22 | **M** | Bestellstorno korrekt | D9 | ph_service + Konzept §2.7 |
| P-23 | **M** | Unterschriften unveränderlich | D11 | ph_service |
| P-24 | **M** | Eine Nächster-Schritt-Regel | `utils/schritte` whitelisten, §3.4 angleichen (F7) | ph_service + Konzept §3.4/§9 |
| P-25 | **M** | Konzept auf Datenstand bringen | F1–F12, U-01–U-07 einarbeiten; §12 bereinigen (erledigt: erstreaktion_erfassen, kulanz_freigeben, Vorlagen ablehnung/frei, SLA-Feiertage, Fehlerkatalog-Seed) | Konzept |
| P-26 | **M** | Neuer Endzustand Storniert/Duplikat | P-R8 | ph_service + Konzept §4.1 |
| P-27 | **M** | Währung | R-W1/R-W2 | ph_service + Konzept §3.1/§2.8 |

### 8.1 UI-Spezifikation der neuen Bausteine (zum direkten Einbau in 10-konzept-service)

**a) Fristband – Zweizeilige Statuszeile (P-01, P-02)**

```
●━━━━━━━━━━◉━━━━━━━━━━━━━━━━○━━━━━━○            heute ▾
Gemeldet 10.03.2028 · innerhalb der Gewährleistung (Beweislast Kunde) · § 10 VGG
Verjährung der Geltendmachung 14.06.2028 · Übergabe 14.03.2026 aus Montageabnahme MA-… ▾
```
- Zeile 1 = Meldezustand (`fristen_status_bei_meldung`), Ton nach Ampel; Zeile 2 = heute-bezogene Warnung, nur `warning-text`, nie `danger`, solange Zeile 1 nicht „Abgelaufen“ ist.
- Raute „Meldung“ auf dem Strahl (8 px, Tinte) zusätzlich zur Heute-Marke; Animation wie §3.2 (200 ms `--bo-ease-inout`, `scaleX`).
- `▾` an der Übergabequelle öffnet Popover (240 ms `--bo-ease-out`) mit den gefundenen Quellen als Radio; Wechsel = `save` mit Verlauf „Übergabequelle geändert“; Leitung only, Mitarbeiter sieht Text.
- Fehlerfall: kein Übergabe-/Kaufdatum → grauer Strahl, Text „Übergabe fehlt – Frist unbekannt · Datum eintragen“ (Link in Tab).

**b) Lieferanten-Leiste im Fall (P-03, P-04)** – Karte in Tab „Regress & Abschluss“, ab Status Geprüft:

| Zustand | Anzeige | Primär |
|---|---|---|
| lieferantenrelevant, keine Anzeige | „Mängelanzeige an Z GmbH fällig bis 07.11.“ (`warning-text`) | „Mängelanzeige senden“ (Dialog md mit Vorschau, Fotos-Auswahl Pflicht bei Kundenfotos) |
| Anzeige gesendet, Fall offen | „Angezeigt am 04.11. an b…@z.at“ | – |
| Fall erledigt, kein Regress | „Regress fordern bis 12.11. (§ 933b)“ bzw. „Kein § 933b – Vertragsansprüche prüfen“ | „Regress fordern“ |
| Regress gemeldet, ohne Anerkenntnis | „Gemeldet 20.11. – Frist **nicht** gewahrt bis Anerkenntnis/Klage · 12.01.“ (`danger-text` ab ≤ 14 Tage) | „Anerkenntnis erfassen“ (Dialog: Datum, Beleg Pflicht) |
| anerkannt / Verzicht / Klage | „Frist gewahrt (Anerkenntnis 02.12.)“ (`success-text`) | „Gutschrift/Zahlung erfassen“ |

**c) Dialog „Kunde informieren“ – Kanalwahl (P-09)**

```
┌ Kunde informieren · Abschluss                                        [×] ┐
│ Kanal  (●) E-Mail h…@…   ( ) Brief   ( ) Telefon   ( ) Persönlich         │
│        ohne E-Mail: E-Mail ausgegraut „keine E-Mail hinterlegt“, Brief vorgewählt │
│ Vorschau ▸ (Mail-HTML bzw. PDF A4 mit Adressfeld)                          │
│ Notiz* (nur Telefon/Persönlich)  [                                    ]   │
├───────────────────────────────────────────────────────────────────────────┤
│ [Abbrechen]                [PDF drucken]  [Als informiert erfassen ⌘↵]      │
└───────────────────────────────────────────────────────────────────────────┘
```
- Brief: „PDF drucken“ öffnet Druckvorschau; „Als informiert erfassen“ erst nach Druck aktiv (Text am Knopf „Erst drucken“). Speichert `kunde_informiert_kanal = Brief`.
- Fehler Server → Feldfehler im Dialog, Dialog bleibt offen; Esc schließt ohne Aktion. Öffnen 200 ms `--bo-ease-out`, Schließen 150 ms.

**d) S10 Rückabwicklung (P-10)** – Assistent T6, 4 Schritte, Folgen-Satz im letzten Schritt, Dialogklasse „Geld- oder rechtswirksam“ (kein Undo). Leerzustand Schritt ①: „Keine Rechnung verknüpft – Rückabwicklung braucht Rechnung oder Auftrag.“ [Bezug wählen]. Teilfehler: Rücknahme angelegt ✓ · Gutschrift ✗ „USt-Aufteilung fehlt“ [Erneut] – Fall-Kopf „1 Schritt nicht ausgeführt“.

**e) Mahnsperre-Chip (P-11)** – rechte Spalte, Rechnung-Zeile: `RE-2026-00040 ● Offen · Mahnsperre (Servicefall)`; Klick öffnet Popover „Mahnsperre aufheben?“ (Leitung, Faktura). Beim Schließen des Falls: Inline-Frage im S5-Ergebnis „Mahnsperre auf RE-… aufheben? [Aufheben] [Behalten]“ (kein Modal).

**f) Kürzel** – keine neuen Einzelbuchstaben; neue Aktionen über `⋯` und den Primärknopf; Dialoge mit `⌘/Strg+Enter`.

---

## 9. Zusätzliche Akzeptanzkriterien (für §10 des Konzepts)

46. Fall mit Übergabe 14.03.2026, gemeldet 10.03.2028, heute (Mock-Uhr) 20.06.2028: Banner „nur Kulanz“ erscheint **nicht**, Ablehnungsgrund „Frist abgelaufen“ ist gesperrt, Fristband Zeile 1 „innerhalb der Gewährleistung“.
47. `sachart = Unbeweglich`: Fristband und gespeicherte Felder zeigen 36 Monate; `fristen_info()` und `gewaehrleistung_bis` stimmen überein.
48. Lieferantenrelevanter Fall nach „Prüfung abschließen“: Nächster Schritt „Mängelanzeige senden“ mit Fälligkeit; nach Senden `maengelanzeige_am` gesetzt, Verlauf „Kommunikation“.
49. Regress „Gemeldet“ ohne Anerkenntnis: Fristampel rot ab ≤ 14 Tage; nach „Anerkenntnis erfassen“ grün; Unternehmerkunde zeigt „Kein § 933b“.
50. Widerruf Nachkauf über Dialog → `nachkauf_einwilligung = 0`, `nachkauf_widerrufen_am` gesetzt; erneutes Speichern ändert nichts; Scheduler sendet keinen Nachkauf-Hinweis.
51. Kundenfoto `quelle = Kunde` ist nach Upload **nicht** „an Lieferant“; S4 zeigt den Fotoschritt.
52. `gutschrift_erstellen` zu Rechnung mit 20 % USt, Betrag 120,00 € brutto: Gutschrift netto 100,00 €, USt 20,00 €, Währung = Rechnungswährung.
53. Kulanz 200,00 € in Entscheidung + manuelle Kostenzeile „Kulanz“ ist nicht möglich (Select ohne Wert) – `kosten_kulanz_cent` = 20 000.
54. Kunde ohne E-Mail: Abschluss per Brief → `kunde_informiert_kanal = Brief`, Mitarbeiter kann schließen.
55. Technik-Abschluss mit Kommissionsteil (Kostenträger Gewährleistung, eingetroffen): kein Bestandsfehler, Einsatz „Erledigt“, Fall-Zeile „Verbaut“.
56. Ersatzteilbestellung 5 Stk, 3 erhalten, Storno → 2 storniert, Fall-Zeile bleibt „Eingetroffen“ für die 3.
57. Fall mit Rechnung CHF: Beträge in der Akte mit „CHF“, Gutschrift in CHF; Kostenreport in EUR mit Umrechnungshinweis.
58. Website-Meldung mit E-Mail eines bestehenden Kontakts: Fall `portal_sichtbar = 0`, Kennzeichen „Zuordnung prüfen“.
59. Pflege-Abo Verbraucher, Abschlussweg Fernabsatz: „Aktivieren“ ohne `belehrung_am` → Dialog „Dafür fehlt: Belehrung“; Einsatz vor `ruecktritt_bis` nur mit Zustimmung vorzeitiger Beginn.
60. Serviceauftrag „Abrechnen“ ohne Rechnung → nicht möglich (Knopf mit Grund).

---

## 10. Fragen an Kanzlei, Steuerberatung, Inhaber (vor Bau beantworten)

| Nr | An | Frage |
|---|---|---|
| K1 | Kanzlei | Stichtag für Fristenstatus und Beweislast: Hervorkommen/Meldung (Vorschlag P-01) – bestätigt? Absatzzitate VGG (§ 10 Abs 2 oder 3 für Verjährung) gegenlesen. |
| K2 | Kanzlei | Fristbeginn bei Lieferung mit Montage durch Platzhirsch (Küche/Bad): Zustellung oder Fertigstellung/Abnahme? Fristlauf für ein Ersatzstück nach Austausch? |
| K3 | Kanzlei | § 933b ABGB: Erfordernis gerichtlicher Geltendmachung binnen 2 Monaten; reicht Anerkenntnis/Verjährungsverzicht des Lieferanten? Gilt § 933b nur nach Gewährleistung gegenüber Verbrauchern? Regressverzicht in Lieferanten-AGB? |
| K4 | Kanzlei | § 377 UGB gegenüber Lieferanten: welche Frist („angemessen“) als Standard `ruege_tage`? |
| K5 | Kanzlei | FAGG für Pflege-/Wartungsverträge und Winterlager (Abschlusswege), Ausnahme dringende Reparatur; Text Belehrung und Zustimmung vorzeitiger Beginn. |
| K6 | Kanzlei | § 15 KSchG / Verlängerung: zulässige Mindestlaufzeit und Kündigungsfrist für Jahres-Abos mit Verbrauchern. |
| K7 | Kanzlei | Aufbewahrung Einwilligungsnachweis nach Widerruf; Löschfristen Fotos/Unterschriften nach Abschluss. |
| K8 | Kanzlei | Erfassung Techniker-Zeitstempel und Zufriedenheit je Einsatz: Zustimmung der Mitarbeiter nötig (§ 10 AVRAG)? |
| S1 | StB | Lieferanten-Regress: Entgeltminderung (Vorsteuerkorrektur) vs. Schadenersatz – Zuordnung je `form`. |
| S2 | StB | Preisminderung vor Schlussrechnung als Abzugsposition vs. Gutschrift nach Rechnung; Umrechnungskurs CHF (Tageskurs/Monatskurs). |
| S3 | StB | Einsätze in der Schweiz: Registrierungspflicht/MWST, Zoll für mitgenommene Ersatzteile – erlauben oder ausschließen? |
| S4 | StB | Gewährleistungsrückstellung: welche Daten zum Stichtag (B-07)? |
| I1 | Inhaber | Inkasso vor Ort durch Techniker ausschließen (R-12)? |
| I2 | Inhaber | Standard „Mahnsperre bei Reklamation“ an oder aus (P-R4)? |
| I3 | Inhaber | Ersatzteile vs. Verkaufsware: Pflegemittel nur in ph_logistik führen (B-06)? |
| I4 | Inhaber | Kostenpflichtige Anfahrt bei „Kein Mangel festgestellt“: Satz und Hinweistext (R-11). |

*Ende 21 – Fachkritik Service.*
