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
from ph_faktura.rechenwerk import kostenzuordnung as KZ
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
        from ph_faktura.ph_faktura.integration import regress_pruefen

        regress_pruefen(self)
        if self.belegart == "Gutschrift":
            self.zahllauf = 0
            if self.bezug_eingangsrechnung == self.name:
                frappe.throw(_("Gutschrift kann sich nicht auf sich selbst beziehen."))
        self.zuordnung_berechnen()
        art = _("Gutschrift") + " " if self.belegart == "Gutschrift" else ""
        self.titel = f"{self.lieferant_name}: {art}{self.rechnungsnummer_lieferant} ({cint(self.brutto_cent) / 100:,.2f} €)"[:140]

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
        self.zuordnung_fuer_freigabe()
        gutschrift = self.belegart == "Gutschrift"
        self.status_setzen("Freigegeben", freigegeben_von=frappe.session.user, freigegeben_am=now_datetime(), zahllauf=0 if gutschrift else 1)
        journal.schreibe("Eingangsrechnung", self, -cint(self.brutto_cent) if gutschrift else self.brutto_cent, f"Freigegeben: {'Gutschrift ' if gutschrift else ''}{self.lieferant_name} {self.rechnungsnummer_lieferant}")
        if gutschrift:
            from ph_faktura.ph_faktura.integration import regress_gutschrift_buchen

            self.reload()
            regress_gutschrift_buchen(self)
        self.budget_hinweis_setzen()
        return True

    # ── Kostenzuordnung (Projektnachkalkulation; Logik: rechenwerk/kostenzuordnung.py) ──────────────────

    def _zuordnung_liste(self):
        return [{k: z.get(k) for k in ("projekt", "kostenart", "prozent", "betrag_cent", "belegposition", "bezug_doctype", "bezug_name", "bemerkung")} for z in self.get("zuordnung") or []]

    def zuordnung_berechnen(self):
        """validate: Zeilen je Modus bilden/aufteilen, Summen und Status setzen; nach Freigabe nur über „Umbuchen“."""
        if not self.meta.has_field("zuordnung"):
            return
        vorher = self.get_doc_before_save()
        if vorher and vorher.status in ("Freigegeben", "Bezahlt") and not self.flags.ph_umbuchung and not self.flags.ph_system:
            alt = [(z.projekt, z.kostenart, cint(z.betrag_cent)) for z in vorher.get("zuordnung") or []]
            if (vorher.zuordnung_modus or "") != (self.zuordnung_modus or "") or alt != [(z.projekt, z.kostenart, cint(z.betrag_cent)) for z in self.get("zuordnung") or []]:
                frappe.throw(_("Kostenzuordnung einer freigegebenen Rechnung nur über „Umbuchen“ (mit Begründung und Protokoll)."))
        if not self.zuordnung_modus and self.projekt:
            self.zuordnung_modus = "Ganz einem Projekt"
        netto, modus = cint(self.netto_cent), self.zuordnung_modus
        if modus == "Ganz einem Projekt":
            if not self.kostenart and self.herstellerbestellung and frappe.db.exists("PH Kostenart", "Ware"):
                self.kostenart = "Ware"
            alt = (self.get("zuordnung") or [None])[0]
            bezug = (alt.bezug_doctype, alt.bezug_name) if alt and alt.bezug_name else (("PH Herstellerbestellung", self.herstellerbestellung) if self.herstellerbestellung else (None, None))
            self.set("zuordnung", [{"projekt": self.projekt, "kostenart": self.kostenart, "prozent": 100, "betrag_cent": netto, "bezug_doctype": bezug[0], "bezug_name": bezug[1],
                                    "bemerkung": alt.bemerkung if alt else None}] if self.projekt else [])
        elif modus == "Nach Positionen":
            vorhanden = self._zuordnung_liste()
            if self.positionen:
                self.set("zuordnung", KZ.aus_positionen([p.as_dict() for p in self.positionen], vorhanden, self.projekt, self.kostenart))
        elif modus == "Aliquot":
            betraege, _diff = KZ.aufteilen(netto, self.get("zuordnung") or [])
            for z, b in zip(self.get("zuordnung") or [], betraege):
                z.betrag_cent = b
        elif modus == "Gemeinkosten":
            self.set("zuordnung", [])
        if self.belegart == "Gutschrift" and not self.get("zuordnung") and not modus and self.bezug_eingangsrechnung:
            self.zuordnung_aus_ursprung()
        zeilen = self._zuordnung_liste()
        if modus in ("Aliquot", "Nach Positionen") and zeilen:
            groesste = max(zeilen, key=lambda z: abs(cint(z["betrag_cent"])))
            if groesste.get("projekt"):
                self.projekt = groesste["projekt"]  # Kopf-Projekt = größter Anteil (Listen, Zahllauf, Altauswertungen)
        self.zuordnung_summe_cent = sum(cint(z["betrag_cent"]) for z in zeilen)
        self.zuordnung_differenz_cent = netto - self.zuordnung_summe_cent if modus != "Gemeinkosten" else 0
        self.zuordnung_status = KZ.status(modus, netto, zeilen)
        if self.flags.ph_umbuchung:
            fehler = KZ.pruefen(modus, netto, zeilen)
            if fehler:
                frappe.throw("<br>".join(frappe.utils.escape_html(f) for f in fehler), title=_("Umbuchung unvollständig"))

    def zuordnung_aus_ursprung(self):
        """Lieferanten-Gutschrift: Zuordnung im Verhältnis der Ursprungsrechnung vorschlagen."""
        urs = frappe.get_all("PH Eingangsrechnung Zuordnung", filters={"parent": self.bezug_eingangsrechnung, "parenttype": "PH Eingangsrechnung"},
                             fields=["projekt", "kostenart", "betrag_cent", "bezug_doctype", "bezug_name", "bemerkung"], order_by="idx asc")
        zeilen = KZ.anteilig(cint(self.netto_cent), urs)
        if zeilen:
            self.zuordnung_modus = "Aliquot" if len(zeilen) > 1 else "Ganz einem Projekt"
            if len(zeilen) == 1:
                self.projekt, self.kostenart = zeilen[0]["projekt"], zeilen[0]["kostenart"]
            self.set("zuordnung", [{**z, "vorschlag": 1} for z in zeilen])
        return zeilen

    def zuordnung_fuer_freigabe(self):
        """Pflicht bei Freigabe. Lieferanten-Gutschrift ohne Projektbezug → Gemeinkosten (mit Hinweis)."""
        if not self.meta.has_field("zuordnung"):
            return
        if self.belegart == "Gutschrift" and not self.zuordnung_modus and not self.get("zuordnung"):
            self.zuordnung_modus = "Gemeinkosten"
            self.flags.ph_system = True
            self.save()
            frappe.msgprint(_("Lieferanten-Gutschrift ohne Projektbezug als Gemeinkosten zugeordnet."), indicator="blue")
        fehler = KZ.pruefen(self.zuordnung_modus, cint(self.netto_cent), self._zuordnung_liste())
        if fehler:
            frappe.throw(_("Kostenzuordnung unvollständig – bitte vor der Freigabe zuordnen:") + "<br>" + "<br>".join(frappe.utils.escape_html(f) for f in fehler))

    def budget_hinweis_setzen(self):
        """Hinweis an den Freigebenden, wenn die Rechnung ein Projektbudget überschreitet (ph_projekte, nie werfen)."""
        paare = {(z.projekt, z.kostenart) for z in self.get("zuordnung") or [] if z.projekt}
        if not paare:
            return
        try:
            from ph_projekte.ph_projekte.nachkalkulation import budget_pruefen

            meldungen = budget_pruefen(paare)
        except Exception:  # noqa: BLE001
            frappe.log_error(title=f"PH Eingangsrechnung {self.name}: Budgetprüfung")
            return
        self.db_set("budget_hinweis", "\n".join(meldungen)[:1000] if meldungen else None, update_modified=False)
        if meldungen:
            frappe.msgprint("<br>".join(frappe.utils.escape_html(m) for m in meldungen), title=_("Budget überschritten"), indicator="orange")

    @frappe.whitelist()
    def zuordnung_vorschlagen(self):
        """Vorschlag aus Herstellerbestellung (Ware), Speditionsauftrag des Spediteurs (Fracht) oder Fremdgewerk des
        Partnerbetriebs (Fremdgewerk); Gutschrift: Verhältnis der Ursprungsrechnung. Setzt Zeilen, speichert nicht."""
        self.check_permission("write")
        if self.status in ("Freigegeben", "Bezahlt"):
            frappe.throw(_("Nach Freigabe nur „Umbuchen“."))
        netto = cint(self.netto_cent)
        if self.belegart == "Gutschrift" and self.bezug_eingangsrechnung and self.zuordnung_aus_ursprung():
            return self._zuordnung_liste()
        kandidaten = []
        if self.herstellerbestellung and frappe.db.exists("DocType", "PH Herstellerbestellung"):
            hb = frappe.db.get_value("PH Herstellerbestellung", self.herstellerbestellung, ["bezug_doctype", "bezug_name", "kommission"], as_dict=True) or {}
            projekt = hb.get("bezug_name") if hb.get("bezug_doctype") == "PH Projekt" else (hb.get("kommission") if hb.get("kommission") and frappe.db.exists("PH Projekt", hb.get("kommission")) else None)
            if projekt:
                kandidaten.append({"projekt": projekt, "kostenart": "Ware", "betrag_cent": netto, "bezug_doctype": "PH Herstellerbestellung", "bezug_name": self.herstellerbestellung})
        if not kandidaten and self.lieferant and frappe.db.exists("DocType", "PH Speditionsauftrag"):
            for s in frappe.get_all("PH Speditionsauftrag", filters={"spediteur": self.lieferant, "status": ("!=", "Storniert")}, fields=["name", "projekt", "kommission", "preis_bestaetigt_cent", "preis_angefragt_cent"], order_by="creation desc", limit=20):
                projekt = s.projekt or s.kommission
                if projekt and frappe.db.exists("PH Projekt", projekt) and not frappe.db.exists("PH Eingangsrechnung Zuordnung", {"bezug_doctype": "PH Speditionsauftrag", "bezug_name": s.name}):
                    kandidaten.append({"projekt": projekt, "kostenart": "Fracht", "betrag_cent": cint(s.preis_bestaetigt_cent) or cint(s.preis_angefragt_cent) or 1, "bezug_doctype": "PH Speditionsauftrag", "bezug_name": s.name})
        if not kandidaten and self.lieferant:
            for g in frappe.get_all("PH Fremdgewerk", filters={"partnerbetrieb": self.lieferant, "vertrag_direkt_kunde": 0, "status": ("not in", ("Abgesagt", "Offen"))}, fields=["name", "projekt", "kosten_cent"], order_by="creation desc", limit=20):
                if g.projekt and not frappe.db.exists("PH Eingangsrechnung Zuordnung", {"bezug_doctype": "PH Fremdgewerk", "bezug_name": g.name}):
                    kandidaten.append({"projekt": g.projekt, "kostenart": "Fremdgewerk", "betrag_cent": cint(g.kosten_cent) or 1, "bezug_doctype": "PH Fremdgewerk", "bezug_name": g.name})
        if not kandidaten and self.projekt:
            kandidaten.append({"projekt": self.projekt, "kostenart": self.kostenart or "Sonstiges", "betrag_cent": netto})
        if not kandidaten:
            frappe.throw(_("Kein Vorschlag gefunden (keine Herstellerbestellung, kein Speditionsauftrag/Fremdgewerk dieses Lieferanten) – bitte manuell zuordnen."))
        zeilen = KZ.anteilig(netto, kandidaten)
        self.zuordnung_modus = "Ganz einem Projekt" if len(zeilen) == 1 else "Aliquot"
        if len(zeilen) == 1:
            self.projekt, self.kostenart = zeilen[0]["projekt"], zeilen[0]["kostenart"]
        self.set("zuordnung", [{**z, "vorschlag": 1} for z in zeilen])
        return self._zuordnung_liste()

    @frappe.whitelist()
    def zuordnung_umbuchen(self, modus, zeilen=None, grund=None, projekt=None, kostenart=None):
        """Nachträgliche Umbuchung (auch nach Freigabe/Zahlung): neue Zuordnung, Begründung Pflicht, Protokoll alt → neu."""
        self.check_permission("write")
        if not set(frappe.get_roles()) & (set(LEITUNG) | {"PH Projekte Leitung", "PH Backoffice-Admin"}):
            frappe.throw(_("Umbuchen nur durch Leitung."))
        if not (grund or "").strip():
            frappe.throw(_("Bitte den Grund der Umbuchung angeben."))
        alt = self._zuordnung_liste()
        alt_modus = self.zuordnung_modus
        zeilen = frappe.parse_json(zeilen) if isinstance(zeilen, str) else (zeilen or [])
        self.zuordnung_modus = modus
        if modus == "Ganz einem Projekt":
            self.projekt, self.kostenart = projekt or self.projekt, kostenart or self.kostenart
        else:
            self.set("zuordnung", [{k: z.get(k) for k in ("projekt", "kostenart", "prozent", "betrag_cent", "belegposition", "bezug_doctype", "bezug_name", "bemerkung")} for z in zeilen])
        self.flags.ph_umbuchung = True
        self.flags.ph_system = True  # Betragssperre (bezahlt) betrifft nur Beträge, nicht die Zuordnung
        self.save()
        text = KZ.unterschied(alt, self._zuordnung_liste())
        self.add_comment("Info", _("Kostenzuordnung umgebucht ({0} → {1}): {2}. Grund: {3}").format(alt_modus or "–", modus, text, grund))
        try:
            from ph_projekte.ph_projekte.nachkalkulation import protokoll

            for pr in {z.get("projekt") for z in alt + self._zuordnung_liste() if z.get("projekt")} or {None}:
                protokoll("Eingangsrechnung", self.doctype, self.name, "zuordnung", {"modus": alt_modus, "zeilen": alt}, {"modus": modus, "zeilen": self._zuordnung_liste()}, grund, projekt=pr)
        except Exception:  # noqa: BLE001
            frappe.log_error(title=f"PH Eingangsrechnung {self.name}: Umbuchungsprotokoll")
        if self.status in ("Freigegeben", "Bezahlt"):
            self.budget_hinweis_setzen()
        return text

    @frappe.whitelist()
    def regress_erfassen(self):
        """Button „Im Regress erfassen“ (Wiederholung, falls die Freigabe den Regress nicht erreichte)."""
        self.check_permission("write")
        if self.status not in ("Freigegeben", "Bezahlt"):
            frappe.throw(_("Erst freigeben."))
        from ph_faktura.ph_faktura.integration import regress_gutschrift_buchen

        return regress_gutschrift_buchen(self)

    @frappe.whitelist()
    def als_verrechnet_buchen(self, datum=None):
        """Lieferanten-Gutschrift: mit offener Lieferantenrechnung verrechnet bzw. Betrag erhalten → Status Bezahlt
        (Geldeingang selbst kommt über den Bankabgleich)."""
        self.check_permission("write")
        if self.belegart != "Gutschrift" or self.status != "Freigegeben":
            frappe.throw(_("Nur freigegebene Lieferanten-Gutschriften."))
        self.status_setzen("Bezahlt", bezahlt_am=datum or nowdate(), bezahlt_cent=cint(self.brutto_cent))
        journal.schreibe("Zahlung", self, -cint(self.brutto_cent), f"Gutschrift verrechnet {self.lieferant_name} {self.rechnungsnummer_lieferant}")
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
        if self.belegart == "Gutschrift":
            frappe.throw(_("Lieferanten-Gutschrift wird nicht bezahlt – „Als verrechnet buchen“."))
        betrag = cint(betrag_cent) or cint(self.zahlbetrag_cent) or cint(self.brutto_cent)
        name = zahlung.buche("Ausgang", kanal, betrag, "PH Eingangsrechnung", self.name, zeitpunkt=datum, zahlungsreferenz=self.zahlungsreferenz, notiz=f"{self.lieferant_name} {self.rechnungsnummer_lieferant}")
        zahlung.zahlung_auf_eingangsrechnung(self, betrag, datum, zahlung_name=name)
        return name


def zahllauf_vorschlag(stichtag=None):
    """Freigegebene Rechnungen, fällig bis Stichtag (oder Skonto nutzbar), sortiert nach Fälligkeit."""
    stichtag = stichtag or add_days(nowdate(), 7)
    rows = frappe.get_all("PH Eingangsrechnung", filters={"status": "Freigegeben", "belegart": ("!=", "Gutschrift")}, fields=["name", "lieferant_name", "rechnungsnummer_lieferant", "datum", "faellig", "skonto_bis", "skonto_cent", "brutto_cent", "zahlbetrag_cent", "iban_lieferant", "bic_lieferant", "zahlungsreferenz", "zahllauf", "projekt"], order_by="faellig asc")
    out = []
    for r in rows:
        skonto_nutzbar = bool(r.skonto_bis and str(r.skonto_bis) >= nowdate() and cint(r.skonto_cent))
        if str(r.faellig) <= str(stichtag) or skonto_nutzbar or r.zahllauf:
            r["skonto_nutzbar"] = skonto_nutzbar
            r["empfohlen_cent"] = cint(r.brutto_cent) - (cint(r.skonto_cent) if skonto_nutzbar else 0)
            r["grund"] = _("Skonto bis {0}").format(frappe.utils.formatdate(r.skonto_bis)) if skonto_nutzbar else _("fällig {0}").format(frappe.utils.formatdate(r.faellig))
            out.append(r)
    return out
