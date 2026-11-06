# 10 – Konzept Bereich „CRM“ (ph_crm) für das Next.js-Backoffice – finale Fassung

**Zweck:** Verbindliches Funktions- und Oberflächenkonzept für den Bereich CRM (Anfragen, Kunden & Kontakte mit Kundenakte, Termine, Gesprächsprotokolle, Aufgaben-Anbindung, Berichte, Datenschutz-Abläufe) mit Bauauftrag für den Fachbereichs-Agenten „CRM“. Datenschicht ist die Frappe-App `ph_crm` (für Mitarbeiter unsichtbar).
**Stand:** 2026-11-04 · Fassung 2 (Überarbeitung nach `20-kritik-ux-crm.md` und `21-kritik-fach-crm.md`; alle Pflichtänderungen eingearbeitet, Protokoll in § 19). Abgeglichen mit dem Arbeitsstand von `Backend-Import/ph_crm` vom 04.11. (neu dort u. a. `api/kontakt.py`, `kontakt360.py`, `dsgvo.py`, `dubletten.py`, PH Datenschutzanfrage, PH Kontakt Rolle, PH Beratungsvorlage, Terminserie, Scheduler R1–R6/R8).
**Grundlage:** 01–05 (Benchmark, UX, Design-System, Motion, IA), `PLAN-NEXT-BACKOFFICE.md`, UI-Kit `backoffice/src/components/Backoffice/README.md`, `Backend-Import/ph_crm` (README, alle DocType-JSONs, Controller, `api/`, `tasks.py`, `hooks.py`, Fixtures, Reports), Querprüfung `ph_faktura` (PH Angebot, PH Auftragsbestaetigung, PH Rechnung, Custom Fields), `ph_marketing` (PH Einwilligung), SHD-Vorbild.
**Verbindlich aus 02/03/04/05 (hier angewandt, nicht wiederholt):** eine Primäraktion je Seite, Undo statt Rückfrage (**8 s**, außenwirksame Mails **10 s**), Dialog nur bei irreversibel/geldwirksam/außenwirksam mit Pflichtangabe, Filter in der URL, Skeleton nach 300 ms (min. 600 ms), Token `--color-bo-*`, Dauer 120/160/200/240 ms mit `--bo-ease-out` (Austritt `--bo-ease-in`), Spring nur beim Kanban-Drop, Seitentypen T1–T9, Fehlercodes `invalid|forbidden|not_found|conflict|rate_limited|unavailable|auth`, Toast unten rechts, Zeilenhöhe 36/44 px (03 § 4), Icons nur lucide 16 px mit Textlabel oder `aria-label`, keine Emoji.
**Nicht Teil dieses Konzepts:** Angebots-/Beleg-Erstellung (Faktura, A2), Projekt-/Planungsmappe (Projekte), Newsletter-/Kampagnenversand (Marketing), Servicefall-Bearbeitung (Service), Aufgaben-Seite selbst (Zentrale `/aufgaben`; CRM liefert Filter und Zeilen).
**Rechtlicher Hinweis:** Punkte mit „RB“ sind von der Rechtsberatung, mit „StB“ vom Steuerberater zu bestätigen; das Konzept ist keine Rechtsberatung.

---

## 0. Entscheidungen dieser Fassung (Widersprüche aufgelöst)

Regel: Bei Widerspruch zwischen UX- und Fachkritik gewinnt erst die **Rechtskonformität**, dann die **einfachere Bedienung**.

| # | Frage | Entscheidung | Begründung |
|---|---|---|---|
| E1 | Anfrage-Status läuft mit Termin/Angebot auseinander (UX P1) | **Die Anfrage ist der Vorgang.** Angezeigt wird ein **abgeleiteter Status** (`lib/backoffice/crm/vorgang.js`): aktiver Termin → „Termin vereinbart“; alle Termine storniert/abgelehnt/nicht erschienen → Kennzeichen **„Termin entfallen“** + Primär „Neuen Termin anlegen“; Angebot (`PH Angebot.anfrage`, Status ≠ Ersetzt) → „Angebot“. Weicht der gespeicherte Status ab, zeigt die Akte ein Band „Status passt nicht zum Termin“ [Angleichen] (Leitung) bzw. [Leitung bitten] (Mitarbeiter). Serverseitiger Abgleich als Anfrage A5. | Ein Lebenszyklus, keine widersprüchlichen Stände in Kanban und Kundenakte. |
| E2 | Drei Nachfass-Mechanismen (UX P2) – ph_crm hat inzwischen `wiedervorlage_setzen` + Task `wiedervorlagen_faellig` | **Ein Mechanismus in der Oberfläche: Aufgabe.** Das Inline-Feld heißt **„Nachfassen am“** und legt die Nachfass-Aufgabe der Anfrage an bzw. verschiebt sie (eine offene je Anfrage: die früheste offene PH Aufgabe mit `referenz_doctype = PH Anfrage`, `referenz_name`). Die Felder `wiedervorlage*` an Anfrage und Kontakt werden vom Backoffice **nicht** benutzt (bleiben leer, der Task findet nichts). Freitext `naechster_schritt` heißt **„Vereinbart“**. Die System-Empfehlung heißt **„Empfohlen“** und steckt nur im Primärknopf. | Eine Liste, in der alles Offene steht (Zentrale, Heute-Zeile, Glocke über `aufgaben_erinnerungen`); keine doppelten Erinnerungen. |
| E3 | Bereichsstart überladen (UX P3) | `/crm` = Heute-Zeile (4 Chips) · **„Zu erledigen“** (eine Arbeitsliste) · „Mein Tag“ · **4 Kennzahlen je Rolle** als Textzeile · **Verkaufsverlauf** (nur Leitung/GF). Keine Charts – sie stehen im Bericht „Übersicht“. | 02 § 2.1, jede Zahl einmal. |
| E4 | Kundenakte: 12 Tabs, Kopf 5 Zeilen (UX P4) | **6 Tabs** (Übersicht · Aktivität · Vorgänge · Projekte & Belege · Service · Mehr ▾), **Details-Panel** rechts (Stammdaten inline), Kopf **2 Zeilen**, **max. 1 Band**. | 03 § 8.10; am iPad quer lesbar. |
| E5 | Termin anlegen: 4 Schritte, zwei Ausführungswege (UX P6) | **Ein Bildschirm.** Aus Anfrage: `PH Anfrage.termin_vorschlagen(start, dauer_min, modus, terminart, berater, thema, mail)` (prüft den Slot atomar, Stand 04.11.). Ohne Anfrage: Server Action prüft den Slot unmittelbar vorher (`get_freie_slots` für genau diesen Slot), dann `insert PH Termin` + `bestaetigen(mail)`; atomare Methode als Anfrage B10. Mail-Haken verhält sich in beiden Fällen gleich. | Häufigster Fall „Kunde am Telefon“ in 2 Interaktionen im Dialog. |
| E6 | Irreversible Termin-Übergänge (UX P7) | Kanban-Spalten „Erledigt“ und „Nicht erschienen“ sind **keine Drop-Ziele**. „Erledigt“ entsteht nur über **„Protokoll schreiben“** (legt Protokoll an) oder `⋯` „Ohne Protokoll abschließen“. Beides und „Nicht erschienen“ mit **verzögertem Commit 8 s** (Variante A, 04 § 3.6). Rückweg „Nicht erschienen → Bestätigt“ für Leitung (`wieder_bestaetigen`, vorhanden). | Kein Dialog nötig, Fehlbedienung innerhalb 8 s folgenlos, danach Leitung. |
| E7 | „Qualifizieren“ nach 5 s endgültig (UX P8) | Wort **„Annehmen“**, Undo **8 s**, verzögerter Commit mit **Warteschlange je Datensatz** (jede Folgeaktion ruft vorher `flush()`). Rückweg „Zurück auf Neu“ existiert für Leitung; Mitarbeiter sehen `⋯` „Leitung bitten“ (Aufgabe). Freigabe für Mitarbeiter ohne Folgedokument: Anfrage B1. | Kein Workflow-Fehler bei schneller Folgeaktion. |
| E8 | Verloren aus „Neu“ (Fach F5) | UI nutzt `als_verloren(grund, details, mitbewerber)` (erlaubt aus allen offenen Status, Grund Pflicht) statt des Workflow-Übergangs. „Spam“ bleibt nur für echten Spam. | Keine verfälschte Quote „angenommen“. |
| E9 | Zusammenführen (UX P17, Fach B4) | Methode `merge_kontakte(ziel, quelle, felder)` existiert und läuft serverseitig in einem Request. Angeboten **nur Leitung**, Dialog (irreversibel). **Gesperrt**, wenn beide Kontakte `ph_faktura_debitor_nr` haben (UI-Prüfung; serverseitig als Anfrage A7). | BAO § 131, keine stille Verschmelzung von Debitoren. |
| E10 | Marketing-Massenaktion (Fach V1, TKG § 174) | Filter **je Kanal**: E-Mail/SMS/WhatsApp nur mit **bestätigter `PH Einwilligung`** passenden Zwecks; Brief nur ohne `nicht_kontaktieren`. Bestandskunden-Ausnahme § 174 Abs 4 wird **nicht** genutzt (Inhaber-Entscheidung I5, Standard streng). | Rechtskonform ohne Nachweisproblem. |
| E11 | DSGVO-Auskunft unvollständig (Fach V2/V3) | Ablauf über **PH Datenschutzanfrage** (vorhanden, Frist 1 Monat automatisch). Auskunft-PDF = eigene Druckseite des Backoffice aus `export_kontakt_daten` **plus** Felder auf permlevel 1 (`notizen`, `notiz_intern` von Termin und Gespräch), `ip_hash`, Dateiliste und Metadaten-Block (Zwecke, Empfänger, Speicherdauer, Herkunft, Beschwerderecht). Schwärzen einzelner Passagen nur mit Begründung. Vollständige Serverlösung: Anfrage A1. | DSGVO Art. 15 Abs 1 lit a–h, Abs 3. |
| E12 | Löschkonzept fehlt (Fach V4) | Vorhanden: `get_loeschplan`, `anonymize_kontakt` (Bestätigungswort), Task `dsgvo_fristen`. Backoffice ergänzt: Einstellungen-Reiter **Datenschutz** mit Vorschlagslisten (Spam > 30 Tage, Interessenten ohne Vorgang > 36 Monate, Verloren > 24 Monate) und Massenaktion für Leitung. Automatische Löschläufe: Anfrage A2. | Art. 5 Abs 1 lit e, Art. 17, BAO § 132. |
| E13 | Beträge (Fach F3, K1–K5) | `kontakt360._zahlen` und Report `PH Vertriebscockpit` lesen `gesamt_cent` (gibt es in ph_faktura nicht) → **Backoffice nutzt diese Beträge nicht.** Zahlen kommen direkt aus ph_faktura: Auftragseingang = Σ `PH Auftragsbestaetigung.netto_cent` (Status ≠ Storniert), offene Posten = Σ `PH Rechnung.offen_cent` (brutto), **je `waehrung` getrennt**, keine Umrechnung. Label nennt immer netto/brutto. Korrektur in ph_crm: Anfrage A3. | Keine falschen Zahlen. |
| E14 | Kunde-Status (Fach F2) | ph_faktura ruft `als_kunde_markieren` (noch) nicht. Bis zum Hook (A4): Kennzahl „Neue Kunden“ mit Zusatz „manuell gepflegt“, „Als Kunde markieren“ im Status-Menü. `als_kunde_markieren` setzt bereits offene Anfragen „Angebot“ → Gewonnen (R7). | Ehrliche Anzeige. |
| E15 | Anfrage ohne E-Mail und Telefon (Fach F4) | `validate()` verlangt E-Mail oder Telefon. Das Warnband „Keine Kontaktmöglichkeit“ und die deaktivierte Annehmen-Variante entfallen. Kunde nur mit Postanschrift: Schnellanlage bietet „Nur Kontakt + Aufgabe anlegen“ (PH Kontakt verlangt keinen Kontaktweg). Erweiterung um Anschrift: Anfrage B2. | Kein unerreichbarer Zustand. |
| E16 | Termindauer per Ziehen (Fach F6) | **Gestrichen.** `umbuchen(neuer_start, berater)` kennt keine Dauer; Umbuchen-Dialog zeigt die Dauer lesend. Anfrage B7. | Keine Doppelbuchung. |
| E17 | Tastenkürzel (UX P11) | Global reserviert bleibt global; **Bereichsaktionen nur mit Shift+Buchstabe**; Tabs `Alt+1…9`; keine bereichseigenen `g`-Akkorde; Einzeltasten abschaltbar. | Ein Muster für alle 12 Bereiche. |
| E18 | Kundenansicht am iPad (UX P14) | Modus **„Kundenansicht“** im Protokoll: blendet alles Interne aus, hält fremde Toasts zurück. | Vertraulichkeit vor dem Kunden. |
| E19 | Planung kostenpflichtig, Vertragsort (Fach B2, B3) | Sheet „Wie geht es weiter?“ verlangt bei „Planung beauftragen“ die Wahl **kostenlos / Planungspauschale laut Angebot / nach Aufwand**; Abschlusskanal (Showroom · Beim Kunden · Fernabsatz) wird aus `ort` vorgeschlagen und an A2 als `vertragsort` übergeben. Felder am Gespräch: Anfrage B6; bis dahin Kommentar am Gespräch. | ABGB-Entgeltvereinbarung, FAGG-Weichen richtig gestellt. |
| E20 | Telefon < 640 px | CRM-Berater dürfen am Telefon anlegen und protokollieren (Ausnahme von 02 § 11.1, als Antrag an 02). | Berater unterwegs. |

---

## 1. Nutzer, Rollen, Top-Aufgaben

### 1.1 Rollen (an die DocType-JSONs angeglichen)

| Rolle | Wer | Arbeitsplatz | Darf im CRM |
|---|---|---|---|
| PH CRM Mitarbeiter | Berater, Empfang | Backoffice (Laptop Showroom, iPad) | lesen, anlegen, bearbeiten; Annehmen, Termin, Angebot-Übergabe, Gewonnen, Verloren, Spam; Termin bestätigen/absagen/umbuchen/erledigen; Datenschutzanfrage **erfassen**; kein Löschen, kein CSV, Sammeldruck ≤ 10 |
| PH CRM Leitung | Verkaufsleitung | Backoffice | zusätzlich: Rückwege (Zurück auf Neu, Wieder bestätigen), Ablehnen, Sperren/Deaktivieren/Reaktivieren, permlevel 1 (`notizen`, `notiz_intern`), Zusammenführen, Datenschutzanfragen bearbeiten, Auskunft, Anonymisieren, CSV, Einstellungen, Verfügbarkeit aller |
| PH Geschäftsführung | Inhaber | Backoffice, iPad | lesen inkl. permlevel 1; Berichte; **PH Aufgabe lesen/schreiben/anlegen/exportieren**; **PH Anfrage exportieren** (laut JSON); Auskunft/Löschplan |
| PH Faktura Mitarbeiter/Leitung | Faktura | Backoffice | Kundenakte lesen, Beträge sehen; **kein** permlevel 1 (Tab „Intern“ nicht sichtbar) |
| andere Bereiche (Projekte, Logistik, Service, Kassa, Montage) | – | – | Kundenakte: Kopf, Kontaktwege, Adressen, eigene Bezüge; Kontakt-Suche in Link-Feldern |
| PH Website Integration | API-Konto | – | nur `ph_crm.api.*` |

### 1.2 Top-Aufgaben und Klickzahlen (Regel 02: ab Zentrale, ohne Suche; Enter = Klick; Tippen zählt nicht)

| # | Aufgabe | Weg (ohne Suche) | Klicks | mit ⌘K |
|---|---|---|---|---|
| T1 | Neue Anfrage annehmen | Zentrale „Zu erledigen“ → [Annehmen] | 1 | – |
| T2 | Anfrage als Spam | „Zu erledigen“ → Zeile `⋯` → „Spam“ | 2 | – |
| T3 | Termin für Anfrage anlegen | „Zu erledigen“ → `⋯` → „Termin anlegen“ → Slot → [Termin anlegen] | 4 | 3 |
| T4 | Termin bestätigen | „Zu erledigen“ → [Bestätigen] (Mail mit Undo 10 s) | 1 | – |
| T5 | Termin umbuchen | CRM → Termine → Ereignis → [Verschieben] → Slot → [Verschieben] | 5 | 3 |
| T6 | Protokoll schreiben | „Mein Tag“ → [Protokoll schreiben] | 1 | – |
| T7 | Planung beauftragen | „Mein Tag“/Protokoll → [Gespräch abschließen] → Kachel „Planung beauftragen“ → Kosten wählen → [Beauftragen] | 4 | – |
| T8 | „Wie steht es?“ (Anruf) | CRM → Kunden & Kontakte → Zeile | 3 | 1 Tipp + 1 |
| T9 | Aufgabe erledigen | Zentrale „Zu erledigen“ → Haken | 1 | – |
| T10 | Nachfassen setzen | Anfragen-Zeile → Zelle „Nachfassen am“ → Datum | 2 | – |
| T11 | Zuweisen | Zeile → `a` → Person | 2 | – |
| T12 | Verfügbarkeit ändern (Leitung) | CRM → Einstellungen (Reiter Verfügbarkeit zuerst) → Zelle → [Speichern] | 4 | 3 |
| T13 | Widerspruch erfassen | Kundenakte → `⋯` → „Widerspruch erfassen“ → Quelle → [Erfassen] | 5 (ab Akte 4) | 4 |
| T14 | Datenschutzanfrage erfassen | Kundenakte → `⋯` → „Datenschutzanfrage“ → Art → [Erfassen] | 5 (ab Akte 4) | 4 |
| T15 | Wochenauswertung (GF) | CRM → Berichte → „Übersicht“ | 2 | 1 |
| T16 | Telefon-Anfrage erfassen | Kopfzeile [+ Anruf] → Felder → [Anlegen] | 2 | 2 |
| T17 | Doppelten Kontakt zusammenführen (Leitung) | Kundenakte Chip „1 ähnlicher“ → [Zusammenführen] → Felder → [Zusammenführen] | ab Akte 3 | – |

E2E (`tests/e2e/crm.spec.js`) zählt genau diese Wege; Abweichung = rot. T1, T4, T6, T9 setzen voraus, dass die Zentrale die Zeilen von `zuErledigen(session)` aus CRM übernimmt (Abhängigkeit § 17.7).

---

## 2. Gemeinsame Regeln aller CRM-Seiten

### 2.1 Begriffe (Oberfläche → gespeichert)

| Oberfläche | Gespeichert / intern | Nie zeigen |
|---|---|---|
| Annehmen | Workflow „Qualifizieren“ → `Qualifiziert` | Qualifizieren, Lead |
| Angenommen | `Qualifiziert` | – |
| Neue Anfragen | Filter `status = Neu` | Posteingang |
| Protokoll schreiben | `erledigt_mit_protokoll(protokoll=1)` | Erledigt + Protokoll |
| Gesprächsprotokoll | PH Beratungsgespraech | Beratungsgespraech |
| Verkaufsverlauf | Trichter-Zahlen | Trichter, Funnel, Pipeline |
| Vorschau | Side-Peek (`SidePeek`) | Peek |
| Showroom | Modus/Ort `Showroom`, Terminart `studio` | Studio |
| Kunden & Kontakte | PH Kontakt | Kontakt-DocType |
| Vereinbart | `naechster_schritt` | Nächster Schritt |
| Nachfassen am | Fälligkeit der Nachfass-Aufgabe | Wiedervorlage |
| Empfohlen | System-Primäraktion | – |
| Termin entfallen | abgeleitet (E1) | – |
| Verfallen | Termin `Abgelehnt` + `storno_grund = "E-Mail nicht bestätigt"` | Abgelehnt (für diesen Fall) |
| Datenschutzanfrage | PH Datenschutzanfrage | DSGVO-Ticket |
| Berichte | Reports | Vertriebscockpit (nur als Berichtstitel) |

Statuswerte mit Umlaut über `anzeige()` (`labels.js`): „Unbestätigt“, „Bestätigt“. Texte zentral in `lib/backoffice/crm/texte.js`. Du-Form intern.

### 2.2 Statustöne (`lib/backoffice/crm/status.js`, Token aus 03 § 1.5; `accent` nie für Status)

| Objekt | Status → Ton |
|---|---|
| Anfrage | Neu `blau` · Angenommen `tuerkis` · Termin vereinbart `tuerkis` + Icon `calendar-check` 12 px · Termin entfallen (Kennzeichen) `orange` Text · Angebot `orange` · Gewonnen `gruen` · Verloren `grau` · Spam `rot` |
| Termin | Unbestätigt `orange` + gestrichelter Rand · Bestätigt `tuerkis` (Abweichung von 03 beantragt: Bestätigt = Fortschritt, Erledigt = Abschluss) · Erledigt `gruen` · Nicht erschienen `grau` · Storniert `rot` · Abgelehnt `rot` · Verfallen `grau` |
| Kontakt | Interessent `blau` · Kunde `gruen` · Inaktiv `grau` · Gesperrt `rot` |
| Gespräch | Offen `blau` · Planung beauftragt `tuerkis` · Angebot `orange` (nur Bestandsdaten; neu nicht mehr gesetzt) · Abgeschlossen `gruen` |
| Aufgabe | Offen `blau` · In Arbeit `orange` · Erledigt `gruen` · Verworfen `grau` durchgestrichen |
| Datenschutzanfrage | Offen `blau` · In Arbeit `orange` · Erledigt `gruen` · Abgelehnt `grau`; Frist ≤ 7 Tage Text `warning-text`, überschritten `danger-text` |

`StatusBadge` zeigt immer Punkt + Text. Badge-Wechsel 160 ms Farbe `--bo-ease-out`; `prefers-reduced-motion` → sofort.

### 2.3 Vorgangsleiste (ersetzt die Phasenleisten je Objekt)

Anfrage-, Termin- und Gesprächsakte zeigen unter dem Kopf dieselbe Leiste (02 § 3.1):

```
Anfrage 01.11. ─ Termin Di 04.11. 14:00 ─ Gespräch 04.11. ─ Angebot AN-2026-… ─ Auftrag AB-2026-…
   erledigt          bestätigt                offen            (noch keins)       (noch keiner)
```

- Stationen aus `vorgang.js` (Anfrage → `PH Termin.anfrage` → `PH Beratungsgespraech.termin` → `PH Angebot.anfrage` (alle Versionen, Anzeige nur letzte, Status ≠ Ersetzt) → `PH Auftragsbestaetigung` über Angebot/Kontakt). Jede vorhandene Station ist ein Link; fehlende grau mit „(noch keins)“.
- Aktuelle Station: Sand-Strich 2 px unter dem Text; Wechsel 240 ms `--bo-ease-out`.
- Mehrere Termine: letzte aktive Station, Zusatz „+1 früherer“ als Tooltip-Liste.

### 2.4 Undo- und Rückfrage-Matrix

| Aktion | Verhalten | Server |
|---|---|---|
| Annehmen | Toast 8 s, verzögerter Commit, Warteschlange | `workflowAction Qualifizieren` |
| Spam (einzeln/Masse) | 8 s, verzögert | `runDocMethod als_spam` |
| Zuweisen, Priorität, Nachfassen am | sofort, Toast 8 s mit Gegenaktion | `setValue` / Aufgabe `setValue faellig` |
| Verloren | Dialog sm (Pflichtgrund), danach Toast 8 s, verzögert | `als_verloren` |
| Termin bestätigen | Split-Knopf „Bestätigen ▾ · Ohne Mail bestätigen“; mit Mail: Toast **10 s** „Bestätigungsmail an f***@… wird gesendet · Rückgängig (Z)“, verzögert | `bestaetigen(mail)` |
| Termin verschieben | Toast 10 s (wenn Mail), sonst 8 s; verzögert | `umbuchen` |
| Termin absagen | Dialog (Grund Pflicht, ☐ Kunde informieren) | `absagen` |
| Nicht erschienen, Ohne Protokoll abschließen | Toast 8 s, verzögert; danach nur Leitung zurück (Nicht erschienen) | `nicht_erschienen` / `erledigt_mit_protokoll(0)` |
| Protokoll schreiben | sofort (legt Protokoll an, navigiert) | `erledigt_mit_protokoll(1)` |
| Gespräch abschließen „Nur abschließen“ | 8 s, verzögert | `status_setzen Abgeschlossen` |
| Planung beauftragen | im Sheet „Wie geht es weiter?“ mit Folgen-Satz, keine zweite Rückfrage | `planung_beauftragen(planer)` |
| Raum-Zeile löschen | Zeile klappt 160 ms zu, Toast 8 s, Wiederherstellen aus Speicher | Autosave |
| Kontakt zuordnen/anlegen aus Anfrage | Toast 8 s; Undo setzt `kontakt` leer; neu angelegter Kontakt → Aufgabe „Kontakt PH-KON-… prüfen/löschen“ an Leitung | `kontakt_anlegen` / `setValue kontakt` |
| Widerspruch erfassen | Dialog (außenwirksam, Quelle Pflicht); Aufheben nur Leitung über `⋯` mit Pflicht-Notiz (bis Methode A8: `setValue nicht_kontaktieren 0` + Kommentar) | `widerspruch_erfassen` |
| Portal-Zugang sperren | Dialog | `portal_sperren` |
| Verfügbarkeit löschen, Terminart „Website aus“ | Toast 8 s mit Gegenaktion | `delete`→`insert` / `setValue` |
| Einstellungen speichern | Dialog md mit Liste „Feld: alt → neu“ („gilt sofort für die Website-Buchung“), danach Toast mit Rückgängig | `save` |
| Zusammenführen, Anonymisieren | Dialog (irreversibel); Anonymisieren mit Tippfeld „ANONYMISIEREN“ (Server verlangt das Wort) | `merge_kontakte` / `anonymize_kontakt` |

Verzögerter Commit über Fundament F2 (`useVerzoegerterCommit`, Route `/api/undo-commit`, `pagehide` → `sendBeacon`): Tab schließen im Fenster **führt aus**. Undo-Toast pausiert bei Hover/Fokus, `F8` fokussiert ihn. Läuft eine Mail nach Ablauf auf Fehler: Glocke „Bestätigungsmail an Hr. Keller nicht gesendet – [Erneut senden]“ + roter Eintrag in der Zeitleiste.

### 2.5 Tastenkürzel (Registry `lib/backoffice/crm/kuerzel.js`, Fundament F3)

| Kürzel | Wirkung | Ort |
|---|---|---|
| global (02 § 9): `n` neu · `/` Suche · `?` Hilfe · `x` auswählen · `a` zuweisen · `s` Status · `j k ↑↓` · `e` bearbeiten · `z` rückgängig · `m` verschieben/Menü (Kanban) · Enter öffnen · Leertaste Vorschau · Esc · `⌘K ⌘Enter ⌘S ⌘P ⌘Z` | unverändert | überall |
| `⌘/Strg+Enter` | Primäraktion der Seite bzw. der fokussierten Zeile | Akten, Listen |
| `Shift+Q` | Annehmen | Anfragen |
| `Shift+T` | Termin anlegen | Anfrage, Kundenakte, Liste |
| `Shift+A` | Aufgabe anlegen | überall im CRM |
| `Shift+B` | Bestätigen | Termin |
| `Shift+U` | Umbuchen | Termin |
| `Shift+X` | Absagen (Dialog) | Termin |
| `Shift+K` | Kundenakte öffnen | Anfrage, Termin, Gespräch |
| `Shift+M` | E-Mail schreiben (bei `kommunikation_bevorzugt = Brief`: Brief-Druck) | Kundenakte, Akten |
| `Shift+E` | CSV (nur mit Recht) | Listen |
| `Shift+D` | Details-Panel ein/aus | Kundenakte < 1280 px |
| `Shift+R` | Raum-Chipleiste fokussieren | Protokoll |
| `Shift+Entf` | Raumkarte entfernen (Fokus auf Karte, nicht im Feld) | Protokoll |
| `Alt+1…9` | Tabs | alle Akten |
| `←/→` | Seite blättern (Tabellenfokus) / Zeitraum (Kalender) | Listen, Kalender |
| `d` / `w` / `t` | Tag / Woche / heute | Kalender |
| `F6` | Fokus Tabelle ↔ Vorschau | Listen |

Gestrichen: `Alt+←/→`, `c`, `p`, `k`, `g a/g t/g p`, Ziffern für Zeitraum, `⇧⏎`, `⌘Backspace`, `+`, `r`, `v`, `.`. Jeder Knopf zeigt sein Kürzel im Tooltip; `?` zeigt die Kürzel der Seite; Benutzer-Menü „Einzeltasten-Kürzel aus“ (WCAG 2.1.4). Keine Funktion nur per Kürzel.

### 2.6 Seitenregeln

- `requireSession()` → `requireDocRecht(meta, "read")`; Titel `<Objekt> · CRM · Platzhirsch Backoffice`; `export const dynamic = "force-dynamic"`.
- Skeleton nach 300 ms mit echten Spaltenbreiten; Filterwechsel per `useTransition`, alte Tabelle nach 300 ms auf 0.6 Deckkraft.
- Fehler als `Fehler`-Komponente mit Code + „Erneut laden“, nie 500; `forbidden` → `/kein-zugriff`.
- Seitenwechsel `<ViewTransition>` `bo-seite` (160 ms Querblende).
- **Erstbesuch-Band** je Seite (≤ 2 Sätze, [Verstanden], merkt sich per Benutzer in localStorage, try/catch). Beispiel Anfragen: „Neue Anfragen von Website und KI-Assistent landen hier, die älteste steht oben. ‚Annehmen‘ heißt: du kümmerst dich darum.“
- **Hilfe-Artikel** `backoffice/hilfe/crm/{start,anfragen,kontakte,kundenakte,termine,gespraeche,berichte,einstellungen,datenschutz}.md` (Liefergegenstand), erreichbar über Benutzer-Menü und `?` – kein eigener Hilfeknopf je Seite.

### 2.7 Speicheranzeige (Autosave, gilt für Protokoll, Akten-Inline-Felder, Details-Panel)

| Zustand | Text | Ton | Ansage |
|---|---|---|---|
| speichert (ab 300 ms) | „Speichert …“ | `ink-soft` | – |
| gespeichert | „Gespeichert 10:42“ | `ink-soft` | `role="status"` bei Wechsel |
| offline | „Offline – auf diesem Gerät gesichert (3 Änderungen)“ | `warning-text` | `role="status"` |
| Fehler | „Nicht gespeichert – [Erneut]“, automatische Wiederholung nach 2/4/8 s | `danger-text` | `role="alert"` erst nach 3. Fehlversuch |
| Sitzung abgelaufen | „Sitzung abgelaufen – [Anmelden]“ (Overlay 02 § 7.2), Eingaben bleiben | – | `role="alert"` |
| Konflikt | Feldweise: Zelle gelb, „Übernehmen / Meinen Wert behalten“ | – | – |
| ungültig | Feldfehler unter dem Feld, Fokus aufs Feld | `danger-text` | – |

Verlassen bei „Nicht gespeichert“/„Offline“ → Dialog „3 Änderungen sind noch nicht gespeichert“ [Weiter bearbeiten] [Trotzdem verlassen – bleibt auf dem Gerät]. Offline-Entwurf in IndexedDB (try/catch; voller Speicher → Zustand Fehler mit Text „Gerätespeicher voll“).

### 2.8 Bewegung (alle Werte aus 04)

| Element | Animation |
|---|---|
| Erledigte Zeile in „Zu erledigen“/Listen | `grid-template-rows 1fr → 0fr` 160 ms `--bo-ease-in`, Nachbarn rücken nach |
| Neue Zeitleisten-/Listenzeile | `0fr → 1fr` 160 ms `--bo-ease-out`, Hintergrund `sand-soft` blendet über 1200 ms aus |
| Neuer Termin im Kalender | `sand-soft`-Hervorhebung 1200 ms ausblenden, keine Skalierung |
| Dialog/Sheet | Eintritt 240 ms `--bo-ease-out`, Austritt 120 ms `--bo-ease-in`; Bottom-Sheet < 640 px 240 ms von unten |
| Vorschau (Side-Peek 480 px) | 200 ms `--bo-ease-out` von rechts (16 px + Deckkraft) |
| Auswahlleiste | 8 px + Deckkraft, 160 ms `--bo-ease-out` |
| Triage-Karte | 160 ms, Versatz ≤ 16 px + Deckkraft |
| Kanban-Rücksprung | 200 ms `--bo-ease-out`; Drop-Einrasten Spring (einzige Ausnahme) |
| Chart-Balken (nur Berichte, erstes Erscheinen nach Skeleton) | 240 ms `--bo-ease-out`, Stagger 20 ms, ab 13 Balken gleichzeitig |
| Kennzahl nach eigener Aktion | Zählanimation 400 ms, `aria-live="off"`, Endwert im Text; beim Laden nie |
| Tab-Unterstrich, Abschnittsleiste | 160 ms `--bo-ease-out` |
| Langdruck „Kundenansicht beenden“ | Fortschrittsring 600 ms linear |

`prefers-reduced-motion`: Transform/Opacity entfallen, Farbübergänge bleiben.

---

## 3. Seiten des Bereichs

Unternavigation (`bereiche.js`, `crm.navigation`, ≤ 7 Einträge):

```
Übersicht (/crm) · Anfragen (/crm/anfragen) · Kunden & Kontakte (/crm/kontakte) · Termine (/crm/termine) ·
Gespräche (/crm/gespraeche) · Mehr ▾ (Aufgaben → /aufgaben?bereich=crm · Berichte /crm/berichte · Datenschutz /crm/datenschutz · Einstellungen /crm/einstellungen)
```

Kanonische Routen (`ROUTEN`): PH Anfrage → `/crm/anfragen/[name]` · PH Kontakt → `/kunden/[name]` · PH Termin → `/crm/termine/[name]` · PH Beratungsgespraech → `/crm/gespraeche/[name]` · PH Datenschutzanfrage → `/crm/datenschutz/[name]` · PH Aufgabe → `/aufgaben/[name]` (Zentrale) · PH Terminart/PH Verfuegbarkeit/PH Termin Einstellungen → `/crm/einstellungen?tab=…`. `/d/ph-anfrage/<name>`, `/crm/verfuegbarkeit` → 307.

**Seitenleisten-Badge „CRM“** = eine Definition für Badge, Heute-Chip und Ansicht „Neue Anfragen“: Anfragen `Neu` mit `zugewiesen_an` = ich oder leer **plus** Termine `Unbestaetigt` mit `email_verifiziert = 1` mit `berater` = ich oder leer. Leitung: Tooltip „Team: 7“. Zwei `count`, Cache 60 s.

### 3.1 `/crm` – Übersicht (T1)

```
┌ Zentrale › CRM                                                         [+ Anruf]  [Neue Anfrage] ┐
│ Heute  3 Termine · 2 zu bestätigen · 4 neue Anfragen · 1 Aufgabe überfällig                      │  13 px ink-soft, Chips = Filterlinks
├───────────────────────────────────────────────────────────────┬──────────────────────────────────┤
│ ZU ERLEDIGEN                                            12    │ MEIN TAG               Di 4. Nov │
│ Neue Anfrage   Küche Lochau · Fam. Muster   31 h · überfällig [Annehmen] ⋯ │ 09:00 Showroom · Huber     │
│ Bestätigen     Di 10:30 Video · Hr. Keller                    [Bestätigen] ⋯│   [Protokoll schreiben]    │
│ Protokoll      gestern 16:00 · Fam. Berger                    [Schreiben]  ⋯│ 10:30 Video · Keller       │
│ Nachfassen     Fr. Schmid · Angebot nachfassen · heute        [Erledigt]   ⋯│   [Raum öffnen ab 10:15]   │
│ Termin entfallen  Fam. Huber · storniert 03.11.               [Neuer Termin]⋯│ 14:00 Vor Ort · Lindau     │
│ [Der Reihe nach durchgehen]                       Alle 12 →   │   [Route (nur Ort bekannt)]│
├───────────────────────────────────────────────────────────────┴──────────────────────────────────┤
│ Offene Anfragen 23  ·  Termine 7 Tage 14  ·  Offene Aufgaben 5  ·  Reaktion (Median, 30 T.) –     │  4 Zahlen, 20/500 tabular
│ Verkaufsverlauf (30 Tage)  Anfragen 48 → Termine 21 → Gespräche 17 → Angebote 12 → Aufträge 6     │  nur Leitung/GF; Zeitraum-Segment rechts
└───────────────────────────────────────────────────────────────────────────────────────────────────┘
```
(Zahlen sind Beispielwerte.)

- **Heute-Zeile** (4 Chips, 05 § 7.4): Termine heute · zu bestätigen · neue Anfragen (Badge-Definition § 3) · Aufgaben überfällig. Alle 0 → „Heute nichts Dringendes.“
- **Zu erledigen** (`lib/backoffice/crm/zuErledigen.js`, dieselbe Funktion liefert der Zentrale die CRM-Zeilen): Reihenfolge nach Dringlichkeit: (1) neue Anfragen, älteste zuerst · (2) Termine zu bestätigen (`Unbestaetigt`, `email_verifiziert = 1`) · (3) Termine ohne Protokoll (`Bestaetigt`, `ende < jetzt`) · (4) Termin entfallen (E1) · (5) fällige Aufgaben/Nachfassen (`faellig <= heute`, mir) · (6) Datenschutzanfragen mit Frist ≤ 7 Tage (nur Leitung). Max. 8 Zeilen + „Alle 12 →“ (öffnet gefilterte Liste je Typ). Jede Zeile: Typ als Text 12 px `ink-soft` · Titel · Alter/Fälligkeit **mit Wort** („31 h · überfällig“) · genau ein Ghost-Knopf mit Text (Gewicht ändert sich nie) · `⋯` (Zuweisen, Termin anlegen, Spam, Verloren, Öffnen). Erledigte Zeile klappt zu (§ 2.8). Leer: „Alles erledigt.“ (Häkchen 32 px Sand).
- **„Der Reihe nach durchgehen“** startet die Schnell-Triage (§ 5.7), sichtbar, sobald ≥ 2 neue Anfragen.
- **Mein Tag**: PH Termin `berater = ich`, heute, Status Bestätigt/Unbestätigt, nach `start`; Zeilenknopf kontextabhängig: „Protokoll schreiben“ (ab `start`), „Raum öffnen“ (Video, ab `meet_link_ab_min`), „Bestätigen“ (Unbestätigt), „Route“ (Vor Ort; Text „Route (nur Ort bekannt)“ ohne Straße). GF/Leitung: Umschalter „Mein Tag | Team heute“ (Spalten je Berater). Leer: „Heute keine Termine. Nächster: Do 10:00 Fam. Berger“ (Link) bzw. „Keine Termine geplant.“
- **Kennzahlen** (Textzeile, je Zahl Link): Mitarbeiter: Offene Anfragen (mir) · Termine 7 Tage (mir) · Offene Aufgaben (mir) · Reaktion Median eigener Anfragen. Leitung/GF: Offene Anfragen · Reaktion Median · No-Show-Quote 90 Tage · Neue Kunden Monat („manuell gepflegt“ bis A4). Ohne Daten „–“ mit Tooltip „Noch keine Werte“. Quellen § 6.1.
- **Verkaufsverlauf** (Leitung/GF): fünf Zahlen mit Quote als Tooltip („44 % der Anfragen bekamen einen Termin“), Klick je Stufe → gefilterte Liste. Zeitraum-Segment 7 Tage · 30 Tage · Quartal (URL `?zeitraum=30d`, gemerkt per localStorage). Berechnung § 6.2.
- **Fehler:** jeder Block eigener `<Suspense>`; Block zeigt „Nicht geladen · Erneut“ (Code), Rest bleibt.
- **Laden:** Heute-Zeile → Zu erledigen/Mein Tag → Kennzahlen → Verkaufsverlauf; ≤ 12 Aufrufe in 2 Wellen.
- **Telefon < 640:** nur Heute-Zeile, Zu erledigen und Mein Tag als Karten. Leer beides: „Heute keine Termine, keine neuen Anfragen.“ [Anfrage erfassen].

### 3.2 `/crm/anfragen` – Liste und Kanban (`?ansicht=liste|kanban`, Standard Liste)

```
┌ Zentrale › CRM › Anfragen                                                   [Neue Anfrage] ┐
│ Anfragen                                                            [Liste | Kanban]       │
│ [Neue Anfragen 4] [Meine 7] [Alle offen 23] [Nachfassen fällig 2] [Gewonnen] [+ Ansicht]   │
│ [Der Reihe nach durchgehen]                                                                 │
├ Suche (Name, E-Mail, Telefon, Nr.)  [Neu ×]  Art ▾  Quelle ▾  Zuständig ▾  Eingang ▭–▭  [+ Filter] [Zurücksetzen] │
│ ☐ │ Eingang         │ Anfrage                       │ Kontakt   │ Art      │ Zuständig │ Nachfassen am │ Status       │ Aktion      │ ⋯ │
│ ☐ │ 31 h · überfäll.│ Küche Lochau · Familie Muster │ [Mail][Tel]│ Beratung │ –         │ –             │ ● Neu        │ [Annehmen]  │ ⋯ │
│ ☐ │ 6 h             │ Produkt (3) · Fr. Schmid      │ [Mail][Tel]│ Produkt  │ L. Berger │ heute · fällig│ ● Angenommen │ [Termin]    │ ⋯ │
│ ☐ │ 02.11.          │ Termin · Hr. Keller           │ [Mail][ – ]│ Termin   │ A. Berger │ –             │ ● Termin entf.│ [Neuer Termin]│ ⋯ │
├ 1–25 von 23 · [25|50|100]                                                                  ┤
└ 3 ausgewählt · [Zuweisen] [Status ▾] [Nachfassen am] [Spam] [Drucken] [⋯ CSV]          Esc ┘
```

- **Spalten** (einzeilig, 36/44 px): Eingang (relativ < 7 Tage, sonst Datum; bei `Neu` Punkt **und Wort**: „· überfällig“ > `anfragen_erinnerung_stunden` (Standard 24 h), „· wartet“ > 4 h) · Anfrage (`titel` ohne „Art:“-Präfix) · **Kontakt** (Icon-Knöpfe `mail`/`phone`, Sicht 28, Trefffläche 44, `aria-label` „E-Mail an Familie Muster“, deaktiviert mit Tooltip, wenn leer) · Art · Zuständig (Avatar 24 + Name) · Nachfassen am (Datum + Wort „fällig“/„überfällig“, Text `ink-soft`, Punkt Sand) · Status (abgeleitet, E1) · **Aktion** (immer sichtbar, Ghost-Knopf mit Text: Neu „Annehmen“ · Angenommen „Termin“ · Termin entfallen „Neuer Termin“ · Termin vereinbart „Öffnen“ · Angebot „Angebot öffnen“) · `⋯`. Optional: Quelle, Priorität, PLZ/Ort, Uploads (`paperclip` + Anzahl), Sprache, Projektart, Objektart, Nr., Erste Reaktion, Erwarteter Wert (nur Leitung).
- **iPad/≤ 1279 px:** Eingang · Anfrage · Status · Aktion; Rest in der Vorschau. **< 768 px:** Kartenliste (`DataTable`).
- **Sortierung:** „Neue Anfragen“ `eingang asc`; sonst `eingang desc`; Spalte „Nachfassen am“ sortierbar (aus Aufgabe, serverseitig zusammengeführt in `daten.js`).
- **Ansichten:** System: Neue Anfragen · Meine (offen) · Alle offen · Nachfassen fällig · Gewonnen · Verloren & Spam (Leitung). Eigene privat in localStorage, geteilt über ph_core `PH Ansicht`, sobald vorhanden.
- **Filter:** Volltext (`nachname`, `vorname`, `email`, `telefon`, `firma`, `name`), Status-Chips, Art, Quelle, Zuständig, Eingang von/bis, `+ Filter` (Priorität, Sprache, Ort der Beratung, Upload-Status, Projektart, Objektart, Verlustgrund, Duplikat). Alles in der URL.
- **Zeilenmenü `⋯`** (auch Rechtsklick, Shift+F10, Wischen links am iPad): Annehmen · Zuweisen · Termin anlegen · Aufgabe · Kunde zuordnen · Verloren … · Spam · In neuem Tab · Drucken.
- **Vorschau** (Leertaste oder Knopf `panel-right`): Sheet 480 px, `role="complementary"`, `aria-label` „Vorschau Anfrage Küche Lochau“, `F6` wechselt Fokus, `j/k` blättert. Inhalt: Kopf, Vorgangsleiste, Anliegen, Produkte, Uploads, Primärknopf. Zustände: Skeleton nach 300 ms · Fehlerblock mit Code + „Erneut“ · „Gibt es nicht mehr“ + Zeile ausgrauen.
- **Massenaktionen (≤ 6):** Zuweisen · Status (nur erlaubte Übergänge je Zeile, Vorschau „3 von 5 möglich“; 0 möglich → „Für keine der 5 Anfragen möglich: alle schon angenommen.“, Knopf deaktiviert) · Nachfassen am · Spam (8 s) · Drucken (Sammel-PDF; > 10 nur Leitung, jeder Sammeldruck als Kommentar protokolliert) · CSV (Leitung/GF, Dialog „Export enthält personenbezogene Daten“, protokolliert). Ausführung ≤ 100, nacheinander mit Fortschritt; Teilfehler: „4 erledigt, 1 nicht möglich (PH-ANF-…: Grund)“ als Liste.
- **Kanban** (Board `PH Anfragen`): Spalten Neu · Angenommen · Termin vereinbart · Angebot · Gewonnen. Unter dem Board **Ablagezone** 56 px „Verloren · Spam“ (erscheint 160 ms beim Ziehen). Drop-Regeln: → Angenommen = Annehmen (8 s) · → Termin vereinbart = öffnet A1 vorbefüllt; Abbrechen = Rücksprung, kein Statuswechsel · → Angebot = Sheet „Angebot anlegen“ (Übergabe an Faktura A2) · → Gewonnen = Dialog „Ohne Auftrag als gewonnen markieren?“ nur ohne verknüpfte AB, sonst direkt `als_gewonnen` · Verloren = Verloren-Dialog · Spam = 8 s. Nicht erlaubtes Ziel: Rücksprung 200 ms + Toast mit Grund (`role="status"`). Karte: Nr. mono + Alter · Titel · Art als Text · Avatar · „ruht seit 12 Tagen“ ab Schwelle (`ruhe_*_tage` aus PH Termin Einstellungen). Tastatur 03 § 8.8 (Karte fokussieren, `←/→` nächste erlaubte Spalte, `m` „Verschieben nach …“, Enter öffnen). Touch: Verschieben nur über `⋯`. Leere Spalte: „Keine Einträge“ (gestrichelt). Hinweis Spalte Neu > 10: „Viele neue Anfragen – der Reihe nach durchgehen?“.
- **Leer:** ganz leer „Noch keine Anfragen. Anfragen kommen von der Website oder werden hier angelegt.“ [Neue Anfrage] · gefiltert „Keine Anfragen für diese Filter.“ [Filter zurücksetzen] · Neue Anfragen leer „Keine neuen Anfragen.“ (Häkchen).

### 3.3 Schnellanlage: Neue Anfrage und Telefonnotiz

**Neue Anfrage** (Dialog md 560 aus Liste, Palette `> anfrage`, Kopfzeile; volle Seite `/crm/anfragen/neu` nur bei Direktaufruf):

| Feld | Regel |
|---|---|
| Art | Segment Kontakt · Beratung · Produkt · Termin · Sonstige; Rest (Gutschein, Reservierung, Ezarri, Empfehlung) im Select |
| Quelle | Standard `telefon`; `showroom`, wenn Arbeitsplatz-Standort Showroom |
| Anrede (optional, leerer Wert sichtbar „keine Angabe“), Vorname, Nachname* | – |
| E-Mail oder Telefon* | mind. eines (wie `validate()`); E-Mail-Format live |
| Anliegen* | Textarea, wächst mit |
| Kunde | Link-Suche; beim Verlassen von E-Mail/Telefon `find_duplicates(email, telefon, nachname, plz)` → Hinweis unter dem Feld „Bestehender Kontakt: Familie Muster, Lochau – [Zuordnen]“; Prüfung nicht möglich → `muted` „Prüfung auf bestehende Kontakte nicht möglich“, Anlegen bleibt erlaubt |
| Datenschutzhinweis* (nur Quelle ≠ website) | Segment „mündlich erteilt · Aushang Showroom · per Mail nachsenden“; „per Mail nachsenden“ legt Aufgabe „Datenschutzhinweis senden“ an; gespeichert als Kommentar (Feld: Anfrage B11). Art = Empfehlung → zusätzlich Aufgabe „Informationspflicht Art. 14 (binnen 1 Monat)“ |
| Weitere Angaben (eingeklappt) | PLZ/Ort, Land, Sprache, Projektart, Objektart, Ort der Beratung, Wunschzeiten, Budget-Hinweis (intern), Priorität, Zuständig (Standard ich) |

Knöpfe **Anlegen** / **Anlegen und öffnen** (`⌘Enter`). Toast „Anfrage von Familie Muster angelegt · Öffnen“ (Nummer im Tooltip). Entwurf alle 5 s in sessionStorage (try/catch). Kunde ohne E-Mail und Telefon: Hinweis „Ohne E-Mail oder Telefon kann keine Anfrage gespeichert werden.“ + Knopf [Nur Kunde und Aufgabe anlegen] (`create_kontakt` + PH Aufgabe „Rückmeldung per Brief“).

**Telefonnotiz** (Kopfzeile [+ Anruf], Palette `> anruf`): ein Dialog: Nummer oder Name (Suche live über `globalSearch` + `find_duplicates(telefon)`) → Treffer = Kontakt; sonst neue Anfrage `quelle = telefon` · Anliegen · Ergebnis (Segment): Rückruf-Aufgabe · Termin (öffnet A1) · Reklamation (öffnet Service „Servicefall anlegen“ mit Kontakt) · Rücktritt (öffnet „Rücktritt erfassen“, § 5.9) · erledigt (Kommentar am Kontakt). Leer Suche: „Kein Kontakt gefunden.“ [Neu: ‚Keller‘].

### 3.4 `/crm/anfragen/[name]` – Anfrage-Akte (T5)

```
┌ Zentrale › CRM › Anfragen › Küche Lochau · Familie Muster                                   ┐
│ Küche Lochau · Familie Muster   ● Neu · seit 31 h · Website / KI-Assistent   [Annehmen] [⋯] │
│ Anfrage 03.11. ─ Termin (noch keiner) ─ Gespräch ─ Angebot ─ Auftrag                         │  Vorgangsleiste
│ (max. 1 Band, z. B.: „Kunde hat ein Upload-Ticket – Dateien noch nicht eingegangen“)         │
├ Übersicht | Anliegen & Uploads 3 | Produkte 0 | Person | Herkunft | Aktivität ─┬ DETAILS ─────┤
│ ANLIEGEN (4 Zeilen, „mehr“)                                                    │ Zuständig [–▾]│
│ „Wir planen eine Küche für unser Haus in Lochau …“                             │ Priorität Normal│
│ Es geht um: Küche · Einfamilienhaus · 6911 Lochau · Wunsch: abends/Samstag     │ Nachfassen am –│
│ BEZÜGE                                                                          │ Vereinbart [  ]│
│ Kunde     – [Zuordnen]   (erster Vorschlag: Familie Muster, gleiche E-Mail)    │ Ort Beratung  │
│ Termine   – [Termin anlegen]                                                    │ Erwart. Wert  │
│ Angebote  –          Aufgaben 1 offen [+ Aufgabe]                               │ Abschluss ca. │
└─────────────────────────────────────────────────────────────────────────────────┴───────────────┘
```

- **Kopf:** Titel, Status-Badge (abgeleitet), Alter seit `eingang`, Quelle/Kanal. Primärknopf (Empfohlen) nach Zustand: Neu → Annehmen · Angenommen → Termin anlegen · Termin entfallen → Neuen Termin anlegen · Termin vereinbart → Termin öffnen · Angebot → Angebot öffnen · Endzustand → keiner. `⋯`: Zuweisen · Aufgabe · Angebot anlegen (A2) · Verloren … · Spam · Drucken · E-Mail schreiben · Zurück auf Neu (Leitung) / Leitung bitten (Mitarbeiter) · In Frappe öffnen (Admin).
- **Bänder (max. 1, Vorrang):** Status passt nicht (E1) › Mögliches Duplikat (`duplikat_von` gesetzt: „Ähnliche Anfrage PH-ANF-… vom 01.11. – [Öffnen]“) › Upload offen.
- **Tabs** (Zähler 0 bleibt grau sichtbar): Übersicht · Anliegen & Uploads (`anliegen` voll, Dateien `File attached_to`, Vorschau 64 px, `upload_note`; Datei nicht ladbar → „Datei nicht verfügbar“) · Produkte (Kind `produkte`: Slug → Website-Link, Marke, Menge, Hinweis; [In Angebot übernehmen] → A2 vorbefüllt als Freitextpositionen bis Link `produkt` existiert (Anfrage B12); 0 → „Keine Produkte aus der Merkliste.“) · Person · Herkunft (quelle, kanal, referenz_website, herkunft_block mono, UTM, einwilligung_text_version/-zeitpunkt; `ip_hash` nur Admin) · Aktivität (Versionen, Kommentare, Communication; leer „Noch keine Aktivität.“).
- **Person:** ohne Kunde editierbar (Autosave). Mit Kunde: Kontaktdaten **lesend** + [In Kundenakte ändern]; abweichende Anfrage-Angaben als Hinweis „Anfrage nennt +43 …, Kunde hat +43 … – [In Kunde übernehmen]“.
- **Kunde zuordnen** (ein Weg): Bezugszeile „Kunde“ [Zuordnen] → Link-Suche; Vorschläge aus `find_duplicates` oben (Punkte/Grund als Text: „gleiche E-Mail“), letzter Eintrag „Neu anlegen aus dieser Anfrage“ (`kontakt_anlegen`). Undo 8 s (§ 2.4).
- **Details-Panel** (Autosave 1 s): Zuständig, Priorität, Nachfassen am (Aufgabe, E2), Vereinbart (`naechster_schritt`), Ort der Beratung, Budget-Hinweis (Hinweis unter dem Feld: „Nur sachliche Angaben.“), Erwarteter Wert (`wert_cent`, netto), Abschluss ca. (`erwarteter_abschluss`). In Gewonnen/Verloren/Spam für Mitarbeiter gesperrt (Schloss + Text „Abgeschlossen – nur Leitung“, `allow_edit` des Workflows).
- **Angebote-Bezug:** alle `PH Angebot.anfrage = <name>`; Versionen gruppiert, angezeigt letzte (Status ≠ Ersetzt) + „2 frühere Versionen“.
- **Fehler:** `not_found` → „Diese Anfrage gibt es nicht mehr.“ + Suche vorbefüllt · `conflict` → feldweiser Konfliktdialog.
- **Laden:** Kopf + Übersicht blockierend, Tabs lazy, Details gestreamt.

### 3.5 `/crm/kontakte` – Kunden & Kontakte

```
┌ Zentrale › CRM › Kunden & Kontakte                                         [Neuer Kontakt] ┐
│ [Kunden] [Interessenten] [Meine] [Architekten & Partner] [Firmen] [Alle]                   │
├ Suche (Name, E-Mail, Telefon, Ort, Nr.)  Art ▾  Status ▾  Berater ▾  Ort ▾  [+ Filter]      │
│ ☐ │ Name                       │ Kontakt   │ Art      │ Ort         │ Berater   │ Letzter Kontakt │ Status       │ ⋯ │
│ ☐ │ Familie Muster  Widerspruch│ [Mail][Tel]│ Privat   │ 6911 Lochau │ A. Berger │ vor 2 Tagen · Termin │ ● Kunde │ ⋯ │
│ ☐ │ Büro Weiss – DI Weiss      │ [Mail][Tel]│ Architekt│ Bregenz     │ L. Berger │ 03.10. · E-Mail │ ● Interessent│ ⋯ │
└ 1–50 von 461                                                                               ┘
```

- Spalten: Name (`titel`; Kennzeichen „Widerspruch“ als Text-Chip rot mit `aria-label`; „anonymisiert“ grau) · Kontakt (Icon-Knöpfe) · Kontaktart · Ort · Berater · **Letzter Kontakt** (`letzter_kontakt` + `letzter_kontakt_art`, vorhanden) · Status. Optional: Kunde seit, Sprache, Bevorzugt, Quelle, Firma (`firma_kontakt`), Geburtstag (nur mit `geburtstag_einwilligung`). permlevel 1 (`notizen`) nie in Liste.
- Ansicht „Firmen“: Kontakte mit Personen (`firma_kontakt` zeigt auf sie); Firma-Zeile zeigt „3 Personen“.
- Suche fehlertolerant über `globalSearch` (ph_core) + `telefon_norm`; leer „Kein Kontakt zu ‚Muler‘.“ (+ „Meintest du ‚Müller‘?“, wenn die Suche einen Vorschlag liefert) [Kontakt ‚Muler‘ anlegen].
- Zeile → Kundenakte. Zeilenmenü: Termin (`Shift+T`), Aufgabe, E-Mail, Anrufen, In neuem Tab.
- **Neuer Kontakt** (Dialog): Kontaktart Segment, Anrede (optional), Vorname, Nachname*, Firma (wenn nicht Privat) bzw. „gehört zu Firma“ (`firma_kontakt`, Link) + Funktion, E-Mail (Eindeutigkeit live: „bereits bei Familie Muster – [Öffnen]“), Telefon, Straße, PLZ, Ort, Land, Sprache, Berater. Ausführung `create_kontakt(…)` → bei wahrscheinlicher Dublette Antwort `bestehend` → Hinweis „Sieht aus wie Familie Muster – [Öffnen] [Trotzdem anlegen]“ (`trotzdem=1`).
- **Massenaktionen:** Berater zuweisen · An Marketing übergeben (§ 7.1) · Deaktivieren (Leitung) · CSV (Leitung/GF, protokolliert).
- **Leer:** „Noch keine Kontakte. Kontakte entstehen aus Anfragen oder werden hier angelegt.“ · gefiltert „Keine Kontakte für diese Filter.“ [Filter zurücksetzen].

### 3.6 `/crm/termine` – Kalender, Kanban, Liste (`?ansicht=kalender|kanban|liste`, Standard Kalender Woche)

```
┌ Zentrale › CRM › Termine                                                     [Neuer Termin] ┐
│ [Kalender | Kanban | Liste]     ‹ KW 45 · 3.–9. Nov 2026 ›  [Heute]   [Tag | Woche | Monat]  │
│ Berater: [Alle][AB][LB][MK]   Modus: [Showroom][Video][Vor Ort][Telefon]   Ebenen: ☐ Montagen ☐ Service ☐ Abwesenheiten │
├──────┬─────────────┬─────────────┬─────────────┬─────────────┬─────────────┬───────────┤
│      │ Mo 3.       │ Di 4. heute │ Mi 5.       │ Do 6.       │ Fr 7.       │ Sa 8.     │
│ 09:00│ 09:00 Huber │             │ 09:00 Lindau│             │             │           │
│      │ Showroom AB │             │ Vor Ort LB  │             │             │ geschl.   │
│      │ bestätigt   │             │ unbestätigt │             │             │           │
│ 12:00│ ─── keine Verfügbarkeit (surface-3) ───                                           │
│ 14:00│             │ 14:00 Schmid│             │ 14:00 Muster│             │           │  Jetzt-Linie 1 px Sand
└──────┴─────────────┴─────────────┴─────────────┴─────────────┴─────────────┴───────────┘
```

- **Quellen:** PH Termin (Status ≠ Storniert/Abgelehnt; per Chip einblendbar) über `ph_termin_kalender.get_events` · Ebenen lesend grau, nur wenn App installiert: PH Montageauftrag, PH Serviceeinsatz, PH Abwesenheit (ph_personal, Schraffur mit Text „abwesend“, Art nur Leitung) · Verfügbarkeit (PH Verfuegbarkeit: weiß = frei, `surface-3` = außerhalb) · Feiertage/Betriebsurlaub (PH Termin Einstellungen `feiertage`, Tag grau mit Bezeichnung).
- **Ereignis-Karte:** Zeile 1 Zeit · Name; Zeile 2 Modus-Icon (`building-2`, `video`, `map-pin`, `phone`) + Modus-Wort · Berater-Initialen; Zeile 3 **Status-Wort** („unbestätigt“, „reserviert bis 10:42“). Farbe = Statuston als 3-px-Balken + `*-soft`, Unbestätigt gestrichelt. `aria-label` „Di 4. Nov 14:00 Showroom Schmid unbestätigt“. Höhe: 15 min ≥ 24 px (kompakt) bzw. ≥ 44 px (iPad, Tag scrollt); kurze Blöcke einzeilig (Zeit + Name).
- **Semantik:** `role="grid"` (Zeilen = Zeitfenster, Spalten = Tage), Ereignisse als Buttons; Liste ist gleichwertige Alternative.
- **Interaktion Desktop:** Klick → Vorschau (Ereignisse sind klein) mit Primärknopf; Doppelklick/Enter → Akte. **Drag** verschiebt (`umbuchen(neuer_start, berater)`; Tagesansicht zwischen Berater-Spalten ändert `berater`); Konflikt → Rücksprung 200 ms + Toast „Di 14:00 ist schon belegt – nächste freie Zeit 14:30.“; `conflict` wegen Website-Absage → „Kunde hat inzwischen abgesagt.“ Klick in freie Zelle → A1 mit Zeit. Kein Ziehen der Dauer (E16).
- **Interaktion Touch:** kein Drag; Tippen → Vorschau mit [Verschieben]; Langdruck = Kontextmenü.
- **Tastatur:** `n` neuer Termin · `t` heute · `d`/`w` Tag/Woche · Monat über Segment (Fokus + `←/→`) · `←/→` Zeitraum · `↑↓` Ereignisse des Tages · Enter öffnen · `m` Verschieben-Dialog.
- **Verschieben-Dialog** (Drag-Alternative): Slot-Raster wie A1 (`get_freie_slots(…, ausser = Termin)`), Dauer lesend, Berater-Wahl; Undo-Toast (§ 2.4). `kundenmail = website`: Toast-Zusatz „Kunde erhält die Mail von der Website“ (`website_benachrichtigen` wird gesetzt, vorhanden).
- **Tagesansicht:** Spalten je Berater; Berater ohne Verfügbarkeit: Spalte grau „Keine Verfügbarkeit hinterlegt“ (Leitung: [Verfügbarkeit eintragen]). **Monat:** Zähler je Tag + Punkte mit Statuswort im Tooltip, Klick → Tag; leer „Keine Termine im November.“ [Termin anlegen].
- **Kanban** (Board `PH Termine`): Unbestätigt · Bestätigt · Erledigt · Nicht erschienen; Standardfilter `start >= heute − 7 Tage`. Drop nur Unbestätigt → Bestätigt (Bestätigen mit Mail-Undo 10 s, ohne `email`: ohne Mail + Toast „Keine E-Mail – bitte telefonisch bestätigen“ + Aufgabe optional). Drop auf Erledigt/Nicht erschienen → Rücksprung + Toast „‚Erledigt‘ bitte im Termin setzen – dort wird das Protokoll angelegt.“ Tastatur 03 § 8.8.
- **Liste:** Beginn, Termin, Referenz (mono), Modus, Berater, Kunde, Status, E-Mail bestätigt (Wort), Quelle; Ansichten Heute · Zu bestätigen · Diese Woche · Meine · Ohne Protokoll (`Bestaetigt` und `ende < jetzt`, oder `Erledigt` ohne `beratungsgespraech`) · Serien (`serie` gesetzt).
- **Massenaktionen (Liste):** Bestätigen (nur Unbestätigt + E-Mail bestätigt; **ein Dialog** „5 Bestätigungsmails gehen raus“) · Berater ändern (je Zeile `umbuchen(start, berater)`, Konflikte gemeldet) · Tagesliste drucken.
- **Fehler:** Ebene nicht ladbar → Chip mit Warnsymbol „nicht geladen“, Termine bleiben · **Verfügbarkeit nicht ladbar** → keine weißen Flächen + Band „Verfügbarkeit nicht geladen – freie Zeiten bitte im Termin-Dialog prüfen“ · `rate_limited` beim Blättern → Band mit Countdown „Zu viele Abfragen – in 0:42 wieder möglich“, geladene Wochen bleiben.
- **Leer:** „Keine Termine in dieser Woche.“ [Termin anlegen] · gefiltert „Keine Termine für diese Filter.“ [Filter zurücksetzen] · „Ohne Protokoll“ leer „Alle Protokolle geschrieben.“ (Häkchen).
- **Laden:** Raster sofort, Ereignisse gestreamt, Wechsel ohne Skeleton (alte Ereignisse 0.6). Slots/Events je Woche 30 s gecacht (Ratenlimit 60/min).
- **Druck:** `⋯` „Wochenplan drucken“ (A4 quer, Browser-Druck).

### 3.7 `/crm/termine/[name]` – Termin-Akte

```
┌ Zentrale › CRM › Termine › Di 04.11. 10:30 Videoberatung · Hr. Keller                        ┐
│ Di 04.11. 10:30 Videoberatung · Hr. Keller  ● Unbestätigt · reserviert bis 10:42   [Bestätigen ▾] [⋯] │
│ Anfrage 03.11. ─ Termin Di 04.11. ─ Gespräch ─ Angebot ─ Auftrag                              │
│ (max. 1 Band: „E-Mail bestätigt – bitte bestätigen oder absagen.“)                             │
├ Übersicht | Kunde | Website-Buchung | Aktivität ─────────────────────────────┬ DETAILS ────────┤
│ 10:30–11:15 (45 min) · Puffer 15 · Video · Thema Küche                       │ Berater [LB ▾]  │
│ Anliegen: „Küchenplanung, Haus in Hard, Budget offen“                        │ Thema [Küche]   │
│ Videoraum: – [Raum erzeugen] (für Kunde sichtbar ab 10:15)                   │ Interne Notiz   │
│ BEZÜGE  Kunde Hr. Keller → Akte · Protokoll – · Aufgaben 1                   │ (nur Leitung)   │
└──────────────────────────────────────────────────────────────────────────────┴─────────────────┘
```

- **Primärknopf je Status:** Unbestätigt → **Bestätigen ▾** (Split: Ohne Mail bestätigen) · Bestätigt vor Start → Video: **Raum öffnen** (ab `meet_link_ab_min`), sonst **Verschieben** · Bestätigt ab Start → **Protokoll schreiben** · Erledigt ohne Protokoll → **Protokoll anlegen** (legt PH Beratungsgespraech mit `termin` an) · Endzustände → keiner.
- **`⋯`:** Absagen … (Dialog: Grund*, ☐ Kunde per E-Mail informieren – Standard an bei `kundenmail = backoffice`, ausgeblendet ohne `email`; Leitung, nur Unbestätigt: ☐ Als Anfrage ablehnen) · Verschieben · Nicht erschienen (8 s) · Ohne Protokoll abschließen (8 s) · Wieder bestätigen (Leitung, nur Nicht erschienen) · Serie anlegen (Dialog: Intervall, Anzahl oder bis; Ergebnis „5 angelegt, 1 Konflikt: Fr 21.11. belegt“) · Serie ab hier absagen · Kunde zuordnen · Aufgabe · Terminbestätigung drucken (Brief; ohne Anschrift Hinweis „Keine Anschrift – Brief ohne Adressfeld“) · E-Mail schreiben.
- **Countdown** `reserviert_bis` im Kopf neben dem Badge (Client, jede Sekunde), `aria-live="off"`, Ansage nur bei 5 min, 1 min, abgelaufen; Text „reserviert bis 10:42 (abgelaufen)“. Bei Ablauf einmal `get_freie_slots` → „Reservierung abgelaufen – Zeit ist noch frei“ [Bestätigen] bzw. „… vergeben“ [Neue Zeit anbieten].
- **Tabs:** Übersicht · Kunde (Daten lesend, wenn Kunde zugeordnet) · Website-Buchung (nur bei `quelle = website`, sonst ausgeblendet; lesend: email_verifiziert, reserviert_bis, link_version, sequence, kundenmail, Einwilligung Video/Version/Zeitpunkt, zeitzone; Zeile „Bestätigung, Absage und Verwaltungslink sendet die Website; Erinnerung sendet das Backoffice.“; Hashes nie) · Aktivität.
- **Details:** Berater, Thema (Autosave), Interne Notiz (`notiz_intern`, permlevel 1, nur Leitung/GF; Hinweis „Nur sachliche Angaben. Keine Gesundheits-, Herkunfts- oder Religionsangaben.“). Start/Dauer nur über Verschieben.
- **Kein Erledigt ohne Kunde:** `erledigt_mit_protokoll` legt Kontakt bei Bedarf selbst an (vorhanden).
- **Fehler:** `slot_taken` im Verschieben-Dialog als Feldfehler mit freien Zeiten · Meet ohne Meet-Site → Toast „Kein Videoraum möglich – Kunde bitte anrufen.“ · Löschen wird nie angeboten.

### 3.8 `/crm/gespraeche` und `/crm/gespraeche/[name]` – Gesprächsprotokolle

**Liste:** Datum, Kunde, Berater, Ort, Räume (Chips max. 3 + „+2“), Budget (Kundenangabe brutto; sichtbar für Berater des Gesprächs, Leitung, GF, Faktura – dieselbe Regel wie in der Akte), Vereinbart · bis (Wort „fällig“), Status. Ansichten Offen · Schritt fällig · Meine · Alle; Standard `status != Abgeschlossen`. Massenaktionen: Abschließen (8 s) · Drucken (Sammel-PDF, > 10 nur Leitung). Leer: „Noch keine Gesprächsprotokolle. Sie entstehen aus Terminen.“ · gefiltert „Keine Gesprächsprotokolle für diese Filter.“ · „Schritt fällig“ leer „Kein Schritt fällig.“

**Akte – eine Scrollseite, gebaut für das iPad vor dem Kunden:**

```
┌ CRM › Gespräche › 04.11.2026 · Familie Muster      Gespeichert 10:42   [Kundenansicht] [Gespräch abschließen] [⋯] ┐
│ Anfrage ─ Termin 04.11. ─ Gespräch (jetzt) ─ Angebot ─ Auftrag                                                  │
│ Datum [04.11.2026]  Berater [AB]  Ort [Showroom ▾]  Dauer [60] min  Vorlage [Küche ▾]                           │
├──────────┬───────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Räume    │ RÄUME   [+ Küche] [+ Wohnen] [+ Essen] [+ Schlafen] [+ Bad] [+ Outdoor] [Weitere ▾]                  │
│ Rahmen   │ ┌ Küche   Prio [Hoch ▾]  Budget brutto [35.000,00 €]  Marken [ ]  Maße [4,2 × 3,8 m]     [Entfernen] ┐│
│ Fragen   │ │ Wunsch: „Insel mit Sitzplatz, Kochfeldabzug …“  (Mikrofon auf der Tastatur zum Diktieren)            ││
│ Ergebnis │ │ Fotos: [Kamera] [Aus Fotos wählen]  [Foto 1 – hochgeladen] [Foto 2 – 60 %]                           ││
│          │ └──────────────────────────────────────────────────────────────────────────────────────────────────┘│
│          │ Summe Budget (Kundenangabe, brutto): 47.000,00 €                                                      │
│          │ RAHMEN  Stil · Zeitrahmen · Objekt · Objektadresse · Beteiligte (Entscheider)                         │
│          │ FRAGEN (aus Vorlage)  ☐ Gerätemarke festgelegt? · ☐ Wasseranschluss Insel? …                          │
│          │ ERGEBNIS  Zusammenfassung […]   Vereinbart [Rendering Küche vorlegen]  bis [18.11.]                   │
└──────────┴───────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

- **Abschnittsleiste links** (≥ 1024 px): Anker Räume · Rahmen · Fragen · Ergebnis; aktiver Abschnitt Sand-Strich 2 px (160 ms). „Intern“ (`notiz_intern`, permlevel 1: Leitung/GF) und „Aktivität“ als Sheet hinter `⋯`.
- **Räume:** 6 häufige Chips (Küche, Wohnen, Essen, Schlafen, Bad, Outdoor) + „Weitere ▾“ (Kind, Büro, Flur, Pool, Licht, Gesamt, Sonstiges); Chip legt Raumkarte an (Höhe 0 → auto 160 ms). Chips 44 px, Abstand 8 px. Raum entfernen: Knopf `trash-2` mit Text oder `Shift+Entf`, Undo 8 s. Budget `BetragFeld` (Cent, `inputmode=decimal`), Label „Budget brutto (Kundenangabe)“, Währung EUR fest angezeigt (Feld `waehrung`: Anfrage B6; CHF-Angabe bis dahin im Wunschtext). Summe live = `budget_gesamt_cent`.
- **Vorlage:** Select PH Beratungsvorlage (aktiv, passend zu Raum/Objekt) → `vorlage_anwenden(vorlage)` übernimmt Fragen als Checkliste (doppelte übersprungen); Antworten inline.
- **Fotos:** `<input type=file accept=image/* capture>` + „Aus Fotos wählen“; Kachel mit Fortschritt; Fehler-Kachel „Foto nicht hochgeladen · Erneut“; Fotos zählen erst hochgeladen als gespeichert. Ablage `uploadFile` an das Gespräch (privat).
- **Ergebnis:** Verlassen des Felds „bis“ mit gefülltem „Vereinbart“ → `aufgabe_anlegen()` (vorhanden) + Toast „Aufgabe ‚Rendering Küche vorlegen‘ bis 18.11. angelegt · Rückgängig (Z)“ (8 s; Undo verwirft die Aufgabe per `status_setzen Verworfen`). Existiert schon eine offene Aufgabe dazu → nur Fälligkeit verschieben.
- **Primärknopf** (einer): Offen → **Gespräch abschließen** → Sheet „Wie geht es weiter?“ (§ 5.6). Planung beauftragt → **Angebot erstellen** (A2). Abgeschlossen → **Wieder öffnen** (`status_setzen Offen`).
- **`⋯`:** Protokoll drucken · Protokoll an Kunden senden (`protokoll_senden(empfaenger, nachricht, betreff)`, vorhanden; Dialog mit Vorschau, Versandweg E-Mail · Brief drucken · persönlich übergeben – Brief/persönlich als Kommentar protokolliert; ohne E-Mail nur Brief/persönlich) · Intern · Aktivität · Kunde/Termin öffnen.
- **Kundenansicht** (Knopf mit Icon `presentation` + Text, automatisch beim Vollbild): blendet Seitenleiste, Glocke, Badges, Status-Badge, „Intern“, „Aktivität“, Budget-Summen der Leitung und Kommentare aus; Kopf zeigt nur Wortmarke (Bodoni Moda) + Datum + Kundenname; Toasts anderer Datensätze werden zurückgehalten und beim Verlassen gesammelt gezeigt („2 Benachrichtigungen während der Kundenansicht“). Beenden: Knopf „Kundenansicht beenden“ mit Langdruck 600 ms (Fortschrittsring). Leisten blenden 160 ms per Deckkraft.
- **Autosave** 1 s mit Speicheranzeige (§ 2.7); offline Entwurf in IndexedDB, Abgleich über `modified`, Konflikt feldweise je Raumkarte.
- **Leer:** Räume „Noch kein Raum. Tippe oben auf einen Raum, um Wünsche zu notieren.“ · Fragen ohne Vorlage „Keine Fragenliste – Vorlage wählen (optional).“
- **Kürzel:** `⌘Enter` Primär · `Shift+R` Raumleiste · `Shift+Entf` Raum entfernen · `Alt+1…4` Abschnitte.
- **Fehler:** `planung_beauftragen` ohne ph_projekte → Toast „Projekte-Bereich nicht eingerichtet – Status gesetzt, Projekt bitte später anlegen.“ · Projekt-Anlage scheitert → Toast fehler „Projekt nicht angelegt – bitte im Projekte-Bereich anlegen.“ (Admin: „Fehlerprotokoll“).

### 3.9 Aufgaben

Keine eigene CRM-Seite. „Mehr ▾ › Aufgaben“ öffnet `/aufgaben?bereich=crm` (Zentrale) mit Ansichten Meine offen · Team · Überfällig · Heute · Aus Anfragen (`referenz_doctype = PH Anfrage`) · Nachfassen (Nachfass-Aufgaben, E2) · Erledigt 7 Tage. Schnellanlage `Shift+A` überall im CRM: Titel*, Fällig (Standard +1 Tag; „+3“, „mo“), Zugewiesen (Standard ich), Vorgang automatisch aus Kontext. Erledigen per Haken (Undo 8 s → `status_setzen Offen`), Verwerfen (Undo 8 s). Quelle „automatisch“ als Kennzeichen bei `quelle = scheduler`. Leer und Zustände: Zentrale-Konzept § 3.6.

### 3.10 `/crm/berichte` und `/crm/berichte/[report]`

Index: Kacheln mit Titel, einem Satz („Wie viele Anfragen wurden in diesem Zeitraum zu Aufträgen?“), Rolle. Ohne Recht ausgeblendet; alle ausgeblendet → „Für deine Rolle gibt es hier keine Berichte.“

| Bericht | Quelle | Wer | Darstellung |
|---|---|---|---|
| **Übersicht** | Dashboard Charts Anfragen je Woche, nach Art, Termine je Woche, nach Modus; Next-Zählung Verkaufsverlauf | alle (Mitarbeiter: eigene) | Balken je Woche; Anteile als **horizontale Balken** (max. 5 + „Weitere“) statt Donut; Zeitraum-Segment |
| Vertriebscockpit | Report `PH Vertriebscockpit` (Anzahlen) + Next-Beträge aus ph_faktura (E13) | Leitung/GF | Verkaufsverlauf + Tabelle je Periode; Betragsspalten „Auftragseingang netto“ je Währung aus ph_faktura; Report-Betragsspalten ausgeblendet bis A3 mit Hinweiszeile „Beträge aus Faktura berechnet“ |
| Anfragen nach Quelle | `PH Anfragen nach Quelle` | alle | Tabelle + Balken |
| Reaktionszeiten | `PH Reaktionszeiten` (`ziel_h` live änderbar) | Leitung/GF; Mitarbeiter Filter `zugewiesen_an = ich` fest | Linie + Ziellinie gestrichelt + Tabelle |
| Termine je Berater | `PH Termine je Berater` | Leitung/GF; Mitarbeiter eigene Zeile (Filter `berater = ich` fest im Next-Aufruf) | Matrix Berater × Modus; Hinweis „Abgelehnt enthält verfallene Website-Reservierungen“ bis B8 |
| Verlustgründe | `getList` PH Anfrage `status = Verloren` gruppiert nach `verloren_grund` (Next) | Leitung/GF | horizontale Balken |

Aufruf `getReport(name, filters)`; Filter in der URL; > 8 s → „Dauert zu lange – bitte kürzeren Zeitraum wählen.“; Hinweise des Reports (fehlende App) als Band. Leer: „Noch keine Daten für diesen Zeitraum.“ Chart-Farben: Hauptreihe `--color-chart-1`, Vergleich `--color-chart-2`; Tabelle als `<details>` für Screenreader. Export CSV (Recht `export`), Browser-Druck A4 quer.

### 3.11 `/crm/datenschutz` – Datenschutzanfragen (Leitung bearbeitet, Mitarbeiter erfassen)

Liste PH Datenschutzanfrage: Eingang, Art (Auskunft · Löschung · Berichtigung · Einschränkung · Datenübertragbarkeit · Widerspruch), Kunde, Kanal, Frist (Datum + Wort „noch 5 Tage“/„überschritten“), Zuständig, Status. Ansichten Offen · Frist ≤ 7 Tage · Erledigt. Akte (Seite) mit Schrittleiste je Art:

```
┌ CRM › Datenschutz › Auskunft: Familie Muster          ● In Arbeit · Frist 04.12.2026 (noch 30 Tage) ┐
│ ① Identität geprüft ☑ (Weg: Ausweis im Showroom)  ② Auskunft erstellen  ③ Prüfen/Schwärzen  ④ Versenden  ⑤ Abschließen │
│ [Auskunft erstellen]   Vorschau: 14 Abschnitte · 3 interne Notizen · 12 Dateien · Metadaten ✓            │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

- Erfassen (Kundenakte `⋯`, auch Mitarbeiter): Art*, Eingang* (heute), Kanal*, Beschreibung → `insert PH Datenschutzanfrage` (Frist rechnet der Server: 1 Monat, Verlängerung + 2 Monate nur mit Begründung). Art Widerspruch ruft serverseitig `widerspruch_erfassen` (vorhanden).
- Bearbeiten (Leitung): [Bearbeiten] (`bearbeiten`) · Identität abhaken (Pflicht vor Auskunft/Löschung; Server prüft) · **Auskunft** (§ 7.2) · **Löschung**: `loeschplan_erstellen` → Tabelle „wird gelöscht / anonymisiert / aufbewahrt bis 31.12.2033 (§ 132 BAO)“ → `loeschung_ausfuehren(bestaetigung)` mit Tippfeld · Berichtigung/Einschränkung: Link in die Kundenakte + Ergebnisfeld · [Abschließen] (`abschliessen(ergebnis)`) · [Ablehnen] (`ablehnen(grund)`, Dialog, Pflichtgrund).
- Heute-Zeile der Leitung (Zentrale): „Datenschutz-Fristen 1“ ab 7 Tage vor Frist (Task `dsgvo_fristen` meldet zusätzlich per Glocke).
- Leer: „Keine Datenschutzanfragen.“

### 3.12 `/crm/einstellungen` (Leitung; Mitarbeiter sehen Verfügbarkeit lesend und ihre eigene Zeile bearbeitbar)

Reiter (`?tab=`): **Verfügbarkeit** (zuerst) · Terminarten · Buchung · Öffnungszeiten & Feiertage · E-Mails · Video · Automationen · Datenschutz.

- **Verfügbarkeit:** Wochenraster Berater × Tag (Fenster als Text „09–12 · 13–18“ + Modus-Wort, keine reine Schraffur). Zelle per Pfeiltasten, Enter → Popover: von/bis (15-min-Schritte), Modus, gültig von/bis, Notiz, aktiv → [Speichern] (`insert`/`setValue`; Server prüft Überschneidung). Ziehen am Desktop legt Fenster an (Alternative zum Popover). Löschen mit Undo 8 s. „Woche kopieren“ = neue Zeilen mit `gueltig_von/bis` (Wochenmuster); Ausnahmen einer Woche gehören in PH Abwesenheit (Hinweis + Link zu Personal). Unten Terminart-Berater-Zuordnung mit Vorschau „So sieht es auf der Website aus“. Live-Prüfung: Terminart ohne buchbaren Berater → Band „Website zeigt keine freien Zeiten für Vor Ort“. Leer: „Ohne Verfügbarkeit gelten die Showroom-Öffnungszeiten für alle Berater.“
- **Terminarten:** Liste mit Schaltern Aktiv/Website inline (Website aus = Undo 8 s); Akte mit Titel DE/EN/FR/IT als Sprach-Tabs, Modus/erlaubte Modi, Themen, Bestätigung automatisch/manuell, Dauer/Puffer/Anfahrt/Vorlauf/Buchbar bis, feste Startzeiten, Wochentage, Berater, Hinweis für Kunden. Leer: „Ohne Terminart kann niemand online buchen und kein Termin angelegt werden.“ [Terminart anlegen].
- **Buchung:** Reservierungsminuten, Horizont, Event anlegen, Leitung (Empfänger Team-Aufgaben), Anfrage-Erinnerung Stunden.
- **Öffnungszeiten & Feiertage:** Kindtabellen; „Feiertage Vorarlberg 2027 übernehmen“ (Client-Liste, später ph_core `feiertage(jahr)`).
- **E-Mails:** Erinnerung aktiv/Stunden; Vorlagen mit gerenderter Vorschau (Beispiel-Termin).
- **Video:** Meet aktiv, Basis-URL, Schlüsselname (nur Name, nie Wert), Link ab Minuten.
- **Automationen:** Schalter der vorhandenen Felder `auto_wiedervorlage` (Hinweis „wird vom Backoffice nicht genutzt“), `auto_ruhend` + `ruhe_qualifiziert_tage/ruhe_termin_tage/ruhe_angebot_tage`, `auto_termin_abschluss`, `auto_no_show`, `auto_vortag`, `auto_gewonnen`, `auto_duplikat` + `duplikat_tage`; je Regel ein Satz Wirkung. Letzter Lauf (`Scheduled Job Log`) nur Admin.
- **Datenschutz:** Fristen-Übersicht (Vorschlag, Inhaber/RB entscheidet; § 7.3) und Vorschlagslisten mit Massenaktion (Leitung): „Spam älter als 30 Tage (12)“ → [Endgültig löschen] (Dialog mit Tippfeld, `delete` je Anfrage inkl. Dateien) · „Interessenten ohne Vorgang seit 36 Monaten, ohne Einwilligung (4)“ → je Kontakt Löschplan-Vorschau → [Anonymisieren] · „Verloren älter als 24 Monate (7)“ → [Anonymisieren] (Anfrage-Felder leeren über `save`; bis Task A2). Kontakt mit Belegen: Knopf deaktiviert, Tooltip „Aufbewahrungspflicht bis 31.12.2033 – nur Einschränken möglich“.
- **Speichern** jedes Reiters: `⌘S` → Dialog md mit Liste „Feld: alt → neu“ und Satz „Diese Änderungen gelten sofort für die Website-Buchung.“ → [Speichern] → Toast mit Rückgängig (stellt Werte zurück).

---

## 4. Kundenakte `/kunden/[kontakt]`

Kanonische Adresse jeder Person/Firma; CRM besitzt die Seite, alle Bereiche liefern Inhalte über die Bezugs-Registry (`kontakt360.kontakt_bezuege`, Hook-Vertrag `ph_kontakt_zeitleiste`). Ziel: am Telefon sagen können, was offen ist, wer zuständig ist und was als Nächstes passiert. Brotkrume: „Zentrale › CRM › Kunden & Kontakte › Familie Muster“.

### 4.1 Aufbau (≥ 1280 px)

```
┌ Zentrale › CRM › Kunden & Kontakte › Familie Muster                                                 ┐
│ (FM) Familie Muster  ● Kunde                                          [Neu ▾]  [Zahlung erfassen]  │  Z1
│ [Mail] [Anrufen] [Mobil] · bevorzugt Telefon · Lochau · seit 03/2025 · [Kundenkarte · Stufe] [1 ähnlicher] │  Z2
│ Widerspruch seit 12.10.2026 – nur vertragsbezogene Kommunikation                                     │  max. 1 Band
├ Übersicht | Aktivität | Vorgänge 6 | Projekte & Belege 9 | Service 1 | Mehr ▾ ─────┬ DETAILS ───────┤
│ OFFEN JETZT                                                                         │ Berater AB ▾   │
│ RE-2026-00042 offen · fällig 10.11. · 2.400,00 € brutto            [Zahlung erfassen]│ Kontaktart Privat│
│ Termin Do 06.11. 14:00 Vor Ort · bestätigt                          [Öffnen]        │ Sprache DE     │
│ Rendering Küche vorlegen · bis 18.11. · A. Berger                   [Erledigt]      │ Adressen 3 ▾   │
│ AB-2026-00031 teilgeliefert · 2 von 5 Positionen                    [Öffnen]        │ Beteiligte 2 ▾ │
│ GESPRÄCHSSTAND 04.11.  Küche (hoch) · Wohnen · Budget 47.000,00 € brutto · 3–6 Monate│ Portal aktiv   │
│ LETZTE AKTIVITÄT  heute E-Mail eingegangen · gestern Termin erledigt …            → │ Einwilligungen 2│
└──────────────────────────────────────────────────────────────────────────────────────┴────────────────┘
```

### 4.2 Kopf (2 Zeilen)

| Element | Quelle | Verhalten |
|---|---|---|
| Avatar 40 (Initialen auf `sand-soft`, 03 § 8.17), Name (Instrument Sans 20/500) | `kopf.titel` aus `get_kundenakte` | Klick → Details-Panel Name fokussiert |
| Status-Badge | `status` | Klick → Menü erlaubter Übergänge (§ 5.3) |
| Primärknopf | erste Empfehlung aus „Offen jetzt“ (Zahlung erfassen → Faktura · Bestätigen · Protokoll schreiben · Annehmen); sonst „Termin anlegen“ | `⌘Enter` |
| `Neu ▾` (Sekundär) | nach Recht, `?kontakt=` vorbefüllt: Anfrage · Termin (A1) · Gesprächsprotokoll · Aufgabe · Projekt · Angebot (A2) · Servicefall · Kundenkarte · Kassenbeleg (öffnet Kassa) · Notiz | bei Widerspruch ohne Marketing-Einträge |
| Kontaktwege | `email`, `telefon`, `mobil`, `kommunikation_bevorzugt` | Icon-Knöpfe 32 px mit Text; bevorzugter Weg fett; Kopieren bei Hover; bei Widerspruch aktiv (Vertragskommunikation zulässig), Tooltip „Widerspruch: nur vertragsbezogen“ |
| Ort, „seit“ | `ort`; `kunde_seit` bzw. „angelegt“ (`creation`); nach Reaktivierung „früher Kunde seit 03/2025“ | Tooltip absolutes Datum |
| Chips | Kundenkarte (`ph_kundenkarte_karte`/`_stufe`), Firma (`firma_kontakt` → „gehört zu Büro Weiss“), „1 ähnlicher“ (nur Leitung, `find_duplicates` Einstufung „wahrscheinlich“), Debitor (`ph_faktura_debitor_nr`, nur Faktura/Leitung) | Chip → Ziel |
| Band (max. 1, Vorrang) | (1) anonymisiert (`anonymisiert_am`: „Anonymisiert am … – nur Belege bleiben“) › (2) Widerspruch (`nicht_kontaktieren`, danger, nicht schließbar) › (3) Rücktritt erfasst („Rücktritt erfasst 04.11. – Erstattung bis 18.11.“, warning) › (4) Rücktrittsfrist läuft (`PH Auftragsbestaetigung.fagg_frist_ende` ≥ heute: „Rücktrittsfrist läuft bis 18.11.“, info) › (5) Löschung angefordert (`loeschung_angefordert_am`) | – |

`⋯`: E-Mail schreiben · Anrufen · vCard (Client) · Adressetikett (§ 8) · Portal-Zugang erzeugen/sperren · Widerspruch erfassen · Datenschutzanfrage erfassen · Rücktritt erfassen (§ 5.9) · Zusammenführen (Leitung) · Status ändern · Widerspruch aufheben (Leitung) · In Frappe öffnen (Admin).

### 4.3 Tabs (6, `Alt+1…6`; Zähler 0 grau sichtbar; ohne Leserecht ausgeblendet, Übersicht zeigt dann „3 Belege (kein Zugriff)“)

| Tab | Inhalt | Quelle | Leer-Text |
|---|---|---|---|
| **Übersicht** | Offen jetzt (max. 8 nach Fälligkeit, je Zeile eine Aktion; Teillieferung „Teilgeliefert · 2 von 5 Positionen · Rest KW 49“ aus AB/Lieferschein), Gesprächsstand (letztes Gespräch), Zahlen (Leitung/GF/Faktura, § 4.5), letzte 3 Aktivitäten | `get_kundenakte(kontakt)` (`bereiche`, `gespraech`, `offen_gesamt`) + Faktura-Zahlen aus Next | Offen „Nichts offen.“ · Gesprächsstand „Noch kein Beratungsgespräch.“ [Termin anlegen] |
| **Aktivität** | Zeitleiste in voller Breite, Composer unten sticky | `get_zeitleiste(kontakt, vor, limit=30)` (seitenweise) | „Noch keine Aktivität.“; gefiltert „Keine Einträge vom Typ ‚Geld‘.“ [Alles zeigen] |
| **Vorgänge** | Unterlisten Anfragen · Termine (inkl. Montage/Service-Einsätze lesend) · Gespräche · Aufgaben, je 5 + „alle“ | `bereiche[]` + `getList` je DocType `kontakt` | „Noch keine Anfragen oder Termine.“ |
| **Projekte & Belege** | Abschnitte mit Ankern: Projekte (Mini-Vorgangsleiste) · Belege (Angebote letzte Version, AB, Rechnungen, Gutschriften, Mahnungen) · Zahlungen · Lieferungen | PH Projekt, PH Angebot, PH Auftragsbestaetigung, PH Rechnung, PH Gutschrift, PH Mahnung; PH Zahlung; PH Kassenbeleg (Kennzeichen „Kassa“); PH Lieferschein, PH Sendung, PH Tour Stopp | „Kein Projekt.“ [Projekt anlegen] · „Noch keine Belege.“ · „Keine Zahlungen.“ · „Keine Lieferungen.“ |
| **Service** | Servicefälle, Einsätze, Serviceaufträge, Pflege-Abos, Produktpässe mit Fristen (falls Feld vorhanden) | ph_service | „Kein Servicefall.“ · Fristen „Keine Fristen erfasst.“ |
| **Mehr ▾** | Marketing (Einwilligungen je Zweck mit Status, Newsletter, Events, Empfehlungen; bei Widerspruch nur lesen) · Dokumente (alle Dateien der Bezüge, gruppiert nach Herkunft, „im Portal sichtbar“, Hochladen an Kontakt) · Datenschutz (Widerspruch, Geburtstag + Einwilligung, Portal, Datenschutzanfragen, Löschplan-Vorschau für Leitung, Herkunft `quelle`/`sync_quelle`) | ph_marketing, `File`, PH Kontakt, PH Datenschutzanfrage | „Keine Einwilligung erfasst.“ · „Keine Dateien.“ · „Keine Datenschutzanfragen.“ |

Tab-Unterstrich gleitet 160 ms; Inhalt ohne Animation.

### 4.4 Details-Panel (320 px, inline wie Linear/Attio; < 1280 px Sheet hinter [Details], `Shift+D`)

Kontaktart · Anrede (optional, „keine Angabe“) · Titel · Vorname · Nachname · Firma / gehört zu (`firma_kontakt`, Funktion) · Berater · Sprache · Bevorzugt (`kommunikation_bevorzugt`) · E-Mail (Eindeutigkeit: Serverfehler → Feldfehler mit Link) · Telefon · Mobil · Straße/PLZ/Ort/Land · UID (nicht bei Privat) · **Adressen** (Kind `adressen`: Art, Bezeichnung, Straße*, PLZ*, Ort*, Land, Hinweis, Standard; Zeile hinzufügen/entfernen mit Undo) · **Beteiligte** (Kind `rollen`: Rolle (Architekt, Innenarchitekt, Planer, Hotelier, Bauträger, Hausverwaltung, Entscheider, Ansprechpartner, Empfehlungsgeber, Handwerker, Sonstige), Bezug (Kontakt oder Projekt), Notiz) · **Personen** (bei Firmen: `kopf.personen`) · Kundenkarte · Portal (aktiv, letzter Login) · Einwilligungen (Anzahl je Zweck, Link Mehr › Marketing) · **Intern** (`notizen`, permlevel 1, nur Leitung/GF; Hinweis „Nur sachliche Angaben. Keine Gesundheits-, Herkunfts- oder Religionsangaben.“). Autosave 1 s, Speicheranzeige § 2.7. Leer-Zustände: „Keine Adresse hinterlegt.“ [Adresse ergänzen] · „Keine Beteiligten.“

### 4.5 Zahlen (nur Leitung/GF/Faktura; E13)

| Zahl | Quelle (Next, `zahlen.js`) | Label |
|---|---|---|
| Auftragseingang 12 Monate | Σ `PH Auftragsbestaetigung.netto_cent`, `kontakt`, Status ≠ Storniert, je `waehrung` | „Auftragseingang netto · EUR 12.400,00 · CHF 3.000,00“ |
| Offene Posten | Σ `PH Rechnung.offen_cent`, Status in Gestellt/Teilbezahlt/Ueberfaellig/Gemahnt, je Währung | „Offen brutto“ |
| Anzahlung offen | Σ (`anzahlung_soll_cent − anzahlung_ist_cent`) der ABs ≠ Storniert | „Anzahlung offen brutto“ |
| Offene Chancen | `get_kundenakte.pipeline` (`wert_cent`, `gewichtet_cent`) | „Erwartet netto (gewichtet)“ |

Kein Betrag wird im CRM gebucht; „Zahlung erfassen“ führt immer in Faktura. Kassenbelege erscheinen unter Zahlungen, nie als Rechnung (RKSV-Beleg ≠ Rechnung). Fehlt ph_faktura: Zeile „Faktura nicht eingerichtet“.

### 4.6 Zeitleiste und Composer (Tab Aktivität)

- **Einträge** (aus `get_zeitleiste`): Statuswechsel, Kommentare, E-Mails (auch an Anfrage/Termin), Belege, Zahlungen, Lieferungen, Montage, Service, Portal-Login, Kundenkarte, Datenschutz. Icon 16 + eine Zeile + relative Zeit; Gruppen je Tag; neue Einträge schieben sich ein (§ 2.8).
- **Filter-Chips:** Alles · Gespräche & Mails · Status · Geld (Recht) · Service · Kommentare (`?zl=`). Tab-Reihenfolge: Filter → Einträge → Composer.
- **Kommentar:** `@` erwähnt Kollegen (Benachrichtigung), `⌘Enter` senden, optimistisch; Fehler → Eintrag rot mit „Erneut“. Hinweis unter dem Feld: „Kommentare sind intern, gehören aber zur Auskunft an den Kunden.“
- **E-Mail schreiben** (Drawer 560): An (vorbefüllt), Vorlage (`Email Template`), Betreff, Text, Anhänge (Belege des Kontakts). Server: `PH Kontakt.mail_senden(betreff, nachricht, an, vertragsbezogen, email_template)` (vorhanden; erzwingt bei Widerspruch den Haken „vertragsbezogen (keine Werbung)“, setzt `letzter_kontakt`). Ohne E-Mail: Knopf zeigt „Brief schreiben“ → Druck-Drawer mit Briefvorlage; `kommunikation_bevorzugt = Brief` ebenso.

**Kürzel Kundenakte:** `Alt+1…6` Tabs · `n` Neu-Menü · `Shift+T` Termin · `Shift+A` Aufgabe · `Shift+M` E-Mail/Brief · `e` Details bearbeiten · `Shift+D` Details.
**Laden:** Kopf + Übersicht in einem Aufruf `get_kundenakte`; Tabs lazy, danach gecacht (Tag `kontakt:<name>` 30 s, Invalidierung nach jeder Aktion).
**Fehler:** je Tab isoliert („Belege nicht geladen · Erneut“); `not_found` → „Kontakt nicht gefunden – vielleicht zusammengeführt?“ + Suche; nach Zusammenführung leitet der alte Name serverseitig weiter → `redirect()` 307.

---

## 5. Abläufe, Knöpfe, Assistenten

### 5.1 PH Anfrage

| Von | Aktion (Oberfläche) | Nach | Wer | Server | Bestätigung |
|---|---|---|---|---|---|
| Neu | **Annehmen** | Angenommen | Mitarbeiter | `workflowAction Qualifizieren` (Bedingung `email or telefon` ist durch `validate` immer erfüllt) | 8 s verzögert |
| Neu, Angenommen | **Termin anlegen** | Termin vereinbart | Mitarbeiter | `termin_vorschlagen(start, dauer_min, modus, terminart, berater, thema, mail)` (setzt Status ohne Workflow-Prüfung, prüft Slot) | A1 |
| Angenommen, Termin vereinbart | **Angebot anlegen** | Angebot | Mitarbeiter | Übergabe an A2 (`?anfrage=&kontakt=&vertragsort=`); nach Anlage `workflowAction Angebot erstellen` + `setValue folgedokument_doctype/folgedokument` (bis Hook A5) | – |
| alle offenen | **Verloren** | Verloren | Mitarbeiter | `als_verloren(grund, details, mitbewerber)` | Dialog sm: Titel „Anfrage Küche Lochau als verloren markieren?“, Grund* (Kein Bedarf · Preis · Mitbewerber · Lieferzeit · Projekt verschoben · Projekt abgesagt · Finanzierung · Sortiment passt nicht · Keine Rückmeldung · Falsche Region · Sonstiges), Mitbewerber (bei Grund Mitbewerber), Details; Fehler „Bitte einen Grund wählen“ unter dem Feld |
| Neu (und offene, über `⋯`) | **Spam** | Spam | Mitarbeiter | `als_spam()` | 8 s verzögert |
| Angebot (offene) | **Gewonnen** | Gewonnen | Mitarbeiter | `als_gewonnen(wert_cent)`; automatisch über `als_kunde_markieren` (R7, sobald Faktura-Hook A4) | Dialog nur ohne AB: „Ohne Auftrag als gewonnen markieren?“; mit offenen Räumen im Gespräch: „Offene Räume (Wohnen, Bad) als neue Anfrage weiterführen?“ [Ja, neue Anfrage] [Nein] → `insert PH Anfrage` (`art = Beratung`, `quelle = sonstige`, `kanal = "Folgeanfrage aus PH-ANF-…"`, gleicher Kontakt) |
| Angenommen | **Zurück auf Neu** | Neu | Leitung | `workflowAction Zurück auf Neu`; Mitarbeiter: „Leitung bitten“ (Aufgabe) | 8 s |
| Verloren, Spam | **Zurück auf Neu** | Neu | Leitung | `workflowAction Zurück auf Neu` | 8 s |
| Gewonnen | **Auftrag storniert** | Verloren | Leitung | bis Workflow B1: Kommentar + Aufgabe an Admin; danach Workflow mit Grund „Storno nach Auftrag“ | Dialog |

Zuweisen = `setValue zugewiesen_an` (Server spiegelt `assign_to`). Nachfassen am = Aufgabe (E2). Aufgabe = `aufgabe_anlegen(titel, faellig)`. Kunde zuordnen = `kontakt_anlegen()` bzw. `setValue kontakt`. Fixture-Lücken (Workflow State „PH Neu“, „PH Erledigt“, „PH Storniert“, „PH Abgelehnt“, „PH Gesperrt“; Action Master „Stornieren“, „Ablehnen“, „Sperren“, „Reaktivieren“; Filter in `hooks.py`) → Next nutzt `getTransitions` und fällt auf Dokumentmethoden zurück; fehlende Fixtures erzeugen genau eine Warnung im Server-Log.

### 5.2 PH Termin

| Von | Aktion | Nach | Wer | Server | Bestätigung |
|---|---|---|---|---|---|
| Unbestätigt | **Bestätigen** / Ohne Mail bestätigen | Bestätigt | Mitarbeiter | `bestaetigen(mail=1|0)` (Mail nur bei `kundenmail = backoffice`; legt Event an) | Mail: Toast 10 s verzögert; ohne `email` kein Mail-Teil + Toast „Keine E-Mail – bitte telefonisch bestätigen“ + Haken „Aufgabe anlegen“ |
| Unbestätigt, Bestätigt | **Absagen** | Storniert | Mitarbeiter | `absagen(grund, mail, abgelehnt=0)` | Dialog |
| Unbestätigt | **Ablehnen** | Abgelehnt | Leitung | `absagen(grund, mail, abgelehnt=1)` | Dialog |
| Bestätigt | **Protokoll schreiben** | Erledigt | Mitarbeiter | `erledigt_mit_protokoll(1)` → navigiert zu `/crm/gespraeche/[bg]` (< 1 s) | – |
| Bestätigt | **Ohne Protokoll abschließen** | Erledigt | Mitarbeiter | `erledigt_mit_protokoll(0)` | 8 s verzögert |
| Bestätigt | **Nicht erschienen** | Nicht erschienen | Mitarbeiter | `nicht_erschienen(grund)` (legt No-Show-Aufgabe an, R4) | 8 s verzögert; Grund optional im Toast-Popover |
| Nicht erschienen | **Wieder bestätigen** | Bestätigt | Leitung | `wieder_bestaetigen(grund)` | – |
| Storniert, Abgelehnt | **Zurück auf Neu** | Unbestätigt | Leitung | `workflowAction` | – |
| aktiv | **Verschieben** | – | Mitarbeiter | `umbuchen(neuer_start, berater)` | Toast 8/10 s verzögert |
| aktiv | Serie anlegen / ab hier absagen | – | Mitarbeiter | `serie_anlegen(intervall, anzahl, bis)` / `serie_stornieren(grund, mail)` | Dialog (Serie absagen: außenwirksam) |
| Video | Raum erzeugen | – | Mitarbeiter | `meet_link_erzeugen()` | – |

„Verfallen“: Website-Reservierung ohne E-Mail-Bestätigung setzt der Task auf `Abgelehnt` mit `storno_grund = "E-Mail nicht bestätigt"` → Anzeige „Verfallen“ grau, aus Berater-Kennzahlen des Backoffice herausgefiltert. Kalender/Slots: `get_events(start, end, filters)`, `get_freie_slots(terminart, modus, von, bis, berater, zeitzone, ausser)`, `get_terminarten(sprache)`.

### 5.3 PH Kontakt

| Von | Aktion | Nach | Wer | Server | Bestätigung |
|---|---|---|---|---|---|
| Interessent | **Als Kunde markieren** | Kunde | Mitarbeiter | `als_kunde_markieren(grund)` (setzt `kunde_seit`, offene „Angebot“-Anfragen → Gewonnen) | Popover mit Feld Grund (optional) |
| Inaktiv | Als Kunde markieren | Kunde | Leitung | `workflowAction` (Bedingung `kunde_seit`) | – |
| Interessent, Kunde | **Deaktivieren** | Inaktiv | Leitung | `workflowAction` | 8 s |
| Interessent, Kunde | **Sperren** | Gesperrt | Leitung | `workflowAction Sperren` + `portal_sperren()`; Sperrgrund-Select (Zahlungsausfall · Missbrauch · Wunsch des Kunden · Sonstiges) als Kommentar bis Feld B13 | Dialog „Sperrt Kontakt und Portal-Zugang.“ |
| Inaktiv, Gesperrt | **Reaktivieren** | Interessent | Leitung | `workflowAction` | – |

Methoden: `portal_zugang_erzeugen()` → Dialog zeigt Token einmal (mono, Kopieren, „wird nicht gespeichert“), Knopf „Ich habe den Zugang übergeben“; `Esc` wirkt trotzdem mit Zwischenfrage „Zugang wurde nicht bestätigt übergeben – erneut erzeugen ist jederzeit möglich. Schließen?“; ohne E-Mail zusätzlich [Zugangsbrief drucken] (Browser-Druck, QR + Token, ein Exemplar, nie gespeichert). Token nie in URL, Log, Browser-Speicher. · `portal_sperren()` (Dialog) · `widerspruch_erfassen(quelle)` (Dialog: Quelle* Telefon · E-Mail · Brief · Persönlich · Website) · `aehnliche_kontakte(limit)` / `find_duplicates` · `keine_dublette(anderer)` („Sind verschiedene Personen“) · `merge_kontakte` · `zeitleiste` · `mail_senden` · `loeschplan` / `get_loeschplan` · `anonymize_kontakt(kontakt, bestaetigung)`.

### 5.4 PH Beratungsgespraech

`status_setzen(status)` mit Offen · Planung beauftragt · Abgeschlossen (Abschließen verlangt Zusammenfassung oder ≥ 1 Raum → Feldfehler mit Sprung) · `aufgabe_anlegen()` · `vorlage_anwenden(vorlage)` · `protokoll_senden(empfaenger, nachricht, betreff)` · `planung_beauftragen(planer)`. Status „Angebot“ wird nicht mehr gesetzt; ein offenes Angebot zeigt die Vorgangsleiste.

### 5.5 Assistent A1 „Termin anlegen“ (ein Bildschirm, Dialog lg 800; `/crm/termine/neu` bei Direktaufruf)

```
┌ Termin anlegen ──────────────────────────────────────────────────────────────────────────┐
│ Kunde [Familie Muster ▾]   Art [Beratung Showroom | Video | Vor Ort | Planung | Weitere ▾] │
│ Berater [Egal | AB | LB | MK]   Thema [Küche]                                               │
│ ‹ KW 45 ›  Mo 3.   Di 4.   Mi 5.   Do 6.   Fr 7.   Sa 8.                                   │
│            09:00   –       09:00   10:30   09:00   09:30                                   │  Slot-Chips ≥ 44 px am iPad
│            09:30           13:00   14:00   11:00                                           │
│ Wunschzeiten: „abends oder Samstag“ (aus Anfrage)  [Nur passende zeigen]                    │
│ Di 04.11. 14:00–15:00 · Showroom · L. Berger · Anfrage wird „Termin vereinbart“             │
│ ☑ Bestätigungsmail an f***@beispiel.invalid           [Abbrechen]  [Termin anlegen  ⌘↵]    │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

- **Vorbelegung:** Kunde aus Anfrage/Kundenakte; Art aus `ort_der_beratung`/`art` (Segment der 4 häufigsten aktiven Terminarten, Rest im Select, Quelle `get_terminarten("de")`); Berater = Zuständig; Thema aus `projektart`.
- **Schrittansicht nur, wenn nötig:** Kunde fehlt (Suche oder Vorname/Nachname*/E-Mail/Telefon/PLZ-Ort/Sprache) oder Vor Ort ohne Telefon/PLZ-Ort → Pflichtprüfung inline unter dem Feld, Raster erscheint erst danach.
- **Ausführung (E5):** mit Anfrage → `termin_vorschlagen(…)`; ohne Anfrage → Server Action `terminAnlegenAction`: (1) `get_freie_slots` genau für diesen Slot, (2) `insert PH Termin` (`status = Unbestaetigt`, `quelle = backoffice`, `kundenmail = backoffice`, `email_verifiziert = 1`, `kontakt`, `berater`, `thema`, `idempotency_key = a1:<kontakt>:<start>`), (3) `bestaetigen(mail)`. Kunde mit genau einer offenen Anfrage → Weg „mit Anfrage“ (Hinweiszeile „wird mit Anfrage Küche Lochau verknüpft“ [anderes]).
- **Mail-Haken:** sichtbar, wenn `email` vorhanden; Standard an; aus beiden Wegen gleich.
- **Fehler:** `slot_taken` → Chip rot durchgestrichen „Gerade vergeben – nächste freie: 14:30“, Raster bleibt · `rate_limited` → Band mit Countdown · Terminart ohne buchbaren Berater → „Für diese Terminart ist niemand buchbar.“ (Leitung: [Verfügbarkeit prüfen]) · keine aktive Terminart → Mitarbeiter „Es sind noch keine Terminarten eingerichtet – bitte Leitung fragen.“
- **Leer:** Woche ohne freie Zeit „Keine freien Zeiten in KW 45.“ [Nächste Woche] [Anderen Berater]. Kunde-Suche 0 → „Kein Kontakt gefunden.“ [Neu: ‚Keller‘].
- **Tastatur:** Pfeiltasten im Raster, Enter = Slot wählen (nur im Raster), `⌘/Strg+Enter` = Termin anlegen, Schrittansicht `Alt+1…3` rückwärts, `Esc` schließt (Entwurf 10 min in sessionStorage).
- **Erfolg:** Dialog schließt (120 ms `--bo-ease-in`), Toast „Termin für Familie Muster am Di 14:00 angelegt · Öffnen“, Kalender hebt den Block hervor (§ 2.8). Klicks im Dialog: Slot + Anlegen = 2.

### 5.6 Sheet „Wie geht es weiter?“ (Gespräch abschließen)

```
┌ Wie geht es weiter? ─────────────────────────────────────────────────────────────┐
│ [1 Planung beauftragen]        [2 Angebot erstellen]        [3 Nur abschließen]   │
│  legt ein Projekt an,           öffnet ein Angebot mit       Protokoll wird        │
│  Planer: [A. Berger ▾]          den Räumen als Vorschlag     abgeschlossen         │
│  Kosten*: (•) kostenlos                                                            │
│           ( ) Planungspauschale laut Angebot                                       │
│           ( ) nach Aufwand                                                         │
│ Vertrag kommt zustande: [Showroom ▾]  (Vorschlag aus Ort: Showroom)                 │
│                                         [Abbrechen]  [Planung beauftragen]          │
└──────────────────────────────────────────────────────────────────────────────────┘
```

- Tasten `1–3` wählen Kachel; Primärtext folgt der Wahl.
- **Planung beauftragen:** Kosten Pflicht (ohne Wahl Feldfehler „Bitte festlegen, ob die Planung etwas kostet.“). Ausführung `planung_beauftragen(planer)` + Kommentar „Planung: kostenlos | Planungspauschale | nach Aufwand · Vertragsort …“ (Felder B6). Pauschale/nach Aufwand → zusätzlich A2 mit Position „Planung“ und Anrechnungstext öffnen. Vertragsort Beim Kunden/Fernabsatz → Hinweis „Rücktrittsrecht 14 Tage; Planungsbeginn vor Fristende nur auf ausdrücklichen Wunsch des Kunden (§ 10 FAGG) – im Angebot bestätigen lassen.“ (RB).
- **Angebot erstellen:** Raumauswahl (alle angehakt) → A2 mit Positionsvorschlag je Raum (Freitext aus `wunsch`, `budget_cent` als Richtwert, `marken`), `?vertragsort=` (Mapping Ort → Showroom · Beim Kunden · Fernabsatz: Showroom → Showroom, Vor Ort → Beim Kunden, Video/Telefon → Fernabsatz). Danach `status_setzen Abgeschlossen` erst, wenn das Angebot angelegt ist (Rückkehr aus A2), sonst bleibt Offen.
- **Nur abschließen:** `status_setzen Abgeschlossen`, 8 s verzögert.

### 5.7 Schnell-Triage „Der Reihe nach durchgehen“

Sheet mit einer Karte je neuer Anfrage (Anliegen, Person, Uploads, Duplikat-Hinweis). Knöpfe mit Text und Taste (nur in diesem Sheet): `1` Annehmen + Termin · `2` Annehmen + Aufgabe · `3` Zuweisen · `4` Verloren (Grund-Popover) · `5` Spam · `→` Überspringen. Danach nächste Karte (160 ms, Versatz ≤ 16 px). Zähler „3 von 7“; Ende „Keine neuen Anfragen.“ Jede Aktion nutzt die Warteschlange (§ 2.4); `Esc` beendet, ausstehende Commits laufen weiter.

### 5.8 Kontakte zusammenführen (Leitung)

Start: Chip „1 ähnlicher“ oder `⋯`. Ansicht: zwei Spalten (Ziel | Quelle) mit Radios je abweichendem Feld (Standard: Ziel), Liste der Folgen („verschiebt 3 Anfragen, 2 Termine, 1 Rechnung“ aus `get_kundenakte` beider). **Sperre:** beide mit `ph_faktura_debitor_nr` → Knopf deaktiviert, Text „Beide Kontakte haben eine Debitornummer – zuerst in der Buchhaltung zusammenlegen, dann hier.“ Dialog sm „Muster Anna in Familie Muster zusammenführen? Nicht rückgängig zu machen.“ (Fokus Abbrechen) → `merge_kontakte(ziel, quelle, felder)`. Ergebnis: Toast + Weiterleitung auf Ziel; Fehler → „Nichts geändert: <Grund>“. Alternative für alle Rollen: [Sind verschiedene Personen] (`keine_dublette`) · Mitarbeiter: [Als Duplikat melden] (Aufgabe an Leitung mit beiden Links).

### 5.9 Rücktritt erfassen (Übergabe an Faktura)

Kundenakte `⋯` oder Telefonnotiz-Ergebnis „Rücktritt“:

```
┌ Rücktritt erfassen ───────────────────────────────────────────────────────────────────┐
│ Auftrag [AB-2026-00042 · Küche · Beim Kunden · Frist bis 18.11.2026 · fristgerecht]    │
│ Eingang [04.11.2026]   Weg [E-Mail ▾] (E-Mail · Brief · Telefon · Persönlich · Formular)│
│ Hinweis: Maßanfertigung – Ausnahme § 18 Abs 1 Z 3 FAGG prüfen (Leitung)                 │
│                                       [Abbrechen]  [An Faktura übergeben]              │
└───────────────────────────────────────────────────────────────────────────────────────┘
```

- Auswahl ABs des Kontakts mit `vertragsort` Beim Kunden/Fernabsatz; „fristgerecht“ aus `fagg_frist_ende` ≥ Eingang. Vertragsort Showroom → Hinweis „Kein gesetzliches Rücktrittsrecht – Kulanz?“, Weiter nur Leitung. Keine passende AB → Leer „Keine AB mit Rücktrittsrecht.“
- Ausführung bis DocType `PH Ruecktritt` (Anfrage an ph_faktura, I4): Kommentar an AB und Kontakt („Rücktritt eingegangen 04.11. per E-Mail“) + PH Aufgabe an Faktura-Leitung „Rücktritt prüfen – Erstattung bis 18.11.“ (Eingang + 14 Tage) + Band in der Kundenakte (§ 4.2, Quelle: offene Aufgabe dieser Art). Eingangsbestätigung an den Kunden über Composer-Vorlage „Rücktritt erhalten“. Keine Storno-/Gutschrift-Aktion im CRM.

### 5.10 Massenaktionen (Zusammenfassung)

| Liste | Aktionen | Bestätigung |
|---|---|---|
| Anfragen | Zuweisen · Status · Nachfassen am · Spam · Drucken (> 10 Leitung) · CSV (Leitung/GF) | Undo 8 s; Teilfehler-Liste |
| Kunden & Kontakte | Berater · An Marketing (§ 7.1) · Deaktivieren (Leitung) · CSV (Leitung/GF) | Undo bzw. Dialog |
| Termine | Bestätigen (ein Dialog für alle Mails) · Berater ändern · Tagesliste drucken | Dialog |
| Gespräche | Abschließen · Drucken | Undo |
| Datenschutz-Vorschläge | Endgültig löschen · Anonymisieren | Dialog mit Tippfeld |

Kopf-Checkbox = Seite, Banner „Alle 23 auswählen“; `Esc` hebt die Auswahl auf; `scroll-padding-bottom` = Höhe der Auswahlleiste + 16 px.

---

## 6. Kennzahlen, Verkaufsverlauf, Charts

### 6.1 Kennzahlen (`/crm`, je Rolle 4)

| Kennzahl | Quelle | Klick | Rolle |
|---|---|---|---|
| Offene Anfragen | `count PH Anfrage status in [Neu, Qualifiziert, Termin vereinbart, Angebot]` (Mitarbeiter + `zugewiesen_an = ich`) | Anfragen „Alle offen“/„Meine“ | alle |
| Termine 7 Tage | `count PH Termin status in [Unbestaetigt, Bestaetigt]`, `start` heute…+7, `berater = ich` | Termine Liste | Mitarbeiter |
| Offene Aufgaben | `count PH Aufgabe status in [Offen, In Arbeit]`, `zugewiesen_an = ich` | Aufgaben „Meine offen“ | Mitarbeiter |
| Reaktion Median (h, 30 Tage) | `kennzahlen.reaktionszeit_median_h` (Leitung); Mitarbeiter: Next-Median aus `erstreaktion_am − eingang` eigener Anfragen | Bericht Reaktionszeiten | alle |
| No-Show-Quote 90 Tage | `kennzahlen.no_show_quote_90_tage` | Bericht Termine je Berater | Leitung/GF |
| Neue Kunden Monat | `count PH Kontakt status = Kunde, kunde_seit` dieser Monat, Zusatz „manuell gepflegt“ bis A4 | Kunden & Kontakte „Kunden“ | Leitung/GF |

Kein Vorperioden-Pfeil ohne berechneten Vergleich. Gewonnen-Zahlen nur über `gewonnen_am` (vorhanden).

### 6.2 Verkaufsverlauf (Next-Zählung, `verkaufsverlauf.js`)

Zeitraum `von/bis`: Anfragen = `count PH Anfrage eingang` im Zeitraum, Status ≠ Spam · Termine = `count PH Termin start` im Zeitraum, Status ∉ Storniert/Abgelehnt · Gespräche = `count PH Beratungsgespraech datum` · Angebote = `count PH Angebot` (Erstelldatum im Zeitraum, Status ≠ Ersetzt, nur mit `anfrage` oder `kontakt`) · Aufträge = `count PH Auftragsbestaetigung` (Status ≠ Storniert). Fehlt ph_faktura: Stufen 4–5 „–“ mit Tooltip „Faktura nicht eingerichtet“. Klick je Stufe → Liste mit denselben Filtern (Listen-Filter = Zähl-Filter, Unit-Test).

### 6.3 Charts

Nur im Bericht „Übersicht“ (§ 3.10). Quelle Dashboard Charts der App (`PH Anfragen je Woche`, `PH Anfragen nach Art`, `PH Termine je Woche`, `PH Termine nach Modus`, `PH Reaktionszeit je Woche`, `PH No-Show-Quote je Berater`, `PH Aufgaben nach Status`) über `call frappe.desk.doctype.dashboard_chart.dashboard_chart.get`; Zeitraum ersetzt `timespan`. Komponenten `Charts.Balken/Linie` (ohne Bibliothek). Unter 20 Anfragen im Zeitraum: statt Charts Zeile „Für Diagramme sind noch zu wenige Anfragen im Zeitraum.“

---

## 7. Datenschutz und Recht im CRM

### 7.1 Übergabe an Marketing (TKG 2021 § 174, DSGVO Art. 21)

Dialog „An Marketing übergeben“: Kanal* (E-Mail · SMS/WhatsApp · Brief) · Zweck (newsletter · einladungen · whatsapp …).

| Kanal | aufgenommen, wenn | ausgeschlossen (mit Zähler) |
|---|---|---|
| E-Mail | `PH Einwilligung` mit `kontakt`, passendem `zweck`, `status = Bestaetigt` | „12 ausgeschlossen: keine Einwilligung“ · „3 ausgeschlossen: Widerspruch“ · „1 ausgeschlossen: anonymisiert“ |
| SMS/WhatsApp | `PH Einwilligung zweck = whatsapp`, Bestaetigt | wie oben |
| Brief | `nicht_kontaktieren = 0`, Adresse vorhanden, nicht anonymisiert | „3 ausgeschlossen: Widerspruch“ · „2 ausgeschlossen: keine Anschrift“ |

Zähler kommt vom Server (Server Action zählt mit denselben Filtern wie die Übergabe). Übergabe = Zielgruppe in ph_marketing (Abhängigkeit Marketing); das CRM versendet nie selbst Werbung.

### 7.2 Auskunft (Art. 15) – Druckseite `/crm/datenschutz/[name]/auskunft`

1. `export_kontakt_daten(kontakt)` → JSON-Datei (privat, an Datenschutzanfrage) → `getFile` → Abschnitte.
2. Ergänzt mit Leitungs-Sitzung: `PH Kontakt.notizen`, `notiz_intern` aller PH Termin und PH Beratungsgespraech des Kontakts, `ip_hash` (Anfrage, Termin, Kontakt; Text „pseudonymisierter Netzwerkkennwert“), Dateiliste (`File` an Kontakt und Bezügen: Name, Datum, Größe), Datensätze ohne `kontakt`-Link mit gleicher E-Mail/Telefon (Anfragen, Termine) als Abschnitt „ohne Zuordnung gefunden“.
3. Metadaten-Block (`texte.js` + PH Firma): Verantwortlicher, Zwecke, Kategorien, **Empfänger** (Hersteller, Spedition/Montagepartner, Steuerberatung, Zahlungsdienst), Speicherdauer, **Herkunft** (`quelle`, `sync_quelle`), Rechte (Berichtigung, Löschung, Einschränkung, Widerspruch, Übertragbarkeit), **Beschwerderecht** (Österreichische Datenschutzbehörde), keine automatisierte Entscheidung. (RB)
4. Prüfen/Schwärzen: je Passage Knopf „Schwärzen“ → Dialog Begründung* (Art. 15 Abs 4 – Rechte Dritter/Geschäftsgeheimnis); Schwärzungen als Kommentar an der Datenschutzanfrage protokolliert.
5. Versand: E-Mail (PDF-Anhang über Composer) · Brief (Druck, Versand im Kommentar) · persönliche Abholung (Identität prüfen). Danach `abschliessen(ergebnis)`.
Technische Felder (`portal_token_hash`, `idempotency_key`, `verify_hash`, `manage_hash`) erscheinen nie.

### 7.3 Löschung und Aufbewahrung (Vorschlag; Inhaber + RB/StB entscheiden, I3)

| Datenart | Frist | Umsetzung jetzt (Backoffice) | Ziel (ph_crm, A2) |
|---|---|---|---|
| Anfrage Spam | 30 Tage nach `verloren_am` | Vorschlagsliste + Endgültig löschen (Leitung) | Task `anfragen_spam_loeschen` |
| Anfrage Verloren ohne Belege | 24 Monate | Vorschlagsliste + Anonymisieren | Task anonymisiert |
| Interessent ohne Vorgang/Einwilligung | 36 Monate seit `letzter_kontakt` | Vorschlagsliste → Löschplan → `anonymize_kontakt` | Vorschlagsliste serverseitig |
| Kontakt mit Belegen | 7 Jahre ab Ende Kalenderjahr letzter Beleg (BAO § 132) | `get_loeschplan` zeigt `aufbewahren_bis`; nur Anonymisieren der nicht belegpflichtigen Teile (`anonymize_kontakt`), Rest durch Task `dsgvo_fristen` | Feld `eingeschraenkt` (Art. 18) |
| Uploads der Website | laut Website-Text nach Linkablauf, außer für Auftrag benötigt | Hinweis in Anfrage-Akte „Dateien werden am … gelöscht“ erst mit Task | Feld `uploads_behalten` + Task |
| Website-Termin verfallen | 30 Tage | – | Task |
| `ip_hash` | 6 Monate | – | Task leert Feld |

### 7.4 Weitere Rechtsregeln in der Oberfläche

- **Informationspflicht** bei Backoffice-Erfassung (Art. 13/14): Feld „Datenschutzhinweis“ in der Schnellanlage (§ 3.3).
- **Freitextfelder** (`notizen`, `notiz_intern`, `budget_hinweis`, `storno_grund`, Kommentare): Hinweis unter dem Feld (§ 4.4); Sperrgrund nur als Auswahl; Anrede optional, Konditionen nie an Anrede/Geschlecht (GlBG).
- **Sammeldruck** > 10 nur Leitung, protokolliert; CSV nur mit `export`-Recht, protokolliert.
- **Geburtstag** nur mit `geburtstag_einwilligung` (Server erzwingt).
- **Portal-Zugang** ohne E-Mail nur per Zugangsbrief.
- **FAGG:** Vertragsort-Vorschlag (§ 5.6), Rücktrittsfrist-Band (§ 4.2), Rücktritt erfassen (§ 5.9).

---

## 8. Druck / PDF

| Druck | Druckformat | Format | Auslöser | Regel |
|---|---|---|---|---|
| Anfrage-Übersicht | `PH Anfrage Übersicht` | A4 hoch | Anfrage `⋯`/`⌘P`, Massenaktion | Sammel > 10 nur Leitung |
| Terminbestätigung | `PH Termin Bestätigung` | A4 Brief | Termin `⋯`; Angebot bei Kunden ohne E-Mail | ohne Anschrift Hinweis |
| Gesprächsprotokoll | `PH Beratungsgespraech Protokoll` | A4 | Protokoll `⋯`, `protokoll_senden` | `notiz_intern` nie |
| Datenauskunft | Druckseite § 7.2 (Browser-Druck) | A4 | Datenschutzanfrage | vollständig nach § 7.2 |
| Wochenplan | Browser-Druck | A4 quer | Kalender `⋯` | Berater × Tag |
| Tagesliste Berater | Browser-Druck | A4 hoch | Mein Tag `⋯` | inkl. „Ohne E-Mail: 2 – anrufen“ |
| Portal-Zugangsbrief | Browser-Druck (nicht gespeichert) | A4 | Portal-Dialog | ein Exemplar |
| Brief an Kontakt | Browser-Druck mit Briefkopf | A4 | Composer bei Brief | Versand als Kommentar |
| Adressetikett | `PH Kontakt Etikett` (99 × 38 mm, Anfrage B14) | Etikett | Kundenakte `⋯` | bis dahin ausgeblendet |

PDF-Pfad wie 05 § 10: `/druck/[doctype]/[name]?format=` → `getPdf` (Stream), Vorschau im Drawer 640 px, Knöpfe Drucken · Herunterladen · Per E-Mail senden. Ab 1 s „PDF wird erzeugt …“ mit unbestimmtem Balken.

---

## 9. iPad und Telefon

| Gerät | Zielaufgabe | Anpassung |
|---|---|---|
| iPad quer (≥ 1024), Showroom | Protokoll vor dem Kunden | Seitenleiste eingeklappt, Kundenansicht, Raum-Chips 44 px, Diktat-Hinweis beim ersten Mal, Kamera + Fotos, Offline-Entwurf |
| iPad quer | Listen | 4 Prioritätsspalten (§ 3.2), Zeilenaktion immer sichtbar, Vorschau statt Akte |
| iPad hoch | Kalender | Tagesansicht je Berater Standard, Woche waagrecht scrollbar; kein Drag |
| Telefon (< 640), Berater unterwegs | Mein Tag, Vor-Ort-Termin, Anrufen, Protokoll | `/crm` als Karten; Termin-Karte: Anrufen · Route (Objektadresse, sonst „Route (nur Ort bekannt)“) · Protokoll schreiben; Kundenakte einspaltig (Offen, Aktivität, Kontakt), Details als Bottom-Sheet |
| Telefon, Messe | Schnellanfrage | `+` → einspaltig, `quelle = messe`, Visitenkarte fotografieren (Datei an Anfrage; Hinweis „Nur die Karte der Person fotografieren.“) |

**Wischen** (Listen, app-weit beantragt): rechts = Primäraktion der Zeile (Fläche `ok-soft` mit Text, z. B. „Annehmen“), links = Mehr (Zeilenmenü als Bottom-Sheet); Schwelle 30 % Breite, Rückfedern 200 ms `--bo-ease-out`; sichtbare Alternative immer vorhanden. **Bottom-Sheet** < 640 px: Griff 32 × 4, Schließen per Wischen nach unten **und** Knopf „Fertig“. Treffflächen ≥ 44 × 44.

---

## 10. Automationen (vorhanden in ph_crm, Stand 04.11.)

| Wann | Funktion | Wirkung | Im Backoffice sichtbar |
|---|---|---|---|
| stündlich | `termin_erinnerungen` | Erinnerungsmail vor bestätigten Terminen | Aktivität „Erinnerung gesendet“; Tagesliste „ohne E-Mail – anrufen“ |
| stündlich | `termine_ohne_abschluss` (R3, `auto_termin_abschluss`) | Benachrichtigung Berater | Glocke mit [Protokoll schreiben]; Zu erledigen „Protokoll“ |
| alle 10 min | `reservierungen_freigeben` | Website-Reservierung ohne E-Mail-Bestätigung → Abgelehnt („Verfallen“) | ausgeblendet; Leitung Zähler „verfallen (7 Tage)“ in Termine-Liste |
| 07:30 Mo–Fr | `unbeantwortete_anfragen` | Anfrage Neu > Stunden → Aufgabe (Hoch) | Aufgabe „automatisch“ |
| 07:30 Mo–Fr | `ruhende_anfragen` (R2, `auto_ruhend`) | Aufgabe „Nachfassen (Status)“ | Nachfass-Aufgabe; Kanban „ruht seit …“ |
| 07:00 | `aufgaben_erinnerungen` | Benachrichtigung je fälliger Aufgabe | Glocke, Heute-Zeile |
| 07:00 | `wiedervorlagen_faellig` (R1) | – (Felder bleiben leer, E2) | – |
| 17:00 Mo–Fr | `vortagesuebersicht` (R6, `auto_vortag`) | Benachrichtigung je Berater „Morgen 3 Termine …“ | Glocke |
| täglich | `dsgvo_fristen` | Fristhinweis Datenschutzanfragen; Rest-Anonymisierung nach `aufbewahren_bis` | Glocke, Heute-Zeile Leitung |
| täglich | `meet_raeume_aufraeumen` | Meet-Räume löschen | – |
| Ereignis | `nicht_erschienen` → No-Show-Aufgabe (R4, `auto_no_show`) | Aufgabe +1 Tag | Zu erledigen |
| Ereignis | `create_anfrage` → `duplikat_von` (R8, `auto_duplikat`) | Kommentar + Feld | Band „Mögliches Duplikat“ |
| Ereignis | `als_kunde_markieren` → Anfragen Angebot → Gewonnen (R7, `auto_gewonnen`) | Status | Vorgangsleiste |
| Ereignis | `kommunikation_an_kontakt`, `event_geloescht`, `verify_termin` (manuelle Terminart → Team-Aufgabe) | – | Aktivität, Zu erledigen |

Neu gewünscht (Anfragen § 16): R9 „Anzahlung 7 Tage nach AB nicht eingegangen → Aufgabe an `PH Auftragsbestaetigung.zugewiesen_an`“ (ph_faktura-Ereignis).

---

## 11. Leer- und Fehlerzustände (Sammelliste, Darstellung 03 § 8.18)

| Ort | Fall | Text | Aktion |
|---|---|---|---|
| Heute-Zeile | alles 0 | „Heute nichts Dringendes.“ | – |
| Zu erledigen | leer | „Alles erledigt.“ (Häkchen) | – |
| Mein Tag | leer | „Heute keine Termine. Nächster: …“ / „Keine Termine geplant.“ | Link |
| Kennzahl | keine Daten | „–“, Tooltip „Noch keine Werte“ | – |
| Anfragen | leer / gefiltert / neu leer | § 3.2 | – |
| Anfrage Uploads / Produkte / Aktivität | 0 | „Keine Dateien.“ / „Keine Produkte aus der Merkliste.“ / „Noch keine Aktivität.“ | – |
| Kanban-Spalte | leer | „Keine Einträge“ | – |
| Vorschau | Laden/Fehler/weg | Skeleton / Fehlerblock / „Gibt es nicht mehr“ | Erneut |
| Kontakte | leer / gefiltert / Suche 0 | § 3.5 | anlegen |
| Termine Woche / Monat / gefiltert / ohne Protokoll | leer | § 3.6 | – |
| Tagesansicht Berater | ohne Verfügbarkeit | „Keine Verfügbarkeit hinterlegt“ | Leitung: eintragen |
| Termin-Akte Website-Buchung | Backoffice-Termin | Tab ausgeblendet | – |
| A1 | keine Slots / keine Terminart / Kunde 0 | § 5.5 | – |
| Gespräche | leer / gefiltert / Schritt fällig | § 3.8 | – |
| Protokoll Räume / Fragen | leer | § 3.8 | – |
| Kundenakte | Offen / Gesprächsstand / Adressen / Beteiligte / Einwilligungen / Dateien / Zeitleiste gefiltert | § 4.3/§ 4.4 | – |
| Berichte | ohne Recht / ohne Daten / zu wenige Anfragen | § 3.10/§ 6.3 | – |
| Massenaktion | 0 von n möglich | § 3.2 | deaktiviert mit Grund |
| Datenschutz | keine Anfragen / keine Vorschläge | „Keine Datenschutzanfragen.“ / „Nichts zur Löschung vorgeschlagen.“ | – |
| Einstellungen | keine Terminart / keine Verfügbarkeit | § 3.12 | anlegen |
| Telefon `/crm` | beides leer | „Heute keine Termine, keine neuen Anfragen.“ | [Anfrage erfassen] |

**Fehlerfälle zusätzlich:** Duplikatprüfung nicht möglich (muted, Anlegen erlaubt) · `rate_limited` Slots (Countdown) · Verfügbarkeit nicht geladen (Band) · Reservierung abgelaufen (Band mit Folgeaktion) · Mail nach Undo-Ablauf fehlgeschlagen (Glocke + Aktivität) · Autosave (§ 2.7) · Foto-Upload (Kachel) · Zusammenführen („Nichts geändert: …“) · Kanban-Drop während laufendem Commit (Warteschlange) · Portal-Dialog `Esc` (Zwischenfrage) · Serverfehlertexte nie roh (Übersetzung in `fehler.js`: „Mindestens E-Mail oder Telefon ist nötig.“ → „Bitte E-Mail oder Telefon angeben.“, „Termin nicht möglich: Zeit bereits belegt“ → Slot-Text, „E-Mail … ist bereits bei Kontakt …“ → Feldfehler mit Link).

---

## 12. Datenmapping UI → Frappe (Stand ph_crm 04.11.)

Lesen `getList`/`getDoc`/`getDocMitInfo`/`count`/`call`, Schreiben `setValue`/`insert`/`save`/`runDocMethod`/`workflowAction`. Spalte „Lücke“ verweist auf § 16.

| UI-Funktion | DocType / Methode | Lücke |
|---|---|---|
| Anfragen-Liste, Zu erledigen | PH Anfrage `getList` (name, titel, art, status, prioritaet, eingang, quelle, kanal, vorname, nachname, firma, email, telefon, plz_ort, zugewiesen_an, naechster_schritt, upload_anzahl, erstreaktion_am, duplikat_von, kontakt, folgedokument*) + PH Aufgabe (Nachfassen) + PH Termin (abgeleiteter Status) | geteilte Ansichten (ph_core) |
| Annehmen / Spam / Verloren / Gewonnen / Zurück | `workflowAction Qualifizieren`, `als_spam`, `als_verloren`, `als_gewonnen`, `workflowAction Zurück auf Neu` | B1 |
| Anfrage anlegen | `insert PH Anfrage` | B2, B11 |
| Kunde zuordnen | `call ph_crm.api.find_duplicates`, `kontakt_anlegen`, `setValue kontakt` | B3 |
| Termin aus Anfrage | `termin_vorschlagen(start, dauer_min, modus, terminart, berater, thema, mail)` | – |
| Termin ohne Anfrage | `get_freie_slots` + `insert PH Termin` + `bestaetigen` | B10 |
| Uploads | `File attached_to_doctype = PH Anfrage` | A2 |
| Kontakte-Liste | PH Kontakt `getList` (titel, kontaktart, status, plz, ort, berater, letzter_kontakt, letzter_kontakt_art, nicht_kontaktieren, portal_aktiv, firma_kontakt, anonymisiert_am) | – |
| Kontakt anlegen | `call ph_crm.api.create_kontakt(…, trotzdem)` | – |
| Kundenakte Kopf/Übersicht | `call ph_crm.api.get_kundenakte(kontakt)` | A3 (`zahlen` nicht genutzt) |
| Zeitleiste | `call ph_crm.api.get_zeitleiste(kontakt, vor, limit)` | – |
| Zahlen | `getList` PH Auftragsbestaetigung/PH Rechnung (ph_faktura) | A3 |
| Ähnliche / Zusammenführen / verschieden | `find_duplicates`, `merge_kontakte`, `keine_dublette` | A7 |
| Kontakt-Status | `workflowAction`, `als_kunde_markieren(grund)` | A4, B13 |
| Portal | `portal_zugang_erzeugen`, `portal_sperren` | – |
| Widerspruch | `widerspruch_erfassen(quelle)`; Aufheben `setValue` + Kommentar | A8 |
| E-Mail | `PH Kontakt.mail_senden(betreff, nachricht, an, vertragsbezogen, email_template)` | – |
| Datenschutzanfrage | `insert PH Datenschutzanfrage`, `bearbeiten`, `auskunft_erstellen`, `loeschplan_erstellen`, `loeschung_ausfuehren`, `abschliessen`, `ablehnen` | – |
| Auskunft | `export_kontakt_daten` + `getFile` + permlevel-1-Felder + Metadaten | A1 |
| Löschung | `get_loeschplan`, `anonymize_kontakt(kontakt, bestaetigung)`, `delete PH Anfrage` (Spam, Leitung) | A2 |
| Kalender | `call ph_crm.ph_crm.doctype.ph_termin.ph_termin_kalender.get_events(start, end, filters)` + PH Verfuegbarkeit + PH Termin Einstellungen | Ebenen (Projekte/Service/Personal) |
| Freie Zeiten / Terminarten | `call ph_crm.api.get_freie_slots`, `get_terminarten` | – |
| Termin-Aktionen | `bestaetigen`, `absagen`, `umbuchen`, `erledigt_mit_protokoll`, `nicht_erschienen`, `wieder_bestaetigen`, `meet_link_erzeugen`, `serie_anlegen`, `serie_stornieren`, `kontakt_anlegen` | B7 |
| Gespräch | PH Beratungsgespraech `getDoc`/`save` (Kinder `raeume`, `fragen`), `status_setzen`, `aufgabe_anlegen`, `vorlage_anwenden`, `protokoll_senden`, `planung_beauftragen(planer)` | B6 |
| Aufgaben | PH Aufgabe `getList`, `insert`, `setValue faellig/zugewiesen_an`, `status_setzen(status, ergebnis)`, `verschieben(tage)` | B9 |
| Verfügbarkeit | PH Verfuegbarkeit `insert`/`setValue`/`delete` | – |
| Einstellungen | PH Termin Einstellungen (Single) `getDoc`/`save`, PH Terminart, Email Template | – |
| Kennzahlen | `count`, `call ph_crm.ph_crm.kennzahlen.*` | – |
| Charts / Berichte | `dashboard_chart.get`, `getReport` | A3, B8 |
| Badge | zwei `count` | – |
| Marketing-Übergabe | `getList PH Einwilligung` (ph_marketing) + Zielgruppe ph_marketing | Abhängigkeit Marketing |
| Druck | `getPdf(doctype, name, {format})` | B14 |

---

## 13. Randfälle (fachlich)

| Fall | Verhalten |
|---|---|
| AB storniert nach „Gewonnen“ | Leitung: „Auftrag storniert“ (§ 5.1); `kunde_seit` bleibt; Verkaufsverlauf zählt AB ≠ Storniert |
| Termin storniert nach Annahme | „Termin entfallen“ + „Neuen Termin anlegen“ (E1) |
| Website-Absage während Backoffice-Umbuchung | `conflict` → „Kunde hat inzwischen abgesagt.“ |
| Mehrere Angebote/Versionen | Bezug listet alle, zählt letzte (§ 3.4) |
| Auftrag nur für einen von drei Räumen | Folgeanfrage-Frage beim Gewinnen (§ 5.1) |
| Teillieferung | „Offen jetzt“ zeigt Teillieferstand (§ 4.3) |
| Anzahlung über Kassa | Zahlungen-Abschnitt mit Kennzeichen „Kassa“, Soll/Ist nur aus AB (keine Doppelzählung) |
| Rücktritt | § 5.9 |
| Reklamation am Telefon | Telefonnotiz-Ergebnis „Reklamation“ → Servicefall |
| Kunde aus CH/DE/FL | Land in Details sichtbar und editierbar; „CH-9000 St. Gallen“ setzt bis B4 kein Land → Hinweis in der Anfrage „Land prüfen“, wenn `plz_ort` mit „CH-/D-/DE-/FL-“ beginnt oder Telefon mit +41/+49/+423 |
| Beträge in CHF | je Währung getrennt, nie umgerechnet (§ 4.5) |
| Telefon-Anfrage ohne E-Mail für Stammkunden | Zuordnen über `find_duplicates(telefon)` (normalisiert über `telefon_norm`); `kontakt_anlegen` legt ohne E-Mail sonst neu an → UI ruft immer zuerst `find_duplicates` und bietet den Treffer an (B3) |
| Ehepaar mit gemeinsamer E-Mail | E-Mail eindeutig (Server) → zweite Person ohne E-Mail + Beteiligte-Rolle „Entscheider“ (I1) |
| Kunde nur mit Postanschrift | E15 |
| Termin bestätigen ohne E-Mail | Toast + Aufgabe + Brief-Druck (§ 5.2) |
| Erinnerung ohne E-Mail | Tagesliste „ohne E-Mail – anrufen“ |
| Auskunft/Protokoll ohne E-Mail | Versandweg Brief/persönlich |
| `kommunikation_bevorzugt = Brief` | Composer öffnet Brief |

---

## 14. Was hier anders ist als in klassischer Branchensoftware

1. **Eine Arbeitsliste „Zu erledigen“** statt Posteingang, Wiedervorlagenliste und Terminliste nebeneinander; jede Zeile mit genau einer Aktion.
2. **Anfrage als Vorgang mit Vorgangsleiste** Anfrage → Termin → Gespräch → Angebot → Auftrag; der angezeigte Stand folgt den echten Folgeobjekten.
3. **Online-Buchung und Backoffice-Kalender sind dieselben Daten**; Verschieben prüft den Slot serverseitig und hält Kundenlinks gültig.
4. **Kundenakte über alle Bereiche** mit einer Zeitleiste und Eigenschaften rechts – am Telefon lesbar.
5. **Gesprächsprotokoll am iPad mit Kundenansicht**, Fotos, Diktat, Vorlagen-Fragen und Offline-Entwurf; ein Knopf führt zu Planung oder Angebot inklusive Kosten- und Vertragsort-Weiche.
6. **Rückgängig statt Rückfragen**; Dialoge nur, wenn Mails rausgehen, Pflichtangaben nötig sind oder etwas endgültig ist.
7. **Datenschutz als Ablauf**: Datenschutzanfrage mit Frist, vollständige Auskunft, Löschplan mit Aufbewahrungsfristen, Werbung nur mit Einwilligung je Kanal.

---

## 15. Nicht mehr enthalten (bewusst gestrichen)

8–10 Kennzahl-Karten und 6 Charts am Bereichsstart · Wort „Posteingang“, „Qualifizieren“, „Trichter“, „Peek“, „Studio“ · Phasenleisten je Objekt · Abschnitt „NÄCHSTER SCHRITT“ in der rechten Spalte · Wiedervorlage-Felder als eigener Mechanismus · Warnband „Keine Kontaktmöglichkeit“ · Q2 (nicht erreichbarer Zustand) · Ziehen der Termindauer · Kanban-Drop auf Erledigt/Nicht erschienen · Monat per Taste `m` · Kürzel `c`, `p`, `k`, `Alt+←/→`, `g a/g t/g p`, `⇧⏎`, `⌘Backspace`, `+`, `r`, `v`, `.` · Hover-only zweite Tabellenzeile · Wischen „rechts = Wiedervorlage“ · Kalender-Drag am Touchgerät · Puls-Skalierung mit Spring · Donut mit 7 Anteilen · Tab „Daten“ und 12 Tabs der Kundenakte · Tab „Intern“ für Faktura · Empfehlung „notiz_intern auf permlevel 1“ (war schon so) · Gesprächs-Tabs und Status „Angebot“ am Gespräch · A-CRM3 als 4-Schritt-Assistent · Zusammenführen per Client-Folge (`set_value` + `rename_doc`) · Serienbrief/-mail „an alle ohne Widerspruch“ · DSGVO-Auskunft ohne Notizen · Report-Beträge (`gesamt_cent`) · Kennzahl „Gewonnen (Quartal)“ über `modified` · Spalte „Letzter Kontakt = modified“ · Fußzeile „Summe sichtbar“ · Emoji in Wireframes und Oberfläche · eigene CRM-Aufgabenseite.

---

## 16. Anfragen an andere Stellen und Inhaber-Entscheidungen

**A – ph_crm, Priorität A (Recht/Falschdaten):**
| # | Inhalt |
|---|---|
| A1 | `dsgvo.auskunft` und `PH Kontakt.datenauskunft`: permlevel-1-Felder (`notizen`, `notiz_intern` von Termin/Gespräch) und `ip_hash` aufnehmen; Dateiliste; Datensätze ohne `kontakt` über E-Mail/Telefon; Metadaten Empfänger, Herkunft, Beschwerderecht; Schwärzung mit Begründung als Teil der Datenschutzanfrage |
| A2 | Löschläufe: Spam 30 Tage (inkl. Files), Verloren 24 Monate anonymisieren, Uploads nach Website-Frist + Feld `PH Anfrage.uploads_behalten` (automatisch bei Termin/Angebot/Projekt), verfallene Website-Termine 30 Tage, `ip_hash` 6 Monate; Feld `PH Kontakt.eingeschraenkt` (Art. 18: aus Listen, Suche, Marketing ausblenden); Vorschlagsliste Interessenten 36 Monate |
| A3 | `ph_vertriebscockpit.py` und `kontakt360._zahlen`: `gesamt_cent` → `netto_cent` (Angebot, AB) bzw. `offen_cent`/`brutto_cent` (Rechnung); Filter AB ≠ Storniert, Angebot ≠ Ersetzt; Gruppierung je `waehrung`; Bezeichnung „Auftragseingang netto“; Umsatz nur aus Rechnungen − Gutschriften |
| A5 | PH Termin `on_update` Storniert/Abgelehnt/Nicht erschienen → Anfrage zurück auf Qualifiziert, wenn kein weiterer aktiver Termin, + Kommentar |
| A7 | `dubletten.zusammenfuehren`: Sperre bei zwei `ph_faktura_debitor_nr` bzw. exportierten Belegen (`PH Export Lauf`) |
| A8 | `PH Kontakt.widerspruch_aufheben(notiz)` (Leitung, protokolliert) |

**B – ph_crm, Priorität B:**
| # | Inhalt |
|---|---|
| B1 | Workflow PH Anfrage: Neu → Verloren, Neu → Termin vereinbart, Qualifiziert → Spam, Gewonnen → Verloren („Auftrag storniert“, Leitung), Qualifiziert → Neu auch für Mitarbeiter ohne Folgedokument; `verloren_grund` „Storno nach Auftrag“; Fixtures Workflow State „PH Neu“, „PH Erledigt“, „PH Storniert“, „PH Abgelehnt“, „PH Gesperrt“, Action Master „Stornieren“, „Ablehnen“, „Sperren“, „Reaktivieren“ inkl. Filter in `hooks.py` |
| B2 | `PH Anfrage.validate`: E-Mail oder Telefon oder vollständige Anschrift; Feld `strasse` |
| B3 | `finde_oder_lege_an`: Suche über `dubletten.kandidaten` (Telefon normalisiert, Name + PLZ) statt nur E-Mail; bei „wahrscheinlich“ Treffer zurückgeben statt neu anlegen |
| B4 | `plz_ort_teilen`: Präfix CH-/D-/DE-/FL- → `land`; PH Kontakt `waehrung_standard`, `steuerstatus` (Inland · EU Privat · EU Unternehmen · Drittland), `uid_geprueft_am` |
| B6 | PH Beratungsgespraech `abschlusskanal` (Showroom · Beim Kunden · Fernabsatz), `planung_entgelt` (kostenlos · pauschal · nach Aufwand), `waehrung`; PH Beratungsgespraech Raum `ergebnis` (offen · beauftragt · verloren · später) |
| B7 | `PH Termin.umbuchen(neuer_start, berater=None, dauer_min=None)` mit Slot-Prüfung |
| B8 | Verfallene Reservierungen: eigener Kennwert (z. B. Status „Verfallen“) oder Report `PH Termine je Berater` filtert `storno_grund = E-Mail nicht bestätigt` aus „abgelehnt“ |
| B9 | `PH Aufgabe.quelle` Option „wiedervorlage“ (eindeutige Nachfass-Aufgabe) |
| B10 | Whitelisted `ph_crm.api.termin_anlegen(…)` für Backoffice-Termine ohne Anfrage mit `slot_pruefen(for_update=True)` und Mail-Parameter |
| B11 | `PH Anfrage.datenschutzhinweis` (Select: Website-Formular · mündlich · Aushang · per Mail nachgereicht · offen) + `datenschutzhinweis_am` |
| B12 | `PH Anfrage Produkt.produkt` Link(PH Produkt), bei `create_anfrage` per Slug auflösen |
| B13 | PH Kontakt `sperrgrund` (Select), `gesperrt_am`, `gesperrt_von` |
| B14 | Druckformat `PH Kontakt Etikett` (99 × 38 mm) |
| B15 | `verify_termin`: Kontakt per Dublettensuche verknüpfen (Website-Termine erscheinen sonst nicht in Kundenakte und Auskunft) |

**C – andere Apps:**
| Stelle | Inhalt |
|---|---|
| ph_faktura (A4) | `doc_events`: erste PH Auftragsbestaetigung ≠ Offen/Storniert und `PH Rechnung on_submit` mit `kontakt` → `PH Kontakt.als_kunde_markieren(grund)`; `PH Angebot after_insert` mit `anfrage` → Anfrage „Angebot“ + `folgedokument`; AB-Storno → Anfrage Verloren („Storno nach Auftrag“); R9 Anzahlung überfällig → Aufgabe; DocType `PH Ruecktritt` (I4); `ust_fall` „Ausfuhr“ auch in Angebot/AB |
| ph_kassa | Kassenbeleg mit `kontakt` → `als_kunde_markieren` |
| ph_marketing | Zielgruppen-Übergabe aus CRM-Auswahl (Kanal, Zweck, Kontaktliste) |
| ph_core | `PH Ansicht` (geteilte Listenansichten); `feiertage(jahr)` |
| ph_projekte, ph_service, ph_personal | Kalender-Ebenen mit `kontakt`/`berater` lesbar; genehmigte Abwesenheiten blockieren Berater-Slots |
| Fundament | F2 verzögerter Commit + `/api/undo-commit` + Warteschlange je Datensatz (`flush`); F3 Kürzel-Registry mit Abschalter; F5 Glocke mit Inline-Aktionen; F6 `Kalender` (`role="grid"`), `Slotraster`, `Sheet`, `SidePeek`; Shell: Kundenansicht-Modus (Toasts zurückhalten), Toast-Hold-API; 02-Ausnahmen Telefon (E20) und Wischregel; Status-Ton Termin „Bestätigt“ türkis in 03 |
| Zentrale | übernimmt `zuErledigen(session)` des CRM in „Zu erledigen“; Aufgaben-Seite mit `?bereich=crm` und Ansicht „Nachfassen“ |

**D – Inhaber-Entscheidungen:**
| # | Frage | Vorschlag |
|---|---|---|
| I1 | Kontakt = Person oder Haushalt | Person; Partner als Beteiligte |
| I2 | Planung kostenpflichtig, Anrechnung bei Auftrag | entscheidet Vorbelegung im Sheet |
| I3 | Löschfristen (§ 7.3) mit RB/StB | Vorschläge bestätigen |
| I4 | Wo lebt der Rücktritt | ph_faktura |
| I5 | Bestandskunden-Werbung per E-Mail (§ 174 Abs 4) | nein, nur Einwilligung |
| I6 | Schwellen ruhende Anfrage (Standard 1/7/14/21 Tage) und Reaktionsziel `ziel_h` | 24 h an Werktagen |
| I7 | Sehen Mitarbeiter Berichte anderer Berater | nein (nur eigene Zeilen) |

---

## 17. Bauauftrag (Fachbereichs-Agent „CRM“)

Regeln: nur in `backoffice/`; keine Laufzeit-Importe aus `../src/`; Backend-Import nur lesen; jede Seite läuft im Mock-Modus (Seed ergänzen); keine Geheimnisse; Texte über `texte.js`.

### 17.1 Dateien und Routen (`backoffice/`)

```
src/app/crm/
  layout.js                          Unternavigation (bereiche.js), keine Sitzungsprüfung im Layout
  page.js  loading.js                Übersicht § 3.1
  anfragen/page.js  anfragen/loading.js  anfragen/neu/page.js  anfragen/[name]/page.js
  kontakte/page.js  kontakte/loading.js
  termine/page.js  termine/loading.js  termine/neu/page.js  termine/[name]/page.js
  gespraeche/page.js  gespraeche/[name]/page.js
  datenschutz/page.js  datenschutz/[name]/page.js  datenschutz/[name]/auskunft/page.js (Druckseite)
  berichte/page.js  berichte/[report]/page.js
  einstellungen/page.js              Reiter ?tab=verfuegbarkeit|terminarten|buchung|oeffnung|emails|video|automationen|datenschutz
  verfuegbarkeit/page.js             redirect 307 → einstellungen?tab=verfuegbarkeit
src/app/kunden/[kontakt]/page.js  loading.js   Kundenakte § 4 (?tab=, ?zl=)
src/app/druck/crm/{wochenplan,tagesliste,portalbrief,brief}/page.js   Browser-Druckseiten
src/app/api/crm/zeitleiste/route.js   GET Seiten der Zeitleiste (requireApiSession)
src/app/api/crm/slots/route.js        GET freie Zeiten (Cache 30 s je Woche/Terminart/Berater)
src/components/Backoffice/Crm/        Liste § 17.2
src/lib/backoffice/crm/
  actions.js          "use server" – alle Mutationen § 17.3
  daten.js            server-only Lesefunktionen (Listen, Akten, Zählungen, Kalender)
  vorgang.js          abgeleiteter Status, Vorgangsleiste (rein, unit-getestet)
  zuErledigen.js      Zeilen-Bausteine (auch für Zentrale)
  status.js           Statustöne, Anzeige „Verfallen“, „Termin entfallen“ (rein)
  texte.js            Glossar, Leer-/Fehlertexte, Erstbesuch, Metadaten Auskunft, Vertragsort-Mapping
  fehler.js           Übersetzung Servertexte → Oberfläche (rein)
  kuerzel.js          Kürzel-Registry-Einträge
  marketingFilter.js  Kanal-/Einwilligungsregeln § 7.1 (rein)
  zahlen.js           Faktura-Summen je Währung (server-only)
  verkaufsverlauf.js  Zählfilter § 6.2 (Filter rein, Zählung server-only)
  auskunft.js         Zusammenbau § 7.2 (Abschnitte, Schwärzungen)
  loeschvorschlag.js  Filter § 7.3 (rein)
  nachfassen.js       Nachfass-Aufgabe finden/anlegen/verschieben (E2)
  slots.js            Slot-Cache + Rate-Limit-Schutz
src/lib/backoffice/mock/   Seed-Ergänzung CRM (über bestehende Erweiterungsstelle in seed.js)
hilfe/crm/*.md             9 Hilfe-Artikel § 2.6
tests/unit/backoffice-crm-*.test.mjs   tests/e2e/crm.spec.js
```
Einträge: `bereiche.js` (`crm.navigation`, `ROUTEN`), `suche.js` (`SCHNELLAKTIONEN`: „> anfrage“, „> anruf“, „> termin“, „> kontakt“, „> aufgabe“, „> datenschutz“; Palette-Navigation „> Termine“, „> Gespräche“, „> Berichte“).

### 17.2 Komponenten (`components/Backoffice/Crm/`)

| Komponente | Art | Zweck |
|---|---|---|
| `CrmUebersicht`, `HeuteZeile`, `ZuErledigen`, `ZuErledigenZeile`, `MeinTag`, `KennzahlZeile`, `Verkaufsverlauf` | Server + Client-Zeilen | § 3.1 |
| `AnfragenTabelle` (auf `DataTable`), `AnfragenKanban` (auf `Kanban`), `AblageZone` | Client | § 3.2 |
| `KontaktKnoepfe` | Client | Mail/Telefon-Icon-Knöpfe mit 44-px-Treffer |
| `NachfassenFeld` | Client | Inline-Datum → Aufgabe |
| `Vorschau` (SidePeek) | Client | Vorschau Anfrage/Termin/Kontakt |
| `NeueAnfrageDialog`, `TelefonnotizDialog`, `DuplikatHinweis` | Client | § 3.3 |
| `Vorgangsleiste` | Server | § 2.3 |
| `AnfrageAkte`, `KundeZuordnen`, `VerlorenDialog`, `GewonnenDialog` | Client | § 3.4, § 5.1 |
| `KontakteTabelle`, `NeuerKontaktDialog` | Client | § 3.5 |
| `TerminKalender` (auf F6 `Kalender`), `Ereigniskarte`, `TerminKanban`, `TermineTabelle`, `VerschiebenDialog`, `Countdown` | Client | § 3.6/3.7 |
| `TerminAkte`, `BestaetigenSplit`, `AbsagenDialog`, `SerieDialog` | Client | § 3.7 |
| `TerminAnlegenDialog` (A1), `Slotraster` (F6) | Client | § 5.5 |
| `ProtokollSeite`, `Abschnittsleiste`, `RaumKarte`, `RaumChips`, `FotoKacheln`, `FragenListe`, `WieWeiterSheet`, `Kundenansicht`, `ProtokollSendenDialog` | Client | § 3.8, § 5.6 |
| `Speicheranzeige`, `useAutosave` (IndexedDB-Entwurf) | Client | § 2.7 |
| `TriageSheet` | Client | § 5.7 |
| `Kundenakte`, `AkteKopf`, `DetailsPanel`, `BeteiligteListe`, `OffenJetzt`, `Gespraechsstand`, `ZahlenBlock`, `AktivitaetTab`, `Composer`, `MailDrawer` | Server/Client | § 4 |
| `ZusammenfuehrenDialog`, `PortalDialog`, `WiderspruchDialog`, `RuecktrittDialog` | Client | § 5.3, § 5.8, § 5.9 |
| `DatenschutzListe`, `DatenschutzAkte`, `AuskunftDruck`, `SchwaerzenDialog`, `LoeschVorschlaege` | Client/Server | § 3.11, § 7 |
| `MarketingUebergabeDialog` | Client | § 7.1 |
| `VerfuegbarkeitRaster`, `FensterPopover`, `TerminartAkte`, `EinstellungenDiff` | Client | § 3.12 |
| `CrmBericht` | Server | Report-Tabelle + Chart |
| `Erstbesuch` | Client | Band je Seite |

Wiederverwendet: `Shell`, `Seitenkopf`, `Segment`, `DataTable`, `Filterleiste`, `Kanban`, `Formular`/`Feld`/`Datumsfeld`/`Kindtabelle`, `WorkflowLeiste`, `Zeitleiste`, `Charts`, `Kennzahl`, `StatusBadge`, `Leer`, `Fehler`, `Bestaetigen`, `Toast`, `Knopf`.

### 17.3 Server Actions (`lib/backoffice/crm/actions.js`)

Alle: `requireSession()`, `darfDoc` und Rolle erneut prüfen, Eingaben per zod, Rückgabe `{ ok, code, message, fehler? }`, Fehler über `istBackofficeError` + `fehler.js`, Idempotenz-Schlüssel bei mehrstufigen Aktionen, keine Personendaten im Log. Verzögerte Aktionen registrieren sich in der Undo-Registry (F2) und laufen über `commitAction({ token })`.

| Action | Prüfung | Frappe |
|---|---|---|
| `anfrageAnlegenAction({ felder, datenschutzhinweis })` | create | `insert PH Anfrage`; `kommentar`; ggf. `insert PH Aufgabe` (Hinweis senden, Art. 14) |
| `nurKontaktUndAufgabeAction({ felder })` | create Kontakt | `call create_kontakt`, `insert PH Aufgabe` |
| `annehmenAction({ name })` (verzögert) | Transition erlaubt | `workflowAction Qualifizieren` |
| `spamAction({ namen[] })` (verzögert) | write | `runDocMethod als_spam` je Name |
| `verlorenAction({ name, grund, details, mitbewerber })` (verzögert) | write, Grund Pflicht | `runDocMethod als_verloren` |
| `gewonnenAction({ name, wertCent, folgeanfrage? })` | write | `runDocMethod als_gewonnen`; optional `insert PH Anfrage` |
| `zurueckAufNeuAction({ doctype, name })` | Leitung | `workflowAction Zurück auf Neu` |
| `leitungBittenAction({ bezug, text })` | Sitzung | `insert PH Aufgabe` an `leitung_user` |
| `zuweisenAction({ doctype, namen[], user })` | write | `setValue zugewiesen_an` bzw. `berater` |
| `nachfassenAction({ anfrage, datum, titel? })` | write | `nachfassen.js`: `getList PH Aufgabe` → `setValue faellig` oder `runDocMethod aufgabe_anlegen` |
| `aufgabeAnlegenAction({ titel, faellig, zugewiesen, bezug })` | create | `insert PH Aufgabe` |
| `kundeZuordnenAction({ anfrage, kontakt? , neu? })` | write | `setValue kontakt` bzw. `runDocMethod kontakt_anlegen`; Undo: `setValue kontakt ""` + Aufgabe |
| `terminAusAnfrageAction({ anfrage, start, dauer, modus, terminart, berater, thema, mail })` | write | `runDocMethod termin_vorschlagen` |
| `terminAnlegenAction({ kontakt|person, start, terminart, modus, berater, thema, mail, idempotency })` | create | `call get_freie_slots` (genau Slot), `insert PH Termin`, `runDocMethod bestaetigen` |
| `terminBestaetigenAction({ namen[], mail })` (verzögert, Mail 10 s) | Transition | `runDocMethod bestaetigen` |
| `terminAbsagenAction({ name, grund, mail, ablehnen })` | write; ablehnen nur Leitung | `runDocMethod absagen` |
| `terminVerschiebenAction({ name, start, berater })` (verzögert) | write | `runDocMethod umbuchen` |
| `protokollSchreibenAction({ termin })` | write | `runDocMethod erledigt_mit_protokoll(1)` → Name |
| `terminAbschliessenAction({ termin })` (verzögert) | write | `runDocMethod erledigt_mit_protokoll(0)` |
| `nichtErschienenAction({ termin, grund })` (verzögert) | write | `runDocMethod nicht_erschienen` |
| `wiederBestaetigenAction({ termin, grund })` | Leitung | `runDocMethod wieder_bestaetigen` |
| `serieAction({ termin, art: anlegen|absagen, … })` | write | `runDocMethod serie_anlegen` / `serie_stornieren` |
| `meetAction({ termin })` | write | `runDocMethod meet_link_erzeugen` |
| `protokollSpeichernAction({ doc, modified })` | write | `save PH Beratungsgespraech` (Konflikt → feldweise) |
| `vorlageAnwendenAction({ gespraech, vorlage })` | write | `runDocMethod vorlage_anwenden` |
| `gespraechAufgabeAction({ gespraech })` | write | `runDocMethod aufgabe_anlegen` |
| `wieWeiterAction({ gespraech, wahl, planer?, kosten?, vertragsort? })` | write | `runDocMethod planung_beauftragen` + `kommentar` / `status_setzen` |
| `protokollSendenAction({ gespraech, empfaenger, nachricht, betreff, weg })` | email-Recht | `runDocMethod protokoll_senden` bzw. `kommentar` |
| `fotoHochladenAction({ gespraech, datei })` | write | `uploadFile` (privat) |
| `kontaktAnlegenAction({ felder, trotzdem })` | create | `call create_kontakt` |
| `kontaktSpeichernAction({ name, feld, wert })` | write; permlevel 1 nur Leitung | `setValue` |
| `kontaktStatusAction({ name, aktion, grund?, sperrgrund? })` | Transition | `workflowAction` / `runDocMethod als_kunde_markieren` / `portal_sperren` + `kommentar` |
| `portalAction({ name, aktion })` | write | `runDocMethod portal_zugang_erzeugen` (Token nur in der Antwort, nie gecacht/geloggt) / `portal_sperren` |
| `widerspruchAction({ name, quelle })` / `widerspruchAufhebenAction({ name, notiz })` | write / Leitung | `runDocMethod widerspruch_erfassen` / `setValue nicht_kontaktieren 0` + `kommentar` |
| `mailSendenAction({ kontakt, betreff, text, an, vertragsbezogen, vorlage })` | email-Recht | `runDocMethod mail_senden` |
| `kommentarAction({ doctype, name, text })` | write | `kommentar` |
| `zusammenfuehrenAction({ ziel, quelle, felder })` | Leitung, Debitor-Sperre | `getList` beider `ph_faktura_debitor_nr`, `call merge_kontakte` |
| `keineDubletteAction({ a, b })` / `duplikatMeldenAction` | write / Sitzung | `runDocMethod keine_dublette` / `insert PH Aufgabe` |
| `datenschutzErfassenAction({ kontakt, art, eingang, kanal, beschreibung })` | create | `insert PH Datenschutzanfrage` |
| `datenschutzSchrittAction({ name, schritt, args })` | Leitung; Whitelist `bearbeiten|auskunft_erstellen|loeschplan_erstellen|loeschung_ausfuehren|abschliessen|ablehnen` | `setValue identitaet_geprueft` / `runDocMethod` |
| `auskunftLadenAction({ datenschutzanfrage })` | Leitung/GF | `call export_kontakt_daten`, `getFile`, `getList` permlevel-1-Felder, `getList File` |
| `schwaerzenAction({ datenschutzanfrage, abschnitt, begruendung })` | Leitung | `kommentar` |
| `loeschVorschlagAction({ art, namen[], bestaetigung })` | Leitung, Tippfeld | `delete PH Anfrage` / `save` (Anonymisieren Anfrage) / `call anonymize_kontakt` |
| `marketingUebergabeAction({ namen[], kanal, zweck })` | write | `getList PH Einwilligung`, Übergabe an ph_marketing (Abhängigkeit) |
| `ruecktrittErfassenAction({ kontakt, ab, eingang, weg })` | write | `kommentar` (AB, Kontakt), `insert PH Aufgabe` |
| `csvAction({ doctype, filter })` | `export`-Recht | `getList` + `csv.js` + `kommentar` (Protokoll) |
| `sammeldruckAction({ doctype, namen[] })` | ≤ 10 oder Leitung | `getPdf` je Name + `kommentar` |
| `verfuegbarkeitAction({ aktion, werte })` | Leitung oder eigene Zeile | `insert`/`setValue`/`delete PH Verfuegbarkeit` |
| `terminartAction({ name, werte })` | Leitung | `save PH Terminart` |
| `einstellungenSpeichernAction({ werte, modified })` | Leitung | `save PH Termin Einstellungen` (Diff serverseitig) |
| `commitAction({ token })` | Sitzung, Token aus Undo-Registry | führt die hinterlegte Action genau einmal aus |

### 17.4 Frappe-Aufrufe (Lesen, `daten.js`)

`getList`/`count`: PH Anfrage, PH Kontakt, PH Termin, PH Beratungsgespraech, PH Aufgabe, PH Datenschutzanfrage, PH Verfuegbarkeit, PH Terminart, PH Beratungsvorlage, PH Einwilligung (ph_marketing), PH Angebot, PH Auftragsbestaetigung, PH Rechnung (ph_faktura), File. `getKanban` Boards „PH Anfragen“, „PH Termine“. `getDocMitInfo` für Akten. `getTransitions` für Knöpfe. `call`: `ph_crm.api.get_kundenakte`, `get_zeitleiste`, `find_duplicates`, `get_freie_slots`, `get_terminarten`, `get_loeschplan`, `export_kontakt_daten`; `ph_crm.ph_crm.doctype.ph_termin.ph_termin_kalender.get_events`; `ph_crm.ph_crm.kennzahlen.termine_heute|ueberfaellige_aufgaben|no_show_quote_90_tage|reaktionszeit_median_h`; `frappe.desk.doctype.dashboard_chart.dashboard_chart.get`. `getReport` PH Vertriebscockpit, PH Anfragen nach Quelle, PH Reaktionszeiten, PH Termine je Berater. `getPdf` für Druckformate. `searchLink` für Link-Felder. ph_core: `globalSearch`, `recentActivity`. Alle Kontakt-Lesungen ohne permlevel-1-Felder, außer Rolle Leitung/GF (Feldliste in `daten.js` je Rolle).

### 17.5 Reihenfolge

| Schritt | Inhalt | Ergebnis |
|---|---|---|
| 1 | Grundlagen: `texte.js`, `status.js`, `vorgang.js`, `fehler.js`, `marketingFilter.js`, `loeschvorschlag.js`, `verkaufsverlauf.js` (Filter), `kuerzel.js` + Unit-Tests; Mock-Seed (40 Anfragen in allen Status inkl. Duplikat und Termin entfallen, 30 Kontakte inkl. Firma mit Personen, Widerspruch, anonymisiert, ohne E-Mail, CH; 25 Termine inkl. Website/verfallen/Serie; 8 Gespräche mit Räumen/Vorlage; 20 Aufgaben; 3 Datenschutzanfragen; Verfügbarkeiten 3 Berater; 4 Terminarten; Faktura-Belege EUR/CHF) | reine Module grün |
| 2 | Layout, Navigation, Routen, Umleitungen, Badge, Palette-Einträge | Navigation vollständig |
| 3 | Gemeinsame Bausteine: Vorgangsleiste, Speicheranzeige/useAutosave, Vorschau, KontaktKnoepfe, Erstbesuch, verzögerter Commit-Anbindung (F2) | – |
| 4 | Anfragen: Liste, Kanban mit Ablagezone, Schnellanlage, Telefonnotiz, Akte, Kunde zuordnen, Verloren/Gewonnen, Nachfassen | T1–T3, T10, T11, T16 |
| 5 | Termine: Kalender (grid, Ebenen), Kanban, Liste, Akte, Verschieben, Bestätigen-Split, Absagen, Serie, Countdown; A1 | T3–T5 |
| 6 | Gespräche: Liste, Protokollseite, Räume/Fotos/Fragen, Wie-weiter-Sheet, Kundenansicht, Offline | T6, T7 |
| 7 | Kunden & Kontakte: Liste, Neu-Dialog; Kundenakte (Kopf, Tabs, Details, Zahlen, Aktivität, Composer), Zusammenführen, Portal, Widerspruch, Rücktritt | T8, T13, T17 |
| 8 | Übersicht `/crm`: Heute-Zeile, Zu erledigen (+ Export `zuErledigen` für Zentrale), Mein Tag, Kennzahlen, Verkaufsverlauf; Triage | T1, T4, T6, T9 |
| 9 | Datenschutz: Liste, Akte mit Schritten, Auskunft-Druckseite, Schwärzen, Löschvorschläge, Marketing-Übergabe | T14 |
| 10 | Berichte, Einstellungen (alle Reiter inkl. Diff-Dialog), Druckseiten | T12, T15 |
| 11 | Hilfe-Artikel, Kürzel-Übersicht `?`, Telefon-Ansichten, Wischgesten | – |
| 12 | E2E, axe hell/dunkel, Screenshots aller Leerzustände, Klickzählung | Abnahme |
| 13 (nach Backend) | Schalter je geliefertem Punkt aus § 16 aktivieren (A1 Auskunft serverseitig, A3 Report-Beträge, A4 „manuell gepflegt“ entfernen, B1 Rückwege für Mitarbeiter, B6 Felder statt Kommentar, B7 Dauer im Verschieben-Dialog, B10 atomarer Termin) | – |

### 17.6 Aufwand (Agent-Stunden, Schätzung)

| Schritt | h |
|---|---|
| 1 Grundlagen + Seed + Unit-Tests | 6 |
| 2 Navigation/Routen/Badge/Palette | 2 |
| 3 Gemeinsame Bausteine | 5 |
| 4 Anfragen | 10 |
| 5 Termine + A1 | 12 |
| 6 Gespräche + Kundenansicht + Offline | 9 |
| 7 Kontakte + Kundenakte | 12 |
| 8 Übersicht + Triage | 5 |
| 9 Datenschutz + Marketing-Übergabe | 7 |
| 10 Berichte, Einstellungen, Druck | 7 |
| 11 Hilfe, Kürzel, Telefon, Gesten | 3 |
| 12 E2E, axe, Screenshots, Klickzählung | 7 |
| **Phase A gesamt** | **85** |
| 13 Phase B (Schalter nach Backend-Lieferung) | 6 |

### 17.7 Abhängigkeiten

| Von | Was | Blockiert | Ersatz bis dahin |
|---|---|---|---|
| Fundament F2 | verzögerter Commit, Warteschlange, `/api/undo-commit` | Annehmen, Spam, Verloren, Bestätigen, Verschieben, Nicht erschienen | eigene Route `api/crm/undo-commit`, später übergeben |
| Fundament F3 | Kürzel-Registry + Abschalter | Kürzel-QA | lokale Registrierung über `useTastenkuerzel` |
| Fundament F5 | Glocke mit Inline-Aktionen | R3/R6-Knöpfe | Glocke ohne Knopf, Link auf Akte |
| Fundament F6 | `Kalender`, `Slotraster`, `Sheet`, `SidePeek` | Schritte 5, 3 | Bausteine im Bereich bauen, Fundament übernimmt |
| Shell | Kundenansicht-Modus, Toast-Hold | § 3.8 | Kundenansicht nur innerhalb der Seite (Seitenleiste per Vollbild verborgen) |
| Zentrale | Übernahme `zuErledigen`, `/aufgaben?bereich=crm` | T1/T4/T6/T9 ab Zentrale | Klickzahl ab `/crm` messen, Zentrale-Werte nach Einbau |
| Faktura | A2-Übergabe (`?anfrage=&kontakt=&vertragsort=`), Hooks A4, PH Ruecktritt | Angebot anlegen, Kunde-Status, Rücktritt | Knopf öffnet Faktura-Neu mit Parametern; Kommentar + Aufgabe |
| Marketing | Zielgruppen-Übergabe | § 7.1 | Massenaktion ausgeblendet |
| Projekte / Service / Personal | Kalender-Ebenen, Servicefall anlegen, Abwesenheiten | Ebenen-Chips | Chips ausgeblendet, wenn App fehlt |
| ph_crm A1–A8, B1–B15 | § 16 | jeweilige Verbesserung | beschriebene Zwischenlösung |
| Inhaber I1–I7 | § 16 | Vorbelegungen, Löschfristen | strengste Variante |

### 17.8 QA-Checkliste (Abnahme; Mock-E2E + Staging, Geräte iPad quer/hoch, Desktop Chrome, Telefon 375 × 667)

**Allgemein**
1. Jede Seite: genau eine Primäraktion, `⌘Enter` löst sie aus; Filter in der URL, Zurück stellt wieder her; Skeleton ≥ 300/600 ms, CLS 0.
2. Jeder Leerzustand aus § 11 existiert als Mock-Fall mit Screenshot hell/dunkel; Erstbesuch-Band je Seite einmal, „Verstanden“ merkt sich.
3. axe serious/critical = 0 hell und dunkel (Übersicht, Anfragen-Liste, Kanban, Kalender, Protokoll, Kundenakte gemessen); Fokusring sichtbar; Kontrast Sand nur Nicht-Text oder ≥ 18,66 px fett.
4. Keine Emoji im DOM (Lint auf JSX-Texte); Icons lucide mit Text oder `aria-label`.
5. DOM-Textsuche aller Routen als Leitung: kein „Qualifizieren“, „Posteingang“, „Trichter“, „Peek“, „Studio“, „Folgedokument“, „Beratungsgespraech“, „Bestaetigt“, „Unbestaetigt“, „Wiedervorlage“.
6. Klickzahlen § 1.2 über genau den beschriebenen Weg; ⌘K-Wege getrennt gemessen.
7. Alle Animationen nutzen `--bo-dur-*`/`--bo-ease-*`; Spring nur Kanban-Drop; `prefers-reduced-motion` → keine Bewegung.
8. Ladezeiten Staging über VPN: Anfragen-Liste (25 Zeilen) interaktiv < 1,0 s, Kundenakte Übersicht < 1,2 s, Kalender Woche < 1,0 s.

**Anfragen und Vorgang**
9. Termin storniert/abgelehnt/nicht erschienen → Anfrage zeigt „Termin entfallen“ + „Neuen Termin anlegen“; keine Anfrage zeigt „Termin vereinbart“ ohne aktiven Termin.
10. Annehmen, dann innerhalb 8 s „Termin anlegen“: kein Workflow-Fehler, Reihenfolge der Serveraufrufe Annehmen → Termin (Netz-Mitschnitt); Undo innerhalb 8 s: kein Serveraufruf; Tab schließen im Fenster: genau ein Aufruf.
11. „Nachfassen am“ legt genau eine offene Aufgabe an bzw. verschiebt sie; Felder `wiedervorlage*` bleiben leer; Erinnerung am Fälligkeitstag in Heute-Zeile und Glocke.
12. Verloren ohne Grund → Feldfehler „Bitte einen Grund wählen“; aus Status Neu möglich (`als_verloren`); Spam setzt `verloren_grund = Spam`.
13. Kanban Anfragen: Drop auf „Termin vereinbart“ öffnet A1, Abbrechen ändert nichts; nicht erlaubtes Ziel → Rücksprung ≤ 200 ms + Statusmeldung mit Grund; Tastatur `←/→`, `m`, Enter funktionieren.
14. Keine Zeilenaktion nur per Hover (Touch-Projekt `pointer: coarse` zeigt Aktion und Kontakt-Knöpfe).
15. Mitarbeiter können Anfragen in Gewonnen/Verloren/Spam nicht bearbeiten (Schloss + Text), Server lehnt ab.
16. Duplikat-Prüfung: Telefon-Anfrage für bestehenden Kontakt (andere Schreibweise der Nummer) schlägt den Kontakt vor und erzeugt keinen zweiten Kontakt, wenn der Vorschlag gewählt wird.

**Termine**
17. A1 aus Anfrage: Kunde + Art vorbelegt, Termin in 2 Interaktionen im Dialog; Mail-Haken aus Anfrage und Kalender identisch; wird der Slot zwischen Anzeige und Anlegen von der Website gebucht → `slot_taken`-Meldung, kein Doppeltermin (zwei Sitzungen, Staging).
18. Kalender-Drag ruft `umbuchen`; Konflikt → Rücksprung + Toast mit nächster freier Zeit; Undo innerhalb des Fensters → kein Serveraufruf, keine Mail; kein Ziehen der Dauer möglich.
19. Kanban Termine: Drop auf Erledigt/Nicht erschienen löst keinen Serveraufruf aus; Nicht erschienen → Undo 8 s; Leitung sieht „Wieder bestätigen“.
20. Bestätigen mit Mail: Toast 10 s mit maskierter Adresse; ohne `email` kein Mail-Teil, Toast „Keine E-Mail – bitte telefonisch bestätigen“.
21. Slot-Abfragen ≤ 1 je Woche und 30 s; `rate_limited` zeigt Countdown, geladene Wochen bleiben bedienbar.
22. Kalender `role="grid"`, Ereignisse mit `aria-label` inkl. Statuswort; 15-min-Block ≥ 24 px (kompakt) bzw. ≥ 44 px (iPad); Countdown nicht `aria-live`, Ansage nur 5 min/1 min/abgelaufen.
23. Website-Reservierung verfallen erscheint als „Verfallen“ grau und zählt nicht in Berater-Kennzahlen des Backoffice.

**Gespräch und iPad**
24. „Protokoll schreiben“ öffnet das neue Protokoll in < 1 s; Speicheranzeige durchläuft alle Zustände aus § 2.7 (Mock-Fehlerinjektion); Verlassen bei ungespeicherten Änderungen fragt nach.
25. Budget-Summe = `budget_gesamt_cent` (Cent, keine Rundungsfehler); Label „brutto (Kundenangabe)“.
26. Kundenansicht blendet Seitenleiste, Glocke, Badges, Intern, Aktivität, Status aus; Toasts anderer Datensätze erscheinen erst nach Verlassen; Beenden nur per Langdruck 600 ms.
27. „Planung beauftragen“ ohne Kostenwahl nicht ausführbar; Vertragsort Beim Kunden/Fernabsatz zeigt FAGG-Hinweis; A2 erhält `vertragsort`.
28. Raum entfernen → Undo 8 s stellt Raum mit Inhalt wieder her; Foto-Fehler zeigt Fehler-Kachel mit „Erneut“.

**Kundenakte**
29. ≤ 6 Tabs, Kopf ≤ 2 Zeilen + ≤ 1 Band (Vorrang laut § 4.2), Details-Panel < 1280 px als Sheet (`Shift+D`); Tests bei 1024/1280/1440.
30. Rollen: Montage sieht nur Kopf, Kontaktwege, Adressen, eigene Bezüge; Beträge nur Leitung/GF/Faktura; Faktura sieht kein „Intern“; `notizen`/`notiz_intern` für Mitarbeiter weder in Liste, Vorschau, Druck noch Zeitleiste (DOM-Snapshot).
31. Zahlen je Währung getrennt („EUR … · CHF …“), Quelle = Faktura-Felder `netto_cent`/`offen_cent` mit Status-Filter (Staging-Vergleich mit Faktura-Liste); kein Wert aus `gesamt_cent`.
32. Widerspruch: rotes Band, Marketing nur lesen, „Neu ▾“ ohne Marketing, Composer verlangt „vertragsbezogen“ (Server lehnt sonst ab).
33. Portal-Token genau einmal sichtbar, nie in URL, Log, Browser-Speicher; nach Neuladen weg; `Esc` mit Zwischenfrage; ohne E-Mail Zugangsbrief.
34. Zusammenführen: nur Leitung; bei zwei Debitornummern deaktiviert mit Text; Erfolg leitet auf Ziel; Fehler „Nichts geändert“.

**Recht**
35. Marketing-Übergabe E-Mail schließt jeden Kontakt ohne bestätigte passende `PH Einwilligung` aus; Zähler im Dialog = Server; Brief schließt nur Widerspruch/ohne Anschrift aus.
36. Auskunft enthält `notizen`, alle `notiz_intern`, `anliegen`, Räume, Communication-Text, Dateiliste, `ip_hash`, Metadaten-Block (inkl. Empfänger, Herkunft, Beschwerderecht); enthält nie `portal_token_hash`, `idempotency_key`, Hashes; Schwärzung ohne Begründung nicht möglich.
37. Datenschutzanfrage: Frist = Eingang + 1 Monat (Server); ab 7 Tage vorher in der Heute-Zeile der Leitung; Auskunft/Löschung ohne Identitätshaken gesperrt (Servertext übersetzt).
38. Kontakt mit Belegen nicht vollständig anonymisierbar (Knopf deaktiviert, Tooltip mit Fristende aus `get_loeschplan`); Anonymisieren nur mit Tippfeld.
39. Sammeldruck > 10 nur Leitung, jeder Sammeldruck und CSV-Export als Kommentar protokolliert.
40. Backoffice-Anfrage ohne Datenschutzhinweis nicht speicherbar (Quelle ≠ website); „per Mail nachsenden“ und Art Empfehlung legen die Aufgaben an.

**Kürzel, Texte, Übersicht**
41. Kein Bereichskürzel überschreibt ein globales (Unit auf Registry); `Alt+←/→` ohne Wirkung in der App; Einzeltasten abschaltbar und danach wirkungslos; `?` zeigt die Kürzel der Seite.
42. `/crm` zeigt je Rolle ≤ 4 Kennzahlen, keine Charts, jede Zahl genau einmal; Badge, Heute-Chip und „Neue Anfragen“ zeigen dieselbe Zahl.
43. Verkaufsverlauf: Klick je Stufe öffnet eine Liste mit genau so vielen Zeilen wie die Zahl (Mock).
44. Statuston-Snapshot je Status gegen § 2.2; kein `accent`-Token an Status.
45. Serverfehlertexte erscheinen nie roh (Unit `fehler.js` + E2E mit Mock-Fehlern aller Codes).

---

## 18. Hinweis zum Datenstand

Dieses Konzept wurde gegen den Arbeitsstand von `Backend-Import/ph_crm` vom 04.11.2026 (uncommittete Änderungen eingeschlossen) geprüft. Viele Lücken der Fassung 1 sind dort inzwischen geschlossen (Kundenakte-Aggregat, Zeitleiste, Dubletten/Zusammenführen, `termin_vorschlagen` mit Slot-Prüfung, `gewonnen_am`, `protokoll_senden`, `planung_beauftragen(planer)`, Datenschutzanfrage, Löschplan/Anonymisieren, Rückwege Qualifiziert → Neu (Leitung) und Nicht erschienen → Bestätigt, Inaktiv → Kunde, Scheduler R1–R6/R8, `telefon_norm`, `firma_kontakt`, Beteiligte-Rollen, `letzter_kontakt`, Website-Benachrichtigung nach Umbuchung). Ändert sich der Stand vor dem Bau, gilt: Methode vorhanden → nutzen und Zwischenlösung streichen; Methode fehlt → Zwischenlösung aus diesem Konzept.

---

## 19. Änderungsprotokoll (Fassung 1 → Fassung 2, 2026-11-04)

**Aus UX-Kritik (20):**
| Nr. | Umsetzung |
|---|---|
| P1 doppelte Zustände | E1, § 2.3 Vorgangsleiste, `vorgang.js`, Band „Status passt nicht“, Anfrage A5; QA 9 |
| P2 drei Nachfass-Mechanismen | E2 Aufgabe als einziger Mechanismus, „Nachfassen am“, „Vereinbart“, „Empfohlen“; Gespräch legt Aufgabe beim Verlassen von „bis“ an; B9; QA 11 |
| P3 Bereichsstart | § 3.1 Heute-Zeile, Zu erledigen, Mein Tag, 4 Kennzahlen, Verkaufsverlauf; Charts → Bericht „Übersicht“; QA 42 |
| P4 Kundenakte | § 4: 6 Tabs, Details-Panel, Kopf 2 Zeilen, 1 Band mit Vorrang, Primärknopf aus „Offen jetzt“; QA 29 |
| P5 Klickzahlen | § 1.2 neu gezählt, ⌘K getrennt; QA 6 |
| P6 A1 | § 5.5 ein Bildschirm, Dialog 800, Vorbelegung, ein Verhalten des Mail-Hakens, keine `⇧⏎`; E5; QA 17 |
| P7 irreversible Termin-Übergänge | E6, keine Drop-Ziele, „Protokoll schreiben“, „Ohne Protokoll abschließen“, verzögerter Commit, `wieder_bestaetigen`; QA 19 |
| P8 Qualifizieren endgültig | E7, 8 s, Warteschlange, „Leitung bitten“; B1; QA 10 |
| P9 Hover-only | § 3.2 Spalten „Kontakt“ und „Aktion“ immer sichtbar; QA 14 |
| P10 Statustöne | § 2.2; QA 44 |
| P11 Kürzel | § 2.5, E17; QA 41 |
| P12 Undo-Lücken | § 2.4 Matrix (Raum, Zuordnen, Widerspruch aufheben, Verfügbarkeit, Terminart, Einstellungen-Diff); A8 |
| P13 Autosave-Fehler | § 2.7; QA 24 |
| P14 Kundenansicht | E18, § 3.8; QA 26 |
| P15 Gesten | § 9 Wischregel, kein Touch-Drag im Kalender, Rückfedern 200 ms ease-out |
| P16 Kanban-Drop | § 3.2 Drop-Regeln je Spalte, Ablagezone, Toast statt Tooltip, Tastatur; QA 13 |
| P17 Zusammenführen | § 5.8 mit Servermethode `merge_kontakte` (jetzt vorhanden), Dialog, Ergebnis/Fehler; QA 34 |
| P18 Protokoll-Tabs | § 3.8 eine Scrollseite, Abschnittsleiste, ein Primärknopf, Sheet § 5.6 |
| P19 Leerzustände, Hilfe | § 11 Sammelliste, Tabs mit 0 grau sichtbar, Erstbesuch, Hilfe-Artikel § 2.6; QA 2 |
| P20 Begriffe | § 2.1 Glossar, Navigation „Kunden & Kontakte“, Brotkrume; QA 5 |
| § 2.1 Komplexität | Vorgangsleiste statt Phasenleisten; ein Zuordnen-Weg; Person lesend mit Abgleich-Hinweis; iPad-Prioritätsspalten; „Summe sichtbar“ und CSV-Dreifach gestrichen; „Letzter Kontakt“ aus echtem Feld; „Gewonnen“ über `gewonnen_am`; eine Badge-Definition; Unternavigation ≤ 7 mit „Mehr“; Budget-Sichtregel vereinheitlicht |
| § 2.2 Tastatur-Lücken | Kanban-Tastatur genannt, Verfügbarkeit per Pfeiltasten/Popover, Dauer im Verschieben-Dialog lesend, Tab-Reihenfolge Zeitleiste, Triage mit sichtbarem Startknopf |
| § 2.3 Undo-Matrix | § 2.4 inkl. Mail 10 s, Split-Knopf, Fehler nach Ablauf in Glocke, `pagehide` |
| § 2.4/§ 2.5 Leer- und Fehlerfälle | § 11; Reservierung abgelaufen, Verfügbarkeit nicht geladen, Duplikatprüfung, Konflikt feldweise, Portal-`Esc` |
| § 2.6 WCAG | Wort neben Farbe, Sand-Kontrast, Zielgrößen, Ziehen-Alternativen, `aria-live` Countdown/Zähler, Vorschau `complementary` + `F6`, `scroll-padding`, Kalender-`grid`, Fehlertexte, Undo pausiert, Hilfe an fester Stelle |
| § 2.7 Mobile | Prioritätsspalten, 6 Raum-Chips + Weitere, Diktat-Hinweis, „Aus Fotos wählen“, Telefon-Ausnahme E20, Bottom-Sheet mit „Fertig“, Route-Text |
| § 2.8 Visuell | Wireframes W1/W2 übernommen, Emoji entfernt, max. 1 Band, Balken statt Donut, Bewegungswerte § 2.8 |
| § 2.9 Microcopy | Toasts mit Namen statt Nummer, eine Leer-Formulierung, Slot-Texte, Dialogtitel als Frage, „Prompt“ ersetzt durch Popover/Dialog |
| § 2.10 Widersprüche | aufgelöst in § 0; Löschung im Datenschutz § 7.3 |
| § 4 Leitlinien-Widersprüche | als Anträge an Fundament § 16 C; CRM folgt den Vorschlägen (8 s, `←/→`, `Alt+1…9`, Toast unten rechts, Wischregel) |

**Aus Fachkritik (21):**
| Nr. | Umsetzung |
|---|---|
| F1 permlevel `notiz_intern` | Empfehlung gestrichen; Faktura ohne Tab „Intern“ (§ 1.1, § 3.8) |
| F2 Kunde-Status | E14, Hook-Anfrage an ph_faktura/ph_kassa (§ 16 C), Kennzahl „manuell gepflegt“; QA nach Lieferung |
| F3 Cockpit-Beträge | E13, § 4.5, § 6.2, A3; QA 31 |
| F4 Anfrage ohne Kontaktweg | E15, Warnband/Q2 gestrichen, B2 |
| F5 Verloren aus Neu | E8 `als_verloren`; B1 |
| F6 Dauer per Drag | E16 gestrichen; B7 |
| F7 Neu → Termin vereinbart | `termin_vorschlagen` bleibt Weg; Kanban-Drop öffnet A1; B1 |
| Rollenmatrix | § 1.1 (GF Aufgaben schreibend, GF Export Anfrage) |
| D1/D2 Beziehungen, Firma | vorhandene `rollen` (PH Kontakt Rolle) und `firma_kontakt` genutzt (§ 4.4) |
| D3 Debitor | Kopf-Chip, Zusammenführ-Sperre (§ 4.2, § 5.8) |
| D4 Anzahlung eine Quelle | § 4.5, § 13 |
| D5 Schalter R1–R8 | vorhandene Felder `auto_*` im Reiter Automationen (§ 3.12) |
| D6 Sperrgrund | Auswahl im Dialog, Kommentar bis B13 |
| D7 Währung Budget | Label brutto, EUR angezeigt, B6 |
| D8 Produkt-Link | Freitextpositionen bis B12 |
| D9 Website-Termine ohne Kontakt | B15; Auskunft sucht zusätzlich per E-Mail/Telefon (§ 7.2) |
| D10 Woche kopieren | Wochenmuster mit Gültigkeit, Ausnahmen über PH Abwesenheit (§ 3.12) |
| V1 TKG § 174 | E10, § 7.1; QA 35 |
| V2/V3 Auskunft | E11, § 7.2, A1; QA 36 |
| V4 Löschkonzept | E12, § 7.3, § 3.12 Reiter Datenschutz, A2; QA 38 |
| B1 Informationspflicht | Feld „Datenschutzhinweis“ in Schnellanlage, Art.-14-Aufgabe, B11; QA 40 |
| B2 FAGG | Vertragsort-Vorschlag, Frist-Band, Hinweis § 10 FAGG (§ 5.6, § 4.2) |
| B3 Planung entgeltlich | Kostenwahl Pflicht im Sheet (E19); B6; QA 27 |
| B4 Zusammenführen Debitoren | E9, A7 |
| B5 sensible Freitexte | Hinweise unter allen Notizfeldern, Sperrgrund als Auswahl, Anrede optional (§ 7.4) |
| B6 Portal ohne E-Mail | Zugangsbrief (§ 5.3) |
| B7 Sammel-PDF | > 10 nur Leitung, protokolliert; QA 39 |
| K1 Umsatz vs. Auftragseingang | Label „Auftragseingang netto“, Umsatz nur aus Rechnungen (§ 4.5, A3) |
| K2 netto/brutto | Kennzeichnung in jedem Label |
| K3 Anzahlung | nur Anzeige, „Zahlung erfassen“ immer in Faktura |
| K4 Kassenbeleg | Kennzeichen „Kassa“, nie als Rechnung gezählt |
| K5 Währung | je Währung getrennt, keine Umrechnung |
| R-S1–R-S4 Storno | § 5.1 „Auftrag storniert“, § 13, „Kunde hat inzwischen abgesagt“, „Verfallen“ (B8) |
| R-T1–R-T3 Teil/Versionen | Folgeanfrage beim Gewinnen, Teillieferstand, alle Angebotsversionen |
| R-A1–R-A3 Anzahlung | Rücktritt-Band, Kassa-Kennzeichen, R9 als Anfrage |
| R-R1–R-R3 | Rücktritt § 5.9, Telefonnotiz „Reklamation“, Service-Fristen-Leerzustand |
| R-C1–R-C5 CH/DE/FL | Hinweis „Land prüfen“, Währung je Beleg, B4, `telefon_norm` genutzt |
| R-E1–R-E7 ohne E-Mail | `find_duplicates` vor Anlage (B3), I1, E15, Toast + Aufgabe + Brief, Tagesliste, Versandwege, Brief bei Bevorzugung |
| P-W Rücktritt | § 5.9 als Übergabe an Faktura, I4 |
| P-B Betroffenenanfrage | vorhandene PH Datenschutzanfrage, § 3.11 |
| P-L Löschkonzept | § 7.3 |
| P-K Kunde-Status | § 16 C (ph_faktura/ph_kassa) |
| P-F Cockpit | A3, Next-Zählung § 6.2 |
| P-A1–P-A7, P-B1–P-B14, P-C1–P-C8 | jeweils oben zugeordnet; Datenänderungen als Anfragen § 16 A/B, Oberflächen-Teil in § 3–§ 9 |
| Q25–Q32 (Fach) | QA 35–38, 31, 16, 40 sowie Land-Hinweis (§ 13) |
| Q25–Q42 (UX) | QA 9–14, 17–19, 22, 24, 26, 29, 34, 41, 42, 44 |

**Abgleich mit ph_crm-Stand 04.11. (neu in Fassung 2):** Lücken der Fassung 1 Nr. 1–4, 7, 9, 10 (teilweise), 12, 13, 14 als erledigt genutzt; neue Funktionen eingebaut: Beratungsvorlagen-Fragen, Terminserien, Pipeline-Werte (Erwarteter Wert, Abschluss ca.), erweiterte Verlustgründe mit Mitbewerber, Duplikat-Kennzeichen `duplikat_von`, Datenschutzanfrage-Ablauf, Löschplan. Neu erkannt: `kontakt360._zahlen` liest ebenfalls `gesamt_cent` (A3); `datenauskunft`/`dsgvo.auskunft` lassen permlevel-1-Felder und `ip_hash` weiterhin weg (A1); `finde_oder_lege_an` sucht weiter nur per E-Mail (B3); `verify_termin` verknüpft keinen Kontakt (B15).
