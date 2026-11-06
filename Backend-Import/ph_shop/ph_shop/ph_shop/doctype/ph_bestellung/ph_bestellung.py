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

from ph_shop import gutschein_code, teilerstattung as te, ust
from ph_shop.ph_shop import mails, status as st

SERIE = "PH-S-.YY.MM.DD.-.#####"
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
OFFEN = ("offen", "zahlung_ausstehend", "bezahlt", "versandbereit", "reserviert", "abholbereit", "pruefen")
BEZAHLT = ("bezahlt", "versandbereit", "versendet", "abholbereit", "abgeholt", "abgeschlossen", "teilerstattet")
IN_ABWICKLUNG = ("bezahlt", "versandbereit", "versendet", "reserviert", "abholbereit", "abgeholt", "abgeschlossen", "pruefen")
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
        if not self.bestellart:
            self.bestellart = "Online" if (self.quelle or "website") == "website" else "Showroom"
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
        if self.zahlung == "vorort" and not cint(self.bestaetigung_unterdruecken) and self.bestellart != "Ersatz":
            # Vertragsbestätigung sofort (orderMail.js: „bezahlen bei Abholung“ → sofort); im Backoffice abschaltbar.
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
        self.offen_cent = max(cint(self.gesamt_cent) - cint(self.betrag_bezahlt_cent), 0)

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
        # Soll = offener Betrag (z. B. nach Gutschein-Anrechnung oder Teilstorno), Beträge addieren
        soll = max(cint(self.gesamt_cent) - cint(self.betrag_bezahlt_cent), 0) or cint(self.gesamt_cent)
        abweichung = betrag != soll or str(session.get("currency") or "eur").lower() != (self.waehrung or "EUR").lower()
        neu = "pruefen" if abweichung else ("abholbereit" if self.status == "abholbereit" else "bezahlt")
        bezahlt_gesamt = cint(self.betrag_bezahlt_cent) + betrag
        st.setzen(
            self,
            neu,
            _("Betrag weicht ab: {0} statt {1} Cent").format(betrag, soll) if abweichung else "Stripe Checkout bezahlt",
            "Stripe",
            {"bezahlt_am": now_datetime(), "betrag_bezahlt_cent": bezahlt_gesamt, "offen_cent": max(cint(self.gesamt_cent) - bezahlt_gesamt, 0), "payment_intent": session.get("payment_intent"), "stripe_session": session.get("id"), "livemode": 1 if livemode else 0, "zahlung_ref": zahlung.name},
        )
        if abweichung:
            mails.aufgabe(_("Bestellung {0}: Stripe-Betrag {1} Cent weicht von {2} Cent ab.").format(self.name, betrag, soll), self.doctype, self.name)
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
        """Statusspiegel nach Erstattung (Webhook charge.refunded oder PH Zahlung.rueckerstatten).
        Erstattet gesamt = Summe über ALLE Eingangszahlungen der Bestellung (Gutschein + Karte, Teilzahlungen);
        der übergebene Wert gilt nur je Zahlung. Status storniert/widerrufen bleibt stehen."""
        erstattet = self._erstattet_summe() or cint(gesamt_erstattet_cent)
        neu = te.status_nach_erstattung(self.gesamt_cent, self.betrag_bezahlt_cent, erstattet) or ("erstattet" if voll else "teilerstattet")
        # Teilerstattung während der Abwicklung: Status bleibt (sonst wäre Packen/Abholung blockiert)
        if self.status in ("storniert", "widerrufen") or (neu == "teilerstattet" and self.status in IN_ABWICKLUNG):
            self.db_set("erstattet_cent", erstattet, update_modified=False)
            st.verlauf(self, self.status, _("Erstattet gesamt {0} Cent").format(erstattet), "Stripe")
            return self.status
        st.setzen(self, neu, _("Erstattet gesamt {0} Cent").format(erstattet), "Stripe", {"erstattet_cent": erstattet})
        return neu

    def _eingaenge(self):
        return frappe.get_all(
            "PH Zahlung",
            {"bezug_doctype": self.doctype, "bezug": self.name, "art": "Eingang", "docstatus": 1},
            ["name", "kanal", "betrag_cent", "erstattet_cent", "zeitpunkt", "gutschein", "stripe_payment_intent"],
            order_by="zeitpunkt asc",
        )

    def _erstattet_summe(self):
        return sum(cint(z.erstattet_cent) for z in self._eingaenge())

    # ── Buttons (ph_bestellung.js) ───────────────────────────────────────────
    @frappe.whitelist()
    def zahlung_erfassen(self, kanal, betrag_cent=None, referenz=None):
        """Zahlung außerhalb von Stripe Checkout buchen (Bar/Karte extern/Überweisung/Gutschein im Showroom)."""
        from ph_shop import zahlung as z

        self.check_permission("write")
        if self.ist_bezahlt():
            frappe.throw(_("Bestellung ist bereits bezahlt."))
        offen = max(cint(self.gesamt_cent) - cint(self.betrag_bezahlt_cent), 0)
        betrag = cint(betrag_cent) or offen
        if betrag <= 0:
            frappe.throw(_("Nichts offen."))
        if betrag > offen:
            frappe.throw(_("Betrag ({0} Cent) übersteigt den offenen Betrag ({1} Cent).").format(betrag, offen))
        zahlung = z.buche(kanal=kanal, betrag_cent=betrag, bezug_doctype=self.doctype, bezug=self.name, kontakt=self.kontakt, zahlungsreferenz=referenz, livemode=self.modus == "live", quelle="backoffice")
        # Teilzahlungen addieren; Status „bezahlt“ erst bei Vollzahlung (Fehler aus 10-konzept-shop §10 behoben)
        bezahlt, voll = te.zahlungsstand(self.gesamt_cent, self.betrag_bezahlt_cent, betrag)
        extra = {"betrag_bezahlt_cent": bezahlt, "offen_cent": max(cint(self.gesamt_cent) - bezahlt, 0), "zahlung_ref": self.zahlung_ref or zahlung.name}
        if not voll:
            self.db_set(extra)
            st.verlauf(self, self.status, _("Teilzahlung {0} Cent ({1}), offen {2} Cent").format(betrag, kanal, extra["offen_cent"]))
            return zahlung.name
        extra["bezahlt_am"] = now_datetime()
        neu = self.status if self.status == "abholbereit" else "bezahlt"
        st.setzen(self, neu, _("{0} erfasst").format(kanal), None, extra)
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
        extra = {"betrag_bezahlt_cent": bezahlt, "offen_cent": max(cint(self.gesamt_cent) - bezahlt, 0), "zahlung_ref": self.zahlung_ref or r.get("zahlung")}
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
    def versendet_melden(self, awb=None, carrier=None, benachrichtigen=1):
        self.check_permission("write")
        if self.status not in ("versandbereit", "bezahlt"):
            frappe.throw(_("Versendet nur aus versandbereit/bezahlt."))
        st.setzen(self, "versendet", awb, None, {"versendet_am": now_datetime(), "awb": awb or self.awb, "carrier": carrier or self.carrier})
        if cint(benachrichtigen):
            # Versandbenachrichtigung mit Sendungsnummer (Lücke 10-konzept-shop §10, Vorlage „PH Shop Versendet“)
            self.reload()
            mails.senden("versendet", self.kunde_email, {"doc": self, "awb": self.awb, "carrier": self.carrier}, referenz_doctype=self.doctype, referenz_name=self.name)
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
        if cint(erstatten) and cint(self.betrag_bezahlt_cent) > 0:
            # Alle Eingänge (Karte, Bar, Gutschein-Anrechnung); Gutscheinanteile gehen auf den Gutschein zurück.
            offen = sum(cint(z.betrag_cent) - cint(z.erstattet_cent) for z in self._eingaenge())
            betrag = min(cint(betrag_cent) or offen, offen)
            if betrag > 0:
                r = self._geld_zurueck(betrag, grund or _("Storno"))
                gegen = ", ".join(x["gegenbuchung"] for x in r if x.get("gegenbuchung")) or None
                if any(x.get("angefordert") for x in r):
                    frappe.msgprint(_("Erstattung über der Vier-Augen-Grenze – Freigabe durch die Geschäftsführung angefordert."))
        self.reload()
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

    # ── Teilstorno / Teilerstattung (ph_shop/teilerstattung.py) ───────────────
    def _pos_logik(self):
        return [
            {"key": str(p.idx), "menge": cint(p.menge), "summe_cent": cint(p.summe_cent), "ust_satz_promille": cint(p.ust_satz_promille), "zurueck_menge": cint(p.zurueck_menge), "erstattet_cent": cint(p.erstattet_cent)}
            for p in self.positionen
        ]

    def _versand_offen(self):
        """Versandanteil je Satz minus bereits erstattete Versandanteile (aus erstattungen[].satz_json)."""
        offen = {cint(u.satz_promille): cint(u.versand_cent) for u in self.ust_aufteilung}
        for e in self.get("erstattungen") or []:
            for v in (_json(e.satz_json) or {}).get("versand") or []:
                offen[cint(v.get("satz_promille"))] = offen.get(cint(v.get("satz_promille")), 0) - cint(v.get("versand_cent"))
        return [{"satz_promille": s, "versand_cent": max(c, 0)} for s, c in offen.items()]

    @staticmethod
    def _auswahl(zeilen):
        """zeilen: JSON/Liste [{idx, menge}] oder {idx: menge} → {"idx": menge}."""
        if isinstance(zeilen, str):
            zeilen = json.loads(zeilen or "{}")
        if isinstance(zeilen, dict):
            return {str(k): cint(v) for k, v in zeilen.items()}
        return {str(z.get("idx")): cint(z.get("menge")) for z in (zeilen or [])}

    def _berechne(self, zeilen=None, versand_cent=0, kulanz_cent=0, nur_storno=False):
        try:
            return te.berechne(self._pos_logik(), self._auswahl(zeilen), cint(versand_cent), self._versand_offen(), cint(kulanz_cent), cint(self.betrag_bezahlt_cent), self._erstattet_summe(), nur_storno=nur_storno)
        except te.ErstattungFehler as e:
            frappe.throw(str(e))

    @frappe.whitelist()
    def erstattung_vorschau(self, zeilen=None, versand_cent=0, kulanz_cent=0):
        """Nur rechnen (Dialog-Vorschau): Betrag, USt je Satz, Verteilung auf Zahlungen. Bucht nichts."""
        self.check_permission("read")
        nur_storno = not self.ist_bezahlt()
        r = self._berechne(zeilen, versand_cent, kulanz_cent, nur_storno=nur_storno)
        r["verteilung"] = [] if nur_storno else te.verteile_auf_zahlungen(r["betrag_cent"], self._zahlungen_offen())
        r["nur_forderung"] = nur_storno
        return r

    def _zahlungen_offen(self):
        return [{"name": z.name, "kanal": z.kanal, "offen_cent": cint(z.betrag_cent) - cint(z.erstattet_cent), "zeit": str(z.zeitpunkt or "")} for z in self._eingaenge()]

    def _geld_zurueck(self, betrag_cent, grund):
        """Betrag auf die Eingangszahlungen verteilen (Karte/Bar zuerst, Gutschein zuletzt) und erstatten.
        Gutschein-Anteile: Gegenbuchung an der Gutschein-Zahlung + Restwert zurück auf den Gutschein."""
        try:
            plan = te.verteile_auf_zahlungen(betrag_cent, self._zahlungen_offen())
        except te.ErstattungFehler as e:
            frappe.throw(_("{0} Keine gebuchte Zahlung? Dann Erstattung im Stripe-Dashboard bzw. per Überweisung auslösen.").format(e))
        ergebnis = []
        for teil in plan:
            zdoc = frappe.get_doc("PH Zahlung", teil["name"])
            r = zdoc.rueckerstatten(teil["betrag_cent"], grund, _intern=True)
            eintrag = {"zahlung": zdoc.name, "kanal": zdoc.kanal, "betrag_cent": teil["betrag_cent"], **(r or {})}
            if zdoc.kanal == "Gutschein" and zdoc.gutschein and not (r or {}).get("angefordert"):
                gs = frappe.get_doc("PH Gutschein", zdoc.gutschein)
                gs.flags.ignore_permissions = True
                eintrag["gutschein"] = gs.gutschreiben(teil["betrag_cent"], grund, self.doctype, self.name)
            ergebnis.append(eintrag)
        return ergebnis

    def _erstattung_protokoll(self, art, r, grund, status, zahlungen=None, gutschein_cent=0, speichern=True):
        texte = []
        for z in r.get("zeilen") or []:
            p = self.positionen[int(z["key"]) - 1]
            texte.append(f"{z['menge']} × {p.bezeichnung} ({z['betrag_cent'] / 100:.2f} €)")
        if r.get("versand"):
            texte.append(_("Versand {0:.2f} €").format(sum(v["versand_cent"] for v in r["versand"]) / 100))
        zeile = self.append("erstattungen", {
            "datum": now_datetime(), "art": art, "status": status, "betrag_cent": r["betrag_cent"], "ust_cent": r["ust_cent"],
            "netto_cent": r["betrag_cent"] - r["ust_cent"], "satz_json": json.dumps({"posten": r["posten"], "versand": r.get("versand") or [], "zeilen": r.get("zeilen") or []}, ensure_ascii=False),
            "positionen_text": "\n".join(texte) or None, "grund": (grund or "")[:140], "zahlungen": ", ".join(zahlungen or []) or None,
            "gutschein_gutschrift_cent": cint(gutschein_cent), "von": frappe.session.user,
        })
        if speichern:
            zeile.db_insert()
        return zeile

    def _gutschrift_anstossen(self, zeile):
        """Hook ph_shop_gutschrift_erstellen (ph_faktura): fn(bestellung_doc, erstattung_zeile) → Belegnummer. Wirft nie."""
        for fn in frappe.get_hooks("ph_shop_gutschrift_erstellen") or []:
            try:
                nr = frappe.get_attr(fn)(self, zeile)
                if nr:
                    frappe.db.set_value("PH Bestellung Erstattung", zeile.name, "gutschrift", str(nr)[:140], update_modified=False)
            except Exception:  # noqa: BLE001
                frappe.log_error(title=f"PH Bestellung {self.name}: Gutschrift-Hook fehlgeschlagen")

    @frappe.whitelist()
    def teilerstatten(self, zeilen=None, versand_cent=0, kulanz_cent=0, grund=None, art=None):
        """Leitung: positionsweise (Menge je Zeile), Versandanteil und/oder Kulanzbetrag erstatten.
        USt-Aufteilung je Satz wird mitgeschrieben (Grundlage Gutschrift). Nie mehr als bezahlt − erstattet."""
        self.check_permission("write")
        if not _leitung():
            frappe.throw(_("Erstattungen darf nur die Shop-Leitung auslösen."), frappe.PermissionError)
        if not (grund or "").strip():
            frappe.throw(_("Bitte einen Grund angeben."))
        if not self.ist_bezahlt() and cint(self.betrag_bezahlt_cent) <= 0:
            frappe.throw(_("Bestellung ist nicht bezahlt – Positionen bitte stornieren statt erstatten."))
        r = self._berechne(zeilen, versand_cent, kulanz_cent)
        ergebnis = self._geld_zurueck(r["betrag_cent"], grund)
        angefordert = any(x.get("angefordert") for x in ergebnis)
        for z in r["zeilen"]:
            p = self.positionen[int(z["key"]) - 1]
            p.db_set({"zurueck_menge": cint(p.zurueck_menge) + z["menge"], "erstattet_cent": cint(p.erstattet_cent) + z["betrag_cent"]}, update_modified=False)
        art = art or ("Kulanz" if cint(kulanz_cent) and not r["zeilen"] else ("Versand" if not r["zeilen"] else "Teilerstattung"))
        gs_cent = sum(x["betrag_cent"] for x in ergebnis if x.get("kanal") == "Gutschein")
        zeile = self._erstattung_protokoll(art, r, grund, "angefordert" if angefordert else "erstattet", [x.get("gegenbuchung") or x["zahlung"] for x in ergebnis], gs_cent)
        self.reload()
        st.verlauf(self, self.status, _("{0}: {1} Cent erstattet ({2})").format(art, r["betrag_cent"], grund))
        if not angefordert:
            self._gutschrift_anstossen(zeile)
        return {"betrag_cent": r["betrag_cent"], "ust_cent": r["ust_cent"], "posten": r["posten"], "zahlungen": ergebnis, "angefordert": angefordert, "status": self.status}

    @frappe.whitelist()
    def positionen_stornieren(self, zeilen, grund=None):
        """Teilstorno. Unbezahlt: Positionen/Mengen herausnehmen, Summen und USt neu (keine Geldbewegung).
        Bezahlt: wie teilerstatten (Art „Teilstorno“, Leitung). Ganze Bestellung: Button „Stornieren“."""
        self.check_permission("write")
        if self.status in ("storniert", "abgeschlossen", "erstattet", "versendet", "abgeholt", "widerrufen"):
            frappe.throw(_("Teilstorno ist im Status „{0}“ nicht möglich.").format(self.status))
        if not (grund or "").strip():
            frappe.throw(_("Bitte einen Grund angeben."))
        if self.ist_bezahlt() or cint(self.betrag_bezahlt_cent) > 0:
            return self.teilerstatten(zeilen=zeilen, grund=grund, art="Teilstorno")
        r = self._berechne(zeilen, nur_storno=True)
        weg = []
        for z in r["zeilen"]:
            p = self.positionen[int(z["key"]) - 1]
            p.storniert_menge = cint(p.storniert_menge) + z["menge"]
            p.menge = cint(p.menge) - z["menge"]
            p.summe_cent = cint(p.summe_cent) - z["betrag_cent"]
            if p.menge <= 0:
                weg.append(p)
        if len(weg) == len(self.positionen):
            frappe.throw(_("Alle Positionen storniert – bitte die ganze Bestellung stornieren."))
        protokoll = self._erstattung_protokoll("Teilstorno", r, grund, "nur_forderung", speichern=False)
        for p in weg:
            self.remove(p)
        self.storniert_cent = cint(self.storniert_cent) + r["betrag_cent"]
        alter_link = self.zahlungslink_url
        self.zahlungslink_url = None
        self.flags.ignore_permissions = True
        self.save()
        st.verlauf(self, self.status, _("Teilstorno {0} Cent ({1})").format(r["betrag_cent"], grund))
        if alter_link or self.stripe_session:
            frappe.msgprint(_("Offener Zahlungslink/Checkout passt nicht mehr zum Betrag – bitte neuen Zahlungslink erzeugen."), indicator="orange")
        return {"betrag_cent": r["betrag_cent"], "gesamt_cent": self.gesamt_cent, "protokoll": protokoll.name, "ust_cent": r["ust_cent"], "posten": r["posten"]}

    # ── Ersatzlieferung ──────────────────────────────────────────────────────
    @frappe.whitelist()
    def ersatzlieferung_anlegen(self, zeilen=None, grund=None, bezug_doctype=None, bezug=None, lieferart=None):
        """Folgebestellung 0 € mit Bezug (Transportschaden, falscher Artikel, Servicefall). Bestellart „Ersatz“,
        Status bezahlt (0 €) → Packen/Versand bzw. Abholung wie gewohnt; keine Rechnung, keine Bestätigungsmail."""
        self.check_permission("write")
        if not (grund or "").strip():
            frappe.throw(_("Bitte einen Grund angeben."))
        auswahl = self._auswahl(zeilen) if zeilen else {str(p.idx): cint(p.menge) for p in self.positionen}
        try:
            neue = te.ersatz_zeilen(self._pos_logik(), auswahl)
        except te.ErstattungFehler as e:
            frappe.throw(str(e))
        positionen = []
        for z in neue:
            p = self.positionen[int(z["key"]) - 1]
            positionen.append({"produkt": p.produkt, "slug": p.slug, "variante": p.variante, "variante_name": p.variante_name, "bezeichnung": p.bezeichnung, "marke": p.marke, "kategorie": p.kategorie, "menge": z["menge"], "einzel_cent": 0, "summe_cent": 0, "ust_klasse": p.ust_klasse, "zerbrechlich": p.zerbrechlich, "bild": p.bild})
        lieferart = lieferart or self.lieferart
        if bezug_doctype and not (frappe.db.exists("DocType", bezug_doctype) and frappe.db.exists(bezug_doctype, bezug)):
            bezug_doctype, bezug = None, None
        neu = frappe.get_doc({
            "doctype": "PH Bestellung", "bestellart": "Ersatz", "ersatz_fuer": self.name, "ersatz_grund": grund[:140],
            "ersatz_bezug_doctype": bezug_doctype, "ersatz_bezug": bezug, "quelle": "backoffice", "modus": self.modus,
            "lieferart": lieferart, "zahlung": "vorort" if lieferart == "abholung" else "online", "sprache": self.sprache,
            "kontakt": self.kontakt, "kunde_name": self.kunde_name, "kunde_email": self.kunde_email, "kunde_telefon": self.kunde_telefon,
            "adresse_land": self.adresse_land, "adresse_plz": self.adresse_plz, "adresse_ort": self.adresse_ort, "adresse_strasse": self.adresse_strasse,
            "adresse_hausnr": self.adresse_hausnr, "adresse_zusatz": self.adresse_zusatz, "versand_cent": 0, "carrier": self.carrier, "dienst": self.dienst,
            "zugewiesen_an": self.zugewiesen_an, "bestaetigung_unterdruecken": 1, "positionen": positionen,
            "notiz_kunde": self.notiz_kunde,
        })
        neu.insert()
        st.setzen(neu, "bezahlt", _("Ersatzlieferung 0 € zu {0}").format(self.name), None, {"bezahlt_am": now_datetime(), "betrag_bezahlt_cent": 0, "offen_cent": 0})
        st.verlauf(self, self.status, _("Ersatzlieferung {0} angelegt ({1})").format(neu.name, grund))
        return neu.name

    # ── Telefonbestellung: Zahlungslink (Stripe Checkout) ────────────────────
    @frappe.whitelist()
    def zahlungslink_erstellen(self, senden=0):
        """Stripe-Checkout-Link über den offenen Betrag (metadata art=shop, order_id) – der Webhook bucht wie online.
        Staging/Tests: simuliert (kein Netz). Ein neuer Link ersetzt den alten (alter läuft bei Stripe ab)."""
        from ph_shop import stripe_client

        self.check_permission("write")
        if self.status in ("storniert", "abgeschlossen", "erstattet", "abgelaufen") or self.ist_bezahlt():
            frappe.throw(_("Für diese Bestellung ist kein Zahlungslink möglich ({0}).").format(self.status))
        offen = max(cint(self.gesamt_cent) - cint(self.betrag_bezahlt_cent), 0)
        if offen <= 0:
            frappe.throw(_("Nichts offen."))
        einst = frappe.get_cached_doc("PH Shop Einstellungen")
        stunden = min(max(cint(einst.zahlungslink_gueltig_stunden) or 24, 1), 24)
        r = stripe_client.checkout_session_erstellen(
            referenz=self.name, betrag_cent=offen, waehrung=(self.waehrung or "EUR").lower(), beschreibung=_("Bestellung {0} – Platzhirsch Home Living").format(self.name),
            email=self.kunde_email, stunden=stunden, metadata={"art": "shop", "order_id": self.name},
            erfolg_url=(einst.zahlungslink_erfolg_url or "").replace("{referenz}", self.name) or None,
            abbruch_url=(einst.zahlungslink_abbruch_url or "").replace("{referenz}", self.name) or None,
            sprache=self.sprache,
        )
        werte = {"zahlungslink_url": r["url"], "stripe_session": r["id"], "zahlungslink_erstellt_am": now_datetime(), "zahlungslink_gueltig_bis": r["gueltig_bis"], "zahlungslink_simuliert": 1 if r.get("simuliert") else 0}
        if self.status in ("fehlgeschlagen", "checkout_fehler"):
            st.setzen(self, "offen", _("Neuer Zahlungslink"), None, werte)
        else:
            self.db_set(werte)
            st.verlauf(self, self.status, _("Zahlungslink über {0} Cent erstellt").format(offen))
        if cint(senden):
            self.reload()
            self.zahlungslink_senden()
        return {"url": r["url"], "gueltig_bis": str(r["gueltig_bis"]), "simuliert": bool(r.get("simuliert")), "betrag_cent": offen}

    @frappe.whitelist()
    def zahlungslink_senden(self, empfaenger=None):
        self.check_permission("email")
        if not self.zahlungslink_url:
            frappe.throw(_("Noch kein Zahlungslink – zuerst erzeugen."))
        ok = mails.senden("zahlungslink", empfaenger or self.kunde_email, {"doc": self, "url": self.zahlungslink_url, "gueltig_bis": self.zahlungslink_gueltig_bis, "betrag_cent": max(cint(self.gesamt_cent) - cint(self.betrag_bezahlt_cent), 0)}, anhaenge=mails.rechtstext_anhaenge(), referenz_doctype=self.doctype, referenz_name=self.name)
        if ok:
            self.db_set("zahlungslink_gesendet_am", now_datetime(), update_modified=False)
        return ok

    # ── Abholung: Korrekturen ────────────────────────────────────────────────
    @frappe.whitelist()
    def abholung_zuruecknehmen(self, grund=None):
        """Leitung: Fehltipp „Abgeholt“ korrigieren → zurück auf abholbereit (Verlauf mit Grund)."""
        self.check_permission("write")
        if not _leitung():
            frappe.throw(_("Nur die Shop-Leitung kann eine Übergabe zurücknehmen."), frappe.PermissionError)
        if self.status != "abgeholt":
            frappe.throw(_("Nur aus „abgeholt“."))
        if not (grund or "").strip():
            frappe.throw(_("Bitte einen Grund angeben."))
        st.setzen(self, "abholbereit", _("Übergabe zurückgenommen: {0}").format(grund), None, {"abgeholt_am": None})
        return "abholbereit"

    @frappe.whitelist()
    def abholcode_erneut_senden(self):
        """Abholbereit-Mail mit dem vorhandenen Code erneut senden – ohne die Abholfrist zu verändern."""
        self.check_permission("email")
        if self.status != "abholbereit" or not self.abholcode:
            frappe.throw(_("Nur bei abholbereiten Bestellungen mit Abholcode."))
        ok = mails.senden("abholbereit", self.kunde_email, {"doc": self, "abholcode": self.abholcode, "abholung_bis": self.abholung_bis}, referenz_doctype=self.doctype, referenz_name=self.name)
        st.verlauf(self, self.status, _("Abholcode erneut gesendet") if ok else _("Abholcode: Mail fehlgeschlagen"))
        return ok

    # ── Betrugsprüfung (Stripe Radar, nur Anzeige) ───────────────────────────
    @frappe.whitelist()
    def radar_geprueft(self, notiz=None):
        """Mitarbeiter bestätigt: Risiko angesehen (Marker bleibt sichtbar, Prüfer/Zeit werden vermerkt)."""
        self.check_permission("write")
        self.db_set({"radar_geprueft_von": frappe.session.user, "radar_geprueft_am": now_datetime()})
        st.verlauf(self, self.status, _("Risiko geprüft: {0}").format(notiz or "–"))
        return True

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


def _json(wert):
    try:
        return json.loads(wert) if wert else None
    except (TypeError, ValueError):
        return None
