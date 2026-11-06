import { notFound } from "next/navigation";
import Link from "next/link";
import Shell from "@/components/Backoffice/Shell/Shell";
import Kachel from "@/components/Backoffice/Kachel";
import Fehler from "@/components/Backoffice/Fehler";
import Knopf from "@/components/Backoffice/Knopf";
import { AkteGeruest, AkteKopf, AkteTabs, Band } from "@/components/Backoffice/Akte";
import Zeitleiste from "@/components/Backoffice/Formular/Zeitleiste";
import { Fakten, Status } from "@/components/Backoffice/Sortiment/Bausteine";
import SchadenMelden from "@/components/Backoffice/Sortiment/SchadenMelden";
import { sortimentKontext, weAkte } from "@/lib/backoffice/sortiment/daten";
import { GLOSSAR, WARENEINGANG } from "@/lib/backoffice/sortiment/texte";
import { darfDoc } from "@/lib/backoffice/auth/rechte";
import { datum } from "@/lib/backoffice/format";
import { istBackofficeError } from "@/lib/backoffice/frappe/errors";
import { sortimentDruckHref } from "@/lib/backoffice/druck/sortiment";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  return { title: `${decodeURIComponent((await params).name)} · Wareneingang` };
}

export default async function WareneingangAkte({ params, searchParams }) {
  const name = decodeURIComponent((await params).name);
  const sp = Object.fromEntries(Object.entries(await searchParams).map(([k, v]) => [k, String(v)]));
  const pfad = `/sortiment/wareneingang/${encodeURIComponent(name)}`;
  const { session, client, meta } = await sortimentKontext({ pfad, doctype: "PH Wareneingang" });
  let a;
  try {
    a = await weAkte(client, session, name);
  } catch (err) {
    if (istBackofficeError(err) && err.code === "not_found") notFound();
    return (
      <Shell session={session}>
        <Fehler code={err?.code || "unavailable"} zurueckHref="/sortiment/wareneingang" />
      </Shell>
    );
  }
  const w = a.doc;
  const tab = sp.tab === "verlauf" ? "verlauf" : "positionen";
  const darfSchreiben = darfDoc(session, meta, "write");
  const stueck = (w.positionen || []).reduce((x, p) => x + (Number(p.menge_erhalten) || 0), 0);
  const reklamiert = w.status === "Reklamiert";

  return (
    <Shell session={session}>
      <AkteGeruest
        kopf={
          <AkteKopf className="bo-sor-kopf"
            zurueck={{ href: "/sortiment/wareneingang", titel: WARENEINGANG.titel }}
            krumen={[{ titel: "Sortiment", href: "/sortiment" }, { titel: WARENEINGANG.titel, href: "/sortiment/wareneingang" }, { titel: w.name }]}
            titel={w.titel || w.name}
            nummer={[w.name, datum(w.datum), w.lieferschein_nr_lieferant ? `Lieferschein ${w.lieferschein_nr_lieferant}` : null].filter(Boolean).join(" · ")}
            status={<Status gruppe="we" wert={w.status} />}
            betrag={{ text: `${stueck} Stk.`, unter: `${(w.positionen || []).length} Positionen` }}
            aktionen={
              reklamiert && darfSchreiben && !w.servicefall_ref ? (
                <SchadenMelden name={w.name} vorbelegt={w.reklamation_text || ""} />
              ) : (
                <Knopf href={sortimentDruckHref("PH Wareneingang", w.name)} icon="Printer">
                  Protokoll drucken
                </Knopf>
              )
            }
          />
        }
        band={reklamiert ? <Band ton={w.servicefall_hinweis ? "info" : "warnung"} titel="Reklamation" text={w.servicefall_hinweis || w.reklamation_text || "Schaden noch nicht gemeldet."} /> : null}
        reiter={<AkteTabs basis={pfad} params={sp} aktiv={tab} tabs={[{ id: "positionen", titel: "Positionen" }, { id: "verlauf", titel: "Verlauf" }]} />}
        rechts={
          <Kachel titel="Details">
            <Fakten
              spalten={1}
              eintraege={[
                { label: "Bestellung", wert: <Link className="underline-offset-2 hover:underline" href={`/sortiment/bestellungen/${encodeURIComponent(w.herstellerbestellung)}`}>{w.herstellerbestellung}</Link> },
                { label: "Lieferant", wert: w.lieferant },
                { label: "Kommission", wert: w.kommission || "Lager" },
                { label: "Spediteur", wert: w.spediteur || "–" },
                { label: "Packstücke", wert: w.packstuecke || "–" },
                { label: "Lagerort", wert: w.lagerort_text || "–" },
              ]}
            />
          </Kachel>
        }
      >
        {tab === "positionen" ? (
          <Kachel titel="Positionen" unter={`${stueck} Stück erhalten`}>
            <div className="overflow-x-auto">
              <table className="bo-sor-tabelle">
                <thead>
                  <tr>
                    <th scope="col">Position</th>
                    <th scope="col" className="r">erwartet</th>
                    <th scope="col" className="r">erhalten</th>
                    <th scope="col">Menge</th>
                    <th scope="col">{WARENEINGANG.zustand}</th>
                  </tr>
                </thead>
                <tbody>
                  {(w.positionen || []).map((p, i) => (
                    <tr key={i}>
                      <td>
                        <span className="font-medium">
                          <span className="tabular-nums text-bo-text-soft">{p.position} · </span>
                          {p.bezeichnung}
                        </span>
                        {p.hinweis && <span className="bo-sor-klein block">{p.hinweis}</span>}
                      </td>
                      <td className="r bo-sor-zahl">{p.menge_erwartet}</td>
                      <td className="r bo-sor-zahl font-medium">{p.menge_erhalten}</td>
                      <td className={p.mengen_abweichung && p.mengen_abweichung !== "keine" ? "bo-sor-unter bo-sor-warn" : "bo-sor-unter"}>{GLOSSAR.weMengen[p.mengen_abweichung] || "–"}</td>
                      <td>
                        <Status gruppe="weZustand" wert={p.zustand || "ok"} groesse="sm" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Kachel>
        ) : (
          <Kachel titel="Verlauf">
            <Zeitleiste doctype="PH Wareneingang" name={w.name} docinfo={a.docinfo} darfSchreiben={darfSchreiben} />
          </Kachel>
        )}
      </AkteGeruest>
    </Shell>
  );
}
