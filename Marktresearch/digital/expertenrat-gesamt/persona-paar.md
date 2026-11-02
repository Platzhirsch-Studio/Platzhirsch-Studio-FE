# Nutzertest: Paar aus Bregenz, Neubau (Kürzel: persona-paar)

**Stand:** 28.10.2026, Branch `feature/neuauftritt`, Dev-Server http://localhost:3000
**Gutachter:** Nutzertester (Persona-Spiel), kein Code geändert, kein Formular abgeschickt.
**Screenshots:** `qa-screenshots/expertenrat-gesamt/persona-paar/` (Nummern unten = Dateipräfix), Protokolle `journey.log` / `journey-iphone.log`.
**Geräte:** iPhone 15 Pro (WebKit) und Pixel 7 (Chromium), immer nur ein Browser zur Zeit.

> **Wichtiger Vorbehalt zur Messung:** Der Dev-Server war durch parallele Bauteams stark ausgelastet (Seitenaufruf 50–220 s, Hydration auf dem Sofaplaner rund 80 s nach dem HTML). Ladezeiten und zwei frühe Klick-Fehlschläge (Stil-Finder-Start, Menü) sind deshalb **Messartefakte der Dev-Umgebung**, keine Befunde. Nach Warten auf die Hydration lief alles. Ladezeit muss auf einem Produktions-Build nachgemessen werden (siehe P1-7).

## Persona

Sabine (46) und Thomas (48) aus Bregenz. Neubau in Hörbranz, Einzug in etwa 6 Monaten. Abends auf dem Sofa, jeder mit eigenem Handy. Budget offen („gut, aber nicht verrückt“). Sie kennen Minotti nicht beim Namen. Sie suchen Inspiration, wollen ihren Stil herausfinden, eine Ecklösung fürs Wohnzimmer probieren und einen Samstagstermin im Showroom mit Kaffee.

## Note: **7 / 10** (Persona-Sicht, heutiger Dev-Stand)

Das Erlebnis ist hochwertig, ruhig und in sich stimmig. Der Stil-Finder ist das Highlight und würde das Paar wirklich abholen. Bis zum Livegang gibt es drei Dinge, die Vertrauen kosten: interne Texte vor Kundenaugen („vom Inhaber festzulegen“, „Labs · Prototyp“), ein Moodboard, das nicht zum Profil passt, und ein „Termin wählen“, bei dem man keinen Termin wählen kann. Hinzu kommt: Im Produktions-Build wären alle Planer heute **unsichtbar** (Schalter standardmäßig aus), obwohl der Inhaber am 28.10. das Gegenteil entschieden hat.

## Protokoll der Reise (mit Gefühl und Abbruchgefahr)

| # | Schritt | Was das Paar sieht | Gefühl | Abbruchgefahr |
|---|---|---|---|---|
| 1 | Startseite (21–26) | „Italienisches Wohnen am Bodensee.“, großes Showroom-Foto, sofort **„Termin wählen“** und „Showroom & Café“. Direkt darunter Öffnungszeiten, Adresse und Telefon. „Wir sind Gastgeber, bevor wir Einrichter sind.“ | „Edel, aber nicht abgehoben. Und es gibt Kaffee!“ Sehr gut. | niedrig |
| 2 | Weiter scrollen (24) | „Sechs Stücke für den Anfang“: **graue leere Kacheln** statt Produktbildern (Backoffice antwortete im Test mit Timeout) | „Lädt das noch? Ist der Shop kaputt?“ | mittel |
| 3 | Seitenlänge Startseite | 29.363 px auf dem Pixel, also gut 13 Bildschirmhöhen | Thomas scrollt, Sabine hat schon aufgegeben | mittel |
| 4 | Menü (61) | Wohnen, Küche, Schlafen, Outdoor, Marken, Leistungen, **Planen & Erleben** mit Küchenplaner, Sofaplaner, Stil-Finder … | „Ah, da kann man selber planen.“ Klar gegliedert. | niedrig |
| 5 | Planen & Erleben (03/04) | Kopf „PLATZHIRSCH LABS“, „Services, an denen wir gerade arbeiten“. Badges „Labs-Prototyp“, Hinweise „Senden erst nach Freigabe“, **leere Bildkacheln mit ?-Symbol**, „Schalter: NEXT_PUBLIC_FEATURE_…=1“ (Letzteres nur im Dev) | „Ist das fertig oder eine Baustelle?“ Spürbarer Vertrauensknick | **hoch** |
| 6 | Stil-Finder Einstieg (28) | Drei Raumbilder, „Welcher Wohnstil sind Sie?“, „7 Fragen · ca. 2 Minuten · ohne Anmeldung“, klarer Datenschutzsatz | „Das machen wir zusammen!“ Top | niedrig |
| 7 | Fragen 1–7 (62–68) | Große Bildkarten, Fortschritt 01/07, Frage 7 „Wie groß ist Ihr Vorhaben?“ optional | Macht Spaß, schnell, gut auf dem Daumen. Cookie-Banner nimmt anfangs 20 % des Bildschirms ein | niedrig |
| 8 | Ergebnis (70–78) | „Pariser Salon“: schöner Text, Mischung in %, Farbpalette mit Codes, Materialien | „Das sind wir!“ (Sabine) | niedrig |
| 9 | Moodboard (72) | **Ein einziges Stück**: Umbrosa Versa UX, ein Sonnenschirm vor einer Pool-Villa, bei „Samt, Messing, Spiegel“ | „Hä? Ein Sonnenschirm?“ Glaubwürdigkeit des Ergebnisses sinkt | **hoch** |
| 10 | PDF-Angebot (73) | „Ihre persönliche Präsentation, über 20 Seiten“, nur E-Mail Pflicht, Vorhaben „Neubau“ wählbar | Starker Lead-Magnet. Würden sie ausfüllen (nicht abgeschickt) | niedrig |
| 11 | Nächster Schritt | „Ihr Stil, zum Anfassen, im Showroom in Lochau … Termin vereinbaren“ | Perfekte Brücke | niedrig |
| 12 | Sofaplaner Einstieg (06/32) | „LABS · PROTOTYP“, Schritt 1 **„Modell wählen“** aus 90 Minotti-Modellen. Karten mit „Maße 82 %“, „Nicht-modulare Sitzfamilie“, „SX/DX“, „Penisola“ | „Wir wissen doch nicht, welches Modell. Wir wollen ein Ecksofa.“ Fachsprache überfordert | **hoch** |
| 13 | Sofaplaner nach Modellwahl (81–84) | Sehr gut: Grundriss mit Raum 560 × 440, „Passt“-Plakette, Formvorschläge Gerade/Ecke/U/Peninsula mit Maßen, 2D/3D, Planungstipps | „Das ist richtig gut gemacht.“ | niedrig |
| 14 | Preis im Sofaplaner (81) | **„RICHTPREIS: Im Gespräch. Richtwert – vom Inhaber festzulegen.“** | „Was heißt das? Haben die das vergessen?“ | **hoch** (Vertrauen) |
| 15 | Termin (09/10) | „Termin wählen“ führt zur Anfrage in 4 Schritten („Bei meiner Anfrage geht es um: Neubau“), dann „wir melden uns“. **Kein Kalender**, kein Samstagsslot sichtbar, Café auf der Seite nicht erwähnt | „Wir wollten einen Termin wählen, nicht eine Anfrage stellen.“ Sie rufen lieber am Dienstag an (wenn sie daran denken) | mittel bis hoch |
| 16 | Kontakt (11/12) | Klare Daten, Sticky-Leiste „Anrufen / Termin wählen“ unten, Karte erst nach Klick (DSGVO-sauber). Große Leerfläche mitten auf der Seite (vermutlich Einblend-Animationen im Ganzseiten-Screenshot) | ok | niedrig |

## Top-5-Stärken

1. **Stil-Finder** (62–78): Bilderquiz in etwa 2 Minuten, emotionales Ergebnis, Farbcodes, PDF als Lead-Magnet und eine saubere Brücke zum Showroom-Termin („So beginnen wir direkt bei ‚Pariser Salon‘ statt bei null“). Genau das, was die Persona sucht.
2. **Gastgeber-Tonalität und Café** auf der Startseite: „Erst ein Kaffee. Dann das Sofa.“, Öffnungszeiten und Telefon im ersten Scroll. Das unterscheidet Platzhirsch von Möbelhäusern.
3. **Sofaplaner ab Schritt 2**: echter Grundriss mit Raummaß, „Passt“-Prüfung, Formvorschläge mit Maßen, Laufweg- und Lieferweg-Tipps. Fachlich stark und auf dem Handy bedienbar.
4. **Mobile Navigation**: „Planen & Erleben“ als eigener Menüpunkt, Sticky-Leiste „Anrufen / Termin wählen“, kein horizontales Scrollen auf allen geprüften Seiten.
5. **Datenschutz als Vertrauensmerkmal**: „Antworten verlassen Ihren Browser nicht“, Karte erst nach Einwilligung, PDF nur mit E-Mail, Newsletter getrennt mit Double-Opt-in.

## Befunde

| Prio | Seite/Datei | Befund | Beleg | Konkrete Maßnahme | Aufwand | Wirkung |
|---|---|---|---|---|---|---|
| **P0** | `src/components/Labs/Sofaplaner/model.js:25` | Kunde sieht „Richtwert – vom Inhaber festzulegen“ als Preislabel (nicht an Dev gebunden) | 81, Protokoll AFTER MODEL | Label durch Kundentext ersetzen: „Preis auf Anfrage, wir rechnen Ihre Komposition nach dem Termin individuell.“ Keine internen Platzhalter in UI-Texten, Suche nach `vom Inhaber festzulegen` in den Release-Gate aufnehmen | S | Vertrauen, Lead-Rate Sofaplaner |
| **P0** | `src/lib/features.js` (`flagOn`) vs. Inhaber-Entscheidung #9 | Ohne gesetzte Variablen sind im Produktions-Build **alle** Features aus: kein Menüpunkt, kein Startseiten-Abschnitt, `/de/labs` liefert 404. Inhaber hat am 28.10. „Schalter standardmäßig AN“ und „keine separate Labs-Welt“ entschieden | features.js Kopfkommentar, `inhaber-entscheidungen.md` #9 | Default in Produktion auf AN drehen (bzw. Variablen im Deploy setzen), sprechende URLs außerhalb `/labs` mit 301 von den alten Pfaden. **Vermutlich in Arbeit** (Team Labs-Übersicht) | M | Ohne das sieht kein Kunde Stil-Finder/Sofaplaner: 0 Leads aus den Planern |
| **P0** | Alle Planer-Seiten, `LabsHub`, `features.js` | „PLATZHIRSCH LABS“, „LABS · PROTOTYP“, „Labs-Prototyp“-Badges, „Services, an denen wir gerade arbeiten“, „Senden erst nach Freigabe“ | 03, 04b, 06, 28, 81 | Gemäß #9 Labs-Sprache vollständig entfernen. Eyebrow z. B. „Planen“ / „Erleben“, Hub-Intro „Planen Sie vor, wir setzen mit Ihnen in Lochau um“. Statusbadges nur noch intern | S | Premium-Wahrnehmung, Conversion |
| **P0** | `public/labs/hub/*.webp` (fehlt) | Alle Feature-Bilder auf `/de/labs` brechen (?-Symbol) | 04b, `ls public/labs` (kein `hub/`) | Screenshots erzeugen und ablegen oder Fallback-Grafik. **Vermutlich in Arbeit** | S | erster Eindruck der Planer-Welt |
| **P1** | Stil-Finder Moodboard (`MoodboardLoader`/`catalog.js`) | Profil „Pariser Salon“ zeigt nur **1** Stück, einen Outdoor-Sonnenschirm (Umbrosa) vor einer Pool-Villa. Wahrscheinlich Folge von Backoffice-Timeouts im Test plus Gewichtung der optionalen Frage 7 (Antwort „Terrasse & Garten“), die laut Text das Profil nicht beeinflussen soll | 72, Konsole: `backoffice … outcome: timeout` | Mindestens 6 Stücke garantieren: lokaler, kuratierter Fallback je Profil (statische JSON), wenn der Katalog langsam ist. Vorhaben-Antwort höchstens als 1 von 6 Stücken einmischen, nie allein | M | Glaubwürdigkeit des Highlights, PDF-Leads |
| **P1** | Startseite „Sechs Stücke für den Anfang“ | Leere graue Produktkacheln, wenn das Backoffice nicht antwortet | 24, Konsole Backoffice-Timeouts | Produkt-Teaser statisch zwischenspeichern (ISR/`revalidate`) oder Fallback-Bilder, nie leere Kacheln ausliefern. In Produktion mit Backoffice-Ausfall testen | M | Erster Scroll, Absprungrate |
| **P1** | „Termin wählen“ (Hero, Sticky-Leiste, Menü) → `/beratung` | Der CTA verspricht eine Terminwahl, liefert aber ein Anfrageformular. `BOOKING_PROVIDER` steht auf „none“ | 09/10, `Booking/config.js` | Entweder Online-Buchung (z. B. Microsoft Bookings/Google Terminplanung über `BOOKING_PROVIDER=link`) mit Samstagsslots, **oder** CTA ehrlich in „Termin anfragen“ umbenennen und im Formular Wunschtag/-zeit (Di–Sa) abfragen | S (Text) / M (Buchung) | Direkt umsatzwirksam: Termin = Hauptkonversion |
| **P1** | `/de/beratung` | Café und „Probesitzen bei Kaffee“ fehlen auf der Terminseite; kein Hinweis „Samstag 10–14 Uhr“ beim Formular | 10 | Einen Satz plus Bild „Ihr Termin beginnt mit einem Kaffee“ und Öffnungszeiten neben dem Formular | S | Termin-Conversion |
| **P1** | Sofaplaner Schritt 1 | Einstieg über 90 Modellnamen und Fachbegriffe („Maße 82 %“, „Nicht-modulare Sitzfamilie“, „SX/DX“, „Penisola“). Laien wollen „Ecksofa für 4 Personen“ | 06, Protokoll SOFA ctrls | Vorgeschalteter Einstieg „Was suchen Sie?“: Form (Gerade/Ecke/U/Insel) plus Raumgröße, danach passende Modelle mit 3 Empfehlungen. „Maße 82 %“ erklären oder ausblenden. Glossar-Tooltips | M | Abbruch im ersten Schritt sinkt |
| **P1** | Produktions-Performance | Sofaplaner-Seite 28.900 px hoch, Hydration auf dem Dev-Server sehr spät. In Produktion unbekannt | Protokoll j6 (hyd 0–9) | Auf Produktions-Build Lighthouse Mobile messen (Ziel LCP < 2,5 s, TBT < 200 ms). Katalog-Daten lazy laden, Modellliste virtualisieren | M | Core Web Vitals, Ranking, Absprung |
| **P2** | Sofaplaner mobil | Der fixierte Grundriss belegt gut 45 % der Bildschirmhöhe, darunter verschwinden die Formkarten halb | 82 | Grundriss beim Scrollen auf eine Mini-Leiste einklappen (Maß + „Passt“) | S | Bedienbarkeit |
| **P2** | Startseite | Sehr lang (rund 13 Bildschirmhöhen auf dem Handy). Der Stil-Finder als bester Einstieg für Unentschlossene liegt nicht im ersten Drittel | 26 | Direkt nach dem Hero eine Karte „Noch keinen Plan? Stil finden in 2 Minuten“ | S | Engagement, Leads |
| **P2** | Stil-Finder Ergebnis | „Ihr Vorhaben: Terrasse & Garten“ wird gezeigt, obwohl das Paar einen Neubau plant. Frage 7 bietet „Neubau“ nicht so an wie das PDF-Formular | 68, Ergebnistext | Optionen von Frage 7 an die Formularwerte angleichen (Neubau, Umbau, einzelne Räume …) und ins PDF-Formular vorbefüllen | S | Lead-Qualität |
| **P2** | Cookie-Banner | Belegt auf dem Handy rund 20 % unten und überdeckt im Stil-Finder Antwortkarten | 62, 70 | Kompakter (eine Zeile plus zwei Buttons) | S | Erste Interaktion |
| **P3** | `/de/kontakt` | Große Leerfläche im Ganzseiten-Screenshot (vermutlich Einblend-Animationen) | 12 | Auf echtem Gerät gegenprüfen. Falls echt: Abstand reduzieren | S | gering |
| **P3** | Dev-only | „Schalter: NEXT_PUBLIC_FEATURE_…=1“ auf Karten | 04b | Bleibt nur im Dev (laut Code). Vor Inhaber-Demo trotzdem ausblenden, wirkt technisch | S | Demo-Eindruck |

## Quick-Wins (je unter 1 Stunde)

1. `model.js:25`: Preislabel auf „Preis auf Anfrage“ umstellen (P0).
2. Alle „Labs“/„Prototyp“-Eyebrows und Badges durch Kundensprache ersetzen (P0).
3. CTA „Termin wählen“ in „Termin anfragen“ umbenennen, bis Online-Buchung steht, und Wunschtag Di–Sa im Formular abfragen (P1).
4. Café-Satz und Öffnungszeiten auf `/beratung` neben das Formular setzen (P1).
5. Startseite: Stil-Finder-Karte direkt unter den Hero (P2).
6. Release-Gate um eine Suche nach `festzulegen|Prototyp|Labs|Freigabe` in gerenderten Texten ergänzen.

## Was das Paar am Ende tun würde

Heute: Stil-Finder fertig spielen, sich über das Ergebnis freuen, am Sonnenschirm stutzen, im Sofaplaner bei „Modell wählen“ zögern. Am Ende **eher anrufen als buchen** und das vermutlich vergessen. Mit den P0/P1-Maßnahmen: PDF anfordern (Lead), Ecksofa in Schritt 2 skizzieren, Samstagstermin mit Kaffee direkt buchen. Das ist die Reise, die zum Ziel „Nr. 1 im Dreiländereck“ passt.
