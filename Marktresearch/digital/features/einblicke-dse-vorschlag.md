# Vorschlag: Ergänzung der Datenschutzerklärung „Besucher-Einblicke (eigene Heatmap)“

Stand 29.10.2026 (nach QA Recht P1-2). **Dies ist ein Entwurf zur Prüfung und Freigabe durch die Kanzlei.** Die freigegebene Datenschutzerklärung ändern wir erst nach der Freigabe. Grundlage sind das Konzept `besucher-einblicke.md`, der Register-Eintrag `einblicke` in `src/lib/legal/services.js` und der Code unter `src/lib/einblicke/`. Dieser Entwurf ist keine Rechtsberatung.

Platzhalter in [eckigen Klammern] füllt der Inhaber aus. Bis zur Freigabe bleibt die Funktion in Produktion aus (`NEXT_PUBLIC_EINBLICKE` nicht gesetzt). Ohne den Schalter erscheinen Schalter und Texte im Cookie-Banner nicht.

Vorgesehener Ort: ein neuer Abschnitt `#besucher-einblicke` hinter „Google Analytics 4 (Statistik)“. Er wird über `consentPolicySections()` nur angezeigt, solange der Schalter im Banner sichtbar ist (gleiche Regel wie bei Google Ads).

---

## Abschnitt (Vorschlag) – Besucher-Einblicke (eigene Heatmap, kein Drittanbieter)

**Verantwortlicher:** MW Immobilienverwaltungs GmbH (Platzhirsch Home Living), Landstraße 11, 6911 Lochau, Österreich, info@platzhirsch.studio, +43 5574 46255. [Gleicher Block wie unter „Verantwortlich“; nach Eintragung der Handels-GmbH anpassen.]

**Zweck:** Wenn Sie zustimmen, messen wir mit einem eigenen kleinen Programm, wie unsere Seiten genutzt werden. Wir sehen etwa, wo geklickt und gescrollt wird, welche Abschnitte gelesen werden, wo ein Formular abgebrochen wird und wo etwas nicht funktioniert. Damit verbessern wir Aufbau und Bedienung der Website. Wir erstellen keine Profile einzelner Personen und treffen keine Entscheidungen über Sie.

**Rechtsgrundlage:** Ihre Einwilligung (Art. 6 Abs. 1 lit. a DSGVO). Für den Zugriff auf Ihr Endgerät, also das Speichern der Sitzungskennung im Browser, gilt § 165 Abs. 3 TKG 2021. Für Besucher aus Deutschland gilt § 25 Abs. 1 TDDDG. Die Einwilligung ist freiwillig. Die Website funktioniert ohne sie vollständig. Sie geben sie im Cookie-Banner unter „Statistik“ → „Besucher-Einblicke (eigene Heatmap)“ ab, getrennt von Google Analytics.

**Welche Daten:** Erfasst wird nur, was für die Auswertung nötig ist:

- Klickposition auf der Seite (grobes Raster) und das angeklickte Element (technische Bezeichnung, zum Beispiel „Hauptmenü › Link 3“), nicht dessen Text
- Mausbewegung in einem groben Raster von 40 × 40 Pixeln, alle 250 Millisekunden, nur an Geräten mit Maus (Desktop)
- wie weit gescrollt wurde und wie lange ein Seitenabschnitt sichtbar war
- bei Formularen nur die **Namen** der berührten Felder (zum Beispiel „E-Mail“), **nie deren Inhalt**, keine Tastatureingaben; Passwort- und versteckte Felder gar nicht
- welche Felder als ungültig gemeldet wurden (nur der Feldname)
- Programmfehler auf der Seite (nur Fehlertyp, Datei und Zeile, nie die Fehlermeldung)
- erreichte Ziele (zum Beispiel Termin gebucht, Anfrage gesendet, Merkliste) und die Schritte in unseren Planern (Küchenplaner, Sofaplaner, Stil-Finder)
- der Herkunftskanal des Besuchs als Kategorie (zum Beispiel „Organisch“, „Newsletter“, „Direkt“), keine Klick-IDs und keine verweisende Adresse
- Gerätegruppe (Handy, Tablet, Desktop), abgeleitet aus der Fensterbreite, sowie Fensterbreite und -höhe
- die aufgerufene Seite ohne Parameter. Seiten mit einem Zugangsschlüssel in der Adresse (geteiltes Ideenboard, geteilte Wunschliste), das Kundenportal, Upload, Zahlung und Vorschauseiten erfassen wir gar nicht.

**Was wir nicht erfassen:** keine Sitzungsaufzeichnung und keine Videos, keine Eingaben, keine IP-Adresse in den Messdaten, keinen Browser-Fingerabdruck, keinen User-Agent, keine Verknüpfung mit einer Anfrage, einem Kundenkonto oder Google-Diensten. Es sind keine Drittanbieter beteiligt.

**Speicherung im Browser:** Eine zufällige Sitzungskennung („ph_eb“) liegt im sessionStorage Ihres Browsers. Sie wird nach 30 Minuten ohne Aktivität neu erzeugt, beim Schließen des Tabs gelöscht und beim Widerruf sofort entfernt. Cookies setzt die Funktion keine. Ihre Auswahl selbst steht im Cookie „cookieConsent“ (siehe dort).

**Verarbeitung und Speicherdauer:**

1. **Rohdaten (pseudonym):** Die Ereignisse gehen gebündelt an unseren eigenen Server und werden dort mit der Sitzungskennung und einem auf die Minute gerundeten Zeitpunkt gespeichert. IP-Adresse, Browserkennung und verweisende Adresse speichern wir dabei nicht. Rohdaten löschen wir automatisch nach **höchstens 14 Tagen**. Diese Grenze ist im Programm festgelegt.
2. **Tageswerte (anonym):** Einmal am Tag fassen wir die Rohdaten zu Tageswerten zusammen: Klick- und Scrollverteilungen je Seite und Gerätegruppe, häufige Wege, Abbrüche und Fehler. Sie enthalten keine Sitzungskennung und keine Uhrzeit. Werte, die auf weniger als 5 Besuchen beruhen, führen wir nicht einzeln. Sie werden unter „selten“ zusammengefasst. Heatmaps mit weniger als 5 Besuchen halten wir höchstens 14 Tage zurück und übertragen sie erst zusammengefasst. Unbekannte Adressen erscheinen nur als „404“, selten besuchte Einzelseiten nur als Seitentyp.
3. **Backoffice:** Die Tageswerte übertragen wir verschlüsselt in unser eigenes Backoffice (Frappe auf backoffice.platzhirsch.studio). Dort sehen sie nur Mitarbeitende mit der Rolle „Einblicke Leser“. Wir löschen sie nach **[395 Tagen (13 Monaten)]** automatisch.

**Empfänger:** keine Dritten. Technisch beteiligt sind nur die Betreiber unserer Server als Auftragsverarbeiter (Art. 28 DSGVO):

- Website: [Hoster und Serverstandort, AV-Vertrag]
- Backoffice (Frappe): [Betreiber/Hoster und Serverstandort, AV-Vertrag; Fernzugriff des Entwicklungsdienstleisters, siehe Abschnitt Backoffice]

[Drittlandbezug nur ergänzen, wenn ein Server oder Fernzugriff außerhalb von EU/EWR/Schweiz liegt.]

**Server-Protokolle:** Beim Senden der Messdaten verarbeitet unser Webserver wie bei jedem Seitenaufruf technisch die IP-Adresse. Sie steht in den Zugriffsprotokollen des Hosters (siehe „Hosting“, [Speicherdauer der Protokolle, z. B. 14 Tage]) und wird nicht mit den Messdaten zusammengeführt. Die Mengenbegrenzung gegen Missbrauch arbeitet ohne IP-Adresse.

**Widerruf:** Sie können die Einwilligung jederzeit mit Wirkung für die Zukunft widerrufen, über „Privatsphäre-Einstellungen“ im Fuß jeder Seite. Ab dem Widerruf wird nichts mehr gesendet, die Sitzungskennung wird gelöscht, und unser Server verwirft Daten ohne gültige Einwilligung. Wenn Ihr Browser **„Do Not Track“** oder **„Global Privacy Control“** sendet, messen wir auch mit Einwilligung nicht.

**Keine Identifizierung (Art. 11 DSGVO):** Die Rohdaten sind pseudonym, die Tageswerte anonym. Wir können sie keiner Person zuordnen und bewahren keine Zusatzinformationen auf, die das ermöglichen würden. Anfragen nach Auskunft, Berichtigung oder Löschung können wir deshalb für diese Daten nur erfüllen, wenn Sie uns Angaben geben, die eine Zuordnung erlauben (Art. 11 Abs. 2 DSGVO), zum Beispiel die Sitzungskennung aus Ihrem Browser vor deren Ablauf. Ihre übrigen Rechte bleiben unberührt (siehe „Ihre Rechte“).

## Abschnitt (Vorschlag) – Hinweis für Besucher aus der Schweiz (revDSG)

Für Besucher aus der Schweiz gilt zusätzlich das Datenschutzgesetz (revDSG). Wir informieren Sie mit diesem Abschnitt nach Art. 19 revDSG über Verantwortlichen, Zweck, Empfänger und Speicherdauer. Die Messung erfolgt nur mit Ihrer Einwilligung. Die Daten werden [in Österreich/der EU] verarbeitet. Die Schweiz anerkennt für die EU ein angemessenes Datenschutzniveau (Anhang 1 DSV). Eine Bekanntgabe in weitere Staaten findet nicht statt. Ihre Rechte nach Art. 25 ff. revDSG können Sie über die oben genannten Kontaktdaten ausüben.

---

## Kurztexte im Cookie-Banner (umgesetzt, nur sichtbar bei eingeschaltetem Schalter)

Quelle: `src/messages/*.json` → `Cookies.einblicke`, gleiche Texte in `src/lib/einblicke/consentCopy.js`. Deutsch:

- **Leiste (Desktop), zusätzlicher Satz:** „Mit Ihrer Einwilligung messen wir außerdem mit einer eigenen Heatmap, wo auf unseren Seiten geklickt und gescrollt wird – ohne Drittanbieter, ohne Aufzeichnung.“
- **Leiste (Handy):** „Karte (Google Maps), Statistik (Google Analytics) und eigene Heatmap nur mit Ihrer Einwilligung; Google-Daten teils in die USA.“
- **Kategorie „Statistik“:** nennt beide Dienste und den Hinweis, dass beide einzeln wählbar sind.
- **Dienst „Besucher-Einblicke (eigene Heatmap)“:** eigener Schalter, Zweck wie oben in Kurzform, Speicher „ph_eb“ (Session Storage, 30 Minuten), Drittländer: keine.

EN, FR und IT liegen im selben Schlüssel vor und sind sinngleich übersetzt.

## Offene Punkte für die Kanzlei und den Inhaber

1. Wortlaut freigeben (Abschnitt, Banner-Kurztexte in vier Sprachen).
2. Ist die gemeinsame Kategorie „Statistik“ mit zwei getrennt wählbaren Diensten ausreichend bestimmt, oder soll die Heatmap eine eigene Kategorie bekommen? Technisch ist beides möglich, der Schlüssel `einblicke` bleibt gleich.
3. Hoster, Serverstandort und AV-Verträge für Website und Backoffice eintragen. Speicherdauer der Server-Protokolle festlegen.
4. Aufbewahrung der Tageswerte bestätigen (Voreinstellung 395 Tage, Einstellung „Einblicke Einstellungen → Aufbewahrung“ in Frappe).
5. Eintrag im Verzeichnis von Verarbeitungstätigkeiten (Art. 30 DSGVO) „Besucher-Einblicke“ anlegen.
6. Bestehende Einwilligungen: Besucher, die vor der Einführung zugestimmt haben, haben den Schlüssel `einblicke` nicht und werden **nicht** gemessen. Sie werden auch nicht neu gefragt, solange ihr Cookie gilt (12 Monate). Soll das Banner einmalig neu fragen (Consent-Version)? Das ist eine Entscheidung der Kanzlei bzw. des Inhabers.
7. Nach Freigabe: Abschnitt `#besucher-einblicke` in `src/components/Datenschutz/datenschutz.js` hinter `consentSections.has("besucher-einblicke")` einbauen, dann `NEXT_PUBLIC_EINBLICKE=1` und `EINBLICKE_CRON_SECRET` in `.env.production` setzen.
