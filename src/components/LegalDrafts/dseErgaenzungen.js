import React from "react";
import { EMAIL, EMAIL_HREF, PHONE_DISPLAY, PHONE_HREF } from "@/lib/site";
import { DSE_SECTIONS, dseRenderMode } from "@/lib/legal/dseSections";

// Ergänzungen der Datenschutzerklärung für neue Funktionen (Rat 9,5, B4).
//
// Jeder Abschnitt ist einzeln abschaltbar: Er erscheint nur, wenn er im
// Register src/lib/legal/dseSections.js freigegeben ist ("live"). In der
// Entwicklung erscheinen die Entwürfe mit sichtbarem Vermerk, damit Anker,
// Links und Aufbau geprüft werden können; im Produktions-Build nie.
// Die zugehörige Funktion läuft in Produktion erst mit freigegebenem
// Abschnitt (dseGateOpen in booking/config, ideenboard/mode, einblicke/config,
// whatsapp/config; Release-Test tools/qa/prod-check.mjs Schritt „dse“).
//
// Wortlaut: aus den Vorschlägen der Feature-Teams (Pfad je Abschnitt im
// Register) und Marktresearch/recht/07-dse-ergaenzungen-rat95.md, ohne neue
// Tatsachen. [Eckige Klammern] = offen für Kanzlei/Inhaber. Vor dem Umstellen
// auf "freigegeben" müssen alle Klammern zwischen den Markierungen
// <dse:id> … </dse:id> durch den freigegebenen Wortlaut ersetzt sein
// (tests/unit/rat95-recht-dse.test.mjs).

const ul = "mt-3 list-disc space-y-2 pl-5 marker:text-text-soft";

/** Rahmen eines Abschnitts: H2 mit Anker, im Testbetrieb mit Entwurfsvermerk. */
export function Ergaenzung({ id, children, env = process.env }) {
  const mode = dseRenderMode(id, env);
  if (!mode) return null;
  const section = DSE_SECTIONS[id];
  return (
    <div data-dse-section={id} data-dse-status={mode === "live" ? "freigegeben" : "entwurf"}>
      <h2 id={section.anchor}>{section.title}</h2>
      {mode === "entwurf" && (
        <p className="border-l-2 border-line-strong pl-4 text-small text-text-soft" data-dse-draft="">
          Entwurf, nur im Testbetrieb sichtbar. Dieser Abschnitt wartet auf die Freigabe der Kanzlei und erscheint auf der
          veröffentlichten Website erst danach.
        </p>
      )}
      {children}
    </div>
  );
}

// <dse:termin>
export function TerminAbschnitt() {
  return (
    <Ergaenzung id="termin">
      <p>
        Auf unserer Website können Sie einen Beratungstermin buchen: im Studio in Lochau, per Video, bei Ihnen vor Ort oder als
        Planungstermin zu einem Thema. Einen externen Kalenderdienst binden wir dafür nicht ein.
      </p>
      <ul className={ul}>
        <li>
          <strong>Daten:</strong> Terminart und Zeitpunkt, Vorname, Nachname und E-Mail-Adresse, freiwillig Telefonnummer und Ihr
          Anliegen; bei einem Termin vor Ort zusätzlich Telefonnummer, Postleitzahl und Ort; bei der Videoberatung Ihre
          Einwilligung mit Zeitpunkt und Textversion.
        </li>
        <li>
          <strong>Bestätigung:</strong> Wir senden einen Bestätigungslink an Ihre E-Mail-Adresse. Erst mit dem Klick wird der Termin
          verbindlich; bis dahin halten wir die Uhrzeit 30 Minuten frei. Ohne Bestätigung verfällt die Vormerkung, die Angaben
          löschen wir spätestens einen Tag danach. Gespeichert wird nur ein Prüfwert des Links.
        </li>
        <li>
          <strong>Ändern oder absagen:</strong> Nach der Bestätigung erhalten Sie einen persönlichen, signierten Link. Er gilt bis
          zum Ende des Termins. Der Schlüssel steht im Teil der Adresse nach dem „#“ und erscheint deshalb nicht in den
          Adress-Protokollen unseres Servers.
        </li>
        <li>
          <strong>Zweck und Rechtsgrundlage:</strong> Vereinbarung und Durchführung des Termins (Art. 6 Abs. 1 lit. b DSGVO). Die
          E-Mails zu Bestätigung, Änderung und Absage gehören zur Terminabwicklung und sind keine Werbung. Zum Schutz vor
          Missbrauch begrenzen wir kurzfristig die Zahl der Anfragen je IP-Adresse und E-Mail-Adresse; der Prüfwert liegt nur im
          Arbeitsspeicher des Servers (Art. 6 Abs. 1 lit. f DSGVO).
        </li>
        <li>
          <strong>Empfänger:</strong> unser Backoffice (Frappe, [Server/Hoster, EU-Standort]) als Auftragsverarbeiter; die E-Mails
          zum Termin versenden wir über den Dienst aus dem Abschnitt „E-Mail-Versand“.
        </li>
        <li>
          <strong>Speicherdauer:</strong> Termindaten löschen wir [6 Monate] nach dem Termin, sofern daraus kein Auftrag entsteht.
          Bei einem Auftrag gelten die gesetzlichen Aufbewahrungsfristen.
        </li>
      </ul>
      <p>
        <strong>Videoberatung:</strong> Wir nutzen [Name des Videodienstes – nach Einrichtung prüfen] auf einem eigenen Server
        ([Adresse und Hoster, EU-Standort]). Sie brauchen keine App und kein Konto. Den Link zum Videoraum finden Sie ab 15 Minuten
        vor Beginn auf Ihrer Terminseite. Bild und Ton werden live übertragen; verarbeitet werden dabei IP-Adresse, Angaben zu
        Browser und Gerät und der Name, den Sie eingeben. Wir zeichnen weder Bild noch Ton auf. Rechtsgrundlage ist die gebuchte
        Beratung (Art. 6 Abs. 1 lit. b DSGVO) und Ihre ausdrückliche Einwilligung zur Live-Übertragung (Art. 6 Abs. 1 lit. a
        DSGVO). Sie ist freiwillig; ohne sie bieten wir den Termin im Studio oder am Telefon an. Widerrufen können Sie per E-Mail
        an <a href={EMAIL_HREF}>{EMAIL}</a>, mit der Absage des Termins oder mit dem Wechsel ins Studio. Speicherdauer der
        Protokolle des Videodienstes: [nach Einrichtung prüfen].
      </p>
    </Ergaenzung>
  );
}
// </dse:termin>

/** Satz im Abschnitt „E-Mail-Versand“, sobald der Abschnitt Termin erscheint. */
export function TerminMailsSatz({ env = process.env }) {
  const mode = dseRenderMode("termin", env);
  if (!mode) return null;
  return (
    <p data-dse-section="termin-mails" data-dse-status={mode === "live" ? "freigegeben" : "entwurf"}>
      Buchen Sie online einen Termin, senden wir außerdem die E-Mails zur Terminbuchung: Bestätigungslink, Buchungsbestätigung
      mit Link zum Ändern oder Absagen, Absage und Umbuchung (Abschnitt „Online-Terminbuchung und Videoberatung“).
    </p>
  );
}

// <dse:whatsapp>
export function WhatsappAbschnitt() {
  return (
    <Ergaenzung id="whatsapp">
      <p>
        Sie können uns über WhatsApp schreiben. Wir nutzen dafür die WhatsApp Business Platform („Cloud API“) und beantworten Ihre
        Nachrichten in unserem Backoffice, nicht über private Handys. Die Website lädt nichts von Meta, bevor Sie auf „Weiter zu
        WhatsApp“ klicken.
      </p>
      <ul className={ul}>
        <li>
          <strong>Anbieter und Rollen:</strong> WhatsApp Ireland Limited, Merrion Road, Dublin 4, D04 X2K5, Irland. Für die
          Übermittlung und Zustellung unserer Nachrichten handelt WhatsApp in unserem Auftrag (Art. 28 DSGVO). Für Ihr eigenes
          WhatsApp-Konto ist WhatsApp selbst verantwortlich.
        </li>
        <li>
          <strong>Daten:</strong> Telefonnummer, WhatsApp-Profilname, Ihre Nachrichten und Anhänge, Zeitpunkte und Zustellstatus.
          Der vorbereitete Text enthält nur Seite, Produkt oder einen Teilen-Link, den Sie selbst erzeugt haben; Sie können ihn vor
          dem Senden ändern oder löschen.
        </li>
        <li>
          <strong>Zweck und Rechtsgrundlage:</strong> Bearbeitung Ihrer Anfrage und Ablage in unserem Kundensystem (Art. 6 Abs. 1
          lit. b DSGVO). Termin-, Liefer- oder Servicenachrichten nur, wenn Sie WhatsApp dafür gewählt haben; Werbung nur mit Ihrer
          ausdrücklichen Einwilligung (Art. 6 Abs. 1 lit. a DSGVO, § 174 TKG 2021). Automatische Antworten sind feste Texte, ohne
          künstliche Intelligenz und ohne automatisierte Entscheidungen.
        </li>
        <li>
          <strong>Abmelden:</strong> Schreiben Sie „STOPP“, per E-Mail an <a href={EMAIL_HREF}>{EMAIL}</a> oder telefonisch.
        </li>
        <li>
          <strong>Drittländer:</strong> WhatsApp gibt Daten an die WhatsApp LLC und die Meta Platforms, Inc. in den USA weiter
          (EU-US Data Privacy Framework, Art. 45 DSGVO; ergänzend Standardvertragsklauseln).
        </li>
        <li>
          <strong>Speicherung:</strong> bei WhatsApp für die Zustellung höchstens 30 Tage; die Schlüssel auf Seiten der Business
          Platform verwaltet Meta, eine Ende-zu-Ende-Verschlüsselung bis in unser Backoffice besteht nicht. Bei uns: Gespräche ohne
          Auftrag [12 Monate] nach dem letzten Kontakt, mit Auftrag wie Geschäftsbriefe (§ 132 BAO, § 212 UGB), technische
          Protokolle 30 Tage, Nachweise Ihrer Kanalwahl [3 Jahre].
        </li>
        <li>
          <strong>Ohne WhatsApp:</strong> Telefon <a href={PHONE_HREF}>{PHONE_DISPLAY}</a>, E-Mail oder Kontaktformular.
        </li>
      </ul>
    </Ergaenzung>
  );
}
// </dse:whatsapp>

// <dse:serviceAnfragen>
export function ServiceAnfragenAbschnitt() {
  return (
    <Ergaenzung id="serviceAnfragen">
      <p>
        Für die Anfragen zu Hotel &amp; Objekt, für Architekten und Bauträger, zum Outdoor-Winterservice und zum Pflege-Service
        gilt der Abschnitt „Anfragen per Formular, E-Mail und Telefon“ mit diesen Ergänzungen:
      </p>
      <ul className={ul}>
        <li>
          <strong>Hotel &amp; Objekt, Architekten und Bauträger:</strong> Name des Hauses bzw. Büros, Ort, Ihr Name und Ihre
          Kontaktdaten sowie Ihre Angaben zum Vorhaben, etwa Zimmerzahl, Bereiche, Projektart oder Projektphase, um Ihre Anfrage zu
          beantworten und ein Angebot vorzubereiten (Art. 6 Abs. 1 lit. b DSGVO).
        </li>
        <li>
          <strong>Outdoor-Winterservice:</strong> Name, Kontaktdaten, Abholadresse und Zugangshinweise, die Möbelliste und
          freiwillig hochgeladene Fotos, um Abholung, Lagerung und Rückbringung anzubieten und durchzuführen (Art. 6 Abs. 1 lit. b
          DSGVO). Übernahmelisten und Fotos des Zustands bewahren wir bis [6] Monate nach der Rückbringung auf.
        </li>
        <li>
          <strong>Pflege-Service:</strong> Name, Kontaktdaten, Postleitzahl und Ort der Möbel, Angaben zu Möbeln und Material sowie
          freiwillig hochgeladene Fotos (Art. 6 Abs. 1 lit. b DSGVO). Erinnerungen an Pflegemittel senden wir nur mit Ihrer
          Einwilligung (Art. 6 Abs. 1 lit. a DSGVO, § 174 TKG 2021), die Sie jederzeit widerrufen können. Fotos ohne Auftrag löschen
          wir [6 Monate] nach dem Angebot.
        </li>
      </ul>
    </Ergaenzung>
  );
}
// </dse:serviceAnfragen>

// <dse:einblicke>
export function EinblickeAbschnitt() {
  return (
    <Ergaenzung id="einblicke">
      <p>
        Wenn Sie unter „Statistik“ den Dienst „Besucher-Einblicke (eigene Heatmap)“ wählen, messen wir mit einem eigenen kleinen
        Programm, wie unsere Seiten genutzt werden, ohne Drittanbieter. Rechtsgrundlage ist Ihre Einwilligung (Art. 6 Abs. 1 lit. a
        DSGVO, § 165 Abs. 3 TKG 2021, für Besucher aus Deutschland § 25 Abs. 1 TDDDG), getrennt von Google Analytics.
      </p>
      <ul className={ul}>
        <li>
          <strong>Daten:</strong> Klickposition im groben Raster und das angeklickte Element, Mausbewegung im 40-Pixel-Raster (nur
          Desktop), Scrolltiefe, Sichtzeit je Abschnitt, Namen berührter Formularfelder (nie Inhalte, keine Tastatureingaben),
          Fehlertypen, erreichte Ziele und Planer-Schritte, Herkunftskanal als Kategorie, Gerätegruppe und Fenstergröße.
        </li>
        <li>
          <strong>Nicht erfasst:</strong> keine Sitzungsaufzeichnung, keine IP-Adresse in den Messdaten, kein Fingerabdruck, keine
          Seiten mit Zugangsschlüssel, kein Kundenportal, Upload oder Zahlung. Bei „Do Not Track“ oder „Global Privacy Control“
          messen wir auch mit Einwilligung nicht.
        </li>
        <li>
          <strong>Im Browser:</strong> eine zufällige Sitzungskennung <code>ph_eb</code> im sessionStorage, 30 Minuten; Cookies
          setzt die Funktion keine.
        </li>
        <li>
          <strong>Speicherdauer:</strong> pseudonyme Rohdaten höchstens 14 Tage, danach nur anonyme Tageswerte (mindestens 5
          Besuche je Wert) in unserem Backoffice, gelöscht nach [395 Tagen].
        </li>
        <li>
          <strong>Widerruf:</strong> jederzeit über „Privatsphäre-Einstellungen“ im Fuß jeder Seite; danach wird nichts mehr
          gesendet und die Sitzungskennung gelöscht.
        </li>
      </ul>
    </Ergaenzung>
  );
}
// </dse:einblicke>

// <dse:ideenboard>
export function IdeenboardAbschnitt() {
  return (
    <Ergaenzung id="ideenboard">
      <p>
        Ihr Ideenboard liegt im Speicher Ihres Browsers, angelegt erst mit Ihrem Klick „Zum Ideenboard“. Auf unseren Server kommt
        es nur, wenn Sie „Teilen-Link erstellen“ wählen.
      </p>
      <ul className={ul}>
        <li>
          <strong>Daten:</strong> eine Kopie der Karten (Stücke, Bilder, Notizen) ohne Namen, E-Mail oder Telefon. Notizen sind
          Freitext; wir zeigen sie Ihnen vor dem Teilen. Bitte tragen Sie dort keine persönlichen Angaben ein.
        </li>
        <li>
          <strong>Zweck und Rechtsgrundlage:</strong> Bereitstellung der von Ihnen angeforderten Teilen-Funktion (Art. 6 Abs. 1
          lit. b DSGVO). Wer den Link kennt, kann das Board sehen; die Seite erscheint nicht in Suchmaschinen.
        </li>
        <li>
          <strong>Speicherdauer:</strong> Sie können den Link jederzeit widerrufen. Sonst löschen wir das geteilte Board
          [12 Monate] nach der letzten Änderung.
        </li>
      </ul>
    </Ergaenzung>
  );
}
// </dse:ideenboard>

// <dse:wunschliste>
export function WunschlisteAbschnitt() {
  return (
    <Ergaenzung id="wunschliste">
      <p>
        Sie können Ihre Merkliste als Wunschliste teilen, etwa zu Einzug oder Hochzeit. Dafür speichern wir Anlass, Titel, optional
        Datum und Nachricht sowie die ausgewählten Stücke (Art. 6 Abs. 1 lit. b DSGVO). Die Liste ist nur über einen zufälligen
        Link erreichbar, erscheint nicht in Suchmaschinen und lässt sich über Ihren Verwaltungslink jederzeit widerrufen oder
        löschen.
      </p>
      <ul className={ul}>
        <li>
          <strong>Reservierungen:</strong> Wer ein Stück reserviert, kann freiwillig Namen und eine Notiz angeben. Öffentlich
          erscheint nur „Reserviert“; Name und Notiz sieht die Person, die die Liste erstellt hat, gespeichert wird beides bei uns.
          Zum Aufheben der eigenen Reservierung speichert Ihr Browser einen Schlüssel (§ 165 Abs. 3 TKG 2021).
        </li>
        <li>
          <strong>Statistik:</strong> Für die Statistik ersetzen wir den Schlüssel im Link, Google Analytics erhält ihn nicht.
        </li>
        <li>
          <strong>Speicherdauer:</strong> [12] Monate nach dem Anlass bzw. nach dem Erstellen, auf Wunsch sofort.
        </li>
      </ul>
    </Ergaenzung>
  );
}
// </dse:wunschliste>

// <dse:ar>
export function ArAbschnitt() {
  return (
    <Ergaenzung id="ar">
      <p>
        Die 3D-Ansicht lädt erst auf Ihren Klick und läuft in Ihrem Browser. Wählen Sie „In Ihrem Raum ansehen“ (AR), übergibt die
        Seite das 3D-Modell an die AR-Funktion Ihres Geräts: auf Android an Google Scene Viewer (Google-App), auf iPhone und iPad an
        AR Quick Look von Apple. Dabei geht die Adresse des Modells an diese App; die Kamera nutzt Ihr Gerät, wir erhalten kein Bild
        Ihres Raums.
      </p>
      <ul className={ul}>
        <li>
          <strong>Empfänger:</strong> bei Android Google Ireland Limited nach den Bedingungen der Google-App [anwaltlich prüfen:
          Rolle und Drittlandbezug], bei Apple die Verarbeitung auf dem Gerät [anwaltlich prüfen].
        </li>
        <li>
          <strong>Rechtsgrundlage:</strong> die von Ihnen ausgelöste Funktion (Art. 6 Abs. 1 lit. b DSGVO). Ohne Ihren Klick geht
          nichts an diese Dienste.
        </li>
      </ul>
    </Ergaenzung>
  );
}
// </dse:ar>

// <dse:tagebuch>
export function TagebuchAbschnitt() {
  return (
    <Ergaenzung id="tagebuch">
      <p>
        Im Kundenportal können Sie und unser Team Fotos Ihres Projekts hochladen, etwa zu Lieferung und Montage. Wir speichern die
        Bilder, den Bildtitel, wer sie hochgeladen hat und wann. Beim Hochladen entfernen wir alle Metadaten, insbesondere
        Standortdaten; das Original speichern wir nicht. Die Fotos sehen nur Sie und unser Team (Art. 6 Abs. 1 lit. b DSGVO).
        Speicherdauer: [Kanzlei/Inhaber].
      </p>
      <p>
        <strong>Referenzprojekt:</strong> Nur mit Ihrer ausdrücklichen Einwilligung zeigen wir ausgewählte Fotos mit einer kurzen
        Beschreibung auf unserer Website, anonym oder mit Vorname und Gemeinde nach Ihrer Wahl, nie mit Adresse (Art. 6 Abs. 1
        lit. a DSGVO). Sie können die Einwilligung jederzeit im Portal oder per E-Mail widerrufen; dann entfernen wir die Seite.
      </p>
    </Ergaenzung>
  );
}
// </dse:tagebuch>

// <dse:empfehlung>
export function EmpfehlungAbschnitt() {
  return (
    <Ergaenzung id="empfehlung">
      <p>
        Wenn Sie an unserem Empfehlungsprogramm teilnehmen, verarbeiten wir Ihren Namen, Ihre E-Mail-Adresse, Ihren persönlichen
        Code und den Nachweis Ihres Auftrags, um Ihnen Code und Gutschein zu senden (Art. 6 Abs. 1 lit. b DSGVO). Wenn Sie uns auf
        Empfehlung kontaktieren und eingewilligt haben, ordnen wir Ihre Anfrage dem Code zu und teilen der empfehlenden Person nach
        Ihrem ersten Auftrag nur mit, dass ein Gutschein fällig ist (Art. 6 Abs. 1 lit. a DSGVO). Sie können die Einwilligung
        jederzeit widerrufen. Kontaktdaten Dritter nehmen wir nicht entgegen. Speicherdauer: [3] Jahre nach Ausgabe des Gutscheins.
      </p>
    </Ergaenzung>
  );
}
// </dse:empfehlung>
