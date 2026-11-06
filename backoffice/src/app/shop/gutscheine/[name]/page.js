// /shop/gutscheine/[name] – Gutscheinakte (T5; 10-konzept-shop § 5.3): Code nur ····-XXXX, Restbalken, Band
// gesperrt/abgelaufen, feste Tabs Übersicht · Einlösungen · Käufer & Kauf · Verlauf. Primär „Auf Bestellung
// anrechnen“ (kein freies Einlösen, E15); Leitung: Sperren, Entsperren, Ersetzen (Code einmalig), Einlösung zurücknehmen.
import { notFound } from "next/navigation";
import { zugang } from "@/lib/backoffice/shop/zugang";
import { akte } from "@/lib/backoffice/shop/daten";
import { gutscheinAktionen } from "@/lib/backoffice/shop/aktenAktionen";
import { statusInfo } from "@/lib/backoffice/shop/status";
import { T } from "@/lib/backoffice/shop/texte";
import { cent, datum, datumZeit } from "@/lib/backoffice/format";
import { aktiverTab } from "@/lib/backoffice/akte/geruest";
import Rahmen from "@/components/Backoffice/Shop/Rahmen";
import { AkteGeruest, AkteKopf, Band, RechteSpalte, AkteTabs } from "@/components/Backoffice/Akte";
import Kachel from "@/components/Backoffice/Kachel";
import StatusBadge, { Pille } from "@/components/Backoffice/StatusBadge";
import { AktenAktionen, SperrGruende } from "@/components/Backoffice/Shop/AktionsKnoepfe";
import { BandKnopf } from "@/components/Backoffice/Shop/Teile";
import EinloesungZurueck from "@/components/Backoffice/Shop/EinloesungZurueck";
import { Verlauf, Fakten, BezugListe } from "@/components/Backoffice/Shop/Akteteile";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }) {
  return { title: `${decodeURIComponent((await params).name)} · Gutschein` };
}

export default async function GutscheinAkte({ params, searchParams }) {
  const { name: roh } = await params;
  const name = decodeURIComponent(roh);
  const sp = await searchParams;
  const ctx = await zugang(`/shop/gutscheine/${roh}`);
  const { client, session, leitung } = ctx;
  const a = await akte(client, "PH Gutschein", name);
  if (!a?.doc) notFound();
  const g = a.doc;
  const ak = gutscheinAktionen(g, { leitung });
  const st = statusInfo("PH Gutschein", g.status, g);
  const tabs = [{ id: "uebersicht", titel: "Übersicht" }, { id: "einloesungen", titel: "Einlösungen", anzahl: (g.einloesungen || []).length }, { id: "kauf", titel: "Käufer & Kauf" }, { id: "verlauf", titel: "Verlauf" }];
  const tab = aktiverTab(tabs, sp.tab);
  const basis = `/shop/gutscheine/${roh}`;
  const doc = { doctype: "PH Gutschein", name, code_letzte4: g.code_letzte4, rest_cent: Number(g.rest_cent), status: g.status, gueltig_bis: g.gueltig_bis || "", test: g.test };
  const anteil = Number(g.wert_cent) ? Number(g.rest_cent) / Number(g.wert_cent) : 0;
  const band = g.status === "Gesperrt"
    ? <Band ton="gefahr" icon="Lock" testid="band-gesperrt" text={`${T.baender.gutscheinGesperrt(datum(g.gesperrt_am), g.sperrgrund_art || g.sperrgrund || "–")}${g.ersetzt_durch ? ` – ersetzt durch ${g.ersetzt_durch}` : ""}`} aktion={g.ersetzt_durch ? <a className="text-[13px] font-medium underline" href={`/shop/gutscheine/${encodeURIComponent(g.ersetzt_durch)}`}>Öffnen</a> : null} />
    : g.status === "Abgelaufen" && Number(g.rest_cent) > 0
      ? <Band ton="warnung" testid="band-abgelaufen" text={T.baender.gutscheinAbgelaufen(datum(g.gueltig_bis), cent(g.rest_cent))} aktion={leitung ? <BandKnopf id="gueltigkeit" titel="Gültigkeit verlängern" doc={doc} /> : null} />
      : null;
  return (
    <Rahmen session={session} modus={client.modus}>
      <AkteGeruest testid="gutscheinakte"
        kopf={<AkteKopf zurueck={{ href: "/shop/gutscheine", titel: "Gutscheine" }} krumen={[{ titel: "Shop", href: "/shop" }, { titel: "Gutscheine", href: "/shop/gutscheine" }, { titel: name }]} titel={<span className="bo-shop-code" style={{ fontSize: 34, lineHeight: "40px" }} data-testid="code-maskiert">····-{g.code_letzte4}</span>} nummer={<span className="mr-2 flex flex-wrap items-center gap-2"><span className="bo-shop-zelle-nr">{name}</span>{Number(g.test) === 1 && <Pille material="messing" groesse="s">Test</Pille>}</span>} status={<StatusBadge wert={g.status} text={st.anzeige} ton={st.ton} groesse="m" />} betrag={{ cent: Number(g.rest_cent), unter: `Rest von ${cent(g.wert_cent)}` }} aktionen={<AktenAktionen primaer={ak.primaer} sekundaer={ak.sekundaer} menue={ak.menue} doc={doc} />} />}
        band={band ? <div className="mb-6">{band}</div> : null}
        vorgang={
          <div className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-[14px]">
            <SperrGruende aktionen={[ak.primaer, ...ak.sekundaer]} />
            <span className="flex items-center gap-3"><span className="bo-shop-restbalken" style={{ width: 160 }} aria-hidden="true"><span style={{ width: `${Math.round(anteil * 100)}%` }} /></span>Rest {Math.round(anteil * 1000) / 10} %</span>
            <span>Gültig: {g.gueltig_bis ? `bis ${datum(g.gueltig_bis)}` : "unbefristet"}</span>
            <span>Ausgabe {g.kanal_ausgabe || "–"} {datum(g.ausgegeben_am)}</span>
            <span>{g.art}</span>
          </div>
        }
        vorgangOben
        reiter={<AkteTabs tabs={tabs} aktiv={tab} basis={basis} params={{}} />}
        rechts={<RechteSpalte bezuege={<BezugListe eintraege={[g.gutschein_bestellung ? { titel: `Gutscheinkauf ${g.gutschein_bestellung}`, wert: "online", href: `/shop/gutscheinkaeufe/${encodeURIComponent(g.gutschein_bestellung)}`, icon: "Gift" } : null, g.zahlung ? { titel: `Zahlung ${g.zahlung}`, wert: "Kauf", href: `/shop/zahlungen/${encodeURIComponent(g.zahlung)}`, icon: "Wallet" } : null, g.ausgabe_beleg ? { titel: `Kassenbeleg ${g.ausgabe_beleg}`, wert: "Verkauf an der Kassa", icon: "Receipt" } : null, g.ersetzt_durch ? { titel: `Ersetzt durch ${g.ersetzt_durch}`, wert: "neuer Code", href: `/shop/gutscheine/${encodeURIComponent(g.ersetzt_durch)}`, icon: "Ticket" } : null].filter(Boolean)} />} />}
      >
        {tab === "uebersicht" && (
          <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-2">
            <Kachel titel="Gutschein">
              <Fakten eintraege={[{ label: "Wert", wert: cent(g.wert_cent) }, { label: "Rest", wert: cent(g.rest_cent) }, { label: "Motiv", wert: { schlicht: "Schlicht", seelicht: "Seelicht", geweih: "Geweih" }[g.motiv] || "–" }, { label: "Für", wert: g.empfaenger || "–" }, { label: "Grußtext", wert: g.grusstext || "–" }, { label: "Hinweis", wert: g.hinweis || "–" }]} />
            </Kachel>
            <Kachel titel="Code">
              <p className="text-[14px] text-bo-text-soft">{g.pdf ? "Die PDF mit dem Code ist gespeichert – „PDF senden“ oder „Drucken“." : "Code liegt nicht mehr im Klartext vor – „Ersetzen“ erzeugt einen neuen."}</p>
            </Kachel>
          </div>
        )}
        {tab === "einloesungen" && (
          <Kachel titel="Einlösungen">
            {(g.einloesungen || []).length ? (
              <ul className="bo-shop-zeilen">
                {g.einloesungen.map((e) => (
                  <li key={e.idx} className="bo-shop-zeile">
                    <span className="bo-shop-zeile__ico" aria-hidden="true">−</span>
                    <span className="min-w-0"><span className="block text-[15px] font-semibold">{cent(e.betrag_cent)} · {e.kanal}</span><span className="bo-shop-unter">{datumZeit(e.datum)} · Beleg {e.beleg} · Rest danach {cent(e.rest_danach_cent)}</span></span>
                    {leitung && e.beleg ? <EinloesungZurueck doc={doc} beleg={e.beleg} belegDoctype={e.beleg_doctype} betrag={Number(e.betrag_cent)} /> : <span />}
                  </li>
                ))}
              </ul>
            ) : <p className="py-6 text-center text-[15px] text-bo-text-soft">{T.leer.einloesungen}</p>}
          </Kachel>
        )}
        {tab === "kauf" && (
          <Kachel titel="Käufer & Kauf">
            {g.kaeufer_name || g.gutschein_bestellung || g.ausgabe_beleg ? <Fakten eintraege={[{ label: "Käufer", wert: g.kaeufer_name || "–" }, { label: "E-Mail", wert: g.kaeufer_email || "–" }, { label: "Ausgabe", wert: g.kanal_ausgabe }, { label: "Beleg", wert: g.gutschein_bestellung || g.ausgabe_beleg || "–" }]} /> : <p className="py-6 text-center text-[15px] text-bo-text-soft">{g.hinweis?.startsWith("Ohne Verkauf") ? `ohne Verkauf: ${g.hinweis.replace(/^Ohne Verkauf:\s*/, "")}` : T.leer.kaeufer}</p>}
          </Kachel>
        )}
        {tab === "verlauf" && <Kachel titel="Verlauf"><Verlauf docinfo={a.docinfo} filter={sp.verlauf || "alle"} basis={`${basis}?tab=verlauf`} /></Kachel>}
      </AkteGeruest>
    </Rahmen>
  );
}
