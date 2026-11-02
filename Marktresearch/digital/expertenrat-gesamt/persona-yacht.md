# Nutzertest Persona „Bootseigner Lindau / Pool-Bauherr“ (Kürzel: persona-yacht)

Stand: 28.10.2026, Branch `feature/neuauftritt`, Dev-Server localhost:3000. Der Server war stark ausgelastet, weil parallel Bauteams und Browser liefen: 50 bis 230 Sekunden pro Seitenaufruf, `networkidle` lief bei `tools/qa/shoot.mjs` in die Zeitüberschreitung. Deshalb gibt es eigene Durchgänge mit `domcontentloaded` und schrittweisem Scrollen, immer mit 1 Browser. Es wurde kein Formular abgesendet und kein Code geändert.

Screenshots: `qa-screenshots/expertenrat-gesamt/persona-yacht/`
- `desktop/de-yacht-interior--desktop--00…13.png` (Yacht-Seite, 1440 px, 14 Bildschirme)
- `szenario-a/flow-desktop-01-werfthalle.png`, `flow-desktop-02-segelyacht.png`, `flow2-01-segel.png`, `flow2.txt` (Klickpfad Segelyacht)
- `szenario-b/de-outdoor-gartenplanung--desktop--00…11.png`, `de-ezarri--desktop--00.png` (404, weiße Seite)
- `phone/de-yacht-interior--phone--00…04.png`, `phone/de-outdoor-gartenplanung--phone--00…04.png` (Pixel 7)
- `a/report.json` (Lauf von shoot.mjs, Zeitüberschreitungen wegen Serverlast)

## Note: 6,5 / 10

Die Yacht-Seite ist inhaltlich die beste Branchenseite, die ich am Bodensee kenne. Eine Webrecherche fand keinen regionalen Anbieter für Yacht-Interior mit eigener Seite, und auch keinen sichtbaren Ezarri-Händler im Raum Vorarlberg und Bodensee. Zur Zeit verliert die Persona aber an drei Stellen: (1) beide Seiten sind `noindex`, die Persona findet sie über Google also nicht; (2) die Ezarri-Welt fehlt (404), obwohl das Menü schon darauf verlinkt; (3) die Anfrage endet in einem allgemeinen Formular, das nur „Neubau/Renovierung, Haus/Wohnung“ kennt, ohne Boot und ohne Pool.

## Protokoll

### Szenario (a): Eigner einer 12-m-Segelyacht in Lindau sucht ein Interior-Refit
| Schritt | Beobachtung | Bild |
|---|---|---|
| Google „Yacht Interior Refit Bodensee“ | Seite `noindex, follow`, nicht in der Sitemap → **nicht auffindbar**. Das Wort „Refit“ steht nirgends auf der Seite (bewusst gesperrt als „Komplett-Refit aus einer Hand“). | log-desktop.json |
| Suche auf der Website: „yacht“, „boot“ | `/api/shop-search` liefert **0 Treffer**, keinen Hinweis auf die Seite Yacht-Interior | curl |
| Einstieg über Menü „Leistungen → Yacht Interior“ / Startseite | funktioniert, von DE aus gut zu erreichen | desktop--00 |
| Hero | Starker Satz „Nehmen Sie Platz – an Bord.“, CTA „Termin an Bord oder im Showroom“. Die Silhouette zeigt ein **Motorboot**, als Segler fühle ich mich nicht angesprochen. Auf dem Handy steht der CTA erst unterhalb des ersten Bildschirms. | desktop--00, phone--00 |
| „Sechs Boote, sechs Welten“ | Hochwertige KI-Bilder mit korrekter Kennzeichnung. Segelyacht ist als Kapitel vorhanden | desktop--02/04 |
| Werfthalle: Klick auf „Segelyacht“ | Der Knopf wird aktiv. Nach 8 und nach 20 Sekunden zeigen Panel und Zonen aber **weiter „Riviera Abend, Motoryacht“, Zone Flybridge**, die 3D-Fläche bleibt leer („3D wird geladen …“). Vermutlich war die Hydrierung unter der Serverlast noch nicht fertig: Die Radio-Auswahl über `has-checked` gibt ohne React eine optische Rückmeldung, aber keine Wirkung. Im Prod-Build nachprüfen. | flow-desktop-02, flow2-01 |
| Konzept „Nordwind“ (Segelyacht 12–16 m, Bodensee und Adria) | **Trifft die Persona genau**: Krängung, Feuchte, Kojenauflagen von Treca, Bettwäsche von Alonpi, Akkuleuchte von Flos, klare Aufteilung zwischen Sattler und Werft | flow2.txt |
| Materialien, Winterlager-Kalender, „Wer macht was“ | sehr glaubwürdig und ehrlich, schafft Vertrauen | desktop--09 |
| Navetta-42-Referenz (Minotti, echte Fotos) | sichtbar, obwohl die Freigabe von Minotti und Custom Line laut `yacht-minotti-navetta42-bilder.md` **noch aussteht**. Deshalb ist die ganze Seite noindex. | desktop--11/12 |
| Markenregal | Produktbilder bleiben teils als graue Platzhalter stehen (im Dev langsam, nicht abschließend bewertbar) | desktop--13 |
| CTA → /de/beratung | Formular: Schritt 1 „Neubau / Renovierung / Anderes“, Schritt 2 „Einfamilienhaus / Wohnung / gewerbliche Immobilie“. **Kein Boot, und die Herkunft geht verloren** (kein `?thema=yacht`) | Code `src/messages/de.json:278` |
| Länge | Desktop 17.772 px, Handy 23.873 px (rund 26 Bildschirme) | log |

### Szenario (b): Bauherr sucht Glasmosaik für den Pool (Ezarri), dazu Outdoor-Möbel und Gartenplanung
| Schritt | Beobachtung | Bild |
|---|---|---|
| Menü „Ezarri Glasmosaik“ → /de/ezarri | **404, und zwar als weiße, leere Seite** (kein Marken-404 mit Navigation). In Arbeit (Workflow Ezarri), der Link ist im Dev aber schon sichtbar. | szenario-b/de-ezarri--desktop--00 |
| Suche „ezarri“, „pool“, „mosaik“, „glasmosaik“ | jeweils **0 Treffer** | curl |
| /de/outdoor-gartenplanung | Klare Aufteilung der Gewerke, rechtlich sauber (GewO, § 19 BauG, § 24 GNL) | szenario-b--00/02 |
| Hero Outdoor | **Ohne Bild**, weil die Bildfreigabe fehlt (`imagery.js` released:false). Das Hero ist dadurch reine Typografie, eine emotionale Outdoor-Seite ohne Garten. | szenario-b--00, phone--00 |
| Pool | „Pool“ kommt nur als Nebenwort vor (Lead, Beschattung, Statik). Es gibt **keinen Baustein Pool & Wellness und keinen Link zu Ezarri**. Die stärkste Cross-Sell-Brücke (Mosaik + Liegen + Schirm + Licht) fehlt. | Code |
| Galerie | Platzhalter, Bilder kamen unter der Last nicht (nicht abschließend) | szenario-b--06 |
| CTA „Gartenprojekt besprechen“ | dasselbe allgemeine Formular, ohne „Garten/Pool“ als Option | Code |
| Concierge | kennt weder Ezarri noch Pool (keine Treffer in `src/lib/concierge`) | grep |

## Top-5-Stärken
1. **Ehrliche Aufteilung der Gewerke** (Platzhirsch / Bootssattler / Werft bzw. Fachbetrieb / Baumeister) auf beiden Seiten. Das ist für vermögende Eigner glaubwürdiger als „alles aus einer Hand“.
2. **Konzept „Nordwind“** trifft den 12-m-Segler genau (Krängung, Feuchte, Kojen, Akkulicht), mit echten Produkten aus dem Sortiment.
3. **Winterlager-Kalender** (Sep–Apr) und Outdoor-Saisonplan („bis Ende Januar entscheiden“) erzeugen sinnvolle Dringlichkeit.
4. **Saubere KI-Kennzeichnung** (Art. 50) und rechtlich geprüfte Formulierungen (keine Händler-Superlative, Hinweise zu § 19 BauG und § 24 GNL).
5. **Kaum Wettbewerb**: Eine Webrecherche fand weder Yacht-Interior noch Ezarri-Händler am Bodensee mit eigener Seite, das Feld ist bei Google frei.

## Befunde

| Prio | Seite/Datei | Befund | Beleg | Maßnahme | Aufwand | Wirkung |
|---|---|---|---|---|---|---|
| P0 | `src/app/[locale]/yacht-interior/page.js` (index:false), `src/components/Yacht/NavettaReference.js` | Die Seite ist noindex, weil die Navetta-Fotos keine Freigabe haben. Das widerspricht der Inhaber-Entscheidung Nr. 9 (28.10.): „wird innerhalb der integrierten Seite gelöst (Bild weglassen/ersetzen) … nicht durch Verstecken“ | robots `noindex, follow`; Kommentar in page.js | Navetta-Block hinter einen Freigabe-Schalter (z. B. `NAVETTA_RELEASED=false` → Block nicht rendern oder nur als Text mit Link zu minotti.com), dann `index:true` setzen und den Eintrag in `extraPages.js`/llms.txt wieder aufnehmen | S | hoch: einzige Seite für „Yacht Interior Bodensee“ |
| P0 | `src/lib/features.js` (`flagOn`: Produktion ohne Variable = aus) | Feature-Schalter sind in Produktion standardmäßig AUS. Entscheidung Nr. 9 verlangt „standardmäßig AN“ | Zeilen 44–49 | Regel umkehren (fehlend = an) oder die Variablen im Deploy setzen, dazu ein Test | S | hoch: sonst fehlen Yacht, Outdoor und Ezarri in Menü und Startseite |
| P0 (in Arbeit) | Menü „Ezarri Glasmosaik“ → `/de/ezarri` | 404, und als **weiße Seite ohne Navigation** | szenario-b/de-ezarri--desktop--00.png | Ezarri-Welt fertigstellen. Bis dahin den Menüpunkt nur zeigen, wenn die Route existiert. Prüfen, warum das 404 leer bleibt (`not-found.js` unter `[locale]`) | M | hoch: toter Link im Hauptmenü |
| P0 | `src/app/[locale]/outdoor-gartenplanung/page.js` (index:false) | Outdoor ist noindex „bis zur Rechtsprüfung“, die Texte sind aber schon GewO-konform formuliert | robots | Rechtsprüfung abschließen, dann `index:true` und Sitemap; laut Entscheidung 9 nicht verstecken | S | hoch: „Gartenplanung Bodensee“, „Outdoor Möbel Vorarlberg“ |
| P1 | `/de/beratung` (`src/messages/de.json:278–287`, `LandingClosing` → `ROUTES.beratung.de`) | Alle Branchen-CTAs landen im allgemeinen Formular: kein Boot, kein Garten/Pool, die Herkunft geht verloren | Code | `?thema=yacht|outdoor|ezarri` mitgeben, im Formular vorauswählen; Schritt 1 um „Boot/Yacht“ und „Garten/Pool“ erweitern; für Boote die Felder „Bootstyp/Länge/Liegeplatz/Winterlager“ | M | hoch: Leadqualität, schnellere Rückmeldung |
| P1 | `/api/shop-search` | „yacht“, „boot“, „pool“, „ezarri“, „mosaik“, „gartenplanung“ liefern 0 Treffer | curl-Ergebnisse | Leistungsseiten als eigene Trefferart „Seiten“ in die Suche aufnehmen (Synonymliste) | S | mittel |
| P1 | `outdoor-gartenplanung` Inhalt | Kein Baustein „Pool & Wellness“, kein Link zu Ezarri | Code, Leistungen 7 Bausteine | 8. Baustein „Pool & Wasser“: Glasmosaik von Ezarri (Platzhirsch als Vertragshändler), Liegen, Schirme, Licht; Ausführung Poolbauer/Fliesenleger. Querverweis Ezarri ↔ Outdoor ↔ Yacht (Bootshaus) | S | hoch: Warenkorb Pool = Mosaik + Möbel |
| P1 | Outdoor-Hero (`imagery.js` released:false) | Hero ohne Bild, das wirkt wie ein Textdokument | outdoor--00 | ein freigegebenes eigenes Foto (Showroom-Terrasse, Café) oder ein gekennzeichnetes KI-Bild wie bei Yacht | S | mittel (Absprung) |
| P1 | Werfthalle (`src/components/Yacht/Werfthalle.js:329`) | Unter Last zeigt die Bootstyp-Wahl optisch „Segelyacht“, Panel und Zonen bleiben aber bei der Motoryacht (Flybridge). Es fehlt eine Rückmeldung, solange JS noch nicht bereit ist | flow2-01-segel.png, flow2.txt | Im Prod-Build mit gedrosselter CPU nachtesten. Radios bis zur Hydrierung `disabled` lassen oder `checked` nicht über reines CSS spiegeln | S | mittel |
| P1 | Yacht, Handy | 23.873 px Seitenlänge, der CTA liegt im ersten Bildschirm unter der Grafik | phone--00 | Sticky-CTA „Termin an Bord“ auf dem Handy; Navetta, Marken und FAQ einklappbar | S | mittel |
| P2 | Yacht, Wording | „Refit“ fehlt komplett. Das ist der Suchbegriff der Eigner („Interior Refit“, „Polster erneuern“, „Bootspolster neu beziehen“) | Volltext | Formulierung „Interior-Refit im Winterlager – Gestaltung von uns, Ausführung durch Sattler und Werft“ (nicht „Komplett-Refit aus einer Hand“), dazu eine FAQ „Polster neu beziehen“ | S | mittel (SEO) |
| P2 | Yacht, Startzustand Werfthalle | Startet mit der Mittelmeer-Motoryacht (20–30 m), Hero-Silhouette Motorboot | page.js `initial: "motoryacht-riviera"` | Bodensee-Bezug: Start mit Daycruiser oder Segelyacht; im Hero Segel und Motor gleichwertig | S | gering-mittel |
| P2 | Yacht/Outdoor nur DE | Mittelmeer-Eigner (IT, CH-FR, EN) sehen DE oder 404 | page.js `locale !== "de"` | Mindestens EN und IT für Yacht (Adria), FR/IT für Ezarri | M | mittel |
| P2 | Concierge | kennt Ezarri, Pool und Mosaik nicht | grep `src/lib/concierge` | Wissensbasis und Aktionen um Ezarri, Pool und Yacht-Termin ergänzen | S | gering-mittel |
| P3 | `src/lib/yacht/concepts.json` `recht.keineAussagen` | Ausnahme lautet noch „außer ClassiCon“, Ezarri fehlt | Zeile 14 | auf „außer ClassiCon und Ezarri“ anpassen (Konsistenz mit Entscheidung 7) | S | gering |
| P3 | Yacht → Ezarri | Ezarri-Glasmosaik passt auch zu Bad und Dusche auf Yachten oder im Bootshaus. Es gibt keine Brücke | – | nach der Ezarri-Freigabe einen Satz und Link bei der Zone „Bad“ (Ausführung Werft) | S | gering |

## Quick-Wins (je unter 1 Stunde)
1. Navetta-Block hinter einen Freigabe-Schalter legen und die Yacht-Seite auf `index:true` setzen, mit Sitemap- und llms-Eintrag.
2. CTA-Links mit `?thema=yacht` / `?thema=outdoor` / `?thema=ezarri` versehen und im Formular eine Option „Boot/Yacht“ bzw. „Garten/Pool“ ergänzen.
3. Den Menülink „Ezarri Glasmosaik“ erst zeigen, wenn `/de/ezarri` 200 liefert.
4. Ein Satz „Interior-Refit im Winterlager“ im Lead und eine FAQ „Bootspolster neu beziehen?“.
5. Im Outdoor-Baustein „Beschattung“/Lead einen Link „Pool mit Glasmosaik von Ezarri“ setzen.
6. Die Leistungsseiten als Treffer in die Site-Suche aufnehmen.

Quellen zur Wettbewerbsrecherche (WebSearch 28.10.2026): yacht.de „Ein Refit des Interieurs einer Yacht“ (https://www.yacht.de/diy/pflege/modernisierung-ein-refit-des-interieurs-einer-yacht-bietet-viele-moeglichkeiten/), Monaco Marine Interior Refit (https://www.monacomarine.com/en/shipyards/beaulieu/yacht-interior-refit), Ezarri Mosaiktypen (https://www.ezarri.com/de/types-of-mosaics). Am Bodensee wurde kein Anbieter mit eigener Yacht-Interior-Seite und kein Ezarri-Händler gefunden.
