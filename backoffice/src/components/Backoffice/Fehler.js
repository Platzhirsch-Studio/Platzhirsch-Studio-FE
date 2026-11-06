"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import cx from "./cx";
import { Icon } from "./icons";
import Knopf from "./Knopf";
import { standardText } from "@/lib/backoffice/frappe/errors";

// Fehler (02 §7.2, Q-E1/Q-E4) im Lounge-Stil: weiche, randlose Materialfläche (Ziegel bei Fehlern,
// Eiche bei Warnungen), Symbol im runden Kreis, Titel 15/600, ein Satz, Knöpfe als Pillen.
// Je Code ein Muster, kein Technikbegriff im Text.
// Der Code steht nur als data-fehler-code (Tests, Support), nie als „Code: unavailable“.
//   unavailable   „Erneut versuchen“; mit `autoErneut` 3 automatische Versuche (2/4/8 s)
//   forbidden     kein Wiederholen; Slot `aktion` für „Leitung bitten“ (G-05)
//   not_found     „Zur Liste“ (`zurueckHref`)
//   conflict      „Neu laden“
//   rate_limited  Countdown live (`wartezeit` in Sekunden)
//   auth          „Neu anmelden“ (`anmeldenHref`)
//   invalid       Hinweis; Feldfehler stehen am Feld
//   unbekannt     „Das hat nicht geklappt (Fehler-Nr. …)“ mit `nummer`
export const TEXTE = {
  titel: {
    unavailable: "Verbindung unterbrochen",
    forbidden: "Keine Berechtigung",
    not_found: "Nicht gefunden",
    conflict: "Inzwischen geändert",
    rate_limited: "Bitte kurz warten",
    auth: "Sitzung abgelaufen",
    invalid: "Angaben prüfen",
    unbekannt: "Das hat nicht geklappt",
  },
  erneut: "Erneut versuchen",
  versuchtErneut: "Versuche erneut …",
  neuLaden: "Neu laden",
  zurListe: "Zur Liste",
  anmelden: "Neu anmelden",
  wiederMoeglich: "Wieder möglich in",
  nummer: "Fehler-Nr.",
};

const BEKANNT = ["unavailable", "forbidden", "not_found", "conflict", "rate_limited", "auth", "invalid"];
const AUTO_SCHRITTE = [2, 4, 8];

function mmss(s) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")} Min.`;
}

/**
 * @param {object} p
 * @param {string} [p.code]      invalid|forbidden|not_found|conflict|rate_limited|unavailable|auth
 * @param {string} [p.message]   Text aus der Server-Antwort (bereits ohne Technik)
 * @param {string} [p.titel]
 * @param {()=>void} [p.onRetry] eigener Wiederholen-Weg (nur aus Client-Komponenten)
 * @param {boolean} [p.kompakt]  einzeilig in Karte/Zeile
 * @param {boolean} [p.autoErneut] unavailable: 3 automatische Versuche
 * @param {number} [p.wartezeit] rate_limited: Sekunden bis wieder möglich
 * @param {string} [p.zurueckHref] not_found: „Zur Liste“
 * @param {string} [p.anmeldenHref] auth
 * @param {string} [p.nummer]    unbekannter Fehler: Fehler-Nr.
 * @param {import("react").ReactNode} [p.aktion]  zusätzliche Aktion (z. B. „Leitung bitten“)
 */
export default function Fehler({ code = "unavailable", message, titel, onRetry, kompakt = false, autoErneut = false, wartezeit, zurueckHref, anmeldenHref = "/login", nummer, aktion, className }) {
  const router = useRouter();
  const art = BEKANNT.includes(code) ? code : "unbekannt";
  const retry = onRetry || (() => router.refresh());
  const [rest, setRest] = useState(art === "rate_limited" && wartezeit > 0 ? Math.ceil(wartezeit) : 0);
  const [versuch, setVersuch] = useState(0);
  const [wartet, setWartet] = useState(false);
  const retryRef = useRef(retry);
  useEffect(() => {
    retryRef.current = retry;
  });

  useEffect(() => {
    if (art !== "rate_limited" || rest <= 0) return undefined;
    const t = window.setTimeout(() => setRest((r) => Math.max(0, r - 1)), 1000);
    return () => window.clearTimeout(t);
  }, [art, rest]);

  useEffect(() => {
    if (!autoErneut || art !== "unavailable" || versuch >= AUTO_SCHRITTE.length) return undefined;
    const an = window.setTimeout(() => setWartet(true), 0);
    const t = window.setTimeout(() => {
      setWartet(false);
      setVersuch((v) => v + 1);
      retryRef.current();
    }, AUTO_SCHRITTE[versuch] * 1000);
    return () => {
      window.clearTimeout(an);
      window.clearTimeout(t);
    };
  }, [autoErneut, art, versuch]);

  const text =
    art === "unbekannt"
      ? message || `${TEXTE.titel.unbekannt}${nummer ? ` (${TEXTE.nummer} ${nummer})` : ""}.`
      : art === "rate_limited" && rest > 0
        ? `${message || standardText(code)} ${TEXTE.wiederMoeglich} ${mmss(rest)}`
        : message || standardText(code);
  const kopf = titel || TEXTE.titel[art];
  const istWarnung = art === "rate_limited" || art === "conflict" || art === "invalid";

  let knopf = null;
  if (art === "unavailable" || art === "unbekannt") {
    knopf = (
      <Knopf size="s" icon="RefreshCw" onClick={retry} laedt={wartet}>
        {wartet ? TEXTE.versuchtErneut : TEXTE.erneut}
      </Knopf>
    );
  } else if (art === "conflict") {
    knopf = (
      <Knopf size="s" icon="RotateCcw" onClick={retry}>
        {TEXTE.neuLaden}
      </Knopf>
    );
  } else if (art === "not_found" && zurueckHref) {
    knopf = (
      <Knopf size="s" icon="ArrowLeft" href={zurueckHref}>
        {TEXTE.zurListe}
      </Knopf>
    );
  } else if (art === "auth") {
    knopf = (
      <Knopf size="s" href={anmeldenHref}>
        {TEXTE.anmelden}
      </Knopf>
    );
  } else if (art === "rate_limited") {
    knopf = (
      <Knopf size="s" icon="RefreshCw" onClick={retry} disabled={rest > 0}>
        {TEXTE.erneut}
      </Knopf>
    );
  }

  const ton = istWarnung ? "bg-bo-warning-soft" : "bg-bo-danger-soft";
  const kreis = istWarnung ? "bg-bo-warning/15 text-bo-warning-text" : "bg-bo-danger/12 text-bo-danger-text";
  const iconName = art === "forbidden" || art === "auth" ? "Lock" : art === "unavailable" ? "CloudOff" : istWarnung ? "TriangleAlert" : "CircleX";

  return (
    <div role="alert" data-fehler-code={code} className={cx("flex items-start gap-3", kompakt ? "rounded-bo-zeile px-3 py-2.5 text-sm" : "rounded-bo-karte p-4 md:p-5", ton, className)}>
      <span aria-hidden="true" className={cx("inline-flex shrink-0 items-center justify-center rounded-pill", kompakt ? "size-7" : "size-9", kreis)}>
        <Icon name={iconName} className={kompakt ? "size-4" : "size-[18px]"} />
      </span>
      <div className={cx("min-w-0 flex-1", kompakt && "flex flex-wrap items-center gap-x-3 gap-y-1")}>
        <div className="min-w-0 flex-1">
          <p className={cx("font-semibold text-bo-text", kompakt ? "text-sm leading-7" : "text-[15px] leading-[22px] pt-1.5")}>{kopf}</p>
          <p className={cx("text-sm leading-5 text-bo-text-soft", !kompakt && "mt-0.5")}>
            {text}
          </p>
        </div>
        {(knopf || aktion) && (
          <div className={cx("flex flex-wrap items-center gap-2", !kompakt && "mt-3")}>
            {knopf}
            {aktion}
          </div>
        )}
      </div>
    </div>
  );
}
