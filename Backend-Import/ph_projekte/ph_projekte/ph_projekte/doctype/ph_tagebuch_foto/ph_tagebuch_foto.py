"""PH Tagebuch Foto – Bautagebuch je Phase (Spec platzhirsch-frappe-service/tagebuch/README.md)."""

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import now_datetime

from ph_projekte.ph_projekte.helfer import projekt_kontakt
from ph_projekte.utils.portal import FOTO_ID_RE, REFERENZ_AKTIV, TAGEBUCH_ECHT_PFLICHT, neue_foto_id


class PHTagebuchFoto(Document):
    def before_insert(self):
        if not self.foto_id:
            self.foto_id = neue_foto_id()
        if not self.hochgeladen_am:
            self.hochgeladen_am = now_datetime()
        if not self.kontakt and self.projekt:
            self.kontakt = projekt_kontakt(self.projekt)
        if not self.autor:
            self.autor = (frappe.db.get_value("User", frappe.session.user, "first_name") or "Team") + " (Platzhirsch)" if self.von == "team" else "Kunde"
        if self.von == "team":
            maximum = frappe.db.get_single_value("PH Projekte Einstellungen", "max_fotos_je_projekt") or 120
            if frappe.db.count("PH Tagebuch Foto", {"projekt": self.projekt}) >= int(maximum):
                frappe.throw(_("Höchstens {0} Fotos je Projekt.").format(maximum))

    def validate(self):
        if not FOTO_ID_RE.match(self.foto_id or ""):
            frappe.throw(_("Foto-ID muss dem Muster f-xxxxxxxxxx entsprechen."))
        if self.phase in TAGEBUCH_ECHT_PFLICHT and not self.echt_bestaetigt:
            frappe.throw(_("Handzeichnung und Modell nur als echtes Original – bitte bestätigen."))
        if self.phase == "skizze" and not self.urheber:
            self.urheber = "Harald Menghin"
        elif self.phase == "modell" and not self.urheber:
            self.urheber = "Platzhirsch Home Living"
        if not self.titel:
            self.titel = f"{self.phase} {self.hochgeladen_am or ''}"[:140]
        if self.bild:
            self._privat_halten()

    def _privat_halten(self):
        try:
            f = frappe.db.get_value("File", {"file_url": self.bild}, ["name", "is_private"], as_dict=True)
            if f and not f.is_private:
                datei = frappe.get_doc("File", f.name)
                datei.is_private = 1
                datei.save(ignore_permissions=True)
                self.bild = datei.file_url
        except Exception:  # noqa: BLE001
            frappe.log_error(title="PH Tagebuch Foto: Bild konnte nicht privat gestellt werden")

    def on_trash(self):
        aktiv = frappe.get_all("PH Referenz Bild", filters={"foto": self.name, "parenttype": "PH Referenz"}, fields=["parent"])
        for z in aktiv:
            if frappe.db.get_value("PH Referenz", z.parent, "status") in REFERENZ_AKTIV:
                frappe.throw(_("Dieses Foto ist Teil der Referenz-Freigabe {0}. Bitte zuerst widerrufen.").format(z.parent))
        for name in frappe.get_all("File", filters={"attached_to_doctype": self.doctype, "attached_to_name": self.name}, pluck="name"):
            frappe.delete_doc("File", name, ignore_permissions=True, force=True)
