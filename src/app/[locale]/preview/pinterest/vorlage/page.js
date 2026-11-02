// /de/preview/pinterest/vorlage?pin=p01 — Pin-Vorlage 1000 × 1500 für das
// Render-Skript (Marktresearch/digital/marketing/pinterest/werkzeug/render-pins.mjs).
// Gleicher Schalter wie die Kanal-Vorschau: nur Dev bzw. FREIGABE_PREVIEW=1
// (nie VERCEL_ENV=production), sonst 404. Immer noindex,nofollow.
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { freigabePreviewEnabled, COCKPIT_ROBOTS } from "@/components/Freigaben/model";
import PinFrame from "@/components/Preview/pinterest/PinFrame";
import { pinById } from "@/components/Preview/pinterest/data";

export const metadata = { title: "Pin-Vorlage – Vorschau", robots: COCKPIT_ROBOTS };

export default async function PinVorlagePage({ params, searchParams }) {
  const { locale } = await params;
  await connection();
  if (locale !== "de" || !freigabePreviewEnabled()) notFound();
  const sp = (await searchParams) || {};
  const id = Array.isArray(sp.pin) ? sp.pin[0] : sp.pin;
  const pin = pinById(typeof id === "string" ? id : "p01");
  if (!pin) notFound();
  return (
    <div className="overflow-x-auto bg-stone p-6">
      <h1 className="sr-only">Pin-Vorlage {pin.id}</h1>
      <PinFrame pin={pin} />
    </div>
  );
}
