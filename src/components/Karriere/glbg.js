// GlBG-Sperre für Stelleninserate (Rat 9,5 A13, QA Recht −0,1).
//
// § 9 Abs 2 Gleichbehandlungsgesetz: Ein Stelleninserat muss das für den
// Arbeitsplatz geltende kollektivvertragliche oder gesetzliche Mindestentgelt
// nennen und auf eine allfällige Bereitschaft zur Überzahlung hinweisen
// (Verwaltungsstrafe bis 360 €). Das Feld `salary` aus dem Backoffice ist
// optional – eine Stelle ohne Entgeltangabe würde die Pflicht verletzen.
// Regel: Eine Stelle wird nur veröffentlicht (Liste, Detailseite, JobPosting,
// statische Pfade, Sitemap), wenn sie eine Entgeltangabe hat:
//   - Backoffice-Stelle: `salary` enthält einen Betrag mit Ziffer,
//   - statische Stelle (src/lib/karriere/stellen.js): `entgelt` vollständig
//     (KV-Mindestbrutto, Zeitraum, Kollektivvertrag, Überzahlung).
// Den Wortlaut zur Überzahlung pflegt das Backoffice im Gehaltsfeld bzw. in
// der Beschreibung (z. B. „Bereitschaft zur Überzahlung je nach Qualifikation“).
//
// Vorschau (Inhaber-Auftrag 31.10.2026): Im Dev-Server bzw. mit
// KARRIERE_PREVIEW=1 erscheinen auch gesperrte Stellen – mit sichtbarer
// Markierung „Gehaltsangabe fehlt – nicht veröffentlichbar“, noindex, ohne
// JobPosting, nicht in der Sitemap. In Produktion: nur veröffentlichbare.
// Rein, ohne "@/": tests/unit/rat95-recht-karriere.test.mjs prüft direkt.
import { entgeltVollstaendig } from "../../lib/karriere/stellen.js";

/** Hat die Stelle eine Entgeltangabe mit Betrag? */
export function hasSalary(job) {
  if (job?.entgelt && typeof job.entgelt === "object") return entgeltVollstaendig(job.entgelt);
  const value = job?.salary;
  if (typeof value === "number") return Number.isFinite(value) && value > 0;
  return typeof value === "string" && /\d/.test(value);
}

/** Darf die Stelle öffentlich erscheinen? Aktiv und mit Entgeltangabe. */
export function publishableJob(job) {
  return job?.status === "Aktiv" && hasSalary(job);
}

/** Nur veröffentlichbare Stellen. */
export function publishableJobs(jobs) {
  return (Array.isArray(jobs) ? jobs : []).filter(publishableJob);
}

/** Vorschaumodus: Entwicklung oder KARRIERE_PREVIEW=1 beim Start/Build. */
export function karriereVorschau({ nodeEnv = process.env.NODE_ENV, preview = process.env.KARRIERE_PREVIEW } = {}) {
  return nodeEnv !== "production" || preview === "1";
}

/** Darf die Stelle in diesem Modus angezeigt werden (Vorschau: auch gesperrt)? */
export function visibleJob(job, vorschau = karriereVorschau()) {
  return vorschau ? job?.status === "Aktiv" : publishableJob(job);
}

/** Stellen, die in diesem Modus angezeigt werden. */
export function visibleJobs(jobs, vorschau = karriereVorschau()) {
  return (Array.isArray(jobs) ? jobs : []).filter((j) => visibleJob(j, vorschau));
}

/** Angaben, die vor der Veröffentlichung fehlen (Schlüssel, siehe karriere/texte.js). */
export function fehlendeAngaben(job) {
  const fehlt = [];
  if (!hasSalary(job)) fehlt.push("entgelt");
  if (job?.statisch) {
    if (!job.ausmass) fehlt.push("ausmass");
    if (!job.start) fehlt.push("start");
    fehlt.push("leistungen");
  }
  return fehlt;
}
