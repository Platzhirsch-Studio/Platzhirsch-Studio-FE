import { createHash } from "node:crypto";
import { BEREICHE, navigationFuer } from "@/lib/backoffice/bereiche/index";
import { backofficeMode, frappeUrl } from "@/lib/backoffice/config";
import { backoffice } from "@/lib/backoffice/frappe";
import { darf } from "@/lib/backoffice/auth/rechte";
import { ARBEITSPLAETZE } from "@/lib/backoffice/arbeitsplaetze";
import { gZiele } from "@/lib/backoffice/kuerzel/index";
import { SCHNELLAKTIONEN } from "@/lib/backoffice/suche/register";
import { ladeGlocke } from "@/lib/backoffice/benachrichtigungen";
import { ladeFreigaben } from "@/lib/backoffice/freigaben/index";
import KuerzelWurzel from "../Kuerzel/KuerzelWurzel";
import { ToastProvider } from "../Toast";
import { SeitenUebergang } from "../motion";
import { KundenmodusProvider } from "../Kundenmodus/Kontext";
import Leiste from "./Leiste";
import Kopfzeile from "./Kopfzeile";
import Befehlspalette from "./Befehlspalette";
import Testband from "./Testband";
import SitzungsHinweis from "./SitzungsHinweis";
import { ShellProvider } from "./ShellKontext";
import { ThemaSkripte } from "./Thema";
import NurBediener from "./NurBediener";
import { TEXTE } from "./texte";
import "./shell.css";

/**
 * Backoffice-Hülle v2 im Lounge-Stil (Server Component, G-26):
 *   schwebende Icon-Leiste links (Bereiche nach Rechten, aktiv = Tinte-Kreis, Benutzermenü unten),
 *   durchscheinende Kopfzeile (Wortmarke · Pillen-Reiter der Unterbereiche · Slot · Suche · Glocke · Neu · Hilfe),
 *   Testband im Fluss, Befehlspalette v2, Glocke v2 + Freigaben (SSE /api/ereignisse), Kundenmodus,
 *   Sitzungs-Hinweis, Kürzel-Wurzel. Jede Seite rendert <Shell session={session}>…</Shell>.
 *
 * @param {{session:object, breit?:boolean, kopfSlot?:React.ReactNode, children:React.ReactNode}} props
 *   `kopfSlot`: Inhalt rechts in der Kopfzeile vor den runden Knöpfen (Stempelpille, KundenmodusKnopf).
 */
export default async function Shell({ session, children, breit = false, kopfSlot = null }) {
  const erlaubt = (r) => darf(session, r.bereich, r.aktion);
  const bereiche = BEREICHE.filter((b) => session.bereiche.includes(b.slug))
    .map((b) => ({ slug: b.slug, titel: b.titel, icon: b.icon, startseite: b.startseite, navigation: navigationFuer(b, { erlaubt }).map((n) => ({ titel: n.titel, href: n.href })) }))
    .filter((b) => b.navigation.length > 0); // G-01: Bereich ohne Navigation erscheint nicht

  let glocke = { anzahl: 0, tabs: { "fuer-mich": [], team: [], system: [] }, stand: "0" };
  try {
    const client = backoffice(session);
    const freigaben = await ladeFreigaben(session, client);
    glocke = await ladeGlocke(client, session, { freigaben });
  } catch {
    // Glocke ist Komfort, nie Blocker.
  }

  const neu = SCHNELLAKTIONEN.filter((a) => /^Neue?r?s?\s/.test(a.titel) && darf(session, a.bereich, a.aktion)).map((a) => ({ titel: a.titel, href: a.href, bereich: a.bereich }));
  const arbeitsplaetze = ARBEITSPLAETZE.filter((a) => session.arbeitsplaetze.includes(a.slug)).map((a) => ({ slug: a.slug, titel: a.titel, icon: a.icon, ziffer: a.ziffer }));
  const benutzer = { name: session.name, user: session.user, roles: session.roles, arbeitsplaetze, arbeitsplatz: session.arbeitsplatz };
  const benutzerHash = createHash("sha256").update(String(session.user || "")).digest("hex").slice(0, 12);

  const modus = backofficeMode();
  let host = "";
  try {
    host = modus === "frappe" ? new URL(frappeUrl()).host : "";
  } catch {
    host = "";
  }
  const aufgabenHref = session.bereiche.includes("zentrale") ? "/d/ph-aufgabe" : null;

  return (
    <ToastProvider>
      <ShellProvider wert={{ benutzerHash, modus }}>
        <KundenmodusProvider>
          <ThemaSkripte />
          <div className="bo-schale" data-breit={breit ? "true" : undefined} data-entwicklung={process.env.NODE_ENV === "development" ? "true" : undefined}>
            <a href="#bo-inhalt" className="bo-schale-sprung">
              {TEXTE.zumInhalt}
            </a>
            <Leiste bereiche={bereiche} benutzer={benutzer} />
            <div className="bo-schale-spalte">
              <Kopfzeile bereiche={bereiche} glocke={glocke} neu={neu} slot={kopfSlot} aufgabenHref={aufgabenHref} />
              <main id="bo-inhalt" tabIndex={-1} className="bo-schale-inhalt">
                <Testband modus={modus} host={host} />
                <SeitenUebergang>{children}</SeitenUebergang>
              </main>
            </div>
          </div>
          <NurBediener>
            <Befehlspalette />
            <KuerzelWurzel ziele={gZiele(session)} />
          </NurBediener>
          <SitzungsHinweis laeuftAb={session.expiresAt ? session.expiresAt * 1000 : null} />
        </KundenmodusProvider>
      </ShellProvider>
    </ToastProvider>
  );
}

