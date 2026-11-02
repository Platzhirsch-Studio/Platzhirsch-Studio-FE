# Wachstumsrat: Kundenportal, Service-Design und interaktive Kundenbetreuung

**Kürzel:** portal-service · **Stand:** 28.10.2026 · **Gremium:** Kundenportal-Experte, Service-Designer, Experte für interaktive Kundenbetreuung (Clienteling)
**Geprüft:** `/de/portal` mit Demo-Sitzung (Mock-Adapter, Kunde „Familie Muster“), Code unter `src/app/[locale]/portal/**`, `src/components/Portal/**`, `src/lib/portal/**`, Concierge (`src/components/Concierge/**`, `features/concierge-sitewide.md`), Doku `features/kundenportal.md` (Abschnitte 1–9), `teamleiter/inhaber-entscheidungen.md`.
**Hinweis zur Prüfung:** Der Dev-Server war durch parallele Workflows stark ausgelastet (Dashboard 189 s Antwortzeit). Playwright-Screenshots liefen in den Timeout (`qa-screenshots/wachstumsrat/portal-service/report.json`). Bewertet wurde deshalb das per curl mit signierter Demo-Sitzung geladene HTML plus der Quellcode. Es wurde nichts abgesendet und kein Code geändert.

---

## 1. Urteil zum Ist-Stand

| Bereich | Note (1–10) | Kurzbegründung |
|---|---|---|
| Technisches Fundament (Login, Sicherheit, Datenschicht) | **8,5** | Magic Link ohne Passwort, scanner-sicher, HMAC-Session, DAL-Muster, Besitzprüfung über den Adapter, Rate-Limits, eigene Datenschutzseite. Sauber dokumentiert. |
| Funktionsumfang für Premiumkunden | **6,5** | Status-Zeitleiste, Dokumente samt PDF, Termine mit `.ics`, Produktpass mit Pflege und QR, Gewerke, Rendering-Freigabe mit Pins, Votes und Sprachnachricht. Es fehlen die Dinge, die „Premium“ im Alltag ausmachen: Benachrichtigungen, ein namentlicher Berater, Video-Beratung, Terminbuchung, ein echter Reklamationsfluss und eine Nachsorge. |
| Service-Design über die ganze Kundenbeziehung | **4** | Das Portal deckt nur die Phasen Angebot bis Übergabe ab. Für die Phasen vor der Anfrage und nach der Übergabe (Pflege, Jahrescheck, Erweiterung, Empfehlung) gibt es keine Abläufe. Das ist aber genau der Teil, der Wiederkäufe bringt. |
| Erreichbarkeit und Livefähigkeit | **2** | Das Portal ist nirgends verlinkt (kein Kundenlogin in Navbar oder Footer). Es bleibt laut Abschnitt 9 aus, bis Next ≥ 16.4.1 eingespielt ist (installiert: 16.3.8). Der Frappe-Adapter ist ein Stub, es gibt also noch keine echten Daten. Die Mail-Konfiguration fehlt. |
| Concierge als Betreuungskanal | **6** | Website-Agent mit sauberer KI-Kennzeichnung, Einwilligung und „Mit einem Menschen sprechen“. Er ist aber im Portal ausgeblendet, in Produktion standardmäßig aus und übergibt nicht an einen Berater (kein Kontext-Handover, kein Rückruf-Slot). |

**Gesamturteil: 5,5 / 10.** Die Technik reicht für ein MVP, das Service-Design noch nicht. Das Portal ist heute ein gut gebauter Aktenschrank. Ein Premiumkunde erwartet einen Butler: Der meldet sich von selbst, kennt den Namen des Kunden und denkt nach der Lieferung weiter.

### Konkrete Befunde aus der Prüfung

1. **Kein Einstieg:** `/de/portal` ist in `shellNav.js` nur als „nur Deutsch“-Segment eingetragen. Navbar, Footer, Kontakt- und Beratungsseite verlinken nicht auf „Mein Platzhirsch“. Das verstößt gegen Inhaber-Entscheidung 9 (alle Features verlinkt).
2. **Abgeschaltet bis zum Framework-Update:** Laut `kundenportal.md` Abschnitt 9 bleibt das Portal aus, bis Next ≥ 16.4.1 installiert ist. In `package.json` steht `16.3.8`. Das ist ein P0 für den Livegang des Portals, nicht der Website.
3. **Keine aktive Benachrichtigung:** Ein neues Dokument, eine neue Nachricht, ein Rendering zur Freigabe oder eine Terminänderung lösen keine Mail aus (offener Punkt in Abschnitt 2 Nr. 2). Kunden müssen also selbst nachsehen. Damit ist „Status in Echtzeit“ für den Kunden praktisch nicht vorhanden.
4. **Anonymer Ansprechpartner:** Das Dashboard zeigt „Ihr Platzhirsch-Beratungsteam“ mit der Studionummer. Premiumkunden erwarten eine Person mit Foto, Namen, Direktdurchwahl und Erreichbarkeitszeiten. Bei Platzhirsch kommt dazu der Kern-USP aus Inhaber-Entscheidung 8 (Harald Menghin zeichnet von Hand). Im Portal kommt er nicht vor.
5. **Demo-Hygiene:** Unter „Nachrichten“ stehen im Dashboard zwei QA-Einträge („QA-Abnahme – bitte ignorieren (iphone/desktop)“), im Verlauf der Projektseite `PRJ-2026-021` steht ein QA-Pin („QA-Abnahme – bitte ignorieren (Pin desktop)“). Vor jeder Vorführung beim Kunden oder Partner muss `.data/portal/demo.json` neu erzeugt werden. Außerdem steht in der Begrüßung ein Leerzeichen vor dem Komma („Guten Morgen , Familie Muster“).
6. **Termine nur passiv:** Kunden können einen Änderungswunsch schicken, aber keinen Termin buchen (Showroom, Vor-Ort-Tag, Video).
7. **Reklamation versteckt:** Service, Neubezug und Inzahlungnahme laufen über den Produktpass als Freitext (`addFeedback` mit Präfix). Es fehlen Fotos, Dringlichkeit, Vorgangsstatus und ein Rückmeldeversprechen. Fotos werden nur „angekündigt“.
8. **Nur Deutsch:** Das reicht für AT, DE und CH-Deutsch. Bootseigner (Yacht) und Hotelgruppen arbeiten aber oft auf Englisch. EN fehlt.
9. **Ein Kunde, eine Rolle:** Es gibt keine Rolle für Architekt, Partnerin oder Hotelbetreiber mit Einkauf und Haustechnik, und kein Freigabe-Recht pro Person. Für das neue Ziel Hotel/Contract ist das ein Pflichtbaustein.
10. **Positiv hervorzuheben:** Die Rendering-Freigabe (Annotation, Vote, Sprachnachricht mit Einwilligung, KI-Kennzeichnung nach AI Act Art. 50) gibt es in dieser Form bei den bekannten Studio-Tools nicht von Haus aus. Programa und Houzz Pro bieten Freigabe pro Produkt, aber keine Sprachnachricht am Bildpunkt ([Programa Approvals](https://programa.design/features/interior-design-approvals), [Houzz Pro Approvals](https://pro.houzz.com/pro-learn/blog/go-from-concept-to-presentation-to-client-approval)). Auch der Produktpass mit Pflege, QR und DPP-Struktur ist ein echtes Unterscheidungsmerkmal.

---

## 2. Was Premiumkunden erwarten: Abgleich mit dem Ist-Stand

| Erwartung | Ist | Lücke | Prio |
|---|---|---|---|
| Status in Echtzeit, ohne nachfragen zu müssen | Zeitleiste mit 8 Schritten | keine Push- oder Mail-Benachrichtigung, kein „Was passiert als Nächstes, und wer ist dran?“ | P0 |
| Persönlicher Berater | anonymes Team | Name, Foto, Durchwahl, Antwortversprechen („Antwort innerhalb eines Werktags“) | P0 |
| Dokumente an einem Ort | Angebot, AB, Lieferschein, Rechnung, PDF, Filter | digitale Annahme eines Angebots, Zahlungsstatus, Pläne und Handzeichnungen als eigene Dokumentart | P1 |
| Termine | Liste, `.ics`, Änderungswunsch | Selbstbuchung freier Slots, Vor-Ort-Tage, Erinnerung per Mail/SMS, Lieferfenster am Liefertag | P1 |
| Freigabe von Renderings mit Sprachnachricht | vorhanden, Mikrofon nur auf Projektseite | Freigabe-Protokoll als PDF, Versionsvergleich V1/V2, Freigabe durch zweite Person (Paar, Architekt) | P1 |
| Handzeichnung und Modell (USP) | fehlt | Scan der Handzeichnung und Fotos des Mini-Modells als eigener Projektschritt „Konzept“ vor dem 3D-Rendering | P0 (USP) |
| Produktpass, Pflegehinweise | vorhanden | ein Pass pro Stück, Pflege-Erinnerung (z. B. Leder, Naturstein, Outdoor vor dem Winter), Nachkauf von Pflegemitteln | P2 |
| Reklamation | Freitext über den Pass | eigener Ablauf mit Fotos/Video, Vorgangsnummer, Status, Gewährleistungsfristen richtig benannt | P1 |
| Chat mit Berater | asynchrone Nachrichten | Mail bei Antwort, Anhänge, optional WhatsApp-Weiterleitung (nach Einwilligung) | P1 |
| Video-Beratung | fehlt | geplanter Video-Termin mit Raum im Browser, optional mit Bildschirmfreigabe des 3D-Modells | P2 |
| Nachsorge | fehlt | 14-Tage-Check, 12-Monats-Check, Neubezug, Erweiterung, Empfehlung | P1 |
| Mehrere Beteiligte | ein Login pro Kunde | Rollen: Hauptkunde, Mitentscheider, Architekt, Betreiber (Hotel), Gewerk (nur lesend für eigene Aufgaben) | P2 (Hotel: P1) |
| Sprache | DE | EN für Yacht und Hotel | P2 |

**Hinweis zur Gewährleistung:** Für Verbraucher in Österreich gelten seit 1.1.2022 (VGG) 2 Jahre Gewährleistung ab Übergabe. In den ersten 12 Monaten wird vermutet, dass ein Mangel schon bei der Übergabe vorlag. Danach folgen 3 Monate Verjährungsfrist ([WKO, VGG Fristen](https://www.wko.at/gewerberecht/vgg-fristen-beweislast-warenkauf-ab-2022)). Für DE, CH und FL muss das eigens juristisch geprüft werden, wie es schon in Abschnitt 2 Nr. 5 vermerkt ist. Die Portaltexte dürfen nur „gesetzliche Gewährleistung“ plus Herstellergarantie „lt. Hersteller“ nennen. Ein eigenes Garantieversprechen braucht die Freigabe des Anwalts.

---

## 3. Service-Blueprint für die ganze Kundenbeziehung

Legende: **F** = Frontstage digital (Website, Portal, Concierge), **M** = Mensch vor Ort oder am Telefon, **B** = Backstage (Team-Aufgabe), **S** = System (Frappe/ERPNext, Mail, Kalender). ★ = Moment of Truth.

| # | Phase | Kundenaktion | Frontstage | Backstage | System | Kennzahl |
|---|---|---|---|---|---|---|
| 0 | Inspiration | stöbert, merkt, plant (Sofa-/Küchenplaner, Stil-Finder) | F: Merkliste, Planer, Concierge | – | Lead-Erfassung erst bei Anfrage | Merklisten mit Anfrage |
| 1 | Anfrage | Formular, Telefon, Concierge-Entwurf | F: Bestätigung mit Vorgangsnummer und Name des Beraters ★ | B: Berater wird innerhalb von 4 Std. (Geschäftszeit) zugewiesen | S: `Opportunity`, Mail an den Kunden mit Portal-Einladung | Zeit bis zur ersten Antwort |
| 2 | Erstgespräch | Showroom, Café oder Video | M: Gespräch, Fotos und Maße; F: Termin selbst buchbar | B: Gesprächsnotiz ins Projekt | S: `Event`, Notiz | Anteil Gespräch → Vor-Ort |
| 3 | Vor-Ort-Tag(e) | Studio verbringt 1–2 Tage beim Kunden (Klima, Licht, Gewohnheiten) | M: Harald Menghin ★; F: Vorbereitungs-Checkliste („Was wir mitbringen, was Sie bereithalten“) | B: Aufmaß, Fotos, Skizzen | S: Dateien privat am Projekt | – |
| 4 | Konzept von Hand | sieht Handzeichnung und Mini-Modell | F: Portal-Schritt „Konzept“ mit Scans und Modellfotos, Kommentar per Sprachnachricht ★ | B: Scan, Fotos, Upload | S: `File`, `PH Planning Feedback` | Freigabe innerhalb von 7 Tagen |
| 5 | 3D und Rendering | Varianten vergleichen, markieren, freigeben | F: Planungs-Workspace (gebaut), Freigabe-Protokoll | B: Rendering, KI-Kennzeichnung | S: Version, Votes | Anzahl Runden bis zur Freigabe |
| 6 | Angebot | liest, fragt, nimmt an | F: Angebot im Portal, digitale Annahme (V1), Rückfrage pro Position ★ | B: Kalkulation | S: `Quotation` → `Sales Order` | Angebot → Auftrag, Tage bis zur Annahme |
| 7 | Auftrag, Anzahlung | erhält AB und Anzahlungsrechnung | F: Zahlungsstatus, Bankdaten, QR-Überweisung (EPC-QR) | B: Bestellung bei Herstellern | S: `Sales Invoice`, `Purchase Order` | Zahlungseingang in Tagen |
| 8 | Bestellung, Produktion | wartet (oft 8–16 Wochen, je nach Hersteller) | F: Status pro Position („in Produktion“, „verladen“) mit Wochenmeldung ★ (häufigste Ursache für Frust ist Funkstille) | B: AB-Termine der Hersteller eintragen | S: `Purchase Order`-Status → Position | Rückfragen „Wo bleibt …?“ |
| 9 | Gewerke | Tischler, Elektro, Stein, Outdoor (nur Koordination) | F: Gewerke-Seite mit Terminen und Ansprechpartnern | B: Koordination, keine Bauleitung (Wortlaut beachten) | S: `Supplier`, `Event` | Terminabweichungen |
| 10 | Lieferung, Montage | ist zu Hause | F: Lieferfenster am Vortag, „Team ist unterwegs“, Schutzmaßnahmen; M: Montage ★ | B: Tourplanung | S: `Delivery Note` | Schäden, Nacharbeit |
| 11 | Übergabe | Rundgang, Abnahme | M: Übergabe mit Styling; F: Übergabeprotokoll, Produktpässe, Pflegeplan ★ | B: Fotos (mit Einwilligung für Referenz) | S: `Serial No`, `PH Product Pass` | Zufriedenheit (1 Frage) |
| 12 | Nachsorge 14 Tage | lebt damit | F: Mail „Passt alles?“ mit 1-Klick-Antwort; bei „nein“ öffnet sich ein Servicefall | B: Rückruf bei „nein“ binnen 1 Werktag | S: `Issue` | Anteil „passt“ |
| 13 | Bewertung, Empfehlung | bewertet, empfiehlt | F: Link zum Google-Profil (nach „passt“), Empfehlungskarte | – | – | Bewertungen pro Übergabe |
| 14 | Pflege, Saison | Leder, Stein, Outdoor vor dem Winter, Pool | F: Pflege-Erinnerung aus dem Pass, Pflegeset anfragen | B: Pflegeservice, Einlagerung Outdoor (Partner) | S: geplante Mails | Pflege-Anfragen |
| 15 | Jahrescheck | 12 Monate nach Übergabe | F: Einladung zum Jahrescheck (vor Ende der Beweislastumkehr) ★ | M: Besuch oder Video | S: `Maintenance Visit` | Folgeprojekte aus dem Check |
| 16 | Erweiterung | nächster Raum, Küche, Garten, Pool (Ezarri), Boot | F: „Neue Planung“ mit Bezug auf die bestehenden Stücke | B: Berater bleibt derselbe | S: neue `Opportunity` am Kunden | Wiederkaufquote nach 24 Monaten |

**Kernaussage:** Die Phasen 8, 12, 15 und 16 entscheiden über den Wiederkauf. Das Portal hat dafür heute keinen einzigen Auslöser. Branchenstudien zum Luxus-Handel nennen Nachbetreuung und Vertrauen immer wieder als Treiber für Wiederkäufe (z. B. [Clientbook zu After-Sales im Luxus](https://www.clientbook.com/blog/why-luxury-retailers-need-an-after-sales-service-strategy), [CXM: Lessons from luxury aftercare](https://cxm.world/digital-experience/lessons-for-retail-from-luxury-aftercare/)). Belastbare Zahlen speziell für Möbel haben wir nicht gefunden, deshalb nennen wir keine.

### Varianten für die drei Sondergeschäfte

| Segment | Was sich ändert |
|---|---|
| **Hotel/Gastro (Contract, FF&E)** | Projekt hat Zimmertypen × Stückzahl (Raumbuch). Freigabe pro Musterzimmer, dann Serienfreigabe. Rollen: Betreiber, Einkauf, Architekt, Haustechnik, Generalunternehmer (nur lesend). Lieferung in Etappen pro Etage, Mängelliste (Snag List) pro Zimmer mit Foto. Nach der Eröffnung: Ersatzteil- und Nachbestellportal mit festen Artikeln (Bezugsstoffe, Stühle, Leuchtmittel). |
| **Yacht** | Englisch, Ansprechpartner Kapitän bzw. Werft, Liefertermine nach Werftslot, Material- und Brandschutzdokumente als eigene Dokumentart, Freigabe auch asynchron über Zeitzonen. |
| **Pool/Wellness (Ezarri)** | Muster-Anfrage und Musterstatus, Verlegeplan als Dokument, Partner-Verleger als Gewerk, Pflegehinweise für Glasmosaik im Pass. |

---

## 4. Concierge im Kundenverhältnis

- **Vor der Anfrage** ist der Concierge richtig platziert. Es fehlt die **Übergabe an einen Menschen:** „Mit einem Menschen sprechen“ sollte einen Rückruf-Slot anbieten (Selbstbuchung) und den bereinigten Gesprächsentwurf *nach Einwilligung* an die Anfrage hängen. Heute muss der Kunde den Entwurf selbst einfügen.
- **Im Portal** sollte kein frei antwortender KI-Chat laufen, solange er keine Projektdaten sicher abfragen kann. Der Kunde will dort seinen Berater, keinen Bot. Empfehlung für V2: ein **Portal-Assistent nur mit Lesezugriff** auf die eigenen Projektdaten („Wann kommt das Sofa?“, „Wie pflege ich Naturstein?“). Er beantwortet nur aus Pass, Status und Pflegetexten, immer mit Quelle und mit dem Knopf „An Berater weitergeben“. Die Kennzeichnung nach AI Act Art. 50 bleibt wie beim Concierge.
- **Notaus und Kosten:** Der Concierge hängt an einer Anthropic-API (USA, Datenübermittlung). Im Portal würden Vertragsdaten übertragen. Deshalb kommt der Assistent erst nach einer DSFA (Datenschutz-Folgenabschätzung) und mit Auftragsverarbeitungsvertrag.

---

## 5. FERTIG: Portal-Roadmap MVP → V3

Grundsätze: (a) Der erste Schritt muss mit vorhandenen Mitteln gehen (Frappe/ERPNext ist schon das Backoffice, der Mailer kann bereits Resend, Postmark, Frappe und Webhooks). (b) Keine neue Abo-Software, solange es Frappe kann. (c) Jede Stufe hat ein messbares Ziel.

### MVP „Live mit echten Kunden“ (Ziel: 4–6 Wochen nach Freigabe, Aufwand M)

**Ziel:** 10 laufende Projekte im Portal, 80 % der Kunden loggen sich mindestens einmal ein.

| ID | Nutzerstory | Akzeptanzkriterien |
|---|---|---|
| MVP-1 | Als Inhaber will ich, dass das Portal sicher live gehen kann. | • Next ≥ 16.4.1 installiert, Abschnitt-9-Sperre aufgehoben. • `PORTAL_SESSION_SECRET`, `PORTAL_BASE_URL`, `PORTAL_MAIL_*` gesetzt, SPF/DKIM bestanden. • Eine echte Login-Mail kommt in Gmail und Outlook im Posteingang an, nicht im Spam. • `PORTAL_ADAPTER=frappe` liefert Kunde, Projekte, Dokumente und Termine eines Testkunden. |
| MVP-2 | Als Kunde will ich das Portal finden. | • Footer: „Mein Platzhirsch – Kundenlogin“ auf allen Seiten (DE; andere Sprachen verlinken auf `/de/portal/login`). • Navbar: Symbol „Konto“ mit `aria-label`. • Auftragsbestätigungs-Mail und -PDF enthalten den Portal-Link. • Bestätigungsseite nach Anfrage nennt das Portal. |
| MVP-3 | Als Kunde will ich wissen, wer mein Berater ist. | • Dashboard und Projektseite zeigen Name, Foto (Platzhalter, bis Fotos freigegeben sind), Rolle, Direktnummer, E-Mail und Erreichbarkeit aus `Customer.advisor` bzw. `Project.ph_advisor`. • Fehlt der Berater, steht das Team als Fallback. • Antwortversprechen „in der Regel innerhalb eines Werktags“ (Text vom Inhaber bestätigt). |
| MVP-4 | Als Kunde will ich per Mail erfahren, wenn sich etwas tut. | • Mail bei: neuem Dokument, neuer Nachricht vom Studio, Rendering zur Freigabe, neuem oder geändertem Termin, Statuswechsel der Zeitleiste. • Höchstens 1 Sammelmail pro 2 Stunden pro Kunde (Bündelung). • Mail ohne Tracking-Pixel, mit Deep Link (`next=`) und Abbestellen pro Kategorie im Portal unter „Benachrichtigungen“. • Der Inhalt nennt keine Beträge und keine Produktdetails (Mail ist unsicherer Kanal), nur „Neues Dokument: Angebot Küche“. |
| MVP-5 | Als Berater will ich sofort sehen, wenn ein Kunde etwas schreibt oder freigibt. | • Jede Nachricht, Freigabe, Terminänderung und Serviceanfrage legt in Frappe ein `ToDo` für den zugeordneten Berater an und schickt ihm eine Mail. • Ein Rückstand > 1 Werktag erscheint in einer Frappe-Liste „Offene Kundenanliegen“. |
| MVP-6 | Als Kunde will ich sehen, was als Nächstes passiert. | • Unter der Zeitleiste steht ein Satz „Nächster Schritt: … · Wer: Studio/Sie/Hersteller · Voraussichtlich: KW xx oder ‚wird bestätigt‘“. • Ist der Kunde dran (z. B. Freigabe), erscheint oben eine goldene Aufgabenkarte „Ihre Aufgabe“. |
| MVP-7 | Als Inhaber will ich vorführen können, ohne peinliche Testdaten. | • Demo-Modus: QA-Einträge werden beim Start gefiltert oder `demo.json` wird zurückgesetzt. • Begrüßung ohne Leerzeichen vor dem Komma. |
| MVP-8 | Als Kunde will ich das Konzept von Hand sehen (USP). | • Neuer Rendering-Typ `konzept` (Handzeichnung, Modellfoto) mit Label „Handzeichnung · Harald Menghin“ bzw. „Modell“. • Er nutzt dieselbe Annotation und Sprachnachricht. • Kein KI-Label, weil keine KI (Feld `aiGenerated:false` Pflicht). |

### V1 „Ruhige Abwicklung“ (Ziel: 3 Monate nach MVP, Aufwand M–L)

**Ziel:** weniger Rückfragen „Wo bleibt …?“, kürzere Zeit von Angebot zu Auftrag.

| ID | Nutzerstory | Akzeptanzkriterien |
|---|---|---|
| V1-1 | Als Kunde will ich ein Angebot im Portal annehmen. | • Knopf „Angebot annehmen“ mit Zusammenfassung, Pflicht-Häkchen auf die AGB (verlinkt, Version gespeichert), Name als Bestätigung. • Erzeugt in Frappe eine `Sales Order` im Entwurf und ein `ToDo` „AB prüfen“. Es gibt keinen Automatismus, das Studio bestätigt. • Protokoll mit Zeitstempel, IP-Hash, AGB-Version und Angebots-Revision als PDF im Portal. • Rechtsform (einfache elektronische Erklärung) vom Anwalt freigegeben. |
| V1-2 | Als Kunde will ich wissen, wo jedes Stück gerade ist. | • Positionsstatus: bestellt → AB Hersteller → in Produktion → versandbereit → im Lager Lochau → Liefertermin. • Quelle: `Purchase Order` und Custom Field `ph_item_state`. • Wochen-Update-Mail, solange sich Positionen in Produktion befinden („Keine Änderung“ ist auch eine Nachricht). |
| V1-3 | Als Kunde will ich Termine selbst buchen. | • Arten: Showroom, Video, Rückruf. Vor-Ort-Tage nur als Anfrage. • Freie Slots kommen aus dem Kalender des Beraters (Frappe `Event` oder Google/Microsoft-Kalender über CalDAV). • Bestätigungs-Mail mit `.ics`, Erinnerung 24 Std. vorher, Absage bis 24 Std. vorher per Klick. |
| V1-4 | Als Kunde will ich einen Mangel melden. | • Eigener Bereich „Service“: Stück wählen (aus Pässen), Art (Schaden, Funktion, Pflege, Sonstiges), bis zu 6 Fotos oder 1 Video (≤ 100 MB) über den vorhandenen Upload mit signiertem Token, Dringlichkeit. • Vorgangsnummer, Status (eingegangen → in Prüfung → Termin → erledigt), Rückmeldung binnen 2 Werktagen. • Frappe: `Warranty Claim` mit `serial_no` ([ERPNext Warranty Claim](https://docs.frappe.io/erpnext/user/manual/en/warranty-claim)). • Texte nennen „gesetzliche Gewährleistung“ ohne eigene Zusage. |
| V1-5 | Als Kunde will ich Freigaben belegen können. | • Jede Freigabe erzeugt ein PDF-Protokoll (Version, Datum, Person, Kommentare). • Versionsvergleich V1/V2 im Schieberegler (Komponente `BeforeAfter` existiert). |
| V1-6 | Als Paar wollen wir beide freigeben. | • Hauptkunde lädt Mitentscheider per Mail ein (Magic Link, eigene Kontakt-ID). • Freigabe-Einstellung pro Projekt: „eine Person genügt“ oder „beide“. • Jede Aktion zeigt, wer sie ausgelöst hat. |
| V1-7 | Als Kunde will ich wissen, was ich zahlen muss. | • Rechnungen mit Fälligkeit und offenem Betrag (`outstanding_amount`), EPC-QR-Code für SEPA-Überweisung (kostenlos, keine Zahlungsdienstleister-Gebühr, kein Online-Zahlungsprodukt). • Online-Zahlung (Karte) erst nach Inhaber-Entscheidung, wie beim Gutscheinverkauf (Insolvenzrechtler zuerst). |
| V1-8 | Als Kunde will ich nach der Übergabe gut betreut sein. | • Automatik: 14 Tage nach `Delivery Note` Mail „Passt alles?“ mit zwei Knöpfen. „Ja“ führt zur Bewertungsbitte (Google-Profil), „Nein“ öffnet V1-4 mit dem Projekt vorgewählt. • Die Bewertungsbitte geht nur nach „Ja“ und ohne Anreiz (UWG/Google-Richtlinien prüfen). |

### V2 „Beziehung“ (Ziel: 6–9 Monate, Aufwand L)

**Ziel:** messbarer Wiederkauf und Empfehlungen aus dem Kundenstamm.

| ID | Nutzerstory | Akzeptanzkriterien |
|---|---|---|
| V2-1 | Als Kunde will ich eine Video-Beratung im Browser. | • Termin-Art „Video“ öffnet einen Raum ohne Installation, EU-Hosting, Auftragsverarbeitungsvertrag. • Der Berater kann das 3D-Modell bzw. Rendering teilen. • Keine Aufzeichnung ohne gesonderte Einwilligung. • Anbieter: selbst gehostetes Jitsi oder ein EU-Anbieter mit AVV. Kosten bei der Auswahl prüfen, die Anbieter wechseln oft (Beispiel: Cal.eu schließt laut [meetergo](https://meetergo.com/en/magazine/cal-com-eu-hosting) am 1.11.2026, die Quelle ist aber Konkurrent). |
| V2-2 | Als Kunde will ich rechtzeitig an die Pflege erinnert werden. | • Pflegeplan pro Pass (Material → Intervall, z. B. Leder halbjährlich, Outdoor vor dem Winter, Naturstein laut Hersteller). • Mail mit Anleitung, Link „Pflegeservice anfragen“. • Abbestellbar. |
| V2-3 | Als Kunde will ich zum Jahrescheck eingeladen werden. | • 11 Monate nach Übergabe: Einladung zu einem kostenlosen Check (vor Ort im Umkreis oder per Video). Der Inhaber legt Umfang und Gebiet fest. • Ergebnis wird als Notiz im Projekt gespeichert, auf Wunsch mit „Neue Planung“. |
| V2-4 | Als Kunde will ich passende Erweiterungen sehen, ohne Werbung zu bekommen. | • Kachel „Für Ihr Zuhause“ mit höchstens 3 Vorschlägen, die der **Berater** kuratiert (z. B. Outdoor zur Wohnzimmer-Linie, Ezarri fürs Bad, Leuchte zur Küche). Kein Algorithmus im ersten Schritt. • Werbliche Mails nur mit Newsletter-Einwilligung. Servicemails bleiben werbefrei (§ 174 TKG, UWG). |
| V2-5 | Als Kunde will ich jemanden empfehlen. | • „Empfehlen“ erzeugt eine persönliche Karte (Link mit Kürzel). Die eingeladene Person bekommt ein Erstgespräch im Café. • Anreiz nur nach Freigabe des Inhabers und rechtlicher Prüfung, Standard ist ohne Prämie. |
| V2-6 | Als Kunde will ich Fragen zu meinem Projekt sofort beantwortet bekommen. | • Portal-Assistent nur mit Lesezugriff auf die eigenen Daten, Antworten mit Quellenangabe, „An Berater weitergeben“ immer sichtbar, KI-Kennzeichnung. • Nur nach DSFA, AVV und Inhaber-Freigabe. • Der Assistent darf nichts zusagen (Termine, Preise, Gewährleistung). |
| V2-7 | Als Yacht- oder Hotelkunde will ich das Portal auf Englisch. | • `en` für alle Portalseiten über die vorhandenen `t()`-Schlüssel (R5). Mails in der Sprache des Kontakts. |
| V2-8 | Als Studio will ich wissen, wie zufrieden Kunden sind. | • Nach Übergabe und nach Servicefall eine Frage (0–10) plus Freitext. Auswertung in Frappe. Keine öffentliche Anzeige ohne Einwilligung. |

### V3 „Contract und Plattform“ (Ziel: 12+ Monate oder früher, sobald der erste Hotelauftrag in Aussicht ist; Aufwand L)

| ID | Nutzerstory | Akzeptanzkriterien |
|---|---|---|
| V3-1 | Als Hotelbetreiber will ich alle Zimmer im Blick haben. | • Raumbuch: Zimmertypen × Anzahl × Positionen (FF&E), Status pro Etage. • Freigabe erst Musterzimmer, dann Serie. • Export als Excel/CSV für den Einkauf. |
| V3-2 | Als Hotelbetreiber will ich Mängel pro Zimmer melden. | • Snag List: Zimmernummer, Foto, Gewerk, Frist, Status. • Mobil bedienbar, auch offline erfassen und später senden. |
| V3-3 | Als Projektbeteiligter will ich nur meinen Teil sehen. | • Rollen und Rechte: Betreiber (alles), Einkauf (Dokumente, Preise), Architekt (Pläne, Freigaben), Gewerk (eigene Aufgaben, keine Preise), Werft/Kapitän (Yacht). • Zugriff wird protokolliert, Entzug sofort (`sessionVersion`, offener Punkt aus Abschnitt 1). |
| V3-4 | Als Hotel will ich nachbestellen. | • Katalog der verbauten Artikel mit festen Konditionen (Rahmenvertrag), Nachbestellung als Anfrage → `Quotation`. |
| V3-5 | Als Kunde will ich meinen Produktpass öffentlich teilen (Wiederverkauf). | • Öffentliche Passansicht ohne persönliche Daten (QR), sobald der delegierte Rechtsakt der ESPR für Möbel vorliegt. Bis dahin nur auf Wunsch des Kunden. • Inzahlungnahme über den Pass, mit Fotos und Zustand. |
| V3-6 | Als Inhaber will ich sehen, was das Portal bringt. | • Kennzahlen-Seite in Frappe: Logins, Zeit bis zur Freigabe, Angebot → Auftrag, Servicefälle, Wiederkauf nach 12/24 Monaten, Umsatz aus Bestandskunden. |

---

## 6. FERTIG: Benachrichtigungstexte (MVP-4, V1-8, V2-2, V2-3)

Ton: Sie-Form, ruhig, keine Ausrufezeichen, keine Superlative, keine Beträge in Mails. `{…}` = Platzhalter.

**Neues Dokument**
> Betreff: Neues Dokument zu „{Projekt}“
> Guten Tag {Anrede Name},
> in Ihrem Kundenportal liegt ein neues Dokument: {Dokumentart} „{Titel}“.
> [Dokument ansehen]
> Fragen beantwortet Ihnen {Berater Vorname Nachname} gerne unter {Durchwahl}.
> Ihr Platzhirsch Home Living · Landstraße 11 · 6911 Lochau

**Rendering zur Freigabe**
> Betreff: Ihre Entwürfe für „{Projekt}“ sind bereit
> Guten Tag {Anrede Name},
> {Anzahl} Varianten warten auf Ihre Meinung. Sie können direkt im Bild markieren, was Ihnen gefällt oder was anders sein soll, auch per Sprachnachricht.
> [Entwürfe ansehen]
> Wir planen erst weiter, wenn Sie zufrieden sind.

**Statuswechsel Produktion (Wochen-Update)**
> Betreff: Stand Ihrer Bestellung „{Projekt}“, KW {xx}
> {Position 1}: {Status} · {Position 2}: {Status}
> Sobald ein Liefertermin feststeht, melden wir uns mit Terminvorschlägen.

**14-Tage-Check**
> Betreff: Passt alles?
> Guten Tag {Anrede Name},
> seit zwei Wochen stehen Ihre neuen Stücke bei Ihnen. Passt alles so, wie Sie es sich vorgestellt haben?
> [Ja, alles bestens] [Nein, bitte melden Sie sich]
> Bei „Nein“ ruft {Berater Vorname} Sie innerhalb eines Werktags an.

**Pflege-Erinnerung**
> Betreff: Pflegezeit für {Produkt}
> Für {Material} empfiehlt der Hersteller eine Pflege etwa alle {Intervall}. Die Anleitung finden Sie in Ihrem Produktpass.
> [Pflegeanleitung öffnen] · [Pflegeservice anfragen]

**Jahrescheck**
> Betreff: Ein Jahr in Ihrem neuen {Raum}
> Gerne sehen wir uns an, wie sich alles eingelebt hat: Stoffe, Oberflächen, Licht. Der Termin ist für Sie kostenlos. {Umfang vom Inhaber festzulegen}
> [Termin wählen]

Jede Mail trägt im Fuß: „Diese Nachricht betrifft Ihren Auftrag. Benachrichtigungen können Sie im Kundenportal unter ‚Benachrichtigungen‘ anpassen.“ Werbliche Inhalte kommen nicht in Servicemails.

---

## 7. FERTIG: Spezifikation Benachrichtigungs-Dienst (MVP-4/5)

- **Auslöser:** Frappe-Webhooks (`after_insert`/`on_update` auf `Sales Invoice`, `Quotation`, `Communication`, `Event`, `File` mit `ph_portal_visible=1`, `Project.ph_portal_step`) → `POST /api/portal/hooks/frappe` (HMAC-signiert, gleicher Mechanismus wie der Webhook-Mailer).
- **Warteschlange:** Ein Eintrag `{customerId, kind, refId, createdAt}` landet im Speicher-Adapter (`limitStore` bzw. später Redis). Ein Cron (Frappe Scheduler alle 15 Min. oder Vercel Cron) bündelt pro Kunde und Fenster (2 Std.) und versendet über `lib/portal/mailer.js`.
- **Präferenzen:** neues Feld `Contact.ph_notify` (JSON: `documents, messages, approvals, appointments, status, care`; Standard alle an, `care` aus bis zur Übergabe). Portal-Seite `/de/portal/benachrichtigungen`.
- **Berater-Seite:** Kundenaktionen → `ToDo` (`allocated_to` = Berater) + Mail. SLA-Bericht als Frappe-Report.
- **Nicht im MVP:** Push, SMS, WhatsApp. WhatsApp Business erst nach Einwilligungskonzept und AVV.
- **Tests:** Unit-Test für die Bündelung (3 Ereignisse innerhalb von 10 Min. → 1 Mail), für die Präferenz (aus → 0 Mails) und für den Mailinhalt (keine Beträge, Regex auf `€|EUR|CHF`).

---

## 8. Maßnahmen

Umsatzeffekte sind **Schätzungen der Wirkungsrichtung** ohne belastbare Basiszahlen. Sie sollen über die Kennzahlen in V3-6 überprüft werden.

| Prio | Maßnahme | Aufwand | Kosten grob | Erwarteter Umsatzeffekt (Begründung) | Wer |
|---|---|---|---|---|---|
| P0 | Next ≥ 16.4.1 einspielen, Portal-Sperre aufheben, Secrets und Mail (SPF/DKIM) setzen | S | 0 € (Mail: Free-Tier eines Anbieters oder Frappe-Mailkonto) | indirekt: ohne dieses Paket kein Portal und damit kein Effekt | Code-Team, Inhaber (DNS) |
| P0 | Frappe-Adapter fertig (Kunde, Projekt, Dokumente, Termine, Nachrichten) | M | interne Zeit | Voraussetzung für alles; spart Telefon- und Mail-Rückfragen | Code-Team |
| P0 | Einstieg „Mein Platzhirsch“ in Footer/Navbar, Link in AB-Mail und -PDF | S | 0 € | Nutzung des Portals; ohne Link bleibt es ungenutzt | Code-Team |
| P0 | Benannter Berater mit Foto und Antwortversprechen (MVP-3) | S | 0 € | Vertrauen in der Angebotsphase → schnellere Annahme (Schätzung: spürbar bei hochpreisigen Aufträgen, wo die Beziehung entscheidet) | Code-Team, Inhaber (Fotos, Texte) |
| P0 | Benachrichtigungen an Kunden und Berater (MVP-4/5, Spez. Abschnitt 7) | M | 0–20 €/Monat Mailversand (Schätzung, je nach Anbieter) | Kern von „Echtzeit“; kürzere Freigabe- und Angebotszyklen = früherer Umsatz; weniger verlorene Anfragen durch liegengebliebene Antworten | Code-Team |
| P1 | Konzept-Schritt mit Handzeichnung/Modell im Portal (MVP-8) | S | 0 € | macht den USP im Kaufprozess erlebbar → Abgrenzung zu Online-Händlern, Preisdurchsetzung | Code-Team, Inhaber (Scans) |
| P1 | Demo-Daten bereinigen, Begrüßungs-Leerzeichen | S | 0 € | Vorführung bei Hotel-, Yacht- und Architekten-Kontakten ohne Peinlichkeit | Code-Team |
| P1 | Angebot digital annehmen + Freigabe-Protokoll (V1-1, V1-5) | M | Anwalt für Prüfung | weniger Tage bis zum Auftrag; Anzahlung kommt früher (Liquidität) | Code-Team, Anwalt |
| P1 | Positionsstatus und Wochen-Update in der Produktion (V1-2) | M | 0 € | weniger Frust und Stornogefahr in der Wartezeit; Entlastung des Teams | Code-Team, Team (Pflege der Status) |
| P1 | Service-/Reklamationsablauf mit Fotos (V1-4) | M | 0 € | schützt Bewertungen und Wiederkauf; strukturierte Mängel senken Kosten für Nacharbeit | Code-Team |
| P1 | 14-Tage-Check mit Bewertungsbitte (V1-8) | S | 0 € | mehr Google-Bewertungen → Local SEO → mehr Neuanfragen (Hebel für das Ziel Nr. 1 online) | Code-Team, Inhaber (Text) |
| P1 | EPC-QR auf Rechnungen und Zahlungsstatus (V1-7) | S | 0 € | schnellerer Zahlungseingang, wichtig bei angespannter Liquidität | Code-Team |
| P1 | Terminbuchung Showroom/Video/Rückruf (V1-3) | M | 0 € (eigene Lösung auf Frappe `Event`) | mehr Erstgespräche aus Anfragen, weniger Hin und Her | Code-Team |
| P1 | Concierge: Übergabe an Menschen mit Rückruf-Slot und Entwurf (nach Einwilligung) | M | 0 € | weniger Abbrüche zwischen KI-Gespräch und Anfrage | Code-Team, Datenschutz |
| P2 | Mitentscheider-Zugang (V1-6) | M | 0 € | Freigaben gehen nicht verloren, wenn eine Person fehlt | Code-Team |
| P2 | Pflege-Erinnerungen und Pflegeservice (V2-2) | M | Partner für Pflegemittel | kleiner Direktumsatz; vor allem Kontaktanlass für Folgeprojekte | Code-Team, Partner |
| P2 | Jahrescheck (V2-3) | S | Zeit des Beraters | Schätzung: der wichtigste Anlass für Folgeprojekte (Erweiterung, Outdoor, Ezarri), Wirkung erst nach 12 Monaten messbar | Inhaber, Code-Team |
| P2 | Kuratierte Erweiterungen und Empfehlungskarte (V2-4/5) | M | 0 € | Cross-Selling zwischen den Geschäftsfeldern; Empfehlungen sind im Premiumsegment ein starker Kanal | Code-Team, Berater |
| P2 | Video-Beratung (V2-1) | M | 0 € (Jitsi selbst gehostet) bis niedrige Monatsgebühr (Schätzung) | Reichweite CH/DE/FL und Yacht ohne Anfahrt | Code-Team |
| P2 | Portal auf Englisch (V2-7) | S | Übersetzung | Voraussetzung für Yacht und internationale Hotelgruppen | Code-Team, Lektorat |
| P3 | Portal-Assistent mit Lesezugriff (V2-6) | L | API-Kosten, DSFA | weniger Routinefragen; erst nach den Grundlagen sinnvoll | Code-Team, Datenschutz |
| P3 | Contract-Modul: Raumbuch, Snag List, Rollen, Nachbestellung (V3-1–4) | L | interne Zeit | Voraussetzung für Hotelaufträge, die einzeln ein Vielfaches eines Privatauftrags ausmachen können; vorziehen, sobald der erste Hotelkontakt ernsthaft ist | Code-Team, Inhaber |
| P3 | Öffentlicher Produktpass und Inzahlungnahme (V3-5) | M | 0 € | Wiederverkaufs- und Neubezugs-Geschäft; abhängig vom ESPR-Rechtsakt | Code-Team |

---

## 9. Top-5-Hebel mit Umsatzeffekt

1. **Livefähig machen (P0):** Next-Update, Secrets, Mail, Frappe-Adapter, Link im Footer. Ohne dieses Paket bringt das Portal keinen Euro.
2. **Benachrichtigungen und benannter Berater:** Freigaben, Angebote und Antworten bleiben nicht liegen. Aufträge werden schneller abgeschlossen, und die Anzahlung kommt früher.
3. **Digitale Angebotsannahme mit EPC-QR-Zahlung:** kürzerer Weg vom Angebot zum Auftrag und zum Geld. Das kostet kein Kapital.
4. **Nachsorge-Kette (14-Tage-Check → Bewertung → Pflege → Jahrescheck):** Daraus entstehen Wiederkäufe, Cross-Selling (Outdoor, Ezarri, Küche) und Google-Bewertungen für Local SEO.
5. **Contract-Modul vorbereiten:** Raumbuch, Rollen und Snag List machen Platzhirsch für Hotels zu einem professionellen Partner. Ein Hotelauftrag kann den Umsatz vieler Privataufträge ersetzen.

---

## Quellen

- Programa, Client Approvals: https://programa.design/features/interior-design-approvals
- Programa, Client Dashboard: https://programa.design/blog/client-portal-software-for-interior-designers
- Houzz Pro, Concept → Presentation → Approval: https://pro.houzz.com/pro-learn/blog/go-from-concept-to-presentation-to-client-approval
- ERPNext, Warranty Claim: https://docs.frappe.io/erpnext/user/manual/en/warranty-claim
- Frappe Forum, Kundenportal und Issues (älter): https://discuss.frappe.io/t/customer-portal-issues-helpdesk-web-forms/9191
- WKO, VGG Fristen und Beweislast: https://www.wko.at/gewerberecht/vgg-fristen-beweislast-warenkauf-ab-2022
- Clientbook, After-Sales im Luxus: https://www.clientbook.com/blog/why-luxury-retailers-need-an-after-sales-service-strategy
- CXM, Luxury aftercare: https://cxm.world/digital-experience/lessons-for-retail-from-luxury-aftercare/
- meetergo, Cal.com EU-Hosting (Konkurrenzquelle): https://meetergo.com/en/magazine/cal-com-eu-hosting
