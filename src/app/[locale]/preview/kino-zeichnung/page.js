// /de/preview/kino-zeichnung – Kino-Lab 3 „Die Zeichnung wird lebendig“.
// Vollbild: eine glühende Linie zeichnet einen Wohnraum, Licht flutet herein,
// die Zeichnung wird zum Showroom-Foto (aboutHome.jpg, eigenes Foto) mit
// Kamerafahrt. Danach drei Welten (Küche, Bad & Wellness, Café) mit derselben
// Mechanik und Herstellerbildern (unverändert, ganz gezeigt, „Bild: <Marke>“),
// zum Schluss Termin-CTA wie auf der Startseite und Adresse.
// Linien = Animation, keine Originalskizzen (Vermerk; Scan-Schnittstelle in
// src/components/Preview/kino-zeichnung/drawings.js → SCANS).
import { notFound } from "next/navigation";
import { designPreviewEnabled, previewMetadata } from "@/components/Preview/gate";
import ClosingCta from "@/components/Home/ClosingCta";
import ZeichenBuehne from "@/components/Preview/kino-zeichnung/ZeichenBuehne";
import { zeichnungFuer } from "@/components/Preview/kino-zeichnung/drawings";
import s from "@/components/Preview/kino-zeichnung/kino.module.css";
import { ADDRESS, DIRECTIONS_URL, OPENING_HOURS, PHONE_DISPLAY, PHONE_HREF } from "@/lib/site";
import { CAFE_PROFILE } from "@/lib/seo/siteSchema";
import fs from "node:fs";
import path from "node:path";

// Café-Foto: liegt public/Images/Cafe/cafe.jpg (Maße in cafe.json: {"width":…,"height":…}),
// wird es genommen; sonst das eigene Showroom-Foto aus demselben Haus.
const SHOWROOM_FOTO = {
  src: "/Images/Home/aboutHome.jpg",
  width: 2048,
  height: 1228,
  alt: "Showroom von Platzhirsch Home Living in Lochau, im selben Haus wie das Café",
  credit: "Foto: Heidegger Fotografie",
};
function cafeBild() {
  try {
    const dir = path.join(process.cwd(), "public", "Images", "Cafe");
    const masse = JSON.parse(fs.readFileSync(path.join(dir, "cafe.json"), "utf8"));
    if (fs.existsSync(path.join(dir, "cafe.jpg")) && masse.width > 0 && masse.height > 0) {
      return { src: "/Images/Cafe/cafe.jpg", width: masse.width, height: masse.height, alt: "Das Platzhirsch Café in Lochau", credit: masse.credit || "Foto: Platzhirsch Café" };
    }
  } catch {
    /* kein Café-Foto abgelegt */
  }
  return SHOWROOM_FOTO;
}
const CAFE_BILD = cafeBild();

export const generateMetadata = previewMetadata({
  title: "Prototyp Kino – Die Zeichnung wird lebendig | Platzhirsch Home Living",
  description: "Design-Prototyp: Eine Linie zeichnet einen Wohnraum, dann wird daraus der Showroom in Lochau. Nicht öffentlich.",
  robots: { index: false, follow: false },
});

const TAGE = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
const uhr = (t) => t.replace(/:00$/, "");

function oeffnungszeiten() {
  return OPENING_HOURS.map((r) => {
    const tage = r.days.length === 2 && !r.closed ? `${TAGE[r.days[0]]}–${TAGE[r.days[1]]}` : r.days.map((d) => TAGE[d]).join(", ");
    return r.closed ? `${tage} geschlossen` : `${tage} ${uhr(r.from)}–${uhr(r.to)} Uhr`;
  });
}

const SZENEN = [
  {
    id: "kueche",
    nr: "01",
    overline: "Welt 01 · Küche",
    titel: (
      <>
        Kochen, wo man <em>zusammenkommt.</em>
      </>
    ),
    text: "Insel, Kochfeld, Licht: Eine Küche planen wir aus dem Grundriss heraus – mit Geräten aus unserem Sortiment.",
    link: { href: "/de/kuechen-vorarlberg", label: "Küchen in Vorarlberg" },
    bild: {
      src: "/Images/Wellness/produkte/bora/bora-ambiente-pure.webp",
      width: 960,
      height: 540,
      alt: "Kochinsel mit Steinplatte, eingelassenem Kochfeld mit Dunstabzug, Topf und Pfanne, dahinter Stühle vor einem Sprossenfenster",
      credit: "Bild: Bora",
    },
    beschreibung: "Animation: Eine Linie zeichnet eine Kochinsel mit Kochfeld, Topf und Pfanne vor einem Fenster. Danach erscheint ein Herstellerbild von Bora.",
    tone: s.szeneWalnut,
  },
  {
    id: "bad",
    nr: "02",
    overline: "Welt 02 · Bad & Wellness",
    titel: (
      <>
        Wasser, Stein <em>und Ruhe.</em>
      </>
    ),
    text: "Wanne, Waschtisch, Sauna: Bad und Wellness entstehen bei uns als Raum, nicht als Katalogseite.",
    link: { href: "/de/bad-wellness", label: "Bad & Wellness" },
    bild: {
      src: "/Images/Wellness/produkte/agape/agape-cenote-badewanne-1.webp",
      width: 1173,
      height: 1600,
      alt: "Freistehende ovale Badewanne in Weiß mit schlanker Armatur vor einer hellen, warm beleuchteten Wand",
      credit: "Bild: Agape",
    },
    beschreibung: "Animation: Eine Linie zeichnet eine freistehende ovale Badewanne mit Armatur. Danach erscheint ein Herstellerbild von Agape.",
    tone: s.szeneInk,
    flip: true,
  },
  {
    id: "cafe",
    nr: "03",
    overline: "Welt 03 · Café",
    titel: (
      <>
        Erst ein Espresso. <em>Dann planen.</em>
      </>
    ),
    text: "Zum Platzhirsch in Lochau gehört ein Café. Nehmen Sie sich Zeit für einen Kaffee – vor oder nach dem Gang durch die Ausstellung.",
    link: { href: "/de/showroom", label: "Showroom & Café" },
    // Inhaber 31.10.2026: echtes Platzhirsch-Café-Foto statt Herstellerbild
    // (Ablage public/Images/Cafe/cafe.jpg); bis dahin das eigene Showroom-Foto.
    bild: CAFE_BILD,
    beschreibung: "Animation: Eine Linie zeichnet eine Espressomaschine, zwei Gläser und Kaffeebohnen auf einer Theke. Danach erscheint ein Foto aus dem Haus von Platzhirsch.",
    tone: s.szeneWalnut,
  },
];

export default async function KinoZeichnungPage({ params }) {
  const { locale } = await params;
  if (locale !== "de" || !designPreviewEnabled()) notFound();

  const wohnen = zeichnungFuer("wohnen");
  const zeiten = oeffnungszeiten();

  return (
    <div className={s.root} data-kino-zeichnung="">
      <section className={s.hero} aria-labelledby="kz-titel">
        <ZeichenBuehne
          hero
          zeichnung={wohnen}
          bild={{
            src: "/Images/Home/aboutHome.jpg",
            width: 2048,
            height: 1228,
            alt: "Showroom von Platzhirsch Home Living: Sofalandschaft, zwei Sessel, Couchtische und Kamin vor einer Fensterfront mit Vorhängen",
            credit: "Foto: Heidegger Fotografie",
          }}
          beschreibung="Animation: Eine leuchtende Linie zeichnet einen Wohnraum in Perspektive – Fensterfront, Fenster mit Blick auf den See, Sofa, Sessel und eine Stehleuchte. Danach flutet Licht herein und die Zeichnung wird zum Foto des Showrooms."
        />
        <div className={`${s.wrap} ${s.heroText}`}>
          <p className={s.overline}>Platzhirsch Home Living · Lochau am Bodensee</p>
          <h1 id="kz-titel" className={s.h1}>
            Erst die Linie. <em>Dann Ihr Raum.</em>
          </h1>
          <p className={s.heroLead}>
            Harald Menghin zeichnet Konzepte von Hand, baut Modelle, dann folgt 3D. Diese Animation zeigt das Prinzip: aus einem Strich wird ein Wohnraum.
          </p>
          <p className={s.heroLinks}>
            <a className={s.link} href="#kz-kueche">
              Drei Welten ansehen <span aria-hidden="true">↓</span>
            </a>
          </p>
        </div>
      </section>

      {SZENEN.map((sz) => (
        <section key={sz.id} id={`kz-${sz.id}`} className={`${s.szene} ${sz.tone} ${sz.flip ? s.flip : ""}`} aria-labelledby={`kz-${sz.id}-titel`}>
          <div className={`${s.wrap} ${s.szeneGrid}`}>
            <div className={s.szeneText}>
              <p className={s.nr} aria-hidden="true">
                {sz.nr}
              </p>
              <p className={s.overline}>{sz.overline}</p>
              <h2 id={`kz-${sz.id}-titel`} className={s.h2}>
                {sz.titel}
              </h2>
              <p className={s.szeneLead}>{sz.text}</p>
              <p className={s.szeneLinks}>
                <a className={s.link} href={sz.link.href}>
                  {sz.link.label} <span aria-hidden="true">→</span>
                </a>
              </p>
            </div>
            <ZeichenBuehne zeichnung={zeichnungFuer(sz.id)} bild={sz.bild} beschreibung={sz.beschreibung} />
          </div>
        </section>
      ))}

      <ClosingCta locale="de" />

      <section className={s.adresse} aria-labelledby="kz-adresse">
        <div className={`${s.wrap} ${s.adresseGrid}`}>
          <div>
            <p className={s.overline}>Besuch</p>
            <h2 id="kz-adresse" className={s.h2s}>
              Platzhirsch in Lochau
            </h2>
          </div>
          <dl>
            <div>
              <dt>Adresse</dt>
              <dd>
                {ADDRESS.street}
                <br />
                {ADDRESS.postalCode} {ADDRESS.city}, {ADDRESS.region}
                <br />
                <a className={s.link} href={DIRECTIONS_URL} target="_blank" rel="noopener noreferrer">
                  Route planen<span className="sr-only"> (öffnet Google Maps in neuem Tab)</span>
                </a>
              </dd>
            </div>
            <div>
              <dt>Showroom</dt>
              <dd>
                {zeiten.map((z) => (
                  <span key={z} className="block">
                    {z}
                  </span>
                ))}
                <a className={`${s.link} tabular`} href={PHONE_HREF}>
                  {PHONE_DISPLAY}
                </a>
              </dd>
            </div>
            <div>
              <dt>Café</dt>
              <dd>{CAFE_PROFILE.openingLineDe}</dd>
            </div>
          </dl>
        </div>
      </section>
    </div>
  );
}
