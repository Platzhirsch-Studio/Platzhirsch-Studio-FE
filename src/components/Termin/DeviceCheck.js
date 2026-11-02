"use client";
// Kamera-/Mikrofon-Prüfung im Test-Videoraum. Läuft nur lokal (getUserMedia),
// startet erst auf Knopfdruck, überträgt und speichert nichts und beendet alle
// Spuren beim Schließen oder Verlassen der Seite.
// Permissions-Policy: next.config.js sperrt camera/microphone global. Solange
// es für /:locale/termin/testraum keine Ausnahme gibt (Phase Nachbessern),
// blendet sich die Prüfung aus, statt einen Fehler zu zeigen.
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Button from "@/components/ui/Button";

const noop = () => () => {};
function mediaAllowed() {
  const policy = document.permissionsPolicy || document.featurePolicy;
  const ok = (f) => (typeof policy?.allowsFeature === "function" ? policy.allowsFeature(f) : true);
  return Boolean(navigator.mediaDevices?.getUserMedia) && ok("camera") && ok("microphone");
}

export default function DeviceCheck({ copy }) {
  const t = copy.testraum;
  const video = useRef(null);
  const stream = useRef(null);
  const [state, setState] = useState("idle"); // idle | on | fail
  const allowed = useSyncExternalStore(noop, mediaAllowed, () => false);

  const stop = () => {
    stream.current?.getTracks().forEach((tr) => tr.stop());
    stream.current = null;
    setState("idle");
  };

  useEffect(() => () => stream.current?.getTracks().forEach((tr) => tr.stop()), []);

  async function start() {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      stream.current = s;
      if (video.current) video.current.srcObject = s;
      setState("on");
    } catch {
      setState("fail");
    }
  }

  if (!allowed) return null;
  return (
    <div className="mt-10 border-t border-line pt-6">
      <p id="device-check-note" className="max-w-measure text-small text-text-soft">
        {t.checkNote}
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        {state !== "on" ? (
          <Button type="button" variant="secondary" onClick={start} aria-describedby="device-check-note">
            {t.check}
          </Button>
        ) : (
          <Button type="button" variant="secondary" onClick={stop}>
            {t.checkStop}
          </Button>
        )}
      </div>
      <p role="status" className="mt-3 text-small text-text">
        {state === "on" ? t.checkOk : state === "fail" ? t.checkFail : ""}
      </p>
      <video ref={video} autoPlay playsInline muted aria-label={t.preview} className={state === "on" ? "mt-4 aspect-video w-full max-w-md bg-ink object-cover" : "hidden"} />
    </div>
  );
}
