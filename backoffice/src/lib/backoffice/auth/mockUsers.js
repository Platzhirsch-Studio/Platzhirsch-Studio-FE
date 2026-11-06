// Demo-Benutzer des Mock-Adapters – eine Person je Rolle (keine echten Personen).
// Passwort für alle: BACKOFFICE_MOCK_PASSWORD (Dev-Rückfall "demo").
// PIN (4–6-stellig) nur für den schnellen Bedienerwechsel an Kassa/Packtisch
// (Entscheidung Nr. 49); im Frappe-Modus kommt sie später aus einem eigenen Feld.
// Reines Modul.

export const DEMO_DOMAIN = "demo.local";

export const DEMO_BENUTZER = [
  { email: "gf@demo.local", name: "Max Muster (Geschäftsführung)", roles: ["PH Geschäftsführung"], pin: "1111", standort: "Lochau" },
  { email: "admin@demo.local", name: "Erika Beispiel (Admin)", roles: ["PH Backoffice-Admin", "System Manager"], pin: "2222", standort: "Lochau" },
  { email: "crm@demo.local", name: "Anna Probe (CRM)", roles: ["PH CRM Mitarbeiter"], pin: "3301", standort: "Lochau" },
  { email: "crm-leitung@demo.local", name: "Lukas Testner (CRM-Leitung)", roles: ["PH CRM Leitung", "PH CRM Mitarbeiter"], pin: "3302", standort: "Lochau" },
  { email: "sortiment@demo.local", name: "Maria Vorlage (Sortiment)", roles: ["PH Sortiment Leitung", "PH Sortiment Mitarbeiter"], pin: "3401", standort: "Lochau" },
  { email: "projekte@demo.local", name: "Paul Schema (Projekte)", roles: ["PH Projekte Leitung", "PH Projekte Mitarbeiter"], pin: "3501", standort: "Lochau" },
  { email: "shop@demo.local", name: "Lena Demo (Shop)", roles: ["PH Shop Mitarbeiter"], pin: "3601", standort: "Lochau" },
  { email: "faktura@demo.local", name: "Jonas Muster (Faktura)", roles: ["PH Faktura Leitung", "PH Faktura Mitarbeiter"], pin: "3701", standort: "Lochau" },
  { email: "logistik@demo.local", name: "Sophie Beispiel (Logistik)", roles: ["PH Logistik Mitarbeiter"], pin: "3801", standort: "Lochau" },
  { email: "personal@demo.local", name: "Felix Probe (Personal)", roles: ["PH Personal Leitung", "PH Personal Mitarbeiter"], pin: "3901", standort: "Lochau" },
  { email: "marketing@demo.local", name: "Laura Testner (Marketing)", roles: ["PH Marketing Mitarbeiter"], pin: "4001", standort: "Lochau" },
  { email: "kassa@demo.local", name: "David Vorlage (Kassa)", roles: ["PH Kassa Mitarbeiter"], pin: "4101", standort: "Lochau" },
  { email: "kassa-leitung@demo.local", name: "Julia Schema (Kassa-Leitung)", roles: ["PH Kassa Leitung", "PH Kassa Mitarbeiter"], pin: "4102", standort: "Lochau" },
  { email: "service@demo.local", name: "Simon Demo (Service)", roles: ["PH Service Mitarbeiter"], pin: "4201", standort: "Lochau" },
  { email: "kundenkarte@demo.local", name: "Clara Muster (Kundenkarte)", roles: ["PH Kundenkarte Mitarbeiter"], pin: "4301", standort: "Lochau" },
  { email: "montage@demo.local", name: "Tobias Beispiel (Montage)", roles: ["PH Montage"], pin: "4401", standort: "Lochau" },
  { email: "techniker@demo.local", name: "Max Probe (Techniker)", roles: ["PH Techniker"], pin: "4501", standort: "Lochau" },
  { email: "buchhaltung@demo.local", name: "Erika Testner (Buchhaltung extern)", roles: ["PH Buchhaltung extern"], pin: "4601", standort: "extern" },
  { email: "selbst@demo.local", name: "Anna Vorlage (Selbstservice)", roles: ["PH Personal Selbstservice"], pin: "4701", standort: "Lochau" },
];

export function demoBenutzer(email) {
  const e = String(email || "").trim().toLowerCase();
  return DEMO_BENUTZER.find((u) => u.email === e) || null;
}

/** Benutzer eines Standorts für den Bedienerwechsel (ohne PIN!). */
export function benutzerAmStandort(standort = "Lochau") {
  return DEMO_BENUTZER.filter((u) => u.standort === standort).map(({ email, name, roles }) => ({ email, name, roles }));
}
