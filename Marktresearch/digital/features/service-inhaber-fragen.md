# Services – offene Fragen an den Inhaber

**Stand:** 29.10.2026 · Sammeldatei aller Service-Teams (Winterlager, Pflege-Abo, Wunschliste, Projekt-Tagebuch). Jedes Team ergänzt nur seinen Abschnitt.

## Winterlager und Pflege für Outdoor-Möbel (Service 3)

Konfiguration: `src/lib/service/winterlager/config.js` → `WINTERLAGER_CONFIG` (leer = Zeile erscheint nicht, Preise „auf Anfrage“). Seite: `/de|en/outdoor-winterservice` (noindex). Bereits vom Inhaber bestätigt (29.10.2026): großes eigenes Lager, Abholung und Rückbringung durch Platzhirsch, Radius und Preise auf Anfrage.

| # | Frage | Feld | Heute |
|---|---|---|---|
| WL1 | Preis für eine Saison (Festpreis, „ab“-Preis je Möbelstück/Volumen oder nur nach Angebot)? | `preise.einmal.de/en` | „Auf Anfrage“ |
| WL2 | Preis und Umfang des Abos (jährlich, was ist enthalten: Abholung, Pflege, Lagerung, Rückbringung, Aufbau?) | `preise.abo.de/en` | „Auf Anfrage“ |
| WL3 | Abholradius in km um Lochau (oder Gebiete/Orte)? CH/DE/FL mit Zoll? | `radiusKm` | „Im Umkreis von Lochau / Bodenseeraum auf Anfrage“ |
| WL4 | Abhol- und Rückgabezeitraum (z. B. „Oktober bis November“, „ab Mitte April“)? | `abholzeitraum`, `rueckgabezeitraum` | keine Zeile, nur „im Herbst“/„im Frühling“ |
| WL5 | Anmeldeschluss je Saison (Datum)? Mit Datum erscheint ein Countdown. | `anmeldeschluss` | kein Stichtag, kein Countdown |
| WL6 | Sind eingelagerte Möbel versichert (Feuer, Wasser, Diebstahl)? Bis zu welchem Wert? Wortlaut für die Seite. | `versicherung.de/en` | keine Aussage |
| WL7 | Lager: Kennzeichnung je Auftrag, getrennte Lagerung, Zugang Dritter – was dürfen wir zusagen? | Text `copy.js` | nur „trocken in unserem eigenen Lager“ |
| WL8 | Kleinreparaturen (Schrauben nachziehen, Nähte): selbst oder über befugte Partnerbetriebe? Größere Reparaturen? (Gewerbefrage wie Pflege E) | `kleinreparaturAufAnfrage` | „auf Anfrage, nach Rücksprache“ |
| WL9 | Aufbau im Frühling auf Wunsch – mit Aufpreis? | `aufbauAufWunsch` | als Wunsch im Formular |
| WL10 | Abo-Laufzeit, Verlängerung und Kündigung (Vorschlag siehe service-recht-vorschlag.md, Winterlager B) | `abo.laufzeit`, `abo.kuendigung`, `abo.bedingungenPfad` | „Laufzeit und Kündigung stehen schriftlich in Ihrem Angebot“ |
| WL11 | Pflege von Marken außer Gloster (z. B. Paola Lenti, Dedon, Tribù): Pflegeblätter der Hersteller ablegen, erst dann nennen wir sie. | `SOURCES` in `copy.js` | nur Gloster mit Quelle |
| WL12 | Nicht abgeholte Möbel / Zahlungsverzug: wie lange lagern Sie weiter, ab wann Lagergeld? | Rechtsvorschlag Winterlager A | keine Aussage |
| WL13 | Freigabe der Outdoor-Fotos (`/Images/Outdoor`) für diese Seite? | – | Seite ohne Fotos |
| WL14 | Wer bearbeitet Anmeldungen (Lead-Kontext `winterlager`) und in welcher Frist? | Kundenbetreuung | keine Frist genannt |
| WL15 | Seite indexieren und in Menü/Footer/Leistungen verlinken, sobald WL1–WL6 und WL10 geklärt sind? | `indexieren` | `false` |

## Wunschliste (Service 10)

Konfiguration: `src/lib/wunschliste/config.js` → `WUNSCHLISTE_INHABER` (leer = Zeile erscheint nicht).

| # | Frage | Feld | Heute |
|---|---|---|---|
| W1 | Gibt es für Schenkende ein Angebot im Café (z. B. „Der Kaffee geht auf uns“)? Genauer Wortlaut je Sprache. | `cafeOffer.de/en/fr/it` | leer → nur „Gemeinsam aussuchen“ + Adresse/Öffnungszeiten |
| W2 | Wer ist die Ansprechperson für Wunschlisten (Name wie auf der Team-Seite)? | `contactPerson` | leer → nur Studio-Telefon/-E-Mail |
| W3 | Mindestbetrag je Beitrag zum Gemeinschafts-Gutschein? (Gutschein heute ab 25 €, `AMOUNT_MIN`) | `contributionMin` | keine Zahl auf der Seite, Betrag ist Vorschlag |
| W4 | Speicherdauer: wie lange nach dem Anlass bleibt eine Liste erreichbar? (mit Kanzlei, siehe service-recht-vorschlag.md) | `retentionMonths` | technischer Standard 12 Monate |
| W5 | Gemeinschafts-Gutschein: Soll das Studio die Beiträge zu EINEM Gutschein auf die Beschenkten zusammenfassen (Vorschlag) oder bekommt jede schenkende Person einen eigenen Gutschein, den sie weitergibt? | Ablauf in `groupVoucher.js` | Vorschlag „ein Gutschein“, im Anfrage-Weg persönlich |
| W6 | Wer ruft bei Beitrags-Anfragen zurück, und in welcher Frist (z. B. 2 Werktage)? Ohne Zusage steht keine Frist auf der Seite. | – | keine Frist genannt |
| W7 | Live-Speicher: Frappe-Doctype „Wunschliste“ (Spezifikation `../platzhirsch-frappe-service/wunschliste/README.md`) durch den Frappe-Entwickler – oder übergangsweise `WUNSCHLISTE_LOCAL_DIR` auf dem Server (dann zeigt die Seite für Beiträge nur Telefon/E-Mail, weil Anfragen sonst im Studio nicht ankämen)? | env | Entwicklung: `.data/wunschliste` |
| W9 | Gutschein-Beiträge auf Wunschlisten: Solange die Gutscheine nicht freigegeben sind (`/de/gutscheine` = 404), zeigt die Produktion KEINEN Beitrags-Abschnitt. Sollen Beiträge vorher als persönliche Anfrage möglich sein? Online-Kauf erst nach Kanzlei-Freigabe von Ergänzung B UND Anbindung der Kaufstrecke. | `GEMEINSCHAFTS_GUTSCHEIN` in `config.js`, `mode.js` | Produktion „aus“, Entwicklung Anfrage-Weg |
| W10 | Wer sperrt eine gemeldete Liste („Liste melden“ an info@platzhirsch.studio), und wie schnell? | `REPORT_EMAIL` | Meldung per E-Mail, Sperre manuell (Status „widerrufen“) |
| W11 | Live erst mit ergänzter Datenschutzerklärung (Abschnitt Wunschliste A): Freigabe durch Kanzlei, dann `DATENSCHUTZ_WUNSCHLISTE = "freigegeben"`. | `config.js` | Produktion aus |
| W8 | Sollen Ausstellungsstücke/Atelier-Stücke auf einer Wunschliste reserviert werden können (Reservierung beim Studio), oder bleibt „Reservieren“ eine reine Absprache unter den Schenkenden (heute)? | – | reine Absprache, kein Lager-Reservat |


## Pflege-Abo Leder, Stoff, Holz (Service 4)

Konfiguration: `src/lib/service/pflege/config.js` → `PFLEGE_CONFIG` (leer = Zeile erscheint nicht, Preise „auf Anfrage“).

| # | Frage | Feld | Heute |
|---|---|---|---|
| P1 | Preis je Pflegetermin (Festpreis, „ab“-Preis oder nur nach Angebot)? | `preisTermin` | „auf Anfrage“ |
| P2 | Preis des Jahres-Abos und was es genau umfasst (1 Termin/Jahr? Anzahl Stücke? Pflegemittel inklusive?) | `preisAbo` | „auf Anfrage“, Leistungen als Grundstruktur |
| P3 | Anfahrt: inklusive, pauschal oder nach km? Bis wohin fahren Sie (Einsatzgebiet, Abholradius)? CH/DE/FL mit Zoll/Entsendung? | `anfahrt`, `einsatzgebiet` | Zeilen fehlen |
| P4 | Wer führt die Pflege aus: eigenes Team oder Partnerbetrieb (Polsterer/Sattler, Tischler, Steinmetz)? Gewerbeumfang klären (siehe service-recht-vorschlag.md, Pflege Punkt E). | `ausfuehrung` | Zeile fehlt; Seite sagt „wir“ |
| P5 | Leistungsumfang je Material bestätigen: Leder (Reinigung, Pflege, Farbauffrischung auf Anfrage), Stoff (Tiefenreinigung, Fleckenbehandlung, Imprägnierung), Holz/Furnier/Marmor (Pflege, kleine Ausbesserungen). Was machen Sie NICHT (z. B. Neubezug, Schleifen, Steinpolitur)? | `materials.js` | Grundstruktur laut Auftrag, Grenzen ehrlich benannt |
| P6 | Mindestlaufzeit und Kündigung des Abos (Vorschlag: 12 Monate, danach jederzeit zum Ende des Abo-Jahres; Kanzlei prüft KSchG/FAGG) | `mindestlaufzeit`, `kuendigung` | Zeilen fehlen, Hinweis „steht im Angebot“ |
| P7 | Pflegemittel zum Nachkaufen: welche Produkte (Marke/Typ je Material), bezogen über wen? Keine Preise auf der Seite. | `pflegeprodukte` | allgemeiner Satz, keine Liste |
| P8 | Minotti-Pflegeanleitungen: liegen im Händlerbereich von minotti.com (Login). Bitte die PDFs je Modell/Material ablegen, dann verlinken wir sie im Produktpass. Gleiches für Poliform („Instruction booklet“). | – | nur allgemeine Regeln aus dem Ratgeber |
| P9 | Pflege auch für Möbel, die nicht bei Platzhirsch gekauft wurden? (FAQ sagt heute „Fragen Sie gerne an“) | Text `copy.js` FAQ 2 | „Fragen Sie gerne an“ |
| P10 | Ansprechperson für Pflegeanfragen und Erinnerungen (Absender der Erinnerungs-Mail)? | Frappe `Pflege Abo.berater` | Beratungsteam |
| P11 | Erinnerung wie viele Tage vor dem Termin? (Vorschlag 42 Tage = 6 Wochen) | `erinnerungTageVorher` | 42 |
| P12 | Seite indexieren, sobald P1–P6 geklärt sind? | `indexieren` | `false` (noindex, Seite erreichbar) |
| P13 | Ausbesserungen und Farbauffrischung: erst nach Antwort auf Gewerbefrage E zeigen. Wer führt aus (eigene Befugnis/Partner)? | `ausbesserungenFreigegeben`, `ausfuehrung` | `false`, nicht auf der Seite |
| P14 | Garantiefälle: Meldet das Studio Mängel für Kunden beim Hersteller? (Seite sagt heute nur „wir sagen es Ihnen und besprechen den weiteren Weg“) | Text `copy.js` HERSTELLER | keine Zusage |
| P15 | Termin-Erinnerung per E-Mail erst, wenn die Kundenbetreuung (Journeys `pflege_termin`, `pflege_nachkauf`) läuft. Bis dahin sagt die Seite „Wir stimmen den nächsten Termin mit Ihnen ab“. | Kundenbetreuung | keine automatische Erinnerung zugesagt |

## Projekt-Tagebuch im Kundenportal (Service 12)

Konfiguration: `src/lib/portal/tagebuch/config.js` (Phasen, Grenzen, `EINWILLIGUNG`). Für dieses Service gibt es keine Preise und keinen Leistungsumfang mit Preis: Das Tagebuch gehört zum Projekt. Offen sind nur Abläufe und Freigaben:

| # | Frage | Feld / Ort | Heute |
|---|---|---|---|
| T1 | Darf die Kanzlei den Einwilligungstext für Referenzen freigeben (Vorschlag in service-recht-vorschlag.md, Abschnitt Projekt-Tagebuch)? Erst dann geht die Freigabe live. | `EINWILLIGUNG.status` → `"freigegeben"`, neue `version` bei Textänderung | `"entwurf"`: in Produktion ist „Als Referenz freigeben“ aus („folgt in Kürze“), Tagebuch und Upload laufen |
| T2 | Wer im Studio prüft und veröffentlicht Referenzen (Name/Rolle)? Bekommt diese Person den Team-Schlüssel (`RAUM_TEAM_TOKEN`, derselbe wie Raum-Werkzeug)? | env `RAUM_TEAM_TOKEN`, Frappe-Rolle „Projekt Referenz Studio“ | Dev-Schlüssel `dev-team-raum` |
| T3 | Sollen Handzeichnungen und Modellfotos von Harald in öffentlichen Referenzen erscheinen dürfen (Urheber Harald, Zustimmung Kunde zur Raumdarstellung)? | `REFERENZ_PHASEN` + Einwilligungstext | seit 29.10.2026 AUSGENOMMEN (QA Recht): nicht auswählbar, Server lehnt ab; Wiederaufnahme nur mit neuer Einwilligungs-Version |
| T9 | Tagebuch in Produktion erst mit ergänzter Datenschutzerklärung (Tagebuch B) und verbundenem Speicher (T7). Link „Projekt-Tagebuch öffnen“ erscheint bis dahin nicht. | `DATENSCHUTZ_TAGEBUCH`, `tagebuchVerfuegbar()` | Produktion aus |
| T10 | Persönliche Team-Schlüssel statt eines gemeinsamen `RAUM_TEAM_TOKEN` (Nachweis, wer eine Referenz veröffentlicht hat)? | Frappe-Login je Mitarbeiter | gemeinsamer Schlüssel, Name frei |
| T4 | Soll die Referenzseite indexiert werden (heute `noindex` wie alle /projekte-Seiten) und in Navigation/Sitemap erscheinen, sobald die erste Referenz veröffentlicht ist? | `src/app/[locale]/projekte/**` | noindex, nicht verlinkt |
| T5 | Darf der Ort bei „anonym“ „am Bodensee“ lauten, oder lieber leer/„Vorarlberg“? | `ANONYM_ORT` | „am Bodensee“ |
| T6 | Sollen Kunden nach Abschluss (Übergabe) automatisch an das Tagebuch erinnert werden („Fotos vom fertigen Raum hochladen?“)? Das wäre ein Ereignis für die Kundenbetreuungs-App (siehe platzhirsch-frappe-service/tagebuch/README.md). | Kundenbetreuung | keine Erinnerung |
| T7 | Frappe: Wann richtet der Frappe-Entwickler die Doctypes „Projekt Tagebuch Foto“ und „Projekt Referenz“ ein (Spezifikation + JSON-Entwürfe in platzhirsch-frappe-service)? Bis dahin: Dev-Ablage `.data/` auf dem Server zulassen (`TAGEBUCH_ADAPTER=datei`) oder Tagebuch in Produktion leer? | env `TAGEBUCH_ADAPTER` | folgt `PORTAL_ADAPTER` (frappe → Stub, leer) |
| T8 | Aufbewahrung der Tagebuch-Fotos nach Projektende (z. B. bis Ende Gewährleistung, dann löschen)? | – | unbegrenzt, Löschen durch Kunde/Team jederzeit |
