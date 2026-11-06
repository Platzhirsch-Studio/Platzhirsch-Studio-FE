# 21 – Fachkritik CRM (Konzept `10-konzept-crm.md` gegen `Backend-Import/ph_crm`)

**Zweck:** Fachliche und rechtliche Prüfung des CRM-Konzepts gegen den tatsächlichen Datenbestand der Frappe-App `ph_crm` (README, DocType-JSONs, Controller, `api/`, Fixtures, Reports) und die Nachbar-Apps, auf die das Konzept zugreift (`ph_faktura`, `ph_marketing`, `ph_kassa`). Ergebnis: Note, Befunde, Pflichtänderungen mit DocType/Feld/Methode.
**Stand:** 2026-11-04 · Rolle: Fachkritiker Möbelhandel (AT-Recht: RKSV, UStG § 11, FAGG, DSGVO/DSG, TKG 2021, GlBG, BAO; Buchhaltung) + Frappe-Datenprüfer · Status: Prüfbericht, keine Inhaber-Entscheidung.

**Geprüft (gelesen):** `Marktresearch/digital/backoffice/10-konzept-crm.md` (vollständig) · `Backend-Import/ph_crm/README.md` · alle 14 DocType-JSONs in `ph_crm/ph_crm/ph_crm/doctype/` · Controller `ph_anfrage.py`, `ph_kontakt.py`, `ph_termin.py` · `api/__init__.py`, `api/termin.py` (Signaturen) · `tasks.py`, `hooks.py`, `utils/workflow.py` · Fixtures `workflow.json`, `workflow_state.json`, `workflow_action_master.json`, `print_format.json`, `kanban_board.json` · Report `ph_vertriebscockpit.py` · Querprüfung: `ph_faktura` DocTypes PH Angebot / PH Auftragsbestaetigung / PH Rechnung (Felder), `ph_faktura/fixtures/custom_field.json`, `ph_marketing/README.md` + `engine.py`, `ph_kassa` (Kontakt-Bezug).

**Lesart der Markierungen:** **[FEHLT-DATEN]** UI-Funktion ohne Feld/Methode · **[FALSCH]** Konzept behauptet etwas, das der Code nicht hergibt · **[RECHT]** Verstoß/Risiko gegen Recht · **[BUCH]** Buchhaltungslogik · **[RAND]** fehlender Randfall · **[PROZESS]** fehlender Pflichtprozess.

---

## 0. Ergebnis in Kürze

| Kriterium | Bewertung |
|---|---|
| Oberflächenkonzept, Zustände, Kürzel, Leer-/Fehlerzustände | sehr gut, konkret, testbar (Q1–Q24) |
| Abgleich mit ph_crm (Felder/Methoden) | gut; viele Lücken ehrlich markiert, aber **7 falsche Annahmen** (§1) |
| Pflichtprozesse Möbelhandel (Auftrag → AB → Anzahlung → Lieferung → Montage → Rechnung → Service) | CRM-Anteil vorhanden; **Rücktritt/Widerruf, Storno-Rückwirkung, Kunde-Status-Automatik fehlen** |
| Recht | **3 echte Verstöße** im Konzept (TKG § 174, DSGVO Art. 15 unvollständig, kein Löschkonzept), 4 Risiken |
| Buchhaltung | Cockpit-Zahlen in der App **derzeit immer 0** und ohne Storno/Währung; Konzept zeigt sie ungeprüft |
| Randfälle Storno/Teillieferung/Anzahlung/Retoure/CHF/ohne E-Mail | überwiegend nicht behandelt (§4) |

**Note: 6 / 10.** Als UX-Konzept 8–9; die Note wird gedrückt durch Rechtsverstöße in Massenaktion und DSGVO-Auskunft, fehlendes Lösch- und Widerrufskonzept und Kennzahlen, die die App so nicht liefert. Mit den Pflichtänderungen in §6 erreichbar: 8–9.

---

## 1. Falsche Annahmen im Konzept [FALSCH]

| # | Stelle im Konzept | Behauptung | Tatsächlich im Code | Folge |
|---|---|---|---|---|
| F1 | §2.10, §12 Nr. 8, §9 Zeile Gesprächsprotokoll | `PH Beratungsgespraech.notiz_intern` habe permlevel 0, Empfehlung „auf permlevel 1“ | `ph_beratungsgespraech.json`: `notiz_intern` **permlevel 1**; permlevel-1-Rechte nur System Manager, PH Backoffice-Admin, PH Geschäftsführung (r), PH CRM Leitung (rw) | Empfehlung streichen. Die UI-Regel „sichtbar für Leitung/GF/**Faktura**“ ist nicht umsetzbar: Rolle Faktura hat kein permlevel 1 → Tab „Intern“ bleibt für Faktura leer. Entweder Faktura-Rolle auf permlevel 1 lesen (Custom DocPerm) oder „Faktura“ aus der Regel streichen. |
| F2 | §3.2 „Kunde seit“, §5.1 „Neue Kunden (Monat)“, §4.3 „normal automatisch durch ph_faktura bei erster AB“ | ph_faktura ruft `als_kunde_markieren` | `grep` über `ph_faktura`, `ph_kassa`, `ph_shop`: **kein Aufruf** von `als_kunde_markieren`, kein Setzen von `status = Kunde` | Alle Kontakte bleiben „Interessent“; Kennzahl „Neue Kunden“ = 0, Kopf „Kunde seit“ leer, Ansicht „Kunden 312“ leer. |
| F3 | §5.3 Vertriebscockpit „angebote_offen_cent, umsatz_cent“, §2.1 Trichter, §3.1 Kachel „Auftragswert 12 Monate“ | Cockpit liefert Auftragswert und offene Angebote | `ph_vertriebscockpit.py` liest `gesamt_cent` – **das Feld existiert weder in PH Angebot noch in PH Auftragsbestaetigung** (dort: `netto_cent`, `brutto_cent`, `auftragswert_cent`). Filter `docstatus < 2` wirkungslos (beide nicht submittable), **Status „Storniert“/„Abgelehnt“/„Ersetzt“ wird mitgezählt** (AB/Angebot), keine `waehrung` | Auftragswert und offene Angebote immer 0; Auftragsanzahl inkl. stornierter ABs; Versionen (`Ersetzt`) zählen mehrfach als Angebot. |
| F4 | §2.4 Warnband „Keine Kontaktmöglichkeit“, §2.2 Qualifizieren „deaktiviert mit Tooltip“, Q2 | Anfrage ohne E-Mail/Telefon kann existieren | `PHAnfrage.validate()` wirft „Mindestens E-Mail oder Telefon ist nötig.“ bei **jedem** Speichern | Zustand nie erreichbar; Q2 prüft nichts. Umgekehrt: Kunde nur mit Postanschrift kann **keine** Anfrage bekommen (→ §4 R-E3). |
| F5 | §4.6 A-CRM1 Taste `5` „Verloren“, §2.2 Massenaktion Status | Verloren aus „Neu“ möglich | `workflow.json`: aus **PH Neu** nur „Qualifizieren“ und „Als Spam markieren“; Verloren erst ab Qualifiziert | Echte Anfrage „kein Bedarf“ muss erst qualifiziert werden (verfälscht Quote „Qualifiziert“ im Cockpit) oder wird fälschlich Spam. |
| F6 | §2.7 „Ziehen am unteren Rand = Dauer (15-min-Raster)“ | Dauer per Drag änderbar | `PH Termin.umbuchen(neuer_start, berater=None)` hat **keinen Dauer-Parameter**; `set_value dauer_min` umgeht die Slot-Prüfung (`slot_pruefen` läuft nur in `umbuchen`) | Doppelbuchung möglich. Funktion streichen oder Methode erweitern (§6 P-T2). |
| F7 | §4.1 Zeile „Termin vereinbaren … aus Neu oder Qualifiziert“ | Übergang über Workflow | `termin_vorschlagen` setzt Status per `status_setzen` **ohne Workflow-Prüfung**; Workflow kennt Neu → Termin vereinbart nicht | Funktioniert, aber Kanban-Drag Neu → Termin vereinbart wird durch `getWorkflowTransitions` als „nicht erlaubt“ angezeigt, obwohl A1 es tut. Workflow-Übergang ergänzen (P-A1). |

Kleinere Abweichungen: PH Geschäftsführung hat auf **PH Aufgabe** `read, write, create, export` (Konzept §1.1: „lesen, Berichte“); PH Geschäftsführung hat auf PH Anfrage `export` – Konzept sieht CSV nur für Leitung. Rollenmatrix angleichen.

---

## 2. UI-Funktionen ohne Datenfeld oder Methode [FEHLT-DATEN]

Nur Punkte, die im Konzept **nicht** schon als „fehlt in App ph_crm“ markiert sind (die markierten 15 Punkte aus Konzept §12 sind bestätigt und hier nicht wiederholt).

| # | UI-Funktion (Konzept) | Was fehlt | Vorschlag DocType/Feld |
|---|---|---|---|
| D1 | §3.1 Chip „Architekt: DI Weiss →“, §3.5 | Kein Feld verknüpft Kunde ↔ Architekt/Planer/Partner | `PH Kontakt.architekt` Link(PH Kontakt, Filter `kontaktart in Architekt, Partner`) **oder** Kindtabelle `PH Kontakt Beziehung` (rolle: Architekt · Ansprechpartner · Rechnungsempfänger · Partner · Hausverwaltung · Yacht-Management; kontakt Link; gueltig_bis) |
| D2 | Hotel/Yacht/Architekturbüro mit mehreren Personen (Konzept zeigt „Arch. Büro Weiss – DI Weiss“ als **einen** Kontakt) | Keine Firma → Ansprechpartner-Struktur; `email` ist **unique** | Feld `PH Kontakt.uebergeordnet` Link(PH Kontakt) + Liste „Ansprechpartner“ in Kundenakte; Rechnungsempfänger über D1-Rolle |
| D3 | §3.1 Kachel „Zahlen“ / Tab Belege: Debitor | ph_faktura legt Custom Field `PH Kontakt.ph_faktura_debitor_nr` an – im Konzept nicht genutzt | Kopf-Chip „Debitor 20042“ (nur Faktura/Leitung); Zusammenführen sperren, wenn beide Kontakte eine Debitornummer haben (§3 B4) |
| D4 | §3.3 Tab Zahlungen „Anzahlung Ist/Soll“ | Zwei Quellen: `PH Anzahlung` (ph_shop) und `PH Auftragsbestaetigung.anzahlung_soll_cent/anzahlung_ist_cent` + `PH Rechnung art = Anzahlungsrechnung` | Eine Quelle festlegen: Soll/Ist ausschließlich aus PH Auftragsbestaetigung; Liste der Zahlungen ausschließlich `PH Zahlung`; PH Anzahlung nur als Herkunft anzeigen (sonst Doppelzählung) |
| D5 | §2.13 Tab Automationen „Schalter R1–R8“ | Felder fehlen in `PH Termin Einstellungen` | `auto_r1_wiedervorlage` … `auto_r8_duplikat` (Check) + `ruhend_tage_qualifiziert/termin/angebot` (Int) |
| D6 | §3.2 „Gesperrt“ | Kein Sperrgrund-Feld; Grund nur als Kommentar | `PH Kontakt.sperrgrund` Select (Zahlungsausfall · Missbrauch · Wunsch des Kunden · Sonstiges) + `gesperrt_am`, `gesperrt_von` |
| D7 | §2.10 Budget je Raum, Summe „47.000,00 €“ | `budget_cent` ohne Währung und ohne brutto/netto-Angabe | `PH Beratungsgespraech.waehrung` (Link Currency, Standard EUR) + Beschriftung „Budget brutto (Kundenangabe)“ |
| D8 | §2.2 Produkte → „In Angebot übernehmen“ | `PH Anfrage Produkt` hat nur `produkt_slug/produkt_name/marke` – kein Link auf `PH Produkt` | `PH Anfrage Produkt.produkt` Link(PH Produkt), beim `create_anfrage` per Slug auflösen; ohne Treffer Freitextposition |
| D9 | §3.4 Zeitleiste „Termine“ für Kunden ohne Kontakt-Link | Website-Termine haben `kontakt` oft leer (wird erst bei `kontakt_anlegen` gesetzt) | Beim `verify_termin` Kontakt per `finde_oder_lege_an` verknüpfen; sonst fehlen Termine in Kundenakte **und** DSGVO-Auskunft |
| D10 | §2.12 „Kopieren von Woche“ | als Lücke markiert, aber keine Gültigkeitslogik: PH Verfuegbarkeit ist Wochenmuster, keine Einzelwoche | Für Ausnahmen einer Woche ist PH Abwesenheit (ph_personal) die richtige Quelle; „Kopieren“ = neue Zeilen mit `gueltig_von/bis` – Konzept präzisieren |

---

## 3. Recht und Buchhaltung

### 3.1 Verstöße (müssen vor Bau korrigiert werden)

| # | Stelle | Problem | Rechtsgrundlage | Korrektur |
|---|---|---|---|---|
| V1 | §2.5 Massenaktion „Serienbrief/-mail → Marketing (nur Kontakte ohne Widerspruch)“, §4.7 „An Marketing (Zielgruppe, ohne Widerspruch)“ | Werbe-E-Mail/SMS an alle Kontakte ohne Widerspruch | **TKG 2021 § 174**: elektronische Werbung an Verbraucher nur mit **vorheriger Einwilligung**; Ausnahme § 174 Abs 4 nur für Bestandskunden (Adresse im Zusammenhang mit Kauf erhalten, ähnliche eigene Produkte, Widerspruchsmöglichkeit bei Erhebung **und** jeder Nachricht). Widerspruchslogik (Opt-out) gilt nur für Briefpost (DSGVO Art. 21) | Filter getrennt je Kanal: **E-Mail/SMS/WhatsApp** = aktive `PH Einwilligung` mit passendem `zweck` (newsletter/einladungen/whatsapp) **oder** Bestandskunden-Ausnahme mit Feld `PH Kontakt.werbung_bestandskunde_hinweis_am` (Datum, an dem bei Erhebung auf Widerspruch hingewiesen wurde); **Brief** = ohne `nicht_kontaktieren`. Hinweistext im Dialog: „12 ausgeschlossen: keine Einwilligung · 3 ausgeschlossen: Widerspruch“. |
| V2 | §6 DSGVO-Auskunft „ohne … `notizen`“, Q13; Server `datenauskunft()` | Interne Notizen über die Person werden aus der Auskunft entfernt | **DSGVO Art. 15 Abs 1 und 3**: Kopie **aller** personenbezogenen Daten; interne Notizen sind personenbezogen. Beschränkung nur bei Rechten Dritter/Geschäftsgeheimnis (Art. 15 Abs 4, § 4 Abs 6 DSG) und nur einzeln begründet | `notizen` (PH Kontakt), `notiz_intern` (PH Termin, PH Beratungsgespraech) **aufnehmen**; Leitung kann einzelne Passagen vor Versand schwärzen (Dialog „Ausnahme Art. 15 Abs 4 – Begründung*“, protokolliert). Technische Felder (`portal_token_hash`, `idempotency_key`) dürfen weg, `ip_hash` gehört hinein (ist personenbezogen, pseudonym). |
| V3 | §6 / Server `datenauskunft()` | Auskunft ist unvollständig: Vorgänge nur mit `name, status, datum`; fehlen `PH Anfrage.anliegen`, Uploads (`File`), `PH Beratungsgespraech` Inhalte (Räume, Wünsche, Budget, Entscheider), Communication-**Inhalt** (nur Betreff), Mails an Anfrage/Termin, Termine ohne `kontakt`-Link (nur E-Mail), Kundenkarte, Kassenbelege mit Kontakt. Es fehlen die Pflicht-Metadaten Art. 15 Abs 1 lit a–h (Zwecke, Empfänger, Speicherdauer, Herkunft, Beschwerderecht) | DSGVO Art. 15 Abs 1 lit a–h, Abs 3 | `datenauskunft()` erweitern: je VORGAENGE-Eintrag alle Felder außer technischen; Suche zusätzlich über `email`/`telefon`; Anhang „Metadaten“ als fester Textblock aus PH Firma (Zwecke, Empfänger: Hersteller/Spedition/Steuerberatung, Fristen). |
| V4 | Konzept gesamt | **Kein Löschkonzept.** Spam-Anfragen, Interessenten ohne Auftrag, Uploads, abgelehnte Reservierungen bleiben unbegrenzt. Website verspricht bei Uploads „Speicherdauer: {days} nach Ablauf dieses Links, außer die Unterlagen werden für einen Auftrag benötigt“ – ph_crm hat **keinen** Lösch-Task und kein Feld „für Auftrag benötigt“ | DSGVO Art. 5 Abs 1 lit e, Art. 17; BAO § 132 (7 Jahre für Belege und Geschäftspapiere, bei laufendem Verfahren länger); UGB § 212 | Siehe Prozess P-L (§5). |

### 3.2 Risiken (Konzept ergänzen)

| # | Thema | Risiko | Grundlage | Maßnahme |
|---|---|---|---|---|
| B1 | Telefon-/Showroom-/Messe-Anfrage (§2.3, A-CRM5, §7 Messe „Visitenkarte fotografieren“) | Daten werden erhoben, ohne dass Informationspflicht dokumentiert ist; Visitenkartenfoto enthält ggf. Daten Dritter | DSGVO Art. 13 (bei Erhebung beim Betroffenen), Art. 14 (Empfehlung/Architekt nennt Kunden) | Feld `PH Anfrage.datenschutzhinweis` Select (Website-Formular · mündlich erteilt · Aushang Showroom · per Mail nachgereicht · offen) + Datum; bei `offen` Aufgabe „Datenschutzhinweis senden“; Anfrage aus Empfehlung (`art = Empfehlung`) → Art. 14-Mail binnen 1 Monat als Aufgabe |
| B2 | Vor-Ort- und Videotermin führen zum Vertrag (Küche, Bad) | Vertrag außerhalb von Geschäftsräumen (AGV) bzw. Fernabsatz → 14 Tage Rücktritt, Belehrung, Muster-Formular; bei Maßanfertigung Ausnahme § 18 Abs 1 Z 3 FAGG; bei Beginn der Leistung (z. B. Aufmaß, Planung) vor Fristende **ausdrückliches Verlangen** nötig (§ 10 FAGG) | FAGG §§ 4, 10, 11, 18 | CRM liefert den Vorschlag: `PH Beratungsgespraech.abschlusskanal` Select (Showroom · Beim Kunden · Fernabsatz) – Standard aus `ort` (Showroom → Showroom, Vor Ort → Beim Kunden, Video/Telefon → Fernabsatz); A-CRM2 übergibt an `PH Angebot.vertragsort` (existiert). Kundenakte zeigt aus `PH Auftragsbestaetigung.fagg_frist_ende` Band „Rücktrittsfrist läuft bis 18.11.“ |
| B3 | „Planung beauftragen“ (§2.10, A-CRM3) | Planung ist bei Einrichtungshäusern oft entgeltlich (Planungspauschale, Anrechnung bei Auftrag). Konzept legt Projekt ohne Vereinbarung über Kosten an | ABGB (Entgelt muss vereinbart sein), FAGG § 10 bei AGV/Fernabsatz | A-CRM3 Schritt „Kosten“: ☐ kostenlos · ☐ Planungspauschale lt. Angebot (öffnet A2 mit Position „Planung“ und Anrechnungstext); ohne Wahl kein Abschluss. Feld `PH Beratungsgespraech.planung_entgelt` Select (kostenlos · pauschal · nach Aufwand) |
| B4 | Zusammenführen (A-CRM4) mit `rename_doc(merge=1)` | Umhängen von PH Rechnung (submittable) und Buchungsjournal auf anderen Kontakt; zwei Debitoren in BMD/DATEV werden still verschmolzen; Rechnungs-Snapshot (`kunde_name`, `strasse` …) bleibt, Personenkonto passt nicht mehr | BAO § 131 (Nachvollziehbarkeit), GoB | Sperre: Zusammenführen nur, wenn höchstens **ein** Kontakt `ph_faktura_debitor_nr` hat **oder** kein `PH Export Lauf` exportiert ist; sonst Hinweis „Debitor in Buchhaltung zusammenlegen, dann hier“. Merge protokolliert (Kommentar an beiden + Version). Belege nie inhaltlich ändern. |
| B5 | Freitext `notizen`, `notiz_intern`, `storno_grund`, `sperrgrund` | Abwertende oder sensible Angaben (Herkunft, Gesundheit, Religion, „Ausländer“, „zahlt schlecht“) | DSGVO Art. 9; GlBG Teil III (Gleichbehandlung beim Zugang zu Gütern und Dienstleistungen: Geschlecht, ethnische Zugehörigkeit) | Platzhalter und Hinweis unter dem Feld: „Nur sachliche Angaben. Keine Gesundheits-, Herkunfts- oder Religionsangaben.“; Sperrgrund als Select (D6), nie Freitext allein; Konditionen nie an Anrede/Geschlecht knüpfen (Anrede bleibt optional, „keine Angabe“ als leerer Wert sichtbar beschriften) |
| B6 | Portal-Token „einmal im Dialog anzeigen“ (§4.3) bei Kunde ohne E-Mail | Mitarbeiter schreibt Token ab, gibt ihn mündlich/auf Zettel | DSGVO Art. 32 | Für Kunden ohne E-Mail: Druck „Portal-Zugangsbrief“ (QR + Token, ein Exemplar) statt Abschreiben; Dialog bietet [Brief drucken] |
| B7 | Sammel-PDF Anfragen ≤ 50 (§2.2) für Rolle Mitarbeiter | faktisch Export personenbezogener Daten, obwohl Rolle „kein Export“ hat | DSGVO Art. 5 Abs 1 lit f, Art. 32 | Sammeldruck > 10 nur Leitung; jeder Sammeldruck als Kommentar protokolliert |

### 3.3 Buchhaltungslogik

| # | Befund | Korrektur |
|---|---|---|
| K1 | „Umsatz“/„Auftragswert“ im Cockpit (`umsatz_cent`) ist Auftragseingang, nicht Umsatz. Umsatz im buchhalterischen Sinn = gestellte Rechnungen − Gutschriften. | Bezeichnung überall „Auftragseingang (netto)“; Quelle `PH Auftragsbestaetigung.netto_cent`, Status ≠ Storniert; Spalte „Umsatz“ nur aus PH Rechnung (`Gestellt|Teilbezahlt|Bezahlt|Ueberfaellig|Gemahnt`) minus PH Gutschrift, nur für Leitung/GF. |
| K2 | Netto/Brutto nirgends festgelegt (Kachel „Auftragswert 12 Monate“, „Offene Posten“, Budget). | Regel: Vertriebszahlen **netto**, offene Posten **brutto** (Forderung), Kundenbudget **brutto** (Kundensicht). Kennzeichnung in jedem Label. |
| K3 | Anzahlung: Konzept zeigt „Anzahlung Ist/Soll“, ohne Steuerlogik. Vereinnahmte Anzahlung löst bei Soll-Besteuerung USt-Schuld aus (Mindest-Istbesteuerung, § 19 Abs 2 Z 1 lit a UStG); Anzahlungsrechnung muss in der Schlussrechnung abgezogen werden (§ 11 Abs 1 UStG). | CRM zeigt nur an, bucht nie. „Anzahlung offen“ = `anzahlung_soll_cent − anzahlung_ist_cent` der ABs mit Status ≠ Storniert. Zahlungsknöpfe in Kundenakte führen immer in Faktura (Zahlung erfassen), nie Inline-Eingabe im CRM. |
| K4 | Kassa-Barverkauf an bekannten Kunden (`PH Kassenbeleg.kontakt`) | Ändert Kontakt-Status nicht (F2); Kundenakte „Zahlungen“ muss Kassenbelege anzeigen, darf sie aber nicht als Rechnung zählen (RKSV-Beleg ≠ Faktura-Rechnung). |
| K5 | Währung | PH Angebot/AB/Rechnung haben `waehrung`; Cockpit und Kundenakte summieren ohne Währung. Summen je Währung getrennt („EUR 120.400 · CHF 18.000“), keine Umrechnung im CRM. |

---

## 4. Fehlende Randfälle [RAND]

### 4.1 Storno

| # | Fall | Heute (Code) | Soll im CRM |
|---|---|---|---|
| R-S1 | AB wird storniert (`PH Auftragsbestaetigung.status = Storniert`) nach Anfrage „Gewonnen“ | Anfrage bleibt Gewonnen; Kontakt bleibt Kunde; Cockpit zählt Auftrag | Workflow-Übergang `PH Gewonnen → Verloren` (Leitung, Aktion „Auftrag storniert“, `verloren_grund` neu: „Storno nach Auftrag“); ph_faktura-Hook bei AB-Storno → Anfrage auf Verloren, Kommentar mit AB-Nr.; `kunde_seit` bleibt (es gab einen Vertrag), Cockpit „Aufträge“ ohne Storno |
| R-S2 | Termin storniert nach Gesprächsprotokoll angelegt | nicht möglich (Erledigt ist Endzustand) – korrekt | – |
| R-S3 | Kunde storniert Termin per Website, Backoffice hat Termin gleichzeitig umgebucht | `link_version` schützt (409) – korrekt | Kalender-Toast „Kunde hat inzwischen abgesagt“ bei `conflict` statt generischem Fehler |
| R-S4 | Website-Reservierung abgelaufen → Task setzt **„Abgelehnt“** | verfälscht Report „Termine je Berater“ (`abgelehnt`) und die Leitungs-Sicht „Ablehnen = Leitung“ | Eigener Zustand `Verfallen` oder `storno_grund = E-Mail nicht bestätigt` aus allen Berater-Kennzahlen ausfiltern; Konzept §5.3 Report-Spalte „abgelehnt“ entsprechend erklären |

### 4.2 Teillieferung / Teilauftrag

| # | Fall | Soll |
|---|---|---|
| R-T1 | Gespräch mit 3 Räumen, Auftrag nur für Küche | Anfrage „Gewonnen“ ist richtig, aber Rest-Potenzial geht verloren. Beim Gewinnen Dialog: „Offene Räume (Wohnen, Bad) als neue Anfrage weiterführen?“ → neue PH Anfrage `art = Beratung`, `quelle = sonstige`, Kanal „Folgeanfrage aus PH-ANF-…“, Kontakt gleich. Feld `PH Beratungsgespraech Raum.ergebnis` Select (offen · beauftragt · verloren · später) |
| R-T2 | AB `Teilgeliefert` | Kundenakte „Offen jetzt“ zeigt „Teilgeliefert · 2 von 5 Positionen · Rest KW 49“ (Daten aus ph_faktura/ph_logistik); Telefonauskunft T8 sonst falsch („geliefert“) |
| R-T3 | Mehrere Angebote/Versionen zu einer Anfrage (`PH Angebot.version`, `vorgaenger`, Status `Ersetzt`) | Anfrage-Bezug „Folgedokument“ zeigt nur ein Dokument (`folgedokument`); Bezugskarte muss alle `PH Angebot.anfrage = <Anfrage>` listen, Cockpit zählt nur letzte Version |

### 4.3 Anzahlung

| # | Fall | Soll |
|---|---|---|
| R-A1 | Anzahlung bezahlt, Kunde tritt binnen FAGG-Frist zurück | Prozess P-W (§5); Kundenakte Band „Rücktritt erfasst – Rückzahlung Anzahlung offen 3.500 €“ bis Erstattung (`PH Zahlung` Erstattung) |
| R-A2 | Anzahlung über Kassa (bar/Karte) statt Überweisung | Zahlungen-Tab zeigt Kassenbeleg **und** Faktura-Anzahlung nicht doppelt (D4); Quelle-Kennzeichen „Kassa“ |
| R-A3 | Anzahlung überfällig | CRM-Aufgabe an Berater (nicht nur Mahnwesen), weil Berater den Kunden kennt: Regel R9 „Anzahlung 7 Tage nach AB nicht eingegangen → Aufgabe an `PH Auftragsbestaetigung.zugewiesen_an`“ |

### 4.4 Retoure / Reklamation / Rücktritt

| # | Fall | Soll |
|---|---|---|
| R-R1 | Rücktritt nach FAGG (AGV/Fernabsatz) kommt per Telefon oder Mail beim Berater an | Fehlt komplett → Prozess P-W |
| R-R2 | Reklamation/Retoure eines Shop-Artikels | gehört zu ph_service/ph_shop; CRM: Kundenakte `Neu ▾ → Servicefall` vorhanden; ergänzen: Telefonnotiz A-CRM5 Ergebnis „Reklamation“ → legt PH Servicefall an statt Anfrage |
| R-R3 | Gewährleistung/Garantie-Fristen | Kundenakte Tab Service zeigt Ablauf aus `PH Produktpass` (falls Feld vorhanden) – im Konzept nicht genannt; als Leer-Zustand „Keine Fristen erfasst“ |

### 4.5 Fremdwährung / Schweiz (Lochau: Grenzlage DE/CH)

| # | Fall | Heute (Code) | Soll |
|---|---|---|---|
| R-C1 | Kunde aus CH, Website-Eingabe „CH-9000 St. Gallen“ | `plz_ort_teilen` verwirft das Präfix „CH-“, `land` bleibt leer; 4-stellige PLZ ist für AT und CH identisch → Kontakt gilt als Inland | Präfix auf `land` abbilden (`CH-` → Switzerland, `D-`/`DE-` → Germany, `FL-` → Liechtenstein); ohne Präfix + Telefon `+41` → Land-Vorschlag mit Bestätigungsband „Land prüfen“ |
| R-C2 | Angebot in CHF | `PH Kontakt` hat keine Standardwährung, kein Steuerkennzeichen | `PH Kontakt.waehrung_standard` Link(Currency) und `PH Kontakt.steuerstatus` Select (Inland · EU Privat (OSS) · EU Unternehmen (igL/RC) · Drittland (Ausfuhr)) als Vorschlag für A2; ph_faktura: `ust_fall` in PH Angebot/PH Auftragsbestaetigung kennt **„Ausfuhr“ nicht** (nur PH Rechnung) → Anfrage an ph_faktura |
| R-C3 | UID CH (`CHE-123.456.789`) / DE / FL | `uid` Data ohne Prüfung | Formatprüfung je Land; EU-UID über VIES (Stufe 2) mit Datum → ph_faktura nutzt bereits `uid_geprueft_am` am Beleg; am Kontakt `uid_geprueft_am` ergänzen, Angebot übernimmt |
| R-C4 | Budget im Gespräch in CHF genannt | D7 |
| R-C5 | Telefon `+41`, `+49`, `+423` | Suche/Doppelgänger-Erkennung ohne Normalisierung (Konzept verweist auf ph_core `api.suche`) | Normalisierung E.164 beim Speichern in `validate()` von PH Kontakt/PH Anfrage/PH Termin (zusätzliches Feld `telefon_norm`, indiziert) |

### 4.6 Kunde ohne E-Mail

| # | Fall | Heute (Code) | Soll |
|---|---|---|---|
| R-E1 | Telefon-Anfrage ohne E-Mail → „Kontakt anlegen“ | `finde_oder_lege_an` sucht **nur per E-Mail** → jede Anfrage erzeugt einen **neuen** Kontakt (Dubletten bei Stammkunden, die anrufen) | Suche zusätzlich `telefon_norm`/`mobil` (R-C5) und `nachname + plz`; bei Treffer Rückfrage in der UI statt automatischem Neuanlegen |
| R-E2 | Ehepaar/Firma mit gemeinsamer E-Mail | `email` unique → zweiter Kontakt nicht speicherbar | Unique-Regel aufheben zugunsten Warnung, **oder** Modell „ein Kontakt = Haushalt“ mit Personen-Kindtabelle; Inhaber-Entscheidung (§7) |
| R-E3 | Kunde nur mit Postanschrift (Showroom, älterer Kunde, Brief bevorzugt) | PH Anfrage kann nicht gespeichert werden (F4) | `validate()`: E-Mail **oder** Telefon **oder** vollständige Anschrift (`plz_ort` + Straße – Feld `strasse` an PH Anfrage ergänzen); Qualifizieren-Bedingung entsprechend |
| R-E4 | Termin bestätigen ohne E-Mail | `mail_senden` gibt still `False` zurück | UI: Mail-Haken ausgeblendet (Q7 vorhanden) **plus** Toast „Keine E-Mail – bitte telefonisch bestätigen“ und Aufgabe „Termin telefonisch bestätigen“ (optional per Haken); Druck „Terminbestätigung“ als Brief angeboten |
| R-E5 | Terminerinnerung ohne E-Mail | `termin_erinnerungen` überspringt | Tagesliste „Morgen ohne E-Mail: 2 – anrufen“ (passt zu R6); kein SMS ohne Anbieter-Entscheidung |
| R-E6 | DSGVO-Auskunft / Protokoll an Kunden ohne E-Mail | nur Mail-Weg beschrieben | Versandweg-Wahl im Dialog: E-Mail · Brief (PDF drucken, Versand im Kommentar protokollieren) · Abholung persönlich (Identität prüfen) |
| R-E7 | Kontakt mit `kommunikation_bevorzugt = Brief` | Composer öffnet trotzdem E-Mail | Kopf zeigt bevorzugten Weg; `m` öffnet bei Brief den Druck-Drawer mit Briefvorlage |

---

## 5. Fehlende Pflichtprozesse [PROZESS]

### P-W Rücktritt / Widerruf nach FAGG erfassen

```
Kundenakte ⋯ › Rücktritt erfassen            (auch: A-CRM5 Ergebnis „Rücktritt“)
┌ Rücktritt erfassen ───────────────────────────────────────── ① Auftrag ─ ② Eingang ─ ③ Prüfen ┐
│ Auftrag  [AB-2026-00042 · Küche · Beim Kunden · Frist bis 18.11.2026 ✓ fristgerecht]         │
│ Eingang  [04.11.2026]  Weg [E-Mail ▾] (E-Mail · Brief · Telefon · Persönlich · Formular)       │
│ ⚠ Maßanfertigung – Ausnahme § 18 Abs 1 Z 3 FAGG prüfen (Leitung)    (wenn Positionen Maß)     │
│ ⚠ Leistung auf Verlangen begonnen (Aufmaß 30.10.) – anteiliges Entgelt § 16 FAGG              │
│                                                   [Abbrechen]  [Rücktritt an Faktura übergeben] │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

- Daten: neuer DocType **`PH Ruecktritt`** (in ph_faktura oder ph_crm, Entscheidung §7): `kontakt`, `auftrag` Link(PH Auftragsbestaetigung), `eingang_am` Date*, `weg` Select*, `fristgerecht` Check (berechnet aus `fagg_frist_ende`), `ausnahme` Select (keine · Maßanfertigung · Sonstige), `status` (Erfasst → Geprüft (Leitung) → Abgewickelt | Abgelehnt), `begruendung`, `erstattung_bis` Date (Eingang + 14 Tage, § 15 FAGG), Anhänge.
- Wirkung: Aufgabe an Leitung (Prüfung), nach „Geprüft“ ph_faktura Storno/Gutschrift; Anfrage R-S1; Eingangsbestätigung an Kunden (dauerhafter Datenträger, § 13 Abs 1 FAGG bei Online-Formular).
- Kundenakte: Band `warning` „Rücktritt erfasst 04.11. – Erstattung bis 18.11.“ bis Abgewickelt.
- Zustände/Fehler: ohne AB → Feld „Auftrag“ Pflicht, Leer-Text „Keine AB mit Rücktrittsrecht (Vertragsort Showroom)“; Vertragsort Showroom → Hinweis „Kein gesetzliches Rücktrittsrecht – Kulanz?“ (Weiter nur Leitung).
- Animation: Standard-Assistent (§4.6 Konzept). Kürzel: keins (selten, bewusst).

### P-B Betroffenenanfrage (DSGVO Art. 15–21) mit Frist

- Neuer DocType **`PH Betroffenenanfrage`**: `kontakt` (optional, wenn noch nicht zugeordnet), `recht` Select* (Auskunft 15 · Berichtigung 16 · Löschung 17 · Einschränkung 18 · Übertragbarkeit 20 · Widerspruch 21), `eingang_am`*, `weg`, `identitaet_geprueft` Check + `pruefweg`, `frist_bis` (= Eingang + 1 Monat, Art. 12 Abs 3; Verlängerung + 2 Monate mit Begründung), `status` (Offen → In Arbeit → Erledigt | Abgelehnt mit Begründung), `ergebnis_datei`, `versand_weg`.
- UI: Kundenakte Tab Datenschutz „Anfrage erfassen“; Zentrale-Heute-Leiste „Datenschutz-Fristen 1“ (Leitung) ab 7 Tage vor `frist_bis` orange, überfällig rot.
- Auskunft-PDF (V2/V3) hängt an der Betroffenenanfrage, nicht lose; Widerspruch (Art. 21) über diese Anfrage ruft `widerspruch_erfassen(quelle)` und widerruft alle Werbe-Einwilligungen in `PH Einwilligung`.
- Leer: „Keine Datenschutz-Anfragen.“

### P-L Lösch- und Aufbewahrungskonzept

| Datenart | Frist (Vorschlag, Inhaber/Rechtsberatung entscheidet) | Technik |
|---|---|---|
| PH Anfrage `Spam` | 30 Tage nach Statuswechsel | Task `anfragen_spam_loeschen` (täglich 03:00): löschen inkl. Files |
| PH Anfrage `Verloren` ohne Kontakt mit Belegen | 24 Monate nach letzter Änderung | Task anonymisiert (Name, E-Mail, Telefon, Anliegen → „anonymisiert“), Kennzahlen bleiben |
| PH Kontakt `Interessent` ohne Vorgang seit 36 Monaten, ohne Einwilligung | 36 Monate | Liste „Zur Löschung vorgeschlagen“ für Leitung (kein Automatik-Löschen), Bestätigung je Stapel |
| PH Kontakt mit Belegen (Rechnung, Kassenbeleg, AB) | 7 Jahre ab Ende des Kalenderjahres des letzten Belegs (BAO § 132), länger bei Gewährleistung/Verfahren | statt Löschen: `PH Kontakt.eingeschraenkt` Check (Art. 18) → aus Listen, Suche, Marketing ausgeblendet; nur Faktura/Leitung lesen |
| Uploads (Website-Versprechen) | wie Website-Text `{days}` nach Linkablauf, außer „für Auftrag benötigt“ | Feld `PH Anfrage.uploads_behalten` Check (setzt sich automatisch bei Projekt/Angebot) + Task `uploads_aufraeumen` |
| Website-Termine `Abgelehnt` (Reservierung verfallen) | 30 Tage | Task löschen |
| `ip_hash` | 6 Monate | Task leert Feld |

UI: `/crm/einstellungen` Tab **Datenschutz**: Fristen (Leitung, Int-Felder in PH Termin Einstellungen oder neue Single `PH CRM Einstellungen`), Liste „Zur Löschung vorgeschlagen (12)“ mit Massenaktion **Anonymisieren** (Dialog, irreversibel, Text „12 Kontakte werden anonymisiert. Das kann nicht rückgängig gemacht werden.“, Eingabe „ANONYMISIEREN“ nicht nötig – ein Bestätigungsknopf `danger`), letzter Lauf. Kundenakte Leitung `⋯`: **Anonymisieren** nur, wenn keine Belege; sonst deaktiviert mit Tooltip „Aufbewahrungspflicht bis 31.12.2033 – nur Einschränken möglich“.

### P-K Kunde-Status automatisch (behebt F2)

- `doc_events` in **ph_faktura**: `PH Auftragsbestaetigung` beim ersten Wechsel aus „Offen“ (oder `on_update` mit Status ≠ Storniert) → `PH Kontakt.als_kunde_markieren(grund="AB <name>")`; `PH Rechnung on_submit` und `PH Kassenbeleg` mit `kontakt` (ph_kassa) gleich.
- Gleicher Hook setzt R7 (Anfrage Angebot → Gewonnen, Feld `gewonnen_am`).
- Konzept §4.3 Text ändern: „automatisch durch ph_faktura **(Hook fehlt, Anfrage an ph_faktura)**“.

### P-F Vertriebscockpit richtigstellen (behebt F3)

- `ph_vertriebscockpit.py`: Betragsfeld `netto_cent` (PH Angebot), `netto_cent` bzw. `auftragswert_cent` (PH Auftragsbestaetigung) – Inhaber/Faktura legt fest, welches „Auftragswert“ ist; Filter `status not in (Storniert)` (AB) und `status not in (Ersetzt)` (Angebot); Gruppierung je `waehrung`; „Umsatz“ getrennt aus PH Rechnung (K1).
- Konzept §5.3 Spaltennamen anpassen: `umsatz_cent` → Label „Auftragseingang netto“.

---

## 6. Pflichtänderungen (konkret, nach Priorität)

**Priorität A – vor Bau der Oberfläche (Recht/Falschdaten):**

| # | Änderung | Ort |
|---|---|---|
| P-A1 | Marketing-Massenaktionen nach Kanal filtern: E-Mail/SMS/WhatsApp nur mit aktiver `PH Einwilligung` (passender `zweck`) oder Bestandskunden-Ausnahme `PH Kontakt.werbung_bestandskunde_hinweis_am`; Brief nur ohne `nicht_kontaktieren` (V1) | Konzept §2.5, §4.7; ph_crm PH Kontakt (neues Feld Date) |
| P-A2 | `PH Kontakt.datenauskunft()`: `notizen` und alle `notiz_intern` aufnehmen, `ip_hash` aufnehmen; vollständige Vorgangsinhalte, Files, Communication-Inhalt, Suche über `email`/`telefon`; Metadaten-Block Art. 15 Abs 1 lit a–h; Schwärzen nur mit Begründung (V2, V3) | ph_crm `ph_kontakt.py`, Print Format `PH Kontakt DSGVO-Auskunft`; Konzept §6, Q13 umkehren |
| P-A3 | Löschkonzept P-L inkl. Tasks `anfragen_spam_loeschen`, `uploads_aufraeumen`, `ip_hash_leeren`, Feld `PH Kontakt.eingeschraenkt`, `PH Anfrage.uploads_behalten` (V4) | ph_crm `tasks.py`, `hooks.py`, DocTypes; Konzept neuer Abschnitt |
| P-A4 | DocType `PH Betroffenenanfrage` mit Fristlogik (P-B) | ph_crm |
| P-A5 | Cockpit-Betragsfelder, Storno-/Versionsfilter, Währung (F3, P-F) | ph_crm `ph_vertriebscockpit.py`; Konzept §5.3 |
| P-A6 | Kunde-Status-Hook in ph_faktura/ph_kassa (F2, P-K); bis dahin Konzept-Kennzahl „Neue Kunden“ mit Hinweis „manuell gepflegt“ | ph_faktura `hooks.py`, ph_kassa; Konzept §3.2, §4.3, §5.1 |
| P-A7 | Konzept-Fehler F1 korrigieren: Empfehlung permlevel streichen; „Faktura“ aus Sichtregel „Intern“ streichen oder Custom DocPerm PH Faktura permlevel 1 read | Konzept §2.10, §9, §12 Nr. 8 |

**Priorität B – fachliche Lücken (Prozess/Randfall):**

| # | Änderung | Ort |
|---|---|---|
| P-B1 | Workflow PH Anfrage ergänzen: `Neu → Verloren` (Mitarbeiter, Grund Pflicht), `Neu → Termin vereinbart` (Aktion „Termin vereinbaren“), `Qualifiziert → Spam`, `Gewonnen → Verloren` (Leitung, „Auftrag storniert“), `Qualifiziert → Neu` (bereits im Konzept); `verloren_grund` Option „Storno nach Auftrag“ | `fixtures/workflow.json`, `workflow_action_master.json`, `ph_anfrage.json` |
| P-B2 | `PH Anfrage.validate()`: Pflicht E-Mail **oder** Telefon **oder** Anschrift; neues Feld `PH Anfrage.strasse`; Warnband/Q2 im Konzept an die neue Regel anpassen (F4, R-E3) | ph_crm `ph_anfrage.py/.json` |
| P-B3 | `finde_oder_lege_an`: Suche auch über `telefon_norm`/`mobil` und `nachname + plz`; neues Feld `telefon_norm` (E.164) an PH Kontakt, PH Anfrage, PH Termin (R-E1, R-C5) | ph_crm `ph_kontakt.py` |
| P-B4 | `plz_ort_teilen` → Länderpräfix auf `land` abbilden; `PH Kontakt.waehrung_standard`, `PH Kontakt.steuerstatus`, `PH Kontakt.uid_geprueft_am`; Anfrage an ph_faktura: `ust_fall` „Ausfuhr“ auch in PH Angebot/PH Auftragsbestaetigung (R-C1–R-C3) | ph_crm, ph_faktura |
| P-B5 | Rücktritt-Prozess P-W mit DocType `PH Ruecktritt`; Kundenakte-Band aus `fagg_frist_ende` | ph_faktura (Vorschlag) + Konzept Kundenakte |
| P-B6 | `PH Beratungsgespraech.abschlusskanal` (Vorschlag aus `ort`) → `PH Angebot.vertragsort`; `PH Beratungsgespraech.planung_entgelt`; A-CRM3 Schritt „Kosten“ (B2, B3) | ph_crm DocType, Konzept §2.10, §4.6 |
| P-B7 | `PH Beratungsgespraech.waehrung` + Label „Budget brutto“; `PH Beratungsgespraech Raum.ergebnis` Select (R-T1, D7) | ph_crm DocType |
| P-B8 | Kontakt-Beziehungen: `PH Kontakt.uebergeordnet` Link(PH Kontakt) + Kindtabelle `PH Kontakt Beziehung` (rolle, kontakt) für Architekt/Ansprechpartner/Rechnungsempfänger (D1, D2) | ph_crm DocType; Konzept §3.1 Chip-Quelle |
| P-B9 | Zusammenführen: Sperre bei zwei Debitornummern bzw. exportierten Belegen; Methode `zusammenfuehren(quelle, felder)` prüft das serverseitig (B4) | ph_crm `ph_kontakt.py`; Konzept A-CRM4 |
| P-B10 | `PH Anfrage.datenschutzhinweis` (Select + Datum) für Backoffice-Erfassung; Art.-14-Aufgabe bei `art = Empfehlung` (B1) | ph_crm DocType; Konzept §2.3, A-CRM5 |
| P-B11 | Kalender-Drag „Dauer ändern“ streichen **oder** `umbuchen(neuer_start, berater=None, dauer_min=None)` mit Slot-Prüfung (F6) | Konzept §2.7 bzw. `ph_termin.py` |
| P-B12 | Website-Reservierungen verfallen nicht als „Abgelehnt“, sondern `storno_grund = E-Mail nicht bestätigt` und aus Berater-Kennzahlen gefiltert (R-S4) | ph_crm `tasks.py`, Report `PH Termine je Berater` |
| P-B13 | Bei Website-Terminen Kontakt beim `verify_termin` verknüpfen (D9) | ph_crm `api/termin.py` |
| P-B14 | Eine Quelle für Anzahlungen/Zahlungen in der Kundenakte (D4, K3); Kassenbelege getrennt kennzeichnen (K4) | Konzept §3.3 |

**Priorität C – Qualität:**

| # | Änderung | Ort |
|---|---|---|
| P-C1 | `PH Kontakt.sperrgrund` (Select), `gesperrt_am`, `gesperrt_von`; Freitext-Hinweis gegen sensible Angaben unter allen Notizfeldern (D6, B5) | ph_crm DocType; Konzept §3.3 Daten |
| P-C2 | Kunde ohne E-Mail: Toast + Aufgabe „telefonisch bestätigen“, Brief-Druck für Terminbestätigung, Portal-Zugangsbrief, Versandweg-Wahl bei Auskunft/Protokoll, `m` respektiert `kommunikation_bevorzugt` (R-E4–R-E7, B6) | Konzept §2.9, §3.2, §4.3, §6 |
| P-C3 | Sammeldruck > 10 Anfragen nur Leitung, protokolliert (B7) | Konzept §2.2 |
| P-C4 | Rollenmatrix §1.1 an JSON angleichen (GF auf PH Aufgabe schreibend, GF Export Anfrage) oder JSON anpassen | Konzept §1.1 / DocType-Permissions |
| P-C5 | Mehrere Angebote je Anfrage in der Bezugskarte (`PH Angebot.anfrage`), Cockpit zählt nur letzte Version (R-T3) | Konzept §2.4 |
| P-C6 | Teilfolgeanfrage „offene Räume weiterführen“ beim Gewinnen (R-T1); Teillieferstand in „Offen jetzt“ (R-T2) | Konzept §3.1, §4.1 |
| P-C7 | Regel R9 „Anzahlung 7 Tage nach AB offen → Aufgabe Berater“ (R-A3) | Konzept §8.2; ph_faktura-Ereignis |
| P-C8 | `PH Anfrage Produkt.produkt` Link(PH Produkt) für „In Angebot übernehmen“ (D8) | ph_crm DocType, `api.create_anfrage` |

Akzeptanzkriterien ergänzen (Konzept §10):

| # | Kriterium |
|---|---|
| Q25 | Marketing-Massenaktion E-Mail schließt jeden Kontakt ohne aktive passende `PH Einwilligung` aus; Zähler im Dialog stimmt mit Server überein |
| Q26 | DSGVO-PDF enthält `notizen`, alle `notiz_intern`, `anliegen`, Gesprächsräume, Communication-Text, Dateiliste und den Metadaten-Block; enthält **nicht** `portal_token_hash`, `idempotency_key` |
| Q27 | Cockpit-Summen = Summe `netto_cent` der ABs mit Status ≠ Storniert, getrennt je `waehrung` (Staging-Vergleich mit Faktura-Liste) |
| Q28 | Erste AB/Rechnung/Kassenbeleg mit Kontakt setzt `status = Kunde` und `kunde_seit` |
| Q29 | Telefon-Anfrage ohne E-Mail für bestehenden Kontakt (gleiche Nummer, andere Schreibweise) erzeugt keinen zweiten Kontakt |
| Q30 | „CH-9000 St. Gallen“ ergibt `land = Switzerland`, `plz = 9000` |
| Q31 | Kontakt mit Belegen ist nicht anonymisierbar (Knopf deaktiviert, Tooltip mit Fristende) |
| Q32 | Betroffenenanfrage zeigt ab 7 Tage vor `frist_bis` in der Heute-Leiste der Leitung |

---

## 7. Inhaber-Entscheidungen (neu, aus dieser Prüfung)

1. **Haushalt oder Person:** Ein Kontakt = eine Person (E-Mail eindeutig, Ehepartner als Beziehung) **oder** ein Kontakt = Haushalt (gemeinsame E-Mail erlaubt)? Empfehlung: Person + Beziehung „Partner/in“, weil Einwilligungen und Widerspruch personenbezogen sind.
2. **Planung kostenpflichtig?** Planungspauschale ja/nein, angerechnet bei Auftrag ja/nein (steuert A-CRM3 und FAGG-Hinweise).
3. **Löschfristen** aus P-L bestätigen (mit Steuerberatung/Rechtsberatung); insbesondere Interessenten ohne Auftrag (Vorschlag 36 Monate) und verlorene Anfragen (24 Monate).
4. **Wo lebt der Rücktritt** (`PH Ruecktritt`): ph_faktura (Vorschlag, weil Storno/Erstattung dort) oder ph_crm.
5. **Bestandskunden-Werbung per E-Mail** (TKG § 174 Abs 4) nutzen oder ausschließlich Double-Opt-in? Empfehlung: nur Double-Opt-in (`PH Einwilligung`), weil der Hinweis „bei Erhebung“ für Altbestände nicht nachweisbar ist.
6. **Auftragswert** im Cockpit: `netto_cent` der AB oder `auftragswert_cent` (falls abweichend definiert in ph_faktura).

---

## 8. Was am Konzept fachlich richtig ist (beibehalten)

- Posteingang „älteste zuerst“, Reaktionszeit als Kennzahl, `erstreaktion_am` serverseitig.
- Slot-Prüfung über `get_freie_slots`/`slot_pruefen` und `link_version`-Schutz bei Umbuchung; Lücke in `termin_vorschlagen` (keine Slot-Prüfung) korrekt erkannt.
- Widerspruch als nicht schließbares Band, Composer mit Pflicht-Haken „vertragsbezogen“ – fachlich richtig für Vertragskommunikation.
- Portal-Token nur einmal sichtbar, nur Hash gespeichert.
- Geburtstag nur mit Einwilligung (Server erzwingt `geburtstag = None`).
- Termine werden storniert, nicht gelöscht (`on_trash`), Gewonnen/Verloren/Spam nur Leitung bearbeitbar.
- Fixture-Lücken (Workflow State/Action Master) korrekt und vollständig benannt – im Code bestätigt: fehlen „PH Neu“, „PH Erledigt“, „PH Storniert“, „PH Abgelehnt“, „PH Gesperrt“ bzw. „Stornieren“, „Ablehnen“, „Sperren“, „Reaktivieren“.
