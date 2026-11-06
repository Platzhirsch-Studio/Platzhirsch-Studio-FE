// Bereich E-Mails (Slug „posteingang“) – Register-Eintrag (G-01, MASTER § 3.5). Schreibt: Team B-MAI (App ph_microsoft).
// Entscheidung Nr. 52: Nur Mails mit eindeutig einem Kontakt zugeordneter Adresse kommen automatisch in die
// Kundenakte. Alle anderen bleiben in Outlook und werden nicht gespeichert; die Postfach-Berechtigten ordnen sie
// aus einer Live-Liste (ph_microsoft.api.mails_unzugeordnet) einem Kunden oder Vorgang zu, legen einen Kontakt an
// oder sperren die Adresse. Sichtbarer Titel ohne das Wort „Posteingang“ (10-konzept-crm § 15: Wort gestrichen).
// `routen`: { "PH …": (name) => href } – name fehlt → Liste; sobald eingetragen, leitet /d/<slug>/… mit 307 hierher.

/** @type {import("./index.js").BereichDefinition} */
const eintrag = {
  slug: "posteingang",
  titel: "E-Mails",
  icon: "Inbox",
  app: "ph_microsoft",
  module: ["PH Microsoft"],
  rollenName: null,
  // PH Mail Adresse (Zuordnungen, Sperrliste) dürfen laut DocType zusätzlich CRM-Mitarbeiter und -Leitung pflegen.
  // Welche Postfächer jemand sieht, entscheidet Frappe über die Berechtigten des PH Postfach.
  rollen: {
    "PH CRM Mitarbeiter": "mitarbeiter",
    "PH CRM Leitung": "mitarbeiter",
  },
  startseite: "/posteingang",
  doctypes: ["PH Mail Adresse", "PH Postfach", "PH Kalender Zuordnung", "PH Sync Protokoll", "PH Graph Abo", "PH Graph Verknuepfung", "PH Microsoft Einstellungen"],
  navigation: [
    { titel: "Nicht zugeordnet", href: "/posteingang", icon: "Inbox" },
    { titel: "Adressen und Sperren", href: "/d/ph-mail-adresse", doctype: "PH Mail Adresse" },
    // Postfächer, Kalender und Abgleich pflegen laut DocType nur Admin und Geschäftsführung (lesend).
    { titel: "Postfächer", href: "/d/ph-postfach", doctype: "PH Postfach", recht: "export" },
    { titel: "Kalender", href: "/d/ph-kalender-zuordnung", doctype: "PH Kalender Zuordnung", recht: "export" },
    { titel: "Abgleich", href: "/d/ph-sync-protokoll", doctype: "PH Sync Protokoll", recht: "export" },
  ],
  routen: {},
};

export default eintrag;
