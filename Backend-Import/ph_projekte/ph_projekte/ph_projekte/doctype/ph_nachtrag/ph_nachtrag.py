"""PH Nachtrag – Änderungsauftrag zum Projekt mit Preisänderung und Kundenfreigabe.

Workflow „PH Nachtrag“: Entwurf → Vorgelegt → Freigegeben | Abgelehnt; Storniert (Leitung). Freigabe nur mit
Kundenunterschrift (Desk) oder Portal-Entscheidung (`entscheidung_quelle = portal`). Bei Freigabe werden die Positionen
einmalig ins Projekt übernommen (neu → Position, entfall → storniert, aenderung → Ausführung) und
PH Projekt.nachtraege_cent neu summiert. Logik: ph_projekte.utils.nachtrag.
"""

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import now_datetime

from ph_projekte.ph_projekte.helfer import portal_url, projekt_kontakt
from ph_projekte.utils import nachtrag as nt


class PHNachtrag(Document):
    def before_insert(self):
        if not self.status:
            self.status = "Entwurf"
        letzte = frappe.db.get_value("PH Nachtrag", {"projekt": self.projekt}, "max(nummer_im_projekt)") or 0
        self.nummer_im_projekt = int(letzte) + 1

    def validate(self):
        if not self.kontakt and self.projekt:
            self.kontakt = projekt_kontakt(self.projekt)
        fehler = nt.pruefen([z.as_dict() for z in self.positionen])
        if fehler:
            frappe.throw("<br>".join(frappe.utils.escape_html(f) for f in fehler))
        projekt_zeilen = {z.name for z in frappe.get_all("PH Projekt Position", filters={"parent": self.projekt, "parenttype": "PH Projekt"}, fields=["name"])}
        for z in self.positionen:
            if z.bezug_zeile and z.bezug_zeile not in projekt_zeilen:
                frappe.throw(_("Zeile {0}: Projektposition {1} gehört nicht zu diesem Projekt.").format(z.idx, z.bezug_zeile))
            z.betrag_cent = nt.zeilenbetrag(z.art, z.menge, z.einzel_cent)
        for k, v in nt.summen([z.as_dict() for z in self.positionen]).items():
            self.set(k, v)
        vorher = self.get_doc_before_save()
        if vorher and vorher.status != self.status and not nt.uebergang_erlaubt(vorher.status, self.status):
            frappe.throw(_("Übergang {0} → {1} ist nicht vorgesehen.").format(_(vorher.status), _(self.status)))
        if self.status == "Freigegeben" and not (self.unterschrift_kunde or self.entscheidung_quelle == "portal"):
            frappe.throw(_("Freigabe nur mit Unterschrift des Kunden oder Freigabe im Kundenportal."))
        if self.status == "Abgelehnt" and not (self.ablehnung_grund or self.kunde_kommentar):
            self.ablehnung_grund = _("ohne Angabe")
        if vorher and vorher.status != self.status:
            if self.status == "Vorgelegt" and not self.vorgelegt_am:
                self.vorgelegt_am = now_datetime()
            if self.status in ("Freigegeben", "Abgelehnt") and not self.entscheidung_am:
                self.entscheidung_am = now_datetime()
                self.entscheidung_quelle = self.entscheidung_quelle or "backoffice"
        if vorher and vorher.status == "Freigegeben" and (vorher.differenz_cent != self.differenz_cent or len(vorher.positionen) != len(self.positionen)):
            frappe.throw(_("Freigegebene Nachträge sind unveränderlich – bitte einen neuen Nachtrag anlegen."))
        self.titel = f"Nachtrag {self.nummer_im_projekt or ''}: {self.bezeichnung}"[:140]

    def on_update(self):
        if self.status == "Freigegeben" and not self.uebernommen:
            try:
                self.ins_projekt_uebernehmen()
            except Exception:  # noqa: BLE001
                frappe.log_error(title=f"PH Nachtrag {self.name}: Übernahme ins Projekt")

    # ── interne Schritte ────────────────────────────────────────────────────

    def ins_projekt_uebernehmen(self):
        if frappe.db.get_value("PH Nachtrag", self.name, "uebernommen"):
            return
        projekt =frappe.get_doc("PH Projekt", self.projekt)
        neu, aend = nt.projekt_aenderungen([z.as_dict() for z in self.positionen], self.name)
        for zeile in projekt.positionen:
            for k, v in (aend.get(zeile.name) or {}).items():
                zeile.set(k, v)
        for n in neu:
            projekt.append("positionen", n)
        projekt.flags.ignore_permissions = True
        projekt.save()
        summe = frappe.db.get_value("PH Nachtrag", {"projekt": self.projekt, "status": "Freigegeben"}, "sum(differenz_cent)") or 0
        frappe.db.set_value("PH Projekt", self.projekt, "nachtraege_cent", int(summe), update_modified=False)
        self.db_set("uebernommen", 1, update_modified=False)
        projekt.add_comment("Info", _("Nachtrag {0} freigegeben und übernommen ({1} neu, {2} geändert/entfallen)").format(self.name, len(neu), len(aend)))

    def _status(self, status, **werte):
        self.db_set({"status": status, "workflow_state": "PH " + status, **werte})

    # ── Buttons ─────────────────────────────────────────────────────────────

    @frappe.whitelist()
    def kunden_vorlegen(self, nachricht=None, frist=None):
        """Nachtrag sichtbar machen (Portal), Nachricht + Mail an den Kunden."""
        self.check_permission("write")
        if self.status != "Entwurf":
            frappe.throw(_("Nur Entwürfe können vorgelegt werden."))
        self._status("Vorgelegt", vorgelegt_am=now_datetime(), freigabe_frist=frist or self.freigabe_frist)
        text = (nachricht or "").strip() or _("Zu Ihrem Projekt liegt der Nachtrag „{0}“ zur Freigabe bereit (Differenz {1}).").format(self.bezeichnung, frappe.utils.fmt_money(self.differenz_cent / 100, currency=self.waehrung or "EUR"))
        if self.kontakt:
            frappe.get_doc({"doctype": "PH Projekt Nachricht", "kontakt": self.kontakt, "projekt": self.projekt, "richtung": "ausgehend", "text": text, "quelle": "backoffice"}).insert(ignore_permissions=True)
            email = frappe.db.get_value("PH Kontakt", self.kontakt, "email")
            if email:
                try:
                    from ph_core.utils.mail import sende

                    link = portal_url("projekte/" + self.projekt)
                    sende(email, _("Nachtrag zu Ihrem Projekt"), f"<p>{frappe.utils.escape_html(text)}</p><p><a href=\"{link}\">{_('Zum Kundenportal')}</a></p>", referenz_doctype=self.doctype, referenz_name=self.name)
                except Exception:  # noqa: BLE001
                    frappe.log_error(title="PH Nachtrag: Mail fehlgeschlagen")
        return "Vorgelegt"

    def _entscheiden(self, status, **werte):
        """Status per db_set (Workflow-Übergang ist fachlich hier geprüft), danach Übernahme ins Projekt."""
        if self.status != "Vorgelegt":
            frappe.throw(_("Dieser Nachtrag wartet nicht auf eine Entscheidung."))
        self._status(status, entscheidung_am=now_datetime(), **werte)
        self.reload()
        if status == "Freigegeben":
            self.ins_projekt_uebernehmen()
        self.add_comment("Info", _("Nachtrag {0} ({1})").format(_(status), _(self.entscheidung_quelle or "")))
        return status

    @frappe.whitelist()
    def freigabe_erfassen(self, unterschrift, name_kunde=None):
        """Desk/Tablet: Kunde unterschreibt den Nachtrag (Signature data:image/png)."""
        self.check_permission("write")
        if not unterschrift or not str(unterschrift).startswith("data:image"):
            frappe.throw(_("Keine gültige Unterschrift."))
        return self._entscheiden("Freigegeben", unterschrift_kunde=unterschrift, unterschrift_name=(name_kunde or "")[:140], entscheidung_quelle="backoffice")

    def kunde_entscheidet(self, entscheidung, kommentar=None, ip=None, name_kunde=None):
        """Portal: freigeben | ablehnen (Nachweis = Portal-Login mit Kunden-Token, Zeit, IP-Hash, Name)."""
        werte = {"kunde_kommentar": (kommentar or "")[:2000], "entscheidung_quelle": "portal", "freigabe_ip_hash": ip}
        if name_kunde:
            werte["unterschrift_name"] = name_kunde[:140]
        if entscheidung == "freigeben":
            return self._entscheiden("Freigegeben", **werte)
        if entscheidung == "ablehnen":
            return self._entscheiden("Abgelehnt", ablehnung_grund=werte["kunde_kommentar"] or _("im Portal abgelehnt"), **werte)
        frappe.throw(_("Unbekannte Entscheidung."))

    @frappe.whitelist()
    def ablehnen(self, grund=None):
        self.check_permission("write")
        return self._entscheiden("Abgelehnt", ablehnung_grund=grund or _("vom Kunden abgelehnt"), entscheidung_quelle="backoffice")
