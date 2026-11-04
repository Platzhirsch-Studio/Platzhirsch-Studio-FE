"""PH Abwesenheit – Urlaub/Abwesenheit mit Genehmigung (Workflow). Urlaubskonto je Kalenderjahr."""

from datetime import date

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import getdate, now_datetime, nowdate

from ph_personal.logik import arbeitstage, ueberschneidung

WORKFLOW_STATE = {"Beantragt": "PH Beantragt", "Genehmigt": "PH Genehmigt", "Abgelehnt": "PH Abgelehnt", "Storniert": "PH Storniert"}
BLOCKIEREND = ("Beantragt", "Genehmigt")


class PHAbwesenheit(Document):
    def before_insert(self):
        self.beantragt_von = frappe.session.user
        self.beantragt_am = now_datetime()

    def validate(self):
        von, bis = getdate(self.von), getdate(self.bis)
        if bis < von:
            frappe.throw(_("„Bis“ liegt vor „Von“."))
        if self.halbtags and von != bis:
            frappe.throw(_("Halber Tag nur bei einem einzelnen Tag."))
        if self.vertretung == self.mitarbeiter:
            frappe.throw(_("Vertretung kann nicht die Person selbst sein."))
        self.tage = arbeitstage(von, bis, halbtags=bool(self.halbtags))
        if self.tage <= 0:
            frappe.throw(_("Der Zeitraum enthält keinen Arbeitstag (Mo–Fr)."))
        self._ueberschneidung_pruefen(von, bis)
        self._entscheidung()
        self._urlaubskonto()
        name = self.mitarbeiter_name or frappe.db.get_value("PH Mitarbeiter", self.mitarbeiter, "titel")
        zeitraum = frappe.format(von, {"fieldtype": "Date"}) if von == bis else f"{frappe.format(von, {'fieldtype': 'Date'})} – {frappe.format(bis, {'fieldtype': 'Date'})}"
        self.titel = f"{name} · {self.art} · {zeitraum}"[:140]

    def _ueberschneidung_pruefen(self, von, bis):
        if self.status not in BLOCKIEREND:
            return
        andere = frappe.get_all(
            "PH Abwesenheit",
            filters={"name": ("!=", self.name or ""), "mitarbeiter": self.mitarbeiter, "status": ("in", BLOCKIEREND), "von": ("<=", bis), "bis": (">=", von)},
            fields=["name", "art", "von", "bis"],
            limit=1,
        )
        for a in andere:
            if ueberschneidung(von, bis, getdate(a.von), getdate(a.bis)):
                frappe.throw(_("Überschneidung mit {0} ({1}, {2}–{3}).").format(a.name, a.art, frappe.format(a.von, {"fieldtype": "Date"}), frappe.format(a.bis, {"fieldtype": "Date"})))

    def _entscheidung(self):
        alt = self.get_doc_before_save()
        if alt and alt.status != self.status and self.status in ("Genehmigt", "Abgelehnt"):
            self.genehmigt_von = frappe.session.user
            self.genehmigt_am = now_datetime()
            if self.status == "Abgelehnt" and not (self.ablehnungsgrund or "").strip():
                frappe.throw(_("Bitte einen Ablehnungsgrund angeben."))
        if alt and alt.status in ("Genehmigt", "Abgelehnt") and self.status == "Beantragt":
            self.genehmigt_von = None
            self.genehmigt_am = None

    def _urlaubskonto(self):
        if self.art != "Urlaub":
            self.urlaub_anspruch = self.urlaub_genommen = self.urlaub_beantragt = self.urlaub_rest = 0
            return
        konto = urlaubskonto(self.mitarbeiter, getdate(self.von).year, ausser=self.name)
        self.urlaub_anspruch = konto["anspruch"]
        self.urlaub_genommen = konto["genommen"]
        self.urlaub_beantragt = konto["beantragt"]
        eigener = self.tage if self.status in BLOCKIEREND else 0
        self.urlaub_rest = konto["anspruch"] - konto["genommen"] - konto["beantragt"] - eigener
        if self.urlaub_rest < 0 and self.status in BLOCKIEREND:
            frappe.msgprint(_("Hinweis: Urlaubskonto {0} wird um {1} Tage überschritten.").format(getdate(self.von).year, abs(self.urlaub_rest)), indicator="orange")

    def on_update(self):
        alt = self.get_doc_before_save()
        if alt and alt.status != self.status and self.status in ("Genehmigt", "Abgelehnt") and self.beantragt_von and self.beantragt_von != frappe.session.user:
            try:
                frappe.share.add_docshare(self.doctype, self.name, self.beantragt_von, read=1, flags={"ignore_share_permission": True})
                self.add_comment("Info", _("{0} durch {1}").format(_(self.status), frappe.session.user))
            except Exception:  # noqa: BLE001
                pass

    # ── Buttons (ph_abwesenheit.js) ─────────────────────────────────────────

    @frappe.whitelist()
    def stornieren(self):
        """Button „Stornieren“: eigene oder genehmigte Abwesenheit zurückziehen (nur vor Beginn, sonst Leitung)."""
        self.check_permission("write")
        if self.status in ("Storniert", "Abgelehnt"):
            return self.status
        if getdate(self.von) <= getdate(nowdate()) and "PH Personal Leitung" not in frappe.get_roles() and frappe.session.user != "Administrator":
            frappe.throw(_("Bereits begonnene Abwesenheiten kann nur die Leitung stornieren."))
        self.status = "Storniert"
        self.workflow_state = WORKFLOW_STATE["Storniert"]
        self.save()
        self.add_comment("Info", _("Storniert durch {0}").format(frappe.session.user))
        return self.status


def urlaubskonto(mitarbeiter, jahr, ausser=None):
    """Anspruch, genommen (genehmigt), beantragt (offen), Rest – Urlaub mit Beginn im Jahr."""
    ma = frappe.get_doc("PH Mitarbeiter", mitarbeiter)
    anspruch = float(ma.urlaubsanspruch_effektiv())
    rows = frappe.get_all(
        "PH Abwesenheit",
        filters={"mitarbeiter": mitarbeiter, "art": "Urlaub", "status": ("in", BLOCKIEREND), "von": ("between", [date(jahr, 1, 1), date(jahr, 12, 31)]), "name": ("!=", ausser or "")},
        fields=["status", "tage"],
    )
    genommen = sum(float(r.tage or 0) for r in rows if r.status == "Genehmigt")
    beantragt = sum(float(r.tage or 0) for r in rows if r.status == "Beantragt")
    return {"mitarbeiter": mitarbeiter, "jahr": jahr, "anspruch": anspruch, "genommen": genommen, "beantragt": beantragt, "rest": anspruch - genommen - beantragt}


def heute_abwesend(datum=None):
    datum = getdate(datum or nowdate())
    return frappe.get_all("PH Abwesenheit", filters={"status": "Genehmigt", "von": ("<=", datum), "bis": (">=", datum)}, fields=["mitarbeiter", "mitarbeiter_name", "art", "bis"])


def offene_antraege():
    return frappe.db.count("PH Abwesenheit", {"status": "Beantragt"})
