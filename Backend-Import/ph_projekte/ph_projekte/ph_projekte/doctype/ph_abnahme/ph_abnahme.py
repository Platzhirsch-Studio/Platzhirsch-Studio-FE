"""PH Abnahme – Übergabe-/Abnahmeprotokoll mit Mängeln. Status setzt der Workflow „PH Abnahme“
(Entwurf → Unterzeichnet → Mit Maengeln → Abgeschlossen)."""

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import formatdate, now_datetime

from ph_projekte.ph_projekte.helfer import projekt_kontakt


class PHAbnahme(Document):
    def before_insert(self):
        if not self.status:
            self.status = "Entwurf"

    def validate(self):
        if not self.kontakt and self.projekt:
            self.kontakt = projekt_kontakt(self.projekt)
        if self.montageauftrag and frappe.db.get_value("PH Montageauftrag", self.montageauftrag, "projekt") != self.projekt:
            frappe.throw(_("Der Montageauftrag gehört nicht zu diesem Projekt."))
        for p in self.positionen:
            if p.zustand in ("Mangel", "Nacharbeit") and not (p.beschreibung or "").strip():
                frappe.throw(_("Position „{0}“: Mangel/Nacharbeit braucht eine Beschreibung.").format(p.bezeichnung))
            if p.erledigt and not p.erledigt_am:
                p.erledigt_am = now_datetime().date()
        self.maengel_offen = sum(1 for p in self.positionen if p.zustand in ("Mangel", "Nacharbeit") and not p.erledigt)
        if self.status in ("Unterzeichnet", "Mit Maengeln", "Abgeschlossen") and not self.unterschrift_kunde:
            frappe.throw(_("Ohne Unterschrift des Kunden kann das Protokoll nicht unterzeichnet werden."))
        if self.status == "Abgeschlossen" and self.maengel_offen:
            frappe.throw(_("Es sind noch {0} Mängel offen.").format(self.maengel_offen))
        if self.unterschrift_kunde and not self.unterzeichnet_am:
            self.unterzeichnet_am = now_datetime()
        if self.status == "Abgeschlossen" and not self.abgeschlossen_am:
            self.abgeschlossen_am = now_datetime()
        projekt_titel = frappe.db.get_value("PH Projekt", self.projekt, "titel") or self.projekt
        self.titel = f"Abnahme {formatdate(self.datum, 'dd.MM.yyyy')}: {projekt_titel}"[:140]

    def on_update(self):
        try:
            if self.projekt and not frappe.db.get_value("PH Projekt", self.projekt, "abnahme"):
                frappe.db.set_value("PH Projekt", self.projekt, "abnahme", self.name, update_modified=False)
        except Exception:  # noqa: BLE001
            frappe.log_error(title="PH Abnahme: Projektverknüpfung fehlgeschlagen")

    @frappe.whitelist()
    def unterschrift_erfassen(self, unterschrift_kunde=None, name_kunde=None, unterschrift_studio=None):
        self.check_permission("write")
        werte = {}
        if unterschrift_kunde:
            if not str(unterschrift_kunde).startswith("data:image"):
                frappe.throw(_("Keine gültige Unterschrift."))
            werte.update(unterschrift_kunde=unterschrift_kunde, unterzeichnet_am=now_datetime())
        if name_kunde:
            werte["unterschrift_kunde_name"] = name_kunde[:140]
        if unterschrift_studio:
            werte["unterschrift_studio"] = unterschrift_studio
        if werte:
            self.db_set(werte)
        return "ok"

    @frappe.whitelist()
    def mangel_erledigt(self, zeile):
        self.check_permission("write")
        for p in self.positionen:
            if p.name == zeile:
                p.erledigt = 1
                p.erledigt_am = now_datetime().date()
        self.save()
        return self.maengel_offen

    @frappe.whitelist()
    def mangel_an_service(self, zeile):
        self.check_permission("write")
        if not frappe.db.exists("DocType", "PH Servicefall"):
            frappe.throw(_("DocType PH Servicefall ist noch nicht installiert (Arbeitspaket ph_service)."))
        p = next((x for x in self.positionen if x.name == zeile), None)
        if not p:
            frappe.throw(_("Position nicht gefunden."))
        if p.servicefall_ref:
            return p.servicefall_ref
        sf = frappe.get_doc({"doctype": "PH Servicefall", "kontakt": self.kontakt, "projekt": self.projekt, "beschreibung": f"{p.bezeichnung}: {p.beschreibung or ''}", "quelle": "abnahme"})
        sf.flags.ignore_mandatory = True
        sf.insert()
        frappe.db.set_value("PH Abnahme Position", p.name, "servicefall_ref", sf.name, update_modified=False)
        return sf.name

    @frappe.whitelist()
    def protokoll_als_dokument(self):
        self.check_permission("write")
        from ph_projekte.ph_projekte.doctype.ph_projekt_dokument.ph_projekt_dokument import dokument_aus_beleg

        pdf = frappe.get_print(self.doctype, self.name, "PH Abnahmeprotokoll", as_pdf=True)
        datei = frappe.get_doc({"doctype": "File", "file_name": f"{self.name}-Abnahmeprotokoll.pdf", "is_private": 1, "content": pdf, "attached_to_doctype": self.doctype, "attached_to_name": self.name}).insert(ignore_permissions=True)
        return dokument_aus_beleg(self.projekt, f"Abnahmeprotokoll {self.name}", "Abnahmeprotokoll", datei.file_url, self.doctype, self.name, kunde_sichtbar=1).name


def offene_maengel_anzahl():
    return frappe.db.count("PH Abnahme Position", {"zustand": ("in", ("Mangel", "Nacharbeit")), "erledigt": 0, "parenttype": "PH Abnahme"})
