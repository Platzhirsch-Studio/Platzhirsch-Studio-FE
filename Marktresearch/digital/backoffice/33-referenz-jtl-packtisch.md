# 33 – Referenz: JTL-Packtisch+ / JTL-WMS-Warenausgang

**Zweck:** Referenz, wie JTL den Packplatz löst (JTL-Packtisch+ als kostenlose Wawi-Erweiterung, JTL-WMS mit EazyShipping/Versandboxen/Speditionsversand), und was Platzhirsch für den eigenen Packtisch (siehe `10-konzept-logistik.md`, W1–W7) übernimmt.
**Stand:** Abruf 04.11.2026, ausschließlich öffentliche Quellen (JTL-Guide, Drittanbieter-Blog nur wo gekennzeichnet). Keine Logins, keine Bilder übernommen.
**Kennzeichnung:** Quellen als `[Sx]` (Liste in Abschnitt 5). **„nicht belegt“** = in den gelesenen Quellen nicht beschrieben – nicht heißt „gibt es nicht“.
**Begriffe:** Der deutsche Guide nennt das Produkt „JTL-Packtisch+“, der englische „JTL-PackingBench“. JTL-WMS hat eigene Packdialoge („Auftrag verpacken“ in EazyShipping, „Boxen verpacken“); Konfiguration (Ausgabe, Lageroptionen, Arbeitsplatz, Waage) teilen sich beide [S1][S5][S22].

---

## 1. Ablauf Schritt für Schritt

### 1.1 Grundvarianten
| Variante | Produkt | Einstieg am Packplatz | Quelle |
|---|---|---|---|
| **Auftrag verpacken** (ohne Pickliste; Picken nach gedruckter Rechnung) | Packtisch+ | Auftragsnummer von der Rechnung scannen | [S2] |
| **Pickliste verpacken** (Sammelpickliste „pro Lager“ oder „pro Auftrag“) | Packtisch+ | Pickliste wählen, ersten Artikel scannen → System ordnet Auftrag zu | [S3] |
| **EazyShipping** (Standardprozess WMS, Pickwagen mit vielen Aufträgen) | WMS | Beliebigen Artikel vom Wagen scannen → Auftrag wird erkannt | [S14][S15] |
| **Versandboxen / Pick-to-Box** (je Box genau ein Auftrag) | WMS Pro | Rechnung mit Boxnummer nehmen, Box holen, **Boxnummer scannen** | [S16][S17] |
| **Speditionsversand** (Paletten/Sperrgut, NVE/SSCC) | WMS Enterprise | wie EazyShipping, dann Kartonage/Palette, Maße, Gewicht | [S20] |
| Weitere: Rollende Kommissionierung, Pick&Pack (mobiler Packtisch), Identische Aufträge, Versand direkt aus Wareneingang | WMS Pro | – | [S12] |

**Voraussetzung (Packtisch+):** nur bezahlte Aufträge oder Zahlungsart mit Lieferung vor Zahlung (Nachnahme, Rechnung) [S2][S3]. WMS-Lieferoption **„Sperren“**: gesperrte Aufträge kommen nicht auf Picklisten und können nicht verpackt werden [S13].

### 1.2 Standardablauf (Packtisch+ „Pickliste verpacken“ / WMS EazyShipping)
1. **Pickliste erzeugen** (Wawi: Versand → Lieferbar/Teillieferbar → „Auf Pickliste setzen“ ▸ „Eine Pickliste pro Lager“ oder „pro Auftrag“; Pickstatus wird „Angelegt“, Pickliste wird gedruckt) [S3].
2. **Picken** – mit WMS Mobile (Positionen „Angelegt“ → „Gepickt“, Bestand wird auf den Pickwagen gebucht) oder papierbasiert (bleibt „Angelegt“); der Packprozess akzeptiert beides [S14].
3. **Am Packplatz Dialog öffnen** (Packtisch+: Menü „Pickliste verpacken“ bzw. „Auftrag verpacken“; WMS: Warenausgang → EazyShipping, Doppelklick auf Pickliste) [S3][S15].
4. **Erster Scan identifiziert den Auftrag** – Auftragsnummer (Auftrag verpacken), Artikel (Pickliste/EazyShipping; bei Artikel in mehreren Aufträgen wird **der Auftrag mit den wenigsten Artikeln** gewählt) oder Boxnummer (Versandboxen) [S2][S3][S14][S17].
5. **Positionen scannen mit Mengenprüfung** – je Scan +1 bzw. + Wert aus Feld „Menge eingeben“ (Standard 1); Zeile wird grün, sobald gescannte = Gesamtmenge; Anzeige „gescannte Menge / Gesamtmenge“ (z. B. „AR201604860: 1 / 1“) [S15][S18].
   - Optionen: „Mengeneingabe vor dem Scannen erlauben“, „Eingabe von Mengen im Feld ‚Artikel‘ zulassen“, „Mengen größer als 1 müssen bestätigt werden“ [S6].
   - Ohne Barcode: manuelle Bestätigung (Artikelnummer/EAN, Plus/Minus-Schaltflächen nur mit Option „Artikel und Picklisten können ohne Scanner erfasst werden“) [S3][S6][S15].
   - **Freipositionen und Variationspositionen** werden angezeigt und müssen manuell bestätigt werden (bei „Boxen verpacken“ orange hinterlegt) [S2][S16].
   - Artikelerkennung konfigurierbar über Artikelnummer, EAN/GTIN, UPC, Gebinde-EAN, ASIN, FNSKU, HAN, ISBN, Lieferanten-ArtNr u. a. [S6].
6. **Seriennummer / MHD / Charge** – WMS-Pro-Funktion [S13]. Belegt ist nur: Der **Fehlerton** ertönt auch, wenn eine weitere Eingabe wie MHD oder Charge erwartet wird [S4]; laut Drittquelle muss die Seriennummer je Exemplar spätestens im Warenausgang erfasst werden, und es wird gefragt, aus welcher Charge versendet wird [S25]. **Der genaue Erfassungsdialog am Packtisch ist nicht belegt.**
7. **Packhinweise** erscheinen (konfigurierte „Packhinweise“, z. B. „Elektronik mit Verpackungschips“; Hinweis/Anmerkung aus Auftrag, Artikel, Kundenkommentar) – standardmäßig erst nach allen Scans und Drucken, optional **„Packhinweise vor dem Verpacken anzeigen“**, optional in separatem Fenster, automatisch ausblenden nach x Sekunden [S5][S6][S7].
8. **Verpackung wählen** – Dropdown „Packmittel“ (Karton, Versandtüte, „Kein Packmittel verwenden“), Standard-Karton je Versandart vorausgewählt; ab Wawi 1.6 mehrere Kartonagen je Paket; Kartons sind Artikel mit Bestand (wird beim Verpacken abgebucht, Mindestbestand → Bestellvorschlag) [S15][S18].
9. **Versandart prüfen** – aus Auftrag vorausgewählt, änderbar per Dropdown oder **Barcode der Versandart scannen** (Option „Versandarten können durch Scannen gewählt werden“), in WMS je Packstück änderbar [S2][S6][S15].
10. **Gewicht** – Spalte Gewicht je Packstück wird aus Artikelgewichten berechnet und ist manuell überschreibbar [S15]. Versandart mit „Gewicht über angeschlossene Waage ermitteln“ (= Verwiegepflicht) → Paket muss vor dem Verpacken gewogen werden; Live-Gewicht oben rechts in jedem Warenausgangsdialog, übernommen ins Gewichtsfeld [S21][S23]. Ohne Waage: manuell eingeben; Waage defekt → Waagentyp „Keine“, dann Gewicht aus Artikelstamm, fehlt es → manuell [S21][S23].
11. **„Verpacken“** klicken (grüne Schaltfläche, erscheint/aktiv, sobald alles gescannt) oder Versandart-Barcode scannen → automatisch je Konfiguration [S2][S3][S13][S15]:
    - Versanddokumente (Lieferschein, Rechnung – wird erzeugt, falls noch keine existiert –, Selbstdefiniert, Adressetikett) auf Standarddrucker des Arbeitsplatzes [S3][S5][S13];
    - Versandetikett (JTL-ShippingLabels/Shipping, CSV-Export an Fremdsoftware mit Tracking-Rückimport, oder manuelle Tracking-ID mit Regex-Prüfung) [S13];
    - Artikel ausbuchen, Auftrag (bzw. Teil) „versendet“, Versandmail an Kunde, Versandmeldung an Amazon/eBay/Onlineshop [S2][S13].
    - „Versendet“ erst, wenn für **alle Pakete** eine Tracking-ID vorliegt oder die Versandart keine braucht; bei CSV warten Mail/Meldung auf den Import [S13].
12. **Nächster Auftrag**: einfach nächsten Artikel scannen – kein eigener Schritt [S2][S3].
- **Einartikel-Aufträge:** mit „Automatisches Verpacken aktivieren“ druckt bereits der Artikelscan Dokumente + Etikett („komplett automatisch“) [S6][S14].

### 1.3 Sonderfälle
| Fall | JTL-Lösung | Quelle |
|---|---|---|
| **Mehrere Pakete** | WMS: rotes Plus „Packstück hinzufügen“; Packstücke heißen „In Bearbeitung 1/2…“, nach Abschluss eindeutige Packstück-ID; je Packstück Versandart, Packmittel, Gewicht. Mit „Packstückinhalte tracken“ (WMS Pro, Picklistenvorlage) werden Scans dem aktuellen Packstück zugeordnet; „Packstücke umpacken“ verschiebt (Teil-)Mengen. Boxen: „Paket hinzufügen/entfernen“. Ausgabe-Option **„pro Paket“** druckt/mailt Dokumente je Paket | [S15][S16][S19][S5] |
| **Teilversand** | Packtisch+: Option „Manuelle Teillieferung erlauben“ (für bereits gescannte Positionen jederzeit), Teillieferung auch per Versandart-Barcode; WMS: Lieferoption „Teilliefern“ je Auftrag (sonst in EazyShipping nicht möglich). Dokumentregeln „Bei jeder / nur erster / jeder / nur letzter / nicht bei Teillieferung“ | [S6][S13][S5] |
| **Artikel fehlt** | WMS EazyShipping: **„Zurückstellen“** – Auftrag bleibt auf der Pickliste. Versandboxen: **„Box leeren“** bucht Boxinhalt aus und löscht Pickpositionen; Ware physisch entnehmen und wieder einlagern (Plusbuchung/freier Wareneingang). Rollende Kommissionierung: Boxinhalt als Teillieferung | [S15][S16] |
| **Falscher Artikel gescannt** | Fehlerton (wählbar) bei fehlerhaftem Scan; Minus-Schaltfläche (nur ohne-Scanner-Option). Eigene Fehlermeldungstexte/-farbe **nicht belegt** | [S4][S15] |
| **Beschädigung** | Kein Packtisch-eigener Schadensdialog belegt. Separat: „Intern → Artikelzustand ändern“ (z. B. „Defekt“ → „Gebraucht, wie neu“, Menge, Kommentar, Übernahme in Retourenposition) | [S10] |
| **Abbruch** | WMS: Pfeil „Zurück“ schließt Dialog, **bereits gescannte Artikel werden nicht verpackt** (kein Teilabschluss) | [S15] |
| **Pausieren** | Explizite Pause-Funktion **nicht belegt**; nächstliegend „Zurückstellen“ | [S15] |
| **Rückgabe an Lager** | Box leeren + Wiedereinlagerung (s. o.); allgemeiner Hinweis: solange Ware nicht ausgebucht ist, bleibt Bestand am Lagerplatz | [S16] |
| **Nachdruck** | „Drucken“ in Kopfzeile / Dialog „Nachdruck“ (Lieferschein u. a.), „Etikett drucken“ für Artikeletikett | [S15] |
| **Sperrgut/Palette** | Speditionsversand: Versandart mit „Speditionsversand“, Kartonagen (Paletten) mit NVE-Label JA, „Maße/Gewicht abfragen“; beim Verpacken Dialog Maße + Gewicht; NVE-Label je Packstück drucken; Spedition über Abholbereitschaft informieren; Daten per Export/API | [S20] |
| **Retouren** | Packtisch+ bucht angekündigte und unangekündigte Retouren ein; Ersatzlieferung direkt aus Packtisch+ (derzeit nur Variationskombinationen und 1:1-Retouren). Detailablauf (Felder, Rückbuchung, Gutschrift) in den gelesenen Seiten **nicht belegt** | [S9] |

---

## 2. Oberfläche

### 2.1 Bildschirmaufbau WMS „Auftrag verpacken“ (EazyShipping) – am besten dokumentiert [S15]
```
┌ A Kopfzeile: [← Zurück]  [Artikel: Scanfeld]  [Menge eingeben: 1]  [Drucken]   │ B rechts oben: [Drucken] [Versandart ▾] [Packmittel ▾]  Live-Gewicht Waage ┐
│ C Artikelliste (Mitte): Artikel-Nr. | Artikelname | GTIN | Gescannte Menge | Gesamtmenge   │ F Seitenleiste rechts:                              │
│   grün = vollständig, rot = aktuell gewählte Zeile; [–] [+]                                 │   Auftragsdetails (Bestellnr., erstellt/bezahlt,    │
│ D Funktionsleiste (einklappbar): Etikett drucken · Zurückstellen · Packhinweis ·            │   Versandart, Lieferadresse ✎, Logistiker, Kunde)   │
│   Packstücke umpacken                                                                       │   ODER Artikelinfo (Bild, EAN, Hersteller, Teilbar, │
│ E Packstücke (unten): Packstück | Gewicht | Versandart ✎ | Packmittel   [+ Packstück]       │   Warengruppe, Workflows, Historie)                 │
│                                                              [Verpacken (grün)]            │   unten: „AR…: 1 / 1“ + [Verpacken]                 │
└─────────────────────────────────────────────────────────────────────────────────────────────┴─────────────────────────────────────────────────────┘
```
(Schema eigene Nachzeichnung nach Textbeschreibung, kein Screenshot.)

- **„Boxen verpacken“** (WMS): Box-Feld oben links, Versandart + Gewicht oben rechts, darunter Bestellhinweis/Anmerkung (nur wenn vorhanden), Liste „Positionen des Auftrags“ zum Abgleich mit Box-Inhalt, Auftragsdetails; Box verpackbar nur mit Status „Gedruckt“ [S16].
- **Packtisch+ „Auftrag verpacken“**: Felder Auftragsnummer und Versandart, Artikelübersicht mit Bestätigung, Gewichtsfeld nur bei Verwiegepflicht, Schaltfläche „verpacken“ [S2]. Linke Navigationsleiste (blendet sich automatisch aus, abschaltbar), Dashboard (optional Wawi-Dashboard) [S4].

### 2.2 Farben, Fortschritt, Feedback
| Element | Belegt | Quelle |
|---|---|---|
| Grün = Position vollständig gescannt | ja | [S15][S18] |
| Rot = aktuell gewählte Zeile | ja | [S15] |
| Orange = Frei-/Variationsposition (Boxen) | ja | [S16] |
| Fortschritt „gescannt / gesamt“ je Artikel | ja | [S15] |
| Erledigte Positionen nach unten schieben (Option) | ja | [S6] |
| Gesamt-Fortschrittsbalken je Auftrag | **nicht belegt** | – |
| Töne: Fehlerton, Hinweiston (5 zur Wahl / „Kein Ton“), Erfolgston – je Arbeitsplatz | ja | [S4] |
| Animationen abschaltbar (ältere Rechner) | ja | [S4] |
| Touch-Bedienung am Packtisch | **nicht belegt** (Plus/Minus und Doppelklick deuten auf Maus/Tastatur; WMS Mobile ist eine separate App) | [S6][S15] |
| Tastaturkürzel | **nicht belegt** | – |

### 2.3 Was wann angezeigt wird
- Vor Scan: Picklisten-/Auftragsübersicht; Infobox Auftrag bei Auswahl [S8].
- Nach Identifikation: alle Positionen des Auftrags, Infobox Auftrag in der Versandmaske, Versandart/Packmittel vorausgewählt [S8][S15][S18].
- Nach jedem Scan: Artikelinfo rechts (optional „Artikeldetails nach jedem Scan neu laden“) [S6][S15].
- Hinweise: wahlweise vor dem Verpacken oder erst nach allen Scans/Drucken [S5].
- Alles gescannt: „Verpacken“ wird angeboten [S15].
- **Infoboxen** frei konfigurierbar (Felder links/rechts, Anzeigename, Reihenfolge; erste 6–7 ohne Scrollen sichtbar) [S8].

### 2.4 Konfiguration
- **Packtisch+/WMS-Ausgabe** (zentral in Wawi): je Regel Art (Lieferschein, Rechnung, Selbstdefiniert, Packhinweis, Adressetikett, E-Mail), Anzahl, „pro Paket“, Vorgang (drucken/speichern/mailen/faxen/exportieren), Bedingungen (Teillieferung, Aufträge/Umlagerungen, Lager, Warenwert von–bis, Versandgewicht von–bis, abweichende Lieferadresse), Begrenzen auf (Warengruppen, Lieferländer, Versandklassen, Benutzer, Plattformen, Firmen, Kundengruppen, Artikelzustände, Eigene Felder, Zahlungsarten, Versandarten), Artikelmaße von–bis [S5].
- **Lageroptionen**: Pflicht-/Bestätigungsregeln (Mengen > 1 bestätigen, Artikel ohne Bestandsführung bestätigen), Scan-Erkennung, Auto-Verpacken, manuelle Teillieferung, Rechnungsregeln („Keine Rechnung ohne Rechnungsdruck“, keine Rechnung bei 0,00 €), Hinweisquellen [S6]. Ein expliziter Schalter „Pflichtscan je Position“ ist **nicht belegt**.
- **Arbeitsplatz (je Rechner)**: Töne, RDP-Modus, Navigation, Sprache, Waage, Standarddrucker, Etikettendrucker, Versandetikettendrucker, JTL-Shipping-Drucker je Logistikpartner mit Skalierung [S4][S11].
- **Workflows**: manuelle Workflow-Ereignisse in WMS/WMS Mobile/Packtisch+ (eigene Guide-Seite, Inhalt nicht gelesen) [S1][S24].

---

## 3. Funktionsliste
| Funktion | Stand | Quelle |
|---|---|---|
| Packplatz-Profil (Arbeitsplatz je Rechner, lokal gespeichert; RDP-Modus) | belegt | [S4] |
| Druckerzuordnung: Standard / Artikeletikett / Versandetikett / je Versanddienstleister | belegt | [S4][S11] |
| Etikettenformate | nur Skalierung „An Druckerrand anpassen“ belegt; konkrete Formate **nicht belegt** | [S11] |
| Dokumentregeln nach Land, Wert, Gewicht, Warengruppe, Plattform … | belegt | [S5] |
| Waage (seriell/USB, kontinuierliches Senden, Lizenz nötig, „Gewicht abfragen“-Test, Live-Anzeige) | belegt | [S21][S22] |
| Kartonagen als Bestandsartikel, Standard je Versandart, mehrere je Paket | belegt | [S18] |
| Mehrere Packstücke, Inhalte je Packstück, Umpacken | belegt (WMS Pro) | [S15][S19] |
| Speditionsversand mit NVE/SSCC, Maße, Paletten-Code | belegt (WMS Enterprise) | [S20] |
| Packhinweise regelbasiert | belegt | [S7] |
| Einartikel-Autoversand | belegt | [S6][S14] |
| Versandmeldung an Marktplätze/Shop + Kundenmail | belegt | [S2][S13] |
| Retouren einbuchen, Ersatzlieferung, Artikelzustand ändern | belegt (Grundzüge) | [S9][S10] |
| Wareneingang mit/ohne Bestellung, Versand aus Wareneingang | belegt | [S1][S6][S12] |
| Kamera/Foto des Pakets | **nicht belegt** | – |
| Statistik/Leistung je Packer | **nicht belegt** (nur Benutzer-Filter in Ausgaberegeln) | [S5] |
| Pausieren/Schichtwechsel | **nicht belegt** | – |

Nicht ausgewertet: offizielle YouTube-Videos (auf der Guide-Seite nur Titel ohne URL gelistet [S1]), JTL-Forum.

---

## 4. Übernahme für Platzhirsch

Kontext: Accessoires-Pakete über **LetMeShip**, Großmöbel über **Spedition/Tour**, **Kommission je Projekt**; Datenmodell laut `10-konzept-logistik.md` (PH Lieferschein mit Paket/Foto, PH Sendung, PH Speditionsauftrag, PH Lagerbestand mit Kommission).

### Muss (Go-Live Packtisch)
| # | Übernahme | Begründung |
|---|---|---|
| M1 | **Erster Scan identifiziert den Vorgang** (Packliste-QR/Lieferschein, alternativ Artikel-EAN mit Regel „wenigste Positionen zuerst“) | JTL-Kernmuster; spart Klicks, deckt W1/W2 |
| M2 | **Positionsliste mit Ist/Soll je Zeile**, grün bei vollständig, aktuelle Zeile markiert, erledigte nach unten; Farbe immer + Text/Icon | belegt bei JTL; unsere Regel „nie Farbe allein“ |
| M3 | **Mengenfeld vor Scan** + „Mengen > 1 bestätigen“ | Accessoires oft mehrfach (Gläser, Kissen) |
| M4 | **Manuelle Bestätigung** für Positionen ohne Barcode (Frei-/Dienstleistungspositionen, Herstellerware ohne EAN) – eigene, gut sichtbare Kennzeichnung (JTL: orange) | Möbelhandel hat viele EAN-lose Positionen |
| M5 | **Fehlerton / Erfolgston** je Gerät abschaltbar, plus visuelles Fehlerfeedback | Packer schaut auf Ware, nicht auf Bildschirm |
| M6 | **Pakete-Bereich unten** (mehrere Pakete, je Paket Profil/Karton, Gewicht, Versandart), Paket hinzufügen | Möbel-Accessoires gehen oft in 2+ Kartons |
| M7 | **Gewicht**: berechneter Vorschlag aus Artikelgewichten + Paketprofil-Tara, **manuelle Eingabe Pflicht vor Label**, Plausibilitätsgrenze je Profil | **Abweichung:** keine Waage geplant → JTL-Fallback „Waagentyp Keine“ als Normalfall; Plausibilität eigene Ergänzung (bei JTL nicht belegt) |
| M8 | **Ein Abschluss-Knopf „Verpacken“** löst aus: Lieferschein gepackt, Bestand ausbuchen, Label, Dokumente, Kundenmail | JTL-Muster; bei uns W2/W3 mit Buchungsbestätigung live |
| M9 | **Label über LetMeShip** statt JTL-ShippingLabels; „Versendet“ erst mit Tracking-ID für **alle** Pakete | **Abweichung** Carrier-Anbindung; Regel aus [S13] direkt übernehmen |
| M10 | **Abbruch ohne Teilabschluss** („Zurück“ verwirft nichts Gebuchtes) + **„Zurückstellen“ mit Grund** (fehlt/beschädigt/falsch) | JTL kennt Zurückstellen; Grund + Foto ist unser „Problem melden“ (W6) |
| M11 | **Teillieferung bewusst auslösen** (nur gescannte Positionen) mit Dokumentregel „erste/letzte Teillieferung“ | Kommission und Liefertermine je Projekt erzwingen Teillieferungen |
| M12 | **Sperrgut-/Speditionsweg** getrennt: kein Paketlabel, stattdessen Packstücke mit Maßen, Gewicht, Packstück-Etikett (eigene Nummer; NVE/SSCC erst bei Bedarf), Übergabe an Tour/Spedition | **Abweichung:** JTL-Speditionsversand ist Enterprise; wir brauchen ihn als Standard für Großmöbel |

### Soll (bald nach Go-Live)
| # | Übernahme | Begründung |
|---|---|---|
| S1 | **Regelbasierte Packhinweise** (Warengruppe „Glas/Keramik“ → „Polster + Fragile-Aufkleber“), vor dem Verpacken angezeigt | JTL [S7]; Bruchrisiko bei Accessoires |
| S2 | **Hinweise aus Auftrag/Kunde/Artikel** einblendbar (z. B. Geschenkverpackung, Projektnotiz) | JTL [S6] |
| S3 | **Kartonagen als Bestand** mit Mindestmenge → Bestellvorschlag | JTL [S18]; Verpackungsmaterial geht sonst unbemerkt aus |
| S4 | **Inhalte je Paket** speichern + Umpacken | JTL [S19]; Reklamation „Karton 2 fehlt“ |
| S5 | **Dokumentregeln** je Lieferart/Land/Wert (z. B. Rechnung nicht ins Paket bei abweichender Lieferadresse/Geschenk) | JTL [S5] |
| S6 | **Einartikel-Schnellversand** (Scan → Label) | JTL [S6]; nur für Shop-Pakete mit festem Paketprofil |
| S7 | **Infobox konfigurierbar** (Projekt, Kommission, Wunschtermin) | JTL [S8] |
| S8 | **Zustand ändern** (Neu/Ausstellung/B-Ware) direkt vom Packtisch nach Schaden | JTL [S10]; passt zu PH Lagerbestand-Zuständen |
| S9 | **Nachdruck** einzelner Dokumente/Labels | JTL [S15] |

### Später
| # | Übernahme | Begründung |
|---|---|---|
| L1 | Waagenanbindung (USB/seriell → Browser via WebSerial/Agent) | erst bei Volumen; JTL braucht dafür Lizenz + Treiber |
| L2 | Seriennummer/Charge-Erfassung beim Packen | nur für Ausstellungsstücke/Elektro relevant; bei JTL Pro-Funktion, Dialog nicht belegt |
| L3 | Retouren am Packtisch einbuchen inkl. Ersatzlieferung 1:1 | Rücknahmen laufen bei uns zunächst über „Warenrücknahmen“ im Backoffice |
| L4 | Pick-to-Box / Sammelpickliste | bei unserem Volumen nicht nötig |
| L5 | Statistik je Packer (Pakete/h, Fehlscans) | bei JTL nicht belegt; eigener Mehrwert, DSGVO/Betriebsrat beachten |
| L6 | NVE/SSCC (GS1) für Speditionen | erst wenn Spedition es verlangt |

### Bewusste Abweichungen von JTL
- **Foto am Packtisch** (Paketinhalt vor Verschluss, Schaden) – bei JTL nicht belegt, bei uns bereits Teil von PH Lieferschein/Problem melden: behalten.
- **Touch-first** und große Ziele (Tablet am Packtisch) statt Maus-Plus/Minus.
- **Undo 8 s** statt Bestätigungsdialoge (Konzept 02) – JTL nutzt Bestätigungsdialoge („Mengen > 1 bestätigen“); bei uns nur für Mengen, sonst Undo.
- **Kommission**: Packen aus Kommissionsbestand eines Projekts (statt freien Lagerbestands) als eigene Quelle – bei JTL kein Gegenstück.
- **Kein Marktplatz-Rückmelde-Fan-out** nötig; nur Shop + Kundenmail.

---

## 5. Quellen (Abruf 04.11.2026)
**Zu Abschnitt 1–3 (JTL-Guide, offiziell):**
- [S1] JTL-PackingBench – Übersicht: https://guide.jtl-software.com/en/jtl-wawi/jtl-packing-bench/
- [S2] Aufträge verpacken: https://guide.jtl-software.com/jtl-wawi/jtl-packtisch/auftraege-verpacken/
- [S3] Pickliste verpacken: https://guide.jtl-software.com/jtl-wawi/jtl-packtisch/pickliste-verpacken/
- [S4] Arbeitsplatz und Drucker: https://guide.jtl-software.com/jtl-wawi/jtl-packtisch/arbeitsplatz-und-drucker/
- [S5] Packtisch+/WMS-Ausgabe konfigurieren: https://guide.jtl-software.com/jtl-wawi/jtl-packtisch/packtisch-wms-ausgabe-konfigurieren/
- [S6] Lageroptionen: https://guide.jtl-software.com/jtl-wawi/jtl-packtisch/lageroptionen/
- [S7] Hinweis am Packtisch anzeigen: https://guide.jtl-software.com/jtl-wawi/jtl-packtisch/einen-hinweis-am-packtisch-anzeigen-lassen/
- [S8] Infoboxen: https://guide.jtl-software.com/jtl-wawi/jtl-packtisch/infoboxen/
- [S9] Retouren und Ersatzlieferungen: https://guide.jtl-software.com/jtl-wawi/jtl-packtisch/retouren-und-ersatzlieferungen/
- [S10] Artikelzustand ändern: https://guide.jtl-software.com/jtl-wawi/jtl-packtisch/artikelzustand-aendern/
- [S11] JTL-ShippingLabels einrichten: https://guide.jtl-software.com/jtl-wawi/jtl-packtisch/jtl-shippinglabels-einrichten/
- [S12] WMS Warenausgang – Übersicht: https://guide.jtl-software.com/jtl-wms/warenausgang/
- [S13] Allgemeines zu den Warenausgangsprozessen: https://guide.jtl-software.com/jtl-wms/warenausgang/allgemeines-zu-den-warenausgangsprozessen/
- [S14] Warenausgang mit EazyShipping: https://guide.jtl-software.com/jtl-wms/warenausgang/warenausgang-mit-eazyshipping/
- [S15] Dialogfenster EazyShipping: https://guide.jtl-software.com/jtl-wms/warenausgang/dialogfenster-eazyshipping/
- [S16] Dialogfenster Boxen verpacken: https://guide.jtl-software.com/jtl-wms/warenausgang/dialogfenster-boxen-verpacken/
- [S17] Warenausgang über Versandboxen: https://guide.jtl-software.com/jtl-wms/warenausgang/warenausgang-ueber-versandboxen/
- [S18] Kartonagen im Warenausgang wählen: https://guide.jtl-software.com/jtl-wms/kartonagen-im-warenausgang-waehlen/
- [S19] Packstückinhalte tracken: https://guide.jtl-software.com/jtl-wms/warenausgang/packstueckinhalte-tracken/
- [S20] Warenausgang mit Speditionsversand: https://guide.jtl-software.com/jtl-wms/warenausgang/warenausgang-mit-speditionsversand/
- [S21] Versandgewicht über Waage erfassen: https://guide.jtl-software.com/en/jtl-wms/goods-issue/recording-the-shipping-weight-with-a-scale/
- [S22] Waagen in JTL-WMS und JTL-Packtisch konfigurieren: https://guide.jtl-software.com/jtl-wms/einstellungen/waagen-in-jtl-wms-und-jtl-packtisch-konfigurieren/
- [S23] Verwendung von Waagen in Versandarten: https://guide.jtl-software.com/jtl-wawi/versand/verwendung-von-waagen-in-versandarten-festlegen/
- [S24] Dialogfenster Auftragsübersicht (WMS): https://guide.jtl-software.com/jtl-wms/warenausgang/dialogfenster-auftragsuebersicht/

**Drittquelle (nur ergänzend, nicht offiziell):**
- [S25] yagemi – JTL Seriennummern/Chargen/MHD: https://www.yagemi.de/blog/erp-warenwirtschaft/jtl-seriennummern-chargen-mhd/

**Zu Abschnitt 4:** eigene Ableitung aus S1–S25 und `Marktresearch/digital/backoffice/10-konzept-logistik.md`.

Hinweis zur Methode: Seiten wurden per Web-Abruf als Text zusammengefasst; Bezeichnungen sind die dort genannten Oberflächenbegriffe. Für verbindliche Details (Versionen ab Wawi 2.0, Editionen Pro/Enterprise) vor Umsetzung die jeweilige Seite gegenlesen.
