import Link from "next/link";
import Shell from "@/components/Backoffice/Shell/Shell";
import { AkteKopf } from "@/components/Backoffice/Akte";
import { Pille } from "@/components/Backoffice/StatusBadge";
import AktionKnopf from "@/components/Backoffice/Projekte/AktionKnopf";
import RenderingAnsicht from "@/components/Backoffice/Projekte/RenderingAnsicht";
import { ProjektStatus } from "@/components/Backoffice/Projekte/Teile";
import { ladeUnterakte } from "@/lib/backoffice/projekte/akte";
import { TEXTE } from "@/lib/backoffice/projekte/texte";

export const dynamic = "force-dynamic";
export const metadata = { title: "Rendering · Projekte" };

/** Rendering (§ 5.6): Bildfläche mit Pins, Varianten-Leiste, Faden, Vorlegen/Verwerfen. */
export default async function RenderingAkte({ params }) {
  const { session, client, doc: r, projekt: p } = await ladeUnterakte({ params, doctype: "PH Rendering", pfad: "renderings" });
  const [faden, varianten] = await Promise.all([
    client.getList("PH Rendering Feedback", { fields: ["name", "art", "von", "status", "text", "autor", "punkt_x", "punkt_y", "erstellt_am", "antwort_auf", "audio_dauer_s"], filters: [["rendering", "=", r.name]], orderBy: "erstellt_am asc", limit: 200 }).catch(() => []),
    client.getList("PH Rendering", { fields: ["name", "variante", "version", "status", "bild"], filters: [["projekt", "=", p.name]], orderBy: "variante asc", limit: 30 }).catch(() => []),
  ]);
  const enc = encodeURIComponent;
  return (
    <Shell session={session}>
      <div className="flex flex-col gap-6">
        <AkteKopf
          zurueck={{ href: `/projekte/${enc(p.name)}?tab=planung`, titel: p.titel }}
          krumen={[{ titel: "Projekte", href: "/projekte" }, { titel: p.titel, href: `/projekte/${enc(p.name)}` }, { titel: r.titel }]}
          titel={`${TEXTE.planung.variante(r.variante)} v${r.version || 1} · ${r.bezeichnung}`}
          nummer={r.name}
          status={
            <span className="flex items-center gap-2">
              <ProjektStatus doctype="PH Rendering" wert={r.status} groesse="m" />
              {Number(r.ki_generiert) ? (
                <Pille material="messing" groesse="m" punkt={false}>
                  {TEXTE.planung.kiGestuetzt}
                </Pille>
              ) : null}
            </span>
          }
          aktionen={
            <>
              {["Entwurf", "Vorgelegt", "Feedback offen"].includes(r.status) && (
                <AktionKnopf art="rendering" args={{ name: r.name, aktion: "Verwerfen" }} commitText={`Rendering ${r.variante} verworfen`}>
                  {TEXTE.planung.verwerfen}
                </AktionKnopf>
              )}
              {r.status === "Entwurf" && (
                <AktionKnopf variant="primary" art="rendering" args={{ name: r.name, aktion: "Kunden vorlegen" }} commitText={`Rendering ${r.variante} vorgelegt`} disabled={!r.bild} grund={!r.bild ? TEXTE.rendering.keinBild : undefined}>
                  {TEXTE.planung.vorlegen}
                </AktionKnopf>
              )}
            </>
          }
        />
        <nav aria-label="Varianten" className="bo-prj-varianten">
          {varianten.map((v) => (
            <Link key={v.name} href={`/projekte/${enc(p.name)}/renderings/${enc(v.name)}`} className="bo-prj-variante" aria-current={v.name === r.name ? "page" : undefined}>
              {/* eslint-disable-next-line @next/next/no-img-element -- Miniatur */}
              {v.bild ? <img src={v.bild} alt="" /> : null}
              {v.variante} v{v.version}
            </Link>
          ))}
        </nav>
        <RenderingAnsicht rendering={{ name: r.name, titel: r.titel, bild: r.bild, status: r.status, votes_up: r.votes_up, votes_down: r.votes_down }} faden={faden} kunde={p.kunde_name} />
      </div>
    </Shell>
  );
}
