// /shop/retouren/[name] – Retourenakte (T5; 10-konzept-shop § 5.7): Phasen, Tabs Positionen · Prüfung · Verlauf.
// Prüfung speichert den Erstattungsbetrag explizit (B3/A4), Wertminderung nur mit Belehrung (§ 15 FAGG).
import { notFound } from "next/navigation";
import { zugang } from "@/lib/backoffice/shop/zugang";
import { akte, sicher } from "@/lib/backoffice/shop/daten";
import { retoureAktionen } from "@/lib/backoffice/shop/aktenAktionen";
import { statusInfo } from "@/lib/backoffice/shop/status";
import { belehrungNachweisbar } from "@/lib/backoffice/shop/fristen";
import { T } from "@/lib/backoffice/shop/texte";
import { cent, datumZeit } from "@/lib/backoffice/format";
import { aktiverTab } from "@/lib/backoffice/akte/geruest";
import Rahmen from "@/components/Backoffice/Shop/Rahmen";
import { AkteGeruest, AkteKopf, Band, RechteSpalte, AkteTabs } from "@/components/Backoffice/Akte";
import Kachel from "@/components/Backoffice/Kachel";
import StatusBadge from "@/components/Backoffice/StatusBadge";
import { AktenAktionen, SperrGruende } from "@/components/Backoffice/Shop/AktionsKnoepfe";
import { Phasenleiste, Verlauf, Fakten, BezugListe } from "@/components/Backoffice/Shop/Akteteile";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }) {
  return { title: `${decodeURIComponent((await params).name)} · Retoure` };
}

const FLUSS = ["Angekuendigt", "Label gesendet", "Unterwegs", "Eingegangen", "Geprueft", "Erstattet"];
const ZUSTAND = { neu: "neu", geoeffnet: "geöffnet", beschaedigt: "beschädigt" };

export default async function RetoureAkte({ params, searchParams }) {
  const { name: roh } = await params;
  const name = decodeURIComponent(roh);
  const sp = await searchParams;
  const ctx = await zugang(`/shop/retouren/${roh}`);
  const { client, session, leitung } = ctx;
  const a = await akte(client, "PH Retoure", name);
  if (!a?.doc) notFound();
  const r = a.doc;
  const b = await sicher(() => client.getDoc("PH Bestellung", r.bestellung), null);
  const ak = retoureAktionen(r, { leitung });
  const st = statusInfo("PH Retoure", r.status);
  const tabs = [{ id: "positionen", titel: "Positionen", anzahl: (r.positionen || []).length }, { id: "pruefung", titel: "Prüfung" }, { id: "verlauf", titel: "Verlauf" }];
  const tab = aktiverTab(tabs, sp.tab);
  const basis = `/shop/retouren/${roh}`;
  const doc = { doctype: "PH Retoure", name, status: r.status, erstattungsbetrag_cent: Number(r.erstattungsbetrag_cent) || 0, wertminderung_cent: Number(r.wertminderung_cent) || 0, basis_cent: Number(r.erstattungsbetrag_cent) + Number(r.wertminderung_cent || 0), widerruf: r.widerruf, belehrungNachweisbar: b ? belehrungNachweisbar(b) : false };
  const idx = FLUSS.indexOf(r.status);
  return (
    <Rahmen session={session} modus={client.modus}>
      <AkteGeruest testid="retourenakte"
        kopf={<AkteKopf zurueck={{ href: "/shop/widerrufe?segment=retouren", titel: "Retouren" }} krumen={[{ titel: "Shop", href: "/shop" }, { titel: "Retouren", href: "/shop/widerrufe?segment=retouren" }, { titel: name }]} titel={`Retoure ${r.bestellung}`} nummer={<span className="bo-shop-zelle-nr mr-2">{name}{r.widerruf ? ` · ${r.widerruf}` : ""}</span>} status={<StatusBadge wert={r.status} text={st.anzeige} ton={st.ton} groesse="m" />} betrag={{ cent: Number(r.erstattungsbetrag_cent) || 0, unter: Number(r.wertminderung_cent) ? `nach Wertminderung ${cent(r.wertminderung_cent)}` : "Erstattungsbetrag" }} aktionen={<AktenAktionen primaer={ak.primaer} sekundaer={ak.sekundaer} menue={ak.menue} doc={doc} />} />}
        band={r.weg === "Showroom" ? <div className="mb-6"><Band ton="info" text={T.baender.showroomRetoure} /></div> : null}
        vorgang={<><SperrGruende aktionen={[ak.primaer, ...ak.sekundaer]} /><Phasenleiste label="Retoure" schritte={FLUSS.map((s, i) => ({ id: s, titel: statusInfo("PH Retoure", s).anzeige, zustand: r.status === "Abgelehnt" ? (i === 0 ? "erledigt" : "offen") : i < idx ? "erledigt" : i === idx ? "aktuell" : "offen" }))} /></>}
        vorgangOben
        reiter={<AkteTabs tabs={tabs} aktiv={tab} basis={basis} params={{}} />}
        rechts={<RechteSpalte bezuege={<BezugListe eintraege={[{ titel: `Bestellung ${r.bestellung}`, wert: b ? statusInfo("PH Bestellung", b.status, b).anzeige : "", href: `/shop/bestellungen/${encodeURIComponent(r.bestellung)}`, icon: "ShoppingBag" }, r.widerruf ? { titel: `Widerruf ${r.widerruf}`, wert: "", href: `/shop/widerrufe/${encodeURIComponent(r.widerruf)}`, icon: "Undo2" } : null, r.erstattung ? { titel: `Erstattung ${r.erstattung}`, wert: "", href: `/shop/zahlungen/${encodeURIComponent(r.erstattung)}`, icon: "Wallet" } : null].filter(Boolean)} />} />}
      >
        {tab === "positionen" && (
          <Kachel titel="Positionen">
            {(r.positionen || []).length ? (
              <ul className="bo-shop-posten">{r.positionen.map((p) => <li key={p.idx}><span>{p.menge} × {p.bezeichnung}<span className="bo-shop-unter">Zustand {ZUSTAND[p.zustand] || "–"}{Number(p.wiedereinlagern) ? " · wieder einlagern" : ""}</span></span><span className="tabular-nums">{Number(p.wertminderung_cent) ? `Wertminderung ${cent(p.wertminderung_cent)}` : "–"}</span></li>)}</ul>
            ) : <p className="py-6 text-center text-[15px] text-bo-text-soft">{T.leer.retourePositionen}</p>}
          </Kachel>
        )}
        {tab === "pruefung" && <Kachel titel="Prüfung"><Fakten eintraege={[{ label: "Eingegangen", wert: r.eingegangen_am ? datumZeit(r.eingegangen_am) : "–" }, { label: "Geprüft", wert: r.geprueft_am ? `${datumZeit(r.geprueft_am)} · ${String(r.geprueft_von || "").split("@")[0]}` : "–" }, { label: "Wertminderung", wert: cent(r.wertminderung_cent || 0) }, { label: "Erstattungsbetrag", wert: cent(r.erstattungsbetrag_cent || 0) }, { label: "Belehrung nachweisbar", wert: doc.belehrungNachweisbar ? "ja" : "nein – keine Wertminderung" }, { label: "Hinweis", wert: r.hinweis || "–" }]} /></Kachel>}
        {tab === "verlauf" && <Kachel titel="Verlauf"><Verlauf docinfo={a.docinfo} filter={sp.verlauf || "alle"} basis={`${basis}?tab=verlauf`} /></Kachel>}
      </AkteGeruest>
    </Rahmen>
  );
}
