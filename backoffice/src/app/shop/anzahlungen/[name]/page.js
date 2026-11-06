// /shop/anzahlungen/[name] – Anzahlungsakte (T5; 10-konzept-shop § 5.5): Phasen Offen → Link gesendet → Bezahlt,
// Tabs Übersicht · Zahlungen · Verlauf, Band bei doppelten Zahlungen bzw. abgelaufenem Link.
import { notFound } from "next/navigation";
import { zugang } from "@/lib/backoffice/shop/zugang";
import { akte, sicher } from "@/lib/backoffice/shop/daten";
import { anzahlungAktionen } from "@/lib/backoffice/shop/aktenAktionen";
import { statusInfo, kanalText } from "@/lib/backoffice/shop/status";
import { tagVon } from "@/lib/backoffice/shop/fristen";
import { T } from "@/lib/backoffice/shop/texte";
import { cent, datumZeit } from "@/lib/backoffice/format";
import { aktiverTab } from "@/lib/backoffice/akte/geruest";
import Rahmen from "@/components/Backoffice/Shop/Rahmen";
import { AkteGeruest, AkteKopf, Band, RechteSpalte, AkteTabs } from "@/components/Backoffice/Akte";
import Kachel from "@/components/Backoffice/Kachel";
import StatusBadge from "@/components/Backoffice/StatusBadge";
import { AktenAktionen } from "@/components/Backoffice/Shop/AktionsKnoepfe";
import { BandKnopf } from "@/components/Backoffice/Shop/Teile";
import { Phasenleiste, Verlauf, Fakten, BezugListe } from "@/components/Backoffice/Shop/Akteteile";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }) {
  return { title: `${decodeURIComponent((await params).name)} · Anzahlung` };
}

export default async function AnzahlungAkte({ params, searchParams }) {
  const { name: roh } = await params;
  const name = decodeURIComponent(roh);
  const sp = await searchParams;
  const ctx = await zugang(`/shop/anzahlungen/${roh}`);
  const { client, session, leitung, heute } = ctx;
  const a = await akte(client, "PH Anzahlung", name);
  if (!a?.doc) notFound();
  const x = a.doc;
  const zs = await sicher(() => client.getList("PH Zahlung", { fields: ["name", "kanal", "betrag_cent", "zeitpunkt", "status"], filters: [["bezug", "=", name]], limit: 20 }));
  const ak = anzahlungAktionen(x, { leitung });
  const st = statusInfo("PH Anzahlung", x.status);
  const doppeltOffen = (x.doppelt || []).filter((d) => Number(d.erstattet_cent || 0) < Number(d.betrag_cent || 0));
  const doppeltCent = doppeltOffen.reduce((s, d) => s + Number(d.betrag_cent), 0);
  const abgelaufen = ["offen", "fehlgeschlagen"].includes(x.status) && x.link_gueltig_bis && tagVon(x.link_gueltig_bis) < heute;
  const tabs = [{ id: "uebersicht", titel: "Übersicht" }, { id: "zahlungen", titel: "Zahlungen", anzahl: zs.length + (x.doppelt || []).length }, { id: "verlauf", titel: "Verlauf" }];
  const tab = aktiverTab(tabs, sp.tab);
  const basis = `/shop/anzahlungen/${roh}`;
  const doc = { doctype: "PH Anzahlung", name, status: x.status, doppelt: doppeltOffen, doppelt_cent: doppeltCent };
  const phasen = [{ id: "o", titel: "Offen", zustand: "erledigt", datum: x.erstellt }, { id: "l", titel: "Link gesendet", zustand: x.bezahlt_am ? "erledigt" : x.link_gesendet_am ? "aktuell" : "offen", datum: x.link_gesendet_am }, { id: "b", titel: "Bezahlt", zustand: x.bezahlt_am ? "aktuell" : "offen", datum: x.bezahlt_am }];
  return (
    <Rahmen session={session} modus={client.modus}>
      <AkteGeruest testid="anzahlungsakte"
        kopf={<AkteKopf zurueck={{ href: "/shop/anzahlungen", titel: "Anzahlungen" }} krumen={[{ titel: "Shop", href: "/shop" }, { titel: "Anzahlungen", href: "/shop/anzahlungen" }, { titel: name }]} titel={`Anzahlung ${x.auftrag_referenz}`} nummer={<span className="bo-shop-zelle-nr mr-2">{name}</span>} status={<StatusBadge wert={x.status} text={st.anzeige} ton={st.ton} groesse="m" />} betrag={{ cent: Number(x.betrag_cent) }} aktionen={<AktenAktionen primaer={ak.primaer} sekundaer={ak.sekundaer} menue={ak.menue} doc={doc} />} />}
        band={doppeltOffen.length ? <div className="mb-6"><Band ton="gefahr" text={T.baender.doppelt(doppeltOffen.length, cent(doppeltCent))} aktion={leitung ? <BandKnopf id="doppelte-erstatten" titel="Doppelte erstatten" doc={doc} /> : null} /></div> : abgelaufen ? <div className="mb-6"><Band ton="warnung" text={T.baender.linkAbgelaufen} /></div> : null}
        vorgang={<Phasenleiste schritte={phasen} label="Anzahlung" />}
        vorgangOben
        reiter={<AkteTabs tabs={tabs} aktiv={tab} basis={basis} params={{}} />}
        rechts={<RechteSpalte bezuege={<BezugListe eintraege={[{ titel: `Auftrag ${x.auftrag_referenz}`, wert: "Faktura", href: "/faktura", icon: "FileText" }, x.zahlung ? { titel: `Zahlung ${x.zahlung}`, wert: "Eingang", href: `/shop/zahlungen/${encodeURIComponent(x.zahlung)}`, icon: "Wallet" } : null].filter(Boolean)} />} />}
      >
        {tab === "uebersicht" && <Kachel titel="Übersicht"><Fakten eintraege={[{ label: "Betrag", wert: cent(x.betrag_cent) }, { label: "Beschreibung", wert: x.beschreibung || "–" }, { label: "Kunde", wert: x.kunde_email || "–" }, { label: "Link gültig bis", wert: x.link_gueltig_bis ? datumZeit(x.link_gueltig_bis) : "–" }, { label: "Gesendet am", wert: x.link_gesendet_am ? datumZeit(x.link_gesendet_am) : "–" }, { label: "Bezahlt am", wert: x.bezahlt_am ? datumZeit(x.bezahlt_am) : "–" }]} /></Kachel>}
        {tab === "zahlungen" && (
          <Kachel titel="Zahlungen">
            <ul className="bo-shop-posten">
              {zs.map((z) => <li key={z.name}><span><a className="hover:underline" href={`/shop/zahlungen/${encodeURIComponent(z.name)}`}>{z.name}</a> · {kanalText(z.kanal)} · {datumZeit(z.zeitpunkt)}</span><strong className="tabular-nums">{cent(z.betrag_cent)}</strong></li>)}
              {(x.doppelt || []).map((d, i) => <li key={`d${i}`}><span>Doppelt · {datumZeit(d.zeit)}{Number(d.erstattet_cent) ? " · erstattet" : ""}</span><strong className="tabular-nums">{cent(d.betrag_cent)}</strong></li>)}
              {!zs.length && !(x.doppelt || []).length && <li><span className="text-bo-text-soft">Noch keine Zahlung.</span><span /></li>}
            </ul>
          </Kachel>
        )}
        {tab === "verlauf" && <Kachel titel="Verlauf"><Verlauf verlauf={x.verlauf} docinfo={a.docinfo} filter={sp.verlauf || "alle"} basis={`${basis}?tab=verlauf`} /></Kachel>}
      </AkteGeruest>
    </Rahmen>
  );
}
