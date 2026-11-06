"""PH Mahnung – Stufe 1–3 zu einer offenen Rechnung (Button „Mahnen“ oder Mahnlauf)."""

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import add_days, cint, getdate, now_datetime, nowdate

from ph_faktura import einstellungen, journal, versand
from ph_faktura.rechenwerk import mahnen as M


class PHMahnung(Document):
    def onload(self):
        email = None
        if self.kontakt and frappe.db.exists("DocType", "PH Kontakt"):
            try:
                email = frappe.db.get_value("PH Kontakt", self.kontakt, "email")
            except Exception:  # noqa: BLE001
                email = None
        self.set_onload("kontakt_email", email)

    def before_insert(self):
        self.status = "Entwurf"

    def validate(self):
        einst = einstellungen.mahnwesen()
        re = frappe.db.get_value("PH Rechnung", self.rechnung, ["docstatus", "status", "kontakt", "kunde_name", "offen_cent", "faellig", "mahnstufe", "mahnsperre", "firma"], as_dict=True)
        if not re or re.docstatus != 1:
            frappe.throw(_("Rechnung {0} ist nicht gestellt.").format(self.rechnung))
        if self.status == "Entwurf":
            if cint(re.offen_cent) <= 0:
                frappe.throw(_("Rechnung {0} ist nicht offen.").format(self.rechnung))
            if re.mahnsperre:
                frappe.throw(_("Rechnung {0} hat eine Mahnsperre.").format(self.rechnung))
            self.kontakt = re.kontakt
            self.kunde_name = re.kunde_name
            self.offen_cent = cint(re.offen_cent)
        self.stufe = min(max(cint(self.stufe) or 1, 1), 3)
        if not self.frist:
            self.frist = add_days(self.datum or nowdate(), cint(einst.get("frist_tage") or 7))
        self.verzugstage = M.verzugstage(getdate(re.faellig), getdate(self.datum or nowdate()), 0) if re.faellig else 0
        if self.status == "Entwurf" and not self.get_doc_before_save():
            bereits = bool(frappe.db.exists("PH Mahnung", {"rechnung": self.rechnung, "pauschale_cent": (">", 0), "status": ("!=", "Storniert"), "name": ("!=", self.name)}))
            b = M.mahnbetrag(self.offen_cent, self.stufe, self.verzugstage, einst, unternehmer=bool(re.firma), pauschale_bereits=bereits)
            self.zinssatz_bp = b.get("zinssatz_bp")
            self.pauschale_cent = b.get("pauschale_cent")
            self.mahngebuehr_cent = b["mahngebuehr_cent"]
            self.verzugszinsen_cent = b["verzugszinsen_cent"]
            self.zinssatz_promille = b["zinssatz_promille"]
        self.gesamt_cent = cint(self.offen_cent) + cint(self.mahngebuehr_cent) + cint(self.verzugszinsen_cent)
        if not self.text:
            self.text = einst.get(f"text{self.stufe}") or ""
        self.titel = f"{_('Mahnung')} {self.stufe}: {self.rechnung} – {self.kunde_name}"[:140]

    @frappe.whitelist()
    def senden(self, empfaenger=None, betreff=None, nachricht=None):
        """Button „Senden“: PDF per Mail (oder nur als gesendet markieren bei Post), Rechnung → Gemahnt."""
        self.check_permission("write")
        if self.status != "Entwurf":
            frappe.throw(_("Mahnung wurde bereits gesendet."))
        if self.kanal in ("E-Mail", "E-Mail und Post"):
            if not empfaenger:
                frappe.throw(_("E-Mail-Adresse fehlt."))
            betreff = betreff or {1: _("Zahlungserinnerung"), 2: _("Mahnung"), 3: _("Letzte Mahnung")}[self.stufe] + f" – {self.rechnung}"
            versand.senden(self, empfaenger, betreff, nachricht)
        else:
            self.db_set("gesendet_am", now_datetime(), update_modified=False)
        self.db_set({"status": "Gesendet"}, update_modified=True)
        frappe.db.set_value("PH Rechnung", self.rechnung, {"mahnstufe": self.stufe, "letzte_mahnung": self.datum, "status": "Gemahnt", "workflow_state": "PH Gemahnt"}, update_modified=False)
        journal.schreibe("Mahnung", self, self.gesamt_cent, f"Stufe {self.stufe} zu {self.rechnung}, Gebühr {self.mahngebuehr_cent}, Zinsen {self.verzugszinsen_cent}")
        return True

    @frappe.whitelist()
    def erledigen(self):
        self.check_permission("write")
        self.db_set({"status": "Erledigt", "erledigt_am": now_datetime()}, update_modified=True)
        return True

    @frappe.whitelist()
    def stornieren(self):
        self.check_permission("write")
        if self.status == "Gesendet":
            frappe.throw(_("Gesendete Mahnungen werden nicht storniert – bitte „Erledigt“ setzen."))
        self.db_set({"status": "Storniert"}, update_modified=True)
        return True
