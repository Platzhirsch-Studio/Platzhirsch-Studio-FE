"""PH Widerruf – Rücktritt nach FAGG (src/lib/shop/widerruf.js, src/lib/payments/withdrawal.js).

Fristen: Widerrufsfrist 14 Tage ab Erhalt der Ware (§ 11 Abs 2 FAGG; Gutschein: ab Vertragsschluss),
Rücksendung binnen 14 Tagen ab Erklärung (§ 15), Rückzahlung binnen 14 Tagen ab Erklärung mit
Zurückbehaltungsrecht bis Wareneingang/Nachweis (§ 14). Eingangsbestätigung auf dauerhaftem Datenträger
(§ 13a Abs 2) sofort nach Eingang. Nicht zugeordnete Erklärungen: Bestätigung ohne Freitext, höchstens
3 je Adresse in 24 h (Missbrauchsschutz der Website, QA P2-2).
"""

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import add_days, add_to_date, cint, getdate, now_datetime

from ph_shop.ph_shop import mails, status as st

FRIST_TAGE = 14
RECIPIENT_LIMIT = 3


class PHWiderruf(Document):
    def before_insert(self):
        self.eingegangen_am = self.eingegangen_am or now_datetime()
        self.status = self.status or "Eingegangen"

    def validate(self):
        self.kunde_email = (self.kunde_email or "").strip().lower()
        if self.bestellung and self.gutschein_bestellung:
            frappe.throw(_("Entweder Bestellung oder Gutschein-Bestellung."))
        self.zugeordnet = 1 if (self.bestellung or self.gutschein_bestellung) else 0
        if self.bestellung and not self.erhalten_am:
            b = frappe.db.get_value("PH Bestellung", self.bestellung, ["versendet_am", "abgeholt_am"], as_dict=True)
            if b and (b.versendet_am or b.abgeholt_am):
                self.erhalten_am = getdate(b.abgeholt_am or b.versendet_am)
        beginn = self.erhalten_am or (frappe.db.get_value("PH Gutschein Bestellung", self.gutschein_bestellung, "bezahlt_am") if self.gutschein_bestellung else None)
        if beginn:
            self.frist_ende = add_days(getdate(beginn), FRIST_TAGE)
            self.fristgerecht = 1 if getdate(self.eingegangen_am) <= getdate(self.frist_ende) else 0
        else:
            self.frist_ende = None
            self.fristgerecht = 1
        tag = getdate(self.eingegangen_am)
        self.rueckgabe_bis = add_days(tag, FRIST_TAGE) if self.bestellung else None
        self.erstattung_bis = add_days(tag, FRIST_TAGE)
        if self.status == "Abgelehnt" and not self.ablehnungsgrund:
            frappe.throw(_("Bitte Ablehnungsgrund angeben."))
        ziel = self.bestellung or self.gutschein_bestellung or self.angabe or "nicht zugeordnet"
        self.titel = f"Widerruf {ziel} · {self.kunde_name}"[:140]

    def after_insert(self):
        if self.bestellung:
            b = frappe.get_doc("PH Bestellung", self.bestellung)
            b.db_set("widerruf", self.name, update_modified=False)
            st.verlauf(b, b.status, _("Widerruf {0} eingegangen").format(self.name), self.quelle)
        if self.gutschein_bestellung:
            gb = frappe.get_doc("PH Gutschein Bestellung", self.gutschein_bestellung)
            gb.flags.ignore_permissions = True
            gb.widerruf_vermerken(self.name)
        if self.flags.bestaetigung_senden is not False:
            self.bestaetigung_senden(intern=True)

    def on_update(self):
        """Nachträgliche Zuordnung: Rückwärtslink PH Bestellung.widerruf setzen (10-konzept-shop §10). Wirft nie."""
        try:
            if self.bestellung and self.has_value_changed("bestellung") and not self.flags.in_insert:
                if not frappe.db.get_value("PH Bestellung", self.bestellung, "widerruf"):
                    b = frappe.get_doc("PH Bestellung", self.bestellung)
                    b.db_set("widerruf", self.name, update_modified=False)
                    st.verlauf(b, b.status, _("Widerruf {0} nachträglich zugeordnet").format(self.name), "backoffice")
        except Exception:  # noqa: BLE001
            frappe.log_error(title=f"PH Widerruf {self.name}: Rückwärtslink")

    # ── Buttons ──────────────────────────────────────────────────────────────
    @frappe.whitelist()
    def bestaetigung_senden(self, intern=False):
        """Eingangsbestätigung (§ 13a Abs 2 FAGG). Nicht zugeordnet → ohne Freitext, Limit je Adresse."""
        if not intern:
            self.check_permission("email")
        if not self.zugeordnet:
            seit = add_to_date(now_datetime(), hours=-24)
            n = frappe.db.count("PH Widerruf", {"zugeordnet": 0, "kunde_email": self.kunde_email, "eingegangen_am": (">=", seit), "mail_status": "gesendet", "name": ("!=", self.name)})
            if n >= RECIPIENT_LIMIT:
                self.db_set("mail_status", "limit", update_modified=False)
                return False
        ok = mails.senden("widerruf", self.kunde_email, {"doc": self, "zugeordnet": bool(self.zugeordnet), "erklaerung": self.erklaerung_text()}, referenz_doctype=self.doctype, referenz_name=self.name)
        self.db_set({"mail_status": "gesendet" if ok else "fehlgeschlagen", "bestaetigung_gesendet_am": now_datetime() if ok else None}, update_modified=False)
        if ok and self.status == "Eingegangen":
            st.setzen(self, "Bestaetigt", "Eingangsbestätigung gesendet")
        return ok

    def erklaerung_text(self):
        """Inhalt der Erklärung als Klartext (widerruf.js erklaerungText)."""
        tag = lambda d: frappe.format(d, "Date") if d else "–"  # noqa: E731
        return "\n".join(
            [
                f"Bestellnummer: {self.bestellung or self.angabe or '– (Vertrag außerhalb des Onlineshops)'}",
                f"Bestellt am: {tag(self.bestellt_am)} · Erhalten am: {tag(self.erhalten_am)}",
                f"Name: {self.kunde_name}",
                f"Anschrift: {self.anschrift or '–'}",
                f"E-Mail: {self.kunde_email}",
                f"Widerrufene Artikel: {self.artikel or '–'}",
            ]
        )

    @frappe.whitelist()
    def retoure_anlegen(self):
        self.check_permission("write")
        if not self.bestellung:
            frappe.throw(_("Retoure nur zu einer Shop-Bestellung."))
        if self.retoure:
            return self.retoure
        b = frappe.get_doc("PH Bestellung", self.bestellung)
        r = frappe.get_doc({"doctype": "PH Retoure", "bestellung": self.bestellung, "widerruf": self.name, "angekuendigt_am": now_datetime(), "positionen": [{"slug": p.slug, "bezeichnung": p.bezeichnung, "menge": p.menge} for p in b.positionen]}).insert()
        self.db_set({"retoure": r.name})
        b.db_set("retoure", r.name, update_modified=False)
        st.setzen(self, "Ware erwartet", _("Retoure {0}").format(r.name))
        return r.name

    @frappe.whitelist()
    def ware_erhalten(self):
        self.check_permission("write")
        st.setzen(self, "Ware erhalten")
        return "Ware erhalten"

    @frappe.whitelist()
    def erstatten(self, betrag_cent=None, grund=None):
        """Rückzahlung über die Ursprungszahlung (PH Zahlung.rueckerstatten) – Bestellung wird widerrufen/erstattet."""
        self.check_permission("write")
        zahlung = None
        if self.bestellung:
            zahlung = frappe.db.get_value("PH Bestellung", self.bestellung, "zahlung_ref")
        elif self.gutschein_bestellung:
            zahlung = frappe.db.get_value("PH Gutschein Bestellung", self.gutschein_bestellung, "zahlung")
        if not zahlung:
            frappe.throw(_("Keine gebuchte Zahlung zum Widerruf gefunden."))
        zdoc = frappe.get_doc("PH Zahlung", zahlung)
        betrag = cint(betrag_cent) or cint(self.erstattungsbetrag_cent) or (cint(zdoc.betrag_cent) - cint(zdoc.erstattet_cent))
        r = zdoc.rueckerstatten(betrag, grund or _("Widerruf {0}").format(self.name), _intern=True)
        if r.get("gegenbuchung"):
            st.setzen(self, "Erstattet", r["gegenbuchung"], None, {"erstattung": r["gegenbuchung"], "erstattungsbetrag_cent": betrag})
            if self.bestellung:
                b = frappe.get_doc("PH Bestellung", self.bestellung)
                if b.status != "erstattet":
                    st.setzen(b, "widerrufen" if cint(zdoc.erstattet_cent) + betrag < cint(zdoc.betrag_cent) else "widerrufen", _("Widerruf {0} erstattet").format(self.name))
        return r

    @frappe.whitelist()
    def ablehnen(self, grund):
        self.check_permission("write")
        st.setzen(self, "Abgelehnt", grund, None, {"ablehnungsgrund": grund})
        return "Abgelehnt"


def offene_anzahl():
    return frappe.db.count("PH Widerruf", {"status": ("in", ("Eingegangen", "Bestaetigt", "Ware erwartet", "Ware erhalten"))})
