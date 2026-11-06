"""PH Lieferant – Bezugsquelle mit Bestellweg und Konditionen."""

import json
import re

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import getdate, nowdate

from ph_sortiment.logik.bestellung import liefertermin_schaetzen, lieferzeit_fuer

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class PHLieferant(Document):
    def validate(self):
        self.firmenname = (self.firmenname or "").strip()
        self.bestell_email = (self.bestell_email or "").strip().lower() or None
        if self.bestell_email and not EMAIL_RE.match(self.bestell_email):
            frappe.throw(_("Bestell-E-Mail ist ungültig."))
        if self.bestellweg == "E-Mail" and not self.bestell_email and self.status == "Aktiv":
            frappe.msgprint(_("Bestellweg E-Mail ohne Bestell-E-Mail: Bestellungen können nicht gesendet werden."), indicator="orange", alert=True)
        if self.bestellweg == "Portal" and not self.portal_url:
            frappe.msgprint(_("Bestellweg Portal ohne Portal-URL."), indicator="orange", alert=True)
        for k in ("zahlungsziel_tage", "skonto_promille", "skonto_tage", "lieferzeit_wochen_standard", "ab_erwartet_tage"):
            if (self.get(k) or 0) < 0:
                frappe.throw(_("{0} darf nicht negativ sein.").format(self.meta.get_label(k)))
        if (self.skonto_promille or 0) > 100:
            frappe.throw(_("Skonto über 10 % ist unplausibel (Promille-Angabe: 20 = 2 %)."))
        for z in self.lieferzeiten:
            if (z.wochen_von or 0) < 0 or (z.wochen_bis or 0) < 0 or (z.wochen_von and z.wochen_bis and z.wochen_bis < z.wochen_von):
                frappe.throw(_("Lieferzeit Zeile {0}: Wochen ungültig.").format(z.idx))
        for z in self.betriebsurlaub:
            if getdate(z.bis) < getdate(z.von):
                frappe.throw(_("Betriebsurlaub Zeile {0}: „bis“ liegt vor „von“.").format(z.idx))
        if self.preisliste_mapping_json:
            try:
                json.loads(self.preisliste_mapping_json)
            except ValueError:
                frappe.throw(_("Preislisten-Mapping ist kein gültiges JSON."))

    def on_update(self):
        # Marke ↔ Lieferant gegenseitig verknüpfen (ohne Validierung der Marke neu anzustoßen).
        if self.marke and frappe.db.get_value("PH Marke", self.marke, "lieferant") != self.name:
            frappe.db.set_value("PH Marke", self.marke, "lieferant", self.name, update_modified=False)

    @frappe.whitelist()
    def offene_bestellungen(self):
        self.check_permission("read")
        return frappe.get_all(
            "PH Herstellerbestellung",
            filters={"lieferant": self.name, "status": ("in", ["Gesendet", "AB erhalten", "AB geprueft", "Teilgeliefert"])},
            fields=["name", "status", "datum", "kommission", "bestaetigter_termin", "abweichungen_offen"],
            order_by="datum asc",
        )

    @frappe.whitelist()
    def liefertermin(self, marke=None, kategorie=None, bestelldatum=None):
        """Lieferzeit (Wochen von/bis) und geschätzter Liefertermin unter Berücksichtigung des Betriebsurlaubs."""
        self.check_permission("read")
        return liefertermin_fuer(self, marke, kategorie, bestelldatum)


def liefertermin_fuer(lieferant, marke=None, kategorie=None, bestelldatum=None):
    """lieferant: Name oder Dokument. Rückgabe {wochen_von, wochen_bis, termin_frueh, termin_spaet}; Termine = None ohne Lieferzeit."""
    doc = lieferant if hasattr(lieferant, "lieferzeiten") else frappe.get_cached_doc("PH Lieferant", lieferant)
    standard = doc.lieferzeit_wochen_standard or (frappe.db.get_value("PH Marke", marke, "lieferzeit_wochen_standard") if marke else None)
    von, bis = lieferzeit_fuer([z.as_dict() for z in doc.lieferzeiten], marke, kategorie, standard)
    urlaube = [z.as_dict() for z in doc.betriebsurlaub]
    datum = bestelldatum or nowdate()
    return {"wochen_von": von, "wochen_bis": bis, "termin_frueh": liefertermin_schaetzen(datum, von, urlaube), "termin_spaet": liefertermin_schaetzen(datum, bis, urlaube)}
