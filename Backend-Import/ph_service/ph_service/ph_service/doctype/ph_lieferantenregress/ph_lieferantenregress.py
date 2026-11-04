"""PH Lieferantenregress – Controller: Frist nach § 933b ABGB, Beträge je Status, Spiegel in den Servicefall (ereignisse.py)."""

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import cint, getdate, nowdate

from ph_service.ph_service import fristen as fr

OFFEN = ("Offen", "Gemeldet", "Anerkannt")


class PHLieferantenregress(Document):
    def validate(self):
        sf = frappe.db.get_value("PH Servicefall", self.servicefall, ["kunde_name", "erledigt_am", "lieferung_an_haendler", "lieferant", "marke", "kosten_gesamt_cent"], as_dict=True)
        if sf:
            self.lieferant = self.lieferant or sf.lieferant
            self.marke = self.marke or sf.marke
            moeglich, hinweis = fr.regress_moeglich(getdate(sf.erledigt_am) if sf.erledigt_am else None, sf.lieferung_an_haendler)
            self.frist_bis = fr.monate_dazu(getdate(sf.erledigt_am), fr.REGRESS_MONATE) if sf.erledigt_am else None
            self.frist_hinweis = hinweis[:140]
            if self.status == "Gemeldet" and self.has_value_changed("status") and not moeglich and sf.erledigt_am and not self.flags.frist_ignorieren:
                frappe.msgprint(_("Achtung: {0}").format(hinweis), indicator="red")
        if cint(self.betrag_gefordert_cent) < 0:
            frappe.throw(_("Forderung darf nicht negativ sein."))
        if self.status == "Anerkannt" and not cint(self.betrag_anerkannt_cent):
            frappe.throw(_("Anerkannt nur mit anerkanntem Betrag (ggf. Ersatzlieferung bewerten)."))
        if self.status == "Abgelehnt" and not self.ablehnungsgrund:
            self.ablehnungsgrund = "Sonstiges"
        if self.status == "Verrechnet":
            if not cint(self.betrag_erhalten_cent):
                self.betrag_erhalten_cent = cint(self.betrag_anerkannt_cent)
            self.verrechnet_am = self.verrechnet_am or nowdate()
        if self.status == "Gemeldet" and not self.gemeldet_am:
            self.gemeldet_am = nowdate()
        self.titel = f"{self.lieferant}: {self.servicefall}{' – ' + sf.kunde_name if sf and sf.kunde_name else ''}"[:140]

    @frappe.whitelist()
    def erinnern(self, empfaenger=None):
        """Button „Lieferant erinnern“: kurze Erinnerung per Mail mit Referenz."""
        self.check_permission("write")
        if not empfaenger and frappe.db.exists("DocType", "PH Lieferant"):
            try:
                empfaenger = frappe.db.get_value("PH Lieferant", self.lieferant, "bestell_email")
            except Exception:  # noqa: BLE001
                empfaenger = None
        if not empfaenger:
            frappe.throw(_("Keine E-Mail des Lieferanten bekannt."))
        from ph_core.utils.mail import sende

        html = f"<p>Sehr geehrte Damen und Herren,</p><p>wir erinnern an unsere Reklamation/Regressmeldung <b>{self.servicefall}</b> (Ihre Referenz: {frappe.utils.escape_html(self.lieferant_referenz or '–')}) vom {frappe.utils.formatdate(self.gemeldet_am) if self.gemeldet_am else '–'} über {cint(self.betrag_gefordert_cent) / 100:.2f} €. Bitte um Rückmeldung.</p><p>Mit freundlichen Grüßen<br>Platzhirsch Home Living</p>"
        sende(empfaenger, _("Erinnerung Regress {0}").format(self.servicefall), html, referenz_doctype=self.doctype, referenz_name=self.name)
        self.db_set("letzte_erinnerung", nowdate())
        return empfaenger


def summen_je_servicefall(servicefall):
    rows = frappe.get_all("PH Lieferantenregress", filters={"servicefall": servicefall}, fields=["status", "betrag_gefordert_cent", "betrag_anerkannt_cent", "betrag_erhalten_cent", "modified"], order_by="modified desc")
    gefordert = sum(cint(r.betrag_gefordert_cent) for r in rows if r.status != "Abgelehnt")
    erhalten = sum(cint(r.betrag_erhalten_cent) for r in rows if r.status == "Verrechnet")
    status = rows[0].status if rows else "Kein Regress"
    return gefordert, erhalten, status
