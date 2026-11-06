// QA-Routen – Baustein-Demos des Fundaments (MASTER § 4: je Baustein eine Demo unter
// /einstellungen?tab=system&baustein=<name>, nur Admin, nur Mock). Abgeleitet aus
// src/lib/backoffice/demo-register.js – neue Demos erscheinen hier ohne eigenen Eintrag.

import { DEMOS } from "../../../src/lib/backoffice/demo-register.js";

const eintraege = Object.entries(DEMOS).map(([name, d], i) => ({
  pfad: `/einstellungen?tab=system&baustein=${name}`,
  titel: `Baustein – ${d.titel.split(" (")[0]} (${d.team})`,
  rang: 2000 + i,
}));

export default eintraege;
