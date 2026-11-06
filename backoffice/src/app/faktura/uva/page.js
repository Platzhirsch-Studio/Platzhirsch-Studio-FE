import { redirect } from "next/navigation";
import Link from "next/link";
import { fakturaKontext, alle } from "@/lib/backoffice/faktura/daten";
import { vormonat, monatName } from "@/lib/backoffice/faktura/regeln";
import { statusAnzeige } from "@/lib/backoffice/faktura/status";
import { UVA, LEER } from "@/lib/backoffice/faktura/texte";
import { cent, datum } from "@/lib/backoffice/format";
import Kachel from "@/components/Backoffice/Kachel";
import Segment from "@/components/Backoffice/Segment";
import Leer from "@/components/Backoffice/Leer";
import FakturaSeite from "@/components/Backoffice/Faktura/FakturaSeite";
import RueckfrageKnopf from "@/components/Backoffice/Faktura/RueckfrageKnopf";
import DruckenKnopf from "@/components/Backoffice/Faktura/DruckenKnopf";
import { Status, Hinweis } from "@/components/Backoffice/Faktura/teile";

export const metadata = { title: "UVA · Faktura" };
export const dynamic = "force-dynamic";

// /faktura/uva (T8, § 3.8): Zuarbeit für den Steuerberater, keine Meldung. Bezeichnung vorn, Kennzahl als Nebenspalte
// mit abbr; nach Übergabe nur lesend; „Nach Übergabe hinzugekommen“ als Zeile.
export default async function Uva({ searchParams }) {
  const sp = await searchParams;
  const ctx = await fakturaKontext("/faktura/uva");
  const { client, rolle, heute, schalter } = ctx;
  if (!rolle.export) redirect("/kein-zugriff?bereich=faktura&aktion=uva");
  const liste = await alle(client, "PH UVA Auswertung", { fields: ["name", "status", "zeitraum_von"] });
  const monat = /^\d{4}-\d{2}$/.test(sp?.monat || "") ? sp.monat : vormonat(heute);
  const kopf = liste.find((u) => String(u.zeitraum_von).slice(0, 7) === monat);
  const u = kopf ? await client.getDoc("PH UVA Auswertung", kopf.name).catch(() => null) : null;
  const monate = [...new Set([vormonat(heute), ...liste.map((x) => String(x.zeitraum_von).slice(0, 7))])].sort().reverse().slice(0, 6);
  const uebergeben = u?.status === "Uebergeben";
  return (
    <FakturaSeite
      ctx={ctx}
      titel="UVA"
      untertitel={u ? UVA.kopf(u.name, datum(u.zeitraum_von), datum(u.zeitraum_bis), datum(u.berechnet_am)) : monatName(monat)}
      aktionen={
        <>
          <Segment label="Monat" aktiv={monat} optionen={monate.map((m) => ({ wert: m, titel: monatName(m, false), href: `/faktura/uva?monat=${m}` }))} />
          {rolle.leitung && u && !uebergeben && <RueckfrageKnopf art="uva-uebergeben" name={u.name} titel="An Steuerberater übergeben" frage={`UVA ${monatName(monat)} übergeben?`} text="Danach ist die Auswertung nur noch lesend." ergebnis={UVA.uebergeben(u.name)} testid="uva-uebergeben" />}
        </>
      }
    >
      <div className="flex flex-col gap-4 xl:gap-6">
        <Hinweis ton="info">{UVA.hinweis}</Hinweis>
        {!u ? (
          <Leer art="leer" titel={LEER.uva(monatName(monat))} aktion={rolle.leitung ? <RueckfrageKnopf art="uva-berechnen" monat={monat} titel="Berechnen" frage={`UVA ${monatName(monat)} berechnen?`} ergebnis="UVA berechnet" /> : undefined} />
        ) : (
          <Kachel titel={u.titel || u.name} unter={u.methode || ""} werkzeuge={<Status status={statusAnzeige("PH UVA Auswertung", u.status)} />} testid="uva-tabelle">
            <div className="bo-scroll-x overflow-x-auto">
              <table className="bo-fk-pos min-w-[640px]">
                <thead>
                  <tr>
                    <th>{UVA.bezeichnung}</th>
                    <th>{UVA.kennzahl}</th>
                    <th className="text-right">{UVA.bemessung}</th>
                    <th className="text-right">{UVA.steuer}</th>
                    <th className="text-right">{UVA.belege}</th>
                  </tr>
                </thead>
                <tbody>
                  {(u.zeilen || []).map((z) => (
                    <tr key={`${z.kennzahl}${z.bezeichnung}`}>
                      <td className="font-medium">{z.bezeichnung}</td>
                      <td className="text-bo-text-soft">
                        <abbr title={`Kennzahl ${z.kennzahl} der Umsatzsteuervoranmeldung`} className="no-underline">
                          {z.kennzahl}
                        </abbr>
                      </td>
                      <td className="text-right tabular-nums">{cent(z.bemessung_cent)}</td>
                      <td className="text-right tabular-nums">{z.steuer_cent ? cent(z.steuer_cent) : "–"}</td>
                      <td className="text-right tabular-nums">{z.anzahl_belege}</td>
                    </tr>
                  ))}
                  <tr>
                    <td className="font-semibold">{UVA.zahllast}</td>
                    <td />
                    <td />
                    <td className="text-right font-semibold tabular-nums">{cent(u.zahllast_cent)}</td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[13px] text-bo-text-soft">
              <span>{uebergeben ? (schalter.uvaKorrektur ? "Korrektur-Auswertung möglich" : `${UVA.mitStb} · übergeben am ${datum(u.uebergeben_am)}`) : <Link className="hover:underline" href="/faktura/rechnungen?r=alle">Belege des Monats ansehen</Link>}</span>
              <span className="flex gap-2">
                {rolle.leitung && !uebergeben && <RueckfrageKnopf art="uva-berechnen" name={u.name} titel="Neu berechnen" frage="UVA neu berechnen?" primaer={false} ergebnis="UVA neu berechnet" />}
                <DruckenKnopf>Drucken</DruckenKnopf>
              </span>
            </div>
          </Kachel>
        )}
      </div>
    </FakturaSeite>
  );
}
