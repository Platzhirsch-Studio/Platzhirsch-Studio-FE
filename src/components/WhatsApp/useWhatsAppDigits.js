"use client";

// Nummer eines Einstiegs: die vom Server (WHATSAPP_NUMBER) oder – nur im
// Dev-Server ohne Nummer – die fiktive Testnummer mit ?whatsapp=test.
// useSyncExternalStore mit Server-Schnappschuss `false`: Server-HTML und
// Hydrierung stimmen überein, die Vorschau erscheint danach. Der
// Schnappschuss liest nur; gemerkt wird der Schalter im Effekt.
import { useEffect, useSyncExternalStore } from "react";
import { DEV_TEST_DIGITS, devPreviewActive, persistDevPreview } from "@/lib/whatsapp/preview";

const subscribe = () => () => {};
const serverSnapshot = () => false;

export function useWhatsAppDigits(serverDigits, devPreview) {
  const active = useSyncExternalStore(subscribe, devPreviewActive, serverSnapshot);
  useEffect(() => {
    if (devPreview && !serverDigits) persistDevPreview();
  }, [devPreview, serverDigits]);
  if (serverDigits) return { digits: serverDigits, preview: false };
  const preview = Boolean(devPreview) && active;
  return { digits: preview ? DEV_TEST_DIGITS : null, preview };
}
