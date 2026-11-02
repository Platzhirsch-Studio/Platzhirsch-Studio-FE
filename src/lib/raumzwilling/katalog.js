// src/lib/raumzwilling/katalog.js — Katalogmaße für das Team-Werkzeug (server-only).
// Suche über den Concierge-Katalog (src/lib/concierge/catalog.js, liest das
// Backoffice, nur GET), Maße aus dem geprüften Register
// src/lib/arviewer/dims.json (Herstellerdokument, wörtlich übernommen).
// Ohne geprüfte Maße: „Maße fehlen“ – das Team trägt sie von Hand ein und
// nennt die Quelle; Backoffice-Freitext gilt nicht als geprüft.
// Fällt das Backoffice aus, durchsucht das Werkzeug nur das Maß-Register.
import "server-only";
import { searchProducts, seenProduct } from "@/lib/concierge/catalog";
import DIMS from "@/lib/arviewer/dims.json";

const HERKUNFT_MARKE = { "minotti-technical-sheet": "Minotti", "classicon-product-sheet": "ClassiCon" };
const norm = (s) =>
  String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

function masseVon(pfad) {
  const d = pfad && DIMS.produkte[pfad];
  if (!d || !(d.w > 0 && d.d > 0 && d.h > 0)) return null;
  return { w: d.w, d: d.d, h: d.h, quelle: { art: "hersteller", text: d.modell ? `Herstellerangabe: ${d.modell}` : "Herstellerangabe", url: d.quelle || null } };
}

function ausRegister(q, limit) {
  const w = norm(q);
  return Object.entries(DIMS.produkte)
    .filter(([pfad, d]) => norm(`${pfad} ${d.familie || ""} ${d.modell || ""}`).includes(w))
    .slice(0, limit)
    .map(([pfad, d]) => ({
      id: pfad,
      name: d.familie ? `${d.familie} ${d.modell && !d.modell.startsWith(d.familie) ? d.modell : ""}`.trim() : d.modell || pfad,
      marke: HERKUNFT_MARKE[d.herkunft] || null,
      href: null,
      masse: masseVon(pfad),
    }));
}

const mitFrist = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error("Zeitüberschreitung")), ms))]);

/** @returns {Promise<{treffer:object[], quelle:"katalog"|"register"}>} */
export async function sucheKatalog(q, limit = 12) {
  const text = String(q || "").trim().slice(0, 80);
  if (text.length < 2) return { treffer: [], quelle: "katalog" };
  try {
    const karten = await mitFrist(searchProducts(text, limit, "de"), 5000);
    const treffer = karten.map((k) => {
      const pfad = seenProduct(k.id)?.urlSlug || null;
      return { id: pfad || k.id, name: k.name, marke: k.brand || null, href: k.href, masse: masseVon(pfad) };
    });
    // Geprüfte Maße nach vorne.
    treffer.sort((a, b) => Number(Boolean(b.masse)) - Number(Boolean(a.masse)));
    if (!treffer.length) return { treffer: ausRegister(text, limit), quelle: "register" };
    return { treffer, quelle: "katalog" };
  } catch {
    return { treffer: ausRegister(text, limit), quelle: "register" };
  }
}
