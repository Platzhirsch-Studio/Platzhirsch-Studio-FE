"""PH Datenschutzanfrage – Betroffenenanfrage (Art. 15–21 DSGVO) mit Frist (Art. 12 Abs. 3: 1 Monat,
verlängerbar um 2 Monate), Identitätsprüfung, Export, Lösch-/Aufbewahrungsplan (§ 132 BAO) und Nachweis
(Rechenschaftspflicht Art. 5 Abs. 2). Status über Buttons (ph_datenschutzanfrage.js), kein Workflow.

  Offen → In Arbeit (bearbeiten) → Erledigt (auskunft_erstellen / loeschung_ausfuehren / abschliessen)
                                  → Abgelehnt (ablehnen, Begründung Pflicht – z. B. Identität nicht nachgewiesen)
"""

import json

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import add_months, getdate, now_datetime

LEITUNG = ("System Manager", "PH CRM Leitung", "PH Backoffice-Admin")


class PHDatenschutzanfrage(Document):
    def before_insert(self):
        self.status = "Offen"

    def validate(self):
        self.eingang = self.eingang or getdate()
        self.frist = add_months(getdate(self.eingang), 3 if self.verlaengert else 1)
        if self.verlaengert and not (self.verlaengerung_grund or "").strip():
            frappe.throw(_("Verlängerung nur mit Begründung (Art. 12 Abs. 3 Satz 2 DSGVO)."))
        titel = frappe.db.get_value("PH Kontakt", self.kontakt, "titel") if self.kontakt else ""
        self.titel = f"{_(self.art)}: {titel}"[:140]

    def after_insert(self):
        if self.art == "Loeschung" and self.kontakt:
            frappe.db.set_value("PH Kontakt", self.kontakt, "loeschung_angefordert_am", self.eingang, update_modified=False)
        if self.art == "Widerspruch" and self.kontakt:
            frappe.get_doc("PH Kontakt", self.kontakt).widerspruch_erfassen(quelle=_("Datenschutzanfrage {0}").format(self.name))

    def _status(self, status, **werte):
        self.db_set({"status": status, **werte}, notify=True)

    def _offen_pruefen(self):
        if self.status in ("Erledigt", "Abgelehnt"):
            frappe.throw(_("Anfrage ist bereits {0}.").format(_(self.status)))

    def _identitaet(self):
        if not self.identitaet_geprueft:
            frappe.throw(_("Bitte zuerst die Identität der anfragenden Person prüfen und abhaken."))

    @frappe.whitelist()
    def bearbeiten(self):
        self.check_permission("write")
        self._offen_pruefen()
        self._status("In Arbeit", zugewiesen_an=self.zugewiesen_an or frappe.session.user)
        return self.status

    @frappe.whitelist()
    def auskunft_erstellen(self):
        """Export aller Daten (JSON, privat an dieser Anfrage); bei Art „Auskunft“/„Datenuebertragbarkeit“ erledigt."""
        frappe.only_for(LEITUNG + ("PH Geschäftsführung",))
        self._offen_pruefen()
        self._identitaet()
        from ph_crm.ph_crm.dsgvo import export

        url = export(self.kontakt, an_doctype=self.doctype, an_name=self.name)
        werte = {"export_datei": url}
        if self.art in ("Auskunft", "Datenuebertragbarkeit"):
            werte.update({"erledigt_am": now_datetime(), "erledigt_von": frappe.session.user})
            self._status("Erledigt", **werte)
        else:
            self.db_set(werte)
        return url

    @frappe.whitelist()
    def loeschplan_erstellen(self):
        frappe.only_for(LEITUNG + ("PH Geschäftsführung",))
        from ph_crm.ph_crm.dsgvo import plan
        from ph_crm.utils.aufbewahrung import gesamtfrist

        p = plan(self.kontakt)
        self.db_set({"plan": json.dumps(p, ensure_ascii=False, indent=1, default=str), "aufbewahren_bis": gesamtfrist(p)})
        return p

    @frappe.whitelist()
    def loeschung_ausfuehren(self, bestaetigung=None):
        """Plan ausführen (Leitung, Bestätigung „ANONYMISIEREN“) und Anfrage abschließen."""
        frappe.only_for(LEITUNG)
        self._offen_pruefen()
        self._identitaet()
        if self.art != "Loeschung":
            frappe.throw(_("Nur Löschanfragen werden hier ausgeführt."))
        from ph_crm.ph_crm.dsgvo import ausfuehren

        erg = ausfuehren(self.kontakt, bestaetigung, anfrage=self.name)
        g = erg["gezaehlt"]
        text = _("Gelöscht: {0}, anonymisiert: {1}, aufbewahrt: {2}.").format(g["loeschen"], g["anonymisieren"], g["aufbewahren"])
        if erg["aufbewahren_bis"]:
            text += " " + _("Belege werden nach § 132 BAO bis {0} aufbewahrt und danach anonymisiert.").format(erg["aufbewahren_bis"])
        self._status("Erledigt", plan=json.dumps(erg["plan"], ensure_ascii=False, indent=1, default=str), aufbewahren_bis=erg["aufbewahren_bis"], erledigt_am=now_datetime(), erledigt_von=frappe.session.user, ergebnis=((self.ergebnis or "") + "\n" + text).strip())
        return erg

    @frappe.whitelist()
    def abschliessen(self, ergebnis=None):
        """Berichtigung/Einschränkung/Widerspruch: Ergebnis dokumentieren und erledigen."""
        self.check_permission("write")
        self._offen_pruefen()
        self._identitaet()
        if not (ergebnis or self.ergebnis):
            frappe.throw(_("Bitte das Ergebnis eintragen."))
        self._status("Erledigt", ergebnis=ergebnis or self.ergebnis, erledigt_am=now_datetime(), erledigt_von=frappe.session.user)
        return self.status

    @frappe.whitelist()
    def ablehnen(self, grund):
        frappe.only_for(LEITUNG)
        self._offen_pruefen()
        if not (grund or "").strip():
            frappe.throw(_("Ablehnung nur mit Begründung (Art. 12 Abs. 4 DSGVO)."))
        self._status("Abgelehnt", ergebnis=grund, erledigt_am=now_datetime(), erledigt_von=frappe.session.user)
        return self.status
