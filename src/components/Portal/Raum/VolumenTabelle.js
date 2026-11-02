// Planung als Tabelle (WCAG: alles aus der 3D-Ansicht auch ohne Canvas):
// Stück, Maße, Quelle der Maße, Position in Worten.
import { MASSQUELLEN, masseText, positionInWorten } from "@/lib/raumzwilling/platzierung";

export default function VolumenTabelle({ volumen = [], grundriss, auswahl, onAuswahl, caption = "Geplante Stücke in Ihrem Raum" }) {
  if (!volumen.length) {
    return <p className="bg-bone px-4 py-4 text-sm text-ink/80">Noch keine Stücke geplant. Ihr Beratungsteam setzt sie nach dem Gespräch in Ihren Raum.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
        <caption className="mb-2 text-left text-xs text-ink/70">{caption} · Maße aus Herstellerangaben, Lage aus dem Video. Aufmaß vor Bestellung.</caption>
        <thead>
          <tr className="border-b border-ink/20 text-xs uppercase tracking-[0.14em] text-ink/70">
            <th scope="col" className="py-2 pr-3 font-semibold">Stück</th>
            <th scope="col" className="py-2 pr-3 font-semibold">Maße</th>
            <th scope="col" className="py-2 pr-3 font-semibold">Position</th>
          </tr>
        </thead>
        <tbody>
          {volumen.map((v) => (
            <tr key={v.id} className={`border-b border-ink/10 align-top ${v.id === auswahl ? "bg-gold/10" : ""}`}>
              <th scope="row" className="py-3 pr-3 font-semibold text-ink">
                {onAuswahl ? (
                  <button type="button" onClick={() => onAuswahl(v.id)} className="min-h-6 text-left underline decoration-ink/25 underline-offset-4 hover:decoration-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink" aria-pressed={v.id === auswahl}>
                    {v.marke ? `${v.marke} · ` : ""}
                    {v.name}
                  </button>
                ) : (
                  <>
                    {v.marke ? `${v.marke} · ` : ""}
                    {v.name}
                  </>
                )}
                {v.notiz && <span className="mt-1 block text-xs font-normal text-ink/70">{v.notiz}</span>}
              </th>
              <td className="py-3 pr-3 text-ink/90">
                {masseText(v)}
                <span className="mt-1 block text-xs text-ink/70">
                  {v.quelle?.url ? (
                    <a href={v.quelle.url} className="underline underline-offset-2" rel="noopener noreferrer" target="_blank">
                      {MASSQUELLEN[v.quelle.art] || "Quelle"}
                    </a>
                  ) : (
                    MASSQUELLEN[v.quelle?.art] || "Quelle unbekannt"
                  )}
                </span>
              </td>
              <td className="py-3 pr-3 text-ink/90">{positionInWorten(v, grundriss)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
