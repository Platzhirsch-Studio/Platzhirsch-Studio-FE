# 02 – UX-Leitlinien Backoffice Platzhirsch

**Zweck:** Verbindliche Bedienregeln für alle Fachbereichs-Agenten des Next-Backoffice (`backoffice/`, Port 3100). Einlösen von „total einfach, aber mächtig“: wenige Klicks für die täglichen Aufgaben, Tiefe erst auf Nachfrage, ein Bedienmuster für alle zwölf Bereiche.
**Stand:** 2026-11-04 · Rolle: UX-Lead · Grundlage: `PLAN-NEXT-BACKOFFICE.md`, `backoffice/src/components/Backoffice/README.md`, `backoffice/src/app/globals.css`, DocType-JSONs in `Backend-Import/ph_*`, Vorbild SHD marahplus.
**Gilt für:** jede Seite, jede Komponente, jeden Text. Abweichungen nur mit Begründung in der Datei des Bereichs (`Marktresearch/digital/backoffice/<nn>-<bereich>.md`).

---

## 0. Zehn Grundsätze (Kurzfassung für die Wand)

1. **Ein Muster, zwölf Bereiche.** Liste → Kanban → Formular → Druck sehen überall gleich aus. Wer CRM kann, kann Service.
2. **Die Hauptsache zuerst.** Jede Seite hat genau eine Primäraktion (Tinte-Knopf, rechts oben). Alles andere ist sekundär oder im Menü „…“.
3. **Drei Klicks bis zur Tagesaufgabe.** Gemessen ab Zentrale, ohne Suche. Suche/Palette (⌘K) ist immer der zweite Weg, nie der einzige.
4. **Undo statt Rückfrage.** Rückgängig für 8 s im Toast; Bestätigungsdialog nur bei unumkehrbaren oder geldwirksamen Schritten (Liste §8.2).
5. **Status ist sichtbar, nicht versteckt.** Jede Liste zeigt Status als Badge, jedes Formular zeigt die Phasenleiste über Objektgrenzen (Anfrage → Projekt → Rechnung).
6. **Inline, wenn ein Feld; Formular, wenn ein Vorgang.** Status, Zuständigkeit, Termin, Notiz: direkt in Liste oder Kopf. Alles mit Positionen oder Folgewirkung: Formular/Dialog.
7. **Nie leer, nie stumm.** Leerer Zustand erklärt, was hier erscheinen wird, und bietet den ersten Schritt. Fehler sagen, was war und was jetzt geht.
8. **Tastatur ist gleichwertig.** Alles, was die Maus kann, geht ohne Maus. Kürzel stehen im Tooltip und in der Palette.
9. **iPad ist kein kleiner Desktop.** Kiosk-Arbeitsplätze (Kassa, Packtisch, Montage, Technik) sind eigene Oberflächen mit ≥ 48 px Zielen, kein verkleinertes Backoffice.
10. **Ruhig, nicht laut.** Keine Konfetti, kein Rot außer bei echten Problemen, Animation nur, wenn sie Orientierung gibt (≤ 200 ms, Easing `cubic-bezier(.2,.8,.2,1)`).

---

## 1. Rollen-Personas und Top-Aufgaben

Team ca. 10–15 Personen, keine IT-Profis, mehrere Rollen pro Person üblich (Verkäufer = Planer, Backoffice = Kassa). Klickzahl = Klicks/Tipps ab Zentrale (Dashboard) ohne Suche und ohne Tastatureingabe in Felder; Enter zählt als Klick.

### 1.1 Verkäufer / Berater (Rollen: PH CRM Mitarbeiter, PH Projekte Mitarbeiter, PH Faktura Mitarbeiter)
Arbeitsplatz Backoffice, meist Laptop im Showroom, oft im Stehen, Kunde daneben.

| Top-Aufgabe (täglich) | Ziel Klicks | Weg |
|---|---|---|
| Neue Anfrage des Tages ansehen und qualifizieren | 2 | Zentrale „Neue Anfragen“ → Zeile → Knopf „Qualifizieren“ (Inline in Liste: 1) |
| Termin für Kunden anlegen | 3 | Kontakt → „Termin“ → Datum/Uhrzeit wählen → Speichern |
| Beratungsgespräch protokollieren | 2 | Termin heute (Zentrale) → „Protokoll“ → Freitext, Speichern (automatisch) |
| Angebot aus Planung erstellen | 2 | Projekt → „Angebot erstellen“ (Positionen aus Planung vorbefüllt) |
| Angebot senden | 2 | Angebot → „Senden“ (Mailvorlage vorbefüllt, Vorschau im selben Dialog) |
| Projektstand nachsehen (Kunde ruft an) | 1 | ⌘K → Kundenname → Enter zeigt Projekt mit Phasenleiste (zählt 1 Tastatureingabe + 1 Klick) |
| Anzahlungslink senden | 2 | AB → „Anzahlung anfordern“ → Betrag vorbefüllt (aus Zahlungsplan) → Senden |

### 1.2 Planer (PH Projekte Mitarbeiter/Leitung)
Große Monitore, CAD/pCon daneben, arbeitet in längeren Blöcken an einem Projekt.

| Top-Aufgabe | Ziel Klicks | Weg |
|---|---|---|
| Planung/Rendering hochladen | 2 | Projekt → Tab Planung → Datei ablegen (Drag & Drop auf Tab zählt 1) |
| Rendering dem Kunden vorlegen | 2 | Rendering → „Kunden vorlegen“ → Senden |
| Herstellerbestellung aus AB auslösen | 2 | AB → „Herstellerbestellungen erzeugen“ (gruppiert je Lieferant, Vorschau im Dialog) |
| AB des Herstellers gegen Bestellung prüfen | 3 | Bestellung → Tab Abgleich → Abweichungen markieren → „Abgeglichen“ |
| Liefertermin ändern und Kunden informieren | 3 | Projekt → Feld Liefertermin (inline) → Toast „Kunde informieren?“ → Ja |

### 1.3 Backoffice / Auftragsabwicklung (PH Faktura, PH Shop, PH Sortiment Mitarbeiter)
Desktop, zwei Monitore, höchste Objektzahl pro Tag, Tastaturnutzer.

| Top-Aufgabe | Ziel Klicks | Weg |
|---|---|---|
| Zahlungseingang zuordnen | 2 | Faktura → Bankumsätze (vorgeschlagene Zuordnung) → „Zuordnen“ |
| Anzahlungsrechnung stellen | 2 | AB → „Anzahlungsrechnung“ → „Stellen“ |
| Schlussrechnung mit Anzahlungsverrechnung | 2 | AB/Projekt → „Schlussrechnung“ (Anzahlungen bereits abgezogen) → „Stellen“ |
| Mahnlauf | 3 | Faktura → Offene Posten → Auswahl „Alle fälligen“ → „Mahnen“ |
| Shop-Bestellung abholbereit melden | 1 | Shop Kanban: Karte ziehen nach „Abholbereit“ (Mail automatisch) |
| Eingangsrechnung freigeben | 2 | Eingangsrechnungen „Zu prüfen“ → Zeile → „Freigeben“ |
| Monatsexport an Kanzlei | 3 | Faktura → Export-Läufe → „Neuer Lauf“ → „Erzeugen“ |

### 1.4 Lager / Packtisch (PH Logistik Mitarbeiter)
Arbeitsplatz **Packtisch** (iPad oder Touch-Monitor, Scanner, Etikettendrucker), Handschuhe möglich, steht.

| Top-Aufgabe | Ziel Klicks/Tipps | Weg |
|---|---|---|
| Lieferschein packen | 0 + Scans | Scan Lieferschein-QR → Positionen erscheinen → Scan je Artikel hakt ab → letzter Scan: „Fertig packen“ erscheint groß |
| Etikett drucken | 1 | Knopf „Etikett“ (oder F4) |
| Wareneingang buchen | 2 | Scan Lieferschein des Herstellers oder Bestellnummer → Mengen bestätigen → „Buchen“ |
| Umlagern | 2 | Scan Artikel → Scan Zielplatz (Tipps: 0, falls beide Codes vorhanden) |
| Inventur zählen | 1 je Position | Scan → Zahl tippen → Enter |

### 1.5 Monteur / Fahrer (PH Montage)
Arbeitsplatz **Montage mobil** (iPhone/iPad, oft schlechtes Netz, schmutzige Hände, Sonne).

| Top-Aufgabe | Ziel Tipps | Weg |
|---|---|---|
| Heutige Stopps sehen | 0 | Startseite des Arbeitsplatzes = Tour heute, nächster Stopp oben |
| Navigation starten | 1 | Adresse → öffnet Karten-App |
| Fotos vorher/nachher | 2 | Stopp → Kamera-Knopf (Foto sofort hochgeladen oder gepuffert) |
| Unterschrift Kunde | 2 | „Abnahme“ → Unterschriftsfeld → „Fertig“ |
| Mangel melden | 3 | „Mangel“ → Foto → Text (Diktat möglich) → Senden |
| Zeiten | 1 | „Start“/„Ende“ auf dem Stopp (ein Knopf, wechselt) |

### 1.6 Kassa (PH Kassa Mitarbeiter, jede Verkäuferin per Bedienerwechsel)
Arbeitsplatz **Kassa** (iPad/Touch, Bondrucker, Terminal, Kundenkarte).

| Top-Aufgabe | Ziel Tipps | Weg |
|---|---|---|
| Barverkauf Accessoire | 3 | Scan/Suche Artikel → Zahlart „Bar“ → Betrag gegeben → Bon druckt |
| Anzahlung auf Auftrag kassieren | 3 | Kunde/Auftrag suchen → „Anzahlung“ (Betrag aus Zahlungsplan) → Zahlart |
| Kundenkarte einlösen | 1 | Scan Karte (Vorteil wird automatisch angewendet, sichtbar als Zeile) |
| Bon nachdrucken | 2 | „Belege“ → letzter Beleg → „Drucken“ |
| Tagesabschluss | 3 | „Abschluss“ → Zählung eingeben → „Abschließen“ |
| Bedienerwechsel | 2 | Name tippen → PIN |

### 1.7 Geschäftsführung (PH Geschäftsführung)
Laptop, iPad abends, liest mehr als sie schreibt, will keine Listen durchsuchen.

| Top-Aufgabe | Ziel Klicks | Weg |
|---|---|---|
| Lage heute (Umsatz, offene Posten, Anfragen, Liefertermine) | 0 | Zentrale ist das Cockpit (Rollenansicht GF) |
| Freigabe (Rückerstattung, Kulanz, Newsletter) | 1 | Glocke → Eintrag → „Freigeben“ im Eintrag selbst |
| Projekt eines Kunden ansehen | 1 | ⌘K → Name |
| Bericht Umsatz nach Marke | 2 | Faktura → Reports → „Umsatz nach Marke“ (Zeitraum merkt sich) |
| Aufgabe an Mitarbeiter | 2 | Überall „Aufgabe“ aus dem Kontextmenü eines Datensatzes → Text → Enter |

### 1.8 Steuerberater extern (PH Buchhaltung extern)
Kommt monatlich, kennt die Anwendung nicht, darf nur lesen/exportieren.

| Top-Aufgabe | Ziel Klicks | Weg |
|---|---|---|
| Export des Monats laden | 2 | Startseite der Rolle = Export-Läufe → Lauf → „Herunterladen“ |
| Beleg zu einer Buchung ansehen | 2 | Lauf → Protokollzeile → öffnet Rechnung (nur lesen, PDF-Knopf) |
| Offene Posten zum Stichtag | 2 | Reports → „Offene Posten“ (Stichtag vorbelegt letzter Monatsletzter) |
| Kassenbuch / DEP | 2 | Kassa → Kassenbuch → Monat |

Regel: Jede Rolle hat eine **eigene Zentrale** (Kennzahlen und Listen nach Rolle, `dashboard.js`); die GF-Zentrale ist die Zusammenfassung aller. Niemand sieht Kacheln, die er nicht öffnen darf.

---

## 2. Navigationsmodell

### 2.1 Drei Ebenen: Arbeitsplatz → Bereich → Objekt

```
Login ──► Arbeitsplatz-Wahl (nur wenn > 1 erlaubt) ──► Backoffice | Kassa | Packtisch | Montage | Technik
                                                          │
            Backoffice: Seitenleiste (Bereiche nach Rechten) ─► Bereichsstart (Kennzahlen, Listen) ─► Objekt (Formular)
            Kiosk:      keine Seitenleiste, eine Aufgabe je Bildschirm, Rückweg „Fertig“ oder Esc
```

- **Seitenleiste** (Desktop ≥ 1024 px): 240 px, einklappbar auf 56 px (Icons, Tooltip), Zustand in `localStorage`. Reihenfolge: Zentrale, dann Bereiche in `bereiche.js`-Reihenfolge; Bereiche mit Rolle des Benutzers zuerst, übrige (nur Leserecht) darunter unter „Weitere“.
- **Bereichsstart** = Kennzahlen (max. 6), „Heute“ (Termine, Fälliges), die 2–3 wichtigsten Listen als Kacheln mit Zähler. Kein Platzhalter mit allen DocTypes im Endzustand (nur Fundament).
- **Unternavigation** im Bereich: Tabs unter dem Seitenkopf (max. 7, Rest im Menü „Mehr“), horizontal scrollbar am iPad, aktiver Tab mit 2 px Unterstrich in Tinte.
- **Brotkrumen** immer: Zentrale › Bereich › Liste › Objekt. Objektname mit Status-Badge daneben. Klick auf die Liste bringt zurück mit erhaltenen Filtern (Filter leben in der URL, `listenAbfrage`).
- **Zurück** = Browser-Zurück funktioniert immer (keine Zustände nur im Speicher). Drawer/Dialoge hängen an `?panel=` nicht an History-Einträgen, Esc schließt.

### 2.2 Globale Suche / Befehlspalette (⌘K / Strg+K)

Bestandteil `Shell/Befehlspalette.js`, erweitert um:

| Eingabe | Ergebnisgruppen (Reihenfolge) | Beispiel |
|---|---|---|
| leer | Zuletzt geöffnet (8), Schnellaktionen der Rolle (5), Bereiche | „Neue Anfrage“, „Termin anlegen“, „Kassa öffnen“ |
| Text | Datensätze (Kontakte, Projekte, Belege: Titel + Nummer + Status), Aktionen, Bereiche, Hilfe | „müller“ → Kontakt Müller Anna · Projekt P-26-0042 (Montage) · RE-2026-0113 (Gestellt) |
| Nummer / Präfix | exakter Beleg zuerst | „RE-0113“, „P-0042“, „AN-“ |
| `>` | nur Aktionen | „> rechnung stellen“ |
| `?` | nur Hilfe | „? anzahlung“ |
| `@` | Personen (Mitarbeiter, Zuweisen) | „@ lena“ |
| `#` | Status-Filter in aktueller Liste | „# überfällig“ |

- Antwortzeit-Ziel: erste Ergebnisse ≤ 150 ms nach Eingabe-Ende (Debounce 180 ms besteht), Skelett statt Spinner.
- Tastatur: ↑/↓, Enter öffnet, ⌘Enter öffnet in neuem Tab, Tab wechselt Gruppe, Esc schließt. Erste Zeile ist vorausgewählt.
- Jeder Treffer zeigt rechts den Tastaturhinweis oder den Bereich in `text-faint`.
- Aktionen, die der Benutzer nicht darf, erscheinen nicht (Server filtert).
- Leer-Zustand bei 0 Treffern: „Nichts zu ‚xyz‘ gefunden“ + Vorschlag „Neuen Kontakt ‚xyz‘ anlegen“ (wenn Recht).

### 2.3 Arbeitsplatzwechsel
Benutzer-Menü → „Arbeitsplatz“: Kacheln wie `/arbeitsplatz`. Im Kiosk: Kopfzeile → Arbeitsplatzname → Menü. Wechsel beendet keine Sitzung, Kiosk-Idle 15 min bleibt.

---

## 3. Fortschritt über Objektgrenzen: die Vorgangsleiste

Problem: Ein Kundenvorgang läuft über 6–9 DocTypes (PH Anfrage → PH Projekt → PH Angebot → PH Auftragsbestaetigung → PH Herstellerbestellung → PH Lieferschein → PH Montageauftrag → PH Rechnung → PH Servicefall). Niemand soll wissen müssen, wo er klicken muss.

### 3.1 Komponente `Vorgangsleiste` (neu, `components/Backoffice/Vorgang/`)
Sitzt unter dem Seitenkopf jedes Objekts, das zu einem Projekt gehört (Leitobjekt: `PH Projekt`, Feld `status`: Anfrage | Planung | Angebot | Auftrag | Bestellung | Lieferung | Montage | Uebergabe | Abgeschlossen).

```
 ┌────────────────────────────────────────────────────────────────────────────────────┐
 │ Projekt P-26-0042 · Familie Muster, Lochau · Küche Bulthaup                        │
 │ ●──────●──────●──────◉──────○──────○──────○──────○──────○                          │
 │ Anfrage Planung Angebot Auftrag Bestell. Lieferung Montage Übergabe Abgeschl.      │
 │   12.09.  23.09.  02.10.  14.10.  ─        KW 48      KW 49                        │
 │                          ▲ hier                                                    │
 │ Nächster Schritt: Herstellerbestellung auslösen (2 Lieferanten)      [Auslösen]    │
 └────────────────────────────────────────────────────────────────────────────────────┘
```

- Punkte: erledigt = gefüllt Tinte, aktuell = Ring mit Füllung Sand, offen = hohl `line-strong`. Unter jedem Punkt Datum (erledigt) oder Plan (KW) oder „–“.
- Klick auf einen Punkt öffnet das zugehörige Objekt (Angebot, AB, Lieferschein …); mehrere Objekte je Phase → Popover-Liste.
- **„Nächster Schritt“** kommt aus einer Regel je Phase (Tabelle 3.2) und zeigt genau eine Primäraktion. Wenn blockiert (z. B. Anzahlung offen): Hinweis mit Grund und Link („Anzahlung 3.200,00 € offen – Zahlungslink senden“).
- Kompakt-Variante (Liste/Kanban-Karte): 9 Punkte 6 px, ohne Text, `title`-Attribut, ohne Animation.
- Mobil (Montage/Technik): nur aktuelle Phase + nächster Schritt als Textzeile.
- Animation: Beim Phasenwechsel füllt sich die Linie bis zum neuen Punkt in 400 ms `ease-out`, Punkt skaliert 0.8 → 1 in 200 ms. Bei `prefers-reduced-motion`: keine.

### 3.2 Regeln „Nächster Schritt“ (Startliste; Fachbereiche ergänzen)

| Projektphase | Bedingung | Nächster Schritt (Primär) | Blocker-Text |
|---|---|---|---|
| Anfrage | kein Termin | Termin vereinbaren | – |
| Anfrage | Termin vorbei, kein Protokoll | Beratungsprotokoll schreiben | – |
| Planung | Planung ohne Rendering | Rendering hochladen | – |
| Planung | Rendering vorgelegt, Feedback offen | Kunde nachfassen (Mail) | „Vorgelegt am …, keine Antwort“ |
| Angebot | Angebot Entwurf | Angebot senden | – |
| Angebot | Gesendet > 14 Tage | Nachfassen | – |
| Auftrag | AB ohne Anzahlungsrechnung | Anzahlungsrechnung stellen | – |
| Auftrag | Anzahlung offen | – | „Anzahlung offen – Bestellung erst nach Zahlung“ (Leitung darf übersteuern) |
| Bestellung | AB vom Hersteller fehlt | AB erfassen/abgleichen | „AB fehlt seit n Tagen“ |
| Lieferung | Wareneingang vollständig | Tour planen | „n Positionen fehlen“ |
| Montage | Montageauftrag erledigt, keine Abnahme | Abnahme unterschreiben lassen | – |
| Übergabe | Abnahme ohne Mängel | Schlussrechnung stellen | „n offene Mängel“ |
| Übergabe | Schlussrechnung bezahlt | Projekt abschließen (automatisch nach 7 Tagen) | – |
| Abgeschlossen | – | Referenz anlegen? (sekundär) | – |

### 3.3 Verknüpfungsleiste („Hängemappe“)
Rechte Spalte jedes Objekts (`Zeitleiste` erweitern): Kundendaten, alle verknüpften Belege gruppiert nach Art mit Status-Badge und Betrag, Dokumente/Anhänge, Zeitleiste (Kommentare, Versionen). Am iPad als Tab „Verknüpft“.

---

## 4. Inline-Bearbeitung vs. Formular

### 4.1 Entscheidungsregel

| Inline (Liste, Kanban, Kopf) | Formular / Dialog |
|---|---|
| Ein Feld, keine Folgewirkung außerhalb des Datensatzes: Status (wenn Workflow erlaubt), Zuständig, Termin/Datum, Priorität, Tags, Notiz | Mehrere abhängige Felder (Positionen, Beträge, Steuer) |
| Werte mit endlicher Auswahl (Select, Link) | Neue Datensätze mit Pflichtfeldern > 3 |
| Zahlen ohne Nebenwirkung (Zählmenge Inventur, Sortierung) | Alles mit Nummernkreis/Buchung (Rechnung stellen, Beleg buchen) |
| Umbenennen von Titeln | Alles, was eine Mail/SMS auslöst (Vorschau nötig) |

### 4.2 Verhalten Inline
- Klick auf Zelle (oder Enter bei Fokus) → Editor erscheint an Ort und Stelle, gleiche Breite, Rahmen 1 px Tinte, Hintergrund `surface`.
- Speichern bei Enter oder Fokusverlust; Esc verwirft. Optimistisch: Wert sofort, kleines Häkchen 600 ms rechts in der Zelle; bei Fehler Wert zurück + Toast mit Grund.
- Tab springt zur nächsten editierbaren Zelle der Zeile, Shift+Tab zurück, ↓ in gleiche Spalte nächste Zeile (Tabellenkalkulations-Gefühl, nur für Zahlen-/Textspalten).
- Konflikt (`modified` älter): Zelle wird gelb umrandet, Tooltip „Von Lena vor 2 Min. geändert: 12 → 14“, Knöpfe „Übernehmen“ / „Meinen Wert behalten“.
- Gesperrt (kein Recht, `docstatus=1`): Cursor normal, kein Hover-Rahmen, Tooltip „Gebucht – nur Leitung kann stornieren“.

### 4.3 Formular
- Generisches `Formular` aus Meta bleibt der Rückfall; jedes Hauptobjekt bekommt ein **gestaltetes Formular** (Kopf mit Titel/Status/Primäraktion, links Inhalt in Abschnitten, rechts Hängemappe).
- **Autosave** für Entwürfe (`docstatus=0`, kein Workflow-Sprung): 1 s nach letzter Eingabe, Anzeige „Gespeichert 14:02“ im Kopf in `text-faint`. Kein Speichern-Knopf für reine Entwurfsänderungen; der Knopf heißt dann, was als Nächstes passiert („Senden“, „Stellen“, „Freigeben“).
- Neu-Dialog: nur Pflichtfelder + 2–3 häufigste; „Weitere Angaben“ einklappbar; `Anlegen` und `Anlegen und öffnen`.
- Pflichtfelder: Sternchen in Sand, Fehlertext unter dem Feld (nicht nur rot), erstes Fehlerfeld bekommt Fokus, Zusammenfassung oben nur bei > 3 Fehlern.
- Link-Felder: Tippen = Suche (ab 1 Zeichen), erste Zeile vorausgewählt, letzte Zeile „‚xyz‘ neu anlegen“ (öffnet Mini-Dialog, kehrt mit Wert zurück).
- Kindtabellen: Zeile hinzufügen mit Enter in der letzten Zelle; Zeile löschen mit Backspace in leerer Zeile oder „–“ links; Summen live unten; Spalten je Bildschirmbreite priorisiert (Artikel, Menge, Preis, Gesamt bleiben immer).
- Verlassen mit ungesicherten Änderungen (nur außerhalb Autosave): Dialog „Änderungen verwerfen?“ mit Knöpfen „Weiter bearbeiten“ (Primär) / „Verwerfen“.

---

## 5. Massenaktionen

- Auswahl: Checkbox je Zeile (erscheint bei Hover/Fokus, bei Touch dauerhaft), Kopf-Checkbox = Seite, dann Zeile „Alle 312 auswählen“ (Server-Filter wird mitgegeben).
- Shift+Klick wählt Bereich, Leertaste schaltet fokussierte Zeile, ⌘A wählt Seite.
- **Aktionsleiste** schiebt sich von unten ein (160 ms, translateY 16 px → 0, Opacity 0 → 1), bleibt am unteren Rand: „3 ausgewählt · [Zuweisen] [Status] [Drucken] [Exportieren] [Mehr ▾] · Abbrechen (Esc)“.
- Erlaubt sind nur Aktionen, die für **alle** gewählten Zeilen zulässig sind; sonst Knopf aktiv, aber Dialog zeigt Vorschau „3 von 5 möglich – 2 übersprungen (bereits gebucht)“ mit Liste.
- Ausführung: Fortschritt im Knopf („12/40“), Abbruch möglich; Ergebnis-Toast „38 gemahnt, 2 übersprungen – Details“ (Details = Drawer mit Liste, Export).
- Undo bei Massen-Statuswechsel/Zuweisung: 8 s (Toast), danach nur einzeln.
- Pro Liste max. 6 Massenaktionen sichtbar; Reihenfolge nach Häufigkeit; gefährliche (Löschen, Stornieren) nur unter „Mehr“ und rot.
- Kanban: Mehrfachauswahl mit ⌘/Strg+Klick auf Karten, Ziehen bewegt alle.

---

## 6. Undo statt Bestätigungsdialoge

### 6.1 Undo (Standard)
Jede umkehrbare Aktion zeigt einen Toast (unten Mitte Desktop, unten über der Tab-Leiste am iPad):

```
 ┌──────────────────────────────────────────────┐
 │ ✓ Anfrage an Lena zugewiesen      Rückgängig │  ← Balken läuft 8 s ab (2 px, Sand)
 └──────────────────────────────────────────────┘
```
- Dauer 8 s, Hover/Fokus hält an, Tastatur: ⌘Z / Strg+Z innerhalb der Zeit macht den letzten Toast rückgängig.
- Technik: Aktion wird sofort ausgeführt (nicht verzögert), Undo ruft die Gegen-Action (`setzeWert` alter Wert, Workflow-Rückübergang, Wiederherstellen aus Papierkorb). Fachbereichs-Actions geben `{ ok, undo: { action, args } }` zurück.
- Mehrere Toasts stapeln bis 3, älteste verschwindet zuerst; `aria-live="polite"`.
- Umkehrbar sind: Zuweisen, Status ohne Buchung/Versand, Löschen von Entwürfen (Papierkorb 30 Tage), Archivieren, Verschieben im Kanban, Tag/Notiz, Termin verschieben (Kunde wird erst nach Ablauf des Undo informiert – Mail geht mit 10 s Verzögerung).

### 6.2 Bestätigung (Ausnahme, `Bestaetigen`)
Nur wenn unumkehrbar **oder** geldwirksam **oder** nach außen sichtbar ohne Verzögerungsmöglichkeit:

| Aktion | Dialoginhalt | Primärknopf |
|---|---|---|
| Rechnung stellen (Nummer vergeben) | Betrag, Empfänger, Fälligkeit, „Nummer RE-2026-0114 wird vergeben“ | „Stellen“ |
| Buchen/Stornieren (`submit/cancel`) | Was wird gesperrt / storniert, Folgebelege | „Buchen“ / „Stornieren“ |
| Rückerstattung | Betrag, Zahlungsweg, Freigabe GF nötig | „Erstatten“ (deaktiviert bis Freigabe) |
| Kassa-Storno nach Bon | Leitungs-PIN | „Stornieren“ |
| Daten eines Kontakts löschen (DSGVO) | Liste betroffener Datensätze, Tippfeld „löschen“ | „Endgültig löschen“ |
| Newsletter versenden | Empfängerzahl, Testversand erledigt? | „Jetzt senden“ |
| Export an Kanzlei erzeugen | Zeitraum, Beleganzahl, „Belege werden gesperrt“ | „Erzeugen“ |

Dialog: `<dialog>` 440 px, Titel in Satzform („Rechnung über 4.800,00 € stellen?“), 1–3 Zeilen Fakten, Primärknopf rechts, Esc = Abbrechen, Fokus auf Abbrechen bei roten Aktionen, auf Primär bei neutralen. Nie „Sind Sie sicher?“ als Titel.

---

## 7. Fehler- und Leerzustände

### 7.1 Leerzustände (`Leer`)
Drei Fälle, immer unterscheiden:

| Fall | Text (Muster) | Aktion |
|---|---|---|
| Noch nie Daten | „Noch keine Angebote. Angebote entstehen aus einem Projekt oder direkt hier.“ | Primär „Angebot anlegen“, sekundär „Wie funktioniert das?“ (Hilfe) |
| Filter liefert nichts | „Keine Rechnungen mit Status ‚Überfällig‘ im Oktober.“ | „Filter zurücksetzen“ (Chips bleiben sichtbar und anklickbar) |
| Alles erledigt | „Alles erledigt – keine offenen Anfragen.“ | keine; Illustration = ruhiges Häkchen-Icon in Sand, 32 px |

Regeln: Icon 32 px aus `icons.js` in `text-faint`, Titel 14 px medium, Text 13 px `text-soft`, max. 2 Zeilen, zentriert, Mindesthöhe 240 px. Keine Ausrufezeichen, kein „Hoppla“.

Kennzahl ohne Daten: zeigt „–“ mit Tooltip „Noch keine Werte“, nie 0 €, wenn 0 nur Abwesenheit von Daten bedeutet.

### 7.2 Fehler (`Fehler`)

| Code | Benutzertext | Angebot |
|---|---|---|
| `unavailable` | „Verbindung zum Server unterbrochen.“ | „Erneut versuchen“, automatischer Retry 3× (2/4/8 s), Anzeige „Versuche erneut …“ |
| `forbidden` | „Dafür fehlt dir die Berechtigung (Rolle PH Faktura Leitung).“ | „Leitung bitten“ (erzeugt PH Aufgabe an Leitung mit Link) |
| `not_found` | „Dieser Datensatz existiert nicht mehr oder wurde umbenannt.“ | „Zur Liste“, Suche nach Name |
| `conflict` | „Lena hat diesen Datensatz vor 2 Min. geändert.“ | „Änderungen anzeigen“ (Diff), „Neu laden“, „Trotzdem speichern“ (nur Leitung) |
| `invalid` | Feldfehler unter dem Feld; Zusammenfassung oben: „3 Angaben fehlen“ | Klick springt zum Feld |
| `rate_limited` | „Zu viele Versuche. In 9:48 Min. wieder möglich.“ | Countdown live |
| `auth` | Overlay „Sitzung abgelaufen“ mit Login-Feld, Formulardaten bleiben erhalten | nach Login weiter an gleicher Stelle |
| unbekannt | „Das hat nicht geklappt (Fehler-Nr. 7f3a).“ | „Erneut versuchen“, „Melden“ (kopiert Nr.+URL) |

- Fehler erscheinen **dort, wo gearbeitet wurde** (Feld, Knopf, Zeile), nicht als Vollbild, außer die Seite konnte nicht laden.
- Knopf im Fehlerfall: kehrt zum Normalzustand zurück, Text bleibt; nie dauerhaft deaktiviert ohne Erklärung.
- Offline (Kiosk): Band oben „Offline – Belege werden gepuffert (3 wartend)“ in `warn`, kein Rot; Rückkehr: „Wieder online – 3 Belege übertragen“ grün 4 s.
- Nie technische Begriffe (DocType, Frappe, 500, Timeout) im Text.

### 7.3 Ladezustände
- Skelette (Form der Zielseite, graue Balken `surface-3`, Schimmer 1,2 s linear) für Listen, Formulare, Kennzahlen (`DataTableSkeleton`, `loading.js`).
- Spinner nur in Knöpfen (16 px) und nur bei Aktionen > 300 ms; Knopftext bleibt, Spinner links davon.
- Kein Layout-Sprung: Platzhalter haben Zielhöhe.

---

## 8. Hilfe im Kontext

- **Erster Besuch einer Seite**: ein einzelnes Hinweis-Band unter dem Seitenkopf (1–2 Sätze, Link „Mehr“, „Verstanden“); nie Tour mit 7 Schritten. Merken in `localStorage` + Benutzerprofil.
- **Feld-Hilfe**: `description` aus Meta als Text unter dem Feld (nicht nur als Tooltip); Fachbegriffe (Anzahlungsverrechnung, UVA, RKSV) mit gestricheltem Unterstrich → Popover 200 Wörter max., Link zum Handbuch.
- **Hilfe-Panel** (Taste `?` außerhalb von Feldern, oder Benutzer-Menü → Hilfe): rechter Drawer 360 px mit Artikel zur aktuellen Seite, Tastenkürzel der Seite, „Was kann ich hier tun?“ (Aktionen nach Rechten), Kontakt zum Admin.
- **Blocker erklären**: Deaktivierte Knöpfe haben immer Tooltip mit Grund und, wenn möglich, Link zur Lösung („Erst Anzahlung erfassen → Zahlung erfassen“).
- **Leere Pflichtfelder in Workflow-Übergängen**: Übergang bleibt klickbar, Dialog listet, was fehlt, mit Sprunglinks.
- Handbuch lebt als Markdown im Repo (`backoffice/hilfe/<bereich>/<seite>.md`), wird serverseitig gerendert, Suche über Palette `?`.

---

## 9. Tastatur-Standard

### 9.1 Global (Backoffice-Shell)

| Kürzel | Wirkung |
|---|---|
| ⌘K / Strg+K | Befehlspalette |
| `/` | Fokus Suchfeld/Filter der aktuellen Liste |
| `?` | Hilfe-Panel |
| `G` dann `Z` / `C` / `P` / `F` / `L` / `S` | Gehe zu Zentrale / CRM / Projekte / Faktura / Logistik / Service (Sequenz, 1,5 s Fenster, Anzeige „G …“ unten links) |
| `N` | Neu (Hauptobjekt der aktuellen Liste) |
| `E` | Bearbeiten / erstes Feld fokussieren |
| ⌘S / Strg+S | Speichern (auch bei Autosave: sofort) |
| ⌘Enter / Strg+Enter | Primäraktion der Seite (Senden, Stellen, Anlegen) |
| ⌘Z / Strg+Z | Undo des letzten Toasts |
| Esc | Dialog/Drawer/Palette schließen, Auswahl aufheben, Inline-Edit abbrechen |
| ⌘P / Strg+P | Drucken (Druckformat statt Browserseite) |
| `[` / `]` | Seitenleiste ein-/ausklappen |
| Alt+↑ / Alt+↓ | Vorheriger/nächster Datensatz der Liste im Formular (Liste wird mitgeführt) |

### 9.2 Liste (`DataTable`)
↑/↓ Zeile, Enter öffnen, Leertaste auswählen, Shift+↑/↓ Bereich, ⌘A Seite, `X` Auswahl umschalten, `A` Zuweisen (Popover), `S` Status (Popover), `C` Kommentar, ←/→ Seite blättern (wenn Fokus auf Tabelle), `1–9` Statuschip-Filter, Backspace entfernt letzten Chip.

### 9.3 Kanban
←/→ Karte zwischen Spalten (öffnet Menü „Verschieben nach …“ bestehend), ↑/↓ Karte in Spalte, Enter öffnen, `M` Menü verschieben, Leertaste auswählen.

### 9.4 Formular
Tab/Shift+Tab Felder, ⌘Enter Primär, Alt+1…9 Tabs, Esc im Feld = Feld zurücksetzen (zweites Esc = Liste), in Kindtabelle: Enter neue Zeile, ⌘Backspace Zeile löschen, ⌘D Zeile duplizieren.

### 9.5 Kiosk (physische Tastatur optional, F-Tasten laut `useTastenkuerzel`)
Kassa: F2 Kunde suchen, F3 Artikel suchen, F4 Zahlart Bar, F5 Karte, F6 Bon pausieren, F7 Rabatt (Leitung), F8 Storno Position, F9 Belege, F10 Abschluss, F11 Vollbild, F12 Bedienerwechsel. Packtisch: F2 Lieferschein, F4 Etikett, F6 Paket schließen, F8 Problem melden. Scanner = Enter-terminierte Eingabe, nie in Textfelder, außer Feld hat `data-scan="ja"`.

Regeln: Kürzel stehen im Tooltip („Zuweisen · A“), in der Palette und im Hilfe-Panel. Einzelbuchstaben wirken nie in Eingabefeldern. Keine Kürzel mit Alt+Buchstabe (Browser-Menüs), keine Doppelbelegung mit Screenreadern (keine Strg+Alt-Kombinationen).

---

## 10. Barrierefreiheit (WCAG 2.2 AA)

Pflicht, geprüft in E2E (axe serious/critical = 0) und manuell je Bereich:

| Kriterium | Regel im Backoffice |
|---|---|
| 1.4.3 Kontrast | Text ≥ 4,5:1, großer Text ≥ 3:1; `text-faint` #646b72 auf Weiß ist Untergrenze; Status-Badges Text auf Hintergrund prüfen (hell: Textfarbe dunkel, Hintergrund 12 % Alpha) |
| 1.4.11 Nicht-Text-Kontrast | Rahmen von Eingaben ≥ 3:1 (`line-strong`), Fokusring 2 px Tinte / Messing dunkel |
| 2.4.7 / 2.4.11 Fokus sichtbar, nicht verdeckt | Fokusring immer, sticky Kopf/Aktionsleiste überdecken fokussiertes Element nie (`scroll-margin` 96 px) |
| 2.4.13 Fokus-Erscheinung | 2 px, Offset 2 px, umschließend |
| 2.5.7 Ziehbewegungen | Jede Drag-Aktion (Kanban, Reihenfolge Tour, Positionen) hat eine Tastatur-/Menü-Alternative |
| 2.5.8 Zielgröße | ≥ 24×24 px Minimum überall; 44 px Touch-Standard; 48 px Kiosk; Tabellenzeilen 40 px Desktop, 52 px iPad |
| 3.2.6 Konsistente Hilfe | Hilfe-Knopf immer an gleicher Stelle (Benutzer-Menü, Kiosk-Kopfzeile rechts) |
| 3.3.7 Redundante Eingabe | Vorbefüllung aus Vorgängerobjekt (Kontakt → Projekt → Angebot), nie zweimal tippen |
| 3.3.8 Barrierefreie Authentifizierung | Passwort-Manager erlaubt (kein Copy-Paste-Verbot), PIN-Wechsel ohne Rätsel |
| 1.3.1 Struktur | Eine `h1` je Seite (Seitenkopf), Tabellen mit `<th scope>`, Kanban als Listen mit `aria-label` je Spalte, Dialoge `aria-modal`, Toasts `aria-live` |
| 4.1.3 Statusmeldungen | Speichern/Fehler/Fortschritt als `aria-live="polite"`, Fehler `assertive` nur bei Verlustgefahr |
| 1.4.4 / 1.4.10 | 200 % Zoom ohne horizontalen Scroll am Desktop bis 1280 px, Tabellen dann mit fixierter erster Spalte |
| 2.2.1 Zeitlimits | Sitzungsablauf 2 Min. vorher ankündigen (Toast mit „Verlängern“), Kiosk-Idle zeigt 30 s Countdown |
| 1.4.1 Farbe | Status immer Text + Farbe; Phasenleiste Form + Farbe (gefüllt/Ring/hohl) |
| Bewegung | `prefers-reduced-motion`: alle Animationen aus, Übergänge sofort; kein Autoplay |
| Sprache | `lang="de-AT"`, Zahlen `1.234,56 €`, Datum `04.11.2026`, Wochentage ausgeschrieben in Tooltips |

Screenreader-Test (VoiceOver iPad, NVDA Windows) je Bereich: Liste filtern, Datensatz öffnen, Primäraktion, Toast hören, Undo.

---

## 11. Mobile- und iPad-Regeln

### 11.1 Breakpoints
- `< 640` Telefon (nur Montage/Technik und Lese-Ansicht Backoffice), `640–1023` iPad hoch/klein, `1024–1279` iPad quer/Laptop, `≥ 1280` Desktop.
- Backoffice-Shell am iPad quer: Seitenleiste eingeklappt (56 px), Palette per Knopf oben rechts, Tabellen mit 4 Prioritätsspalten (Rest im Zeilen-Drawer).
- Telefon: Backoffice-Formulare lesbar, Bearbeitung eingeschränkt auf Inline-Felder; Hinweis „Für Positionen bitte Tablet/Desktop“.

### 11.2 Touch
- Hover-Funktionen haben Touch-Entsprechung: Zeilen-Checkbox dauerhaft, Aktionen per Wischen links (Zuweisen) / rechts (Erledigt) mit sichtbarer Beschriftung, Langdruck 400 ms = Kontextmenü.
- Kein Drag & Drop als einziger Weg (Kanban: Karte antippen → „Verschieben“).
- Eingaben: `inputmode` korrekt (`decimal` für Beträge, `numeric` für PIN/Mengen, `tel`, `email`), `enterkeyhint` („Weiter“, „Fertig“, „Suchen“).
- Safe-Areas (`env(safe-area-inset-*)`) für Kiosk-Kopf-/Fußleiste; Home-Indicator nie unter einem Knopf.
- Datum/Zeit: native Picker am iPad, eigene Woche-Ansicht nur für Termine-Kalender.

### 11.3 Kiosk-Arbeitsplätze
- Ein Bildschirm = eine Aufgabe; Rückweg oben links „‹ Fertig“ oder Esc; kein Browser-Chrome sichtbar (Vollbild F11/Knopf, `display: standalone` Manifest).
- Schrift Grundgröße 16 px, Beträge 32 px, Summe 48 px; Kontrast wie Desktop; dunkles Schema erlaubt, im Showroom hell empfohlen (Einstellung je Gerät).
- Zahlenblock-Overlay 56 px Tasten für Beträge/Mengen (eigene Komponente, nicht die iOS-Tastatur, die halbe Fläche verdeckt).
- Offline: Band §7.2, Belege im IndexedDB-Puffer, Status in Kopfzeile (grüner/oranger Punkt + Text).
- Idle 15 min → Sperrbildschirm mit Bedienerliste (kein Datenverlust des offenen Bons: Bon wird „pausiert“).
- Montage mobil: Startseite „Heute“ mit Stopps als Karten (Adresse, Uhrzeit, Kunde, Telefon-Knopf, Navigation-Knopf), Foto-Knopf 64 px, Unterschrift Querformat erzwingen (Hinweis drehen), Fotos mit EXIF-Zeit, Upload-Warteschlange sichtbar („2 Fotos werden gesendet“).

---

## 12. Ladezeit- und Leistungsbudgets

| Messung | Budget | Hinweis |
|---|---|---|
| Erste Darstellung (LCP) Backoffice-Seite, LAN | ≤ 1,2 s | Server Components, Daten parallel (`Promise.all`), Skelett ab 100 ms |
| LCP Kiosk-Start | ≤ 1,5 s | Produktsuche-Index vorgeladen, Fonts lokal |
| Navigation Liste → Formular | ≤ 400 ms | Prefetch bei Hover/Fokus (Next `Link`), Formular-Skelett |
| Antwort Inline-Edit (optimistisch sichtbar) | ≤ 50 ms sichtbar, Server ≤ 500 ms | sonst Spinner in Zelle |
| Palette: Ergebnisse nach Eingabe-Ende | ≤ 150 ms (Mock) / ≤ 400 ms (Frappe) | Server-Cache 30 s für Bereiche/Aktionen |
| Liste 50 Zeilen rendern | ≤ 100 ms Script | Virtualisierung erst ab 200 Zeilen |
| JavaScript je Route (gzip) | ≤ 180 KB Shell + ≤ 80 KB Route | keine Chart-Bibliothek (SVG eigene), keine Icon-Komplettpakete (`icons.js` selektiv) |
| Schriften | 2 Dateien (Instrument Sans Var, Bodoni Moda nur Wortmarke) `font-display: swap`, lokal | |
| Bilder (Produktbilder in Listen) | ≤ 24 KB je Thumb, WebP/AVIF, `loading="lazy"`, fixe Maße | |
| Interaction to Next Paint | ≤ 200 ms | keine synchronen großen Berechnungen im Client |
| Kiosk-Bon drucken (Klick → Druckauftrag) | ≤ 300 ms | Signatur asynchron, Bon zeigt „wird signiert“ bis Rückmeldung |
| Timeout Serveraufruf | 8 s (bestehend), Benutzer sieht ab 2 s „Dauert länger als gewohnt …“ | |

Messen: Playwright-Trace je Bereich (Desktop + iPad), Lighthouse CI im Mock-Modus, Budgets als Testgrenzen.

---

## 13. Gestaltung der Bedienung (Kurzregeln, Details beim UI-Agenten)

- Dichte: Desktop kompakt (Zeile 40 px, Schrift 14 px), iPad komfortabel (52 px, 15 px), Kiosk groß (56 px+, 16 px+). Umschalter „Dichte“ im Benutzer-Menü (kompakt/normal).
- Farben nur als Bedeutung: Tinte = Aktion/Text, Sand = Akzent/aktuell, Grün/Orange/Rot/Blau = Status, Messing nur Fokus im Dunkelmodus und Kundenkarte-Stufen.
- Ein Primärknopf je Sichtbereich; sekundär = Umrandung; tertiär = Text. Gefährlich = Text rot, erst im Dialog als roter Vollknopf.
- Wortmarke (Bodoni) nur in Seitenleiste oben, Login, Arbeitsplatz-Wahl, Druck. Alle UI-Texte Instrument Sans.
- Status-Badges: 12 px, Großbuchstabe am Anfang, kein Versal, Hintergrund 12 % Alpha des Statustons, Punkt 6 px links.
- Icons nur mit Textlabel, außer in Icon-Leisten mit Tooltip (lucide, 16/20 px, Strich 1,5).
- Animationsgrundsätze: Einblenden 120–160 ms, Ausblenden 80–100 ms, Bewegung ≤ 16 px, Easing `cubic-bezier(.2,.8,.2,1)`; Drawer 200 ms `translateX`; Dialog 160 ms `scale(.98)→1` + Opacity; Kanban-Karte beim Ablegen 180 ms zur Zielposition; Zahlen in Kennzahlen zählen nicht hoch (kein Count-up), sie erscheinen.

---

## 14. Texte (Microcopy)

- Du-Form intern („Dafür fehlt dir die Berechtigung“), Kunden gegenüber Sie (Mails, Drucke).
- Knöpfe = Verb im Infinitiv/Imperativ, höchstens 3 Wörter: „Rechnung stellen“, „Senden“, „Zuweisen“.
- Titel von Dialogen = die Frage mit Fakten („Angebot AN-2026-0071 an anna.muster@… senden?“).
- Toast = Vergangenheit + Objekt („Rechnung RE-2026-0114 gestellt“), Fehler = Zustand + nächster Schritt.
- Zahlen: `cent()`-Format, Datum relativ bis 7 Tage („vor 2 Std.“, „morgen 14:00“), danach absolut; Tooltip immer absolut mit Wochentag.
- Keine Superlative, keine Floskeln („Erfolgreich“, „Super“), keine Ausrufezeichen, keine Emojis.
- Leerzeichen vor Einheiten: `4.800,00 €`, `12 Stk.`, `62 × 29 mm`.

---

## 15. Zehn Delight-Momente (seriös)

1. **Palette merkt sich dich.** Nach drei Tagen stehen die eigenen fünf häufigsten Aktionen oben, mit Kürzel. Keine Konfiguration.
2. **Der nächste Schritt steht schon da.** Vorgangsleiste sagt „Herstellerbestellung auslösen (2 Lieferanten)“ und der Knopf tut genau das, vorbefüllt.
3. **Rückgängig für alles Alltägliche.** Falsch zugewiesen, falsch verschoben: ⌘Z, erledigt. Niemand hat Angst vor dem Klick.
4. **Bankumsatz zuordnen in einem Klick.** Vorschlag mit Betrag, Rechnungsnummer im Verwendungszweck erkannt; Treffer sicher → grüner Vorschlag, unsicher → zwei Alternativen.
5. **Die Hängemappe.** Jedes Objekt zeigt rechts den ganzen Kundenvorgang: Angebot, AB, Zahlungen, Fotos der Montage, Servicefälle. Nie wieder „wo war das?“.
6. **Kassa kennt den Kunden.** Scan der Kundenkarte: Name, offene Anzahlung des Projekts und Vorteil erscheinen ohne Suche; Verkäuferin spricht den Kunden mit Namen an.
7. **Packen ohne Tippen.** Scanner-Rhythmus: Lieferschein, Artikel, Artikel, Artikel, letztes Piepen, Etikett kommt. Bildschirm bestätigt mit großer grüner Fläche 600 ms, kein Ton nötig.
8. **Montagebericht fertig beim Verlassen des Hauses.** Fotos, Zeiten, Unterschrift sind schon im Projekt; das Backoffice sieht die Schlussrechnung als nächsten Schritt, bevor der Monteur im Auto sitzt.
9. **Stille Freigabe.** GF bekommt in der Glocke eine Zeile mit Betrag und Grund, tippt „Freigeben“, fertig; kein Mailverkehr, Protokoll läuft mit.
10. **Steuerberater-Modus.** Externe Rolle landet auf einer Seite mit genau drei Dingen: Export laden, Offene Posten, Kassenbuch. Alles andere existiert für sie nicht.

Nicht erlaubt: Konfetti, Sounds außer am Kiosk-Scan (optional, aus per Gerät), animierte Maskottchen, „Glückwunsch“-Texte.

---

## 16. Abnahme-Checkliste je Seite (für Fachbereichs-Agenten)

- [ ] Primäraktion eindeutig, Kürzel ⌘Enter, Tooltip mit Kürzel
- [ ] Liste: Filter in URL, Status-Chips, Skelett, Leerzustand (3 Fälle), Tastatur §9.2, Massenaktionen mit Vorschau
- [ ] Formular: Autosave Entwurf, Pflichtfeld-Fehler unter dem Feld, Hängemappe rechts, Vorgangsleiste falls projektbezogen
- [ ] Jede umkehrbare Aktion mit Undo-Toast; Bestätigung nur aus Liste §6.2
- [ ] Fehlertexte aus Tabelle §7.2, keine Technikbegriffe
- [ ] Deaktivierte Knöpfe mit Grund im Tooltip
- [ ] axe 0 serious/critical, Fokus sichtbar, Zielgrößen, Screenreader-Durchlauf
- [ ] iPad-Layout geprüft (quer + hoch), Touch-Alternativen für Hover/Drag
- [ ] Budgets §12 im Mock-Modus eingehalten
- [ ] Hilfe-Artikel vorhanden (`backoffice/hilfe/<bereich>/<seite>.md`), Erstbesuchs-Hinweis ≤ 2 Sätze
- [ ] Texte §14: keine Superlative, keine erfundenen Zahlen, Beträge aus Cent

---

## 17. Offene Punkte / Anfragen an andere Agenten

| An | Anfrage |
|---|---|
| Fundament | Komponente `Vorgangsleiste` + Regelwerk „Nächster Schritt“ (§3) als gemeinsamer Baustein; Undo-Rückkanal in Server Actions (`undo: { action, args }`); Papierkorb 30 Tage für Entwürfe; Sequenz-Kürzel `G …`; Dichte-Umschalter |
| ph_core | Methode `ph_core.api.vorgang(projekt)` (alle verknüpften Belege in einem Aufruf) für Hängemappe und Vorgangsleiste; Benutzereinstellungen (Dichte, Erstbesuchs-Hinweise) am User speichern |
| UI/Grafik-Agent | Token für Badge-Hintergründe (12 % Alpha je Statuston hell/dunkel), Skelett-Schimmer, Zahlenblock-Komponente Kiosk, Icon-Set-Auswahl |
| Kassa-Agent | F-Tasten-Belegung §9.5 übernehmen; Idle-Sperre pausiert Bon; Offline-Band §7.2 |
| Logistik-Agent | Packtisch-Scan-Rhythmus §15.7, grüne Bestätigungsfläche 600 ms |
| Faktura-Agent | Zuordnungsvorschlag Bankumsatz mit Sicherheitsstufe (sicher/unsicher) |
