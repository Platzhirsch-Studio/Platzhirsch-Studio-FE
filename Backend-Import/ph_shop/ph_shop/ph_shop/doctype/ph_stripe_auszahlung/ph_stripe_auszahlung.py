"""PH Stripe Auszahlung – Payout-Abgleich: enthaltene Balance Transactions ↔ PH Zahlung.

Button „Abgleichen“: holt die Transaktionen des Payouts (stripe_client.payout_transactions; Simulation → aus
den gebuchten PH Zahlungen des Zeitraums), ordnet sie Zahlungen zu (Payment Intent/Charge/Refund), trägt
Gebühren ein und rechnet Auszahlung − Σ Netto = Differenz. Differenz ≠ 0 → Aufgabe an die Leitung.
"""

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import cint, now_datetime

from ph_shop import stripe_client


class PHStripeAuszahlung(Document):
    def validate(self):
        self.titel = self.titel or f"Payout {self.payout_id} · {cint(self.betrag_cent) / 100:.2f} {self.waehrung or 'EUR'}"

    @frappe.whitelist()
    def abgleichen(self):
        self.check_permission("write")
        zeilen = self._transaktionen()
        self.set("zahlungen", [])
        brutto = gebuehren = netto = 0
        for t in zeilen:
            zahlung = _zahlung_zu(t)
            self.append("zahlungen", {"balance_transaction": t.get("id"), "typ": t.get("type"), "zahlung": zahlung, "betrag_cent": cint(t.get("amount")), "gebuehr_cent": cint(t.get("fee")), "netto_cent": cint(t.get("net")), "hinweis": "" if zahlung or t.get("type") in ("payout", "stripe_fee") else _("keine PH Zahlung")})
            if t.get("type") not in ("payout",):
                brutto += cint(t.get("amount"))
                gebuehren += cint(t.get("fee"))
                netto += cint(t.get("net"))
            if zahlung:
                frappe.db.set_value("PH Zahlung", zahlung, {"stripe_auszahlung": self.name, "stripe_balance_transaction": t.get("id"), "stripe_gebuehr_cent": cint(t.get("fee"))}, update_modified=False)
        self.brutto_cent = max(brutto, 0)
        self.gebuehren_cent = gebuehren
        self.differenz_cent = cint(self.betrag_cent) - netto
        self.abgeglichen_am = now_datetime()
        if self.differenz_cent == 0 and zeilen:
            self.status = "abgeglichen"
        self.flags.ignore_permissions = True
        self.save()
        if self.differenz_cent != 0:
            from ph_shop.ph_shop.mails import aufgabe

            aufgabe(_("Stripe-Auszahlung {0}: Differenz {1} Cent zwischen Payout und gebuchten Zahlungen.").format(self.name, self.differenz_cent), self.doctype, self.name)
        return {"differenz_cent": self.differenz_cent, "zeilen": len(zeilen), "simuliert": stripe_client.simulation()}

    def _transaktionen(self):
        if not stripe_client.simulation():
            return [dict(t) for t in stripe_client.payout_transactions(self.payout_id)]
        # Simulation: alle gebuchten Stripe-Zahlungen ohne Auszahlung bis zum erwarteten Datum als Näherung.
        filters = {"docstatus": 1, "kanal": ("like", "Stripe%"), "stripe_auszahlung": ("in", ("", None))}
        if self.datum_erwartet:
            filters["zeitpunkt"] = ("<=", self.datum_erwartet)
        out = []
        for z in frappe.get_all("PH Zahlung", filters, ["name", "art", "betrag_cent", "stripe_gebuehr_cent", "stripe_payment_intent", "stripe_refund"]):
            vz = -1 if z.art == "Erstattung" else 1
            out.append({"id": f"txn_sim_{z.name}", "type": "refund" if z.art == "Erstattung" else "charge", "amount": vz * cint(z.betrag_cent), "fee": cint(z.stripe_gebuehr_cent) if vz > 0 else 0, "net": vz * cint(z.betrag_cent) - (cint(z.stripe_gebuehr_cent) if vz > 0 else 0), "source": {"payment_intent": z.stripe_payment_intent, "id": z.stripe_refund}, "_zahlung": z.name})
        return out


def _zahlung_zu(t):
    if t.get("_zahlung"):
        return t["_zahlung"]
    src = t.get("source") or {}
    if isinstance(src, str):
        src = {"id": src}
    pi = src.get("payment_intent") if isinstance(src, dict) else None
    if t.get("type") == "refund" and src.get("id"):
        return frappe.db.get_value("PH Zahlung", {"stripe_refund": src.get("id")}, "name")
    if pi:
        return frappe.db.get_value("PH Zahlung", {"stripe_payment_intent": pi, "art": "Eingang"}, "name")
    if src.get("id"):
        return frappe.db.get_value("PH Zahlung", {"stripe_charge": src.get("id")}, "name")
    return None
