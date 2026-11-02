# Yacht-Seite: KI-Konzeptbilder (lokal erzeugt)

Stand: 27.10.2026. Grundlage sind die Bildprompts in `src/lib/yacht/concepts.json` (Konzeptdoku: `yacht-signature-konzept.md`).
Ergebnis: **13 Bilder** (je Bildprompt eins, ausgewählt aus 3 bzw. 4 Kandidaten), Dateien unter `public/labs/yacht/`, Metadaten in `src/lib/yacht/renders.json`.

> **Alle Bilder sind KI-generiert.** Sie zeigen Stimmungen und Farbwelten, **keine realen Projekte, keine Kundenboote und keine Produkte aus unserem Sortiment**. Auf der Seite braucht jedes Bild ein sichtbares Etikett (Art. 50 Abs. 2 und 4 AI Act, Rechtspaket 4.7 / W11).

## 1. Bilder je Konzept

| Konzept | Zone | Datei (Basisname) | Format | Seed | Kandidaten |
|---|---|---|---|---|---|
| Runabout „Mahagoni und Leinen“ | deck | `runabout-mahagoni-deck` | 3:2 | 59 | 3 + 4 (zweiter Prompt) |
| | bootshaus | `runabout-mahagoni-steg` | 4:5 | 37 | 3 |
| Daycruiser „Seelicht“ | deck | `daycruiser-seelicht-cockpit` | 3:2 | 11 | 3 |
| | kabine | `daycruiser-seelicht-kabine` | 4:5 | 37 | 3 |
| Segelyacht „Nordwind“ | salon | `segelyacht-nordwind-salon` | 3:2 | 37 | 3 |
| | deck | `segelyacht-nordwind-deck` | 4:5 | 23 | 3 |
| Motoryacht „Riviera Abend“ | flybridge | `motoryacht-riviera-flybridge` | 16:9 | 37 | 3 |
| | salon | `motoryacht-riviera-salon` | 3:2 | 11 | 3 |
| | kabine | `motoryacht-riviera-kabine` | 4:5 | 23 | 3 |
| Bootshaus „Am Ufer“ | deck | `bootshaus-ufer-terrasse` | 16:9 | 37 | 3 |
| | salon | `bootshaus-ufer-wohnraum` | 4:5 | 23 | 3 |
| Superyacht „Beach Club“ (Inspiration) | badeplattform | `superyacht-beachclub` | 16:9 | 37 | 3 |
| | flybridge | `superyacht-sonnendeck-nacht` | 3:2 | 11 | 3 |

Hinweis: Der Auftrag nannte 14 Prompts, `concepts.json` enthält 13 (2+2+2+3+2+2). Alle 13 sind abgedeckt.

Je Bild gibt es vier Dateien: `<name>-2400.avif`, `<name>-2400.webp`, `<name>-1200.avif`, `<name>-1200.webp`. Alle sind **≤ 250 KB** (größte: 248 KB). Gesamt 52 Dateien, 7,2 MB. Querformate 2400 × 1600 bzw. 2400 × 1350, Hochformate 2400 × 3000.

Einbau-Vorschlag: `<picture>` mit AVIF vor WebP, `srcset` 1200w/2400w, `sizes` passend zum Raster; Breite/Höhe aus `renders.json` (`groesse`) setzen, damit kein Layout-Sprung entsteht. Bilder unterhalb des Heros mit `loading="lazy"`.

## 2. Modell und Lizenzen

| Baustein | Quelle | Lizenz | Kommerziell |
|---|---|---|---|
| Stable Diffusion XL **Base 1.0** | `stabilityai/stable-diffusion-xl-base-1.0` (fp16) | CreativeML **Open RAIL++-M** | ja |
| Stable Diffusion XL **Refiner 1.0** | `stabilityai/stable-diffusion-xl-refiner-1.0` (fp16) | CreativeML Open RAIL++-M | ja |
| VAE fp16-Fix | `madebyollin/sdxl-vae-fp16-fix` | MIT | ja |
| Hochskalierung | Real-ESRGAN x2plus / x4plus (bereits vorhanden, siehe `Marktresearch/daten/gpu-pipeline.md`) | BSD-3-Clause | ja |
| diffusers 0.42.1, accelerate | Hugging Face | Apache-2.0 | ja |

**Lizenzprüfung Open RAIL++-M** (LICENSE.md im Modell-Cache gelesen):
- Abschnitt „The Output You Generate“: Der Lizenzgeber beansprucht **keine Rechte an den erzeugten Bildern**. Wir sind für ihre Verwendung verantwortlich.
- Kommerzielle Nutzung ist nicht ausgeschlossen. Es gelten nur die Nutzungsverbote aus **Attachment A** (rechtswidrige Nutzung, Täuschung mit dem Ziel zu schaden, Diskriminierung, personenbezogene Daten u. a.). Keiner davon trifft auf Stimmungsbilder für Einrichtungskonzepte zu.
- Bei Weitergabe des **Modells** müssten die Nutzungsbeschränkungen mitgegeben werden. Wir geben nur Bilder weiter, nicht das Modell.
- Keine Nutzung von Marken oder Logos von Stability AI.

**Warum nicht FLUX.1-schnell (Apache-2.0)?** Das Hugging-Face-Repository `black-forest-labs/FLUX.1-schnell` ist zugangsbeschränkt (Login und Annahme der Bedingungen). Auf dem Rechner ist kein Hugging-Face-Konto hinterlegt, und ein Konto anzulegen war nicht Teil des Auftrags. Mit einem Token des Inhabers wäre FLUX.1-schnell ein möglicher nächster Schritt: Es setzt Prompts genauer um und erzeugt Text sauberer. Auf 8 GB läuft es nur mit Offloading (24-GB-Transformer).

**Urheberrecht an KI-Bildern:** Rein KI-erzeugte Bilder sind in AT/DE in der Regel nicht urheberrechtlich geschützt. Dritte könnten sie also übernehmen. Für Stimmungsbilder ist das vertretbar [anwaltlich prüfen, falls Bilder für Werbung außerhalb der Website genutzt werden].

## 3. Ablauf und Einstellungen (reproduzierbar)

Alles läuft lokal auf der RTX 4060 in `C:\Users\admin.local\Documents\platzhirsch-gpu-tools`. Ins Repo kommen nur Bilder, JSON und diese Doku.

```powershell
$T  = "C:\Users\admin.local\Documents\platzhirsch-gpu-tools"
$PY = "$T\.venv\Scripts\python.exe"
$env:HF_HOME = "$T\hf-home"
# einmalig: & "$T\bin\uv.exe" pip install --python $PY diffusers accelerate sentencepiece protobuf
# Download ohne Xet-Backend (Xet blieb bei 0 Byte hängen):  $env:HF_HUB_DISABLE_XET = "1"

node $T\yacht\jobs\make-jobs.mjs <repo>\src\lib\yacht\concepts.json $T\yacht\jobs\jobs.json   # 13 Jobs, 3 Seeds je Job
& $PY -I $T\scripts\generieren_sdxl.py $T\yacht\jobs\jobs.json   $T\yacht\raw          # Kandidaten (PNG + JSON je Bild)
& $PY -I $T\scripts\generieren_sdxl.py $T\yacht\jobs\retry1.json $T\yacht\raw          # zweiter Anlauf Runabout-Cockpit
& $PY -I $T\scripts\hochskalieren.py   $T\yacht\sel\x2 $T\yacht\up --faktor 2 --fp16 --format png   # Querformate
& $PY -I $T\scripts\hochskalieren.py   $T\yacht\sel\x4 $T\yacht\up --faktor 4 --fp16 --format png   # Hochformate
& $PY -I $T\scripts\export_web.py      $T\yacht\auswahl.json <repo>\public\labs\yacht   # Zuschnitt, 2400/1200, AVIF+WebP, XMP
node $T\yacht\make-renders.mjs                                                           # schreibt src/lib/yacht/renders.json
```

| Parameter | Wert |
|---|---|
| Auflösung der Erzeugung | 3:2 → 1216 × 832, 4:5 → 896 × 1120, 16:9 → 1344 × 768 |
| Schritte | 40, davon 80 % Base und 20 % Refiner („Ensemble of Experts“) |
| CFG | 6,0 |
| Seeds | 11, 23, 37 (Runabout-Cockpit zusätzlich 5, 41, 59, 73) |
| Speicher | fp16, Model-CPU-Offload, VAE-Tiling; VRAM-Spitze 5,44 GB |
| Dauer | ca. 32–37 s je Bild, 43 Kandidaten in rund 25 min; Hochskalieren 1–4,5 s je Bild |
| Zuschnitt | mittig auf das exakte Seitenverhältnis, dann Lanczos auf 2400 und 1200 px Breite |
| Kodierung | Qualitätssuche ab q 78 in 4er-Schritten bis ≤ 250 KB; AVIF speed 4, WebP method 6 |

**Prompts:** SDXL liest pro Textencoder höchstens 77 Token, der Rest wird abgeschnitten. Deshalb gibt es je Bild eine **inhaltsgleiche Kurzfassung** (`prompt` in `renders.json`); das Original aus `concepts.json` steht daneben (`promptOriginal`). Die Längenangaben („11 metre“, „26 metre“, „14 metre“) wurden gestrichen, weil das Modell sie ohnehin nicht umsetzt. Negativprompt einheitlich: Logos, Text, Wasserzeichen, Markennamen, Personen, Gesichter, Hände, HDR, Fisheye, Übersättigung, Illustration/CGI, Unschärfe, deformierte Möbel.

## 4. Kennzeichnung (AI Act Art. 50)

- **Maschinenlesbar:** In jeder AVIF/WebP-Datei steckt ein XMP-Paket mit `Iptc4xmpExt:DigitalSourceType = http://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia`, `photoshop:Credit = "KI-generiert (Stable Diffusion XL 1.0), Platzhirsch Home Living"` und einer Beschreibung, die mit „KI-generiert:“ beginnt (geprüft per Byte-Suche in AVIF und WebP).
- **C2PA** ist seit Runde 2 in den beiden v2-Bildern eingebettet (§7), in den übrigen 11 noch nicht.
- **Sichtbar (Pflicht beim Einbau):** Jedes Bild bekommt auf der Seite ein Etikett, z. B. „KI-Konzeptbild“, und in der Bildunterschrift den Text aus `kennzeichnung`: „KI-generiertes Konzeptbild – kein reales Projekt, keine abgebildeten Produkte aus unserem Sortiment“. `renders.json` enthält dafür `kiGeneriert: true`.
- **Alt-Texte** (`alt`) beschreiben, was zu sehen ist. Sie nennen keine Marken und behaupten keine Produkte. Die KI-Kennzeichnung steht im sichtbaren Etikett, nicht im Alt-Text, damit Screenreader sie nicht doppelt vorlesen. Wer will, kann „KI-Konzeptbild:“ voranstellen.

## 5. Auswahl und Qualitätsurteil

Alle Kandidaten wurden einzeln angesehen (Kontaktbögen und volle Auflösung). Ausgeschieden ist alles mit sichtbaren Fehlern.

**Verworfen:** alle drei ersten Runabout-Cockpits, weil die Bootsform falsch war (Boot auf Rädern am Steg, schwebender Rumpf, Polster außen auf dem Rumpf). Der zweite Anlauf mit präziserem Prompt (Blick ins Cockpit, Steuerrad) ergab mit Seed 59 ein stimmiges Bild. Ebenfalls verworfen: Steg-Bild Seed 23 (verformtes Boot), Daycruiser-Deck Seed 37 (Bootsbug unlogisch) sowie Segelyacht-Deck-Varianten mit wirrem Rigg.

**Gesamturteil:** Für Stimmungsbilder gut, mit klaren Grenzen.
- **Stark:** Innenräume (Salon Segelyacht, Eignerkabine, Hausboot-Wohnraum, Vorschiffskoje), Licht und Farbwelten treffen die Konzepte.
- **Brauchbar:** Flybridge, Beach Club, Sonnendeck und Bootshaus-Terrasse. Die Architektur ist plausibel, aber eher „Terrasse“ als „Boot“.
- **Abweichungen vom Prompt, bei der Bildunterschrift beachten:**
  - Runabout-Cockpit: Die Polster sind **salbeigrün statt elfenbein**, es gibt kein Plaid.
  - Steg-Bild: Der **Bootsbug im Vordergrund fehlt**.
  - Segelyacht-Deck: Die Kissen sind **petrol statt schieferblau**, Baum und Mast sind vereinfacht und technisch nicht exakt.
  - Flybridge Riviera: Die Laternen zeigen **kerzenähnliches Licht**. An Bord gilt: nur LED-Akku-Leuchten (vgl. Ausschluss Baobab wegen offener Flamme). Bei Bedarf in der Bildunterschrift erwähnen oder das Bild nur als Stimmung zeigen.
  - Bootshaus-Terrasse: Das **Holzboot in der Bootsbucht fehlt**. Rechts steht ein freistehender Leuchtenmast ohne erkennbaren Fuß (kleines Detail).
- **Hochskalierung:** Real-ESRGAN glättet Stoffstrukturen leicht (Decken wirken an einzelnen Stellen etwas gemalt). In 1200 px nicht sichtbar, bei 2400 px nur in der 100-%-Ansicht.
- **Prüfkriterien erfüllt:** keine Logos, kein Text, keine Werftnamen, keine Personen, keine erkennbaren Designermöbel. Die Möbel sind generisch und **keinem Hersteller aus dem Katalog zuzuordnen**. Das ist gewollt: Echte Produkte zeigt die Seite über die Produktlinks aus `concepts.json`, nicht über KI-Bilder.

## 6. Offen

- [ ] Sichtbares KI-Etikett und Bildunterschrift beim Einbau in die Yacht-Seite (Team Seite)
- [ ] C2PA-Signatur für die übrigen 11 Bilder (2 v2-Bilder signiert, siehe §7) und anerkanntes Zertifikat
- [ ] Optional mit HF-Token des Inhabers: FLUX.1-schnell (Apache-2.0) testen, vor allem für das Runabout-Cockpit (Elfenbein-Polster) und das Segelyacht-Deck
- [ ] Prüfen, ob die Kandidaten außerhalb von `public/` gelöscht werden können (`platzhirsch-gpu-tools\yacht\raw`, ca. 51 MB)

## 7. Runde 2 (27.10.2026): Neu-Rendering und C2PA

Anlass: QA-Runde 1 der Yacht-Seite (P2.2). Die Bildunterschriften mussten bei zwei Bildern Abweichungen vom Konzept erklären. Beide Bilder wurden neu erzeugt. Die alten Dateien bleiben unter ihrem Namen liegen, weil Bestandsdateien nicht verändert werden; die neuen tragen das Suffix `-v2`.

| Bild | Neu (Basisname) | Seed | Kandidaten | Was korrigiert ist |
|---|---|---|---|---|
| Runabout-Cockpit | `runabout-mahagoni-deck-v2` | 59 | 6 (Seeds 7, 19, 31, 47, 59, 83) | Elfenbein-Polster, längs gesteppt, dunkle Keder (statt Salbeigrün). Prompt mit „ivory white leather … cream upholstery“, Negativprompt „green seats, sage seats, green upholstery“ |
| Riviera-Flybridge | `motoryacht-riviera-flybridge-v2` | 11 | 6 (Seeds 11, 23, 37, 53, 67, 89) | Keine Laternen, keine Kerzen. Prompt „small modern cordless LED table lamps“, Negativprompt „candle, flame, fire, lantern, torch“ |

Pipeline unverändert (SDXL Base + Refiner, 40 Schritte, CFG 6, Real-ESRGAN x2, `export_web.py` mit XMP). Jobs: `platzhirsch-gpu-tools\yacht\jobs\retry2.json`, Auswahl: `yacht\auswahl2.json`, Kontaktbögen: `yacht\sheets\*-v3.jpg` / `*-v2.jpg`. Die `note`-Felder für beide Bilder sind in `src/lib/yacht/model.js` entfernt. Alt-Texte beschreiben die neuen Bilder.

**C2PA (neu):** `platzhirsch-gpu-tools\scripts\c2pa_signieren.py` bettet in AVIF und WebP ein C2PA-Manifest ein: Aktion `c2pa.created`, `digitalSourceType` = IPTC `trainedAlgorithmicMedia`, Werkzeugangabe SDXL/Real-ESRGAN, ohne eingebettetes Vorschaubild (+3 KB je Datei). Geprüft durch Zurücklesen mit `c2pa.Reader`.

- Werkzeug: `c2pa-python` **0.38.0** (MIT/Apache-2.0, veröffentlicht 29.09.2026, also älter als 14 Tage), installiert nur in der GPU-Werkzeug-Umgebung außerhalb des Repos (`.venv`), nicht im Projekt. Abhängigkeiten: `cryptography` 50.0.2, `cffi`, `toml`.
- Signatur: **lokale Zertifikatskette** (eigene Root-CA + End-Zertifikat, EC P-256) in `platzhirsch-gpu-tools\c2pa-zert\`. Sie steht in keiner C2PA-Vertrauensliste; Prüfwerkzeuge zeigen „unbekannter Aussteller“. KI-Angabe und Bildinhalt sind trotzdem kryptografisch an die Datei gebunden. Der private Schlüssel liegt nur lokal und gehört nicht ins Repo.
- `renders.json` enthält für beide Bilder `c2pa: { eingebettet: true, … }`, `version: 2` und `ersetzt`.

**LQIP:** `renders.json` hat jetzt je Bild `farbe` (Mittelfarbe) und `lqip` (24 px breites WebP als Data-URI, ca. 150–290 Byte). Die Seite zeigt beides, solange das Bild lädt.

Offen: die übrigen 11 Bilder ebenfalls signieren (Bestandsdateien → eigener Auftrag) und ein anerkanntes Signaturzertifikat beschaffen.
