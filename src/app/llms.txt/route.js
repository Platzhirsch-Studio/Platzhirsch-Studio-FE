// src/app/llms.txt/route.js
// Serves /llms.txt — a concise, spec-compliant (llmstxt.org) Markdown index that helps
// AI answer engines (ChatGPT/Perplexity/Claude-Web, allowed in robots.js) understand and
// navigate the site. Generated from the live CMS brand list (like sitemap.js) so the
// index never goes stale, with a static fallback if the backend is unavailable.
//
// Replaces the old oversized public/llms.txt (341 KB), which used bare URLs instead of
// Markdown links (validators reported "no links"). The spec wants: one H1, a short
// summary, then H2 sections of `- [Title](url): description` links.

import { fetchRawMarkenData } from "@/lib/api/fetchMarkenData";
import { generateSlug } from "@/lib/slugify";

const BASE_URL = "https://platzhirsch.studio";

const HEADER = `# Platzhirsch Home Living

> Einrichtungsstudio für exklusive Designermöbel und Interior Design in Lochau, Vorarlberg (Österreich). Autorisierter Händler von über 35 internationalen Premium-Marken wie Minotti, Poliform, Flos, Rimadesio, Paola Lenti und Tom Dixon.

Platzhirsch Home Living führt eine kuratierte Auswahl an Designmarken für Wohnen, Küche, Outdoor und Beleuchtung und bietet persönliche Einrichtungsberatung und Innenarchitektur, eine Ausstellung in Lochau am Bodensee sowie Lieferung und Montage in ganz Österreich. Primärsprache ist Deutsch (de-AT); die deutschen Seiten sind maßgeblich (kanonisch).

## Hauptseiten

- [Startseite](${BASE_URL}/de): Überblick über Studio, Marken und Leistungen.
- [Produkte](${BASE_URL}/de/produkte): Designmöbel, Leuchten, Küchen und Outdoor nach Marke.
- [Marken](${BASE_URL}/de/ueber-uns/marken): Alle geführten Premium-Designmarken.
- [Einrichtungsberatung](${BASE_URL}/de/beratung): Persönliche Beratung und Innenarchitektur.
- [Über uns](${BASE_URL}/de/ueber-uns/platzhirsch): Studio, Philosophie und Ausstellung in Lochau.
- [Kontakt](${BASE_URL}/de/kontakt): Adresse, Öffnungszeiten und Terminanfrage.`;

const OPTIONAL = `## Optional

- [Aktuelles](${BASE_URL}/de/news): News und Neuigkeiten aus dem Studio.
- [Team](${BASE_URL}/de/ueber-uns/team): Das Team von Platzhirsch Home Living.
- [Partner](${BASE_URL}/de/ueber-uns/partner): Partnerbetriebe und Kooperationen.
- [Presse](${BASE_URL}/de/ueber-uns/presse): Pressebereich.
- [Impressum](${BASE_URL}/de/impressum): Impressum.
- [Datenschutz](${BASE_URL}/de/datenschutz): Datenschutzerklärung.`;

function buildBrandSection(brands) {
  const lines = (brands || [])
    .map((b) => (b?.name1 || "").trim())
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, "de"))
    .map((name) => `- [${name}](${BASE_URL}/de/ueber-uns/marken/${generateSlug(name)})`)
    .join("\n");
  return lines ? `## Marken\n\n${lines}` : "";
}

export async function GET() {
  let brandSection = "";
  try {
    const marken = await fetchRawMarkenData();
    const active = (marken || []).filter((m) => m?.status === "Aktiv");
    brandSection = buildBrandSection(active);
  } catch (error) {
    // A backend outage must not break /llms.txt — degrade to header + optional, which
    // is still a valid llms.txt (H1, summary and Markdown links present).
    console.error("llms.txt brand fetch failed:", error);
  }

  const body = [HEADER, brandSection, OPTIONAL].filter(Boolean).join("\n\n") + "\n";

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}

export const revalidate = 3600;
