// Darstellung eines Hilfe-Artikels aus lib/backoffice/hilfe.js (zerlegeMarkdown): Überschriften,
// Absätze, Listen, Fett – kein HTML aus der Datei. Server- und Client-tauglich.

function Text({ teile = [] }) {
  return teile.map((t, i) => (t.fett ? <strong key={i}>{t.t}</strong> : <span key={i}>{t.t}</span>));
}

/** @param {{bloecke:Array<object>}} props */
export default function HilfeArtikel({ bloecke = [] }) {
  return (
    <div className="bo-schale-artikel">
      {bloecke.map((b, i) => {
        if (b.art === "h") return <h3 key={i}><Text teile={b.text} /></h3>;
        if (b.art === "liste")
          return (
            <ul key={i}>
              {b.eintraege.map((e, j) => (
                <li key={j}>
                  <Text teile={e} />
                </li>
              ))}
            </ul>
          );
        return (
          <p key={i}>
            <Text teile={b.text} />
          </p>
        );
      })}
    </div>
  );
}
