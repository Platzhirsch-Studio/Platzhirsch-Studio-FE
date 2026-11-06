# 21 – Fachkritik Logistik (Konzept 10-konzept-logistik.md gegen App ph_logistik)

**Zweck:** Fach- und Datenprüfung des Logistik-Konzepts: Welche UI-Funktion hat kein Feld/keine Methode, welche Pflichtprozesse fehlen, wo verstößt das Konzept gegen österreichisches Recht (UStG, BAO/RKSV, FAGG, KSchG, DSGVO, ArbVG/AVRAG, UGB) oder Buchhaltungslogik, welche Randfälle fehlen. Ergebnis: Note und konkrete Pflichtänderungen je DocType/Feld/Methode.
**Stand:** 2026-11-04 · Rolle: Fachkritiker Möbelhandel + Frappe-Datenprüfer · Status: Prüfbericht, keine Entscheidung des Inhabers.
**Geprüft:** `Marktresearch/digital/backoffice/10-konzept-logistik.md` (vollständig); `Backend-Import/ph_logistik/README.md`; alle 19 DocType-JSONs (Felder, Typen, Rechte); Controller `ph_lieferschein.py`, `ph_tour.py`, `ph_lagerbestand.py`, `ph_lagerbewegung.py`, `ph_inventur.py`; `bestand.py`, `ereignisse.py`, `packtisch.py`, `api/__init__.py`, `letmeship/tarife.py`, `letmeship/dienst.py`; Gegenseite `ph_faktura` PH Auftragsbestaetigung (JSON + `lieferung_melden`), `ph_shop` PH Bestellung (JSON + `versendet_melden/abgeholt_melden`).
**Rechtsangaben:** Hinweise für die Umsetzung, keine Rechtsberatung. Vor Livegang mit Steuerberatung prüfen (siehe §7).

---

## 0. Ergebnis in Kürze

**Note: 6 / 10.**

| Teil | Bewertung |
|---|---|
| UX, Zustände, Leer-/Fehlerzustände, Kürzel, Kiosk, Klickzahlen | stark (8–9) – konkret, ehrlich bei Lücken („Volumen unbekannt“, „Nach PLZ sortieren“ statt „optimieren“) |
| Datenmapping | mittel – viele Lücken korrekt markiert, aber **vier Kernabläufe sind im Konzept als funktionierend beschrieben und funktionieren im Code nicht** (§1, B1–B4) |
| Buchhaltung / Steuern | schwach – Lieferdatum für die Rechnung, Anzahlung, Restzahlung beim Kunden, Ausfuhr/EU-Nachweise, Versand-USt fehlen ganz |
| Recht (Verbraucher, Datenschutz, Arbeitsrecht) | schwach – FAGG-Fristbeginn, Gefahrübergang/Annahmevorbehalt, Lösch-/Aufbewahrungsfristen für Unterschrift/Fotos, Live-Ansicht der Fahrer fehlen |
| Randfälle | lückenhaft – Storno nach Übergabe, Teilzustellung am Stopp, Annahmeverweigerung, CHF/Schweiz, Kunde ohne E-Mail nur teilweise |

Abzug vor allem, weil die Abnahmekriterien 10.1 Nr. 5 und 10.2 Nr. 14 mit dem heutigen Code **nicht erfüllbar** sind und das Konzept das nicht erkennt.

---

## 1. Befunde gegen den Code, die das Konzept übersieht (Blocker)

### B1 Tour-Lieferungen melden **nie** die Liefermenge an die AB
- Code: `PH Tour.starten()` setzt Stopp-Lieferscheine per `setze_status(ls, "Uebergeben", …)` – **nicht** über `ls.uebergeben()`. Damit läuft `_auftrag_fortschreiben()` nicht.
- Danach ruft `stopp_status(…, "erledigt")` → `ls.als_zugestellt()`; dort wird `_auftrag_fortschreiben()` nur aufgerufen, wenn der Lieferschein **vorher Gepackt** war (`war_gepackt`). Er ist aber schon Übergeben.
- Folge: Für jede Eigenlieferung über eine Tour bleibt `PH Beleg Position.lieferschein_menge` unverändert, AB bleibt „Offen/In Bestellung“, `teilrechnung_erstellen()` liefert falsche Mengen, ein zweites `lieferschein_aus_auftrag()` erzeugt die **gleiche Ware noch einmal** (Rest = voll).
- Konzept behauptet das Gegenteil: §0 Satz 5, §1.4 „meldet die Liefermenge an die AB“, §4.3 Zeile „Tour starten“, Abnahme 10.1 Nr. 5.
- **Pflicht:** siehe P1.

### B2 Bestand wird bei Lieferung praktisch nie ausgebucht
- `PH Lieferschein._bestand_ausbuchen()` bucht nur Positionen mit `lagerbestand`. Dieses Feld wird **weder** in `lieferschein_aus_bestellung` **noch** in `lieferschein_aus_auftrag` **noch** am Packtisch (`packtisch.py`, `scan`) gesetzt.
- Fehler beim Buchen werden mit `log_error` verschluckt – der Mitarbeiter sieht nichts.
- Folge: Bestand Lager/Showroom bleibt nach Auslieferung stehen; Inventur zeigt am Jahresende Fehlmengen mit Grund „Verkauf nicht gebucht“. Die Packtisch-Spalte „Entnahmeort“ (§7.1) zeigt immer „Ort unbekannt“.
- **Pflicht:** P2.

### B3 Doppellieferungen bei Teillieferung
- **Shop:** `lieferschein_aus_bestellung()` prüft nur, ob ein **offener** Lieferschein existiert. Ist die erste Teillieferung Zugestellt, erzeugt der zweite Aufruf ohne `positionen` wieder **alle** Mengen (kein Rest-Abzug, PH Bestellung Position hat kein `geliefert`).
- **AB:** `lieferschein_aus_auftrag()` rechnet Rest = `menge − lieferschein_menge`. Offene Entwürfe/Gepackte Lieferscheine sind nicht abgezogen (`lieferschein_menge` steigt erst beim Verlassen von Gepackt). Zwei Assistenten-Läufe hintereinander → zwei Lieferscheine über dieselbe Ware. Zusätzlich wird `positionen[z.name]` **nicht auf den Rest begrenzt** (Mengenfeld 0…Rest gibt es nur im Client).
- **Pflicht:** P3.

### B4 Mengen werden abgeschnitten
- AB-Mengen sind Float (`flt(z.menge)`), Lieferschein-, Bestand-, Bewegungs- und Inventurmengen sind **Int** (`menge:Int`, `int(rest)`). 2,5 lfm Arbeitsplatte, 12,4 m² Boden, 7,5 m Vorhangstoff werden zu 2 / 12 / 7. Für Küche/Bad/Objekt (Kerngeschäft laut Firmenprofil) ist das ein Datenfehler.
- **Pflicht:** P4.

### B5 Weitere Code-Abweichungen (Konzept teilweise richtig, aber unvollständig)
| Nr. | Code-Befund | Konzept | Wirkung |
|---|---|---|---|
| a | `PH Tour.starten` erlaubt Start aus `Geplant` (`status not in ("Geplant","Freigegeben")`) | erkannt (§4.1 Nr. 2) | ok |
| b | `stopps_hinzufuegen(lieferscheine=[…])` prüft bei expliziter Liste weder Lieferart, Status noch vorhandene Tour; `on_update` überschreibt `PH Lieferschein.tour` | nicht erkannt | Lieferschein in zwei Touren, Versand-Lieferschein in Tour |
| c | `abbrechen()` leert `tour`, lässt Lieferscheine aber **Übergeben** (nach Start) → sie fallen aus der Ablage „Ohne Tour“ (Filter Entwurf/Gepackt) | nicht erkannt | Ware „verschwindet“ aus der Disposition |
| d | „nicht angetroffen“/„verschoben“: Lieferschein bleibt Übergeben, Verkauf (falls je gebucht) bleibt, Ware liegt real wieder im Lager | teilweise (§8 Vorschlag 3) | Bestand und AB falsch |
| e | `PH Lagerbestand.ausbuchen(menge=None)` nimmt `self.menge` inkl. reservierter Menge | nicht erkannt | reservierte Kommissionsware wird mit ausgebucht bzw. Fehler „Mehr reserviert als vorhanden“ |
| f | `PH Lieferschein` hat keine Schreibsperre nach Zugestellt; Rolle PH Logistik Leitung hat `delete` | nicht erkannt | Beleg nachträglich änderbar/löschbar (BAO, siehe R3) |
| g | `PH Lagerbewegung`: Mitarbeiter hat `write`; `validate` sperrt Änderungen an gebuchten Bewegungen nicht (nur `on_trash`) | nicht erkannt | Journal änderbar (Menge, Datum, Grund) ohne Gegenbuchung |
| h | `abholbereit_melden()` gibt ohne E-Mail still `False` zurück | nicht erkannt | Kunde wird nie informiert |
| i | `PH Inventur.freigeben` bucht Differenz gegen den **Soll-Schnappschuss** der Zählliste; Bewegungen während der Zählung verfälschen die Differenz | Sperre als Lücke erkannt, Folge nicht | Inventurdifferenz falsch |

---

## 2. UI-Funktionen ohne Datenfeld / Methode (zusätzlich zu Konzept §9)

Das Konzept-Mapping §9 ist weitgehend korrekt. Zusätzlich bzw. abweichend:

| UI-Funktion (Konzept) | Problem | Benötigt |
|---|---|---|
| §3.1 Lieferschein „Zugestellt, AB vorhanden → Teilrechnung erstellen“ als **Primäraktion** | fachlich falsch für Küche/Bad mit Montage (siehe S2); AB-Feld für Abrechnungsart fehlt | `PH Auftragsbestaetigung.abrechnung` (Select `je Lieferung` · `nach Abnahme`) – ph_faktura |
| §7.1 Abholung „Bezahlt-Status“ | nur für Shop (`bezahlt_am`); für AB keine Prüfung von `offen_cent` | Methode `PH Lieferschein.zahlung_pruefen()` → `{offen_cent, anzahlung_fehlt_cent, sperre}` |
| §7.2 Stopp „Abliefern“ | kein Feld für Restzahlung beim Kunden, keine Kassa-Kopplung | siehe P7 |
| §7.2 Stopp „Positionen abhaken (rein lokal)“ | Teilzustellung/Annahmeverweigerung nicht speicherbar | `PH Lieferschein Position.menge_zugestellt`, `menge_abgelehnt`, `ablehnungsgrund` |
| §3.1 Tab „Übergabe & Fotos“ Unterschrift | kein Feld für Annahmevorbehalt | `PH Lieferschein.annahme_vorbehalt` (Check), `vorbehalt_text` |
| §2.2 Spalte „Quelle“ / §3.1 Warenwert | `warenwert_cent` ist bei Shop **brutto** (`waren_cent`), bei AB **netto** (`einzel_netto_cent`) – gleiche Spalte, verschiedene Bedeutung | `PH Lieferschein.warenwert_basis` (`netto`/`brutto`) oder einheitlich netto + `waehrung` |
| §3.2 Kosten-Tab „Kosten vs. berechnet“ | Abgleich mit der **Eingangsrechnung** des Dienstleisters fehlt | `PH Sendung.eingangsrechnung` (Link, ph_faktura/Buchhaltung), `abgerechnet_cent` |
| §2.4 Plantafel „Abwesend“ | ok als Lücke markiert | – |
| §6 Lieferschein-Druck | keine Felder für Gelangensbestätigung/Ausfuhr, kein CMR-Frachtbrief für Spedition | siehe P9, Print Format „PH Lieferschein CMR“ |
| §2.5 „Bestand erfassen“ mit EK | Bewegung trägt keinen Wert → Inventurdifferenz und Lagerwert zum Stichtag nicht bewertbar | `PH Lagerbewegung.wert_cent` (EK × Menge zum Buchungszeitpunkt, permlevel 1) |
| §3.4 „An Kassa verkaufen“ | bucht Verkauf vor Zahlung (Konzept erkannt) – zusätzlich: kein Rückweg, wenn Kunde an der Kassa abbricht | Ablauf P8 |
| §7.2 Live-Ansicht Tour „Aktualisierung 30 s“ | Mitarbeiterkontrolle ohne Rechtsgrundlage dokumentiert (R6) | Einstellung `PH Logistik Einstellungen.live_ansicht` + Hinweistext |
| Kunde ohne E-Mail (alle Mails) | kein Kanal-Feld, kein Ersatzweg | `PH Lieferschein.benachrichtigung` (Select `E-Mail` · `SMS` · `Telefon` · `keine`) |

---

## 3. Fehlende Pflichtprozesse (Möbelhandel, Vorbild SHD: Auftrag → AB → Anzahlung → Lieferung → Montage → Rechnung → Service)

| Nr. | Prozess | Warum Pflicht | Heute |
|---|---|---|---|
| S1 | **Anzahlung vor Lieferung prüfen** (Liefersperre) | Kernregel Möbelhandel: Bestellung beim Hersteller und Auslieferung nur nach Anzahlung; AB hat `anzahlung_soll_cent`, `anzahlung_ist_cent` | Logistik liest das nicht; Lieferschein/Tour/Freigabe ohne Prüfung |
| S2 | **Abrechnungsart je Auftrag** | Lieferung mit Montage (Küche, Bad, Einbaumöbel) ist in der Regel eine Werklieferung; geliefert ist erst mit Fertigstellung/Abnahme → Teilrechnung je Lieferschein ist dann falsch; richtig sind Anzahlungs-/Schlussrechnung | Konzept macht „Teilrechnung erstellen“ zur Primäraktion jedes AB-Lieferscheins |
| S3 | **Restzahlung bei Lieferung/Abholung** | häufig „Rest bei Lieferung bar/Karte“; Barzahlung beim Kunden ist ein Barumsatz → Beleg aus der Registrierkasse (RKSV) | nicht vorgesehen |
| S4 | **Lieferdatum an die Rechnung übergeben** | UStG § 11 Abs. 1 Z 3/4: Tag der Lieferung bzw. Leistungszeitraum auf der Rechnung; bei Versand gilt die Lieferung mit Beginn der Beförderung als ausgeführt (UStG § 3 Abs. 8) | Teilrechnung bekommt nur Mengen, kein Datum; welches Datum (`uebergeben_am` vs. `zugestellt_am`) gilt, ist nirgends festgelegt |
| S5 | **Rücklieferung ins Lager** nach „nicht angetroffen“, Annahmeverweigerung, Tour-Abbruch | Ware ist physisch zurück; Bestand, Lieferschein und AB müssen das abbilden | fehlt; Lieferschein bleibt Übergeben |
| S6 | **Kommissionsware reservieren beim Wareneingang** | Möbel sind überwiegend auftragsbezogen bestellt; ohne Reservierung verkauft der Showroom die Ware des Kunden | `ereignisse.wareneingang_aktualisiert` bucht nur Eingang ins Standardlager, keine Reservierung auf die AB |
| S7 | **Abholung von Ware beim Kunden** (Retoure, Tausch, Altmöbel, Reklamation) mit Beleg | Stopp-Art `Retoure`/`Abholung` existiert, aber ohne Bezug und ohne Bestandsbuchung | kein Link `PH Tour Stopp.retoure`, keine Bewegung |
| S8 | **Ausfuhr Schweiz / EU-Lieferung mit Nachweis** | AB kennt `ust_fall` = `Ausfuhr` / `Innergemeinschaftlich steuerfrei`; Steuerfreiheit nur mit Nachweis (Ausfuhrnachweis mit Ausgangsvermerk/MRN; EU: Gelangensnachweis, z. B. vom Erwerber unterschriebene Empfangsbestätigung mit Ort, Datum, Menge, Bezeichnung) | Lieferschein kennt `ust_fall` nicht, keine Felder für MRN/Nachweis; Bodensee-Kunden (Yacht/Hotel CH) liegen im Kerngebiet |
| S9 | **Stornierung mit Rückabwicklung** | Storno muss AB-Liefermenge, Bestand, Tour-Stopp und Sendung gemeinsam zurücknehmen | nur Sendung (Angelegt/Etikett) wird mitstorniert |
| S10 | **Lieferschein als unveränderbarer Beleg** ab Übergabe | Rechnung verweist auf Lieferschein (UStG § 11 Abs. 2 Verweis auf andere Belege zulässig); Aufbewahrung 7 Jahre (BAO § 132) | änderbar, löschbar (B5 f) |
| S11 | **Avis** (Konzept §8 Vorschlag 1) | spart Fehlfahrten; braucht Kanal für Kunden ohne E-Mail | nur Vorschlag |
| S12 | **Gefahrübergang und Transportschaden** | bei Verbrauchern geht die Gefahr erst mit Übergabe an den Verbraucher über (KSchG § 7b) → Schäden auf eigener Tour/Spedition trägt Platzhirsch; Beweis: Fotos + Annahmevorbehalt + Regress an Spedition/Hersteller | Fotos vorhanden, Vorbehalt und Regressweg fehlen |

---

## 4. Verstöße / Risiken Recht und Buchhaltung

| Nr. | Thema | Konzeptstelle | Befund | Pflicht |
|---|---|---|---|---|
| R1 | **Versand-USt fest 20 %** (`versand_ust_promille=200`, `tarife.kunden_cent`) | §2.9 Einstellungen, §4.5 A12 | Versandkosten sind Nebenleistung und folgen dem Steuersatz/Steuerort der Hauptleistung. Shop-B2C nach DE über OSS → deutscher Satz, nicht 20 %. Bestellung kennt `steuerland` (AT/DE). | P10 |
| R2 | **RKSV bei Barzahlung am Stopp/Packtisch** | §7.1 Abholung „An Kassa (F4)“ ok; §7.2 fehlt | Kassiert der Fahrer bar, braucht es einen Beleg aus der Registrierkasse (Belegerteilungspflicht BAO § 132a, RKSV). Ein Feld „bar erhalten“ am Stopp ohne Kassenbeleg wäre ein Verstoß. Erleichterungen für Umsätze außer Haus (Barumsatzverordnung) mit händischem Beleg und Nacherfassung prüfen lassen. | P7 |
| R3 | **Belegaufbewahrung / Unveränderbarkeit** | §3.1 „Adresse nach dem Packen gesperrt – Lücke: keine Prüfung im Server“ | Lieferschein (mit Unterschrift) ist Beleg; Rechte `delete` für Leitung und fehlende Schreibsperre widersprechen BAO §§ 131, 132 (Aufbewahrung 7 Jahre, nachträgliche Änderungen nachvollziehbar). Gleiches für `PH Lagerbewegung` (`write` für Mitarbeiter). | P6, P11 |
| R4 | **FAGG Rücktrittsfrist** | §3.1 „Retoure anlegen (→ Shop)“ | Bei Fernabsatz beginnt die 14-Tage-Frist mit Erhalt der Ware, bei Teillieferungen mit Erhalt der **letzten** Teilsendung (FAGG § 11 Abs. 2). Maßgeblich ist `zugestellt_am` des letzten Lieferscheins – das wird nicht an ph_shop gemeldet. Rückzahlung darf bis zum Erhalt der Ware oder Nachweis der Rücksendung zurückgehalten werden (FAGG § 15) → Retouren-Sendung „Unterwegs“ ist dieser Nachweis. | P12 |
| R5 | **DSGVO Unterschrift, Fotos, Telefonnummer** | §3.1 Tab Fotos, §7.2 Fotos vorher/nachher | Fotos in Kundenwohnungen/Hotelzimmern/Yachten können Personen, Kinder, Wertgegenstände zeigen; Unterschrift ist personenbezogen. Fehlt: Zweck (Beweis Lieferzustand), Löschfrist, Hinweis „keine Personen fotografieren“, Rechte (Montage sieht nur eigene Tour). Telefon/E-Mail an Carrier nur, wenn der Dienst es braucht (Datenminimierung Art. 5 Abs. 1 lit. c) – heute immer `empf_email`, `empf_telefon`. Information nach Art. 13 (Datenschutzerklärung nennt Carrier/Spediteur als Empfänger). | P13 |
| R6 | **Mitarbeiterkontrolle Tour live** | §3.3 „Live ansehen (30 s)“, `ankunft/abfahrt`, `gestartet_am`, km | Zeitstempel je Stopp + Live-Ansicht ist eine Kontrollmaßnahme. Mit Betriebsrat Betriebsvereinbarung (ArbVG § 96 Abs. 1 Z 3 bzw. § 96a); ohne Betriebsrat Zustimmung des Mitarbeiters (AVRAG § 10), soweit die Menschenwürde berührt ist. Keine GPS-Ortung einbauen. Zweck festschreiben (Kundeninfo, Disposition), keine Leistungsauswertung je Person. | P14 |
| R7 | **Inventur / Bewertung (UGB)** | §2.8, §3.5 | Jahresinventur zum Stichtag (UGB § 191/192) braucht Mengen **und** Werte zum Stichtag; Bewegung ohne Wert, `freigeben` bucht mit Freigabe-Zeitpunkt statt Stichtag; Leitung kann eigene Zählung freigeben (kein Vier-Augen-Prinzip). | P15 |
| R8 | **Ausstellungsstück: Zustand und Gewährleistung** | §2.6, §3.4 | Verkauf eines Ausstellungsstücks an Verbraucher: Abweichungen (Gebrauchsspuren) müssen dem Kunden vor Vertragsschluss eigens mitgeteilt und von ihm ausdrücklich angenommen werden (VGG § 6 Abs. 2), sonst gilt die volle Gewährleistung. `zustand` + Freitext müssen auf den Kassenbeleg/die Rechnung. | P8 |
| R9 | **GlBG** | – | Kein Befund im Logistik-Konzept (keine Stellen, keine Entgeltdaten). Rollenbezeichnungen „Fahrer/Monteur/Helfer“ in der UI geschlechtsneutral anzeigen ist Gestaltung, keine Rechtspflicht. | – |

---

## 5. Randfälle – was fehlt und wie es aussehen muss

### 5.1 Storno
| Fall | Heute | Soll (UI + Daten) |
|---|---|---|
| Storno Entwurf | ok | – |
| Storno Gepackt | Bestand nicht zurück (Konzept erkannt) | `stornieren()` bucht Gegenbuchung je `ls:{name}:{pos}`-Bewegung, entfernt Tour-Stopp, setzt `tour=None` |
| Storno Übergeben (Ware beim Carrier/Fahrer) | AB-Liefermenge bleibt erhöht | `stornieren()` ruft `PH Auftragsbestaetigung.lieferung_melden(mengen=-n)` bzw. neue Methode `lieferung_zuruecknehmen(lieferschein)` (ph_faktura); UI-Bestätigung zählt Folgen auf: „AB-2026-00017: 6 Stück zurück auf offen · Bestand Lager +6 · Sendung PH-SND-… telefonisch stornieren“ |
| Storno mit Teilrechnung | nicht geprüft | Sperre: „Teilrechnung RE-… existiert – zuerst Gutschrift in Faktura“; Knopf „Zur Rechnung“ |
| Sendung Unterwegs stornieren | gesperrt (richtig) | Weg „Rückruf beim Carrier“ als Aufgabe + Status Problem |
| AB storniert, Lieferschein offen | keine Kopplung | ph_faktura `stornieren` prüft offene Lieferscheine; Logistik zeigt Band „AB storniert – Lieferschein stornieren?“ |

### 5.2 Teillieferung
| Fall | Soll |
|---|---|
| Zweiter Lieferschein zur Shop-Bestellung | Rest je `PH Bestellung Position` aus Summe aller nicht stornierten Lieferscheine (`beleg_position`) berechnen (P3) |
| Paralleler Assistent zur AB | Rest = `menge − lieferschein_menge − Σ offene Lieferscheine`; Server begrenzt; Fehler „Position 3: nur noch 2 offen (4 in LS-…141 unterwegs)“ |
| Teilzustellung am Stopp (Kunde nimmt Sofa, Sessel beschädigt) | Sheet „Abliefern“ speichert `menge_zugestellt` je Position; Rest → `menge_abgelehnt` + Grund (Beschädigt · Falsch · Passt nicht · Kunde verweigert) + Foto Pflicht bei Beschädigt; Server: Lieferschein Zugestellt nur für zugestellte Mengen, AB-Meldung nur zugestellte Menge, Rest-Lieferschein automatisch als Entwurf („Rest aus LS-…138“), Bestand Rücklieferung ins Fahrzeug-Lagerort |
| Teillieferung + FAGG | Fristbeginn erst mit letzter Teilsendung (R4) |
| Teillieferung + Werklieferung | keine Teilrechnung, nur Liefermengen-Meldung (S2) |

### 5.3 Anzahlung
- Vor „Lieferschein erzeugen“ (A6) und vor „Tour freigeben“: `anzahlung_ist_cent < anzahlung_soll_cent` → **gelbes Band** „Anzahlung offen: 1.200,00 € von 3.000,00 €“; Anlegen bleibt möglich, **Freigabe der Tour und Übergabe** gesperrt, außer Leitung überschreibt mit Grund (`PH Lieferschein.zahlung_freigabe_von`, `zahlung_freigabe_grund`).
- Restbetrag (`offen_cent`) auf der Stopp-Karte des Fahrers und am Abholtresen: „Restzahlung bei Übergabe: 2.340,00 € – Zahlung über Kassa“.
- Kein eigenes Zahlungsfeld in der Logistik; Zahlungen bleiben in ph_faktura/ph_kassa.

### 5.4 Retoure
| Fall | Soll |
|---|---|
| Shop-Retoure per Paket | vorhanden (Retourenlabel); fehlt: Label per Post/Druck bei Kunde ohne E-Mail; Retour-Sendung Unterwegs → Meldung an PH Retoure (Nachweis FAGG § 15) |
| Retoure/Abholung großer Möbel per Tour | Stopp-Art `Retoure` mit Link `PH Tour Stopp.retoure` (PH Retoure) bzw. `servicefall`; „Abgeholt“ am Stopp bucht `Retoure` ins Fahrzeug-Lagerort, Entladen bucht Umlagerung ins Lager |
| B2B/AB-Retoure (kein Shop) | PH Retoure gibt es nur in ph_shop → für AB-Kunden fehlt ein Rücknahmebeleg; Minimal: Lieferschein `richtung` (`Ausgang`/`Ruecknahme`) oder Rücknahme über ph_service |
| Retoure eines Ausstellungsstücks | Bestand mit `seriennummer` wieder aktiv; Zustand B-Ware; Platz Pflicht |
| Wiedereinlagerung Lagerort | heute immer Standardlager; Auswahl Lagerort/Platz bei Prüfung |

### 5.5 Fremdwährung CHF / Schweiz
- `PH Lieferschein` hat **keine** `waehrung`; AB hat `waehrung`. `warenwert_cent`/`versicherungswert_cent` aus CHF-AB würden als EUR angezeigt. **Pflicht:** `PH Lieferschein.waehrung` (Link Currency, aus AB/Bestellung, read_only); Anzeige immer mit Währungszeichen; Versicherungswert in EUR umrechnen und Kurs + Datum speichern (`versicherung_kurs`, `versicherung_kurs_datum`), weil Carrier in EUR versichern.
- Paketversand CH: API gibt `land_ch` zurück – UI braucht dafür einen eigenen Text: „Versand in die Schweiz ist nicht eingerichtet (Zoll). Eigenlieferung oder Spedition wählen.“
- Eigenlieferung/Spedition CH: Lieferschein mit `liefer_land=CH` → Pflichtfelder Ausfuhr (P9), Zollrechnung/Proforma mit Warenwert, Ursprung, Zolltarifnummer je Position (`PH Lieferschein Position.zolltarifnr`, `ursprungsland` – Quelle ph_sortiment), Hinweis an Disposition „Zollabfertigung am Grenzübergang einplanen“ (Dauer im Stopp).
- Lagerbestand hat `waehrung`, aber `ek_cent` ohne Kurs → Lagerwert in gemischten Währungen. Pflicht: Bestand immer in EUR bewerten; CHF-EK beim Wareneingang umrechnen.

### 5.6 Kunde ohne E-Mail
| Stelle | Heute | Soll |
|---|---|---|
| Abholbereit | still `False` | Rückgabe `{gesendet: false, grund: "keine_email"}` → ToDo „Fam. Moser anrufen – Ware abholbereit“ an Verkauf; Chip in Heute-Leiste „3 Kunden ohne E-Mail zu informieren“ |
| Lieferbestätigung | Fehler | Knopf ersetzt durch „Lieferschein drucken (für Kunde)“; Fahrer übergibt Papierkopie |
| Avis | – | Kanal `benachrichtigung` = Telefon → Avis-Liste für die Disposition (Name, Telefon, Zeitfenster) mit Haken „informiert“ (`PH Tour Stopp.avis_am`, `avis_kanal`) |
| Retourenlabel | Mail fehlt ohnehin | „Label drucken und mitgeben/per Post“ |
| Massenaktionen | übersprungen (Konzept) | Ergebnis-Toast nennt sie: „5 gesendet · 2 ohne E-Mail (Liste)“ |

### 5.7 Weitere fehlende Randfälle
- **Hotel/Objekt mit abweichendem Empfänger**: Rechnungsempfänger ≠ Lieferadresse ≠ unterschreibende Person (Haustechnik). `empfaenger_name` reicht; zusätzlich `empfaenger_funktion` (Data) für Gelangens-/Abnahmenachweise.
- **Yacht/Hafen**: Lieferadresse ohne Straße/Hausnr. (Hafen, Steg, Liegeplatz). Pflicht-PLZ+Ort ok; Feld `liefer_zusatz` als „Liegeplatz“ beschriften; Zeitfenster Pflicht.
- **Mehrfach nicht angetroffen**: Zähler `PH Lieferschein.zustellversuche` (Int); ab 2 → Aufgabe an Verkauf (Lagergeld/Rücksprache laut AGB).
- **Abholung nicht abgeholt**: PH Bestellung `abholung_bis` existiert → Logistik zeigt „Abholfrist abgelaufen“ und bietet „Freigeben“ (Reservierung lösen) erst nach Entscheidung Verkauf.
- **Ausstellungsstück wird über AB verkauft und geliefert**: Assistent A6 muss die Bestandszeile mit SN wählen lassen (→ `lagerbestand`), sonst bleibt sie im Showroom „Verfügbar“.
- **Ware aus Fahrzeug-Lagerort**: Tour-Start sollte Umlagerung Lager → „Fahrzeug <Kennzeichen>“ buchen, Zustellung den Verkauf aus dem Fahrzeug; sonst ist der Fahrzeug-Lagerort nutzlos.
- **Sendung verloren (Carrier)**: Status Problem → „Verlust beim Carrier melden“ mit Schadensfall-Nummer, Ersatzlieferung (neuer Lieferschein mit `ersatz_fuer`), Erstattung vom Carrier als Forderung an Buchhaltung.

---

## 6. Pflichtänderungen (konkret, nach Priorität)

Priorität 1 = vor Livegang zwingend, 2 = vor erstem Objekt-/Exportauftrag, 3 = Ausbau.

| Nr. | Prio | App / DocType | Änderung (Feld · Methode · Regel) | UI im Backoffice |
|---|---|---|---|---|
| P1 | 1 | ph_logistik `PH Tour.starten`, `PH Lieferschein.als_zugestellt` | Liefermengen-Meldung an AB auf **Zustellung** verlegen (nicht Übergabe an eigenen Fahrer): `_auftrag_fortschreiben()` immer in `als_zugestellt()` aufrufen, idempotent über neues Feld `PH Lieferschein.ab_gemeldet_am` (Datetime, read_only); `uebergeben()` meldet nur bei `uebergeben_an in (Dienstleister, Spedition)`; `starten()` nutzt `ls.uebergeben("Fahrer")` | Abnahme 10.1 Nr. 5 korrigieren: „AB-Position `lieferschein_menge` erhöht nach **Erledigt**“; Zeitleiste „Liefermengen an AB gemeldet“ |
| P2 | 1 | ph_logistik `PH Lieferschein Position.lagerbestand`, `packtisch.scan`, `_bestand_ausbuchen` | Entnahme-Bestand beim Packen setzen: Scan einer SN → passende Bestandszeile; sonst Vorschlag aus `packtisch_lagerort`/`standard_lagerort` (verfügbare Menge, reservierte für diese AB zuerst). Verkaufsbuchung beim **Zustellen/Übergeben an Dienstleister**, nicht bei Gepackt. Fehler nicht verschlucken: `PH Lieferschein.bestand_fehler` (Small Text, read_only) + Hinweis | Packtisch-Zeile „Entnahme: Lager R-12 (reserviert für AB-…)“; rotes Band in der Akte „Bestand nicht gebucht: … · Erneut buchen“ |
| P3 | 1 | ph_logistik `lieferschein_aus_bestellung`, `lieferschein_aus_auftrag` | Rest serverseitig: `menge − Σ menge aller nicht stornierten Lieferscheine mit gleicher beleg_position`; `positionen[z]` auf Rest begrenzen (Fehler statt Kürzung); Parameter `idempotency_key`, `wunschtermin`, `adresse{}` | A6 zeigt „in Lieferung (offen)“ als eigene Spalte; Fehlertext je Zeile |
| P4 | 1 | ph_logistik Position/Bestand/Bewegung/Inventur | `menge`, `menge_gepackt`, `reserviert`, `verfuegbar`, `soll`, `ist`, `differenz` → **Float** (precision 3) + `einheit` (Data, aus PH Produkt: Stk, lfm, m², Set); Paketlogik nur für `einheit=Stk` | Zahlenblock mit Komma bei Nicht-Stück-Einheiten; Anzeige „2,5 lfm“ |
| P5 | 1 | ph_logistik `PH Lieferschein` + ph_faktura AB | Anzahlungsprüfung: Methode `zahlung_pruefen()` (liest AB `anzahlung_soll_cent`, `anzahlung_ist_cent`, `offen_cent`; Bestellung `bezahlt_am`); Sperre in `uebergeben()`, `als_zugestellt()` (Abholung), `PH Tour.freigeben()` mit Override-Feldern `zahlung_freigabe_von` (Link User, read_only), `zahlung_freigabe_grund` (Small Text), nur Leitung/GF | Band gelb in Akte/Plantafel-Karte/Stopp; Freigeben-Knopf deaktiviert mit Grund; Override-Dialog mit Pflichtgrund |
| P6 | 1 | ph_logistik `PH Lieferschein` | Schreibsperre ab `Uebergeben` (alle Felder außer `notiz_intern`, `fotos`, Bestätigungs-Zeitstempeln) in `validate`; `delete` für Leitung entfernen, `on_trash` ab Status ≠ Entwurf verbieten | Felder read-only mit Hinweis „Beleg – Änderungen nur über Storno/Rücknahme“ |
| P7 | 1 | ph_logistik `PH Tour Stopp` + ph_kassa | Felder `restzahlung_cent` (Int, read_only, aus AB/Bestellung), `zahlung_status` (Select `keine` · `offen` · `bezahlt` · `Rechnung`), `kassenbeleg` (Link, ph_kassa). Barzahlung nur mit Kassenbeleg (mobile Kassa am Arbeitsplatz „Montage mobil“ oder Erfassung nach Rückkehr laut Steuerberatung) – **kein** freies „bar erhalten“-Feld | Stopp-Karte „Restzahlung 2.340,00 € · [Kassieren]“ → öffnet Kassa-Bon; „Abliefern“ erst nach `bezahlt` oder Leitung-Override |
| P8 | 2 | ph_logistik `PH Lagerbestand.als_ausstellungsstueck_verkaufen` + ph_kassa | Reihenfolge: Reservierung auf Kassenbon (`reservieren("PH Kassenbeleg", bon)`) → Verkauf bucht ph_kassa nach Zahlung; Abbruch an der Kassa = `freigeben()`. Feld `zustand_text` (Small Text, Pflicht bei Ausstellungsstück) wird auf Bon/Rechnung gedruckt | Sheet „Mängel/Gebrauchsspuren (für den Beleg)“ Pflicht; Hinweis „Kunde bestätigt Zustand an der Kassa“ |
| P9 | 2 | ph_logistik `PH Lieferschein` | Felder `ust_fall` (Data, read_only, aus AB), `nachweis_art` (Select `keine` · `Gelangensbestaetigung` · `Ausfuhrnachweis` · `CMR`), `mrn` (Data), `ausgangsvermerk_am` (Date), `nachweis_datei` (Attach), `waehrung` (Link Currency, read_only). Bei `ust_fall in (Ausfuhr, Innergemeinschaftlich steuerfrei)`: Zugestellt erst, wenn Nachweis-Felder gefüllt oder Aufgabe „Nachweis fehlt“ an Faktura. Print Formats „PH Lieferschein Gelangensbestaetigung“ (Name, Funktion, Ort/Datum der Ankunft, Menge, Bezeichnung) und „PH Lieferschein CMR“ | Akte: Abschnitt „Steuernachweis“ nur bei diesen Fällen; Heute-Leiste Faktura „2 Ausfuhrnachweise fehlen“ |
| P10 | 2 | ph_logistik `tarife.kunden_cent`, `PH Logistik Einstellungen` | USt-Satz für Versandkosten aus Steuerland der Bestellung (`PH Bestellung.steuerland`) bzw. AB `ust_fall` statt fix `versand_ust_promille`; Einstellung nur noch als Rückfall für AT | Tarifkachel zeigt „inkl. 19 % USt (DE)“ |
| P11 | 1 | ph_logistik `PH Lagerbewegung` | `validate`: gebuchte Bewegung unveränderbar (außer `status`/`storno_von` durch `storno`); `datum` nicht in die Vergangenheit > 1 Tag außer Leitung mit Grund; Rolle Mitarbeiter `write` nur für Neuanlage | Journal ohne Inline-Bearbeitung; Storno bleibt einziger Weg |
| P12 | 2 | ph_logistik → ph_shop | Beim Zustellen des **letzten** Lieferscheins einer Bestellung `PH Bestellung.ware_erhalten_am` (neues Feld ph_shop) setzen; Retour-Sendung Unterwegs/Zugestellt → `PH Retoure.ruecksendung_nachweis_am`. Statusspiegel über `versendet_melden(awb, carrier)` / `abgeholt_melden()` (Konzept §4.1 Nr. 6 bestätigt) | Bestellakte: „Rücktrittsfrist bis 18.11.2026 (ab Erhalt 04.11.)“ |
| P13 | 2 | ph_logistik `PH Lieferschein Foto`, `PH Tour Foto`, Einstellungen | Löschfrist: Fotos `vorher/nachher/uebergabe` nach `foto_loeschen_nach_monaten` (Int, Einstellung, Wert vom Inhaber/Datenschutz festzulegen) per Scheduler; `schaden`-Fotos bis Abschluss Servicefall; Unterschrift bleibt mit dem Beleg (Aufbewahrung). `PH Sendung`: `empf_telefon`/`empf_email` nur übergeben, wenn Dienst es verlangt (Schalter je Carrier) | Kamera-Overlay „Bitte keine Personen fotografieren“; Fotos in Montage-Rolle nur für eigene Touren |
| P14 | 2 | ph_logistik `PH Logistik Einstellungen`, `PH Tour` | Schalter `live_ansicht` (Check, Standard 0) und `zeitstempel_je_stopp` (Check); Report „PH Touren Auslastung“ ohne Auswertung je Person | Hinweis in Stammdaten „Nur mit Betriebsvereinbarung bzw. Zustimmung der Mitarbeiter aktivieren“ |
| P15 | 2 | ph_logistik `PH Inventur`, `PH Lagerbewegung` | Felder `PH Lagerbewegung.wert_cent` (Int, permlevel 1), `PH Inventur.stichtag_buchung` (Check: Bewegungen mit `datum = datum` Ende Tag); Soll bei Freigabe = Schnappschuss-Soll + Bewegungen seit Schnappschuss (oder Sperre neuer Bewegungen im Lagerort während `Laufend`: `PH Lagerort.inventur_laeuft`); Freigabe nicht durch `gezaehlt_von` derselben Person (Vier-Augen) | Freigabe-Dialog: „Bewegungen seit Zählbeginn: 3 – Soll angepasst“; Knopf gesperrt für Zähler selbst |
| P16 | 1 | ph_logistik `PH Lieferschein.stornieren` | Vollständige Rückabwicklung (5.1): Rollenprüfung Leitung, Gegenbuchung Bestand, AB-Menge zurück (ph_faktura `lieferung_zuruecknehmen`), Stopp entfernen + `tour=None`, Sperre bei Teilrechnung, Pflicht `storno_grund` | Bestätigungsdialog listet jede Folge einzeln |
| P17 | 1 | ph_logistik `PH Tour Stopp`, `PH Lieferschein Position`, `PH Tour.stopp_status` | `menge_zugestellt`, `menge_abgelehnt`, `ablehnungsgrund` (Position); `annahme_vorbehalt` (Check), `vorbehalt_text` (Lieferschein); `stopp_status` nimmt `positionen{}` an; Rest → neuer Entwurf-Lieferschein `rest_aus` (Link) + Rücklieferungs-Bewegung | Abliefern-Sheet: Schritt ① Positionen mit Stepper je Zeile, ② „Unter Vorbehalt angenommen“ + Text, ③ Unterschrift |
| P18 | 1 | ph_logistik `PH Tour.abbrechen`, `stopp_status` (nicht angetroffen/verschoben) | Lieferscheine nach Abbruch/Fehlversuch zurück auf `Gepackt`, `tour=None`, `zustellversuche += 1`, Bewegung Fahrzeug → Lager bei Rückkehr; ToDo an Disposition | Ablage „Ohne Tour“ zeigt Chip „2. Versuch“ |
| P19 | 1 | ph_logistik `PH Tour.stopps_hinzufuegen` | gleiche Filterregeln für explizite Liste (Lieferart, Status, ohne andere aktive Tour); sonst Fehler je Lieferschein | Drag auf Tour mit Rückkehr-Animation + Grund |
| P20 | 2 | ph_logistik `ereignisse.wareneingang_aktualisiert` | Bei Wareneingang-Position mit AB-Bezug (Custom Field `ph_logistik_auftrag` bzw. Herstellerbestellung → AB) automatisch `Reservierung` auf die AB | Bestand zeigt „reserviert für AB-…“; Kassa/Verkauf sieht „nicht verfügbar“ |
| P21 | 2 | ph_logistik `PH Lieferschein` | `benachrichtigung` (Select `E-Mail` · `SMS` · `Telefon` · `keine`, aus Kontakt); `abholbereit_melden` gibt Grund zurück und legt bei fehlender E-Mail ToDo an | 5.6 |
| P22 | 2 | ph_logistik `PH Tour Stopp` | `retoure` (Link PH Retoure), `servicefall` (Data → Custom Link ph_service), `montageauftrag` (Custom Link, Konzept §12 bestätigt); „Abgeholt“ bucht Retoure-Bewegung ins Fahrzeug | Stopp-Karte zeigt Bezug; Abholung ohne Bezug nur als „Freier Stopp“ |
| P23 | 3 | ph_logistik `PH Lieferschein Position` | `zolltarifnr`, `ursprungsland` (aus ph_sortiment), `bereich` (Raum/Zimmer/Deck – Konzept §9 bestätigt) | Proforma/Zollrechnung-Druck |
| P24 | 3 | ph_logistik `PH Sendung` | `eingangsrechnung` (Link), `abgerechnet_cent`, `carrier_schaden_nr`, `ersatz_fuer` (Link PH Lieferschein am neuen Lieferschein) | Kosten-Tab „Abgerechnet laut Rechnung“; Problem-Sheet „Verlust melden“ |

### 6.1 Korrekturen am Konzepttext (10-konzept-logistik.md)
1. §0 Satz 5, §1.4, §4.3, §10.1 Nr. 5: „meldet Liefermenge an AB“ gilt erst nach P1; bis dahin als **Lücke** führen.
2. §4.1 Tabelle Lieferschein „Packen … bucht Verkauf“: als wirkungslos markieren (B2); Verkaufszeitpunkt auf Zustellung/Übergabe an Dienstleister ändern.
3. §3.1 Primäraktion „Teilrechnung erstellen“: nur bei AB `abrechnung = je Lieferung`; sonst Primär „Montage öffnen“ bzw. „Faktura informiert (Schlussrechnung nach Abnahme)“.
4. §4.5 A6 Schritt 1: Spalte „in offener Lieferung“ und Server-Begrenzung (P3); Schritt 2: Anzahlungs-Band (P5).
5. §7.2: Abliefern-Sheet mit Teilzustellung, Vorbehalt, Restzahlung (P7, P17); Live-Ansicht nur mit Schalter (P14).
6. §8 Vorschlag 3 (nicht angetroffen) zur Pflicht machen (P18).
7. §10.2 ergänzen: Storno-Rückabwicklung, Doppel-Lieferschein-Sperre, Float-Mengen, Anzahlungssperre, CH-Text `land_ch`, Kunde ohne E-Mail → ToDo, Unveränderbarkeit ab Übergeben.
8. §2.9 Einstellungen: `versand_ust_promille` als „Rückfall AT“ beschriften (P10).

---

## 7. Offene Fragen an Inhaber / Steuerberatung (keine Annahmen im Bau)

| An | Frage | Prio |
|---|---|---|
| Inhaber | Abrechnungsart Standard je Sparte: Küche/Bad/Einbau „nach Abnahme“, lose Möbel „je Lieferung“? | 1 |
| Inhaber | Anzahlung: Liefersperre hart (nur Leitung überschreibt) oder nur Hinweis? | 1 |
| Steuerberatung | Restzahlung beim Kunden bar: mobile Registrierkasse am Telefon/iPad oder händischer Beleg mit Nacherfassung? | 1 |
| Steuerberatung | Maßgebliches Lieferdatum auf Rechnung: Versand = `uebergeben_am`, Eigenlieferung = `zugestellt_am`, Werklieferung = Abnahmedatum (ph_projekte)? | 1 |
| Steuerberatung | Nachweisform Ausfuhr CH (Eigenlieferung über Grenze) und EU-Gelangensnachweis bei Eigenlieferung DE | 2 |
| Inhaber / Datenschutz | Löschfrist Lieferfotos; Betriebsrat vorhanden? (Live-Ansicht) | 2 |
| Inhaber | Mehrfach nicht angetroffen: Lagergeld laut AGB? Ab wie vielen Versuchen? | 3 |
