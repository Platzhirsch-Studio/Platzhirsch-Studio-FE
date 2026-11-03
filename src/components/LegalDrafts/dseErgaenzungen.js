import React from "react";
import { EMAIL, EMAIL_HREF, PHONE_DISPLAY, PHONE_HREF } from "@/lib/site";
import { DSE_ERGAENZUNG_STAND, DSE_SECTIONS, dseRenderMode } from "@/lib/legal/dseSections";
import { RETENTION_MONTHS as IDEENBOARD_RETENTION_MONTHS } from "@/lib/ideenboard/config";
import { retentionMonths as wunschlisteRetentionMonths } from "@/lib/wunschliste/config";
import { VERIFY_TTL_MIN, MEET_OPEN_MIN } from "@/lib/booking/constants";
import { SERVER as EINBLICKE_SERVER, SESSION_MS as EINBLICKE_SESSION_MS } from "@/lib/einblicke/config";

// Ergänzungen der Datenschutzerklärung für neue Funktionen (Rat 9,5, B4).
//
// Jeder Abschnitt ist einzeln schaltbar: Er erscheint regulär, sobald er im
// Register src/lib/legal/dseSections.js freigegeben ist ("live"). In der
// Entwicklung erscheinen alle Abschnitte, damit Anker, Links und Aufbau
// geprüft werden können. In Produktion erscheinen ohne Freigabe nur die
// Abschnitte mit `oeffentlich` (Funktion ohne Schalter: Service-Formulare,
// 3D-/AR-Ansicht) – diese Funktionen sind live erreichbar, also gehört die
// Information nach Art. 13 DSGVO auf die Seite. Alle anderen Funktionen sind
// in Produktion gesperrt, bis ihr Abschnitt freigegeben ist (dseGateOpen in
// booking/config, ideenboard/mode, einblicke/config, whatsapp/config;
// Release-Test tools/qa/prod-check.mjs Schritt „dse“).
//
// Sichtbar ist bei nicht freigegebenen Abschnitten nur „Stand: <Datum>“
// (Inhaber 02.11.2026: keine Entwurfs-, Prüf- oder Verfasserhinweise im
// Besuchertext). Der Status „entwurf“ bleibt in den Daten (data-dse-status).
//
// Wortlaut: aus den Vorschlägen der Feature-Teams (Pfad je Abschnitt im
// Register) und Marktresearch/recht/07-dse-ergaenzungen-rat95.md. Fristen und
// Anbieter stehen nur, wo der Code sie belegt (Konstanten importiert); wo der
// Code keine Frist hat, steht die gesetzliche Formulierung („solange …“).
// Offene Fakten (Hoster, AVV, Zahlenfristen) führt
// Platzhirsch-Status/berichte/RECHT-PLATZHALTER-2026-11-02.md. Vor dem
// Umstellen auf "freigegeben" dürfen zwischen <dse:id> … </dse:id> keine
// eckigen Klammern stehen (tests/unit/rat95-recht-dse.test.mjs).

const ul = "mt-3 list-disc space-y-2 pl-5 marker:text-text-soft";

const standDe = (iso) => iso.split("-").reverse().join(".");

/** Rahmen eines Abschnitts: H2 mit Anker; ohne Freigabe nur die Zeile „Stand“. */
export function Ergaenzung({ id, children, env = process.env }) {
  const mode = dseRenderMode(id, env);
  if (!mode) return null;
  const section = DSE_SECTIONS[id];
  return (
    <div data-dse-section={id} data-dse-status={mode === "live" ? "freigegeben" : "entwurf"}>
      <h2 id={section.anchor}>{section.title}</h2>
      {mode === "entwurf" && (
        <p className="text-small text-text-soft" data-dse-draft="">
          Stand: {standDe(DSE_ERGAENZUNG_STAND)}
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
        Planungstermin zu einem Thema. Einen externen Kalenderdienst binden wir dafür nicht ein; der Kalender läuft auf unserem
        eigenen Server, die Termine verwaltet unser Backoffice.
      </p>
      <ul className={ul}>
        <li>
          <strong>Daten:</strong> Terminart und Zeitpunkt, Vorname, Nachname und E-Mail-Adresse, freiwillig Telefonnummer und Ihr
          Anliegen; bei einem Termin vor Ort zusätzlich Telefonnummer, Postleitzahl und Ort; bei der Videoberatung Ihre
          Einwilligung mit Zeitpunkt und Textversion.
        </li>
        <li>
          <strong>Bestätigung:</strong> Wir senden einen Bestätigungslink an Ihre E-Mail-Adresse. Erst mit dem Klick wird der Termin
          verbindlich; bis dahin halten wir die Uhrzeit {VERIFY_TTL_MIN} Minuten frei. Ohne Bestätigung verfällt die Vormerkung, die
          Angaben löschen wir spätestens einen Tag danach. Gespeichert wird nur ein Prüfwert des Links.
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
          <strong>Empfänger:</strong> unser Backoffice (Verwaltungssystem auf Basis von Frappe), betrieben in unserem Auftrag; die
          E-Mails zum Termin versenden wir über den Dienst aus dem Abschnitt „E-Mail-Versand“.
        </li>
        <li>
          <strong>Speicherdauer:</strong> Termindaten bewahren wir auf, bis der Termin stattgefunden hat und danach, solange mit
          Rückfragen zu rechnen ist. Wird ein Auftrag daraus, gelten die gesetzlichen Aufbewahrungsfristen (in Österreich 7 Jahre,
          § 132 BAO).
        </li>
      </ul>
      <p>
        <strong>Videoberatung:</strong> Der Videoraum gehört zu unserem Backoffice-System; einen externen Videodienst binden wir
        nicht ein. Sie brauchen keine App und kein Konto. Den Link zum Videoraum finden Sie ab {MEET_OPEN_MIN} Minuten vor Beginn auf
        Ihrer Terminseite; in E-Mails und Kalendereinträgen steht er nicht. Bild und Ton werden live übertragen; verarbeitet werden
        dabei IP-Adresse, Angaben zu Browser und Gerät und der Name, den Sie eingeben. Wir zeichnen weder Bild noch Ton auf;
        Verbindungsdaten des Videoraums bewahren wir nur so lange auf, wie es für Sicherheit und Fehlersuche nötig ist.
        Rechtsgrundlage ist die gebuchte Beratung (Art. 6 Abs. 1 lit. b DSGVO) und Ihre ausdrückliche Einwilligung zur
        Live-Übertragung (Art. 6 Abs. 1 lit. a DSGVO). Sie ist freiwillig; ohne sie bieten wir den Termin im Studio oder am Telefon
        an. Widerrufen können Sie per E-Mail an <a href={EMAIL_HREF}>{EMAIL}</a>, mit der Absage des Termins oder mit dem Wechsel
        ins Studio.
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
          Auftrag, bis Ihr Anliegen erledigt ist und nicht mehr mit Rückfragen zu rechnen ist; mit Auftrag wie Geschäftsbriefe
          (§ 132 BAO, § 212 UGB); technische Protokolle 30 Tage; den Nachweis Ihrer Kanalwahl und Einwilligung, solange wir ihn
          nach Art. 7 Abs. 1 DSGVO führen müssen.
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
          DSGVO). Übernahmelisten und Fotos des Zustands bewahren wir bis zur Rückbringung auf und danach so lange, wie Ansprüche
          aus der Einlagerung geltend gemacht werden können (gesetzliche Verjährungsfristen).
        </li>
        <li>
          <strong>Pflege-Service:</strong> Name, Kontaktdaten, Postleitzahl und Ort der Möbel, Angaben zu Möbeln und Material sowie
          freiwillig hochgeladene Fotos (Art. 6 Abs. 1 lit. b DSGVO). Erinnerungen an Pflegemittel senden wir nur mit Ihrer
          Einwilligung (Art. 6 Abs. 1 lit. a DSGVO, § 174 TKG 2021), die Sie jederzeit widerrufen können. Fotos ohne Auftrag löschen
          wir, sobald Ihre Anfrage erledigt ist und nicht mehr mit Rückfragen zu rechnen ist.
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
          <strong>Im Browser:</strong> eine zufällige Sitzungskennung <code>ph_eb</code> im sessionStorage,{" "}
          {Math.round(EINBLICKE_SESSION_MS / 60000)} Minuten; Cookies setzt die Funktion keine.
        </li>
        <li>
          <strong>Speicherdauer:</strong> pseudonyme Rohdaten höchstens {EINBLICKE_SERVER.rawMaxDays} Tage, danach nur anonyme
          Tageswerte (mindestens {EINBLICKE_SERVER.k} Besuche je Wert) ohne Personenbezug in unserem Backoffice. Sie dienen dem
          Vergleich über die Zeit und werden gelöscht, sobald wir sie dafür nicht mehr brauchen.
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
          <strong>Speicherdauer:</strong> Sie können den Link jederzeit widerrufen. Sonst löschen wir das geteilte Board{" "}
          {IDEENBOARD_RETENTION_MONTHS} Monate nach der letzten Änderung.
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
          <strong>Speicherdauer:</strong> {wunschlisteRetentionMonths()} Monate nach dem Anlass bzw. nach dem Erstellen, auf Wunsch
          sofort.
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
          <strong>Empfänger:</strong> bei Android die Google-App (Google Ireland Limited, Gordon House, Barrow Street, Dublin 4,
          Irland) nach den Datenschutzbestimmungen von Google; bei Apple verarbeitet Ihr Gerät das Modell selbst nach den Bedingungen
          von Apple. Für diese Verarbeitung in der App ist der jeweilige Anbieter verantwortlich.
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
        Speicherdauer: wie Ihre Projektunterlagen im Kundenportal (Abschnitt „Kundenportal und 3D-Raum“); eigene Fotos können
        Sie jederzeit im Portal löschen.
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
        jederzeit widerrufen. Kontaktdaten Dritter nehmen wir nicht entgegen. Speicherdauer: solange der Gutschein eingelöst werden
        kann, und danach, solange gesetzliche Aufbewahrungspflichten bestehen (§ 132 BAO, § 212 UGB).
      </p>
    </Ergaenzung>
  );
}
// </dse:empfehlung>
