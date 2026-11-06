// Kleine Bausteine des Bereichs Faktura (Server und Client): Symbole, Signal, Status, Betrag, Feld.
// Icons: zusätzliche lucide-Symbole des Bereichs als benannte Importe (Vokabular 03 § 5), Rest über das Fundament.

import { ArrowDownLeft, ArrowUpRight, Circle, Landmark, Receipt, FileSignature, Lock, Undo2, Hourglass, Layers, Clock, TriangleAlert, FileText, MessageSquare, Calculator, Scale, ShieldCheck, Send, Wallet, Building2, Package, Truck } from "lucide-react";
import { Icon } from "../icons";
import StatusBadge from "../StatusBadge";
import cx from "../cx";

const EIGENE = { ArrowDownLeft, ArrowUpRight, Circle, Landmark, Receipt, FileSignature, Lock, Undo2, Hourglass, Layers, Clock, TriangleAlert, FileText, MessageSquare, Calculator, Scale, ShieldCheck, Send, Wallet, Building2, Package, Truck };

/** Symbol nach Name (Bereichs-Icons zuerst, sonst Fundament). */
export function FIcon({ name, className = "size-4", label, strokeWidth = 1.75 }) {
  const K = EIGENE[name];
  if (!K) return <Icon name={name} className={className} label={label} />;
  return <K className={className} strokeWidth={strokeWidth} aria-hidden={label ? undefined : true} aria-label={label} role={label ? "img" : undefined} />;
}

/** Zeilen-Signal (höchstens eines): Symbolform + Text, nie Farbe allein, nie Sand als Text. */
export function Signal({ signal, kurz = false }) {
  if (!signal) return null;
  return (
    <span className="bo-fk-signal" data-art={signal.art}>
      <FIcon name={signal.icon || "Clock"} className="size-3" />
      {kurz && signal.kurz ? (
        <abbr title={signal.text} className="no-underline">
          {signal.kurz}
        </abbr>
      ) : (
        signal.text
      )}
    </span>
  );
}

/** Status-Pille aus { ton, text, wert, gebucht, storniert }. */
export function Status({ status, groesse = "m" }) {
  if (!status) return null;
  return <StatusBadge wert={status.wert} text={status.text} ton={status.ton} groesse={groesse} gebucht={!!status.gebucht} storniert={!!status.storniert} />;
}

/** Betrag rechtsbündig, tabellarisch; Ausgang mit Pfeil (nie rot, § 2.1). */
export function Betrag({ text, ausgang = false, stark = false, className }) {
  return (
    <span className={cx("inline-flex items-center justify-end gap-1 whitespace-nowrap tabular-nums", stark ? "font-medium text-bo-text" : "text-bo-text-soft", className)}>
      {ausgang && <FIcon name="ArrowUpRight" className="size-3.5 text-bo-text-faint" label="Ausgang" />}
      {text}
    </span>
  );
}

/** Feld mit Label und Fehlertext darunter (Q-D4). */
export function Feld({ label, id, fehler, hilfe, children, className }) {
  return (
    <div className={cx("min-w-0", className)}>
      {label && (
        <label htmlFor={id} className="bo-fk-label">
          {label}
        </label>
      )}
      {children}
      {hilfe && !fehler && <p className="mt-1.5 text-[12px] leading-4 text-bo-text-faint">{hilfe}</p>}
      {fehler && (
        <p className="bo-fk-fehler" id={id ? `${id}-fehler` : undefined}>
          {fehler}
        </p>
      )}
    </div>
  );
}

/** Ruhige Hinweiszeile (Info/Warnung/Gefahr) ohne Rahmen – Fläche in Materialton. */
export function Hinweis({ ton = "info", icon, children, aktion, className, testid }) {
  const t = { info: "bg-bo-fill text-bo-text-soft", warnung: "bg-bo-eiche-soft text-bo-eiche-text", gefahr: "bg-bo-ziegel-soft text-bo-ziegel-text", ok: "bg-bo-salbei-soft text-bo-salbei-text" }[ton];
  const i = icon || { info: "Info", warnung: "TriangleAlert", gefahr: "TriangleAlert", ok: "Check" }[ton];
  return (
    <div className={cx("flex items-start gap-2.5 rounded-bo-zeile px-3.5 py-2.5 text-[13px] leading-5", t, className)} role={ton === "gefahr" ? "alert" : undefined} data-testid={testid}>
      <FIcon name={i} className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0 flex-1">{children}</div>
      {aktion && <div className="shrink-0">{aktion}</div>}
    </div>
  );
}

/** Fakten-Liste (Bezeichnung · Wert) für Dialoge und Peeks. */
export function Fakten({ eintraege = [], className }) {
  return (
    <dl className={cx("bo-fk-fakten", className)}>
      {eintraege
        .filter((e) => e && e.wert !== undefined && e.wert !== null && e.wert !== "")
        .map((e) => (
          <div key={e.label} className="contents">
            <dt>{e.label}</dt>
            <dd className="min-w-0 break-words">{e.wert}</dd>
          </div>
        ))}
    </dl>
  );
}
