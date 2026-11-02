// src/lib/agent/facts.js – Werkzeuge ohne Backoffice: Showroom, Arbeitsweise, Ezarri.
//
// Quellen (je EINE, nichts doppelt gepflegt):
//   Showroom     src/lib/site.js (Adresse, Telefon, Öffnungszeiten – auch Footer/JSON-LD)
//   Arbeitsweise src/lib/arbeitsweise/copy.js (die 7 Schritte der Seite /de/arbeitsweise)
//   Ezarri       src/lib/ezarri/collections.json + config.js/copy.js (Händler-Zeile
//                nur über dealerLine(), d. h. Claim-Register + EZARRI_PUBLIC)
//
// Rein (relative Importe, kein "server-only"): node --test lädt es direkt.
import {
  ADDRESS,
  AREA_SERVED,
  DIRECTIONS_URL,
  EMAIL,
  OPENING_HOURS,
  PHONE_DISPLAY,
  SITE_NAME,
  SITE_URL,
  openingDaysLabel,
  openingHoursLine,
} from "../site.js";
import * as AW from "../arbeitsweise/copy.js";
import COLLECTIONS from "../ezarri/collections.json" with { type: "json" };
import { ezarriPath } from "../ezarri/config.js";
import { dealerLine, LINIE_LABEL, STUDIO as EZ_STUDIO } from "../ezarri/copy.js";
import { PAGE_PATH, PRICE } from "./config.js";

export const abs = (path) => (/^https?:\/\//.test(path) ? path : `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`);

/** Terminanfrage mit Quelle agent (Lead-Attribution: quelle=agent). */
export function appointmentUrl(locale = "de", extra = "") {
  const paths = { de: "/de/beratung", en: "/en/consultation", fr: "/fr/conseil", it: "/it/consulenza" };
  return abs(`${paths[locale] || paths.de}?quelle=agent${extra}`);
}

// ---------------------------------------------------------------------------
// Showroom

export function showroomInfo() {
  return {
    name: SITE_NAME,
    description:
      "Einrichtungsstudio mit Café in Lochau am Bodensee, im Dreiländereck Österreich, Deutschland, Schweiz und Liechtenstein. Wohnen, Küche und Outdoor werden als ein Projekt geplant.",
    address: {
      street: ADDRESS.street,
      postalCode: ADDRESS.postalCode,
      city: ADDRESS.city,
      region: ADDRESS.region,
      country: ADDRESS.country,
      line: `${ADDRESS.street}, ${ADDRESS.postalCode} ${ADDRESS.city}, ${ADDRESS.country}`,
    },
    phone: PHONE_DISPLAY,
    email: EMAIL,
    directions: DIRECTIONS_URL,
    openingHours: OPENING_HOURS.map((row) => ({
      days: openingDaysLabel("de", row),
      time: row.closed ? "geschlossen" : `${row.from}–${row.to}`,
    })),
    openingHoursLine: openingHoursLine("de"),
    openingHoursNote: "An Feiertagen können die Zeiten abweichen. Termine außerhalb der Öffnungszeiten nach Vereinbarung.",
    cafe: "Im Showroom gibt es ein Café. Beratungsgespräche finden gern bei einem Kaffee statt.",
    services: [
      "Einrichtungsplanung von der Handzeichnung bis zum Rendering",
      "Wohnen, Küche, Outdoor und Glasmosaik von Ezarri",
      "Lieferung und Montage auf Anfrage",
      "Beratung im Showroom oder bei Ihnen vor Ort",
      // Welle 2 (Inhaber 29.10.2026): eigene Seiten für Geschäftskunden.
      `Hotels, Chalets und Gastronomie einrichten: ${abs("/de/hotel-objekt")}`,
      `Für Architekten und Bauträger (Planungsdaten, Muster, Projektanfrage): ${abs("/de/architekten")}`,
    ],
    areaServed: AREA_SERVED.countries,
    appointment: appointmentUrl("de"),
    url: abs("/de/kontakt"),
    price: PRICE,
  };
}

// ---------------------------------------------------------------------------
// Arbeitsweise (Kern-USP, Inhaber-Entscheidung Nr. 8)

const STEP_TEXT = {
  ...AW.VOR_ORT.steps,
  ...AW.VON_HAND.steps,
  ...AW.STRICH_ZUM_RAUM.steps,
  7: AW.WIRKLICHKEIT.text,
};

export function arbeitsweiseInfo() {
  return {
    title: AW.HERO.title,
    summary: AW.HERO.lead,
    designer: { name: AW.HARALD.name, role: AW.HARALD.role },
    steps: AW.STEPS.map((s) => ({ step: s.n, name: s.name, text: STEP_TEXT[s.n], url: abs(`/de${AW.PATH}#${s.id}`) })),
    note: AW.UEBERSICHT.note,
    renderingNote: AW.STRICH_ZUM_RAUM.renderingLabel,
    url: abs(`/de${AW.PATH}`),
    appointment: appointmentUrl("de"),
    price: PRICE,
  };
}

// ---------------------------------------------------------------------------
// Ezarri-Glasmosaik

const normalize = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function collectionCard(c) {
  const oberflaeche = Object.values(c.oberflaeche || {}).flat().filter(Boolean);
  return {
    id: c.id,
    name: c.name,
    linie: LINIE_LABEL[c.linie] || c.linie,
    mosaike: c.anzahl_referenzen ?? null,
    formate: c.formate || [],
    farbfamilien: c.farbfamilien || [],
    oberflaechen: [...new Set(oberflaeche)],
    url: abs(`/de${ezarriPath("kollektionen", c.id)}`),
    quelle: c.quelle || COLLECTIONS.quelle,
    price: PRICE,
  };
}

/** @param {{collection?: string, linie?: string, farbe?: string}} [filter] */
export function ezarriCollections(filter = {}) {
  const wanted = filter.collection ? normalize(filter.collection) : null;
  const list = COLLECTIONS.kollektionen.filter(
    (c) =>
      (!wanted || c.id === wanted || normalize(c.name) === wanted) &&
      (!filter.linie || c.linie === filter.linie) &&
      (!filter.farbe || (c.farbfamilien || []).includes(filter.farbe))
  );
  return {
    brand: "Ezarri",
    line: dealerLine(),
    about:
      "Glasmosaik aus Lazkao (Gipuzkoa, Spanien) für Pool, Bad, Wellness und Küche. Laut Datenblatt eignen sich fast alle Ezarri-Mosaike für Wand, Pool und Wellness, innen wie außen; Details stehen im Datenblatt der jeweiligen Kollektion.",
    studio: `${EZ_STUDIO.ort}. ${EZ_STUDIO.muster}`,
    delivery: EZ_STUDIO.laender,
    total: list.length,
    collections: list.map(collectionCard),
    programmes: filter.collection || filter.linie || filter.farbe ? [] : (COLLECTIONS.programme || []).map((p) => ({ id: p.id, name: p.name })),
    hint: list.length ? null : "Keine Kollektion passt – ohne Filter aufrufen, um alle 21 zu sehen.",
    sourceNote: `Angaben laut Ezarri (ezarri.com), Stand ${COLLECTIONS.stand}.`,
    url: abs(`/de${ezarriPath("kollektionen")}`),
    samples: abs(`/de${ezarriPath("anfrage")}?art=muster`),
    appointment: appointmentUrl("de"),
    price: PRICE,
  };
}

/** Link zur Seite dieses Features (für Antworten und die Server-Beschreibung). */
export const FEATURE_URL = abs(PAGE_PATH);
