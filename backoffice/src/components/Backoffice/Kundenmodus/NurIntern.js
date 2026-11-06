// <NurIntern> (G-20): Inhalte, die Kundinnen und Kunden im Kundenmodus nie sehen – Margen, EK,
// Deckungsbeiträge, interne Notizen, Bearbeiter-Hinweise. Server- und Client-tauglich (ohne Hooks):
// das CSS der Shell blendet [data-bo-intern] aus, solange html[data-bo-kundenmodus="an"] gilt.
// `als="div"` für Blockinhalte, Standard ist ein Element mit display: contents (keine Layout-Wirkung).
//
//   <NurIntern><Kennzahl titel="Marge" … /></NurIntern>
//   <NurIntern als="section" className="…">…</NurIntern>

export default function NurIntern({ als: Tag = "span", className, children }) {
  return (
    <Tag data-bo-intern="" className={className} style={className ? undefined : { display: "contents" }}>
      {children}
    </Tag>
  );
}
