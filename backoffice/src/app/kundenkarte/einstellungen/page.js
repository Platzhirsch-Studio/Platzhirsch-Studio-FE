import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Fehler from "@/components/Backoffice/Fehler";
import Einstellungen from "@/components/Backoffice/Kundenkarte/Einstellungen";
import { params, seitenStart, KRUMEN_BASIS } from "@/lib/backoffice/kundenkarte/seite";
import { ladeBerater, ladeEinstellungen, ladeStufen, sicher } from "@/lib/backoffice/kundenkarte/daten";
import { aufruf, M } from "@/lib/backoffice/kundenkarte/methoden";
import { istLeitung } from "@/lib/backoffice/kundenkarte/regeln";
import { T } from "@/lib/backoffice/kundenkarte/texte";

export const dynamic = "force-dynamic";
export const metadata = { title: "Einstellungen · Kundenkarte" };

const FELDER = ["startstufe", "bewertungszeitraum_monate", "herabstufung_erlaubt", "doi_pflicht", "doi_gueltig_stunden", "website_automatisch_annehmen", "berater_standard", "bedingungen_version", "text_begruessung", "text_datenschutz_karte", "wallet_pass_type_id", "wallet_team_id", "wallet_organisation", "modified"];

export default async function EinstellungenSeite({ searchParams }) {
  const sp = params(await searchParams);
  const ctx = await seitenStart("/kundenkarte/einstellungen", sp);
  const leitung = istLeitung(ctx.rolle);
  const [r, stufen, berater, wallet] = await Promise.all([sicher(() => ladeEinstellungen(ctx)), ladeStufen(ctx).catch(() => []), ladeBerater(ctx), leitung ? aufruf(ctx.client, M.wallet_status, {}).catch(() => null) : Promise.resolve(null)]);
  const werte = r.ok ? Object.fromEntries(FELDER.map((f) => [f, r.daten[f] ?? ""])) : null;
  return (
    <Shell session={ctx.session}>
      <Seitenkopf titel={T.seiten.einstellungen} krumen={[...KRUMEN_BASIS, { titel: T.seiten.einstellungen }]} />
      {r.ok ? <Einstellungen werte={werte} stufen={stufen.filter((s) => s.aktiv)} berater={berater} leitung={leitung} wallet={wallet} /> : <Fehler code={r.fehler.code} message={r.fehler.message} />}
    </Shell>
  );
}
