"""PH Kundenkarte Einstellungen (Single). Zertifikate/Schlüssel nie hier, nur in site_config.json (CONVENTIONS 14)."""

import frappe
from frappe.model.document import Document

CACHE = "ph_kundenkarte:einstellungen"

STANDARD = {
    "startstufe": None,
    "bewertungszeitraum_monate": 12,
    "herabstufung_erlaubt": 0,
    "umsatz_nur_mit_einwilligung": 1,
    "doi_pflicht": 1,
    "doi_gueltig_stunden": 48,
    "website_automatisch_annehmen": 1,
    "berater_standard": None,
    "bedingungen_version": None,
    "wallet_pass_type_id": None,
    "wallet_team_id": None,
    "wallet_organisation": "Platzhirsch",
    "wallet_google_class_suffix": "platzhirsch_kundenkarte",
    "wallet_origins": "https://platzhirsch.studio",
    "text_begruessung": None,
    "text_datenschutz_karte": "Die Karte ist personengebunden und hat keinen Geldwert. Informationen zum Datenschutz: platzhirsch.studio/datenschutz",
}

# site_config-Schlüssel (nur Namen; Werte werden nie gelesen außer im Wallet-Adapter, nie ausgegeben)
SCHLUESSEL = ("ph_wallet_apple_cert", "ph_wallet_apple_key", "ph_wallet_apple_wwdr", "ph_wallet_google_issuer_id", "ph_wallet_google_service_account")


class PHKundenkarteEinstellungen(Document):
    def validate(self):
        if (self.bewertungszeitraum_monate or 0) <= 0:
            self.bewertungszeitraum_monate = STANDARD["bewertungszeitraum_monate"]
        if (self.doi_gueltig_stunden or 0) <= 0:
            self.doi_gueltig_stunden = STANDARD["doi_gueltig_stunden"]
        self.umsatz_nur_mit_einwilligung = 1
        if not self.startstufe:
            self.startstufe = startstufe_ermitteln()

    def on_update(self):
        frappe.cache().delete_value(CACHE)


def startstufe_ermitteln():
    """Niedrigste aktive Stufe (Reihenfolge) oder None."""
    rows = frappe.get_all("PH Kundenkarte Stufe", filters={"aktiv": 1}, fields=["name"], order_by="reihenfolge asc", limit=1)
    return rows[0].name if rows else None


def einstellungen():
    """Alle Einstellungen als dict (gecacht), mit Standardwerten vor der ersten Speicherung."""
    werte = frappe.cache().get_value(CACHE)
    if werte is None:
        werte = dict(STANDARD)
        try:
            doc = frappe.get_single("PH Kundenkarte Einstellungen")
            for k in STANDARD:
                v = doc.get(k)
                if v not in (None, ""):
                    werte[k] = v
        except Exception:  # noqa: BLE001 – vor Migration noch keine Tabelle
            pass
        if not werte.get("startstufe"):
            try:
                werte["startstufe"] = startstufe_ermitteln()
            except Exception:  # noqa: BLE001
                pass
        frappe.cache().set_value(CACHE, werte)
    return werte


def wallet_konfiguriert(plattform):
    """True, wenn die nötigen site_config-Schlüssel vorhanden sind (Werte werden nicht zurückgegeben)."""
    if plattform == "apple":
        return all(frappe.conf.get(k) for k in ("ph_wallet_apple_cert", "ph_wallet_apple_key"))
    if plattform == "google":
        return all(frappe.conf.get(k) for k in ("ph_wallet_google_issuer_id", "ph_wallet_google_service_account"))
    return False
