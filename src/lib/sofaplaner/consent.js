// Sofaplaner – Datenquelle (Release-Rat R2, neuland P0-1).
//
// Die Minotti-Recherchedateien (./minotti/*.json) dürfen nach den
// Nutzungsbedingungen von Minotti nur mit schriftlicher Zustimmung in eine
// Datenbank übernommen werden. Solange diese Zustimmung nicht im
// Rechte-Register liegt, bleibt der Schalter AUS: Der Planer arbeitet dann mit
// eigenen, neutralen Modul-Typen in Rastermaßen (./neutral-data.js) und lädt
// keinen Minotti-Datensatz – weder ins HTML noch in eine Antwort der
// Katalog-Route. Die Seite bleibt erreichbar (Inhaber-Entscheidung Nr. 9:
// lösen statt verstecken).
//
// Inhaber-Entscheidung Nr. 11 (29.10.2026): Die schriftliche Zustimmung von
// Minotti für den Sofaplaner (Bauteil-Katalog und Daten) liegt per Mail vom
// 28.10.2026 vor – Schalter EIN. Bedingungen: Minotti-Bilder nur unverändert,
// sichtbare Quellenangabe (CREDIT). Der neutrale Katalog bleibt als Rückfall.
// Diese Datei enthält keine Daten und darf auch im Browser geladen werden.
export const MINOTTI_DATA_CONSENT = true;

/** Sichtbare Quellenangabe zum Minotti-Katalog (Bedingung der Zustimmung). */
export const MINOTTI_CREDIT = "Daten: Minotti S.p.A.";

const NEUTRAL = Object.freeze({
  brand: null,
  modelWord: "Sofa-Typ",
  // R5-USP (gesamtwerk P2-1): kein interner Jargon in der Overline.
  overline: "Sofaplaner · Planen Sie Ihr Sofa",
  lead:
    "Planen Sie Ihr Sofa aus Modulen in Rastermaßen – Ecke, Sitz, Chaiselongue und Hocker – direkt im eigenen Grundriss. Der Plan ist die Grundlage für das Gespräch im Showroom in Lochau.",
  leadShort: "Sofa aus Modulen in Rastermaßen im eigenen Raum planen.",
  showroom: "Konkrete Modelle zeigen wir Ihnen im Showroom: Stoffe, Sitzkomfort und Maße der Hersteller vergleichen wir dort gemeinsam.",
  pickerLead: (n) =>
    `${n} Sofa-Typen in Rastermaßen, jeder mit Ecke, Sitz, Chaiselongue und Hocker. Wählen Sie den Typ, der Ihrer Sitzgewohnheit am nächsten kommt.`,
  dimsNote: "T × H: Planungsmaße der Sitzelemente. Die genauen Maße des gewählten Modells bestätigen wir im Showroom.",
  sourceNote:
    "Hinweis: Die Sofa-Typen sind eigene Planungsgrößen von Platzhirsch Home Living (Rastermaße), kein bestimmtes Herstellermodell. Die 3D-Vorschau zeigt schematische Volumen in neutralen Farben. Der Planer zeigt keine Preise. Teilen-Links speichern nur den Plan, keine persönlichen Daten, und gelten 180 Tage. Preise nennen wir auf Anfrage, im Gespräch oder im Showroom in Lochau.",
  rulesNote: "Die Anschlussregeln sind aus den Modul-Typen abgeleitet und werden im Showroom am konkreten Modell bestätigt.",
  terminProdukt: "Sofa (Sofaplaner)",
  seoName: "Sofaplaner",
  // R8 (Fix-Team P1-claims, ux P1-4, recht P0-1): alle Teaser, Cross-Sell-
  // Texte, Metas und llms.txt hängen an diesen Feldern.
  h1: "Sofaplaner: Sofa aus Modulen im eigenen Raum planen",
  // R5 (gesamtwerk P2): sichtbare H1 der Seite als ganzer Satz wie bei den anderen Planern.
  h1Satz: "Ihr Sofa, Modul für Modul geplant.",
  metaTitle: "Sofaplaner: Sofa aus Modulen im Raum planen | Platzhirsch",
  metaDescription:
    "Ecksofa, U-Form oder Chaiselongue aus Modulen in Rastermaßen im eigenen Grundriss planen – Laufwege, 3D-Vorschau, Stückliste. Modelle zeigen wir im Showroom.",
  summary: "Schritt für Schritt zur eigenen Kombination: Sofa-Typ wählen, Module anpassen, Maße im Grundriss prüfen.",
  crossLabel: "Sofa aus Modulen planen",
  crossText: "Module wählen und die Maße im Grundriss prüfen. Konkrete Modelle zeigen wir im Showroom.",
  brandText: "Sofa-Form im eigenen Raum vorplanen. Konkrete Modelle zeigen wir Ihnen im Showroom.",
  unabhaengig: "Der Sofaplaner ist ein unabhängiges Planungswerkzeug von Platzhirsch Home Living.",
});

const MINOTTI = Object.freeze({
  brand: "Minotti",
  modelWord: "Minotti-Modell",
  overline: "Sofaplaner · Minotti",
  lead:
    "Planen Sie ein Sofa aus den echten Elementen der Minotti-Modelle – mit Herstellermaßen, passenden Anschlüssen und Ihrem Raum. Der Plan ist die Grundlage für das Gespräch im Showroom in Lochau, mit Stoffmustern und Probesitzen.",
  leadShort: "Minotti-Sofa aus echten Elementen im eigenen Raum planen.",
  showroom: null,
  pickerLead: (n) =>
    `Alle ${n} Sofa-Familien von Minotti mit ihren Elementen und Herstellermaßen, Varianten einer Linie auf einer Karte. Wählen Sie ein Modell – den Rest planen wir Schritt für Schritt.`,
  dimsNote:
    "T × H: typische Tiefe und Höhe der Sitzelemente laut Hersteller (Median), „–“ wenn nicht veröffentlicht. Fehlende Maße sind im Planer markiert und werden im Showroom bestätigt.",
  sourceNote:
    "Daten: Minotti S.p.A. – mit Zustimmung von Minotti. Maße und Optionen stammen aus den Unterlagen des Herstellers (Produktseiten und technische Datenblätter von Minotti); fehlende Maße sind markiert und werden im Showroom bestätigt. Die 3D-Vorschau zeigt schematische Volumen in neutralen Farben, keine Herstellerbilder. Der Planer zeigt keine Preise. Teilen-Links speichern nur den Plan, keine persönlichen Daten, und gelten 180 Tage. Preise nennen wir auf Anfrage, im Gespräch oder im Showroom in Lochau.",
  rulesNote: "Minotti veröffentlicht keine vollständige Kombinationstabelle: die Regeln sind aus den Elementtypen abgeleitet und werden im Showroom bestätigt.",
  terminProdukt: "Minotti-Sofa",
  seoName: "Minotti-Sofaplaner",
  h1: "Sofaplaner: Minotti-Sofa aus echten Elementen planen",
  h1Satz: "Ihr Sofa, Modul für Modul geplant.",
  // SEO (Sofaplaner-Team seo-inhalte, SISTRIX 31.10.2026): „konfigurieren“,
  // „Ecksofa“ und „Modulsofa“ in Title und Description („sofa konfigurator“
  // DE 2.150 / AT 250 / CH 150, „modulsofa“ DE 2.300, „modulares sofa“ AT 1.000).
  metaTitle: "Minotti-Sofaplaner: Sofa online konfigurieren | Platzhirsch",
  metaDescription:
    "Minotti-Sofa online konfigurieren: Ecksofa oder Modulsofa aus echten Elementen mit Herstellermaßen im eigenen Grundriss planen. 3D-Vorschau, Preise auf Anfrage.",
  // llms.txt-Zeile (src/lib/seo/sitemap/extraPages.js); beginnt mit leadShort (Test r8-claims).
  llms:
    "Minotti-Sofa aus echten Elementen im eigenen Raum planen: Sofa-Familien von Minotti mit ihren Elementen und Herstellermaßen (Daten: Minotti S.p.A., mit Zustimmung), Laufwege prüfen, 3D-Vorschau. Der Plan ist die Grundlage für das Gespräch im Showroom in Lochau. Unabhängiges Werkzeug von Platzhirsch Home Living, kein Angebot von Minotti; Preise auf Anfrage.",
  summary: "In sechs Schritten vom Minotti-Modell zur eigenen Kombination: Form wählen, Elemente anpassen, Maße im Grundriss prüfen.",
  crossLabel: "Minotti-Sofa zusammenstellen",
  crossText: "Elemente wählen und die Maße im Grundriss prüfen.",
  brandText: "Ihr Minotti-Sofa aus echten Elementen und Herstellermaßen zusammenstellen.",
  unabhaengig: "Der Sofaplaner ist ein unabhängiges Planungswerkzeug von Platzhirsch Home Living und kein Angebot von Minotti.",
});

/** Texte, die von der Datenquelle abhängen (Marke ja/nein). */
export const SOURCE_COPY = MINOTTI_DATA_CONSENT ? MINOTTI : NEUTRAL;

// Kurztexte für die Startseite in allen vier Sprachen (Planer selbst nur
// Deutsch). Gleiche Regel: ohne Zustimmung keine Marke, keine
// „echten Elemente“/Herstellermaße. IT in der Anrede „voi“ (recht P2).
const I18N = Object.freeze({
  neutral: {
    de: { seoName: NEUTRAL.seoName, leadShort: "Ein Sofa aus Modulen im eigenen Raum planen." },
    en: { seoName: "Sofa planner", leadShort: "Plan a sofa from modules in your own room." },
    fr: { seoName: "Planificateur de canapé", leadShort: "Planifier un canapé à partir de modules dans votre pièce." },
    it: { seoName: "Planner divano", leadShort: "Progettate un divano a moduli nel vostro ambiente." },
  },
  minotti: {
    de: { seoName: "Sofaplaner", leadShort: "Ein Minotti-Sofa aus Modulen zusammenstellen." },
    en: { seoName: "Sofa planner", leadShort: "Put together a Minotti sofa from modules." },
    fr: { seoName: "Planificateur de canapé", leadShort: "Composer un canapé Minotti à partir de modules." },
    it: { seoName: "Planner divano", leadShort: "Componete un divano Minotti a partire dai moduli." },
  },
});

/** Kurztexte (seoName, leadShort) je Sprache, abhängig von der Datenquelle. */
export const SOURCE_COPY_I18N = MINOTTI_DATA_CONSENT ? I18N.minotti : I18N.neutral;

/** Kurztexte für eine Sprache (Rückfall Deutsch). */
export function sourceCopyFor(locale) {
  return SOURCE_COPY_I18N[locale] || SOURCE_COPY_I18N.de;
}
