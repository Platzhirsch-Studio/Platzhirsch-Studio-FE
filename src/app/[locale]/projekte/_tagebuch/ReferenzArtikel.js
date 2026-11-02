// Referenzprojekt aus dem Projekt-Tagebuch im festen Format von ProjektArtikel
// (Bericht 12 C3): Titel, Faktenzeile, Totale, Ausgangslage, Lösung (≤ 3 Räume),
// Termin. Unterschied: Bilder als <picture> ohne Optimizer (ReferenzBild.js),
// optional die Nennung der Bauherren nach ihrer Wahl, und Vorher/Nachher als Paar.
import { Breadcrumb, TerminCta } from "@/components/Ratgeber/RatgeberParts";
import { formatYearMonth } from "@/components/Projects/ProjektArtikel";
import ReferenzBild from "./ReferenzBild";

export default function ReferenzArtikel({ projekt: p }) {
  const facts = [
    ["Ort", p.ort],
    ["Typologie", p.typologie],
    ["Leistungen", p.leistungen.join(" · ")],
    ["Zeitraum", `${formatYearMonth(p.zeitraum.von)} bis ${formatYearMonth(p.zeitraum.bis)}`],
    ...(p.nennung ? [["Bauherren", p.nennung]] : []),
  ];
  const [totale, ...rest] = p.bilder;
  return (
    <article className="bg-surface text-text" aria-labelledby="projekt-titel">
      <header className="px-gutter pt-10 pb-10 md:pt-14 lg:pt-16">
        <div className="mx-auto max-w-page">
          <Breadcrumb items={[{ name: "Startseite", href: "/" }, { name: "Projekte", href: "/projekte" }, { name: p.titel }]} />
          {p.beispiel && (
            <p className="mt-6 border border-line-strong bg-surface-band px-4 py-3 text-small text-text">
              Beispiel aus Demo-Daten (nur Entwicklung): synthetische Grafiken, kein echtes Projekt.
            </p>
          )}
          <p className="mt-10 text-overline uppercase text-text-accent">Projekt</p>
          <h1 id="projekt-titel" className="mt-stack-s max-w-[22ch] font-display text-display-l text-text">
            {p.titel}
          </h1>
          <dl className="mt-stack-m grid max-w-measure grid-cols-[auto_1fr] gap-x-6 gap-y-2 border-t border-line pt-4 text-body">
            {facts.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-text-soft">{k}</dt>
                <dd className="m-0 text-text">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </header>

      <div className="px-gutter pb-16 md:pb-24">
        <div className="mx-auto grid max-w-page gap-x-grid gap-y-12 lg:grid-cols-12">
          <div className="lg:col-span-12">
            <ReferenzBild bild={totale} priority sizes="(min-width: 1440px) 1280px, 100vw" />
          </div>
          <section aria-labelledby="ausgangslage" className="lg:col-span-7 lg:col-start-2">
            <h2 id="ausgangslage" className="font-display text-display-m text-text">Die Ausgangslage</h2>
            <p className="mt-stack-s max-w-measure text-lead text-text">{p.ausgangslage}</p>
          </section>
          <section aria-labelledby="loesung" className="lg:col-span-10 lg:col-start-2">
            <h2 id="loesung" className="font-display text-display-m text-text">Unsere Lösung</h2>
            <div className="mt-stack-m grid gap-10 md:grid-cols-3 md:gap-grid">
              {p.loesung.map((l, i) => (
                <div key={l.raum}>
                  {rest[i] && <ReferenzBild bild={rest[i]} sizes="(min-width: 768px) 33vw, 100vw" />}
                  <h3 className="mt-4 text-title text-text">{l.raum}</h3>
                  <p className="mt-2 text-body text-text">{l.text}</p>
                </div>
              ))}
            </div>
          </section>
          {rest.length > p.loesung.length && (
            <section aria-label="Weitere Bilder" className="lg:col-span-10 lg:col-start-2">
              <ul className="grid gap-grid md:grid-cols-3">
                {rest.slice(p.loesung.length).map((b) => (
                  <li key={b.src}>
                    <ReferenzBild bild={b} sizes="(min-width: 768px) 33vw, 100vw" />
                  </li>
                ))}
              </ul>
            </section>
          )}
          <div className="lg:col-span-10 lg:col-start-2">
            <TerminCta headingId="projekt-termin" heading="Ihr Projekt am Bodensee?">
              {`Von der ersten Skizze bis zur Montage: ${formatYearMonth(p.zeitraum.von)} bis ${formatYearMonth(p.zeitraum.bis)}. Erzählen Sie uns von Ihrem Vorhaben, im Showroom in Lochau oder am Telefon.`}
            </TerminCta>
          </div>
        </div>
      </div>
    </article>
  );
}
