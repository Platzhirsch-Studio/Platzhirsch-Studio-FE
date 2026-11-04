"""PH Eingangsrechnung – Erfassung → sachliche Prüfung (Mitarbeiter) → Freigabe (Leitung) → Bezahlt.

Vorsteuer je USt-Fall (UVA-Zuarbeit):
  Vorsteuer AT                 → KZ 060 = ausgewiesene USt
  Reverse Charge EU            → KZ 057 Steuerschuld = netto × 20 %, KZ 066 Vorsteuer gleich hoch (Nullsumme)
  Innergemeinschaftlicher Erwerb → KZ 070 Bemessung, KZ 072 Erwerbsteuer 20 %, KZ 065 Vorsteuer igE
  Einfuhr Drittland            → KZ 061 EUSt (hier: ausgewiesene EUSt als Vorsteuer)
  Keine Vorsteuer              → 0
"""

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import add_days, cint, now_datetime, nowdate

from ph_faktura import einstellungen, journal, zahlung
from ph_faktura.beleg import BelegMixin
from ph_faktura.rechenwerk import steuer as S
from ph_faktura.rechenwerk.steuer import rund

LEITUNG = ("PH Faktura Leitung", "PH Geschäftsführung", "System Manager")


class PHEingangsrechnung(BelegMixin, Document):
    def before_insert(self):
        self.status = "Erfasst"
        self.workflow_state = "PH Erfasst"

    def validate(self):
        e = einstellungen.faktura()
        if self.status in ("Bezahlt", "Abgelehnt") and not self.flags.ph_system:
            alt = self.get_doc_before_save()
            if alt and (alt.brutto_cent != self.brutto_cent or alt.netto_cent != self.netto_cent):
                frappe.throw(_("Beträge einer {0} Eingangsrechnung sind gesperrt.").format(_(self.status).lower()))
        if self.lieferant and not self.lieferant_name and frappe.db.exists("DocType", "PH Lieferant"):
            self.lieferant_name = frappe.db.get_value("PH Lieferant", self.lieferant, "firmenname") or self.lieferant
        if frappe.db.exists("PH Eingangsrechnung", {"lieferant_name": self.lieferant_name, "rechnungsnummer_lieferant": self.rechnungsnummer_lieferant, "name": ("!=", self.name), "status": ("!=", "Abgelehnt")}):
            frappe.throw(_("Rechnung {0} von {1} ist bereits erfasst (Doppelerfassung).").format(self.rechnungsnummer_lieferant, self.lieferant_name))
        if self.positionen:
            self.positionen_pruefen()
            self.positionen_berechnen()
            if self.ust_fall != "Vorsteuer AT":
                self.ust_cent = 0
        if cint(self.brutto_cent) == 0 and cint(self.netto_cent):
            self.brutto_cent = cint(self.netto_cent) + cint(self.ust_cent)
        if cint(self.brutto_cent) != cint(self.netto_cent) + cint(self.ust_cent):
            frappe.throw(_("Brutto ({0}) ≠ Netto ({1}) + USt ({2}).").format(self.brutto_cent, self.netto_cent, self.ust_cent))
        if not self.faellig:
            self.faellig = add_days(self.datum, 30)
        self.land_lieferant = S.land_code(self.land_lieferant or "AT")
        self.steuer_berechnen()
        self.skonto_cent = rund(cint(self.brutto_cent) * cint(self.skonto_promille) / 1000) if self.skonto_promille else 0
        self.zahlbetrag_cent = cint(self.brutto_cent) - (self.skonto_cent if self.skonto_bis and nowdate() <= str(self.skonto_bis) else 0)
        if not self.konto_aufwand:
            self.konto_aufwand = e.get("aufwandskonto_standard") or "5000"
        self.titel = f"{self.lieferant_name}: {self.rechnungsnummer_lieferant} ({cint(self.brutto_cent) / 100:,.2f} €)"[:140]

    def steuer_berechnen(self):
        netto = cint(self.netto_cent)
        if self.ust_fall == "Vorsteuer AT":
            self.vorsteuer_cent, self.rc_steuer_cent = cint(self.ust_cent), 0
        elif self.ust_fall in ("Reverse Charge EU", "Innergemeinschaftlicher Erwerb"):
            self.rc_steuer_cent = rund(netto * 20 / 100)
            self.vorsteuer_cent = self.rc_steuer_cent
            if self.ust_fall == "Innergemeinschaftlicher Erwerb" and not self.uid_lieferant:
                frappe.msgprint(_("Innergemeinschaftlicher Erwerb ohne UID des Lieferanten – bitte prüfen."), indicator="orange")
        elif self.ust_fall == "Einfuhr Drittland":
            self.vorsteuer_cent, self.rc_steuer_cent = cint(self.ust_cent), 0
        else:
            self.vorsteuer_cent = self.rc_steuer_cent = 0

    def status_setzen(self, status, **werte):
        self.db_set({"status": status, "workflow_state": f"PH {status}", **werte}, update_modified=True)

    @frappe.whitelist()
    def pruefen(self, vermerk=None):
        """Button „Prüfen“ (sachlich): Abgleich gegen Herstellerbestellung vermerken, Status Sachlich geprueft."""
        self.check_permission("write")
        if self.status != "Erfasst":
            frappe.throw(_("Nur erfasste Rechnungen können geprüft werden."))
        abweichung = self.abweichung_zur_ab
        if self.herstellerbestellung and frappe.db.exists("DocType", "PH Herstellerbestellung"):
            try:
                # PH Herstellerbestellung.summe_ek_cent = Einkaufssumme netto (ph_sortiment, geprüft 04.11.)
                hb = frappe.db.get_value("PH Herstellerbestellung", self.herstellerbestellung, ["summe_ek_cent"], as_dict=True)
                if hb and hb.summe_ek_cent and cint(hb.summe_ek_cent) != cint(self.netto_cent):
                    abweichung = _("Netto Bestellung {0} ≠ Rechnung {1} (Differenz {2} Cent)").format(hb.summe_ek_cent, self.netto_cent, cint(self.netto_cent) - cint(hb.summe_ek_cent))
            except Exception:  # noqa: BLE001
                pass
        self.status_setzen("Sachlich geprueft", geprueft_von=frappe.session.user, geprueft_am=now_datetime(), pruefvermerk=vermerk or self.pruefvermerk, abweichung_zur_ab=abweichung)
        return abweichung

    @frappe.whitelist()
    def freigeben(self):
        """Button „Freigeben“ (Leitung): Zahlung erlaubt, Zahllauf-Vormerkung."""
        self.check_permission("write")
        if not set(frappe.get_roles()) & set(LEITUNG):
            frappe.throw(_("Freigabe nur durch Leitung."))
        if self.status not in ("Erfasst", "Sachlich geprueft"):
            frappe.throw(_("Status {0} erlaubt keine Freigabe.").format(self.status))
        self.status_setzen("Freigegeben", freigegeben_von=frappe.session.user, freigegeben_am=now_datetime(), zahllauf=1)
        journal.schreibe("Eingangsrechnung", self, self.brutto_cent, f"Freigegeben: {self.lieferant_name} {self.rechnungsnummer_lieferant}")
        return True

    @frappe.whitelist()
    def ablehnen(self, grund):
        self.check_permission("write")
        self.flags.ph_system = True
        self.status_setzen("Abgelehnt", ablehnungsgrund=grund, zahllauf=0)
        return True

    @frappe.whitelist()
    def zurueck_an_erfassung(self):
        self.check_permission("write")
        if self.status == "Bezahlt":
            frappe.throw(_("Bezahlte Rechnungen bleiben bezahlt."))
        self.status_setzen("Erfasst", geprueft_von=None, geprueft_am=None, freigegeben_von=None, freigegeben_am=None, zahllauf=0)
        return True

    @frappe.whitelist()
    def als_bezahlt_buchen(self, datum=None, kanal="Ueberweisung", betrag_cent=None):
        """Button „Als bezahlt buchen“: PH Zahlung (Ausgang) und Status Bezahlt."""
        self.check_permission("write")
        if self.status != "Freigegeben":
            frappe.throw(_("Nur freigegebene Rechnungen können bezahlt werden."))
        betrag = cint(betrag_cent) or cint(self.zahlbetrag_cent) or cint(self.brutto_cent)
        name = zahlung.buche("Ausgang", kanal, betrag, "PH Eingangsrechnung", self.name, zeitpunkt=datum, zahlungsreferenz=self.zahlungsreferenz, notiz=f"{self.lieferant_name} {self.rechnungsnummer_lieferant}")
        zahlung.zahlung_auf_eingangsrechnung(self, betrag, datum, zahlung_name=name)
        return name


def zahllauf_vorschlag(stichtag=None):
    """Freigegebene Rechnungen, fällig bis Stichtag (oder Skonto nutzbar), sortiert nach Fälligkeit."""
    stichtag = stichtag or add_days(nowdate(), 7)
    rows = frappe.get_all("PH Eingangsrechnung", filters={"status": "Freigegeben"}, fields=["name", "lieferant_name", "rechnungsnummer_lieferant", "datum", "faellig", "skonto_bis", "skonto_cent", "brutto_cent", "zahlbetrag_cent", "iban_lieferant", "bic_lieferant", "zahlungsreferenz", "zahllauf", "projekt"], order_by="faellig asc")
    out = []
    for r in rows:
        skonto_nutzbar = bool(r.skonto_bis and str(r.skonto_bis) >= nowdate() and cint(r.skonto_cent))
        if str(r.faellig) <= str(stichtag) or skonto_nutzbar or r.zahllauf:
            r["skonto_nutzbar"] = skonto_nutzbar
            r["empfohlen_cent"] = cint(r.brutto_cent) - (cint(r.skonto_cent) if skonto_nutzbar else 0)
            r["grund"] = _("Skonto bis {0}").format(frappe.utils.formatdate(r.skonto_bis)) if skonto_nutzbar else _("fällig {0}").format(frappe.utils.formatdate(r.faellig))
            out.append(r)
    return out
