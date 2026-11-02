// src/components/Katalog/shopGalerie.js
// Bildreihenfolge der Shop-Produktseite (Accessoire-Welt): Freisteller zuerst –
// wie Kachel (shopIndex.kachelBilder), Merkliste und JSON-LD –, danach die
// Raumbilder („wie es im Raum wirkt“), zuletzt Details. Stabil innerhalb der
// Gruppen, Bilder selbst unverändert. Ohne "@/"-Importe (node --test).

/**
 * @param {{ freisteller?: object[], ambiente?: object[], detail?: object[] }} g  Ergebnis von galerie(p)
 * @returns {object[]}
 */
export function shopGalerie(g) {
  return [...(g?.freisteller || []), ...(g?.ambiente || []), ...(g?.detail || [])];
}
