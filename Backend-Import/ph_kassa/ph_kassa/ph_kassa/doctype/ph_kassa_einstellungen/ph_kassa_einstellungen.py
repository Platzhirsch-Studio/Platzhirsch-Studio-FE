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
        if (self.barverkauf_rechnung_ab_cent or 0) > 40000:
            frappe.throw(_("Über 400 € brutto ist eine Kleinbetragsrechnung nicht zulässig (§ 11 Abs 6 UStG) – Grenze höchstens 40000 Cent."))
        if self.chf_annahme_aktiv and not (self.chf_kurs_mikro and self.chf_kurs_datum):
            frappe.throw(_("CHF-Annahme braucht Kurs und Kursdatum."))

    def on_update(self):
        frappe.cache().delete_value(CACHE)


def _int(doc, feld, standard):
    wert = doc.get(feld)
    return int(standard if wert in (None, "") else wert)


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
            # Regeln/Grenzen (50-backend-luecken-kassa-faktura.md)
            "storno_mitarbeiter_bis_cent": _int(doc, "storno_mitarbeiter_bis_cent", 0),
            "rabatt_freigabe_ab_promille": _int(doc, "rabatt_freigabe_ab_promille", 100),
            "retoure_bar_nur_leitung": _int(doc, "retoure_bar_nur_leitung", 1),
            "retoure_standard": doc.get("retoure_standard") or "Gutschein",
            "bar_identitaet_ab_cent": _int(doc, "bar_identitaet_ab_cent", 1000000),
            "uid_empfaenger_ab_cent": _int(doc, "uid_empfaenger_ab_cent", 1000000),
            "anzahlungsrechnung_automatisch": _int(doc, "anzahlungsrechnung_automatisch", 1),
            "tageswechsel_uhrzeit": str(doc.get("tageswechsel_uhrzeit") or "00:00:00"),
            "karte_automatisch_buchen": _int(doc, "karte_automatisch_buchen", 1),
            "terminal_warnung_s": _int(doc, "terminal_warnung_s", 60),
            "terminal_timeout_s": _int(doc, "terminal_timeout_s", 180),
            "differenz_warnung_cent": _int(doc, "differenz_warnung_cent", 5000),
            "kundendisplay_anrede": _int(doc, "kundendisplay_anrede", 0),
            "chf_annahme_aktiv": _int(doc, "chf_annahme_aktiv", 0),
            "chf_kurs_mikro": _int(doc, "chf_kurs_mikro", 0),
            "chf_kurs_datum": str(doc.get("chf_kurs_datum") or "") or None,
            "chf_kurs_max_alter_tage": _int(doc, "chf_kurs_max_alter_tage", 1),
        }
        frappe.cache().set_value(CACHE, data)
    return data
