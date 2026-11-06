import Link from "next/link";

// 404 der Datei-Akte – auch bei fehlendem Recht (Ordner „Nur Leitung“, Personal), 05 §8.3.
export default function DateiNichtGefunden() {
  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <div className="bo-kachel max-w-md items-center text-center" data-testid="abl-404">
        <p className="bo-wortmarke text-sm text-bo-text-soft">PLATZHIRSCH</p>
        <h1 className="mt-4 text-[22px] font-semibold">Diese Datei gibt es nicht</h1>
        <p className="mt-2 text-[14px] text-bo-text-soft">Sie wurde gelöscht – oder du darfst sie nicht sehen.</p>
        <Link href="/ablage" className="bo-knopf bo-knopf--primary mt-6 inline-flex h-11 items-center rounded-full px-5 text-[14px] font-semibold">
          Zur Ablage
        </Link>
      </div>
    </main>
  );
}
