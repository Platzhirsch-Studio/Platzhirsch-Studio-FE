// /de/ezarri/konfigurator/blatt?k=… – Druckblatt / PDF des Entwurfs (Team B, Konzept §4.1).
// Ohne Formular, ohne Anmeldung („PDF ohne Lead-Gate“): Bild der Ansicht (Standbild
// aus dem Konfigurator bzw. 2D-Draufsicht), Becken, Mosaike mit Anteilen und Codes,
// Fuge, Format, Kanäle, Spezialteile, Mengen (Ezarri-Faktoren), QR-Code zum Link,
// Quellenangabe. Keine Preise. Speichern als PDF über den Druckdialog des Browsers.
// Nie indexiert (utility).
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import QRCode from "qrcode";
import { Container } from "@/components/ui";
import SmartLink from "@/components/ui/SmartLink";
import { ezarriCredit } from "@/lib/ezarri/config";
// 01.11.2026: DE/EN/FR/IT (FR/IT-Texte vom Server, copy-intl.js).
import { toolLocaleEnabled } from "@/lib/ezarri/konfigurator/intl";
import { konfCopy, toolCopy } from "@/lib/ezarri/konfigurator/copy-intl";
import { toolMetadata } from "@/lib/ezarri/konfigurator/seo";
import { ToolCopyProvider } from "@/components/Ezarri/Konfigurator/ToolCopy";
import { decodeState, DEFAULT_STATE, sanitizeState } from "@/lib/ezarri/konfigurator/state";
import { areas, treppeFuerForm } from "@/lib/ezarri/konfigurator/geometry";
import { getKonfiguratorKatalog, isKnownMosaic, katalogFuer } from "@/lib/ezarri/konfigurator/katalog";
import { buildIndex } from "@/lib/ezarri/konfigurator/katalog-index";
import { quantities, formatZahl } from "@/lib/ezarri/rechner/core";
import { facetsFor } from "@/lib/ezarri/facets";
// Druck 02.11.: Fotoansicht (vorgerendertes Beispielbecken) kommt bei Einzelfarben mit aufs Blatt
import { FOTO_CAPTION, FOTO_DEKOR_HINWEIS, fotoansicht, istDekor, renderFuer, renderSrc } from "@/lib/ezarri/konfigurator/renders";
import { ADDRESS, EMAIL, PHONE_DISPLAY, SITE_URL } from "@/lib/site";
import BlattBild, { DruckenKnopf } from "@/components/Ezarri/Konfigurator/BlattBild";

const one = (v) => (Array.isArray(v) ? v[0] : v);

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (!toolLocaleEnabled(locale)) return {};
  const { t } = konfCopy(locale);
  return toolMetadata({
    locale,
    path: "/ezarri/konfigurator/blatt",
    title: t("Druckblatt Becken-Entwurf", "Print sheet: pool design"),
    description: t("Ihr Entwurf aus dem Ezarri-Konfigurator zum Drucken oder Speichern als PDF.", "Your design from the Ezarri configurator to print or save as PDF."),
    utility: true,
  });
}

export default async function BlattPage({ params, searchParams }) {
  const { locale } = await params;
  if (!toolLocaleEnabled(locale)) notFound();
  setRequestLocale(locale);
  const { FORM_LABEL, FORMAT_LABEL, LAGE_LABEL, LED_LABEL, RAND_LABEL, SEITE, SZENEN_LABEL, TREPPE_LABEL, WASSER_LABEL, WASSERTON_LABEL, ZEIT_LABEL, LISTEN: X, lang, t } = konfCopy(locale);
  const en = lang === "en";
  const intl = toolCopy(locale);
  // Zahlen je Sprache (deutsch Komma, englisch Punkt).
  const m = (v) => (en ? String(v) : String(v).replace(".", ","));
  const zahl = (v, d) => formatZahl(v, d, locale);
  const qm = (v) => `${zahl(v, 2)} m²`;
  const wfText = (vals) =>
    vals
      .map((v) => {
        const w = facetsFor(locale).WASSERWIRKUNG.find((x) => x.value === v);
        return (w && X?.wasserwirkung?.[w.id]) ?? w?.label ?? v;
      })
      .join(", ");
  const sp = await searchParams;
  const k = one(sp?.k);
  const state = (typeof k === "string" && decodeState(k, { isKnown: isKnownMosaic })) || sanitizeState(DEFAULT_STATE);
  const katalog = getKonfiguratorKatalog();
  const index = buildIndex(katalog);
  const flaechen = areas(state.becken, state.szene);
  const mengen = quantities({ flaechen, margeProzent: 10, format: state.format, mix: state.mix });
  const fuge = index.fuge(state.fuge);
  const link = `${SITE_URL}/${lang}/ezarri/konfigurator?k=${typeof k === "string" ? k : ""}`;
  const qr = await QRCode.toString(link, { type: "svg", margin: 1, errorCorrectionLevel: "L", color: { dark: "#30373e", light: "#ffffff" } });
  const b = state.becken;
  const pool = state.szene === "pool" || state.szene === "whirlpool";
  const mosaike = state.modus === "pattern" && state.pattern ? state.pattern.ids.map((id) => ({ id, anteil: null })) : state.mix;
  // Rezept nach Produktfoto (unvollständig/widersprüchlich): auf dem Blatt kennzeichnen (QM R2 P3)
  const fotoRezept = state.modus === "rezept" && state.mix.length === 1 ? (katalog.rezepte || []).find((r) => r.unvollstaendig && r.mix[0]?.id === state.mix[0].id) : null;
  const datum = new Intl.DateTimeFormat(X?.datum ?? (en ? "en-GB" : "de-AT"), { dateStyle: "long", timeZone: "Europe/Vienna" }).format(new Date());
  const corner = state.spezial.cornerId ? index.byId.get(state.spezial.cornerId) : index.spezialFuer(state.mix[0]?.id, "corner");
  const cove = state.spezial.coveId ? index.byId.get(state.spezial.coveId) : index.spezialFuer(state.mix[0]?.id, "cove");
  // Druck 02.11.: Fotoansicht (Einzelfarbe, 25 mm, Standardfuge, Pool) als großes Bild mit Pflichtunterschrift;
  // das Standbild des eigenen Beckens rückt dann klein daneben. Licht wie im Entwurf (Abend → Abend-Render).
  const fotoRef = state.mix.length === 1 ? index.resolveRef(state.mix[0].id, state.format, { ref: state.mix[0].ref }) : null;
  const fotoInfo = fotoansicht(state, fotoRef);
  const fotoRender = fotoInfo.ok ? renderFuer(fotoInfo.refId, "hero", state.zeit === "abend" || state.zeit === "nacht" ? "abend" : "morgen", fotoRef?.kol) : null;
  const foto = fotoRender
    ? {
        src: renderSrc(fotoRender),
        caption: `${X?.fotoCaption ?? (en ? FOTO_CAPTION.en : FOTO_CAPTION.de)} · ${t("Beispielbecken 8 × 4 m, nicht Ihre Maße", "8 × 4 m example pool, not your dimensions")}${istDekor(fotoRender) ? ` · ${X?.fotoDekorHinweis ?? (en ? FOTO_DEKOR_HINWEIS.en : FOTO_DEKOR_HINWEIS.de)}` : ""}`,
        alt: t(`Visualisierung: Beispielbecken 8 × 4 m mit ${fotoRef?.name || ""}`, `Visualisation: 8 × 4 m example pool with ${fotoRef?.name || ""}`, "blatt.fotoAlt", { name: fotoRef?.name || "" }),
      }
    : null;
  // Druck 02.11.: Fußzeile „Seite x / y“ über @page-Randfelder (Chromium ab 131, Safari/Firefox ignorieren sie).
  const fuss = `Platzhirsch Home Living · ${t("Becken-Entwurf", "Pool design")} · ${t("Stand", "As of")} ${datum}`.replace(/["\\]/g, "");
  const seite = t("Seite", "Page");
  const von = t("von", "of");

  const beckenRows = [
    [t("Szene", "Scene"), SZENEN_LABEL[state.szene]],
    ...(pool || state.szene === "bad" ? [[t("Form", "Shape"), FORM_LABEL[b.form]]] : []),
    ...(state.szene === "pool" ? [[t("Maße", "Dimensions"), t(`${m(b.l)} × ${m(b.b)} m, Tiefe ${m(b.tFlach)} bis ${m(b.tTief)} m`, `${m(b.l)} × ${m(b.b)} m, depth ${m(b.tFlach)} to ${m(b.tTief)} m`, "blatt.massePool", { l: m(b.l), b: m(b.b), tf: m(b.tFlach), tt: m(b.tTief) })]] : []),
    ...(state.szene === "whirlpool" ? [[t("Maße", "Dimensions"), t(`${m(b.l)} m, Tiefe ${m(b.tTief)} m`, `${m(b.l)} m, depth ${m(b.tTief)} m`, "blatt.masseWhirl", { l: m(b.l), tt: m(b.tTief) })]] : []),
    ...(state.szene === "bad" ? [[t("Maße", "Dimensions"), t(`${m(b.l)} × ${m(b.b)} m, Fliesenhöhe ${m(b.tTief)} m`, `${m(b.l)} × ${m(b.b)} m, tiling height ${m(b.tTief)} m`, "blatt.masseBad", { l: m(b.l), b: m(b.b), tt: m(b.tTief) })]] : []),
    ...(state.szene === "kueche" ? [[t("Maße", "Dimensions"), `${m(b.l)} × ${m(b.tTief)} m`]] : []),
    ...(state.szene === "pool" ? [[t("Treppe", "Steps"), TREPPE_LABEL[treppeFuerForm(b)]], [t("Sitzbank", "Bench"), b.bank ? t("ja", "yes") : t("nein", "no")], [t("Rand", "Edge"), RAND_LABEL[b.rand].label]] : []),
    ...(pool ? [[t("Wasser", "Water"), `${WASSER_LABEL[state.wasser]}, ${WASSERTON_LABEL[state.wasserton].label}`], [t("Licht", "Light"), `${ZEIT_LABEL[state.zeit]}, LED ${LED_LABEL[state.led]}`]] : []),
  ];

  return (
    <div className="bg-surface text-text print:bg-white" data-ezk-blatt="" lang={lang}>
    <ToolCopyProvider value={intl ? { lang: intl.lang, KONF: intl.KONF } : null}>
      {/* Druck 02.11.: 10 pt statt 11 pt und engere Zeilen, damit der übliche Entwurf auf EINE Seite passt;
          Fußzeile mit Seite x/y; body ohne Cookie-Polster und ohne Papierton (vorher leere beige Fläche am Ende). */}
      <style>{`@media print {
        @page { size: A4; margin: 14mm 14mm 16mm;
          @bottom-left { content: "${fuss}"; font: 8pt var(--font-sans), sans-serif; color: #666; vertical-align: top; padding-top: 3mm; }
          @bottom-right { content: "${seite} " counter(page) " ${von} " counter(pages); font: 8pt var(--font-sans), sans-serif; color: #666; vertical-align: top; padding-top: 3mm; } }
        body header, body footer, body nav, [data-print-hide], [data-concierge-launcher], [data-concierge-tab], [data-consent-bar] { display: none !important; }
        body, main { background: #fff !important; padding: 0 !important; margin: 0 !important; min-height: 0 !important; }
        [data-ezk-blatt] { font-size: 10pt; line-height: 1.35; }
        [data-ezk-blatt] h2 { font-size: 12pt; }
        [data-ezk-blatt] .text-ui { font-size: 10pt; line-height: 1.3; }
        [data-ezk-blatt] .text-small { font-size: 8pt; line-height: 1.3; }
        [data-ezk-blatt] dl > div, [data-ezk-blatt] td, [data-ezk-blatt] th { padding-top: 2.5pt; padding-bottom: 2.5pt; }
        [data-ezk-blatt] section, [data-ezk-blatt] figure, [data-ezk-blatt] tr { break-inside: avoid; }
      }`}</style>
      <Container className="py-8 print:max-w-none print:px-0 print:py-0">
        <div className="mb-6 flex flex-wrap items-center gap-3 print:hidden" data-print-hide="">
          <DruckenKnopf />
          <SmartLink href={`/ezarri/konfigurator?k=${typeof k === "string" ? k : ""}`} className="inline-flex min-h-12 items-center border border-ink px-5 text-ui hover:bg-ink hover:text-paper">
            {t("Zurück zum Konfigurator", "Back to the configurator")}
          </SmartLink>
        </div>

        <div className="flex items-start justify-between gap-6 border-b border-line pb-4">
          <div>
            <p className="text-overline uppercase text-text-accent">Platzhirsch Home Living · {t("Ezarri-Konfigurator", "Ezarri configurator")}</p>
            <h1 className="mt-2 font-display text-display-m">{t("Ihr Becken-Entwurf", "Your pool design")}</h1>
            <p className="mt-1 text-small text-text-soft">{t("Stand", "As of")} {datum} · {t("ohne Preise", "without prices")} · {SEITE.hinweisDaten}</p>
          </div>
          <figure className="m-0 w-28 shrink-0 text-center">
            <div className="[&>svg]:h-auto [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: qr }} aria-hidden="true" />
            <figcaption className="text-[0.75rem] leading-tight text-text-soft">{t("Entwurf öffnen", "Open design")}</figcaption>
          </figure>
        </div>

        <BlattBild k={typeof k === "string" ? k : ""} state={state} katalog={katalogFuer(state)} foto={foto} />

        <div className="mt-6 grid gap-8 md:grid-cols-2 print:mt-4 print:grid-cols-2 print:gap-6">
          <section aria-labelledby="bl-becken">
            <h2 id="bl-becken" className="text-title">
              {t("Fläche", "Area")}
            </h2>
            <dl className="mt-2 text-ui">
              {beckenRows.map(([dt, dd]) => (
                <div key={dt} className="grid grid-cols-[9rem_1fr] border-b border-line py-1.5">
                  <dt className="text-text-soft">{dt}</dt>
                  <dd>{dd}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section aria-labelledby="bl-mosaik">
            <h2 id="bl-mosaik" className="text-title">
              {t("Mosaik", "Mosaic")}
            </h2>
            <table className="mt-2 w-full border-collapse text-ui">
              <thead>
                <tr className="border-b border-line text-left text-small text-text-soft">
                  <th className="py-1.5 font-normal">{t("Mosaik", "Mosaic")}</th>
                  {/* PDF-Muster 02.11.2026: Spaltenabstand – „KollektionAnteil“ stand im Druck zusammengeschoben */}
                  <th className="py-1.5 pl-3 font-normal">{t("Kollektion", "Collection")}</th>
                  <th className="py-1.5 pl-3 text-right font-normal">{t("Anteil", "Share")}</th>
                </tr>
              </thead>
              <tbody>
                {mosaike.map((e, i) => {
                  const r = index.resolveRef(e.id, state.format, { ref: e.ref });
                  return (
                    <tr key={`${e.id}-${i}`} className="border-b border-line">
                      <td className="py-1.5">
                        {index.label(e.id)}
                        {r?.safe ? <span className="text-small text-text-soft"> · {t("Safe (rutschhemmend)", "Safe (slip-resistant)")}</span> : null}
                        {fotoRezept ? <span className="block text-small text-text-soft">{t("Darstellung nach Produktfoto", "Shown from the product photo")} ({fotoRezept.fehlend?.[0] === "Anteile" ? t("Rezeptangaben von Ezarri widersprüchlich", "Ezarri's recipe details contradictory") : t("Rezept unvollständig", "recipe incomplete")})</span> : null}
                        {r?.wf?.length ? <span className="block text-small text-text-soft">{t("Wasserwirkung laut Ezarri", "Water effect according to Ezarri")}: {wfText(r.wf)}</span> : null}
                      </td>
                      <td className="py-1.5 pl-3">{index.kollektion(r?.kol)}</td>
                      <td className="py-1.5 pl-3 text-right tabular-nums">{e.anteil != null ? `${e.anteil} %` : `${t("Kanal", "Channel")} ${i + 1}`}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <dl className="mt-3 text-ui">
              <div className="grid grid-cols-[9rem_1fr] border-b border-line py-1.5">
                <dt className="text-text-soft">{t("Format", "Format")}</dt>
                <dd>{FORMAT_LABEL[state.format]}</dd>
              </div>
              <div className="grid grid-cols-[9rem_1fr] border-b border-line py-1.5">
                <dt className="text-text-soft">{t("Fuge", "Grout")}</dt>
                <dd>{fuge?.name}</dd>
              </div>
              {state.kanaele.map((kn, i) => (
                <div key={i} className="grid grid-cols-[9rem_1fr] border-b border-line py-1.5">
                  <dt className="text-text-soft">{t("Streifen", "Band")} {i + 1}</dt>
                  <dd>
                    {index.label(kn.id)} · {LAGE_LABEL[kn.lage]} · {kn.breite} cm
                  </dd>
                </div>
              ))}
              {state.spezial.corner && (
                <div className="grid grid-cols-[9rem_1fr] border-b border-line py-1.5">
                  <dt className="text-text-soft">Corner</dt>
                  <dd>{corner?.name || t("passendes Teil wählen wir mit Ihnen", "we choose a suitable piece with you")}</dd>
                </div>
              )}
              {state.spezial.cove && (
                <div className="grid grid-cols-[9rem_1fr] border-b border-line py-1.5">
                  <dt className="text-text-soft">Cove</dt>
                  <dd>{cove?.name || t("passendes Teil wählen wir mit Ihnen", "we choose a suitable piece with you")}</dd>
                </div>
              )}
            </dl>
          </section>
        </div>

        <section aria-labelledby="bl-mengen" className="mt-8 break-inside-avoid print:mt-5">
          <h2 id="bl-mengen" className="text-title">
            {t("Mengen (Schätzung)", "Quantities (estimate)")}
          </h2>
          {/* Druck 02.11.: Mengen im Druck zweispaltig (zwei Tabellen; am Bildschirm untereinander = eine Tabelle) */}
          {(() => {
            const rows = [
                [t("Fläche netto", "Net area"), qm(mengen.netto)],
                [t(`mit ${mengen.margeProzent} % Reserve`, `with ${mengen.margeProzent} % reserve`, "reserve", { p: mengen.margeProzent }), qm(mengen.mitMarge)],
                [t("Bestellmenge (volle Kartons)", "Order quantity (full boxes)"), t(`${qm(mengen.m2)} · ${mengen.kartons} Kartons · ${mengen.blaetter} Blätter`, `${qm(mengen.m2)} · ${mengen.kartons} boxes · ${mengen.blaetter} sheets`, "blatt.menge", { m2: qm(mengen.m2), k: mengen.kartons, b: mengen.blaetter })],
                [t("Gewicht Mosaik ca.", "Mosaic weight approx."), `${zahl(mengen.kgMosaik, 0)} kg`],
                [t("Kleber laut Ezarri", "Adhesive according to Ezarri"), `${zahl(mengen.kgKleber, 0)} kg`],
                [t("Fugenmasse laut Ezarri", "Grout according to Ezarri"), `${zahl(mengen.kgFuge, 0)} kg`],
                ...(state.spezial.corner ? [["Corner", `${zahl(mengen.lfmCorner, 1)} ${t("lfm", "running m")}`]] : []),
                ...(state.spezial.cove ? [["Cove", `${zahl(mengen.lfmCove, 1)} ${t("lfm", "running m")}`]] : []),
                ...(mengen.mischung.length > 1 ? mengen.mischung.map((x) => [t(`davon ${index.label(x.id)} (${x.anteil} %)`, `of which ${index.label(x.id)} (${x.anteil} %)`, "blatt.davon", { name: index.label(x.id), p: x.anteil }), `${x.kartons} ${t("Kartons", "boxes")}`]) : []),
            ];
            const half = Math.ceil(rows.length / 2);
            const tabelle = (teil) => (
              <table className="w-full border-collapse text-ui">
                <tbody>
                  {teil.map(([k2, v]) => (
                    <tr key={k2} className="border-b border-line">
                      <th scope="row" className="py-1.5 pr-3 text-left font-normal text-text-soft">
                        {k2}
                      </th>
                      <td className="py-1.5 text-right tabular-nums">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            );
            return (
              <div className="mt-2 grid print:grid-cols-2 print:gap-x-6">
                {tabelle(rows.slice(0, half))}
                {tabelle(rows.slice(half))}
              </div>
            );
          })()}
        </section>

        <div className="mt-8 grid gap-4 border-t border-line pt-4 text-small text-text-soft md:grid-cols-2 print:mt-5 print:grid-cols-2 print:pt-3">
          <p>
            {SEITE.hinweisFarbe} {SEITE.hinweisVerlegung} {t("Preise nennen wir auf Anfrage.", "Prices on request.")}
          </p>
          <p>
            Platzhirsch Home Living, {ADDRESS.street}, {ADDRESS.postalCode} {ADDRESS.city} · {PHONE_DISPLAY} · {EMAIL}
            <br />
            {ezarriCredit("daten", locale)} · {ezarriCredit("bild", locale)} · {t("Steinfarben gemessen aus Ezarri-Produktbildern · Stand 28.10.2026", "tile colours measured from Ezarri product images · as of 28.10.2026")}
          </p>
        </div>
      </Container>
    </ToolCopyProvider>
    </div>
  );
}
