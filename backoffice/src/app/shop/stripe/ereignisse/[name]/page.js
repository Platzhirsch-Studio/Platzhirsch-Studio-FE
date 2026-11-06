// /shop/stripe/ereignisse/[name] – Stripe-Ereignis (T5; 10-konzept-shop § 5.8): Klartext-Typ, Bezug, Ergebnis,
// Inhalt eingeklappt; „Erneut verarbeiten“ nur bei Fehler/ignoriert (idempotent).
import { notFound } from "next/navigation";
import { zugang } from "@/lib/backoffice/shop/zugang";
import { akte } from "@/lib/backoffice/shop/daten";
import { ereignisAktionen } from "@/lib/backoffice/shop/aktenAktionen";
import { statusInfo } from "@/lib/backoffice/shop/status";
import { stripeTyp } from "@/lib/backoffice/shop/stripeTypen";
import { darfStripe } from "@/lib/backoffice/shop/rechte";
import { datumZeit } from "@/lib/backoffice/format";
import { aktiverTab } from "@/lib/backoffice/akte/geruest";
import Rahmen from "@/components/Backoffice/Shop/Rahmen";
import { AkteGeruest, AkteKopf, Band, AkteTabs } from "@/components/Backoffice/Akte";
import Kachel from "@/components/Backoffice/Kachel";
import StatusBadge from "@/components/Backoffice/StatusBadge";
import { AktenAktionen } from "@/components/Backoffice/Shop/AktionsKnoepfe";
import { Verlauf, Fakten } from "@/components/Backoffice/Shop/Akteteile";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }) {
  return { title: `${decodeURIComponent((await params).name)} · Stripe` };
}

const BEZUG = { "PH Bestellung": "/shop/bestellungen/", "PH Zahlung": "/shop/zahlungen/", "PH Stripe Auszahlung": "/shop/stripe/auszahlungen/" };

export default async function EreignisAkte({ params, searchParams }) {
  const { name: roh } = await params;
  const name = decodeURIComponent(roh);
  const sp = await searchParams;
  const ctx = await zugang(`/shop/stripe/ereignisse/${roh}`, darfStripe);
  const { client, session, leitung } = ctx;
  const a = await akte(client, "PH Stripe Ereignis", name);
  if (!a?.doc) notFound();
  const e = a.doc;
  const ak = ereignisAktionen(e, { leitung });
  const st = statusInfo("PH Stripe Ereignis", e.status);
  const tabs = [{ id: "uebersicht", titel: "Übersicht" }, { id: "inhalt", titel: "Inhalt" }, { id: "verlauf", titel: "Verlauf" }];
  const tab = aktiverTab(tabs, sp.tab);
  const basis = `/shop/stripe/ereignisse/${roh}`;
  return (
    <Rahmen session={session} modus={client.modus}>
      <AkteGeruest testid="ereignisakte"
        kopf={<AkteKopf zurueck={{ href: "/shop/stripe", titel: "Stripe" }} krumen={[{ titel: "Shop", href: "/shop" }, { titel: "Stripe", href: "/shop/stripe" }, { titel: name }]} titel={stripeTyp(e.typ)} nummer={<span className="mr-2 font-mono text-[12px] text-bo-text-soft">{e.typ}</span>} status={<StatusBadge wert={e.status} text={st.anzeige} ton={st.ton} groesse="m" />} aktionen={<AktenAktionen primaer={ak.primaer} doc={{ doctype: "PH Stripe Ereignis", name }} />} />}
        band={e.fehler ? <div className="mb-6"><Band ton="gefahr" text={e.fehler} /></div> : !e.bezug ? <div className="mb-6"><Band ton="neutral" text="Keinem Vorgang zugeordnet" /></div> : null}
        reiter={<AkteTabs tabs={tabs} aktiv={tab} basis={basis} params={{}} />}
      >
        {tab === "uebersicht" && <Kachel titel="Übersicht"><Fakten eintraege={[{ label: "Ereignis", wert: name, mono: true }, { label: "Bezug", wert: e.bezug || "–", href: e.bezug && BEZUG[e.bezug_doctype] ? `${BEZUG[e.bezug_doctype]}${encodeURIComponent(e.bezug)}` : undefined }, { label: "Empfangen", wert: datumZeit(e.empfangen_am) }, { label: "Verarbeitet", wert: e.verarbeitet_am ? datumZeit(e.verarbeitet_am) : "–" }, { label: "Versuche", wert: String(e.versuche || 1) }, { label: "Ergebnis", wert: e.ergebnis || "–" }, { label: "Live/Test", wert: Number(e.livemode) ? "Live" : "Test" }]} /></Kachel>}
        {tab === "inhalt" && <Kachel titel="Inhalt"><details><summary className="cursor-pointer text-[14px] font-medium">Nachricht von Stripe anzeigen</summary><pre className="mt-3 max-h-[480px] overflow-auto rounded-[16px] bg-bo-surface-2 p-4 text-[12px] leading-5">{e.payload_json}</pre></details></Kachel>}
        {tab === "verlauf" && <Kachel titel="Verlauf"><Verlauf docinfo={a.docinfo} filter={sp.verlauf || "alle"} basis={`${basis}?tab=verlauf`} /></Kachel>}
      </AkteGeruest>
    </Rahmen>
  );
}
