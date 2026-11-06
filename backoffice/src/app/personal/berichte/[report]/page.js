import { notFound } from "next/navigation";
import BerichtSeite, { ladeBericht } from "@/components/Backoffice/Bericht/BerichtSeite";
import { Balken } from "@/components/Backoffice/Charts";
import Kachel from "@/components/Backoffice/Kachel";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import PersonalHuelle from "@/components/Backoffice/Personal/Huelle";
import { params, seitenStart, KRUMEN_BASIS, monatAus } from "@/lib/backoffice/personal/seite";
import { berichtBewerbungsstatistik, berichtMonatsstunden, berichtAbwesenheiten, ladeLoeschfristen, ladeFaehigkeiten } from "@/lib/backoffice/personal/daten";
import { darfBerichte, darfExport, istLeitung, darfArtSehen } from "@/lib/backoffice/personal/rollen";
import { T } from "@/lib/backoffice/personal/texte";
import { plusTage, monatName, langDatum } from "@/lib/backoffice/personal/zeit";

export const dynamic = "force-dynamic";

const h = (min) => Math.round(((Number(min) || 0) / 60) * 100) / 100;

export async function generateMetadata({ params: p }) {
  const { report } = await p;
  const b = T.berichte.liste.find((x) => x.id === report);
  return { title: `${b?.titel || "Bericht"} · Personal` };
}

// T8 Berichte (Konzept § 5.11): Enter führt aus, Summenzeile, CSV nur Leitung (protokolliert), Quoten „–“ bei n < 5.
export default async function PersonalBericht({ params: p, searchParams }) {
  const { report } = await p;
  const def = T.berichte.liste.find((x) => x.id === report);
  if (!def) notFound();
  const sp = params(await searchParams);
  const ctx = await seitenStart(`/personal/berichte/${report}`, sp, darfBerichte);
  if (report === "loeschfristen" && !istLeitung(ctx.rolle)) notFound();
  const f = await ladeFaehigkeiten(ctx);
  const krumen = [KRUMEN_BASIS[0], KRUMEN_BASIS[1], { titel: T.berichte.titel, href: "/personal/berichte" }, { titel: def.titel }];
  if (["monatsstunden", "abwesenheiten"].includes(report) && !f.konten.an) {
    return (
      <PersonalHuelle ctx={ctx}>
        <Seitenkopf titel={def.titel} krumen={krumen} />
        <Kachel testid="per-bericht-gesperrt"><p className="text-[15px] text-bo-text-soft">{T.berichte.gesperrt}</p></Kachel>
      </PersonalHuelle>
    );
  }
  const von = /^\d{4}-\d{2}-\d{2}$/.test(sp.von || "") ? sp.von : plusTage(ctx.heute, -365);
  const bis = /^\d{4}-\d{2}-\d{2}$/.test(sp.bis || "") ? sp.bis : ctx.heute;
  let spalten = [];
  let ergebnis;
  let diagramme = null;
  let filter = { basis: `/personal/berichte/${report}`, params: sp, zeitraum: true };
  let untertitel = `${langDatum(von)} – ${langDatum(bis)}`;
  if (report === "bewerbungsstatistik") {
    spalten = [{ fieldname: "stelle", label: "Stelle" }, { fieldname: "eingang", label: "Eingänge", fieldtype: "Int" }, { fieldname: "gespraech", label: "Gespräche", fieldtype: "Int" }, { fieldname: "angebot", label: "Angebote", fieldtype: "Int" }, { fieldname: "eingestellt", label: "Eingestellt", fieldtype: "Int" }, { fieldname: "abgesagt", label: "Abgesagt", fieldtype: "Int" }, { fieldname: "quote_text", label: "Quote", summe: false }];
    ergebnis = await ladeBericht(async () => (await berichtBewerbungsstatistik(ctx, { von, bis })).map((z) => ({ ...z, quote_text: z.quote == null ? T.berichte.kleinN : `${z.quote} %` })));
    if (ergebnis.status === "ok" && ergebnis.zeilen.length) diagramme = <Balken className="md:col-span-12" titel="Eingänge je Stelle" punkte={ergebnis.zeilen.slice(0, 10).map((z) => ({ label: z.stelle.replace(/\s*\(m\/w\/d\)/, ""), wert: z.eingang }))} einblenden />;
  } else if (report === "loeschfristen") {
    filter = { basis: filter.basis, params: sp, zeitraum: false };
    untertitel = T.datenschutz.unter;
    spalten = [{ fieldname: "person", label: "Person – Stelle" }, { fieldname: "status", label: "Status" }, { fieldname: "frist", label: "Löschfrist" }, { fieldname: "zustand", label: "Zustand" }];
    ergebnis = await ladeBericht(async () => (await ladeLoeschfristen(ctx, { ansicht: "alle" })).zeilen.map((z) => ({ person: Number(z.pseudonymisiert) ? `${z.name} – ${z.stelle_titel || "Initiativbewerbung"}` : `${z.vorname} ${z.nachname} – ${z.stelle_titel || "Initiativbewerbung"}`, status: z.status, frist: z.info.datum ? langDatum(z.info.datum) : "–", zustand: Number(z.pseudonymisiert) ? "Personendaten gelöscht" : z.info.zustand })));
  } else if (report === "monatsstunden") {
    const { jahr, monat } = monatAus(sp, ctx.heute);
    untertitel = `${monatName(monat)} ${jahr} · bis gestern`;
    filter = { basis: filter.basis, params: sp, zeitraum: false };
    spalten = [{ fieldname: "person", label: "Person" }, { fieldname: "soll", label: "Soll (h)", fieldtype: "Float" }, { fieldname: "ist", label: "Ist (h)", fieldtype: "Float" }, { fieldname: "angerechnet", label: "Angerechnet (h)", fieldtype: "Float" }, { fieldname: "saldo", label: "Stundensaldo ohne Zuschläge (h)", fieldtype: "Float" }];
    ergebnis = await ladeBericht(async () => (await berichtMonatsstunden(ctx, { jahr, monat })).map((z) => ({ person: z.person, soll: h(z.soll), ist: h(z.ist), angerechnet: h(z.angerechnet), saldo: h(z.saldo) })));
  } else {
    const jahr = Number(sp.jahr) || Number(ctx.heute.slice(0, 4));
    untertitel = `Jahr ${jahr}`;
    filter = { basis: filter.basis, params: sp, zeitraum: false };
    spalten = [{ fieldname: "person", label: "Person" }, { fieldname: "urlaub", label: "Urlaub", fieldtype: "Int" }, { fieldname: "za", label: "Zeitausgleich", fieldtype: "Int" }, { fieldname: "fortbildung", label: "Fortbildung/Schule", fieldtype: "Int" }, { fieldname: "sonstige", label: "Sonstige", fieldtype: "Int" }, ...(darfArtSehen(ctx.rolle) ? [{ fieldname: "krank", label: "Krankenstand", fieldtype: "Int" }] : [])];
    ergebnis = await ladeBericht(() => berichtAbwesenheiten(ctx, { jahr }));
  }
  return (
    <PersonalHuelle ctx={ctx}>
      <BerichtSeite bericht={`personal-${report}`} bereich="personal" titel={def.titel} untertitel={untertitel} krumen={krumen} filter={filter} ergebnis={ergebnis} spalten={spalten} diagramme={diagramme} darfExport={darfExport(ctx.rolle)} testid={`per-bericht-${report}`} />
    </PersonalHuelle>
  );
}
