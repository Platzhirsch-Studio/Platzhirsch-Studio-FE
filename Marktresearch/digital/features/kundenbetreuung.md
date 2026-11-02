# Kundenbetreuung, Newsletter und Empfehlung (Welle 2)

**Stand:** 29.10.2026 · **Team:** CRM-Architekt (Frappe), Lifecycle-Marketer, Jurist (§ 174 TKG 2021, § 7 UWG DE, DSGVO)
**Auftrag Inhaber 29.10.2026:** Punkt 8 automatische Kundenbetreuung, Punkt 9 Empfehlungsprogramm, Punkt 10 Newsletter mit Inhalt statt Werbung.
**Grundlagen:** `wachstumsrat/crm-wiederkauf.md`, `marketing/email-flows.md`, `expertenrat-gesamt/recht-dsgvo.md`, Inhaber-Entscheidungen Nr. 8, 9, 11.

Nichts wurde versendet, nichts ins Backoffice geschrieben. Die Frappe-App ist ein Paket für den Frappe-Entwickler.

---

## 1. Was gebaut ist

| Teil | Ort | Zustand |
|---|---|---|
| Frappe-App (8 Doctypes, Scheduler, Engine, DOI, Abmeldung, Empfehlung) | `../platzhirsch-frappe-kundenbetreuung` (README) | fertig als Code, nicht installiert, alle Reisen `aktiv = 0` |
| Reisen, Texte, Regeln (eine Quelle) | `src/lib/kundenbetreuung/reisen.js`, `rechtsgrundlagen.js`, `mail.js`, `systemMails.js` | fertig, Unit-Tests |
| Generator Website → Frappe | `src/lib/kundenbetreuung/generate-frappe.mjs` | schreibt Doctypes, Vorlagen, Fixtures, `pflege.py` |
| Seite Empfehlen | `/[locale]/empfehlen` (DE/EN/FR/IT), `src/components/Empfehlen/*` | fertig; Produktion erst nach Freigabe der Bedingungen |
| Newsletter: 3 Ausgaben + Mail-HTML | `src/lib/kundenbetreuung/newsletter/*`, `…/templates/newsletter/*.html` | fertig, Slots leer bis Inhaber liefert |
| Newsletter-Archiv | `/de/newsletter/archiv`, `/de/newsletter/archiv/[ausgabe]` | fertig, zeigt nur versendete Ausgaben mit Inhalt |
| Bedingungen Empfehlung | `features/empfehlung-bedingungen-vorschlag.md` | Vorschlag für die Kanzlei |

## 2. Kundenreisen und Rechtsgrundlage je Mail

V = Vertrag/Service (Art. 6 Abs. 1 lit. b DSGVO, keine Werbung) · B = Bestandskunde ohne Widerspruch (§ 174 Abs. 4 TKG 2021 / § 7 Abs. 3 UWG / Art. 3 Abs. 1 lit. o UWG CH: nur eigene ähnliche Produkte, Widerspruch bei Erhebung und in jeder Mail, ECG-Abgleich) · E = Einwilligung mit Double-Opt-in je Zweck.

| Reise | Auslöser | Grundlage | Fußzeile | Stopp |
|---|---|---|---|---|
| Danke nach dem Kauf | Lieferung + 1 Tag | V | V (Service) | Storno |
| Pflegetipps | Lieferung + 14 Tage, Module je Material der Auftragspositionen | V | V | Storno |
| Zufriedenheit und Bewertung (`/bewerten`) | Lieferung + 42 Tage, einmal, an alle | **nur E** (zweck `rueckmeldung`) bis zur Klärung durch die Kanzlei, ob B reicht (BGH VI ZR 225/17: Feedback-Bitte ist Werbung). Einwilligung beim Kauf noch nicht gebaut → Reise läuft vorerst nicht | A | Widerspruch, ECG; Reklamation nur Aufschub |
| Outdoor im Frühling | jährlich 10.03. | **B nur an Käufer eines Outdoor-Stücks** (`bNurMitKauf: "outdoor"`); Newsletter mit bloßem Interesse Outdoor **nur E** | B bzw. A | Frequenz, Reklamation, Anfrage offen |
| Adventsabend-Einladung | Termin − 21 Tage (26.11.2026 → 05.11.) | E (einladungen); B **nur** nach Kanzlei-Bestätigung | A bzw. B | wie oben |
| Ein Jahr zuhause | Jahrestag der Lieferung | B oder E | B bzw. A | wie oben |
| Merkliste-/Planer-Erinnerung | Einwilligung + 3 und + 14 Tage, max. 2 | **nur E** (merkliste_erinnerung/planer_erinnerung) | A | Anfrage, Termin, Widerruf |

**B nur mit Widerspruchshinweis bei der Erhebung (QA Welle 2 P1-5, § 174 Abs. 4 Z 3 TKG):** Jeder Auftrag braucht Datum und Quelle des Hinweises, dass der Kunde Werbe-Mails ablehnen kann (Custom Fields `ph_widerspruchshinweis_am`, `ph_widerspruchshinweis_quelle`, z. B. Kaufvertrag oder Auftragsbestätigung). Fehlt der Nachweis, sendet die App nichts mit Grundlage B (`kein_widerspruchshinweis`); solche Altkunden erreicht man nur per Brief oder nach einer Einwilligung. Der Hinweis gehört ab sofort in Kaufvertrag/Auftragsbestätigung (Textvorschlag unten, Kanzlei).

Globale Regeln (Code erzwingt sie): max. 2 werbliche Mails in 30 Tagen, Werbung nur Di–Do, Sperrtage 24.–26.12., 31.12., 01.01., keine Werbung bei offener Reklamation/Anfrage/„nicht kontaktieren“, Testmodus leitet alles um, B nur mit gültigem ECG-Abgleich, Werbung erst nach Kanzlei-Haken für die Fußzeilen.

**Voraussetzung Merkliste/Planer (Website, offen):** Knopf „Auswahl per E-Mail sichern“ mit eigenem, nicht vorangekreuztem Häkchen → `PH Einwilligung` (zweck, textversion, quelle, gemerkte Stücke). Gehört zu `/merkliste` und den Planern (andere Teams).

## 3. Empfehlungsprogramm

- **Code:** `EMP-` + 6 Zeichen (ohne 0/O/1/I), unterscheidbar von Gutscheincodes `PH-XXXX-…`. Erzeugt nur im Backoffice.
- **Weg Empfehler:** Formular „Code anfordern“ → `/api/kontakt` mit „Kontext: Empfehlungsprogramm · Empfehler fordert Code an“ → ToDo; Team prüft den eigenen Auftrag → `PH Empfehlung` → Mail mit Code und Link. Link/Code gibt die Person **selbst** weiter (Kopieren, Teilen-Menü, eigenes Postfach). Es gibt kein Feld für Adressen Dritter.
- **Weg Empfohlene:** `/de/empfehlen?code=EMP-…` → Formular mit freiwilligem Häkchen (Zuordnung + Information der empfehlenden Person ohne Auftragsdetails). Ohne Häkchen geht der Code nicht mit.
- **Gutschein:** nach erstem Auftrag und Ablauf der Rücktrittsfrist (Standard 14 Tage, Einstellung) → „Gutschein fällig“ + ToDo → Ausstellung über das bestehende Gutschein-Register → Mail „Danke für Ihre Empfehlung“. Betrag legt der Inhaber fest (`REFERRAL.voucherValue`, Frappe-Einstellung), bis dahin nennt keine Seite und keine Mail eine Zahl.
- **Nie** an Bewertungen gekoppelt, kein Dank für bloße Kontakte, keine Selbstempfehlung.

## 4. Newsletter „Post aus Lochau“ – Konzept

- **Rhythmus:** erster Donnerstag im Monat, 18:00 (email-flows 0.5). Ausgaben 1–3: 05.11.2026, 03.12.2026, 07.01.2027.
- **Blöcke:** Brief der Gastgeberin · Neu in der Ausstellung (Slot, eigene Fotos) · Haralds Skizze des Monats (Slot, nur echte Scans) · Termine (nur feststehende) · Gut zu wissen (Pflege/Planung) · Arbeitsweise („Von Hand gezeichnet. Digital perfektioniert.“).
- **Keine Werbung im engeren Sinn:** keine Rabatte, keine Preise, keine Countdown-Angebote. Ein Knopf je Ausgabe.
- **Slots rendern nur mit Inhalt.** Versandbereit erst, wenn mindestens ein Slot gefüllt ist und zwei Inhaltsblöcke sichtbar sind. Preheader und „In diesem Brief: …“ entstehen aus den sichtbaren Blöcken.
- **Archiv** nur mit `versendetAm` (nach echtem Versand). Entwicklung: `?vorschau=1` zeigt alle Ausgaben mit markierten Slots.
- **Pflege:** Slots in `ausgaben.js` füllen, Bilder nach `public/newsletter/<slug>/`, `node src/lib/kundenbetreuung/generate-frappe.mjs`, dann in Frappe als Newsletter an die Email Group senden; danach `versendetAm` setzen.

## 5. Prüfung der bestehenden Newsletter-Anmeldung (DOI)

| Befund | Beleg | Folge |
|---|---|---|
| Im Frontend kein Double-Opt-in erkennbar: Erfolgstext „Sie sind … angemeldet“ | `src/messages/de.json` `newsletter.success`, `inhalt.newsletter.success` | Text geändert vorgeschlagen (Messages-Datei), erst mit DOI-Endpunkt übernehmen |
| Datenschutzerklärung (freigegeben) sagt: „senden wir Ihnen eine E-Mail mit einem Link zur Bestätigung“ | `src/components/Datenschutz/datenschutz.js` Z. 244 ff. | Backoffice-Methode `platzhirsch_studio…subscribe_newsletter` muss das tatsächlich tun – nicht nachweisbar (nur gelesen, nichts abgeschickt) |
| Antwort 409 „bereits angemeldet“ verrät, ob eine Adresse eingetragen ist | `src/lib/forms/newsletter.js` | **Behoben (QA Welle 2):** bereits eingetragene Adressen bekommen dieselbe neutrale Antwort wie neue |
| Kein Einwilligungs-Protokoll (Textversion, Zeit, Quelle) | Route sendet nur `{ email }` | `PH Einwilligung` in der App |

**Versandstopp:** Bis der Double-Opt-in der Frappe-App aktiv ist und jede Einwilligung mit Zeitpunkt, Textversion und Quelle in `PH Einwilligung` steht, geht **kein** Newsletter an den bisherigen Bestand (Art. 7 Abs. 1 DSGVO, § 174 Abs. 3 TKG: Einwilligung nicht nachweisbar). Bestehende Adressen nur nach einer neuen, bestätigten Einwilligung übernehmen.

**Empfehlung für die Integration:** `/api/newsletter_subscribe` auf `platzhirsch_kundenbetreuung.kundenbetreuung.newsletter.anmelden` umstellen (Payload `{ email, zweck: "newsletter", quelle: "/newsletter", textversion }`), 409-Zweig entfernen, Erfolgstext aus der Messages-Datei übernehmen. Datei `src/lib/forms/newsletter.js` gehört nicht zu diesem Team.

## 6. Für die Kanzlei (Vorschläge, nicht freigegeben)

1. Fußzeilen A und B (`src/lib/kundenbetreuung/mail.js` `FUSSZEILEN`).
2. Bewertungsbitte: Reicht B („ähnliche Produkte“), oder bleibt es bei E? Bis zur Antwort nur E. Frist für den Aufschub bei offener Reklamation.
3. Ist eine Einladung zum Abend im eigenen Showroom „Werbung für eigene ähnliche Produkte“ (B)? Sonst nur E und Brief.
4. Teilnahmebedingungen Empfehlung: `features/empfehlung-bedingungen-vorschlag.md`.
5. **Ergänzung Datenschutzerklärung „Kundenbetreuung per E-Mail“** (Vorschlag):
   > Nach einem Kauf schicken wir Ihnen Nachrichten zu Ihrem Auftrag, etwa einen Dank nach der Lieferung und Pflegehinweise zu den Materialien Ihrer Stücke (Art. 6 Abs. 1 lit. b DSGVO). Als Kundin oder Kunde können Sie außerdem Informationen zu ähnlichen eigenen Produkten und eine Bitte um Ihre Rückmeldung erhalten (§ 174 Abs. 4 TKG 2021; Art. 6 Abs. 1 lit. f DSGVO). Dem können Sie jederzeit kostenlos widersprechen, über den Link in jeder Nachricht oder per E-Mail. Vor dem Versand gleichen wir mit der ECG-Liste der RTR ab. Erinnerungen an gemerkte Stücke und Einladungen senden wir nur mit Ihrer Einwilligung, die Sie über einen Bestätigungslink abgeben und jederzeit widerrufen können. Wir speichern dazu Zweck, Zeitpunkt, Textfassung und Quelle der Einwilligung.
   **Zusatz Profiling (QA Welle 2 P1-5, Art. 13 Abs. 1 lit. c, Art. 21 Abs. 2 DSGVO), Vorschlag:**
   > Damit unsere Nachrichten zu Ihnen passen, berücksichtigen wir, welche Stücke Sie gekauft, auf Ihrer Merkliste gespeichert oder im Planer zusammengestellt haben, und welche Interessen Sie angegeben haben (zum Beispiel Outdoor). Daraus wählen wir aus, welche Nachricht Sie erhalten. Es gibt keine automatisierte Entscheidung mit rechtlicher Wirkung. Rechtsgrundlage ist Ihre Einwilligung bzw. unser berechtigtes Interesse an passender Kundenbetreuung (Art. 6 Abs. 1 lit. a bzw. f DSGVO). **Sie können dieser Auswertung für Werbezwecke jederzeit widersprechen**, über den Link in jeder Nachricht oder per E-Mail an info@platzhirsch.studio.

   Derselbe Satz („Wir berücksichtigen Ihre gemerkten Stücke und Planer-Stände, um Ihnen passende Nachrichten zu schicken.“) gehört in den Einwilligungstext der Newsletter-, Merkliste- und Planer-Häkchen.
6. **Widerspruchshinweis beim Kauf (§ 174 Abs. 4 Z 3 TKG), Vorschlag für Kaufvertrag/Auftragsbestätigung:**
   > Wir verwenden Ihre E-Mail-Adresse, um Ihnen Informationen zu ähnlichen eigenen Produkten zu senden. Sie können dem jetzt und jederzeit kostenlos widersprechen, mit einem Link in jeder Nachricht oder per E-Mail an info@platzhirsch.studio.
7. Abschnitt „Empfehlungsprogramm“: siehe Bedingungen-Vorschlag.

## 7. Offen beim Inhaber

- Gutscheinwert je erfolgreicher Empfehlung (und Höchstzahl pro Jahr).
- Material für die Slots: neue Stücke (eigene Fotos, Name, Marke, zwei Sätze), Haralds Skizze des Monats (Scan mit Einwilligung bzw. anonymisiert) – Harald-Material kommt laut Entscheidung Nr. 11 am 30.10.
- Uhrzeit/Programm Adventsabend (dann `PH Termin` und `event.js`).
- Mail-Dienst, SPF/DKIM/DMARC, Absenderadresse der Gastgeberin; ECG-Abgleich-Prozess; Kundenliste mit Lieferdatum und Materialien (Custom Fields laut README).
- Schreibweise „Messmer“ wie im Impressum und Firmenbuch (QA Welle 2 P2-7, angeglichen).
