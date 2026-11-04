import frappe
from frappe.model.document import Document

CACHE = "ph_service:einstellungen"

STANDARD = {
    "gewaehrleistung_monate": 24,
    "verjaehrung_monate": 3,
    "fristwarnung_tage": 60,
    "vermutung_verbraucher_monate": 12,
    "vermutung_unternehmer_monate": 6,
    "regress_monate": 2,
    "reaktion_werktage": 2,
    "eskalation_tage": 5,
    "eskalation_an": None,
    "kulanz_schwelle_cent": 50000,
    "standard_prioritaet": "Normal",
    "techniker_standard": None,
    "ersatzteil_bestand_fuehren": 1,
    "ersatzteil_lagerort": None,
    "mindestbestand_warnung": 1,
    "vorlage_eingang": "PH Service Eingangsbestätigung",
    "vorlage_termin": "PH Service Terminvorschlag",
    "vorlage_abschluss": "PH Service Abschluss",
    "vorlage_wartung": "PH Service Wartungserinnerung",
    "vorlage_regress": "PH Service Regressmeldung",
    "mail_automatisch": 0,
    "erinnerung_tage_vorher": 42,
    "wartung_karenz_tage": 14,
    "nachkauf_tage_nach": 14,
    "portal_sichtbar_standard": 1,
    "portal_fotos_max": 8,
    "portal_foto_max_mb": 10,
}


class PHServiceEinstellungen(Document):
    def validate(self):
        for feld in ("gewaehrleistung_monate", "fristwarnung_tage", "reaktion_werktage", "eskalation_tage", "erinnerung_tage_vorher"):
            if (self.get(feld) or 0) < 0:
                self.set(feld, STANDARD[feld])
        self.verjaehrung_monate = 3
        self.regress_monate = 2

    def on_update(self):
        frappe.cache().delete_value(CACHE)


def einstellungen():
    """Alle Einstellungen als dict (gecacht), mit Standardwerten vor der ersten Speicherung."""
    werte = frappe.cache().get_value(CACHE)
    if werte is None:
        werte = dict(STANDARD)
        try:
            doc = frappe.get_single("PH Service Einstellungen")
            for k in STANDARD:
                v = doc.get(k)
                if v not in (None, ""):
                    werte[k] = v
        except Exception:  # noqa: BLE001 – vor Migration noch keine Tabelle
            pass
        frappe.cache().set_value(CACHE, werte)
    return werte
