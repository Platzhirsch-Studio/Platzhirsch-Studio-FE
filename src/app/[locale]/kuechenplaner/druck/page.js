// Labs: Küchenplaner – Druckansicht (PDF über den Druckdialog des Browsers).
// DE, EN, FR, IT (seit 01.11.2026; Texte: src/lib/kuechenplaner/copy/, Server-Übersetzer
// kpServerT), nie indexiert. Liest die Planung aus ?k= (gleicher Teilen-Code),
// rendert alles auf dem Server: Zusammenfassung, Grundriss mit Maßketten,
// Wandansichten, Prüfung und Stückliste. Keine Preise ohne Freigabe.
import Link from "next/link";
import { notFound } from "next/navigation";
import { Logo } from "@/components/Brand";
import { PlanSvg, WallElevation, elevationViewWidth, elevationWalls } from "@/components/Labs/Kuechenplaner/Drawings";
import BomTable from "@/components/Labs/Kuechenplaner/BomTable";
import PrintButton from "@/components/Labs/Kuechenplaner/PrintButton";
import { buildKitchen } from "@/components/Labs/Kuechenplaner/geometry";
import { decodePlan, defaultPlan, encodePlan } from "@/components/Labs/Kuechenplaner/planState";
import { summaryLines } from "@/components/Labs/Kuechenplaner/pricing";
import { runChecks } from "@/lib/kuechenplaner/checks";
import { keepTogether as kt } from "@/lib/kuechenplaner/typo";
// Lead-Übergabe: Die Druckansicht ist keine Sackgasse mehr – „Termin mit diesem
// Plan“ (gleicher Vertrag wie im Ergebnis) und ein Link auf GENAU diese Planung,
// der im PDF anklickbar bleibt.
import { handoffHref } from "@/lib/kuechenplaner/handoff";
import { ownCalendarActive } from "@/components/Booking/config";
import { SITE_URL } from "@/lib/seo/pageMetadata";
import styles from "@/components/Labs/Kuechenplaner/Kuechenplaner.module.css";
import { KATALOG_MARKEN, produkteByWelt } from "@/lib/katalog";
import { heuteIso, katalogPreiseAn } from "@/lib/katalog/config";
import { buildGeraeteIndex, geraetHref, gewaehlteGeraete, preisTexteDe } from "@/lib/kuechenplaner/geraete";
import { dealerStatementList } from "@/lib/legal/claims";
import { kpPageCopy } from "@/lib/kuechenplaner/content";
import { kpServerT } from "@/lib/kuechenplaner/copy";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const t = kpServerT(kpPageCopy(locale) ? locale : "de");
  return { title: `${t("Küchenplanung – Druckansicht")} | Platzhirsch Home Living`, robots: { index: false, follow: false } };
}

const DATE_LOCALE = { de: "de-AT", en: "en-GB", fr: "fr-FR", it: "it-IT" };

// UX-Benchmark P2: dieselben Stufen-Namen wie im Reiter „Prüfen“ (CheckPanel.js)
const LEVEL = { error: "Kollision", warn: "Hinweis", hint: "Tipp", ok: "In Ordnung" };

export default async function KuechenplanerDruck({ params, searchParams }) {
  const { locale } = await params;
  if (!kpPageCopy(locale)) notFound();
  const t = kpServerT(locale);
  const { k } = await searchParams;
  const decoded = typeof k === "string" ? decodePlan(k) : null;
  const plan = decoded || defaultPlan("l");
  const kitchen = buildKitchen(plan);
  const checks = runChecks(plan, kitchen);
  const walls = elevationWalls(plan, kitchen);
  // QM r5: Ansichten paarweise nebeneinander (ab lg/Druck), Spaltenbreite ∝ Ansichtsbreite – so
  // haben alle Ansichten denselben Maßstab (vorher war Wand A mit 420 cm kleiner als Wand B mit 330 cm).
  const evW = Object.fromEntries(walls.map((w) => [w, elevationViewWidth(plan, kitchen, w)]));
  const evMax = Math.max(1, ...Object.values(evW));
  const evRows = [];
  for (let i = 0; i < walls.length; i += 2) evRows.push(walls.slice(i, i + 2));
  const date = new Intl.DateTimeFormat(DATE_LOCALE[locale] || "de-AT", { dateStyle: "long", timeZone: "Europe/Vienna" }).format(new Date());
  const back = `/${locale}/kuechenplaner?k=${encodePlan(plan)}`;
  const geraeteIndex = buildGeraeteIndex(produkteByWelt("kuechengeraete"), { heute: heuteIso(), an: katalogPreiseAn(), marken: Object.fromEntries(KATALOG_MARKEN.map((m) => [m.slug, m.name])) });
  const auswahl = gewaehlteGeraete(plan, geraeteIndex);
  // Händlersatz nur über den Claim-Guard (claims.js), nie aus Katalogdaten.
  const haendler = dealerStatementList([...new Set(auswahl.filter((a) => a.g).map((a) => a.g.m))], locale);
  const lines = summaryLines(plan, geraeteIndex);
  // Nur eine echte Planung geht mit (nicht die Beispielplanung ohne gültiges ?k=).
  const planUrl = decoded ? `${SITE_URL}${back}` : "";
  const termin = decoded ? handoffHref({ locale, lines, shareUrl: planUrl, calendar: ownCalendarActive(), t }) : null;

  return (
    <div data-kp-print="" className={`${styles.print} bg-paper text-ink`}>
      {/* QM r3: Raster wie der Seitenkopf (vorher bei 1920 px schmaler, Start x=430 statt 320) */}
      <div className="mx-auto max-w-page px-gutter py-8 print:max-w-none print:p-0">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <Link href={back} className="min-h-11 py-3 text-sm underline underline-offset-4">{t("Zurück zum Planer")}</Link>
          <div className="flex flex-wrap items-center gap-3">
            {termin && (
              <Link href={termin} className="inline-flex min-h-11 items-center border border-ink/30 px-4 text-sm font-medium" data-kp-print-termin="">
                {t("Termin mit diesem Plan")}
              </Link>
            )}
            <PrintButton label={t("Drucken / als PDF speichern")} />
          </div>
        </div>
        {/* QM planer-tools: mobil stand das Logo rechts neben dem Text und lief aus dem Bild (412 px) – dort steht es jetzt darüber. */}
        <div className="flex flex-col-reverse items-start gap-3 border-b border-ink/25 pb-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6 print:flex-row print:items-end print:justify-between print:gap-6">
          <div className="min-w-0">
            <p className="text-overline uppercase text-gold-text">{t("Küchenplanung · Platzhirsch Home Living")}</p>
            <h1 className="font-display mt-1 text-[2rem] leading-tight">{t("Ihre Küche – Planungsübersicht").replace(" – ", "\u00a0– ")}</h1>
            <p className="mt-1 text-sm text-ink-soft">{t("Stand {v} · Vorplanung im Browser, kein Angebot. Maße prüfen wir beim Aufmaß.", { v: date })}</p>
          </div>
          {/* QM r3: am Bildschirm steht das Logo schon im Seitenkopf – nur im Druck */}
          <Logo className="hidden h-7 w-auto shrink-0 print:block" />
        </div>
        {/* Fix 1, P3-2: ohne k ist es schlicht die Beispielplanung, kein Fehler */}
        {!decoded && (typeof k === "string" ? <p className="mt-4 border-l-4 border-notice bg-[#f6efe2] p-3 text-sm text-ink" role="status">{t("Der Link enthielt keine gültige Planung – gezeigt wird die Beispielplanung.")}</p> : <p className="mt-4 text-sm text-ink-soft">{t("Beispielplanung")}</p>)}

        <section className="mt-6 grid items-start gap-6 md:grid-cols-[1fr_1.2fr] print:grid-cols-[1fr_1.2fr]">
          <div>
            <h2 className="text-title">{t("Zusammenfassung")}</h2>
            <ul className="mt-2 space-y-1 text-[0.8125rem] leading-snug">
              {/* Trennpunkt nie am Zeilenanfang (QM planer-tools) */}
              {lines.map((l) => <li key={l}>{kt(t(l))}</li>)}
            </ul>
          </div>
          <div>
            <h2 className="text-title">{t("Grundriss mit Maßen")}</h2>
            <PlanSvg plan={plan} kitchen={kitchen} checks={checks} dims triangle className="mt-2 h-auto max-h-[28rem] w-full border border-ink/10 p-2 print:max-h-none print:p-0" title={t("Grundriss mit Maßketten")} t={t} />
          </div>
        </section>

        {walls.length > 0 && (
          <section className="mt-8 break-inside-avoid">
            <h2 className="text-title">{t("Ansichten")}</h2>
            {/* QM r4: am Bildschirm untereinander bis lg (iPad hoch: nebeneinander abgeschnitten), ab lg zwei Spalten in voller Kartenbreite */}
            <div className="mt-2 flex flex-col gap-4">
              {evRows.map((row) => (
                <div key={row.join("")} className="flex min-w-0 flex-col gap-4 lg:flex-row print:flex-row">
                {row.map((w) => (
                <figure key={w} className="min-w-0 break-inside-avoid border border-ink/10 p-2 lg:[flex:var(--kp-ev)_1_0%] print:[flex:var(--kp-ev)_1_0%]" style={{ "--kp-ev": evW[w] }}>
                  {/* QM r3/r4: Handy – gleiche Höhe (lesbar), breite Wände scrollen; ab sm volle Kartenbreite, nichts abgeschnitten */}
                  <div className="overflow-x-auto focus-visible:outline-2 focus-visible:outline-ink print:overflow-visible" tabIndex={0} role="region" aria-label={w === "i" ? t(plan.shape === "halbinsel" ? "Halbinsel" : "Insel") : t("Wand {w}", { w: w.toUpperCase() })}>
                    <WallElevation plan={plan} kitchen={kitchen} wall={w} className="h-[300px] w-auto max-w-none sm:h-auto sm:max-h-[420px] sm:w-full sm:max-w-full print:h-auto print:max-h-none print:w-full print:max-w-full" t={t} />
                  </div>
                  <figcaption className="mt-1 text-[0.75rem] text-ink-soft">{w === "i" ? t(plan.shape === "halbinsel" ? "Halbinsel" : "Insel") : t("Wand {w}", { w: w.toUpperCase() })}</figcaption>
                </figure>
                ))}
                {/* einzelne Ansicht in der letzten Reihe: Platzhalter hält den Maßstab der Reihe darüber */}
                {row.length === 1 && walls.length > 1 && <div aria-hidden="true" className="hidden lg:block lg:[flex:var(--kp-ev)_1_0%] print:block print:[flex:var(--kp-ev)_1_0%]" style={{ "--kp-ev": evMax }} />}
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="mt-8 break-inside-avoid">
          <h2 className="text-title">{t("Prüfung")}</h2>
          <ul className="mt-2 grid gap-x-6 gap-y-1 text-[0.75rem] leading-snug md:grid-cols-2 print:grid-cols-2">
            {checks.items.map((i) => (
              <li key={i.text}>
                <strong className={i.level === "error" ? "text-error" : i.level === "warn" ? "text-notice" : ""}>{t(LEVEL[i.level])}:</strong> {kt(t(i.text))}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-title">{t("Stückliste")}</h2>
          <div className="mt-2">
            <BomTable plan={plan} kitchen={kitchen} compact geraete={geraeteIndex} t={t} />
          </div>
          <p className="mt-3 text-[0.75rem] text-ink-soft">
            {t("Preise nennen wir persönlich nach Beratung und Aufmaß. Geräte nach Wahl; Nischenmaße laut Herstellerangaben, Geräte ohne Quelle sind als „Maß fehlt“ markiert.")}{" "}
            {t("„Italienische Premiumküche“ ist eine Gestaltungsrichtung, keine Planung eines Herstellers.")}
          </p>
        </section>

        {auswahl.length > 0 && (
          <section className="mt-8 break-inside-avoid" data-kp-geraete-druck="">
            <h2 className="text-title">{t("Ihre Geräteauswahl")}</h2>
            <ul className="mt-2 space-y-1.5 text-[0.75rem] leading-snug">
              {auswahl.map((a) => {
                const pt = a.g ? preisTexteDe(a.g.p) : null;
                const name = a.g ? `${a.g.mn} ${a.g.n}` : a.slug;
                return (
                  <li key={`${a.wall}-${a.i}-${a.slot.art}-${a.slug}`}>
                    <strong>{t(`${a.slot.label}: ${name}`)}</strong>
                    {a.status === "passtNicht" ? <span className="text-notice"> – {t("passt nicht: {x}", { x: t(a.gruende[0]) })}</span> : a.status === "pruefen" ? ` – ${t("Einbaumaß prüfen wir im Gespräch")}` : ""}
                    {pt && <span className="block">{t(pt.lang)}</span>}
                    <span className="block text-ink-soft">platzhirsch.studio{geraetHref(a.slug, locale)}</span>
                  </li>
                );
              })}
            </ul>
            {haendler && <p className="mt-2 text-[0.75rem] text-ink-soft">{haendler}</p>}
          </section>
        )}

        {/* UX-Benchmark P1-6: Ausdruck endet mit dem nächsten Schritt statt nur mit der Adresse */}
        <section className="mt-8 break-inside-avoid border border-ink/25 p-4" data-kp-print-next="">
          <h2 className="text-title">{t("So geht es weiter")}</h2>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-[0.8125rem] leading-snug">
            <li>{t("Termin im Studio in Lochau vereinbaren – telefonisch unter +43 5574 46255 oder online auf platzhirsch.studio.")}</li>
            <li>{t("Diese Übersicht mitbringen, dazu – wenn vorhanden – Grundriss und Fotos des Raums.")}</li>
            <li>{t("Wir prüfen Ihre Planung, messen auf Wunsch vor Ort auf, und Harald Menghin zeichnet Ihr Konzept von Hand.")}</li>
          </ol>
        </section>

        <div className="mt-10 border-t border-ink/25 pt-3 text-[0.75rem] text-ink-soft">
          Platzhirsch Home Living · Landstraße 11 · 6911 Lochau · +43 5574 46255 ·{" "}
          {planUrl ? (
            <a href={planUrl} className="underline underline-offset-2" data-kp-print-plan="">{t("Diese Planung online öffnen")}</a>
          ) : (
            `${t("Planung öffnen:")} platzhirsch.studio/${locale}/kuechenplaner`
          )}
        </div>
      </div>
    </div>
  );
}
