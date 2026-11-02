# Teilnahmebedingungen Empfehlungsprogramm „Unter Freunden“ – VORSCHLAG für die Kanzlei

**Stand:** 29.10.2026 · **Status: Entwurf, nicht freigegeben, nicht veröffentlicht.**
Grundlage: Inhaber 29.10.2026 („Wer einen Kunden empfiehlt, bekommt einen Gutschein. Die Gutscheine sind schon gebaut.“),
`wachstumsrat/crm-wiederkauf.md` Abschn. 2.3 und 3.4, bestehende Gutscheinbedingungen (`src/lib/commerce/voucherTerms.js`).
Technik: Website `/[locale]/empfehlen` (`src/lib/kundenbetreuung/empfehlung.js`), Frappe-App `platzhirsch_kundenbetreuung` (`PH Empfehlung`).
Die Seite ist in Produktion erst sichtbar, wenn hier freigegeben ist (`REFERRAL.termsStatus = "freigegeben"`) oder der Inhaber
`EMPFEHLUNG_PUBLIC=1` setzt.

Eckige Klammern = vom Inhaber bzw. der Kanzlei zu füllen. Nichts davon ist geschätzt.

---

## 1. Veranstalter
[Firmenwortlaut der ausgebenden Gesellschaft, FN, Firmenbuchgericht, UID – wie in den Gutscheinbedingungen], Landstraße 11,
6911 Lochau, Österreich („Platzhirsch“).

## 2. Wer teilnehmen kann
2.1 Empfehlen können volljährige Kundinnen und Kunden, die bei Platzhirsch mindestens einen Auftrag erteilt haben
(„Empfehlende“). Mitarbeitende von Platzhirsch und deren Haushaltsangehörige sind ausgenommen. [Kanzlei: Architekten/Planer
ausschließen? Vorschlag: ja, für sie gilt ein eigenes Programm mit Offenlegung gegenüber Bauherren.]
2.2 Empfohlen werden können Privatpersonen und Unternehmen, die bei Platzhirsch noch keinen Auftrag erteilt und in den letzten
[12] Monaten keine Anfrage gestellt haben („Neukunden“).

## 3. So funktioniert es
3.1 Empfehlende erhalten auf Anfrage einen persönlichen Code (Form „EMP-“ und sechs Zeichen) und einen Link.
3.2 **Empfehlende geben Code oder Link selbst weiter.** Platzhirsch nimmt keine Kontaktdaten Dritter entgegen und schreibt
niemanden an, den Empfehlende nennen. Empfehlende geben den Code nur an Personen weiter, bei denen sie annehmen dürfen, dass diese
damit einverstanden sind. [Kanzlei: BGH I ZR 208/12 „Empfehlungs-E-Mail“, Übertragbarkeit AT/CH]
3.3 Neukunden nennen den Code bei ihrer ersten Anfrage (Formular, Mail, Telefon, Showroom) und willigen ein, dass Platzhirsch
die Anfrage dem Code zuordnet und die empfehlende Person nach dem ersten Auftrag darüber informiert, dass ein Gutschein fällig
ist. Details zum Auftrag (Inhalt, Wert, Termine) werden nicht weitergegeben. Ohne diese Einwilligung erfolgt keine Zuordnung.
3.4 Pro Neukunde zählt nur ein Code, und zwar der zuerst genannte.

## 4. Dankeschön
4.1 Für jeden Neukunden, der aufgrund der Empfehlung einen ersten Auftrag erteilt, erhält die empfehlende Person einen
Gutschein [über EUR … / nach Auftragswert gestaffelt: …].
4.2 Voraussetzung: Der Auftrag ist erteilt, [die vereinbarte Anzahlung ist eingegangen] und eine allfällige Rücktritts- oder
Widerrufsfrist ist abgelaufen, ohne dass der Auftrag storniert wurde. [Vorschlag: 14 Tage nach Auftragsdatum; bei
Maßanfertigung nach Kanzlei]
4.3 Für den Gutschein gelten die Gutscheinbedingungen von Platzhirsch in der jeweils gültigen Fassung. Eine Barablöse ist
ausgeschlossen. [Kanzlei/Steuerberater: Einzweck- oder Mehrzweckgutschein, steuerliche Behandlung als Sachzuwendung]
4.4 Höchstens [5] Gutscheine je empfehlende Person und Kalenderjahr. [Inhaber]
4.5 Es gibt kein Dankeschön für bloße Kontakte, Anfragen oder Termine ohne Auftrag und keines für Selbstempfehlungen.

## 5. Keine Kopplung an Bewertungen
Das Dankeschön hängt nicht davon ab, ob oder wie Empfehlende oder Neukunden Platzhirsch bewerten. Platzhirsch bittet im
Rahmen dieses Programms nicht um Bewertungen. (Google-Richtlinie zu Anreizen; UWG Anhang Nr. 23b/c)

## 6. Kennzeichnung von Empfehlungen
Wer Platzhirsch öffentlich empfiehlt (z. B. in sozialen Netzwerken), weist darauf hin, dass er für eine erfolgreiche
Empfehlung einen Gutschein erhalten kann. [Kanzlei: § 6 ECG / § 2 UWG, Schleichwerbung]

Das gilt auch für persönliche Nachrichten. Platzhirsch gibt keinen Empfehlungstext vor, der eine Bewertung
enthält. Der Text, den die Seite zum Teilen vorschlägt, enthält nur den Link und den Pflichtzusatz:
„(Für eine erfolgreiche Empfehlung erhalte ich einen Gutschein.)“ Den Zusatz bitte nicht entfernen.
[Kanzlei: Wortlaut des Pflichtzusatzes in DE/EN/FR/IT bestätigen; QA Welle 2 P1-3]

## 7. Datenschutz
Platzhirsch verarbeitet: von Empfehlenden Name, E-Mail, Code, Nachweis des eigenen Auftrags; von Neukunden die Angaben der
Anfrage und die Einwilligung in die Zuordnung (Zeitpunkt). Rechtsgrundlagen: Vertrag über die Teilnahme (Art. 6 Abs. 1 lit. b
DSGVO) bzw. Einwilligung der Neukunden (lit. a), jederzeit widerrufbar mit Wirkung für die Zukunft. Speicherdauer: bis [3]
Jahre nach Ausgabe des Gutscheins bzw. nach Verfall des Codes. Details in der Datenschutzerklärung (Ergänzung unten).

## 8. Änderung und Ende
Platzhirsch kann das Programm mit Wirkung für die Zukunft ändern oder beenden. Bereits erfüllte Voraussetzungen (Auftrag vor
dem Ende) werden noch eingelöst. Codes verfallen [24] Monate nach Ausgabe, wenn kein Neukunde zugeordnet wurde.

## 9. Recht
Es gilt österreichisches Recht unter Ausschluss der Verweisungsnormen; zwingende Verbraucherschutzvorschriften des
Aufenthaltsstaats bleiben unberührt.

---

## Ergänzung Datenschutzerklärung (Vorschlag, eigener Abschnitt „Empfehlungsprogramm“)
> Wenn Sie an unserem Empfehlungsprogramm teilnehmen, verarbeiten wir Ihren Namen, Ihre E-Mail-Adresse, Ihren persönlichen
> Code und den Nachweis Ihres Auftrags, um Ihnen Code und Gutschein zu senden (Art. 6 Abs. 1 lit. b DSGVO). Wenn Sie uns auf
> Empfehlung kontaktieren und eingewilligt haben, ordnen wir Ihre Anfrage dem Code zu und teilen der empfehlenden Person nach
> Ihrem ersten Auftrag nur mit, dass ein Gutschein fällig ist (Art. 6 Abs. 1 lit. a DSGVO). Sie können die Einwilligung
> jederzeit widerrufen. Kontaktdaten Dritter nehmen wir nicht entgegen. Speicherdauer: [3] Jahre nach Ausgabe des Gutscheins.

## Fragen an die Kanzlei
1. Reicht die Einwilligung der Neukunden nach 3.3 (Häkchen, nicht vorangekreuzt, Text siehe Website `empfehlenContent.js` → `form.consent`)?
2. Muss die Teilnahme der Empfehlenden ausdrücklich angenommen werden (Klick „Bedingungen akzeptiert“), oder genügt der Versand der Bedingungen mit dem Code?
3. Einordnung des Gutscheins (Zugabe, Sachzuwendung, Einzweck/Mehrzweck).
4. Ausschluss von Architekten/Planern und Offenlegungspflicht gegenüber Bauherren.
5. Länder: gilt das Programm für CH/FL/DE-Kunden gleich?
