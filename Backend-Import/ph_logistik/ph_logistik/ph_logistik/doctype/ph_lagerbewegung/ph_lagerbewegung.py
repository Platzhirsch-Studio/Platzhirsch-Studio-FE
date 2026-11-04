"""PH Lagerbewegung – Journal. Anlage im Desk wird über bestand.buche verbucht; Löschen verboten, Storno per Gegenbuchung."""

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import now_datetime

from ph_logistik.ph_logistik.bestand_logik import BestandsFehler, pruefe_bewegung


class PHLagerbewegung(Document):
    def before_insert(self):
        if not self.datum:
            self.datum = now_datetime()
        if not self.von_user:
            self.von_user = frappe.session.user
        if not self.flags.ph_bestand_intern:
            # Händische Anlage im Desk: Bestand über dieselbe Logik wie bestand.buche nachführen
            from ph_logistik.ph_logistik.bestand import bestand_anpassen

            if self.lagerbestand:
                bs = frappe.db.get_value("PH Lagerbestand", self.lagerbestand, ["produkt", "ausfuehrung", "seriennummer"], as_dict=True)
                self.produkt = self.produkt or bs.produkt
                self.ausfuehrung = self.ausfuehrung or bs.ausfuehrung
            self.lagerbestand = bestand_anpassen(
                {"art": self.art, "menge": self.menge, "lagerort_von": self.lagerort_von, "lagerort_nach": self.lagerort_nach, "platz_von": self.platz_von, "platz_nach": self.platz_nach},
                self.produkt, self.ausfuehrung, None, self.lagerbestand, self.bezug_doctype, self.bezug,
            ) or self.lagerbestand

    def validate(self):
        try:
            pruefe_bewegung({"art": self.art, "menge": self.menge, "lagerort_von": self.lagerort_von, "lagerort_nach": self.lagerort_nach, "platz_von": self.platz_von, "platz_nach": self.platz_nach})
        except BestandsFehler as e:
            frappe.throw(str(e))
        richtung = {"Wareneingang": "→", "Retoure": "→", "Verkauf": "←", "Ausbuchung": "←", "Umlagerung": "⇄", "Inventur": "±", "Reservierung": "(R)", "Freigabe": "(F)"}.get(self.art, "")
        self.titel = f"{self.art} {richtung} {self.menge}× {self.produkt} ({self.lagerort_von or ''}{' → ' if self.lagerort_von and self.lagerort_nach else ''}{self.lagerort_nach or ''})"[:140]

    def on_trash(self):
        frappe.throw(_("Lagerbewegungen werden nicht gelöscht – bitte stornieren (Gegenbuchung)."))

    @frappe.whitelist()
    def stornieren(self):
        self.check_permission("write")
        if "PH Logistik Leitung" not in frappe.get_roles() and "System Manager" not in frappe.get_roles():
            frappe.throw(_("Nur die Leitung storniert Bewegungen."))
        from ph_logistik.ph_logistik.bestand import storno

        return storno(self).name
