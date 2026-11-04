"""PH Gutschein Bestellung – Kaufvorgang der Website (src/lib/payments/voucherOrder.js).

Nach bestätigter Zahlung (Webhook): Betrag/Währung prüfen → PH Zahlung buchen → `anzahl` Gutscheine
ausstellen (Test, wenn !livemode) → Mail mit PDFs → Status bezahlt. Idempotent: eine bezahlte Bestellung
bekommt keine neuen Codes. Erstattung in voller Höhe sperrt ungenutzte Gutscheine.
"""

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import cint, now_datetime

from ph_shop import gutschein_code as gc
from ph_shop.ph_shop import mails, status as st

MIN_CENT = 2500
MAX_ANZAHL_ONLINE = 10
MAX_SUMME_ONLINE = 500000


class PHGutscheinBestellung(Document):
    def before_insert(self):
        self.bestellnummer = (self.bestellnummer or gc.bestellnummer("G")).upper()
        self.erstellt = self.erstellt or now_datetime()
        self.status = self.status or "offen"
        einst = frappe.get_cached_doc("PH Shop Einstellungen")
        self.zustimmung_bedingungen_stand = self.zustimmung_bedingungen_stand or einst.gutschein_bedingungen_stand
        self.zustimmung_widerruf_stand = self.zustimmung_widerruf_stand or einst.widerrufsbelehrung_stand
        self.zustimmung_zeit = self.zustimmung_zeit or self.erstellt

    def validate(self):
        self.anzahl = cint(self.anzahl) or 1
        if cint(self.betrag_cent) < cint(frappe.get_cached_value("PH Shop Einstellungen", None, "gutschein_min_cent") or MIN_CENT):
            frappe.throw(_("Gutscheinwert unter dem Mindestwert."))
        if self.anzahl < 1 or self.anzahl > MAX_ANZAHL_ONLINE:
            frappe.throw(_("Anzahl 1 bis {0}.").format(MAX_ANZAHL_ONLINE))
        self.summe_cent = cint(self.betrag_cent) * self.anzahl
        if self.summe_cent > MAX_SUMME_ONLINE and self.quelle == "website":
            frappe.throw(_("Online bis {0} € je Bestellung.").format(MAX_SUMME_ONLINE // 100))
        self.kaeufer_email = (self.kaeufer_email or "").strip().lower()
        self.titel = f"{self.bestellnummer} · {self.anzahl} × {cint(self.betrag_cent) / 100:.0f} € · {self.kaeufer_name}"[:140]

    def after_insert(self):
        st.verlauf(self, self.status, "angelegt", self.quelle)

    # ── Webhook ──────────────────────────────────────────────────────────────
    def zahlung_eingegangen(self, session, livemode, ereignis=None):
        from ph_shop import zahlung as z
        from ph_shop.ph_shop.doctype.ph_gutschein.ph_gutschein import ausstellen

        if self.gutscheine:
            return "bereits_erfuellt"
        betrag = cint(session.get("amount_total"))
        waehrung = str(session.get("currency") or "eur").lower()
        if betrag != cint(self.summe_cent) or waehrung != (self.waehrung or "EUR").lower():
            st.setzen(self, "pruefen", _("Betrag/Währung weicht ab: {0} {1}").format(betrag, waehrung), "Stripe", {"stripe_session": session.get("id"), "payment_intent": session.get("payment_intent")})
            mails.aufgabe(_("Gutschein-Bestellung {0}: Stripe-Betrag {1} Cent statt {2} Cent – keine Codes erzeugt.").format(self.name, betrag, self.summe_cent), self.doctype, self.name)
            return "pruefen"
        zahlung = z.buche(kanal="Stripe Checkout", betrag_cent=betrag, bezug_doctype=self.doctype, bezug=self.name, kontakt=self.kontakt, stripe_payment_intent=session.get("payment_intent"), stripe_session=session.get("id"), livemode=bool(livemode), stripe_ereignis=ereignis, quelle="stripe")
        test = not livemode
        details = session.get("customer_details") or {}
        codes = []
        docs = []
        for i in range(self.anzahl):
            doc, code = ausstellen(self.betrag_cent, test=test, kanal="Online", motiv=self.motiv, empfaenger=self.empfaenger, grusstext=self.grusstext, kaeufer={"name": details.get("name") or self.kaeufer_name, "email": self.kaeufer_email, "firma": self.kaeufer_firma, "kontakt": self.kontakt}, gutschein_bestellung=self.name, zahlung=zahlung.name, livemode=bool(livemode), quelle="website", idempotency_key=f"{self.name}:{i + 1}")
            zeile = self.append("gutscheine", {"gutschein": doc.name, "code_letzte4": doc.code_letzte4, "status": doc.status})
            zeile.db_insert()
            codes.append(code)
            docs.append(doc)
        st.setzen(self, "bezahlt", "Stripe Checkout bezahlt, Codes erzeugt", "Stripe", {"bezahlt_am": now_datetime(), "zahlung": zahlung.name, "stripe_session": session.get("id"), "payment_intent": session.get("payment_intent"), "livemode": 1 if livemode else 0, "rechnung_name": details.get("name") or self.rechnung_name, "rechnung_adresse": _adresse(details.get("address")) or self.rechnung_adresse})
        self.reload()
        self.codes_senden(docs, codes)
        return "erfuellt"

    def codes_senden(self, docs, codes):
        anhaenge = []
        for doc, code in zip(docs, codes):
            url = doc.pdf_erzeugen(code)
            if url:
                anhaenge.append({"fname": f"Gutschein-{self.name}-{doc.code_letzte4}.pdf", "fcontent": frappe.get_doc("File", {"file_url": url}).get_content()})
        ok = mails.senden("gutschein", self.kaeufer_email, {"doc": docs[0] if docs else None, "bestellung": self, "gutscheine": docs, "codes": codes}, anhaenge=anhaenge, referenz_doctype=self.doctype, referenz_name=self.name)
        if ok:
            self.db_set("mail_gesendet_am", now_datetime(), update_modified=False)
            for d in docs:
                d.db_set("mail_gesendet_am", now_datetime(), update_modified=False)
        return ok

    def zahlung_ausstehend(self, session, ereignis=None):
        if self.status == "offen":
            st.setzen(self, "zahlung_ausstehend", "Zahlung angekündigt", "Stripe", {"stripe_session": session.get("id"), "payment_intent": session.get("payment_intent")})
        return "ausstehend"

    def zahlung_fehlgeschlagen(self, session, livemode, ereignis=None):
        if self.status == "bezahlt":
            return "unveraendert"
        st.setzen(self, "fehlgeschlagen", "Zahlung nicht erfolgreich", "Stripe", {"stripe_session": session.get("id")})
        mails.senden("zahlung_fehlgeschlagen", self.kaeufer_email, {"doc": self, "betrag_cent": cint(session.get("amount_total")) or self.summe_cent, "was": _("Ihre Gutschein-Bestellung {0}").format(self.name)}, referenz_doctype=self.doctype, referenz_name=self.name)
        return "fehlgeschlagen"

    def session_abgelaufen(self, session, ereignis=None):
        if self.status == "offen":
            st.setzen(self, "abgelaufen", "Checkout-Session abgelaufen", "Stripe")
        return "abgelaufen"

    def erstattung_vermerken(self, payment_intent, gesamt_erstattet_cent, voll, ereignis=None):
        neu = "erstattet" if voll else "teilerstattet"
        st.setzen(self, neu, _("Erstattet gesamt {0} Cent").format(gesamt_erstattet_cent), "Stripe", {"erstattet_cent": cint(gesamt_erstattet_cent)})
        gesperrt = 0
        pruefen = False
        if voll:
            for zeile in self.gutscheine:
                g = frappe.get_doc("PH Gutschein", zeile.gutschein)
                if g.erstattet_markieren("erstattet"):
                    gesperrt += 1
                else:
                    pruefen = True
                frappe.db.set_value("PH Gutschein Bestellung Code", zeile.name, "status", g.status, update_modified=False)
        if pruefen:
            mails.aufgabe(_("Gutschein-Bestellung {0} erstattet, aber Gutscheine bereits (teil)eingelöst – prüfen.").format(self.name), self.doctype, self.name)
        return f"{neu}:{gesperrt}_gesperrt" if gesperrt else neu

    def widerruf_vermerken(self, widerruf):
        gesperrt = 0
        for zeile in self.gutscheine:
            g = frappe.get_doc("PH Gutschein", zeile.gutschein)
            if g.status == "Aktiv" and cint(g.rest_cent) == cint(g.wert_cent):
                g.flags.ignore_permissions = True
                g.sperren(_("Widerruf {0}").format(widerruf))
                gesperrt += 1
                frappe.db.set_value("PH Gutschein Bestellung Code", zeile.name, "status", "Gesperrt", update_modified=False)
        st.setzen(self, "widerrufen", _("Widerruf {0}, {1} Gutschein(e) gesperrt").format(widerruf, gesperrt), None, {"widerruf": widerruf})
        return gesperrt

    # ── Buttons ──────────────────────────────────────────────────────────────
    @frappe.whitelist()
    def codes_erneut_senden(self):
        """Gespeicherte PDFs erneut mailen (ohne Klartext-Codes – die stehen nur in den PDFs)."""
        self.check_permission("email")
        docs = [frappe.get_doc("PH Gutschein", z.gutschein) for z in self.gutscheine]
        anhaenge = [{"fname": f"Gutschein-{self.name}-{d.code_letzte4}.pdf", "fcontent": frappe.get_doc("File", {"file_url": d.pdf}).get_content()} for d in docs if d.pdf]
        if not anhaenge:
            frappe.throw(_("Keine PDFs gespeichert – Gutschein im Einzelnen ersetzen (Button „Ersetzen“)."))
        ok = mails.senden("gutschein", self.kaeufer_email, {"doc": docs[0], "bestellung": self, "gutscheine": docs, "codes": []}, anhaenge=anhaenge, referenz_doctype=self.doctype, referenz_name=self.name)
        if ok:
            self.db_set("mail_gesendet_am", now_datetime(), update_modified=False)
        return ok

    @frappe.whitelist()
    def erstatten(self, grund, betrag_cent=None):
        """Leitung: Zahlung (teil)erstatten – Stripe-Refund + Gegenbuchung über PH Zahlung.rueckerstatten."""
        self.check_permission("write")
        if not self.zahlung:
            frappe.throw(_("Keine gebuchte Zahlung."))
        zdoc = frappe.get_doc("PH Zahlung", self.zahlung)
        r = zdoc.rueckerstatten(cint(betrag_cent) or (cint(zdoc.betrag_cent) - cint(zdoc.erstattet_cent)), grund, _intern=True)
        return r

    def oeffentliche_sicht(self):
        return {"id": self.name, "referenz": self.name, "status": self.status, "anzahl": self.anzahl, "betrag_cent": self.betrag_cent, "summe_cent": self.summe_cent, "testmodus": not bool(self.livemode) if self.bezahlt_am else None, "bezahlt": self.bezahlt_am.isoformat() if self.bezahlt_am else None}


def _adresse(a):
    if not a:
        return None
    return ", ".join(x for x in (a.get("line1"), a.get("line2"), f"{a.get('postal_code') or ''} {a.get('city') or ''}".strip(), a.get("country")) if x)
