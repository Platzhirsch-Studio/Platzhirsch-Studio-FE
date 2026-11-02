// src/lib/kundenbetreuung/newsletter/newsletter.js
// Logik des Newsletters „Post aus Lochau“: welche Blöcke sichtbar sind,
// wann eine Ausgabe versandbereit ist, was ins Archiv darf, und die
// Mail-Fassung (HTML-Vorlage mit Fußzeile A, Jinja-Platzhalter für Anrede
// und Abmeldelink). Daten: ./ausgaben.js. Keine "@/..."-Importe.
import { AUSGABEN } from "./ausgaben.js";
import { absatz, haarlinie, knopf, mailHtml, overline, ueberschrift, FARBEN } from "../mail.js";

export const SITE = "https://platzhirsch.studio";
export const SLOT_TYPEN = Object.freeze(["neueStuecke", "skizze"]);
export const INHALT_TYPEN = Object.freeze(["neueStuecke", "skizze", "termine", "gutZuWissen"]);

const hasText = (v) => typeof v === "string" && v.trim().length > 0;
const isOwnImage = (bild) => Boolean(bild && hasText(bild.src) && hasText(bild.alt) && /^\/newsletter\/[\w./-]+\.(?:jpe?g|png|webp|avif)$/i.test(bild.src));

/** Hat ein Block echten Inhalt? Leere Slots rendern nie. */
export function blockSichtbar(block) {
  if (!block || typeof block !== "object") return false;
  switch (block.typ) {
    case "brief":
      return Array.isArray(block.absaetze) && block.absaetze.some(hasText);
    case "neueStuecke":
      return Array.isArray(block.eintraege) && block.eintraege.some((e) => hasText(e?.name) && hasText(e?.text) && isOwnImage(e?.bild));
    case "skizze":
      return isOwnImage(block.bild) && hasText(block.text);
    case "termine":
      return Array.isArray(block.eintraege) && block.eintraege.some((e) => /^\d{4}-\d{2}-\d{2}$/.test(e?.datum || "") && hasText(e?.titel));
    case "gutZuWissen":
    case "arbeitsweise":
      return hasText(block.titel) && hasText(block.text);
    default:
      return false;
  }
}

/** Nur sichtbare Blöcke, in Reihenfolge; Einträge eines Slots ebenfalls gefiltert. */
export function sichtbareBloecke(ausgabe) {
  return (ausgabe?.bloecke || []).filter(blockSichtbar).map((b) => {
    if (b.typ === "neueStuecke") return { ...b, eintraege: b.eintraege.filter((e) => hasText(e?.name) && hasText(e?.text) && isOwnImage(e?.bild)) };
    if (b.typ === "termine") return { ...b, eintraege: b.eintraege.filter((e) => /^\d{4}-\d{2}-\d{2}$/.test(e?.datum || "") && hasText(e?.titel)) };
    return b;
  });
}

/** Leere Slots (für die Liste „offen beim Inhaber“). */
export function offeneSlots(ausgabe) {
  return (ausgabe?.bloecke || []).filter((b) => SLOT_TYPEN.includes(b.typ) && !blockSichtbar(b)).map((b) => b.typ);
}

/** Versandbereit: mindestens ein Slot gefüllt und mindestens zwei Inhaltsblöcke. */
export function versandbereit(ausgabe) {
  const sichtbar = sichtbareBloecke(ausgabe);
  const inhalt = sichtbar.filter((b) => INHALT_TYPEN.includes(b.typ));
  return sichtbar.some((b) => b.typ === "brief") && inhalt.some((b) => SLOT_TYPEN.includes(b.typ)) && inhalt.length >= 2;
}

/** Archiv: nur versendete und versandbereite Ausgaben, neueste zuerst. */
export function archivAusgaben(ausgaben = AUSGABEN, { vorschau = false } = {}) {
  return ausgaben
    .filter((a) => (vorschau ? true : Boolean(a.versendetAm) && versandbereit(a)))
    .slice()
    .sort((a, b) => String(b.slug).localeCompare(String(a.slug)));
}

export function ausgabeBySlug(slug, ausgaben = AUSGABEN) {
  return ausgaben.find((a) => a.slug === slug) || null;
}

const NAMEN = { neueStuecke: "neue Stücke in der Ausstellung", skizze: "Haralds Skizze des Monats", termine: "Termine", gutZuWissen: "ein Tipp" };

/** „In diesem Brief: neue Stücke in der Ausstellung, Haralds Skizze des Monats und Termine.“ */
export function inhaltZeile(ausgabe) {
  const teile = sichtbareBloecke(ausgabe)
    .filter((b) => NAMEN[b.typ])
    .map((b) => NAMEN[b.typ]);
  if (!teile.length) return "";
  const liste = teile.length === 1 ? teile[0] : `${teile.slice(0, -1).join(", ")} und ${teile[teile.length - 1]}`;
  return `In diesem Brief: ${liste}.`;
}

/** Preheader aus den sichtbaren Blöcken. */
export function preheader(ausgabe) {
  return inhaltZeile(ausgabe).replace(/^In diesem Brief: /, "").replace(/^./, (c) => c.toUpperCase());
}

const abs = (url) => (/^https?:/.test(url) ? url : `${SITE}${url}`);
const utm = (url, slug, cta) => {
  const u = abs(url);
  const sep = u.includes("?") ? "&" : "?";
  return `${u}${sep}utm_source=newsletter&utm_medium=email&utm_campaign=newsletter-${slug.replace("-", "")}&utm_content=${cta}`;
};
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const linkStyle = `color:${FARBEN.ink};text-decoration:underline`;

function blockHtml(b, slug) {
  switch (b.typ) {
    case "brief":
      return [
        ueberschrift(b.titel, 1),
        absatz("{{ anrede }},"),
        ...b.absaetze.map((t) => absatz(esc(t))),
        b._inhaltZeile ? absatz(esc(b._inhaltZeile)) : "",
        absatz(`Herzlich<br>${esc(b.absender)}`),
      ].join("\n");
    case "neueStuecke":
      return [
        haarlinie,
        overline(b.titel),
        ...b.eintraege.map(
          (e) =>
            `<img src="${abs(e.bild.src)}" alt="${esc(e.bild.alt)}" width="544" style="display:block;width:100%;max-width:544px;height:auto;margin:0 0 12px;border:0">` +
            ueberschrift(e.marke ? `${e.name} · ${e.marke}` : e.name, 3) +
            absatz(esc(e.text)) +
            (e.url ? absatz(`<a href="${utm(e.url, slug, "stueck")}" style="${linkStyle}">Im Showroom ansehen</a>`) : "")
        ),
      ].join("\n");
    case "skizze":
      return [
        haarlinie,
        overline(b.titel),
        `<img src="${abs(b.bild.src)}" alt="${esc(b.bild.alt)}" width="544" style="display:block;width:100%;max-width:544px;height:auto;margin:0 0 12px;border:0">`,
        b.titelSkizze ? ueberschrift(b.titelSkizze, 3) : "",
        absatz(esc(b.text)),
        b.projekt ? absatz(`<span style="color:${FARBEN.inkSoft}">${esc(b.projekt)}</span>`) : "",
      ].join("\n");
    case "termine":
      return [
        haarlinie,
        overline(b.titel),
        ...b.eintraege.map(
          (e) =>
            `<p style="margin:0 0 4px;font-family:Helvetica,Arial,sans-serif;font-size:14px;color:${FARBEN.brass}">${esc(e.datumLabel || e.datum)}</p>` +
            ueberschrift(e.titel, 3) +
            absatz(esc(e.text || "")) +
            (e.url ? knopf({ label: "Zur Anmeldung", url: utm(e.url, slug, "termin") }) : "")
        ),
      ].join("\n");
    case "gutZuWissen":
      return [
        haarlinie,
        ueberschrift(b.titel, 2),
        absatz(esc(b.text)),
        b.url ? absatz(`<a href="${utm(b.url, slug, "tipp")}" style="${linkStyle}">${esc(b.linkLabel || "Mehr dazu")}</a>`) : "",
      ].join("\n");
    case "arbeitsweise":
      return [
        haarlinie,
        ueberschrift(b.titel, 2),
        absatz(esc(b.text)),
        absatz(`<a href="${utm(b.url, slug, "arbeitsweise")}" style="${linkStyle}">${esc(b.linkLabel || "Mehr dazu")}</a>`),
      ].join("\n");
    default:
      return "";
  }
}

/**
 * HTML-Vorlage einer Ausgabe für den Versand (Frappe: Newsletter mit
 * Email Group, Platzhalter {{ anrede }}, {{ abmelde_url }},
 * {{ einwilligung_datum }}). Nur sichtbare Blöcke; höchstens ein Knopf.
 */
export function ausgabeMailHtml(ausgabe) {
  const bloecke = sichtbareBloecke(ausgabe);
  const zeile = inhaltZeile(ausgabe);
  let knopfDa = false;
  const teile = bloecke.map((b) => {
    if (b.typ === "brief") return blockHtml({ ...b, _inhaltZeile: zeile }, ausgabe.slug);
    let html = blockHtml(b, ausgabe.slug);
    // Nur der erste Knopf bleibt Knopf (Design-Bibel: ein Primärknopf).
    if (html.includes("<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" style=\"margin:8px 0 24px\">")) {
      if (knopfDa) html = html.replace(/<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px"><tr><td[^>]*><a href="([^"]+)"[^>]*>([^<]+)<\/a><\/td><\/tr><\/table>/g, (m, u, l) => absatz(`<a href="${u}" style="${linkStyle}">${l}</a>`));
      knopfDa = true;
    }
    return html;
  });
  return mailHtml({
    betreff: ausgabe.betreff,
    preheader: preheader(ausgabe),
    inhalt: teile.join("\n"),
    fusszeile: "A",
    kopf: `Post aus Lochau · ${ausgabe.monat}`,
  });
}

/** Datum "2026-11-05" → "5. November 2026". */
export function datumLang(iso) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(iso || ""))) return "";
  try {
    return new Intl.DateTimeFormat("de-AT", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T12:00:00Z`));
  } catch {
    return iso;
  }
}
