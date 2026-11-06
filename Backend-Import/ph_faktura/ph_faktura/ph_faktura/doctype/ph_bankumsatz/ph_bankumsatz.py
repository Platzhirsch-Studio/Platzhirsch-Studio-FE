"""PH Bankumsatz – Zeile des Kontoauszugs mit Zuordnungsvorschlag und Zuordnung (Button „Zuordnen“)."""

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import cint, getdate

from ph_faktura import zahlung
from ph_faktura.rechenwerk import camt


class PHBankumsatz(Document):
    def before_insert(self):
        self.status = self.status or "Offen"

    def validate(self):
        self.richtung = "Eingang" if cint(self.betrag_cent) >= 0 else "Ausgang"
        zug = sum(cint(z.betrag_cent) for z in self.zuordnungen)
        self.zugeordnet_cent = zug
        if self.status != "Ignoriert":
            if zug >= abs(cint(self.betrag_cent)) and zug > 0:
                self.status = "Zugeordnet"
            elif zug > 0:
                self.status = "Teilweise"
            else:
                self.status = "Offen"
        self.titel = f"{getdate(self.buchungsdatum).strftime('%d.%m.%Y')} {self.auftraggeber or ''} {cint(self.betrag_cent) / 100:,.2f} €"[:140]
        if self.status == "Offen" and not self.vorschlag_beleg:
            self.vorschlag_berechnen()

    def offene_belege(self):
        if cint(self.betrag_cent) >= 0:
            rows = frappe.get_all("PH Rechnung", filters={"docstatus": 1, "offen_cent": (">", 0), "status": ("not in", ("Storniert", "Uneinbringlich"))}, fields=["name", "nummer", "kunde_name", "offen_cent", "zahlungsreferenz"])
            return [{"doctype": "PH Rechnung", **r} for r in rows]
        rows = frappe.get_all("PH Eingangsrechnung", filters={"status": "Freigegeben", "belegart": ("!=", "Gutschrift")}, fields=["name", "rechnungsnummer_lieferant as nummer", "lieferant_name as kunde_name", "zahlbetrag_cent as offen_cent", "zahlungsreferenz"])
        out = [{"doctype": "PH Eingangsrechnung", **r} for r in rows]
        # Rücküberweisung an Kunden: gestellte Gutschriften mit Erstattung „Rückzahlung“, noch nicht (voll) erstattet
        for g in frappe.get_all("PH Gutschrift", filters={"docstatus": 1, "erstattung_art": ("like", "R%ckzahlung"), "status": ("in", ("Gestellt",))}, fields=["name", "nummer", "kunde_name", "brutto_cent", "erstattet_cent"]):
            offen = cint(g.brutto_cent) - cint(g.erstattet_cent)
            if offen > 0:
                out.append({"doctype": "PH Gutschrift", "name": g.name, "nummer": g.nummer, "kunde_name": g.kunde_name, "offen_cent": offen, "zahlungsreferenz": g.nummer})
        return out

    def vorschlag_berechnen(self):
        v = camt.vorschlag({"betrag_cent": self.betrag_cent, "verwendungszweck": self.verwendungszweck, "auftraggeber": self.auftraggeber, "end_to_end_id": self.end_to_end_id}, self.offene_belege())
        if v:
            self.vorschlag_doctype, self.vorschlag_beleg, self.vorschlag_grund, self.vorschlag_sicherheit = v["doctype"], v["name"], v["grund"], v["sicherheit"]
        else:
            self.vorschlag_doctype = self.vorschlag_beleg = self.vorschlag_grund = None
            self.vorschlag_sicherheit = 0
        return v

    @frappe.whitelist()
    def vorschlaege(self):
        """Für den Zuordnen-Dialog: alle passenden offenen Belege (Vorschlag zuerst)."""
        belege = self.offene_belege()
        v = self.vorschlag_berechnen()
        belege.sort(key=lambda b: (0 if v and b["name"] == v["name"] else 1, -(1 if camt.name_aehnlich(b.get("kunde_name"), self.auftraggeber) else 0), b["name"]))
        return {"vorschlag": v, "belege": belege[:50]}

    @frappe.whitelist()
    @frappe.whitelist()
    def zuordnen_mehrere(self, zuordnungen):
        """Ein Bankumsatz für mehrere Belege (Sammelüberweisung): [{beleg_doctype, beleg, betrag_cent, skonto}]."""
        self.check_permission("write")
        if isinstance(zuordnungen, str):
            zuordnungen = frappe.parse_json(zuordnungen)
        rest = abs(cint(self.betrag_cent)) - cint(self.zugeordnet_cent)
        if sum(cint(z.get("betrag_cent")) for z in zuordnungen) > rest:
            frappe.throw(_("Summe der Zuordnungen übersteigt den offenen Umsatzbetrag ({0} Cent).").format(rest))
        namen = []
        for z in zuordnungen:
            doc = frappe.get_doc("PH Bankumsatz", self.name)
            namen.append(doc.zuordnen(z.get("beleg_doctype"), z.get("beleg"), z.get("betrag_cent"), skonto=z.get("skonto")))
        return namen

    @frappe.whitelist()
    def zuordnen(self, beleg_doctype=None, beleg=None, betrag_cent=None, skonto=0):
        """Button „Zuordnen“: PH Zahlung buchen und Beleg fortschreiben (Rechnung, Eingangsrechnung, Gutschrift-Erstattung).
        skonto=1 bei Rechnung: Differenz zum offenen Betrag als Kundenskonto ausbuchen (Frist/Höhe geprüft)."""
        self.check_permission("write")
        beleg_doctype = beleg_doctype or self.vorschlag_doctype
        beleg = beleg or self.vorschlag_beleg
        if not beleg:
            frappe.throw(_("Kein Beleg gewählt."))
        rest = abs(cint(self.betrag_cent)) - cint(self.zugeordnet_cent)
        betrag = cint(betrag_cent) or rest
        if betrag <= 0 or betrag > rest:
            frappe.throw(_("Betrag muss zwischen 1 und {0} Cent liegen.").format(rest))
        if beleg_doctype == "PH Rechnung":
            re = frappe.get_doc("PH Rechnung", beleg)
            sk = None
            if cint(skonto):
                from ph_faktura.rechenwerk import skonto as SK

                sk = SK.skonto_pruefen(cint(re.offen_cent), betrag, cint(re.zahlbar_cent), cint(re.skonto_promille), getdate(re.skonto_bis) if re.skonto_bis else None, getdate(self.valuta or self.buchungsdatum))
                if not sk["zulaessig"]:
                    frappe.throw(_("Skonto nicht zulässig: {0}").format(sk["grund"]))
            betrag = min(betrag, cint(re.offen_cent)) if cint(re.offen_cent) > 0 else betrag
            name = zahlung.buche("Eingang", "Ueberweisung", betrag, "PH Rechnung", beleg, zeitpunkt=self.valuta or self.buchungsdatum, kontakt=re.kontakt, zahlungsreferenz=re.zahlungsreferenz, bank_referenz=self.camt_ref, notiz=(self.verwendungszweck or "")[:140])
            zahlung.zahlung_auf_rechnung(re, betrag, "Ueberweisung", self.valuta or self.buchungsdatum, zahlung_name=name, hinweis=_("Bank {0}").format(self.name))
            if sk:
                frappe.get_doc("PH Rechnung", beleg).skonto_buchen(sk["skonto_cent"], self.valuta or self.buchungsdatum)
        elif beleg_doctype == "PH Eingangsrechnung":
            er = frappe.get_doc("PH Eingangsrechnung", beleg)
            name = zahlung.buche("Ausgang", "Ueberweisung", betrag, "PH Eingangsrechnung", beleg, zeitpunkt=self.valuta or self.buchungsdatum, zahlungsreferenz=er.zahlungsreferenz, bank_referenz=self.camt_ref, notiz=(self.verwendungszweck or "")[:140])
            zahlung.zahlung_auf_eingangsrechnung(er, betrag, self.valuta or self.buchungsdatum, zahlung_name=name, bankumsatz=self.name)
        elif beleg_doctype == "PH Gutschrift":
            gu = frappe.get_doc("PH Gutschrift", beleg)
            name = gu.erstatten(kanal="Ueberweisung", datum=self.valuta or self.buchungsdatum, betrag_cent=betrag)
        else:
            frappe.throw(_("Belegart {0} wird nicht unterstützt.").format(beleg_doctype))
        self.append("zuordnungen", {"beleg_doctype": beleg_doctype, "beleg": beleg, "betrag_cent": betrag, "zahlung": name})
        self.save()
        return name

    @frappe.whitelist()
    def ignorieren(self, grund=None):
        self.check_permission("write")
        self.status = "Ignoriert"
        self.ignoriert_grund = grund or _("manuell")
        self.save()
        return True

    @frappe.whitelist()
    def wieder_oeffnen(self):
        self.check_permission("write")
        self.status = "Offen"
        self.ignoriert_grund = None
        self.save()
        return True
