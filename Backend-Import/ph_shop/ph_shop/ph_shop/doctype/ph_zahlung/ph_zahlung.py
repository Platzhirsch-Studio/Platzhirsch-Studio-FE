"""PH Zahlung – gemeinsame Zahlungs-DocType (ph_shop, ph_faktura, ph_kassa). Anlage über ph_shop.zahlung.buche().

Buchungsregeln: Bezahlt = submitted; kein Löschen, kein Cancel – Korrektur nur per Gegenbuchung (Erstattung).
Button „Rückerstatten“: Teil/Voll + Grund → Stripe-Refund (stripe_client, simuliert auf Staging) + Gegenbuchung
(zahlung.erstatte) + Statusspiegel am Bezug (Bestellung/Gutschein-Bestellung/Anzahlung). Ab
PH Stripe Einstellungen.vier_augen_ab_cent (1.000 €) nur mit Freigabe der Geschäftsführung.
"""

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import cint, now_datetime

from ph_shop import stripe_client
from ph_shop.zahlung import STRIPE_KANAELE, erstatte

ROLLEN_ERSTATTEN = {"PH Shop Leitung", "PH Geschäftsführung", "System Manager", "PH Faktura Leitung", "PH Kassa Leitung"}
ROLLEN_FREIGABE = {"PH Geschäftsführung", "System Manager"}


class PHZahlung(Document):
    def validate(self):
        if cint(self.betrag_cent) <= 0:
            frappe.throw(_("Betrag muss größer als 0 Cent sein."))
        if self.art == "Erstattung" and not self.ursprung:
            frappe.throw(_("Erstattungen brauchen eine Ursprungszahlung – bitte über „Rückerstatten“ anlegen."))
        if self.kanal in STRIPE_KANAELE and self.art == "Eingang" and not self.stripe_payment_intent and self.docstatus == 1:
            frappe.throw(_("Stripe-Zahlungen brauchen einen Payment Intent."))
        self.betrag_eur = cint(self.betrag_cent) / 100
        self.zeitpunkt = self.zeitpunkt or now_datetime()
        self.titel = f"{self.art} {cint(self.betrag_cent) / 100:.2f} € · {self.kanal} · {self.bezug or self.zahlungsreferenz or '–'}"[:140]

    def before_submit(self):
        if self.status not in ("Bezahlt", "Teilerstattet", "Erstattet"):
            self.status = "Bezahlt"

    def on_cancel(self):
        frappe.throw(_("Gebuchte Zahlungen werden nicht storniert. Korrektur nur per Gegenbuchung (Button „Rückerstatten“)."))

    def on_trash(self):
        if self.docstatus == 1:
            frappe.throw(_("Gebuchte Zahlungen können nicht gelöscht werden."))

    # ── Buttons ──────────────────────────────────────────────────────────────
    @frappe.whitelist()
    def rueckerstatten(self, betrag_cent, grund, _intern=False):
        """Teil-/Vollerstattung. Rückgabe {"gegenbuchung", "stripe_refund", "simuliert"} oder {"angefordert": True}."""
        if not _intern:
            self.check_permission("write")
        rollen = set(frappe.get_roles())
        if not (rollen & ROLLEN_ERSTATTEN) and frappe.session.user != "Administrator":
            frappe.throw(_("Rückerstattungen darf nur die Leitung auslösen."), frappe.PermissionError)
        betrag_cent = cint(betrag_cent)
        offen = cint(self.betrag_cent) - cint(self.erstattet_cent)
        if betrag_cent <= 0 or betrag_cent > offen:
            frappe.throw(_("Betrag muss zwischen 1 und {0} Cent liegen.").format(offen))
        grenze = stripe_client.einstellungen()["vier_augen_ab_cent"]
        if betrag_cent > grenze and not (rollen & ROLLEN_FREIGABE) and frappe.session.user != "Administrator":
            self.db_set({"status": "Erstattung angefordert", "erstattung_angefordert_cent": betrag_cent, "erstattung_grund": (grund or "")[:140], "erstattung_angefordert_von": frappe.session.user, "erstattung_angefordert_am": now_datetime()})
            from ph_shop.ph_shop.mails import aufgabe

            aufgabe(_("Erstattung {0} Cent zu Zahlung {1} freigeben (Grund: {2}).").format(betrag_cent, self.name, grund), self.doctype, self.name, rolle="PH Geschäftsführung")
            self.add_comment("Info", _("Erstattung {0} Cent angefordert – Freigabe Geschäftsführung").format(betrag_cent))
            return {"angefordert": True}
        return self._erstattung_ausfuehren(betrag_cent, grund)

    @frappe.whitelist()
    def erstattung_freigeben(self):
        self.check_permission("write")
        if not (set(frappe.get_roles()) & ROLLEN_FREIGABE) and frappe.session.user != "Administrator":
            frappe.throw(_("Freigabe nur durch die Geschäftsführung."), frappe.PermissionError)
        if self.status != "Erstattung angefordert" or not cint(self.erstattung_angefordert_cent):
            frappe.throw(_("Keine offene Erstattungsanforderung."))
        return self._erstattung_ausfuehren(cint(self.erstattung_angefordert_cent), self.erstattung_grund)

    @frappe.whitelist()
    def erstattung_ablehnen(self, grund=None):
        self.check_permission("write")
        if self.status != "Erstattung angefordert":
            frappe.throw(_("Keine offene Erstattungsanforderung."))
        neu = "Teilerstattet" if cint(self.erstattet_cent) else "Bezahlt"
        self.db_set({"status": neu, "erstattung_angefordert_cent": 0, "erstattung_grund": None, "erstattung_angefordert_von": None, "erstattung_angefordert_am": None})
        self.add_comment("Info", _("Erstattungsanforderung abgelehnt: {0}").format(grund or "–"))
        return neu

    def _erstattung_ausfuehren(self, betrag_cent, grund):
        refund = None
        if self.kanal in STRIPE_KANAELE:
            if not self.stripe_payment_intent:
                frappe.throw(_("Kein Payment Intent – Erstattung im Stripe-Dashboard auslösen."))
            refund = stripe_client.refund_erstellen(self.stripe_payment_intent, betrag_cent, grund, metadata={"ph_zahlung": self.name, "bezug": self.bezug or ""})
        gegen = erstatte(self, betrag_cent, grund, stripe_refund=refund["id"] if refund else None, von=frappe.session.user, quelle="backoffice")
        self.reload()
        self._bezug_spiegeln(betrag_cent)
        return {"gegenbuchung": gegen.name, "stripe_refund": refund["id"] if refund else None, "simuliert": bool(refund and refund.get("simuliert"))}

    def _bezug_spiegeln(self, betrag_cent):
        """Status am Bezug (Bestellung, Gutschein-Bestellung, Anzahlung) nachziehen – bei Simulation kommt kein Webhook."""
        if not (self.bezug_doctype and self.bezug and frappe.db.exists(self.bezug_doctype, self.bezug)):
            return
        doc = frappe.get_doc(self.bezug_doctype, self.bezug)
        if hasattr(doc, "erstattung_vermerken"):
            doc.flags.ignore_permissions = True
            voll = cint(self.erstattet_cent) >= cint(self.betrag_cent)
            doc.erstattung_vermerken(self.stripe_payment_intent, cint(self.erstattet_cent), voll)

    @frappe.whitelist()
    def ankuendigung_stornieren(self, grund):
        """Angekündigte (nicht gebuchte, docstatus 0) Zahlung zurücknehmen – Leitung, Grund Pflicht
        (10-konzept-shop §10: ph_shop.zahlung.storniere war nicht whitelisted)."""
        from ph_shop.zahlung import storniere

        self.check_permission("write")
        if not (set(frappe.get_roles()) & ROLLEN_ERSTATTEN) and frappe.session.user != "Administrator":
            frappe.throw(_("Nur die Leitung kann angekündigte Zahlungen stornieren."), frappe.PermissionError)
        if not (grund or "").strip():
            frappe.throw(_("Bitte einen Grund angeben."))
        storniere(self, grund)
        self.add_comment("Info", _("Angekündigte Zahlung storniert: {0}").format(grund))
        return "Storniert"

    @frappe.whitelist()
    def radar_geprueft(self, notiz=None):
        self.check_permission("write")
        self.db_set({"radar_geprueft_von": frappe.session.user, "radar_geprueft_am": now_datetime()})
        self.add_comment("Info", _("Risiko geprüft: {0}").format(notiz or "–"))
        return True

    @frappe.whitelist()
    def auszahlung_zuordnen(self, auszahlung):
        self.check_permission("write")
        if not frappe.db.exists("PH Stripe Auszahlung", auszahlung):
            frappe.throw(_("Auszahlung nicht gefunden."))
        self.db_set("stripe_auszahlung", auszahlung)
        return auszahlung
