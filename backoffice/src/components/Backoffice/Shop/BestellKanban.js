"use client";
// Bestell-Kanban (10-konzept-shop § 4.4; Lounge-Spalten als eingelassene Flächen, Karten schweben). Ziehen löst
// nur erlaubte Dokumentmethoden aus (kanban.js), nie generisches Setzen; nicht erlaubte Spalten blassen aus,
// Ablage dort → Karte bleibt, Toast + Live-Region mit Grund. Tastatur: M = „Verschieben nach …“ (nur erlaubte
// Ziele), Shift+Enter = Primäraktion, Enter öffnet. Touch: Menü statt Ziehen. Ausstehende Züge mit Ring.
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Menue, MenuePunkt } from "@/components/Backoffice/Overlay";
import Knopf from "@/components/Backoffice/Knopf";
import StatusBadge, { Pille } from "@/components/Backoffice/StatusBadge";
import Avatar from "@/components/Backoffice/Avatar";
import Ausstehend from "@/components/Backoffice/Ausstehend";
import { useToast } from "@/components/Backoffice/Toast";
import { useAusstehend } from "@/lib/backoffice/commit/useVerzoegerterCommit";
import { zug, ziele, ABSCHLIESSEN } from "@/lib/backoffice/shop/kanban";
import { statusInfo } from "@/lib/backoffice/shop/status";
import { T } from "@/lib/backoffice/shop/texte";
import { Thumb } from "./Dialoge";
import ShopIcon from "./ShopIcon";
import { useShopAktionen } from "./ShopAktionen";

const titelVon = (s) => (s === ABSCHLIESSEN ? "Abschließen" : statusInfo("PH Bestellung", s).anzeige);

function Karte({ k, spalten, leitung, onZiehen, zieht }) {
  const { ausfuehren } = useShopAktionen();
  const router = useRouter();
  const v = useAusstehend({ doctype: "PH Bestellung", name: k.name });
  const erlaubt = ziele(k.roh, spalten, { leitung });
  return (
    <article className="bo-shop-karte" draggable={!v} tabIndex={0} data-zieht={zieht ? "" : undefined} data-laeuft={v ? "" : undefined} aria-label={`${k.name} · ${k.kunde}`} data-testid="kanban-karte" data-name={k.name}
      onDragStart={(e) => { e.dataTransfer.setData("text/plain", k.name); e.dataTransfer.effectAllowed = "move"; onZiehen(k); }}
      onDragEnd={() => onZiehen(null)}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return;
        if (e.key === "Enter" && e.shiftKey && k.aktion) { e.preventDefault(); ausfuehren(k.aktion.id, k.doc); }
        else if (e.key === "Enter") router.push(k.href);
      }}>
      <div className="flex items-start justify-between gap-2">
        <span className="min-w-0">
          <Link href={k.href} className="block truncate text-[15px] font-semibold hover:underline" prefetch={false}>{k.kunde}</Link>
          <span className="bo-shop-zelle-nr">{k.name} · {k.alter}</span>
        </span>
        <span className="bo-shop-betrag text-[14px]">{k.gesamt}</span>
      </div>
      {k.positionen.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {k.positionen.slice(0, 2).map((p, i) => (
            <li key={i} className="flex items-center gap-2 text-[13px]"><Thumb bild={p.bild} klein /><span className="min-w-0 truncate">{p.menge} × {p.bezeichnung}</span></li>
          ))}
        </ul>
      )}
      <div className="bo-shop-karte__fuss">
        <ShopIcon name={k.lieferart === "abholung" ? "ShoppingBag" : "Truck"} label={k.lieferart === "abholung" ? "Abholung" : "Versand"} />
        {k.offen ? <Pille material="eiche" groesse="s">Offen {k.offen}</Pille> : <StatusBadge wert="bezahlt" text="Bezahlt" ton="gruen" />}
        {k.frist && <Pille material={k.frist.ton === "rot" ? "nuss" : "eiche"} groesse="s">{k.frist.text}</Pille>}
        {k.chips.map((c) => <Pille key={c.id} material={c.material} groesse="s">{c.text}</Pille>)}
        <span className="ml-auto flex items-center gap-1">
          {k.person && <Avatar name={k.person.split("@")[0].replace(/[._]/g, " ")} groesse={24} />}
          <Menue label={`${k.name} verschieben`} ausloeser={(p) => <Knopf {...p} size="s" variant="ghost" icon="Ellipsis" label={`${k.name}: Verschieben nach …`} data-testid="kanban-menue" />}>
            {erlaubt.length ? erlaubt.map((s) => (
              <MenuePunkt key={s} icon="ArrowRight" onWaehlen={() => ausfuehren(zug(k.roh, s, { leitung }).aktion, k.doc)}>{titelVon(s)}</MenuePunkt>
            )) : <MenuePunkt deaktiviert grund={k.offen ? T.kanbanVerboten.erstZahlung : "Kein Schritt von hier"}>Keine Verschiebung</MenuePunkt>}
          </Menue>
        </span>
      </div>
      {v && <Ausstehend objekt={{ doctype: "PH Bestellung", name: k.name }} />}
    </article>
  );
}

/**
 * @param {{spalten:Array<{status:string, karten:object[]}>, leitung:boolean, bahn:string}} p
 * karten: { name, kunde, alter, gesamt, href, positionen[], lieferart, offen, frist, chips, person, aktion, doc, roh{status, lieferart, offen_cent, gesamt_cent, betrag_bezahlt_cent} }
 */
export default function BestellKanban({ spalten, leitung, bahn }) {
  const { ausfuehren } = useShopAktionen();
  const { zeige } = useToast();
  const [ziehe, setZiehe] = useState(null);
  const [ueber, setUeber] = useState(null);
  const [ansage, setAnsage] = useState("");
  const status = spalten.map((s) => s.status);
  const ablegen = (ziel) => {
    const k = ziehe;
    setUeber(null);
    setZiehe(null);
    if (!k) return;
    const z = zug(k.roh, ziel, { leitung });
    if (!z.ok) {
      if (z.grund) {
        zeige(z.grund, { art: "warnung" });
        setAnsage(z.grund);
      }
      return;
    }
    ausfuehren(z.aktion, k.doc);
    setAnsage(`${k.name} → ${titelVon(ziel)}`);
  };
  const spalteProps = (s) => ({
    onDragOver: (e) => { if (ziehe) { e.preventDefault(); setUeber(s); } },
    onDragLeave: () => setUeber((u) => (u === s ? null : u)),
    onDrop: (e) => { e.preventDefault(); ablegen(s); },
    "data-ziel": ziehe ? (zug(ziehe.roh, s, { leitung }).ok ? (ueber === s ? "ja" : undefined) : "nein") : undefined,
  });
  if (bahn === "abholung" && spalten.every((s) => !s.karten.length)) return <p className="bo-shop-flaeche text-center text-bo-text-soft">{T.leer.abholungLeer}</p>;
  return (
    <div className="min-w-0" data-testid="kanban">
      <div className="bo-shop-kb" role="list" aria-label="Bestellungen nach Status">
        {spalten.map((s) => (
          <section key={s.status} className="bo-shop-kb__spalte" role="listitem" aria-label={`${titelVon(s.status)}, ${s.karten.length}`} data-ton={s.status === "pruefen" ? "rot" : undefined} {...spalteProps(s.status)}>
            <header className="bo-shop-kb__kopf">
              <span className="flex items-center gap-2">{s.status === "pruefen" && <ShopIcon name="TriangleAlert" className="size-4 text-bo-ziegel-text" />}{titelVon(s.status)}</span>
              <span className="bo-shop-kb__n">{s.karten.length}</span>
            </header>
            {s.karten.length ? s.karten.map((k) => <Karte key={k.name} k={k} spalten={status} leitung={leitung} zieht={ziehe?.name === k.name} onZiehen={setZiehe} />) : <p className="bo-shop-kb__leer">{T.leer.kanbanSpalte}</p>}
          </section>
        ))}
        {ziehe && ["versendet", "abgeholt"].includes(ziehe.roh.status) && (
          <section className="bo-shop-abschluss" {...spalteProps(ABSCHLIESSEN)} aria-label="Abschließen">Hierher ziehen: Abschließen</section>
        )}
      </div>
      <p className="sr-only" aria-live="polite">{ansage}</p>
    </div>
  );
}
