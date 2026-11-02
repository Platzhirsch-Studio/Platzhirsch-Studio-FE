"use client";
// Countdown zum Anmeldeschluss (nur wenn WINTERLAGER_CONFIG.anmeldeschluss
// gesetzt ist). Der Tag wird erst im Browser berechnet (Europe/Vienna), damit
// die statische Seite nie einen veralteten Stand zeigt. Vor der Hydrierung
// steht nichts da (kein Layout-Sprung über der Falz: Platz ist reserviert).
// Keine Live-Region: der Text ändert sich nur einmal je Tag.
import { useSyncExternalStore } from "react";
import { deadlineState, todayInLochau } from "@/lib/service/winterlager/view";
import { winterlagerCopy } from "@/lib/service/winterlager/copy";

const subscribe = () => () => {};

export default function WinterlagerCountdown({ locale = "de" }) {
  const today = useSyncExternalStore(subscribe, () => todayInLochau(), () => "");
  const state = today ? deadlineState(today, locale) : null;
  const label = winterlagerCopy(locale).countdown.label;
  return (
    <p className="mt-stack-m min-h-12 max-w-measure text-body text-text" data-testid="wl-countdown">
      {state && (
        <>
          <span className="block text-small text-text-soft">{label}</span>
          {state.text}
        </>
      )}
    </p>
  );
}
