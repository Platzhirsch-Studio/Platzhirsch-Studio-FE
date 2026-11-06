import Link from "next/link";

// 404 im Backoffice-Stil (auch Ziel von notFound() in den Seiten).
export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <div className="max-w-sm text-center">
        <p className="bo-wortmarke text-sm text-bo-text-soft">PLATZHIRSCH · BACKOFFICE</p>
        <h1 className="mt-4 text-2xl font-semibold">Seite nicht gefunden</h1>
        <p className="mt-2 text-sm text-bo-text-soft">Die Adresse existiert nicht oder der Datensatz wurde entfernt.</p>
        <Link href="/" className="mt-6 inline-flex min-h-10 items-center rounded-bo bg-bo-action px-4 text-sm font-medium text-bo-action-text">
          Zur Zentrale
        </Link>
      </div>
    </main>
  );
}
