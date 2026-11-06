// Adapter-Schicht des Dreiländer-Rechners (nur Server – nie im Client importieren).
//
// Heute: lokaler Entwicklungs-Speicher unter .data/dreilaender/ (gitignored)
//   - config.json    optionale Freigabe/Überschreibung der Richtwerte (Schema: pricing.js)
//   - ecb-last.json  zuletzt erfolgreich geladener EZB-Kurs (Fallback bei EZB-Ausfall)
// ph (Gruppe katalog): getConfig() aus ph_sortiment, siehe unten. Altes Backoffice:
//   Marktresearch/digital/features/dreilaender-rechner.md → "Anbindung Frappe".
//   getConfig()  → GET /api/resource/Dreilaender Rechner Einstellungen/Dreilaender Rechner Einstellungen
//   saveLastRate → Doctype "Currency Exchange" (ERPNext-Standard, EUR→CHF)
import { promises as fs } from "node:fs";
import path from "node:path";
import { DEFAULT_CONFIG, mergeConfig } from "./pricing";
import { fetchPhWechselkurs } from "@/lib/backend/labs";

const DIR = path.join(process.cwd(), ".data", "dreilaender");
const CONFIG_FILE = path.join(DIR, "config.json");
const RATE_FILE = path.join(DIR, "ecb-last.json");

async function readJson(file) {
  try {
    return JSON.parse(await fs.readFile(file, "utf8"));
  } catch {
    return null;
  }
}

async function writeJson(file, data) {
  try {
    await fs.mkdir(DIR, { recursive: true });
    await fs.writeFile(file, JSON.stringify(data, null, 2), "utf8");
  } catch {
    // Read-only Dateisystem (z. B. Serverless) – Speicher ist nur ein Komfort.
  }
}

// ph-Modus der Gruppe „katalog“: PH Wechselkurs Einstellungen über die Gast-Methode
// ph_sortiment.api.get_wechselkurs_einstellungen (src/lib/backend/labs.js).
// Nicht aktiv ({}), alt, ohne Zugang oder Fehler → heutiger Weg (config.json bzw. Vorgaben).
export async function getConfig() {
  const ph = await fetchPhWechselkurs(DEFAULT_CONFIG);
  if (ph) return mergeConfig(DEFAULT_CONFIG, ph);
  const override = await readJson(CONFIG_FILE);
  return override ? mergeConfig(DEFAULT_CONFIG, override) : DEFAULT_CONFIG;
}

export async function readLastRate() {
  return readJson(RATE_FILE);
}

export async function saveLastRate(entry) {
  const prev = await readLastRate();
  if (prev?.date === entry.date && prev?.rate === entry.rate) return;
  await writeJson(RATE_FILE, entry);
}
