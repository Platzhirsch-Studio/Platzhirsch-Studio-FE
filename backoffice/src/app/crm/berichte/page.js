import Link from "next/link";
import { requireRecht } from "@/lib/backoffice/auth/dal";
import { backoffice } from "@/lib/backoffice/frappe";
import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Kachel, { Bento } from "@/components/Backoffice/Kachel";
import { Balken, KeineDaten } from "@/components/Backoffice/Charts";
import { ladeBerichte } from "@/lib/backoffice/crm/daten";
import { CRM_TEXTE as T } from "@/lib/backoffice/crm/texte";
import "@/components/Backoffice/Crm/crm.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Berichte · CRM" };

const ZEITRAEUME = { 30: "30 Tage", 90: "90 Tage", 365: "12 Monate" };

function Anteile({ titel, unter, punkte, className }) {
  const max = Math.max(1, ...punkte.map((p) => p.wert));
  const sicht = punkte.slice(0, 5);
  const rest = punkte.slice(5).reduce((s, p) => s + p.wert, 0);
  if (rest) sicht.push({ label: "Weitere", wert: rest });
  return (
    <Kachel className={className} titel={titel} unter={unter}>
      {sicht.length === 0 ? <p className="text-[14px] text-bo-text-soft">{T.berichte.leer}</p> : (
        <ol className="grid gap-3">
          {sicht.map((p, i) => (
            <li key={p.label} className="bo-crm-stufe" data-hervor={i === 0 ? "true" : undefined}>
              <span className="truncate text-bo-text-soft">{p.label}</span>
              <span className="bo-crm-stufe__spur"><span className="bo-crm-stufe__balken bo-wachsen-x block" style={{ width: `${Math.max(3, (p.wert / max) * 100)}%` }} /></span>
              <span className="text-right text-[15px] font-semibold tabular-nums">{p.wert}</span>
            </li>
          ))}
        </ol>
      )}
    </Kachel>
  );
}

export default async function BerichteSeite({ searchParams }) {
  const sp = await searchParams;
  const session = await requireRecht("crm", "read", "/crm/berichte");
  const client = backoffice(session);
  const tage = ZEITRAEUME[sp?.tage] ? Number(sp.tage) : 90;
  const b = await ladeBerichte(session, client, { tage });
  return (
    <Shell session={session} breit>
      <Seitenkopf ueber={T.ueber} titel={T.seiten.berichte} untertitel={b.leitung ? T.berichte.unter : `${T.berichte.unter} – deine eigenen Vorgänge`}
        kennzahlen={[{ wert: String(b.summen.anfragen), text: "Anfragen" }, { wert: String(b.summen.termine), text: "Termine" }, { wert: String(b.summen.gewonnen), text: "gewonnen" }]}
        aktionen={
          <nav aria-label="Zeitraum" className="flex gap-1 rounded-pill bg-bo-fill p-1">
            {Object.entries(ZEITRAEUME).map(([k, v]) => <Link key={k} href={`/crm/berichte?tage=${k}`} aria-current={Number(k) === tage ? "true" : undefined} className={`rounded-pill px-3.5 py-1.5 text-[13px] font-medium ${Number(k) === tage ? "bg-bo-action text-bo-ink-inverse shadow-(--bo-sh-btn)" : "text-bo-text-soft"}`}>{v}</Link>)}
          </nav>
        } />
      <Bento testid="crm-berichte">
        {b.wochen.some((w) => w.wert) ? (
          <Balken className="md:col-span-12" titel={T.berichte.anfragenWoche} untertitel={`${ZEITRAEUME[tage]} · je Woche`} punkte={b.wochen} hervorheben={b.wochen.length - 2} laufend="letzter" hoehe={200} einblenden />
        ) : (
          <KeineDaten className="md:col-span-12" titel={T.berichte.anfragenWoche} text={T.berichte.leer} />
        )}
        <Anteile className="md:col-span-6" titel={T.berichte.nachArt} punkte={b.nachArt} />
        <Anteile className="md:col-span-6" titel={T.berichte.nachQuelle} punkte={b.nachQuelle} />
        <Anteile className="md:col-span-6" titel={T.berichte.termineModus} unter="ohne verfallene Website-Reservierungen" punkte={b.termineModus} />
        <Anteile className="md:col-span-6" titel={T.berichte.berater} punkte={b.berater} />
        {b.verlust && <Anteile className="md:col-span-12" titel={T.berichte.verlust} unter={T.berichte.hinweisBetraege} punkte={b.verlust} />}
      </Bento>
    </Shell>
  );
}
