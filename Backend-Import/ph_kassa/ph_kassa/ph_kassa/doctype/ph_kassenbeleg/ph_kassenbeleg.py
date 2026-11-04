"""PH Kassenbeleg – unveränderlicher, signierter Beleg (WP10a).

Anlage nur über ph_kassa.rksv.buchung.erzeuge_beleg() (flags.ph_rksv); der Controller prüft Konsistenz,
bucht in on_submit die Zahlungen über ph_shop.zahlung.buche(...) und verbietet Cancel/Löschen.
"""

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import cint

from ph_kassa.rksv.beleg import CODE_RE, JWS_HEADER_B64URL

KANAL = {
    "Bar": "Bar",
    "Karte Stripe Terminal": "Stripe Terminal",
    "Karte extern": "Karte extern",
    "Gutschein": "Gutschein",
    "Ueberweisung": "Ueberweisung",
}
SUMMENFELDER = ("betrag_normal_cent", "betrag_ermaessigt1_cent", "betrag_ermaessigt2_cent", "betrag_null_cent", "betrag_besonders_cent")


class PHKassenbeleg(Document):
    def autoname(self):
        self.name = f"{self.kasse}-{cint(self.belegnummer):06d}"

    def before_insert(self):
        if not self.flags.ph_rksv and not (self.flags.ph_mock and frappe.flags.in_test):
            frappe.throw(_("Kassenbelege entstehen nur über die Kassa (ph_kassa.rksv.buchung.erzeuge_beleg) – nicht manuell anlegen."))
        if self.flags.ph_rksv and self.docstatus != 1:
            frappe.throw(_("Kassenbeleg wird direkt signiert gebucht (kein Entwurf)."))

    def validate(self):
        if not self.belegnummer or cint(self.belegnummer) < 1:
            frappe.throw(_("Belegnummer fehlt."))
        if frappe.db.exists("PH Kassenbeleg", {"kasse": self.kasse, "belegnummer": self.belegnummer, "name": ("!=", self.name)}):
            frappe.throw(_("Belegnummer {0} existiert bereits für Kasse {1}.").format(self.belegnummer, self.kasse))
        self._summen_pruefen()
        self._signatur_pruefen()
        self.titel = self._titel()

    def _summen_pruefen(self):
        summe = sum(cint(self.get(f)) for f in SUMMENFELDER)
        if summe != cint(self.gesamt_cent):
            frappe.throw(_("Summen je Steuersatz ({0}) ≠ Gesamt ({1}).").format(summe, self.gesamt_cent))
        if self.positionen and sum(cint(p.brutto_cent) for p in self.positionen) != cint(self.gesamt_cent):
            frappe.throw(_("Positionen ergeben nicht den Gesamtbetrag."))
        if self.belegart in ("Startbeleg", "Nullbeleg", "Monatsbeleg", "Jahresbeleg", "Schlussbeleg", "Sammelbeleg"):
            if cint(self.gesamt_cent) != 0 or self.positionen or self.zahlarten:
                frappe.throw(_("{0} muss Betrag 0 ohne Positionen/Zahlarten haben.").format(self.belegart))
        elif self.belegart != "Trainingsbeleg" or self.positionen:
            if sum(cint(z.betrag_cent) for z in self.zahlarten) != cint(self.gesamt_cent):
                frappe.throw(_("Zahlarten decken den Belegbetrag nicht."))

    def _signatur_pruefen(self):
        if self.flags.ph_mock:
            return
        if not self.jws_compact or not self.jws_compact.startswith(JWS_HEADER_B64URL + ".") or self.jws_compact.count(".") != 2:
            frappe.throw(_("JWS fehlt oder hat kein ES256-Format."))
        if not self.maschinenlesbarer_code or not CODE_RE.match(self.maschinenlesbarer_code):
            frappe.throw(_("Maschinenlesbarer Code entspricht nicht der RKSV-Spezifikation."))
        if not self.umsatzzaehler_verschluesselt or not self.signatur_vorbeleg or not self.zertifikat_seriennummer:
            frappe.throw(_("Zähler, Verkettung oder Zertifikat-Seriennummer fehlen."))

    def _titel(self):
        betrag = f"{cint(self.gesamt_cent) / 100:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
        t = f"{self.kasse} #{self.belegnummer} {self.belegart} {betrag} €"
        if self.kunde_name:
            t += f" – {self.kunde_name}"
        return t[:140]

    def on_submit(self):
        if self.belegart in ("Standard", "Stornobeleg"):
            self._zahlungen_buchen()
            self._gutscheine_buchen()
            self._faktura_hinweis()

    def on_cancel(self):
        frappe.throw(_("Kassenbelege dürfen nicht storniert (cancel) werden – Button „Stornieren“ erzeugt einen Stornobeleg (RKSV)."))

    def on_trash(self):
        if not frappe.flags.in_test:
            frappe.throw(_("Signierte Kassenbelege sind 7 Jahre aufzubewahren und können nicht gelöscht werden."))

    # ── Nebenbuchungen (nie Fehler werfen) ─────────────────────────────────

    def _zahlungen_buchen(self):
        """Je Zahlart eine PH Zahlung über ph_shop.zahlung.buche (keyword-only, ph_shop/README „Zahlungen buchen“).

        Idempotent über idempotency_key ``kassa:<beleg>:<idx>`` bzw. den Terminal-PaymentIntent; Rückwärts-Links:
        PH Kassenbeleg Zahlung.zahlung und PH Zahlung.kassenbeleg (Custom Field aus fixtures/custom_field.json).
        """
        try:
            from ph_shop.zahlung import buche
        except ImportError:
            self.add_comment("Info", _("PH Zahlung nicht gebucht: ph_shop.zahlung.buche nicht verfügbar."))
            return
        hat_feld = frappe.get_meta("PH Zahlung").has_field("kassenbeleg")
        for z in self.zahlarten:
            betrag = cint(z.betrag_cent)
            if not betrag:
                continue
            if z.zahlung and frappe.db.exists("PH Zahlung", z.zahlung):
                continue  # schon gebucht (z. B. Nachsignatur)
            kanal = KANAL.get(z.zahlart, z.zahlart)
            try:
                zahlung = buche(
                    kanal=kanal,
                    betrag_cent=abs(betrag),
                    art="Eingang" if betrag > 0 else "Erstattung",
                    bezug_doctype="PH Kassenbeleg",
                    bezug=self.name,
                    waehrung=self.waehrung or "EUR",
                    status="Bezahlt",
                    zeitpunkt=self.datum_uhrzeit,
                    kontakt=self.kontakt,
                    stripe_payment_intent=(z.terminal_payment_intent or None) if kanal == "Stripe Terminal" else None,
                    livemode=None if kanal == "Stripe Terminal" else (not bool(self.trainings)),
                    gutschein=z.gutschein or None,
                    notiz=_("Kassenbeleg {0} ({1})").format(self.name, z.zahlart),
                    idempotency_key=f"kassa:{self.name}:{z.idx}",
                    quelle="kassa",
                )
                if zahlung.flags.get("bereits_gebucht"):
                    self.add_comment("Info", _("Zahlung {0} war bereits gebucht ({1}).").format(z.zahlart, zahlung.name))
                z.db_set("zahlung", zahlung.name, update_modified=False)
                if hat_feld:
                    frappe.db.set_value("PH Zahlung", zahlung.name, "kassenbeleg", self.name, update_modified=False)
            except Exception:  # noqa: BLE001 – Nebenbuchung darf den signierten Beleg nicht verhindern
                frappe.log_error(title=f"PH Kassa: Zahlung {z.zahlart} zu {self.name} nicht gebucht")
                self.add_comment("Info", _("Zahlung {0} konnte nicht in PH Zahlung gebucht werden – manuell prüfen.").format(z.zahlart))

    def _gutscheine_buchen(self):
        """Einlösung in PH Gutschein über ph_shop.gutschein.einloesen (idempotent je Beleg)."""
        einloesungen = [z for z in self.zahlarten if z.zahlart == "Gutschein" and z.gutschein and cint(z.betrag_cent)]
        if not einloesungen:
            return
        try:
            from ph_shop.gutschein import einloesen
        except ImportError:
            self.add_comment("Info", _("Gutschein-Einlösung nicht in PH Gutschein gebucht (ph_shop.gutschein fehlt) – manuell nachtragen."))
            return
        for z in einloesungen:
            try:
                r = einloesen(gutschein=z.gutschein, betrag_cent=cint(z.betrag_cent), kanal="Kassa", beleg_doctype="PH Kassenbeleg", beleg=self.name, kontakt=self.kontakt, hinweis=_("Kassenbeleg {0}").format(self.name), idempotency_key=f"kassa:{self.name}:{z.idx}")
                if not r.get("bereits_gebucht"):
                    self.add_comment("Info", _("Gutschein {0}: {1} Cent eingelöst, Rest {2} Cent").format(z.gutschein, cint(z.betrag_cent), r.get("rest_cent")))
            except Exception:  # noqa: BLE001
                frappe.log_error(title=f"PH Kassa: Gutschein {z.gutschein} zu {self.name} nicht eingelöst")
                self.add_comment("Info", _("Gutschein {0}: Einlösung konnte nicht gebucht werden.").format(z.gutschein))

    def _faktura_hinweis(self):
        """Anzahlung/Teil-/Schlusszahlung: Zahlungsplan-Ist, Anzahlungsrechnung und OP über ph_faktura.ph_faktura.kassa."""
        arten = {p.art for p in self.positionen}
        if arten & {"Anzahlung", "Teilzahlung", "Schlusszahlung"} and (self.auftrag or self.rechnung):
            try:
                from ph_faktura.ph_faktura.kassa import kassenbeleg_gebucht
            except ImportError:
                self.add_comment("Info", _("Zahlungsplan/Anzahlungsrechnung: ph_faktura nicht verfügbar (Auftrag {0}).").format(self.auftrag or self.rechnung))
                return
            try:
                kassenbeleg_gebucht(self.name)
            except Exception:  # noqa: BLE001
                frappe.log_error(title=f"PH Kassa: ph_faktura.kassenbeleg_gebucht {self.name}")

    # ── Buttons (ph_kassenbeleg.js) ────────────────────────────────────────

    @frappe.whitelist()
    def stornieren(self, grund):
        from ph_kassa.rksv.buchung import storniere_beleg

        return storniere_beleg(self.name, grund, quelle="Desk").name

    @frappe.whitelist()
    def nullbeleg(self):
        self.check_permission("write")
        from ph_kassa.rksv.buchung import nullbeleg

        return nullbeleg(self.kasse, quelle="Desk").name

    @frappe.whitelist()
    def pruefen(self):
        """Code anzeigen und Signatur/Verkettung gegen Vorbeleg prüfen (Simulation Belegcheck)."""
        self.check_permission("read")
        from ph_kassa.rksv.beleg import zerlege_code
        from ph_kassa.rksv.pruefung import pruefe_einzelbeleg
        from ph_kassa.rksv.see import zertifikat_fuer_pruefung

        see = frappe.db.get_value("PH Kasse", self.kasse, "see")
        zert = zertifikat_fuer_pruefung(see) if see else None
        vor = frappe.db.get_value("PH Kassenbeleg", self.vorbeleg, "jws_compact") if self.vorbeleg else None
        erg = {"ok": None, "fehler": [_("Kein SEE-Zertifikat gespeichert – Signatur nicht prüfbar.")]} if zert is None else pruefe_einzelbeleg(self.jws_compact, zert, vorbeleg_jws=vor)
        felder = zerlege_code(self.maschinenlesbarer_code)
        return {
            "code": self.maschinenlesbarer_code,
            "ocr": self.ocr_code,
            "jws": self.jws_compact,
            "felder": {k: (str(v) if not isinstance(v, dict) else v) for k, v in felder.items()},
            "ausfall": bool(self.see_ausgefallen),
            "signatur_ok": erg["ok"],
            "fehler": [t if isinstance(t, str) else t[1] for t in erg["fehler"]],
        }

    @frappe.whitelist()
    def qr_svg(self):
        self.check_permission("read")
        from ph_kassa.rksv.qr import svg

        return svg(self.maschinenlesbarer_code) or ""
