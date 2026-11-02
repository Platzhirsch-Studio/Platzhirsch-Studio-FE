# 10 – Cross- und Upselling: „Komplettieren Sie den Raum“

**Stand:** 26.10.2026 · Rolle: Experte für Cross-/Upselling und Auftragswert · Kennzeichnung wie in den übrigen Berichten: **[belegt]** (Quelle), **[Schätzung]** (mit Herleitung), **[prüfen]**, **[vom Unternehmen auszufüllen]**, **[anwaltlich prüfen]**.

> **Rechtliche Hinweise und Textbausteine in diesem Bericht (Abschnitte 8 und 9) sind Entwürfe – vor Verwendung durch eine Rechtsanwältin/einen Rechtsanwalt prüfen lassen.**

Bezug: Masterkonzept 23 (G8 „Teppiche und Add-ons 10–15 % auf G1/G4“, G10 Service, Margenprogramm „Komplettierungsliste in jedem Angebot“), 10 (Pflege-Pass, Teppich-Musterkonzept), 26 (Binni-Küchenlinie), digital/07 (Hybrid-Warenkorb, Backoffice-Felder), digital/11 (CRM), digital/14 (Recht).

---

## 0. Kurzfassung

1. **Der Hebel ist der Rohertrag, nicht nur der Umsatz.** Zubehör, Pflege und Service haben 40–48 % Rohertrag (10) statt 31–35 % im Möbelgeschäft (23). Ein sauber geführtes Komplettierungssystem bringt [Schätzung] **+10–15 % Auftragswert bei Wohnen, +8–12 % bei Küchen, +15–25 % bei Outdoor**. Bei den Werten aus dem Masterkonzept (M12 realistisch) sind das **≈ 20–30 T€ Umsatz und ≈ 8–12 T€ Rohertrag pro Monat**. Herleitung in Abschnitt 7.
2. **Im Showroom wird verdient, online wird vorbereitet.** Bei Tickets von 15–60 T€ entsteht das Upselling im Angebot und im Gespräch. Die Website liefert dafür „Komplettieren Sie den Raum“-Module, Merklisten mit Ergänzungen und Pakete mit Preis, wo Preise erlaubt sind (Binni-Linie, Outlet, Accessoires).
3. **Die Empfehlungslogik braucht keine KI und keine personenbezogenen Daten.** Eine Regeltabelle im Backoffice (Kategorie → ergänzende Kategorie) und ein Feld „passt zu“ je Produkt reichen. Das läuft ohne Cookie-Einwilligung, weil nur Katalogdaten verwendet werden.
4. **Jedes Angebot hat drei Teile:** Hauptposition, Optionsblock Gut–Besser–Best und eine Komplettierungsliste. Jede Option einzeln abwählbar, nichts vorausgewählt (§ 6c KSchG, § 312a Abs. 3 BGB).
5. **Service-Upsells sind die margenstärkste und am wenigsten kopierbare Ebene:** Montage, Pflege-Pass, Stoffschutz, Neubezug, Outdoor-Einlagerung. Keine Versicherungsprodukte ohne Prüfung der Gewerbeberechtigung.

---

## 1. Ausgangslage

| Thema | Stand | Quelle |
|---|---|---|
| Ergänzungen auf der Produktseite | Es gibt einen Block „Ähnliche Produkte – Weitere Produkte aus der gleichen Kategorie“ bzw. „Das könnte Ihnen auch gefallen“. Er ruft `related_products` mit **gleicher Marke und gleicher Kategorie** auf, limit 3 | `src/lib/api/fetchAllProdukte.js` (`fetchRelatedProdukteNew`), `src/app/[locale]/produkte/[category]/[product]/page.js` Z. 206, `src/messages/de.json` „related“ [Code] |
| Folge | Zum Sofa werden **andere Sofas** gezeigt. Das sind Alternativen (Substitute), keine Ergänzungen. Ein Cross-Selling findet online nicht statt | [Code] |
| Datenbasis im Backoffice | Produkte New mit `marken`, `kategories`, `sub_kategorie`, `farbe`, `material`, `designer`, `indoor_and_outdoor`, Kollektionen je Marke (`get_collections`) | `src/lib/shop/shopProducts.js`, `src/lib/api/fetchCollections.js` [Code] |
| Preise | Online keine Preise, „Warenkorb“ ist eine Merkliste mit Anfrage | digital/07 |
| Margenprogramm | Komplettierungsliste in jedem Angebot ist Pflicht | 23, 5.3 |
| Echte Zahlen | Ø Auftrag, Positionen je Auftrag, Anteil Zubehör und Service: **liegen nicht vor** | 00, Gate 0 [vom Unternehmen auszufüllen] |

**Folgerung:** Zuerst messen, dann steuern. Ohne Ausgangswert (Positionen je Auftrag, Anteil Ergänzungen am Auftrag) lässt sich der Effekt nicht nachweisen.

---

## 2. Grundsätze (fair statt manipulativ)

1. **Ergänzen, was der Raum wirklich braucht.** Ein Teppich unter dem Sofa, Licht für den Lesesessel, Schutzhülle für den Outdoor-Loungesessel. Nicht: ein zweites Sofa.
2. **Alles einzeln, alles abwählbar, nichts vorausgewählt.** Gesetzlich verlangt (Abschnitt 8) und für das Vertrauen im Premium-Segment entscheidend.
3. **Echte Preise, echte Knappheit.** Kein „nur heute“, kein erfundener Lagerstand, Streichpreise nur mit 30-Tage-Regel (digital/14, F4).
4. **Gut–Besser–Best mit drei echten Optionen.** Keine „Köder-Option“, die nur dazu da ist, schlechter auszusehen. Jede Stufe muss für einen bestimmten Kunden die richtige sein.
5. **Bei Nein ist Schluss.** Abgelehnte Optionen kommen nicht in jeder Mail wieder. Eine einzige freundliche Erinnerung zur passenden Zeit (z. B. Outdoor-Hüllen im Oktober) ist Service, alles darüber ist Druck.
6. **Beratung, die auch abrät.** Wer sagt „Für Ihre Kinder und den Hund ist der Stoff X besser als das Leinen“, verkauft auf Dauer mehr. Die Forschung zu unprofitablem Cross-Buying zeigt, dass Zusatzkäufe, die der Kunde nicht braucht, später als Retouren, Reklamationen und Serviceaufwand zurückkommen: 10–35 % der Cross-Buyer waren in den untersuchten Firmen unprofitabel und verursachten 39–88 % der Verluste [belegt: Shah/Kumar u. a., Journal of Marketing 2012, S6].

---

## 3. Komplettierungs-Matrix (online und Showroom)

Rollen: **E** = Ergänzung (Cross-Sell), **U** = Aufwertung (Upsell), **S** = Service. Preisrahmen sind Brutto-Größenordnungen im Premium-Segment [Schätzung, aus Erfahrungswerten der Branche; mit den echten Preislisten ersetzen].

### 3.1 Wohnen: Sofa als Leitprodukt

| Ergänzung | Rolle | Typische Marken im Sortiment | Preisrahmen [Schätzung] | Argument im Gespräch |
|---|---|---|---|---|
| Teppich (Größe nach Sofa: mind. vordere Füße auf dem Teppich) | E | Jan Kath (wenn Vertrag), Paola Lenti, Minotti-Teppiche | 2–8 T€ | „Der Teppich hält die Sitzgruppe zusammen und dämpft den Raum.“ |
| Couch- und Beistelltisch aus derselben Kollektion | E | Minotti, Poliform, ClassiCon | 1–5 T€ | Kollektion passt in Höhe, Material, Linie |
| Stehleuchte / Leseleuchte | E | Flos | 0,6–3 T€ | Lesesitz braucht Licht von hinten-seitlich |
| Kissen, Plaids | E | Minotti-Textilien, Paola Lenti | 0,2–1,2 T€ | Farbe aus Teppich oder Bild aufnehmen |
| Sessel oder Hocker passend | E | Minotti, Treca, ClassiCon | 2–8 T€ | Zweiter Sitzplatz zum Gespräch |
| Stoff-/Lederaufwertung (Kategorie B → C, Leder statt Stoff) | U | Hersteller | +10–30 % auf das Sofa | Haltbarkeit, Haptik, Pflege |
| Stoffschutz (Imprägnierung) bzw. pflegeleichter Performance-Stoff | U/S | Hersteller-Stoffe, Imprägnierung durch Partner | 150–500 € | Kinder, Haustiere, heller Stoff |
| Pflegeset Leder/Stoff | S | Colourlock, Originalpflege der Marke (10) | 50–150 € | wird bei Übergabe erklärt |
| Lieferung und Montage, Altmöbel-Mitnahme | S | eigenes Team / Partner | Position nach Aufwand | als eigene Position (23) |
| Neubezug-Service nach Jahren | S | Polsterei-Partner | nach Aufwand | lange Kundenbindung, Circle-Programm (23) |

### 3.2 Weitere Leitprodukte Wohnen

| Leitprodukt | Ergänzungen (E) | Aufwertungen (U) | Service (S) |
|---|---|---|---|
| Esstisch | Stühle (4–8), Hängeleuchte über dem Tisch (Flos), Teppich, Sideboard | Keramik- oder Marmorplatte, Ausziehfunktion | Pflegeset Holz/Stein, Montage |
| Bett (Poliform, Treca) | Matratze (Treca), Nachttische, Leseleuchten, Bettwäsche, Teppich | Matratzenstufe, Kopfteil gepolstert | Lieferung, Altbett-Mitnahme |
| Schrank/Ankleide (Poliform, Rimadesio) | Innenausstattung, Beleuchtung, Spiegel | Glasfronten, Innenbeleuchtung | Aufmaß, Montage |
| Bücherregal/Sideboard (Rimadesio) | Leuchten, Accessoires, Kunst | Sondermaße | Montage, Wandbefestigung |

### 3.3 Küche (Poliform/Varenna, next125/Schüller, Binni-Linie)

| Baustein | Rolle | Inhalt | Preisrahmen [Schätzung] |
|---|---|---|---|
| **Geräte-Stufen** | U | Gut: Bosch/Siemens; Besser: Miele; Best: Gaggenau oder Bora-Kochfeld mit Abzug | +3–12 T€ zwischen den Stufen |
| **Stein / Arbeitsplatte** | U | Quarz → Keramik/Sinterstein → Naturstein (Binni-Steinplatten, 26); Rückwand und Wangen in Stein | +2–8 T€ |
| **Beleuchtung** | E | Pendel über der Insel (Flos), Unterbau- und Sockellicht, Innenbeleuchtung | 1–4 T€ |
| **Barhocker** | E | 3–4 Stück zur Insel | 1,5–4 T€ |
| **Armaturen** | U | Kochend-Wasserhahn, Wasserfilter | 1–2,5 T€ |
| **Innenausstattung** | U | Schubladen-Einsätze, Abfalltrennung, Apothekerauszug | 0,5–2 T€ |
| **Ess-Ecke** | E | Esstisch und Stühle, Leuchte | 4–15 T€ |
| **Service** | S | Planung (anrechenbar, 23), Montage, Elektro über Partner, Steinpflege-Set, Erstpflege nach 12 Monaten | Positionen |

**Binni-Linie:** Hier dürfen Preise online stehen (26). Deshalb ist sie der Ort für ein **Online-Paketsystem mit Preis**: Grundküche + Stein-Stufe + Geräte-Stufe + Beleuchtungspaket, jede Stufe mit Aufpreis in EUR und CHF.

### 3.4 Outdoor (Paola Lenti, Gloster, Tuuci, Umbrosa, Heatsail u. a.)

| Ergänzung | Rolle | Preisrahmen [Schätzung] | Saison |
|---|---|---|---|
| Sonnenschirm mit Sockel | E | 2–8 T€ | März–Juni |
| Heizung/Licht von Heatsail (Infrarot-Heizung mit Licht, z. B. DISC, BEEM, LEAF, TWIG) [belegt: Produktlinien laut Salone del Mobile, S9] | E/U | 3–10 T€ | Herbst-Verlängerung, Hotel-Terrassen |
| Schutzhüllen (Möbel, Schirm) | S | 150–800 € | bei Kauf, nochmals Oktober |
| Kissen-/Polster-Set Ersatz | E | 0,3–2 T€ | Frühjahr |
| Outdoor-Teppich, Leuchten mit Akku | E | 0,3–3 T€ | Frühjahr |
| Wintereinlagerung mit Abholung/Rückbringung (23) | S | 300–1.200 € pro Saison | Oktober–April |
| Frühjahrs-Pflegeservice (Teak, Textil) | S | 150–600 € | März/April |

Bei Heizstrahlern vor dem Verkauf mit dem Elektro-Partner klären: Anschlussleistung, Montage durch befugte Elektrofachkraft, Schutzart für Außenbereich [prüfen].

### 3.5 Komplett- und Ferienimmobilien, Bauträger (G4, G5)

Hier ist das Bundle das Produkt: **„Bezugsfertig“-Pakete** je Raum (Wohnen, Essen, Schlafen, Terrasse), dazu Textilien, Geschirr, Leuchtmittel, Second-Home-Service (23). Angebotsstruktur wie in Abschnitt 5, aber je Raum.

---

## 4. Empfehlungslogik im Katalog (Backoffice)

### 4.1 Zwei getrennte Module statt einem

| Modul | Zweck | Logik | Text (Vorschlag) |
|---|---|---|---|
| **Alternativen** (bestehend) | Kunde vergleicht | gleiche Kategorie, gleiche oder andere Marke | „Ähnliche Modelle“ |
| **Ergänzungen** (neu) | Kunde stellt den Raum zusammen | Regeltabelle + Kollektion + „passt zu“ | „Komplettieren Sie den Raum“ |

### 4.2 Datenmodell (für den Frappe-Entwickler)

**Neuer Doctype „Ergänzungsregel“**

| Feld | Typ | Beispiel |
|---|---|---|
| `quell_kategorie` | Link Produkte Kategorie | sofas |
| `ziel_kategorie` | Link Produkte Kategorie | coffee tables |
| `rolle` | Select: Ergänzung / Aufwertung / Service | Ergänzung |
| `prioritaet` | Int 1–9 | 1 |
| `gleiche_kollektion_bevorzugen` | Check | ja |
| `indoor_outdoor` | Select: indoor / outdoor / beide | indoor |
| `saison_von`, `saison_bis` | Monat | – |
| `begruendung_de` (+ `_en`, `_fr`, `_it`) | Data | „Couchtisch in der Höhe der Sitzfläche“ |
| `aktiv` | Check | ja |

**Neue Felder an Produkte New**

| Feld | Typ | Zweck |
|---|---|---|
| `passt_zu` | Table MultiSelect → Produkte New | handkuratierte Paare (Vorrang vor allen Regeln) |
| `kollektion` | Link (falls noch nicht als Feld vorhanden) | Familien-Zuordnung [prüfen: wie `get_collections` die Kollektion heute ableitet] |
| `ergaenzung_ausschliessen` | Check | z. B. Ausstellungsstück ohne Nachkauf |
| `service_artikel` | Table MultiSelect → Service-Artikel | Pflegeset, Stoffschutz, Hüllen, Einlagerung |

**Neuer Doctype „Service-Artikel“:** Name, Beschreibung (4 Sprachen), Preis oder „nach Aufwand“, Kategorien, für die er gilt, Bild.

### 4.3 Auswahlreihenfolge (Server, ohne Personendaten)

1. Handkuratierte `passt_zu`-Produkte (max. 2).
2. Gleiche **Kollektion**, andere Kategorie (z. B. Minotti-Sofa → Couchtisch derselben Familie).
3. Gleiche **Marke**, Zielkategorie aus der Regeltabelle (nach `prioritaet`).
4. Andere Marke, Zielkategorie aus der Regeltabelle, gefiltert nach **Farbe/Material**-Überschneidung (`colorKeys`, `materialKeys`) und `indoor_and_outdoor`.
5. Ein passender **Service-Artikel** als letzte Karte (Pflege, Stoffschutz, Hüllen).

**Filter immer:** `status = Aktiv`, Bild vorhanden, `bildrechte` geklärt (digital/07), nicht `ergaenzung_ausschliessen`. **Höchstens 4–6 Karten**, je Zielkategorie nur eine, damit es eine Raum-Komposition bleibt und keine Liste.

### 4.4 Start-Regeltabelle (erste 20 Regeln)

| Quelle | Ziel (Priorität) |
|---|---|
| sofas | coffee tables (1), rugs (2), floor lamps (3), side tables (4), armchairs (5), Service Pflege (9) |
| armchairs / lounge chairs | floor lamps (1), side tables (2), stools (3) |
| dining tables | dining chairs (1), hanging lamps (2), rugs (3), bookcases and sideboards (4) |
| beds | night tables (1), wall lamps (2), bedwear (3), rugs (4) |
| barstools ← Küchen-Landingpages | hanging lamps (1), barstools (2) |
| Outdoor sofas/lounge (`indoor_and_outdoor = outdoor`) | Schirme (1), Heizung/Licht (2), Outdoor-Teppich (3), Service Hüllen (8), Service Einlagerung (9) |

Die Kategorie-Schlüssel stehen in `src/lib/seo/productCategories.js`. Teppiche, Schirme und Outdoor-Heizung als eigene Kategorien im Backoffice prüfen und ggf. anlegen [vom Unternehmen auszufüllen].

### 4.5 Darstellung auf der Website (Entwurf für das Digital-Team)

- **Produktseite:** Unter der Hauptinfo eine kleine Raumszene „Komplettieren Sie den Raum“ mit 4–6 Karten. Jede Karte: Bild, Marke, Name, kurze Begründung aus der Regel, Button „Zur Merkliste“. Kein Pop-up, kein Zwang.
- **Merkliste/Hybrid-Warenkorb:** Unter der Liste „Für Ihren Raum fehlt noch …“ (eine Zeile pro fehlender Zielkategorie, z. B. „Kein Teppich in Ihrer Auswahl“). Die Anfrage geht mit allen Positionen an den Verkauf.
- **Checkout (Sofort-Kauf, digital/07):** Ergänzungen **vor** dem Checkout im Warenkorb, nicht als Schritt, den man wegklicken muss. Baymard bewertet eingeschobene Cross-Sells, die eine aktive Ablehnung verlangen, als von Nutzern „oft als sehr aggressiv“ empfunden [belegt, S5].
- **Wohnszenen per QR im Showroom (23, Sofortmaßnahme 10):** Jede Szene als „Look“ mit allen Positionen. Kunde scannt und hat die ganze Szene in der Merkliste.
- **Messung:** `view_item_list` (list_name „komplettieren“), `select_item`, `add_to_wishlist` mit `item_list_name` in `src/lib/analytics.js` (hinter Consent Mode, digital/07 F8). Die Empfehlung selbst braucht keine Einwilligung, nur die Messung.

---

## 5. Angebotsvorlage mit Optionen (Gut–Besser–Best)

### 5.1 Aufbau jedes Angebots

```
A  Hauptposition(en)            – das, was der Kunde angefragt hat
B  Optionen Gut | Besser | Best – nur dort, wo es echte Stufen gibt
C  „Komplettieren Sie den Raum“ – Ergänzungen, je einzeln mit Preis
D  Service                      – Lieferung, Montage, Pflege, Stoffschutz, Einlagerung
E  Summe nur A + D (Pflichtteile); B und C als „Option, auf Wunsch“
```

Wichtig: **Optionen werden nicht in die Summe eingerechnet**, sondern stehen als Zusatz mit eigenem Preis daneben. Der Kunde kreuzt an, was er will. Das ist die faire und rechtlich saubere Form (Abschnitt 8).

### 5.2 Beispiel Küche [Schätzung, Zahlen sind Platzhalter]

| | **Gut** | **Besser** | **Best** |
|---|---|---|---|
| Arbeitsplatte | Quarz 20 mm | Keramik 12 mm, Rückwand Keramik | Naturstein (Binni), Rückwand und Wange Stein |
| Geräte | Bosch/Siemens Serie mit Induktion | Miele mit Dampfgarer | Gaggenau oder Bora-Kochfeld, Weinklima |
| Licht | Unterbau-LED | + Pendel über der Insel | + Sockel- und Innenlicht, Szenensteuerung |
| Preis Küche | [vom Unternehmen auszufüllen] | + [ ] € | + [ ] € |
| Für wen | Ferienwohnung, Vermietung | Familie, viel Kochen | Villa, Gastgeber |

Die Forschung zeigt, dass eine mittlere Option in einer Dreier-Auswahl häufiger gewählt wird (Kompromiss-Effekt) [belegt: Simonson 1989, S7]. Fair genutzt heißt das: Die mittlere Stufe ist die, die der Planer für die meisten Kunden **wirklich** empfiehlt. Eine Option nur einzubauen, damit eine andere besser aussieht (Huber/Payne/Puto 1982, S8), ist hier ausgeschlossen.

### 5.3 Beispiel Wohnzimmer (Text für das Angebot, Entwurf)

> **Komplettieren Sie den Raum (Optionen, auf Wunsch)**
> Damit Ihr neues Sofa im Raum so wirkt wie in unserer Ausstellung, empfehlen wir folgende Ergänzungen. Jede Position ist einzeln wählbar und nicht im Gesamtpreis enthalten.
> ☐ Teppich [Modell], [Maß] – [Preis] €
> ☐ Couchtisch [Modell] aus derselben Kollektion – [Preis] €
> ☐ Stehleuchte [Modell] – [Preis] €
> ☐ Stoffschutz für Bezug [Stoff] – [Preis] €
> ☐ Pflegeset Stoff/Leder – [Preis] €
> Gerne stellen wir Ihnen die Kombination zur Ansicht in Lochau zusammen oder leihen Ihnen den Teppich zur Probe [prüfen: Leihgabe-Regeln].

### 5.4 Pakete und Bundles

| Paket | Inhalt | Preisregel |
|---|---|---|
| **Lesesitz** | Sessel + Hocker + Leseleuchte + Beistelltisch | Summe der Einzelpreise, Paketvorteil nur als echte Ersparnis (z. B. Lieferung inklusive) |
| **Inselküche komplett** (Binni) | Küche + Stein-Stufe + 3 Barhocker + Pendelleuchten | fester Paketpreis in EUR und CHF, online |
| **Terrasse bereit** | Lounge + Schirm + Hüllen + 1. Einlagerung | Frühbucher 2027 (23, Sofortmaßnahme 7) |
| **Neues Zuhause** (Makler/Bauträger) | Pflegeset, Kerze, Gläser, Beratungsgutschein (10) | 190–290 € (10) |
| **Second-Home bezugsfertig** | Raum-Pakete + Textilien + Service | Projektpreis |

**Regel für Pakete:** Jeder Bestandteil bleibt einzeln kaufbar. Ein Paketvorteil wird als konkreter Betrag genannt, nicht als „statt“-Preis ohne Grundlage (Abschnitt 8).

---

## 6. Showroom-Prozess und Schulung

### 6.1 Ablauf im Gespräch (5 Schritte)

1. **Raum statt Produkt erfragen:** Grundriss, Fotos vom Raum, wer lebt dort (Kinder, Tiere), Licht, Boden. Ohne diese Fragen ist jede Ergänzung geraten.
2. **Leitprodukt finden.** Erst wenn das Hauptstück steht, über Ergänzungen sprechen.
3. **Raum zeigen:** Teppich, Leuchte, Tisch im Showroom dazustellen bzw. in der Visualisierung (KI-Raumplaner, digital/06). Zeigen wirkt mehr als erzählen.
4. **Optionen im Angebot**, nie mündlich „dazugeschrieben“. Jede Option mit Begründung.
5. **Nachfassen** nach 3 Tagen per Anruf (digital/11), mit einer Frage zur offenen Option, nicht mit einer Rabattaktion.

### 6.2 Schulung (4 Module à 90 Minuten, intern)

| Modul | Inhalt | Übung |
|---|---|---|
| 1 Raumdenken | Proportionen (Teppichgröße zu Sofa, Leuchtenhöhe über Tisch), Material- und Farbabstimmung, Kollektionen der Marken | Je Leitprodukt drei Ergänzungen mit Begründung |
| 2 Angebot mit Optionen | Vorlage 5.1, Gut–Besser–Best, Preisdisziplin (Rabatt nur durch GF, 23) | Ein echtes Angebot umbauen |
| 3 Fair verkaufen | Was ist erlaubt, was nicht (Abschnitt 8); Abraten als Stärke; Umgang mit „Nein“ | Rollenspiel: Kunde lehnt ab |
| 4 Service verkaufen | Pflege-Pass, Stoffschutz, Einlagerung, Neubezug; was im Service enthalten ist und was nicht | Übergabegespräch mit Pflegeset |

**Hilfsmittel:** Laminierte Komplettierungskarte je Leitkategorie (Abschnitt 3) am Beratungstisch; Muster-Box Teppich und Stoffe; Liste „Kollektionen je Marke“ aus dem Backoffice.

### 6.3 Ziele und Anreize

- **Kennzahlen je Verkäufer:** Positionen je Auftrag, Ergänzungsquote (Aufträge mit mind. einer Ergänzung), Rohertrag je Auftrag, **Reklamations- und Stornoquote** bei Ergänzungen.
- **Prämie auf Rohertrag, nicht auf Umsatz**, und nur, wenn die Storno-/Reklamationsquote nicht steigt. So lohnt sich Drücken nicht.

---

## 7. Erwarteter Effekt auf den Auftragswert

### 7.1 Benchmarks (vorsichtig lesen)

| Quelle | Aussage | Einordnung |
|---|---|---|
| McKinsey (Personalisierung) | Umsatzplus meist 10–15 %, je Firma 5–25 % [belegt über Sekundärquellen, Original nicht abrufbar, S1] | Gesamtumsatz, große Firmen, nicht nur Cross-Selling |
| Salesforce, 150 Mio. Sitzungen 2017 | Sitzungen mit Klick auf Empfehlung: Ø Bestellwert +10,3 %, Empfehlungen 26 % des Umsatzes bei 7 % Klickenden [belegt über Practical Ecommerce, S2] | Korrelation, keine Ursache; Online-Shops mit kleinen Warenkörben |
| Icebreaker (Salesforce-Fallstudie) | A/B-Test Empfehlungen: Ø Bestellwert +11 % [S3] | Herstellerangabe des Softwareanbieters |
| Arhaus (Premium-Möbel, USA) | Aufträge mit Interior-Designer ca. 4-mal so hoch wie ohne [belegt: Q3-2025-Call laut Sekundärquelle, S4] | Zeigt den Hebel der Beratung, nicht des Algorithmus |
| Möbel-Schutzpläne (USA/UK) | Attach-Raten 15–40 % laut Anbieter-Fallstudien; Branchenschnitt Schutzpläne 2–3 % vom Umsatz, 5 % gilt als gut [S10] | Anbieterangaben bzw. ältere Fachpresse |
| Masterkonzept 23 | G8 Teppiche und Add-ons 10–15 % auf G1/G4 | eigene Annahme der Berichtsreihe |

### 7.2 Eigene Rechnung [Schätzung]

Formel: **Zusatz je Auftrag = Σ (Annahmequote × Ø Preis der Ergänzung)**. Quoten sind Zielwerte nach 6–12 Monaten mit Schulung.

**Wohnen (Ø Auftrag 15 T€, 23):**

| Ergänzung | Quote | Ø Preis | Beitrag |
|---|---|---|---|
| Teppich | 20 % | 4.000 € | 800 € |
| Beistell-/Couchtisch | 30 % | 1.800 € | 540 € |
| Leuchte | 25 % | 1.500 € | 375 € |
| Kissen/Plaids | 35 % | 600 € | 210 € |
| Stoffschutz | 25 % | 250 € | 63 € |
| Pflegeset | 50 % | 100 € | 50 € |
| **Summe** | | | **≈ 2,0 T€ = +13 %** |

**Küche (Ø 55 T€):** Geräte-Stufe 40 % × 4,5 T€ + Stein-Stufe 30 % × 3,5 T€ + Licht 50 % × 2 T€ + Barhocker 40 % × 2,5 T€ + Armatur 30 % × 1,6 T€ ≈ **5,3 T€ = +10 %**.

**Outdoor (Ø 12 T€):** Schirm 35 % × 4 T€ + Heatsail 10 % × 6,5 T€ + Hüllen 50 % × 400 € + Einlagerung 25 % × 600 € ≈ **2,4 T€ = +20 %**.

**Hochrechnung auf das realistische Szenario M12 (23):** Wohnen 120 T€/Monat × 13 % ≈ 16 T€; Küchen 28 T€ × 10 % ≈ 3 T€; Outdoor 24 T€ × 20 % ≈ 5 T€ → **≈ 24 T€ Umsatz pro Monat**, bei ca. 35–45 % Rohertrag auf Ergänzungen und Service **≈ 8–11 T€ Rohertrag pro Monat** (≈ 100–130 T€ pro Jahr).

**Achtung Doppelzählung:** Das Masterkonzept führt G8 schon mit 8 T€ (M12) bis 25 T€ (M36). Dieses System ist **der Weg, G8 zu erreichen**, kein Zusatz obendrauf. Zusätzlich zu G8 kommen nur die Aufwertungen (Stufen in der Hauptposition) und Service-Positionen (G10).

**Ohne Ausgangswerte ist jede Prozentzahl eine Annahme.** Deshalb Messung ab Woche 1 (Abschnitt 10).

---

## 8. Rechtlicher Rahmen (Entwurf – vor Verwendung durch eine Rechtsanwältin/einen Rechtsanwalt prüfen lassen)

| Thema | Regel | Umsetzung |
|---|---|---|
| **Zusatzleistungen gegen Entgelt** | AT § 6c KSchG: Zusatzzahlungen nur mit **ausdrücklicher Zustimmung**; keine Zustimmung, wenn der Verbraucher eine Voreinstellung ablehnen müsste [belegt, S11]. DE § 312a Abs. 3 BGB: ausdrücklich, im elektronischen Geschäftsverkehr **keine Voreinstellung**; OLG München 07.11.2024 (29 U 1691/23), OLG Bamberg 04.02.2026 (3 UKl 4/25 e) [belegt über Sekundärquellen, S12]. Grundlage Art. 22 RL 2011/83/EU | Online: alle Ergänzungen, Stoffschutz, Montage-Optionen **nicht vorausgewählt**. Im Angebot: Optionen außerhalb der Summe, Ankreuzen durch den Kunden [anwaltlich prüfen: Montage als Pflichtposition bei Küchen ist keine „Zusatzleistung“, wenn sie nicht abwählbar ist, muss dann aber im Gesamtpreis stehen] |
| **Gesamtpreis** | AT § 9 PrAG, DE § 3 PAngV, CH PBV (digital/14 F4) | Paketpreise als Gesamtpreis inkl. USt; Liefer-/Montagekosten offen |
| **Paketvorteil / „statt“** | Preisermäßigung nur gegen niedrigsten Preis der letzten 30 Tage (AT § 9a PrAG, DE § 11 PAngV) (digital/14) | „Sie sparen 380 € gegenüber dem Einzelkauf“ nur, wenn alle Einzelpreise real und aktuell angeboten werden [anwaltlich prüfen: ob die 30-Tage-Regel auf Paketvorteile anzuwenden ist] |
| **Irreführung / Aggressivität** | AT UWG §§ 1a, 2 und Anhang (z. B. falsche „nur heute“-Knappheit, Z. 7); DE UWG §§ 4a, 5 und Anhang | Keine erfundene Knappheit, keine Countdown-Timer, keine Druckformulierungen. Empfehlungen sachlich begründen |
| **Nicht bestellte Leistungen** | UWG Anhang Z. 29 (AT und DE) | Nie Ergänzungen „mitliefern“ und berechnen |
| **Garantie-Werbung** | AT § 9b KSchG; seit 27.09.2026 zusätzlich Anforderungen aus RL (EU) 2024/825 (Information zu Haltbarkeit/gewerblichen Garantien) [prüfen: Umsetzung in AT und DE] | „Pflege-Pass“ und „Stoffschutz“ nicht als „Garantie“ bezeichnen, solange keine echten Garantiebedingungen bestehen; gesetzliche Gewährleistung bleibt unberührt und wird genannt |
| **Schutzbriefe/Versicherungen** | Versicherungsvermittlung braucht Gewerbeberechtigung (AT GewO, IDD-Ausnahme für „Nebentätigkeit“ nur in engen Grenzen) [anwaltlich prüfen] | Zunächst **nur Dienstleistungen** (Imprägnierung, Pflege, Reinigung) verkaufen, keine Schadenversicherung |
| **Abo (Pflege-Pass/Einlagerung)** | Klare Laufzeit, Kündigung, Preis; online Kündigungsbutton in DE (§ 312k BGB) [anwaltlich prüfen] | Erste Variante als **Einzelleistung je Saison**, kein Abo mit Verlängerung |
| **Datenschutz bei Empfehlungen** | Katalogbasierte Empfehlungen ohne Personendaten: keine Einwilligung nötig. Personalisierte Empfehlungen aus Surfverhalten: Cookie-Einwilligung (AT § 165 Abs. 3 TKG 2021) und DSGVO-Grundlage | Phase 1 bewusst **ohne Personalisierung** |
| **E-Mail-Nachkauf** (Hüllen im Oktober, Pflege nach 12 Monaten) | Bestandskunden-Ausnahme nur für eigene ähnliche Produkte, mit Widerspruchsmöglichkeit (AT § 174 Abs. 4 TKG 2021; DE § 7 Abs. 3 UWG) | Bei Übergabe auf Widerspruchsrecht hinweisen; Einwilligung im Kaufvertrag nicht vorausgewählt (digital/11) |
| **Schweiz** | CH UWG (Art. 3), PBV; Kunden mit Lieferung CH: Leistungen in CHF ausweisen (18) | Pakete in CHF, inkl. MWST und Verzollung, wenn so angeboten |

---

## 9. Textbaustein Service-Leistungen (Entwurf – vor Verwendung durch eine Rechtsanwältin/einen Rechtsanwalt prüfen lassen)

> **Pflege-Pass Platzhirsch** (Einzelleistung, kein Abonnement)
> Leistung: Pflegeset passend zu Ihrem Möbel bei Übergabe, Einweisung, Erinnerung nach 6 und 12 Monaten per E-Mail (nur wenn Sie zustimmen), Erstpflege vor Ort nach 12 Monaten [Umfang vom Unternehmen auszufüllen].
> Preis: [vom Unternehmen auszufüllen] € inkl. USt. Gebiet: [vom Unternehmen auszufüllen].
> Nicht enthalten: Reparatur von Schäden, Neubezug, Ersatzteile.
> Ihre gesetzlichen Gewährleistungsrechte bleiben unberührt. Der Pflege-Pass ist keine Garantie und keine Versicherung. [anwaltlich prüfen]

> **Outdoor-Einlagerung Saison [Jahr]**
> Abholung bis [Datum], trockene Lagerung in [Ort, vom Unternehmen auszufüllen], Reinigung auf Wunsch gegen Aufpreis, Rückbringung ab [Datum] nach Termin.
> Preis je Saison nach Volumen: [vom Unternehmen auszufüllen]. Haftung und Versicherung der eingelagerten Ware: [anwaltlich prüfen].

---

## 10. Umsetzung in Schritten

| # | Schritt | Wer | Wann | Aufwand [Schätzung] |
|---|---|---|---|---|
| 1 | Ausgangswerte ziehen: Ø Auftrag, Positionen je Auftrag, Anteil Ergänzungen/Service 2024–2026 | Inhaber/Buchhaltung | sofort | 1 Tag |
| 2 | Angebotsvorlage mit Teil B–D ins Backoffice / Angebotssoftware | Verkauf + Entwickler | bis KW 48 | 2–3 Tage |
| 3 | Komplettierungskarten (Abschnitt 3) drucken, Schulung Modul 1–2 | Verkauf | vor Adventsabend 26.11. | 2 × 90 Min. |
| 4 | Service-Artikel definieren: Preise Pflegeset, Stoffschutz, Hüllen, Einlagerung, Montage | Inhaber | bis Ende November | 1 Tag |
| 5 | Doctypes „Ergänzungsregel“, „Service-Artikel“, Feld `passt_zu` | Frappe-Entwickler | Q1 2027 | 3–5 Tage |
| 6 | Website-Modul „Komplettieren Sie den Raum“ + Merkliste-Hinweis + Messung | Digital-Team | nach 5 | 4–6 Tage |
| 7 | Binni-Pakete mit Preisstufen online | Digital-Team | sobald Preisliste (26) | im Konfigurator-Projekt |
| 8 | Outdoor-Frühbucher als Paket „Terrasse bereit“ | Verkauf | ab Januar 2027 | – |
| 9 | Auswertung nach 90 Tagen, Regeln anpassen | Inhaber + Verkauf | März 2027 | ½ Tag |

**Kennzahlen (monatlich):** Positionen je Auftrag; Ergänzungsquote je Leitkategorie; Ø Auftragswert; Rohertrag je Auftrag; Anteil Angebote mit Optionsblock (Ziel 100 %); Annahmequote je Option; Storno-/Reklamationsquote bei Ergänzungen; online: Klickrate „Komplettieren“ und Anteil Merklisten mit mehr als einer Kategorie.

---

## 11. Was der Inhaber entscheiden oder liefern muss

1. **Ausgangszahlen** (Schritt 1) [vom Unternehmen auszufüllen].
2. **Service-Preisliste:** Montage, Lieferung, Pflegeset, Stoffschutz, Hüllen, Einlagerung (Lagerfläche vorhanden? Versicherung?) [vom Unternehmen auszufüllen].
3. **Prämienmodell** auf Rohertrag mit Storno-Bremse: ja/nein.
4. **Lieferanten:** Pflegeprodukte (Colourlock oder Markenpflege), Imprägnier-Partner, Polsterei für Neubezug, Elektro-Partner für Heatsail, Heatsail-Konditionen [prüfen: Bezugsweg].
5. **Freigabe Backoffice-Erweiterung** (Doctypes, Entwickleraufwand 3–5 Tage).
6. **Rechtstermin** zu Abschnitt 8/9 zusammen mit dem Termin für Shop und AGB (digital/14).

---

## Quellen

- [S1] McKinsey, „The value of getting personalization right—or wrong—is multiplying“ (2021): https://www.mckinsey.com/capabilities/growth-marketing-and-sales/our-insights/the-value-of-getting-personalization-right-or-wrong-is-multiplying (Original beim Abruf am 26.10.2026 nicht erreichbar, Zahlen über Sekundärquellen, z. B. https://www.contentful.com/blog/personalization-strategy-revenue-goals/)
- [S2] Practical Ecommerce zur Salesforce-Studie (150 Mio. Sitzungen, 2017): https://www.practicalecommerce.com/study-personalized-recommendations-produce-4-times-conversions
- [S3] Icebreaker / Salesforce Commerce Cloud: https://www.casestudies.com/company/salesforce-commerce-cloud/case-study/icebreaker-uses-machine-learning-to-power-product-recommendations
- [S4] Arhaus Q3 2025 Earnings Call (Sekundär): https://www.insidermonkey.com/blog/arhaus-inc-nasdaqarhs-q3-2025-earnings-call-transcript-1642564/ ; https://www.nasdaq.com/articles/why-arhaus-seeing-big-opportunity-interior-design-demand
- [S5] Baymard Institute, Cross-Sell-Benchmark (Checkout): https://baymard.com/checkout-usability/benchmark/step-type/cross-sell/14783-best-buy
- [S6] Shah, Kumar u. a., „Unprofitable Cross-Buying“, Journal of Marketing 2012: https://journals.sagepub.com/doi/full/10.1509/jm.10.0445 ; HBR „The Dark Side of Cross-Selling“ (Dez. 2012)
- [S7] Simonson, „Choice Based on Reasons: The Case of Attraction and Compromise Effects“, JCR 16(2), 1989, doi:10.1086/209205: https://cognition.aau.at/bg/BA/Simonson%20%281989%29.pdf
- [S8] Huber, Payne, Puto, „Adding Asymmetrically Dominated Alternatives“, JCR 9(1), 1982, doi:10.1086/208899; Rückblick 2014: https://people.duke.edu/~jch8/bio/Papers/HuberPaynePutoJMR%202014.pdf
- [S9] Heatsail-Produkte bei Salone del Mobile: https://www.salonemilano.it/en/prodotti/heatsail/beem ; https://www.salonemilano.it/en/prodotti/heatsail/leaf ; https://www.salonemilano.it/en/prodotti/heatsail/twig
- [S10] Möbel-Schutzpläne: https://www.furnituretoday.com/business-news/fabric-protection-suppliers-eyeing-growth ; Anbieter-Fallstudien https://loxacover.com/case-study/rowen-homes-20-percent-attach-rate-shopify-embedded-furniture-protection ; Verbraucherkritik https://www.consumer.org.nz/articles/furniture-protection-plans-not-worth-the-cost
- [S11] § 6c KSchG „Zusätzliche Zahlungen“ (Wortlaut): https://www.forum-media.at/wohnrecht/Vorschriften/Konsumentenschutzgesetz/I.-HAUPTSTUeCK/Abschnitt-II/6c.-Zusaetzliche-Zahlungen ; amtlich: RIS https://www.ris.bka.gv.at (KSchG); Art. 22 RL 2011/83/EU: https://gesetze.legal/eu/rl_2011_83_eu/22
- [S12] § 312a Abs. 3 BGB: https://www.gesetze-im-internet.de/bgb/__312a.html ; OLG München 29 U 1691/23: https://www.gesetze-bayern.de/Content/Pdf/Y-300-Z-GRURRS-B-2024-N-49090?all=False ; OLG Bamberg 3 UKl 4/25 e: https://www.gesetze-bayern.de/Content/Pdf/Y-300-Z-BECKRS-B-2026-N-4408?all=False ; https://www.it-recht-kanzlei.de/voreingestellte-zusatleistungen-unzulaessig.html
- Interne Quellen: Berichte 10, 23, 26, digital/07, digital/11, digital/14; Code `src/lib/api/fetchAllProdukte.js`, `src/lib/shop/shopProducts.js`, `src/lib/api/fetchCollections.js`, `src/lib/seo/productCategories.js`, `src/messages/de.json`.
