"""PH Kundenkarte Einloesung – Einlösung eines Leistungsvorteils. Regeln in utils/vorteile.py (ohne Frappe)."""

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import cint, get_datetime, getdate, now_datetime

from ph_kundenkarte.ph_kundenkarte.doctype.ph_kundenkarte_stufe.ph_kundenkarte_stufe import stufen_liste, stufen_vorteile
from ph_kundenkarte.utils import stufen as st
from ph_kundenkarte.utils import vorteile as vt

BEZUG_ERLAUBT = ("PH Kassenbeleg", "PH Bestellung", "PH Rechnung", "PH Serviceauftrag", "PH Pflege Abo", "PH Event")

MELDUNG = {
    vt.CODE_KARTE_INAKTIV: _("Die Kundenkarte ist nicht aktiv."),
    vt.CODE_VORTEIL_INAKTIV: _("Der Vorteil ist nicht aktiv."),
    vt.CODE_STUFE: _("Die Stufe der Karte reicht für diesen Vorteil nicht aus."),
    vt.CODE_NICHT_IN_STUFE: _("Der Vorteil ist der Stufe dieser Karte nicht zugeordnet."),
    vt.CODE_LIMIT: _("Das Limit dieses Vorteils für das laufende Kalenderjahr ist erreicht."),
}


def anzahl_im_jahr(kundenkarte, vorteil, jahr, ausser=None):
    """Nicht stornierte Einlösungen eines Vorteils je Karte im Kalenderjahr – über die Kartenkette (Ersatzkarte,
    Übertragung), damit ein Kartentausch das Jahreslimit nicht zurücksetzt."""
    from ph_kundenkarte.ph_kundenkarte.kette import karten_kette

    filters = {"kundenkarte": ("in", karten_kette(kundenkarte) or [kundenkarte]), "vorteil": vorteil, "status": "Eingeloest", "eingeloest_am": ("between", [f"{jahr}-01-01 00:00:00", f"{jahr}-12-31 23:59:59"])}
    if ausser:
        filters["name"] = ("!=", ausser)
    return frappe.db.count("PH Kundenkarte Einloesung", filters)


def pruefung(kundenkarte, vorteil, zeitpunkt=None, ausser=None):
    """(ok, code) für eine geplante Einlösung – gemeinsame Prüfung für Controller und API."""
    karte = frappe.db.get_value("PH Kundenkarte", kundenkarte, ["status", "stufe"], as_dict=True)
    if not karte:
        return False, "not_found"
    v = frappe.db.get_value("PH Kundenkarte Vorteil", vorteil, ["aktiv", "einloesbar_pro_jahr", "gilt_ab_stufe"], as_dict=True)
    if not v:
        return False, "not_found"
    stufen = stufen_liste()
    zugeordnet = {z["vorteil"] for z in vt.vorteile_fuer_stufe(stufen_vorteile(), stufen, karte.stufe)}
    jahr = getdate(zeitpunkt or now_datetime()).year
    return vt.einloesung_erlaubt(
        karte.status,
        bool(cint(v.aktiv)),
        cint(v.einloesbar_pro_jahr),
        anzahl_im_jahr(kundenkarte, vorteil, jahr, ausser=ausser),
        stufe_reihenfolge=st.reihenfolge_von(stufen, karte.stufe),
        gilt_ab_reihenfolge=st.reihenfolge_von(stufen, v.gilt_ab_stufe) if v.gilt_ab_stufe else None,
        in_stufe_enthalten=vorteil in zugeordnet,
    )


class PHKundenkarteEinloesung(Document):
    def before_insert(self):
        if not self.eingeloest_am:
            self.eingeloest_am = now_datetime()
        if not self.eingeloest_durch:
            self.eingeloest_durch = frappe.session.user
        if not self.status:
            self.status = "Eingeloest"
        self.stufe = frappe.db.get_value("PH Kundenkarte", self.kundenkarte, "stufe")

    def validate(self):
        if self.bezug_doctype and self.bezug_doctype not in BEZUG_ERLAUBT:
            frappe.throw(_("Bezug muss einer der folgenden Typen sein: {0}").format(", ".join(BEZUG_ERLAUBT)))
        if self.bezug_doctype and self.bezug and frappe.db.exists("DocType", self.bezug_doctype) and not frappe.db.exists(self.bezug_doctype, self.bezug):
            frappe.throw(_("Bezug {0} {1} existiert nicht.").format(self.bezug_doctype, self.bezug))
        if self.is_new():
            ok, code = pruefung(self.kundenkarte, self.vorteil, self.eingeloest_am, ausser=self.name)
            if not ok:
                frappe.throw(MELDUNG.get(code, _("Einlösung nicht möglich ({0}).").format(code)))
        alt = self.get_doc_before_save()
        if alt and alt.status == "Storniert" and self.status != "Storniert":
            frappe.throw(_("Eine stornierte Einlösung wird nicht wieder aktiviert – bitte neu einlösen."))
        titel = self.vorteil_titel or frappe.db.get_value("PH Kundenkarte Vorteil", self.vorteil, "titel") or self.vorteil
        self.titel = f"{titel} · {self.kunde_name or self.kundenkarte} · {frappe.utils.formatdate(get_datetime(self.eingeloest_am))}"[:140]

    @frappe.whitelist()
    def stornieren(self, grund=None):
        """Button „Stornieren“: Status Storniert (Nachweis bleibt), nur Leitung oder eigene Einlösung am selben Tag."""
        self.check_permission("write")
        from ph_kundenkarte.ph_kundenkarte.lebenszyklus import einloesung_stornieren

        return einloesung_stornieren(self.name, grund=grund)
