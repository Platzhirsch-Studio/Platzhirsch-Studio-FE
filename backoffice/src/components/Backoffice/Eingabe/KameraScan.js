"use client";
// G-22 KameraScan (Team P0-6): Codes mit der iPad-/Telefon-Kamera lesen. Rückkamera, Rahmen mit
// abgedunkeltem Umfeld, Taschenlampe (wo das Gerät sie anbietet), Leser über die eingebaute
// BarcodeDetector-Schnittstelle des Browsers (EAN, Code 128/39, ITF, QR, Data Matrix). Fehlt die Erlaubnis,
// die Kamera oder der Leser, steht ein ehrlicher Satz da („Kamera nicht erlaubt – Nummer eintippen“) und das
// Eingabefeld ist sofort fokussiert – nie eine Sackgasse. Nach dem Lesen: kurzes Vibrieren, Rahmen salbei,
// onScan, Dialog schließt.

import { useEffect, useRef, useState } from "react";
import { Flashlight, FlashlightOff } from "lucide-react";
import { erkenneCode } from "@/lib/backoffice/codes";
import Knopf from "../Knopf";
import Dialog from "../Overlay/Dialog";
import { TEXTE } from "./texte";
import "./eingabe.css";

const T = TEXTE.kamera;
const FORMATE = ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39", "itf", "qr_code", "data_matrix"];

/**
 * @param {object} p
 * @param {boolean} p.offen
 * @param {() => void} p.onSchliessen
 * @param {(code:string, erkannt:object) => void} p.onScan
 * @param {string} [p.titel]
 * @param {boolean} [p.abholcode]
 * @param {string[]} [p.formate]
 */
export default function KameraScan({ offen, onSchliessen, onScan, titel = T.titel, abholcode = false, formate = FORMATE }) {
  return (
    <Dialog offen={offen} onSchliessen={onSchliessen} titel={titel} groesse="md" testid="kamera-scan">
      {offen && <KameraInhalt onScan={onScan} onSchliessen={onSchliessen} abholcode={abholcode} formate={formate} />}
    </Dialog>
  );
}

function KameraInhalt({ onScan, onSchliessen, abholcode, formate }) {
  const video = useRef(null);
  const eingabe = useRef(null);
  const strom = useRef(null);
  const [zustand, setZustand] = useState("startet"); // startet | laeuft | nichtErlaubt | keineKamera | keinLeser
  const [licht, setLicht] = useState({ moeglich: false, an: false });
  const [gelesen, setGelesen] = useState(false);
  const [text, setText] = useState("");
  const fertig = useRef(false);

  const melde = (code) => {
    if (fertig.current || !code) return;
    fertig.current = true;
    setGelesen(true);
    try {
      navigator.vibrate?.(30);
    } catch {
      // ohne Vibration
    }
    onScan?.(code, erkenneCode(code, { abholcode }));
    setTimeout(onSchliessen, 260);
  };
  const meldeRef = useRef(melde);
  useEffect(() => {
    meldeRef.current = melde;
  });

  useEffect(() => {
    let aus = false;
    let timer = null;
    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setZustand("keineKamera");
        return;
      }
      let s;
      try {
        s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
      } catch (err) {
        if (!aus) setZustand(err?.name === "NotAllowedError" || err?.name === "SecurityError" ? "nichtErlaubt" : "keineKamera");
        return;
      }
      if (aus) {
        s.getTracks().forEach((t) => t.stop());
        return;
      }
      strom.current = s;
      const spur = s.getVideoTracks()[0];
      const faehig = spur?.getCapabilities?.() || {};
      setLicht({ moeglich: !!faehig.torch, an: false });
      if (video.current) {
        video.current.srcObject = s;
        await video.current.play().catch(() => {});
      }
      if (typeof window.BarcodeDetector !== "function") {
        setZustand("keinLeser");
        return;
      }
      let leser;
      try {
        const vorhanden = (await window.BarcodeDetector.getSupportedFormats?.()) || formate;
        leser = new window.BarcodeDetector({ formats: formate.filter((f) => vorhanden.includes(f)) });
      } catch {
        setZustand("keinLeser");
        return;
      }
      setZustand("laeuft");
      const runde = async () => {
        if (aus || fertig.current) return;
        try {
          if (video.current?.readyState >= 2) {
            const treffer = await leser.detect(video.current);
            const code = treffer?.[0]?.rawValue?.trim();
            if (code) {
              meldeRef.current(code);
              return;
            }
          }
        } catch {
          // einzelner Fehlversuch – weiter
        }
        timer = setTimeout(runde, 180);
      };
      runde();
    })();
    return () => {
      aus = true;
      clearTimeout(timer);
      strom.current?.getTracks().forEach((t) => t.stop());
      strom.current = null;
    };
  }, [formate]);

  // Ohne Kamera/Leser sofort ins Eingabefeld.
  useEffect(() => {
    if (zustand !== "startet" && zustand !== "laeuft") eingabe.current?.focus();
  }, [zustand]);

  const lichtUmschalten = async () => {
    const spur = strom.current?.getVideoTracks()[0];
    if (!spur) return;
    try {
      await spur.applyConstraints({ advanced: [{ torch: !licht.an }] });
      setLicht((l) => ({ ...l, an: !l.an }));
    } catch {
      setLicht({ moeglich: false, an: false });
    }
  };

  const meldung = { nichtErlaubt: T.nichtErlaubt, keineKamera: T.keineKamera, keinLeser: T.keinLeser }[zustand];

  return (
    <div className="grid gap-4">
      <div className="bo-ein-kamera" data-gelesen={gelesen ? "true" : "false"}>
        {zustand !== "nichtErlaubt" && zustand !== "keineKamera" && <video ref={video} playsInline muted aria-hidden="true" />}
        {(zustand === "laeuft" || zustand === "startet") && <span className="bo-ein-kamera__rahmen" aria-hidden="true" />}
        {licht.moeglich && (
          <div className="bo-ein-kamera__werkzeuge">
            <button type="button" className="bo-rund bo-ziel bo-tip" aria-pressed={licht.an} aria-label={licht.an ? T.lichtAus : T.licht} data-tip={licht.an ? T.lichtAus : T.licht} onClick={lichtUmschalten}>
              {licht.an ? <FlashlightOff aria-hidden="true" className="size-5" strokeWidth={1.75} /> : <Flashlight aria-hidden="true" className="size-5" strokeWidth={1.75} />}
            </button>
          </div>
        )}
        {zustand === "laeuft" && <span className="bo-ein-kamera__hinweis bo-material">{gelesen ? TEXTE.scan.erkannt : T.hinweis}</span>}
        {zustand === "startet" && <span className="bo-ein-kamera__hinweis bo-material">{T.startet}</span>}
        {meldung && (
          <p className="bo-ein-kamera__leer" role="status" data-testid="kamera-meldung">
            {meldung}
          </p>
        )}
      </div>
      <form
        className="flex items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          melde(text.trim());
        }}
      >
        <label className="grid min-w-0 flex-1 gap-1.5 text-[13px] font-medium text-bo-text-soft">
          {T.eintippen}
          <input ref={eingabe} className="bo-input" inputMode="text" autoComplete="off" spellCheck={false} data-scan="ja" value={text} onChange={(e) => setText(e.target.value)} />
        </label>
        <Knopf type="submit" variant="primary" size="l" disabled={!text.trim()}>
          {T.uebernehmen}
        </Knopf>
      </form>
    </div>
  );
}
