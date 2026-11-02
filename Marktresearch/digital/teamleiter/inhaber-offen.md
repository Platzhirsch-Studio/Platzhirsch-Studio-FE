# Offen beim Inhaber (nur von Harald / Kanzlei / Steuerberater lösbar)

Stand: 28.10.2026, Fix-Runde 1 nach dem Release-Rat (qa-screenshots/fertig/r1-*.md). Diese Punkte sind bewusst NICHT an Code-Pakete vergeben. Der Code löst sie bis zur Lieferung innerhalb der integrierten Seite (weglassen, neutral formulieren, „auf Anfrage“), ohne etwas zu erfinden.

## A. Kern-USP „von Hand gezeichnet“ (Release-Rat P0, gesamtwerk/ux/neuland/recht)

1. **Echtes Material von Harald:** Handzeichnungen, Fotos der Mini-Modelle, mindestens 3 Projekte als Kette „Skizze → Modell → Rendering → fertiges Foto“, mit Nutzungsrecht und Freigabe der Kunden. Danach: `src/lib/arbeitsweise/media.js` befüllen, `/arbeitsweise` indexieren, `WOW_PHASE` in `src/lib/wow/config.js` auf "B", Wow-Linie aus echter Zeichnung.
2. **Rechte an `aboutHome.jpg`** (Wow-Startbild) bestätigen: eigenes Foto ja/nein.
3. **„60 Minuten · kostenlos“** für das Erstgespräch bestätigen (steht öffentlich auf /arbeitsweise und im Termin-Pfad).
4. **Haralds Rollenbezeichnung** (z. B. „Designer & Zeichner“) für Team-Seite und Arbeitsweise bestätigen.

## B. Recht (Release-Rat recht-inhalt P0-1, P0-2, P0-4)

5. **Datenschutzerklärung:** Neufassung für Concierge (Anthropic), Handy-Upload, Portal/Raumzwilling, Planer, Ezarri-Anfrage, KI-Terminwunsch durch die Kanzlei freigeben lassen. Der Code streicht falsche Tatsachen (Privacy Shield, TKG 2003) und legt einen Entwurf vor; die Freigabe bleibt bei der Kanzlei.
6. **Impressum:** WKO-Mitgliedschaft und Fachgruppe(n), zuständige Gewerbebehörde, Gewerbewortlaut, Angaben zur Offenlegung nach § 25 MedienG (Medieninhaber, Unternehmensgegenstand, Blattlinie) bestätigen.
7. **Upload-Speicherfrist** festlegen (derzeit „180 Tage“ als Vorschlag) und `retentionConfirmed: true` in `src/lib/upload/config.js` freigeben. Bis dahin nimmt die Upload-Seite nichts an.
8. **Dreiländer-Rechner:** OSS-/Steuerregel und Richtwerte vom Steuerberater bestätigen lassen.
9. **Ratgeber:** Veröffentlichung entscheiden (mit Anwalt, wegen [prüfen]-Stellen). Bis dahin nicht im Menü, Artikel noindex.

## C. Hersteller-Freigaben (Release-Rat neuland P0, recht P1-5)

10. **Minotti:** schriftliche Zustimmung zur Übernahme der Bauteil-Daten in den Sofaplaner (Feld `rechte` in `src/lib/sofaplaner/minotti/*.json`), im Rechte-Register ablegen. Ohne Zustimmung kein Deploy des Sofaplaners.
11. **Minotti / Custom Line:** Freigabe der Yacht-Bilder (bis dahin freie Alternativen bzw. weglassen).
12. **Solpuri und weitere Marken:** Freigabe der Bildbearbeitung (Freistellen) für die 3D-/AR-Ansicht. Bis dahin Bildansicht ohne AR-Foto.
13. **Herstellerbilder allgemein** (Expertenrat P0-9): Bildrechte je Marke schriftlich klären.

## D. Betrieb, Konten, Deploy

14. **Anthropic-API-Schlüssel + AVV** für den KI-Concierge in Produktion (sonst bleibt er ausgeblendet).
15. **`UPLOAD_TOKEN_SECRET`** und übrige Umgebungsvariablen im Deploy setzen (Übergabemappe).
16. **Deploy-OK** und Commit nach main.

## E. Inhaltliche Entscheidungen / Lieferungen (Wachstum, neuland)

17. **Showroom-Aufnahme** für den begehbaren Rundgang (Gaussian Splat): Termin, Erlaubnis, Ausstellungsstücke.
18. **Kalender / Videoberatung:** welches Terminsystem, welche freien Zeiten, Videoberatung ja/nein.
19. **Objekt-/Hotel- und Architekten-Geschäft:** Wird es angeboten? Mit welchen echten Referenzen (Kundenfreigabe)? Erst dann Einstiegsseiten `/objekte` bzw. für Planer.
20. **Referenzprojekte** mit Fotos und Kundenfreigabe.
21. **Englisch für die Werkzeuge:** Umfang der Übersetzung freigeben (Vorschlag: Küchenplaner, Ezarri, 3D-Ansicht).

---

## Nachtrag Fix-Runde 2 (28.10.2026, Release-Rat r2-*.md)

Weiterhin offen und vom Release-Rat erneut als P0/P1 gemeldet: **A.1** (echtes Skizzen-/Modell-/Harald-Material; gesamtwerk P0-1, neuland P1), **A.2** (`aboutHome.jpg`, recht P1), **B.5/B.6** (anwaltliche Freigabe Datenschutz/Impressum, WKO-Angabe nach § 5 ECG; recht P0-2), **C.10** (Minotti-Zustimmung Sofaplaner; neuland P0-1), **C.11** (Yacht-Bilder), **E.17** (Showroom-Splat), **E.19/E.20** (Objekt-/Architekten-Referenzen), **E.21** (Übersetzungsumfang; bis dahin leiten EN/FR/IT-Adressen reiner DE-Seiten auf die DE-Seite um).

Neu in Runde 2:

22. **Rechtsgrundlage Anthropic (Concierge)** in der Datenschutzerklärung durch die Kanzlei festlegen (DPF/SCC, AVV). Der Code formuliert den Consent-Dialog passend zur jetzigen Erklärung; die Freigabe bleibt bei der Kanzlei.
23. **Rückmeldefrist nach Anfragen** („wir melden uns innerhalb von … Werktagen“) bestätigen. Bis dahin nennt die Bestätigungsseite keine Frist.
24. **Outdoor-Gartenplanung:** Rechtliche Prüfung abschließen (Grund für das noindex). Danach indexieren; bis dahin bleibt die Seite verlinkt, aber noindex.
25. **Adventsabend:** Uhrzeit, Ablauf und „kostenlos“ bestätigen. Bis dahin liefert die Seite in Produktion 404.
26. **Partner-Seite:** Zustimmung der genannten Partner, Erklärung der Café-Nummer 46257 (eigene Café-Leitung?).
27. **ClassiCon-Händlerbezeichnung:** genauen Wortlaut aus dem Händlervertrag nennen (z. B. „autorisierter Fachhändler“). Bis dahin neutral „Vertragshändler“ ohne „offiziell … in Vorarlberg“.
28. **Herstellertexte auf Markenseiten** (story, craft, approach aus dem Backoffice): Nutzungserlaubnis bzw. eigene Texte. Bis dahin filtert der Code Superlative und blendet ungeprüfte Craft-Abschnitte aus.
29. **Echte 3D-Möbelmodelle** (GLB/USDZ) der Hersteller mit Lizenz für 3D-Ansicht und AR. Bis dahin spricht die 3D-Ansicht ehrlich von „Raumbedarf in Originalgröße“.
30. **Eigene Fotos von Café und Haus** (Startseite Café-Kapitel, Haus-Kapitel), mit Nutzungsrecht.
31. **og:image-Herkunft:** eigene Fotos für Vorschaubilder bestätigen. Bis dahin nutzt der Code typografische OG-Karten statt Bildern ungeklärter Herkunft.
32. **Externe NAP-Pflege** (Google-Profil, Herold, ClassiCon-Händlersuche) auf Landstraße 11 vor dem Deploy (Entscheidung Nr. 2, seo P2-10).

---

## Nachtrag Fix-Runde 3 (28.10.2026, Release-Rat r3-*.md)

Erneut als P0/P1 gemeldet, weiterhin nur vom Inhaber lösbar: **A.1** (Skizzen, Modellfotos, Portrait von Harald statt Monogramm „HM“, Video; danach `src/lib/arbeitsweise/media.js` befüllen und `WOW_PHASE` auf "B"; gesamtwerk P0, neuland P1-2, seo P1-5), **A.2** (`aboutHome.jpg`), **B.5/B.6** (Kanzlei-Freigabe Datenschutz/Impressum bleibt Deploy-Bedingung; recht P1), **C.10** (Minotti-Zustimmung: bis dahin bewirbt der Code den Sofaplaner nirgends mehr mit Minotti), **C.11**, **E.17** (Showroom-Splat; gesamtwerk P1, neuland P1-3), **E.20** (Projekte: `src/lib/content/projekte.js` ist leer; neuland P1-7), **E.21** (englische Fassungen von Arbeitsweise, Ezarri, 3D-Ansicht, Sofaplaner; neuland P1-6), **C.29** (echte 3D-Modelle, `models3d.json` hat 0; neuland P1-4).

Neu in Runde 3:

33. **Material-Tag mit Harald** ansetzen (neuland, Schritt 2): Skizzen, Modellfoto, Portrait, kurzes Video, Showroom-Aufnahme für den Splat, rund 20 Ausstellungsstücke für Photogrammetrie/Renders. Danach eine GPU-Woche (RTX 4060) für Splat, Lichtsequenz Bodensee-Licht, Renders.
34. **WKO-Auszug** für das Impressum (Kammer, Fachgruppe; `CHAMBER` in `src/components/Impressum/impressum.js` ist null) sowie die **Blattlinie** nach § 25 MedienG (recht P1).
35. **Hoster und Mail-Dienst** benennen und Verträge (AVV, Drittlandübermittlung USA bei Resend/Postmark) bestätigen. Der Code ergänzt den Entwurf der Datenschutzerklärung, die Freigabe macht die Kanzlei (recht P1).
36. **Google Ads / Marketing-Einwilligung:** Soll es Google Ads geben? Wenn nein, streicht der Code den Abschnitt aus der Erklärung. Wenn ja, braucht es Konto, Kanzlei-Freigabe und den sichtbaren Schalter im Dialog (recht P1).
37. **Fakten für die Stadtseiten** Bregenz, Dornbirn, Lindau, Friedrichshafen, St. Gallen (seo P0-1): Je Ort mindestens 4 echte, eigene Fakten, z. B. Anfahrt und Fahrzeit, ausgeführte Lieferungen oder Projekte (mit Freigabe), Ansprechpartner, Zoll oder Lieferweg. Der Code ergänzt nur belegbare Fakten (Entfernung, Route, Liefer- und Zollablauf nach Inhaber-Entscheidung) und nimmt Seiten unter 4 Fakten aus dem Footer. Ohne Lieferung durch den Inhaber bleiben sie noindex.
38. **Eigenes Hero-Foto je Stadtseite** oder freigegebene Ortsbilder (gesamtwerk P1). Bis dahin nutzt der Code andere vorhandene eigene Bilder statt desselben Showroom-Fotos.
39. **Kontakt-og:image** `questionmark-og.jpg` trägt ein Gemini-Wasserzeichen. Ein eigenes Foto liefern. Bis dahin ersetzt der Code es durch eine typografische OG-Karte (seo P1-2).
40. **Schweiz-Hub** `/de/einkaufen-aus-der-schweiz`: Freigabe durch den Steuerberater (B.8). Bis dahin bleibt er noindex und unverlinkt (seo P1-4).
41. **Yacht und Objekt/Hotel im Formular:** Bestätigen, dass diese Themen als eigene Anfrage-Option angeboten werden (E.19). Der Code legt neutrale Optionen „Yacht-Interieur“ und „Objekt / Hotel“ an, ohne Referenzen zu nennen.
42. **Online-Kalender** (E.18) bleibt Voraussetzung für einen echten Terminpfad (neuland, Schritt 5).
43. **Logo in hoher Auflösung** (mindestens 112 × 112 px, besser als SVG/quadratisch) für das Organisation-Schema (seo P2).

---

## Nachtrag Fix-Runde 4 (29.10.2026, Release-Rat r4-*.md)

Erneut als P0/P1 gemeldet, weiterhin nur vom Inhaber lösbar: **A.1/33** (Kern-USP ohne Beweis: Handzeichnungen, Modellfotos, Portrait, Projektkette Skizze → Modell → Render → Foto; gesamtwerk P0-1, neuland P1-2. Bis dahin gestaltet der Code das Kapitel „Von Hand gezeichnet“ ohne Bild und ohne widersprüchliche Bildzeile), **E.17** (Showroom-Splat; gesamtwerk P1-5, neuland P1-6, ux P0-1. Bis dahin blendet der Code den „Showroom-Rundgang“ überall aus), **D.14** (Anthropic-Schlüssel, Budget, AVV; neuland P1-7. Bis dahin hängt der Code alle Concierge-Links an die Bedingung „Schlüssel gesetzt“), **B.5/B.6/34/35** (WKO-Auszug, Blattlinie, Mail-Dienst mit DPF/SCC, Kanzlei-Freigabe als Deploy-Bedingung; recht P1-1, P1-2, P1-6), **C.11** (Minotti-/Custom-Line-Bilder; bis dahin ungeschnitten oder ersetzt), **C.29** (3D-Modelle; neuland P1-3, P1-5), **E.20** (Projekte), **24** (Outdoor-Gartenplanung: rechtliche Prüfung → index; ux P1-3).

Neu in Runde 4:

44. **Bewerbungen:** Ansprechpartner (derzeit „Helmut Schuster“) und Aussagen wie „faire Bezahlung“ bestätigen. Bis dahin entfernt der Code unbestätigte Angaben aus `src/components/Karriere/karriereposition.js` und verweist auf die allgemeine Adresse. Die Kanzlei ergänzt den Abschnitt „Bewerbungen“ in der Datenschutzerklärung (der Code legt einen Entwurf vor).
45. **„Innenarchitektur“ als Leistungsbezeichnung:** Die Kanzlei soll prüfen, ob der Begriff zulässig ist (in Deutschland geschützte Berufsbezeichnung, wichtig für Lindau/Friedrichshafen/Konstanz). Bis dahin verwendet der Code „Interior Design“ bzw. „Einrichtungsplanung“, wo das ohne Bedeutungsverlust geht.
46. **Team-Seite:** Foto von Harald und die zwei fehlenden Rollenbezeichnungen liefern (vgl. A.4).
47. **Echte Erscheinungsdaten der News** im Backoffice nachtragen (25 von 28 Artikeln stehen auf dem Migrationsdatum 2025-01-14). Bis dahin blendet der Code diese Daten aus.
48. **Deploy-Checkliste Concierge:** In Produktion dürfen keine Mock-Variablen gesetzt sein (`CONCIERGE_MOCK` o. ä.), sonst erscheint „KI Mock“. Das prüft der Inhaber beim Deploy (recht P2).
49. **Telefon im Beratungsformular:** Ist es Pflicht? Vorschlag: optional, wie es die Datensparsamkeit verlangt. Der Code macht es optional, wenn nichts anderes kommt (recht P2).
50. **Wow-Moment und Rundgang:** Ein echter Wow-Moment hängt am Material-Tag (A.1/33) und am Splat (E.17). Der Code verlängert und verbessert die Linie, kann aber keinen Rundgang ersetzen.

---

## Nachtrag Fix-Runde 5 (29.10.2026, Release-Rat r5-*.md)

Erneut als P0/P1 gemeldet, weiterhin nur vom Inhaber lösbar:

- **A.1/33 Kern-USP ohne Beweis** (gesamtwerk P0-1, ux P1-5, neuland P1-1, recht P1-7): Echte, datierte Handzeichnungen, Fotos der Mini-Modelle, Rendering und fertiges Foto mindestens eines Projekts, Porträt von Harald mit Einwilligung. Ohne dieses Material ist der Gesamtscore 9 laut Release-Rat nicht erreichbar. Danach: `src/lib/arbeitsweise/media.js` befüllen, `WOW_PHASE` in `src/lib/wow/config.js` auf "B". Bis dahin zeigt der Code auf /arbeitsweise keine Ersatzbilder, keine KI-Skizzen und keine Bildzeile, die ein Foto vortäuscht.
- **46 Team-Seite:** Foto von Harald und die zwei fehlenden Rollenbezeichnungen (gesamtwerk P1-3). Der Code schließt die leere Rasterspalte und korrigiert den Bildausschnitt, erfindet aber keine Rollen.
- **34 WKO-Auszug** für das Impressum (`CHAMBER` in `src/components/Impressum/impressum.js` ist null; recht P1-5).
- **B.5/B.6 Kanzlei-Freigabe** aller Rechtstexte bleibt Release-Gate (recht P1-6).
- **45 „Innenarchitektur“:** Kanzlei-Antwort. Bis dahin ersetzt der Code den Begriff überall durch „Interior Design“ bzw. „Einrichtungsplanung“ (seo P1-2, recht P2).
- **35 Mail-Dienst:** Resends DPF-Eintrag auf dataprivacyframework.gov vor dem Deploy selbst prüfen. Entscheiden, ob Postmark als Ausweichdienst überhaupt verwendet wird; wenn nein, entfernt der Code die Option (recht P2).
- **A.2 Hero-Foto der Startseite** (`aboutHome.jpg`, Kommentar in `src/components/Home/copy.js`): Rechte bestätigen und klären, ob darauf Minotti-Möbel zu sehen sind („keine Veränderung“). Bis dahin zeichnet der Code keine Linien über die Möbel (neuland P2, technik P1-2).
- **C.11 Minotti/Custom-Line-Bilder:** schriftliche Freigabe. Bis dahin ersetzt oder weggelassen.
- **E.20 Projekte** (`PROJEKTE = []`, neuland P1-2): echte Projekte mit Fotos und Kundenfreigabe. Bis dahin leitet /projekte auf /arbeitsweise.
- **C.29 3D-Modelle** (`models3d.json` hat 0 Produkte, neuland P1-5): lizenzierte GLB/USDZ der Hersteller.
- **E.17 Showroom-Splat** (neuland P2): Aufnahmetermin im Showroom.
- **E.18/42 Online-Kalender** (neuland P2).
- **E.21 Übersetzungen:** Die Arbeitsweise-Seite wird in Runde 5 aus den bestätigten deutschen Texten übersetzt (Nr. 8 verlangt den USP auf allen Seiten). Für Ezarri, 3D-Ansicht und Sofaplaner auf Englisch (neuland P1-6) bleibt die Freigabe des Umfangs offen.
- **D.14 Anthropic-Schlüssel** für den Concierge. Bis dahin zeigt der Code nirgends einen „KI“-Knopf (ux P1-2, technik P1-6).

Neu in Runde 5:

51. **Next.js-Update im Repo** von 16.3.8 auf 16.4.1 (`npm install`, technik P1-5): braucht eine ausdrückliche Freigabe. Die Prod-Kopie läuft schon auf 16.4.1.
52. **Architekturbüro-Leads:** Bestätigen, dass Anfragen von Architekten (St. Gallen „Zusammenarbeit anfragen“) als eigenes Thema „Architekturbüro“ ins Backoffice gehen sollen und nicht unter „Objekt / Hotel“ (ux P1-3). Der Code nutzt die vorhandene Option, bis etwas anderes kommt.
53. **Bilder der Startseiten-Karten „Räume“:** zwei Bilder wirken weich und alt (gesamtwerk P1-4). Eigene, aktuelle Raumfotos liefern. Bis dahin wählt der Code die schärfsten vorhandenen eigenen Bilder.
