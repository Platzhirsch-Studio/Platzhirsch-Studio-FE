"""PH Sortiment Einstellungen (Single) – fachliche Schalter, gecacht."""

import frappe
from frappe.model.document import Document

CACHE = "ph_sortiment:einstellungen"
STANDARD = {
    "website_revalidate_aktiv": 1,
    "revalidate_drossel_sekunden": 60,
    "website_basis_url": "https://platzhirsch.studio",
    "api_cache_sekunden": 3600,
    "bild_max_px": 1600,
    "claim_guard_aktiv": 1,
    "preis_max_monate_verkaufspreis": 3,
    "preis_max_monate_uvp": 6,
    "preisliste_schwelle_prozent": 15,
    "ab_toleranz_preis_prozent": 0,
    "ab_toleranz_termin_tage": 0,
    "standard_lieferadresse": "Platzhirsch Home Living\nLandstraße 11\n6911 Lochau, Österreich",
    "bestell_druckformat": "PH Herstellerbestellung Standard",
    "eigene_gln": "",
}


class PHSortimentEinstellungen(Document):
    def validate(self):
        for k in ("preis_max_monate_verkaufspreis", "preis_max_monate_uvp", "api_cache_sekunden", "revalidate_drossel_sekunden"):
            if (self.get(k) or 0) < 0:
                frappe.throw(frappe._("{0} darf nicht negativ sein.").format(self.meta.get_label(k)))

    def on_update(self):
        frappe.cache().delete_value(CACHE)


def einstellungen():
    """Alle Werte als dict mit Standardwerten (auch ohne Site-Datensatz)."""
    werte = frappe.cache().get_value(CACHE)
    if werte is None:
        try:
            doc = frappe.get_single("PH Sortiment Einstellungen")
            werte = {k: (doc.get(k) if doc.get(k) not in (None, "") else v) for k, v in STANDARD.items()}
            for loc in ("de", "en", "fr", "it"):
                werte[f"standard_lieferzeit_text_{loc}"] = doc.get(f"standard_lieferzeit_text_{loc}") or ""
        except Exception:  # noqa: BLE001 – vor der Installation / in Tests ohne Single
            werte = dict(STANDARD)
        frappe.cache().set_value(CACHE, werte, expires_in_sec=600)
    return werte


def max_monate():
    e = einstellungen()
    return {"Verkaufspreis": e["preis_max_monate_verkaufspreis"], "Angebot": e["preis_max_monate_verkaufspreis"], "UVP": e["preis_max_monate_uvp"], "Herstellerpreis": e["preis_max_monate_uvp"]}
