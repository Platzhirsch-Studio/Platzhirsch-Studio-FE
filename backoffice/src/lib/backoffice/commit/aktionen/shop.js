// Commit-Aktionen des Bereichs „shop“ (G-03). Nur dieser Bereich schreibt hier.
// Name = "shop.<vorgang>", Wert = async ({ session, client, args, objekt, quelle, revalidiere }) => ergebnis
// (oder { ok: false, code, message }). Geplant wird in der eigenen Server Action über
// planeCommit(session, { action: "shop.<vorgang>", args, schluessel, objekt, titel }) aus "@/lib/backoffice/commit/server".
// Die Aktion läuft mit der Sitzung des Benutzers (Frappe prüft die Rechte erneut) – auch im Nachlauf.
//
// B-SHO: Vorbedingungen (Geldprüfung E4, Status E7) prüft die planende Action; hier wird vor dem Ausführen
// erneut geprüft (der Datensatz kann sich im 8-s-Fenster geändert haben). Mock: Wirkung über shop/backend.js.

import { methode, workflow } from "../../shop/backend.js";
import { offen } from "../../shop/geld.js";

const DT = new Set(["PH Bestellung", "PH Zahlung", "PH Gutschein", "PH Gutschein Bestellung", "PH Widerruf", "PH Retoure", "PH Anzahlung", "PH Shop Einstellungen"]);
const METHODEN = new Set([
  "packen", "abholbereit_melden", "abgeholt_melden", "versendet_melden", "abschliessen", "bestaetigung_senden", "zahlungslink_senden", "zahlungslink_erstellen",
  "abholcode_erneut_senden", "positionen_stornieren", "ersatzlieferung_anlegen", "widerruf_anlegen", "pdf_senden", "codes_erneut_senden", "link_senden",
  "retoure_anlegen", "ware_erhalten", "eingegangen",
]);
const ok = (args) => args && DT.has(args.doctype) && typeof args.name === "string" && args.name.length <= 140;

/** @type {Record<string, (ctx: import("./index.js").CommitKontext) => Promise<any>>} */
const aktionen = {
  /** Eine Dokumentmethode mit Undo (Packen, Mails, Retoure anlegen …). */
  "shop.methode": async ({ client, args, revalidiere }) => {
    if (!ok(args) || !METHODEN.has(args.methode)) return { ok: false, code: "invalid", message: "Unvollständige Angaben." };
    if (args.doctype === "PH Bestellung" && ["abgeholt_melden", "abholbereit_melden"].includes(args.methode)) {
      const b = await client.getDoc("PH Bestellung", args.name);
      if (offen(b) > 0) return { ok: false, code: "invalid", message: "Erst nach Zahlung – an der Kassa kassieren." };
    }
    const r = await methode(client, args.doctype, args.name, args.methode, args.args && typeof args.args === "object" ? args.args : {});
    revalidiere("/shop");
    if (args.pfad) revalidiere(args.pfad);
    return { ergebnis: r ?? null };
  },

  /** Direkt übergeben aus „bezahlt“ (bis A11): abholbereit_melden + abgeholt_melden. */
  "shop.direkt-uebergeben": async ({ client, args, revalidiere }) => {
    if (!ok(args)) return { ok: false, code: "invalid", message: "Unvollständige Angaben." };
    const b = await client.getDoc("PH Bestellung", args.name);
    if (offen(b) > 0) return { ok: false, code: "invalid", message: "Erst nach Zahlung – an der Kassa kassieren." };
    if (b.status === "bezahlt") await methode(client, "PH Bestellung", args.name, "abholbereit_melden", {});
    await methode(client, "PH Bestellung", args.name, "abgeholt_melden", {});
    if (args.kommentar && typeof client.kommentar === "function") await client.kommentar("PH Bestellung", args.name, String(args.kommentar).slice(0, 200), "Comment");
    revalidiere("/shop");
    return { name: args.name };
  },

  /** Workflow „Zurück auf Offen“ (Leitung). */
  "shop.workflow": async ({ client, args, revalidiere }) => {
    if (!ok(args) || !["Zurück auf Offen"].includes(args.aktion)) return { ok: false, code: "invalid", message: "Unvollständige Angaben." };
    await workflow(client, args.doctype, args.name, args.aktion);
    revalidiere("/shop");
    return { name: args.name };
  },

  /** Shop-Modus zurück auf Test (Undo 8 s, § 4.10). */
  "shop.modus-test": async ({ client, revalidiere }) => {
    if (client?.modus === "mock" && typeof client.tabelle === "function") {
      const e = client.tabelle("PH Shop Einstellungen").get("PH Shop Einstellungen");
      if (e) e.shop_modus = "test";
    } else await client.save("PH Shop Einstellungen", { name: "PH Shop Einstellungen", shop_modus: "test" });
    revalidiere("/shop/einstellungen");
    return { modus: "test" };
  },
};

export default aktionen;
