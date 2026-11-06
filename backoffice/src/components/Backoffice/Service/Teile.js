// Kleine Darstellungs-Bausteine des Bereichs Service (server- und client-tauglich, ohne Hooks).
// Status immer Punkt/Symbol + Wort; Gewährleistung als Punkt + Text (nie Farbe allein); Fälligkeit mit Ton.
import cx from "../cx";
import { Icon } from "../icons";
import StatusBadge from "../StatusBadge";
import { fallStatus, text as anzeigeText } from "@/lib/backoffice/service/labels";
import { faelligKurz } from "./teileLogik";
import "./service.css";

/** Status-Pille eines Servicefalls (UI-Text „Entschieden“, Zusatz „wartet auf Freigabe“). */
export function FallStatus({ fall, groesse = "m" }) {
  const s = fallStatus(fall);
  return (
    <span className="inline-flex min-w-0 flex-wrap items-center gap-2">
      <StatusBadge wert={fall.status} text={s.text} ton={s.ton} groesse={groesse} />
      {s.zusatz && (
        <span className="inline-flex items-center gap-1 text-[12px] font-medium text-bo-text-soft">
          <Icon name="Clock" className="size-3.5" />
          {s.zusatz}
        </span>
      )}
    </span>
  );
}

/** Status-Pille für andere Service-DocTypes über eine Status-Map aus labels.js. */
export function Status({ wert, map, groesse = "m" }) {
  const s = map?.[wert] || { text: anzeigeText(wert), ton: "grau" };
  return <StatusBadge wert={wert} text={s.text} ton={s.ton} groesse={groesse} />;
}

/** Gewährleistung kompakt („noch 612 Tage“) – Ergebnis von regeln.gewaehrleistungKompakt(). */
export function Gewaehrleistung({ g }) {
  if (!g?.text) return <span className="text-[13px] text-bo-text-faint">–</span>;
  return (
    <span className="bo-svc-gwl" data-ton={g.ton}>
      {g.text}
    </span>
  );
}

/** Nächster Schritt mit Fälligkeit (überfällig Ziegel + Pfeil, ≤ 3 Tage Eiche). */
export function Schritt({ titel, faellig, ton }) {
  return (
    <span className="block min-w-0">
      <span className="bo-svc-schritt line-clamp-2">{titel}</span>
      {faellig && (
        <span className="bo-svc-faellig" data-ton={ton}>
          {ton === "gefahr" && <Icon name="ArrowUp" className="size-3" />}
          {faelligKurz(faellig)}
        </span>
      )}
    </span>
  );
}

/** Ein rotes Signal (Text + Symbol). */
export function Signal({ signal }) {
  if (!signal) return null;
  return (
    <span className="bo-svc-signal">
      <Icon name="TriangleAlert" className="size-3.5" />
      {signal.text}
    </span>
  );
}

/** Bild 48 × 48, Radius 14 (Stück im Raum); ohne Bild ein ruhiges Symbol. */
export function Bild({ src, alt = "", icon = "Wrench", className }) {
  if (!src)
    return (
      <span className={cx("bo-svc-bild bo-svc-bild--leer", className)} aria-hidden="true">
        <Icon name={icon} className="size-5" />
      </span>
    );
  return (
    <span className={cx("bo-svc-bild", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element -- Mock-Bilder aus /public, im Frappe-Modus private Dateien über /api/datei */}
      <img src={src} alt={alt} loading="lazy" decoding="async" />
    </span>
  );
}

/** Fakten-Raster (dt/dd), Werte ohne Inhalt als „–“. */
export function Fakten({ eintraege = [], spalten = 2, className }) {
  const liste = eintraege.filter(Boolean);
  return (
    <dl className={cx("bo-svc-fakten", spalten === 3 && "bo-svc-fakten--3", className)}>
      {liste.map((e) => (
        <div key={e.label} className="min-w-0">
          <dt>{e.label}</dt>
          <dd>{e.wert === null || e.wert === undefined || e.wert === "" ? "–" : e.wert}</dd>
        </div>
      ))}
    </dl>
  );
}
