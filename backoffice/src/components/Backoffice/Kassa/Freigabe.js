"use client";
// Kassa – „Freigabe am Ende“ (Team B-KAS, Konzept §3.11, E4): Die Mitarbeiterin hat den Fachdialog gefüllt;
// die Leitung tippt ihre Kachel und die PIN im selben Sheet. Der Server prüft die PIN beim Buchen
// (ph_kassa `freigabe = {email, pin, geraet_token}`); Fehlversuche zählt der Server. 60-s-Fenster.

import { useEffect, useState } from "react";
import { Delete, Lock } from "lucide-react";
import Avatar from "../Avatar";
import Sheet from "./Sheet";
import { KIOSK } from "@/lib/backoffice/kassa/texte";

const S = { size: 20, strokeWidth: 1.75, "aria-hidden": true };

/**
 * @param {object} p
 * @param {boolean} p.offen
 * @param {string[]} p.gruende   Texte der nötigen Freigaben
 * @param {string} [p.zusammenfassung] „Storno Beleg 52 · 129,60 €“
 * @param {Array<{email:string, name:string}>} p.leitung
 * @param {(f:{email:string, pin:string}) => Promise<{ok:boolean, message?:string}>} p.onFreigabe
 * @param {() => void} p.onAbbrechen
 */
export default function Freigabe({ offen, gruende = [], zusammenfassung, leitung = [], onFreigabe, onAbbrechen }) {
  const [wer, setWer] = useState(leitung.length === 1 ? leitung[0].email : null);
  const [pin, setPin] = useState("");
  const [fehler, setFehler] = useState("");
  const [laeuft, setLaeuft] = useState(false);
  const [rest, setRest] = useState(60);

  useEffect(() => {
    if (!offen) return;
    const t = setInterval(() => setRest((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(t);
  }, [offen]);
  useEffect(() => {
    if (offen && rest === 0) onAbbrechen?.();
  }, [rest, offen, onAbbrechen]);

  const taste = (z) => {
    setFehler("");
    setPin((p) => (z === "⌫" ? p.slice(0, -1) : p.length < 6 ? p + z : p));
  };
  useEffect(() => {
    if (!offen) return;
    const h = (e) => {
      if (/^\d$/.test(e.key)) {
        e.preventDefault();
        taste(e.key);
      } else if (e.key === "Backspace") {
        e.preventDefault();
        taste("⌫");
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [offen]);

  const los = async () => {
    if (!wer || pin.length < 4 || laeuft) return;
    setLaeuft(true);
    const r = await onFreigabe({ email: wer, pin });
    setLaeuft(false);
    if (!r?.ok) {
      setFehler(r?.message || KIOSK.freigabe.falsch());
      setPin("");
    }
  };

  return (
    <Sheet offen={offen} onSchliessen={onAbbrechen} titel={KIOSK.freigabe.titel} breit sperren={laeuft} testid="kassa-freigabe">
      {zusammenfassung && <p className="bo-ka-sheet__text">{zusammenfassung}</p>}
      {gruende.length > 0 && (
        <div className="bo-ka-hinweis" data-ton="warnung">
          <Lock {...S} />
          <span>
            {KIOSK.freigabe.gruende} {gruende.join(" · ")}
          </span>
        </div>
      )}
      {leitung.length === 0 ? (
        <p className="bo-ka-hinweis">{KIOSK.freigabe.keineLeitung}</p>
      ) : (
        <>
          <p className="bo-ka-label" style={{ marginTop: 8 }}>
            {KIOSK.freigabe.wer}
          </p>
          <div className="bo-ka-personen" role="radiogroup" aria-label={KIOSK.freigabe.wer}>
            {leitung.map((l) => (
              <button key={l.email} type="button" role="radio" aria-checked={wer === l.email} className="bo-ka-person bo-ka-druck" onClick={() => setWer(l.email)} data-testid="freigabe-person">
                <Avatar name={l.name} groesse={40} ring={false} dekorativ />
                {l.name}
              </button>
            ))}
          </div>
          <p className="bo-ka-label" style={{ marginTop: 8 }} id="freigabe-pin">
            {KIOSK.freigabe.pin}
          </p>
          <div className="bo-ka-pinpunkte" data-fehler={fehler ? "true" : undefined} aria-labelledby="freigabe-pin" role="img" aria-label={`${pin.length} Ziffern`}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <i key={i} data-voll={i < pin.length ? "true" : undefined} />
            ))}
          </div>
          {fehler && (
            <p className="bo-ka-hinweis" data-ton="gefahr" role="alert">
              {fehler}
            </p>
          )}
          <div className="bo-ka-tasten" data-testid="freigabe-tasten">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"].map((z, i) =>
              z ? (
                <button key={z} type="button" onClick={() => taste(z)} aria-label={z === "⌫" ? "Ziffer löschen" : z}>
                  {z === "⌫" ? <Delete {...S} /> : z}
                </button>
              ) : (
                <span key={`l${i}`} />
              )
            )}
          </div>
          <p className="bo-ka-grund" style={{ textAlign: "center" }}>
            {KIOSK.freigabe.zeit} · {rest} s
          </p>
          <div className="bo-ka-reihe">
            <button type="button" className="bo-ka-zweit" onClick={onAbbrechen} disabled={laeuft}>
              {KIOSK.abbrechen}
            </button>
            <button type="button" className="bo-ka-primaer" disabled={!wer || pin.length < 4 || laeuft} onClick={los} data-testid="freigabe-ok">
              <Lock {...S} />
              {KIOSK.freigabe.ok}
            </button>
          </div>
        </>
      )}
    </Sheet>
  );
}
