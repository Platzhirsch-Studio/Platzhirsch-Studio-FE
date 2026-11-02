import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { portalMetadata } from "@/lib/portal/metadata";
import { formatDate } from "@/lib/portal/format";
import { DEV_KONTEN, ROLLEN, teamDemoKonten, teamLoginAktiv } from "@/lib/portal/tagebuch/konten";
import { tagebuchAdapter } from "@/lib/portal/tagebuch/adapter";
import { teamAusCookies } from "@/lib/portal/tagebuch/zugriff";
import { AuthPanel, Badge, Card, Notice, Overline } from "@/components/Portal/Core/ui";
import TeamAbmelden from "@/components/Portal/Tagebuch/TeamAbmelden";
import { tagebuchT } from "@/components/Portal/Tagebuch/texte";

// /de/portal/tagebuch/team – Studio intern: persönliche Anmeldung je Mitarbeiter
// (Benutzername + Passwort, Rolle Studio/Mitarbeit, src/lib/portal/tagebuch/konten.js),
// Tagebücher, Referenz-Freigaben zum Prüfen. Produktion ohne TAGEBUCH_TEAM_KONTEN: 404.

export const generateMetadata = portalMetadata({ title: "Projekt-Tagebuch (Team)", robots: { index: false, follow: false } });

const FEHLER = { anmeldung: "Benutzername oder Passwort stimmt nicht.", "zu-viele": "Zu viele Fehlversuche. Bitte in 15 Minuten erneut versuchen." };
const feld = "min-h-11 w-full border border-pebble bg-white px-3 text-base text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
const knopf = "inline-flex min-h-11 items-center border border-ink/30 px-4 text-sm text-ink hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

function FreigabeListe({ liste, s, leer }) {
  if (!liste.length) return <p className="text-sm text-ink/70">{leer}</p>;
  return (
    <ul className="divide-y divide-ink/10">
      {liste.map((f) => (
        <li key={f.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm">
            <p className="font-semibold text-ink">
              {f.projektId} · {s("teamPhotos", { anzahl: f.bilder.length })}
            </p>
            <p className="text-xs text-ink/70">
              {formatDate(f.erstellt)} · {f.anzeige.art === "anonym" ? s("refAnonym") : `${f.anzeige.vorname}, ${f.anzeige.ort}`}
            </p>
            <div className="mt-1 flex gap-1.5">
              <Badge>{s(`refStatus_${f.status}`)}</Badge>
              {f.beispiel && <Badge tone="ai">{s("example")}</Badge>}
            </div>
          </div>
          <Link href={`/de/portal/tagebuch/team/freigabe/${f.id}`} className={knopf}>
            {s("teamReview")}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default async function TeamTagebuch({ params, searchParams }) {
  const { locale } = await params;
  if (locale !== "de" || !teamLoginAktiv()) notFound();
  const sp = await searchParams;
  const s = tagebuchT(await getTranslations());
  const team = await teamAusCookies();

  if (!team) {
    return (
      <AuthPanel title={s("teamTitle")}>
        <p>{s("teamLoginIntro")}</p>
        {teamDemoKonten() && (
          <Notice tone="dev">
            Entwicklung, Demo-Konten:{" "}
            {DEV_KONTEN.map((k, i) => (
              <span key={k.id}>
                {i > 0 && " · "}
                <code>{k.id}</code> / <code>{k.passwort}</code> ({ROLLEN[k.rolle].label})
              </span>
            ))}
            . In Produktion gelten nur persönliche Konten aus <code>TAGEBUCH_TEAM_KONTEN</code>.
          </Notice>
        )}
        {sp?.fehler && FEHLER[sp.fehler] && <Notice tone="error">{FEHLER[sp.fehler]}</Notice>}
        <form method="post" action="/api/portal/tagebuch/team" className="space-y-4">
          <div>
            <label htmlFor="tbt-user" className="mb-1 block text-sm font-semibold text-ink">{s("teamUser")}</label>
            <input id="tbt-user" name="benutzer" required autoComplete="username" autoCapitalize="none" spellCheck={false} maxLength={32} className={feld} />
          </div>
          <div>
            <label htmlFor="tbt-pass" className="mb-1 block text-sm font-semibold text-ink">{s("teamPassword")}</label>
            <input id="tbt-pass" name="passwort" type="password" required autoComplete="current-password" maxLength={256} className={feld} />
          </div>
          <button type="submit" className="inline-flex min-h-12 w-full items-center justify-center bg-ink px-6 text-sm font-semibold text-white hover:bg-ink-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink">
            {s("teamLogin")}
          </button>
        </form>
      </AuthPanel>
    );
  }

  const a = tagebuchAdapter();
  const freigaben = await a.listeFreigaben();
  const ids = await a.listeTagebuecher();
  const tagebuecher = (await Promise.all(ids.map((id) => a.leseTagebuch(id)))).filter(Boolean);

  return (
    <>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <Overline>{s("teamTitle")}</Overline>
          <h1 className="mt-2 font-display text-[2rem] leading-tight text-ink sm:text-4xl">{s("refTitle")}</h1>
          <p className="mt-1 text-sm text-ink/75">{s("teamSignedInRole", { name: team.name, rolle: ROLLEN[team.teamRolle]?.label || "" })}</p>
        </div>
        <TeamAbmelden />
      </header>
      {!a.verbunden && <div className="mb-6"><Notice tone="info">Frappe-Anbindung des Tagebuchs ist noch nicht eingerichtet. Es werden keine Daten angezeigt.</Notice></div>}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card aria-labelledby="tbt-offen">
          <h2 id="tbt-offen" className="mb-3 font-display text-xl text-ink">{s("teamPending")}</h2>
          <FreigabeListe liste={freigaben.filter((f) => f.status === "eingereicht")} s={s} leer={s("teamNone")} />
        </Card>
        <Card aria-labelledby="tbt-pub">
          <h2 id="tbt-pub" className="mb-3 font-display text-xl text-ink">{s("teamPublished")}</h2>
          <FreigabeListe liste={freigaben.filter((f) => f.status === "veroeffentlicht")} s={s} leer={s("teamNone")} />
        </Card>
        <Card aria-labelledby="tbt-tb">
          <h2 id="tbt-tb" className="mb-3 font-display text-xl text-ink">{s("teamDiaries")}</h2>
          {tagebuecher.length === 0 ? (
            <p className="text-sm text-ink/70">{s("teamNoDiaries")}</p>
          ) : (
            <ul className="divide-y divide-ink/10">
              {tagebuecher.map((tb) => (
                <li key={tb.projektId} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <span>
                    <span className="block font-semibold text-ink">{tb.titel} · {tb.projektId}</span>
                    <span className="block text-xs text-ink/70">{s("teamPhotos", { anzahl: tb.fotos?.length || 0 })}</span>
                  </span>
                  <Link href={`/de/portal/projekte/${tb.projektId}/tagebuch`} className={knopf}>{s("teamOpen")}</Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card aria-labelledby="tbt-rest">
          <h2 id="tbt-rest" className="mb-3 font-display text-xl text-ink">{s("teamOther")}</h2>
          <FreigabeListe liste={freigaben.filter((f) => f.status === "abgelehnt" || f.status === "widerrufen")} s={s} leer={s("teamNone")} />
        </Card>
      </div>
    </>
  );
}
