// src/lib/marken/sofaplanerFamily.server.js
// Server-Brücke: Modell-Link „Dieses Modell im Sofaplaner planen“ nur für
// Familien, die im Sofaplaner-Katalog existieren (getFamily() aus
// src/lib/sofaplaner/catalog.server.js, nur lesend). Die Zuordnung Name →
// Familie ist rein: sofaplanerFamilyFor() in ./minottiBodensee.js.
import "server-only";
import { ensureCatalog, getFamily } from "@/lib/sofaplaner/catalog.server";
import { sofaplanerFamilyFor } from "./minottiBodensee";

/**
 * Geprüfter Sofaplaner-Slug für ein Minotti-Sofa (Produkt) oder eine
 * Minotti-Kollektion, sonst null. Der Katalog wird nur für Minotti auf
 * Deutsch geladen; ein Fehler beim Laden lässt den Link still weg.
 * @param {{locale: string, brand?: string, name?: string, categoryKey?: string|null}} p
 */
export async function sofaplanerFamilySlug({ locale, brand, name, categoryKey }) {
  const precheck = sofaplanerFamilyFor({ locale, brand, name, categoryKey, hasFamily: () => true });
  if (!precheck) return null;
  try {
    await ensureCatalog();
    return sofaplanerFamilyFor({ locale, brand, name, categoryKey, hasFamily: (slug) => Boolean(getFamily(slug)) });
  } catch {
    return null;
  }
}
