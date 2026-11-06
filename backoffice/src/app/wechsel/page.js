import Link from "next/link";
import { getGeraet, getSession } from "@/lib/backoffice/auth/dal";
import { bedienerListe } from "@/lib/backoffice/auth/login";
import { Icon } from "@/components/Backoffice/icons";
import WechselForm from "./WechselForm";

export const metadata = { title: "Bedienerwechsel" };

// Schneller Bedienerwechsel an Kassa/Packtisch (Entscheidung Nr. 49): Bediener des
// Standorts (ph_core list_operators am registrierten Gerät) + PIN, neue Sitzung ohne
// Passwort, Idle-Timeout 15 min.
export default async function WechselPage() {
  const session = await getSession();
  const geraet = await getGeraet();
  const standort = geraet?.standort || session?.standort || "Lochau";
  let benutzer = [];
  let ladeFehler = "";
  try {
    benutzer = await bedienerListe({ standort, alleStandorte: true });
  } catch (err) {
    ladeFehler = err?.message || "Die Bedienerliste ist gerade nicht erreichbar.";
  }
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-4xl flex-col px-4 py-6 md:px-8 md:py-10">
      <header className="flex items-center justify-between gap-3">
        <p className="bo-wortmarke text-sm text-bo-text-soft">PLATZHIRSCH</p>
        <Link href="/arbeitsplatz" className="inline-flex min-h-10 items-center gap-1.5 rounded-bo px-2 text-sm text-bo-text-soft transition-colors duration-[120ms] hover:bg-bo-action-soft hover:text-bo-text">
          <Icon name="ChevronLeft" className="size-4" /> Zurück
        </Link>
      </header>
      <div className="mt-8">
        <h1 className="text-2xl font-semibold tracking-tight">Bedienerwechsel</h1>
        <p className="mt-1 text-sm text-bo-text-soft">
          <Icon name="MapPin" className="mr-1 inline size-3.5 align-[-2px]" />
          {standort}
          {geraet ? ` · ${geraet.name}` : ""} · Die laufende Sitzung endet; jeder Beleg trägt den angemeldeten Bediener.
        </p>
      </div>
      {!session && !geraet && (
        <p role="alert" className="mt-6 rounded-bo border border-bo-danger/40 bg-bo-danger-soft px-3 py-2 text-sm">
          Der Bedienerwechsel ist nur an einem registrierten Gerät oder in einer laufenden Sitzung möglich.{" "}
          <Link href="/login" className="underline">
            Zur Anmeldung
          </Link>
        </p>
      )}
      {ladeFehler && (
        <p role="alert" className="mt-6 rounded-bo border border-bo-danger/40 bg-bo-danger-soft px-3 py-2 text-sm">
          {ladeFehler}
        </p>
      )}
      {(session || geraet) && !ladeFehler && benutzer.length === 0 && (
        <p role="status" className="mt-6 rounded-bo border border-bo-line bg-bo-surface px-3 py-3 text-sm text-bo-text-soft">
          Bedienerwechsel nur an einem registrierten Gerät.{" "}
          <Link href="/geraet" className="text-bo-text underline">
            Gerät registrieren
          </Link>
        </p>
      )}
      {(session || geraet) && benutzer.length > 0 && (
        <div className="mt-6">
          <WechselForm benutzer={benutzer} standort={standort} />
        </div>
      )}
    </main>
  );
}
