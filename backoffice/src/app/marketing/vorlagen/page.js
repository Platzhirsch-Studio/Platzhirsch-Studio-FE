// /marketing/vorlagen – Mail-Vorlagen (10-konzept-marketing § 2.11, T9, nur Leitung): Liste links gruppiert nach Art,
// rechts Editor (?vorlage=). 0 Vorlagen ist ein Fehlerzustand (die App installiert sie).
import Link from "next/link";
import { redirect } from "next/navigation";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Fehler from "@/components/Backoffice/Fehler";
import Leer from "@/components/Backoffice/Leer";
import Rahmen from "@/components/Backoffice/Marketing/Rahmen";
import { VorlagenEditor } from "@/components/Backoffice/Marketing/Verwaltung";
import { marketingKontext, vorlagenListe } from "@/lib/backoffice/marketing/daten";
import { VORLAGEN, VORLAGE_ART, seitentitel } from "@/lib/backoffice/marketing/texte";

export const dynamic = "force-dynamic";
export const metadata = { title: seitentitel("Vorlagen") };

export default async function VorlagenSeite({ searchParams }) {
  const sp = await searchParams;
  const ctx = await marketingKontext({ pfad: "/marketing/vorlagen", doctype: "PH Mail Vorlage" });
  if (!ctx.leitung) redirect("/kein-zugriff?bereich=marketing&aktion=vorlagen");
  const liste = await vorlagenListe(ctx.client);
  const aktiv = sp.vorlage ? String(sp.vorlage) : liste[0]?.name;
  const v = aktiv ? await ctx.client.getDoc("PH Mail Vorlage", aktiv).catch(() => null) : null;
  return (
    <Rahmen ctx={ctx}>
      <Seitenkopf titel={VORLAGEN.titel} untertitel={VORLAGEN.untertitel} krumen={[{ titel: "Marketing", href: "/marketing" }, { titel: VORLAGEN.titel }]} />
      {liste.length === 0 ? (
        <Fehler code="unavailable" titel="Vorlagen fehlen" message={VORLAGEN.fehlt} />
      ) : (
        <div className="grid grid-cols-1 gap-(--bo-bento-gap) lg:grid-cols-[260px_minmax(0,1fr)]">
          <nav className="bo-kachel self-start" style={{ padding: 12 }} aria-label="Vorlagen">
            {VORLAGE_ART.map((art) => {
              const gruppe = liste.filter((x) => x.art === art);
              if (!gruppe.length) return null;
              return (
                <div key={art} className="mb-3">
                  <p className="bo-mar-klein px-3 py-1 font-medium">{VORLAGEN.gruppen[art]}</p>
                  <div className="bo-mar-seitenliste">
                    {gruppe.map((x) => (
                      <Link key={x.name} href={`/marketing/vorlagen?vorlage=${encodeURIComponent(x.name)}`} aria-current={x.name === aktiv ? "true" : undefined}>
                        <span className="text-[14px] font-medium">{x.betreff}</span>
                        <span className="bo-mar-klein">{x.vorlage_id} · {x.sprache} · Stand {String(x.stand || "").split("-").reverse().join(".")}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </nav>
          {v ? <VorlagenEditor key={v.name} v={v} darf={ctx.leitung} /> : <Leer text={VORLAGEN.waehlen} />}
        </div>
      )}
    </Rahmen>
  );
}
