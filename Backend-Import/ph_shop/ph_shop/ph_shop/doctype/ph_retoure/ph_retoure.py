"""PH Retoure – Rücksendung/Rückgabe zu einer Bestellung: Eingang, Prüfung (Zustand, Wertminderung), Erstattung."""

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import cint, now_datetime

from ph_shop.ph_shop import status as st


class PHRetoure(Document):
    def before_insert(self):
        self.angekuendigt_am = self.angekuendigt_am or now_datetime()
        self.status = self.status or "Angekuendigt"

    def validate(self):
        b = frappe.db.get_value("PH Bestellung", self.bestellung, ["kunde_name", "gesamt_cent", "betrag_bezahlt_cent", "erstattet_cent"], as_dict=True)
        if not b:
            frappe.throw(_("Bestellung nicht gefunden."))
        self.wertminderung_cent = sum(cint(p.wertminderung_cent) for p in self.positionen) or cint(self.wertminderung_cent)
        bezahlt = cint(b.betrag_bezahlt_cent) or cint(b.gesamt_cent)
        if not cint(self.erstattungsbetrag_cent):
            self.erstattungsbetrag_cent = max(bezahlt - cint(b.erstattet_cent) - cint(self.wertminderung_cent), 0)
        if cint(self.erstattungsbetrag_cent) > bezahlt - cint(b.erstattet_cent):
            frappe.throw(_("Erstattungsbetrag übersteigt den gezahlten, noch nicht erstatteten Betrag."))
        self.titel = f"Retoure {self.bestellung} · {b.kunde_name}"[:140]

    def after_insert(self):
        frappe.db.set_value("PH Bestellung", self.bestellung, "retoure", self.name, update_modified=False)

    @frappe.whitelist()
    def eingegangen(self):
        self.check_permission("write")
        st.setzen(self, "Eingegangen", None, None, {"eingegangen_am": now_datetime()})
        if self.widerruf:
            w = frappe.get_doc("PH Widerruf", self.widerruf)
            if w.status in ("Bestaetigt", "Ware erwartet", "Eingegangen"):
                st.setzen(w, "Ware erhalten", _("Retoure {0} eingegangen").format(self.name))
        return "Eingegangen"

    @frappe.whitelist()
    def pruefung_abschliessen(self):
        self.check_permission("write")
        if self.status not in ("Eingegangen", "Geprueft"):
            frappe.throw(_("Prüfung erst nach Wareneingang."))
        st.setzen(self, "Geprueft", _("Wertminderung {0} Cent, Erstattung {1} Cent").format(self.wertminderung_cent, self.erstattungsbetrag_cent), None, {"geprueft_von": frappe.session.user, "geprueft_am": now_datetime()})
        return "Geprueft"

    @frappe.whitelist()
    def erstatten(self, grund=None):
        self.check_permission("write")
        if self.status != "Geprueft":
            frappe.throw(_("Zuerst die Prüfung abschließen."))
        zahlung = frappe.db.get_value("PH Bestellung", self.bestellung, "zahlung_ref")
        if not zahlung:
            frappe.throw(_("Keine gebuchte Zahlung zur Bestellung."))
        r = frappe.get_doc("PH Zahlung", zahlung).rueckerstatten(cint(self.erstattungsbetrag_cent), grund or _("Retoure {0}").format(self.name), _intern=True)
        if r.get("gegenbuchung"):
            st.setzen(self, "Erstattet", r["gegenbuchung"], None, {"erstattung": r["gegenbuchung"]})
            if self.widerruf:
                w = frappe.get_doc("PH Widerruf", self.widerruf)
                st.setzen(w, "Erstattet", r["gegenbuchung"], None, {"erstattung": r["gegenbuchung"], "erstattungsbetrag_cent": self.erstattungsbetrag_cent})
        return r

    @frappe.whitelist()
    def ablehnen(self, grund):
        self.check_permission("write")
        st.setzen(self, "Abgelehnt", grund, None, {"hinweis": grund})
        return "Abgelehnt"
