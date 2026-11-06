import Link from "next/link";
import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Segment from "@/components/Backoffice/Segment";
import Kachel from "@/components/Backoffice/Kachel";
import Leer from "@/components/Backoffice/Leer";
import FreigabeSchreibtisch from "@/components/Backoffice/Sortiment/FreigabeSchreibtisch";
import { freigabenLaden, sortimentKontext } from "@/lib/backoffice/sortiment/daten";
import { FREIGABEN } from "@/lib/backoffice/sortiment/texte";
import { mitParametern } from "@/lib/backoffice/listen";

export const dynamic = "force-dynamic";
export const metadata = { title: "Freigaben · Sortiment" };

const ARTEN = ["bilder", "preise", "lieferzeiten"];

export default async function FreigabenPage({ searchParams }) {
  const sp = Object.fromEntries(Object.entries(await searchParams).map(([k, v]) => [k, String(v)]));
  const art = ARTEN.includes(sp.art) ? sp.art : "bilder";
  const { session, client, leitung } = await sortimentKontext({ pfad: "/sortiment/freigaben", doctype: "PH Produkt" });
  const [gesamt, gefiltert] = await Promise.all([freigabenLaden(client), sp.marke ? freigabenLaden(client, { marke: sp.marke }) : null]);
  const d = gefiltert || gesamt;
  const basis = "/sortiment/freigaben";
  const href = (a) => mitParametern(basis, sp, a);
  const eintraege = d[art];

  return (
    <Shell session={session} breit>
      <Seitenkopf
        titel={FREIGABEN.titel}
        untertitel={FREIGABEN.untertitel}
        krumen={[{ titel: "Zentrale", href: "/" }, { titel: "Sortiment", href: "/sortiment" }, { titel: FREIGABEN.titel }]}
        kennzahlen={[
          { wert: gesamt.bilder.length, text: FREIGABEN.arten.bilder },
          { wert: gesamt.preise.length, text: FREIGABEN.arten.preise },
          { wert: gesamt.lieferzeiten.length, text: FREIGABEN.arten.lieferzeiten },
        ]}
      />
      <div className="bo-sor-werkzeuge">
        <Segment label="Art" aktiv={art} optionen={ARTEN.map((a) => ({ wert: a, titel: FREIGABEN.arten[a], anzahl: d[a].length, href: href({ art: a === "bilder" ? null : a }) }))} />
      </div>
      <div className="grid min-w-0 grid-cols-1 gap-(--bo-bento-gap) lg:grid-cols-[240px_minmax(0,1fr)]">
        <Kachel titel="Marken" dicht className="self-start">
          <nav aria-label="Marken" className="bo-sor-markenspalte">
            <Link href={href({ marke: null })} aria-current={!sp.marke ? "true" : undefined}>
              <span>{FREIGABEN.alleMarken}</span>
              <span className="tabular-nums">{gesamt.marken.reduce((x, m) => x + m.anzahl, 0)}</span>
            </Link>
            {gesamt.marken.map((m) => (
              <Link key={m.name} href={href({ marke: m.name })} aria-current={sp.marke === m.name ? "true" : undefined}>
                <span className="truncate">{m.name}</span>
                <span className="tabular-nums">{m.anzahl}</span>
              </Link>
            ))}
          </nav>
        </Kachel>
        <section className="bo-kachel min-w-0" aria-label={FREIGABEN.arten[art]}>
          {eintraege.length === 0 ? <Leer art="erledigt" groesse="karte" titel={FREIGABEN.leer} /> : <FreigabeSchreibtisch key={`${art}:${sp.marke || ""}`} art={art} eintraege={eintraege} leitung={leitung} />}
        </section>
      </div>
    </Shell>
  );
}
