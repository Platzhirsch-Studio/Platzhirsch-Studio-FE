// src/lib/kundenkarte/terms.js – Teilnahmebedingungen der Kundenkarte
// (/[locale]/kundenkarte/bedingungen). ENTWURF – Freigabe durch die Kanzlei
// offen (TERMS_STATUS "entwurf", wie voucherTerms.js vor der Freigabe).
// Deutscher Text in allen vier Sprachen (wie AGB, Widerruf): Textkörper
// lang="de", Hinweis in der Seitensprache (Legal/GermanOnlyNotice.js).
//
// Regeln: Firmendaten nur aus src/lib/site.js; kein Guthaben, keine Punkte,
// keine Nachlässe (Inhaber 04.11.2026); keine Schwellen in Euro (offen);
// Prüfmarker [anwaltlich prüfen] bleiben bis zur Freigabe im Text und werden
// von termsOpenCount() gezählt. Keine "@/..."-Importe (node --test).
import { ADDRESS, EMAIL, LEGAL_NAME, PHONE_DISPLAY, SITE_NAME } from "../site.js";

/** „entwurf“ oder „freigegeben“ – Freigabe nur durch Kanzlei und Inhaber. */
export const TERMS_STATUS = "entwurf";
export const TERMS_STAND = "2026-11-04";
export const TERMS_TITLE = "Teilnahmebedingungen Kundenkarte";
export const TERMS_SUBTITLE = "Bedingungen für die Platzhirsch Kundenkarte (Stufe 1, ohne Guthaben)";
export const termsStandDe = (iso = TERMS_STAND) => iso.split("-").reverse().join(".");

export const MARKER = "[anwaltlich prüfen]";

const ANBIETER = `${LEGAL_NAME} („Platzhirsch“, Marke „${SITE_NAME}“), ${ADDRESS.street}, ${ADDRESS.postalCode} ${ADDRESS.city}, ${ADDRESS.country}`;

export const TERMS_SECTIONS = Object.freeze([
  {
    id: "anbieter",
    title: "1. Anbieter und Geltung",
    blocks: [
      `Die Platzhirsch Kundenkarte wird ausgegeben von der ${ANBIETER}, Telefon ${PHONE_DISPLAY}, E-Mail ${EMAIL}.`,
      "Diese Bedingungen gelten für die Teilnahme am Kundenkartenprogramm. Für Käufe gelten daneben unsere Allgemeinen Geschäftsbedingungen.",
    ],
  },
  {
    id: "teilnahme",
    title: "2. Teilnahme",
    blocks: [
      "Teilnehmen können volljährige natürliche Personen. Die Teilnahme ist freiwillig und unentgeltlich; es fällt keine Gebühr an.",
      "Die Anmeldung erfolgt über die Website, im Showroom oder per E-Mail. Sie wird wirksam, sobald Sie Ihre E-Mail-Adresse über den zugesandten Bestätigungslink bestätigt haben (Double-Opt-in). Je Person wird eine Karte ausgegeben.",
      "Die Karte ist persönlich und nicht übertragbar. Sie steht Ihnen im Kundenportal „Mein Platzhirsch“ zur Verfügung; eine Hinterlegung in Apple Wallet oder Google Wallet bieten wir an, sobald sie technisch bereitsteht.",
    ],
  },
  {
    id: "vorteile",
    title: "3. Vorteile und Stufen",
    blocks: [
      "Die Kundenkarte gewährt Leistungsvorteile, zum Beispiel einen persönlichen Berater, den Produktpass mit Garantiefristen im Kundenportal, Pflege-Service, Lieferung innerhalb der Region, Montage, Einladungen vor der öffentlichen Ankündigung und eine Aufmerksamkeit zum Geburtstag. Welche Vorteile Ihre Stufe umfasst und in welchem Umfang, zeigen wir Ihnen im Kundenportal.",
      "Die Kundenkarte enthält kein Guthaben, keine Punkte und keine Nachlässe. Vorteile haben keinen Geldwert, werden nicht ausgezahlt und nicht auf Dritte übertragen. Nicht genutzte Vorteile verfallen mit Ablauf des jeweiligen Zeitraums, ohne dass ein Ersatzanspruch entsteht.",
      "Es gibt drei Stufen: Platzhirsch, Platzhirsch Plus und Platzhirsch Privé. Jede Teilnehmerin und jeder Teilnehmer beginnt in der Stufe Platzhirsch. Der Aufstieg richtet sich nach dem Jahresumsatz bei Platzhirsch; die Schwellen und Ihren aktuellen Stand zeigen wir Ihnen im Kundenportal. Eine Einstufung setzt Ihre Einwilligung zur Auswertung Ihrer Einkäufe (Punkt 5) voraus; ohne sie bleibt die Karte in der Stufe Platzhirsch. " + MARKER,
      "Die Einstufung wird jährlich überprüft. Sinkt der Jahresumsatz unter die Schwelle, kann die Stufe zum nächsten Stichtag angepasst werden; wir informieren Sie darüber im Kundenportal. " + MARKER,
    ],
  },
  {
    id: "einloesung",
    title: "4. Inanspruchnahme der Vorteile",
    blocks: [
      "Vorteile werden im Showroom in Lochau, im Rahmen von Lieferung und Montage oder über das Kundenportal in Anspruch genommen. Dazu nennen Sie uns Ihre Kartennummer oder zeigen die Karte im Portal vor.",
      "Lieferung frei innerhalb der Region und Montage inklusive gelten für Bestellungen bei Platzhirsch im jeweils im Kundenportal ausgewiesenen Gebiet und Umfang; Sonderleistungen (zum Beispiel Kran, Entsorgung, Montage durch Fremdgewerke) sind nicht umfasst. " + MARKER,
      "Vorteile lassen sich nicht mit anderen Aktionen verbinden, soweit dort nichts anderes steht.",
    ],
  },
  {
    id: "daten",
    title: "5. Datenverarbeitung und Einwilligungen",
    blocks: [
      "Für die Karte verarbeiten wir Ihren Namen, Ihre E-Mail-Adresse und – wenn Sie sie angeben – Telefonnummer, Postleitzahl, Ort, Geburtstag (Tag und Monat, Jahr freiwillig) und Interessen. Rechtsgrundlage ist die Durchführung des Kundenkartenprogramms (Art. 6 Abs. 1 lit. b DSGVO). Einzelheiten stehen in unserer Datenschutzerklärung. " + MARKER,
      "Auswertung der Einkäufe: Nur mit Ihrer gesonderten, freiwilligen Einwilligung (Art. 6 Abs. 1 lit. a DSGVO) werten wir Ihre Einkäufe aus, um Ihre Stufe zu ermitteln und Ihnen persönliche Empfehlungen zu geben. Ohne diese Einwilligung bleibt die Karte in der Stufe Platzhirsch.",
      "Newsletter: Der Newsletter ist eine eigene, freiwillige Einwilligung und keine Bedingung für die Teilnahme.",
      "Beide Einwilligungen können Sie jederzeit mit Wirkung für die Zukunft widerrufen – im Kundenportal oder per E-Mail an " + EMAIL + ". Die Rechtmäßigkeit der bis zum Widerruf erfolgten Verarbeitung bleibt unberührt.",
      "Wir geben Ihre Daten nicht zu Werbezwecken an Dritte weiter. Dienstleister, die uns beim Betrieb unterstützen (zum Beispiel Hosting, E-Mail-Versand), sind in der Datenschutzerklärung genannt.",
    ],
  },
  {
    id: "beendigung",
    title: "6. Laufzeit und Beendigung",
    blocks: [
      "Die Teilnahme ist unbefristet. Sie können die Karte jederzeit ohne Frist kündigen – im Kundenportal oder per E-Mail. Wir löschen Ihre Kartendaten dann; gesetzliche Aufbewahrungspflichten (zum Beispiel für Rechnungen) bleiben unberührt.",
      "Platzhirsch kann die Teilnahme mit einer Frist von drei Monaten kündigen, bei Missbrauch (zum Beispiel Weitergabe der Karte, falsche Angaben) auch fristlos. Bereits zugesagte Vorteile für laufende Aufträge bleiben erhalten. " + MARKER,
      "Platzhirsch kann das Programm mit einer Ankündigungsfrist von drei Monaten einstellen. Vorteile aus bis dahin erteilten Aufträgen werden erbracht.",
    ],
  },
  {
    id: "aenderungen",
    title: "7. Änderungen dieser Bedingungen",
    blocks: [
      "Änderungen dieser Bedingungen, der Stufen oder der Vorteile kündigen wir mindestens sechs Wochen vorher per E-Mail und im Kundenportal an. Widersprechen Sie nicht bis zum Wirksamwerden, gelten die geänderten Bedingungen; auf dieses Recht und die Folgen weisen wir in der Ankündigung hin. Verschlechtert eine Änderung Ihre Stellung wesentlich, können Sie jederzeit kündigen. " + MARKER,
    ],
  },
  {
    id: "recht",
    title: "8. Anwendbares Recht",
    blocks: [
      "Es gilt österreichisches Recht unter Ausschluss des UN-Kaufrechts. Für Verbraucherinnen und Verbraucher mit gewöhnlichem Aufenthalt in einem anderen Staat bleiben zwingende Schutzvorschriften dieses Staates unberührt.",
      "Platzhirsch nimmt nicht an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teil und ist dazu nicht verpflichtet. " + MARKER,
    ],
  },
]);

/** Zahl der offenen Prüfmarker im Text – 0 ist Voraussetzung für „freigegeben“. */
export function termsOpenCount() {
  return TERMS_SECTIONS.reduce((n, s) => n + s.blocks.filter((b) => b.includes(MARKER)).length, 0);
}
