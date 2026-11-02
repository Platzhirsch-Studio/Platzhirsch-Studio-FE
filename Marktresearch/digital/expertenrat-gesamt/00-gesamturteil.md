# Expertenrat Gesamturteil: Neuauftritt Platzhirsch Home Living

**Stand:** 28.10.2026 · **Vorsitz:** Digitalchef (Luxus-Interior) · **Branch:** `feature/neuauftritt`
**Grundlage:** 16 Gutachten in diesem Ordner (perf-prod, seo-tech, seo-content, conversion, ux-mobile, art-direction, lektorat, recht-uwg, recht-dsgvo, security, a11y, persona-ch, persona-paar, persona-yacht, wettbewerb, analytics) sowie `00-inhaber-usp-handzeichnung.md` und `teamleiter/inhaber-entscheidungen.md`. Ich habe Stichproben im Code gemacht und nichts geändert.

**Vorbehalt zur Messung:** Der Dev-Server war während fast aller Prüfungen überlastet. Zeitweise antwortete er überall mit HTTP 500, weil `src/lib/upload/store.js` noch Baustelle war. Performance und a11y wurden deshalb auf Produktions-Builds gemessen, viele andere Befunde stammen aus dem Code. Einige Punkte sind inzwischen schon in Arbeit oder erledigt. Stichprobe vom 28.10., ca. 05:00:
- `/de/arbeitsweise` und die Ezarri-Routen sind angelegt.
- `EZARRI_PUBLIC` steht noch auf `false`.
- `VERIFIED_DEALER_BRANDS` enthält nur `classicon`.
- `flagOn()` ist in Produktion standardmäßig AUS.
- `BOOKING_PROVIDER` steht auf `none`, die Knöpfe sagen trotzdem „Termin wählen“.
- `[Preis vom Inhaber festzulegen]` steht noch im Küchenplaner und im Dreiländer-Rechner.

---

## 1. Gesamtnote und Livegang-Urteil

**Gesamtnote: 6,5 / 10.** Der Mittelwert der 16 Noten liegt bei 6,8. Ich ziehe 0,3 ab, weil die Lücken bei Beweisen und Inhalten mehr Umsatz kosten, als die Technik gewinnt.

**Bereit für den Livegang? Nein, noch nicht.**

1. Technisch ist die Seite schon heute die beste im Dreiländereck. Das gilt für Desktop-Performance 98–99, CLS 0, 4 Sprachen mit hreflang, Barrierefreiheit 8/10, Consent ohne Datenabfluss und Funktionen, die kein Wettbewerber hat, auch Minotti.com nicht.
2. Es gibt aber 22 P0-Blocker. Vier Gruppen sind besonders schwer: zwei Sicherheitslücken (Next.js-Advisory, XSS im CMS-Filter), veraltete Datenschutz- und Cookie-Texte, Bilder ohne Freigabe (Yacht/Navetta, Herstellerbilder) und der drohende Verlust der 5 heute indexierten Stadtseiten.
3. Die Verkaufsstrecke verspricht „Termin wählen“, bietet aber keinen Termin. Alle Einstiege landen in einem Neubau-Formular, und mehrere Planer senden noch keine Anfrage oder geben ihren Kontext nicht weiter.
4. Ihr wichtigster Unterschied zu den anderen ist auf der Seite noch nicht zu sehen. Ihre Handzeichnungen und Modelle fehlen, es gibt keine Projekte und keine Bewertungen, und rund 90 % der Bilder kommen von Herstellern oder aus Stock-Archiven.
5. Die meisten Code-Blocker lassen sich in 1–2 Wochen beheben. Der Engpass sind Ihre Lieferungen: Fotos, Projekte, Freigaben, Entscheidungen zu Termin und Preis, dazu die Freigabe durch den Anwalt. Live geht die Seite erst, wenn alle P0 erledigt sind und eine neue Ratsprüfung auf einem ruhigen Produktions-Build mindestens 9/10 ergibt (Entscheidung 9).

---

## 2. Alle P0-Blocker (dedupliziert)

| # | Blocker | Quelle | Wer | Aufwand |
|---|---|---|---|---|
| P0-1 | `next@16.3.8` hat 2 kritische und 1 hohe Advisory, die DoS-Lücke über Server Actions ist ausnutzbar (CHF-Rechner, Portal). Lösung: auf 16.4.3 heben, `npm audit fix`, dazu eine Audit-Prüfung in der CI | security | Code | S |
| P0-2 | Stored XSS in `sanitizeCmsHtml` (`src/lib/shop/shopProducts.js:77`): Ein nicht geschlossener Tag führt Script aus, und das auf derselben Domain wie das Kundenportal | security | Code | S |
| P0-3 | Release-Gate fehlt: Halbfertiger Code (`upload/store.js`) hat die ganze Seite einschließlich Sitemap lahmgelegt. Pflicht vor jedem Deploy: `next build`, Prod-Crawl mit allen Sitemaps 200 und 0 noindex in der Sitemap, Smoke-Test am Handy, axe | seo-tech, ux-mobile | Code | S |
| P0-4 | Datenschutzerklärung veraltet: Sie nennt TKG 2003 und Privacy Shield, Maps, Ads und Drittland fehlen. Den Entwurf `LegalDrafts/docs/datenschutz.js` vom Anwalt freigeben lassen und umstellen | recht-dsgvo | Anwalt + Code | M |
| P0-5 | Cookie-Banner mit Plugin-Vorlagetexten: Zwecke fehlen, „berechtigtes Interesse“ wird behauptet, Art. 49 widerspricht dem DPF, ein Satz bricht ab, der GTM-Schalter wirkt nicht. Die Einwilligung ist damit unwirksam | recht-dsgvo | Code + Anwalt | S |
| P0-6 | Beim Newsletter fehlt ein sichtbares Double-Opt-in, und die Antwort verrät, ob eine Adresse schon angemeldet ist (§ 174 TKG) | recht-dsgvo | Backoffice + Code | S–M |
| P0-7 | Yacht/Navetta: Fotos von Minotti und Custom Line liegen ohne Freigabe öffentlich in `public/labs/yacht/minotti-navetta42/`. Die Dateien entfernen und den Block durch eigene Illustration oder eigenes Foto ersetzen. Die Seite selbst bleibt sichtbar (siehe Abschnitt 4) | recht-uwg, persona-yacht | Code | S |
| P0-8 | `/labs/**` und andere Pfade mit nicht freigegebenen Bildern ohne `X-Robots-Tag: noimageindex` | recht-uwg | Code | S |
| P0-9 | Herstellerbilder ohne Freigabe: 1.274 Einträge stehen auf „offen“, das Poliform-Küchenbild läuft auf 5 Landingpages. Mindestens die Hero- und Landing-Bilder von Nicht-Vertragsmarken ersetzen oder dafür Freigaben einholen | recht-uwg, art-direction | Inhaber + Code | M–L |
| P0-10 | Die 5 Stadtseiten Bregenz, Dornbirn, Lindau, Friedrichshafen und St. Gallen sind heute live indexiert und würden mit dem Relaunch noindex. Lösung: je 3–4 eigene Ortsfakten, sonst indexiert lassen | seo-content, seo-tech | Code (Text) | M |
| P0-11 | Adresse uneinheitlich: Live steht Landstraße 9, neu Landstraße 11. Das Google-Profil muss am Deploy-Tag gleichzeitig umgestellt werden, danach Herold, ClassiCon, Bing und Apple | seo-content | Inhaber | S |
| P0-12 | „Termin wählen“ ohne Termin-Auswahl (`BOOKING_PROVIDER=none`) | conversion, persona-paar, wettbewerb | Inhaber-Entscheidung + Code | S/M |
| P0-13 | Ein einziges Neubau-Formular für alle Anlässe; Stil, Concierge und Anlass gehen beim Übergang verloren; Links fest auf `/de/` | conversion, persona-yacht | Code | M |
| P0-14 | Planer ohne Versand: Der Sofaplaner sendet nichts. Kein Feature darf sichtbar werden, solange sein Versand nicht live ist | conversion | Code | S |
| P0-15 | Interne Texte vor Kunden: „vom Inhaber festzulegen“, „Labs · Prototyp“, „Stufe 2b von 3“, Drahtgitter-Quader im AR-Viewer, fehlende Hub-Bilder | persona-paar, art-direction, recht-uwg | Code | S |
| P0-16 | Entscheidung 9 nicht umgesetzt: Die Schalter sind in Produktion standardmäßig AUS, es gibt keine sprechenden URLs außerhalb von `/labs` (`/de/sofaplaner` und `/de/kuechenplaner` liefern 404), und Yacht und Outdoor sind noindex. *In Arbeit (Feinschliff-Armee, Labs-Team)* | wettbewerb, persona-paar, persona-yacht, seo-tech | Code | M |
| P0-17 | Ezarri: Die Links zeigen auf eine Seite, die es noch nicht gibt (404, weiße Seite). Ezarri fehlt in `VERIFIED_DEALER_BRANDS` und im `CLAIM_REGISTER`, und es gibt zwei Schalter. *In Arbeit (Ezarri-Workflow)* | persona-yacht, recht-uwg, seo-tech | Code | M |
| P0-18 | Produktsuche findet keine Produkte („Minotti Sofa“, „Twiggy“), und Fehler werden still verschluckt | persona-ch | Code | M |
| P0-19 | Produktseiten zeigen HTTP 500, wenn das Backoffice nicht rechtzeitig antwortet. Lösung: ISR/stale-while-revalidate statt Fehlerseite, dazu ein Lasttest | persona-ch, perf-prod | Code + Backoffice | M |
| P0-20 | Kern-USP Handzeichnung und Modell auf der Startseite nicht sichtbar. Es gibt 10 leere Bildplätze, und `/de/arbeitsweise` ist nirgends verlinkt. Ohne echtes Material darf kein sichtbarer Platzhalter live gehen | art-direction, wettbewerb, USP-Vorgabe | Inhaber (Material) + Code | M |
| P0-21 | `/projekte` ist leer („Noch keine Projekte veröffentlicht“). Lösung: 3 Projekte mit Einwilligung, sonst die Seite aus Menü und Sitemap nehmen | art-direction, ux-mobile | Inhaber + Code | S/L |
| P0-22 | Die Erklärung zur Barrierefreiheit nach BaFG gibt es nur als Gerüst, Pflicht spätestens vor Gutschein, Termin und Zahlung | a11y | Anwalt + Code | S |

Aus der Messung von Umsatz und Tracking kommen drei P0 hinzu: Euro-Wert pro Lead, strukturierte Lead-Felder im Backoffice und die Ads-ID. Für das Umsatzziel sind sie Pflicht. Für den Livegang selbst blockieren sie nicht. Ich führe sie daher als **P0-Messbarkeit**: Sie müssen bis zum Start der ersten Kampagne stehen, nicht bis zum Deploy (siehe Maßnahmen 23–25).

---

## 3. Priorisierte Maßnahmenliste (40 Punkte)

Aufwand: S ≤ ½ Tag · M ≤ 2 Tage · L > 2 Tage. Wirkung: U = Umsatz, R = Ranking, Risk = Rechts- oder Sicherheitsrisiko.

| # | Prio | Maßnahme | Begründung | Dateien / Seiten | Aufwand | Wirkung | Wer |
|---|---|---|---|---|---|---|---|
| 1 | P0 | Next auf 16.4.3 heben, `npm audit fix`, `npm audit --audit-level=high` als CI-Prüfung | ausnutzbare DoS-Lücke | `package.json` | S | Risk hoch | Code |
| 2 | P0 | `sanitizeCmsHtml`: übrige `<` escapen oder `sanitize-html` einsetzen, dazu Regressionstests | XSS auf derselben Domain wie das Portal | `src/lib/shop/shopProducts.js` | S | Risk hoch | Code |
| 3 | P0 | Release-Gate als Skript: Build, Prod-Crawl (`crawl.mjs`), `r4-seo.spec`, axe, Lighthouse-Budget, Handy-Smoke-Test, alles mit 1 Worker | Parallelteams haben die Seite lahmgelegt | `tools/qa/`, CI | S | R, U | Code |
| 4 | P0 | Datenschutzerklärung auf den freigegebenen Entwurf umstellen, Abschnitte zu Stil-Finder und Labs-Diensten modular | veraltet, abmahnfähig | `Datenschutz/datenschutz.js`, `LegalDrafts/docs/datenschutz.js` | M | Risk | Anwalt + Code |
| 5 | P0 | Banner-Texte neu schreiben (DE/EN/FR/IT), GTM-Schalter entfernen | Einwilligung unwirksam, Daten unbrauchbar | `src/messages/*.json` `Cookies.*`, `services.js` | S | Risk, Datenbasis | Code + Anwalt |
| 6 | P0 | Newsletter mit Double-Opt-in samt Protokoll und gleicher Antwort für alle Adressen | § 174 TKG, Enumeration | `src/lib/forms/newsletter.js`, Backoffice/Brevo | S–M | Risk, Liste nutzbar | Backoffice + Code |
| 7 | P0 | Navetta-Bilder aus `public/` entfernen, Block durch eigenes Material ersetzen, `noimageindex` für Bildpfade ohne Freigabe | Urheberrecht, schützt die Minotti-Beziehung | `Yacht/NavettaReference.js`, `next.config.js`, `robots.js` | S | Risk | Code |
| 8 | P0 | Poliform- und andere Bilder von Nicht-Vertragsmarken auf Landingpages ersetzen; Standardanfrage an Minotti, Poliform und Rimadesio | Herstellerbilder ohne Freigabe | `kuechen-vorarlberg`, `designermoebel-*`, `bildrechte.csv` | M | Risk | Inhaber + Code |
| 9 | P0 | 5 Stadtseiten auf ≥ 4 eigene Fakten ausbauen (Vorlage Liechtenstein/Rheintal). Wenn nicht rechtzeitig fertig: indexiert lassen | Rankings bleiben erhalten | `designermoebel-{bregenz,dornbirn,lindau,friedrichshafen,st-gallen}`, `doorwayAudit.js` | M | R sehr hoch | Code |
| 10 | P0 | NAP-Umstellung am Deploy-Tag: zuerst Google-Profil, dann Herold, ClassiCon, WKO, Bing, Apple. Place-ID nachtragen | Local Pack | extern, `src/lib/site.js` | S | R hoch | Inhaber |
| 11 | P0 | Knöpfe auf „Termin anfragen“ umbenennen, Wunsch-Halbtage (Do/Fr/Sa) als Chips. Sobald entschieden: `BOOKING_PROVIDER=link` mit Samstagsterminen | eingelöstes Versprechen | `de/en/fr/it.json`, `BeratungClient.js`, `Booking/config.js` | S | U hoch | Code + Inhaber |
| 12 | P0 | Beratungsformular: Schritt 1 „Worum geht es?“ (Sofa, Küche, Outdoor, Yacht, Bad/Mosaik, Projekt, „Ich plane für eine Bauherrschaft“), Vorauswahl über `?anlass=`, dazu `stil`, `quelle` und `notiz` übernehmen, Links abhängig von der Sprache | Lead-Qualität, ein Schritt weniger | `BeratungClient.js`, Yacht/Outdoor/Ezarri-Landings, `StilResult.js`, `ChatCore.js` | M | U hoch | Code |
| 13 | P0 | Feature-Schalter technisch daran koppeln, dass der Versand funktioniert; Sofaplaner über `/api/upload/inquiry/beratung` senden lassen | keine Leads ins Leere | `Labs/Sofaplaner/ResultPanel.js`, `features.js` | S | U hoch | Code |
| 14 | P0 | Alle internen Texte und Platzhalter aus der Kundenansicht entfernen: „vom Inhaber festzulegen“ wird zu „Preis auf Anfrage“; „Labs/Prototyp“, Statustexte und Drahtgitter-Quader weg; Produkte ohne 3D-Modell nicht verlinken | Vertrauen, UWG | `Kuechenplaner/catalog.js`, `Dreilaender/pricing.js`, `Sofaplaner/model.js`, AR-Viewer, LabsHub | S | U | Code |
| 15 | P0 | Entscheidung 9 umsetzen: sprechende URLs (`/de/sofaplaner`, `/de/kuechenplaner`, `/de/stil-finder`, `/de/ar-ansicht` …) mit 308 von `/labs`, Schalter standardmäßig AN, Yacht und Outdoor auf `index:true`, Hub-Bilder, alle 4 Sprachen. Ausblendregeln für CTA-Leiste und KI-Knopf mitziehen | stärkste Burggräben sind heute unsichtbar | `features.js`, `labs/**`, `routes`, `sitemap`, `llms.txt` | M | R, U hoch | Code |
| 16 | P0 | Ezarri fertigstellen: `EZARRI_PUBLIC` als einziger führender Schalter, Ezarri in `VERIFIED_DEALER_BRANDS` und `CLAIM_REGISTER` mit dem Wortlaut aus dem Vertrag, Brand-Schema, Menülink erst, wenn die Route besteht, 404-Seite mit Navigation | Händler-USP, toter Link | `src/lib/ezarri/config.js`, `src/lib/legal/claims.js`, `shellNav.js`, `not-found.js` | M | R, U | Code |
| 17 | P0 | Suche: Mehrwort-Suche (Marke plus Typ), Fehler protokollieren, Vorschläge bei 0 Treffern, Leistungsseiten mit aufnehmen (Yacht, Pool, Ezarri, Mosaik) | Suchende sind kaufnahe Besucher | `api/shop-search/route.js`, `fetchAllProdukte.js` | M | U | Code |
| 18 | P0 | Produktseiten robust machen: ISR 24 h mit Aktualisierung bei Änderung, bei Timeout die letzte gute Fassung statt 500, Lasttest | 500 für Google und Kunden | `produkte/[category]/[product]/page.js` | M | R, U | Code + Backoffice |
| 19 | P0 | Kern-USP: dunkles Kapitel „Handzeichnung → Modell → 3D → Rendering“ auf der Startseite, `/de/arbeitsweise` im Menü, Hinweis „Harald zeichnet Ihr Konzept anschließend von Hand“ auf allen Planern. Nur echtes Material verwenden | der Kern-USP, den niemand kopieren kann | `Home/*`, `Arbeitsweise/*`, Planer | M | U sehr hoch | Inhaber (Material) + Code |
| 20 | P0 | Fotoshooting nach Bibel §7 (2 Tage): Showroom, Café, Kerstin und Harald beim Zeichnen, Modelle. Dazu Bildregister, Dubletten entfernen und Kerstins Porträt auf die Startseite | ersetzt Herstellerbilder, E-E-A-T | `public/Images`, Startseite | L | U, R, Risk | Inhaber + Code |
| 21 | P0 | `/projekte`: 3 Projekte mit Einwilligung und der Kette Skizze → Rendering → Foto. Bis dahin aus Menü und Sitemap nehmen | leere Seite schadet | `projekte`, `shellNav.js`, Sitemap | S/L | U | Inhaber + Code |
| 22 | P0 | Erklärung zur Barrierefreiheit `/de/barrierefreiheit` mit Link im Footer; Screenreader-Test (NVDA, VoiceOver) als Grundlage | BaFG | `LegalDrafts/docs/barrierefreiheit.js` | S | Risk | Anwalt + Code |
| 23 | P0-M | `generate_lead` mit `value` und `currency:"EUR"` je Formulartyp | Umsatzmessung | `src/lib/analytics.js` | S | U-Steuerung | Code + Inhaber (Werte) |
| 24 | P0-M | Backoffice-Felder `lead_ref`, Kanal, Kampagne, gclid, Status, Auftragswert | „Umsatz je Kanal“ | `src/lib/forms/forward.js`, Frappe | M | U-Steuerung | Backoffice + Code |
| 25 | P0-M | Ads-ID `AW-…`, Enhanced Conversions, Offline-Import der Aufträge | Kampagnen nach Wert steuern | `services.js`, Ads | M–L | U | Inhaber + Code |
| 26 | P1 | Minotti-Produktseiten: Maße und Technical Sheet aus `src/lib/sofaplaner/minotti/*.json`, Knöpfe „In 3D/AR ansehen“ und „Als Sofa planen“ | Architekten und Planer entscheiden über Daten | Produktseite, `ShopCatalog` | M | U, R | Code |
| 27 | P1 | Eigene Produkttexte (62) und 3 Ratgeber (Designerküche, Pflege, Lieferzeiten) prüfen und freigeben, im Footer verlinken | Duplicate Content, Themenautorität | `ratgeber`, Produkttexte | M | R hoch | Inhaber + Anwalt |
| 28 | P1 | „ganz Österreich“ durch die Dreiländereck-Formulierung ersetzen (37 Stellen); Startseiten-Title „Einrichtungsstudio“; Glossar Showroom/Studio | Positionierung, CTR | 19 Dateien, `de.json` | S | R | Code |
| 29 | P1 | Markenseiten schärfen, Minotti zuerst: H1, Meta-Beschreibung ≥ 140 Zeichen, mehr Produkte verlinken | Markensuche | `ueber-uns/marken/[title]` | M | R | Code |
| 30 | P1 | Schweiz-Hub vom Steuerberater freigeben lassen, indexieren und von St. Gallen und den Produktseiten aus verlinken; MWST-Frage klären | CH-Umsatz | `einkaufen-aus-der-schweiz` | S | U, R | Inhaber + Anwalt |
| 31 | P1 | Mobil: CTA-Leiste und KI-Knopf beim Tippen in ein Feld ausblenden, KI-Knopf in die Leiste integrieren, Termin-Knopf ganz oben auf der Yacht-Seite | 125 px verdeckt, Formular-Abbrüche | Shell, `YachtLanding.js` | S | U | Code |
| 32 | P1 | Merkliste-Anfrage nur mit Name, E-Mail oder Telefon und Land; Telefon im Beratungsformular optional | 8–10 Pflichtfelder bremsen | `merkliste`, `BeratungClient.js` | S | U | Code |
| 33 | P1 | Vertrauensmodul: Ansprechperson mit Foto, Antwortzeit im Danke-Text, echte Kundenstimmen, Bewertungslink (Ziel 30 Google-Bewertungen) | fehlende Beweise | Startseite, Danke-Seiten | S | U | Inhaber + Code |
| 34 | P1 | CSP: Report-Endpunkt und für das Portal sofort scharf; Portal-IP einheitlich auslesen, Logout entwertet die Sitzung, Demo-Adapter in Produktion blockiert, Moodboard-Mail nur an bestätigte Adressen; `/cms/files`-Proxy entfernen | Portalsicherheit | `next.config.js`, `src/lib/portal/*` | M | Risk | Code |
| 35 | P1 | Labs-Datenschutz vor dem Freischalten: EXIF/GPS aus HEIC und Video entfernen, Löschfristen für den Concierge, AVV mit Anthropic und Brevo, DSFA, Einwilligung für `fbclid`/`msclkid` | DSGVO | `src/lib/upload/*`, Concierge, Attribution | M | Risk | Code + Anwalt |
| 36 | P1 | Performance: Bodoni-Kursiv nicht vorladen, Merkliste/Suche/Banner später nachladen, `zod/mini` in den Planern, Yacht nur mit Hero-Preload, `data.server.js` eingrenzen; danach auf einem ruhigen Rechner nachmessen | mobiles LCP ≤ 2,0 s | Fonts, `layout.js`, Planer, `data.server.js` | M | R, U | Code |
| 37 | P1 | Rechtliche Feinheiten: „Sofaplaner für Minotti-Modelle“ mit Markenhinweis, Beispiel-Lieferkosten entfernen, Outdoor-Leuchten dem Elektrotechniker zuordnen (§ 94 GewO), „Innenarchitektur“ prüfen | UWG, GewO | Sofaplaner, Outdoor, Über uns | S | Risk | Code + Anwalt |
| 38 | P1 | Sofaplaner barrierefrei: ein Tab-Stopp für den Katalog, Sprunglink „Zum Plan“, Live-Ansage; Fokusfehler auf der Yacht-Seite beheben | WCAG, BaFG | Sofaplaner, Yacht | M | Risk | Code |
| 39 | P2 | Moodboard und Startseiten-Produkte mit festen Ersatzstücken (≥ 6), Katalog nie mit „0 Stücke“ | leere Zustände bei Backoffice-Ausfall | Stil-Finder, ShopCatalog | S | U | Code |
| 40 | P2 | Ezarri- und Pool-Brücke von der Outdoor-Seite, Händlerlistung auf ezarri.com (Backlink), Bing und IndexNow, Looker-Studio-Bericht mit Umsatz-Cockpit, alte Landingpages im Stil der Yacht- und Outdoor-Texte umschreiben | Reichweite, Steuerung | Outdoor, extern, Landings | M–L | R, U | Code + Inhaber |

---

## 4. Widersprüche zwischen den Gutachten und meine Entscheidung

| # | Widerspruch | Positionen | Entscheidung des Vorsitzes |
|---|---|---|---|
| W1 | **Yacht: verstecken oder indexieren?** | UWG: Links an `NEXT_PUBLIC_FEATURE_YACHT` hängen, Navetta-Kapitel ausbauen. Persona-Yacht und Wettbewerb: Seite auf `index:true` | Entscheidung 9 gilt: **Die Seite wird integriert und indexiert, nur die Navetta-Bilder kommen weg.** Die Dateien werden aus `public/` gelöscht, der Block nutzt eigene Illustration und Text ohne Herstellerfotos. Die Links bleiben. Ein Schalter allein reicht nicht, weil die Dateien weiter abrufbar wären. |
| W2 | **Stadtseiten: noindex (Doorway-Schutz) oder indexiert?** | SEO-Tech: ausbauen, dann indexieren. SEO-Content: im Zweifel indexiert lassen | **Bis zum Livegang ausbauen (P0-10).** Ist das nicht fertig, bleiben die Seiten indexiert, und die Doorway-Schwelle für diese 5 Seiten wird für 4 Wochen ausgesetzt. Ein Rankingverlust ist sicher, eine Abwertung als Doorway nur möglich. |
| W3 | **Feature-Schalter standardmäßig AN, aber Datenschutz und Sicherheit sind für Concierge, Upload und Portal noch nicht fertig** | Personas und Wettbewerb: alles AN. DSGVO und Security: Concierge, Upload und Portal erst nach AVV, DSFA und Portal-Fixes | Standard **AN**, wie entschieden. Für Concierge, Handy-Upload und Portal steht im Deploy aber ausdrücklich `=0`, bis die Maßnahmen 34 und 35 erledigt sind. Die Planer (Küche, Sofa, AR, Stil-Finder), Yacht, Outdoor und Ezarri gehen AN, sobald ihr Versand und die Maßnahme 14 erledigt sind. |
| W4 | **`/labs/**`: noindex/noimageindex oder indexierbar?** | UWG: X-Robots-Tag und Disallow für `/labs/`. SEO und Wettbewerb: Labs indexierbar | Die **HTML-Seiten ziehen auf sprechende URLs** und werden indexiert. Die alten `/labs`-URLs leiten mit 308 um. Für **Bildpfade ohne Freigabe** gilt `X-Robots-Tag: noimageindex`, ohne Disallow. Ein Disallow würde Google die 308-Umleitungen nicht sehen lassen. |
| W5 | **Online-Kalender sofort oder „Termin anfragen“?** | Wettbewerb: echter Kalender ist P0. Conversion: Variante (a) umbenennen genügt | Zum Livegang Variante (a), denn sie ist sofort ehrlich. Den Kalender (`BOOKING_PROVIDER=link`, Samstagsslots) schalten wir frei, sobald Sie entscheiden, wer die Termine pflegt. Die Seite wartet nicht auf den Kalender. |
| W6 | **Analytics-P0 als Livegang-Blocker?** | Analytics: P0. Alle anderen: kein Blocker | Kein Blocker für den Deploy, aber Pflicht vor dem ersten bezahlten Euro Werbung (P0-M). |
| W7 | **Performance-Budgets als harte Bedingung?** | Perf: keine echten P0, solange die Budgets nicht hart gelten. Bibel E1: CI bricht ab | Mobiles LCP ≤ 2,5 s (Core Web Vitals „gut“) ist das harte Gate. Das Bibel-Ziel 2,0 s ist P1 und muss 4 Wochen nach Livegang erreicht sein. Gemessen wird auf einem ruhigen Rechner. |
| W8 | **Kern-USP: Platzhalter oder ausblenden?** | Art Direction: P0, Kapitel sofort bauen. USP-Regel: keine sichtbaren Platzhalter im Livegang | Kapitel und Seite bauen. Ohne echtes Material von Harald zeigen sie **eine Fassung nur aus Text und Typografie** (Prozess in 7 Schritten, ohne Bildplätze). Es gibt keine KI-Skizzen und keine Rahmen mit „Bild folgt“. Die Bilder kommen nach dem Shooting dazu. |
| W9 | **/projekte füllen oder ausblenden?** | Art Direction: füllen. UX: leere Seiten verhindern | Ausblenden ist der Standard: Menü und Sitemap bekommen sie erst ab 3 Projekten mit Einwilligung. |
| W10 | **Zwei Ezarri-Schalter** (`EZARRI_PUBLIC`, `NEXT_PUBLIC_FEATURE_EZARRI`) | UWG: einer muss führen | `EZARRI_PUBLIC` führt (Entscheidung 7). Der Feature-Schalter steuert nur, ob Ezarri in Menü und Startseite erscheint, und hat keine Wirkung, wenn `EZARRI_PUBLIC=false`. Ein Test sichert das ab. |

---

## 5. Die 5 Hebel mit dem größten Umsatzeffekt

1. **Kern-USP sichtbar machen und 3 echte Projekte zeigen** (Maßnahmen 19–21). Im Premiumsegment kauft der Kunde den Designer, nicht das Möbel. Mit Handzeichnung, Modell, Rendering und fertigem Raum hebt sich Platzhirsch von jedem Katalog-Händler ab und rechtfertigt Projekte im fünf- bis sechsstelligen Bereich. Das ist der größte Einzelhebel für die Abschlussquote.
2. **Eine Terminstrecke, die ihr Versprechen hält, und Formulare nach Anlass** (11–13, 32). Termin anfragen bzw. buchen, Vorauswahl je Anlass, Kontext aus den Planern übernehmen, wenige Pflichtfelder. Erwartung laut Conversion-Gutachten: +15–30 % Abschlüsse im Formular und deutlich wärmere Leads.
3. **Planer und Welten als feste Teile der Seite** (15, 16, 26). Dazu gehören Sofaplaner, Küchenplaner, AR, Stil-Finder, Yacht, Outdoor und Ezarri, jeweils mit eigener URL, indexiert, in 4 Sprachen, in Menü und auf den Produktseiten. Das ist der Burggraben gegenüber Höttges, Fretz und reiter, und dort entstehen die am besten qualifizierten Leads, etwa für ein konfiguriertes Ecksofa oder eine geplante Küche.
4. **Lokale Sichtbarkeit im Dreiländereck absichern und ausbauen** (9, 10, 27–30). Die Stadtseiten behalten ihre Rankings, die Adresse ist überall gleich, der Schweiz-Hub ist freigegeben, Ratgeber und eigene Produkttexte sind live. Google ist für das Ziel „Nr. 1 im Dreiländereck“ der Hauptkanal, vor allem für Lindau, St. Gallen und Liechtenstein, wo kein Minotti-Händler sitzt.
5. **Umsatz je Kanal messbar machen** (23–25). Euro-Wert pro Lead, strukturierte Felder im Backoffice und Rückmeldung der echten Aufträge an Google Ads. Erst damit lässt sich Werbebudget gezielt auf 1 Mio. € pro Monat steuern. Ohne Messung kauft man Klicks, mit Messung kauft man Aufträge.

---

**Nächster Schritt:** Die Bauteams erledigen die Code-P0 (1–3, 5, 7, 12–18). Parallel liefert der Inhaber Material, Freigaben und Entscheidungen (8, 10, 11, 19–21, Anwalt für 4, 22). Danach folgt eine **zweite Ratsprüfung auf einem ruhigen Produktions-Build** mit dem Release-Gate aus Maßnahme 3. Livegang erst bei ≥ 9/10, 0 P0 und Deploy-OK des Inhabers.

---
**Nachtrag 28.10.2026 (Teamleiter):** P0 Stored XSS in `sanitizeCmsHtml` ist behoben, ebenso P2 `/\host`-Links.
- Alle Tags, die der Filter selbst ausgibt, werden zuerst geparkt. Danach wird jedes übrige `<`/`>` escaped, die geparkten Tags kommen zurück. Links prüft der Filter jetzt mit `^\/(?![\/\])`.
- Regressionstests: `tests/unit/cms-sanitizer.test.mjs` (5 Tests mit den Payloads aus der Probe). Zusammen mit r3/r6-produkt: 33/33 grün.
- Offen bleibt der gleiche Regex in `src/components/Labs/Concierge/RichText.js`. Er gehört dem Concierge-Team.
