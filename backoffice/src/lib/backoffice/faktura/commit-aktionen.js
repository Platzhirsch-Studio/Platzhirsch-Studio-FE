// Verzögerte Commits des Bereichs Faktura (G-03, E3, § 2.3): Bank-Zuordnung, ER-Freigabe, Angebot ablehnen,
// Mahnung erledigt, Mahnsperre, Zahllauf vormerken. Die Bereichs-Action prüft Recht und plant; ausgeführt wird
// erst nach 8 s bzw. bei pagehide – genau einmal, mit der Sitzung des Benutzers. Undo = kein Aufruf (F-13, F-33).
// Registriert über lib/backoffice/commit/aktionen/faktura.js (eine Zeile, Re-Export).

import { methode } from "./methoden.js";

const NAME = /^[\w .:/-]{1,140}$/u;
const ok = (args, ...felder) => felder.every((f) => typeof args?.[f] === "string" && NAME.test(args[f]));
const ungueltig = { ok: false, code: "invalid", message: "Unvollständige Angaben." };

/** @type {Record<string, (ctx: {client:any, args:any, revalidiere:(p:string)=>void}) => Promise<any>>} */
const aktionen = {
  "faktura.bank-zuordnen": async ({ client, args, revalidiere }) => {
    if (!ok(args, "umsatz", "belegDoctype", "beleg")) return ungueltig;
    const r = await methode(client, "PH Bankumsatz", args.umsatz, "zuordnen", { beleg_doctype: args.belegDoctype, beleg: args.beleg, betrag_cent: Number(args.betragCent) || undefined });
    revalidiere("/faktura/bank");
    revalidiere("/faktura");
    return r;
  },
  "faktura.er-freigeben": async ({ client, args, revalidiere }) => {
    if (!ok(args, "name")) return ungueltig;
    const r = await methode(client, "PH Eingangsrechnung", args.name, "freigeben", {});
    revalidiere("/faktura/eingangsrechnungen");
    return r;
  },
  "faktura.angebot-ablehnen": async ({ client, args, revalidiere }) => {
    if (!ok(args, "name", "grund")) return ungueltig;
    const r = await methode(client, "PH Angebot", args.name, "ablehnen", { grund: args.grund });
    revalidiere("/faktura/angebote");
    return r;
  },
  "faktura.mahnung-erledigt": async ({ client, args, revalidiere }) => {
    if (!ok(args, "name")) return ungueltig;
    const r = await methode(client, "PH Mahnung", args.name, "erledigen", {});
    revalidiere("/faktura/mahnungen");
    return r;
  },
  "faktura.mahnsperre": async ({ client, args, revalidiere }) => {
    if (!ok(args, "name")) return ungueltig;
    const r = await client.setValue("PH Rechnung", args.name, { mahnsperre: args.wert ? 1 : 0, mahnsperre_grund: args.wert ? String(args.grund || "").slice(0, 140) : "" });
    revalidiere("/faktura/rechnungen");
    return { name: r?.name || args.name };
  },
  "faktura.zahllauf": async ({ client, args, revalidiere }) => {
    const namen = Array.isArray(args?.namen) ? args.namen.filter((n) => typeof n === "string" && NAME.test(n)).slice(0, 100) : [];
    if (!namen.length) return ungueltig;
    for (const n of namen) await client.setValue("PH Eingangsrechnung", n, "zahllauf", args.wert ? 1 : 0);
    revalidiere("/faktura/eingangsrechnungen");
    return { anzahl: namen.length };
  },
};

export default aktionen;
