// Prototyp „Die Linie wird Raum“ – Texte (nur Deutsch, nur Server).
//
// Regel (Auftrag 31.10.2026): keine neuen Behauptungen, keine Superlative.
// Alles, was über das Studio gesagt wird, stammt aus dem Namespace HomePage
// der Messages (Startseite) oder aus dem Claim-Guard (src/lib/legal/claims.js).
// Neu formuliert sind nur Sätze ÜBER diese Seite selbst (was sie zeigt, dass
// das Bild eine Illustration ist, wie das Licht berechnet wird).
import { getTranslations } from "next-intl/server";
import { dealerStatementList, dealerStudio } from "@/lib/legal/claims";
import { featuredBrands } from "@/lib/content/brands";
import { productsPath } from "@/utils/routing";
import { WOW_PHASE } from "@/lib/wow/config";

export const BASE = "/preview/unikat";

export async function unikatCopy() {
  const t = await getTranslations({ locale: "de", namespace: "HomePage" });
  const minotti = dealerStudio("minotti", "de");
  // Belegter Satz aus dem Claim-Guard (kein eigener Wortlaut): „Vertragshändler von ClassiCon und Ezarri“
  const belegt = dealerStatementList(["classicon", "ezarri"], "de").replace(/^Platzhirsch Home Living ist /, "").replace(/\.$/, "");
  return {
    hero: {
      // Minotti nur im belegten Wortlaut des Claim-Registers (Inhaber-Entscheidung Nr. 22)
      pill: `Platzhirsch Home Living · Lochau am Bodensee${minotti ? " · Minotti Studio by Platzhirsch Home Living" : ""}`,
      kicker: t("hero.title"),
      title: ["Erst die Linie.", "Dann Ihr Raum."],
      lead: t("hero.lead"),
      cta: t("hero.cta"),
      secondary: t("hero.secondary"),
      imageAlt: t("hero.imageAlt"),
      trust: [
        ...(minotti ? [minotti.title] : []),
        ...(belegt ? [belegt.charAt(0).toUpperCase() + belegt.slice(1)] : []),
        "Ausstellung und Café im selben Haus",
        "Website in 4 Sprachen",
      ],
    },
    stage: {
      overline: "Das Unikat · Unsere Arbeitsweise",
      title: ["Die Linie", "wird Raum."],
      lead: "Vom ersten Strich bis zum Raum: Harald Menghins Arbeitsweise in fünf Stufen. Scrollen Sie, die Seite zeichnet mit.",
      hint: "Scrollen Sie: Die Linie zeichnet weiter.",
      skip: "Verwandlung überspringen",
      steps: [
        {
          id: "linie",
          n: "01",
          name: "Linie",
          title: "Am Anfang steht ein Strich.",
          text: t("process.title"),
        },
        {
          id: "skizze",
          n: "02",
          name: t("process.steps.s3.name"),
          title: "Grundriss, Perspektive, Stimmung.",
          text: t("process.steps.s3.text"),
          // WOW_PHASE "A": abstrahierte Grafik. "B" (echte Striche von Harald
          // Menghin, nur mit Zustimmung) ändert hier nur den Hinweis – die
          // Striche selbst kämen dann aus public/wow/strokes-harald.json.
          caption: WOW_PHASE === "B" ? "Zeichnung: Harald Menghin" : null, // Inhaber 31.10.2026: kein Hinweistext
        },
        {
          id: "modell",
          n: "03",
          name: t("process.steps.s4.name"),
          title: "Die Zeichnung steht auf.",
          text: t("process.steps.s4.text"),
          caption: null, // Inhaber 31.10.2026: kein Hinweistext
        },
        {
          id: "raum",
          n: "04",
          name: "Raum",
          title: "Vom Modell zum Raum.",
          text: t("process.lead"),
          caption: "Foto: Blick in die Ausstellung in Lochau",
        },
        {
          id: "licht",
          n: "05",
          name: "Bodensee-Licht",
          title: "Das Licht von jetzt, in Lochau.",
          text: "Diese Seite rechnet den Sonnenstand über Lochau zur Uhrzeit Ihres Besuchs und tönt Papier, Fenster und Modell danach. Ohne Ortung, ohne Datenübertragung: Die Rechnung läuft in Ihrem Browser.",
          link: { href: "/bodensee-licht", label: "Bodensee-Licht für Ihren Raum" },
        },
      ],
      imageAlt: t("hero.imageAlt"),
    },
    brands: {
      eyebrow: t("brands.eyebrow"),
      title: t("brands.title"),
      lead: t("brands.lead"),
      note: t("brands.note"),
      all: t("brands.allShort"),
      studio: minotti
        ? { title: minotti.title, statement: minotti.statement, evidenceUrl: minotti.showEvidenceLink ? minotti.evidenceUrl : null, href: "/ueber-uns/marken/minotti" }
        : null,
      list: featuredBrands("de").filter((b) => b.slug !== "minotti"),
    },
    worlds: {
      eyebrow: "Welten",
      title: t("rooms.title"),
      items: [
        { id: "wohnen", title: t("rooms.living.title"), text: t("rooms.living.text"), href: productsPath("de", "sofas-couches") },
        { id: "kueche", title: t("rooms.kitchen.title"), text: t("rooms.kitchen.text"), href: "/kuechen-vorarlberg" },
        // Wortlaut nach src/components/BadWellness/badWellnessCopy.js (lead)
        { id: "bad", title: "Bad & Wellness", text: "Bad, Sauna und Wellness planen wir wie jeden anderen Raum: zuerst von Hand, dann in 3D.", href: "/bad-wellness" },
        // Wortlaut nach Messages Katalog accessoires.produkteLead
        { id: "accessoires", title: "Accessoires", text: "Duftkerzen, Raumdüfte, Diffuser und Accessoires unserer Hersteller.", href: "/accessoires/produkte" },
      ],
    },
    house: {
      eyebrow: t("house.eyebrow"),
      title: t("house.title"),
      text: t("house.text"),
      hoursTitle: t("house.hoursTitle"),
      rows: [
        [t("house.days.tueFri"), t("house.times.tueFri")],
        [t("house.days.sat"), t("house.times.sat")],
        [t("house.days.sunMon"), t("house.times.closed")],
      ],
      note: t("house.note"),
      addressTitle: t("house.addressTitle"),
      route: t("house.route"),
      call: t("house.call"),
    },
    cta: {
      eyebrow: t("cta.eyebrow"),
      title: t("cta.title"),
      text: t("cta.text"),
      primary: t("cta.primary"),
      phone: t("cta.phone", { phone: "+43 5574 46255" }),
    },
  };
}
