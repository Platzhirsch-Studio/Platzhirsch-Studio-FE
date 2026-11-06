// src/lib/wunschliste/frappeAdapter.js — NICHT AKTIV. Anbindung an den
// Frappe-Doctype „Wunschliste“ (backoffice.platzhirsch.studio).
// Abgelöst durch ./phAdapter.js (ph_shop, Gruppe "wunschliste" auf ph +
// WUNSCHLISTE_STORAGE=frappe|ph, siehe ./mode.js). Dieser Weg bleibt nur für
// die alte Generation stehen und wirft weiter.
// Das Backoffice ist PRODUKTIV: von hier wird heute nichts gelesen oder
// geschrieben. Die Spezifikation für den Frappe-Entwickler steht in
// ../platzhirsch-frappe-service/wunschliste/README.md (Doctypes, Felder,
// Berechtigungen, Endpunkte, Aufbewahrung).
//
// Zuordnung Datensatz (model.js) → Doctype:
//   Wunschliste            name = listId (autoname: field:list_id)
//     list_id, share_hash, admin_hash, ref, status (aktiv/widerrufen),
//     locale, occasion, title, event_date, message, created_at, expires_at
//   Wunschliste Stueck     (Child Table „items“)
//     item_key, product_name, brand, image, href,
//     reserved_at, reserved_by (Data, optional), reserved_note, cancel_hash
//   Wunschliste Beitrag    (Child Table „contributions“)
//     contribution_id, created_at, amount_suggested, giver_name,
//     giver_email (nur Studio), greeting, channel (anfrage/stripe),
//     status (angefragt/offen/bezahlt/erstattet), stripe_session, paid_amount
//
// Endpunkte (whitelisted, allow_guest=False, API-Benutzer mit Rolle
// „Website Wunschliste“, nur Wunschliste-Doctypes):
//   POST /api/method/platzhirsch_service.wunschliste.api.create   {record}
//   GET  /api/method/platzhirsch_service.wunschliste.api.by_share {share_hash}
//   GET  /api/method/platzhirsch_service.wunschliste.api.get      {list_id}
//   POST /api/method/platzhirsch_service.wunschliste.api.update   {list_id, record, expected_modified}
//   POST /api/method/platzhirsch_service.wunschliste.api.remove   {list_id}
// `update` arbeitet mit optimistischer Sperre (expected_modified), damit zwei
// gleichzeitige Reservierungen desselben Stücks nicht beide gelingen.
//
// Freischalten: WUNSCHLISTE_STORAGE=frappe plus FRAPPE_WUNSCHLISTE_URL,
// FRAPPE_WUNSCHLISTE_KEY, FRAPPE_WUNSCHLISTE_SECRET – erst nach Freigabe des
// Inhabers und einem Test gegen eine Staging-Instanz, nie gegen Produktion.

export const frappeWunschlisteReady = (env = process.env) =>
  env.WUNSCHLISTE_STORAGE === "frappe" && Boolean(env.FRAPPE_WUNSCHLISTE_URL && env.FRAPPE_WUNSCHLISTE_KEY && env.FRAPPE_WUNSCHLISTE_SECRET);

const notActive = async () => {
  throw new Error("Frappe-Wunschliste ist noch nicht freigeschaltet (siehe Kommentar in frappeAdapter.js).");
};

export const frappeAdapter = {
  name: "frappe",
  create: notActive,
  get: notActive,
  getByShare: notActive,
  update: notActive,
  remove: notActive,
};
