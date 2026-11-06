// Bereich Marketing – kleine Bausteine (server- und client-tauglich, ohne Hooks): Status mit Marketing-Tönen,
// Bild, Datum groß, Balken, Zweck-Chips, Band, Liste in Kachel, Fakten, Prüfzeilen. Lounge-Stil über marketing.css.
import Link from "next/link";
import StatusBadge from "../StatusBadge";
import { Icon } from "../icons";
import cx from "../cx";
import { statusFuer } from "@/lib/backoffice/marketing/status";
import { ZWECK_TEXT, MONATE_KURZ } from "@/lib/backoffice/marketing/texte";
import "./marketing.css";

/** Status-Pille (Farbe + Form + Wort, Q-G2) mit den Marketing-Tönen § 2.0.4. */
export function Status({ gruppe, wert, groesse = "sm", mitTeilnehmern = false, testid }) {
  const s = statusFuer(gruppe, wert, { mitTeilnehmern });
  return (
    <span data-testid={testid} className="inline-flex">
      <StatusBadge wert={s.wert} ton={s.ton} text={s.text} groesse={groesse} />
    </span>
  );
}

export function Bild({ src, alt = "", groesse = 48, breite, className }) {
  return (
    <span className={cx("bo-mar-bild", className)} style={{ width: breite || groesse, height: groesse }}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} loading="lazy" decoding="async" />
      ) : (
        <span className="bo-mar-bild__leer" aria-hidden="true">
          <Icon name="Eye" className="size-4" />
        </span>
      )}
    </span>
  );
}

/** Datum groß links (Tag 20 px, Monat 11 px gedämpft, Satzschreibung). */
export function DatumGross({ datum, heute = false }) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(datum || ""));
  return (
    <span className="bo-mar-datum" data-heute={heute ? "true" : undefined} aria-hidden="true">
      <b>{m ? Number(m[3]) : "–"}</b>
      <span>{m ? MONATE_KURZ[Number(m[2]) - 1] : ""}</span>
    </span>
  );
}

export function Balken({ anteil = 0, ton, label, fortschritt = false, className }) {
  const a = Math.max(0, Math.min(1, Number(anteil) || 0));
  return (
    <span className={cx("bo-mar-balken", fortschritt && "bo-mar-balken--fortschritt", className)} data-ton={ton} role="img" aria-label={label}>
      <i style={{ width: `${Math.round(a * 100)}%` }} />
    </span>
  );
}

export function ZweckChips({ zwecke = [], max = 2 }) {
  if (!zwecke.length) return <span className="bo-mar-unter">–</span>;
  const sicht = zwecke.slice(0, max);
  const rest = zwecke.length - sicht.length;
  return (
    <span className="bo-mar-chips">
      {sicht.map((z) => (
        <span key={z} className="bo-mar-chip">
          {ZWECK_TEXT[z] || z}
        </span>
      ))}
      {rest > 0 && <span className="bo-mar-chip" title={zwecke.slice(max).map((z) => ZWECK_TEXT[z] || z).join(", ")}>+{rest}</span>}
    </span>
  );
}

const BAND_ICON = { test: "Sparkles", info: "Info", warn: "TriangleAlert", gefahr: "AlertTriangle" };

/** Höchstens ein Band je Seite (§ 2.0.2): Testmodus > Fehler > Hinweis. */
export function SeitenBand({ ton = "info", children, aktion, testid }) {
  return (
    <div className="bo-mar-band" data-ton={ton} role={ton === "gefahr" ? "alert" : "status"} data-testid={testid}>
      <Icon name={BAND_ICON[ton] || "Info"} className="size-4" />
      <div className="min-w-0 flex-1">{children}</div>
      {aktion}
    </div>
  );
}

/** Liste in schwebender Kachel (Radius 28, ohne Rahmen). */
export function ListeKachel({ label, kopf, fuss, children, testid, className }) {
  return (
    <section className={cx("bo-kachel bo-mar-liste min-w-0", className)} aria-label={label} data-testid={testid}>
      {kopf && <div className="bo-mar-liste__kopf">{kopf}</div>}
      {children}
      {fuss && <div className="bo-mar-liste__fuss">{fuss}</div>}
    </section>
  );
}

export function Fakten({ eintraege = [], eins = false }) {
  const sicht = eintraege.filter(Boolean);
  return (
    <dl className={cx("bo-mar-fakten", eins && "bo-mar-fakten--eins")}>
      {sicht.map((f) => (
        <div key={f.label} className="min-w-0">
          <dt>{f.label}</dt>
          <dd>{f.wert ?? "–"}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Prüfzeile mit Form + Text (Haken / Uhr / Kreis gestrichelt), nie Farbe allein. */
export function Pruefzeile({ ok, text, href, unter }) {
  const zustand = ok === true ? "true" : ok === false ? "false" : "leer";
  const icon = ok === true ? "Check" : ok === false ? "Clock" : "CircleDashed";
  const inhalt = (
    <>
      <span className="bo-mar-check__ico" aria-hidden="true">
        <Icon name={icon} className="size-3.5" />
      </span>
      <span className="min-w-0">
        <span className="block">{text}</span>
        {unter && <span className="bo-mar-klein block">{unter}</span>}
      </span>
      <span className="sr-only">{ok === true ? "erfüllt" : ok === false ? "offen" : "optional"}</span>
    </>
  );
  return href ? (
    <Link href={href} data-ok={zustand}>
      {inhalt}
    </Link>
  ) : (
    <li data-ok={zustand}>{inhalt}</li>
  );
}

/** Ampel (Form + Text) für Empfehlungen und Einstellungen. */
export function Ampel({ titel, ok, text }) {
  const icon = ok === true ? "Check" : ok === false ? "TriangleAlert" : "CircleDashed";
  return (
    <div className="bo-mar-ampel" data-ok={String(ok)}>
      <span className="bo-mar-ampel__ico" aria-hidden="true">
        <Icon name={icon} className="size-3.5" />
      </span>
      <span className="min-w-0">
        <b>{titel}</b>
        <span>{text}</span>
      </span>
    </div>
  );
}

/** Kleine Kennzahlenzeile in Kacheln (Zahl 28/400 + Bezeichnung). */
export function KennzahlZeile({ eintraege = [] }) {
  return (
    <div className="bo-mar-kz">
      {eintraege.map((e) => (
        <div key={e.text} data-testid={e.testid}>
          <b>{e.wert ?? "–"}</b>
          <span>{e.text}</span>
        </div>
      ))}
    </div>
  );
}

/** Zeile „Noch nicht verfügbar – Ersatzweg“ (12 px gedämpft) ohne Server-Import. */
export function SperrHinweis({ status, text }) {
  if (status?.an) return null;
  const satz = text || (status ? `Noch nicht verfügbar – ${status.ersatz?.titel || status.grund || ""}` : "");
  if (!satz) return null;
  return (
    <p className="bo-mar-klein" data-faehigkeit={status?.id}>
      {satz}
      {status?.ersatz?.href && (
        <>
          {" "}
          <Link href={status.ersatz.href} className="bo-mar-link underline underline-offset-2">
            Öffnen
          </Link>
        </>
      )}
    </p>
  );
}
