// /marketing/social/[name] – Beitrags-Akte (10-konzept-marketing § 2.9, T5, zweispaltig mit Vorschau im Kanal-Format).
import { notFound } from "next/navigation";
import { AkteKopf, AkteTabs } from "@/components/Backoffice/Akte";
import Zeitleiste from "@/components/Backoffice/Formular/Zeitleiste";
import Rahmen from "@/components/Backoffice/Marketing/Rahmen";
import { Status } from "@/components/Backoffice/Marketing/Bausteine";
import { SocialFormular, SocialKopf, VeroeffentlichungKachel } from "@/components/Backoffice/Marketing/SocialAkte";
import { marketingKontext, socialAkte } from "@/lib/backoffice/marketing/daten";
import { aktiverTab } from "@/lib/backoffice/akte/geruest";
import { kurzDatum, socialPruefungen } from "@/lib/backoffice/marketing/regeln";
import { BILDQUELLE_TEXT, SOCIAL, seitentitel } from "@/lib/backoffice/marketing/texte";

export const dynamic = "force-dynamic";
export const metadata = { title: seitentitel("Beitrag") };

export default async function BeitragSeite({ params, searchParams }) {
  const { name: roh } = await params;
  const name = decodeURIComponent(roh);
  const sp = await searchParams;
  const ctx = await marketingKontext({ pfad: `/marketing/social/${roh}`, doctype: "PH Social Beitrag" });
  const akte = await socialAkte(ctx.client, name).catch((e) => (e?.code === "not_found" ? null : Promise.reject(e)));
  if (!akte) notFound();
  const { doc, docinfo, wartet } = akte;
  const tabs = [
    { id: "beitrag", titel: SOCIAL.tabs.beitrag },
    { id: "bild", titel: SOCIAL.tabs.bild },
    { id: "veroeffentlichung", titel: SOCIAL.tabs.veroeffentlichung },
    { id: "verlauf", titel: SOCIAL.tabs.verlauf },
  ];
  const tab = aktiverTab(tabs, sp.tab);
  const p = socialPruefungen(doc, {});
  const nurLesen = !ctx.team || ["Veroeffentlicht", "Verworfen"].includes(doc.status);

  return (
    <Rahmen ctx={ctx}>
      <AkteKopf
        zurueck={{ href: "/marketing/social", titel: "Social" }}
        krumen={[{ titel: "Marketing", href: "/marketing" }, { titel: "Social", href: "/marketing/social" }, { titel: doc.titel }]}
        titel={`„${doc.titel}“`}
        nummer={
          <span className="bo-mar-kopfzeile mt-0">
            <span>{doc.kanal} · {doc.format}{doc.board ? ` · Board ${doc.board}` : ""}</span>
            <Status gruppe="social" wert={wartet && doc.status === "Entwurf" ? "Wartet" : doc.status} testid="social-status" />
          </span>
        }
        aktionen={<SocialKopf doc={doc} wartet={wartet} leitung={ctx.leitung} team={ctx.team} dialog={sp.dialog} />}
      />
      <div className="bo-mar-kopfzeile mb-6" data-testid="bildrechte-zeile">
        <span className={p.pruefungen[0].ok ? "bo-mar-ok" : "bo-mar-warn"}>Bildrechte {p.pruefungen[0].ok ? "geklärt" : "offen"} · {BILDQUELLE_TEXT[doc.bildquelle_freigabe] || "–"}</span>
        <span className={p.altOk ? "" : "bo-mar-warn"}>· Bildbeschreibung {p.altOk ? "vorhanden" : "fehlt"}</span>
        <span>· {kurzDatum(doc.datum_geplant, { jahr: true })}{doc.uhrzeit_geplant ? ` ${String(doc.uhrzeit_geplant).slice(0, 5)}` : ""}</span>
      </div>
      <div className="mb-6">
        <AkteTabs tabs={tabs} aktiv={tab} basis={`/marketing/social/${roh}`} params={{}} />
      </div>
      {(tab === "beitrag" || tab === "bild") && <SocialFormular doc={doc} tab={tab} kampagnen={akte.kampagnen} nurLesen={nurLesen} />}
      {tab === "veroeffentlichung" && <VeroeffentlichungKachel doc={doc} />}
      {tab === "verlauf" && <Zeitleiste doctype="PH Social Beitrag" name={doc.name} docinfo={docinfo} darfSchreiben={ctx.team} />}
    </Rahmen>
  );
}
