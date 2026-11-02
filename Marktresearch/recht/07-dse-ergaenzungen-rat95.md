# Paket an die Kanzlei: Ergänzungen der Datenschutzerklärung, Kurzfassung, Barrierefreiheit, DSA (Rat 9,5)

**Stand:** 30.10.2026 · Team Recht (T5) · **Entwurf zur Prüfung und Freigabe durch die Kanzlei, keine Rechtsberatung.**
Die freigegebene Datenschutzerklärung (Inhaber-Entscheidung Nr. 11) ist unverändert. Alles Neue steht hinter Schaltern.

## 1. Wie die Freigabe technisch wirkt

- Register: `src/lib/legal/dseSections.js`. Jeder Abschnitt hat `status: "entwurf"`. Nach schriftlicher Freigabe wird **nur** dieser Wert auf `"freigegeben"` gestellt und der Wortlaut in `src/components/LegalDrafts/dseErgaenzungen.js` auf die freigegebene Fassung gebracht (ohne [eckige Klammern]; ein Unit-Test verhindert Platzhalter in freigegebenen Abschnitten).
- **Sperre:** In Produktion laufen die zugehörigen Funktionen erst mit freigegebenem Abschnitt: Online-Termin/Video (`terminMode`), Ideenboard-Teilen, Besucher-Einblicke (Heatmap), WhatsApp (zusätzlich zu `WHATSAPP_PRIVACY_SECTION=1`).
- **Release-Test:** `tools/qa/prod-check.mjs`, Schritt `dse`, prüft im Produktions-HTML von `/de/datenschutz`, dass jede aktive Funktion mit Personendaten ihren Anker hat und kein Entwurf ausgeliefert wird. Heute schlägt er bewusst fehl für zwei Funktionen ohne eigenen Schalter: **Service-Anfragen** (Hotel & Objekt, Architekten, Winterservice, Pflege) und **3D-/AR-Ansicht**. Erst mit Freigabe dieser beiden Abschnitte ist der Test grün.
- Im Entwicklungsmodus zeigt `/de/datenschutz` alle Entwürfe mit dem Vermerk „Entwurf, nur im Testbetrieb sichtbar“ an ihrer späteren Stelle. So lässt sich die Gesamtfassung lesen: `http://localhost:3000/de/datenschutz`.

## 2. Abschnitte zur Freigabe

| Anker | Abschnitt | Grundlage / Vorschlag | Offene Punkte für die Kanzlei |
|---|---|---|---|
| `#termin` | Online-Terminbuchung und Videoberatung, dazu ein Satz im Abschnitt „E-Mail-Versand“ (Termin-Mails) | `Marktresearch/digital/features/termin-dse-vorschlag.md` | Videodienst und Server (nach Einrichtung), Speicherdauer Termine [6 Monate] und Videoprotokolle, lit. b allein oder zusätzlich Einwilligung, Mail-Dienst (Resend wie bisher?) |
| `#whatsapp` | WhatsApp | `whatsapp-dse-vorschlag.md`, Teil B (gekürzt) | Rollenmodell, Fristen [12 Monate]/[3 Jahre], EU-Speicherort |
| `#besucher-einblicke` | Besucher-Einblicke (eigene Heatmap) | `einblicke-dse-vorschlag.md` | Aufbewahrung Tageswerte [395 Tage], Hoster/AVV, eigene Kategorie ja/nein |
| `#ideenboard` | Ideenboard teilen | Code `src/lib/ideenboard/config.js` (Kopie ohne Personenfelder, Link 192 Bit, widerrufbar, noindex, Löschung 12 Monate nach letzter Änderung) | Frist [12 Monate] bestätigen; Rechtsgrundlage lit. b |
| `#wunschliste` | Teilbare Wunschliste | `service-recht-vorschlag.md`, Wunschliste Teil A (gekürzt) | Frist [12 Monate]; die Funktion hat zusätzlich eigenen Schalter `DATENSCHUTZ_WUNSCHLISTE` (Team Wunschliste) |
| `#empfehlung` | Empfehlungsprogramm | `empfehlung-bedingungen-vorschlag.md` | Frist [3 Jahre]; Teilnahmebedingungen separat |
| `#service-anfragen` | Anfragen Hotel & Objekt, Architekten/Bauträger, Winterservice, Pflege | `service-recht-vorschlag.md` Teile D, Formularfelder aus dem Code | Fristen [6 Monate] für Fotos und Übernahmelisten. **Release-relevant:** Formulare sind ohne Schalter live. |
| `#ar-ansicht` | 3D- und AR-Ansicht (Google Scene Viewer, Apple AR Quick Look) | Code `src/components/Labs/ArViewer/ArLaunch.js` | Rolle Google/Apple, Drittlandbezug, ob ein Abschnitt nötig ist oder ein Hinweis am Knopf genügt. **Release-relevant.** |
| `#tagebuch` | Projekt-Tagebuch und Referenz im Portal | `service-recht-vorschlag.md`, Tagebuch Teil B | Speicherdauer; die Funktion hat eigenen Schalter `DATENSCHUTZ_TAGEBUCH` |

## 3. Kurzfassung EN/FR/IT (live, Gegencheck erbeten)

`/en|fr|it/datenschutz` zeigt jetzt H1, Brotkrume und eine Kurzfassung in der Seitensprache über dem deutschen Volltext (Art. 12 DSGVO). Inhalt: nur Aussagen der freigegebenen deutschen Fassung (Verantwortlicher, Website-Besuch, Anfragen, Newsletter, Bewerbungen, Cookies, Google nur mit Einwilligung, KI-Concierge, Rechte, Beschwerde). Hinweis in jeder Sprache: „Die deutsche Fassung ist maßgeblich.“ Quelle: `src/components/Datenschutz/kurzfassung.js`. **Bitte Übersetzung gegenlesen.**

## 4. Cookie-Dialog

Unter „Essenziell“ nennt der Dialog jetzt einzeln `cookieConsent` (12 Monate) sowie `NEXT_LOCALE`/`preferredLocale` (nur beim aktiven Sprachwechsel), wortgleich mit der freigegebenen DSE (#cookies). `ph_eb` steht weiter beim Dienst „Besucher-Einblicke“ (Einwilligung). **Vorschlag:** `ph-wow-pause` (sessionStorage, setzt T4 künftig erst nach Klick auf „Pause“) im Abschnitt #cookies als vom Nutzer ausgelöste Funktion nennen.

## 5. Barrierefreiheit (live, Wortlaut zur Prüfung)

Seite `/barrierefreiheit` (freiwillige Information, noindex): Ziel WCAG 2.2 AA, letzte automatische Prüfung (axe-core 4.13.0, 14 Seiten × Desktop/Smartphone, 0 gemeldete Verstöße, Beleg `qa-screenshots/umsetzung95/t5/axe.json`), was umgesetzt ist, bekannte Einschränkungen (3D/AR und Planer, Google-Karte, Hersteller-PDFs, Rechtstexte nur deutsch), Kontakt, Marktüberwachung Sozialministeriumservice. Keine Behauptung einer Prüfung von Hand. **Offen:** greift die Kleinstunternehmer-Ausnahme (BaFG)? Muss eine Schlichtungs-/Beschwerdestelle genannt werden?

## 6. DSA-Meldeweg (Maßnahme C9, Entscheidung der Kanzlei)

Geteilte Ideenboards und Wunschlisten sind nutzererzeugte Inhalte, die über einen Link öffentlich abrufbar sind. Die Wunschliste hat bereits „Liste melden“ (E-Mail) und eine Sperre durch das Studio. Vorschlag für Ideenboard und Wunschliste gleich:
- Kontaktstelle (Art. 11/12 DSA): `info@platzhirsch.studio`, Sprachen Deutsch und Englisch; im Impressum als Zeile „Kontaktstelle nach Art. 11 und 12 DSA“ (heute bewusst weggelassen, `IMPRESSUM_LIVE_STATUS.omittedUntilConfirmed`).
- Melde- und Abhilfeverfahren (Art. 16 DSA): Link „Inhalt melden“ auf jeder geteilten Seite → E-Mail mit Link der Seite; Studio prüft, sperrt den Link bei rechtswidrigem Inhalt und informiert die meldende Person.
- **Frage:** Ist Platzhirsch für diese Funktionen Hostingdiensteanbieter im Sinne des DSA, und gilt die Ausnahme für Kleinst- und Kleinunternehmen (Art. 19)? Bis zur Antwort wird nichts veröffentlicht; Umsetzung im Ideenboard durch Team Werkzeuge (Auftrag in `qa-screenshots/umsetzung95/auftraege.md`).

## 7. Stellenanzeigen (GlBG)

Stellen ohne Entgeltangabe werden nicht mehr veröffentlicht (§ 9 Abs 2 GlBG): Liste, Detailseite, JobPosting. Bitte bestätigen, dass ein Gehaltsfeld mit Betrag plus Satz zur Überzahlungsbereitschaft im Backoffice genügt.
