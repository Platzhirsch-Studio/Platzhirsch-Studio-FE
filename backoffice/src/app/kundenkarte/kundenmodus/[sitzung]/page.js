import Link from "next/link";
import { notFound } from "next/navigation";
import Kundenmodus from "@/components/Backoffice/Kundenkarte/Kundenmodus";
import Leer from "@/components/Backoffice/Leer";
import { sessionStore } from "@/lib/backoffice/auth/store";
import { params, seitenStart } from "@/lib/backoffice/kundenkarte/seite";
import { T } from "@/lib/backoffice/kundenkarte/texte";

// Kundenmodus am iPad (Konzept §3.12) – Vollbild ohne Shell, Sitzung kurzlebig im Store (15 min).
export const dynamic = "force-dynamic";
export const metadata = { title: "Ihre Kundenkarte", robots: { index: false } };

export default async function KundenmodusSeite({ params: p, searchParams }) {
  const { sitzung } = await p;
  if (!/^[a-f0-9]{32}$/.test(sitzung)) notFound();
  const sp = params(await searchParams);
  await seitenStart(`/kundenkarte/kundenmodus/${sitzung}`, sp, { akte: true });
  const w = await sessionStore().wertLesen(`kk:${sitzung}`).catch(() => null);
  const zurueck = /^\/kundenkarte\/[\w\-/?=&%.]*$/.test(sp.zurueck || "") ? sp.zurueck : "/kundenkarte";
  if (!w) {
    return (
      <main className="bo-kk-km">
        <div className="bo-kk-km__innen">
          <Leer art="leer" titel={T.kundenmodus.abgelaufen} text="" icon="Clock" aktion={<Link className="bo-knopf bo-knopf--primary inline-flex h-11 items-center rounded-full px-5 font-semibold" href={zurueck}>Zurück</Link>} />
        </div>
      </main>
    );
  }
  return <Kundenmodus sitzung={sitzung} name={w.name || ""} zweck={w.zweck} zurueck={zurueck} bestaetigt={w.bestaetigt} schalter={w.schalter} />;
}
