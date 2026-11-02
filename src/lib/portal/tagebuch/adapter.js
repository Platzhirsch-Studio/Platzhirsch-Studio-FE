// src/lib/portal/tagebuch/adapter.js — Wahl des Speichers für Tagebuch und Referenz-Freigaben.
//   TAGEBUCH_ADAPTER=datei   Dev/Preview: .data/tagebuch + .data/projekte-freigaben (Standard beim Mock-Portal)
//   TAGEBUCH_ADAPTER=frappe  Produktion: Doctypes „Projekt Tagebuch Foto“ + „Projekt Referenz“,
//                            spezifiziert in ../platzhirsch-frappe-service/tagebuch/README.md.
//                            NOCH NICHT VERBUNDEN: Lesen liefert leer, Schreiben wirft.
// Ohne Variable folgt der Adapter PORTAL_ADAPTER (mock → datei, frappe → frappe).
// Das Backoffice ist produktiv: dieser Code schreibt dort nichts, bis der
// Frappe-Entwickler die Doctypes angelegt und die Methoden verdrahtet hat.
import "server-only";
import { adapterName } from "@/lib/portal/config";
import { dateiAdapter } from "./dateiAdapter.js";

const nichtVerbunden = () => {
  throw new Error("Projekt-Tagebuch: Frappe-Anbindung noch nicht eingerichtet (siehe platzhirsch-frappe-service/tagebuch/README.md).");
};

// Methoden-Zuordnung (für den Frappe-Entwickler, REST über den Integrationsnutzer,
// Header "Authorization: token key:secret", nie mit Kundenrechten):
//   leseTagebuch(pid)          GET  /api/resource/Projekt Tagebuch Foto?filters=[["project","=",pid]]
//   aendereTagebuch(pid, fn)   POST/PUT/DELETE je Foto (Felder siehe README)
//   schreibeBild/leseBild      File (is_private=1), attached_to_doctype="Projekt Tagebuch Foto"
//   legeFreigabeAn(f)          POST /api/resource/Projekt Referenz (status="Eingereicht"), Bilder als private Files
//   aendereFreigabe(id, fn)    PUT  /api/resource/Projekt Referenz/<id>
//   listeFreigaben({status})   GET  /api/resource/Projekt Referenz?filters=[["status","in",…]]
//   leseReferenzBild(id, n)    File der Referenz; öffentlich ausgeliefert NUR über unsere Route
//                              und nur bei status="Veröffentlicht" (Frappe-File bleibt privat)
const frappeAdapter = {
  name: "frappe",
  verbunden: false,
  leseTagebuch: async () => null,
  aendereTagebuch: nichtVerbunden,
  listeTagebuecher: async () => [],
  schreibeBild: nichtVerbunden,
  leseBild: async () => null,
  loescheBilder: nichtVerbunden,
  legeFreigabeAn: nichtVerbunden,
  leseFreigabe: async () => null,
  aendereFreigabe: nichtVerbunden,
  listeFreigaben: async () => [],
  leseReferenzBild: async () => null,
  loescheReferenzBilder: nichtVerbunden,
};

export function tagebuchAdapterName() {
  const v = (process.env.TAGEBUCH_ADAPTER || "").toLowerCase();
  if (v === "datei" || v === "frappe") return v;
  return adapterName() === "frappe" ? "frappe" : "datei";
}

export function tagebuchAdapter() {
  return tagebuchAdapterName() === "frappe" ? frappeAdapter : dateiAdapter;
}
