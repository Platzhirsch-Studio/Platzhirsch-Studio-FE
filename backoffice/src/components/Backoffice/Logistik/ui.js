// Kleine Darstellungs-Bausteine des Bereichs Logistik (server- und client-tauglich, ohne Zustand).
// Status immer Punkt/Symbol + Wort (StatusBadge), Lieferart immer Icon + Wort, Zahlen tabellarisch.

import { Container, Package, Store, Truck } from "lucide-react";
import StatusBadge from "../StatusBadge";
import cx from "../cx";
import { phasenSchritte, statusText, statusTon, lieferartText } from "@/lib/backoffice/logistik/status";
import "./logistik.css";

const LIEFERART_ICON = { Versand: Package, Abholung: Store, Eigenlieferung: Truck, Spedition: Container };
const S16 = { size: 16, strokeWidth: 1.75, "aria-hidden": true };

export function StatusPille({ doctype, status, doc, groesse = "sm", className }) {
  if (!status) return null;
  return <StatusBadge wert={status} text={statusText(doctype, status, doc)} ton={statusTon(doctype, status)} groesse={groesse} storniert={status === "Storniert"} className={className} />;
}

export function Lieferart({ wert, className }) {
  const I = LIEFERART_ICON[wert] || Package;
  return (
    <span className={cx("bo-log-lieferart", className)}>
      <I {...S16} />
      {lieferartText(wert)}
    </span>
  );
}

export function Chip({ ton, children, className, testid }) {
  return (
    <span className={cx("bo-log-chip", className)} data-ton={ton} data-testid={testid}>
      {children}
    </span>
  );
}

export function Nummer({ children, className }) {
  return <span className={cx("bo-log-mono", className)}>{children}</span>;
}

/** Kompakte Phasenleiste: ○ Entwurf ── ● Gepackt ── ○ Übergeben … */
export function Phasen({ doctype, status, doc, label = "Phasen" }) {
  const schritte = phasenSchritte(doctype, status, doc);
  if (!schritte.length) return null;
  return (
    <ol className="bo-log-phasen" aria-label={label}>
      {schritte.map((s) => (
        <li key={s.id} className="bo-log-phase" data-z={s.zustand} aria-current={s.zustand === "aktuell" ? "step" : undefined}>
          <i aria-hidden="true" />
          {s.titel}
        </li>
      ))}
    </ol>
  );
}

/** Fakten als Definitionsliste (zweispaltig, ohne Linien). Leere Werte zeigen „–“. */
export function Fakten({ eintraege = [], className }) {
  return (
    <dl className={cx("bo-log-fakten", className)}>
      {eintraege.filter(Boolean).map((e) => (
        <div key={e.label} className="bo-log-fakt">
          <dt>{e.label}</dt>
          <dd>{e.wert === null || e.wert === undefined || e.wert === "" ? "–" : e.wert}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Auslastungs-/Fortschrittsbalken (scaleX, nie width). */
export function Balken({ anteil = 0, ueber = false, label, ton, className }) {
  const a = Math.max(0, Math.min(1, Number(anteil) || 0));
  return (
    <div className={cx("bo-log-balken", className)} data-ueber={ueber ? "true" : undefined} data-ton={ton} role="img" aria-label={label}>
      <span style={{ "--anteil": a }} />
    </div>
  );
}

export function Ring({ wert = 0, gesamt = 1 }) {
  const r = 22;
  const u = 2 * Math.PI * r;
  const anteil = gesamt ? Math.min(1, wert / gesamt) : 0;
  return (
    <svg className="bo-log-ring" viewBox="0 0 52 52" aria-hidden="true">
      <circle cx="26" cy="26" r={r} className="bg" />
      <circle cx="26" cy="26" r={r} className="fg bo-ring-bogen" strokeDasharray={u} strokeDashoffset={u * (1 - anteil)} />
    </svg>
  );
}

/** Hinweisfläche (Packhinweis, Lieferhinweis) mit Symbol. */
export function Hinweis({ ton = "stein", icon: I, children, className, testid }) {
  return (
    <p className={cx("bo-log-hinweis", className)} data-ton={ton} data-testid={testid}>
      {I ? <I {...S16} /> : null}
      <span>{children}</span>
    </p>
  );
}

/** Zeile in Kachel-Listen: Titel + Unterzeile links, rechts Status/Chips. */
export function Zeile({ href, titel, unter, rechts, testid, as }) {
  const Tag = as || (href ? "a" : "div");
  return (
    <Tag className="bo-log-zeile" href={href} data-testid={testid}>
      <span className="min-w-0">
        <span className="bo-log-zeile__titel block">{titel}</span>
        {unter ? <span className="bo-log-zeile__unter block">{unter}</span> : null}
      </span>
      {rechts ? <span className="bo-log-zeile__rechts">{rechts}</span> : null}
    </Tag>
  );
}

export function kgText(g) {
  const n = Number(g || 0);
  if (!n) return "–";
  return `${new Intl.NumberFormat("de-AT", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(n / 1000)} kg`;
}

export function datumKurz(iso) {
  if (!iso) return "–";
  const s = String(iso);
  return `${s.slice(8, 10)}.${s.slice(5, 7)}.`;
}

export function datumLang(iso) {
  if (!iso) return "–";
  const s = String(iso);
  const zeit = s.length > 10 ? ` ${s.slice(11, 16)}` : "";
  return `${s.slice(8, 10)}.${s.slice(5, 7)}.${s.slice(0, 4)}${zeit}`;
}

/** Wunschtermin: KW bei > 14 Tagen (§ 4.2). */
export function wunschText(iso, heute) {
  if (!iso) return "–";
  const t = (new Date(`${String(iso).slice(0, 10)}T00:00:00Z`) - new Date(`${String(heute).slice(0, 10)}T00:00:00Z`)) / 86_400_000;
  if (t > 14) {
    const d = new Date(`${String(iso).slice(0, 10)}T00:00:00Z`);
    const do_ = new Date(d.getTime() + (3 - ((d.getUTCDay() + 6) % 7)) * 86_400_000);
    const jan4 = new Date(Date.UTC(do_.getUTCFullYear(), 0, 4));
    return `KW ${1 + Math.round(((do_ - jan4) / 86_400_000 - 3 + ((jan4.getUTCDay() + 6) % 7)) / 7)}`;
  }
  return datumKurz(iso);
}
