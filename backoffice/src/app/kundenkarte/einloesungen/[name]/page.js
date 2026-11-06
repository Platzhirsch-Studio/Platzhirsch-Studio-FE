import { notFound } from "next/navigation";
import Shell from "@/components/Backoffice/Shell/Shell";
import { AkteKopf } from "@/components/Backoffice/Akte";
import Kachel from "@/components/Backoffice/Kachel";
import Fehler from "@/components/Backoffice/Fehler";
import EinloesungSeite from "@/components/Backoffice/Kundenkarte/EinloesungSeite";
import { darfLeitungBitten } from "@/components/Backoffice/Informieren/server";
import { params, seitenStart } from "@/lib/backoffice/kundenkarte/seite";
import { alsFehler, ladeBerater, ladeEinloesung, ladeVorteile } from "@/lib/backoffice/kundenkarte/daten";
import { darfSchreiben, istLeitung } from "@/lib/backoffice/kundenkarte/regeln";
import { istBackofficeError } from "@/lib/backoffice/frappe/errors";
import { T } from "@/lib/backoffice/kundenkarte/texte";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params: p }) {
  const { name } = await p;
  return { title: `${decodeURIComponent(name)} · Kundenkarte` };
}

export default async function EinloesungVollseite({ params: p, searchParams }) {
  const { name: roh } = await p;
  const name = decodeURIComponent(roh);
  const sp = params(await searchParams);
  const ctx = await seitenStart(`/kundenkarte/einloesungen/${name}`, sp, { akte: true });
  let e;
  try {
    e = await ladeEinloesung(ctx, name);
  } catch (err) {
    if (istBackofficeError(err) && (err.code === "not_found" || err.code === "forbidden")) notFound();
    const f = alsFehler(err);
    return (
      <Shell session={ctx.session}>
        <Fehler code={f.code} message={f.message} zurueckHref="/kundenkarte/einloesungen" />
      </Shell>
    );
  }
  const [vorteile, berater, darfBitten] = await Promise.all([ladeVorteile(ctx).catch(() => []), ladeBerater(ctx), darfLeitungBitten(ctx.session, ctx.client).catch(() => false)]);
  const art = vorteile.find((v) => v.name === e.vorteil)?.art || "Sonstiges";
  return (
    <Shell session={ctx.session}>
      <AkteKopf zurueck={{ href: "/kundenkarte/einloesungen", titel: T.seiten.einloesungen }} krumen={[{ titel: T.bereich, href: "/kundenkarte" }, { titel: T.seiten.einloesungen, href: "/kundenkarte/einloesungen" }, { titel: e.name }]} titel={e.vorteil_titel} nummer={<span className="bo-kk-mono">{e.name}</span>} />
      <div className="max-w-3xl">
        <Kachel>
          <EinloesungSeite e={{ ...e, art }} user={ctx.user} leitung={istLeitung(ctx.rolle)} darfSchreiben={darfSchreiben(ctx.rolle)} darfBitten={darfBitten} berater={berater} />
        </Kachel>
      </div>
    </Shell>
  );
}
