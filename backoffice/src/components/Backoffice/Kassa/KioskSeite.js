// Kassa – gemeinsame Teile der Kiosk-Unterseiten (Team B-KAS): Fehlerbild ohne Kasse/ohne Verbindung und
// das Skelett in exakter Kachelform (Lounge §9.8: gleiche Radien, Fläche surface-2, Schimmer, bei reduzierter
// Bewegung statisch). Server-tauglich (keine Hooks); die KioskShell ist eine Client-Komponente.

import KioskShell from "../Kiosk/KioskShell";
import Fehler from "../Fehler";
import { KIOSK } from "@/lib/backoffice/kassa/texte";
import "./kassa.css";

export function KassaFehler({ session, geraet, code, message }) {
  const ohneKasse = code === "ohne-kasse";
  return (
    <KioskShell titel={KIOSK.titel} geraet={geraet} benutzer={{ name: session.name }} zurueckHref="/arbeitsplatz">
      <div className="bo-ka" style={{ maxWidth: 640, margin: "48px auto" }} data-testid="kassa-fehler">
        <Fehler code={ohneKasse ? "not_found" : code} titel={ohneKasse ? KIOSK.fehler.ohneKasse : undefined} message={ohneKasse ? KIOSK.fehler.ohneKasseText : message} zurueckHref="/arbeitsplatz" />
      </div>
    </KioskShell>
  );
}

const sk = { background: "var(--color-bo-skeleton)", borderRadius: 20 };

export function KassaSkelett() {
  return (
    <div className="bo-ka" style={{ height: "100dvh", padding: 12, display: "flex", flexDirection: "column", gap: 16 }} aria-busy="true" aria-label="Kassa wird geladen">
      <div className="bo-skeleton" style={{ ...sk, height: 64, borderRadius: 999 }} />
      <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "minmax(0,1fr) 388px", gap: 16, padding: "4px 0 0 4px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="bo-skeleton" style={{ ...sk, height: 48, borderRadius: 999 }} />
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            {Array.from({ length: 7 }, (_, i) => (
              <div key={i} className="bo-skeleton" style={{ ...sk, width: 60, height: 60, borderRadius: 999 }} />
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 12 }}>
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="bo-skeleton" style={{ ...sk, height: 248, borderRadius: 24 }} />
            ))}
          </div>
        </div>
        <div className="bo-skeleton" style={{ ...sk, borderRadius: 28 }} />
      </div>
    </div>
  );
}
