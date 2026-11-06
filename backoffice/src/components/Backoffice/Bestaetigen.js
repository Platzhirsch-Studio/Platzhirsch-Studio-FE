"use client";
import Knopf from "./Knopf";
import { Icon } from "./icons";
import Dialog, { Fakten } from "./Overlay/Dialog";
import { TEXTE } from "./Overlay/texte";

/**
 * Bestätigungsdialog (G-06, Team P0-4) im Lounge-Stil: zentriert wie ein iOS-Hinweis, Titel als Frage,
 * darunter Fakten, Fuß [Abbrechen] [Primär] gleich breit. Rote Aktion → Fokus auf „Abbrechen“.
 * Während `laeuft` wirken Esc, Scrim und Ziehen nicht. Unter 640 px Bottom-Sheet mit Griff.
 * API wie bisher; neu: `fakten`, `groesse`, `symbol`, `children`.
 *
 * @param {object} p
 * @param {boolean} p.offen
 * @param {string} p.titel                 als Frage formulieren („AN-2026-0012 stornieren?“)
 * @param {import("react").ReactNode} [p.text]
 * @param {Array<{label: import("react").ReactNode, wert: import("react").ReactNode}>} [p.fakten]
 * @param {string} [p.bestaetigen]         Verb („Stornieren“); Standard „Ja, ausführen“
 * @param {string} [p.abbrechen]
 * @param {boolean} [p.gefaehrlich]        Ziegel-Knopf, Fokus auf Abbrechen, Symbol Warnung
 * @param {boolean} [p.laeuft]             Vorgang läuft: Knöpfe gesperrt, Spinner, Esc wirkungslos
 * @param {"sm"|"md"|"lg"} [p.groesse]
 * @param {string|false} [p.symbol]        Icon-Name über dem Titel; false = keins (Standard: nur bei gefaehrlich)
 * @param {() => void} p.onBestaetigen
 * @param {() => void} p.onAbbrechen
 */
export default function Bestaetigen({ offen, titel, text, fakten, bestaetigen = "Ja, ausführen", abbrechen = TEXTE.abbrechen, gefaehrlich = false, laeuft = false, groesse = "sm", symbol, onBestaetigen, onAbbrechen, testid, children }) {
  const icon = symbol === false ? null : symbol || (gefaehrlich ? "TriangleAlert" : null);
  return (
    <Dialog
      offen={offen}
      onSchliessen={() => onAbbrechen?.()}
      titel={titel}
      text={text}
      groesse={groesse}
      art="bestaetigen"
      rolle="alertdialog"
      sperren={laeuft}
      testid={testid}
      kopf={
        icon ? (
          <span className="bo-ov-symbol" data-ton={gefaehrlich ? "gefahr" : undefined} aria-hidden="true">
            <Icon name={icon} className="size-6" />
          </span>
        ) : null
      }
      fuss={
        <>
          <Knopf size="l" onClick={onAbbrechen} disabled={laeuft} autoFocus={gefaehrlich} data-testid="bestaetigen-abbrechen">
            {abbrechen}
          </Knopf>
          <Knopf size="l" variant={gefaehrlich ? "danger-solid" : "primary"} onClick={onBestaetigen} disabled={laeuft} laedt={laeuft} autoFocus={!gefaehrlich} data-testid="bestaetigen-ja">
            {laeuft ? TEXTE.bitteWarten : bestaetigen}
          </Knopf>
        </>
      }
    >
      {fakten?.length || children ? (
        <>
          <Fakten eintraege={fakten || []} />
          {children}
        </>
      ) : null}
    </Dialog>
  );
}
