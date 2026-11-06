import Link from "next/link";
import { ThemeSwitch } from "@/components/Entwurf/Atelier/ThemeRoot";
import { Wortmarke } from "@/components/Entwurf/Atelier/Shell";
import { IMG } from "@/components/Entwurf/Atelier/data";

export const metadata = { title: "Übersicht" };

const screens = [
  { n: "01", href: "zentrale", t: "Heute", s: "Zentrale", img: "esszimmer-see.jpg" },
  { n: "02", href: "anfragen", t: "Anfragen", s: "Liste, Tafel, Vorschau", img: "kueche-eiche.jpg" },
  { n: "03", href: "kunde", t: "Kundenakte", s: "Haus am Pfänderhang", img: "wohnraum.jpg" },
  { n: "04", href: "kassa", t: "Kassa", s: "Kiosk · iPad quer", img: "p-trudon-kerze.webp", obj: true },
];

export default function Page() {
  return (
    <main className="at-index">
      <div className="at-index-top">
        <Wortmarke sub="Backoffice · Entwurf „Atelier“" />
        <ThemeSwitch />
      </div>
      <h1>Ein Arbeitsbuch,<br /><em>kein Formular.</em></h1>
      <p className="lead">Sehr hell, warmes Papierweiß, Haarlinien statt Kästen. Zahlen und Überschriften in Buchschrift, Räume und Materialien als Ankerpunkte, ein einziger Akzent in gebrannter Erde.</p>
      <ol>
        {screens.map((s) => (
          <li key={s.n}>
            <Link href={`/entwurf/atelier/${s.href}`}>
              <div className={`img ${s.obj ? "obj" : ""}`}><img src={IMG(s.img)} alt="" /></div>
              <div className="cap"><span className="n">{s.n}</span><b>{s.t}</b><span className="s">{s.s}</span></div>
            </Link>
          </li>
        ))}
      </ol>
    </main>
  );
}
