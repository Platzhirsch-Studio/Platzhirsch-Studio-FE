// Fähigkeiten des Bereichs CRM (G-04, Q-A7): Was ph_crm/ph_microsoft (noch) nicht kann, zeigt die Oberfläche
// deaktiviert mit Ersatzweg – nie ein Knopf, der mit Fehler endet. Proben gegen die echten Signaturen in
// Backend-Import (Mock) bzw. getMeta (Frappe). Methoden mit Schreibwirkung gibt im Frappe-Modus der Betrieb frei
// (BACKOFFICE_FAEHIGKEITEN), lesende mit `get: true` werden probiert.

import { definiereFaehigkeiten } from "../faehigkeiten.js";

export const CRM_FAEHIGKEITEN = definiereFaehigkeiten("crm", {
  // E-Mails (Entscheidung Nr. 52)
  mails: { titel: "Nicht zugeordnete E-Mails aus Outlook", probe: { methode: "ph_microsoft.api.mails_unzugeordnet", get: true }, ersatz: { titel: "E-Mails in Outlook zuordnen" } },
  "mail-zuordnen": { titel: "E-Mail zuordnen", probe: { methode: "ph_microsoft.api.mail_zuordnen" }, ersatz: { titel: "in Outlook weiterleiten" } },
  "adresse-sperren": { titel: "Adresse sperren", probe: { methode: "ph_microsoft.api.adresse_sperren" }, ersatz: { titel: "Sperre unter Adressen und Sperren eintragen", href: "/d/ph-mail-adresse/neu" } },
  "kontakt-aus-mail": { titel: "Kontakt aus E-Mail anlegen", probe: { methode: "ph_microsoft.api.kontakt_aus_mail" }, ersatz: { titel: "Kontakt von Hand anlegen", href: "/crm/kontakte?neu=1" } },
  "mail-senden": { titel: "E-Mail aus dem eigenen Postfach", probe: { methode: "ph_microsoft.api.mail_senden" }, ersatz: { titel: "E-Mail in Outlook schreiben" } },
  // ph_crm
  kundenakte: { titel: "Kundenakte über alle Bereiche", probe: { methode: "ph_crm.api.kontakt.get_kundenakte", get: true }, erwartet: false },
  zeitleiste: { titel: "Zeitleiste der Kundenakte", probe: { methode: "ph_crm.api.kontakt.get_zeitleiste", get: true }, erwartet: false },
  dubletten: { titel: "Prüfung auf bestehende Kontakte", probe: { methode: "ph_crm.api.kontakt.find_duplicates", get: true }, ersatz: { titel: "Kontakt vorher in der Suche prüfen" } },
  slots: { titel: "Freie Zeiten", probe: { methode: "ph_crm.api.termin.get_freie_slots", get: true }, ersatz: { titel: "Zeit von Hand prüfen" } },
  zusammenfuehren: { titel: "Kontakte zusammenführen", probe: { methode: "ph_crm.api.kontakt.merge_kontakte" }, recht: { bereich: "crm", aktion: "cancel" }, ersatz: { titel: "Leitung bitten" } },
  anonymisieren: { titel: "Kontakt anonymisieren", probe: { methode: "ph_crm.api.kontakt.anonymize_kontakt" }, recht: { bereich: "crm", aktion: "cancel" } },
  // Anfragen an ph_crm/ph_faktura (§ 16), bis geliefert erwartet aber aus
  ruecktritt: { titel: "Rücktritt an die Faktura übergeben", probe: { doctype: "PH Ruecktritt" }, ersatz: { titel: "Kommentar und Aufgabe an die Faktura" } },
  "termin-dauer": { titel: "Dauer beim Verschieben ändern", probe: { doctype: "PH Termin", docmethode: "umbuchen_mit_dauer" }, erwartet: false },
  marketing: { titel: "Übergabe an Marketing", probe: { methode: "ph_marketing.api.zielgruppe_aus_crm" }, erwartet: false },
});

export default CRM_FAEHIGKEITEN;
