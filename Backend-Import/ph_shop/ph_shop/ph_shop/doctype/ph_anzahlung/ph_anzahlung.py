"""PH Anzahlung – Zahlungslink zu Auftrag/Angebot (src/lib/payments/deposit.js, AZ-XXXX-XXXX).

Der signierte Link (ID + HMAC) wird von der Website mit PAYMENTS_LINK_SECRET gebildet; im Backoffice nur,
wenn site_config ``ph_payments_link_secret`` denselben Wert trägt (ANFRAGEN-AN-CORE.md). Doppelte Zahlung
(zweite bezahlte Session, QA P2-1) wird vermerkt, gebucht und per Button erstattet – nie still geschluckt.
"""

import hashlib
import hmac
import base64

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import add_days, cint, get_datetime, now_datetime

from ph_shop import gutschein_code as gc
from ph_shop.ph_shop import mails, status as st

SETTLED = ("bezahlt", "erstattet", "teilerstattet", "doppelt")
LINK_TAGE = 14


class PHAnzahlung(Document):
    def before_insert(self):
        self.anzahlung_id = (self.anzahlung_id or gc.bestellnummer("AZ")).upper()
        self.erstellt = self.erstellt or now_datetime()
        self.erstellt_von = self.erstellt_von or frappe.session.user
        self.status = self.status or "offen"
        self.link_gueltig_bis = self.link_gueltig_bis or add_days(self.erstellt, LINK_TAGE)

    def validate(self):
        if cint(self.betrag_cent) < 100 or cint(self.betrag_cent) > 10000000:
            frappe.throw(_("Betrag zwischen 1 € und 100.000 €."))
        self.kunde_email = (self.kunde_email or "").strip().lower() or None
        self.titel = f"{self.anzahlung_id} · Auftrag {self.auftrag_referenz} · {cint(self.betrag_cent) / 100:.2f} €"[:140]

    def after_insert(self):
        st.verlauf(self, self.status, "angelegt", self.quelle)

    # ── Link ─────────────────────────────────────────────────────────────────
    def link(self):
        """/de/zahlung/anzahlung/<id>.<hmac32> – nur mit ph_payments_link_secret (wie codes.js linkToken)."""
        secret = frappe.conf.get("ph_payments_link_secret")
        if not secret:
            return None
        mac = base64.urlsafe_b64encode(hmac.new(str(secret).encode(), f"ph-deposit:{self.name}".encode(), hashlib.sha256).digest()).decode().rstrip("=")[:32]
        basis = frappe.get_cached_value("PH Einstellungen", None, "website_url") or "https://platzhirsch.studio"
        return f"{basis.rstrip('/')}/de/zahlung/anzahlung/{self.name}.{mac}"

    @frappe.whitelist()
    def link_senden(self):
        self.check_permission("email")
        if not self.kunde_email:
            frappe.throw(_("Keine E-Mail-Adresse hinterlegt."))
        link = self.link()
        if not link:
            frappe.throw(_("Zahlungslink kann hier nicht gebildet werden (ph_payments_link_secret fehlt) – bitte über die Website /api/payments/anzahlung senden."))
        ok = mails.senden("anzahlung_link", self.kunde_email, {"doc": self, "link": link}, referenz_doctype=self.doctype, referenz_name=self.name)
        if ok:
            self.db_set("link_gesendet_am", now_datetime(), update_modified=False)
        return ok

    # ── Webhook ──────────────────────────────────────────────────────────────
    def zahlung_eingegangen(self, session, livemode, ereignis=None):
        from ph_shop import zahlung as z

        sid = session.get("id")
        if self.status in SETTLED or self.bezahlt_am:
            bezahlt_session = self.bezahlt_session or self.stripe_session
            if sid and bezahlt_session and sid != bezahlt_session:
                return self._doppelt(session, livemode, ereignis)
            return "bereits_erfuellt"
        betrag = cint(session.get("amount_total"))
        ok = betrag == cint(self.betrag_cent) and str(session.get("currency") or "eur").lower() == (self.waehrung or "EUR").lower()
        zahlung = z.buche(kanal="Stripe Checkout", betrag_cent=betrag, bezug_doctype=self.doctype, bezug=self.name, kontakt=self.kontakt, stripe_payment_intent=session.get("payment_intent"), stripe_session=sid, livemode=bool(livemode), stripe_ereignis=ereignis, quelle="stripe", zahlungsreferenz=self.auftrag_referenz)
        neu = "bezahlt" if ok else "pruefen"
        st.setzen(self, neu, None if ok else _("Betrag weicht ab: {0} Cent").format(betrag), "Stripe", {"bezahlt_am": now_datetime() if ok else None, "bezahlt_session": sid if ok else None, "stripe_session": sid, "payment_intent": session.get("payment_intent"), "livemode": 1 if livemode else 0, "zahlung": zahlung.name})
        email = (session.get("customer_details") or {}).get("email") or self.kunde_email
        if ok and email:
            self.reload()
            mails.senden("anzahlung_erhalten", email, {"doc": self}, referenz_doctype=self.doctype, referenz_name=self.name)
        if not ok:
            mails.aufgabe(_("Anzahlung {0}: Stripe-Betrag {1} Cent statt {2} Cent.").format(self.name, betrag, self.betrag_cent), self.doctype, self.name)
        return "erfuellt" if ok else "pruefen"

    def _doppelt(self, session, livemode, ereignis):
        from ph_shop import zahlung as z

        sid = session.get("id")
        if any(d.session == sid for d in self.doppelt):
            return "bereits_erfuellt"
        zahlung = z.buche(kanal="Stripe Checkout", betrag_cent=cint(session.get("amount_total")), bezug_doctype=self.doctype, bezug=self.name, kontakt=self.kontakt, stripe_payment_intent=session.get("payment_intent"), stripe_session=sid, livemode=bool(livemode), stripe_ereignis=ereignis, quelle="stripe", notiz=_("Doppelte Zahlung – zu erstatten"))
        zeile = self.append("doppelt", {"session": sid, "payment_intent": session.get("payment_intent"), "betrag_cent": cint(session.get("amount_total")), "zeit": now_datetime(), "zahlung": zahlung.name})
        zeile.db_insert()
        st.setzen(self, "doppelt", _("Zweite Zahlung {0}").format(session.get("payment_intent") or sid), "Stripe")
        text = _("Zur Anzahlung {0} (Auftrag {1}) ist eine zweite Zahlung über {2} Cent eingegangen. Button „Doppelte Zahlung erstatten“ verwenden.").format(self.name, self.auftrag_referenz, cint(session.get("amount_total")))
        mails.team_hinweis(_("Doppelte Anzahlung: Auftrag {0}").format(self.auftrag_referenz), [text], self.doctype, self.name)
        mails.aufgabe(text, self.doctype, self.name)
        return "doppelt"

    def zahlung_ausstehend(self, session, ereignis=None):
        if self.status in ("offen", "fehlgeschlagen"):
            st.setzen(self, "zahlung_ausstehend", "Zahlung angekündigt", "Stripe", {"stripe_session": session.get("id"), "payment_intent": session.get("payment_intent")})
        return "ausstehend"

    def zahlung_fehlgeschlagen(self, session, livemode, ereignis=None):
        if self.status in SETTLED:
            return "unveraendert"
        st.setzen(self, "fehlgeschlagen", "Zahlung nicht erfolgreich", "Stripe", {"stripe_session": session.get("id")})
        email = (session.get("customer_details") or {}).get("email") or self.kunde_email
        if email:
            mails.senden("zahlung_fehlgeschlagen", email, {"doc": self, "betrag_cent": cint(session.get("amount_total")) or self.betrag_cent, "was": _("die Anzahlung zu Auftrag {0}").format(self.auftrag_referenz)}, referenz_doctype=self.doctype, referenz_name=self.name)
        return "fehlgeschlagen"

    def session_abgelaufen(self, session, ereignis=None):
        # Anzahlungen bleiben bezahlbar (neue Session über den Link); nur die aktuelle Session zurücksetzen.
        if self.stripe_session == session.get("id") and self.status not in SETTLED:
            self.db_set("stripe_session", None)
            st.verlauf(self, self.status, "Session abgelaufen", "Stripe")
        return "abgelaufen"

    def erstattung_vermerken(self, payment_intent, gesamt_erstattet_cent, voll, ereignis=None):
        for d in self.doppelt:
            if d.payment_intent == payment_intent:
                frappe.db.set_value("PH Anzahlung Doppelt", d.name, {"erstattet_cent": cint(gesamt_erstattet_cent), "erstattet_am": now_datetime()}, update_modified=False)
                st.verlauf(self, self.status, "doppelt_erstattet", "Stripe")
                if all(cint(x.erstattet_cent) >= cint(x.betrag_cent) for x in self.doppelt if x.name != d.name) or len(self.doppelt) == 1:
                    st.setzen(self, "bezahlt", "doppelte Zahlung erstattet", "Stripe")
                return "doppelt_erstattet"
        neu = "erstattet" if voll else "teilerstattet"
        st.setzen(self, neu, _("Erstattet gesamt {0} Cent").format(gesamt_erstattet_cent), "Stripe", {"erstattet_cent": cint(gesamt_erstattet_cent)})
        return neu

    # ── Buttons ──────────────────────────────────────────────────────────────
    @frappe.whitelist()
    def doppelte_erstatten(self):
        """Alle noch nicht erstatteten doppelten Zahlungen über PH Zahlung.rueckerstatten zurückzahlen."""
        self.check_permission("write")
        ergebnisse = []
        for d in self.doppelt:
            if cint(d.erstattet_cent) >= cint(d.betrag_cent) or not d.zahlung:
                continue
            zdoc = frappe.get_doc("PH Zahlung", d.zahlung)
            r = zdoc.rueckerstatten(cint(d.betrag_cent) - cint(d.erstattet_cent), _("Doppelte Anzahlung"), _intern=True)
            if r.get("gegenbuchung"):
                frappe.db.set_value("PH Anzahlung Doppelt", d.name, {"erstattet_cent": d.betrag_cent, "erstattet_am": now_datetime()}, update_modified=False)
            ergebnisse.append(r)
        if ergebnisse and all(not r.get("angefordert") for r in ergebnisse):
            st.setzen(self, "bezahlt", "doppelte Zahlung erstattet")
        return ergebnisse

    def oeffentliche_sicht(self):
        """publicDeposit (deposit.js): ohne E-Mail; abgelaufen, wenn Link verstrichen und noch zahlbar."""
        zahlbar = self.status in ("offen", "fehlgeschlagen")
        abgelaufen = zahlbar and get_datetime(self.link_gueltig_bis) < now_datetime()
        return {"id": self.name, "auftrag": self.auftrag_referenz, "betrag_cent": self.betrag_cent, "beschreibung": self.beschreibung, "status": "abgelaufen" if abgelaufen else self.status, "gueltig_bis": get_datetime(self.link_gueltig_bis).isoformat(), "bezahlt": self.bezahlt_am.isoformat() if self.bezahlt_am else None, "testmodus": True if (self.bezahlt_am and not self.livemode) else None}
