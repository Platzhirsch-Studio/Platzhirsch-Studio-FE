// /de/ezarri/anfrage – Muster, Beratung oder Angebot für Ezarri-Glasmosaik (Team C).
// Einstieg (Vertrag §7.4 Nr. 5): ?art=muster|beratung|angebot&ref=id1,id2&k=<Konfig>
// &m=<Mischung>&fu=<Fuge>&f=<Format>&m2=<Fläche>&r=<Rechner-Query>&projekt=…&quelle=…
// Immer Hilfsseite (noindex über withEzarriRobots utility). Formular:
// src/components/Ezarri/Anfrage/AnfrageForm.js, Route /api/ezarri/anfrage (Dry-Run).
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui";
import { ezarriLocaleEnabled, withEzarriRobots } from "@/lib/ezarri/config";
import { ezRechnerCopy } from "@/lib/ezarri/lang";
import { getGroutList, getMixItems, getReferenceChips, referencesForMix } from "@/lib/ezarri/rechner/palette.server";
import { decodeMix, decodeRechner, fromKonfigurator } from "@/lib/ezarri/rechner/url";
import { poolFlaechen } from "@/lib/ezarri/rechner/flaechen";
import { quantities, formatZahl } from "@/lib/ezarri/rechner/core";
import { PageHead, ezCrumbsFor } from "@/components/Ezarri/Welt/parts";
import { ezarriMetadata } from "@/components/Ezarri/Welt/meta";
import AnfrageForm from "@/components/Ezarri/Anfrage/AnfrageForm";

const PATH = "/ezarri/anfrage";
const FORMAT_LABEL = { 25: "25 mm", 50: "50 mm", hexa: "Hexa" };
const one = (v) => (Array.isArray(v) ? v[0] : v) ?? "";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (!ezarriLocaleEnabled(locale)) return {};
  const { ANFRAGE } = ezRechnerCopy(locale);
  // Anfrage und Bestätigung sind nie im Index (Konzept §6.3).
  return withEzarriRobots(ezarriMetadata({ locale, path: PATH, title: ANFRAGE.metaTitle, description: ANFRAGE.metaDescription }), { utility: true });
}

export default async function AnfragePage({ params, searchParams }) {
  const { locale } = await params;
  if (!ezarriLocaleEnabled(locale)) notFound();
  setRequestLocale(locale);
  const { ANFRAGE } = ezRechnerCopy(locale);
  const sp = await searchParams;
  // Zahlen im Kontext: deutsch mit Komma (formatZahl), englisch mit Punkt.
  const zahl = (n) => formatZahl(n, 2, locale);
  const art = one(sp?.art);
  const kontext = [];
  let m2 = Number.parseFloat(one(sp?.m2).replace(",", ".")) || undefined;
  let mix = decodeMix(one(sp?.m));
  const k = one(sp?.k);
  const rechner = one(sp?.r);
  const fuge = /^[1-7]$/.test(one(sp?.fu)) ? one(sp?.fu) : undefined;
  let format = ["25", "50", "hexa"].includes(one(sp?.f)) ? one(sp?.f) : undefined;
  let zubehoer;

  // Konfigurator-Zustand (Team B): Becken → Fläche, Mischung → Mosaike
  const konf = k ? fromKonfigurator(k) : null;
  if (konf) {
    if (!mix.length) mix = konf.mix;
    const f = poolFlaechen(konf.eingabe);
    const q = quantities({ flaechen: f, margeProzent: f.margeProzent, format: f.format });
    m2 ??= q.m2;
    kontext.push(
      locale === "en"
        ? `${ANFRAGE.kontext.konfigurator}: pool ${zahl(f.werte.l)} × ${zahl(f.werte.b)} m, approx. ${zahl(q.m2)} m²`
        : `${ANFRAGE.kontext.konfigurator}: Becken ${formatZahl(f.werte.l)} × ${formatZahl(f.werte.b)} m, ca. ${formatZahl(q.m2)} m²`
    );
  }
  // Rechner-Query: Fläche nachrechnen, falls nicht mitgegeben
  if (rechner && rechner.length <= 600) {
    const { eingabe, mix: rmix } = decodeRechner(rechner);
    if (!mix.length) mix = rmix;
    const f = poolFlaechen(eingabe);
    // Mit Mischung: gleiche Kartonzahl wie im Rechner (Summe der Einzelkartons)
    const q = quantities({ flaechen: f, margeProzent: f.margeProzent, format: f.format, mix });
    m2 ??= q.m2;
    format ??= f.format;
    kontext.push(`${ANFRAGE.kontext.rechner}: ${zahl(q.m2)} m², ${q.kartons} ${locale === "en" ? "boxes" : "Kartons"} ${f.format === "hexa" ? "Hexa" : `${f.format} mm`}`);
    if (!Object.keys(f.fehler).length) {
      zubehoer = { kleber: q.kgKleber, fuge: q.kgFuge, werkzeug: 1, ...(f.werte.spezial ? { corner: q.lfmCorner, cove: q.lfmCove } : {}) };
    }
  }
  const mixItems = getMixItems(mix.map((x) => x.id));
  if (mixItems.length) {
    const byId = new Map(mixItems.map((x) => [x.id, x]));
    kontext.push(`${ANFRAGE.kontext.customMix}: ${mix.filter((x) => byId.has(x.id)).map((x) => `${byId.get(x.id).name} (${byId.get(x.id).serie}) ${x.anteil} %`).join(", ")}`);
  }
  const fugeName = fuge ? getGroutList().find((g) => g.id === fuge)?.name : undefined;
  if (fugeName || (format && mixItems.length)) {
    kontext.push(ANFRAGE.kontext.fugeFormat(fugeName, format ? FORMAT_LABEL[format] : undefined));
  }
  // Referenzen im Format der Mischung (QM P1-2), sonst 25 mm
  const refIds = [...one(sp?.ref).split(","), ...referencesForMix(mix, format || "25")].filter(Boolean);
  const referenzen = getReferenceChips(refIds);
  const projekt = one(sp?.projekt) || (konf || rechner ? "pool" : undefined);
  const quelle = one(sp?.quelle) || (konf ? "konfigurator" : rechner ? "rechner" : mix.length ? "custom-mix" : "anfrage");
  const crumbs = ezCrumbsFor(locale, { label: ANFRAGE.crumb });

  return (
    <>
      <PageHead crumbs={crumbs} eyebrow={ANFRAGE.eyebrow} title={ANFRAGE.title} lead={ANFRAGE.lead} />
      <Container className="pb-section">
        <div className="max-w-text">
        <AnfrageForm
          art={art}
          referenzen={referenzen}
          m2={m2 ? Math.round(m2 * 100) / 100 : undefined}
          projektart={projekt}
          k={konf ? k : undefined}
          m={mixItems.length ? one(sp?.m) || undefined : undefined}
          rechner={rechner && rechner.length <= 600 ? rechner : undefined}
          fuge={mixItems.length ? fuge : undefined}
          format={mixItems.length || rechner ? format : undefined}
          zubehoer={zubehoer}
          quelle={quelle}
          kontext={kontext}
        />
        </div>
      </Container>
    </>
  );
}
