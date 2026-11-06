// /shop/bestellungen – Liste | Kanban (T2/T3; 10-konzept-shop § 4.2–4.4): Arbeitsansichten (Zu packen, Abholung,
// Prüfen, Meine), „Nächster Schritt“ mit Zeilenknopf, Vorschau rechts (?panel=), Massenaktionen, Dialog „Neu“
// (?neu=telefon|showroom). URL = Zustand.
import Link from "next/link";
import { zugang } from "@/lib/backoffice/shop/zugang";
import { alle, positionenFuer, lieferscheineFuer, einstellungen, bestellBezuege } from "@/lib/backoffice/shop/daten";
import { wendeAn } from "@/lib/backoffice/shop/ansichten";
import { bestellZeile, docFuerAktion } from "@/lib/backoffice/shop/zeilen";
import { spaltenFuer } from "@/lib/backoffice/shop/kanban";
import { statusListe, ARBEITSFLUSS, statusInfo, zusatzChips } from "@/lib/backoffice/shop/status";
import { offen } from "@/lib/backoffice/shop/geld";
import { naechsterSchritt } from "@/lib/backoffice/shop/naechsterSchritt";
import { bestellAktionen } from "@/lib/backoffice/shop/primaer";
import { fristMorgen } from "@/lib/backoffice/shop/ansichten";
import { T } from "@/lib/backoffice/shop/texte";
import { cent, datum, datumZeit } from "@/lib/backoffice/format";
import Rahmen from "@/components/Backoffice/Shop/Rahmen";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Segment from "@/components/Backoffice/Segment";
import Leer from "@/components/Backoffice/Leer";
import Fehler from "@/components/Backoffice/Fehler";
import StatusBadge, { Pille } from "@/components/Backoffice/StatusBadge";
import { RundKnopf } from "@/components/Backoffice/Knopf";
import Erstbesuch from "@/components/Backoffice/Erstbesuch";
import ShopListe from "@/components/Backoffice/Shop/ShopListe";
import ShopFilter from "@/components/Backoffice/Shop/ShopFilter";
import BestellKanban from "@/components/Backoffice/Shop/BestellKanban";
import NeueBestellung from "@/components/Backoffice/Shop/NeueBestellung";
import { NeuMenue } from "@/components/Backoffice/Shop/Teile";
import { AktenAktionen } from "@/components/Backoffice/Shop/AktionsKnoepfe";
import ShopIcon from "@/components/Backoffice/Shop/ShopIcon";

export const metadata = { title: "Bestellungen · Shop" };
export const dynamic = "force-dynamic";

const SPALTEN = [
  { id: "objekt", titel: "Kunde", art: "objekt" },
  { id: "gesamt", titel: "Gesamt", art: "betrag", rechts: true },
  { id: "status", titel: "Status", art: "status" },
  { id: "schritt", titel: "Nächster Schritt", art: "schritt" },
  { id: "bestellt", titel: "Bestellt", art: "text", nurBreit: true },
  { id: "person", titel: "Zust.", art: "person", nurBreit: true },
];

export default async function Bestellungen({ searchParams }) {
  const sp = await searchParams;
  const params = Object.fromEntries(Object.entries(sp).map(([k, v]) => [k, String(v)]));
  const ctx = await zugang("/shop/bestellungen");
  const { client, session, leitung, heute } = ctx;
  const kanban = params.ansicht === "kanban";
  const [{ zeilen: roh, fehler }, eins] = await Promise.all([alle(client, "PH Bestellung"), einstellungen(client)]);
  const r = wendeAn("bestellungen", roh, kanban ? { ...params, ansicht: "alle", groesse: "100" } : params, { heute, user: session.user, leitung });
  const sichtbar = kanban ? r.alleGefiltert.filter((b) => !["abgeschlossen", "storniert", "erstattet", "teilerstattet", "widerrufen", "abgelaufen", "fehlgeschlagen", "checkout_fehler"].includes(b.status)) : r.zeilen;
  const namen = sichtbar.map((b) => b.name);
  const [pos, ls] = await Promise.all([positionenFuer(client, namen.slice(0, 100)), lieferscheineFuer(client, namen.slice(0, 100))]);
  const lsJe = {};
  for (const l of ls) (lsJe[l.bestellung] ||= []).push(l);
  const zeilen = sichtbar.map((b) => bestellZeile(b, { heute, positionen: pos, lieferscheine: lsJe, leitung }));
  const panel = params.panel && roh.find((b) => b.name === params.panel);
  const status = [...ARBEITSFLUSS["PH Bestellung"].map((w) => ({ wert: w, anzeige: statusInfo("PH Bestellung", w).anzeige })), ...ARBEITSFLUSS["PH Bestellung:ende"].map((w) => ({ wert: w, anzeige: statusInfo("PH Bestellung", w).anzeige, ende: true }))];
  const ansichtsOptionen = [...r.ansichten, { id: "kanban", titel: "Kanban" }];
  void statusListe;

  return (
    <Rahmen session={session} modus={client.modus}>
      <Seitenkopf
        titel="Bestellungen"
        krumen={[{ titel: "Zentrale", href: "/" }, { titel: "Shop", href: "/shop" }, { titel: "Bestellungen" }]}
        kennzahlen={[{ wert: r.gesamt, text: r.gesamt === 1 ? "Bestellung" : "Bestellungen", testid: "kz-anzahl" }, { wert: cent(r.summe || 0), text: "Summe gefiltert" }]}
        aktionen={<NeuMenue leitung={leitung} schreiben={ctx.schreiben} />}
      />
      <Erstbesuch text={kanban ? T.erstbesuch.kanban : T.erstbesuch.bestellungen} route={kanban ? "/shop/bestellungen?kanban" : "/shop/bestellungen"} />
      <ShopFilter basis="/shop/bestellungen" params={params} ansichten={ansichtsOptionen} ansicht={kanban ? "kanban" : r.ansicht} status={kanban ? [] : status} suche="Nummer, Name, E-Mail, Sendungsnr."
        chips={kanban ? [] : [{ param: "lieferart", wert: "versand", titel: "Versand" }, { param: "lieferart", wert: "abholung", titel: "Abholung" }]}
        rechts={kanban ? <Segment label="Bahn" aktiv={params.bahn || "versand"} groesse="s" optionen={[{ wert: "versand", titel: "Versand", href: `/shop/bestellungen?ansicht=kanban&bahn=versand` }, { wert: "abholung", titel: "Abholung", href: `/shop/bestellungen?ansicht=kanban&bahn=abholung` }, { wert: "alle", titel: "Alle", href: `/shop/bestellungen?ansicht=kanban&bahn=alle` }]} /> : null} />
      {fehler ? (
        <Fehler code={fehler.code} message={fehler.message} />
      ) : kanban ? (
        <BestellKanban leitung={leitung} bahn={params.bahn || "versand"} spalten={spaltenFuer(params.bahn || "versand", sichtbar).map((s) => ({ status: s.status, karten: s.karten.map((b) => karte(b, zeilen.find((z) => z.name === b.name), pos, heute)) }))} />
      ) : (
        <div className="bo-shop-raster" data-vorschau={panel ? "" : undefined}>
          <ShopListe liste="bestellungen" spalten={SPALTEN} zeilen={zeilen} gesamt={r.gesamt} seite={r.seite} seiten={r.seiten} basis="/shop/bestellungen" params={params} arbeit={r.arbeit} vorschau aktivName={panel?.name}
            summe={cent(r.summe || 0)} darfExport
            massen={ctx.schreiben ? [{ id: "packen", titel: "Packen", icon: "Package" }, { id: "abholbereit", titel: "Abholbereit melden", icon: "ShoppingBag" }, { id: "abschliessen", titel: "Abschließen", icon: "Check" }, { id: "bestaetigung", titel: "Bestätigung senden", icon: "Mail" }] : []}
            leer={r.nieDaten ? <Leer art="leer" titel="Noch keine Bestellungen" text={T.leer.bestellungenNie} /> : r.gefiltert ? <Leer art="gefiltert" titel={T.leer.bestellungenFilter} zuruecksetzenHref={`/shop/bestellungen?ansicht=${r.ansicht}`} /> : <Leer art="erledigt" titel={T.leer.erledigt} />} />
          {panel && <Vorschau b={panel} ctx={ctx} params={params} pos={pos[panel.name] || []} />}
        </div>
      )}
      {(params.neu === "telefon" || params.neu === "showroom") && ctx.schreiben && <NeueBestellung modus={params.neu} einstellungen={eins.shop} leitung={leitung} />}
    </Rahmen>
  );
}

function karte(b, z, pos, heute) {
  const o = offen(b);
  return {
    name: b.name, kunde: b.kunde_name, alter: z?.zellen.bestellt.text || datum(b.angelegt), gesamt: cent(b.gesamt_cent), href: `/shop/bestellungen/${encodeURIComponent(b.name)}`,
    positionen: pos[b.name] || [], lieferart: b.lieferart, offen: o > 0 ? cent(o) : "", person: b.zugewiesen_an || "",
    frist: b.abholung_bis && ["reserviert", "abholbereit"].includes(b.status) && fristMorgen(b, heute) ? { text: b.abholung_bis < heute ? "Frist überschritten" : "Frist bis morgen", ton: b.abholung_bis < heute ? "rot" : "orange" } : null,
    chips: zusatzChips(b), aktion: z?.aktion || null, doc: docFuerAktion(b),
    roh: { status: b.status, lieferart: b.lieferart, offen_cent: o, gesamt_cent: b.gesamt_cent, betrag_bezahlt_cent: b.betrag_bezahlt_cent, bestellart: b.bestellart },
  };
}

/** Vorschau rechts (Lounge „Vorschau-Panel“): Bild mit Glas-Chips, Fakten, Nächster Schritt, Primäraktion. */
async function Vorschau({ b, ctx, params, pos }) {
  const bez = await bestellBezuege(ctx.client, b.name);
  const doc = await ctx.client.getDoc("PH Bestellung", b.name).catch(() => b);
  const schritt = naechsterSchritt(doc, { heute: ctx.heute, lieferscheine: bez.lieferscheine });
  const ak = bestellAktionen(doc, { leitung: ctx.leitung, zahlungen: bez.zahlungen, rechnungen: bez.rechnungen, lieferscheine: bez.lieferscheine, heute: ctx.heute, faehigkeiten: ctx.faehigkeiten, schreiben: ctx.schreiben });
  const st = statusInfo("PH Bestellung", doc.status, doc);
  const zu = new URLSearchParams(Object.entries(params).filter(([k]) => k !== "panel"));
  const bild = (doc.positionen || pos).find((p) => p.bild)?.bild;
  return (
    <aside className="bo-shop-vorschau" aria-label={`Vorschau ${b.name}`} data-testid="vorschau">
      <div className="bo-shop-vorschau__bild">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {bild ? <img src={bild} alt="" /> : <span className="bo-shop-thumb__ico"><ShopIcon name="Package" className="size-8" /></span>}
        <span className="bo-shop-vorschau__chips">
          <span className="bo-glas rounded-full px-3 py-1 text-[12px] font-semibold text-white">{doc.lieferart === "abholung" ? "Abholung" : "Versand"}</span>
          <span className="bo-glas rounded-full px-3 py-1 text-[12px] font-semibold text-white tabular-nums">{cent(doc.gesamt_cent)}</span>
        </span>
        <span className="bo-shop-vorschau__zu"><RundKnopf icon="X" label="Vorschau schließen" href={`/shop/bestellungen${zu.toString() ? `?${zu}` : ""}`} groesse="s" /></span>
      </div>
      <div className="bo-shop-vorschau__inhalt flex flex-col gap-5">
        <div>
          <p className="bo-shop-zelle-nr">{doc.name} · {datumZeit(doc.angelegt)}</p>
          <h2 className="mt-1 text-[22px] leading-7 font-semibold tracking-[-0.01em]">{doc.kunde_name}</h2>
          <p className="mt-1 flex flex-wrap items-center gap-1.5"><StatusBadge wert={doc.status} text={st.anzeige} ton={st.ton} groesse="m" />{zusatzChips(doc, { zahlungen: bez.zahlungen }).map((c) => <Pille key={c.id} material={c.material} groesse="s">{c.text}</Pille>)}</p>
        </div>
        <ul className="bo-shop-posten">
          {(doc.positionen || []).map((p) => <li key={p.idx}><span className="min-w-0 truncate">{p.menge} × {p.bezeichnung}</span><span className="tabular-nums">{cent(p.summe_cent)}</span></li>)}
        </ul>
        <dl className="bo-shop-fakten">
          <div><dt>Bezahlt</dt><dd>{cent(doc.betrag_bezahlt_cent)}</dd></div>
          <div><dt>Offen</dt><dd>{cent(offen(doc))}</dd></div>
          <div><dt>Nächster Schritt</dt><dd>{schritt.titel}</dd></div>
          <div><dt>{doc.lieferart === "abholung" ? "Abholung bis" : "Sendungsnr."}</dt><dd>{doc.lieferart === "abholung" ? (doc.abholung_bis ? datum(doc.abholung_bis) : "–") : doc.awb || "–"}</dd></div>
        </dl>
        <AktenAktionen primaer={ak.primaer} sekundaer={[]} menue={[...ak.sekundaer, ...ak.menue].slice(0, 8)} doc={docFuerAktion(doc)} />
        <Link href={`/shop/bestellungen/${encodeURIComponent(doc.name)}`} className="text-center text-[13px] font-medium text-bo-text-soft hover:text-bo-text">Akte öffnen</Link>
      </div>
    </aside>
  );
}
