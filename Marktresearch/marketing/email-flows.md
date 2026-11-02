# E-Mail-Flows & Newsletter – Platzhirsch Home Living

**Stand:** 26.10.2026 · **Status: ENTWURF** – nichts davon ist versendet, kein Konto angelegt.
**Sprache:** de-AT (Sie-Form, „Jänner“, Gastgeber-Stimme laut digital/12, Abschn. 3.1).
**Grundlage:** `digital/11-crm-automation.md` (F3, F5, F6, F7, F10), `digital/12-content-storytelling.md` (C7, 4b), `23-masterkonzept.md`, `10-zubehoer-kerzen-duefte-geschenke.md` (4.7), `26-binni-kooperation.md`.

> **Platzhalter:** Alles in `[ECKIGEN KLAMMERN]` muss vor dem Versand befüllt oder geprüft werden. `[PRÜFEN: …]` heißt: Fakt ist nicht belegt und darf nicht ungeprüft raus.
> **Textregeln:** keine „offizieller/autorisierter Händler“-Aussage zu Minotti/Poliform (erlaubt: „Minotti im Showroom in Lochau erleben“), keine Superlative, keine Ausrufezeichen, keine erfundenen Preise, Rabatte, Referenzen oder Kundenstimmen. Herstellerbilder nur mit schriftlicher Freigabe, sonst eigene Showroom-Fotos.

---

## 0. Grundlagen für alle Mails

### 0.1 Rechtliche Leitplanken (vor erstem Versand mit Anwalt abstimmen)

| Thema | Regel | Folge für die Flows |
|---|---|---|
| **Werbe-E-Mail AT** | § 174 Abs. 3 TKG 2021: Direktwerbung per E-Mail nur mit **vorheriger Einwilligung** – gilt in Österreich **auch gegenüber Unternehmen** (keine B2B-Ausnahme) und auch für einzelne E-Mails, nicht nur Massenversand. | Newsletter nur nach Double-Opt-in. Firmen- und Hotelkontakte ohne Einwilligung bekommen **keine** Werbe-Mail, sondern Brief, Anruf oder persönliches Gespräch. |
| **Ausnahme Bestandskunden AT** | § 174 Abs. 4 TKG 2021, alle Bedingungen gleichzeitig: (1) Adresse im Zusammenhang mit einem **Kauf/einer Dienstleistung** erhalten, (2) Werbung nur für **eigene ähnliche** Produkte, (3) Widerspruchsmöglichkeit bei der Erhebung **und** in jeder Mail, kostenfrei und einfach, (4) Empfänger hat nicht von vornherein abgelehnt, insbesondere **nicht in der ECG-Liste der RTR** eingetragen. | Segment „Bestandskunde (§ 174 Abs. 4)“ nur aus echten Aufträgen bilden. Vor jedem Versand ohne Einwilligung Abgleich mit der ECG-Liste. Pflicht-Fußzeile B (unten). |
| **Empfänger in DE** | § 7 Abs. 2 Nr. 2 und Abs. 3 UWG, sinngemäß gleiche Logik. Laut BGH (VI ZR 225/17, 10.07.2018) kann schon eine **Feedback-/Bewertungsanfrage** per E-Mail Werbung sein. [PRÜFEN: Anwalt] | Auch die Bewertungsbitte bekommt den Widerspruchshinweis und geht nur an Kunden, die nicht widersprochen haben. |
| **Empfänger in CH** | Art. 3 Abs. 1 lit. o UWG (CH): Einwilligung oder Kundenbeziehung + ähnliche Produkte + Ablehnungsmöglichkeit. | wie AT, Absender und Abmeldung klar angeben. |
| **Empfänger in FL** | [PRÜFEN: Liechtensteinisches Kommunikationsgesetz/UWG – Anwalt] | bis zur Klärung wie AT behandeln (strengster Maßstab). |
| **Service vs. Werbung** | Bestätigungen, Lieferinfos, Pflegehinweise zum gekauften Stück = Service. Neuheiten, Aktionen, Einladungen, Gutscheine = Werbung. | Service-Mails ohne Werbeblöcke halten. Sobald ein „Neu im Showroom“-Block drin ist, gelten die Werberegeln. |
| **Bewertungen** | Google verbietet Anreize und selektives Anfragen („Review Gating“). | Bewertungsbitte an **alle** Kunden nach Lieferung, ohne Filter nach Zufriedenheit, ohne Gutschein, ohne Gewinnspiel. |
| **Preise/Rabatte** | Bei Werbung mit Preisermäßigung den niedrigsten Preis der letzten 30 Tage angeben (Omnibus-Umsetzung, AT § 9a PrAG). [PRÜFEN: gilt für Ausstellungsstücke/Atelierverkauf?] | Keine Prozent-Rabatte im Mailtext, Preise nur auf der Shop-Seite mit korrekter Preisangabe. |
| **Impressum** | § 5 ECG / § 14 UGB: Firma, Sitz, Firmenbuch, UID in jeder Mail. | Pflicht-Fußzeile A. |

### 0.2 Pflicht-Fußzeilen

**Fußzeile A – Newsletter (Einwilligung):**
> Platzhirsch Home Living · Landstraße 9 · 6911 Lochau · [Telefon] · [E-Mail]
> [Rechtsträger laut Impressum, Firmenbuchnummer, UID] [PRÜFEN: Nach Gründung der Handels-GmbH anpassen]
> Sie erhalten diese Nachricht, weil Sie sich am [Datum] für unseren Newsletter angemeldet haben. [Abmelden] · [Datenschutz] · [Interessen ändern]

**Fußzeile B – Bestandskunden ohne Newsletter-Einwilligung (§ 174 Abs. 4 TKG):**
> Sie erhalten diese Nachricht als Kundin bzw. Kunde von Platzhirsch Home Living. Wenn Sie keine weiteren Informationen von uns per E-Mail wünschen, genügt ein Klick: [Keine weiteren E-Mails] – oder eine kurze Antwort auf diese Mail. Das ist kostenlos.
> + Impressumszeile wie A.

**Fußzeile C – persönliche 1:1-Mails aus Frappe (Nachfassen):** normale Signatur des Beraters mit Impressumszeile, kein Abmeldelink nötig, solange die Mail sich auf die konkrete Anfrage bezieht. [PRÜFEN: Anwalt]

### 0.3 Absender und Werkzeuge

| Mailtyp | Werkzeug | Absender | Antwort landet |
|---|---|---|---|
| Newsletter, Willkommen, Event, Saison | Brevo (EU) – **Konto noch nicht angelegt** | „Susanne Meßmer · Platzhirsch“ `[gastgeberin@ / hallo@platzhirsch.studio – Adresse festlegen]` | geteiltes Postfach |
| Nachfassen nach Anfrage/Angebot | Frappe (Vorlage, Berater-Postfach) | `[Vorname Nachname]`, persönlich | im Lead-Datensatz |
| Nach Lieferung | Frappe-Notification (später automatisch), bis dahin manuell | zuständiger Berater | im Datensatz |
| B2B (Firmengeschenke, Hotels) | Frappe, einzeln, kein Massenversand | Geschäftsführung bzw. Verkauf | im Datensatz |

[PRÜFEN: Schreibweise der Inhaberin – Firmenbuch „Meßmer“, News-Beitrag „Messmer“. Einheitlich festlegen.]
Voraussetzung für Brevo: SPF/DKIM/DMARC für `platzhirsch.studio`, AVV, Datenschutzerklärung ergänzen (digital/11, F5).

### 0.4 Segmente (Felder aus digital/11, F5 und F11)

| Kürzel | Segment | Quelle | Rechtsgrundlage Werbung |
|---|---|---|---|
| **NL** | Newsletter-Abonnenten (DOI bestätigt) | Brevo | Einwilligung |
| **BK** | Bestandskunden (≥ 1 Auftrag), ohne Widerspruch, nicht ECG-Liste | Frappe | § 174 Abs. 4 TKG |
| **BK+NL** | Bestandskunden mit Newsletter-Einwilligung | Frappe + Brevo | Einwilligung (bevorzugt) |
| **INT** | Interessenten (Anfrage, kein Auftrag) | Frappe | **keine** Werbung ohne Einwilligung; nur Nachfassen zur Anfrage |
| **ARCH** | Architekten/Planer | Kundentyp | Einwilligung oder Auftragsbeziehung |
| **HOT** | Hotels/Gastro | Kundentyp | Einwilligung oder Kunde (Auftrag) |
| **B2B-GESCH** | Firmen für Geschenke | Frappe | Einwilligung oder Kunde |
| **LAND** | AT / DE / CH / FL | Land/PLZ | – |
| **INT-xxx** | Interessen: Wohnen, Küche, Outdoor, Licht, Ausstellungsstücke, Events | Newsletter-Chips | – |

**Frequenzgrenze:** max. 1 Newsletter + 1 Einladung pro Monat und Kontakt (Ausnahme November: Einladung + Erinnerung + Newsletter). Brevo-Regel „nicht mehr als 3 Mails in 7 Tagen“ setzen.

### 0.5 Versandzeit-Regeln
- Newsletter: **erster Donnerstag im Monat, 18:00 Uhr** (Abendlektüre, digital/12 C7).
- Persönliche Mails: Di–Do, 09:00–11:00 Uhr.
- B2B: Di oder Mi, 08:30–10:00 Uhr.
- CH/FL: keine Versände an CH-Feiertagen (z. B. 01.08., Auffahrt, Pfingstmontag; kantonal unterschiedlich) und FL-Staatsfeiertag 15.08. [PRÜFEN je Kanton]
- Keine Mails 24.–26.12. und 31.12.–01.01.

### 0.6 UTM-Konvention (für Lead-Herkunft, digital/11 F1)
`?utm_source=newsletter&utm_medium=email&utm_campaign=[flow]-[jjjjmm]&utm_content=[mail-nr]-[cta]`
Beispiele: `willkommen-202611` / `advent-bk-202612` / `firmengeschenke-202611` / `outdoor-hotel-202612`.

---

## 1. Willkommensserie Newsletter (DOI + 3 Mails)

**Auslöser:** Anmeldung über `src/components/Newsletter/newsletter.js` → Brevo-DOI (digital/11 F5).
**Segment:** alle neuen Abonnenten; Varianten nach Kundentyp (Privat / Architekt / Hotel) und Land (CH/FL-Absatz).
**Stopp-Regel:** Wer zwischen den Mails eine Anfrage stellt oder einen Termin bucht, bekommt Mail 3 nicht.
**Messung:** Öffnungen nur als Tendenz (Apple Mail Privacy), entscheidend sind Klicks auf „Termin“ und Anfragen mit `utm_source=newsletter`.

### 1.0 Double-Opt-in-Bestätigung (sofort, transaktional, keine Werbung)

- **Betreff:** Bitte bestätigen Sie Ihre Anmeldung
- **Preheader:** Ein Klick, dann ist Ihre Anmeldung abgeschlossen.
- **Text:**

> Guten Tag,
>
> Sie haben sich auf platzhirsch.studio für unseren Newsletter angemeldet. Bitte bestätigen Sie das mit einem Klick auf den Knopf unten. Erst dann schicken wir Ihnen Post aus Lochau.
>
> Der Link ist [48 Stunden] gültig.
>
> Falls Sie sich nicht angemeldet haben, ignorieren Sie diese Mail einfach. Dann bekommen Sie von uns nichts.

- **CTA:** Anmeldung bestätigen
- **Fuß:** Impressumszeile, Link Datenschutz. Kein Bild, kein Angebot, keine Markennamen.
- **Technik:** Einwilligungstext-Version, Zeitstempel, IP/Quelle in Brevo speichern. Nach Bestätigung Weiterleitung auf eine Danke-Seite [Seite anlegen: `/newsletter/danke`].

### 1.1 Mail 1 – Willkommen (T0, sofort nach Bestätigung)

- **Betreff:** Willkommen in Lochau
- **Preheader:** Wer wir sind, wo Sie uns finden – und warum es bei uns zuerst einen Kaffee gibt.
- **Bild:** eigenes Foto Showroom + Café, Tageslicht [Foto auswählen].
- **Text:**

> Guten Tag [Vorname | „und willkommen“],
>
> schön, dass Sie dabei sind. Ich bin Susanne Meßmer und führe Platzhirsch Home Living in Lochau, zwischen Pfänder und Bodensee, fünf Minuten von Lindau.
>
> Bei uns stehen Sofas, Tische, Küchen und Leuchten von Manufakturen, die wir selbst gern zuhause hätten: Minotti, Poliform, Rimadesio, Flos, ClassiCon, Paola Lenti und einige mehr. Dazu gibt es ein Café. Das ist kein Zufall. Wer sich für ein Sofa entscheidet, sollte vorher in Ruhe darauf sitzen können – mit einem Espresso und ohne Zeitdruck.
>
> Was Sie von uns bekommen: etwa einmal im Monat einen kurzen Brief. Ein Raum, den wir eingerichtet haben, ein Stück aus dem Showroom, ein Termin im Haus, ein praktischer Tipp. Keine täglichen Angebote.
>
> Wenn Sie vorbeikommen möchten: Landstraße 9, 6911 Lochau. Parkplätze direkt vor dem Haus [PRÜFEN]. Geöffnet [Öffnungszeiten laut Website].
>
> Herzlich,
> Susanne Meßmer

- **CTA (primär):** Anfahrt & Öffnungszeiten → `/[de]/kontakt` [Pfad prüfen]
- **CTA (sekundär, Textlink):** Termin für eine Beratung vereinbaren → `/de/beratung`
- **Variante ARCH:** zweiter Absatz ersetzt durch: „Für Architektinnen und Planer stellen wir Datenblätter, Muster und Termine im Showroom bereit. Schreiben Sie mir kurz, woran Sie gerade arbeiten.“ [PRÜFEN: Musterservice tatsächlich vorhanden?]
- **Variante CH/FL:** Zusatzsatz: „Wir liefern und montieren auch in der Schweiz und in Liechtenstein. Wie das mit Mehrwertsteuer und Verzollung abläuft, erklären wir gern im Gespräch.“ [Link auf CH/FL-Seite, sobald online]

### 1.2 Mail 2 – Marken & Ratgeber (T+3 Tage, 18:00 Uhr)

- **Betreff:** Drei Dinge, die wir Kundinnen am Tisch am häufigsten erklären
- **Preheader:** Lieferzeiten, Materialien, Planung – kurz und ehrlich.
- **Text:**

> Guten Tag [Vorname],
>
> bei uns im Showroom kommen immer wieder dieselben Fragen. Hier sind drei davon, mit kurzen Antworten:
>
> **Wie lange dauert ein Sofa aus Italien?**
> Die meisten Stücke werden nach Ihrer Bestellung gefertigt, in Ihrem Stoff, in Ihren Maßen. Das braucht Zeit. Wie lange genau, hängt von Marke und Modell ab – wir nennen Ihnen den Termin vor der Bestellung. [Link Ratgeber „Lieferzeiten“, sobald online]
>
> **Leder, Bouclé oder Leinen?**
> Die Frage ist weniger, was am schönsten ist, sondern wie Sie wohnen: mit Kindern, Hund, viel Sonne am Fenster? Wir legen Ihnen die Muster auf den Tisch, und Sie dürfen sie anfassen, knittern, gegen das Licht halten. [Link Ratgeber Material]
>
> **Muss ich alles auf einmal planen?**
> Nein. Manche beginnen mit einem Sessel, andere mit dem ganzen Haus. Wenn es ein ganzes Haus wird, haben Sie bei uns eine Ansprechperson – vom ersten Plan bis zur Montage.
>
> Gerne zeigen wir Ihnen das im Showroom.
>
> Herzlich,
> Susanne Meßmer

- **CTA:** Ratgeber lesen → `/de/ratgeber` [nur verlinken, wenn Hub live ist; sonst CTA „Marken im Showroom ansehen“ → `/de/ueber-uns/marken`]
- **Hinweis:** Keine Lieferzeiten in Wochen nennen, solange sie nicht je Marke vom Team bestätigt sind.

### 1.3 Mail 3 – Einladung zu Termin/Event (T+10 Tage, Di–Do 18:00 Uhr)

- **Betreff:** Kommen Sie auf einen Kaffee vorbei
- **Preheader:** Wir legen die Stoffe schon bereit.
- **Text:**

> Guten Tag [Vorname],
>
> eine Einrichtung entscheidet man nicht am Bildschirm. Man sitzt, man legt die Hand auf den Stoff, man sieht, wie das Holz im Abendlicht aussieht.
>
> Deshalb laden wir Sie zu einem Termin ein, ganz ohne Verpflichtung. Sagen Sie uns vorher, worum es geht – Wohnzimmer, Küche, Terrasse oder ein ganzes Haus –, dann bereiten wir Muster und erste Ideen vor. Wenn Sie Pläne oder Fotos haben, bringen Sie sie mit.
>
> Für eine Beratung im Wohnbereich sollten Sie etwa [90 Minuten], für eine Küche etwa [2 Stunden] einplanen. [PRÜFEN mit Team]
>
> [Block nur bei aktuellem Event:] **Am [Datum] laden wir zu [Event] ein.** [ein Satz]. [Link Anmeldung]
>
> Herzlich,
> Susanne Meßmer

- **CTA:** Termin vereinbaren → `/de/beratung` (später Kalender-Tab, digital/11 F4)
- **Ab Februar 2027:** Satz zur „Platzhirsch Lounge“ ergänzen, sobald sie läuft.

---

## 2. Nachfassen nach Anfrage/Angebot (Tag 3, 14, 45)

**Auslöser:** Deal-Stufe „Angebot gesendet“ mit `angebot_datum` (digital/11 F3). Für Anfragen **ohne** Angebot gilt Variante 2.0.
**Kanal:** persönliche 1:1-Mail aus dem Postfach des Beraters, als Vorlage in Frappe vorbefüllt, **vor dem Senden lesen und anpassen**. Tag 3 ist primär ein Anruf.
**Stopp:** sobald die Stufe wechselt (Termin, Verhandlung, Auftrag, Verloren).
**Recht:** Die Mails beziehen sich auf die konkrete Anfrage. Keine fremden Produkte, keine Aktionen hineinpacken, sonst wird daraus Werbung.

### 2.0 Variante: Anfrage ohne Termin, Tag 2 (nur wenn telefonisch nicht erreicht)

- **Betreff:** Ihre Anfrage bei Platzhirsch – kurze Rückfrage
- **Preheader:** Ich habe Sie telefonisch nicht erreicht.
- **Text:**

> Guten Tag [Frau/Herr Nachname],
>
> danke für Ihre Anfrage zu [Thema/Produkt]. Ich habe versucht, Sie anzurufen, und möchte mich auf diesem Weg kurz melden.
>
> Damit ich Ihnen gut weiterhelfen kann, wären zwei Angaben hilfreich: Wo soll [das Stück / die Küche] hin (Ort oder Land), und gibt es einen Zeitpunkt, bis wann es fertig sein soll?
>
> Sie können einfach auf diese Mail antworten oder mich unter [Telefon direkt] erreichen.
>
> Freundliche Grüße
> [Vorname Nachname] · Platzhirsch Home Living

- **CTA:** Antworten (kein Knopf) · Textlink „Termin vereinbaren“

### 2.1 Tag 3 – „Ist alles angekommen?“ (Anruf, Mail nur als Ergänzung)

- **Aufgabe in Frappe:** Anruf. Mail nur, wenn nicht erreicht oder Kunde E-Mail bevorzugt.
- **Betreff:** Ihr Angebot für [Projekt/Produkt] – Fragen dazu?
- **Preheader:** Ich bin für Rückfragen zu Maßen, Stoffen und Lieferung da.
- **Text:**

> Guten Tag [Frau/Herr Nachname],
>
> vor ein paar Tagen haben Sie unser Angebot für [Projekt/Produkt] bekommen. Ich wollte nachfragen, ob alles gut angekommen ist und ob Sie Fragen dazu haben.
>
> Erfahrungsgemäß tauchen beim Durchlesen oft Fragen auf: Passt das Maß wirklich? Wie wirkt der Stoff im eigenen Licht? Wie läuft die Lieferung ab? Gerne gebe ich Ihnen Stoffmuster mit oder schicke sie Ihnen zu. [PRÜFEN: Musterversand möglich?]
>
> Ich bin [diese Woche Di–Fr] im Showroom und unter [Telefon direkt] erreichbar.
>
> Freundliche Grüße
> [Vorname Nachname]

- **CTA:** Antworten · Textlink „Termin im Showroom“

### 2.2 Tag 14 – Entscheidungshilfe

- **Betreff:** [Projekt] – ein paar Gedanken für Ihre Entscheidung
- **Preheader:** Wie andere Kundinnen ähnliche Räume gelöst haben – und was als Nächstes kommt.
- **Text:**

> Guten Tag [Frau/Herr Nachname],
>
> ich melde mich noch einmal zu Ihrem Angebot für [Projekt]. Eine Entscheidung für ein Sofa oder eine Küche nimmt man sich zu Recht Zeit.
>
> [Optionaler Block Referenz – NUR mit echter Kundenfreigabe:] Vor Kurzem haben wir ein [Typologie] in [Region] eingerichtet, mit einer ähnlichen Frage wie bei Ihnen: [ein Satz zur Lösung]. Fotos dazu finden Sie hier: [Link Projektseite].
>
> Falls es hilft, ein paar Punkte zur Abwicklung:
> – Lieferung und Montage übernimmt [unser eigenes Team / unser Montagepartner] [PRÜFEN].
> – [Nur wenn eingeführt:] Ihre Anzahlung ist [abgesichert durch …]. [PRÜFEN – 23/10.1, erst nach Bankvereinbarung und Rechtsprüfung]
> – [Nur wenn eingeführt:] Auf Wunsch ist eine Finanzierung möglich: [Konditionen laut Bankpartner]. [PRÜFEN]
> – [Für CH/FL:] Wir kümmern uns um Ausfuhr und Verzollung; Sie bekommen [einen Festpreis in CHF / die Abwicklung nach Weg A/B] [PRÜFEN – Bericht 18].
>
> Wenn Sie das Stück noch einmal sehen oder probesitzen möchten: Kommen Sie gern auf einen Kaffee vorbei, ich reserviere Ihnen einen Tisch.
>
> Freundliche Grüße
> [Vorname Nachname]

- **CTA:** Termin vereinbaren
- **Regel:** Ohne freigegebene Referenz den Referenzblock streichen, nicht durch eine allgemeine Formulierung ersetzen.

### 2.3 Tag 45 – Projektstand

- **Betreff:** Wie steht es um [Projekt]?
- **Preheader:** Eine kurze Antwort genügt – auch wenn das Projekt gerade ruht.
- **Text:**

> Guten Tag [Frau/Herr Nachname],
>
> ich wollte mich ein letztes Mal zu unserem Angebot für [Projekt] melden, ohne Sie zu bedrängen.
>
> Damit ich weiß, wie ich Ihnen am besten helfe, genügt eine kurze Antwort:
> – **Das Projekt läuft noch:** Dann besprechen wir gern die offenen Punkte.
> – **Es ruht gerade:** Kein Problem. Sagen Sie mir, wann ich mich wieder melden darf.
> – **Sie haben sich anders entschieden:** Auch das ist in Ordnung. Ein kurzer Satz, warum, hilft uns sehr, besser zu werden.
>
> Hinweis: Preise und Liefertermine im Angebot gelten bis [Gültigkeitsdatum]. Danach prüfe ich sie gern neu.
>
> Freundliche Grüße
> [Vorname Nachname]

- **CTA:** Antworten
- **Frappe:** Antwort „ruht“ → Wiedervorlage +6 Monate; „anders entschieden“ → Verlustgrund erfassen. Nach Tag 45 **keine** weiteren automatischen Mails. Werbliche Ansprache später (z. B. Ausstellungsstücke) nur mit Newsletter-Einwilligung – Interessenten sind keine Bestandskunden im Sinne von § 174 Abs. 4.

---

## 3. Nach Auftrag und Lieferung

**Auslöser:** Deal-Stufe „Auftrag“ bzw. Feld `lieferdatum` (digital/11 F6). Bis Frappe-Felder existieren: manuell durch den Berater nach Liste.
**Segment:** alle Kunden mit Lieferung. **Die Bewertungsbitte geht an ALLE, ohne Filter und ohne Anreiz.**

### 3.0 Auftragsbestätigung (begleitend zum Vertragsdokument, transaktional)

- **Betreff:** Ihre Bestellung [Auftragsnummer] – danke für Ihr Vertrauen
- **Preheader:** Was jetzt passiert und wann Sie von uns hören.
- **Text:**

> Guten Tag [Frau/Herr Nachname],
>
> danke für Ihre Bestellung. Im Anhang finden Sie die Auftragsbestätigung.
>
> So geht es weiter:
> 1. Wir geben die Bestellung an [Hersteller] weiter. Die Fertigung beginnt nach [Anzahlung/Freigabe].
> 2. Der voraussichtliche Liefertermin ist [KW / Zeitraum]. Sobald der Hersteller den Termin bestätigt, melden wir uns.
> 3. Etwa [eine Woche] vor der Lieferung vereinbaren wir den genauen Tag mit Ihnen.
>
> Ihre Ansprechperson bleibt ich: [Vorname Nachname], [Telefon direkt].
>
> Freundliche Grüße
> [Vorname Nachname]

### 3.1 Danke nach Lieferung (T+1 Tag)

- **Betreff:** Willkommen zuhause, [Produkt/Projekt]
- **Preheader:** Danke – und ein paar Hinweise für die ersten Wochen.
- **Text:**

> Guten Tag [Frau/Herr Nachname],
>
> gestern haben wir [Ihr Sofa / Ihre Küche / Ihre Terrassenmöbel] geliefert. Danke, dass Sie sich für Platzhirsch entschieden haben.
>
> Für die ersten Wochen:
> – Neue Polster setzen sich in den ersten Wochen etwas. Das ist normal. Ab und zu aufschütteln und die Sitzplätze abwechseln hilft. [nur bei Polstermöbeln]
> – Gerüche von Verpackung und Fertigung verfliegen mit Lüften meist nach wenigen Tagen.
> – Die Pflegeanleitung des Herstellers [liegt bei / finden Sie im Anhang]. Sie ist maßgeblich – bitte heben Sie sie auf.
>
> Wenn etwas nicht passt, ein Kratzer, eine Schraube, eine offene Frage: Melden Sie sich bitte direkt bei mir. Dafür sind wir da.
>
> Freundliche Grüße
> [Vorname Nachname]

- **CTA:** Antworten · optional Anhang Herstellerpflegeanleitung (PDF).

### 3.2 Pflegetipps (T+10 Tage)

**Service-Mail**, keine Werbung. Ein Modul je gekaufter Pflegekategorie (`pflege_kategorie`, digital/11 F11). Nur allgemeine Hinweise; Herstellerangaben gehen immer vor.

- **Betreff:** So bleibt [Produkt] lange schön
- **Preheader:** Unsere wichtigsten Pflegehinweise für [Material] – kurz zusammengefasst.
- **Text (Rahmen):**

> Guten Tag [Frau/Herr Nachname],
>
> Ihr [Produkt] ist jetzt ein paar Tage bei Ihnen. Hier sind die Hinweise, die wir Kundinnen und Kunden am häufigsten mitgeben. Maßgeblich ist immer die Pflegeanleitung des Herstellers.
>
> [MODUL je Material]
>
> Wenn Sie unsicher sind, ob ein Mittel geeignet ist: Fragen Sie uns lieber vorher.
>
> Freundliche Grüße
> [Vorname Nachname]

- **CTA:** Pflegeanleitung des Herstellers (PDF) · Textlink Ratgeber Pflege [sobald online]

**Module:**

| Kategorie | Text-Modul |
|---|---|
| **Stoff** | Regelmäßig mit Polsterdüse absaugen. Flecken sofort mit einem saugfähigen, hellen Tuch abtupfen, nicht reiben. Reinigungsmittel zuerst an einer verdeckten Stelle testen. Direkte Sonne kann Farben mit der Zeit aufhellen. Abnehmbare Bezüge nur so reinigen, wie es das Etikett bzw. der Hersteller angibt. |
| **Leder** | Mit einem trockenen, weichen Tuch abstauben. Abstand zu Heizkörpern und Kaminen halten, direkte Sonne meiden – beides trocknet Leder aus. Flüssigkeiten sofort abtupfen. Nur Pflegemittel verwenden, die der Hersteller für dieses Leder empfiehlt. |
| **Holz / Lack** | Mit einem leicht feuchten, gut ausgewrungenen Tuch abwischen und trocknen. Keine scheuernden Mittel oder Schwämme. Untersetzer für heiße und nasse Gläser verwenden. Raumklima nicht zu trocken halten. |
| **Glas / Aluminium** (z. B. Rimadesio) | Mit weichem Tuch und mildem Glasreiniger bzw. nach Herstellerangabe reinigen, keine Scheuermittel. Beschläge und Schiebetüren nach Herstelleranleitung pflegen. [PRÜFEN: Rimadesio-Pflegeanleitung] |
| **Naturstein (Marmor)** | Marmor ist empfindlich gegen Säure: Zitrone, Essig, Wein, Kaffee sofort abwischen. Zum Reinigen pH-neutrale Mittel verwenden, keine Entkalker. Ob und wann eine Imprägnierung aufgefrischt werden soll, steht in der Pflegeanleitung. |
| **Keramik / Quarz-Komposit** (Arbeitsplatten, inkl. Küchenlinie mit Binni) | Mit warmem Wasser und mildem Reiniger abwischen. Bei Quarz-Komposit heiße Töpfe nicht direkt abstellen, Untersetzer verwenden. Kanten vor harten Stößen schützen. Die Pflegeanleitung zu Ihrer Platte kommt von unserem Manufakturpartner Binni [PRÜFEN: liegt sie auf Deutsch vor?]. |
| **Outdoor** (Tuuci, Umbrosa, Gloster, Paola Lenti, Heatsail) | Kissen nach Regen trocknen lassen oder trocken lagern. Schutzhüllen nur über trockene Möbel ziehen, damit sich kein Schimmel bildet. Sonnenschirme bei starkem Wind schließen – die Windgrenzen stehen in der Anleitung des Herstellers. Vor dem Winter reinigen und trocken einlagern. [Nur wenn eingeführt:] Gern übernehmen wir die Wintereinlagerung für Sie: [Link/Konditionen]. |
| **Leuchten** (Flos u. a.) | Vor dem Reinigen ausschalten und abkühlen lassen. Nur trocken oder nach Herstellerangabe reinigen. Leuchtmittel/LED-Module nach Herstellerangabe tauschen. |

[PRÜFEN: Alle Module einmal vom Team gegen die Herstelleranleitungen der verkauften Marken lesen.]

### 3.3 Bewertungsbitte (T+14 Tage, an ALLE Kunden)

- **Wer:** jeder Kunde mit Lieferung, **unabhängig von Zufriedenheit**, ohne Vorauswahl. Kein Gutschein, kein Gewinnspiel, keine Gegenleistung.
- **Nicht senden:** wenn der Kunde der E-Mail-Werbung widersprochen hat oder in der ECG-Liste steht (siehe 0.1, BGH-Hinweis). Offene Reklamationen laufen parallel weiter, verschieben die Bitte aber nicht dauerhaft – sonst wäre es Gating. [Regel mit Anwalt festlegen: max. Verschiebung bis Reklamation erledigt]
- **Betreff:** Wie wohnt es sich mit [Produkt]?
- **Preheader:** Eine kurze Bewertung hilft anderen bei ihrer Entscheidung.
- **Text:**

> Guten Tag [Frau/Herr Nachname],
>
> seit ein paar Wochen steht [Ihr Produkt] bei Ihnen. Wir hoffen, Sie fühlen sich damit so wohl, wie wir es bei der Planung mit Ihnen gehofft haben.
>
> Wir würden uns freuen, wenn Sie Ihre Erfahrung mit uns auf Google teilen – ob Beratung, Lieferung oder Montage. Ehrliche Bewertungen helfen anderen, die vor derselben Entscheidung stehen. Das dauert etwa zwei Minuten.
>
> Und falls etwas nicht passt: Antworten Sie einfach auf diese Mail. Ich kümmere mich persönlich darum.
>
> Freundliche Grüße
> [Vorname Nachname] · Platzhirsch Home Living
>
> [Fußzeile B]

- **CTA:** Bewertung schreiben → `platzhirsch.studio/bewerten` [Redirect anlegen, digital/11 F7, mit `utm_source=email-bewertung`]
- **Einmal, keine Erinnerung.** Kein Hinweis „nur bei 5 Sternen“ o. ä.

### 3.4 Optional: Zufriedenheit (T+30) und Jahrestag (T+365)
- T+30 Aufgabe für Berater: kurzer Anruf „Passt alles?“ (kein Mailtext nötig).
- T+365 Pflegecheck: „Ein Jahr mit [Produkt]“ – Pflegehinweis des passenden Moduls + Angebot Pflegetermin [nur wenn Service existiert]. Gilt als Werbung, wenn ein Angebot drin ist → nur BK ohne Widerspruch, Fußzeile B.

---

## 4. Bestandskunden-Mailing Advent 2026

- **Segment:** BK und BK+NL (alle Länder). **Ersetzt** für dieses Segment den Newsletter vom 03.12.2026, damit niemand zwei Mails bekommt.
- **Versand:** **Mi 02.12.2026, 18:00 Uhr** (nach dem 1. Advent am 29.11., vor dem Newsletter-Termin).
- **Inhalt:** nur eigene, ähnliche Produkte (Einrichtung, Accessoires, Gutscheine) – Voraussetzung für § 174 Abs. 4. Kein Fremdangebot.
- **Absender:** Susanne Meßmer, Antwortadresse geteiltes Postfach.
- **Betreff:** Advent in Lochau – ein Brief an unsere Kundinnen und Kunden
- **Preheader:** Geschenke aus dem Showroom, Gutscheine und unsere Öffnungszeiten bis Weihnachten.
- **Text:**

> Guten Tag [Frau/Herr Nachname],
>
> im Advent wird es bei uns im Café ruhiger und wärmer zugleich. Viele von Ihnen haben in diesem Jahr ein Stück von uns nach Hause geholt – danke dafür. Ein paar Dinge möchte ich Ihnen vor Weihnachten noch mitgeben.
>
> **Etwas zum Verschenken**
> Im Showroom haben wir einen Tisch mit Dingen zusammengestellt, die sich gut verschenken lassen: [Kerzen, Düfte, Gläser, Decken – PRÜFEN: tatsächliches Sortiment]. Wir packen sie Ihnen gern ein.
>
> **Gutscheine**
> Wenn Sie lieber jemandem die Wahl lassen: Unsere Gutscheine gibt es [im Showroom / online] in jedem Betrag. Sie sind [unbefristet gültig – PRÜFEN: Gutscheinbedingungen].
>
> **[Nur wenn gestartet:] Ausstellungsstücke**
> Ab [Datum] machen wir Platz für neue Stücke. Als Kundin bzw. Kunde sehen Sie die Liste zuerst: [Link Shop-Seite]. [Keine Prozentangaben im Mailtext.]
>
> **Pflege vor dem Winter**
> Heizungsluft ist trocken. Leder und Holz danken es, wenn sie nicht direkt neben dem Heizkörper stehen. Terrassenmöbel sollten jetzt sauber und trocken eingelagert sein.
>
> **Öffnungszeiten bis zum Jahresende**
> [Tabelle: Advent-Samstage, 24.12., 31.12., Betriebsurlaub – PRÜFEN]
>
> Ich wünsche Ihnen eine gute Adventszeit.
> Herzlich,
> Susanne Meßmer
>
> [Fußzeile B bzw. A]

- **CTA (primär):** Gutschein ansehen → `/de/[gutschein-pfad]` [PRÜFEN: Shop-Pfad]
- **CTA (sekundär):** Öffnungszeiten & Anfahrt
- **Hinweis:** Wer am Adventsabend war, bekommt statt des ersten Absatzes: „Danke, dass Sie am 26. November bei uns waren.“

---

## 5. Einladung Adventsabend, Donnerstag 26.11.2026

**Termin:** Do 26.11.2026, [Uhrzeit, z. B. 18:00–21:00 – PRÜFEN], Showroom & Café, Landstraße 9, 6911 Lochau.
**Programm:** [PRÜFEN – Optionen aus 15/10: Vernissage, Duftberatung, Glühwein/Punsch, Musik]. **Nur nennen, was fest zugesagt ist.** Keine Co-Marketing-Aussage mit Minotti, solange nicht vereinbart.
**Anmeldung:** RSVP-Seite `src/app/[locale]/events/[slug]` (digital/11 F10) bzw. bis dahin Antwort per Mail.
**Kapazität:** [max. Gäste – PRÜFEN] → bei Erreichen Warteliste.

### Segmente und Kanal

| Gruppe | Kanal | Begründung |
|---|---|---|
| BK, BK+NL | E-Mail (Fußzeile A/B) | Einladung zu Präsentation eigener Produkte – im Rahmen § 174 Abs. 4 [PRÜFEN Anwalt] |
| NL | E-Mail (Newsletter-Versand 05.11.) | Einwilligung |
| ARCH, Makler, Firmen **mit** Einwilligung oder Auftragsbeziehung | persönliche E-Mail | wie oben |
| ARCH, Makler, Firmen **ohne** Einwilligung | **gedruckte Einladungskarte per Post** oder persönlicher Anruf | § 174 Abs. 3 – keine E-Mail |

### Zeitplan

| Datum | Mail | Empfänger |
|---|---|---|
| **Do 05.11.2026, 18:00** | 5.1 Einladung | alle Gruppen oben |
| Mo 09.11. | gedruckte Karten raus | ARCH/Makler/Firmen ohne Einwilligung |
| **Di 17.11.2026, 18:00** | 5.2 Erinnerung | nur Nicht-Reagierer, nicht Abgesagte |
| sofort | 5.3 Zusage-Bestätigung + `.ics` | Angemeldete |
| **Di 24.11.2026, 10:00** | 5.4 „Übermorgen“ | Angemeldete |
| **Fr 27.11.2026, 10:00** | 5.5 Danke | Gäste (anwesend) |
| Do 03.12.2026 | Aufgabe: persönliches Nachfassen bei Gästen, die ein Projekt erwähnt haben | Berater (kein Massenmail) |

### 5.1 Einladung (05.11.)

- **Betreff:** Einladung: Adventsabend in Lochau am 26. November
- **Preheader:** Ein Abend im Showroom und Café – wir freuen uns auf Sie.
- **Text:**

> Guten Tag [Frau/Herr Nachname],
>
> bevor der Advent beginnt, möchten wir einen Abend mit Ihnen verbringen. Wir laden Sie herzlich ein:
>
> **Adventsabend bei Platzhirsch**
> Donnerstag, 26. November 2026, ab [Uhrzeit]
> Showroom & Café, Landstraße 9, 6911 Lochau
>
> [Programm in 2–3 Zeilen, nur Bestätigtes.]
>
> Es gibt keine Präsentation und keinen Verkaufstisch. Sie können sich in Ruhe umsehen, auf den neuen Stücken sitzen und mit uns plaudern. Gern dürfen Sie eine Begleitung mitbringen.
>
> Damit wir gut planen können, bitten wir um Ihre Antwort bis [Datum, z. B. 20.11.].
>
> Herzlich,
> Susanne Meßmer und das Team von Platzhirsch

- **CTA:** Ich komme gern → RSVP-Seite (Felder: Name, Personen, Kundentyp, Newsletter-Checkbox nicht vorausgewählt)
- **Textlink:** Leider verhindert (Absage-Klick, damit keine Erinnerung kommt)
- **Variante ARCH:** Zusatz: „Bringen Sie gern Bauherren mit, mit denen Sie gerade planen.“

### 5.2 Erinnerung (17.11.)

- **Betreff:** Noch Platz am 26. November
- **Preheader:** Adventsabend in Lochau – wir würden uns freuen, Sie zu sehen.
- **Text:**

> Guten Tag [Frau/Herr Nachname],
>
> nur eine kurze Erinnerung an unseren Adventsabend am Donnerstag, 26. November, ab [Uhrzeit] in Lochau. Falls Sie Zeit haben: Wir freuen uns über Ihre Zusage bis [Datum].
>
> Herzlich,
> Susanne Meßmer

- **CTA:** Zusagen

### 5.3 Zusage-Bestätigung (sofort, transaktional)

- **Betreff:** Wir freuen uns auf Sie am 26. November
- **Preheader:** Ihre Anmeldung für [Anzahl] Person(en) ist bestätigt.
- **Text:**

> Guten Tag [Vorname Nachname],
>
> danke für Ihre Zusage. Wir haben [Anzahl] Person(en) für Sie notiert.
>
> Donnerstag, 26. November 2026, ab [Uhrzeit]
> Landstraße 9, 6911 Lochau · Parken: [PRÜFEN]
>
> Den Termin für Ihren Kalender finden Sie im Anhang. Falls Ihnen etwas dazwischenkommt, geben Sie uns bitte kurz Bescheid.

- **CTA:** In den Kalender eintragen (.ics) · Textlink „Anmeldung ändern“

### 5.4 „Übermorgen“ (24.11.)

- **Betreff:** Übermorgen in Lochau
- **Preheader:** Alles Wichtige für Donnerstagabend auf einen Blick.
- **Text:**

> Guten Tag [Vorname Nachname],
>
> übermorgen ist es so weit. Ein paar praktische Hinweise:
> – Beginn: [Uhrzeit], kommen Sie gern auch später.
> – Anreise: [Bus/Bahn-Hinweis PRÜFEN], Parkplätze [PRÜFEN].
> – Aus Lindau sind es etwa fünf Minuten mit dem Auto.
>
> Bis Donnerstag,
> das Team von Platzhirsch

### 5.5 Danke (27.11.)

- **Betreff:** Danke für den schönen Abend
- **Preheader:** Ein paar Eindrücke vom Adventsabend.
- **Text:**

> Guten Tag [Vorname Nachname],
>
> danke, dass Sie gestern bei uns waren. [Ein Satz zu einem echten Moment des Abends – nach dem Event schreiben.]
>
> Ein paar Fotos vom Abend finden Sie hier: [Link Journal-Rückblick – nur Fotos, auf denen Gäste eingewilligt haben bzw. nicht erkennbar sind].
>
> Wenn Sie an dem Abend über ein Vorhaben gesprochen haben – ein Sofa, eine Küche, eine Terrasse –, melden wir uns in den nächsten Tagen persönlich. Oder Sie vereinbaren gleich einen Termin.
>
> Herzlich,
> Susanne Meßmer

- **CTA:** Termin vereinbaren · Textlink „Fotos ansehen“

---

## 6. Firmengeschenke-Angebot B2B (nur bestehende Geschäftskontakte)

**Rechtlicher Hinweis § 174 TKG 2021 – unbedingt beachten:**
In Österreich ist Werbung per E-Mail **auch an Unternehmen** nur mit vorheriger Einwilligung erlaubt (§ 174 Abs. 3). „Bestehender Geschäftskontakt“ reicht allein **nicht**. Erlaubt ist die E-Mail nur, wenn
- (a) eine **Einwilligung** vorliegt (z. B. Newsletter-Anmeldung, schriftliche Zustimmung), **oder**
- (b) die Firma **Kundin** ist (Kauf/Dienstleistung, Adresse dabei erhalten), Firmengeschenke als **eigenes ähnliches Produkt** gelten [PRÜFEN Anwalt: Einrichtung → Geschenk-Accessoires/Gutscheine ähnlich?], bei Erhebung und in jeder Mail ein Widerspruch möglich ist **und** die Adresse nicht in der **ECG-Liste der RTR** steht.
- Visitenkarten-Tausch, Messekontakte, Kontakte der Gesellschafter oder recherchierte Adressen (z. B. aus Bericht 22) erfüllen das **nicht** → **Brief mit PDF-Beilage oder Anruf**, die E-Mail erst, wenn der Kontakt darum bittet (dann ist sie Antwort, keine Werbung).
- Empfänger in DE: § 7 UWG, bei Unternehmen ebenfalls Einwilligung/mutmaßliche Einwilligung nötig für E-Mail; CH: Art. 3 lit. o UWG; FL: [PRÜFEN].

**Segment:** B2B-GESCH, gefiltert auf „Einwilligung = ja“ ODER „Auftrag vorhanden + kein Widerspruch + ECG-Abgleich ok“. Einzelversand aus Frappe, persönliche Anrede, kein Newsletter-Layout.
**Versand:** **Di 03.11.2026 oder Mi 04.11.2026, 08:30 Uhr** (KW 45; Firmen entscheiden jetzt, Bericht 10). Anruf nach 7 Tagen (Di 10.11.). Bestellschluss für Lieferung vor Weihnachten: **[z. B. Fr 04.12.2026 – PRÜFEN: Vorlauf 2–3 Wochen laut Bericht 10, Lieferzeiten der Lieferanten]**.
**Beilage:** Firmengeschenke-PDF (KW 44–46 laut 23/15) [PDF erstellen].

- **Betreff:** Weihnachtsgeschenke für Ihre Kunden und Ihr Team – aus Lochau
- **Preheader:** Ausgewählt, verpackt und geliefert. Bestellung bis [Datum].
- **Text:**

> Guten Tag [Frau/Herr Nachname],
>
> in diesen Wochen stellen viele Unternehmen ihre Weihnachtsgeschenke zusammen. Wir machen das in diesem Jahr auch für Firmen – mit Dingen, die wir selbst im Showroom haben und gern verschenken würden.
>
> **So funktioniert es:**
> – Sie sagen uns Anzahl, Budget pro Geschenk und ob für Kunden oder Mitarbeitende.
> – Wir schlagen Ihnen zwei bis drei Zusammenstellungen vor, zum Beispiel [Kerzen und Düfte, Gläser, Decken, Geschenkgutscheine – PRÜFEN: tatsächlich lieferbares Sortiment].
> – Auf Wunsch mit Karte und Ihrem Logo, verpackt und an eine oder mehrere Adressen geliefert [PRÜFEN: Liefergebiet, Kosten; Lieferung in die Schweiz mit Verzollung klären].
> – Sie bekommen eine Rechnung mit ausgewiesener Umsatzsteuer.
>
> Preise je Zusammenstellung finden Sie im beiliegenden PDF [PRÜFEN: Preise festlegen, nicht aus Bericht 10 übernehmen – dort Schätzungen]. Für eine Lieferung vor Weihnachten brauchen wir Ihre Bestellung bis **[Datum]**.
>
> Gern können Sie die Stücke vorher im Showroom ansehen – bei einem Kaffee.
>
> Freundliche Grüße
> [Vorname Nachname] · Platzhirsch Home Living · [Telefon direkt]
>
> [Fußzeile B – Widerspruchsmöglichkeit Pflicht, wenn ohne Einwilligung]

- **CTA:** Antworten oder Rückruf vereinbaren · Anhang PDF
- **Nicht schreiben:** Firmennamen anderer Kunden als Referenz (ohne Freigabe), „exklusiv“, „Nr. 1“.

**Brief-Version (für Kontakte ohne Einwilligung):** gleicher Text, „Antworten“ ersetzt durch „Rufen Sie mich an oder schreiben Sie mir an [E-Mail]“, PDF beilegen, auf Papier mit Unterschrift.

---

## 7. Outdoor-Frühbucher an Hotels (nur Bestandskontakte)

**Rechtlicher Rahmen:** wie Abschnitt 6. E-Mail nur an Hotels mit **Einwilligung** oder mit **Auftrag** bei Platzhirsch (dann Fußzeile B, ECG-Abgleich). Alle anderen Hotels (z. B. aus der Liste „160 Hotels ab 4★“, Bericht 00/22): **Brief oder Anruf**, keine E-Mail.
**Segment:** HOT (+ Gastro), Länder AT/FL/CH/DE getrennt (CHF-Hinweis für CH).
**Versand:** **Di 15.12.2026, 09:00 Uhr** (KW 51, laut 23). Persönliches Nachfassen per Telefon in **KW 1/2 2027 (ab Mi 07.01.2027)**. Für Hotels mit Wintersaison (Arlberg, Montafon, Malbun): Nachfass-Anruf eher **Ende März/April**, nicht in der Hochsaison.
**Was es nicht gibt, bevor es festgelegt ist:** Frühbucher-Rabatt, Preisgarantie, Lieferzusage. Der „Vorteil“ muss vor Versand konkret entschieden werden.

- **Betreff:** Terrasse 2027: jetzt planen, im Frühling fertig
- **Preheader:** Sonnenschirme, Lounge und Wärme für Ihre Gäste – mit Lieferung vor Saisonstart.
- **Text:**

> Guten Tag [Frau/Herr Nachname],
>
> während Ihre Gäste jetzt in der Stube sitzen, ist bei uns die beste Zeit, um über die Terrasse im nächsten Sommer zu sprechen. Viele Outdoor-Stücke werden nach Bestellung gefertigt. Wer im Winter plant, hat im Frühling, wenn es losgeht, alles vor Ort.
>
> Was wir für Hotels und Gastronomie planen:
> – **Schatten:** Großschirme von Tuuci und Umbrosa – Größe, Windlast und Fundament stimmen wir auf Ihren Standort ab.
> – **Sitzen und Liegen:** Lounge und Dining von Gloster und Paola Lenti, für den Einsatz im Freien gemacht.
> – **Wärme:** Heatsail-Heizstrahler, damit die Terrasse auch an kühlen Abenden genutzt wird.
>
> **Ihr Vorteil bei Bestellung bis [Datum]:** [PRÜFEN – konkret festlegen, z. B. reservierter Liefertermin vor [Saisonstart], Planung vor Ort inklusive; nur, was wir sicher halten können].
>
> [Nur wenn eingeführt:] Für bestehende Outdoor-Möbel bieten wir außerdem Reinigung und Wintereinlagerung an: [Konditionen].
>
> [Variante CH/FL:] Wir liefern auch in die Schweiz und nach Liechtenstein und übernehmen die Verzollung. [PRÜFEN Bericht 18]
>
> Gern komme ich bei Ihnen vorbei und sehe mir die Terrasse an, oder Sie besuchen uns in Lochau.
>
> Freundliche Grüße
> [Vorname Nachname] · Platzhirsch Home Living · [Telefon direkt]
>
> [Fußzeile B]

- **CTA:** Termin vor Ort vereinbaren · Textlink Outdoor im Showroom → `/de/[outdoor-pfad]`
- **Nicht schreiben:** Lieferzeiten in Wochen ohne Bestätigung der Hersteller, Förderfähigkeit (ÖHT o. ä.) ohne Prüfung, Hotelnamen als Referenzen ohne Freigabe.

---

## 8. Newsletter-Plan 6 Monate (Nov 2026 – Apr 2027)

**Format „Post aus Lochau“** (digital/12, C7): max. 5 Blöcke – (1) Brief der Gastgeberin, ~80 Wörter · (2) Ein Raum · (3) Ein Stück · (4) Am Tisch (Termin) · (5) Gut zu wissen (Ratgeber).
**Versand:** erster Donnerstag, 18:00 Uhr. **Segment:** NL (+ BK+NL). Varianten: CH/FL-Absatz, ARCH-Quartalsausgabe.
**Regel:** Jeder Block nur, wenn das Material (eigenes Foto, freigegebenes Projekt, live geschaltete Seite) wirklich existiert. Lieber 3 gute Blöcke als 5 dünne.

| Versand | Thema / Betreff-Vorschlag | Preheader | Blöcke | Haupt-CTA | Segment-Hinweise |
|---|---|---|---|---|---|
| **Do 05.11.2026** | „Einladung: Adventsabend am 26. November“ (= Mail 5.1) | Ein Abend im Showroom und Café | Brief · Einladung · Ein Stück (Geschenkideen) · Gut zu wissen: Outdoor einwintern | Zusagen | NL + BK; ARCH ohne Einwilligung per Karte |
| **Do 03.12.2026** | „Schenken aus Lochau“ | Gutscheine, kleine Dinge und Öffnungszeiten bis Weihnachten | Brief · Ein Stück (Geschenktisch) · Gutscheine · Öffnungszeiten Advent/Jahreswechsel · Gut zu wissen: Ratgeber Gutscheine (#7) | Gutschein ansehen | NL ohne BK (BK bekommt Mailing 4 am 02.12.) |
| **Do 07.01.2027** | „Ausstellungsstücke – zuerst für Sie“ [nur wenn Atelierverkauf startet] | Stücke aus dem Showroom suchen ein Zuhause | Brief (Jahresbeginn) · Ein Stück je Atelier-Highlight (Foto, Maß, Link) · Gut zu wissen: Was ist ein Ausstellungsstück? (#6) · Am Tisch: Planungstermine Jänner | Liste ansehen | NL; Preise nur auf Shop-Seite (Preisangaben-Regeln) |
| **Do 04.02.2027** | „Der Sommer beginnt im Februar“ | Outdoor planen und die neue Lounge im Café | Brief · Ein Raum (Terrasse, Projekt 3 falls freigegeben) · Ein Stück (Schirm/Lounge) · Am Tisch: „Platzhirsch Lounge“ [falls gestartet] · Gut zu wissen: Outdoor am See (#12/#13) | Outdoor-Termin | NL; Interesse Outdoor zuerst; HOT bekommen keinen Doppel-Mail-Inhalt |
| **Do 04.03.2027** | „Schweiz und Liechtenstein: so einfach geht es“ | Lieferung, Verzollung und Montage über die Grenze | Brief · Gut zu wissen: Ratgeber Schweiz (#2) / Liechtenstein (#3) · Ein Raum (Küche, Projekt 4) · **Neu: Küchenlinie mit Steinarbeitsplatten** – „gefertigt von unserem Manufakturpartner Binni im Kosovo“ [Name der Linie + Startdatum PRÜFEN; Herkunft offen nennen, nichts, was „Made in Italy“ nahelegt] · Am Tisch: Küchentermine | Termin vereinbaren | NL; CH/FL-Version mit „ss“, „Offerte“, CHF [Steuerberater-Review] |
| **Do 01.04.2027** | „Vor dem Salone: was wir in Mailand ansehen“ | Ein Blick nach Mailand – und Ostern in Lochau | Brief · Vorschau Salone del Mobile [Datum PRÜFEN] · Ein Stück · Ostern-Öffnungszeiten · Gut zu wissen: Sofa-Bezug (#11) | Journal lesen | NL; ARCH-Quartalsausgabe: Materialneuheiten, Musterservice |
| **Do 29.04.2027** (Zusatz) | „Neu im Showroom“ | Was wir aus Mailand mitgebracht haben | Brief · Neuheiten (eigene Fotos; Herstellerbilder nur mit Freigabe) · Am Tisch: Abend zu den Neuheiten [falls geplant] | Termin vereinbaren | NL; zählt als Einladung des Monats |

**Weitere Mails im Zeitraum (außerhalb des Newsletters):**
- Di 03.11./Mi 04.11.: Firmengeschenke-Mail bzw. Brief, ab Di 10.11. Nachfassen per Telefon (Abschnitt 6).
- Di 15.12.: Outdoor-Frühbucher Hotels (Abschnitt 7).
- Laufend: Willkommensserie (1), Nachfassen (2), Nach-Lieferung (3).
- Optional Februar: Architekten-Quartal (ARCH, Einwilligung) – Neuheiten, Termine „Lochauer Gespräche“ [falls Format gestartet].

**Kennzahlen pro Ausgabe:** Klickrate auf Haupt-CTA, Anfragen/Termine mit `utm_source=newsletter` (Frappe-Herkunft), Abmeldungen (> 0,5 % pro Versand = Inhalt/Frequenz prüfen), Spam-Beschwerden (> 0,1 % = sofort stoppen).

---

## 9. Offene Punkte vor dem ersten Versand

1. **Konten/Technik:** Brevo-Konto, AVV, SPF/DKIM/DMARC, DOI-Vorlage, Danke-Seite; Frappe-Vorlagen und Felder (`angebot_datum`, `lieferdatum`, `pflege_kategorie`, Einwilligung). Nichts davon ist angelegt.
2. **Recht (Anwalt):** Fußzeilen A/B/C, Einordnung Bewertungsbitte (BGH-Linie DE), „ähnliche Produkte“ bei Firmengeschenken/Event, FL-Recht, Preisangaben beim Atelierverkauf, Verschiebungsregel Bewertung bei Reklamation.
3. **ECG-Liste:** Abgleichsprozess vor jedem Versand nach § 174 Abs. 4 festlegen.
4. **Fakten vom Team:** Öffnungszeiten (Samstagstest ab KW 46?), Parken/Anreise, Telefon/E-Mail-Absender, Adventsabend-Uhrzeit, Programm, Kapazität, Gutscheinbedingungen, Geschenksortiment und Preise, Bestellschluss, Liefergebiet; Outdoor-Frühbucher-Vorteil; Wintereinlagerung ja/nein; Musterversand; Montage eigenes Team oder Partner.
5. **Schreibweise Inhaberin** (Meßmer/Messmer) und Rechtsträger im Impressum (Bestands- vs. Handels-GmbH).
6. **Bilder:** eigene Showroom-/Eventfotos; Herstellerbilder nur mit Freigabe; Gäste-Fotos nur mit Einwilligung.
7. **Binni-Linie:** Name, Markenprüfung, Starttermin, deutsche Pflegeanleitung.
8. **Abhängige Seiten:** Ratgeber-Hub, CH/FL-Seite, Gutschein-Shop, Atelier-Seite, RSVP-Seite, `/bewerten` – CTAs erst verlinken, wenn live.
9. **Weitere Sprachen:** EN-Fassung für Willkommen und Newsletter (digital/12 C8) noch offen; Schweizer Varianten ohne „ß“.
