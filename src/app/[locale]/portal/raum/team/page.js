import Link from "next/link";
import { notFound } from "next/navigation";
import { portalMetadata } from "@/lib/portal/metadata";
import { AuthPanel, Badge, Card, Notice, Overline } from "@/components/Portal/Core/ui";
import { DATUM_ZEIT, RAUM_STATUS } from "@/lib/raumzwilling/config";
import { teamAusCookie } from "@/lib/raumzwilling/access";
import { DEV_TEAM_TOKEN, teamAktiv, teamDevModus } from "@/lib/raumzwilling/team";
import { alleRaeume, leseRaum } from "@/lib/raumzwilling/store";
import { postausgang } from "@/lib/raumzwilling/notify";
import TeamAbmelden from "@/components/Portal/Raum/TeamAbmelden";

// /de/portal/raum/team – Team-Anmeldung und Übersicht aller Räume (Studio intern).

export const generateMetadata = portalMetadata({ title: "Raum-Werkzeug (Team)", robots: { index: false, follow: false } });

const FEHLER = {
  schluessel: "Der Team-Schlüssel stimmt nicht.",
  "zu-viele": "Zu viele Versuche. Bitte in 15 Minuten erneut versuchen.",
};

const feld = "min-h-11 w-full border border-pebble bg-white px-3 text-[15px] text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

export default async function TeamSeite({ params, searchParams }) {
  const { locale } = await params;
  if (locale !== "de" || !teamAktiv()) notFound();
  const sp = await searchParams;
  const team = await teamAusCookie();
  const next = typeof sp?.next === "string" ? sp.next : "";

  if (!team) {
    return (
      <AuthPanel title="Raum-Werkzeug">
        <p>Interner Bereich für das Platzhirsch-Team: Maßstab setzen, Stücke einplanen, Haralds Skizzen hochladen.</p>
        {teamDevModus() && (
          <Notice tone="dev">
            Entwicklung: Team-Schlüssel <code>{DEV_TEAM_TOKEN}</code>. In Produktion gilt nur <code>RAUM_TEAM_TOKEN</code> (mind. 24 Zeichen).
          </Notice>
        )}
        {sp?.fehler && FEHLER[sp.fehler] && <Notice tone="error">{FEHLER[sp.fehler]}</Notice>}
        <form method="post" action="/api/portal/raum/team" className="space-y-4">
          <input type="hidden" name="next" value={next} />
          <div>
            <label htmlFor="t-name" className="mb-1 block text-sm font-semibold text-ink">
              Ihr Name
            </label>
            <input id="t-name" name="name" autoComplete="name" className={feld} maxLength={60} />
          </div>
          <div>
            <label htmlFor="t-schluessel" className="mb-1 block text-sm font-semibold text-ink">
              Team-Schlüssel
            </label>
            <input id="t-schluessel" name="schluessel" type="password" required autoComplete="current-password" className={feld} />
          </div>
          <button type="submit" className="inline-flex min-h-12 w-full items-center justify-center bg-ink px-6 text-sm font-semibold text-white hover:bg-ink-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold">
            Anmelden
          </button>
        </form>
      </AuthPanel>
    );
  }

  const ids = await alleRaeume();
  const raeume = (await Promise.all(ids.map((id) => leseRaum(id)))).filter(Boolean);
  const meldungen = await postausgang();

  return (
    <>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <Overline>Raum-Werkzeug · Team</Overline>
          <h1 className="mt-2 font-display text-[2rem] leading-tight text-ink sm:text-4xl">Alle Räume</h1>
          <p className="mt-1 text-sm text-ink/75">Angemeldet als {team.name}.</p>
        </div>
        <TeamAbmelden />
      </header>
      <Card className="mb-6" aria-labelledby="t-raeume">
        <h2 id="t-raeume" className="mb-3 font-display text-xl text-ink">
          Räume
        </h2>
        {raeume.length === 0 ? (
          <p className="text-sm text-ink/80">Noch keine Räume. Ein Raum entsteht, sobald eine Kundin oder ein Kunde ein Raumvideo im Portal sendet.</p>
        ) : (
          <ul className="divide-y divide-ink/10">
            {raeume.map((r) => (
              <li key={r.projektId} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-ink">
                    {r.titel} · {r.projektId}
                  </p>
                  <p className="text-xs text-ink/70">
                    Aktualisiert {DATUM_ZEIT.format(new Date(r.aktualisiert))} · {r.platzierung?.volumen?.length || 0} Stücke · {r.kommentare?.length || 0} Kommentare · {r.skizzen?.length || 0} Skizzen
                  </p>
                  <div className="mt-1">
                    <Badge tone={RAUM_STATUS[r.status]?.tone}>{RAUM_STATUS[r.status]?.label}</Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link href={`/de/portal/raum/${r.projektId}`} className="inline-flex min-h-11 items-center border border-ink/30 px-4 text-sm text-ink hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold">
                    Ansehen
                  </Link>
                  {(r.status === "bereit" || r.splat) && (
                    <Link href={`/de/portal/raum/${r.projektId}/bearbeiten`} className="inline-flex min-h-11 items-center bg-ink px-4 text-sm font-semibold text-white hover:bg-ink-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold">
                      Bearbeiten
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Card aria-labelledby="t-post">
        <h2 id="t-post" className="mb-1 font-display text-xl text-ink">
          Postausgang
        </h2>
        <p className="mb-3 text-sm text-ink/75">Meldungen an das Team. In dieser Ausbaustufe wird nichts per E-Mail versendet.</p>
        {meldungen.length === 0 ? (
          <p className="text-sm text-ink/70">Keine Meldungen.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {meldungen.map((m, i) => (
              <li key={`${m.am}-${i}`} className="bg-bone px-3 py-2">
                <span className="text-xs text-ink/70">{DATUM_ZEIT.format(new Date(m.am))} · {m.art} · nicht versendet</span>
                <br />
                {m.text}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
