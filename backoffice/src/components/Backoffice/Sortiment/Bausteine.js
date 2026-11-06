// Bereich Sortiment – kleine Bausteine (server- und client-tauglich, ohne Hooks): Produktbild, Status, Preis,
// Bildzustand, Listenkachel mit Tabelle (Desktop) und Karten (Telefon), Fakten, Schrittfolge.
// Lounge §6: Tabelle in Kachel mit luftigen Zeilen, weiche Status-Pillen (Punkt + Wort), Produktbild je Zeile.
import "./sortiment.css";
import Image from "next/image";
import Link from "next/link";
import { Check, Clock, ImageOff, TriangleAlert, CircleCheck, CircleDashed } from "lucide-react";
import cx from "../cx";
import StatusBadge from "../StatusBadge";
import { cent, datum } from "@/lib/backoffice/format";
import { status as statusVon } from "@/lib/backoffice/sortiment/status";
import { bilderZustand, preisZustand } from "@/lib/backoffice/sortiment/regeln";
import { PRODUKTE } from "@/lib/backoffice/sortiment/texte";

/** Freisteller (Produktfoto ohne Raum) an der Dateibenennung bzw. am Bildtyp erkennen. */
export function istFreisteller(src = "", typ = "") {
  return typ === "freisteller" || /\/p-[^/]+$/.test(String(src));
}

/**
 * Produktbild: Freisteller auf Leinen (contain), Raumbilder randlos (cover); ohne Bild ruhiges Symbol.
 * @param {{src?:string, alt?:string, groesse?:number, typ?:string, className?:string, zustand?:"alle"|"teil"|"kein"|"keins-frei", prioritaet?:boolean}} p
 */
export function ProduktBild({ src, alt = "", groesse = 48, typ, className, zustand, prioritaet = false, fuellen = false }) {
  const stil = fuellen ? undefined : { width: groesse, height: groesse };
  return (
    <span className={cx("bo-sor-bild", className)} style={stil} data-art={src && istFreisteller(src, typ) ? "freisteller" : "raum"}>
      {src ? (
        <Image src={src} alt={alt} fill sizes={fuellen ? "(max-width: 768px) 50vw, 320px" : `${groesse}px`} priority={prioritaet} />
      ) : (
        <span className="bo-sor-bild__leer" aria-hidden={alt ? undefined : "true"}>
          <ImageOff className="size-[40%] max-h-6 max-w-6" strokeWidth={1.5} aria-hidden="true" />
          {alt && <span className="sr-only">{PRODUKTE.bilderKeins}</span>}
        </span>
      )}
      {zustand && zustand !== "alle" && zustand !== "kein" && (
        <span className="bo-sor-bild__marke" title={zustand === "teil" ? "Teilweise freigegeben" : "Bildfreigabe offen"}>
          <Clock className="size-3 text-bo-eiche-text" strokeWidth={2} aria-hidden="true" />
        </span>
      )}
    </span>
  );
}

/** Status-Pille nach Glossar (Ton-Gruppe aus status.js). */
export function Status({ gruppe, wert, groesse = "m", className }) {
  const s = statusVon(gruppe, wert);
  if (!wert) return <span className="text-bo-text-faint">–</span>;
  return <StatusBadge wert={s.wert} text={s.text} ton={s.ton} groesse={groesse} className={className} />;
}

/** Preis mit Stand (§ 3.2 Spalte „Preis ab“): Zeile 1 Betrag, Zeile 2 Stand/läuft ab/veraltet. */
export function PreisZelle({ produkt, rechts = true }) {
  const z = preisZustand(produkt);
  if (z.art === "anfrage") return <span className="bo-sor-unter">{PRODUKTE.aufAnfrage}</span>;
  if (z.art === "kein") return <span className="text-bo-text-faint">{PRODUKTE.ohnePreis}</span>;
  return (
    <span className={cx("flex flex-col", rechts && "items-end")}>
      <span className="font-medium tabular-nums whitespace-nowrap">{cent(z.cent)}</span>
      {z.art === "veraltet" ? (
        <span className="bo-sor-klein bo-sor-gefahr inline-flex items-center gap-1 whitespace-nowrap">
          <TriangleAlert className="size-3" strokeWidth={2} aria-hidden="true" />
          {PRODUKTE.preisVeraltet(datum(z.bis || z.stand))}
        </span>
      ) : z.art === "laeuftAb" ? (
        <span className="bo-sor-klein bo-sor-warn whitespace-nowrap">{PRODUKTE.preisLaeuftAb(datum(z.bis))}</span>
      ) : (
        <span className="bo-sor-klein whitespace-nowrap">{PRODUKTE.preisStand(datum(z.stand))}</span>
      )}
    </span>
  );
}

/** Bildzustand als Wort + Symbol (nie Farbe allein). */
export function BilderZelle({ produkt }) {
  const b = bilderZustand(produkt);
  if (b.art === "kein") return <span className="bo-sor-unter inline-flex items-center gap-1.5"><CircleDashed className="size-3.5" strokeWidth={1.75} aria-hidden="true" />{PRODUKTE.bilderKeins}</span>;
  if (b.art === "alle") return <span className="bo-sor-unter bo-sor-ok inline-flex items-center gap-1.5"><CircleCheck className="size-3.5" strokeWidth={1.75} aria-hidden="true" />{PRODUKTE.bilderAlle}</span>;
  return <span className="bo-sor-unter bo-sor-warn inline-flex items-center gap-1.5"><Clock className="size-3.5" strokeWidth={1.75} aria-hidden="true" />{PRODUKTE.bilderTeil(b.frei, b.n)}</span>;
}

/**
 * Listenkachel: Tabelle (ab 768 px) und Karten (darunter) aus denselben Zeilen.
 * @param {{kopf:Array<{titel:string, rechts?:boolean, klasse?:string}>, zeilen:Array<{key:string, href?:string, linkLabel?:string, warn?:boolean, zellen:any[], karte:any}>, oben?:any, fuss?:any, label:string, testid?:string}} p
 */
export function ListenKachel({ kopf, zeilen, oben, fuss, label, testid = "liste", leer }) {
  return (
    <section className="bo-kachel bo-sor-liste min-w-0" aria-label={label} data-testid={testid}>
      {oben && <div className="bo-sor-liste__kopf">{oben}</div>}
      {zeilen.length === 0 ? (
        leer
      ) : (
        <>
          <div className="bo-sor-tabelle-huelle overflow-x-auto">
            <table className="bo-sor-tabelle">
              <thead>
                <tr>
                  {kopf.map((k, i) => (
                    <th key={i} scope="col" className={cx(k.rechts && "r", k.klasse)}>
                      {k.titel ? k.titel : <span className="sr-only">{k.sr || "Aktion"}</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {zeilen.map((z) => (
                  <tr key={z.key} data-warn={z.warn ? "true" : undefined}>
                    {z.zellen.map((c, i) => (
                      <td key={i} className={cx(kopf[i]?.rechts && "r", kopf[i]?.klasse)}>
                        {c}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="bo-sor-karten" data-testid="karten-liste">
            {zeilen.map((z) => (
              <li key={z.key} className="bo-sor-karte-zeile">
                {z.karte}
              </li>
            ))}
          </ul>
        </>
      )}
      {fuss && <div className="bo-sor-liste__fuss">{fuss}</div>}
    </section>
  );
}

/** Titel-Zelle mit Bild und Link über die ganze Zeile. */
export function TitelZelle({ href, titel, unter, bild, bildTyp, zustand, groesse = 48 }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      {bild !== undefined && <ProduktBild src={bild} alt="" groesse={groesse} typ={bildTyp} zustand={zustand} />}
      <div className="min-w-0">
        {href ? (
          <Link href={href} className="bo-sor-link bo-sor-link--zeile bo-sor-titel line-clamp-2">
            {titel}
          </Link>
        ) : (
          <span className="bo-sor-titel line-clamp-2">{titel}</span>
        )}
        {unter && <p className="bo-sor-unter truncate">{unter}</p>}
      </div>
    </div>
  );
}

/** Seitenwechsel „1–25 von 60 · Zurück · Weiter“ als Links. */
export function Blaettern({ seite, limit, gesamt, href }) {
  const von = gesamt ? (seite - 1) * limit + 1 : 0;
  const bis = Math.min(gesamt, seite * limit);
  const max = Math.max(1, Math.ceil(gesamt / limit));
  return (
    <>
      <span className="tabular-nums" data-testid="tabelle-gesamt">{PRODUKTE.bereich(von, bis, gesamt)}</span>
      {max > 1 && (
        <span className="flex items-center gap-2">
          {seite > 1 ? <Link className="bo-knopf bo-knopf--secondary min-h-9 px-4 text-[13px]" href={href(seite - 1)}>{PRODUKTE.zurueck}</Link> : null}
          {seite < max ? <Link className="bo-knopf bo-knopf--secondary min-h-9 px-4 text-[13px]" href={href(seite + 1)}>{PRODUKTE.weiter}</Link> : null}
        </span>
      )}
    </>
  );
}

/** Fakten 2-spaltig (Lounge Vorschau-Panel). */
export function Fakten({ eintraege, spalten = 2, className }) {
  const sichtbar = eintraege.filter(Boolean);
  return (
    <dl className={cx("bo-sor-fakten", spalten === 3 && "md:grid-cols-3", spalten === 4 && "md:grid-cols-4", className)}>
      {sichtbar.map((e) => (
        <div key={e.label} className="min-w-0">
          <dt>{e.label}</dt>
          <dd>{e.wert ?? "–"}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Kompakte Schrittfolge (Bestellkette in der Akte). zustand: erledigt · aktuell · offen · uebersprungen. */
export function Schritte({ schritte, label }) {
  return (
    <ol className="bo-sor-schritte" aria-label={label}>
      {schritte.map((s, i) => (
        <li key={s.id} className="bo-sor-schritt" data-zustand={s.zustand} aria-current={s.zustand === "aktuell" ? "step" : undefined}>
          <span className="bo-sor-schritt__punkt" aria-hidden="true">
            {s.zustand === "erledigt" ? <Check className="size-3.5" strokeWidth={2.25} /> : <span className="text-[12px] font-semibold tabular-nums">{i + 1}</span>}
          </span>
          <span className="bo-sor-schritt__text">
            {s.titel}
            <span className="sr-only">{s.zustand === "erledigt" ? " (erledigt)" : s.zustand === "aktuell" ? " (aktuell)" : ""}</span>
          </span>
          <span className="bo-sor-schritt__linie" aria-hidden="true" />
        </li>
      ))}
    </ol>
  );
}

/** Checkliste „Bereit für Website“ (Haken/Uhr + Wort). */
export function Checkliste({ punkte }) {
  return (
    <ul className="bo-sor-check">
      {punkte.map((p) => (
        <li key={p.id} data-ok={p.ok ? "true" : "false"} data-sperrt={p.sperrt ? "true" : "false"}>
          <span className="bo-sor-check__ico" aria-hidden="true">
            {p.ok ? <Check className="size-3.5" strokeWidth={2.25} /> : <Clock className="size-3.5" strokeWidth={2} />}
          </span>
          <span className={cx("min-w-0", !p.ok && "text-bo-text")}>{p.titel}</span>
          <span className="sr-only">{p.ok ? "erfüllt" : "offen"}</span>
        </li>
      ))}
    </ul>
  );
}
