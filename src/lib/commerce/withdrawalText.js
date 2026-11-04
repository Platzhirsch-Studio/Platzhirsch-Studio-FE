// src/lib/commerce/withdrawalText.js
// Widerrufsbelehrung für den Online-Kauf von Gutscheinen (Stripe-Strecke,
// VOUCHER_MODE=stripe). Grundlage: Muster nach Anhang I FAGG, angepasst an
// Punkt 8 der Gutscheinbedingungen (14 Tage ab Erhalt, solange nicht
// eingelöst) und an die Widerrufsfunktion nach § 13a FAGG (Schaltfläche
// „Vertrag widerrufen“, seit 01.10.2026; Rechtspaket 01 § 7.4).
//
// FREIGEGEBEN (Stand 03.11.2026): Wortlaut Kanzlei-Freigabe (Inhaber-
// Entscheidung Nr. 11), Firmenwortlaut der ausgebenden Gesellschaft laut
// Nr. 38 (MW Immobilienverwaltungs GmbH), Onlineverkauf erlaubt laut Nr. 46.
// Kopplung: VOUCHER_MODE=stripe wirkt nur, wenn WITHDRAWAL_STATUS
// "freigegeben" ist (mode.js). Ohne geprüfte Belehrung verlängert sich die
// Rücktrittsfrist um bis zu 12 Monate (§ 12 FAGG, Rechtspaket 01 § 7).
// Keine "@/..."-Importe.
import { ADDRESS, EMAIL, LEGAL_NAME, PHONE_DISPLAY } from "../site.js";

export const WITHDRAWAL_STATUS = "freigegeben";
/** Stand (JJJJ-MM-TT); lesbar: withdrawalStandDe(). */
export const WITHDRAWAL_STAND = "2026-11-03";
export const withdrawalStandDe = (iso = WITHDRAWAL_STAND) => `Stand ${iso.split("-").reverse().join(".")}`;
export const WITHDRAWAL_TITLE = "Widerrufsbelehrung für Gutscheine";

const ANSCHRIFT = `${ADDRESS.street}, ${ADDRESS.postalCode} ${ADDRESS.city}, ${ADDRESS.country}`;

export const WITHDRAWAL_SECTIONS = Object.freeze([
  {
    id: "recht",
    title: "Widerrufsrecht",
    paragraphs: [
      "Sie haben das Recht, binnen 14 Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen. Die Widerrufsfrist beträgt 14 Tage ab dem Tag, an dem Sie den Gutschein per E-Mail erhalten haben. Das Widerrufsrecht besteht, solange der Gutschein noch nicht, auch nicht teilweise, eingelöst wurde.",
      `Um Ihr Widerrufsrecht auszuüben, müssen Sie uns, ${LEGAL_NAME}, ${ANSCHRIFT}, Telefon ${PHONE_DISPLAY}, E-Mail ${EMAIL}, mittels einer eindeutigen Erklärung (zum Beispiel ein mit der Post versandter Brief oder eine E-Mail) über Ihren Entschluss, diesen Vertrag zu widerrufen, informieren. Sie können dafür das unten stehende Muster-Widerrufsformular verwenden, das jedoch nicht vorgeschrieben ist.`,
      "Sie können den Vertrag auch über die Schaltfläche „Vertrag widerrufen“ auf unserer Website widerrufen. Wir bestätigen Ihnen den Eingang des Widerrufs unverzüglich per E-Mail mit Inhalt, Datum und Uhrzeit Ihrer Erklärung.",
      "Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie die Mitteilung über die Ausübung des Widerrufsrechts vor Ablauf der Widerrufsfrist absenden.",
    ],
  },
  {
    id: "folgen",
    title: "Folgen des Widerrufs",
    paragraphs: [
      "Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von Ihnen erhalten haben, unverzüglich und spätestens binnen 14 Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung über Ihren Widerruf bei uns eingegangen ist. Für diese Rückzahlung verwenden wir dasselbe Zahlungsmittel, das Sie bei der ursprünglichen Transaktion eingesetzt haben, es sei denn, mit Ihnen wurde ausdrücklich etwas anderes vereinbart. In keinem Fall werden Ihnen wegen dieser Rückzahlung Entgelte berechnet.",
      "Mit dem Widerruf wird der Gutscheincode gesperrt.",
    ],
  },
  {
    id: "muster",
    title: "Muster-Widerrufsformular",
    paragraphs: [
      "(Wenn Sie den Vertrag widerrufen wollen, dann füllen Sie bitte dieses Formular aus und senden Sie es zurück.)",
      `An ${LEGAL_NAME}, ${ANSCHRIFT}, E-Mail ${EMAIL}:`,
      "Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über den Kauf des folgenden Gutscheins: Bestellnummer / Gutscheincode",
      "Bestellt am (*) / erhalten am (*) · Name des/der Verbraucher(s) · Anschrift des/der Verbraucher(s) · Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier) · Datum",
      "(*) Unzutreffendes streichen.",
    ],
  },
]);
