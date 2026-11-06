// Server-Bausteine der Shop-Akten: Phasenleiste (§ 2.3, verbundene Stufen im Lounge-Stil), Verlauf (Status,
// Versionen, Kommentare zusammengeführt, § 3.6), Beträge (Lounge „Beträge“ mit Zahlungsbalken), Faktenliste.
import Link from "next/link";
import { cent, datum, datumZeit } from "@/lib/backoffice/format";
import { verlaufText } from "@/lib/backoffice/shop/texte";
import ShopIcon from "./ShopIcon";

const FELD = { zugewiesen_an: "Zuständig", notiz_intern: "Interne Notiz", abholung_bis: "Abholfrist", status: "Status", mail_status: "Bestätigung", awb: "Sendungsnummer", erstattet_cent: "Erstattet", betrag_bezahlt_cent: "Bezahlt", offen_cent: "Offen", radar_geprueft_am: "Risiko geprüft", gueltig_bis: "Gültig bis", rest_cent: "Restwert", erhalten_am: "Erhalten am", erstattungsbetrag_cent: "Erstattungsbetrag", wertminderung_cent: "Wertminderung", stripe_auszahlung: "Auszahlung", notiz: "Notiz", hinweis: "Hinweis", empfaenger: "Empfänger", grusstext: "Grußtext", link_gueltig_bis: "Link gültig bis", datum_bank: "Bankdatum", bestellung: "Bestellung" };

/** Phasen einer Bestellung (§ 2.3). Endzustände erscheinen als Band, nicht als Phase. */
export function bestellPhasen(b) {
  const zeit = (st) => [...(b.verlauf || [])].reverse().find((v) => v.status === st)?.zeit || "";
  const ersatz = b.bestellart === "Ersatz";
  const showroom = b.bestellart === "Showroom";
  const reihe = b.lieferart === "abholung"
    ? showroom ? ["reserviert", "bezahlt", "abholbereit", "abgeholt", "abgeschlossen"] : ["offen", "bezahlt", "abholbereit", "abgeholt", "abgeschlossen"]
    : ["offen", "bezahlt", "versandbereit", "versendet", "abgeschlossen"];
  const titel = { offen: "Offen", reserviert: "Reserviert", bezahlt: ersatz ? "0 € Ersatz" : "Bezahlt", versandbereit: "Versandbereit", versendet: "Versendet", abholbereit: "Abholbereit", abgeholt: "Abgeholt", abgeschlossen: "Abgeschlossen" };
  const st = b.status === "zahlung_ausstehend" || b.status === "pruefen" ? "offen" : b.status;
  const idx = reihe.indexOf(st);
  const datumVon = { offen: b.angelegt, reserviert: b.angelegt, bezahlt: b.bezahlt_am, versandbereit: zeit("versandbereit"), versendet: b.versendet_am, abholbereit: b.abholbereit_am, abgeholt: b.abgeholt_am, abgeschlossen: zeit("abgeschlossen") };
  return reihe.map((p, i) => ({ id: p, titel: titel[p], zustand: idx < 0 ? (i === 0 ? "erledigt" : "offen") : i < idx ? "erledigt" : i === idx ? "aktuell" : "offen", datum: idx >= 0 && i <= idx ? datumVon[p] : "" }));
}

export function Phasenleiste({ schritte, label = "Ablauf", testid = "phasen" }) {
  return (
    <nav aria-label={label} className="mb-6" data-testid={testid}>
      <ol className="bo-shop-phasen">
        {schritte.map((s) => (
          <li key={s.id} className="bo-shop-phase" data-zustand={s.zustand} aria-current={s.zustand === "aktuell" ? "step" : undefined}>
            {s.href && s.zustand !== "offen" ? (
              <Link href={s.href} className="bo-shop-phase__knoten" aria-label={s.titel}><ShopIcon name={s.zustand === "erledigt" ? "Check" : "Circle"} /></Link>
            ) : (
              <span className="bo-shop-phase__knoten" aria-disabled={s.zustand === "offen" ? "true" : undefined} aria-label={s.zustand === "offen" ? `${s.titel} – noch nicht erreicht` : s.titel}>
                <ShopIcon name={s.zustand === "erledigt" ? "Check" : s.zustand === "aktuell" ? "Circle" : "Circle"} />
              </span>
            )}
            <span className="bo-shop-phase__titel">{s.titel}</span>
            <span className="bo-shop-phase__datum">{s.datum ? datumZeit(s.datum) : " "}</span>
          </li>
        ))}
      </ol>
    </nav>
  );
}

/**
 * Verlauf: Statuszeilen (`verlauf[]`), Kommentare, Versionen – eine Zeitleiste, neueste oben. Filter über ?verlauf=.
 * @param {{verlauf?:object[], docinfo?:object, filter?:string, basis:string}} p
 */
export function Verlauf({ verlauf = [], docinfo = {}, filter = "alle", basis }) {
  const eintraege = [
    ...verlauf.map((v) => ({ art: "status", zeit: v.zeit, titel: v.status ? verlaufText(v.hinweis) || `Status ${v.status}` : verlaufText(v.hinweis), text: v.hinweis && v.status ? "" : "", von: verlaufText(v.von), icon: "Circle" })),
    ...(docinfo.comments || []).map((k) => ({ art: /mail/i.test(k.content || "") ? "mails" : "kommentare", zeit: k.creation, titel: k.comment_type === "Info" ? "Hinweis" : k.comment_type === "Attachment" ? "Anhang" : "Kommentar", text: verlaufText(String(k.content || "").replace(/<[^>]+>/g, "")), von: k.owner, icon: k.comment_type === "Attachment" ? "Paperclip" : "MessageSquare" })),
    ...(docinfo.versions || []).slice(0, 15).map((v) => ({ art: "status", zeit: v.creation, titel: "Geändert", text: (v.data?.changed || []).map(([f]) => FELD[f]).filter(Boolean).slice(0, 3).join(", "), von: v.owner, icon: "Pencil" })).filter((v) => v.text),
  ].filter((e) => filter === "alle" || e.art === filter).sort((a, b) => String(b.zeit).localeCompare(String(a.zeit)));
  const chips = [["alle", "Alle"], ["status", "Status"], ["mails", "Mails"], ["kommentare", "Kommentare"]];
  return (
    <div className="flex flex-col gap-5" data-testid="verlauf">
      <div className="bo-shop-chipzeile" role="group" aria-label="Verlauf filtern">
        {chips.map(([w, t]) => <Link key={w} href={`${basis}${basis.includes("?") ? "&" : "?"}verlauf=${w}`} className="bo-shop-chip" aria-pressed={filter === w} scroll={false} prefetch={false}>{t}</Link>)}
      </div>
      {eintraege.length ? (
        <ol className="bo-shop-zeit">
          {eintraege.map((e, i) => (
            <li key={i}>
              <span className="bo-shop-zeit__ico" aria-hidden="true"><ShopIcon name={e.icon} /></span>
              <span className="min-w-0">
                <span className="bo-shop-zeit__titel block">{e.titel}</span>
                {e.text && <span className="bo-shop-zeit__text block">{e.text}</span>}
                {e.von && <span className="bo-shop-zeit__text block text-[12px]">{String(e.von).split("@")[0]}</span>}
              </span>
              <span className="bo-shop-zeit__zeit">{datumZeit(e.zeit)}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-[15px] text-bo-text-soft">Noch keine Einträge.</p>
      )}
    </div>
  );
}

/** Beträge (Lounge): große Zahl, Zahlungsbalken (bezahlt Salbei · offen Eiche · erstattet Stein), Liste mit Punkt. */
export function Betraege({ gesamt, bezahlt, erstattet = 0, posten = [], unter }) {
  const offenC = Math.max(gesamt - bezahlt, 0);
  const basis = Math.max(gesamt, bezahlt, 1);
  return (
    <div data-testid="betraege">
      <p className="bo-shop-zahl">{cent(gesamt).replace(/\s€$/, "")}<span className="ml-1 text-[22px] text-bo-text-soft">€</span></p>
      {unter && <p className="text-[13px] text-bo-text-soft">{unter}</p>}
      <div className="bo-shop-balken" aria-hidden="true">
        {bezahlt - erstattet > 0 && <span data-teil="bezahlt" style={{ flex: (bezahlt - erstattet) / basis }} />}
        {erstattet > 0 && <span data-teil="erstattet" style={{ flex: erstattet / basis }} />}
        {offenC > 0 && <span data-teil="offen" style={{ flex: offenC / basis }} />}
      </div>
      <ul className="bo-shop-posten">
        <li><span><span className="bo-shop-punkt" data-teil="bezahlt" />Bezahlt</span><strong className="tabular-nums">{cent(bezahlt)}</strong></li>
        {erstattet > 0 && <li><span><span className="bo-shop-punkt" />Erstattet</span><strong className="tabular-nums">−{cent(erstattet)}</strong></li>}
        <li><span><span className="bo-shop-punkt" data-teil="offen" />Offen</span><strong className="tabular-nums">{cent(offenC)}</strong></li>
        {posten.map((p) => <li key={p.label}><span className="text-bo-text-soft">{p.label}</span><span className="tabular-nums">{p.wert}</span></li>)}
      </ul>
    </div>
  );
}

/** Faktenliste zweispaltig (Lounge Vorschau-Panel „Fakten“). */
export function Fakten({ eintraege = [], eins = false }) {
  return (
    <dl className={`bo-shop-fakten${eins ? " bo-shop-fakten--eins" : ""}`}>
      {eintraege.filter(Boolean).map((e) => (
        <div key={e.label} className="min-w-0">
          <dt>{e.label}</dt>
          <dd className={e.mono ? "font-mono text-[13px]" : undefined}>{e.href ? <Link href={e.href} className="underline-offset-2 hover:underline" prefetch={false}>{e.wert}</Link> : e.wert ?? "–"}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Bezüge als Zeilen (Lounge „Bezüge“). */
export function BezugListe({ eintraege = [] }) {
  if (!eintraege.length) return <p className="text-[14px] text-bo-text-soft">Keine Bezüge.</p>;
  return (
    <ul className="bo-shop-zeilen">
      {eintraege.map((e) => (
        <li key={`${e.titel}-${e.wert}`} className="bo-shop-zeile">
          <span className="bo-shop-zeile__ico" aria-hidden="true"><ShopIcon name={e.icon || "FileText"} /></span>
          <span className="min-w-0">
            {e.href ? <Link href={e.href} className="block truncate text-[14px] font-semibold hover:underline" prefetch={false}>{e.titel}</Link> : <span className="block truncate text-[14px] font-semibold">{e.titel}</span>}
            <span className="bo-shop-unter">{e.wert}</span>
          </span>
          {e.href ? <ShopIcon name="ChevronRight" className="size-4 text-bo-text-faint" /> : <span />}
        </li>
      ))}
    </ul>
  );
}

export { datum };
