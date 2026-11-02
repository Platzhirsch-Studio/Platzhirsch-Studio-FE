// Sofaplaner – Häufige Fragen (Deutsch), sichtbar auf /de/sofaplaner und als
// FAQPage-JSON-LD aus DENSELBEN Einträgen (src/lib/seo/faqSchema.js; Google:
// Markup nur für sichtbaren Inhalt). Sofaplaner-Team seo-inhalte, 31.10.2026.
//
// Jede Antwort stützt sich auf Aussagen, die schon auf der Seite oder in
// consent.js stehen (keine Preise, Datenquelle, Unabhängigkeit, Laufwege aus
// model.js, Handzeichnung aus HandBridge). Ohne MINOTTI_DATA_CONSENT nennt
// keine Antwort die Marke. Reine Daten, kein '@/'-Alias (node --test).
import { SOURCE_COPY } from "../consent.js";

/** Ratgeber-Artikel rund ums Sofa; verlinkt werden nur freigegebene (getIndexableRatgeber). */
export const SOFA_RATGEBER_SLUGS = Object.freeze(["was-kostet-ein-minotti-sofa", "sofa-probesitzen-worauf-achten", "designsofa-kaufen-checkliste"]);

/**
 * @param {{walkMin: number, walkIdeal: number}} o  Laufwege in cm (WALKWAY_MIN/WALKWAY_IDEAL aus model.js)
 * @returns {{q: string, a: string}[]}
 */
export function sofaFaqDe({ walkMin, walkIdeal }) {
  const brand = SOURCE_COPY.brand;
  return [
    brand
      ? {
          q: "Was kostet ein Minotti-Sofa, das ich im Sofaplaner plane?",
          a: "Der Sofaplaner zeigt keine Preise. Der Preis eines Minotti-Sofas hängt vor allem von Modell, Breite, Zahl der Elemente und Bezug ab. Wir nennen ihn auf Anfrage, im Gespräch oder im Showroom in Lochau.",
        }
      : {
          q: "Zeigt der Sofaplaner Preise?",
          a: "Nein. Der Preis hängt vom konkreten Modell, von der Zahl der Elemente und vom Bezug ab. Wir nennen ihn auf Anfrage, im Gespräch oder im Showroom in Lochau.",
        },
    brand
      ? {
          q: "Woher stammen die Maße der Elemente?",
          a: "Aus den Unterlagen von Minotti – Produktseiten und technische Datenblätter –, mit Zustimmung von Minotti. Fehlende Maße sind im Planer markiert und werden im Showroom bestätigt.",
        }
      : {
          q: "Welche Maße verwendet der Sofaplaner?",
          a: "Eigene Planungsgrößen in Rastermaßen, kein bestimmtes Herstellermodell. Die genauen Maße des gewählten Modells bestätigen wir im Showroom.",
        },
    {
      q: brand ? "Ist der Sofaplaner ein Angebot von Minotti?" : "Wer bietet den Sofaplaner an?",
      a: `${SOURCE_COPY.unabhaengig} Sie können ihn kostenlos im Browser nutzen.`,
    },
    {
      q: "Wie viel Platz sollte vor dem Sofa frei bleiben?",
      a: `Planen Sie ${walkMin}–${walkIdeal} cm Laufweg vor dem Sofa und zwischen den Möbeln ein, für Hauptwege zu Türen eher ${walkIdeal} cm und mehr. Im Grundriss des Planers sehen Sie, ob die Laufwege reichen.`,
    },
    {
      q: "Wie geht es nach der Online-Planung weiter?",
      a: "Ihr Plan ist die Grundlage für das Gespräch im Showroom in Lochau, mit Stoffmustern und Probesitzen. Danach zeichnet Harald Menghin Ihr Konzept von Hand; erst dann folgen 3D-Planung und fotorealistisches Rendering.",
    },
  ];
}
