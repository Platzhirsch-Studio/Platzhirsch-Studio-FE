// src/lib/legal/widerruf.js — Allgemeine Widerrufsbelehrung (Rücktrittsrecht
// nach dem FAGG) für Verträge außerhalb des Onlineshops.
//
// Inhaber-Entscheidung vom 03.11.2026 (inhaber-entscheidungen.md Nr. 39):
// Beratung, Planung und Kauf kommen auch per E-Mail, Telefon, Videoberatung
// oder beim Hausbesuch zustande – das sind Fernabsatz- bzw. Außergeschäftsraum-
// verträge (§ 3 Z 2 und Z 1 FAGG). Ohne Belehrung verlängert sich die
// Rücktrittsfrist um zwölf Monate (§ 12 Abs 1 FAGG) und ein Wertersatz für
// begonnene Leistungen entfällt (§ 16 Abs 2 FAGG). Deshalb eine eigene Seite
// /[locale]/widerruf, verlinkt aus den AGB (Teil II § 7), dem Footer, der
// Terminbuchung und dem Beratungsformular.
//
// Regeln (wie src/lib/legal/agb.js): Firmendaten nur aus src/lib/site.js,
// keine erfundenen Zahlen (nur gesetzliche Fristen: vierzehn Tage, zwölf
// Monate), keine Markennamen, kein KI-Wortlaut. Der Onlineshop hat seine
// eigene Belehrung (src/lib/shop/legalTexte.js, Anhang I Teil A FAGG
// wörtlich); hier wird sie nicht dupliziert, sondern verwiesen.
//
// Rücksendekosten nicht paketfähiger Ware: Gestaltungshinweis [5] zu Anhang I
// verlangt einen Betrag oder eine Schätzung „höchstens etwa … EUR“. Statt
// eines erfundenen Betrags wird auf den im Angebot für die Lieferung
// ausgewiesenen Betrag verwiesen – je Vertrag konkret, kein Platzhalter.
// Prüfpunkt für die Kanzlei (AGB-KANZLEI-2026-11-02.md, Stand 03.11.2026).
//
// Rein: nur relative Importe (node --test).
import { ADDRESS, EMAIL, LEGAL_NAME, PHONE_DISPLAY, SITE_NAME, SITE_URL } from "../site.js";

/** „entwurf“ oder „freigegeben“ (Inhaber 03.11.2026: freigegeben, keine offenen Platzhalter). */
export const WIDERRUF_STATUS = "freigegeben";
export const WIDERRUF_STAND = "2026-11-03";
export const WIDERRUF_TITLE = "Widerrufsbelehrung";
export const WIDERRUF_SUBTITLE = "Rücktrittsrecht für Verbraucherinnen und Verbraucher nach dem Fern- und Auswärtsgeschäfte-Gesetz (FAGG)";
export const WIDERRUF_PATH = "/widerruf";
/** Online-Rücktrittsfunktion (§ 13a FAGG) – Seite des Onlineshops, auch ohne Bestellnummer nutzbar; nur bei SHOP_MODE test/live erreichbar. */
export const WIDERRUF_FORMULAR_PATH = "/shop/recht/widerruf-formular";
/** Widerrufsbelehrung des Onlineshops (eigener Text, Anhang I Teil A FAGG). */
export const WIDERRUF_SHOP_PATH = "/shop/recht/widerruf";

export const WIDERRUF_ANBIETER = Object.freeze({
  firma: LEGAL_NAME,
  marke: SITE_NAME,
  anschrift: `${ADDRESS.street}, ${ADDRESS.postalCode} ${ADDRESS.city}, ${ADDRESS.country}`,
  telefon: PHONE_DISPLAY,
  email: EMAIL,
  web: SITE_URL.replace(/^https?:\/\//, ""),
});

const A = WIDERRUF_ANBIETER;
const ANBIETER_ZEILE = `${A.firma} („${A.marke}“), ${A.anschrift}, Telefon ${A.telefon}, E-Mail ${A.email}`;

/**
 * Abschnitte der Belehrung. Blöcke sind Strings (Absatz) oder { ul: [...] }.
 * Der Fließtext nennt keine Links; die Seite hängt Verweise (Onlineshop,
 * Online-Formular) nur an, wenn die Zielseite erreichbar ist.
 */
export const WIDERRUF_SECTIONS = Object.freeze([
  {
    id: "geltung",
    title: "Für wen und für welche Verträge diese Belehrung gilt",
    blocks: [
      `Diese Belehrung gilt für Verbraucherinnen und Verbraucher im Sinne des § 1 KSchG, die mit der ${ANBIETER_ZEILE}, einen Vertrag über Waren oder Leistungen schließen, und zwar`,
      {
        ul: [
          "nur über Fernkommunikationsmittel – etwa per E-Mail, Telefon, Videoberatung, über ein Formular unserer Website oder durch Annahme eines per E-Mail übermittelten Angebots (Fernabsatzvertrag, § 3 Z 2 FAGG), oder",
          "außerhalb unserer Geschäftsräume – etwa bei Ihnen zu Hause beim Aufmaß, bei der Beratung vor Ort oder auf Ihrer Baustelle (Außergeschäftsraumvertrag, § 3 Z 1 FAGG).",
        ],
      },
      "Sie gilt für alle unsere Geschäftsbereiche: Möbel und Einrichtung, Küchen nach Maß, Küchen- und Elektrogeräte, Bad und Wellness, Planung und Interior Design, Outdoor und Yacht-Interieur sowie Pflege- und Winterservice.",
      "Kein Rücktrittsrecht nach dem FAGG besteht bei Verträgen, die Sie in unserem Showroom in Lochau schließen, und bei Verträgen mit Unternehmern. Für Bestellungen im Onlineshop gilt die Widerrufsbelehrung des Onlineshops; für Gutscheine gelten die Gutscheinbedingungen.",
    ],
  },
  {
    id: "widerrufsrecht",
    title: "Widerrufsrecht",
    blocks: [
      "Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen (§ 11 FAGG).",
      "Die Widerrufsfrist beträgt vierzehn Tage",
      {
        ul: [
          "bei einem Vertrag über eine Dienstleistung – etwa Beratung, Planung, Lichtplanung, Aufmaß, Pflege- oder Winterservice – ab dem Tag des Vertragsschlusses;",
          "bei einem Vertrag über Waren ab dem Tag, an dem Sie oder ein von Ihnen benannter Dritter, der nicht der Beförderer ist, die Waren in Besitz genommen haben bzw. hat;",
          "bei mehreren Waren, die Sie im Rahmen einer einheitlichen Bestellung bestellt haben und die getrennt geliefert werden, ab dem Tag, an dem Sie oder ein von Ihnen benannter Dritter, der nicht der Beförderer ist, die letzte Ware in Besitz genommen haben bzw. hat;",
          "bei Lieferung einer Ware in mehreren Teilsendungen oder Stücken ab dem Tag, an dem Sie oder ein von Ihnen benannter Dritter, der nicht der Beförderer ist, die letzte Teilsendung oder das letzte Stück in Besitz genommen haben bzw. hat;",
          "bei einem Vertrag über Waren mit Montage (Lieferung und Montage als eine Leistung) ab dem Tag, an dem Sie die Waren in Besitz genommen haben.",
        ],
      },
      `Um Ihr Widerrufsrecht auszuüben, müssen Sie uns (${ANBIETER_ZEILE}) mittels einer eindeutigen Erklärung – zum Beispiel mit der Post versandter Brief oder E-Mail – über Ihren Entschluss, diesen Vertrag zu widerrufen, informieren. Sie können dafür das unten abgedruckte Muster-Widerrufsformular verwenden, das jedoch nicht vorgeschrieben ist.`,
      "Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie die Mitteilung über die Ausübung des Widerrufsrechts vor Ablauf der Widerrufsfrist absenden.",
    ],
  },
  {
    id: "folgen",
    title: "Folgen des Widerrufs",
    blocks: [
      "Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von Ihnen erhalten haben, einschließlich der Lieferkosten (mit Ausnahme der zusätzlichen Kosten, die sich daraus ergeben, dass Sie eine andere Art der Lieferung als die von uns angebotene, günstigste Standardlieferung gewählt haben), unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung über Ihren Widerruf dieses Vertrags bei uns eingegangen ist. Für diese Rückzahlung verwenden wir dasselbe Zahlungsmittel, das Sie bei der ursprünglichen Transaktion eingesetzt haben, es sei denn, mit Ihnen wurde ausdrücklich etwas anderes vereinbart; in keinem Fall werden Ihnen wegen dieser Rückzahlung Entgelte berechnet.",
      "Bei Verträgen über Waren können wir die Rückzahlung verweigern, bis wir die Waren wieder zurückerhalten haben oder bis Sie den Nachweis erbracht haben, dass Sie die Waren zurückgesandt haben, je nachdem, welches der frühere Zeitpunkt ist.",
      `Sie haben die Waren unverzüglich und in jedem Fall spätestens binnen vierzehn Tagen ab dem Tag, an dem Sie uns über den Widerruf dieses Vertrags unterrichten, an uns (${A.firma}, Showroom ${A.marke}, ${A.anschrift}) zurückzusenden oder zu übergeben. Die Frist ist gewahrt, wenn Sie die Waren vor Ablauf der Frist von vierzehn Tagen absenden.`,
      "Sie tragen die unmittelbaren Kosten der Rücksendung der Waren. Bei Waren, die aufgrund ihrer Beschaffenheit nicht auf dem normalen Postweg zurückgesendet werden können (etwa Möbel, Leuchten in Überlänge, Platten, Anlagen), werden diese Kosten auf höchstens etwa den Betrag geschätzt, der in unserem Angebot bzw. in der Auftragsbestätigung für die Lieferung an Sie ausgewiesen ist. Wurden solche Waren bei einem außerhalb unserer Geschäftsräume geschlossenen Vertrag bereits zum Zeitpunkt des Vertragsschlusses zu Ihnen geliefert, holen wir sie auf unsere Kosten ab (§ 15 FAGG).",
      "Sie müssen für einen etwaigen Wertverlust der Waren nur aufkommen, wenn dieser Wertverlust auf einen zur Prüfung der Beschaffenheit, Eigenschaften und Funktionsweise der Waren nicht notwendigen Umgang mit ihnen zurückzuführen ist.",
      "Haben Sie verlangt, dass eine Dienstleistung während der Widerrufsfrist beginnen soll, so haben Sie uns einen angemessenen Betrag zu zahlen, der dem Anteil der bis zu dem Zeitpunkt, zu dem Sie uns von der Ausübung des Widerrufsrechts hinsichtlich dieses Vertrags unterrichten, bereits erbrachten Dienstleistungen im Vergleich zum Gesamtumfang der im Vertrag vorgesehenen Dienstleistungen entspricht (§ 16 FAGG).",
    ],
  },
  {
    id: "vorzeitiger-beginn",
    title: "Beginn einer Planung oder Dienstleistung vor Ablauf der Frist",
    blocks: [
      "Mit einer Planung, einem Aufmaß oder einer anderen Dienstleistung beginnen wir vor Ablauf der Widerrufsfrist nur, wenn Sie das ausdrücklich verlangen – bei einem außerhalb unserer Geschäftsräume geschlossenen Vertrag auf einem dauerhaften Datenträger, etwa per E-Mail oder unterschrieben auf Papier (§ 10 FAGG). Treten Sie danach zurück, zahlen Sie den anteiligen Betrag für die bis dahin erbrachte Leistung nach dem vereinbarten Gesamtpreis, sonst nach dem Marktwert.",
      "Haben wir die Dienstleistung auf Ihr ausdrückliches Verlangen vollständig erbracht und haben Sie vor Beginn bestätigt, dass Sie mit der vollständigen Erfüllung Ihr Widerrufsrecht verlieren, besteht für diesen Vertrag kein Widerrufsrecht mehr (§ 18 Abs 1 Z 1 FAGG).",
      "Verlangen Sie den vorzeitigen Beginn nicht, beginnen wir mit der Leistung erst nach Ablauf der Widerrufsfrist. Eine Bestellung von Waren beim Hersteller lösen wir in diesem Fall ebenfalls erst nach Ablauf der Frist aus, sofern Sie nichts anderes wünschen.",
    ],
  },
  {
    id: "ausnahmen",
    title: "Kein Widerrufsrecht (§ 18 FAGG)",
    blocks: [
      "Das Widerrufsrecht besteht insbesondere nicht bei",
      {
        ul: [
          "Waren, die nach Ihren Vorgaben angefertigt werden oder eindeutig auf Ihre persönlichen Bedürfnisse zugeschnitten sind (§ 18 Abs 1 Z 3 FAGG) – dazu zählen Küchen nach Maß, Einbaumöbel, Maßmöbel und Möbel, die in von Ihnen gewählten Maßen, Bezügen, Ledern, Hölzern, Farben oder Modulkombinationen bestellt werden, Arbeitsplatten, Stein- und Glasplatten nach Maß, Teppiche in Sondergröße sowie Polster- und Textilarbeiten nach Ihren Maßen. Das gilt auch dann, wenn mit der Herstellung noch nicht begonnen wurde;",
          "Dienstleistungen, die wir auf Ihr ausdrückliches Verlangen vollständig erbracht haben, wenn Sie vor Beginn bestätigt haben, dass Sie mit der vollständigen Erfüllung Ihr Widerrufsrecht verlieren (§ 18 Abs 1 Z 1 FAGG);",
          "versiegelten Waren, die aus Gründen des Gesundheitsschutzes oder aus Hygienegründen nicht zur Rückgabe geeignet sind, sofern die Versiegelung nach der Lieferung entfernt wurde (§ 18 Abs 1 Z 5 FAGG);",
          "dringenden Reparatur- oder Instandhaltungsarbeiten, zu denen Sie uns ausdrücklich zu einem Besuch aufgefordert haben; für zusätzliche Leistungen oder Waren, die Sie bei diesem Besuch nicht ausdrücklich verlangt haben, bleibt das Widerrufsrecht bestehen (§ 18 Abs 1 Z 10 FAGG).",
        ],
      },
      "Ob eine Ware eine Anfertigung nach Ihren Vorgaben ist, sagen wir Ihnen vor Vertragsschluss; es steht auch im Angebot bzw. in der Auftragsbestätigung. Lagerware und Ausstellungsstücke ohne Anpassung an Ihre Vorgaben können Sie widerrufen.",
    ],
  },
  {
    id: "fehlende-belehrung",
    title: "Wenn wir Sie nicht oder nicht richtig belehrt haben",
    blocks: [
      "Haben wir Sie über Ihr Widerrufsrecht nicht oder nicht vollständig belehrt, verlängert sich die Widerrufsfrist um zwölf Monate; sie endet dann zwölf Monate und vierzehn Tage nach dem Zeitpunkt, zu dem sie bei ordnungsgemäßer Belehrung geendet hätte. Holen wir die Belehrung innerhalb dieser zwölf Monate nach, endet die Frist vierzehn Tage nach dem Tag, an dem Sie die Belehrung erhalten haben (§ 12 FAGG).",
      "Haben wir Sie nicht über das Widerrufsrecht oder nicht über den zu zahlenden anteiligen Betrag belehrt, schulden Sie für eine vor dem Widerruf begonnene Dienstleistung keinen anteiligen Betrag (§ 16 Abs 2 FAGG).",
    ],
  },
  {
    id: "erklaerung",
    title: "So erklären Sie den Widerruf",
    blocks: [
      `Per E-Mail an ${A.email}, per Brief an ${A.firma}, ${A.anschrift}, oder telefonisch unter ${A.telefon} mit anschließender Bestätigung per E-Mail. Nennen Sie bitte Ihren Namen, Ihre Anschrift, das Datum des Vertrags bzw. der Lieferung und die Waren oder Leistungen, die Sie widerrufen; eine Angebots- oder Auftragsnummer erleichtert die Zuordnung, ist aber nicht erforderlich. Wir bestätigen Ihnen den Eingang unverzüglich per E-Mail.`,
    ],
  },
]);

/** Muster-Widerrufsformular, Anhang I Teil B FAGG, wörtlich und ausgefüllt. */
export const WIDERRUF_MUSTERFORMULAR = Object.freeze({
  id: "musterformular",
  title: "Muster-Widerrufsformular",
  blocks: [
    "(Wenn Sie den Vertrag widerrufen wollen, dann füllen Sie bitte dieses Formular aus und senden Sie es zurück)",
    {
      ul: [
        `An ${A.firma}, ${A.anschrift}, E-Mail ${A.email}:`,
        "Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über den Kauf der folgenden Waren (*)/die Erbringung der folgenden Dienstleistung (*)",
        "Bestellt am (*)/erhalten am (*)",
        "Name des/der Verbraucher(s)",
        "Anschrift des/der Verbraucher(s)",
        "Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier)",
        "Datum",
      ],
    },
    "(*) Unzutreffendes streichen.",
  ],
});

/**
 * Kurzer Hinweis für Buchungs- und Beratungsformulare (Termin, Beratung):
 * ein Satz in der Seitensprache, Linktext auf /widerruf. Der Flow ändert sich
 * nicht; die Zeile steht neben dem Datenschutzhinweis.
 */
export const WIDERRUF_HINWEIS = Object.freeze({
  de: { text: "Für Verbraucher: Bei Verträgen per E-Mail, Telefon, Video oder bei Ihnen zu Hause gilt ein Rücktrittsrecht von vierzehn Tagen.", link: "Widerrufsbelehrung" },
  en: { text: "For consumers: contracts concluded by e-mail, phone, video or at your home carry a fourteen-day right of withdrawal.", link: "Withdrawal information (German)" },
  fr: { text: "Pour les consommateurs : les contrats conclus par e-mail, téléphone, vidéo ou à votre domicile donnent un droit de rétractation de quatorze jours.", link: "Information sur la rétractation (en allemand)" },
  it: { text: "Per i consumatori: i contratti conclusi per e-mail, telefono, video o a casa vostra prevedono un diritto di recesso di quattordici giorni.", link: "Informativa sul recesso (in tedesco)" },
});

/** Hinweis für die Seitensprache (unbekannte Sprache: Englisch). */
export function widerrufHinweis(locale) {
  return WIDERRUF_HINWEIS[locale] || WIDERRUF_HINWEIS.en;
}

/** Alle Absätze eines Abschnitts als Strings. */
export function sectionTexts(section) {
  return (section.blocks || []).flatMap((b) => (typeof b === "string" ? [b] : b?.ul || []));
}

/** Gesamter Wortlaut (Belehrung und Musterformular) als ein String – für Tests. */
export function widerrufText() {
  return [...WIDERRUF_SECTIONS, WIDERRUF_MUSTERFORMULAR].flatMap((s) => [s.title, ...sectionTexts(s)]).join("\n");
}

/** Offene Stellen im Text ([…]-Klammern außer den gesetzlichen „(*)“-Marken) – muss leer sein, sonst bleibt der Status „entwurf“. */
export function widerrufLuecken() {
  return widerrufText().match(/\[[^\]]+\]/g) || [];
}

/** Stand als deutsches Datum (TT.MM.JJJJ). */
export function widerrufStandDe(iso = WIDERRUF_STAND) {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}
