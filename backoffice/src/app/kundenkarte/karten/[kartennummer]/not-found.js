import Link from "next/link";

// 404 der Karten-Akte – auch bei fehlendem Recht (Kassa-Rolle, 05 §8.3).
export default function KarteNichtGefunden() {
  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <div className="bo-kachel max-w-md items-center text-center" data-testid="kk-404">
        <p className="bo-wortmarke text-sm text-bo-text-soft">PLATZHIRSCH</p>
        <h1 className="mt-4 text-[22px] font-semibold">Diese Karte gibt es nicht</h1>
        <p className="mt-2 text-[14px] text-bo-text-soft">Die Nummer ist unbekannt – oder du darfst die Karte nicht sehen.</p>
        <Link href="/kundenkarte/karten" className="bo-knopf bo-knopf--primary mt-6 inline-flex h-11 items-center rounded-full px-5 text-[14px] font-semibold">
          Zur Liste
        </Link>
      </div>
    </main>
  );
}
