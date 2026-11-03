// Barrierefreiheit – Kanzlei-Fassung.
// Gliederung nach den Pflichtinhalten aus 04-impressum-pflichtangaben.md,
// Abschnitt 3 (§ 14 Abs 2 BaFG iVm Anlage 3). Seit 02.11.2026 mit den
// belegten Inhalten der Live-Seite /barrierefreiheit (src/lib/legal/
// barrierefreiheit.js: Prüfergebnis, Einschränkungen, Marktüberwachung).
// Offen bleiben nur Angaben, die das Unternehmen (Kleinstunternehmen-Prüfung,
// online abschließbare Dienstleistungen, Antwortfrist) oder die Kanzlei
// (Norm, Schlichtungsstelle) liefert. Nichts ist erfunden.
import { EMAIL, EMAIL_HREF, PHONE_DISPLAY, PHONE_HREF, REGISTER, DOMAIN } from "../company";
import { EINSCHRAENKUNGEN, MARKTUEBERWACHUNG, PRUEFUNG, PRUEFUNG_QM, STAND, UMGESETZT } from "@/lib/legal/barrierefreiheit";

const de = (iso) => iso.split("-").reverse().join(".");
const ergebnis = PRUEFUNG.verstoesse === 0 ? "keine gemeldeten Verstöße" : `${PRUEFUNG.verstoesse} gemeldete Verstöße`;

const BARRIEREFREIHEIT = {
  slug: "barrierefreiheit",
  title: "Barrierefreiheit",
  heading: "Barriere­freiheit",
  navLabel: "Barrierefreiheit",
  livePath: "/barrierefreiheit",
  lead: "Information zur Barrierefreiheit nach § 14 Barrierefreiheitsgesetz (BaFG) in der Gliederung der Pflichtinhalte. Prüfergebnis, bekannte Einschränkungen und Kontaktweg entsprechen der Live-Seite /barrierefreiheit (Stand 02.11.2026).",
  sources: ["Marktresearch/recht/04-impressum-pflichtangaben.md, Abschnitt 3 (BaFG)", "Marktresearch/recht/00-rechtspaket-uebersicht.md, Abschnitt 1 („Was noch fehlt“) und 4.1", "Marktresearch/digital/expertenrat/00-design-bibel.md, § 14", "src/lib/legal/barrierefreiheit.js (Prüfung 30.10.2026, QM 02.11.2026)"],
  version: `Stand: ${de(STAND)} (erstellt 30.10.2026, zuletzt überprüft ${de(PRUEFUNG_QM.datum)})`,
  intro: {
    label: "Muss diese Seite sein?",
    note: [
      "BaFG gilt seit 28.06.2025 für Dienstleistungen im elektronischen Geschäftsverkehr an Verbraucher. Website **ohne** Shop, Bestellung oder Buchung → BaFG gilt nicht; Kontaktformular strittig (strenge Ansicht: erfasst). Die Pflicht kippt mit Gutschein-Shop, Outlet-Kasse, Online-Terminbuchung und Video-Beratung mit Buchung.",
      "Ausnahme für Kleinstunternehmen: < 10 Beschäftigte (Jahresarbeitseinheiten) **und** Jahresumsatz oder Bilanzsumme ≤ 2 Mio. €; maßgeblich ist das Unternehmen, nicht der Shop. [vom Unternehmen auszufüllen: VZÄ-Rechnung, Umsatz, Bilanzsumme] [anwaltlich prüfen: ob die Ausnahme greift]",
      "Ein freiwilliger Hinweis schon heute ist rechtlich unschädlich, solange er nicht mehr behauptet, als getestet ist (UWG).",
    ],
  },
  sections: [
    {
      id: "dienstleistung",
      num: "1",
      title: "Für welche Dienstleistung diese Information gilt",
      source: "§ 14 Abs 2 BaFG iVm Anlage 3 (laut 04, Abschn. 3)",
      blocks: [
        `Diese Information gilt für die Website ${DOMAIN} der ${REGISTER.legalName} („Platzhirsch Home Living“) und die Dienstleistungen, die Sie dort online abschließen können: [vom Unternehmen auszufüllen: z. B. Kauf von Gutscheinen, Reservierung im Atelierverkauf, Online-Terminbuchung – nur was tatsächlich angeboten wird].`,
        "[Beschreibung der Dienstleistung in verständlicher Form: Ablauf, Bezahlung, Bestätigung – vom Unternehmen auszufüllen, sobald der jeweilige Ablauf feststeht]",
      ],
    },
    {
      id: "anforderungen",
      num: "2",
      title: "Wie wir die Anforderungen erfüllen",
      source: "04, Abschn. 3; Design-Bibel § 14",
      blocks: [
        "Wir gestalten diese Website nach den Web Content Accessibility Guidelines (WCAG) 2.2, Stufe AA. [Norm laut Entwurf: EN 301 549 (≈ WCAG 2.1 AA), empfohlen WCAG 2.2 AA – anwaltlich prüfen, welche Norm genannt wird]",
        `**Prüfung:** Letzte automatische Prüfung am ${de(PRUEFUNG.datum)} mit ${PRUEFUNG.werkzeug} ${PRUEFUNG.version} nach den Regeln für ${PRUEFUNG.regeln}, auf ${PRUEFUNG.geraete}; geprüft wurden ${PRUEFUNG.seiten.length} Seiten (Startseite, Produktübersicht, Kontakt, Beratung, Über uns, Datenschutz, Impressum, Ratgeber). Ergebnis: ${ergebnis} (Beleg: ${PRUEFUNG.beleg}). Am ${de(PRUEFUNG_QM.datum)} zusätzlich ${PRUEFUNG_QM.was}, automatisiert in ${PRUEFUNG_QM.browser}; noch nicht geprüft: ${PRUEFUNG_QM.nichtGeprueft} (Beleg: ${PRUEFUNG_QM.beleg}). Eine Prüfung von Hand mit Tastatur oder Screenreader ist nicht dokumentiert und wird nicht behauptet.`,
        { ul: UMGESETZT.map((u) => `Umgesetzt: ${u}`) },
      ],
    },
    {
      id: "nicht-barrierefrei",
      num: "3",
      title: "Was noch nicht barrierefrei ist",
      source: "04, Abschn. 3",
      blocks: [
        { ul: [...EINSCHRAENKUNGEN] },
        { note: "Beruft sich das Unternehmen auf eine unverhältnismäßige Belastung (§ 14 BaFG), ist das zu dokumentieren und alle 5 Jahre neu zu bewerten. Die Einschränkungen oben sind Tatsachen aus den Prüfungen, keine Berufung auf eine Belastung." },
      ],
    },
    {
      id: "barriere-melden",
      num: "4",
      title: "Barriere melden",
      source: "04, Abschn. 3 („Kontakt für Barrieren“)",
      blocks: [
        "Wenn Sie auf unserer Website auf eine Barriere stoßen oder Inhalte in einer anderen Form brauchen, schreiben Sie uns oder rufen Sie an:",
        { address: [`E-Mail: [${EMAIL}](${EMAIL_HREF})`, `Telefon: [${PHONE_DISPLAY}](${PHONE_HREF})`] },
        "[vom Unternehmen festzulegen: zuständige Person, Antwortfrist, ob eine eigene Adresse für Barrieren eingerichtet wird]",
        "Diese Information erhalten Sie auf Wunsch auch schriftlich oder mündlich.",
      ],
    },
    {
      id: "marktueberwachung",
      num: "5",
      title: "Marktüberwachung",
      source: "04, Abschn. 3",
      blocks: [
        `Für die Marktüberwachung nach dem Barrierefreiheitsgesetz ist in Österreich das **${MARKTUEBERWACHUNG.name}** zuständig (<${MARKTUEBERWACHUNG.url}>). [anwaltlich prüfen: ob auch eine Schlichtungs- oder Beschwerdestelle genannt werden muss]`,
        { note: "Nichtkonformität ist dem Sozialministeriumservice zu melden (§ 14 Abs 4 BaFG). Die Information muss in den AGB oder auf andere deutlich wahrnehmbare Weise bereitgestellt werden, barrierefrei, solange die Dienstleistung angeboten wird. Bauvorgabe: eigene Seite `/barrierefreiheit`, Footer-Link neben Impressum und Datenschutz." },
      ],
    },
  ],
};

export default BARRIEREFREIHEIT;
