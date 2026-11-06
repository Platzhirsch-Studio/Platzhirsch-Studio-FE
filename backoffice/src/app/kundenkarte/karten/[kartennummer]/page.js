import { notFound, redirect } from "next/navigation";
import Shell from "@/components/Backoffice/Shell/Shell";
import { AkteGeruest, AkteKopf, AkteTabs, Band } from "@/components/Backoffice/Akte";
import Knopf from "@/components/Backoffice/Knopf";
import Erstbesuch from "@/components/Backoffice/Erstbesuch";
import Fehler from "@/components/Backoffice/Fehler";
import KarteKopf from "@/components/Backoffice/Kundenkarte/KarteKopf";
import Stufenblock from "@/components/Backoffice/Kundenkarte/Stufenblock";
import VorteileTab from "@/components/Backoffice/Kundenkarte/VorteileTab";
import VerlaufTab from "@/components/Backoffice/Kundenkarte/VerlaufTab";
import DetailsTab from "@/components/Backoffice/Kundenkarte/DetailsTab";
import { BezuegeKachel, EinkaeufeTab, NaechsterSchrittKachel } from "@/components/Backoffice/Kundenkarte/AkteTeile";
import { darfLeitungBitten } from "@/components/Backoffice/Informieren/server";
import { params, seitenStart } from "@/lib/backoffice/kundenkarte/seite";
import { alsFehler, ladeBerater, ladeBezuege, ladeEinkaeufe, ladeFaehigkeiten, ladeKarte, ladeVerlauf, beraterName } from "@/lib/backoffice/kundenkarte/daten";
import { aufruf, M } from "@/lib/backoffice/kundenkarte/methoden";
import { istKartennummer, normalisiereKartennummer } from "@/lib/backoffice/kundenkarte/kartennummer";
import { bandFuer, darfBetraege, darfSchreiben, istLeitung, naechsterSchritt } from "@/lib/backoffice/kundenkarte/regeln";
import { istBackofficeError } from "@/lib/backoffice/frappe/errors";
import { datum, datumZeit } from "@/lib/backoffice/format";
import { T } from "@/lib/backoffice/kundenkarte/texte";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params: p }) {
  const { kartennummer } = await p;
  return { title: `${decodeURIComponent(kartennummer)} · Kundenkarte` };
}

const TABS = ["vorteile", "verlauf", "einkaeufe", "details"];

export default async function KarteAkte({ params: p, searchParams }) {
  const { kartennummer: roh } = await p;
  const sp = params(await searchParams);
  const nr = normalisiereKartennummer(decodeURIComponent(roh));
  if (!istKartennummer(nr)) notFound();
  if (nr !== decodeURIComponent(roh)) redirect(`/kundenkarte/karten/${nr}`);
  const ctx = await seitenStart(`/kundenkarte/karten/${nr}`, sp, { akte: true });
  const leitung = istLeitung(ctx.rolle);
  const schreiben = darfSchreiben(ctx.rolle);
  const betraege = darfBetraege(ctx.rolle);

  let daten;
  try {
    daten = await ladeKarte(ctx, nr);
  } catch (err) {
    if (istBackofficeError(err) && (err.code === "not_found" || err.code === "forbidden")) notFound();
    const f = alsFehler(err);
    return (
      <Shell session={ctx.session}>
        <AkteKopf zurueck={{ href: "/kundenkarte/karten", titel: T.seiten.karten }} krumen={[{ titel: T.bereich, href: "/kundenkarte" }, { titel: T.seiten.karten, href: "/kundenkarte/karten" }, { titel: nr }]} />
        <Fehler code={f.code} message={f.message} zurueckHref="/kundenkarte/karten" />
      </Shell>
    );
  }
  const { karte, uebersicht, stufen, hoehere, einstellungen, kommentare } = daten;
  const tab = sp.tab === "seite" ? "seite" : TABS.includes(sp.tab) ? sp.tab : "vorteile";
  const [berater, faehig, darfBitten, bezuege, verlauf, einkaeufe, walletStatus, kontakt] = await Promise.all([
    ladeBerater(ctx),
    ladeFaehigkeiten(ctx),
    darfLeitungBitten(ctx.session, ctx.client).catch(() => false),
    ladeBezuege(ctx, karte).catch(() => null),
    tab === "verlauf" ? ladeVerlauf(ctx, karte, kommentare) : Promise.resolve([]),
    tab === "einkaeufe" ? ladeEinkaeufe(ctx, karte) : Promise.resolve([]),
    leitung ? aufruf(ctx.client, M.wallet_status, {}).catch(() => null) : Promise.resolve(null),
    karte.kontakt ? ctx.client.getDoc("PH Kontakt", karte.kontakt).catch(() => null) : Promise.resolve(null),
  ]);
  const ungenutzt = (uebersicht.vorteile || []).filter((v) => v.einloesbar_pro_jahr > 0 && v.verbleibend > 0).map((v) => v.titel);
  const schritt = naechsterSchritt(karte, { ungenutzt, jetzt: ctx.jetzt });
  const band = bandFuer(karte, { datum });
  const wallet = leitung && walletStatus
    ? { eingerichtet: Boolean(walletStatus.apple?.konfiguriert || walletStatus.google?.konfiguriert), text: `Apple: ${walletStatus.apple?.konfiguriert ? "eingerichtet" : "nicht eingerichtet"} · Google: ${walletStatus.google?.konfiguriert ? "eingerichtet" : "nicht eingerichtet"}` }
    : { eingerichtet: Boolean(karte.wallet_pass_seriennummer), text: karte.wallet_pass_seriennummer ? "Pass ist eingerichtet." : "" };
  const zahl = (n) => (n ? n : undefined);

  const bandKnopf =
    band?.art === "gesperrt" ? null : band?.ziel ? (
      <Knopf size="s" href={`/kundenkarte/karten/${band.ziel}`} iconRechts="ArrowRight">
        Zur neuen Karte
      </Knopf>
    ) : band?.art === "gekuendigt" && schreiben ? (
      <Knopf size="s" href={`/kundenkarte/karten/neu?kontakt=${encodeURIComponent(karte.kontakt || "")}`} icon="Plus">
        {T.seiten.neu}
      </Knopf>
    ) : null;

  return (
    <Shell session={ctx.session}>
      <AkteGeruest
        testid="kk-akte"
        kopf={<AkteKopf zurueck={{ href: "/kundenkarte/karten", titel: T.seiten.karten }} krumen={[{ titel: T.bereich, href: "/kundenkarte" }, { titel: T.seiten.karten, href: "/kundenkarte/karten" }, { titel: karte.name }]} />}
        hero={
          <div className="flex flex-col gap-4">
            <KarteKopf
              karte={{ ...karte, berater_name: beraterName(berater, karte.persoenlicher_berater) }}
              uebersicht={uebersicht}
              stufen={stufen}
              rolle={ctx.rolle}
              darfSchreiben={schreiben}
              leitung={leitung}
              darfBitten={darfBitten}
              datenschutz={einstellungen.text_datenschutz_karte}
              pdf={ctx.client.modus === "frappe"}
              startEinloesen={sp.einloesen === "1"}
              startDruck={sp.druck === "1"}
            />
            <Stufenblock
              karte={karte}
              stufen={stufen}
              uebersicht={{ ...uebersicht, umsatz_stand: betraege && karte.umsatz_berechnet_am ? datumZeit(karte.umsatz_berechnet_am) : null }}
              betraegeErlaubt={betraege}
              darfSchreiben={schreiben}
              umsatzregeln={faehig["kundenkarte.umsatzregeln"]?.an}
              startstufe={stufen.find((s) => s.aktiv)?.stufenname || "Platzhirsch"}
              kundenmodus={/^[a-f0-9]{32}$/.test(sp.kundenmodus || "") ? sp.kundenmodus : ""}
              oeffneEinwilligung={sp.einwilligung === "1"}
            />
          </div>
        }
        band={band ? <Band ton={band.ton} titel={band.titel} text={band.text} aktion={bandKnopf} testid="kk-band" /> : null}
        reiter={
          <AkteTabs
            tabs={[
              { id: "vorteile", titel: T.akte.tabs.vorteile, anzahl: zahl((uebersicht.vorteile || []).length) },
              { id: "verlauf", titel: T.akte.tabs.verlauf },
              { id: "einkaeufe", titel: T.akte.tabs.einkaeufe },
              { id: "details", titel: T.akte.tabs.details },
            ]}
            aktiv={tab}
            basis={`/kundenkarte/karten/${karte.name}`}
            mitSeite
          />
        }
        rechts={
          <>
            <NaechsterSchrittKachel schritt={schritt} karte={karte} />
            <BezuegeKachel karte={karte} bezuege={bezuege} />
          </>
        }
        seiteAktiv={tab === "seite"}
      >
        <Erstbesuch text={T.erstbesuch.karte} route="/kundenkarte/karten/akte" />
        {tab === "vorteile" && <VorteileTab karte={karte.name} kunde={karte.kunde_name} status={karte.status} vorteile={uebersicht.vorteile || []} hoehere={hoehere} darf={schreiben} leitung={leitung} jahr={ctx.jetzt.getFullYear()} />}
        {tab === "verlauf" && <VerlaufTab karte={karte.name} eintraege={verlauf} user={ctx.user} leitung={leitung} darfSchreiben={schreiben} betraege={betraege} />}
        {tab === "einkaeufe" && <EinkaeufeTab belege={einkaeufe} einwilligung={Number(karte.einwilligung_auswertung) === 1} betraege={betraege} darfSchreiben={schreiben} />}
        {tab === "details" && <DetailsTab karte={karte} berater={berater} darfSchreiben={schreiben} leitung={leitung} wallet={wallet} mitEmail={Boolean(kontakt?.email ?? true)} />}
      </AkteGeruest>
    </Shell>
  );
}
