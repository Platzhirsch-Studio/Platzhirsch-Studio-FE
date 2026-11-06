"""PH Urlaubsanspruch – Anspruch eines Urlaubsjahres (UrlG). Anlage automatisch durch
ph_personal.ph_personal.urlaubskonto.ansprueche_sicherstellen (Scheduler täglich, Konto-Abfrage);
Korrekturen (Altdaten, Vereinbarung) nur durch Personal-Leitung mit Grund."""

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import getdate, nowdate

from ph_personal.utils.urlaub import verjaehrt_am


class PHUrlaubsanspruch(Document):
    def validate(self):
        von, bis = getdate(self.urlaubsjahr_von), getdate(self.urlaubsjahr_bis)
        if bis <= von:
            frappe.throw(_("Das Urlaubsjahr endet vor seinem Beginn."))
        self.verjaehrt_am = verjaehrt_am(bis)
        if (self.anspruch_tage or 0) < 0:
            frappe.throw(_("Der Anspruch kann nicht negativ sein."))
        if self.korrektur_tage and not (self.korrektur_grund or "").strip():
            frappe.throw(_("Bitte einen Grund für die Korrektur angeben."))
        if not self.is_new() and (self.has_value_changed("anspruch_tage") or self.has_value_changed("korrektur_tage")):
            if "PH Personal Leitung" not in frappe.get_roles() and frappe.session.user != "Administrator":
                frappe.throw(_("Anspruch und Korrektur ändert nur die Personal-Leitung."), frappe.PermissionError)
            if self.has_value_changed("anspruch_tage") and self.quelle == "Automatisch":
                self.quelle = "Korrektur"
        name = self.mitarbeiter_name or frappe.db.get_value("PH Mitarbeiter", self.mitarbeiter, "titel")
        self.titel = f"{name} · {_('Urlaubsjahr')} {von.strftime('%d.%m.%Y')} – {bis.strftime('%d.%m.%Y')}"[:140]
        self._status()

    def _status(self):
        if self.status == "Abgegolten":
            return
        if getdate(nowdate()) >= getdate(self.verjaehrt_am) and (self.rest_tage or 0) > 0:
            self.status = "Verjaehrt"
        elif (self.rest_tage or 0) <= 0 and (self.verbraucht_tage or 0) > 0:
            self.status = "Verbraucht"
        else:
            self.status = "Offen"

    @frappe.whitelist()
    def stand_aktualisieren(self):
        """Button „Stand aktualisieren“: Verbrauch FIFO neu berechnen und speichern."""
        self.check_permission("read")
        stand_schreiben(self.mitarbeiter)
        self.reload()
        return {"rest": self.rest_tage, "verbraucht": self.verbraucht_tage}

    @frappe.whitelist()
    def als_abgegolten_markieren(self, datum=None):
        """Button „Ersatzleistung abgerechnet“ (Leitung, nach Austritt § 10 UrlG)."""
        if "PH Personal Leitung" not in frappe.get_roles() and frappe.session.user != "Administrator":
            frappe.throw(_("Nur die Personal-Leitung."), frappe.PermissionError)
        self.status = "Abgegolten"
        self.save()
        self.add_comment("Info", _("Urlaubsersatzleistung abgerechnet am {0}").format(frappe.format(getdate(datum or nowdate()), {"fieldtype": "Date"})))
        return self.status


def stand_schreiben(mitarbeiter, stichtag=None):
    """Verbrauch/Rest aller Urlaubsjahre einer Person in die Datensätze schreiben (ohne Version)."""
    from ph_personal.ph_personal.urlaubskonto import konto

    k = konto(mitarbeiter, stichtag)
    pflege = _pflege_stunden(mitarbeiter)
    for j in k["jahre"]:
        werte = {"verbraucht_tage": j["verbraucht"], "rest_tage": j["rest"] if not j["verjaehrt"] else j["verjaehrt_tage"], "vorgriff_tage": j["vorgriff"]}
        status = frappe.db.get_value("PH Urlaubsanspruch", j["name"], "status")
        if status != "Abgegolten":
            werte["status"] = "Verjaehrt" if j["verjaehrt"] and j["verjaehrt_tage"] > 0 else ("Verbraucht" if j["rest"] <= 0 and j["verbraucht"] > 0 else "Offen")
        werte["pflegefreistellung_genommen_std"] = pflege.get(j["name"], 0)
        frappe.db.set_value("PH Urlaubsanspruch", j["name"], werte, update_modified=False)
    return k


def _pflege_stunden(mitarbeiter):
    """Genommene Pflegefreistellung (Stunden) je Urlaubsjahr (§ 16 UrlG: Kontingent je Arbeitsjahr)."""
    from ph_personal.ph_personal.zeitkonto import abwesenheitstage, tagessoll

    jahre = frappe.get_all("PH Urlaubsanspruch", filters={"mitarbeiter": mitarbeiter}, fields=["name", "urlaubsjahr_von", "urlaubsjahr_bis"])
    out = {j.name: 0.0 for j in jahre}
    for a in frappe.get_all("PH Abwesenheit", filters={"mitarbeiter": mitarbeiter, "art": "Pflegefreistellung", "status": "Genehmigt"}, fields=["von", "bis", "halbtags", "stunden"]):
        for d, menge in abwesenheitstage(mitarbeiter, a.von, a.bis, a.halbtags):
            for j in jahre:
                if getdate(j.urlaubsjahr_von) <= d <= getdate(j.urlaubsjahr_bis):
                    out[j.name] += round(tagessoll(mitarbeiter, d) * menge / 60, 2)
    return out
