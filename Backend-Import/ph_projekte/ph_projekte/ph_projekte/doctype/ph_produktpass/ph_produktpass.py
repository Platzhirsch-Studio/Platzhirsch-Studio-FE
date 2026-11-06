"""PH Produktpass – digitaler Produktpass je geliefertem Stück (Portal /portal/pass/<id>)."""

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import getdate, nowdate

from ph_projekte.ph_projekte.helfer import portal_url
from ph_projekte.utils.portal import garantie_bis


class PHProduktpass(Document):
    def before_insert(self):
        if not self.status:
            self.status = "Aktiv"

    def validate(self):
        if self.projekt and self.kontakt and frappe.db.get_value("PH Projekt", self.projekt, "kontakt") != self.kontakt:
            frappe.throw(_("Das Projekt gehört nicht zu diesem Kunden."))
        if self.produkt and not self.produkt_name and frappe.db.exists("DocType", "PH Produkt"):
            self.produkt_name = frappe.db.get_value("PH Produkt", self.produkt, "titel") or self.produkt
        self.garantie_bis = garantie_bis(self.lieferdatum, self.garantie_monate)
        if self.status == "Aktiv" and self.garantie_bis and getdate(self.garantie_bis) < getdate(nowdate()):
            self.status = "Garantie abgelaufen"
        self.titel = f"{self.produkt_name}{' · ' + self.marke if self.marke else ''}"[:140]

    @frappe.whitelist()
    def portal_link(self):
        self.check_permission("read")
        return portal_url(f"pass/{self.name}")

    @frappe.whitelist()
    def status_setzen(self, status):
        self.check_permission("write")
        if status not in ("Aktiv", "Garantie abgelaufen", "Verkauft", "Entsorgt"):
            frappe.throw(_("Unbekannter Status."))
        self.db_set("status", status)
        return status


def garantie_pruefen():
    """Täglich (Scheduler): abgelaufene Garantien markieren."""
    for name in frappe.get_all("PH Produktpass", filters={"status": "Aktiv", "garantie_bis": ("<", nowdate())}, pluck="name"):
        frappe.db.set_value("PH Produktpass", name, "status", "Garantie abgelaufen", update_modified=False)
    frappe.db.commit()


def pass_anlegen(*, kontakt, projekt=None, position=None, produkt=None, produkt_name=None, marke=None, kategorie=None,
                 ausfuehrung_text=None, seriennummer=None, lieferdatum=None, montageauftrag=None, quelle="backoffice", idempotency_key=None,
                 e_nummer=None, fd_nummer=None):
    """Gemeinsame Anlage eines PH Produktpasses (PH Projekt.produktpaesse_erzeugen, ph_projekte.api.create_product_passes,
    ph_logistik-Lieferschein). Idempotent: vorhandener Pass zu (projekt, position) bzw. (produkt, seriennummer) bzw.
    wird zurückgegeben (name, neu=False). Garantie rechnet validate() (garantie_bis)."""
    # PH Produktpass hat kein idempotency_key-Feld; Idempotenz über (projekt, position) bzw. (produkt, seriennummer),
    # der idempotency_key fließt in `position` des Aufrufers (create_product_passes) ein.
    vorhanden = None
    if projekt and position:
        vorhanden = frappe.db.get_value("PH Produktpass", {"projekt": projekt, "position": position}, "name")
    if not vorhanden and produkt and seriennummer:
        vorhanden = frappe.db.get_value("PH Produktpass", {"produkt": produkt, "seriennummer": seriennummer}, "name")
    if vorhanden:
        return vorhanden, False
    werte = {
        "doctype": "PH Produktpass",
        "kontakt": kontakt,
        "projekt": projekt,
        "position": position,
        "produkt": produkt,
        "produkt_name": produkt_name,
        "marke": marke,
        "kategorie": kategorie,
        "ausfuehrung_text": ausfuehrung_text,
        "seriennummer": seriennummer,
        "e_nummer": e_nummer,
        "fd_nummer": fd_nummer,
        "lieferdatum": lieferdatum,
        "montageauftrag": montageauftrag,
        "quelle": quelle if quelle in ("backoffice", "website", "system") else "system",
    }
    if produkt and (not marke or not kategorie or not produkt_name) and frappe.db.exists("DocType", "PH Produkt"):
        pr = frappe.db.get_value("PH Produkt", produkt, ["titel", "marke", "kategorie"], as_dict=True) or {}
        werte["produkt_name"] = werte["produkt_name"] or pr.get("titel")
        werte["marke"] = werte["marke"] or pr.get("marke")
        werte["kategorie"] = werte["kategorie"] or pr.get("kategorie")
    if montageauftrag and not (e_nummer and fd_nummer):
        # Gerät aus dem Montageprotokoll (PH Montage Geraet: projekt_zeile = Projektposition, seriennummer) übernehmen
        for g in frappe.get_all("PH Montage Geraet", filters={"parent": montageauftrag, "parenttype": "PH Montageauftrag"}, fields=["projekt_zeile", "seriennummer", "e_nummer", "fd_nummer"]):
            if (position and g.projekt_zeile == position) or (seriennummer and g.seriennummer == seriennummer):
                werte["e_nummer"] = werte["e_nummer"] or g.e_nummer
                werte["fd_nummer"] = werte["fd_nummer"] or g.fd_nummer
                werte["seriennummer"] = werte["seriennummer"] or g.seriennummer
                break
    doc = frappe.get_doc(werte).insert(ignore_permissions=True)
    return doc.name, True
