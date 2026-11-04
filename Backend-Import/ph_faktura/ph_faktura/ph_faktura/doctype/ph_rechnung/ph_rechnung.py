"""PH Rechnung – Anzahlungs-, Teil-, Schluss-, Einzel- und Barverkaufsrechnung.

Grundsätze (PLAN.md WP6): submittable; Entwürfe heißen ENTW-JJJJ-#####, die lückenlose Nummer
RE-JJJJ-##### wird erst beim Stellen vergeben (before_submit, Nummernkreis in derselben Transaktion –
schlägt das Stellen fehl, wird kein Zähler verbraucht). Kein Cancel/Amend: Storno nur per PH Gutschrift.
"""

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.model.naming import make_autoname
from frappe.utils import add_days, cint, getdate, now_datetime, nowdate

from ph_faktura import einstellungen, journal, versand, zahlung
from ph_faktura.beleg import BelegMixin
from ph_faktura.rechenwerk import anzahlung as A
from ph_faktura.rechenwerk import steuer as S

OFFEN = ("Gestellt", "Teilbezahlt", "Ueberfaellig", "Gemahnt")
LEISTUNGSARTEN = ("Rechnung", "Teilrechnung", "Schlussrechnung", "Barverkauf")


class PHRechnung(BelegMixin, Document):
    def onload(self):
        self.set_onload("kontakt_email", self.kontakt_email())
        if self.auftrag and self.docstatus == 0 and self.art in ("Teilrechnung", "Schlussrechnung"):
            self.set_onload("offene_anzahlungen", frappe.get_doc("PH Auftragsbestaetigung", self.auftrag).offene_anzahlungen(ausser=self.name))

    def before_insert(self):
        self.status = "Entwurf"
        self.workflow_state = "PH Entwurf"

    def validate(self):
        if getattr(self, "_action", None) == "update_after_submit":
            # Nachträgliche Speicherungen (Zahlung, Export) ändern nur allow_on_submit-Felder.
            self.titel = self.titel_bilden()
            return
        e = einstellungen.faktura()
        self.kontakt_uebernehmen()
        self.produkt_uebernehmen()
        self.positionen_pruefen()
        self.steuerfall_setzen()
        self.positionen_berechnen()
        if not self.zahlungsziel_tage:
            self.zahlungsziel_tage = e["zahlungsziel_tage"]
        if not self.faellig:
            self.faellig = add_days(self.datum, cint(self.zahlungsziel_tage))
        if self.art == "Anzahlungsrechnung":
            self.ust_faelligkeit = "nicht faellig"
            self.ust_faellig_am = None
            self.uva_monat = None
            if not (self.leistungszeitraum_von or self.leistungsdatum):
                self.leistungszeitraum_von = self.datum
        else:
            if not self.leistungsdatum and not (self.leistungszeitraum_von and self.leistungszeitraum_bis):
                self.leistungsdatum = self.datum
            self.ust_faelligkeit = "faellig"
            self.ust_faellig_am = self.datum
            self.uva_monat = getdate(self.datum).strftime("%Y-%m")
        if self.art in ("Teilrechnung", "Schlussrechnung") and not self.auftrag:
            frappe.throw(_("Teil-/Schlussrechnung braucht eine Auftragsbestätigung."))
        if self.art not in ("Teilrechnung", "Schlussrechnung"):
            self.set("anzahlungen_verrechnet", [])
        self.anzahlungen_summieren()
        if not self.schluss and self.art != "Anzahlungsrechnung":
            self.schluss = e.get("rechnung_schluss")
        self.titel = self.titel_bilden()

    def titel_bilden(self):
        return f"{_(self.art)} {self.nummer or self.name}: {self.kunde_name or self.kontakt}"[:140]

    # ── Anzahlungen ──────────────────────────────────────────────────────────
    def anzahlungen_summieren(self):
        self.anzahlung_netto_cent = sum(cint(a.netto_cent) for a in self.anzahlungen_verrechnet)
        self.anzahlung_ust_cent = sum(cint(a.ust_cent) for a in self.anzahlungen_verrechnet)
        self.anzahlung_brutto_cent = sum(cint(a.brutto_cent) for a in self.anzahlungen_verrechnet)
        if self.anzahlung_brutto_cent > cint(self.brutto_cent):
            frappe.throw(_("Verrechnete Anzahlungen ({0}) übersteigen den Rechnungsbetrag ({1}) – Überhang per Gutschrift erstatten.").format(self.anzahlung_brutto_cent, self.brutto_cent))
        self.zahlbar_cent = cint(self.brutto_cent) - cint(self.anzahlung_brutto_cent)
        self.bezahlt_cent = sum(cint(z.betrag_cent) for z in self.zahlungen)
        self.offen_cent = self.zahlbar_cent - self.bezahlt_cent

    @frappe.whitelist()
    def anzahlungen_verrechnen(self, speichern=False):
        """Button „Anzahlungen verrechnen“ (Teil-/Schlussrechnung): offene Anzahlungen des Auftrags je
        USt-Satz abziehen – Schlussrechnung vollständig, Teilrechnung anteilig nach Wert."""
        if self.docstatus != 0:
            frappe.throw(_("Nur im Entwurf möglich."))
        if not self.auftrag or self.art not in ("Teilrechnung", "Schlussrechnung"):
            return 0
        ab = frappe.get_doc("PH Auftragsbestaetigung", self.auftrag)
        offen = ab.offene_anzahlungen(ausser=self.name)
        anteil = A.wertanteil(self.netto_cent, ab.netto_cent) if self.art == "Teilrechnung" else 1
        leistung = [{"ust_satz_promille": a.ust_satz_promille, "netto_cent": a.netto_cent, "ust_cent": a.ust_cent, "brutto_cent": a.brutto_cent} for a in self.ust_aufteilung]
        v = A.verrechnen(leistung, offen, anteil)
        self.set("anzahlungen_verrechnet", [])
        for z in v["verrechnet"]:
            self.append("anzahlungen_verrechnet", {"anzahlungsrechnung": z["anzahlungsrechnung"], "datum": z.get("datum"), "ust_satz_promille": z["ust_satz_promille"], "netto_cent": z["netto_cent"], "ust_cent": z["ust_cent"], "brutto_cent": z["brutto_cent"]})
        self.anzahlungen_summieren()
        if speichern:
            self.save()
        return len(v["verrechnet"])

    # ── Stellen (Submit) ─────────────────────────────────────────────────────
    def before_submit(self):
        self.pflichtangaben_pruefen()
        if self.export_status == "exportiert":
            frappe.throw(_("Beleg wurde bereits exportiert."))
        self.nummer_vergeben()
        self.status = "Gestellt"
        self.workflow_state = "PH Gestellt"
        self.gestellt_am = now_datetime()
        self.zahlungsreferenz = self.nummer
        self.bezahlt_cent = sum(cint(z.betrag_cent) for z in self.zahlungen)
        self.offen_cent = cint(self.zahlbar_cent) - cint(self.bezahlt_cent)
        if self.offen_cent <= 0:
            self.status = "Bezahlt"
            self.workflow_state = "PH Bezahlt"
            self.bezahlt_am = nowdate()
        self.titel = self.titel_bilden()

    def pflichtangaben_pruefen(self):
        if not [p for p in self.positionen if p.art not in ("Text", "Zwischensumme")]:
            frappe.throw(_("Rechnung ohne Positionen kann nicht gestellt werden."))
        firma = einstellungen.firma()
        e = einstellungen.faktura()
        fehlt = S.pflichtangaben_pruefen({
            "kunde_name": self.kunde_name, "strasse": self.strasse, "ort": self.ort, "datum": self.datum, "positionen": self.positionen,
            "leistungsdatum": self.leistungsdatum, "leistungszeitraum_von": self.leistungszeitraum_von, "leistungszeitraum_bis": self.leistungszeitraum_bis,
            "brutto_cent": self.brutto_cent, "uid_empfaenger": self.uid_empfaenger, "ust_fall": self.ust_fall, "ust_hinweistext": self.ust_hinweistext,
            "kleinbetrag": bool(self.kleinbetragsrechnung), "firma_uid": firma.get("uid"), "uid_grenze_cent": e["uid_pflicht_ab_cent"],
        })
        if fehlt:
            frappe.throw(_("Pflichtangaben nach § 11 UStG fehlen: {0}").format(", ".join(fehlt)))

    def nummer_vergeben(self):
        if self.name.startswith("ENTW-"):
            neu = make_autoname(self.naming_series)
            frappe.rename_doc(self.doctype, self.name, neu, force=True, show_alert=False, rebuild_search=False)
            self.name = neu
            for ch in self.get_all_children():
                ch.parent = neu
        self.nummer = self.name

    def on_submit(self):
        journal.schreibe("Gestellt", self, self.zahlbar_cent, f"{self.art}, brutto {self.brutto_cent}, Anzahlungen {self.anzahlung_brutto_cent}, USt-Fall {self.ust_fall}")
        if self.auftrag:
            self.auftrag_fortschreiben()
        if self.bestellung and frappe.db.exists("DocType", "PH Bestellung") and frappe.get_meta("PH Bestellung").has_field("ph_faktura_rechnung"):
            frappe.db.set_value("PH Bestellung", self.bestellung, "ph_faktura_rechnung", self.name, update_modified=False)
        if einstellungen.faktura().get("pdf_bei_stellen") and not frappe.flags.in_test:
            versand.pdf_fixieren(self)

    def auftrag_fortschreiben(self):
        ab = frappe.get_doc("PH Auftragsbestaetigung", self.auftrag)
        if self.art in ("Teilrechnung", "Schlussrechnung", "Rechnung"):
            for p in self.positionen:
                if p.ab_position:
                    frappe.db.sql("update `tabPH Beleg Position` set rechnung_menge = ifnull(rechnung_menge, 0) + %s where name = %s", (p.menge, p.ab_position))
            art_plan = "Teilzahlung" if self.art == "Teilrechnung" else "Schlusszahlung"
            zeile = next((z for z in ab.zahlungsplan if z.art == art_plan and not z.rechnung), None)
            if zeile:
                frappe.db.set_value("PH Zahlungsplan", zeile.name, {"rechnung": self.name, "status": "In Rechnung"}, update_modified=False)
        ab.reload()
        ab.stand_aktualisieren(speichern=True)

    def before_cancel(self):
        frappe.throw(_("Gebuchte Rechnungen werden nicht storniert, sondern per Gutschrift ausgeglichen (Button „Gutschrift“)."))

    def on_trash(self):
        if self.docstatus == 1 or self.nummer:
            frappe.throw(_("Gestellte Rechnungen können nicht gelöscht werden."))
        if self.anzahlungsplan_zeile and frappe.db.exists("PH Zahlungsplan", self.anzahlungsplan_zeile):
            frappe.db.set_value("PH Zahlungsplan", self.anzahlungsplan_zeile, {"rechnung": None, "status": "Offen"}, update_modified=False)

    # ── Buttons ──────────────────────────────────────────────────────────────
    @frappe.whitelist()
    def stellen(self):
        """Button „Rechnung stellen“: speichern, Nummer vergeben, buchen (submit). → neue Nummer"""
        self.check_permission("submit")
        if self.docstatus != 0:
            frappe.throw(_("Rechnung ist bereits gestellt."))
        self.save()
        self.submit()
        return self.name

    @frappe.whitelist()
    def zahlung_erfassen(self, betrag_cent, kanal="Ueberweisung", datum=None, hinweis=None):
        """Button „Zahlung erfassen“: PH Zahlung (ph_shop) buchen und der Rechnung zuordnen."""
        self.check_permission("write")
        if self.docstatus != 1:
            frappe.throw(_("Zahlungen nur auf gestellte Rechnungen."))
        betrag_cent = cint(betrag_cent)
        if betrag_cent <= 0:
            frappe.throw(_("Betrag muss größer 0 sein."))
        if betrag_cent > cint(self.offen_cent) + 1 and kanal != "Verrechnung":
            frappe.msgprint(_("Hinweis: Zahlung übersteigt den offenen Betrag – Überzahlung wird als Guthaben vermerkt."), indicator="orange")
        name = zahlung.buche("Eingang", kanal, betrag_cent, "PH Rechnung", self.name, zeitpunkt=datum, kontakt=self.kontakt, zahlungsreferenz=self.zahlungsreferenz, notiz=hinweis)
        zahlung.zahlung_auf_rechnung(self, betrag_cent, kanal, datum, zahlung_name=name, hinweis=hinweis)
        return name

    @frappe.whitelist()
    def gutschrift_erstellen(self, art="Storno", grund=None, erstattung_art=None):
        """Button „Gutschrift“/„Storno“: PH Gutschrift (Entwurf) mit Bezug auf diese Rechnung."""
        self.check_permission("write")
        if self.docstatus != 1:
            frappe.throw(_("Gutschrift nur zu gestellten Rechnungen."))
        if self.status == "Storniert":
            frappe.throw(_("Rechnung ist bereits storniert."))
        gu = frappe.new_doc("PH Gutschrift")
        gu.update({"rechnung": self.name, "art": art, "grund": grund or _("Storno von {0}").format(self.name), "datum": nowdate(), "erstattung_art": erstattung_art or ("Rückzahlung" if self.bezahlt_cent else "Verrechnung mit offener Rechnung")})
        gu.insert()
        return gu.name

    @frappe.whitelist()
    def mahnen(self, stufe=None):
        """Button „Mahnen“: nächste Mahnstufe als Entwurf anlegen."""
        self.check_permission("write")
        if self.docstatus != 1 or cint(self.offen_cent) <= 0:
            frappe.throw(_("Nur offene, gestellte Rechnungen können gemahnt werden."))
        if self.mahnsperre:
            frappe.throw(_("Mahnsperre gesetzt: {0}").format(self.mahnsperre_grund or ""))
        stufe = cint(stufe) or min(cint(self.mahnstufe) + 1, 3)
        ma = frappe.get_doc({"doctype": "PH Mahnung", "rechnung": self.name, "stufe": stufe, "datum": nowdate()}).insert()
        return ma.name

    @frappe.whitelist()
    def senden(self, empfaenger, betreff=None, nachricht=None):
        """Button „Als PDF senden“ (nur gestellte Rechnungen – Entwürfe tragen keine Nummer)."""
        self.check_permission("email")
        if self.docstatus != 1:
            frappe.throw(_("Bitte zuerst stellen – Entwürfe werden nicht versendet."))
        return versand.senden(self, empfaenger, betreff, nachricht)

    @frappe.whitelist()
    def zahlungslink(self):
        """Button „Zahlungslink senden“: PH Anzahlung (ph_shop) für Stripe-Link über den offenen Betrag."""
        self.check_permission("write")
        if not frappe.db.exists("DocType", "PH Anzahlung"):
            frappe.throw(_("DocType PH Anzahlung (ph_shop) ist noch nicht installiert."))
        if cint(self.offen_cent) <= 0:
            frappe.throw(_("Nichts offen."))
        az = frappe.get_doc({"doctype": "PH Anzahlung", "auftrag_referenz": self.name, "kontakt": self.kontakt, "kunde_email": self.kontakt_email(), "betrag_cent": self.offen_cent, "status": "offen", "erstellt_von": frappe.session.user}).insert()
        return az.name

    @frappe.whitelist()
    def uneinbringlich(self, grund):
        self.check_permission("cancel")
        if self.docstatus != 1 or cint(self.offen_cent) <= 0:
            frappe.throw(_("Nur offene Rechnungen."))
        self.db_set({"status": "Uneinbringlich", "workflow_state": "PH Uneinbringlich", "uneinbringlich_grund": grund})
        journal.schreibe("Korrektur", self, self.offen_cent, f"Uneinbringlich: {grund}")
        return True

    @frappe.whitelist()
    def pdf_neu_rendern(self):
        self.check_permission("write")
        if self.docstatus != 1:
            frappe.throw(_("PDF wird beim Stellen fixiert."))
        if self.gesendet_am or self.export_status == "exportiert":
            frappe.throw(_("PDF ist fixiert (gesendet/exportiert) und wird nicht neu gerendert."))
        return versand.pdf_fixieren(self)


def ueberfaellig_setzen(stichtag=None):
    """Scheduler: gestellte/teilbezahlte Rechnungen mit Fälligkeit < Stichtag → Ueberfaellig."""
    stichtag = getdate(stichtag or nowdate())
    n = 0
    for r in frappe.get_all("PH Rechnung", filters={"docstatus": 1, "status": ("in", ("Gestellt", "Teilbezahlt")), "faellig": ("<", stichtag), "offen_cent": (">", 0)}, pluck="name"):
        frappe.db.set_value("PH Rechnung", r, {"status": "Ueberfaellig", "workflow_state": "PH Ueberfaellig"}, update_modified=False)
        n += 1
    return n
