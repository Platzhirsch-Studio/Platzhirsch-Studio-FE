// Raumbilder für Vorschau und Akte. Regel (Lounge §11): nur echte Räume/Produkte aus dem Sortiment, nie
// Stock-Fotos von Personen. Im Frappe-Modus kommt ein Bild nur aus dem Datensatz (Projekt-/Anfrage-Anhang);
// ohne Bild zeigt der Baustein die Travertin-Fläche. Im Mock-Modus (Beispieldaten) wählt diese Tabelle ein
// Sortimentsbild aus public/entwurf/lounge nach Projektart/Raum, damit die Vorführung wie im Entwurf aussieht.
// Reines Modul.

const BILDER = {
  kueche: { src: "/entwurf/lounge/r-kueche-eiche.jpg", alt: "Küche in Eiche mit Kochinsel", position: "50% 55%" },
  wohnen: { src: "/entwurf/lounge/r-wohnen-sofa.jpg", alt: "Wohnraum mit Sofalandschaft", position: "50% 60%" },
  essen: { src: "/entwurf/lounge/r-essen-licht.jpg", alt: "Essplatz mit Leuchte", position: "50% 55%" },
  outdoor: { src: "/entwurf/lounge/r-terrasse-see.jpg", alt: "Terrasse mit Seeblick", position: "50% 60%" },
  hotel: { src: "/entwurf/lounge/r-terrasse-hotel.jpg", alt: "Hotelterrasse", position: "50% 55%" },
  schlafen: { src: "/entwurf/lounge/r-schlafen.webp", alt: "Schlafzimmer mit Polsterbett", position: "50% 55%" },
  bad: { src: "/entwurf/lounge/r-bad.webp", alt: "Bad mit Waschtisch", position: "50% 50%" },
  haus: { src: "/entwurf/lounge/r-hero-essraum.jpg", alt: "Essraum mit Gartenblick", position: "50% 62%" },
  garten: { src: "/entwurf/lounge/r-garten-lounge.jpg", alt: "Gartenlounge", position: "50% 55%" },
};

const SCHLUESSEL = [
  [/k(ü|ue)che/i, "kueche"],
  [/wohn/i, "wohnen"],
  [/ess/i, "essen"],
  [/outdoor|terrass/i, "outdoor"],
  [/hotel|objekt/i, "hotel"],
  [/schlaf/i, "schlafen"],
  [/bad/i, "bad"],
  [/garten/i, "garten"],
  [/haus|wohnung|villa/i, "haus"],
];

/**
 * @param {string} text Projektart, Raum oder Thema
 * @param {{mock?:boolean, eigen?:string|null, ersatz?:string}} [opt] eigen = Bild-URL aus dem Datensatz
 * @returns {{src:string, alt:string, position?:string}|null}
 */
export function raumBild(text, { mock = false, eigen = null, ersatz = "" } = {}) {
  if (eigen) return { src: eigen, alt: String(text || "Projektbild"), position: "50% 50%" };
  if (!mock) return null;
  const t = String(text || "");
  for (const [re, k] of SCHLUESSEL) if (re.test(t)) return BILDER[k];
  return ersatz && BILDER[ersatz] ? BILDER[ersatz] : null;
}

/** Stabiles Ersatzbild je Name (nur Mock). */
export function bildFuerName(name, { mock = false } = {}) {
  if (!mock) return null;
  const keys = Object.keys(BILDER);
  let h = 0;
  for (const ch of String(name || "")) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return BILDER[keys[h % keys.length]];
}

export const RAUM_BILDER = BILDER;
