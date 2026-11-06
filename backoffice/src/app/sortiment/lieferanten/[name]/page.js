import { notFound } from "next/navigation";
import Link from "next/link";
import Shell from "@/components/Backoffice/Shell/Shell";
import Kachel from "@/components/Backoffice/Kachel";
import Fehler from "@/components/Backoffice/Fehler";
import Knopf from "@/components/Backoffice/Knopf";
import { AkteGeruest, AkteKopf, AkteTabs, Band } from "@/components/Backoffice/Akte";
import NurIntern from "@/components/Backoffice/Kundenmodus/NurIntern";
import Zeitleiste from "@/components/Backoffice/Formular/Zeitleiste";
import { Fakten, ProduktBild, Status } from "@/components/Backoffice/Sortiment/Bausteine";
import { lieferantAkte, sortimentKontext } from "@/lib/backoffice/sortiment/daten";
import { glnGueltig, wegFuerBestellweg } from "@/lib/backoffice/sortiment/uebermittlung";
import { GLOSSAR, LIEFERANTEN } from "@/lib/backoffice/sortiment/texte";
import { istSortiment } from "@/lib/backoffice/sortiment/rollen";
import { cent, datum } from "@/lib/backoffice/format";
import { istBackofficeError } from "@/lib/backoffice/frappe/errors";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  return { title: `${decodeURIComponent((await params).name)} · Lieferanten` };
}

export default async function LieferantAkte({ params, searchParams }) {
  const name = decodeURIComponent((await params).name);
  const sp = Object.fromEntries(Object.entries(await searchParams).map(([k, v]) => [k, String(v)]));
  const pfad = `/sortiment/lieferanten/${encodeURIComponent(name)}`;
  const { session, client, ek } = await sortimentKontext({ pfad, doctype: "PH Lieferant" });
  let a;
  try {
    a = await lieferantAkte(client, session, name);
  } catch (err) {
    if (istBackofficeError(err) && err.code === "not_found") notFound();
    return (
      <Shell session={session}>
        <Fehler code={err?.code || "unavailable"} zurueckHref="/sortiment/lieferanten" />
      </Shell>
    );
  }
  const l = a.doc;
  const tab = sp.tab === "verlauf" ? "verlauf" : "bestellungen";
  const elektronisch = ["IWOfurn", "EDI"].includes(l.bestellweg);
  const offen = a.bestellungen.filter((b) => !["Abgeschlossen", "Storniert"].includes(b.status));
  const band = !l.bestell_email && l.bestellweg === "E-Mail" ? { ton: "warnung", titel: LIEFERANTEN.ohneEmail, text: "Senden per E-Mail ist gesperrt, bis eine Adresse hinterlegt ist." } : elektronisch && !glnGueltig(l.gln) ? { ton: "warnung", titel: "GLN", text: LIEFERANTEN.glnFehlt } : null;

  return (
    <Shell session={session}>
      <AkteGeruest
        kopf={
          <AkteKopf className="bo-sor-kopf"
            zurueck={{ href: "/sortiment/lieferanten", titel: LIEFERANTEN.titel }}
            krumen={[{ titel: "Sortiment", href: "/sortiment" }, { titel: LIEFERANTEN.titel, href: "/sortiment/lieferanten" }, { titel: l.firmenname }]}
            titel={l.firmenname}
            nummer={[l.marke, [l.plz, l.ort].filter(Boolean).join(" "), l.land].filter(Boolean).join(" · ")}
            status={<Status gruppe="aktivInaktiv" wert={l.status} />}
            betrag={{ text: String(offen.length), unter: LIEFERANTEN.offeneBestellungen }}
            aktionen={istSortiment(session) ? <Knopf variant="primary" icon="Plus" href={`/sortiment/bestellungen/neu?lieferant=${encodeURIComponent(l.name)}`}>{LIEFERANTEN.neueBestellung}</Knopf> : null}
          />
        }
        band={band ? <Band ton={band.ton} titel={band.titel} text={band.text} /> : null}
        reiter={<AkteTabs basis={pfad} params={sp} aktiv={tab} tabs={[{ id: "bestellungen", titel: "Bestellungen", anzahl: a.bestellungen.length }, { id: "verlauf", titel: "Verlauf" }]} />}
        rechts={
          <div className="flex flex-col gap-(--bo-bento-gap)">
            <Kachel titel="Bestellweg">
              <Fakten
                spalten={1}
                eintraege={[
                  { label: "Bestellweg", wert: GLOSSAR.bestellweg[l.bestellweg] || "–" },
                  { label: "Übermittlung", wert: GLOSSAR.uebermittlungWeg[wegFuerBestellweg(l.bestellweg)] },
                  { label: "Bestell-E-Mail", wert: l.bestell_email || "–" },
                  { label: "GLN", wert: l.gln ? `${l.gln}${glnGueltig(l.gln) ? "" : " (ungültig)"}` : "–" },
                  { label: "Unsere Kundennummer", wert: l.kundennummer_bei_lieferant || "–" },
                  { label: "AB erwartet", wert: LIEFERANTEN.ab(l.ab_erwartet_tage || 5) },
                ]}
              />
            </Kachel>
            <Kachel titel={LIEFERANTEN.konditionen}>
              {ek ? (
                <NurIntern>
                  <Fakten
                    spalten={1}
                    eintraege={[
                      { label: "Zahlungsziel", wert: l.zahlungsziel_tage ? LIEFERANTEN.zahlungsziel(l.zahlungsziel_tage) : "–" },
                      { label: "Skonto", wert: l.skonto_promille ? LIEFERANTEN.skonto(l.skonto_promille, l.skonto_tage) : "–" },
                      { label: "Mindestbestellwert", wert: l.mindestbestellwert_cent ? cent(l.mindestbestellwert_cent) : "–" },
                      { label: "Incoterm", wert: l.incoterm || "–" },
                    ]}
                  />
                </NurIntern>
              ) : (
                <p className="bo-sor-unter">{LIEFERANTEN.konditionenNurLeitung}</p>
              )}
            </Kachel>
            {(l.betriebsurlaub || []).length > 0 && (
              <Kachel titel={LIEFERANTEN.betriebsurlaub}>
                <ul className="flex flex-col gap-1 text-[14px]">
                  {l.betriebsurlaub.map((u, i) => (
                    <li key={i} className="tabular-nums">
                      {datum(u.von)} – {datum(u.bis)} <span className="bo-sor-klein">{u.hinweis}</span>
                    </li>
                  ))}
                </ul>
              </Kachel>
            )}
          </div>
        }
      >
        {tab === "bestellungen" ? (
          <div className="flex flex-col gap-(--bo-bento-gap)">
            {a.marken.length > 0 && (
              <Kachel titel="Marken">
                <ul className="flex flex-wrap gap-3">
                  {a.marken.map((m) => (
                    <li key={m.name}>
                      <Link href={`/sortiment/marken/${encodeURIComponent(m.name)}`} className="flex items-center gap-3 rounded-[16px] bg-bo-fill py-2 pl-2 pr-4 hover:bg-bo-fill-2">
                        <ProduktBild src={m.bild_anhagen} alt="" groesse={40} />
                        <span>
                          <span className="block text-[14px] font-semibold">{m.name}</span>
                          <span className="bo-sor-klein">{GLOSSAR.haendlerstatus[m.haendlerstatus]}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </Kachel>
            )}
            <Kachel titel="Bestellungen">
              {!a.bestellungen.length ? (
                <p className="bo-sor-unter">Noch keine Bestellungen.</p>
              ) : (
                <ul className="flex flex-col gap-1">
                  {a.bestellungen.map((b) => (
                    <li key={b.name}>
                      <Link href={`/sortiment/bestellungen/${encodeURIComponent(b.name)}`} className="flex items-center justify-between gap-3 rounded-[14px] px-3 py-2.5 hover:bg-bo-fill">
                        <span className="min-w-0">
                          <span className="block text-[14px] font-medium tabular-nums">{b.name}</span>
                          <span className="bo-sor-klein block truncate">{[b.kommission || "Lager", datum(b.datum)].join(" · ")}</span>
                        </span>
                        <Status gruppe="bestellung" wert={b.status} groesse="sm" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Kachel>
          </div>
        ) : (
          <Kachel titel="Verlauf">
            <Zeitleiste doctype="PH Lieferant" name={l.name} docinfo={a.docinfo} darfSchreiben={false} />
          </Kachel>
        )}
      </AkteGeruest>
    </Shell>
  );
}
