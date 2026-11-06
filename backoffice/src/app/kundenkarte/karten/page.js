import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Knopf from "@/components/Backoffice/Knopf";
import Segment from "@/components/Backoffice/Segment";
import Erstbesuch from "@/components/Backoffice/Erstbesuch";
import Fehler from "@/components/Backoffice/Fehler";
import KartenListe from "@/components/Backoffice/Kundenkarte/KartenListe";
import KartenSuche from "@/components/Backoffice/Kundenkarte/KartenSuche";
import Filter from "@/components/Backoffice/Kundenkarte/Filter";
import { params, seitenStart, KRUMEN_BASIS } from "@/lib/backoffice/kundenkarte/seite";
import { KARTEN_REITER, SEITE_GROESSE, ladeBerater, ladeKarten, ladeStufen, sicher } from "@/lib/backoffice/kundenkarte/daten";
import { darfBetraege, darfSchreiben, istLeitung } from "@/lib/backoffice/kundenkarte/regeln";
import { KARTE_STATUS } from "@/lib/backoffice/kundenkarte/labels";
import { T } from "@/lib/backoffice/kundenkarte/texte";

export const dynamic = "force-dynamic";
export const metadata = { title: "Karten · Kundenkarte" };

export default async function KartenSeite({ searchParams }) {
  const sp = params(await searchParams);
  const ctx = await seitenStart("/kundenkarte/karten", sp);
  const leitung = istLeitung(ctx.rolle);
  let reiter = KARTEN_REITER.includes(sp.reiter) ? sp.reiter : "alle";
  if ((reiter === "dubletten" || reiter === "manuell") && !leitung) reiter = "alle";
  const seite = Math.max(1, Number(sp.seite) || 1);
  const [daten, stufen, berater] = await Promise.all([sicher(() => ladeKarten(ctx, { reiter, q: sp.q || "", status: sp.status || "", stufe: sp.stufe || "", berater: sp.berater || "", seite })), ladeStufen(ctx).catch(() => []), ladeBerater(ctx)]);
  const z = daten.ok ? daten.daten.zaehler : {};
  const ohneReiter = Object.fromEntries(Object.entries(sp).filter(([k]) => !["reiter", "seite"].includes(k)));
  const reiterHref = (r) => {
    const p = new URLSearchParams(ohneReiter);
    if (r !== "alle") p.set("reiter", r);
    const s = p.toString();
    return s ? `/kundenkarte/karten?${s}` : "/kundenkarte/karten";
  };
  const optionen = [
    { wert: "alle", titel: T.karten.reiter.alle, href: reiterHref("alle") },
    { wert: "ohneBerater", titel: T.karten.reiter.ohneBerater, href: reiterHref("ohneBerater"), anzahl: z.ohneBerater },
    { wert: "uebergabe", titel: T.karten.reiter.uebergabe, href: reiterHref("uebergabe"), anzahl: z.uebergabe },
    ...(leitung ? [{ wert: "dubletten", titel: T.karten.reiter.dubletten, href: reiterHref("dubletten"), anzahl: z.dubletten }, { wert: "manuell", titel: T.karten.reiter.manuell, href: reiterHref("manuell") }] : []),
  ];
  return (
    <Shell session={ctx.session}>
      <Seitenkopf
        titel={T.seiten.karten}
        krumen={[...KRUMEN_BASIS, { titel: T.seiten.karten }]}
        kennzahlen={daten.ok ? [{ wert: daten.daten.gesamtAlle, text: "Karten gesamt" }] : []}
        aktionen={
          darfSchreiben(ctx.rolle) ? (
            <Knopf variant="primary" icon="Plus" href="/kundenkarte/karten/neu" data-testid="kk-neue-karte">
              {T.seiten.neu}
            </Knopf>
          ) : null
        }
      />
      <Erstbesuch text={T.erstbesuch.karten} route="/kundenkarte/karten" />
      <div className="mb-5 flex flex-col gap-3">
        <Segment label="Ansicht" optionen={optionen} aktiv={reiter} testid="kk-karten-reiter" />
        <div className="bo-kk-werkzeuge">
          <KartenSuche start={sp.q || ""} params={sp} />
          <Filter
            basis="/kundenkarte/karten"
            params={sp}
            felder={[
              { name: "status", label: T.karten.status, optionen: Object.entries(KARTE_STATUS).map(([wert, v]) => ({ wert, titel: v.label })) },
              { name: "stufe", label: T.karten.stufe, optionen: stufen.map((s) => ({ wert: s.name, titel: s.stufenname })) },
              { name: "berater", label: T.karten.berater, optionen: [...berater, { wert: "-", titel: T.karten.ohneBeraterWert }] },
            ]}
          />
        </div>
      </div>
      {daten.ok ? (
        <KartenListe
          zeilen={daten.daten.zeilen}
          gesamt={daten.daten.gesamt}
          gesamtAlle={daten.daten.gesamtAlle}
          seite={seite}
          groesse={SEITE_GROESSE}
          params={sp}
          reiter={reiter}
          stufen={stufen.map((s) => ({ name: s.name, farbe: s.farbe }))}
          berater={berater}
          darfSchreiben={darfSchreiben(ctx.rolle)}
          leitung={leitung}
          betraege={darfBetraege(ctx.rolle)}
          dubletten={daten.daten.dubletten}
        />
      ) : (
        <Fehler code={daten.fehler.code} message={daten.fehler.message} />
      )}
    </Shell>
  );
}
