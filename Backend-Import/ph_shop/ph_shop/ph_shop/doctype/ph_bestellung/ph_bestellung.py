"""PH Bestellung – Website-Bestellung / Reservierung (src/lib/shop/handlers.js, webhook.js).

Statusnamen = Website (offen, zahlung_ausstehend, bezahlt, versandbereit, versendet, reserviert, abholbereit,
abgeholt, abgeschlossen, fehlgeschlagen, abgelaufen, storniert, widerrufen, erstattet, teilerstattet,
checkout_fehler, pruefen). Händische Übergänge: Workflow „PH Bestellung“; alles Geld- und Stripe-Getriebene
setzt der Server über ph_shop.ph_shop.status.setzen (Verlauf wie verlauf[] der Website).
"""

import hashlib
import json
import re

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.model.naming import make_autoname
from frappe.utils import add_days, cint, getdate, now_datetime, nowdate

from ph_shop import gutschein_code, ust
from ph_shop.ph_shop import mails, status as st

SERIE = "PH-S-.YY.MM.DD.-.#####"
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
OFFEN = ("offen", "zahlung_ausstehend", "bezahlt", "versandbereit", "reserviert", "abholbereit", "pruefen")
BEZAHLT = ("bezahlt", "versandbereit", "versendet", "abholbereit", "abgeholt", "abgeschlossen", "teilerstattet")
WEBSITE_NUMMER_RE = re.compile(r"^PH-S-\d{6}-[A-F0-9]{6}$")


class PHBestellung(Document):
    # ── Anlage ──────────────────────────────────────────────────────────────
    def autoname(self):
        nummer = (self.bestellnummer or "").strip().upper()
        if nummer:
            if not WEBSITE_NUMMER_RE.match(nummer) and not nummer.startswith("PH-S-"):
                frappe.throw(_("Bestellnummer muss mit PH-S- beginnen."))
            self.name = nummer
        else:
            self.name = make_autoname(self.naming_series or SERIE)
        self.bestellnummer = self.name

    def before_insert(self):
        einst = frappe.get_cached_doc("PH Shop Einstellungen")
        self.angelegt = self.angelegt or now_datetime()
        self.einwilligung_zeit = self.einwilligung_zeit or self.angelegt
        if not self.status:
            self.status = "reserviert" if self.zahlung == "vorort" else "offen"
        if not self.modus:
            self.modus = "live" if einst.shop_modus == "live" else "test"
        self.agb_stand = self.agb_stand or einst.agb_stand
        self.widerrufsbelehrung_stand = self.widerrufsbelehrung_stand or einst.widerrufsbelehrung_stand
        if self.lieferart == "abholung" and not self.abholung_bis:
            self.abholung_bis = add_days(getdate(self.angelegt), cint(einst.reservierung_frist_tage) or 7)
        self.workflow_state = None  # Workflow setzt den Startzustand; abweichende Zustände nach dem Anlegen (after_insert)

    def validate(self):
        self.kunde_email = (self.kunde_email or "").strip().lower()
        if not EMAIL_RE.match(self.kunde_email):
            frappe.throw(_("E-Mail-Adresse ist ungültig."))
        if self.zahlung == "vorort" and self.lieferart != "abholung":
            frappe.throw(_("Zahlung vor Ort nur bei Abholung."))
        if self.lieferart == "versand" and not (self.adresse_land and self.adresse_plz and self.adresse_ort and self.adresse_strasse):
            frappe.throw(_("Lieferadresse (Land, PLZ, Ort, Straße) fehlt."))
        if self.lieferart == "versand" and self.adresse_land == "CH":
            frappe.throw(_("Versand in die Schweiz wird nicht angeboten (nur Abholung)."))
        if not self.positionen:
            frappe.throw(_("Mindestens eine Position ist nötig."))
        self.summen_berechnen()
        self.titel = self.bilde_titel()

    def after_insert(self):
        ws = st.workflow_state_fuer(self.doctype, self.status)
        if ws and self.meta.has_field("workflow_state"):
            self.db_set("workflow_state", ws, update_modified=False)
        st.verlauf(self, self.status, "angelegt", self.quelle)
        if self.zahlung == "vorort":
            # Vertragsbestätigung sofort (orderMail.js: „bezahlen bei Abholung“ → sofort).
            self.bestaetigung_senden(intern=True)

    # ── Rechenwerk ───────────────────────────────────────────────────────────
    def summen_berechnen(self):
        einst = frappe.get_cached_doc("PH Shop Einstellungen")
        ermaessigt = tuple(x.strip() for x in (einst.ermaessigt_kategorien or "bildband").split(",") if x.strip())
        zeilen = []
        waren = 0
        for p in self.positionen:
            p.menge = cint(p.menge) or 1
            p.einzel_cent = cint(p.einzel_cent)
            p.summe_cent = cint(p.summe_cent) or p.einzel_cent * p.menge
            p.ust_klasse = p.ust_klasse or ust.ust_klasse(p.kategorie, ermaessigt)
            waren += p.summe_cent
            zeilen.append({"summe_cent": p.summe_cent, "ust_klasse": p.ust_klasse, "kategorie": p.kategorie})
        self.waren_cent = waren
        self.versand_cent = cint(self.versand_cent) if self.lieferart == "versand" else 0
        self.gesamt_cent = self.waren_cent + self.versand_cent
        a = ust.aufteilung(zeilen, self.versand_cent, self.lieferart, self.adresse_land if self.lieferart == "versand" else None, bool(einst.oss_aktiv))
        if a["steuerland"] is None:
            frappe.throw(_("Lieferung nach {0} wird nicht unterstützt.").format(self.adresse_land))
        self.steuerland = a["steuerland"]
        self.oss = 1 if a["steuerland"] != "AT" else 0
        self.ust_cent = a["ust_cent"]
        for p, satz in zip(self.positionen, a["zeilen_saetze"]):
            p.ust_satz_promille = satz
        self.set("ust_aufteilung", [])
        for posten in a["posten"]:
            self.append("ust_aufteilung", posten)
        self.gesamt_eur = self.gesamt_cent / 100

    def bilde_titel(self):
        return f"{self.name or self.bestellnummer or 'Bestellung'} · {self.kunde_name} · {self.gesamt_cent / 100:.2f} €"[:140]

    def ist_bezahlt(self):
        return bool(self.bezahlt_am) or self.status in BEZAHLT

    # ── Stripe-Webhook (stripe_webhook.py) ───────────────────────────────────
    def zahlung_eingegangen(self, session, livemode, ereignis=None):
        from ph_shop import zahlung as z

        if self.ist_bezahlt():
            return "bereits_erfuellt"
        betrag = cint(session.get("amount_total")) or self.gesamt_cent
        zahlung = z.buche(
            kanal="Stripe Checkout",
            betrag_cent=betrag,
            bezug_doctype=self.doctype,
            bezug=self.name,
            waehrung=str(session.get("currency") or "eur").upper(),
            kontakt=self.kontakt,
            stripe_payment_intent=session.get("payment_intent"),
            stripe_session=session.get("id"),
            livemode=bool(livemode),
            stripe_ereignis=ereignis,
            quelle="stripe",
        )
        abweichung = betrag != cint(self.gesamt_cent) or str(session.get("currency") or "eur").lower() != (self.waehrung or "EUR").lower()
        neu = "pruefen" if abweichung else "bezahlt"
        st.setzen(
            self,
            neu,
            _("Betrag weicht ab: {0} statt {1} Cent").format(betrag, self.gesamt_cent) if abweichung else "Stripe Checkout bezahlt",
            "Stripe",
            {"bezahlt_am": now_datetime(), "betrag_bezahlt_cent": betrag, "payment_intent": session.get("payment_intent"), "stripe_session": session.get("id"), "livemode": 1 if livemode else 0, "zahlung_ref": zahlung.name},
        )
        if abweichung:
            mails.aufgabe(_("Bestellung {0}: Stripe-Betrag {1} Cent weicht von {2} Cent ab.").format(self.name, betrag, self.gesamt_cent), self.doctype, self.name)
        self.reload()
        self.bestaetigung_senden(intern=True)
        return "bezahlt" if not abweichung else "pruefen"

    def zahlung_ausstehend(self, session, ereignis=None):
        if self.status == "offen":
            st.setzen(self, "zahlung_ausstehend", "Zahlung angekündigt (z. B. Lastschrift)", "Stripe", {"payment_intent": session.get("payment_intent"), "stripe_session": session.get("id")})
        return "ausstehend"

    def zahlung_fehlgeschlagen(self, session, livemode, ereignis=None):
        if self.ist_bezahlt():
            return "unveraendert"
        st.setzen(self, "fehlgeschlagen", "Zahlung nicht erfolgreich", "Stripe")
        mails.senden("zahlung_fehlgeschlagen", self.kunde_email, {"doc": self, "betrag_cent": cint(session.get("amount_total")) or self.gesamt_cent, "was": _("Ihre Bestellung {0}").format(self.name)}, referenz_doctype=self.doctype, referenz_name=self.name)
        return "fehlgeschlagen"

    def session_abgelaufen(self, session, ereignis=None):
        if self.status == "offen":
            st.setzen(self, "abgelaufen", "Checkout-Session abgelaufen", "Stripe")
        return "abgelaufen"

    def erstattung_vermerken(self, payment_intent, gesamt_erstattet_cent, voll, ereignis=None):
        neu = "erstattet" if voll else "teilerstattet"
        st.setzen(self, neu, _("Erstattet gesamt {0} Cent").format(gesamt_erstattet_cent), "Stripe", {"erstattet_cent": cint(gesamt_erstattet_cent)})
        return neu

    # ── Buttons (ph_bestellung.js) ───────────────────────────────────────────
    @frappe.whitelist()
    def zahlung_erfassen(self, kanal, betrag_cent=None, referenz=None):
        """Zahlung außerhalb von Stripe Checkout buchen (Bar/Karte extern/Überweisung/Gutschein im Showroom)."""
        from ph_shop import zahlung as z

        self.check_permission("write")
        if self.ist_bezahlt():
            frappe.throw(_("Bestellung ist bereits bezahlt."))
        betrag = cint(betrag_cent) or cint(self.gesamt_cent)
        zahlung = z.buche(kanal=kanal, betrag_cent=betrag, bezug_doctype=self.doctype, bezug=self.name, kontakt=self.kontakt, zahlungsreferenz=referenz, livemode=self.modus == "live", quelle="backoffice")
        neu = self.status if self.status == "abholbereit" else "bezahlt"
        st.setzen(self, neu, _("{0} erfasst").format(kanal), None, {"bezahlt_am": now_datetime(), "betrag_bezahlt_cent": betrag, "zahlung_ref": zahlung.name})
        if self.mail_status != "gesendet":
            self.reload()
            self.bestaetigung_senden(intern=True)
        return zahlung.name

    @frappe.whitelist()
    def gutschein_einloesen(self, code, betrag_cent=None):
        """Gutschein (Code) auf diese Bestellung anrechnen – Einlösung + PH Zahlung (Kanal Gutschein)."""
        from ph_shop.ph_shop.doctype.ph_gutschein.ph_gutschein import finde_nach_code

        self.check_permission("write")
        gs = finde_nach_code(code)
        if not gs:
            frappe.throw(_("Gutschein nicht gefunden."))
        offen = cint(self.gesamt_cent) - cint(self.betrag_bezahlt_cent)
        betrag = min(cint(betrag_cent) or offen, cint(gs.rest_cent), offen)
        if betrag <= 0:
            frappe.throw(_("Nichts offen oder Gutschein ohne Restwert."))
        r = gs.einloesen(betrag, kanal="Online", beleg_doctype=self.doctype, beleg=self.name, zahlung_buchen=True)
        bezahlt = cint(self.betrag_bezahlt_cent) + betrag
        extra = {"betrag_bezahlt_cent": bezahlt, "zahlung_ref": self.zahlung_ref or r.get("zahlung")}
        if bezahlt >= cint(self.gesamt_cent):
            extra["bezahlt_am"] = now_datetime()
            st.setzen(self, "bezahlt" if self.status != "abholbereit" else "abholbereit", _("Gutschein {0} eingelöst").format(gs.name), None, extra)
        else:
            self.db_set(extra)
            st.verlauf(self, self.status, _("Gutschein {0}: {1} Cent angerechnet").format(gs.name, betrag))
        return {"gutschein": gs.name, "betrag_cent": betrag, "rest_cent": r["rest_cent"], "offen_cent": max(cint(self.gesamt_cent) - bezahlt, 0)}

    @frappe.whitelist()
    def abholbereit_melden(self):
        self.check_permission("write")
        if self.lieferart != "abholung":
            frappe.throw(_("Nur bei Abholung."))
        if self.status not in ("bezahlt", "reserviert", "pruefen"):
            frappe.throw(_("Abholbereit nur aus bezahlt oder reserviert."))
        einst = frappe.get_cached_doc("PH Shop Einstellungen")
        code = self.abholcode or gutschein_code.abholcode()
        bis = add_days(nowdate(), cint(einst.abholung_frist_tage) or 7)
        st.setzen(self, "abholbereit", _("Abholcode {0}, bis {1}").format(code, bis), None, {"abholcode": code, "abholung_bis": bis, "abholbereit_am": now_datetime()})
        self.reload()
        mails.senden("abholbereit", self.kunde_email, {"doc": self, "abholcode": code, "abholung_bis": bis}, referenz_doctype=self.doctype, referenz_name=self.name)
        return code

    @frappe.whitelist()
    def abgeholt_melden(self):
        self.check_permission("write")
        if self.status != "abholbereit":
            frappe.throw(_("Nur aus „abholbereit“."))
        if not self.ist_bezahlt():
            frappe.throw(_("Zuerst die Zahlung erfassen (Kassa/Bar/Karte)."))
        st.setzen(self, "abgeholt", None, None, {"abgeholt_am": now_datetime()})
        return "abgeholt"

    @frappe.whitelist()
    def packen(self):
        """bezahlt → versandbereit; Lieferschein/Etikett über ph_logistik (Hook ph_shop_lieferschein_erstellen)."""
        self.check_permission("write")
        if self.status != "bezahlt" or self.lieferart != "versand":
            frappe.throw(_("Packen nur für bezahlte Versandbestellungen."))
        ergebnis = None
        for fn in frappe.get_hooks("ph_shop_lieferschein_erstellen") or []:
            ergebnis = frappe.get_attr(fn)(self)
        st.setzen(self, "versandbereit", _("Lieferschein {0}").format(ergebnis) if ergebnis else None)
        return ergebnis or "versandbereit"

    @frappe.whitelist()
    def versendet_melden(self, awb=None, carrier=None):
        self.check_permission("write")
        if self.status not in ("versandbereit", "bezahlt"):
            frappe.throw(_("Versendet nur aus versandbereit/bezahlt."))
        st.setzen(self, "versendet", awb, None, {"versendet_am": now_datetime(), "awb": awb or self.awb, "carrier": carrier or self.carrier})
        return "versendet"

    @frappe.whitelist()
    def abschliessen(self):
        self.check_permission("write")
        if self.status not in ("versendet", "abgeholt"):
            frappe.throw(_("Abschließen nur aus versendet/abgeholt."))
        st.setzen(self, "abgeschlossen")
        return "abgeschlossen"

    @frappe.whitelist()
    def stornieren(self, grund, erstatten=1, betrag_cent=None):
        """Leitung: Bestellung stornieren und (bei Stripe) die Zahlung erstatten."""
        self.check_permission("write")
        if not _leitung():
            frappe.throw(_("Stornieren darf nur die Shop-Leitung."), frappe.PermissionError)
        if self.status in ("storniert", "erstattet", "abgeschlossen"):
            frappe.throw(_("Bestellung ist bereits {0}.").format(self.status))
        gegen = None
        if cint(erstatten) and self.zahlung_ref and self.ist_bezahlt():
            zdoc = frappe.get_doc("PH Zahlung", self.zahlung_ref)
            betrag = cint(betrag_cent) or (cint(zdoc.betrag_cent) - cint(zdoc.erstattet_cent))
            r = zdoc.rueckerstatten(betrag, grund or _("Storno"), _intern=True)
            gegen = r.get("gegenbuchung")
            if r.get("angefordert"):
                frappe.msgprint(_("Erstattung über der Vier-Augen-Grenze – Freigabe durch die Geschäftsführung angefordert."))
        st.setzen(self, "storniert", grund)
        return gegen or "storniert"

    @frappe.whitelist()
    def bestaetigung_senden(self, intern=False):
        """Bestellbestätigung mit Rechtstexten (§ 7 Abs 3 FAGG) – Vorlage „PH Shop Bestellbestätigung“."""
        if not intern:
            self.check_permission("email")
        ok = mails.senden("bestellbestaetigung", self.kunde_email, {"doc": self, "teillieferung": False}, anhaenge=mails.rechtstext_anhaenge(), referenz_doctype=self.doctype, referenz_name=self.name)
        self.db_set({"mail_status": "gesendet" if ok else "fehlgeschlagen", "mail_gesendet_am": now_datetime() if ok else self.mail_gesendet_am}, update_modified=False)
        return ok

    @frappe.whitelist()
    def widerruf_anlegen(self, kanal="E-Mail", text=None):
        self.check_permission("write")
        w = frappe.get_doc(
            {
                "doctype": "PH Widerruf",
                "kanal": kanal,
                "eingegangen_am": now_datetime(),
                "bestellung": self.name,
                "kunde_name": self.kunde_name,
                "kunde_email": self.kunde_email,
                "artikel": text or ", ".join(f"{p.menge} × {p.bezeichnung}" for p in self.positionen),
                "erhalten_am": getdate(self.versendet_am or self.abgeholt_am) if (self.versendet_am or self.abgeholt_am) else None,
                "quelle": "backoffice",
            }
        ).insert()
        return w.name

    @frappe.whitelist()
    def rechnung_erstellen(self):
        """→ ph_faktura (Hook ph_shop_rechnung_erstellen). Ohne ph_faktura: Hinweis."""
        self.check_permission("write")
        hooks = frappe.get_hooks("ph_shop_rechnung_erstellen") or []
        if not hooks:
            frappe.throw(_("ph_faktura ist nicht installiert – Rechnung kann noch nicht erzeugt werden."))
        return frappe.get_attr(hooks[-1])(self)

    # ── Website-Sicht (api.get_order) ────────────────────────────────────────
    def oeffentliche_sicht(self):
        """Bestätigungsseite: keine personenbezogenen Felder außer Vorname (orderView in handlers.js)."""
        vorname = (self.kunde_name or "").split(" ")[0]
        return {
            "id": self.name,
            "referenz": self.name,
            "status": self.status,
            "testmodus": self.modus != "live",
            "lieferart": self.lieferart,
            "zahlung": self.zahlung,
            "angelegt": self.angelegt.isoformat() if self.angelegt else None,
            "vorname": vorname,
            "zeilen": [{"name": p.bezeichnung, "markeName": p.marke, "varianteName": p.variante_name, "menge": p.menge, "einzelCent": p.einzel_cent, "summeCent": p.summe_cent, "ustSatz": (p.ust_satz_promille or 0) / 100} for p in self.positionen],
            "summen": {"warenCent": self.waren_cent, "versandCent": self.versand_cent, "gesamtCent": self.gesamt_cent, "mwstCent": self.ust_cent, "ust": {"steuerland": self.steuerland, "posten": [{"satz": u.satz_promille / 100, "bruttoCent": u.brutto_cent, "warenCent": u.waren_cent, "versandCent": u.versand_cent, "ustCent": u.ust_cent, "nettoCent": u.netto_cent} for u in self.ust_aufteilung]}},
            "versand": {"dienst": {"carrier": self.carrier, "name": self.dienst, "tage": self.laufzeit_tage}, "versichert": bool(self.versichert)} if self.lieferart == "versand" else None,
            "sendung": {"status": "angelegt" if self.awb else None, "awb": self.awb, "carrier": self.carrier} if self.awb else None,
            "land": self.adresse_land,
            "abholung_bis": str(self.abholung_bis) if self.abholung_bis else None,
        }


def _leitung(user=None):
    rollen = set(frappe.get_roles(user or frappe.session.user))
    return bool(rollen & {"PH Shop Leitung", "PH Geschäftsführung", "System Manager", "Administrator"}) or frappe.session.user == "Administrator"


def token_hash(token):
    return hashlib.sha256(f"ph-order-token:{token}".encode()).hexdigest() if token else None


def offene_anzahl():
    return frappe.db.count("PH Bestellung", {"status": ("in", OFFEN)})


def pakete_json(wert):
    try:
        return json.dumps(wert, ensure_ascii=False) if wert is not None else None
    except (TypeError, ValueError):
        return None
