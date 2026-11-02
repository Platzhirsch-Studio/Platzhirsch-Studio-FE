// src/lib/commerce/withdrawalText.js
// ENTWURF der Widerrufsbelehrung für den Online-Kauf von Gutscheinen
// (Stripe-Strecke, VOUCHER_MODE=stripe). Grundlage: Muster nach Anhang I
// FAGG, angepasst an Punkt 8 der Gutscheinbedingungen (14 Tage ab Erhalt,
// solange nicht eingelöst) und an die Widerrufsfunktion nach § 13a FAGG
// (Schaltfläche „Vertrag widerrufen“, seit 01.10.2026; Rechtspaket 01 § 7.4).
//
// Kopplung: VOUCHER_MODE=stripe wirkt nur, wenn WITHDRAWAL_STATUS
// "freigegeben" ist (mode.js). Ohne geprüfte Belehrung verlängert sich die
// Rücktrittsfrist um bis zu 12 Monate (§ 12 FAGG, Rechtspaket 01 § 7).
// Offene Stellen tragen dieselben Markierungen wie voucherTerms.js.
// Keine "@/..."-Importe.

export const WITHDRAWAL_STATUS = "entwurf";
export const WITHDRAWAL_STAND = "Entwurf vom 28.10.2026";
export const WITHDRAWAL_TITLE = "Widerrufsbelehrung für Gutscheine";

export const WITHDRAWAL_SECTIONS = Object.freeze([
  {
    id: "recht",
    title: "Widerrufsrecht",
    paragraphs: [
      "Sie haben das Recht, binnen 14 Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen. Die Widerrufsfrist beträgt 14 Tage ab dem Tag, an dem Sie den Gutschein per E-Mail erhalten haben. Das Widerrufsrecht besteht, solange der Gutschein noch nicht, auch nicht teilweise, eingelöst wurde. [anwaltlich prüfen: Fristbeginn und Erlöschen bei Einlösung]",
      "Um Ihr Widerrufsrecht auszuüben, müssen Sie uns, [Firmenwortlaut der ausgebenden Gesellschaft], Landstraße 11, 6911 Lochau, Österreich, Telefon +43 5574 46255, E-Mail info@platzhirsch.studio, mittels einer eindeutigen Erklärung (zum Beispiel ein mit der Post versandter Brief oder eine E-Mail) über Ihren Entschluss, diesen Vertrag zu widerrufen, informieren. Sie können dafür das unten stehende Muster-Widerrufsformular verwenden, das jedoch nicht vorgeschrieben ist. [vom Unternehmen auszufüllen: Firmenwortlaut]",
      "Sie können den Vertrag auch über die Schaltfläche „Vertrag widerrufen“ auf unserer Website widerrufen. Wir bestätigen Ihnen den Eingang des Widerrufs unverzüglich per E-Mail.",
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
      "An [Firmenwortlaut der ausgebenden Gesellschaft], Landstraße 11, 6911 Lochau, Österreich, E-Mail info@platzhirsch.studio:",
      "Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über den Kauf des folgenden Gutscheins: Bestellnummer / Gutscheincode",
      "Bestellt am (*) / erhalten am (*) · Name des/der Verbraucher(s) · Anschrift des/der Verbraucher(s) · Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier) · Datum",
      "(*) Unzutreffendes streichen.",
    ],
  },
]);
