import frappe
from frappe import _
from frappe.model.document import Document

CACHE = "ph_kassa:einstellungen"


class PHKassaEinstellungen(Document):
    def validate(self):
        if self.bondrucker_modus == "ESC-POS Druckserver" and not (self.druckserver_url or "").startswith(("http://", "https://")):
            frappe.throw(_("Druckserver-URL muss mit http:// oder https:// beginnen."))
        if (self.differenz_toleranz_cent or 0) < 0:
            frappe.throw(_("Toleranz darf nicht negativ sein."))
        if (self.barverkauf_rechnung_ab_cent or 0) < 0:
            frappe.throw(_("Betragsgrenze darf nicht negativ sein."))

    def on_update(self):
        frappe.cache().delete_value(CACHE)


def einstellungen() -> dict:
    """Gecachte Einstellungen als dict (Kassa-Page, Druck, Terminal)."""
    data = frappe.cache().get_value(CACHE)
    if not data:
        doc = frappe.get_cached_doc("PH Kassa Einstellungen")
        data = {
            "standard_kasse": doc.standard_kasse,
            "standard_steuersatz": doc.standard_steuersatz or "Normal 20",
            "steuersatz_anzahlung": doc.steuersatz_anzahlung or "Normal 20",
            "gutschein_art": doc.gutschein_art or "Mehrzweck",
            "trainings_banner_text": doc.trainings_banner_text or "TRAININGSMODUS",
            "trinkgeld_erfassen": int(doc.trinkgeld_erfassen or 0),
            "barverkauf_rechnung_ab_cent": int(doc.barverkauf_rechnung_ab_cent or 40000),
            "bondrucker_modus": doc.bondrucker_modus or "PDF 80 mm",
            "druckserver_url": doc.druckserver_url,
            "qz_drucker_name": doc.qz_drucker_name,
            "bon_breite_zeichen": int(doc.bon_breite_zeichen or 42),
            "automatisch_drucken": int(doc.automatisch_drucken or 0),
            "schublade_oeffnen": int(doc.schublade_oeffnen or 0),
            "bon_kopfzeile": doc.bon_kopfzeile,
            "bon_fusstext": doc.bon_fusstext,
            "kundendisplay_aktiv": int(doc.kundendisplay_aktiv or 0),
            "kundendisplay_text": doc.kundendisplay_text or "Willkommen bei Platzhirsch",
            "beleg_email_betreff": doc.beleg_email_betreff or "Ihr Beleg von Platzhirsch",
            "beleg_email_kopie_an": doc.beleg_email_kopie_an,
            "differenz_toleranz_cent": int(doc.differenz_toleranz_cent or 0),
            "abschluss_unterschrift_pflicht": int(doc.abschluss_unterschrift_pflicht or 0),
            "abschluss_nullbeleg_automatisch": int(doc.abschluss_nullbeleg_automatisch or 0),
            "terminal_testmodus": int(doc.terminal_testmodus if doc.terminal_testmodus is not None else 1),
        }
        frappe.cache().set_value(CACHE, data)
    return data
