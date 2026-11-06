import { requireSession } from "@/lib/backoffice/auth/dal";
import { backoffice, ladeMeta } from "@/lib/backoffice/frappe";
import { darf, darfDoc, erlaubteArbeitsplaetze } from "@/lib/backoffice/auth/rechte";
import { ladeFreigaben } from "@/lib/backoffice/freigaben/index";
import { geraeteListe } from "@/lib/backoffice/auth/geraet";
import { bereich as bereichDaten } from "@/lib/backoffice/bereiche/index";
import { doctypeSlug } from "@/lib/backoffice/format";
import { gruss, plan, primaerAktion, profilName, variante, vorname } from "@/lib/backoffice/zentrale/layout";
import { tagIso } from "@/lib/backoffice/zentrale/fristen";
import {
  akzente,
  aktivitaetKachel,
  betriebsbereitschaft,
  externKacheln,
  fristenChips,
  heuteChips,
  heuteSpalte,
  integration,
  kopfzahlen,
  meineAufgaben,
  namenVon,
  pipeline,
  projekte,
  umsatz,
  wartet,
  weitereKennzahlen,
} from "@/lib/backoffice/zentrale/daten";
import { ZENTRALE } from "@/lib/backoffice/zentrale/texte";
import Shell from "@/components/Backoffice/Shell/Shell";
import Kachel from "@/components/Backoffice/Kachel";
import { RundKnopf } from "@/components/Backoffice/Knopf";
import Erstbesuch from "@/components/Backoffice/Erstbesuch";
import { HeuteLeiste, ZentraleKopf } from "@/components/Backoffice/Zentrale/Kopf";
import AufgabenListe from "@/components/Backoffice/Zentrale/AufgabenListe";
import {
  AkzentKachel,
  AktivitaetKachel,
  BetriebKachel,
  ExternKachel,
  HeuteSpalte,
  IntegrationKachel,
  KennzahlenKachel,
  PipelineKachel,
  ProjekteKachel,
  UmsatzKachel,
  VerweisKachel,
  WartetKachel,
} from "@/components/Backoffice/Zentrale/Kacheln";
import ZentraleTasten from "@/components/Backoffice/Zentrale/ZentraleTasten";
import "@/components/Backoffice/Zentrale/zentrale.css";

export const metadata = { title: "Zentrale · Platzhirsch Backoffice" };
export const dynamic = "force-dynamic";

const DATUM = new Intl.DateTimeFormat("de-AT", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Vienna" });

/** Zentrale je Rolle (10-konzept-zentrale § 3.2, Lounge § 7.1): Kopf · Heute-Leiste · Bento nach layout.plan(). */
export default async function Zentrale() {
  const session = await requireSession("/");
  const client = backoffice(session);
  const jetzt = new Date();
  const heute = tagIso(jetzt);
  const v = variante(session);
  const sicht = (b) => darf(session, b, "read");

  // Welle 1: Quellen ohne Abhängigkeiten (Q-L3: höchstens 12 Abfragen in zwei Wellen, jede fängt sich selbst).
  const [freigaben, zahlen, termine, aufg, akz] = await Promise.all([
    ladeFreigaben(session, client).catch(() => []),
    v === "extern" ? Promise.resolve([]) : kopfzahlen(client, session, heute),
    heuteSpalte(client, session, heute, jetzt),
    meineAufgaben(client, session, heute),
    v === "extern" || v === "selbst" ? Promise.resolve([]) : akzente(client, session, heute),
  ]);

  const nochKennzahlen = await weitereKennzahlen(client, session, heute, new Set(zahlen.map((z) => z.id)));
  const reihen = plan(session, { sicht, akzente: akz.length, kennzahlen: nochKennzahlen.length });
  const ids = new Set(reihen.flat().map((k) => k.id));
  const admin = v === "admin";

  // Welle 2: nur, was der Plan zeigt.
  const [ware, pipe, ums, proj, akt, zuletzt, chips, geraete, extern] = await Promise.all([
    ids.has("wartet") ? wartet(client, session, heute, { freigaben, aufgaben: aufg.zeilen || [] }) : null,
    ids.has("pipeline") ? pipeline(client, session, heute) : null,
    ids.has("umsatz") ? umsatz(client, session, heute) : null,
    ids.has("projekte") ? projekte(client, session, heute) : null,
    ids.has("aktivitaet") ? aktivitaetKachel(client, session) : null,
    ids.has("zuletzt") ? aktivitaetKachel(client, session, { nurIch: true, limit: 5 }) : null,
    v === "extern" ? fristenChips(client, session, heute) : heuteChips(client, session, heute, { aufgabenZaehler: aufg.zaehler, freigaben, termine }),
    admin ? geraeteListe({ session }).catch(() => []) : [],
    v === "extern" ? externKacheln(client, session, heute) : null,
  ]);
  const integ = admin ? await integration(client, session, jetzt) : null;
  const betrieb = admin ? await betriebsbereitschaft(client, session, { geraete, integrationFehler: integ?.status === "ok" ? integ.fehler : null }) : null;
  const geraeteAlt = (geraete || []).filter((g) => !g.zuletzt_gesehen || jetzt.getTime() - Date.parse(String(g.zuletzt_gesehen).replace(" ", "T")) > 86_400_000).length;

  // Primäraktion fest je Rolle; Recht über create des DocTypes, sonst nächste (Konzept § 3.2.4).
  const metas = new Map();
  for (const p of ["PH Anfrage", "PH Rechnung", "PH Projekt", "PH Servicefall", "PH Aufgabe"]) {
    try {
      metas.set(p, await ladeMeta(client, p));
    } catch {
      // DocType fehlt → keine Primäraktion daraus
    }
  }
  const p = primaerAktion(session, (x) => metas.has(x.doctype) && darfDoc(session, metas.get(x.doctype), "create"));
  const primaer = p ? { titel: p.titel, href: p.href || `/d/${doctypeSlug(p.doctype)}/neu` } : null;
  const personen = aufg.darfAnlegen ? await personenListe(client) : [];

  const ueber = [DATUM.format(jetzt), session.standort ? `Showroom ${session.standort}`.replace("Showroom extern", "extern") : profilName(session)].filter(Boolean).join(" · ");
  const arbeitsplaetze = erlaubteArbeitsplaetze(session).filter((a) => a.kiosk);
  const personal = bereichDaten("personal");

  const kachel = {
    heute: <HeuteSpalte daten={termine} />,
    wartet: <WartetKachel daten={ware} />,
    akzent1: <AkzentKachel daten={akz[0]} />,
    akzent2: <AkzentKachel daten={akz[1]} />,
    aufgaben: (
      <Kachel titel={ZENTRALE.meineAufgaben} unter={aufg.zaehler ? `${aufg.zeilen.length} offen` : undefined} werkzeuge={<RundKnopf icon="ArrowUpRight" label={ZENTRALE.alleAufgaben(aufg.zeilen?.length || 0)} href="/aufgaben" groesse="s" />} testid="zentrale-aufgaben">
        {aufg.status === "fehler" ? (
          <p className="zb-leise">{ZENTRALE.nichtGeladen}</p>
        ) : (
          <AufgabenListe zeilen={aufg.zeilen} heute={heute} darfAnlegen={aufg.darfAnlegen} personen={personen} max={5} leerText={aufg.darfAufgabe ? ZENTRALE.allesErledigt : ZENTRALE.keineAufgaben} />
        )}
      </Kachel>
    ),
    pipeline: <PipelineKachel daten={pipe} />,
    umsatz: <UmsatzKachel daten={ums} />,
    projekte: <ProjekteKachel daten={proj} />,
    aktivitaet: <AktivitaetKachel daten={akt} />,
    zuletzt: <AktivitaetKachel daten={zuletzt} titel="Zuletzt bearbeitet" alleHref={null} />,
    kennzahlen: <KennzahlenKachel daten={nochKennzahlen} />,
    "kennzahlen-breit": <KennzahlenKachel daten={nochKennzahlen} />,
    betrieb: <BetriebKachel daten={betrieb} />,
    integration: <IntegrationKachel daten={integ} geraeteAlt={geraeteAlt} />,
    "extern-export": <ExternKachel art="export" daten={extern} />,
    "extern-posten": <ExternKachel art="posten" daten={extern} />,
    "extern-kassa": <ExternKachel art="kassa" daten={extern} />,
    stempel: <VerweisKachel titel={ZENTRALE.meineZeiten} text={ZENTRALE.meineZeitenText} href={personal?.startseite || "/"} icon="Clock" testid="zentrale-stempel" />,
    urlaub: <VerweisKachel titel={ZENTRALE.meinUrlaub} text={ZENTRALE.meinUrlaubText} href={personal?.startseite || "/"} icon="CalendarDays" testid="zentrale-urlaub" />,
    arbeitsplatz: arbeitsplaetze[0] ? (
      <VerweisKachel titel={arbeitsplaetze[0].titel} text={ZENTRALE.arbeitsplatzText(arbeitsplaetze[0].titel)} href={arbeitsplaetze[0].href || arbeitsplaetze[0].route || "/arbeitsplatz"} icon={arbeitsplaetze[0].icon || "Monitor"} testid="zentrale-arbeitsplatz" />
    ) : (
      <VerweisKachel titel={ZENTRALE.arbeitsplatz} text={ZENTRALE.arbeitsplatzText("Arbeitsplatz")} href="/arbeitsplatz" icon="Monitor" />
    ),
  };

  let i = 0;
  return (
    <Shell session={session} breit>
      <ZentraleKopf gruss={gruss(jetzt)} vorname={vorname(session.name)} ueber={ueber} zahlen={zahlen} primaer={primaer} neben={sicht("zentrale") ? <RundKnopf icon="CheckSquare" label={ZENTRALE.alleAufgaben(aufg.zeilen?.length || 0)} href="/aufgaben" /> : null} />
      <ZentraleTasten />
      <HeuteLeiste chips={chips || []} />
      <Erstbesuch route="/" text={ZENTRALE.erstbesuch} />
      <div className="zb-raster" data-testid="zentrale-raster" data-variante={v}>
        {reihen.flat().map((k) => {
          const inhalt = kachel[k.id];
          if (!inhalt) return null;
          return (
            <div key={k.id} data-b={k.breite} data-hoch={k.hoch || undefined} data-kachel={k.id} style={{ "--i": i++ }}>
              {inhalt}
            </div>
          );
        })}
      </div>
    </Shell>
  );
}

async function personenListe(client) {
  try {
    const u = await client.getList("User", { fields: ["name", "full_name"], filters: [["enabled", "=", 1]], limit: 200 });
    const namen = await namenVon(client, u.map((x) => x.name));
    return u.map((x) => ({ user: x.name, name: namen.get(x.name) || x.full_name || x.name }));
  } catch {
    return [];
  }
}
