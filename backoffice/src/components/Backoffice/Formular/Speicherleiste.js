"use client";
import cx from "../cx";
import Knopf from "../Knopf";
import { Icon } from "../icons";
import { speicherAnzeige } from "./autosave";
import { SPEICHERN } from "./texte";
import "./formular.css";

// Speicherleiste und Speicheranzeige (MASTER G-09, Q-D1; Lounge §6 Material, §9; Team P0-5b).
//
// `Speicherleiste`: liegt in der Inhaltsspalte am Ende des Formulars (nie über der Leiste). Sobald es
// etwas zu speichern gibt, haftet sie unten als schwebende Material-Kapsel (blur 32, Lichtkante,
// Float-Schatten) und belegt Platz im Fluss – das letzte Feld bleibt frei. Inhalt: Punkt + „Ungespeichert“
// · Verwerfen · Speichern (Tinte, eine Hauptaktion). Ohne Änderungen ruht sie flach mit „Keine Änderungen“.
// `SpeicherAnzeige`: Kopfanzeige des Autosave („Gespeichert 14:05“ / „Nicht gespeichert“ in Eiche).

/**
 * @param {object} p
 * @param {boolean} p.zuSpeichern          etwas zu speichern (neu oder geändert) → haftet unten, Speichern aktiv
 * @param {boolean} [p.geaendert]          Änderungen vorhanden (zeigt „Ungespeichert“ + Verwerfen)
 * @param {boolean} [p.laedt]              Speichern läuft
 * @param {boolean} [p.neu]                Neuanlage („Anlegen“, „Abbrechen“)
 * @param {() => void} [p.onSpeichern]     ohne: Knopf ist type=submit (im <form>)
 * @param {() => void} [p.onVerwerfen]     ohne: kein Verwerfen-Knopf
 * @param {string} [p.abbrechenHref]       Link „Zur Liste“ / „Abbrechen“
 * @param {string} [p.stand]               „Stand 04.11.2026 14:05“ rechts
 * @param {object} [p.autosave]            Rückgabe von useAutosave → Anzeige statt „Ungespeichert“
 * @param {string} [p.speichernText]
 */
export default function Speicherleiste({ zuSpeichern, geaendert = false, laedt = false, neu = false, onSpeichern, onVerwerfen, abbrechenHref, stand, autosave, speichernText, className, testid = "speicherleiste" }) {
  const anzeige = autosave ? speicherAnzeige(autosave, SPEICHERN) : null;
  return (
    <div className={cx("bo-speicherleiste", zuSpeichern && "is-haftend", className)} data-testid={testid} data-haftend={zuSpeichern ? "true" : "false"}>
      <span className="flex min-w-0 items-center gap-2 text-[13px] leading-[18px]" aria-live="polite">
        {anzeige ? (
          <SpeicherAnzeige autosave={autosave} />
        ) : geaendert ? (
          <>
            <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-bo-eiche" />
            <span className="font-medium text-bo-text">{SPEICHERN.ungespeichert}</span>
          </>
        ) : !neu ? (
          <span id="bo-keine-aenderungen" className="text-bo-text-soft">
            {SPEICHERN.keineAenderungen}
          </span>
        ) : null}
        {stand && <span className="hidden truncate text-bo-text-faint md:inline">· {SPEICHERN.stand(stand)}</span>}
      </span>
      <span className="ml-auto flex min-w-0 flex-wrap items-center justify-end gap-2">
        {zuSpeichern && (
          <kbd className="hidden h-6 items-center rounded-[6px] bg-bo-fill-2 px-2 font-sans text-[11px] text-bo-text-soft lg:inline-flex" aria-hidden="true">
            {SPEICHERN.kuerzel}
          </kbd>
        )}
        {abbrechenHref && (
          <Knopf href={abbrechenHref} variant="ghost">
            {neu ? SPEICHERN.abbrechen : SPEICHERN.zurListe}
          </Knopf>
        )}
        {onVerwerfen && geaendert && !neu && (
          <Knopf variant="secondary" onClick={onVerwerfen} disabled={laedt} data-testid="verwerfen">
            {SPEICHERN.verwerfen}
          </Knopf>
        )}
        <Knopf
          type={onSpeichern ? "button" : "submit"}
          onClick={onSpeichern}
          variant="primary"
          icon={laedt ? undefined : "Check"}
          disabled={laedt || !zuSpeichern}
          laedt={laedt}
          kuerzel="Strg+S"
          data-testid="speichern"
          aria-describedby={!zuSpeichern && !neu ? "bo-keine-aenderungen" : undefined}
        >
          {laedt ? SPEICHERN.speichert : speichernText || (neu ? SPEICHERN.anlegen : SPEICHERN.speichern)}
        </Knopf>
      </span>
    </div>
  );
}

/**
 * Kleine Speicheranzeige für Autosave-Seiten (Kopf oder Leiste): Punkt + Text, Fehler mit „Erneut“.
 * @param {{autosave:{status:string, zeit:string|null, fehler:string|null, jetzt?:()=>void}, className?:string}} p
 */
export function SpeicherAnzeige({ autosave, className }) {
  const a = speicherAnzeige(autosave, SPEICHERN);
  return (
    <span className={cx("inline-flex min-w-0 items-center gap-2 text-[13px] leading-[18px]", className)} data-status={autosave?.status} data-testid="speicher-anzeige" aria-live="polite">
      {a.ton === "ruhig" && autosave?.status === "speichert" ? (
        <span aria-hidden="true" className="bo-spinner size-3!" />
      ) : a.ton === "ruhig" ? (
        <Icon name="Check" className="size-3.5 shrink-0 text-bo-salbei" />
      ) : (
        <span aria-hidden="true" className={cx("size-2 shrink-0 rounded-full", a.ton === "fehler" ? "bg-bo-ziegel" : "bg-bo-eiche")} />
      )}
      <span className={cx("truncate", a.ton === "warnung" ? "font-medium text-bo-warning-text" : a.ton === "fehler" ? "font-medium text-bo-danger-text" : "text-bo-text-soft")}>{a.text}</span>
      {a.ton === "fehler" && autosave?.jetzt && (
        <button type="button" onClick={() => autosave.jetzt()} className="rounded-sm font-medium text-bo-text underline decoration-bo-line-strong underline-offset-[3px] hover:decoration-current">
          {SPEICHERN.erneut}
        </button>
      )}
    </span>
  );
}
