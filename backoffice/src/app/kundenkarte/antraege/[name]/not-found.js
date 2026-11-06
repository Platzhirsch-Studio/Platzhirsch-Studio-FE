import Link from "next/link";

export default function AntragNichtGefunden() {
  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <div className="bo-kachel max-w-md items-center text-center" data-testid="kk-404">
        <p className="bo-wortmarke text-sm text-bo-text-soft">PLATZHIRSCH</p>
        <h1 className="mt-4 text-[22px] font-semibold">Dieser Antrag existiert nicht mehr.</h1>
        <Link href="/kundenkarte/antraege" className="bo-knopf bo-knopf--primary mt-6 inline-flex h-11 items-center rounded-full px-5 text-[14px] font-semibold">
          Zur Liste
        </Link>
      </div>
    </main>
  );
}
