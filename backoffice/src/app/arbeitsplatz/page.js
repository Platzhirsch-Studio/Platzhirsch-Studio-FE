import { requireSession } from "@/lib/backoffice/auth/dal";
import { erlaubteArbeitsplaetze } from "@/lib/backoffice/auth/rechte";
import { arbeitsplatzWaehlenAction, abmeldenAction } from "@/lib/backoffice/actions";
import { Icon } from "@/components/Backoffice/icons";

export const metadata = { title: "Arbeitsplatz" };

// Entscheidung Nr. 49: ein Login, danach Arbeitsplatz-Auswahl (Kacheln nach Rollen).
// Aufbau: schmale Kopfleiste (Wortmarke, Benutzer, Abmelden), Inhalt im oberen Drittel
// (optische Mitte), damit am Desktop kein großer Leerraum über den Kacheln steht.
export default async function ArbeitsplatzPage({ searchParams }) {
  const session = await requireSession("/arbeitsplatz");
  const sp = await searchParams;
  const plaetze = erlaubteArbeitsplaetze(session.roles);
  const aktuell = plaetze.find((a) => a.slug === session.arbeitsplatz);
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex h-14 items-center justify-between gap-3 border-b border-bo-line px-4 md:px-8">
        <p className="bo-wortmarke text-sm">PLATZHIRSCH</p>
        <div className="flex min-w-0 items-center gap-2 text-sm text-bo-text-soft">
          <span className="hidden truncate sm:inline">{session.name}</span>
          <form action={abmeldenAction}>
            <button type="submit" className="bo-motion inline-flex min-h-10 items-center gap-1.5 rounded-bo px-2.5 text-sm text-bo-text-soft transition-colors duration-[120ms] hover:bg-bo-action-soft hover:text-bo-text">
              <Icon name="LogOut" className="size-4" /> Abmelden
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 pb-16 pt-10 md:px-8 md:pt-[12vh]">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Arbeitsplatz wählen</h1>
        <p className="mt-1.5 text-sm text-bo-text-soft">
          Angemeldet als {session.name}
          {aktuell ? ` · zuletzt: ${aktuell.titel}` : ""}.
        </p>
        {sp?.fehler && (
          <p role="alert" className="mt-4 rounded-bo border border-bo-danger/40 bg-bo-danger-soft px-3 py-2 text-sm">
            Dieser Arbeitsplatz ist für Ihre Rollen nicht freigegeben.
          </p>
        )}
        <form action={arbeitsplatzWaehlenAction} className="mt-8 grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-3" data-testid="arbeitsplaetze">
          {plaetze.map((a) => {
            const istAktuell = session.arbeitsplatz === a.slug;
            return (
              <button
                key={a.slug}
                type="submit"
                name="arbeitsplatz"
                value={a.slug}
                aria-current={istAktuell ? "true" : undefined}
                className="bo-motion group relative flex min-h-32 flex-col items-start gap-3 rounded-2xl border border-bo-line bg-bo-surface p-5 text-left transition-[border-color,transform,box-shadow] duration-[120ms] hover:-translate-y-px hover:border-bo-line-strong hover:shadow-bo active:translate-y-0 aria-[current=true]:border-bo-text"
              >
                <span className="inline-flex size-10 items-center justify-center rounded-[10px] bg-bo-accent-soft text-bo-accent-text">
                  <Icon name={a.icon} className="size-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-base font-semibold">{a.titel}</span>
                  <span className="mt-0.5 block text-xs text-bo-text-soft">{a.beschreibung}</span>
                </span>
                {istAktuell && <span className="absolute right-4 top-4 rounded-full bg-bo-surface-3 px-2 py-0.5 text-[11px] text-bo-text-soft">zuletzt</span>}
                <Icon name="ArrowRight" className="absolute bottom-5 right-5 size-4 text-bo-text-faint transition-transform duration-[120ms] group-hover:translate-x-0.5 group-hover:text-bo-text" />
              </button>
            );
          })}
        </form>
        {plaetze.length === 0 && <p className="mt-6 text-sm text-bo-danger">Für Ihre Rollen ist kein Arbeitsplatz freigegeben.</p>}
      </main>
    </div>
  );
}
