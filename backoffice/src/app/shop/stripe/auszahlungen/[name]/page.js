// /shop/stripe/auszahlungen/[name] – Auszahlung (T5; 10-konzept-shop § 5.8): Karten Brutto/Gebühren/Netto/Differenz,
// Zeilen je Stripe-Buchung mit Zuordnung zur Zahlung, Primär „Abgleichen“ (sofort, idempotent).
import { notFound } from "next/navigation";
import Link from "next/link";
import { zugang } from "@/lib/backoffice/shop/zugang";
import { akte } from "@/lib/backoffice/shop/daten";
import { auszahlungAktionen } from "@/lib/backoffice/shop/aktenAktionen";
import { statusInfo } from "@/lib/backoffice/shop/status";
import { darfStripe } from "@/lib/backoffice/shop/rechte";
import { T } from "@/lib/backoffice/shop/texte";
import { cent, datum } from "@/lib/backoffice/format";
import { aktiverTab } from "@/lib/backoffice/akte/geruest";
import Rahmen from "@/components/Backoffice/Shop/Rahmen";
import { AkteGeruest, AkteKopf, Band, AkteTabs } from "@/components/Backoffice/Akte";
import Kachel, { Bento } from "@/components/Backoffice/Kachel";
import Kennzahl from "@/components/Backoffice/Kennzahl";
import StatusBadge from "@/components/Backoffice/StatusBadge";
import { AktenAktionen } from "@/components/Backoffice/Shop/AktionsKnoepfe";
import { Verlauf, Fakten } from "@/components/Backoffice/Shop/Akteteile";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }) {
  return { title: `${decodeURIComponent((await params).name)} · Auszahlung` };
}

export default async function AuszahlungAkte({ params, searchParams }) {
  const { name: roh } = await params;
  const name = decodeURIComponent(roh);
  const sp = await searchParams;
  const ctx = await zugang(`/shop/stripe/auszahlungen/${roh}`, darfStripe);
  const { client, session, leitung } = ctx;
  const a = await akte(client, "PH Stripe Auszahlung", name);
  if (!a?.doc) notFound();
  const p = a.doc;
  const ak = auszahlungAktionen(p, { leitung });
  const st = statusInfo("PH Stripe Auszahlung", p.status);
  const tabs = [{ id: "uebersicht", titel: "Übersicht" }, { id: "zeilen", titel: "Zeilen", anzahl: (p.zahlungen || []).length }, { id: "verlauf", titel: "Verlauf" }];
  const tab = aktiverTab(tabs, sp.tab);
  const basis = `/shop/stripe/auszahlungen/${roh}`;
  const diff = Number(p.differenz_cent) || 0;
  return (
    <Rahmen session={session} modus={client.modus}>
      <AkteGeruest testid="auszahlungsakte"
        kopf={<AkteKopf zurueck={{ href: "/shop/stripe?tab=auszahlungen", titel: "Auszahlungen" }} krumen={[{ titel: "Shop", href: "/shop" }, { titel: "Auszahlungen", href: "/shop/stripe?tab=auszahlungen" }, { titel: name }]} titel={`Auszahlung ${datum(p.datum_erwartet)}`} nummer={<span className="mr-2 font-mono text-[12px] text-bo-text-soft">{name}</span>} status={<StatusBadge wert={p.status} text={st.anzeige} ton={st.ton} groesse="m" />} betrag={{ cent: Number(p.betrag_cent), unter: "netto" }} aktionen={<AktenAktionen primaer={ak.primaer} doc={{ doctype: "PH Stripe Auszahlung", name }} />} />}
        band={diff ? <div className="mb-6"><Band ton="gefahr" text={`Differenz ${cent(diff)} zwischen Auszahlung und zugeordneten Zahlungen`} /></div> : null}
        reiter={<AkteTabs tabs={tabs} aktiv={tab} basis={basis} params={{}} />}
      >
        {tab === "uebersicht" && (
          <Bento einblenden={false}>
            <Kennzahl className="md:col-span-3" titel="Brutto" wert={Number(p.brutto_cent)} format="cent" />
            <Kennzahl className="md:col-span-3" titel="Gebühren" wert={Number(p.gebuehren_cent)} format="cent" />
            <Kennzahl className="md:col-span-3" titel="Netto" wert={Number(p.betrag_cent)} format="cent" />
            <Kennzahl className="md:col-span-3" titel="Differenz" wert={diff} format="cent" />
            <Kachel className="md:col-span-12" titel="Angaben"><Fakten eintraege={[{ label: "Erwartet", wert: datum(p.datum_erwartet) }, { label: "Auf dem Konto", wert: p.datum_bank ? datum(p.datum_bank) : "–" }, { label: "Abgeglichen", wert: p.abgeglichen_am ? datum(p.abgeglichen_am) : "–" }, { label: "Hinweis", wert: p.hinweis || "–" }]} /><p className="mt-4 text-[13px] text-bo-text-soft">Gebührenrechnung monatlich aus Stripe als Anhang an dieser Auszahlung ablegen.</p></Kachel>
          </Bento>
        )}
        {tab === "zeilen" && (
          <Kachel titel="Zeilen">
            {(p.zahlungen || []).length ? (
              <ul className="bo-shop-posten">{p.zahlungen.map((z) => <li key={z.idx}><span>{z.zahlung ? <Link className="hover:underline" href={`/shop/zahlungen/${encodeURIComponent(z.zahlung)}`}>{z.zahlung}</Link> : <span className="font-medium text-bo-ziegel-text">Keine Zahlung im Backoffice gefunden</span>}<span className="bo-shop-unter">{z.typ === "refund" ? "Erstattung" : "Zahlung"} · Gebühr {cent(z.gebuehr_cent)}</span></span><span className="tabular-nums">{cent(z.netto_cent)}</span></li>)}</ul>
            ) : <p className="py-6 text-center text-[15px] text-bo-text-soft">{T.leer.auszahlungZeilen}</p>}
          </Kachel>
        )}
        {tab === "verlauf" && <Kachel titel="Verlauf"><Verlauf docinfo={a.docinfo} filter={sp.verlauf || "alle"} basis={`${basis}?tab=verlauf`} /></Kachel>}
      </AkteGeruest>
    </Rahmen>
  );
}
