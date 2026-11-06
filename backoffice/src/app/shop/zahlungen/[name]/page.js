// /shop/zahlungen/[name] – Zahlungsakte (T5; 10-konzept-shop § 5.2): Bänder statt Tabs (Freigabe mit Zwei-Klick
// für die GF, Zahlungsstreit, Risiko, „Gebucht – Korrektur nur per Erstattung“), feste Tabs Übersicht · Stripe ·
// Erstattungen · Verlauf. Primär „Erstatten …“ (Leitung) bzw. „An der Kassa auszahlen“ bei Bar/Karte.
import { notFound } from "next/navigation";
import { zugang } from "@/lib/backoffice/shop/zugang";
import { akte, einstellungen } from "@/lib/backoffice/shop/daten";
import { zahlungAktionen, zahlungBaender } from "@/lib/backoffice/shop/aktenAktionen";
import { statusInfo, kanalText, risikoStufe } from "@/lib/backoffice/shop/status";
import { T } from "@/lib/backoffice/shop/texte";
import { cent, datum, datumZeit } from "@/lib/backoffice/format";
import { aktiverTab } from "@/lib/backoffice/akte/geruest";
import Rahmen from "@/components/Backoffice/Shop/Rahmen";
import { AkteGeruest, AkteKopf, Band, RechteSpalte, AkteTabs } from "@/components/Backoffice/Akte";
import Kachel from "@/components/Backoffice/Kachel";
import StatusBadge from "@/components/Backoffice/StatusBadge";
import { AktenAktionen, SperrGruende } from "@/components/Backoffice/Shop/AktionsKnoepfe";
import { FreigabeKnoepfe, BandKnopf } from "@/components/Backoffice/Shop/Teile";
import { Phasenleiste, Verlauf, Fakten, BezugListe } from "@/components/Backoffice/Shop/Akteteile";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }) {
  return { title: `${decodeURIComponent((await params).name)} · Zahlung` };
}

const TABS = [{ id: "uebersicht", titel: "Übersicht" }, { id: "stripe", titel: "Stripe" }, { id: "erstattungen", titel: "Erstattungen" }, { id: "verlauf", titel: "Verlauf" }];

export default async function ZahlungAkte({ params, searchParams }) {
  const { name: roh } = await params;
  const name = decodeURIComponent(roh);
  const sp = await searchParams;
  const ctx = await zugang(`/shop/zahlungen/${roh}`);
  const { client, session, leitung, gf } = ctx;
  const a = await akte(client, "PH Zahlung", name);
  if (!a?.doc) notFound();
  const z = a.doc;
  const eins = await einstellungen(client);
  const ak = zahlungAktionen(z, { leitung, gf });
  const baender = zahlungBaender(z, { gf, user: session.user });
  const st = statusInfo("PH Zahlung", z.status);
  const tab = aktiverTab(TABS.map((t) => (t.id === "erstattungen" ? { ...t, anzahl: (z.erstattungen || []).length } : t)), sp.tab);
  const basis = `/shop/zahlungen/${roh}`;
  const doc = { doctype: "PH Zahlung", name, betrag_cent: Number(z.betrag_cent), erstattet_cent: Number(z.erstattet_cent) || 0, kanal: z.kanal, bezug: z.bezug, payment_intent: z.stripe_payment_intent, livemode: z.livemode, vierAugenCent: Number(eins.stripe?.vier_augen_ab_cent ?? 100000), status: z.status };
  const band = baender[0];
  const phasen = [{ id: "a", titel: "Angekündigt", zustand: z.status === "Angekuendigt" ? "aktuell" : "erledigt" }, { id: "b", titel: "Bezahlt", zustand: z.status === "Bezahlt" ? "aktuell" : z.status === "Angekuendigt" ? "offen" : "erledigt", datum: z.status !== "Angekuendigt" ? z.zeitpunkt : "" }, { id: "t", titel: "Teilweise erstattet", zustand: z.status === "Teilerstattet" ? "aktuell" : z.status === "Erstattet" ? "erledigt" : "offen" }, { id: "e", titel: "Erstattet", zustand: z.status === "Erstattet" ? "aktuell" : "offen" }];
  const erst = z.art === "Erstattung";
  return (
    <Rahmen session={session} modus={client.modus}>
      <AkteGeruest testid="zahlungsakte"
        kopf={<AkteKopf zurueck={{ href: "/shop/zahlungen", titel: "Zahlungen" }} krumen={[{ titel: "Shop", href: "/shop" }, { titel: "Zahlungen", href: "/shop/zahlungen" }, { titel: name }]} titel={erst ? `Erstattung zu ${z.ursprung || "–"}` : `${z.art} · ${kanalText(z.kanal)}`} nummer={<span className="bo-shop-zelle-nr mr-2">{name}</span>} status={<StatusBadge wert={z.status} text={st.anzeige} ton={st.ton} gebucht={Number(z.docstatus) === 1} groesse="m" />} betrag={{ cent: Math.abs(Number(z.betrag_cent)), unter: z.bezug ? `${z.bezug_doctype === "PH Bestellung" ? "Bestellung" : "Bezug"} ${z.bezug}` : "" }} aktionen={<AktenAktionen primaer={ak.primaer} sekundaer={ak.sekundaer} menue={ak.menue} doc={doc} />} />}
        band={band ? (
          <div className="mb-6">
            {band.id === "freigabe" && <Band ton="warnung" testid="band-freigabe" text={`Freigabe angefordert: ${cent(z.erstattung_angefordert_cent)} · Grund ${z.erstattung_grund || "–"} · von ${String(z.erstattung_angefordert_von || "").split("@")[0]} am ${datum(z.erstattung_angefordert_am)}`} aktion={gf ? <FreigabeKnoepfe doc={doc} betragCent={Number(z.erstattung_angefordert_cent)} eigen={band.eigen} /> : <span className="text-[12px] text-bo-text-soft">{T.nurGF}</span>} />}
            {band.id === "streit" && <Band ton="gefahr" testid="band-streit" text={z.dispute_status === "lost" ? T.baender.streitVerloren : `Zahlungsstreit: ${cent(z.dispute_betrag_cent || z.betrag_cent)} · Grund „${z.dispute_grund || "–"}“ · Antwort bis ${datum(z.dispute_frist)}`} aktion={z.stripe_payment_intent ? <BandKnopf id="stripe-oeffnen" titel="Im Stripe-Dashboard öffnen" doc={doc} /> : null} />}
            {band.id === "risiko" && <Band ton="warnung" text={T.baender.risiko(risikoStufe(z.radar_risk_level))} aktion={<BandKnopf id="risiko-geprueft" titel="Risiko geprüft" doc={doc} />} />}
            {band.id === "gebucht" && <Band ton="neutral" icon="Lock" text={T.baender.gebucht} />}
            {baender.length > 1 && <p className="mt-2 text-[12px] text-bo-text-soft">+{baender.length - 1} {baender.length === 2 ? "Hinweis" : "Hinweise"}</p>}
          </div>
        ) : null}
        vorgang={<><SperrGruende aktionen={[ak.primaer]} />{!erst && <Phasenleiste schritte={phasen} label="Zahlungsablauf" />}</>}
        vorgangOben
        reiter={<AkteTabs tabs={TABS} aktiv={tab} basis={basis} params={{}} />}
        rechts={<RechteSpalte bezuege={<BezugListe eintraege={[z.bezug ? { titel: z.bezug_doctype === "PH Bestellung" ? `Bestellung ${z.bezug}` : z.bezug_doctype === "PH Anzahlung" ? `Anzahlung ${z.bezug}` : `Gutscheinkauf ${z.bezug}`, wert: "Bezug", href: z.bezug_doctype === "PH Bestellung" ? `/shop/bestellungen/${encodeURIComponent(z.bezug)}` : z.bezug_doctype === "PH Anzahlung" ? `/shop/anzahlungen/${encodeURIComponent(z.bezug)}` : `/shop/gutscheinkaeufe/${encodeURIComponent(z.bezug)}`, icon: "ShoppingBag" } : null, z.ursprung ? { titel: `Ursprung ${z.ursprung}`, wert: "Eingang", href: `/shop/zahlungen/${encodeURIComponent(z.ursprung)}`, icon: "Wallet" } : null, z.gutschein ? { titel: `Gutschein ${z.gutschein}`, wert: "Anrechnung", href: `/shop/gutscheine/${encodeURIComponent(z.gutschein)}`, icon: "Ticket" } : null, z.stripe_auszahlung ? { titel: `Auszahlung ${z.stripe_auszahlung}`, wert: "Stripe", href: `/shop/stripe/auszahlungen/${encodeURIComponent(z.stripe_auszahlung)}`, icon: "Banknote" } : null].filter(Boolean)} />} />}
      >
        {tab === "uebersicht" && (
          <Kachel titel="Übersicht">
            <Fakten eintraege={[{ label: "Betrag", wert: cent(z.betrag_cent) }, { label: "Erstattet", wert: cent(z.erstattet_cent || 0) }, { label: "Zeitpunkt", wert: datumZeit(z.zeitpunkt) }, { label: "Kanal", wert: kanalText(z.kanal) }, { label: "Art", wert: z.art }, { label: "Referenz", wert: z.zahlungsreferenz || z.bank_referenz || "–" }, { label: "Quelle", wert: { website: "Website", backoffice: "Backoffice", stripe: "Stripe", kassa: "Kassa", import: "Übernahme" }[z.quelle] || "–" }, { label: "Live/Test", wert: Number(z.livemode) ? "Live" : "Test" }]} />
          </Kachel>
        )}
        {tab === "stripe" && (
          <Kachel titel="Stripe" unter="Kennungen nur zum Nachschlagen">
            <Fakten eintraege={[{ label: "Stripe-Zahlung", wert: z.stripe_payment_intent || "–", mono: true }, { label: "Belastung", wert: z.stripe_charge || "–", mono: true }, { label: "Stripe-Buchung", wert: z.stripe_balance_transaction || "–", mono: true }, { label: "Gebühr", wert: cent(z.stripe_gebuehr_cent || 0) }, { label: "Auszahlung", wert: z.stripe_auszahlung || "–" }, { label: "Risiko", wert: z.radar_risk_level ? `${risikoStufe(z.radar_risk_level)} (${z.radar_risk_score ?? "–"})` : "–" }]} />
          </Kachel>
        )}
        {tab === "erstattungen" && (
          <Kachel titel="Erstattungen">
            {(z.erstattungen || []).length ? (
              <ul className="bo-shop-posten">{z.erstattungen.map((e) => <li key={e.idx}><span>{datumZeit(e.zeitpunkt)} · {e.grund}<span className="bo-shop-unter">{e.gegenbuchung ? `Gegenbuchung ${e.gegenbuchung}` : ""}{e.stripe_refund ? ` · Stripe-Erstattung ${e.stripe_refund}` : ""}</span></span><strong className="tabular-nums">−{cent(e.betrag_cent)}</strong></li>)}</ul>
            ) : <p className="py-6 text-center text-[15px] text-bo-text-soft">{T.leer.erstattungenTab}</p>}
          </Kachel>
        )}
        {tab === "verlauf" && <Kachel titel="Verlauf"><Verlauf docinfo={a.docinfo} filter={sp.verlauf || "alle"} basis={`${basis}?tab=verlauf`} /></Kachel>}
      </AkteGeruest>
    </Rahmen>
  );
}
