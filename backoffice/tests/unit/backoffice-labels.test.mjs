// Anzeige-Labels: Umlaute aus Umschreibungen, DocType-Namen, technische Beschreibungen.
import test from "node:test";
import assert from "node:assert/strict";
import { anzeige, doctypeLabel, hilfetext, istTechnisch, rollenLabel } from "../../src/lib/backoffice/labels.js";

test("anzeige: Umschreibungen werden Umlaute", () => {
  assert.equal(anzeige("Beratungsgespraech"), "Beratungsgespräch");
  assert.equal(anzeige("Verfuegbarkeit"), "Verfügbarkeit");
  assert.equal(anzeige("Geprueft"), "Geprüft");
  assert.equal(anzeige("Bestaetigt"), "Bestätigt");
  assert.equal(anzeige("Unbestaetigt"), "Unbestätigt");
  assert.equal(anzeige("Veroeffentlicht"), "Veröffentlicht");
  assert.equal(anzeige("Uebergeben"), "Übergeben");
  assert.equal(anzeige("Zurueckgezogen"), "Zurückgezogen");
  assert.equal(anzeige("Ueberfaellig"), "Überfällig");
  assert.equal(anzeige("Kueche"), "Küche");
  assert.equal(anzeige("Buero"), "Büro");
  assert.equal(anzeige("Geschaeftsfuehrung"), "Geschäftsführung");
  assert.equal(anzeige("Mit Maengeln"), "Mit Mängeln");
  assert.equal(anzeige("Termin_vereinbart"), "Termin vereinbart");
  assert.equal(anzeige("Website-Slug (path_field)"), "Website-Slug");
  assert.equal(anzeige("Slug / path_field"), "Slug");
  assert.equal(anzeige("utm_source"), "utm source");
});

test("anzeige: Ausnahmen bleiben unverändert", () => {
  for (const w of ["Quelle", "Steuer", "Vorsteuer", "Steuersatz", "Dauer", "Neue", "erneuern", "manuell", "Aktuelle", "Sequenz", "Queue", "Querverweise", "AES", "Michael", "zuerst", "Bauer", "Feuer"]) {
    assert.equal(anzeige(w), w, w);
  }
  assert.equal(anzeige(""), "");
  assert.equal(anzeige(null), "");
  assert.equal(anzeige("Schöne Grüße"), "Schöne Grüße");
});

test("doctypeLabel und rollenLabel ohne PH-Präfix", () => {
  assert.equal(doctypeLabel("PH Beratungsgespraech"), "Beratungsgespräch");
  assert.equal(doctypeLabel("PH Auftragsbestaetigung"), "Auftragsbestätigung");
  assert.equal(doctypeLabel("User"), "Benutzer");
  assert.equal(doctypeLabel("DocType"), "Dokumentart");
  assert.equal(rollenLabel("PH Geschäftsführung"), "Geschäftsführung");
});

test("hilfetext: technische Beschreibungen werden nicht angezeigt", () => {
  assert.equal(hilfetext("Muster-DocType für alle PH-Apps."), null);
  assert.equal(hilfetext("Wird aus utm_campaign im Herkunftsblock gesetzt (ph_marketing.ereignisse)."), null);
  assert.equal(hilfetext("Website-Slug (path_field)"), null);
  assert.equal(hilfetext("PH Termin, PH Projekt oder PH Angebot – gesetzt von den Buttons."), null);
  assert.equal(hilfetext("siehe src/lib/upload/frappeAdapter.js"), null);
  assert.equal(hilfetext("Wird aus Art und Name gebildet."), "Wird aus Art und Name gebildet.");
  assert.equal(hilfetext("Einfamilienhaus, Wohnung, Gewerbe …"), "Einfamilienhaus, Wohnung, Gewerbe …");
  assert.equal(hilfetext(""), null);
  assert.equal(istTechnisch("Setzt der Workflow. Kanban-Spalten = diese Werte."), true);
});
