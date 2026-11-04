"""PH Sendung – Versandauftrag (Ausgang / Retourenlabel). Buchung, Etikett, Tracking, Storno über ph_logistik.letmeship.dienst."""

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import now_datetime

from ph_logistik.letmeship.tarife import tracking_link
from ph_logistik.ph_logistik.helfer import setze_status

AKTIV = ("Angelegt", "Etikett", "Unterwegs", "Problem")


class PHSendung(Document):
    def before_insert(self):
        if not self.status:
            self.status = "Angelegt"
        if not self.env:
            from ph_logistik.letmeship.dienst import get_client

            self.env = get_client().umgebung

    def validate(self):
        if self.richtung == "Retoure" and not (self.retoure or self.lieferschein):
            frappe.throw(_("Retourenlabel braucht eine Retoure oder einen Lieferschein."))
        if self.richtung == "Ausgang" and not self.lieferschein:
            frappe.throw(_("Ausgangssendung braucht einen Lieferschein."))
        if self.versicherung and not self.versicherungswert_cent:
            self.versicherungswert_cent = self.warenwert_cent or 0
        if self.empf_land:
            self.empf_land = self.empf_land.strip().upper()[:2]
        if self.tracking_nr and not self.tracking_url:
            self.tracking_url = tracking_link(self.carrier, self.tracking_nr)
        if self.dienstleister != "LetMeShip" and self.tracking_nr and self.status == "Angelegt":
            self.status = "Etikett"  # manuell erfasste Sendung mit Tracking-Nr.
        if self.lieferschein and not self.bestellung:
            self.bestellung = frappe.db.get_value("PH Lieferschein", self.lieferschein, "bestellung")
        ziel = self.empf_ort or ""
        self.titel = f"{self.richtung} {self.carrier or self.dienstleister} {self.tracking_nr or ''} → {ziel}".replace("  ", " ")[:140]

    # ── Buttons ───────────────────────────────────────────────────────────
    @frappe.whitelist()
    def buchen(self):
        self.check_permission("write")
        from ph_logistik.letmeship.dienst import buchen

        buchen(self)
        return self.status

    @frappe.whitelist()
    def tracking_aktualisieren(self):
        self.check_permission("write")
        from ph_logistik.letmeship.dienst import tracking_abgleich

        return tracking_abgleich(self)

    @frappe.whitelist()
    def stornieren(self, grund=None):
        self.check_permission("write")
        from ph_logistik.letmeship.dienst import stornieren

        stornieren(self, grund)
        return self.status

    @frappe.whitelist()
    def problem_melden(self, text):
        self.check_permission("write")
        self.append("tracking_verlauf", {"zeit": now_datetime(), "status": "Problem", "code": "MANUELL", "text": str(text)[:140]})
        self.save()
        setze_status(self, "Problem")
        return self.status

    @frappe.whitelist()
    def manuell_zugestellt(self):
        self.check_permission("write")
        if self.status in ("Storniert",):
            frappe.throw(_("Stornierte Sendung."))
        self.append("tracking_verlauf", {"zeit": now_datetime(), "status": "Zugestellt", "code": "MANUELL", "text": _("Manuell als zugestellt gebucht")})
        self.save()
        setze_status(self, "Zugestellt", zugestellt_am=now_datetime())
        from ph_logistik.letmeship.dienst import _lieferschein_nachziehen

        _lieferschein_nachziehen(self, "Zugestellt")
        return self.status

    @frappe.whitelist()
    def retourenlabel(self):
        """Retourenlabel zu dieser Ausgangssendung (Adressen getauscht)."""
        self.check_permission("write")
        if self.richtung != "Ausgang" or not self.lieferschein:
            frappe.throw(_("Retourenlabel nur aus einer Ausgangssendung."))
        from ph_logistik.letmeship.dienst import buchen, sendung_anlegen

        ls = frappe.get_doc("PH Lieferschein", self.lieferschein)
        s = sendung_anlegen(ls, self.service_id, richtung="Retoure")
        buchen(s)
        return s.name

    @frappe.whitelist()
    def etikett_url(self):
        self.check_permission("read")
        if not self.etikett:
            frappe.throw(_("Kein Etikett vorhanden – zuerst buchen."))
        return self.etikett


def retourenlabel_fuer_retoure(retoure):
    """PH Retoure (ph_shop) → Retourenlabel-Sendung (Custom Field ph_logistik_retourenlabel wird gesetzt)."""
    if not frappe.db.exists("DocType", "PH Retoure"):
        frappe.throw(_("ph_shop (PH Retoure) ist nicht installiert."))
    r = frappe.get_doc("PH Retoure", retoure)
    bestellung = r.get("bestellung")
    ls_name = frappe.db.get_value("PH Lieferschein", {"bestellung": bestellung, "status": ("!=", "Storniert")}, "name", order_by="creation desc") if bestellung else None
    if not ls_name:
        frappe.throw(_("Zur Bestellung {0} gibt es keinen Lieferschein – Retourenlabel bitte manuell anlegen.").format(bestellung))
    from ph_logistik.letmeship.dienst import buchen, sendung_anlegen, tarife_fuer_lieferschein

    ls = frappe.get_doc("PH Lieferschein", ls_name)
    t = tarife_fuer_lieferschein(ls)
    s = sendung_anlegen(ls, t.get("empfehlung"), richtung="Retoure", retoure=retoure)
    buchen(s)
    if frappe.get_meta("PH Retoure").has_field("ph_logistik_retourenlabel"):
        frappe.db.set_value("PH Retoure", retoure, "ph_logistik_retourenlabel", s.name, update_modified=False)
    return s
