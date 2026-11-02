// src/components/Preview/pinterest/PinFrame.js — Pin-Vorlage 1000 × 1500 (2:3).
// Wird nur auf /de/preview/pinterest/vorlage gerendert und dort vom
// Render-Skript (Marktresearch/digital/marketing/pinterest/werkzeug/render-pins.mjs)
// als Bild abfotografiert. Typo nach Design-Bibel: Bodoni ab 32 px für den
// Titel, Instrument Sans für Overline/Fußzeile, Overline als einzige
// Versalien, Messing nur auf Dunkel, Text nie direkt auf dem Bild (Band oder
// ink-deep-Verlauf, §4.5). Server Component.
import { Monogram, Wordmark } from "@/components/Brand";
import { pinBasis } from "./data";

const W = 1000;
const H = 1500;
const BAND = 372;

function Footer({ pin, dark }) {
  const soft = dark ? "var(--color-stone-deep)" : "var(--color-ink-soft)";
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, color: dark ? "var(--color-paper)" : "var(--color-ink)" }}>
        <Monogram size={44} tone={dark ? "paper" : "ink"} decorative />
        <Wordmark className="h-[24px] w-auto" tone={dark ? "paper" : "ink"} decorative />
      </div>
      <span style={{ fontSize: 20, color: soft, letterSpacing: "0.01em", whiteSpace: "nowrap" }}>
        {pin.layout === "slot" ? "Material folgt" : `Bild: ${pin.credit}`}
      </span>
    </div>
  );
}

function Text({ pin, dark }) {
  return (
    <>
      <p
        style={{
          margin: 0,
          fontSize: 22,
          fontWeight: 500,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: dark ? "var(--color-brass-400)" : "var(--color-brass-700)",
        }}
      >
        {pin.overline}
      </p>
      <p
        style={{
          margin: "18px 0 0",
          fontFamily: "var(--font-display)",
          fontSize: 68,
          lineHeight: 1.06,
          fontWeight: 400,
          letterSpacing: "-0.005em",
          textWrap: "balance",
          color: dark ? "var(--color-paper)" : "var(--color-ink)",
        }}
      >
        {pin.titel}
      </p>
    </>
  );
}

export default function PinFrame({ pin }) {
  const base = { width: W, height: H, position: "relative", overflow: "hidden", fontFamily: "var(--font-sans)" };

  if (pin.layout === "slot") {
    return (
      <div data-pin-frame={pin.id} style={{ ...base, background: "var(--color-linen)" }}>
        <div
          style={{
            position: "absolute",
            inset: "64px 64px 420px",
            border: "3px dashed var(--color-pebble)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
            padding: 48,
            color: "var(--color-ink)",
          }}
        >
          <span style={{ fontFamily: "var(--font-display)", fontSize: 220, lineHeight: 1, color: "var(--color-ink-soft)" }}>{pin.schritt}</span>
          <span style={{ marginTop: 32, fontSize: 34, fontWeight: 500 }}>Bild folgt</span>
          <span style={{ marginTop: 12, fontSize: 26, color: "var(--color-ink-soft)", maxWidth: 640 }}>{pin.slot}</span>
          <span style={{ marginTop: 12, fontSize: 22, color: "var(--color-ink-soft)" }}>Haralds echtes Material · Lieferung 30.10.2026</span>
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: BAND + 20, padding: "48px 64px 44px", background: "var(--color-paper)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <Text pin={pin} />
          </div>
          <Footer pin={pin} />
        </div>
      </div>
    );
  }

  // eslint-disable-next-line @next/next/no-img-element -- Vorlage für den Screenshot, kein Seiteninhalt
  const img = <img src={pinBasis(pin)} alt="" width={W} height={H} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />;

  if (pin.layout === "voll") {
    return (
      <div data-pin-frame={pin.id} style={{ ...base, background: "var(--color-ink-deep)" }}>
        {img}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 760,
            background: "linear-gradient(to bottom, rgb(31 37 43 / 0) 0%, rgb(31 37 43 / 0.55) 45%, rgb(31 37 43 / 0.82) 100%)",
          }}
        />
        <div style={{ position: "absolute", left: 64, right: 64, bottom: 48, display: "flex", flexDirection: "column", gap: 56 }}>
          <div>
            <Text pin={pin} dark />
          </div>
          <Footer pin={pin} dark />
        </div>
      </div>
    );
  }

  // band (Standard)
  return (
    <div data-pin-frame={pin.id} style={{ ...base, background: "var(--color-paper)" }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: H - BAND, overflow: "hidden" }}>{img}</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: H - BAND, height: 1, background: "var(--color-line-strong)" }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: BAND, padding: "44px 64px 40px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div>
          <Text pin={pin} />
        </div>
        <Footer pin={pin} />
      </div>
    </div>
  );
}
