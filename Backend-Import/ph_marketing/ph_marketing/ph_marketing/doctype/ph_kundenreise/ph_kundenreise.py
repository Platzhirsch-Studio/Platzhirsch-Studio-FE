"""PH Kundenreise – Regelprüfung beim Speichern (rechtsgrundlagen.js pruefeReise), Buttons: Aktivieren, Pausieren, Testmail, Vorschau."""

import frappe
from frappe import _
from frappe.model.document import Document

from ph_marketing.ph_marketing import engine
from ph_marketing.ph_marketing.einstellungen import einstellungen


class PHKundenreise(Document):
    def validate(self):
        self.reise_id = (self.reise_id or "").strip().lower().replace(" ", "_")
        fehler = engine.pruefe_reise(self)
        if fehler and self.aktiv:
            frappe.throw("<br>".join(frappe.utils.escape_html(f) for f in fehler), title=_("Kundenreise kann nicht aktiv sein"))
        if self.aktiv:
            self.status = "Aktiv"
        elif self.status == "Aktiv":
            self.status = "Pausiert"
        for t in self.trigger:
            if t.ausloeser_typ == "event" and not t.event:
                frappe.throw(_("Auslöser „event“ braucht ein Event."))
            if t.ausloeser_typ == "jaehrlich" and not (t.tag_monat and len(t.tag_monat) == 5 and t.tag_monat[2] == "-"):
                frappe.throw(_("Auslöser „jaehrlich“ braucht Tag-Monat im Format MM-TT."))
            if t.ausloeser_typ == "einwilligung" and not t.zwecke:
                frappe.throw(_("Auslöser „einwilligung“ braucht Zwecke."))

    # ── Buttons (ph_kundenreise.js) ────────────────────────────────────────
    @frappe.whitelist()
    def pruefen(self):
        self.check_permission("read")
        return engine.pruefe_reise(self)

    @frappe.whitelist()
    def aktivieren(self):
        self.check_permission("write")
        if "PH Marketing Leitung" not in frappe.get_roles() and "System Manager" not in frappe.get_roles():
            frappe.throw(_("Nur die Leitung aktiviert Kundenreisen."))
        fehler = engine.pruefe_reise(self)
        if fehler:
            frappe.throw("<br>".join(frappe.utils.escape_html(f) for f in fehler))
        e = einstellungen()
        if self.werbung and not e["kanzlei_fusszeilen_freigegeben"]:
            frappe.throw(_("Werbliche Reise: zuerst Kanzlei-Freigabe der Fußzeilen in PH Marketing Einstellungen setzen."))
        self.aktiv = 1
        self.status = "Aktiv"
        self.save()
        return self.status

    @frappe.whitelist()
    def pausieren(self):
        self.check_permission("write")
        self.aktiv = 0
        self.status = "Pausiert"
        self.save()
        return self.status

    @frappe.whitelist()
    def testmail(self, empfaenger=None):
        self.check_permission("write")
        ziel = engine.testmail(self, empfaenger)
        self.add_comment("Info", _("Testmail an {0}").format(ziel))
        return ziel

    @frappe.whitelist()
    def vorschau(self):
        self.check_permission("read")
        from ph_marketing.ph_marketing import versand

        kontakt = {"email": "muster@example.com", "name": "Muster", "anrede_feld": "Frau", "produkt": "Ihr Sofa", "pflegekategorien": ["stoff"], "daten": {}}
        grundlage = "V" if not self.werbung else ("E" if self.grundlage_e else "B")
        betreff, html = versand.rendern(self.vorlage, engine.kontext(self, kontakt, grundlage, versand.website_url("/de/newsletter/abmelden")))
        return {"betreff": betreff, "html": html, "grundlage": grundlage}

    @frappe.whitelist()
    def heute_planen(self):
        """Button „Fällige heute planen“ (Leitung, Staging): plant nur diese Reise für heute."""
        self.check_permission("write")
        import json

        from frappe.utils import cint, nowdate

        n = 0
        for t in self.trigger:
            for k in engine.faellige_kontakte(self, t, nowdate()):
                key = engine.schluessel(self, t.idx if self.reise_id == "merkliste" else 0, k, nowdate())
                if frappe.db.exists("PH Reise Versand", {"schluessel": key}):
                    continue
                frappe.get_doc({"doctype": "PH Reise Versand", "schluessel": key, "reise": self.name, "empfaenger": k["email"], "werbung": cint(self.werbung), "status": "geplant", "einwilligung": k.get("einwilligung"), "referenz_doctype": k.get("referenz_doctype"), "referenz_name": k.get("referenz_name"), "kontext_json": json.dumps(k, default=str, ensure_ascii=False), "geplant_am": nowdate()}).insert(ignore_permissions=True)
                n += 1
        return n
