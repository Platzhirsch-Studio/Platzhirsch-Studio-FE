// /shop/widerrufe – Widerruf & Retouren (T2/T3; 10-konzept-shop § 4.7): Segment Widerrufe | Retouren, je Liste |
// Kanban. Ampel mit gesetzlichen Fristen ab Zustellung (Quelle sichtbar). Widerrufs-Kanban ohne Ziehen – Schritte
// laufen über den Kartenknopf; Retouren-Kanban mit einzigem Schritt „Ware eingegangen“.
import Link from "next/link";
import { zugang } from "@/lib/backoffice/shop/zugang";
import { alle, lieferscheineFuer } from "@/lib/backoffice/shop/daten";
import { wendeAn } from "@/lib/backoffice/shop/ansichten";
import { widerrufZeile, retoureZeile } from "@/lib/backoffice/shop/zeilen";
import { statusListe, ARBEITSFLUSS, statusInfo } from "@/lib/backoffice/shop/status";
import { T } from "@/lib/backoffice/shop/texte";
import Rahmen from "@/components/Backoffice/Shop/Rahmen";
import ListenSeite from "@/components/Backoffice/Shop/ListenSeite";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Segment from "@/components/Backoffice/Segment";
import StatusBadge from "@/components/Backoffice/StatusBadge";
import { AktionsKnopf } from "@/components/Backoffice/Shop/AktionsKnoepfe";

export const metadata = { title: "Widerruf & Retouren · Shop" };
export const dynamic = "force-dynamic";

const SP_W = [
  { id: "objekt", titel: "Kunde", art: "objekt" },
  { id: "zeit", titel: "Eingang", art: "text" },
  { id: "bezug", titel: "Zuordnung", art: "link" },
  { id: "status", titel: "Status", art: "status" },
  { id: "ampel", titel: "Fristen", art: "ampel" },
  { id: "mail", titel: "Bestätigung", art: "text", nurBreit: true },
];
const SP_R = [
  { id: "objekt", titel: "Bestellung", art: "objekt" },
  { id: "zeit", titel: "Angekündigt", art: "text" },
  { id: "weg", titel: "Weg", art: "text" },
  { id: "status", titel: "Status", art: "status" },
  { id: "betrag", titel: "Erstattung", art: "betrag", rechts: true },
];

export default async function Widerrufe({ searchParams }) {
  const sp = await searchParams;
  const params = Object.fromEntries(Object.entries(sp).map(([k, v]) => [k, String(v)]));
  const ctx = await zugang("/shop/widerrufe");
  const { client, session, heute } = ctx;
  const retouren = params.segment === "retouren";
  const kanban = params.ansicht === "kanban";
  const [{ zeilen: roh, fehler }, best] = await Promise.all([alle(client, retouren ? "PH Retoure" : "PH Widerruf"), retouren ? Promise.resolve({ zeilen: [] }) : alle(client, "PH Bestellung", { fields: ["name", "versendet_am", "abgeholt_am", "status"] })]);
  const r = wendeAn(retouren ? "retouren" : "widerrufe", roh, kanban ? { ...params, ansicht: "alle", groesse: "100" } : params, { heute });
  const namen = roh.map((w) => w.bestellung).filter(Boolean);
  const ls = retouren ? [] : await lieferscheineFuer(client, namen);
  const lsJe = {};
  for (const l of ls) (lsJe[l.bestellung] ||= []).push(l);
  const bJe = Object.fromEntries(best.zeilen.map((b) => [b.name, b]));
  const zeile = (x) => (retouren ? retoureZeile(x) : widerrufZeile(x, { heute, bestellungen: bJe, lieferscheine: lsJe }));
  const segment = (
    <span className="flex flex-wrap items-center gap-3">
      <Segment label="Bereich" aktiv={retouren ? "retouren" : "widerrufe"} optionen={[{ wert: "widerrufe", titel: "Widerrufe", href: "/shop/widerrufe" }, { wert: "retouren", titel: "Retouren", href: "/shop/widerrufe?segment=retouren" }]} />
      <Segment label="Darstellung" groesse="s" aktiv={kanban ? "kanban" : "liste"} optionen={[{ wert: "liste", titel: "Liste", href: `/shop/widerrufe${retouren ? "?segment=retouren" : ""}` }, { wert: "kanban", titel: "Kanban", href: `/shop/widerrufe?${retouren ? "segment=retouren&" : ""}ansicht=kanban` }]} />
    </span>
  );
  const dt = retouren ? "PH Retoure" : "PH Widerruf";
  if (kanban) {
    const spalten = ARBEITSFLUSS[dt].map((s) => ({ status: s, karten: r.alleGefiltert.filter((x) => x.status === s).map(zeile) }));
    return (
      <Rahmen session={session} modus={client.modus}>
        <Seitenkopf titel="Widerruf & Retouren" krumen={[{ titel: "Zentrale", href: "/" }, { titel: "Shop", href: "/shop" }, { titel: "Widerruf & Retouren" }]} unternav={segment} />
        <p className="mb-4 text-[13px] text-bo-text-soft">{retouren ? "Einziger Schritt hier: „Ware eingegangen“." : T.kanbanVerboten.widerrufKeinZug}</p>
        <div className="bo-shop-kb" role="list" aria-label={retouren ? "Retouren nach Status" : "Widerrufe nach Status"} data-testid="kanban-widerruf">
          {spalten.map((s) => (
            <section key={s.status} className="bo-shop-kb__spalte" role="listitem" aria-label={`${statusInfo(dt, s.status).anzeige}, ${s.karten.length}`}>
              <header className="bo-shop-kb__kopf"><span>{statusInfo(dt, s.status).anzeige}</span><span className="bo-shop-kb__n">{s.karten.length}</span></header>
              {s.karten.length ? s.karten.map((k) => (
                <article key={k.name} className="bo-shop-karte" style={{ cursor: "default" }}>
                  <Link href={k.href} className="block truncate text-[15px] font-semibold hover:underline" prefetch={false}>{k.zellen.objekt.titel}</Link>
                  <span className="bo-shop-zelle-nr">{k.zellen.objekt.unter}</span>
                  {k.zellen.ampel && <StatusBadge wert={k.zellen.ampel.ton} text={k.zellen.ampel.text} ton={k.zellen.ampel.ton === "rot" ? "rot" : k.zellen.ampel.ton === "orange" ? "orange" : k.zellen.ampel.ton === "gruen" ? "gruen" : "grau"} />}
                  {k.zellen.bezug?.ton === "gefahr" && <span className="bo-shop-unter" data-ton="gefahr">nicht zugeordnet</span>}
                  {k.aktion && ctx.schreiben && <AktionsKnopf aktion={{ ...k.aktion, klasse: "undo" }} doc={k.doc} size="s" kurz />}
                </article>
              )) : <p className="bo-shop-kb__leer">Keine Einträge</p>}
            </section>
          ))}
        </div>
      </Rahmen>
    );
  }
  return (
    <Rahmen session={session} modus={client.modus}>
      <ListenSeite titel="Widerruf & Retouren" basis="/shop/widerrufe" params={params} r={r} liste={retouren ? "retouren" : "widerrufe"} spalten={retouren ? SP_R : SP_W} zeilen={r.zeilen.map(zeile)} fehler={fehler}
        unternav={segment} erstbesuch={T.erstbesuch.widerrufe} suche={retouren ? "Bestellung, Nummer" : "Name, E-Mail, Bestellung"}
        status={statusListe(dt).map((s) => ({ wert: s.wert, anzeige: s.anzeige }))}
        massen={ctx.schreiben ? (retouren ? [{ id: "retoure-eingang", titel: "Eingegangen", icon: "PackageCheck" }] : [{ id: "widerruf-bestaetigen", titel: "Eingangsbestätigung senden", icon: "Mail" }]) : []}
        leer={retouren ? { nie: T.leer.retourenNie, filter: T.leer.widerrufeFilter } : { nie: T.leer.widerrufeNie, filter: T.leer.widerrufeFilter, erledigt: T.leer.widerrufeOffenLeer }} darfExport />
    </Rahmen>
  );
}
