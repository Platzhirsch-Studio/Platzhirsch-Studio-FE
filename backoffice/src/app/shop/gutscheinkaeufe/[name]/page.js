// /shop/gutscheinkaeufe/[name] – Gutscheinkauf (T5; 10-konzept-shop § 5.4): Tabs Übersicht · Gutscheine ·
// Zahlung & Nachweis · Verlauf. Primär bei „bezahlt“: Gutschein-Mail erneut senden (Undo); Leitung: Erstatten.
import { notFound } from "next/navigation";
import { zugang } from "@/lib/backoffice/shop/zugang";
import { akte, sicher } from "@/lib/backoffice/shop/daten";
import { kaufAktionen } from "@/lib/backoffice/shop/aktenAktionen";
import { statusInfo } from "@/lib/backoffice/shop/status";
import { T } from "@/lib/backoffice/shop/texte";
import { cent, datum, datumZeit } from "@/lib/backoffice/format";
import { aktiverTab } from "@/lib/backoffice/akte/geruest";
import Rahmen from "@/components/Backoffice/Shop/Rahmen";
import { AkteGeruest, AkteKopf, Band, RechteSpalte, AkteTabs } from "@/components/Backoffice/Akte";
import Kachel from "@/components/Backoffice/Kachel";
import StatusBadge from "@/components/Backoffice/StatusBadge";
import { AktenAktionen } from "@/components/Backoffice/Shop/AktionsKnoepfe";
import { Verlauf, Fakten, BezugListe } from "@/components/Backoffice/Shop/Akteteile";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }) {
  return { title: `${decodeURIComponent((await params).name)} · Gutscheinkauf` };
}

export default async function GutscheinkaufAkte({ params, searchParams }) {
  const { name: roh } = await params;
  const name = decodeURIComponent(roh);
  const sp = await searchParams;
  const ctx = await zugang(`/shop/gutscheinkaeufe/${roh}`);
  const { client, session, leitung } = ctx;
  const a = await akte(client, "PH Gutschein Bestellung", name);
  if (!a?.doc) notFound();
  const k = a.doc;
  const gs = await sicher(() => client.getList("PH Gutschein", { fields: ["name", "code_letzte4", "status", "rest_cent", "wert_cent"], filters: [["gutschein_bestellung", "=", name]], limit: 20 }));
  const erstattbar = gs.filter((g) => Number(g.rest_cent) === Number(g.wert_cent) && !["Erstattet", "Gesperrt"].includes(g.status)).reduce((s, g) => s + Number(g.rest_cent), 0);
  const ak = kaufAktionen(k, { leitung });
  const st = statusInfo("PH Gutschein Bestellung", k.status);
  const tabs = [{ id: "uebersicht", titel: "Übersicht" }, { id: "gutscheine", titel: "Gutscheine", anzahl: gs.length }, { id: "zahlung", titel: "Zahlung & Nachweis" }, { id: "verlauf", titel: "Verlauf" }];
  const tab = aktiverTab(tabs, sp.tab);
  const basis = `/shop/gutscheinkaeufe/${roh}`;
  const doc = { doctype: "PH Gutschein Bestellung", name, status: k.status, erstattbar_cent: erstattbar };
  return (
    <Rahmen session={session} modus={client.modus}>
      <AkteGeruest testid="gutscheinkaufakte"
        kopf={<AkteKopf zurueck={{ href: "/shop/gutscheine?tab=kaeufe", titel: "Gutscheinkäufe" }} krumen={[{ titel: "Shop", href: "/shop" }, { titel: "Gutscheinkäufe", href: "/shop/gutscheine?tab=kaeufe" }, { titel: name }]} titel={k.kaeufer_name} nummer={<span className="bo-shop-zelle-nr mr-2">{name}</span>} status={<StatusBadge wert={k.status} text={st.anzeige} ton={st.ton} groesse="m" />} betrag={{ cent: Number(k.summe_cent), unter: `${k.anzahl} × ${cent(k.betrag_cent)}` }} aktionen={<AktenAktionen primaer={ak.primaer} sekundaer={ak.sekundaer} menue={ak.menue} doc={doc} />} />}
        band={k.status === "pruefen" ? <div className="mb-6"><Band ton="gefahr" text={T.baender.kaufPruefen} /></div> : null}
        reiter={<AkteTabs tabs={tabs} aktiv={tab} basis={basis} params={{}} />}
        rechts={<RechteSpalte bezuege={<BezugListe eintraege={[k.zahlung ? { titel: `Zahlung ${k.zahlung}`, wert: "Stripe", href: `/shop/zahlungen/${encodeURIComponent(k.zahlung)}`, icon: "Wallet" } : null, k.widerruf ? { titel: `Widerruf ${k.widerruf}`, wert: "", href: `/shop/widerrufe/${encodeURIComponent(k.widerruf)}`, icon: "Undo2" } : null].filter(Boolean)} />} />}
      >
        {tab === "uebersicht" && <Kachel titel="Übersicht"><Fakten eintraege={[{ label: "Anzahl × Wert", wert: `${k.anzahl} × ${cent(k.betrag_cent)}` }, { label: "Summe", wert: cent(k.summe_cent) }, { label: "Motiv", wert: k.motiv || "–" }, { label: "Für", wert: k.empfaenger || "–" }, { label: "Käufer", wert: k.kaeufer_name }, { label: "E-Mail", wert: k.kaeufer_email }, { label: "Rechnungsadresse", wert: k.rechnung_adresse || "–" }, { label: "Mail gesendet", wert: k.mail_gesendet_am ? datumZeit(k.mail_gesendet_am) : "–" }]} /></Kachel>}
        {tab === "gutscheine" && (
          <Kachel titel="Gutscheine">
            {gs.length ? (
              <ul className="bo-shop-zeilen">{gs.map((g) => <li key={g.name} className="bo-shop-zeile"><span className="bo-shop-zeile__ico">·</span><a href={`/shop/gutscheine/${encodeURIComponent(g.name)}`} className="bo-shop-code hover:underline" style={{ fontSize: 15 }}>····-{g.code_letzte4}</a><span className="flex items-center gap-3"><StatusBadge wert={g.status} text={statusInfo("PH Gutschein", g.status, g).anzeige} ton={statusInfo("PH Gutschein", g.status, g).ton} /><span className="bo-shop-betrag">{cent(g.rest_cent)}</span></span></li>)}</ul>
            ) : <p className="py-6 text-center text-[15px] text-bo-text-soft">{T.leer.gutscheineKauf}</p>}
          </Kachel>
        )}
        {tab === "zahlung" && <Kachel titel="Zahlung & Nachweis"><Fakten eintraege={[{ label: "Zahlung", wert: k.zahlung || "–" }, { label: "Bezahlt am", wert: k.bezahlt_am ? datumZeit(k.bezahlt_am) : "–" }, { label: "Erstattet", wert: cent(k.erstattet_cent || 0) }, { label: "Erstattbar höchstens", wert: cent(erstattbar) }, { label: "Bedingungen-Stand", wert: k.zustimmung_bedingungen_stand ? datum(k.zustimmung_bedingungen_stand) : "–" }, { label: "Zustimmung", wert: k.zustimmung_zeit ? datumZeit(k.zustimmung_zeit) : "–" }]} /></Kachel>}
        {tab === "verlauf" && <Kachel titel="Verlauf"><Verlauf verlauf={k.verlauf} docinfo={a.docinfo} filter={sp.verlauf || "alle"} basis={`${basis}?tab=verlauf`} /></Kachel>}
      </AkteGeruest>
    </Rahmen>
  );
}
