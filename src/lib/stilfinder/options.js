// src/lib/stilfinder/options.js
// Option lists of the Moodboard form, shared by the client form and the zod
// schema (kept apart from schema.js so the client bundle does not pull in zod).

export const PROJECT_TYPES = [
  { value: "neubau", label: "Neubau" },
  { value: "umbau", label: "Umbau oder Renovierung" },
  { value: "raeume", label: "Einzelne Räume neu einrichten" },
  { value: "zweitwohnsitz", label: "Ferienwohnung oder Zweitwohnsitz" },
  { value: "objekt", label: "Objekt oder Gewerbe" },
  { value: "offen", label: "Noch offen" },
];

export const REGIONS = [
  { value: "vorarlberg", label: "Vorarlberg" },
  { value: "de-bodensee", label: "Deutschland – Bodensee und Allgäu" },
  { value: "ch-ost", label: "Schweiz – Ostschweiz und Zürich" },
  { value: "li", label: "Liechtenstein" },
  { value: "andere", label: "Andere Region" },
];

export const labelOf = (list, value) => list.find((o) => o.value === value)?.label || null;
