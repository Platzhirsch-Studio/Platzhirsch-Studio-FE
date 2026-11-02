# Vorschlag: Ergänzung der Datenschutzerklärung „Online-Termin und Videoberatung“

Stand 29.10.2026 (überarbeitet nach QA Recht/Sicherheit). **Dies ist ein Entwurf zur Prüfung und Freigabe durch die Kanzlei.** Die freigegebene Datenschutzerklärung wird erst nach der Freigabe geändert. Grundlage sind die Recherche `online-termin-video.md` (Teil A3) und die Umsetzung unter `/[locale]/termin`. Dieser Entwurf ist keine Rechtsberatung.

Platzhalter in [eckigen Klammern] klärt der Inhaber. **[Nach Einrichtung prüfen]** steht bei allem, was vom tatsächlich eingesetzten Videodienst abhängt. Der Videoserver ist noch nicht eingerichtet. Der Inhaber möchte das neue Frappe-Webkonferenz-Produkt einsetzen. Frappe Meet ist als eigenes Projekt archiviert und gehört jetzt zu Frappe Suite, das sich noch in Arbeit befindet. Produktname, Server und Einstellungen trägt erst ein, wer sie geprüft hat.

---

## Abschnitt (Vorschlag) – Online-Terminbuchung

Auf unserer Website können Sie einen Beratungstermin buchen. Zur Wahl stehen ein Termin im Studio in Lochau, eine Beratung per Video, ein Besuch bei Ihnen vor Ort und ein Planungstermin zu einem Thema.

**Welche Daten:**

- Terminart und gewählter Zeitpunkt
- Vorname, Nachname und E-Mail-Adresse
- optional Telefonnummer und Ihr Anliegen
- bei einem Termin vor Ort zusätzlich Telefonnummer, Postleitzahl und Ort
- bei der Videoberatung Ihre Einwilligung mit Zeitpunkt und Textversion

**Bestätigung Ihrer E-Mail-Adresse:** Nach dem Absenden schicken wir einen Bestätigungslink an die angegebene Adresse. Erst mit dem Klick auf diesen Link wird der Termin verbindlich. Bis dahin halten wir die Uhrzeit 30 Minuten für Sie frei. Ohne Bestätigung verfällt die Vormerkung, und die Angaben löschen wir spätestens einen Tag danach. Gespeichert wird nur ein Prüfwert (Hash) des Links, nicht der Link selbst. So stellen wir sicher, dass Bestätigungen nur an die Person gehen, die den Termin gebucht hat.

**Zweck und Rechtsgrundlage:** Wir vereinbaren und führen den Termin auf Ihre Anfrage durch (Art. 6 Abs. 1 lit. b DSGVO). Die E-Mails zu Bestätigung, Änderung und Absage gehören zur Terminabwicklung und sind keine Werbung.

**Links zum Ändern oder Absagen:** Nach der Bestätigung erhalten Sie per E-Mail einen persönlichen Link. Er ist signiert, gilt bis zum Ende des Termins und wird bei einer Umbuchung ersetzt. Der Schlüssel steht im Teil der Adresse nach dem „#“. Diesen Teil sendet der Browser beim Aufruf der Seite nicht mit, deshalb erscheint er nicht in den Adress-Protokollen unseres Servers. Zur Prüfung übermittelt die Seite den Schlüssel verschlüsselt (HTTPS) an unseren Server. Der Link steht außerdem in Ihrer E-Mail.

**Schutz vor Missbrauch:** Wir begrenzen kurzfristig die Zahl der Anfragen je IP-Adresse und je E-Mail-Adresse. Dafür wird ein Prüfwert nur im Arbeitsspeicher des Servers gehalten (berechtigtes Interesse, Art. 6 Abs. 1 lit. f DSGVO). Die IP-Adresse wird dabei nicht dauerhaft gespeichert.

**Empfänger:**

- Unser Backoffice (Frappe, betrieben auf [Server/Hoster, EU-Standort]) speichert Ihre Angaben. [Hoster] ist unser Auftragsverarbeiter (Art. 28 DSGVO).
- Die E-Mails zum Termin verschickt [Mail-Dienstleister, z. B. Resend; Sitz, Serverstandort und AVV prüfen] in unserem Auftrag.
- Einen externen Kalenderdienst binden wir auf der Website nicht ein.

[Drittlandbezug je nach Mail-Dienstleister ergänzen oder streichen.]

**Speicherdauer:** Termindaten löschen wir [6 Monate] nach dem Termin, sofern daraus kein Auftrag entsteht. Bei einem Auftrag gelten die gesetzlichen Aufbewahrungsfristen.

**Kalenderabgleich (falls aktiviert):** Unsere Berater können ihren Kalender mit Google Calendar abgleichen. Dabei werden Zeitpunkt, Terminart und Referenz übertragen, [keine / folgende] Kontaktdaten. [Diesen Absatz nur aufnehmen, wenn der Google-Abgleich eingeschaltet wird. Dann Google als Empfänger mit Drittlandbezug ergänzen.]

**Assistenten (MCP):** KI-Assistenten können über unsere Schnittstelle freie Uhrzeiten abfragen. Dabei werden keine Personendaten übermittelt, und es wird nichts gebucht. [Nur aufnehmen, wenn die Kanzlei einen Hinweis für nötig hält.]

## Abschnitt (Vorschlag) – Videoberatung

Für die Videoberatung nutzen wir **[Name des eingesetzten Videodienstes – nach Einrichtung prüfen]**. Es ist eine Open-Source-Software, die wir auf einem eigenen Server betreiben ([Adresse des Videoservers], [Hoster, EU-Standort] – nach Einrichtung prüfen). Sie brauchen keine App und kein Konto.

**Ablauf:** Den Link zum Videoraum finden Sie ab 15 Minuten vor Beginn auf Ihrer Terminseite (über den Link „Termin ändern oder absagen“ aus der Bestätigungsmail). Im Kalendereintrag (.ics) steht der Link nicht. Sie geben einen Namen ein, der Vorname genügt, und warten im Warteraum, bis wir Sie hereinholen. [Warteraum nach Einrichtung prüfen]

**Welche Daten:** Bild und Ton werden während des Gesprächs live übertragen. Technisch verarbeitet werden dabei Ihre IP-Adresse, Angaben zu Browser und Gerät sowie der eingegebene Name. Kamera und Mikrofon schalten Sie selbst ein oder aus. Ein Gespräch nur mit Ton oder am Telefon ist jederzeit möglich.

**Keine Aufzeichnung:** Wir zeichnen weder Bild noch Ton auf. [Nach Einrichtung prüfen: Aufzeichnung in den Einstellungen des Videodienstes abgeschaltet; keine automatische Mitschrift und keine Untertitel aktiv.] Den Bildschirm teilt nur unser Team, zum Beispiel für Pläne oder Renderings.

**Rechtsgrundlage:** Wir führen die von Ihnen gebuchte Beratung durch (Art. 6 Abs. 1 lit. b DSGVO). Zusätzlich bitten wir vor der Buchung um Ihre ausdrückliche Einwilligung zur Live-Übertragung von Bild und Ton (Art. 6 Abs. 1 lit. a DSGVO). Die Einwilligung ist freiwillig. Ohne sie bieten wir den Termin im Studio oder am Telefon an. Sie können die Einwilligung jederzeit für die Zukunft widerrufen. Dafür genügt eine E-Mail an info@platzhirsch.studio, eine Absage des Termins oder der Wechsel zu einem Termin im Studio oder am Telefon. Auf diesen Widerruf weist schon der Einwilligungstext hin (Art. 7 Abs. 3 DSGVO).

**Speicherdauer:** [Nach Einrichtung prüfen und ergänzen: wann der Videoraum gelöscht wird, wie lange eine Gastberechtigung gilt, nach wie vielen Tagen Server-Protokolle des Videodienstes gelöscht werden (Vorschlag [7] Tage).]

**Empfänger:** [Hoster] ist unser Auftragsverarbeiter. [Nach Einrichtung prüfen: ob STUN- oder TURN-Server Dritter eingebunden sind. Falls ein eigener TURN-Server läuft, hier ergänzen.]

**Schweiz:** Für Personen in der Schweiz gelten diese Angaben zugleich als Information nach Art. 19 revDSG. Die Daten werden in der EU verarbeitet. Für die EU hat der Bundesrat ein angemessenes Datenschutzniveau festgestellt.

---

## Einwilligungstext auf der Buchungsseite (Version `video-v2-2026-10-29`)

> Ich bin einverstanden, dass Bild und Ton während des Gesprächs live übertragen werden. Es wird nichts aufgezeichnet. Die Kamera kann ich jederzeit ausschalten. Die Einwilligung kann ich jederzeit widerrufen, etwa indem ich den Termin absage oder ins Studio wechsle.

Darunter steht der Hinweis: „Lieber ohne Video? Dann wählen Sie einen Termin im Studio oder rufen uns an.“ Die Checkbox ist nicht vorangekreuzt. Gespeichert werden Zeitpunkt und Textversion. Ändert sich der Text, erhöht sich die Version (`CONSENT_VERSION` in `src/lib/booking/constants.js`).

Gegenüber Version v1 ist der Widerrufshinweis neu (QA Recht P2-1).

## Offene Fragen an die Kanzlei

1. Reicht lit. b allein? Oder bleibt die Einwilligung, wie vom Inhaber vorgegeben, als zusätzliche Grundlage formuliert wie oben? Bei einem Widerruf stellen wir auf einen Termin im Studio oder am Telefon um.
2. Wie lange speichern wir die Termindaten ohne Auftrag (Vorschlag 6 Monate)? Wie lange die Protokolle des Videoservers (Vorschlag 7 Tage)? Das Backoffice muss die Frist umsetzen, ein Lösch-Job ist noch offen.
3. Wie formulieren wir den Google-Calendar-Abgleich, falls die Berater ihn nutzen?
4. Braucht die kurzfristige Begrenzung je IP- und E-Mail-Adresse (nur im Arbeitsspeicher) einen eigenen Satz? Oder fällt sie unter den bestehenden Abschnitt „Server-Protokolle/Sicherheit“?
5. Welcher Mail-Dienstleister wird eingesetzt? Davon hängen der AVV und ein möglicher Drittlandbezug ab.
