// Prüfliste „Live schalten“ (10-konzept-shop E18, § 4.10): serverseitig neu gerechnet. Rein (Client wird übergeben).

import { T } from "./texte.js";

/** Prüfliste „Live schalten“ (E18) – serverseitig neu gerechnet. */
export async function prueflisteFuer(client) {
  const [shop, stripe] = await Promise.all([client.getDoc("PH Shop Einstellungen", "PH Shop Einstellungen").catch(() => ({})), client.getDoc("PH Stripe Einstellungen", "PH Stripe Einstellungen").catch(() => ({}))]);
  const kommentare = await (async () => {
    try {
      const i = await client.getDocMitInfo("PH Shop Einstellungen", "PH Shop Einstellungen");
      return i.docinfo?.comments || [];
    } catch {
      return [];
    }
  })();
  const stb = kommentare.find((k) => /^USt-Freigabe Steuerberater/.test(String(k.content || "")));
  return [
    { id: "schluessel", titel: "Stripe-Schlüssel", ok: !!Number(stripe.schluessel_vorhanden) },
    { id: "webhook", titel: "Webhook-Geheimnis", ok: !!Number(stripe.webhook_secret_vorhanden) },
    { id: "simulation", titel: "Simulation aus", ok: !Number(stripe.simulation) },
    { id: "rechtstexte", titel: "Rechtstexte freigegeben", ok: shop.rechtstexte_status === "freigegeben" },
    { id: "stb", titel: T.stbFreigabe, ok: !!stb, hinweis: stb ? String(stb.content).replace(/^USt-Freigabe Steuerberater:?\s*/, "") : "" },
  ];
}
