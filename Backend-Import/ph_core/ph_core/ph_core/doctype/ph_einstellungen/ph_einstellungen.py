import frappe
from frappe import _
from frappe.model.document import Document


class PHEinstellungen(Document):
    def validate(self):
        if (self.api_rate_limit_pro_minute or 0) < 1:
            frappe.throw(_("Ratenbegrenzung muss mindestens 1 je Minute sein."))
        for feld in ("api_rate_limit_gast_pro_minute", "api_rate_limit_gesamt_pro_minute"):
            if (self.get(feld) or 0) < 0:
                self.set(feld, 0)
        if (self.api_idempotenz_tage or 0) < 1:
            self.api_idempotenz_tage = 7
        if (self.api_protokoll_aufbewahrung_tage or 0) < 7:
            frappe.throw(_("API-Protokoll mindestens 7 Tage aufbewahren."))
        if (self.get("website_revalidate_drossel_sekunden") or 0) < 1:
            self.website_revalidate_drossel_sekunden = 30
        name = (self.get("website_revalidate_secret_name") or "").strip()
        if name and not name.startswith("ph_"):
            frappe.throw(_("Schlüsselname muss mit ph_ beginnen (nur der Name, nie der Wert)."))
        self.website_revalidate_secret_name = name or "ph_website_revalidate_secret"
        gesehen = set()
        for z in self.get("betriebsruhe") or []:
            if z.datum in gesehen:
                frappe.throw(_("Betriebsruhe: Datum {0} doppelt.").format(frappe.utils.formatdate(z.datum)))
            gesehen.add(z.datum)

    def on_update(self):
        frappe.cache().delete_value("ph_core:einstellungen")


def einstellungen():
    """Gecachte Einstellungen als dict (für API-Decorator, Jinja, Mail, Website-Revalidate)."""
    data = frappe.cache().get_value("ph_core:einstellungen")
    if not data:
        doc = frappe.get_cached_doc("PH Einstellungen")
        data = {
            "standard_firma": doc.standard_firma,
            "website_url": doc.website_url,
            "testmodus": int(doc.testmodus or 0),
            "api_aktiv": int(doc.api_aktiv or 0),
            "api_rate_limit_pro_minute": int(doc.api_rate_limit_pro_minute or 120),
            "api_rate_limit_gast_pro_minute": int(doc.get("api_rate_limit_gast_pro_minute") if doc.get("api_rate_limit_gast_pro_minute") is not None else 600),
            "api_rate_limit_gesamt_pro_minute": int(doc.get("api_rate_limit_gesamt_pro_minute") if doc.get("api_rate_limit_gesamt_pro_minute") is not None else 2400),
            "api_idempotenz_tage": int(doc.api_idempotenz_tage or 7),
            "api_protokoll_aufbewahrung_tage": int(doc.api_protokoll_aufbewahrung_tage or 90),
            "api_protokoll_nutzdaten": int(doc.api_protokoll_nutzdaten or 0),
            "website_revalidate_aktiv": int(doc.get("website_revalidate_aktiv") if doc.get("website_revalidate_aktiv") is not None else 1),
            "website_revalidate_drossel_sekunden": int(doc.get("website_revalidate_drossel_sekunden") or 30),
            "website_revalidate_secret_name": doc.get("website_revalidate_secret_name") or "ph_website_revalidate_secret",
            "feiertage_bundesland": doc.get("feiertage_bundesland") or "Vorarlberg",
            "team_email": doc.team_email,
            "fehler_email": doc.fehler_email,
        }
        frappe.cache().set_value("ph_core:einstellungen", data)
    return data
