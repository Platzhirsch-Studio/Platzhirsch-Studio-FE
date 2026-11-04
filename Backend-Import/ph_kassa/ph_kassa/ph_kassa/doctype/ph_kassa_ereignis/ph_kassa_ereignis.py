"""PH Kassa Ereignis – Ausfälle, Nachsignatur, Prüfungen, FinanzOnline-Meldungen (RKSV §§ 17, 18)."""

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import get_datetime, now_datetime, time_diff_in_hours

from ph_kassa.rksv.finanzonline import ausfall_meldepflichtig

ABGESCHLOSSEN = ("Beendet", "Gemeldet", "Erledigt")


class PHKassaEreignis(Document):
    def before_insert(self):
        if not self.zeitpunkt:
            self.zeitpunkt = now_datetime()
        if not self.status:
            self.status = "Offen"

    def validate(self):
        if self.ende:
            if get_datetime(self.ende) < get_datetime(self.zeitpunkt):
                frappe.throw(_("Ende liegt vor dem Beginn."))
            self.dauer_h = round(time_diff_in_hours(self.ende, self.zeitpunkt), 2)
            self.meldung_finanzonline_noetig = 1 if ausfall_meldepflichtig(self.dauer_h) and "Ausfall" in (self.art or "") else 0
            if self.status == "Offen":
                self.status = "Beendet"
        if self.gemeldet_am:
            self.status = "Gemeldet"
        if self.art in ("Startbeleg Pruefung", "Jahresbeleg Pruefung") and self.nachweis and self.status == "Offen":
            self.status = "Erledigt"
            self._pruefung_in_kasse_spiegeln()
        self.titel = f"{self.art} – {self.kasse or self.see or ''} – {str(self.zeitpunkt)[:16]}"[:140]

    def _pruefung_in_kasse_spiegeln(self):
        if not self.kasse:
            return
        feld = "startbeleg_geprueft_am" if self.art == "Startbeleg Pruefung" else "jahresbeleg_geprueft_am"
        frappe.db.set_value("PH Kasse", self.kasse, feld, get_datetime(self.zeitpunkt).date(), update_modified=False)

    @frappe.whitelist()
    def als_gemeldet_markieren(self):
        self.check_permission("write")
        if not self.nachweis:
            frappe.throw(_("Bitte zuerst den FinanzOnline-Nachweis anhängen."))
        self.db_set({"gemeldet_am": now_datetime(), "status": "Gemeldet"})
        return "Gemeldet"
