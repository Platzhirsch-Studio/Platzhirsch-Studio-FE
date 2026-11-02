# 18 – Hardware und Showroom-Technologie

**Stand:** 26.10.2026 · Rolle: Hardware- und Showroom-Technologie-Experte (Expertenrat)
**Grundlage:** Berichte 00, 23, 26, digital/00, 03, 05, 06, 14, marketing/qr-karte-bewertung, Prüfung des lokalen PCs per `nvidia-smi` und WMI, Website-Code (`src/context/CartContext.js`, Routen unter `src/app/[locale]/`), Web-Recherche Oktober 2026.

> **Hinweis zu Preisen:** Alle Preise sind **Richtwerte** (Straßenpreise brutto in Österreich, Stand Oktober 2026) und als **[Schätzung]** zu lesen, sofern keine Quelle angegeben ist. Vor dem Kauf zwei Angebote einholen. Abschnitte mit Rechtsbezug (Registrierkasse, Preisauszeichnung, WLAN, Musik) sind **keine Rechtsberatung**: Entwurf – vor Verwendung durch eine Rechtsanwältin/einen Rechtsanwalt bzw. die Steuerberatung prüfen lassen.

---

## 0. Kurzfassung

1. **Das Schild an jedem Ausstellungsstück ist die wichtigste Investition.** Ein Messing- oder Acrylschild mit QR-Code **und** NFC-Chip führt auf die Produktseite. Dort landet das Stück mit einem Tipp in der Merkliste auf dem eigenen Handy (die Merkliste speichert schon heute lokal im Browser, `CartContext.js`). Das Schild löst zugleich ein Rechtsproblem: Nach **§ 4 Abs 1 PrAG** sind sichtbar ausgestellte Sachgüter gegenüber Verbrauchern mit dem Preis auszuzeichnen. Kosten für 200 Stücke: ca. 3–6 T€.
2. **Kasse und Terminal hängen an der Ausgliederung.** Die neue Handels-GmbH braucht ihre **eigene RKSV-Registrierkasse** mit eigener Signatur und FinanzOnline-Meldung. Café und Handel brauchen getrennte Kassen, wenn sie in verschiedenen GmbHs laufen. Empfohlen wird ein Cloud-Kassensystem mit integriertem Terminal. **TWINT** läuft für ein österreichisches Unternehmen über einen Zahlungsdienstleister (laut TWINT-FAQ u. a. Stripe, Mollie, Adyen), am einfachsten als QR-Bezahllink auf dem Tablet.
3. **Das WLAN zuerst.** Video-Beratung, Tablets, Terminal und Signage hängen daran. Nötig sind getrennte Netze (Kunden, Team, Kasse, Geräte), 4–6 Access Points nach einer Ausleuchtung und ein 5G-Backup für die Kasse. Kosten: ca. 1,5–3,5 T€.
4. **Video-Beratung kostet ca. 900–1.400 € Hardware**, wenn ein Firmen-iPhone vorhanden ist (Gimbal, Funkmikro, 2 LED-Leuchten, Webcam und Konferenzlautsprecher für den Beratertisch). Die Qualität hängt mehr am Upload und an der Übung als am Gerät.
5. **Der lokale PC bleibt Werkstatt und wird kein Server.** Geprüft: Intel i7-7800X (2017, 6 Kerne), 128 GB RAM, RTX 4060 mit 8 GB, **nur eine** 1-TB-NVMe und **kein Backup** erkennbar. Zuerst Backup, USV und eine zweite SSD (ca. 800 €). Über ein GPU-Upgrade (RTX 5090) wird erst entschieden, wenn der KI-Raumplaner mindestens 5 Aufträge pro Woche hat (06).

**Gesamtbudget Stufe 1 (bis Weihnachten 2026):** ca. 9–15 T€. **Stufe 2 (Q1–Q2 2027):** weitere ca. 8–14 T€. Herleitung in Abschnitt 13.

---

## 1. Bestandsaufnahme (geprüft am 26.10.2026)

| Komponente | Befund | Bewertung |
|---|---|---|
| CPU | Intel Core i7-7800X, 6 Kerne, 3,5 GHz (Skylake-X, Plattform X299, 2017) | Der Engpass bei CPU-Arbeit (Szenen vorbereiten, Fotogrammetrie, KI-Modelle im RAM). Diese CPU steht **nicht** auf Microsofts Liste der unterstützten Prozessoren für Windows 11. Das Risiko bei künftigen Feature-Updates ist [Schätzung] mittel |
| RAM | 128 GB | Sehr gut. Fängt das Auslagern von Modellen ab (06) |
| GPU | NVIDIA GeForce RTX 4060, 8.188 MiB VRAM, Treiber 610.88 | Gut für Blender/OptiX, Video-Encoding (NVENC inkl. AV1), Freistellen, Upscaling und kleine Sprachmodelle. Für große Bildbearbeitungsmodelle reicht der Speicher knapp |
| Datenträger | 1 × Samsung MZVLB1T0 (PM981, NVMe, 954 GB) | **Es gibt nur einen Datenträger.** Fällt er aus, sind Renderings, Fotos und Modelle weg. Höchste Priorität |
| PCIe | X299 liefert PCIe 3.0. Die RTX 4060 nutzt nur 8 Lanes | Mit PCIe 3.0 ×8 verliert die Karte bei Rendering und KI wenig, beim Laden von Modellen spürbar [Schätzung] |
| Netzteil, Gehäuse, Backup, USV | nicht prüfbar | [vom Unternehmen auszufüllen]: Netzteil (Watt), freie M.2/SATA-Plätze, vorhandenes NAS oder Backup |
| Kassensystem Café | nicht bekannt | [vom Unternehmen auszufüllen]: Hersteller, Vertragslaufzeit, auf welche GmbH registriert |
| Zahlungsterminal | nicht bekannt | [vom Unternehmen auszufüllen]: Anbieter, Gebühren, Vertragsende |
| Internetanschluss | nicht bekannt | [vom Unternehmen auszufüllen]: Anbieter, Download/Upload in Mbit/s, Glasfaser ja/nein, feste IP |
| Fläche | nicht bekannt | [vom Unternehmen auszufüllen]: m² Showroom, Café, Büro, Lager, Außenbereich, Grundriss als PDF |

---

## 2. Schild an jedem Ausstellungsstück: QR + NFC („Scan & Merken“)

### 2.1 Ablauf für den Kunden

1. Der Kunde hält das Handy an das Schild (NFC) oder scannt den QR-Code mit der Kamera. Er braucht keine App. iPhones ab XS lesen NFC-URL-Tags im Hintergrund, die meisten Android-Geräte mit eingeschaltetem NFC ebenso.
2. Es öffnet sich `platzhirsch.studio/s/{Inventarnummer}`. Diese Kurz-URL leitet auf die Produktseite in der Sprache des Handys weiter. Die Route gibt es noch nicht, sie gehört als Arbeitspaket in den Digital-Masterplan. Der Vorteil: Ändert sich die Produktseite, wird nur die Weiterleitung geändert, nicht das Schild.
3. Oben auf der Seite steht der Block **„Dieses Stück im Showroom“**: Konfiguration (Bezug, Maße, Material), **Preis des ausgestellten Stücks**, Knopf **„Auf meine Merkliste“** und gegebenenfalls „Als Ausstellungsstück kaufen (Atelierverkauf)“.
4. Beim Gehen nimmt der Kunde die Merkliste mit dem Knopf „Merkliste an mich senden“ oder „Merkliste an Berater übergeben“ mit. Das läuft über das bestehende Anfrageformular mit Einwilligung und ohne Pflicht zur Registrierung.

**Wichtig:** Die Merkliste liegt heute im `localStorage` des Kunden-Browsers (`src/context/CartContext.js`). Sie gehört damit dem Kunden und funktioniert ohne Konto und ohne Cookie-Banner. So soll es bleiben. Ein Konto kommt höchstens später als Option dazu.

### 2.2 Preisauszeichnung: ein Pflichtthema, das kaum jemand beachtet

- **§ 4 Abs 1 Preisauszeichnungsgesetz (PrAG):** Die Preise sichtbar ausgestellter Sachgüter sind so auszuzeichnen, dass ein durchschnittlich aufmerksamer Betrachter sie leicht lesen und zuordnen kann. Die Pflicht besteht gegenüber Verbrauchern. Fassung BGBl. I Nr. 102/2025, in Kraft seit 30.12.2025 ([§ 4 PrAG](https://gesetzefinden.at/bundesrecht/bundesgesetze/prag/para-4), [RIS](https://www.ris.bka.gv.at/Dokumente/Bundesnormen/NOR40273255/NOR40273255.pdf)).
- Möbel sind bewegliche körperliche Sachen, also Sachgüter. Dass die Pflicht für Möbel in einer Ausstellung gilt, ist eine Schlussfolgerung aus dem Gesetzestext. **[anwaltlich prüfen]**, insbesondere für Stücke, die nur als Muster einer konfigurierbaren Serie dienen.
- **Folge für das Schild:** Gedruckt wird der **Preis der gezeigten Ausführung** und darunter „Weitere Ausführungen und Maße: Preis auf Anfrage oder per Scan“. Das ist auch ein Wettbewerbsvorteil, denn laut 23 zeigt kein Premium-Händler im Umkreis Preise.
- Ändern sich die Preise oft, ist ein **E-Paper-Preisschild** die bessere Lösung (Abschnitt 2.4, Option C).

### 2.3 Technik des Schilds

| Element | Vorgabe |
|---|---|
| Format | 70 × 45 mm stehend oder liegend, Messing gebürstet oder Acryl satiniert (passt zum Premium-Umfeld). Bei Sofas als Tischaufsteller, bei Leuchten und Küchen als Klebeschild an einer unauffälligen Kante |
| QR-Code | mindestens 22 × 22 mm, Fehlerkorrektur M, 4 Module Ruhezone, dunkel auf hell (Kontrast mindestens 7:1). Auf Messing nicht gravieren, sondern einen bedruckten Einleger verwenden, weil spiegelnde Gravur schlecht scannt. Erzeugung mit `qrcode` 1.5.4 (MIT), dem Skript aus digital/00 AP6 |
| Inhalt URL | `https://platzhirsch.studio/s/PH-0123?src=qr` bzw. `?src=nfc`. Der Parameter wird serverseitig ohne Cookie gezählt, um zu messen, welche Stücke gescannt werden |
| NFC-Chip | NXP **NTAG215** oder **NTAG216** (504 bzw. 888 Byte), NDEF-URL-Datensatz, nach dem Beschreiben **schreibgeschützt (Lock)**, damit niemand die URL umschreibt. Auf Metall (Stahlgestelle Rimadesio, Outdoor-Aluminium) **On-Metal-Tags** mit Ferritschicht |
| Text | Marke · Modell · Designer · Ausführung · Maße · Preis · „Halten Sie Ihr Handy hierher oder scannen Sie den Code“. Darüber ein kleines NFC-Symbol |
| Verbot | Nicht schreiben: „autorisierter Händler“, „offizieller Partner“ oder Ähnliches (14 F1, 23). Kein Herstellerlogo ohne Freigabe |
| Inventarnummer | `PH-` + 4 Ziffern, auch als Feld im Backoffice (Ausstellungsstück ↔ Produkt-ID ↔ Standort im Showroom). [vom Unternehmen auszufüllen]: Wer pflegt die Liste? |

### 2.4 Optionen und Preise

| Option | Geräte/Material | Richtpreis je Stück [Schätzung] | 200 Stücke | Urteil |
|---|---|---|---|---|
| **A – Schild mit QR + NFC** (empfohlen) | Gravur- oder Druckschild + NTAG215-Sticker (0,30–1 €), On-Metal-Tag (1,50–3 €) | 12–25 € | **2,5–5 T€** | Bester Nutzen pro Euro. Lieferzeit bei einem regionalen Schildermacher 2–3 Wochen |
| B – Nur QR-Aufkleber | Digitaldruck auf Folie | 1–3 € | 0,2–0,6 T€ | Als Sofortlösung für die ersten 4 Wochen, danach durch A ersetzen |
| C – E-Paper-Preisschild | z. B. SoluM, Hanshow oder Pricer, 2,9–7,5 Zoll, mit Basisstation, Preis und QR per Funk änderbar | 25–80 € + Basisstation 300–800 € + Software 1–3 €/Schild/Jahr | 6–17 T€ | Erst sinnvoll, wenn der Atelierverkauf häufig neue Preise braucht. Wirkt technisch, passt nicht in jede Vignette |
| D – NFC-Schreibgerät | z. B. ACR122U (USB) oder ein Android-Handy mit der App NFC Tools | 40–60 € einmalig | – | Pflicht zu A |

**Pilot:** 50 Top-Stücke (Minotti-Vignetten, Café-Möbel, „Shop the Room“ aus 23 Abschnitt 9) in KW 46–47. Ab Januar Auswertung: Welche Stücke werden gescannt, wie viele Merklisten werden übergeben?

---

## 3. Große Displays und Digital Signage

**Grundsatz für den Luxusraum:** Bildschirme gibt es nur dort, wo sie arbeiten. Das heißt am Eingang/Café (Kollektionen, Events), am Küchen-Beratungsplatz (Planung groß zeigen) und eventuell im Schaufenster. **In den Minotti-, Poliform- und Paola-Lenti-Vignetten stehen keine Bildschirme.** Sie zerstören die Wohnwirkung.

| Platz | Empfehlung | Richtpreis [Schätzung] | Priorität |
|---|---|---|---|
| **Küchen-Beratungsplatz** | 85-Zoll-4K-Fernseher (Mini-LED, matt entspiegelt) an der Wand oder auf einem Rollständer. Zuspielung per HDMI vom Planungs-Laptop oder kabellos per Apple TV 4K (AirPlay vom iPad). Die Küche in fast 1:1-Größe zu zeigen, ist im Küchenverkauf der stärkste Hebel | Fernseher 1.500–2.500 €, Rollständer 300–500 €, Apple TV 4K ca. 170 € | **P1** |
| **Eingang/Café** | Bildschirm im Bilderrahmen-Look (z. B. Samsung The Frame 55–65 Zoll, matte Oberfläche): ruhige Loops mit Kollektionen, Event-Hinweis (Adventsabend), Binni-Steinmuster, Café-Karte. Ein Bild alle 8–12 s, **kein Ton** und keine schnellen Schnitte (Motion-Regeln aus Expertenrat 11) | 1.200–2.000 € | P2 |
| **Schaufenster Landstraße** | Hochhelles Signage-Display (2.500–3.000 cd/m², z. B. Samsung OM- oder OH-Serie, 55 Zoll), läuft per Zeitplan 7–22 Uhr | 3.000–5.500 € | P3: nur, wenn das Schaufenster nachweislich Fußgänger- oder Autofrequenz hat [vom Unternehmen auszufüllen] |
| **Player/Software** | Für 1–3 Bildschirme reicht der eingebaute Player (Samsung Tizen/MagicInfo Lite) oder ein Cloud-Dienst wie Yodeck/ScreenCloud (ca. 8–25 €/Bildschirm/Monat). Bei Fernsehern ohne Signage-Funktion: kleiner Player wie BrightSign HD225 | 0–25 €/Monat bzw. Player 300–450 € | mit P2 |

**Inhalte:** Eigene Fotos (Expertenrat 19) und freigegebenes Herstellermaterial (Freigabe E6 aus digital/00). Herstellervideos nur mit Freigabe. Kein Fernsehprogramm und kein Musikvideo, weil sonst AKM/LSG-Tarife für TV-Wiedergabe anfallen (Abschnitt 8).

**Betrieb:** Signage-Geräte hängen in einem eigenen Geräte-Netz (Abschnitt 7). Ein Zeitplan schaltet sie außerhalb der Öffnungszeiten ab (Strom, Lebensdauer). Profi-Signage ist für 16/7 oder 24/7 ausgelegt, Fernseher für ca. 8–10 h am Tag. Für Schaufenster und Dauerbetrieb deshalb Profi-Geräte.

---

## 4. Tablet-Beratung, Konfigurator und Aufmaß

| Gerät | Zweck | Richtpreis [Schätzung] | Priorität |
|---|---|---|---|
| **1 × iPad Pro 13 Zoll** (mit LiDAR) | Beratung, Konfiguratoren der Hersteller im Browser, AR-Ansicht (`model-viewer`, digital/03), Raumscan beim Kunden (z. B. Polycam, Magicplan, RoomPlan-Apps). LiDAR hat nur das iPad Pro | 1.400–1.800 € | P2 |
| **1–2 × iPad Air 13 Zoll** | Beratung im Showroom, Merkliste des Kunden auf den Berater übertragen, Bezahllink/TWINT-QR zeigen, Kassen-App des Cafés (falls nötig) | 900–1.100 € je Stück | P1 (1 Stück), P2 (2. Stück) |
| Hüllen | Leder- oder Filzhülle in Markenfarbe, mit Griff. Keine Gaming- oder Outdoor-Optik | 60–120 € | mit Gerät |
| **Gerätemanagement (MDM)** | Apple Business Manager (kostenlos) + MDM wie Mosyle oder Jamf Now (ca. 1–4 €/Gerät/Monat). Ermöglicht Fernlöschen, Kiosk-Modus, gemeinsame Apps und die Trennung von privaten Konten | 0–10 €/Monat | **Pflicht ab dem 1. Tablet** |
| **Laser-Entfernungsmesser** mit Bluetooth | Aufmaß beim Kunden (Küche, Second Home), Übertragung in die App. Z. B. Leica DISTO D2 oder X3 | 150–450 € | P1 für Küchen |
| Planungs-Laptop Küche | Je nach Küchenplanungsprogramm (next125/Schüller arbeiten mit gängigen Planungsprogrammen) [vom Unternehmen auszufüllen: welches Programm, welche Lizenz] | vorhanden? | – |

**Konfigurator:** Der eigene Website-Konfigurator ist in digital/04 beschrieben. Bis dahin werden auf dem iPad die öffentlichen Herstellerkonfiguratoren genutzt, sofern die Marke einen anbietet [prüfen je Marke]. Das Ergebnis wird als Screenshot oder PDF der Merkliste/Anfrage beigelegt. **Möbel-Planung in pCon** (pCon.planner, Basisversion kostenlos) ist für Marken mit OFML-Daten eine Option. Welche der geführten Marken OFML-Daten liefern, ist [vom Unternehmen mit den Herstellern zu klären].

**Regel:** Das Tablet ist ein Werkzeug des Beraters, kein Selbstbedienungs-Kiosk. Ein frei zugängliches Kiosk-Tablet im Premium-Showroom wirkt billig und wird schnell schmutzig oder leer.

---

## 5. Video-Beratung und Content-Produktion

Der Ablauf steht in digital/05 F4 (Cal.com erzeugt den Link, kein eigenes Video-SDK). Hier folgt die Hardware.

### 5.1 Set A – Live-Rundgang mit dem Handy (mobil durch den Showroom)

| Gerät | Beispiel | Richtpreis [Schätzung] |
|---|---|---|
| Firmen-Smartphone mit guter Kamera | iPhone 15 Pro oder neuer (auch für WhatsApp Business, digital/05 F3) | vorhanden? sonst 900–1.300 € |
| Gimbal | DJI Osmo Mobile 7P oder vergleichbar | 130–180 € |
| Funk-Ansteckmikrofon (2 Sender) | DJI Mic Mini, DJI Mic 2 oder Rode Wireless GO (Gen 3), Empfänger per USB-C/Lightning | 100–350 € |
| Kleines Aufsteck-LED-Licht | für dunkle Ecken, nicht zum Ausleuchten der Vignetten | 30–60 € |
| Powerbank 20.000 mAh mit USB-C PD | 45-minütige Rundgänge leeren den Akku | 40–60 € |

### 5.2 Set B – Beratertisch (Video-Call am Laptop, Planung teilen)

| Gerät | Beispiel | Richtpreis [Schätzung] |
|---|---|---|
| 4K-Webcam | Logitech MX Brio oder Insta360 Link 2 (Auto-Framing) | 150–220 € |
| Konferenzlautsprecher mit Echo-Unterdrückung | Jabra Speak2 75 oder Poly Sync 20 | 150–280 € |
| 2 × LED-Flächenleuchte, bi-color, mit Diffusor, auf Stativ oder Klemmarm | Aputure Amaran, Godox oder Elgato Key Light. Licht bei 4.000–4.500 K und warm, damit das Holz natürlich wirkt | 2 × 100–200 € |
| Hintergrund | **echte Vignette** (Regal, Leuchte, Stoffmuster) statt eines virtuellen Hintergrunds | 0 € |

**Set A + B ohne Handy: ca. 900–1.400 €.**

### 5.3 Set C – Rundgang-Film und 360°-Rundgang (für Website und Social Media)

| Option | Richtpreis [Schätzung] | Urteil |
|---|---|---|
| 360°-Kamera (z. B. Insta360 X-Serie) + Stativ, eigene Rundgänge | 500–700 € | Für Social Media und Events. Nicht für die Produktfotografie |
| Matterport-Scan durch einen Dienstleister (einmalig) + Hosting-Abo | 400–1.200 € einmalig + ca. 10–70 €/Monat | Lohnt sich, wenn die Ausstellung mindestens 6 Monate gleich bleibt. Sonst veraltet der Scan |
| Eigene Fotos und Video-Rundgang mit Set A | 0 € zusätzlich | **Empfohlen für den Start.** Schnitt auf dem RTX-PC (Abschnitt 11) |

### 5.4 Upload und Netz

- **Pro Videostream ca. 4–8 Mbit/s Upload** einplanen (1080p). Mit Puffer: **mindestens 20 Mbit/s Upload** für den Betrieb, wenn gleichzeitig Kasse, Tablets und Kunden-WLAN laufen [Schätzung]. Den Anschluss [vom Unternehmen auszufüllen] mit einem Speedtest an 3 Stellen im Showroom prüfen.
- Vor jedem Live-Rundgang den Weg einmal abgehen. Funklöcher zeigen sich bei der WLAN-Ausleuchtung (Abschnitt 7).
- **Recht:** Keine anderen Kunden ins Bild nehmen und nicht ohne Zustimmung aufzeichnen (digital/05 F4). Mitarbeitende brauchen für Video-Content eine schriftliche Einwilligung, die widerrufbar ist [anwaltlich prüfen: Muster].

---

## 6. 3D, AR und VR im Showroom

| Technik | Empfehlung | Kosten [Schätzung] | Priorität |
|---|---|---|---|
| **AR auf dem Kunden-Handy** | `model-viewer` mit QR-Code „In Ihrem Raum ansehen“ (digital/03 F4). Im Showroom ist es auf dem Schild verlinkt, sobald 3D-Modelle vorliegen | Hardware 0 € | P2, abhängig von Modellfreigaben |
| **Küchenplanung auf dem 85-Zoll-Bildschirm** | Fotorealistisches Rendering oder Echtzeit-Rundgang aus dem Planungsprogramm | im Display enthalten | P1 |
| VR-Brille | z. B. Meta Quest 3 (ca. 500–550 €) für Küchen- und Second-Home-Rundgänge | 550–700 € inkl. Hygiene-Masken | **P3.** Hygiene, Einrichtungszeit und Brillenträger sprechen dagegen. Höchstens als Event-Highlight |
| Apple Vision Pro | ca. 4.000 € | – | **Nicht empfohlen.** Steht in keinem Verhältnis zum Nutzen |
| Holografische oder transparente Displays | 5–20 T€ | – | **Nicht empfohlen.** Effekt ohne Verkaufsnutzen |

---

## 7. WLAN und Netzwerk

### 7.1 Aufbau

| Netz (SSID/VLAN) | Wer | Regeln |
|---|---|---|
| `Platzhirsch Gäste` | Kunden, Café-Gäste | Vom Rest **isoliert** (Client Isolation), Bandbreite pro Gerät begrenzt (z. B. 10/5 Mbit/s), einfache Vorschaltseite mit Nutzungsbedingungen und Knopf „Verbinden“. **Keine** Pflicht zu E-Mail oder Social Login. Täglich wechselndes Passwort auf dem Tischaufsteller (Abschnitt 7.3) |
| `Platzhirsch Team` | Mitarbeitende, Tablets, Laptops | WPA3, gesteuert über MDM-Profile |
| `Kasse` | Kassen, Bondrucker, Zahlungsterminal | Eigenes VLAN, nur ausgehend zu den Anbietern. Wenn möglich per **LAN-Kabel**, nicht per WLAN |
| `Geräte` | Signage, Lautsprecher, Apple TV, Drucker | Eigenes VLAN, kein Zugriff auf das Team-Netz |

### 7.2 Hardware

| Gerät | Beispiel | Richtpreis [Schätzung] |
|---|---|---|
| Gateway/Firewall | Ubiquiti UniFi Cloud Gateway (Ultra oder Max), alternativ LANCOM (deutscher Hersteller, Support im DACH-Raum) oder TP-Link Omada | 130–400 € (LANCOM 500–1.000 €) |
| Access Points WiFi 7 | z. B. UniFi U7 Pro (Decke), U7 Outdoor für Terrasse/Außenausstellung. **Anzahl nach Ausleuchtung**, Richtwert 1 AP pro 150–250 m² bei Möbeln und Glas [Schätzung] | 180–250 € je AP |
| PoE-Switch (8–16 Ports) | versorgt APs, Kasse und Signage über Kabel | 200–450 € |
| **5G-Backup-Router** | z. B. Teltonika RUTX50 oder ein günstigeres LTE-Modell, mit Daten-SIM. Schaltet automatisch um, damit Kasse und Terminal bei einem Ausfall des Festnetzes weiterlaufen | 200–450 € + 10–25 €/Monat |
| Verkabelung durch einen Elektriker (Cat 6a zu den Deckenpunkten) | 4–6 Punkte | 600–1.800 € |
| **Summe** | | **ca. 1,5–3,5 T€** |

**Vorher:** Ausleuchtung mit einer App (z. B. Ekahau-Dienstleister oder kostenlos mit NetSpot/UniFi Design Center) anhand des Grundrisses [vom Unternehmen auszufüllen].

### 7.3 Recht beim Gäste-WLAN (Österreich)

- **§ 13 ECG** befreit Unternehmen als Access-Provider (Durchleitung) von der Haftung auf **Schadenersatz**, wenn sie die Übermittlung nicht veranlassen, den Empfänger nicht auswählen und die Inhalte weder auswählen noch verändern ([WKO Internetrecht](https://www.wko.at/internetrecht/eugh--passwortschutz-fuer-oeffentliches-wlan)). **Unterlassungsansprüche** (z. B. bei Urheberrechtsverletzungen über das WLAN) bleiben möglich.
- Nach **EuGH C-484/14 *Mc Fadden*** (15.09.2016) kann ein Gericht als zumutbare Maßnahme einen **Passwortschutz** verlangen. Ein Passwort, das am Tisch oder an der Theke ausgegeben wird, ist deshalb sinnvoll [anwaltlich prüfen].
- **Datenschutz:** Kein WLAN-Tracking (Besucherzählung über MAC-Adressen) und keine Marketing-Daten über die Vorschaltseite ohne gesonderte, freiwillige Einwilligung. Logdaten nur so kurz wie technisch nötig, z. B. 7 Tage. Ein Absatz „Gäste-WLAN“ gehört in die Datenschutzerklärung (`src/components/Datenschutz`, recht/02) [anwaltlich prüfen].

---

## 8. Sound im Café und Showroom

### 8.1 Technik

| Variante | Geräte | Richtpreis [Schätzung] | Urteil |
|---|---|---|---|
| **A – Zonen-Lautsprecher (empfohlen)** | 2 Zonen (Café / Showroom), je 1 Verstärker mit Streaming (z. B. Sonos Amp, WiiM Amp Pro oder ein Profi-Mischverstärker von Audac/Apart) + 4–8 Deckeneinbau- oder Aufbaulautsprecher je Zone | 1.500–3.500 € inkl. Montage | Unsichtbar, gleichmäßig, Lautstärke je Zone getrennt |
| B – Aktive WLAN-Lautsprecher | 4–6 × z. B. Sonos Era 100 | 1.000–1.600 € | Schnell, aber sichtbar und nicht für Dauerbetrieb im Gewerbe gedacht |
| C – Event-Anlage | 1 Akku-Säulenlautsprecher (z. B. Bose S1 Pro+ oder JBL Eon One Compact) + 1–2 Funkmikrofone | 600–1.100 € | **P2** für Adventsabend, Vorträge, Binni-Präsentation |

**Pegel:** Hintergrundmusik im Café bei ca. 55–62 dB(A), im Showroom leiser, bei ca. 50–55 dB(A). Beratungsgespräche müssen ohne Anheben der Stimme möglich sein [Schätzung, Orientierung an der Sprachverständlichkeit]. Beim Wechsel von Zone zu Zone keine anderen Genres, sondern dieselbe Playlist leiser.

### 8.2 Lizenzen (Pflicht, nicht optional)

- Hintergrundmusik in Räumen mit Kundenverkehr ist eine **öffentliche Wiedergabe** und vergütungspflichtig (§ 18 UrhG, Aufführungsrecht). Entscheidend ist, ob Personen außerhalb des Unternehmens sie hören können, nicht die Lautstärke ([WKO Vorarlberg, Einrichtungsfachhandel](https://www.wko.at/vlbg/handel/elektro-einrichtungsfachhandel/akm-verguetungspflicht-bei-musikwiedergabe-im-geschaeft)).
- Nötig sind eine **AKM-Bewilligung** (Urheber) und in der Regel eine Lizenz der **LSG** (Leistungsschutz: Interpreten und Labels) [prüfen: Tarife für Café und Verkaufsfläche getrennt?]. Kontakt laut WKO: lizenzen@akm.at. TV-Bildschirme und Live-Musik bei Events brauchen eigene Bewilligungen ([WKO Wien, Gastronomie](https://www.wko.at/wien/tourismus-freizeitwirtschaft/gastronomie/akm-musik-und-fernsehen-in-der-gastronomie)).
- **Spotify, Apple Music und YouTube Premium für Privatkunden sind laut deren Nutzungsbedingungen nicht für die gewerbliche Wiedergabe erlaubt.** Stattdessen ein Business-Musikdienst wie Soundtrack (vormals Soundtrack Your Brand), Tunify oder vergleichbar, ca. 25–45 € pro Zone und Monat [Schätzung]. Ob dieser Dienst AKM/LSG in Österreich abdeckt, ist **je Anbieter schriftlich zu bestätigen** [prüfen].
- [vom Unternehmen auszufüllen]: Gibt es heute schon eine AKM-Bewilligung für das Café, und auf welche GmbH lautet sie?

---

## 9. Kassensystem (Registrierkassenpflicht Österreich)

### 9.1 Rechtslage

- **§ 131b BAO:** Registrierkassenpflicht ab einem Jahresumsatz von **15.000 € je Betrieb**, wenn davon die **Barumsätze 7.500 € übersteigen**. Beide Grenzen müssen überschritten sein. **Bankomat- und Kreditkarte sowie vergleichbare elektronische Zahlungen gelten als Barumsatz** ([BMF Registrierkassen](https://www.bmf.gv.at/themen/steuern/fuer-unternehmen/registrierkassen.html), [§ 131b BAO](https://gesetzefinden.at/bundesrecht/bundesgesetze/bao/para-131b)). Das Café und der Möbelverkauf mit Kartenzahlung erfüllen das sicher.
- **§ 132a BAO:** Belegerteilungspflicht. Details zu den Belegen stehen im [USP: Kassenbelege](https://www.usp.gv.at/themen/steuern-finanzen/steuerliche-rechte-und-pflichten/registrierkassen/kassenbelege.html).
- **RKSV (Registrierkassensicherheitsverordnung):** technische Sicherheitseinrichtung (Signaturerstellungseinheit), Anmeldung in FinanzOnline, Startbeleg, Monats- und Jahresbeleg, Prüfung des Jahresbelegs mit der BMF-Belegcheck-App.
- **Strafen:** Fehlende Registrierkasse oder Sicherheitseinrichtung ist eine Finanzordnungswidrigkeit mit einer Geldstrafe **bis 5.000 €** (BMF, s. o.).
- Online-Zahlungen im Web-Shop (Stripe Checkout) sind nach verbreiteter Lesart **keine** Barumsätze. Der Kassenbeleg entfällt dort, eine Rechnung ist trotzdem nötig [steuerlich prüfen].

### 9.2 Was die Ausgliederung bedeutet

| Szenario | Folge für die Kasse |
|---|---|
| Café bleibt bei der MW Immobilienverwaltungs GmbH, Handel geht in die neue Handels-GmbH | **Zwei Unternehmer, zwei Kassen**, jede mit eigener Signaturerstellungseinheit und eigener FinanzOnline-Meldung. Bei einem Cloud-Kassensystem sind das zwei Mandanten. Verkauft das Café Gutscheine für Möbel (oder umgekehrt), ist eine Abrechnung zwischen den Gesellschaften nötig [steuerlich prüfen] |
| Café und Handel gehen beide in die Handels-GmbH | Eine Kasse mit zwei Bereichen (Gastro/Handel) genügt, getrennte Umsatzsteuersätze (Gastro 10 % bzw. 20 % für Getränke, Möbel 20 %) [steuerlich prüfen] |
| Stichtag der Ausgliederung | Alte Kasse mit **Schlussbeleg** außer Betrieb nehmen, neue Kasse mit Startbeleg in Betrieb nehmen und den Startbeleg prüfen. In FinanzOnline melden. Ohne Unterbrechung planen (Café-Betrieb am Stichtag) |

[vom Unternehmen auszufüllen]: Wo landet das Café? Stichtag? Wer meldet in FinanzOnline (Steuerberatung)?

### 9.3 Empfehlung

- **Ein RKSV-zertifiziertes Cloud-Kassensystem** für Gastro **und** Handel. Beispiele aus Österreich und dem DACH-Raum: ready2order (Wien), Hellotess, orderbird oder Lightspeed. Anforderungen: Gastro-Modul (Tische, Küchenbon), Handels-Modul (Artikel mit Inventarnummer, Anzahlungen, Teilzahlungen), **Gutscheinverwaltung** (Mehrzweck- und Einzweckgutschein getrennt, recht/06), Integration des Kartenterminals, Schnittstelle zum Backoffice oder zur Buchhaltung (BMD/RZL/DATEV-Export) [vom Unternehmen/Steuerberatung auszuwählen].
- **Hardware:** iPad oder Kassen-Tablet (vorhanden?), Bondrucker Epson TM-m30III (LAN) ca. 300–400 €, Küchendrucker Café ca. 300 €, Kassenlade ca. 100–150 €. Software ca. 30–90 € pro Kasse und Monat [Schätzung].
- **Großaufträge (Möbel, Küchen):** Anzahlung und Restzahlung **per Überweisung auf Rechnung**, auf der Rechnung ein **QR-Code für die Überweisung** (EPC/„Zahlen mit Code“, Stuzza-Standard). Überweisungen sind keine Barumsätze und fallen nicht in die Kasse. Kartenzahlung bleibt für Accessoires, Café und Atelierverkauf.

---

## 10. Zahlungsterminal (inkl. TWINT für die Schweiz)

### 10.1 Karten

| Kriterium | Vorgabe |
|---|---|
| Akzeptanz | Debit (Debit Mastercard, Visa Debit, Maestro bzw. ehem. Bankomatkarte), Kreditkarten (Visa, Mastercard, **Amex** wegen der Schweizer und deutschen Premium-Kunden), Apple Pay/Google Pay. Deutsche Girocard-Kunden zahlen meist über das Co-Badge (Maestro/Debit Mastercard/Visa Debit) [beim Acquirer prüfen] |
| Anbindung | **Integriert in die Kasse** (Betrag wird übertragen, keine Tippfehler, Beleg aus der RKSV-Kasse). Ein Terminal ohne Kassenanbindung bedeutet doppelte Eingabe |
| Anbieter in AT | Hausbank-Acquirer (z. B. Worldline, Hobex, card complete/Global Payments, PAYONE) oder der Partner des Kassensystems. SumUp oder myPOS nur als mobiles Zweitgerät (Events, Lieferung) |
| Gebühren | **Für große Beträge vergleichen.** Bei 50.000 € kosten 0,9–1,5 % Disagio 450–750 € [Schätzung]. Daher Möbel und Küchen per Überweisung (9.3). Kein Aufschlag für Kartenzahlung (Surcharging ist in der EU für Verbraucherkarten verboten, Art. 62 Abs 4 PSD2 / § 56 Abs 3 ZaDiG 2018) |
| DCC | Dynamische Währungsumrechnung für Schweizer Karten **ausschalten** oder neutral anbieten. Die Kunden zahlen sonst einen schlechten Kurs, und das kostet Vertrauen. Eine Vorauswahl „in CHF zahlen“ wäre ein Dark Pattern |
| Kartenlimits | Viele Debitkarten haben Tageslimits von 2.000–5.000 €. Das Team darf bei Großbeträgen deshalb nicht auf die Karte drängen, sondern bietet die Überweisung an |
| Mobil | 1 Zweitgerät (z. B. SumUp Solo, ca. 80–100 €) für Lieferungen, Events und den Außenbereich |

**Stripe Terminal:** Der Reader S700 ist laut Stripe in Österreich verfügbar ([Stripe-Dokumentation](https://docs.stripe.com/terminal/readers/stripe-reader-s700-s710)). Er passt, wenn Stripe ohnehin der Online-Zahlungsanbieter wird (Entscheidung E3 in digital/00). Ob er an die gewählte RKSV-Kasse angebunden werden kann, ist offen [prüfen beim Kassenanbieter]. Ohne Anbindung lieber das Terminal des Kassenanbieters nehmen.

### 10.2 TWINT

- TWINT ist ein Schweizer Zahlungsmittel. Der Kunde braucht eine Schweizer TWINT-App, also ein Schweizer Bankkonto. Laut TWINT-FAQ können **ausländische Unternehmen TWINT über Zahlungsdienstleister** anbieten, genannt werden u. a. **Adyen, Checkout, Mollie, Stripe und Planet**. Die FAQ bezieht sich auf **Online-Shops**, zur Zahlung im Laden sagt sie nichts ([TWINT-FAQ](https://www.twint.ch/en/faq/as-a-foreign-merchant-am-i-also-able-to-offer-twint/)).
- **Praktische Lösung im Showroom:** Am Tablet einen **Bezahllink** erzeugen (Stripe Payment Link/Checkout mit TWINT, Betrag in CHF). Der Kunde scannt den QR-Code und bezahlt in der TWINT-App. Technisch ist das eine Online-Zahlung. Klären: Wie wird sie in der RKSV-Kasse und in der Buchhaltung erfasst, wenn der Kunde im Laden steht? [steuerlich prüfen]
- Alternative: Payrexx (Schweiz) mit „QR Pay“. Ob ein österreichisches Unternehmen ohne Schweizer Niederlassung dort aufgenommen wird, ist [beim Anbieter zu prüfen].
- **CHF-Konto** (Bank oder Stripe-Auszahlung in CHF) verhindert doppelte Umrechnung. Zu Preisen in CHF und zur Ausfuhr gelten die Regeln aus Bericht 18 (Ausfuhr, MWST) und digital/14 F7. Keine Werbung mit „steuerfrei“.
- **Priorität P2:** Zuerst mit dem Schweiz-Lieferservice. Für Möbelaufträge zahlen Schweizer Kunden ohnehin meist per Überweisung.

---

## 11. Der lokale PC (RTX 4060, 128 GB RAM): Renderings, Video, lokale KI

### 11.1 Sofortmaßnahmen (P1)

| Maßnahme | Richtpreis [Schätzung] | Warum |
|---|---|---|
| **NAS mit 2 Festplatten (gespiegelt)**, z. B. Synology DS224+ + 2 × 8 TB | 700–900 € | Heute gibt es nur einen Datenträger. Fotos, 3D-Modelle und KI-Workflows sind Firmenvermögen |
| **Cloud-Backup der NAS** (EU-Rechenzentrum, verschlüsselt), z. B. Hetzner Storage Box oder Synology C2 | 5–15 €/Monat | 3-2-1-Regel: 3 Kopien, 2 Medien, 1 außer Haus |
| **2. NVMe-SSD 2–4 TB** für Projekte und Modelle | 150–300 € | Trennung System/Daten, Platz für KI-Modelle (20–60 GB je Modell) |
| **USV** (z. B. APC Back-UPS Pro oder Eaton 5E, 1.000–1.500 VA) | 200–350 € | Schutz vor Stromausfall während Renderings und Updates |
| Windows-Konto ohne Admin-Rechte im Alltag, BitLocker, automatische Updates | 0 € | Kundenfotos (KI-Raumplaner) sind personenbezogen (digital/14 F14) |
| Netzteil prüfen | 0 € | Voraussetzung für jedes GPU-Upgrade [vom Unternehmen auszufüllen] |

### 11.2 Was der PC heute kann

| Einsatz | Software (Lizenz) | Eignung mit RTX 4060 / 8 GB [Schätzung] |
|---|---|---|
| Produkt- und Packshot-Renderings, Texturen backen | Blender Cycles mit OptiX (GPL, kostenlos) | **gut**. Einzelmöbel in Minuten (digital/03 F5) |
| Fotorealistische Raum- und Küchenrenderings | D5 Render, Twinmotion, Enscape (alle kostenpflichtig im gewerblichen Einsatz; Twinmotion ist nur unter einer Umsatzgrenze kostenlos [Lizenz prüfen]) oder das Render-Modul des Küchenplanungsprogramms | **mittel**. Große Szenen stoßen an 8 GB VRAM. Texturen auf 2K begrenzen |
| Fotogrammetrie eigener Stücke | Meshroom/AliceVision (MPL-2.0, CUDA) | **mittel**. Die 6-Kern-CPU bremst (mehrere Stunden pro Objekt) |
| Video-Schnitt, Rundgang-Film, Reels | DaVinci Resolve (kostenlos; Studio ca. 300 € einmalig für volle GPU-Beschleunigung und Rauschentfernung) | **gut**. NVENC mit H.264, HEVC und **AV1** in Hardware |
| Freistellen, Upscaling, Bild-Werkstatt | ComfyUI mit BiRefNet, SAM 2.1, LaMa, Real-ESRGAN, Qwen-Image-Edit (Q4) (digital/06 F2/F3) | **gut** bis **mittel**. Qwen-Edit ca. 60–180 s pro Bild |
| Lokales Sprachmodell | Ollama oder LM Studio mit 7–14B-Modellen (z. B. Qwen3 8B/14B, Mistral-Modelle, Q4) | **gut** für Entwürfe von Produkttexten, Übersetzungshilfen, Zusammenfassungen. Im VRAM ca. 30–60 Token/s. Größere Modelle (30–70B) passen in die 128 GB RAM, laufen auf der alten CPU aber mit nur ca. 1–5 Token/s, also **unbrauchbar für den Dialog** |
| Transkription | faster-whisper (large-v3-turbo, MIT) | **gut**. Eine Stunde Audio in wenigen Minuten. Beratungsgespräche **nur mit ausdrücklicher Einwilligung** aufnehmen (DSGVO, § 120 StGB bei heimlicher Aufnahme) |
| Embeddings für den KI-Concierge | `BAAI/bge-m3` (MIT) offline (digital/05 F5) | **gut**. Läuft als Batch, nicht live |

**Regel:** Der PC ist **Werkstatt, nicht Server** (wie in digital/06). Er stellt keine öffentlichen Endpunkte bereit und hat keine Portfreigaben. Der KI-Concierge der Website läuft bei einem EU-Anbieter mit AVV. Lokal entstehen nur Daten wie Embeddings und Bilder, die danach hochgeladen werden.

**Qualitätsregel für lokale KI-Texte:** Entwürfe gehen durch die Faktenkette aus digital/00 (`facts.json`, Verbotsliste „Händler/autorisiert/größte“). Kein lokal erzeugter Text wird ungeprüft veröffentlicht.

### 11.3 Upgrade-Pfad (Entscheidung nach Bedarf, nicht jetzt)

| Stufe | Auslöser | Lösung | Richtpreis [Schätzung] |
|---|---|---|---|
| 0 (heute) | Pilot KI-Werkstatt, Renderings, Video | vorhandener PC + 11.1 | ca. 1,1–1,5 T€ |
| 1 | KI-Raumplaner mit mindestens 5 Aufträgen pro Woche **oder** Render-Warteschlange über 1 Tag (06) | **GPU-Tausch auf RTX 5090 (32 GB)** im vorhandenen PC. Voraussetzung: Netzteil ab 1.000 W mit 12V-2x6-Stecker, Platz im Gehäuse. PCIe 3.0 ×16 kostet bei Rendering und KI nur wenige Prozent [Schätzung] | GPU 2.300–3.200 € + Netzteil 180–250 € |
| 2 | Fotogrammetrie und Echtzeit-Rendering täglich, Windows-11-Support der alten CPU läuft aus | **Neue Workstation**: aktuelle 16-Kern-CPU, 128 GB DDR5, RTX 5090, 2 × 4 TB NVMe. Die alte Maschine wird Zweit-PC für Batch-Aufgaben | 5.500–7.500 € |
| Alternative | Gelegentliches LoRA-Training | Cloud-GPU auf Stunde (RunPod, Vast, Lambda), **ohne Kundenfotos** oder nur mit AVV (06) | 0,40–2,50 $/h |

---

## 12. Büro-Technik (kurz)

| Gerät | Zweck | Richtpreis [Schätzung] | Priorität |
|---|---|---|---|
| A3-Farblaserdrucker oder -Multifunktionsgerät | Küchenpläne, Angebote, Moodboards zum Mitnehmen | 700–1.500 € | P2 |
| Passwort-Manager für das Team (z. B. Bitwarden Teams) + Zwei-Faktor-Anmeldung für Backoffice, Google, Meta, Stripe | Schutz der Konten (Ads, Zahlungen) | ca. 4 €/Person/Monat | **P1** |
| Firmenhandy (WhatsApp Business, Video-Rundgang) | digital/05 F3 und F4, keine privaten Kontakte | vorhanden? 600–1.300 € | P1 |
| Etikettendrucker für Inventar- und Lagerlabels (z. B. Brother QL) | Inventarnummer `PH-` an Stück und Lagerplatz | 120–250 € | P1 (mit Schildern) |

---

## 13. Prioritäten und Budget

| Prio | Zeitraum | Maßnahme | Richtpreis [Schätzung] |
|---|---|---|---|
| **P1** | KW 45–48 (vor dem Weihnachtsgeschäft) | Backup, NAS, USV, 2. SSD am RTX-PC | 1,1–1,5 T€ |
| P1 | KW 45–47 | WLAN-Ausleuchtung, neues Netz mit 4 VLANs, 5G-Backup | 1,5–3,5 T€ |
| P1 | KW 46–48 | Schilder QR + NFC für 50 Pilot-Stücke (danach alle), inkl. Preis nach § 4 PrAG | 0,8–1,5 T€ (Pilot) |
| P1 | KW 46 | Video-Set A + B | 0,9–1,4 T€ |
| P1 | bis Stichtag der Ausgliederung | Entscheidung Kassensystem + integriertes Terminal + Großbeträge per Überweisung mit QR-Code | 1–2,5 T€ Hardware + 60–180 €/Monat |
| P1 | KW 46 | 85-Zoll-Bildschirm am Küchen-Beratungsplatz, Laser-Messgerät | 2–3,5 T€ |
| P1 | KW 45 | Passwort-Manager, Zwei-Faktor-Anmeldung, AKM/LSG klären | 0,1 T€ + Lizenzen |
| | | **Summe Stufe 1** | **ca. 9–15 T€** |
| P2 | Q1 2027 | Restliche Schilder (ca. 150 Stück) | 1,8–3,5 T€ |
| P2 | Q1 2027 | iPad Pro + 2. iPad Air + MDM | 2,3–3 T€ |
| P2 | Q1 2027 | Display Eingang/Café + Signage-Software | 1,2–2,3 T€ |
| P2 | Q1 2027 | Zonen-Sound + Business-Musikdienst + Event-Anlage | 2,1–4,6 T€ |
| P2 | mit Schweiz-Service | TWINT per Bezahllink, CHF-Konto | Gebühren je Transaktion |
| | | **Summe Stufe 2** | **ca. 8–14 T€** |
| P3 | nach Auslöser | RTX 5090 oder neue Workstation | 2,5–7,5 T€ |
| P3 | optional | Schaufenster-Display, E-Paper-Preisschilder, VR-Brille, Matterport | 4–25 T€ |

**Finanzierung:** Da das Eigenkapital der Betreiber-GmbH negativ ist (23), empfiehlt sich für Geräte über ca. 1.000 € **Leasing oder Miete** (Kassen- und Terminalanbieter, Displays). Gekauft wird erst nach der Ausgliederung **auf die Handels-GmbH**, damit Anlagevermögen und Verträge (Kasse, Terminal, AKM) gleich beim richtigen Rechtsträger liegen.

---

## 14. Was man auf keinen Fall tun darf

1. **Kein Bluetooth-Beacon mit Push-Nachrichten, kein WLAN-Tracking und keine Kamera-Analyse von Besuchern.** Das ist in einem Luxus-Showroom unpassend und datenschutzrechtlich heikel.
2. **Kein Rabatt gegen Daten** am Schild oder im WLAN („Scannen und 10 % sparen gegen E-Mail“). Bindet man die Einwilligung an einen Vorteil, ist sie nicht freiwillig und beschädigt die Marke.
3. **Keine Händler-Behauptungen** auf Schildern, Displays und Startbildschirmen (14 F1).
4. **Kein Privat-Streaming** (Spotify/Apple Music privat) im Café und kein Fernsehen ohne AKM/LSG.
5. **Keine Kasse ohne RKSV-Signatur**, kein Weiterbetrieb der alten Kasse auf die falsche GmbH nach der Ausgliederung.
6. **Kein DCC-Zwang** für Schweizer Karten und **kein Kartenaufschlag**.
7. **Kein Tablet ohne MDM und kein privates Handy** für Kundendaten oder WhatsApp.
8. **Keine Kundenfotos auf dem RTX-PC ohne Löschfrist** (Vorschlag: 90 Tage nach Projektende) und kein Upload in Cloud-GPUs ohne AVV.
9. **Keine Bildschirme in den Vignetten** und keine Displays mit Ton im Showroom.
10. **Keine öffentlichen Ports am Büro-PC.** Der PC bleibt Werkstatt.

---

## 15. Prüf-Checkliste (für Abnahme und Expertenrat)

- [ ] Jedes ausgestellte Stück hat eine Inventarnummer, ein Schild mit Preis und einen QR-Code, der in Sekunden scannt (Test mit iPhone und Android). Der NFC-Chip ist gesperrt
- [ ] `/s/{Inventarnummer}` leitet weiter, und die Produktseite zeigt den Block „Dieses Stück im Showroom“ samt Merkliste
- [ ] An allen Beratungsplätzen und auf dem Rundgang-Weg liegt der WLAN-Pegel bei −67 dBm oder besser, der Upload bei mindestens 10 Mbit/s
- [ ] Das Gäste-WLAN ist isoliert und hat ein Passwort, die Kasse läuft im eigenen VLAN mit 5G-Backup (Umschalttest bestanden)
- [ ] Jede Registrierkasse ist in FinanzOnline gemeldet, der Startbeleg geprüft und die Jahresbeleg-Routine im Kalender
- [ ] Das Terminal ist an die Kasse angebunden, DCC ist aus, Amex wird akzeptiert, ein mobiles Zweitgerät ist da
- [ ] Ein Probezahlung mit TWINT per Bezahllink ist durchgeführt und richtig verbucht
- [ ] AKM/LSG-Bewilligung liegt vor, der Business-Musikdienst ist schriftlich bestätigt
- [ ] Ein Probe-Videocall (15 min Rundgang) läuft ohne Abbruch, Ton und Bild sind gut
- [ ] Der RTX-PC hat ein NAS-Backup mit wiederhergestellter Testdatei, ein Cloud-Backup und eine USV

---

## 16. Entscheidungen und Lieferungen des Inhabers

| Nr. | Entscheidung oder Lieferung | Bis |
|---|---|---|
| H1 | **Café in welche GmbH, Stichtag der Ausgliederung**, wer meldet die Kassen in FinanzOnline | vor der Wahl der Kasse |
| H2 | Daten zum heutigen Kassensystem, Terminal und Musik (Anbieter, Vertragsende, Gebühren, AKM-Bewilligung) | KW 45 |
| H3 | Grundriss (PDF mit m²), Internetanschluss (Upload), Netzteil des RTX-PCs | KW 45 |
| H4 | Liste der Ausstellungsstücke mit Konfiguration und **Preis**, wer die Inventarnummern pflegt | KW 46 |
| H5 | Freigabe Budget Stufe 1 (ca. 9–15 T€), Kauf oder Leasing | KW 45 |
| H6 | Zahlungsanbieter online (E3 digital/00: Stripe oder Mollie), damit TWINT und Terminal zusammenpassen | vor W2-1 |
| H7 | Küchenplanungsprogramm und Lizenzen, OFML-Daten der Marken | Q1 2027 |
| H8 | Anwalts- und Steuertermin: Preisauszeichnung (§ 4 PrAG), Gäste-WLAN-Bedingungen, TWINT-Buchung im Laden, Einwilligungsmuster für Video | KW 47 |

---

## Quellen

- § 4 Preisauszeichnungsgesetz: [gesetzefinden.at](https://gesetzefinden.at/bundesrecht/bundesgesetze/prag/para-4), [RIS](https://www.ris.bka.gv.at/Dokumente/Bundesnormen/NOR40273255/NOR40273255.pdf)
- § 131b BAO: [gesetzefinden.at](https://gesetzefinden.at/bundesrecht/bundesgesetze/bao/para-131b); BMF Registrierkassen: [bmf.gv.at](https://www.bmf.gv.at/themen/steuern/fuer-unternehmen/registrierkassen.html); USP Registrierkassenpflicht: [usp.gv.at](https://www.usp.gv.at/themen/steuern-finanzen/steuerliche-rechte-und-pflichten/registrierkassen/registrierkassenpflicht.html); USP Kassenbelege: [usp.gv.at](https://www.usp.gv.at/themen/steuern-finanzen/steuerliche-rechte-und-pflichten/registrierkassen/kassenbelege.html); WKO, technisch-rechtliche Grundlagen: [wko.at (PDF)](https://www.wko.at/oe/information-consulting/unternehmensberatung-buchhaltung-informationstechnologie/it-dienstleistung/technisch-rechtliche-grundlagen-zur-registrierkassenpflicht.pdf)
- AKM, Musik im Geschäft: [WKO Vorarlberg](https://www.wko.at/vlbg/handel/elektro-einrichtungsfachhandel/akm-verguetungspflicht-bei-musikwiedergabe-im-geschaeft); Gastronomie: [WKO Wien](https://www.wko.at/wien/tourismus-freizeitwirtschaft/gastronomie/akm-musik-und-fernsehen-in-der-gastronomie)
- Gäste-WLAN, § 13 ECG und EuGH *Mc Fadden*: [WKO Internetrecht](https://www.wko.at/internetrecht/eugh--passwortschutz-fuer-oeffentliches-wlan); Providerhaftung: [Präsentation (PDF)](https://a.storyblok.com/f/89606/x/91d5629adf/lr_providerhaftung.pdf)
- TWINT für ausländische Unternehmen: [twint.ch FAQ](https://www.twint.ch/en/faq/as-a-foreign-merchant-am-i-also-able-to-offer-twint/); TWINT-Akzeptanzbedingungen 07/2026: [twint.ch (PDF)](https://www.twint.ch/content/uploads/2026/08/GK-AGB-DE-Version-07-2026-2-6.pdf); Akzeptanz in der Schweiz (ZHAW-Studie): [markt-kom.com](https://www.markt-kom.com/en/?p=191356); Payrexx QR Pay: [payrexx.com](https://payrexx.com/en-gb/content-hub/blog/create-twint-qr-codes-fast-with-payrexx-qr-pay); Worldline Tap on Mobile mit TWINT: [worldline.com](https://worldline.com/de-ch/home/top-navigation/media-relations/press-release/pr-2023_11_30_01)
- Stripe Reader S700/S710: [docs.stripe.com](https://docs.stripe.com/terminal/readers/stripe-reader-s700-s710), [stripe.com](https://stripe.com/ie/terminal/s700)
- Interne Berichte: 23 (Masterkonzept), digital/00, 03, 05, 06, 14, marketing/qr-karte-bewertung; lokale Prüfung `nvidia-smi` und WMI (CPU, RAM, Datenträger) am 26.10.2026
