"""PH Projekt Dokument – Datei mit Kategorie, Version und Portal-Freigabe (elektronische Hängemappe)."""

import mimetypes

import frappe
from frappe.model.document import Document
from frappe.utils import now_datetime, nowdate

from ph_projekte.ph_projekte.helfer import projekt_kontakt


class PHProjektDokument(Document):
    def before_insert(self):
        if not self.status:
            self.status = "Entwurf"
        if not self.datum:
            self.datum = nowdate()
        if not self.version:
            self.version = 1

    def validate(self):
        if not self.kontakt and self.projekt:
            self.kontakt = projekt_kontakt(self.projekt)
        self.titel = (self.titel or "").strip()
        if self.datei:
            self._datei_meta()
        if self.kunde_sichtbar and self.status == "Entwurf":
            self.status = "Freigegeben"
        if self.kunde_sichtbar and not self.portal_freigabe_am:
            self.portal_freigabe_am = now_datetime()
            self.portal_freigabe_von = frappe.session.user
        if not self.kunde_sichtbar and self.status == "Freigegeben":
            self.status = "Entwurf"

    def _datei_meta(self):
        f = frappe.db.get_value("File", {"file_url": self.datei}, ["name", "file_name", "file_size", "is_private"], as_dict=True)
        if f:
            self.dateiname = f.file_name
            self.groesse = f.file_size
            if not f.is_private:
                try:
                    datei = frappe.get_doc("File", f.name)
                    datei.is_private = 1
                    datei.save(ignore_permissions=True)
                    self.datei = datei.file_url
                except Exception:  # noqa: BLE001
                    frappe.log_error(title="PH Projekt Dokument: Datei konnte nicht privat gestellt werden")
        self.mime = mimetypes.guess_type(self.dateiname or self.datei or "")[0] or "application/octet-stream"

    @frappe.whitelist()
    def portal_freigeben(self, freigeben=1):
        self.check_permission("write")
        if int(freigeben):
            self.db_set({"kunde_sichtbar": 1, "status": "Freigegeben", "portal_freigabe_am": now_datetime(), "portal_freigabe_von": frappe.session.user})
        else:
            self.db_set({"kunde_sichtbar": 0, "status": "Entwurf"})
        return self.status

    @frappe.whitelist()
    def neue_version(self, datei):
        self.check_permission("write")
        neu = frappe.copy_doc(self)
        neu.datei = datei
        neu.version = (self.version or 1) + 1
        neu.vorgaenger = self.name
        neu.status = "Entwurf"
        neu.kunde_sichtbar = 0
        neu.portal_freigabe_am = None
        neu.portal_freigabe_von = None
        neu.insert()
        self.db_set("status", "Archiviert")
        if self.kunde_sichtbar:
            self.db_set("kunde_sichtbar", 0)
        return neu.name


def dokument_aus_beleg(projekt, titel, kategorie, datei_url, referenz_doctype=None, referenz_name=None, kunde_sichtbar=0):
    """Für andere Apps (ph_faktura: Angebot/AB/Rechnung-PDF in die Auftragsmappe legen)."""
    return frappe.get_doc(
        {
            "doctype": "PH Projekt Dokument",
            "projekt": projekt,
            "titel": titel,
            "kategorie": kategorie,
            "datei": datei_url,
            "referenz_doctype": referenz_doctype,
            "referenz_name": referenz_name,
            "kunde_sichtbar": kunde_sichtbar,
            "quelle": "system",
        }
    ).insert(ignore_permissions=True)
