# Vorschlag an Recht: „Ihr Raum als Zwilling“ (Raumvideo im Kundenportal)

**Stand:** 28.10.2026 · **Von:** Neuland-Team N2 · **Status:** VORSCHLAG, nicht live. Erst nach anwaltlicher Freigabe in `/de/datenschutz` und `/de/portal/datenschutz` übernehmen.
**Bezug:** `02-datenschutzerklaerung-entwurf.md`, `Marktresearch/digital/features/neuland.md` §3, Code `src/lib/raumzwilling/einwilligung.js`.

## 1. Was verarbeitet wird

| Daten | Zweck | Ort | Frist (Vorschlag) |
|---|---|---|---|
| Raumvideo (Handy, ≤ 300 MB, ≤ 120 s) | 3D-Raum für die Einrichtungsplanung | Studio-Rechner Lochau, Ordner außerhalb des Webroots | gelöscht direkt nach der Verarbeitung (Job-Runner) |
| 3D-Raum (Gaussian Splat), 3 Standbilder, Grundriss | Planung, Kommentare, Vorbereitung des Termins vor Ort | Server der Website (Portal), nur mit Anmeldung | 180 Tage nach dem letzten Upload **[Frist vom Inhaber festzulegen]**, außer für einen Auftrag nötig |
| Kommentare und Sprachnachrichten an Raumpunkten | Abstimmung mit dem Beratungsteam | wie oben | wie Sprachnachrichten im Portal: nach Projektabschluss, spätestens 12 Monate nach Übergabe |
| Handskizzen von Harald Menghin (Scan) | Darstellung des Konzepts für den Kunden | wie oben | wie 3D-Raum |

Ortsangaben (GPS) im Video werden beim Empfang überschrieben; die Einzelbilder entstehen ohne Metadaten. Keine KI-Bilderzeugung, keine Weitergabe an Dritte, keine fremde Cloud, keine Nutzung als Referenz ohne neue Einwilligung.

## 2. Rechtsgrundlage (Vorschlag, bitte prüfen)

- Art. 6 Abs. 1 lit. a DSGVO (Einwilligung beim Upload, eigener Haken, Text versioniert `2026-10-raum-v1`), daneben lit. b (vorvertragliche Maßnahmen: Planung auf Anfrage des Kunden).
- Wohnraumbilder sind keine besonderen Kategorien nach Art. 9, können aber Rückschlüsse darauf zulassen (z. B. Hilfsmittel, religiöse Gegenstände). Deshalb: Aufnahmehilfe bittet, keine Personen, Ausweise, Dokumente oder Bildschirme zu filmen; Einwilligung ausdrücklich. **[prüfen]**, ob eine Datenschutz-Folgenabschätzung nötig ist (aus unserer Sicht nein: kleine Zahl, keine Profilbildung, keine automatisierte Entscheidung).
- Widerruf: Knopf „Raum löschen“ im Portal (löscht sofort) oder E-Mail.

## 3. Textvorschlag für die Datenschutzerklärung (Abschnitt „Raumvideo und 3D-Raum im Kundenportal“)

> Wenn Sie im Kundenportal ein Raumvideo senden, erstellen wir daraus einen dreidimensionalen Raum für die Planung Ihres Projekts. Rechtsgrundlage ist Ihre Einwilligung (Art. 6 Abs. 1 lit. a DSGVO) und die Durchführung vorvertraglicher Maßnahmen auf Ihre Anfrage (Art. 6 Abs. 1 lit. b DSGVO). Die Verarbeitung erfolgt auf einem Rechner in unserem Studio in Lochau, nicht bei einem Cloud-Anbieter. Ortsangaben im Video entfernen wir beim Empfang; das Originalvideo löschen wir nach der Verarbeitung. Den 3D-Raum, drei Standbilder, den Grundriss sowie Ihre Kommentare und Sprachnachrichten sehen nur Sie und Ihr Beratungsteam nach Anmeldung im Portal. Wir löschen diese Daten [180 Tage] nach dem letzten Upload, außer sie werden für Ihren Auftrag benötigt; Sprachnachrichten wie im Abschnitt Kundenportal beschrieben. Sie können Ihre Einwilligung jederzeit widerrufen, am einfachsten mit „Raum löschen“ im Portal oder per E-Mail an info@platzhirsch.studio. Die Rechtmäßigkeit der bis zum Widerruf erfolgten Verarbeitung bleibt unberührt. Wir verwenden Ihren Raum nicht als Referenz und geben ihn nicht weiter. Maße aus dem Video sind eine Planungshilfe; vor jeder Bestellung messen wir vor Ort nach.

## 4. Raum-Link ohne Portal-Konto (Fallback)

Ein vom Team erzeugter Link gilt nur für einen Raum, ist **einmal** einlösbar (danach 14 Tage Cookie auf diesem Gerät) und wird nicht automatisch versendet. Gespeichert wird nur ein Hash des Links. **[prüfen]**: ob der Satz „Wer den Link öffnet, sieht Ihren Raum. Bitte nicht weiterleiten.“ in die E-Mail des Teams muss.

## 5. Offene Punkte für Inhaber/Recht

1. Löschfrist bestätigen (Code: `RAUM_CONFIG.retentionDays`, `retentionConfirmed`).
2. Text oben freigeben, dann in `02-datenschutzerklaerung-entwurf.md` übernehmen.
3. Klären, ob Partnerbetriebe (Tischler etc.) den Raum sehen dürfen – derzeit **nein**.
