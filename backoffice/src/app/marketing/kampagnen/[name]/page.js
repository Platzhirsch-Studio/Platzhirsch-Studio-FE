// /marketing/kampagnen/[name] – Kampagnen-Akte (10-konzept-marketing § 2.7, T5): Übersicht · Kennzahlen · Anfragen · Auswertung.
// Anfragen werden beim Öffnen gezählt (kein Knopf „Anfragen zählen“), „Stand hh:mm“ neben der Zahl.
import { notFound } from "next/navigation";
import Link from "next/link";
import Kachel from "@/components/Backoffice/Kachel";
import { AkteKopf, AkteTabs } from "@/components/Backoffice/Akte";
import Zeitleiste from "@/components/Backoffice/Formular/Zeitleiste";
import { Sparkline } from "@/components/Backoffice/Charts";
import Rahmen from "@/components/Backoffice/Marketing/Rahmen";
import { Balken, KennzahlZeile, ListeKachel, SperrHinweis, Status } from "@/components/Backoffice/Marketing/Bausteine";
import { CsvImport, KampagneAktionen, KampagnenLinkKachel } from "@/components/Backoffice/Marketing/Kampagnen";
import { kampagneAkte, marketingKontext } from "@/lib/backoffice/marketing/daten";
import { kampagneAuswertung } from "@/lib/backoffice/marketing/methoden";
import { aktiverTab } from "@/lib/backoffice/akte/geruest";
import { kurzDatum, monatAusSlug, prozent } from "@/lib/backoffice/marketing/regeln";
import { ATTRIBUTION_TEXT, KAMPAGNEN, STATUS_TEXT, seitentitel } from "@/lib/backoffice/marketing/texte";
import { cent, zahl } from "@/lib/backoffice/format";

export const dynamic = "force-dynamic";
export const metadata = { title: seitentitel("Kampagne") };

export default async function KampagneSeite({ params, searchParams }) {
  const { name: roh } = await params;
  const name = decodeURIComponent(roh);
  const sp = await searchParams;
  const ctx = await marketingKontext({ pfad: `/marketing/kampagnen/${roh}`, doctype: "PH Kampagne" });
  const akte = await kampagneAkte(ctx.client, name).catch((e) => (e?.code === "not_found" ? null : Promise.reject(e)));
  if (!akte) notFound();
  const { doc: k, docinfo } = akte;
  const tabs = [
    { id: "uebersicht", titel: KAMPAGNEN.tabs.uebersicht },
    { id: "kennzahlen", titel: KAMPAGNEN.tabs.kennzahlen, anzahl: (k.kennzahlen || []).length || undefined },
    { id: "anfragen", titel: KAMPAGNEN.tabs.anfragen, anzahl: akte.anfragen.length || undefined },
    { id: "auswertung", titel: KAMPAGNEN.tabs.auswertung },
  ];
  const tab = aktiverTab(tabs, sp.tab);
  const w = k.waehrung && k.waehrung !== "EUR" ? k.waehrung : null;
  const b = (c) => (w ? cent(c).replace("€", w) : cent(c));
  const anteil = k.budget_cent ? k.ausgaben_cent / k.budget_cent : 0;
  const stand = new Date().toLocaleTimeString("de-AT", { hour: "2-digit", minute: "2-digit" });
  const anfragen = akte.zaehlung?.anfragen_gesamt ?? k.anfragen_gesamt ?? 0;
  const zielIst = k.ziel_kennzahl === "Anfragen" ? anfragen : k.ziel_kennzahl === "Klicks" ? k.klicks_gesamt : k.ziel_ist;
  const auswertung = tab === "auswertung" ? await kampagneAuswertung(ctx.client, name).catch(() => null) : null;
  const wochen = (k.kennzahlen || []).map((z) => Number(z.kosten_cent || 0) / 100);

  return (
    <Rahmen ctx={ctx}>
      <AkteKopf
        zurueck={{ href: "/marketing/kampagnen", titel: "Kampagnen" }}
        krumen={[{ titel: "Marketing", href: "/marketing" }, { titel: "Kampagnen", href: "/marketing/kampagnen" }, { titel: k.titel }]}
        titel={k.titel}
        nummer={
          <span className="bo-mar-kopfzeile mt-0">
            <span className="bo-mar-mono">{k.name}</span>
            <Status gruppe="kampagne" wert={k.status} testid="kampagne-status" />
            <span>{k.kanal} · {kurzDatum(k.zeitraum_von)}–{k.zeitraum_bis ? kurzDatum(k.zeitraum_bis) : "offen"}</span>
          </span>
        }
        aktionen={<KampagneAktionen k={{ name: k.name, titel: k.titel, status: k.status, zeitraum_von: k.zeitraum_von, waehrung: k.waehrung }} leitung={ctx.leitung} team={ctx.team} nachlauf={Number(ctx.einst.kampagne_nachlauf_tage || 30)} />}
      />
      <div className="mb-6 flex flex-wrap items-center gap-4" data-testid="budget-zeile">
        {k.budget_cent ? <Balken className="w-56" anteil={anteil} ton={anteil > 1 ? "gefahr" : undefined} label={`${Math.round(anteil * 100)} % des Budgets`} /> : null}
        <span className={anteil > 1 ? "bo-mar-gefahr text-[14px]" : "bo-mar-unter tabular-nums"}>
          Budget {KAMPAGNEN.budgetZeile(b(k.ausgaben_cent || 0), k.budget_cent ? b(k.budget_cent) : "–", k.budget_cent ? prozent(k.ausgaben_cent, k.budget_cent) : null)}
          {k.ziel_kennzahl && k.ziel_wert ? ` · ${KAMPAGNEN.zielZeile(k.ziel_kennzahl, k.ziel_wert, zielIst ?? 0, prozent(zielIst, k.ziel_wert))}` : ""} · {KAMPAGNEN.anfragenStand(stand)}
          {anteil > 1 ? ` · ${KAMPAGNEN.ueberBudget}` : ""}
        </span>
      </div>
      <div className="mb-6"><AkteTabs tabs={tabs} aktiv={tab} basis={`/marketing/kampagnen/${roh}`} params={{}} /></div>

      {tab === "uebersicht" && (
        <div className="bo-mar-akte">
          <div className="bo-mar-stapel">
            <Kachel titel="Briefing">
              <div className="mt-2 text-[15px] leading-6" dangerouslySetInnerHTML={{ __html: k.beschreibung || '<p class="bo-mar-unter">Noch kein Briefing.</p>' }} />
            </Kachel>
            <KampagnenLinkKachel k={{ name: k.name, titel: k.titel, landingpage: k.landingpage, utm_source: k.utm_source, utm_medium: k.utm_medium, utm_campaign: k.utm_campaign }} darf={ctx.team} />
          </div>
          <aside className="bo-mar-akte__rechts">
            <Kachel titel={KAMPAGNEN.inhalte}>
              <ul className="mt-2 flex flex-col gap-2 text-[14px]">
                {akte.inhalte.ausgaben.map((a) => <li key={a.name}><Link className="bo-mar-link" href={`/marketing/newsletter/${encodeURIComponent(a.name)}`}>Newsletter {monatAusSlug(a.slug)}</Link></li>)}
                {akte.inhalte.social.map((s) => <li key={s.name}><Link className="bo-mar-link" href={`/marketing/social/${encodeURIComponent(s.name)}`}>{s.kanal}: {s.titel}</Link></li>)}
                {akte.inhalte.events.map((e) => <li key={e.name}><Link className="bo-mar-link" href={`/marketing/events/${encodeURIComponent(e.name)}`}>Event {e.titel}</Link></li>)}
                {!akte.inhalte.ausgaben.length && !akte.inhalte.social.length && !akte.inhalte.events.length && <li className="bo-mar-unter">{KAMPAGNEN.inhalteLeer}</li>}
              </ul>
              {ctx.team && <p className="mt-3"><Link className="bo-mar-link text-[14px] font-medium" href="/marketing/social?neu=beitrag">+ {KAMPAGNEN.beitragZu}</Link></p>}
            </Kachel>
            <Kachel titel="Zuständig">
              <p className="mt-2 text-[14px]">{String(k.zustaendig || "–").split("@")[0]} · Währung {k.waehrung || "EUR"}</p>
            </Kachel>
          </aside>
        </div>
      )}

      {tab === "kennzahlen" && (
        <ListeKachel
          label="Kennzahlen"
          testid="kennzahlen"
          kopf={<span className="flex w-full flex-wrap items-center justify-between gap-3"><span className="flex items-center gap-3">Kosten je Woche {wochen.length > 1 && <Sparkline werte={wochen} label="Kosten je Woche" />}</span>{ctx.team && <CsvImport name={k.name} />}</span>}
        >
          {(k.kennzahlen || []).length === 0 ? (
            <p className="bo-mar-unter px-3 py-6">{KAMPAGNEN.kennzahlenLeer}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="bo-mar-tabelle">
                <thead><tr><th scope="col">Datum</th><th scope="col" className="r">Impressionen</th><th scope="col" className="r">Klicks</th><th scope="col" className="r">Kosten (netto)</th><th scope="col" className="r">Anfragen manuell</th><th scope="col">Notiz</th><th scope="col" className="max-lg:hidden">Beleg</th></tr></thead>
                <tbody>
                  {[...(k.kennzahlen || [])].reverse().map((z) => (
                    <tr key={z.name}><td>{kurzDatum(z.datum, { jahr: true })}</td><td className="r bo-mar-zahl">{zahl(z.impressionen)}</td><td className="r bo-mar-zahl">{zahl(z.klicks)}</td><td className="r bo-mar-zahl">{b(z.kosten_cent)}</td><td className="r bo-mar-zahl">{z.anfragen || 0}</td><td className="bo-mar-unter">{z.notiz || "–"}</td><td className="max-lg:hidden bo-mar-klein">{ctx.an.kostenBelegt ? "–" : "folgt"}</td></tr>
                  ))}
                </tbody>
                <tfoot><tr><td colSpan={7}>Summe: {zahl(k.impressionen_gesamt || 0)} Impressionen · {zahl(k.klicks_gesamt || 0)} Klicks · {b(k.ausgaben_cent || 0)}</td></tr></tfoot>
              </table>
            </div>
          )}
        </ListeKachel>
      )}

      {tab === "anfragen" && (
        <div className="bo-mar-akte">
          <ListeKachel label="Anfragen" kopf={<span>{anfragen} Anfragen · {KAMPAGNEN.anfragenStand(stand)} · {KAMPAGNEN.tooltipAnfragen(akte.zaehlung?.anfragen_crm ?? 0, akte.zaehlung?.anfragen_manuell ?? 0)}</span>}>
            {akte.anfragen.length === 0 ? <p className="bo-mar-unter px-3 py-6">{KAMPAGNEN.anfragenLeer}</p> : (
              <ul className="flex flex-col">
                {akte.anfragen.map((a) => (
                  <li key={a.name} className="bo-mar-karte-zeile">
                    <div className="min-w-0 flex-1"><Link className="bo-mar-link bo-mar-link--zeile bo-mar-titel" href={`/d/ph-anfrage/${encodeURIComponent(a.name)}`}>{[a.vorname, a.nachname].filter(Boolean).join(" ") || a.titel}</Link><p className="bo-mar-klein">{a.name} · {a.art} · {kurzDatum(a.eingang)}</p></div>
                    <span className="bo-mar-klein">{a.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </ListeKachel>
          <aside className="bo-mar-akte__rechts">
            <Kachel titel={KAMPAGNEN.kontaktpunkte}>
              <ul className="mt-2 flex flex-col gap-2 text-[14px]">
                {akte.kontaktpunkte.map((p) => <li key={p.name}><span className="font-medium">{p.art}</span> <span className="bo-mar-klein">· {kurzDatum(p.zeit)}</span></li>)}
                {!akte.kontaktpunkte.length && <li className="bo-mar-unter">Noch keine Kontaktpunkte.</li>}
              </ul>
            </Kachel>
          </aside>
        </div>
      )}

      {tab === "auswertung" && (
        <div className="bo-mar-stapel" data-testid="auswertung">
          <div className="grid grid-cols-1 gap-(--bo-bento-gap) md:grid-cols-2">
            <Kachel titel={KAMPAGNEN.kostenBelegt}>
              {ctx.an.kostenBelegt ? <p className="bo-zahl-gross mt-2">{auswertung?.kosten_belegt_cent != null ? b(auswertung.kosten_belegt_cent) : "–"}</p> : <><p className="bo-zahl-gross mt-2">–</p><SperrHinweis text={`Noch nicht verfügbar – ${KAMPAGNEN.kostenBelegtFolgt}`} /></>}
            </Kachel>
            <Kachel titel={KAMPAGNEN.kostenGemeldet}><p className="bo-zahl-gross mt-2">{b(auswertung?.kosten_gemeldet_cent ?? k.ausgaben_cent ?? 0)}</p><p className="bo-mar-klein">aus den Kennzahlen</p></Kachel>
          </div>
          <Kachel titel="Wirkung">
            <div className="mt-3">
              <KennzahlZeile eintraege={[
                { wert: zahl(auswertung?.impressionen_gesamt ?? k.impressionen_gesamt ?? 0), text: "Impressionen" },
                { wert: zahl(auswertung?.klicks_gesamt ?? k.klicks_gesamt ?? 0), text: "Klicks" },
                { wert: `${((auswertung?.klickrate_promille ?? k.klickrate_promille ?? 0) / 10).toLocaleString("de-AT", { maximumFractionDigits: 1 })} %`, text: "Klickrate" },
                { wert: `${anfragen} / ${auswertung?.gewonnen ?? 0}`, text: "Anfragen / gewonnen" },
                { wert: anfragen ? b(Math.round((k.ausgaben_cent || 0) / anfragen)) : "–", text: "Kosten je Anfrage" },
              ]} />
            </div>
            <p className="bo-mar-klein mt-4">{KAMPAGNEN.modell(ATTRIBUTION_TEXT[k.attribution_modell || ctx.einst.attribution_modell] || ATTRIBUTION_TEXT.last)}</p>
          </Kachel>
          {(ctx.leitung || ctx.session.roles?.includes("PH Geschäftsführung")) && (
            <Kachel titel={KAMPAGNEN.umsatz}>
              <p className="bo-zahl-gross mt-2">–</p>
              <SperrHinweis text={`Noch nicht verfügbar – ${KAMPAGNEN.umsatzFolgt}`} />
            </Kachel>
          )}
          <Kachel titel={KAMPAGNEN.fazit}><div className="mt-2 text-[15px] leading-6" dangerouslySetInnerHTML={{ __html: k.auswertung_notiz || '<p class="bo-mar-unter">Noch kein Fazit.</p>' }} /></Kachel>
        </div>
      )}
      {tab === "uebersicht" && <div className="mt-(--bo-bento-gap)"><Zeitleiste doctype="PH Kampagne" name={k.name} docinfo={docinfo} darfSchreiben={ctx.team} /></div>}
      <span className="sr-only">{STATUS_TEXT.kampagne[k.status]}</span>
    </Rahmen>
  );
}
