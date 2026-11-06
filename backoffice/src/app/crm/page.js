import Link from "next/link";
import { requireRecht } from "@/lib/backoffice/auth/dal";
import { backoffice } from "@/lib/backoffice/frappe";
import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Kachel, { Akzentkachel, Bento } from "@/components/Backoffice/Kachel";
import Erstbesuch from "@/components/Backoffice/Erstbesuch";
import Avatar from "@/components/Backoffice/Avatar";
import StatusBadge from "@/components/Backoffice/StatusBadge";
import Fehler from "@/components/Backoffice/Fehler";
import { Pille } from "@/components/Backoffice/StatusBadge";
import { ZuErledigen, MeinTag } from "@/components/Backoffice/Crm/Uebersicht";
import { NeueAnfrageKnopf } from "@/components/Backoffice/Crm/Kopfknoepfe";
import { ladeUebersicht } from "@/lib/backoffice/crm/daten";
import { heuteChips } from "@/lib/backoffice/crm/zuErledigen";
import { CRM_TEXTE as T } from "@/lib/backoffice/crm/texte";
import { relativ } from "@/lib/backoffice/format";
import { istBackofficeError } from "@/lib/backoffice/frappe/errors";
import "@/components/Backoffice/Crm/crm.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "CRM" };

const ZEITRAUM = { "7d": 7, "30d": 30, "90d": 90 };

export default async function CrmUebersicht({ searchParams }) {
  const sp = await searchParams;
  const session = await requireRecht("crm", "read", "/crm");
  const client = backoffice(session);
  const zeitraum = ZEITRAUM[sp?.zeitraum] ? sp.zeitraum : "30d";
  let d;
  try {
    d = await ladeUebersicht(session, client, { zeitraumTage: ZEITRAUM[zeitraum] });
  } catch (err) {
    return <Shell session={session}><Fehler code={istBackofficeError(err) ? err.code : "unavailable"} message={err?.message} /></Shell>;
  }
  const jetzt = new Date();
  const datumText = jetzt.toLocaleDateString("de-AT", { weekday: "long", day: "numeric", month: "long" });
  const chips = heuteChips(d.heute);
  const max = d.verlauf ? Math.max(1, ...d.verlauf.map((s) => Number(s.wert) || 0)) : 1;

  return (
    <Shell session={session} breit>
      <Seitenkopf
        ueber={`${datumText} · ${T.ueber}`}
        titel="CRM"
        kennzahlen={[
          { wert: String(d.kennzahlen.neuSeitGestern), text: T.uebersicht.akzentNeu },
          { wert: String(d.heute.termine), text: "Termine heute" },
          { wert: String(d.kennzahlen.offeneAnfragen), text: "Offene Anfragen" },
        ]}
        aktionen={<NeueAnfrageKnopf />}
      />
      <Erstbesuch text={T.erstbesuch.uebersicht} route="/crm" />
      <nav aria-label={T.uebersicht.heute} className="bo-crm-heute mb-6" data-testid="crm-heute">
        <span className="py-1.5 pr-1 text-[13px] font-medium text-bo-text-soft">{T.uebersicht.heute}</span>
        {chips.length === 0 ? <span className="py-1.5 text-[13px] text-bo-text-soft">{T.uebersicht.heuteNichts}</span> : chips.map((c) => (
          <Link key={c.id} href={c.href} className="rounded-pill"><Pille material={c.ton === "ziegel" ? "nuss" : c.ton}>{c.text}</Pille></Link>
        ))}
      </nav>
      <Bento>
        <Kachel className="md:col-span-7" titel={T.uebersicht.zuErledigen} unter={T.uebersicht.zuErledigenUnter} testid="crm-kachel-zu-erledigen">
          <ZuErledigen zeilen={d.zeilen} alleHref="/crm/anfragen?sicht=neu" />
        </Kachel>
        <Kachel className="md:col-span-5" titel={T.uebersicht.meinTag} unter={datumText}>
          <MeinTag termine={d.meinTag} naechster={d.naechster} jetzt={jetzt.toISOString()} />
        </Kachel>
        <Akzentkachel className="col-span-6 md:col-span-3" ton="cognac" titel={T.uebersicht.akzentNeu} text={T.uebersicht.akzentNeuText} zahl={d.kennzahlen.neuSeitGestern} href="/crm/anfragen?sicht=neu" testid="crm-akzent-neu" />
        {d.mails.an ? (
          <Akzentkachel className="col-span-6 md:col-span-3" ton="salbei" titel={T.uebersicht.mails} text={T.uebersicht.mailsText} zahl={d.mails.anzahl} href="/posteingang" />
        ) : (
          <Akzentkachel className="col-span-6 md:col-span-3" ton="salbei" titel={T.uebersicht.akzentBestaetigen} text={T.uebersicht.akzentBestaetigenText} zahl={d.heute.bestaetigen} href="/crm/termine?ansicht=liste&sicht=bestaetigen" />
        )}
        {d.verlauf ? (
          <Kachel className="md:col-span-6" titel={T.uebersicht.verkaufsverlauf} unter={T.uebersicht.verkaufsverlaufUnter(zeitraum === "7d" ? "7 Tage" : zeitraum === "90d" ? "90 Tage" : "30 Tage")}
            werkzeuge={
              <nav aria-label="Zeitraum" className="bo-seg bo-seg--s inline-flex">
                {Object.keys(ZEITRAUM).map((z) => <Link key={z} href={`/crm?zeitraum=${z}`} aria-current={z === zeitraum ? "true" : undefined} className={`rounded-pill px-3 py-1 text-[13px] font-medium ${z === zeitraum ? "bg-bo-action text-bo-ink-inverse" : "text-bo-text-soft"}`}>{z.replace("d", " T.")}</Link>)}
              </nav>
            }
            testid="crm-verkaufsverlauf">
            <ol className="grid gap-3.5">
              {d.verlauf.map((s, i) => {
                const vor = d.verlauf[i - 1];
                const quote = vor && vor.wert ? Math.round(((s.wert || 0) / vor.wert) * 100) : null;
                return (
                  <li key={s.id}>
                    <Link href={s.href} className="bo-crm-stufe" data-hervor={i === d.verlauf.length - 2 ? "true" : undefined} title={quote != null ? T.uebersicht.quote(quote, vor.titel, s.titel) : undefined}>
                      <span className="text-bo-text-soft">{s.titel}</span>
                      <span className="bo-crm-stufe__spur"><span className="bo-crm-stufe__balken bo-wachsen-x block" style={{ width: `${s.wert == null ? 0 : Math.max(3, (s.wert / max) * 100)}%` }} /></span>
                      <span className="text-right text-[17px] font-semibold tabular-nums">{s.wert ?? "–"}</span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </Kachel>
        ) : null}
        <Kachel className={d.verlauf ? "md:col-span-12" : "md:col-span-6"} titel={T.uebersicht.aktivitaet} werkzeuge={<Link href="/crm/anfragen?sicht=alle" className="text-[13px] font-medium text-bo-text-soft hover:text-bo-text">Alle</Link>}>
          {d.aktivitaet.length === 0 ? <p className="text-[14px] text-bo-text-soft">{T.uebersicht.aktivitaetLeer}</p> : (
            <ul className="grid gap-3">
              {d.aktivitaet.map((x) => (
                <li key={x.name}>
                  <Link href={`/crm/anfragen/${encodeURIComponent(x.name)}`} className="grid grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3 rounded-[16px] p-1.5 hover:bg-bo-surface-2">
                    <Avatar name={x.wer || x.person} groesse={40} />
                    <span className="min-w-0"><span className="block truncate text-[15px]"><strong className="font-semibold">{x.wer ? x.wer.split(" ")[0] : "Jemand"}</strong> hat {x.person || x.name} bearbeitet</span><span className="block truncate text-[13px] text-bo-text-soft">{x.name} · {relativ(x.modified, jetzt)}</span></span>
                    <StatusBadge wert={x.status.wert} text={x.status.text} ton={x.status.ton} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Kachel>
      </Bento>
    </Shell>
  );
}
