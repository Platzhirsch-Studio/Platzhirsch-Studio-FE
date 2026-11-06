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
            self.flags.ph_klaerfaelle = []
            self._zahlungen_buchen()
            self._gutscheine_buchen()
            self._gutscheine_ausstellen()
            self._ausstellungsstuecke_buchen()
            self._faktura_hinweis()
            self._kassenbuch_buchen()
            self._nebenbuchung_status()

    def _klaerfall(self, text):
        """Nebenbuchung fehlgeschlagen: Kommentar + Status „Fehler“ (Report PH Kassa Klaerfaelle), nie Ausnahme."""
        if self.flags.get("ph_klaerfaelle") is None:
            self.flags.ph_klaerfaelle = []
        self.flags.ph_klaerfaelle.append(text)
        try:
            self.add_comment("Info", text)
        except Exception:  # noqa: BLE001
            pass

    def _nebenbuchung_status(self):
        fehler = self.flags.get("ph_klaerfaelle") or []
        self.db_set({"nebenbuchung_status": "Fehler" if fehler else "OK", "nebenbuchung_hinweis": "\n".join(fehler)[:1000] or None}, update_modified=False)
        if fehler:
            try:
                from ph_kassa.rksv.buchung import aufgabe

                aufgabe(self.kasse, _("Kassenbeleg {0}: Nebenbuchung prüfen – {1}").format(self.name, fehler[0])[:140])
            except Exception:  # noqa: BLE001
                frappe.log_error(title=f"PH Kassa: Aufgabe Klärfall {self.name}")

    def _kassenbuch_buchen(self):
        """Fachkritik 21 P2/P-E: je Beleg mit Bar-Anteil eine Kassenbuch-Zeile (Bareinnahme/Barausgabe, idempotent),
        damit der Kassenbuch-Bestand jederzeit dem Bargeld in der Lade entspricht (BAO § 131 Kassasturzfähigkeit).
        CHF: CHF-Lade erhält den gegebenen Betrag (Kassenbuch in CHF), Rückgeld geht in Euro aus der EUR-Lade."""
        try:
            from ph_kassa.ph_kassa.doctype.ph_kassenbuch.ph_kassenbuch import buchen

            eur, chf = 0, 0
            for z in self.zahlarten:
                if z.zahlart != "Bar":
                    continue
                if z.get("fremdwaehrung"):
                    chf += cint(z.fremd_gegeben_cent)
                    eur -= cint(z.retour_cent)
                else:
                    eur += cint(z.betrag_cent)
            for betrag, waehrung, schluessel in ((eur, "EUR", f"beleg:{self.name}"), (chf, "CHF", f"beleg:{self.name}:CHF")):
                if not betrag:
                    continue
                buchen(self.kasse, "Bareinnahme" if betrag > 0 else "Barausgabe", abs(betrag), _("Beleg {0}").format(self.name), quelle="beleg", beleg=self.name, idempotency_key=schluessel, zeitpunkt=self.datum_uhrzeit, waehrung=waehrung, ignore_permissions=True)
        except Exception:  # noqa: BLE001
            frappe.log_error(title=f"PH Kassa: Kassenbuch zu {self.name}")
            self._klaerfall(_("Kassenbuch-Zeile (Bargeld) zu {0} nicht gebucht – Kassenbuch prüfen.").format(self.name))

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
            if betrag < 0:
                self._erstattung_buchen(z, kanal)
                continue
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
                self._klaerfall(_("Zahlung {0} konnte nicht in PH Zahlung gebucht werden – manuell prüfen.").format(z.zahlart))

    def _erstattung_buchen(self, z, kanal):
        """Rückzahlung (Storno/Retoure): Terminal → Stripe-Refund auf die Originalkarte (Fachkritik 21 P9),
        dann Gegenbuchung in PH Zahlung – über ph_shop.zahlung.erstatte, wenn die Originalzahlung bekannt ist."""
        betrag = abs(cint(z.betrag_cent))
        refund = z.get("terminal_refund")
        if z.zahlart == "Karte Stripe Terminal" and not refund:
            if not z.terminal_payment_intent:
                self._klaerfall(_("Kartenrückzahlung {0} Cent ohne Original-PaymentIntent – Rückerstattung im Stripe-Dashboard durch Leitung.").format(betrag))
                return
            try:
                from ph_kassa.ph_kassa.doctype.ph_kassa_einstellungen.ph_kassa_einstellungen import einstellungen
                from ph_kassa.terminal import dienst

                mock = bool(einstellungen()["terminal_testmodus"]) and not frappe.conf.get("ph_stripe_secret_key")
                r = dienst(erzwinge_mock=mock).erstatten(z.terminal_payment_intent, betrag, idempotency_key=f"kassa:{self.name}:{z.idx}")
                refund = r["refund"]
                z.db_set("terminal_refund", refund, update_modified=False)
                if self.flags.get("ph_refunds") is None:
                    self.flags.ph_refunds = []
                self.flags.ph_refunds.append(r)
            except Exception as e:  # noqa: BLE001
                frappe.log_error(title=f"PH Kassa: Stripe-Refund zu {self.name}")
                self._klaerfall(_("Rückerstattung auf Karte fehlgeschlagen ({0}) – Kunde hat das Geld NICHT erhalten. Leitung: Stripe-Dashboard oder bar auszahlen.").format(str(getattr(e, "meldung", e))[:120]))
                return
        try:
            from ph_shop.zahlung import buche, erstatte
        except ImportError:
            self._klaerfall(_("Erstattung nicht in PH Zahlung gebucht: ph_shop.zahlung fehlt."))
            return
        if z.zahlart == "Karte Stripe Terminal" and refund and z.terminal_payment_intent:
            # Integration Runde 3: Refund ist bei Stripe ausgelöst → Buchung in ph_shop, idempotent über stripe_refund
            # (auch wenn der Webhook charge.refunded zuerst kam). Signatur: ph_shop/zahlung.py erstattung_erfassen.
            try:
                from ph_shop.zahlung import erstattung_erfassen

                r = erstattung_erfassen(payment_intent=z.terminal_payment_intent, betrag_cent=betrag, grund=_("Kassenbeleg {0}").format(self.name), stripe_refund=refund,
                                        idempotency_key=f"kassa:{self.name}:{z.idx}", quelle="kassa")
                z.db_set("zahlung", r["gegenbuchung"], update_modified=False)
                if frappe.get_meta("PH Zahlung").has_field("kassenbeleg"):
                    frappe.db.set_value("PH Zahlung", r["gegenbuchung"], "kassenbeleg", self.name, update_modified=False)
                return
            except ImportError:
                pass  # ältere ph_shop-Version: Weg über erstatte/buche
            except frappe.DoesNotExistError:
                pass  # keine Eingangszahlung zum Payment Intent → Gegenbuchung am Beleg
            except Exception:  # noqa: BLE001
                frappe.log_error(title=f"PH Kassa: erstattung_erfassen {self.name}")
                self._klaerfall(_("Karten-Erstattung {0} Cent ist bei Stripe erfolgt, aber nicht in PH Zahlung gebucht – Leitung prüfen (Refund {1}).").format(betrag, refund))
                return
        try:
            orig = z.get("erstattung_von_zahlung")
            if orig and frappe.db.exists("PH Zahlung", {"name": orig, "docstatus": 1, "art": "Eingang"}):
                gegen = erstatte(orig, betrag, _("Kassenbeleg {0}").format(self.name), stripe_refund=refund or None, quelle="kassa", notiz=_("Kassenbeleg {0} ({1})").format(self.name, z.zahlart))
            else:
                gegen = buche(kanal=kanal, betrag_cent=betrag, art="Erstattung", bezug_doctype="PH Kassenbeleg", bezug=self.name, waehrung=self.waehrung or "EUR", status="Bezahlt", zeitpunkt=self.datum_uhrzeit, kontakt=self.kontakt, stripe_refund=refund or None, notiz=_("Kassenbeleg {0} ({1})").format(self.name, z.zahlart), idempotency_key=f"kassa:{self.name}:{z.idx}", quelle="kassa")
            z.db_set("zahlung", gegen.name, update_modified=False)
            if frappe.get_meta("PH Zahlung").has_field("kassenbeleg"):
                frappe.db.set_value("PH Zahlung", gegen.name, "kassenbeleg", self.name, update_modified=False)
        except Exception:  # noqa: BLE001
            frappe.log_error(title=f"PH Kassa: Erstattung {z.zahlart} zu {self.name}")
            self._klaerfall(_("Erstattung {0} konnte nicht in PH Zahlung gebucht werden.").format(z.zahlart))

    def _gutscheine_buchen(self):
        """Einlösung in PH Gutschein (ph_shop.gutschein): Mehrzweck als Zahlart „Gutschein“, Einzweck als Position
        „Gutschein Einloesung“ (Fachkritik 21 P5). Stornobeleg: Einlösung des Originalbelegs zurückbuchen (P8) und
        verkaufte, unbenutzte Gutscheine sperren."""
        einloesungen = [(z.gutschein, cint(z.betrag_cent), z.idx) for z in self.zahlarten if z.zahlart == "Gutschein" and z.gutschein and cint(z.betrag_cent) > 0]
        einloesungen += [(p.gutschein, abs(cint(p.brutto_cent)), 100 + cint(p.idx)) for p in self.positionen if p.art == "Gutschein Einloesung" and p.gutschein and cint(p.brutto_cent)]
        # Rabattgutschein (ph_shop Art „Rabatt“): Restwert sinkt um die Summe der Rabattzeilen je Gutschein (eine Einlösung)
        rabatt = {}
        for p in self.positionen:
            if p.art == "Rabatt" and p.gutschein and cint(p.brutto_cent) < 0:
                rabatt.setdefault(p.gutschein, [0, 200 + cint(p.idx)])[0] += abs(cint(p.brutto_cent))
        einloesungen += [(g, b, idx) for g, (b, idx) in rabatt.items()]
        storno = self.belegart == "Stornobeleg" and self.storno_von
        zurueck = {z.gutschein for z in self.zahlarten if storno and z.zahlart == "Gutschein" and z.gutschein and cint(z.betrag_cent) < 0}
        zurueck |= {p.gutschein for p in self.positionen if storno and p.get("ursprungsart") in ("Gutschein Einloesung", "Rabatt") and p.gutschein}
        gesperrt = {p.gutschein for p in self.positionen if storno and p.get("ursprungsart") == "Gutschein Verkauf" and p.gutschein}
        if not (einloesungen or zurueck or gesperrt):
            return
        try:
            from ph_shop import gutschein as gs
        except ImportError:
            self._klaerfall(_("Gutschein-Buchung nicht möglich (ph_shop.gutschein fehlt) – manuell nachtragen."))
            return
        for gutschein, betrag, idx in einloesungen:
            try:
                r = gs.einloesen(gutschein=gutschein, betrag_cent=betrag, kanal="Kassa", beleg_doctype="PH Kassenbeleg", beleg=self.name, kontakt=self.kontakt, hinweis=_("Kassenbeleg {0}").format(self.name), idempotency_key=f"kassa:{self.name}:{idx}")
                if not r.get("bereits_gebucht"):
                    self.add_comment("Info", _("Gutschein {0}: {1} Cent eingelöst, Rest {2} Cent").format(gutschein, betrag, r.get("rest_cent")))
            except Exception:  # noqa: BLE001
                frappe.log_error(title=f"PH Kassa: Gutschein {gutschein} zu {self.name} nicht eingelöst")
                self._klaerfall(_("Gutschein {0}: Einlösung konnte nicht gebucht werden.").format(gutschein))
        for gutschein in zurueck:
            try:
                r = gs.storniere_einloesung(gutschein=gutschein, beleg_doctype="PH Kassenbeleg", beleg=self.storno_von, grund=_("Storno {0}").format(self.name))
                if r:
                    self.add_comment("Info", _("Gutschein {0} wieder {1} Cent").format(gutschein, r.get("rest_cent")))
            except Exception:  # noqa: BLE001
                frappe.log_error(title=f"PH Kassa: Gutschein {gutschein} Rückbuchung {self.name}")
                self._klaerfall(_("Gutschein {0}: Einlösung konnte nicht zurückgebucht werden.").format(gutschein))
        if gesperrt:
            # Integration Runde 3: ph_shop.gutschein.verkauf_stornieren sperrt unbenutzte Gutscheine des Originalbelegs
            # (ausgabe_beleg); teilweise eingelöste bleiben aktiv (Rückzahlung nur Restwert) → Klärfall
            try:
                for r in gs.verkauf_stornieren(beleg_doctype="PH Kassenbeleg", beleg=self.storno_von, grund=_("Storno {0}").format(self.name)):
                    gesperrt.discard(r["gutschein"])
                    if r["ergebnis"] == "teilweise_eingeloest":
                        self._klaerfall(_("Gutschein {0} ist teilweise eingelöst – bleibt mit {1} Cent aktiv; Rückzahlung nur des Restwerts prüfen.").format(r["gutschein"], r["rest_cent"]))
            except Exception:  # noqa: BLE001
                frappe.log_error(title=f"PH Kassa: verkauf_stornieren {self.name}")
        for gutschein in gesperrt:  # ältere Gutscheine ohne ausgabe_beleg
            try:
                doc = frappe.get_doc("PH Gutschein", gutschein)
                doc.flags.ignore_permissions = True
                doc.sperren(grund=_("Verkauf storniert ({0})").format(self.name))
            except Exception:  # noqa: BLE001
                frappe.log_error(title=f"PH Kassa: Gutschein {gutschein} sperren {self.name}")
                self._klaerfall(_("Gutschein {0} aus storniertem Verkauf konnte nicht gesperrt werden – sofort sperren!").format(gutschein))

    def _gutscheine_ausstellen(self):
        """Position „Gutschein Verkauf“ erzeugt den PH Gutschein (ph_shop ausstellen, idempotent je Zeile). Der Klartext-
        Code existiert nur in diesem Moment: er wird in flags.ph_gutschein_codes an die Kassa-Page zurückgegeben
        (Druck/Übergabe an den Kunden) und nie gespeichert (ph_shop speichert nur den Hash)."""
        if self.belegart != "Standard":
            return
        verkauf = [p for p in self.positionen if p.art == "Gutschein Verkauf" and not p.gutschein and cint(p.brutto_cent) > 0]
        if not verkauf:
            return
        try:
            from ph_shop.gutschein import ausstellen_verkauf
        except ImportError:
            self._klaerfall(_("Gutschein nicht ausgestellt (ph_shop fehlt) – Wert kassiert, Gutschein manuell anlegen!"))
            return
        from ph_kassa.logik.betraege import STEUERSAETZE
        from ph_kassa.ph_kassa.doctype.ph_kassa_einstellungen.ph_kassa_einstellungen import einstellungen

        art = einstellungen().get("gutschein_art") or "Mehrzweck"
        for p in verkauf:
            key = f"kassa:{self.name}:gs:{p.idx}"
            try:
                # Integration Runde 3: ph_shop.gutschein.ausstellen_verkauf (idempotent je Schlüssel; ausgabe_beleg = dieser
                # Beleg, damit verkauf_stornieren ihn findet); Einzweck mit dem Satz der Kassenposition (Pflicht in ph_shop)
                r = ausstellen_verkauf(wert_cent=cint(p.brutto_cent), beleg_doctype="PH Kassenbeleg", beleg=self.name, idempotency_key=key, position=p.idx, kanal="Kassa",
                                       zahlung=None, kontakt=self.kontakt, kaeufer_name=self.kunde_name, kaeufer_email=self.kundenbeleg_email, art=art,
                                       ust_satz_promille=STEUERSAETZE.get(p.steuersatz) if art == "Einzweck" else None, test=bool(self.trainings), pdf=False)
                p.db_set("gutschein", r["gutschein"], update_modified=False)
                if r.get("bereits_ausgestellt") or not r.get("code"):
                    continue
                if self.flags.get("ph_gutschein_codes") is None:
                    self.flags.ph_gutschein_codes = []
                self.flags.ph_gutschein_codes.append({"gutschein": r["gutschein"], "code": r["code"], "wert_cent": cint(p.brutto_cent), "zeile": p.idx, "art": r.get("art")})
                self.add_comment("Info", _("Gutschein {0} über {1} Cent ausgestellt (Code endet auf {2}).").format(r["gutschein"], cint(p.brutto_cent), r.get("letzte4") or r["code"][-4:]))
            except Exception:  # noqa: BLE001
                frappe.log_error(title=f"PH Kassa: Gutschein zu {self.name} nicht ausgestellt")
                self._klaerfall(_("Gutschein über {0} Cent wurde kassiert, aber nicht ausgestellt – Leitung: Gutschein manuell ausstellen.").format(cint(p.brutto_cent)))

    def _ausstellungsstuecke_buchen(self):
        """Position mit Bezug PH Lagerbestand (Ausstellungsstück, ph_logistik): Verkauf im Bestand buchen – idempotent je
        Zeile, Bezug = dieser Beleg. Schon über ph_logistik („Als Ausstellungsstück verkaufen“) gebucht → nichts tun.
        Storno: Rückbuchung ins Lager ist ein Logistik-Vorgang (Warenrücknahme, Anlass „Ausstellungsstück zurück“) → Klärfall."""
        if self.belegart == "Stornobeleg":
            for p in self.positionen:
                if p.get("lagerbestand_ref"):
                    self._klaerfall(_("Storno Ausstellungsstück {0}: Stück per Warenrücknahme (Anlass „Ausstellungsstück zurück“) wieder einlagern.").format(p.lagerbestand_ref))
            return
        zeilen = [p for p in self.positionen if p.get("bezug_doctype") == "PH Lagerbestand" and p.get("bezug")]
        if not zeilen or not frappe.db.exists("DocType", "PH Lagerbestand"):
            return
        try:
            from ph_logistik.ph_logistik.bestand import buche
        except ImportError:
            self._klaerfall(_("Ausstellungsstück verkauft, aber ph_logistik fehlt – Bestand manuell ausbuchen."))
            return
        for p in zeilen:
            try:
                lb = frappe.db.get_value("PH Lagerbestand", p.bezug, ["name", "produkt", "lagerort", "status"], as_dict=True)
                if not lb:
                    self._klaerfall(_("Ausstellungsstück {0} nicht gefunden – Bestand prüfen.").format(p.bezug))
                    continue
                if not p.get("lagerbestand_ref"):
                    p.db_set("lagerbestand_ref", lb.name, update_modified=False)
                if lb.status == "Verkauft":
                    continue
                buche("Verkauf", lb.produkt, 1, lagerort_von=lb.lagerort, lagerbestand=lb.name, bezug_doctype="PH Kassenbeleg", bezug=self.name,
                      grund=_("Verkauf Ausstellungsstück (Kassa {0})").format(self.name), idempotency_key=f"kassa:{self.name}:lb:{p.idx}")
            except Exception:  # noqa: BLE001
                frappe.log_error(title=f"PH Kassa: Ausstellungsstück {p.bezug} zu {self.name}")
                self._klaerfall(_("Ausstellungsstück {0}: Verkauf im Bestand nicht gebucht – Logistik prüfen.").format(p.bezug))

    def _faktura_hinweis(self):
        """Anzahlung/Teil-/Schlusszahlung: Zahlungsplan-Ist, Anzahlungsrechnung und OP über ph_faktura.ph_faktura.kassa."""
        arten = {p.art for p in self.positionen} | {p.get("ursprungsart") for p in self.positionen if p.art == "Storno"}
        if arten & {"Anzahlung", "Teilzahlung", "Schlusszahlung"} and (self.auftrag or self.rechnung):
            try:
                from ph_faktura.ph_faktura.kassa import kassenbeleg_gebucht
            except ImportError:
                self.add_comment("Info", _("Zahlungsplan/Anzahlungsrechnung: ph_faktura nicht verfügbar (Auftrag {0}).").format(self.auftrag or self.rechnung))
                return
            try:
                # Rückmeldung (Anzahlungsrechnung, Hinweise) für die Ergebnis-Karte der Page (Fachkritik 21 P11)
                self.flags.ph_faktura = kassenbeleg_gebucht(self.name)
            except Exception:  # noqa: BLE001
                frappe.log_error(title=f"PH Kassa: ph_faktura.kassenbeleg_gebucht {self.name}")
                self._klaerfall(_("Faktura (Zahlungsplan/Anzahlungsrechnung) zu {0} nicht verbucht.").format(self.auftrag or self.rechnung))

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
