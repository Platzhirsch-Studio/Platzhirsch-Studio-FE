import { notFound } from "next/navigation";
import { requireRecht } from "@/lib/backoffice/auth/dal";
import Shell from "@/components/Backoffice/Shell/Shell";
import { AkteKopf } from "@/components/Backoffice/Akte";
import Kachel, { Bento } from "@/components/Backoffice/Kachel";
import Leer from "@/components/Backoffice/Leer";
import AktionKnopf from "@/components/Backoffice/Projekte/AktionKnopf";
import { Foto, ProjektStatus } from "@/components/Backoffice/Projekte/Teile";
import { istLeitung, ladeEinstellungen, projekteClient } from "@/lib/backoffice/projekte/lesen";
import { referenzPruefung } from "@/lib/backoffice/projekte/regeln";
import { datumKurz } from "@/lib/backoffice/projekte/anzeige";
import { TEXTE } from "@/lib/backoffice/projekte/texte";

export const dynamic = "force-dynamic";
export const metadata = { title: "Referenz prüfen · Projekte" };
const R = TEXTE.referenzen;

/** Referenz-Prüfseite (§ 5.18): Bilder links, Prüfliste rechts; Veröffentlichen nur Leitung; Widerruf rot mit Rückfrage. */
export default async function ReferenzAkte({ params }) {
  const { name: roh } = await params;
  const session = await requireRecht("projekte", "read", `/projekte/referenzen/${roh}`);
  const client = projekteClient(session);
  const leitung = istLeitung(session);
  let r;
  try {
    r = await client.getDoc("PH Referenz", decodeURIComponent(roh));
  } catch {
    notFound();
  }
  const [p, andere, fotos, einst] = await Promise.all([
    client.getDoc("PH Projekt", r.projekt).catch(() => ({ name: r.projekt, titel: r.projekt })),
    client.count("PH Referenz", { filters: [["projekt", "=", r.projekt], ["status", "in", ["Eingereicht", "Veroeffentlicht"]], ["name", "!=", r.name]] }).catch(() => 0),
    client.getList("PH Tagebuch Foto", { fields: ["name"], filters: [["projekt", "=", r.projekt]], limit: 300 }).catch(() => []),
    ladeEinstellungen(client),
  ]);
  const pruef = referenzPruefung(r, { andereAktiv: andere, projektFotos: fotos });
  const ok = pruef.every((z) => z.ok);
  const aus = !Number(einst.referenz_freigabe_aktiv ?? 1);
  return (
    <Shell session={session}>
      <div className="flex flex-col gap-6">
        <AkteKopf zurueck={{ href: "/projekte/referenzen", titel: R.titel }} krumen={[{ titel: "Projekte", href: "/projekte" }, { titel: R.titel, href: "/projekte/referenzen" }, { titel: r.titel }]}
          titel={r.titel} nummer={`${r.name} · ${p.titel} · eingereicht ${datumKurz(r.eingereicht_am, { jahr: true })}`} status={<ProjektStatus doctype="PH Referenz" wert={r.status} groesse="m" />}
          aktionen={
            <>
              {["Eingereicht", "Veroeffentlicht"].includes(r.status) && <AktionKnopf variant="danger" art="referenz" args={{ name: r.name, methode: "widerruf_erfassen" }} ok="Widerruf erfasst" frage={{ titel: `Widerruf für „${r.titel}“ erfassen?`, text: R.widerrufFrage, bestaetigen: R.widerruf, gefaehrlich: true }}>{R.widerruf}</AktionKnopf>}
              {r.status === "Eingereicht" && leitung && <AktionKnopf variant="primary" art="referenz" args={{ name: r.name, methode: "veroeffentlichen" }} ok="Referenz veröffentlicht" disabled={!ok || aus} grund={aus ? R.ausgeschaltet : !ok ? "Prüfliste nicht erfüllt" : undefined} testid="veroeffentlichen">{R.veroeffentlichen}</AktionKnopf>}
            </>
          } />
        <Bento>
          <Kachel className="md:col-span-8" titel="Fotos" unter={`${(r.bilder || []).length} Bilder`}>
            {(r.bilder || []).length ? (
              <div className="bo-prj-fotos">{r.bilder.map((b) => <Foto key={b.name} src={b.datei} alt={b.alt || b.titel || ""} />)}</div>
            ) : <Leer groesse="karte" titel="Keine Bilder." />}
          </Kachel>
          <Kachel className="md:col-span-4" titel={R.pruefliste}>
            <ul className="bo-prj-pruef" data-testid="referenz-pruefliste">
              {pruef.map((z) => <li key={z.id} data-ok={z.ok ? "" : undefined}><span className="bo-prj-pruef__ico" aria-hidden="true">{z.ok ? "✓" : "!"}</span>{z.titel}<span className="sr-only">{z.ok ? " – erfüllt" : " – nicht erfüllt"}</span></li>)}
            </ul>
            <dl className="bo-prj-fakten mt-5">
              <div><dt>Anzeige</dt><dd>{r.anzeige_art === "anonym" ? "anonym" : [r.anzeige_vorname, r.anzeige_ort].filter(Boolean).join(", ")}</dd></div>
              <div><dt>Einwilligung</dt><dd>{r.einwilligung_version || "–"} · {r.einwilligung_kanal || "–"}</dd></div>
            </dl>
          </Kachel>
        </Bento>
      </div>
    </Shell>
  );
}
