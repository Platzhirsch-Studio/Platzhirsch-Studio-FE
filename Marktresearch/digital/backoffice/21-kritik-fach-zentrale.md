# 21 – Fachkritik Konzept Zentrale & Querschnitt (10-konzept-zentrale.md) gegen `ph_core`

**Zweck:** Prüfung des Zentrale-Konzepts aus Sicht Möbelhandel-Betrieb, österreichisches Recht (RKSV, BAO § 131/§ 132, UStG § 11/§ 19/§ 20, UGB § 14, FAGG, DSGVO, AVRAG § 10/ArbVG § 96, GlBG) und Buchhaltungslogik; Abgleich jeder UI-Funktion mit DocType-Feldern und Server-Methoden in `Backend-Import/ph_core` (plus die Fach-DocTypes, auf die Kennzahlen/Freigaben zugreifen). Ergebnis: Note, Pflichtänderungen mit DocType/Feld, Randfälle.
**Stand:** 2026-11-04 · Rolle: Fachkritiker + Frappe-Datenprüfer · Status: Prüfbericht, keine Inhaber-Entscheidung.
**Geprüft:** `10-konzept-zentrale.md` (918 Zeilen) gegen `ph_core/README.md`, DocType-JSONs `PH Firma`, `PH Einstellungen`, `PH Betriebsruhe`, `PH API Protokoll`, `PH Geraet` (+ `ph_geraet.py`, `ph_firma.py`), `api/{__init__,geraete,bediener,suche,aktivitaet,health}.py`, `utils/druck.py`, `hooks.py`, Fixtures `role`, `role_profile`, `custom_field`, `number_card`. Querbezüge (nur Felder/Rechte): `PH Aufgabe` (ph_crm), `PH Rechnung`, `PH Gutschrift`, `PH Export Lauf`, `PH Bankumsatz`, `PH Eingangsrechnung.freigeben` (ph_faktura), `PH Zahlung` + `erstattung_freigeben`, `PH Widerruf`, `PH Bestellung`, `mails.aufgabe` (ph_shop), `PH Kassenbeleg`, `PH Kassenabschluss`, `PH Kassenbuch`, `PH Kassa Ereignis`, `terminal.py` (ph_kassa), `PH Servicefall` (ph_service), `PH Abwesenheit` (ph_personal), `PH Kontakt` (ph_crm), ToDo-Erzeuger in allen Apps (grep).
**Nicht geprüft:** Gestaltung, Bewegung, Tastenbelegung, Klickzahlen (Sache 02–04 und UX-Kritik).

---

## 0. Urteil in Kürze

| | |
|---|---|
| **Note** | **6 / 10** |
| Stark | Die ph_core-Schnittstellen (Geräte, Bediener, Suche, Aktivität, Einstellungen, Firma) sind feldgenau und methodengenau abgebildet; die eigene Lückenliste §9/§13 stimmt zu rund 85 % mit dem Code überein (bestätigt: `gesperrt_grund` fehlt in der 403-Antwort, `global_search` ohne Ranking/Betrag/Normalisierung, `recent_activity` ohne `benutzer/seit/start`, Aufgaben-Rechte nur CRM, `PH_ROLLEN` ohne Kundenkarte-Rollen, kein `set_profil`, keine Feiertags-/Nummernkreis-/Schlüssel-/Sammel-PDF-Methode). Datensparsamkeit Aktivitätsstrom und Personal-Ausschluss aus der Suche sind korrekt übernommen. |
| Schwach | (1) **Testmodus** ist falsch beschrieben und auf der Produktiv-Site gefährlich (Kartenzahlung wird simuliert, Belege bleiben echt signiert). (2) **„Umsatz Monat“** ist kein Umsatz, sondern Zahlungseingang brutto inkl. Anzahlungen, Gutscheinverkauf, Kassa, CHF-Beträgen in Fremdwährung und ohne Erstattungen – und für `PH Faktura Leitung` leer. (3) **Zwei Aufgabensysteme**: sieben Fach-Apps legen Frappe-`ToDo` an, die Zentrale zeigt nur `PH Aufgabe`. (4) Freigaben ohne Vier-Augen-Regel; eine im Konzept genannte Freigabemethode existiert nicht. (5) Rechte-Ausweitungen über `leitung=True` (jede Bereichsleitung darf Kassa-Geräte registrieren und PINs von Admins setzen). (6) Pflichtprozesse DSGVO-Anfragen, RKSV-/UVA-/OSS-Fristen, Mitarbeiter-Austritt fehlen. (7) Rechnungen kennen ihre ausstellende Firma nicht – „Als Standard setzen“ mit Undo verschiebt Belege auf einen anderen Rechtsträger. |
| Freigabe für den Bau | **Nur mit P1–P12 (§4).** Navigation, Palette, Aufgaben-UI, Hilfe, Kürzel, Druckzentrale können parallel starten. |

Bewertungsmaßstab: 10 = jede UI-Funktion hat Feld und Methode, Recht und Buchhaltung stimmen, Randfälle definiert. Abzug je Befund, der am ersten Betriebstag falsche Zahlen, eine Rechtsverletzung oder eine Rechteausweitung erzeugt.

---

## 1. UI-Funktionen ohne Datenfeld oder Methode (oder mit falschem Feld)

Nur Stellen, die das Konzept **nicht** selbst als Lücke führt oder falsch einordnet.

| # | Konzeptstelle | Behauptung | Befund im Code | Folge |
|---|---|---|---|---|
| F1 | §0, §3.6, §6.1 „Offene Aufgaben“, §3.5 Glocke | Aufgaben = `PH Aufgabe`; `ToDo` nur als künftige Glocke-Quelle | ToDo-Erzeuger (grep `"ToDo"`): `ph_faktura/tasks.py`, `ph_kassa/rksv/buchung.py`, `ph_logistik/tasks.py`, `ph_marketing/empfehlung.py`, `ph_service/tasks.py`, `ph_shop/mails.py` (`aufgabe()` → ToDo an bis zu 5 Rolleninhaber, u. a. **Erstattungsfreigabe** an GF), `ph_shop/tasks.py`, `ph_sortiment/tasks.py`. `PH Aufgabe` wird nur in ph_crm angelegt. | „Meine Aufgaben“, Heute-Leiste, Kennzahl „Offene Aufgaben“ und Kanban zeigen die meisten System-Aufgaben nicht; Erstattungsfreigaben und Kassa-/Logistik-Prüffälle versanden. |
| F2 | §6.1 „Umsatz Monat“, §6.2 Chart | `PH Zahlung status=Bezahlt, art=Eingang`, Summe `betrag_cent`; Rollen GF + Faktura Leitung | `PH Zahlung` (ph_shop) Rechte: System Manager, Admin, GF, Shop Leitung/Mitarbeiter, Website Integration, Buchhaltung extern – **keine Faktura-Rolle**. Felder: `betrag_cent` in `waehrung`, daneben `betrag_eur`; `livemode`; Status `Teilerstattet/Erstattet` fällt aus dem Filter; Kanal `Gutschein`/`Verrechnung` zählt mit; Kassa bucht jede Zahlart als `PH Zahlung` (ph_kassa README Z. 63). | Für `PH Faktura Leitung` (auch Profil „PH Buchhaltung“) leer bzw. `forbidden`. Für GF fachlich falsch (siehe R1). |
| F3 | §3.3 Palette `€`-Suche | `*_cent between`, „`brutto_cent between`“ für PH Rechnung, PH Zahlung, PH Kassenbeleg, PH Bankumsatz | Betragsfelder heißen unterschiedlich: `PH Rechnung.brutto_cent`/`offen_cent`, `PH Zahlung.betrag_cent`, `PH Kassenbeleg.gesamt_cent`, `PH Bankumsatz.betrag_cent` (negativ bei Ausgang möglich), `PH Gutschrift.brutto_cent`. Fremdwährung (`waehrung`) wird nicht berücksichtigt. | Suche nach „€ 3744“ findet Zahlungen/Kassenbelege nie; CHF-Belege erscheinen unter €-Betrag. |
| F4 | §3.14 Druckvorschau „Per E-Mail … Dokumentmethode `senden`“ | einheitliche Methode `senden` | Keine app-übergreifende Konvention in ph_core; Mail geht über `ph_core.utils.mail.sende` aus App-Code. Kein Feld „Kunde hat E-Mail-Rechnung zugestimmt“ (§ 11 Abs 2 UStG) an `PH Kontakt`. | Knopf ohne Ziel; bei Kunde ohne E-Mail (R6) kein definierter Rückfall. |
| F5 | §5.1/§9 „Freigabe ausführen … z. B. `PH Servicefall.kulanz_freigeben`“ | Methode existiert | `ph_servicefall.py` hat keine Methode; Freigabe entsteht implizit in `validate` (`kulanz_freigegeben_von = session.user`, wenn eine Leitung speichert und `entscheidung` gesetzt ist). Vorhanden: `PH Zahlung.erstattung_freigeben/erstattung_ablehnen`, `PH Eingangsrechnung.freigeben/ablehnen`, `PH Inventur.freigeben`, `PH Tour.freigeben`, `PH Planung.freigeben`, `PH Social Beitrag.freigeben`. | Glocke-Knopf „Freigeben“ für Kulanz hat keinen Server-Aufruf; ein „Ablehnen“ für Kulanz gibt es nicht. |
| F6 | §3.9 Einstellungen „Allgemein“, Rückfragetext | Testmodus: „Kassenbelege nicht signiert“ | `PH Einstellungen.testmodus` (Default **1**): Mails werden umgeleitet (`utils/mail.py`), Belege mit „TEST“ markiert (Feldbeschreibung). ph_kassa signiert **alle** Belege (README Z. 41). `ph_kassa/terminal.py::dienst()`: bei `livemode` **und** Testmodus → **Mock-Terminal**. | Rückfragetext falsch; tatsächliche Wirkung (simulierte Kartenzahlung bei echtem RKSV-Beleg) wird nicht gezeigt → R2. |
| F7 | §3.11/§9 „Gerätefelder bearbeiten … `aktiv`“ | `aktiv` per `save` bearbeitbar | `aktiv` ist im JSON nicht `read_only`; `validate()` setzt bei `aktiv=1` `gesperrt_grund=None`, bei `aktiv=0` „Gesperrt“ – **ohne** Kommentar. Nur `sperren()`/`entsperren()` schreiben `add_comment`. | Sperren/Entsperren über die Speicherleiste umgeht Grund und Verlauf. |
| F8 | §2.1/§3.11 „Geräte: Admin, PH … Leitung (Kassa/Logistik/Projekte/Service)“ | Recht auf diese vier Leitungen begrenzt | `register_device` → `rolle_pruefen(*ROLLEN_ADMIN, leitung=True)`; `hat_rolle(leitung=True)` akzeptiert **jede** Rolle `PH * Leitung` (auch Marketing, Personal, Kundenkarte); `insert(ignore_permissions=True)`. Danach fehlt Marketing-Leitung das DocPerm → Gerät nicht in `list_devices` sichtbar. | Marketing-Leitung kann ein Kassa-Gerät mit beliebiger `kasse` registrieren, es aber nie wieder sehen oder sperren. |
| F9 | §3.10 „Leitung: PIN fremder Benutzer“ | Leitung setzt PIN für Mitarbeiter | `set_pin`: fremder `user` erlaubt für Admin **oder jede Leitung**, ohne Prüfung des Ziels. `list_operators` zeigt auch Benutzer mit `ROLLEN_ADMIN`; `verify_pin` liefert deren volle `roles`. | Eine Bereichsleitung kann die PIN des Backoffice-Admins setzen und sich am Kiosk als Admin anmelden (Rechteausweitung). |
| F10 | §3.11 Registrierung Typ Kassa: „Kasse (nur Typ Kassa)“ | optional | `PH Geraet.kasse` Data, nicht Pflicht; `validate` prüft Existenz nur, wenn gefüllt. | Kassa-Kiosk ohne Kassenidentifikationsnummer möglich → Kassa-Seite muss raten, welche `PH Kasse` signiert (RKSV § 7: jeder Beleg einer registrierten Kasse). |
| F11 | §3.9 Firma „UID ATU + 8 Ziffern bei Land Österreich“ | Prüfung greift | `PH Firma.land` ist Data; Prüfung nur bei exakt `"Österreich"` (`ph_firma.py`). „AT“, „Austria“, „Oesterreich“ umgehen sie. Kein Feld `sitz`. | Fehlerhafte UID landet unbemerkt auf jeder Rechnung; UGB-§-14-Angabe „Sitz“ fehlt (R4). |
| F12 | §3.9 Firma „Als Standard setzen … Undo“, §0 | harmlos umkehrbar | `ph_firma.validate` setzt alle anderen per `frappe.db.sql` auf `standard=0` (kein Versionseintrag). Rechnungen haben **kein** Link-Feld auf die ausstellende Firma; `ph_faktura/einstellungen.py` und `ph_firma()` (Druck) lesen immer die **aktuelle** Standardfirma. | Jede Vorschau/Neuerzeugung eines älteren Belegs (Entwurf, AB, Lieferschein, Mahnung) erscheint mit dem anderen Rechtsträger; Undo stellt nur die Markierung zurück, nicht bereits erzeugte Belege. |
| F13 | §6.1 „Offene Posten“ | Summe `offen_cent` Status Gestellt/Teilbezahlt/Ueberfaellig/Gemahnt | `PH Rechnung.art` umfasst `Anzahlungsrechnung` und `Schlussrechnung`; `offen_cent` in Belegwährung (`waehrung`, `kurs`). Gutschriften (`PH Gutschrift.erstattung_art = Verrechnung mit offener Rechnung`) wirken nur, wenn ph_faktura `offen_cent` nachzieht (nicht in ph_core prüfbar). | Mischsumme EUR+CHF; Anzahlungsanforderungen werden wie Forderungen gezählt (R1). |
| F14 | §6.1 „Offene Bestellungen“ | Statusliste | `PH Bestellung.status` hat zusätzlich `reserviert`, `teilerstattet`, `widerrufen`. | „reserviert“ fehlt in der Kennzahl; Widerrufe mit offener Erstattung erscheinen nirgends (R5). |
| F15 | §1.3 „Neue Mitarbeiterin … E-Mail Pflicht“, §3.10 Passwort-Reset | jeder Benutzer hat E-Mail | Frappe-`User.name` = E-Mail. Monteure/Aushilfen ohne Postfach sind nicht vorgesehen; `send_welcome_email`/`reset_password` laufen ins Leere. | Kiosk-Bediener ohne Firmenmail können nicht angelegt werden (R6). |
| F16 | §3.10 Liste „Zuletzt aktiv (`last_active`)“ für Leitung, §3.8 Aktivität mit Person-Filter, §6.2 „Aufgaben erledigt je Woche (Team)“ | Leitung sieht | Daten vorhanden (Frappe `User.last_active`, `Version.owner`). Keine Rechtsgrundlage/Begrenzung im Konzept. | Leistungs- und Verhaltenskontrolle → R7. |

---

## 2. Fehlende Pflichtprozesse (Betrieb Möbelhandel, 10–15 Personen)

| # | Prozess | Warum Pflicht | Daten heute | Soll in der Zentrale |
|---|---|---|---|---|
| PP1 | **Fristenkalender Steuer/Kassa** | UVA bis 15. des zweitfolgenden Monats (§ 21 UStG), OSS-Meldung quartalsweise bis Monatsende nach Quartal (Rechnung kennt `ust_fall=OSS`, `oss_land`), RKSV: Monatsbeleg, Jahresbeleg + Prüfung (`PH Kassa Ereignis.art = Jahresbeleg Pruefung`), SEE-Ausfall > 48 h melden (`meldung_finanzonline_noetig`), DEP-Sicherung mindestens quartalsweise (`PH DEP Export`) | alle Quellfelder vorhanden; keine Zusammenführung | Heute-Leiste-Chips für Faktura Leitung, Kassa Leitung, GF, Buchhaltung extern (§5.1 unten). |
| PP2 | **Datenschutzanfragen** (Auskunft, Berichtigung, Löschung, Widerspruch) | Art. 12 Abs 3 DSGVO: Antwort binnen 1 Monat; Löschung kollidiert mit 7 Jahren BAO § 132 → Sperren statt Löschen | `PH Kontakt.datenauskunft()/datenauskunft_json()` (nur CRM), `PH Newsletter Abo.auskunft()/loeschen_dsgvo()`; kein app-übergreifender Vorgang, keine Frist | DocType `PH Datenschutzanfrage` (ph_core, P8), Chip „Datenschutz: Frist in n Tagen“, Akte mit „Auskunft erzeugen“ (sammelt alle Apps). |
| PP3 | **Mitarbeiter-Austritt / Deaktivieren** | Offene Aufgaben, ToDos, Freigaben, Geräte-PIN, Sitzungen, Berater-Zuordnung (`PH Kontakt.berater`) bleiben sonst an einer Person hängen; Zugriff muss am letzten Tag enden | `User.enabled`, `ph_core_pin_hash`, `PH Aufgabe.zugewiesen_an`, `ToDo.allocated_to`, `PH Kontakt.berater` | Assistent Z5 „Benutzer austragen“ statt einfachem `enabled=0` (§5.2). |
| PP4 | **Vertretung bei Abwesenheit** | Freigaben (Erstattung → 14-Tage-Frist FAGG § 15) dürfen nicht im Urlaub der GF liegen bleiben | `PH Abwesenheit.vertretung` (Link PH Mitarbeiter) vorhanden | Freigaben und Aufgaben einer genehmigt abwesenden Person erscheinen bei `vertretung` im Reiter „Für mich“ mit Kennzeichen „Vertretung für …“. |
| PP5 | **Widerrufs-/Rücktrittsfristen** | FAGG § 11 (14 Tage), § 15 (Erstattung binnen 14 Tagen); auch Außergeschäftsraumverträge (Küchenplanung beim Kunden, Messe) | `PH Widerruf.frist_ende`, `erstattung_bis`, `rueckgabe_bis` – nur für Shop-`bestellung` | Chip „Erstattung fällig ≤ 3 Tage“ (rot), Freigabe-Eintrag mit Fristdatum. AB-Verträge siehe P11. |
| PP6 | **Produktiv-Freigabe-Check** | Testmodus, API-Schalter, Schlüssel, Standardfirma-Pflichtfelder müssen vor dem ersten echten Beleg stimmen | `PH Einstellungen.testmodus/api_aktiv`, `ping.testmodus`, Schlüsselnamen nur als Liste | Admin-Kachel „Betriebsbereitschaft“ mit 6 Prüfpunkten (§5.3). |
| PP7 | **Zahlungsfreigabe Eingangsrechnungen mit Vier-Augen** | Betrugsschutz (geänderte Lieferanten-IBAN), interne Kontrolle | `PH Eingangsrechnung.freigeben()` prüft nur „Leitung“, nicht `geprueft_von ≠ freigegeben_von` | Siehe P5. |

---

## 3. Verstöße gegen Recht oder Buchhaltungslogik

| # | Thema | Befund | Rechtsgrundlage / Logik | Schwere |
|---|---|---|---|---|
| R1 | „Umsatz Monat“ | Zahlungseingang ≠ Umsatz. Enthält Anzahlungen (erhaltene Anzahlung = Verbindlichkeit bis Leistung), Mehrzweck-Gutscheinverkäufe (kein Umsatz), Kassa-Zahlungen zusätzlich zu Rechnungszahlungen der gleichen Leistung möglich (`Verrechnung`-Kanal), brutto statt netto, CHF-Beträge in CHF-Cent, Testzahlungen (`livemode=0`), ignoriert Erstattungen (`art=Erstattung`) und streicht teilerstattete Zahlungen komplett. | Umsatz im Sinne Buchhaltung = Nettoentgelt der ausgeführten Leistungen (Rechnungen/Gutschriften nach `leistungsdatum`), § 19 Abs 2 UStG für die USt-Entstehung. | hoch (GF steuert nach falscher Zahl) |
| R2 | Testmodus auf Produktiv-Site | Default `testmodus=1`; bei echten Stripe-Schlüsseln + `livemode` liefert `terminal.dienst()` Mock → Kassa meldet „bezahlt“, RKSV-Beleg wird signiert, Umsatzzähler steigt, Geld fließt nicht. Kundenmails (AB, Widerrufsbestätigung) gehen an das Team-Postfach. | RKSV/BAO § 131b (Beleg = echter Barumsatz); FAGG § 7 Abs 3 (Vertragsbestätigung auf dauerhaftem Datenträger an den Verbraucher). | hoch |
| R3 | Ausstellende Firma je Beleg | Kein Link `PH Firma` an `PH Rechnung`/`PH Gutschrift`/`PH Auftragsbestaetigung`; Druck nimmt Standardfirma zum Druckzeitpunkt; Standardwechsel mit Undo. | UStG § 11 Abs 1 Z 3 lit a: Name/Anschrift des **leistenden** Unternehmers; Nummernkreis eindeutig je Unternehmer (lit c). | hoch, sobald zweite Firma existiert; sonst latent |
| R4 | Firmenstammdaten unvollständig zulässig | `strasse, plz, ort, uid, firmenbuchnummer, firmenbuchgericht, rechtsform` nicht Pflicht; kein `sitz`. | UStG § 11 (UID des Ausstellers, Anschrift); UGB § 14 (Firma, Rechtsform, Sitz, Firmenbuchnummer, Firmenbuchgericht auf Geschäftsbriefen/Bestellscheinen/Websites). | mittel |
| R5 | Widerruf ohne E-Mail / ohne Shop-Bestellung | `PH Widerruf.kunde_email` **reqd**, Bezug nur `bestellung`/`gutschein_bestellung`. Rücktritt per Brief/Telefon/Showroom (Kanal existiert!) ohne E-Mail nicht erfassbar; Rücktritt vom Außergeschäftsraumvertrag (AB) nicht abbildbar. | FAGG § 13 (formfreie Erklärung möglich), § 11 (AGV). | mittel (ph_shop, wirkt auf Zentrale-Chips/Freigaben) |
| R6 | Freigaben ohne Vier-Augen | `PH Zahlung.erstattung_freigeben()` prüft nur Rolle; GF kann eigene Anforderung (`erstattung_angefordert_von`) freigeben. `PH Eingangsrechnung.freigeben()` ebenso ohne Abgleich mit `geprueft_von`. Konzept-Glocke macht das mit einem Klick. | Interne Kontrolle (Steuerberater-/Prüfungsstandard), Betrugsprävention. | mittel |
| R7 | Mitarbeiterkontrolle | Person-Filter im Aktivitätsstrom, `last_active` in der Benutzerliste für Leitung, Chart „Aufgaben erledigt je Woche (Team)“ = Leistungs- und Verhaltenskontrolle. | ArbVG § 96 Abs 1 Z 3 / § 96a (mit Betriebsrat: Zustimmung bzw. Betriebsvereinbarung), AVRAG § 10 (ohne Betriebsrat: Zustimmung jedes Mitarbeiters bei Maßnahmen, die die Menschenwürde berühren), DSGVO Art. 5 Abs 1 lit b/c, Art. 13. | mittel – bis Inhaber-/Rechtsentscheidung abschalten |
| R8 | Abwesenheiten in Glocke/Freigaben/Team | Konzept zeigt „Urlaub L. Berger 12.–16.12. Genehmigen“. `PH Abwesenheit.art` enthält `Krankenstand`, `Pflegefreistellung`; `begruendung` Freitext. | DSGVO Art. 9 (Gesundheitsdaten); GlBG (Pflegefreistellung/Elternteilzeit nicht als Leistungsmerkmal sichtbar machen). | mittel |
| R9 | CSV-Export ohne Zweck/Protokoll | Benutzer-, Aufgaben-, Protokoll-Export; Audit-Methode fehlt (Konzept erkennt Lücke, setzt Export aber trotzdem frei). | DSGVO Art. 5 Abs 2 (Rechenschaft), Art. 32. | niedrig–mittel |
| R10 | Fremdwährung CHF | Keine Kursquelle in `PH Einstellungen`; Kennzahlen summieren Belegwährung. | UStG § 20 Abs 6 (Umrechnung zum Kurs nach BMF-Durchschnittskurs oder Tageskurs, einheitlich anzuwenden – Verfahren mit Steuerberater festlegen). | mittel bei Schweizer Kundschaft (Lochau, Grenznähe) |
| R11 | Steuerberater-Zugriff | Rolle `PH Buchhaltung extern` liest PH Rechnung, Zahlung, Kassenbeleg, Kassenbuch, Bankumsatz; Konzept-Palette verspricht „nur Faktura/Kassa-DocTypes“, `global_search` sucht aber alle lesbaren DocTypes inkl. `PH Zahlung` (Shop). Kein Anmelde-/Zugriffsprotokoll für Externe im Reiter „Anmeldungen“ für GF. | DSGVO Art. 32; BAO § 132 (Datenzugriff der Abgabenbehörde/Prüfer). | niedrig |

---

## 4. Pflichtänderungen (konkret, mit DocType/Feld/Methode)

| # | Änderung | Wo | Detail / Akzeptanz |
|---|---|---|---|
| **P1** | Testmodus produktiv absichern | `PH Einstellungen` (ph_core) + Konzept §3.9 | Neues Feld `site_rolle` Select `Staging\|Produktiv` (read_only, aus `site_config` `ph_site_rolle`). `ph_einstellungen.validate`: `testmodus=1` auf `Produktiv` nur mit Pflichtfeld `testmodus_grund` (Data 140) und Kommentar. `ping` liefert `site_rolle`. Zentrale: auf Produktiv mit Testmodus **rotes** Systemband über allen Seiten „Testmodus auf der Produktiv-Site: Kartenzahlung wird simuliert, Kundenmails gehen an das Team-Postfach.“ (nicht wegklickbar), Kassa-Kiosk blockiert Zahlart Karte. Rückfragetext ersetzen (F6). Akzeptanz: E2E mit `site_rolle=Produktiv, testmodus=1` → Band + Kartenknopf deaktiviert. |
| **P2** | „Umsatz Monat“ neu definieren | Konzept §6.1/§6.2, `dashboard.js umsatzJeMonat` | Kennzahl „Umsatz Monat (netto)“ = Σ `PH Rechnung.netto_cent × kurs` mit `docstatus=1`, `status != Storniert`, `art in (Rechnung, Teilrechnung, Schlussrechnung, Barverkauf)`, `leistungsdatum` im Monat (Rückfall `datum`) **minus** Σ `PH Gutschrift.netto_cent` (`docstatus=1`, `datum` im Monat). Kassa-Umsatz ohne Rechnung kommt aus `PH Kassenabschluss.umsatz_je_satz` (netto je Satz), nicht aus `PH Zahlung`. Zweite Kennzahl „Zahlungseingang Monat“ = Σ `PH Zahlung.betrag_eur` (`livemode=1`, `art=Eingang`, `status in (Bezahlt, Teilerstattet)`) − Σ `art=Erstattung`. Unterzeile „davon Anzahlungen n €“. Rechte: Kennzahl nur bei Leserecht auf `PH Rechnung` **und** `PH Gutschrift`; `PH Zahlung`-Leserecht für `PH Faktura Leitung` in ph_shop ergänzen (read, report) oder Kennzahl für Faktura Leitung auf Rechnungsbasis beschränken. Tooltip nennt Definition. |
| **P3** | Ein Aufgabenmodell | ph_core (neu) + alle Apps; Konzept §3.6, §9 | Entweder (a) `PH Aufgabe` nach ph_core verschieben und Helfer `ph_core.utils.aufgaben.anlegen(titel, referenz_doctype, referenz_name, rolle=None, user=None, prioritaet, quelle="scheduler")` bereitstellen; `ph_shop.mails.aufgabe` und die sechs anderen ToDo-Erzeuger darauf umstellen; oder (b) die Zentrale liest `ToDo` (`allocated_to=ich`, `status=Open`) zusätzlich und zeigt sie mit Kennzeichen „System“. Empfehlung (a) – sonst zwei Statusmodelle (ToDo: Open/Closed/Cancelled). Rechte P3-Teil: `PH Aufgabe` read/write/create für alle PH-Rollen, `if_owner` bzw. User Permission `zugewiesen_an` für Mitarbeiter (Konzept §9 richtig). |
| **P4** | Rechte-Engführung `leitung=True` | `ph_core/api/__init__.py` (`hat_rolle`), `api/geraete.py`, `api/bediener.py` | `register_device`: Rollen `ROLLEN_ADMIN` + Leitung **passend zum Typ**: Kassa → `PH Kassa Leitung`; Packtisch → `PH Logistik Leitung`; Mobil → `PH Projekte Leitung`/`PH Service Leitung`; Backoffice → nur Admin. `set_pin(user≠ich)`: Leitung nur, wenn Ziel **keine** Rolle aus `ROLLEN_ADMIN`, `PH Geschäftsführung`, `PH * Leitung` hat und mindestens eine Rolle des eigenen Bereichs teilt; sonst 403. `list_operators`: Admin-Benutzer nur mit Check `User.ph_core_kiosk_erlaubt` (neues Custom Field). Konzept §2.1/§3.10 entsprechend. Akzeptanz: Test „Marketing Leitung registriert Kassa-Gerät → 403“, „Kassa Leitung setzt PIN von Admin → 403“. |
| **P5** | Vier-Augen bei geldwirksamen Freigaben | `PH Zahlung.erstattung_freigeben` (ph_shop), `PH Eingangsrechnung.freigeben` (ph_faktura); Konzept §3.5/§5.1 | Server: `frappe.session.user != erstattung_angefordert_von` bzw. `!= geprueft_von` (Ausnahme nur mit Einstellung `vier_augen_ausnahme_bis_cent` in `PH Einstellungen`, Default 0). Glocke: Eintrag zeigt Antragsteller; ist es der eigene Antrag, Knopf deaktiviert mit Grund „Eigener Antrag – zweite Person nötig“. |
| **P6** | Kulanzfreigabe als Methode | `PH Servicefall` (ph_service) | `kulanz_freigeben()` / `kulanz_ablehnen(grund)` whitelisted, setzt `kulanz_freigegeben_von`, Kommentar; implizites Setzen in `validate` entfernen. Konzept F5 korrigieren. |
| **P7** | Ausstellende Firma am Beleg | `PH Rechnung`, `PH Gutschrift`, `PH Auftragsbestaetigung`, `PH Angebot`, `PH Mahnung` (ph_faktura), `PH Kasse` (ph_kassa hat Link bereits laut grep) | Neues Feld `aussteller_firma` Link `PH Firma` (reqd, Default Standardfirma, read_only nach `docstatus=1`); Druck `ph_firma(doc.aussteller_firma)`. `PH Firma`: „Als Standard setzen“ ohne Undo, mit Rückfrage „Neue Belege werden ab jetzt auf <Firma> ausgestellt“; Löschen gesperrt, sobald ein Beleg sie referenziert. Nummernkreis-Anzeige (§3.9) je Firma, sobald > 1 Firma existiert. |
| **P8** | `PH Datenschutzanfrage` | ph_core (neu) | Felder: `naming_series` `DS-.YYYY.-.####`, `art` Select `Auskunft\|Berichtigung\|Löschung\|Einschränkung\|Widerspruch\|Datenübertragung`, `eingang` Datetime reqd, `kanal` Select `E-Mail\|Brief\|Telefon\|Showroom\|Portal`, `kontakt` Link PH Kontakt, `name_freitext`, `identitaet_geprueft` Check + `identitaet_geprueft_von`, `frist` Date (= eingang + 1 Monat, read_only), `verlaengert_bis` Date + `verlaengerung_grund` (Art. 12 Abs 3: + 2 Monate), `status` `Eingegangen\|In Bearbeitung\|Beantwortet\|Abgelehnt`, `ergebnis` Attach, `beantwortet_am`, `sperrvermerk` Small Text (was wegen BAO § 132 nur gesperrt statt gelöscht wurde). Methode `auskunft_sammeln()` ruft Hook `ph_core_datenauskunft` (neuer Hook-Name, jede App liefert ihren Teil). Rechte: GF, Admin; CRM Leitung lesen. Zentrale: Chip, Liste unter Zentrale › Datenschutz. |
| **P9** | Gerät: `aktiv` nur über Methoden, Kasse Pflicht bei Kassa | `PH Geraet` JSON + `ph_geraet.py` | `aktiv` `read_only=1`; `validate`: Änderung von `aktiv` außerhalb `flags.ph_methode` → throw. `typ=Kassa` ⇒ `kasse` reqd (`mandatory_depends_on: eval:doc.typ=='Kassa'`). `_geraet_aktiv`: 403-Daten um `gesperrt_grund` ergänzen (Konzept §9 richtig). `sperren()` auf Kassa-Gerät: Rückgabe `offene_offline_belege` (sobald ph_kassa Offline-Puffer hat) und Konzept-Dialog warnt „n Belege noch nicht übertragen – erst übertragen, dann sperren“. |
| **P10** | Firmenstammdaten Pflichtfelder | `PH Firma` | `land` → Link `Country` (Default Austria), UID-Prüfung auf `land == "Austria"`; neues Feld `sitz` Data; `mandatory`: `strasse, plz, ort, land, uid, rechtsform, sitz, firmenbuchnummer, firmenbuchgericht` sobald `standard=1`. Einstellungen-Reiter Firma zeigt fehlende Pflichtangaben als Liste oben („Für Rechnungen fehlt: Sitz, Firmenbuchgericht“). |
| **P11** | Widerruf ohne E-Mail, für AB-Verträge | `PH Widerruf` (ph_shop) | `kunde_email` nicht reqd, stattdessen `mandatory_depends_on: kanal in (Formular, E-Mail)`; neues Feld `auftrag` Link `PH Auftragsbestaetigung`; `bestaetigung_kanal` Select `E-Mail\|Brief\|persönlich`. Zentrale-Chip „Erstattung fällig“ aus `erstattung_bis`. |
| **P12** | Kontrolle/Personaldaten begrenzen | Konzept §3.8, §3.10, §6.2, §3.5 | Aktivität: Person-Filter und Chart „Aufgaben erledigt je Woche (Team)“ standardmäßig **aus**, schaltbar nur über `PH Einstellungen.mitarbeiterauswertung_freigegeben` (Check, mit Feld `rechtsgrundlage` Select `Betriebsvereinbarung\|Einzelzustimmungen AVRAG § 10`, `freigegeben_am`). `last_active` nur Admin. Abwesenheiten in Glocke/Team nur als „abwesend von–bis“ ohne `art`/`begruendung`; `Krankenstand` nie als Freigabe-Eintrag (Meldung, keine Genehmigung). |

Empfohlen (nicht blockierend): Kursquelle `PH Einstellungen.waehrung_kursquelle` Select `EZB-Tageskurs\|BMF-Durchschnittskurs` + Anzeige aller Kennzahlen in EUR über `kurs`/`betrag_eur`; Feld `PH Kontakt.rechnung_per_email_zugestimmt` (Check + Datum) für F4; Audit-Methode CSV-Export vor Freischaltung des Exports (R9).

---

## 5. Randfälle – Soll-Verhalten

### 5.1 Fristen-Chips (PP1, PP2, PP5) – Ergänzung Heute-Leiste §6.3

| Chip | Rolle | Quelle | Ton | Leer |
|---|---|---|---|---|
| „UVA <Monat> fällig 15.<MM>“ (ab 5 Tage vorher) | Faktura Leitung, GF, Buchhaltung extern | kein `PH Export Lauf` mit `zeitraum_bis ≥ Monatsende` und `status in (Uebergeben, Bestaetigt)` | Sand, ≤ 2 Tage rot | Chip fehlt |
| „OSS Q<n> fällig“ | dito | ∃ `PH Rechnung.ust_fall = OSS` im Quartal | Sand/rot | – |
| „Jahresbeleg prüfen“ (Jänner bis 15.02.) | Kassa Leitung, GF | `PH Kassa Ereignis.art = Jahresbeleg Pruefung`, `status != Erledigt` | rot ab 10.02. | – |
| „SEE-Ausfall > 48 h melden“ | Kassa Leitung, GF, Admin | `PH Kassa Ereignis.meldung_finanzonline_noetig = 1`, `gemeldet_am` leer | rot | – |
| „DEP sichern (Quartal)“ | Kassa Leitung | letzter `PH DEP Export` älter als Quartalsbeginn | Sand | – |
| „Datenschutz: n Tage bis Frist“ | GF, Admin | `PH Datenschutzanfrage.frist`/`verlaengert_bis` | ≤ 7 Tage rot | – |
| „Erstattung fällig“ | Shop Leitung, GF | `PH Widerruf.erstattung_bis ≤ heute+3`, `status != Erstattet` | rot | – |

Klick öffnet die gefilterte Liste; Tooltip nennt Rechtsgrundlage in einem Satz („Frist nach FAGG: 14 Tage ab Rücktritt“). Keine Animation außer der Standard-Chip-Hover (120 ms, `ease-out`).

### 5.2 Fachliche Randfälle

| Fall | Soll-Verhalten Zentrale | Datenbasis |
|---|---|---|
| **Storno Rechnung** | Bezug-Karte in Aufgabe zeigt Badge „Storniert · GU-…“; offene Aufgaben mit diesem Bezug erhalten in der Liste Kennzeichen „Bezug storniert – Aufgabe noch nötig?“ (Knopf „Verwerfen“). OP-Kennzahl schließt `Storniert` aus (vorhanden). Palette findet Rechnung **und** Storno-Gutschrift unter der RE-Nummer (`PH Gutschrift.rechnung`). | `PH Rechnung.storno_durch`, `storniert_am` |
| **Storno Kassenbeleg** | „Kassa heute“ = Σ `gesamt_cent` mit `trainings=0`, `belegart in (Standard, Stornobeleg, Sammelbeleg)`, `status in (Signiert, Ausfall, Nachsigniert)`; Stornobeleg negativ. Null-/Monats-/Jahres-/Start-/Schlussbelege zählen nicht. Unterzeile „n Stornos“. | `PH Kassenbeleg.belegart`, `trainings`, `status` |
| **Teillieferung** | Heute-Chip „Restlieferung offen n“ (Logistik/Projekte); Aufgabe aus AB mit Teillieferung → Bezug-Karte zeigt „geliefert x von y Positionen“ (Fachbereich liefert Wert). Kennzahl „Montagen Woche“ zählt Teilmontagen einzeln. | `PH Rechnung.teillieferung_hinweis`, Logistik |
| **Anzahlung** | OP-Kennzahl Unterzeile „davon Anzahlungsanforderungen n €“ (`art = Anzahlungsrechnung`), nicht in „überfällig“-Mahnlogik der Zentrale mischen. Umsatz-Kennzahl ohne Anzahlungen (P2). Schlussrechnung: OP nur `zahlbar_cent − bezahlt_cent`. | `PH Rechnung.art`, `anzahlung_*`, `zahlbar_cent` |
| **Retoure/Widerruf** | Freigabe-Eintrag „Erstattung 1.240,00 € · Frist 18.11.“; nach Ablauf rot im Reiter „Für mich“ der GF **und** Vertretung (PP4). Kunde ohne E-Mail: Bestätigung per Brief → Aufgabe „Bestätigung per Post senden“ automatisch (P11). | `PH Widerruf.*`, `PH Zahlung.erstattung_*` |
| **Fremdwährung CHF** | Alle Kennzahlen in EUR; Belege in CHF in Listen mit Kennzeichen „CHF“; Palette: Präfix `CHF 1200` sucht Betrag in CHF-Belegen, `€` nur EUR (bzw. `betrag_eur`). Kurs am Beleg sichtbar in der Bezug-Karte („Kurs 0,9412 vom 03.11.“). Ausfuhr an Schweizer Privatkunden: `ust_fall = Ausfuhr` nur mit Ausfuhrnachweis-Anhang (Fachbereich Faktura); Zentrale-Chip „Ausfuhrnachweis fehlt n“ für Faktura Leitung. | `PH Rechnung.waehrung/kurs/ust_fall`, `PH Zahlung.betrag_eur` |
| **Kunde ohne E-Mail** | „Per E-Mail“ in Druckvorschau deaktiviert mit Grund „Keine E-Mail-Adresse – drucken oder Post“; Palette findet Kontakt über Telefon (Ziffern-Normalisierung, Lücke §9 bleibt). Aufgabe „Angebot nachfassen (Mail-Vorlage)“ wird zu „Anrufen“ bei `kommunikation_bevorzugt ≠ E-Mail`. `PH Kontakt.nicht_kontaktieren = 1` oder `status = Gesperrt` → „Nächster Schritt“ ohne Kontaktvorschlag, Band „Kontakt nicht erwünscht“. | `PH Kontakt.kommunikation_bevorzugt`, `nicht_kontaktieren`, `status` |
| **Mitarbeiter ohne E-Mail** (Monteur, Aushilfe) | `/benutzer/neu`: Schalter „Ohne Postfach (nur Kiosk)“ → E-Mail-Feld wird `vorname.nachname@kiosk.intern` (nicht zustellbar, Domain konfigurierbar), `send_welcome_email=0`, kein Passwort, PIN-Schritt Pflicht, Rollen auf Kiosk-Rollen begrenzt. Passwort-Reset-Menüpunkt ausgeblendet. | Frappe `User`, `ph_core_*` |
| **Austritt** | Assistent Z5: 1) offene `PH Aufgabe`/`ToDo` umverteilen (Ziel-Combobox, Pflicht), 2) `PH Kontakt.berater` umhängen, 3) PIN-Hash löschen (`ph_core_pin_hash = null`), 4) Sitzungen beenden (`frappe.sessions.clear_sessions(user)`), 5) `enabled = 0`; Zusammenfassung „5 Aufgaben an Lena, 12 Kontakte an Anna, PIN gelöscht, abgemeldet“. Fehler in Schritt n → Schritte davor bleiben, Liste der offenen Schritte. | Methode fehlt: `ph_core.api.bediener.austragen(user, ziel_user)` (Anfrage) |
| **Gerät verloren mit offenen Offline-Belegen** | Sperren-Dialog zeigt Warnband `warning-soft`; Sperre wirkt, aber Kassa-Leitung erhält Aufgabe „Ausfall dokumentieren“ und `PH Kassa Ereignis` (Kasse Ausfall Beginn) wird vorgeschlagen. | P9, ph_kassa |
| **Zweite Firma (z. B. Yacht/Hotel-Gesellschaft)** | Zentrale-Kopf zeigt Firmen-Umschalter nur, wenn > 1 `PH Firma`; Kennzahlen je Firma oder gesamt (Segment). Ohne P7 nicht freigeben. | P7 |
| **Steuerberater sucht Beleg** | Palette für `PH Buchhaltung extern` sendet `doctypes=[PH Rechnung, PH Gutschrift, PH Kassenbeleg, PH Kassenabschluss, PH Eingangsrechnung, PH Export Lauf, PH Bankumsatz]` explizit (nicht Server-Standard); Zugriffe Externer im Reiter „Anmeldungen“ für GF lesbar. | `global_search(doctypes)`, `Activity Log` |

---

## 6. Rechte- und Datenprüfung (Kleinbefunde)

| # | Befund | Empfehlung |
|---|---|---|
| K1 | `PH Firma` hat Leserecht `All` (inkl. Portal-/Website-Benutzer). Inhalt ist öffentlich (Impressum, Rechnungen), aber `steuernummer` und `notizen`-ähnliche Felder kommen ggf. dazu. | `steuernummer` auf `permlevel 1` (GF, Admin, Faktura Leitung). |
| K2 | `PH API Protokoll`: GF liest; `anfrage_json` kann Kundendaten enthalten (`api_protokoll_nutzdaten`). Konzept beschränkt Nutzdaten auf System Manager – im DocType nicht abgesichert. | `antwort_json`, `anfrage_json` `permlevel 1` nur System Manager. |
| K3 | `PH Einstellungen.testmodus` Default `1` (JSON). | Mit P1 erledigt; zusätzlich `after_install` auf Produktiv nicht überschreiben. |
| K4 | Rollenzahl: `role.json` 29, `hooks.PH_ROLLEN` 27, README „27“. | Konzept §9 richtig; README mitziehen. |
| K5 | `PH Aufgabe.faellig` reqd – Schnellanlage aus Glocke/Palette ohne Datum scheitert sonst. | Konzept belegt „morgen“ vor (richtig); Server-Default ergänzen (`default: Today` + 1 im Controller). |
| K6 | Rechnungsentwürfe heißen `ENTW-…` (naming.py Kommentar); Palette-Normalisierung kennt nur Serienpräfixe. | `ENTW` in Regex-Register der Palette aufnehmen. |
| K7 | `PH Bestellung.waehrung` reqd, Kennzahl zählt nur Anzahl – ok; bei Summen später `betrag_eur`-Äquivalent nötig. | – |
| K8 | `PH Servicefall` hat `regress_frist_bis`, `frist_reaktion`, `fristen_status` – Konzept §6.1 „Fachbereich liefert Feld“ ist überholt. | Unterzeile „n Fristen ≤ 14 Tage“ direkt aus `regress_frist_bis`/`frist_reaktion`. |
| K9 | Papierkorb „30 Tage“ (§4.1) – Frappe `Deleted Document` hat keine Frist. | Zahl streichen oder Scheduler in ph_core definieren. |

---

## 7. Was das Konzept richtig macht (nicht verwässern)

1. Token und PIN verlassen den Server nie; Token-Dialog einmalig, QR nur auf Zielgerät (Z-21/Z-22) – deckt sich mit `geraete.py`/`bediener.py`.
2. Aktivitätsstrom nur mit Feld-Labels, Kommentartexte nie (`aktivitaet.py` bestätigt).
3. Personal-DocTypes nicht in der globalen Suche (`suche.py` bestätigt).
4. Einstellungen ohne Autosave mit Speicherleiste; Nummernkreise nur lesend.
5. Rückfrage statt Undo bei Token erneuern, Sperren, Deaktivieren – richtig klassifiziert.
6. Kennzahlen ohne Recht fehlen statt ausgegraut; keine erfundenen Werte („–“).
7. Lückenliste §9 benennt Server-Arbeit statt sie im Client nachzubauen.

---

## 8. Anfragen, die aus dieser Kritik entstehen

| An | Punkt |
|---|---|
| ph_core | P1 (`site_rolle`, `testmodus_grund`), P3 (Aufgaben-Helfer, ggf. Umzug PH Aufgabe), P4 (Rollen je Gerätetyp, `set_pin`-Zielprüfung, `ph_core_kiosk_erlaubt`), P8 (`PH Datenschutzanfrage`, Hook `ph_core_datenauskunft`), P9 (`aktiv` read_only, `kasse` Pflicht, `gesperrt_grund` in 403), P10 (`PH Firma.sitz`, `land` Link Country, Pflichtfelder), P12 (`mitarbeiterauswertung_freigegeben`), Methode `bediener.austragen`, Kursquelle, K1/K2 permlevel |
| ph_faktura | P7 (`aussteller_firma` an allen Belegen), P5 (`PH Eingangsrechnung.freigeben` Vier-Augen), OP-Kennzahl in EUR und ohne Anzahlungsanforderungen, `PH Kontakt.rechnung_per_email_zugestimmt` (mit ph_crm) |
| ph_shop | P2 (`PH Zahlung` Leserecht Faktura Leitung), P5 (`erstattung_freigeben` Vier-Augen), P11 (`PH Widerruf` ohne E-Mail, `auftrag`), `mails.aufgabe` auf P3 umstellen |
| ph_service | P6 (`kulanz_freigeben`/`kulanz_ablehnen`) |
| ph_kassa | „Kassa heute“-Definition (§5.2), Offline-Belege beim Sperren (P9), Kartenzahlung bei Testmodus auf Produktiv sperren (P1) |
| ph_personal | Abwesenheit an Zentrale nur als „abwesend“ (P12), Vertretung (PP4) |
| Konzept-Autor Zentrale | F1–F16 einarbeiten; §6.1 Umsatz/Zahlungseingang trennen; §3.9 Testmodus-Text; §5.1 Freigaben mit Vier-Augen-Zeile; Assistent Z5 Austritt; Heute-Chips §5.1 dieser Kritik |
| Inhaber / Steuerberater | Mitarbeiterauswertung ja/nein und Rechtsgrundlage (R7) · Kursverfahren CHF (R10) · Vier-Augen-Ausnahmegrenze (P5) · zweite Firma geplant (P7) |

---

*Ende 21 – Fachkritik Zentrale.*
