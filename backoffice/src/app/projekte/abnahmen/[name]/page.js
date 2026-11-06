import { notFound } from "next/navigation";
import { requireRecht } from "@/lib/backoffice/auth/dal";
import Shell from "@/components/Backoffice/Shell/Shell";
import { AkteKopf, Band, Vorgangsleiste } from "@/components/Backoffice/Akte";
import Kachel from "@/components/Backoffice/Kachel";
import Leer from "@/components/Backoffice/Leer";
import Knopf from "@/components/Backoffice/Knopf";
import { Pille } from "@/components/Backoffice/StatusBadge";
import AktionKnopf from "@/components/Backoffice/Projekte/AktionKnopf";
import { ProjektStatus } from "@/components/Backoffice/Projekte/Teile";
import { heuteIso, projekteClient } from "@/lib/backoffice/projekte/lesen";
import { offeneAbnahmeMaengel, tageUeberfaellig } from "@/lib/backoffice/projekte/maengel";
import { datumKurz } from "@/lib/backoffice/projekte/anzeige";
import { TEXTE } from "@/lib/backoffice/projekte/texte";

export const dynamic = "force-dynamic";
export const metadata = { title: "Abnahme · Projekte" };
const A = TEXTE.abnahme;

/** Abnahme (T5, § 5.10): ab „Unterzeichnet“ schreibgeschützt (E11) außer erledigt/Servicefall je Mangel; Abschließen erst ohne offene Mängel. */
export default async function AbnahmeAkte({ params }) {
  const { name: roh } = await params;
  const name = decodeURIComponent(roh);
  const session = await requireRecht("projekte", "read", `/projekte/abnahmen/${roh}`);
  const client = projekteClient(session);
  const heute = heuteIso();
  let a;
  try {
    a = await client.getDoc("PH Abnahme", name);
  } catch {
    notFound();
  }
  const p = await client.getDoc("PH Projekt", a.projekt).catch(() => ({ name: a.projekt, titel: a.projekt }));
  const offen = offeneAbnahmeMaengel(a);
  const unterzeichnet = !!a.unterschrift_kunde;
  const enc = encodeURIComponent;
  const stufen = ["Entwurf", "Unterzeichnet", "Abgeschlossen"];
  const idx = a.status === "Mit Maengeln" ? 1 : stufen.indexOf(a.status);
  return (
    <Shell session={session}>
      <div className="flex flex-col gap-6">
        <AkteKopf
          zurueck={{ href: `/projekte/${enc(p.name)}?tab=montage`, titel: p.titel }}
          krumen={[{ titel: "Projekte", href: "/projekte" }, { titel: p.titel, href: `/projekte/${enc(p.name)}` }, { titel: a.name }]}
          titel={`${A.art} · ${p.titel}`}
          nummer={`${a.name} · ${datumKurz(a.datum, { jahr: true })}${a.ort ? ` · ${a.ort}` : ""} · Sprache ${a.sprache || "de"}`}
          status={<ProjektStatus doctype="PH Abnahme" wert={a.status} groesse="m" />}
          aktionen={
            <>
              <Knopf icon="Printer" href={`/druck/ph-abnahme/${enc(name)}?format=${enc("PH Abnahmeprotokoll")}`}>Protokoll</Knopf>
              {["Unterzeichnet", "Mit Maengeln"].includes(a.status) && (
                <AktionKnopf variant="primary" art="abnahme-abschliessen" args={{ name }} ok="Abnahme abgeschlossen" disabled={offen > 0} grund={offen ? A.abschliessenGrund(offen) : undefined} testid="abnahme-abschliessen">
                  {A.abschliessen}
                </AktionKnopf>
              )}
            </>
          }
        />
        <Vorgangsleiste titel="Abnahme" schritte={stufen.map((s, k) => ({ id: s, titel: s === "Unterzeichnet" && a.status === "Mit Maengeln" ? "Mit Mängeln" : s, zustand: k < idx ? "erledigt" : k === idx ? (s === "Abgeschlossen" ? "erledigt" : "aktuell") : "offen" }))} kompakt mitText />
        {unterzeichnet && <Band ton="info" titel={A.readonly} text={A.unterzeichnet(a.unterzeichnet_am ? `${datumKurz(a.unterzeichnet_am, { jahr: true })} ${String(a.unterzeichnet_am).slice(11, 16)}` : "", a.unterschrift_kunde_name || p.kunde_name, "")} />}
        <Kachel titel="Positionen" unter={offen ? A.abschliessenGrund(offen) : A.keineOffen} testid="abnahme-positionen">
          {(a.positionen || []).length ? (
            <ul className="flex flex-col gap-2">
              {a.positionen.map((z) => {
                const ueber = !Number(z.erledigt) && tageUeberfaellig(z.frist, heute);
                return (
                  <li key={z.name} className="flex flex-wrap items-center gap-3 rounded-2xl bg-bo-surface-2 px-4 py-3">
                    <span className="min-w-0 flex-1">
                      <span className="bo-prj-titel block">{z.bezeichnung}</span>
                      {z.zustand !== "ok" && (
                        <span className="bo-prj-unter block">
                          „{z.beschreibung}“ · Frist {datumKurz(z.frist)}{z.verantwortlich ? ` · ${z.verantwortlich}` : ""}{ueber ? ` · ${TEXTE.maengel.ueberfaellig(ueber)}` : ""}
                        </span>
                      )}
                    </span>
                    <Pille material={z.zustand === "ok" ? "salbei" : Number(z.erledigt) ? "stein" : "eiche"} groesse="sm">
                      {z.zustand === "ok" ? "ok" : Number(z.erledigt) ? `${A.zustand[z.zustand]} · erledigt` : A.zustand[z.zustand]}
                    </Pille>
                    {z.zustand !== "ok" && !Number(z.erledigt) && (
                      <>
                        <AktionKnopf size="s" icon="Check" art="mangel" args={{ quelle: "abnahme", doc: name, zeile: z.name, aktion: "erledigt" }} ok={A.mangelErledigt}>{TEXTE.maengel.erledigt}</AktionKnopf>
                        <AktionKnopf size="s" variant="ghost" art="mangel" args={{ quelle: "abnahme", doc: name, zeile: z.name, aktion: "service" }} ok="An Service übergeben">{TEXTE.montage.anService}</AktionKnopf>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <Leer groesse="karte" titel="Noch keine Positionen – sie entstehen in der Abnahme mit Kunde." />
          )}
          {a.vorbehalte && <p className="mt-4 text-[14px] text-bo-text-soft">Vorbehalte: {a.vorbehalte}</p>}
        </Kachel>
      </div>
    </Shell>
  );
}
