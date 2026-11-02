# Wachstumsrat: Kundenforschung, Psychologie, Neuromarketing, Emotionen (Kürzel: psycho-neuro)

**Stand:** 28.10.2026 · **Gremium:** Kundenforscherin, Konsumpsychologe, Neuromarketing-Berater, Emotions- und Gefühlsexpertin · **Grundlage:** 23-masterkonzept (maßgeblich), 29 Yacht, 30 Outdoor, digital/expertenrat 01–04 (Konsum-, Verkaufs-, Verhaltens- und Wahrnehmungspsychologie, hier nicht wiederholt, sondern fortgeführt), teamleiter/inhaber-entscheidungen.md, wachstumsrat/hotel-contract.md und funnel.md, Code-Stand `feature/neuauftritt` (nur gelesen).

**Kennzeichnung:** [belegt] = Studie oder Primärquelle · [Sekundär] = über Sekundärquelle geprüft · [Schätzung] = fachliche Ableitung, im Test zu prüfen. Alle Umsatzwirkungen sind **Schätzungen**, weil Platzhirsch heute keine Funnel-Zahlen misst (siehe funnel.md).

**Grenze dieser Prüfung:** Der Dev-Server (`localhost:3000`) hat während der Prüfung auf keine Anfrage geantwortet (Timeout nach 30 bis 120 s, vermutlich durch parallele Bauteams). Der eigene Screenshot-Lauf nach `qa-screenshots/wachstumsrat/psycho-neuro/` kam deshalb nicht zustande. Die Sichtprüfung stützt sich auf die **jüngsten Abnahme-Screenshots vom selben Tag**:
- Startseite: `qa-screenshots/erlebnis/concierge-sitewide/qa2/de--desktop--full.png`
- Beratung (iPhone): `qa-screenshots/teamleiter/r6-release/r6-ende/abnahme/de-beratung--iphone.png`
- St. Gallen (Desktop): `qa-screenshots/teamleiter/r6-release/r6-ende/abnahme/de-designermoebel-st-gallen--desktop.png`
- Yacht (Desktop): `qa-screenshots/erlebnis/yacht/fix2/de-yacht-interior--desktop.png`

Dazu kommen Texte und Komponenten aus dem Code (`src/messages/de.json`, `src/components/Home/*`, `src/components/BeratungClient`, `src/lib/content/projekte.js`). `/de/ezarri` gibt es im Code noch nicht, die Seite wird gerade gebaut und ist hier nicht bewertet.

---

## 1. Urteil zum Ist-Stand

**Gesamtnote: 6 / 10** (emotionale Wirkung und Vertrauensarchitektur)

| Bereich | Note | Begründung |
|---|---|---|
| Ästhetik, erster Eindruck, Farbe | 8 | Ruhige Papier-, Stein- und Walnusstöne, viel Weißraum, Bodoni, ein einziges dunkles Kapitel („Erst ein Kaffee. Dann das Sofa.“). Das trifft den „leisen Luxus“ der vermögenden Zielgruppe (Han/Nunes/Drèze 2010, siehe expertenrat/01 E1) genau. Keine lauten Signale, keine Countdowns. |
| Sprache, Tonalität | 8 | „Wir sind Gastgeber, bevor wir Einrichter sind.“, „Wir denken vom Raum aus, nicht vom Katalog.“ Warm, konkret, ohne Superlative. Schwach sind nur die Momente nach dem Klick: „Absenden“ und „Wir melden uns in Kürze“. |
| Geborgenheit, Gastgeber-Motiv | 7 | Café, Probesitzen und „Zeit“ ziehen sich gut durch. Es fehlen aber **Menschen**: Auf der ganzen Startseite ist kein Gesicht zu sehen, kein Harald Menghin, keine Hand, die zeichnet. Geborgenheit entsteht über Personen, nicht über Räume allein. |
| Vertrauen, sozialer Beweis | 3 | `PROJEKTE` ist leer (`src/lib/content/projekte.js`), es gibt weder Referenzen noch eingebundene Bewertungen noch eine Stimme eines Kunden. Für einen Kauf über 20.000 € ist das die größte emotionale Lücke, denn die Angst vor dem Fehlkauf hat nichts, an dem sie sich beruhigen kann. |
| Kern-USP Handzeichnung und Modell | 2 | Inhaber-Entscheidung Nr. 8 verlangt, dass der USP auf Startseite, Team, Planern und allen Geschäftsfeldern steht. In `de.json` und in `src/components` gibt es dazu **keinen einzigen Satz** (Suche nach „von Hand“, „Handzeichnung“, „Designs, die leben“, „Menghin“: kein Treffer außerhalb der Rechtstexte-Entwürfe). Ausgerechnet das stärkste Emotionsmittel der Firma fehlt. |
| Angstabbau (Preis, Lieferzeit, Ablauf) | 5 | Gut: „Bis alles steht“, Länder-Hinweise ohne leere Versprechen. Es fehlen: Preisrahmen oder Budget-Einstieg, ein typischer Ablauf mit Zeitachse, eine verbindliche Antwortzeit und der Satz „Was passiert nach Ihrer Anfrage?“. |
| Persona-Passung | 5 | Das Neubau-Paar wird gut bedient. Die Architektin aus der Schweiz findet keinen Fachplaner-Einstieg (St. Gallen spricht nur Privatkunden an). Der Bootseigner sieht als Hero eine Vektor-Illustration statt Material. Der **Hotelier hat keinen einzigen Einstieg**: kein Menüpunkt, keine Seite, das Formular kennt nur „Einfamilienhaus, Wohnung, gewerbliche Immobilie“. |
| Ethik (keine Dark Patterns) | 9 | Gleichwertige Cookie-Knöpfe („Alle akzeptieren“ / „Weiter ohne Einwilligung“), kein künstlicher Zeitdruck, kein vorausgewähltes Häkchen. Der Vernissage-Pop-up ist zeitlich begrenzt (bis 04.09.2026) und damit erledigt. |

**Kurzfassung:** Die Seite *sieht* aus wie ein Haus, dem man vertrauen möchte. Sie *beweist* aber noch nicht, dass man ihm vertrauen kann. Es fehlen Menschen, Projekte, Stimmen und der Handzeichnungs-USP. Diese vier Dinge kosten wenig Kapital, wirken stark und sind der Hebel dieses Gremiums.

---

## 2. Befunde und Chancen

### B1. Das Gehirn kauft bei Platzhirsch nicht ein Möbel, sondern ein Gefühl von „angekommen“
Die vier Personas kaufen nicht das gleiche Gefühl, aber alle kaufen eines. Das Neubau-Paar sucht **Geborgenheit und Bestätigung** („Wir haben es richtig gemacht“). Die Architektin will **Kontrolle und Reputation** („Mein Name hängt dran“). Der Bootseigner sucht **Stolz und Zugehörigkeit** („Mein Boot ist das schönste im Hafen, und es hält“). Der Hotelier braucht **Sicherheit und Rendite** („Eröffnung pünktlich, Gäste begeistert, Budget gehalten“). Möbel werden Teil des erweiterten Selbst (Belk 1988, *JCR* 15(2)) [belegt]. Für die Hotelier-Persona gilt das nur mittelbar: Er kauft die Erfahrung seiner Gäste und damit seine Bewertungen.

### B2. Die stärkste Emotion im Prozess ist Angst, nicht Lust
Bei Käufen über 20.000 € wird die Entscheidung von der **vorweggenommenen Reue** gesteuert: „Was, wenn der Stoff nach zwei Jahren durchsitzt, die Farbe nicht zum Boden passt, die Küche zu spät kommt?“ (Zeelenberg & Pieters 2007, *Journal of Consumer Psychology* 17(1), Theorie der Regret Regulation) [Sekundär]. Verlustangst wiegt etwa doppelt so schwer wie gleich großer Gewinn (Kahneman & Tversky 1979; Tversky & Kahneman 1992) [belegt]. **Folge:** Die Website muss weniger begeistern und mehr *entlasten*: zeigen, wie Fehlkäufe verhindert werden (Muster mitnehmen, Handskizze, Modell, Rendering, Probesitzen).

### B3. Der USP Handzeichnung plus Modell ist psychologisch ein dreifacher Hebel
1. **Reue-Schutz:** Die Skizze und das Mini-Modell machen das Ergebnis vor dem Kauf greifbar. Das senkt die Angst vor dem Fehlkauf direkt (B2).
2. **IKEA-Effekt / Mitgestaltung:** Wer an etwas mitgearbeitet hat, bewertet es höher. Das gilt nur, wenn die Arbeit abgeschlossen wird (Norton, Mochon & Ariely 2012, *JCP* 22(3), 453–460, [Harvard DASH](https://dash.harvard.edu/handle/1/12136084)) [belegt]. Wenn das Paar in der Skizzenrunde mitzeichnet, wird es „unser“ Entwurf.
3. **Signal von Aufwand:** Handarbeit und Zeit sind teure Signale, die Wettbewerber mit Katalog-Rendering nicht kopieren können. Menschen schließen von sichtbarem Aufwand auf Qualität (Morales 2005, *JCR* 31(4), „Understanding the Role of Incentives in Effort“) [Sekundär].

Heute ist davon auf der Seite **nichts** zu sehen. Das ist der wichtigste Einzelbefund.

### B4. Gesichter sind in der neuen Seite die fehlende Wärmequelle
Auf der Startseite (Screenshot, 13.594 px hoch) gibt es keinen Menschen. Gesichter ziehen Blicke an und wecken Vertrauen. Der Blick lenkt Aufmerksamkeit dorthin, wohin das Gesicht schaut (expertenrat/04 E5) [belegt dort]. Für einen „Gastgeber“ ist das ein Widerspruch: Wir versprechen Gastfreundschaft und zeigen leere Räume. **Chance:** ein echtes Foto von Harald Menghin beim Zeichnen am Tisch im Café. Es braucht nur ein Shooting (Kosten gering, siehe Tabelle).

### B5. Sozialer Beweis fehlt komplett, und das ist richtig, solange nichts freigegeben ist
`projekte.js` ist absichtlich leer, damit nichts erfunden wird. Das ist rechtlich und ethisch korrekt. Psychologisch ist es aber die größte Lücke: Unsicherheit macht Menschen empfänglich für das Verhalten anderer (Cialdini, *Influence*, Prinzip „Social Proof“) [Sekundär]. **Chance ohne Erfindung:** (a) drei Projekte mit Einwilligung freigeben (Inhaber), (b) Google-Bewertungen nur als Link mit echtem Stand anzeigen, (c) eine „Werkstattseite“ mit eigenen Skizzen, Modellen und Materialtafeln. Das ist Beweis durch Arbeit statt durch Kundennamen.

### B6. Entscheidungsarchitektur: gut im Katalog, unklar im Einstieg
- **Startseite:** Ein klarer Haupt-CTA („Termin wählen“), daneben „Showroom & Café“. Gut (geringe Wahlüberlastung, vgl. Chernev, Böckenholt & Goodman 2015, *JCP* 25(2), Meta-Analyse) [belegt].
- **Fehlender Zwischenschritt:** Zwischen „ich schaue nur“ und „Termin“ liegt eine große Hürde. Für ein Paar mitten im Rohbau ist ein Termin eine Verpflichtung. Es fehlt eine **kleine erste Zusage** ohne Gesprächsdruck, etwa „Grundriss schicken, Handskizze-Einschätzung zurückbekommen“ oder „Muster-Paket anfordern“ (Fuß-in-der-Tür, Freedman & Fraser 1966) [belegt]. Handy-Upload und Stil-Finder gibt es technisch schon, sie sind aber nicht als dieser erste Schritt erzählt.
- **Formular:** Vier Schritte mit Fortschrittsanzeige sind gut. Die Auswahl in Schritt 2 („Einfamilienhaus / Wohnung / gewerbliche Immobilie“) schließt Boot, Hotel und Gastronomie aus. Wer sich nicht wiederfindet, fühlt sich nicht gemeint und bricht ab [Schätzung].
- **Ende des Prozesses (Peak-End):** Der letzte Moment ist „Vielen Dank für Ihre Anfrage. Wir melden uns in Kürze bei Ihnen.“ Unbestimmtes Warten fühlt sich länger an als erklärtes Warten (Maister 1985, „The Psychology of Waiting Lines“) [Sekundär]. Das Ende ist die Stelle, die man erinnert (Kahneman et al. 1993, *Psychological Science* 4(6)) [belegt]. Es ist heute der schwächste Moment der Reise.

### B7. Farbe und Bild: Die Palette stimmt, einzelne Bilder senden das falsche Gefühl
- **Palette** (`globals.css`): Papier `#faf8f4`, Stein `#ece8e1`, Tinte `#30373e`, Walnuss `#3f3129`, See `#4f6b68`, Messing als Akzent. Gedämpfte, wenig gesättigte Töne werden mit Kompetenz und Raffinesse verbunden, gesättigte mit Erregung (Labrecque & Milne 2012, *JAMS* 40(5), 711–727, [Abstract](https://colab.ws/articles/10.1007/s11747-010-0245-y)) [Sekundär]. Das passt zur Zielgruppe.
- **Yacht-Hero:** Eine Strich-Illustration eines Boots mit **leuchtend orangefarbenen Fenstern** auf dunklem Grund. Sie wirkt verspielt, fast wie eine App, und zeigt kein Material. Ein Bootseigner kauft aber Haptik und Widerstand (Salzwasser, UV, Feuchtigkeit). Das Orange ist der einzige gesättigte Ton der Seite und zieht den Blick weg vom Text und vom Termin-Knopf [Schätzung, im Test prüfen].
- **St. Gallen:** Ein schönes Holzpaneel-Bild (Rimadesio), aber ohne Bezug zur Persona Architektin. Ein Hochhaus im Fenster wirkt eher Großstadt als Ostschweiz.
- **Beratung (iPhone):** Der erste Bildschirm besteht nur aus Text, Knopf und Cookie-Leiste. Es gibt kein Bild, kein Gesicht und keine Skizze. Genau hier fällt die Entscheidung, ob man sich anvertraut.

### B8. Sprache: warm, aber an drei Stellen kalt
| Stelle | Heute | Wirkung |
|---|---|---|
| Formular-Knopf | „Absenden“ | technisch, beendet, nichts Schönes folgt |
| Danke-Text | „Wir melden uns in Kürze bei Ihnen.“ | unbestimmt, weckt Warte-Angst |
| Cookie-Text | „…um Ihnen ein gutes Nutzererlebnis bieten zu können.“ | Floskel, bricht den Ton der Seite |
| Formular-Schritt 2 | „gewerbliche Immobilie“ | Behördendeutsch, der Hotelier fühlt sich als Akte |

### B9. Die Hotelier-Journey ist eine B2B-Journey, und die Seite behandelt sie heute gar nicht
B2B-Käufer verbringen nur rund 17 % ihrer Kaufzeit im Gespräch mit Anbietern, den Rest mit eigener Recherche und interner Abstimmung (CEB/Gartner, um 2018) [Sekundär: [destinationcrm](https://www.destinationcrm.com/Articles/CRM-Insights/Insight/Buyer-Enablement-Is-the-Key-to-B2B-Sales-127790.aspx), [istart](https://istart.com.au/?p=29514)]. Bei Hotel-FF&E entscheiden mehrere Menschen: Eigentümer, Betreiber, Designer und Einkauf. Designer fürchten, dass Einkäufer die spezifizierten Produkte durch Kopien ersetzen ([nerej.com](https://nerej.com/print/16048), [Beyer Brown](https://beyerbrown.substack.com/p/hotel-ff-and-e-purchasing-solutions)) [Sekundär, Anbieterquellen]. **Folge:** Der Hotelier braucht Material, das er *intern weitergeben* kann, etwa ein Projekt-Dossier als PDF, und er braucht die Zusage „Original, keine Kopien“. Die emotionalen Treiber sind Kontrolle, Termintreue und Gesichtswahrung gegenüber Eigentümer und Bank.

### B10. Ethik-Leitplanke
Alles in diesem Bericht vermeidet künstliche Knappheit, Countdowns, Schein-Rabatte, vorausgewählte Optionen, Bestätigungs-Beschämung („Nein, ich will kein schönes Zuhause“) und versteckte Kosten. Die EU-Kommission behandelt Dark Patterns ausdrücklich als unlautere Geschäftspraktiken nach der UGP-Richtlinie (Leitfaden vom 29.12.2021, Abschnitt 4.2.7, [Covington Inside Privacy](https://www.insideprivacy.com/eu-data-protection/the-eu-stance-on-dark-patterns/)) [Sekundär]. Bei der Zielgruppe „Patricians“ kosten sie außerdem Vertrauen, weil wahrgenommene Manipulation dauerhaft schadet (expertenrat/02 E9).

---

## 3. FERTIG: Emotions-Map je Persona

Lesart: Jede Zeile ist eine Phase. **Gefühl** ist der vorherrschende Zustand, **Motiv** das Ziel dahinter, **Angst** die Bremse. **Die Seite muss liefern** beschreibt, was der Moment braucht. **Ist** bewertet den heutigen Stand (✓ erfüllt, ◐ teilweise, ✗ fehlt).

### Persona A: Neubau-Paar aus Bregenz (Mitte 30 bis Mitte 40, Einfamilienhaus im Rohbau, Budget Einrichtung plus Küche geschätzt 60.000 bis 150.000 € [Schätzung])

Kernmotive: **Geborgenheit** (ein Nest), **Ästhetik** (ein Zuhause, das „wir“ ist), **Status leise** (Freunde sollen staunen, ohne dass es protzt), **Sicherheit** (kein Fehlkauf beim größten Projekt des Lebens).

| Phase | Gefühl | Motiv | Angst | Die Seite muss liefern | Ist |
|---|---|---|---|---|---|
| 1. Auslöser (Rohbau steht, Küchenplaner der Baufirma drängt) | Vorfreude mit Druck | „Wir wollen es diesmal richtig machen.“ | Zu spät dran, Entscheidungen fallen ohne uns | Ratgeber „Wann muss die Küche geplant sein?“ mit Zeitachse ab Rohbau | ◐ Ratgeber vorhanden, Zeitachse fehlt |
| 2. Inspiration (abends auf dem Sofa, Handy) | Träumen | Ästhetik, Selbstbild | „Das ist zu teuer für uns.“ | Große Raumbilder, Stil-Finder als Spiel zu zweit | ✓ Bilder, ◐ Stil-Finder nicht auf der Startseite erzählt |
| 3. Orientierung | Überforderung (zu viele Marken) | Kontrolle | Wahlüberlastung, Peinlichkeit im Showroom | „Wir denken vom Raum aus“, wenige Einstiege | ✓ |
| 4. Vertrauensprüfung | Skepsis | Sicherheit | „Sind die gut? Waren andere zufrieden?“ | Projekte, Stimmen, Gesichter, Handzeichnung | ✗ |
| 5. Erste Zusage | Zögern | kleiner Schritt ohne Verpflichtung | „Wenn wir anrufen, kommen wir nicht mehr raus.“ | „Grundriss schicken, Handskizze zurück“, ohne Terminzwang | ✗ (Upload existiert, ist nicht so erzählt) |
| 6. Termin im Showroom | Aufregung, Genuss | Probesitzen, Kaffee | Verkaufsdruck | Café, „Wir nehmen uns Zeit“ | ✓ |
| 7. Entwurf (Skizze, Modell, Rendering) | Stolz, „unser Entwurf“ | Mitgestaltung (IKEA-Effekt) | „Passt das wirklich zu unserem Boden?“ | Muster mit nach Hause, Skizzenrunde | ✗ auf der Seite unsichtbar |
| 8. Preis | Schreck, dann Rechtfertigung | Wert über Zeit | Fehlkauf, Partner sagt Nein | Preisrahmen vorab, funktionales Alibi (Nachbezug, Langlebigkeit) | ◐ |
| 9. Warten auf Lieferung (8 bis 16 Wochen) | Ungeduld, leise Reue | Sicherheit | „Kommt das rechtzeitig zum Einzug?“ | Portal mit Status, Fotos aus der Fertigung | ◐ Portal im Bau |
| 10. Einzug | Höhepunkt | Ankommen | Montagefehler | „Bis alles steht“, Abschluss-Ritual | ◐ Versprechen da, Ritual fehlt |
| 11. Danach | Stolz | Zugehörigkeit | — | Einladung ins Café, Pflegehinweise, Nachbezug | ✗ |

**Emotionaler Höhepunkt, den wir gestalten:** Phase 7, der Moment, in dem Harald die Handskizze über den Tisch schiebt. **Tiefpunkt, den wir abfedern:** Phase 8 und 9 (Preis und Warten).

### Persona B: Architektin aus St. Gallen (45, eigenes Büro, plant Villen und Wohnungen, empfiehlt Händler an Bauherren)

Kernmotive: **Reputation** (ihr Entwurf soll so gebaut werden wie gezeichnet), **Kontrolle** (Daten, Muster, Termine), **Ästhetik** (Kennerschaft), **Effizienz**.

| Phase | Gefühl | Motiv | Angst | Die Seite muss liefern | Ist |
|---|---|---|---|---|---|
| 1. Bedarf im Projekt | sachlich, unter Zeitdruck | richtiger Partner für ein Projekt | Händler verwässert den Entwurf | eigene Seite „Für Architektinnen und Planer“ | ✗ |
| 2. Prüfung | kritisch | Kennerschaft | Laienhaftigkeit, Verkaufssprache | Fachsprache, Materialtiefe, keine Superlative | ◐ Ton gut, Fachtiefe fehlt |
| 3. Daten | ungeduldig | Effizienz | „Ich muss alles selbst anfragen.“ | Muster-Service, Datenblätter und CAD auf Anfrage, feste Ansprechperson | ✗ |
| 4. Grenze Schweiz | Misstrauen | Planbarkeit | Zoll, MWST, Lieferung, Montage | „Fragen zur Einfuhr klären wir vor dem Kauf“ plus Ablauf-Grafik | ◐ St. Gallen erwähnt es, ohne Ablauf |
| 5. Zusammenarbeit | vorsichtig | Kontrolle | Händler übernimmt den Kunden | klares Rollenbild: „Ihr Entwurf, unsere Umsetzung“ | ✗ |
| 6. Ergebnis | Stolz | Reputation | — | Projekt mit Nennung der Architektin (mit Freigabe) | ✗ (Schema unterstützt es bereits) |

**Höhepunkt:** Die gebaute Wirklichkeit entspricht ihrer Zeichnung. **Tiefpunkt:** Datenbeschaffung und Grenzbürokratie.

### Persona C: Bootseigner aus Lindau (58, Motoryacht 12 bis 16 m, Bootshaus, oft zusätzlich Pool oder Garten)

Kernmotive: **Stolz und Status im Hafen** (leise, aber sichtbar), **Genuss**, **Sicherheit** (Material hält Sonne, Salz oder Süßwasser, Feuchte), **Zeitersparnis** (ein Partner für Boot, Bootshaus, Terrasse).

| Phase | Gefühl | Motiv | Angst | Die Seite muss liefern | Ist |
|---|---|---|---|---|---|
| 1. Auslöser (Polster müde, Boot neu gekauft) | Unzufriedenheit oder Neuanfangs-Euphorie | „Mein Boot soll sich wie mein Haus anfühlen.“ | — | Hero mit echter Material-Nahaufnahme (Outdoor-Stoff, Teak, Naht) | ✗ Vektor-Illustration |
| 2. Vertrauensprüfung | prüfend | Kompetenz an Bord | „Kennen die Bootsbau? Oder nur Wohnzimmer?“ | Materialkapitel (vorhanden), Werfthalle, Ablauf an Bord | ✓ / ◐ |
| 3. Inspiration | Genuss, Fantasie | Status | Kitsch | Konzeptwelten (vorhanden, KI gekennzeichnet) | ✓ |
| 4. Erste Zusage | Bequemlichkeit | Zeitersparnis | Aufwand | „Termin an Bord“, Fotos vom Boot per Handy | ✓ CTA da, ◐ Upload nicht verknüpft |
| 5. Umsetzung | Ungeduld | Saisonstart | Boot nicht fertig zur Saison | Saison-Zeitplan („Bis 15. März beauftragt, zur Saison an Bord“, als Planungsziel, keine Garantie) | ✗ |
| 6. Danach | Stolz | Zugehörigkeit | — | Cross-Sell Bootshaus, Garten, Ezarri-Pool | ◐ |

**Höhepunkt:** Die erste Ausfahrt mit neuen Polstern. **Tiefpunkt:** Sorge um die Saison.

### Persona D: Hotelier (Familienhotel 40 bis 120 Zimmer, Arlberg, Bregenzerwald oder Bodensee, Renovierung oder Neueröffnung)

Kernmotive: **Sicherheit** (Eröffnungstermin, Budget), **Rendite** (ADR, Bewertungen), **Kontrolle** (eine Ansprechperson), **Status** (ein Haus, über das man spricht), **Gesichtswahrung** gegenüber Eigentümerfamilie und Bank.

| Phase | Gefühl | Motiv | Angst | Die Seite muss liefern | Ist |
|---|---|---|---|---|---|
| 1. Auslöser (Bewertungen kritisieren „in die Jahre gekommen“) | Druck, Kränkung | Wettbewerbsfähigkeit | Umsatzausfall während des Umbaus | Seite „Hotel und Gastronomie einrichten“ | ✗ |
| 2. Recherche (meist allein, 83 % der Zeit ohne Anbieter, siehe B9) | nüchtern | Risikominimierung | Kostenexplosion, Terminverzug | Ablauf in Phasen (Konzept, Musterzimmer, Ausschreibung, Lieferung, Montage, Übergabe), Projekt-Dossier als PDF | ✗ |
| 3. Interne Abstimmung | Unsicherheit | Gesichtswahrung | „Wenn das schiefgeht, bin ich schuld.“ | Musterzimmer-Konzept als risikoarmer Einstieg | ✗ |
| 4. Erstkontakt | geschäftlich | Effizienz | Zeitverschwendung | Formular mit „Hotel / Gastronomie“, Zimmerzahl, Zeitfenster | ✗ |
| 5. Musterzimmer | Erleichterung, Begeisterung | Sicherheit, Status | Abweichung in der Serie | Original-Produkte, keine Kopien, dokumentierte Abnahme | ✗ |
| 6. Eröffnung | Stolz | Rendite | — | Fotoshooting gemeinsam, Referenz | ✗ |

**Höhepunkt:** Das fertige Musterzimmer. **Tiefpunkt:** die Entscheidung im Aufsichtskreis. Für den Hotelier ist das Musterzimmer, was für das Paar die Handskizze ist.

### Emotions-Matrix auf einen Blick

| Motiv / Angst | Neubau-Paar | Architektin CH | Bootseigner | Hotelier |
|---|---|---|---|---|
| Status | leise, mittel | hoch (Reputation) | hoch (Hafen) | mittel (Bewertungen) |
| Geborgenheit | **sehr hoch** | gering | mittel | gering (für Gäste hoch) |
| Ästhetik | hoch | **sehr hoch** | hoch | hoch |
| Sicherheit | hoch | hoch | hoch (Material) | **sehr hoch** (Termin, Budget) |
| Angst Fehlkauf | **sehr hoch** | mittel | mittel | hoch |
| Angst Preis | hoch | gering (fremdes Budget) | gering | **sehr hoch** (Kalkulation) |
| Angst Lieferzeit | hoch (Einzug) | hoch (Bauzeitplan) | hoch (Saison) | **sehr hoch** (Eröffnung) |
| Bester Vertrauensbeweis | Gesichter, Projekte, Café | Muster, Daten, Rollenklarheit | Material, Werft, Ablauf an Bord | Musterzimmer, Phasenplan, Dossier |
| Bester erster Schritt | Grundriss schicken | Muster anfordern | Fotos vom Boot schicken | Dossier laden, Musterzimmer-Gespräch |

---

## 4. FERTIG: 15 konkrete Änderungen an Seiten

Jede Änderung nennt die Seite, den heutigen Stand, die neue Fassung, die Begründung und eine Prüfung gegen Dark Patterns. Die Texte sind umsetzbar. Händler-Aussagen kommen nur für ClassiCon und Ezarri vor, Superlative gar nicht.

### Ä1. Startseite: neuer Abschnitt „So entsteht Ihr Raum“ (Handzeichnung, Modell, Rendering) — P0
- **Ort:** `src/app/[locale]/page.js`, direkt nach `HostPromises`, neue Komponente `Home/Process` (DE-Texte unten, EN/FR/IT übersetzen).
- **Heute:** nicht vorhanden (Inhaber-Entscheidung 8 offen).
- **Neu (Text):**
  - Eyebrow: „Unsere Arbeitsweise“
  - Titel: „Erst der Stift. Dann der Bildschirm.“
  - Lead: „Harald Menghin zeichnet jede Einrichtung zuerst von Hand. Bei größeren Projekten baut er ein kleines Modell, so wie ein Architekt. Erst danach folgen die 3D-Planung und ein fotorealistisches Bild. So sehen Sie Ihren Raum, bevor etwas bestellt wird.“
  - Drei Schritte: „1 · Vor Ort. Wir kommen zu Ihnen, bei Bedarf ein bis zwei Tage. Licht, Klima, Wege: Wir schauen, wie Sie leben.“ · „2 · Skizze und Modell. Von Hand, auf Papier und im Maßstab. Hier dürfen Sie mitzeichnen.“ · „3 · Rendering. Erst dann das fotorealistische Bild, mit den Stoffen und Oberflächen, die Sie in der Ausstellung angefasst haben.“
  - Schluss: „Designs, die leben.“ · Link: „Mehr zur Arbeitsweise“
- **Bild:** echtes Foto der Hände beim Zeichnen plus echtes Modell (Inhaber liefert, keine KI, Entscheidung 8).
- **Begründung:** Reue-Schutz, Mitgestaltung und Aufwandssignal (B3). Das ist der Unterschied, den kein Mitbewerber mit Katalog-Rendering zeigen kann.
- **Dark-Pattern-Prüfung:** Es ist eine wahre Beschreibung der Arbeitsweise und macht kein Versprechen zum Ergebnis.

### Ä2. Startseite und „Das Haus“: Gesicht des Gastgebers zeigen — P0
- **Ort:** Abschnitt `host` („Wir sind Gastgeber…“), rechts ein Hochformat-Porträt.
- **Neu:** Foto von Harald Menghin am Café-Tisch mit Skizzenblock, Blick zum Text hin (Blickrichtung lenkt Aufmerksamkeit, expertenrat/04 E5). Bildunterschrift: „Harald Menghin, Inhaber und Planer. Er zeichnet, bevor er plant.“
- **Begründung:** Geborgenheit entsteht über Personen (B4). Das Gesicht macht das Gastgeber-Versprechen glaubwürdig.
- **Prüfung:** echtes Foto, Einwilligung liegt beim Inhaber selbst.

### Ä3. Danke-Seite aller Formulare: Ende neu gestalten (Peak-End) — P0
- **Ort:** `MultiStepForm.thankYou`, `FormSuccess`, Kontakt- und Produktanfrage.
- **Heute:** „Vielen Dank für Ihre Anfrage. Wir melden uns in Kürze bei Ihnen.“
- **Neu:**
  - Titel: „Danke. Ihre Anfrage ist bei uns.“
  - Text: „Wir melden uns innerhalb eines Werktags persönlich, meist per Telefon. So geht es weiter:“
  - Drei Schritte: „1 · Wir rufen an und fragen nach, was Ihnen wichtig ist. · 2 · Wir vereinbaren einen Termin in Lochau, bei Ihnen vor Ort oder an Bord. · 3 · Sie bekommen eine erste Handskizze, bevor über Preise gesprochen wird.“ (Schritt 3 nur, wenn der Inhaber das so lebt, sonst weglassen.)
  - Unten: „Bis dahin: Grundriss oder Fotos schon jetzt schicken“ (Link Handy-Upload) · „Öffnungszeiten und Anfahrt“
- **Voraussetzung:** Der Inhaber sagt die Antwortzeit verbindlich zu (z. B. „innerhalb eines Werktags“). Ohne Zusage: „in der Regel innerhalb von zwei Werktagen“.
- **Begründung:** Erklärtes Warten fühlt sich kürzer an, das Ende prägt die Erinnerung (B6). Das kostet nichts und wirkt auf jede einzelne Anfrage.
- **Prüfung:** Die Zusage muss wahr sein, es gibt keinen Druck.

### Ä4. Formular Schritt 2: Personas sichtbar machen — P0
- **Ort:** `MultiStepForm.step2Options` (alle Sprachen) und die Payload-Zuordnung in `BeratungClient`.
- **Heute:** „in einem Einfamilienhaus / in einer Wohnung / in einer gewerblichen Immobilie“
- **Neu:** „in einem Haus“ · „in einer Wohnung“ · „auf einem Boot oder im Bootshaus“ · „in einem Hotel, Restaurant oder Café“ · „in einem Büro oder einer Praxis“ · „im Garten oder am Pool“
- **Begründung:** Wer sich in der Auswahl findet, fühlt sich gemeint und bleibt. Das sortiert die Anfrage zugleich für den Vertrieb (Hotel-Leads sofort an den Inhaber).
- **Prüfung:** neutral, keine Vorauswahl.

### Ä5. Formular-Knopf und Mikrotexte — P1
- **Heute:** „Absenden“
- **Neu:** letzter Schritt „Anfrage senden“. Darunter klein: „Unverbindlich. Wir melden uns persönlich, kein Newsletter ohne Ihre Zustimmung.“
- **Begründung:** Der Knopf benennt, was passiert. Die Zeile darunter nimmt die zwei häufigsten Ängste (Verpflichtung, Spam) direkt am Entscheidungspunkt.
- **Prüfung:** Die Aussage muss technisch stimmen (Newsletter nur mit eigenem Häkchen, ist so umgesetzt).

### Ä6. Neue Seite „Hotel und Gastronomie einrichten“ plus Menüpunkt — P0
- **Ort:** neue Route `/de/hotel-gastronomie-einrichten`, Menü „Leistungen“, Startseite `Services` als fünfte Karte. Inhalt nach `wachstumsrat/hotel-contract.md`, psychologisch so geordnet:
  1. Hero (Bild: eigenes Foto eines bestehenden Gastro-Projekts, sobald freigegeben, bis dahin Café Platzhirsch als „unser eigenes Haus“): „Ihre Gäste erinnern sich an Räume.“ Lead: „Wir richten Hotelzimmer, Lobbys, Restaurants und Wellnessbereiche ein, von der ersten Handskizze bis zur Übergabe. Eine Ansprechperson, ein Zeitplan.“
  2. **Angst zuerst beantworten** (Kacheln): „Termin: Wir planen rückwärts von Ihrer Eröffnung.“ · „Budget: Sie bekommen Kostenrahmen je Zimmer, bevor bestellt wird.“ · „Original: Wir liefern die Produkte, die im Entwurf stehen, ohne stillen Austausch.“ · „Betrieb: Möbel und Stoffe für den Hotelalltag, auf Wunsch mit Brandschutz- und Abriebwerten vom Hersteller.“
  3. **Musterzimmer** als Einstieg: „Beginnen Sie mit einem Zimmer. Sie sehen, fühlen und testen es, bevor die Serie bestellt wird.“
  4. Phasenplan (Konzept, Musterzimmer, Kostenrahmen, Bestellung, Lieferung, Montage, Übergabe).
  5. Ezarri für Pool und Wellness (hier ist eine Händler-Aussage erlaubt: „Platzhirsch ist Vertragshändler von Ezarri.“) und ClassiCon für Lobby-Klassiker (Vertragshändler).
  6. CTA: „Projekt-Dossier anfordern (PDF)“ und „Gespräch zum Musterzimmer vereinbaren“.
- **Begründung:** Der Hotelier recherchiert allein und muss intern überzeugen (B9). Das Musterzimmer ist sein risikoarmer erster Schritt und seine Rückversicherung vor Eigentümer und Bank.
- **Prüfung:** Werte wie Brandschutz nur „vom Hersteller“, keine eigenen Zertifikatsversprechen. Keine erfundenen Referenzen.

### Ä7. Beratung, erster Bildschirm auf dem Handy: Bild und Mensch — P1
- **Ort:** `BeratungHeader` (`src/components/Beratung/advice.js`).
- **Heute:** Überschrift, Text und Knopf. Auf dem iPhone sieht man kein Bild.
- **Neu:** Unter dem Lead (vor dem Knopf) ein schmales Querformat: Skizzenblatt mit Grundriss und Hand (Inhaber-Foto). Darunter eine Zeile: „Gespräch mit Harald Menghin oder einem Teammitglied, in Lochau, bei Ihnen oder per Video.“
- **Begründung:** Hier entscheidet sich, ob man sich anvertraut (B7). Ein Bild der Arbeit beruhigt mehr als ein weiterer Satz.

### Ä8. Kleiner erster Schritt: „Grundriss schicken, Skizze bekommen“ — P1
- **Ort:** Startseite (`ClosingCta` als zweite Option), Küchen-, Interior- und Wohnzimmer-Landingpages, Beratung.
- **Neu:** Zweiter Knopf neben „Termin wählen“: „Grundriss schicken“ → Handy-Upload. Text darunter: „Sie schicken Grundriss oder Fotos. Wir melden uns mit einer ersten Einschätzung und Fragen. Kostenlos und unverbindlich.“
- **Voraussetzung:** Der Inhaber entscheidet, was „erste Einschätzung“ heißt (z. B. 15 Minuten Telefonat statt Skizze, damit keine kostenlose Planungsleistung verschenkt wird).
- **Begründung:** Fuß-in-der-Tür (B6). Wer im Rohbau steht, scheut den Termin, schickt aber gern ein Foto.
- **Prüfung:** Der Umfang wird klar benannt. Es gibt keine versteckte Kostenfalle.

### Ä9. Preis-Angst abbauen: Budget-Rahmen statt Schweigen — P1
- **Ort:** Küchen-Landingpage, Interior-Landingpage, Hotel-Seite, FAQ.
- **Neu (FAQ-Block):** „Was kostet eine Planung bei Ihnen?“ → „Das erste Gespräch in der Ausstellung ist kostenlos. Für Planungen mit Skizze, Modell und Rendering erstellen wir Ihnen vorher ein Angebot. Wird die Einrichtung bei uns bestellt, rechnen wir …“ (Lücke: Inhaber füllt das tatsächliche Modell). Und: „Mit welchem Budget sollte ich rechnen?“ → Spannen nur nach Inhaber-Freigabe, als „Erfahrungswerte, keine Preisangabe“.
- **Begründung:** Offenheit über Kosten schafft Vertrauen (expertenrat/02 E4). Das Schweigen über Preise lässt das Paar mit der schlimmsten Annahme allein.
- **Prüfung:** Nur echte, freigegebene Werte (Preise sind laut Inhaber-Entscheidung „nicht entschieden“, deshalb bis dahin nur den ersten Satz verwenden).

### Ä10. „Gebaut, um zu bleiben“: das funktionale Alibi auf Produktseiten — P2
- **Ort:** Produktdetailseite, unter den Maßen.
- **Neu:** Block mit drei Zeilen, nur befüllt, wenn der Hersteller es angibt: „Bezug abnehmbar“ · „Nachbezug auf Anfrage beim Hersteller“ · „Für draußen geeignet“. Überschrift: „Gebaut, um zu bleiben.“
- **Begründung:** Ein praktischer Zusatznutzen senkt das Schuldgefühl bei Luxuskäufen (Keinan, Kivetz & Netzer 2016, expertenrat/01 E3). Das stärkt die Rechtfertigung vor dem Partner.
- **Prüfung:** nur Herstellerangaben, keine Lebensdauer-Garantie (UWG).

### Ä11. Yacht-Hero: Material statt Illustration — P1
- **Ort:** `YachtHero` / `/de/yacht-interior`.
- **Heute:** Strich-Boot mit leuchtend orangen Fenstern (siehe Screenshot).
- **Neu:** Hero-Hintergrund als Nahaufnahme von Outdoor-Stoff mit Kedernaht auf Teak (eigenes Foto aus der Ausstellung, z. B. Paola-Lenti-Muster). Die Illustration wandert in den Abschnitt „Boot in 3D“. Falls die Illustration bleibt: Fenster in Messing `#d1b250` gedämpft statt Orange.
- **Neuer Untertitel unter „Nehmen Sie Platz – an Bord.“:** „Stoffe, Polster und Licht, die Sonne, Wasser und Feuchte aushalten. Ausgewählt mit Ihnen, an Bord oder im Showroom.“ (nur Materialeigenschaften, die die Hersteller angeben)
- **Begründung:** Haptische Vorstellung entsteht über Nahaufnahmen (expertenrat/04 E6). Der Bootseigner sucht Material-Sicherheit, keine Grafik. Der gesättigte Ton lenkt vom CTA ab (B7).

### Ä12. Yacht: Saison-Planung als Angstlöser — P2
- **Ort:** Abschnitt „Ablauf“ auf `/de/yacht-interior`.
- **Neu:** „Planen Sie rückwärts von der Saison. Polster und Stoffe brauchen je nach Hersteller mehrere Wochen Fertigung. Wenn wir Ihr Boot im Winter vermessen, ist genug Zeit bis zum Frühjahr. Den genauen Termin nennen wir Ihnen mit dem Angebot.“
- **Begründung:** Unbestimmtes Warten verunsichert (B6). Es ist kein künstlicher Zeitdruck, sondern eine echte Planungsinformation.
- **Prüfung:** keine Frist, kein Countdown, kein Rabatt für frühes Buchen.

### Ä13. St. Gallen und alle CH-Seiten: Einstieg für Architektinnen und Planer — P1
- **Ort:** `/de/designermoebel-st-gallen`, `/de/einkaufen-aus-der-schweiz`, später eigene Seite `/de/fuer-architekten`.
- **Neu (Block nach dem Intro):**
  - Titel: „Für Architektinnen, Architekten und Planer“
  - Text: „Ihr Entwurf bleibt Ihr Entwurf. Wir besorgen Muster, Datenblätter und Ausführungen, stimmen Liefertermine mit Ihrem Bauzeitplan ab und klären Einfuhr und Montage, bevor bestellt wird. Eine feste Ansprechperson bei uns.“
  - Liste: „Muster und Materialtafeln auf Anfrage“ · „Datenblätter und Planungsdaten, soweit der Hersteller sie bereitstellt“ · „Gemeinsame Termine mit Ihrer Bauherrschaft in Lochau“ · „Abstimmung von Lieferung und Montage in der Schweiz“
  - CTA: „Muster anfordern“ (Formular mit Feld „Büro“)
- **Begründung:** Die Architektin fürchtet Kontrollverlust und Mehraufwand (Persona B). Der Satz „Ihr Entwurf bleibt Ihr Entwurf“ trifft ihre Reputationsangst direkt.
- **Prüfung:** Leistungen nur, soweit tatsächlich angeboten. Keine Provisionsversprechen ohne Inhaber-Freigabe.

### Ä14. Startseite: Beweis durch Arbeit, bis Projekte freigegeben sind — P1
- **Ort:** neuer schmaler Abschnitt vor `Journal`, später ersetzt durch `Projekte`.
- **Neu:** „Aus der Werkstatt“: drei bis sechs echte Fotos von Skizzenblättern, einem Modell, einer Materialtafel und einer Montage (ohne Kunde, ohne Adresse). Unterschrift je Bild, z. B. „Skizze für ein Wohnzimmer am Bodensee, 2026“. Daneben ein Google-Link: „Bewertungen auf Google lesen“, **ohne** Sternezahl im eigenen Code, solange sie nicht live abgefragt wird.
- **Begründung:** Sozialer Beweis fehlt (B5). Arbeitsbeweise sind erlaubt, sofort machbar und glaubwürdig.
- **Prüfung:** keine erfundenen Kunden, keine KI-Skizzen, keine selbst gesetzten Sterne.

### Ä15. Cookie-Text im Ton des Hauses — P2
- **Ort:** `Cookies`-Namespace in allen Sprachen.
- **Heute:** „Wir verwenden Cookies, um Ihnen ein gutes Nutzererlebnis bieten zu können.“
- **Neu:** „Ein paar Cookies brauchen wir, damit die Seite funktioniert. Andere helfen uns zu verstehen, welche Inhalte Sie interessieren. Die entscheiden Sie selbst.“ Knöpfe bleiben gleichwertig.
- **Begründung:** Das ist der erste Text, den jeder Besucher liest. Eine Floskel bricht den warmen Ton, ein ehrlicher Satz stärkt Integrität (Vertrauensdimension nach Mayer, Davis & Schoorman 1995, *AMR* 20(3)) [belegt].
- **Prüfung:** Vom Datenschutzjuristen gegenlesen lassen. Die Knöpfe bleiben gleichrangig, kein „Nudging“ zum Akzeptieren.

### Zusatz: Nach dem Kauf (für Portal und CRM, außerhalb der 15)
- **Einzugs-Ritual:** Nach der Montage eine handgeschriebene Karte mit der ersten Skizze des Projekts als Kopie. Kosten gering, wirkt als Höhepunkt am Ende der Reise und als Gesprächsstoff bei Gästen (sozialer Beweis offline).
- **Portal-Status in Worten statt Codes:** „Ihr Sofa wird gerade in Italien genäht“, sobald der Hersteller den Status meldet. Nur echte Status, keine geschätzten Fortschrittsbalken.

---

## 5. Leitlinien für Farbe, Bild und Sprache (Kurzregeln für alle Teams)

**Farbe**
- Gesättigte Farbe nur für echte Zustände (Fehler, Erfolg) und höchstens ein Akzent je Bildschirm. Messing ist Akzent, kein Flächenton.
- Pro Seite höchstens ein dunkles Kapitel (Regel aus `globals.css` bestätigt). Die Yacht-Seite darf dunkel sein, dann aber ohne zweiten Signalton.
- Hotel-Seite: helle, ruhige Grundtöne (Kalkulation braucht Klarheit), ein warmes Bild als Einstieg.

**Bild**
- Je Seite mindestens ein Mensch oder eine Hand (Zeichnen, Stoff prüfen, Probesitzen), außer auf reinen Katalogseiten.
- Nahaufnahme von Material vor Totale, wenn es um Angst vor dem Fehlkauf geht (Produkt, Yacht, Outdoor).
- Keine KI-Räume als Beweis. KI-Konzeptbilder nur gekennzeichnet und nur als Inspiration (wie auf der Yacht-Seite umgesetzt).

**Sprache**
- Jeder CTA sagt, was passiert („Anfrage senden“, „Termin wählen“, „Muster anfordern“), nie „Absenden“, „Mehr“ oder „Jetzt!“.
- Angst immer konkret beantworten, nie wegreden: Zeit, Ablauf, Kosten des ersten Schritts.
- Wir-Sätze mit Menschen („Harald zeichnet“) statt Abstraktionen („Wir bieten ganzheitliche Lösungen“).
- Keine Superlative, kein „exklusiv“, keine Händler-Aussagen außer ClassiCon und Ezarri.

---

## 6. Maßnahmen-Tabelle

Alle Umsatzeffekte sind **[Schätzung]**. Grundlage: ein typischer Auftrag liegt bei Einrichtung plus Küche geschätzt zwischen 30.000 und 150.000 €, ein Hotelauftrag deutlich darüber. Schon ein zusätzlicher Abschluss im Monat verändert den Monatsumsatz spürbar.

| Prio | Maßnahme | Aufwand | Kosten grob | Erwarteter Umsatzeffekt (Begründung) | Wer |
|---|---|---|---|---|---|
| P0 | Ä1 Abschnitt „Erst der Stift. Dann der Bildschirm.“ auf Startseite, plus eigene Arbeitsweise-Seite | M | Code 1–2 Tage; Fotos siehe Shooting | Hoch: der einzige Unterschied, den Mitbewerber nicht kopieren können; senkt die Angst vor dem Fehlkauf. Geschätzt +10–20 % Terminanfragen von der Startseite | Code-Team, Inhaber (Fotos, Freigabe) |
| P0 | Shooting: Harald zeichnend, Hände, Modell, Materialtafeln, Café (Grundlage für Ä1, Ä2, Ä7, Ä14) | S | 500–1.500 € (lokaler Fotograf, halber Tag) [Schätzung] | Hoch: liefert Gesichter und Arbeitsbeweise für die ganze Seite; ohne Shooting bleiben 4 Änderungen leer | Inhaber, Partner (Fotograf) |
| P0 | Ä3 Danke-Seite mit Antwortzeit und Ablauf | S | 0,5 Tag | Mittel: weniger „kalte“ Leads, weil sich die Kunden erinnern und abheben; Wirkung auf jede Anfrage | Code-Team; Inhaber sagt Antwortzeit zu |
| P0 | Ä4 Formularoptionen Boot, Hotel/Gastro, Büro, Garten/Pool | S | 0,5 Tag | Mittel bis hoch: Hotel- und Boot-Anfragen werden erkennbar und schnell an den Inhaber geleitet | Code-Team |
| P0 | Ä6 Hotel- und Gastro-Seite mit Musterzimmer-Einstieg und Dossier-PDF | L | 3–5 Tage Code + Text; Dossier-Layout 0,5 Tag | Sehr hoch: ein einziger Hotelauftrag kann ein Vielfaches eines Privatauftrags sein; heute gibt es dafür keinen Einstieg | Code-Team, Inhaber (Freigabe, Referenzen) |
| P1 | Ä2 Porträt im Gastgeber-Abschnitt | S | im Shooting enthalten | Mittel: Wärme und Vertrauen auf der meistbesuchten Seite | Code-Team |
| P1 | Ä7 Bild und Personenzeile auf Beratung (Handy) | S | 0,5 Tag | Mittel: Beratung ist die Seite mit der höchsten Absicht | Code-Team |
| P1 | Ä8 „Grundriss schicken“ als kleiner erster Schritt | S | 1 Tag (Upload existiert) | Hoch: holt die Zögernden (Rohbau-Phase) früh in den Kontakt; geschätzt +15–30 % Erstkontakte | Code-Team; Inhaber legt Umfang fest |
| P1 | Ä9 FAQ zu Planungskosten (ohne Preise, bis freigegeben) | S | 0,5 Tag | Mittel: weniger Abbrüche aus Preisangst | Inhaber (Inhalt), Code-Team |
| P1 | Ä11 Yacht-Hero mit Material statt Illustration | S | 0,5 Tag + Foto | Mittel: der Bootseigner sieht Kompetenz an Bord | Code-Team, Inhaber (Foto) |
| P1 | Ä13 Architekten-Block auf CH-Seiten, später eigene Seite | M | 1–2 Tage | Hoch: eine Architektin bringt mehrere Projekte pro Jahr; Hebel über Empfehlung | Code-Team, Inhaber (Leistungsumfang) |
| P1 | Ä14 „Aus der Werkstatt“ und Google-Link | S | 0,5 Tag | Mittel: Beweis durch Arbeit, bis Projekte freigegeben sind | Code-Team |
| P1 | Drei Referenzprojekte mit Einwilligung freigeben (Schema steht bereit) | M | Einwilligungsformular (Anwalt), Fotos | Sehr hoch: sozialer Beweis ist die größte Lücke | Inhaber, Partner (Anwalt, Fotograf) |
| P2 | Ä5 Knopf „Anfrage senden“ plus Mikrotext | S | 1 Stunde | Gering bis mittel: weniger Abbrüche im letzten Schritt | Code-Team |
| P2 | Ä10 „Gebaut, um zu bleiben“ auf Produktseiten | M | 1–2 Tage (Datenfeld je Hersteller) | Mittel: hilft bei der Rechtfertigung vor dem Partner | Code-Team, Inhaber (Daten) |
| P2 | Ä12 Saison-Planung Yacht | S | 1 Stunde | Gering bis mittel: zieht Aufträge in den Winter vor und glättet die Auslastung | Code-Team |
| P2 | Ä15 Cookie-Text im Hauston | S | 1 Stunde + Juristen-Check | Gering: Vertrauen beim ersten Kontakt | Code-Team, Partner (Datenschutzjurist) |
| P2 | Einzugs-Ritual (Karte mit Skizzenkopie) | S | ca. 5–10 € je Auftrag [Schätzung] | Mittel: Weiterempfehlungen und Wiederkauf | Inhaber |
| P3 | A/B-Test: Startseiten-Hero mit Hand-und-Skizze-Bild gegen heutiges Raumbild | M | Testwerkzeug, Consent beachten | Erkenntnis: welches Gefühl mehr Termine bringt | Code-Team |
| P3 | Kundeninterviews: 8–10 echte Kunden (je 2 je Persona) zu Ängsten und Auslösern, 30 Minuten | M | Zeit des Inhabers, kleines Dankeschön (Café-Gutschein) | Ersetzt die Schätzungen dieses Berichts durch echte Daten | Inhaber, Partner |

---

## Quellen

- Belk, R. W. (1988). Possessions and the Extended Self. *Journal of Consumer Research* 15(2), 139–168. [belegt]
- Chernev, A., Böckenholt, U. & Goodman, J. (2015). Choice overload: A conceptual review and meta-analysis. *Journal of Consumer Psychology* 25(2), 333–358. [belegt]
- Freedman, J. L. & Fraser, S. C. (1966). Compliance without pressure: The foot-in-the-door technique. *JPSP* 4(2), 195–202. [belegt]
- Kahneman, D., Fredrickson, B. L., Schreiber, C. A. & Redelmeier, D. A. (1993). When more pain is preferred to less: Adding a better end. *Psychological Science* 4(6), 401–405. [belegt]
- Kahneman, D. & Tversky, A. (1979). Prospect Theory. *Econometrica* 47(2), 263–291. [belegt]
- Labrecque, L. I. & Milne, G. R. (2012). Exciting red and competent blue: the importance of color in marketing. *JAMS* 40(5), 711–727. [Abstract](https://colab.ws/articles/10.1007/s11747-010-0245-y) [Sekundär]
- Maister, D. (1985). The Psychology of Waiting Lines. In: Czepiel et al., *The Service Encounter*. [Sekundär]
- Mayer, R. C., Davis, J. H. & Schoorman, F. D. (1995). An integrative model of organizational trust. *Academy of Management Review* 20(3), 709–734. [belegt]
- Norton, M. I., Mochon, D. & Ariely, D. (2012). The IKEA effect: When labor leads to love. *Journal of Consumer Psychology* 22(3), 453–460. [Harvard DASH](https://dash.harvard.edu/handle/1/12136084) [belegt]
- Zeelenberg, M. & Pieters, R. (2007). A theory of regret regulation 1.0. *Journal of Consumer Psychology* 17(1), 3–18. [Sekundär]
- CEB/Gartner, B2B-Kaufreise (17 % der Zeit im Anbieterkontakt), über: [destinationcrm](https://www.destinationcrm.com/Articles/CRM-Insights/Insight/Buyer-Enablement-Is-the-Key-to-B2B-Sales-127790.aspx), [istart.com.au](https://istart.com.au/?p=29514) [Sekundär, Daten um 2018]
- Hotel-FF&E-Einkauf und Rollen: [nerej.com](https://nerej.com/print/16048), [Beyer Brown](https://beyerbrown.substack.com/p/hotel-ff-and-e-purchasing-solutions), [To The Source](https://tothesource.com/news-insights/luxury-ffe-evolution) [Sekundär, Anbieterquellen]
- EU-Kommission, UGP-Leitfaden 29.12.2021, Abschnitt 4.2.7 (Dark Patterns), über: [Covington Inside Privacy](https://www.insideprivacy.com/eu-data-protection/the-eu-stance-on-dark-patterns/), [Osborne Clarke](https://www.osborneclarke.com/insights/digital-fairness-act-unpacked-dark-patterns) [Sekundär]
- Interne Berichte: `Marktresearch/digital/expertenrat/01`–`04`, `wachstumsrat/hotel-contract.md`, `wachstumsrat/funnel.md`, `teamleiter/inhaber-entscheidungen.md`.
