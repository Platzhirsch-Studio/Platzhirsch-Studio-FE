"""PH Gutschrift – Storno/Teilgutschrift/Wertminderung/Kulanz mit Bezug auf eine gestellte Rechnung."""

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.model.naming import make_autoname
from frappe.utils import cint, getdate, now_datetime

from ph_faktura import journal, versand, zahlung
from ph_faktura.beleg import BelegMixin
from ph_faktura.rechenwerk import steuer as S


class PHGutschrift(BelegMixin, Document):
    def onload(self):
        self.set_onload("kontakt_email", self.kontakt_email())

    def before_insert(self):
        self.status = "Entwurf"

    def validate(self):
        if getattr(self, "_action", None) == "update_after_submit":
            return
        re = frappe.get_doc("PH Rechnung", self.rechnung)
        if re.docstatus != 1:
            frappe.throw(_("Gutschrift nur zu gestellten Rechnungen."))
        if re.status == "Storniert" and re.storno_durch != self.name:
            frappe.throw(_("Rechnung {0} ist bereits storniert ({1}).").format(re.name, re.storno_durch))
        if self.art == "Storno" and frappe.db.exists("PH Gutschrift", {"rechnung": self.rechnung, "art": "Storno", "docstatus": 1, "name": ("!=", self.name)}):
            frappe.throw(_("Zu {0} existiert bereits eine Storno-Gutschrift.").format(self.rechnung))
        for f in ("kontakt", "kunde_name", "firma", "strasse", "plz", "ort", "land", "uid_empfaenger", "auftrag", "sprache", "waehrung"):
            self.set(f, re.get(f))
        if self.art == "Storno" or not self.positionen:
            self.storno_positionen(re)
        self.positionen_pruefen()
        # USt-Fall der Ursprungsrechnung übernehmen (keine Neubestimmung)
        self.ust_fall = re.ust_fall
        self.ust_hinweistext = re.ust_hinweistext
        self.positionen_berechnen()
        if self.art != "Storno" and cint(self.brutto_cent) > cint(re.zahlbar_cent):
            frappe.throw(_("Gutschrift ({0}) übersteigt den Rechnungsbetrag ({1}).").format(self.brutto_cent, re.zahlbar_cent))
        if cint(self.brutto_cent) <= 0:
            frappe.throw(_("Gutschrift ohne Betrag."))
        self.titel = f"{_(self.art)} zu {self.rechnung}: {self.kunde_name}"[:140]

    def storno_positionen(self, re):
        """Alle Positionen der Rechnung; verrechnete Anzahlungen als Gegenposition, damit die
        Gutschrift den zahlbaren Betrag (Rest) ausgleicht."""
        self.set("positionen", [])
        for p in re.positionen:
            if p.art in ("Text", "Zwischensumme"):
                continue
            self.append("positionen", {"art": p.art, "produkt": p.produkt, "bezeichnung": p.bezeichnung, "marke": p.marke, "ausfuehrung_text": p.ausfuehrung_text, "menge": p.menge, "einheit": p.einheit,
                                       "einzel_netto_cent": p.einzel_netto_cent, "rabatt_promille": p.rabatt_promille, "ust_satz_promille": p.ust_satz_promille, "ab_position": p.ab_position})
        for a in re.anzahlungen_verrechnet:
            self.append("positionen", {"art": "Rabatt", "bezeichnung": _("Verrechnete Anzahlung {0} ({1})").format(a.anzahlungsrechnung, S.satz_prozent_text(a.ust_satz_promille)), "menge": 1, "einheit": "Pausch",
                                       "einzel_netto_cent": -cint(a.netto_cent), "ust_satz_promille": a.ust_satz_promille})

    def before_submit(self):
        if self.name.startswith("ENTW-"):
            neu = make_autoname(self.naming_series)
            frappe.rename_doc(self.doctype, self.name, neu, force=True, show_alert=False, rebuild_search=False)
            self.name = neu
            for ch in self.get_all_children():
                ch.parent = neu
        self.nummer = self.name
        self.status = "Gestellt"
        self.gestellt_am = now_datetime()
        self.uva_monat = getdate(self.datum).strftime("%Y-%m")
        self.titel = f"{_(self.art)} {self.nummer} zu {self.rechnung}: {self.kunde_name}"[:140]

    def on_submit(self):
        re = frappe.get_doc("PH Rechnung", self.rechnung)
        journal.schreibe("Gutschrift", self, -cint(self.brutto_cent), f"{self.art} zu {self.rechnung}")
        if self.art == "Storno":
            re.db_set({"status": "Storniert", "workflow_state": "PH Storniert", "storno_durch": self.name, "storniert_am": now_datetime(), "offen_cent": 0}, update_modified=True)
            journal.schreibe("Storniert", re, -cint(re.zahlbar_cent), f"Storno durch {self.name}")
            if re.art == "Anzahlungsrechnung" and re.anzahlungsplan_zeile and frappe.db.exists("PH Zahlungsplan", re.anzahlungsplan_zeile):
                frappe.db.set_value("PH Zahlungsplan", re.anzahlungsplan_zeile, {"rechnung": None, "status": "Offen", "bezahlt_cent": 0}, update_modified=False)
            if re.auftrag:
                ab = frappe.get_doc("PH Auftragsbestaetigung", re.auftrag)
                for p in re.positionen:
                    if p.ab_position and re.art in ("Teilrechnung", "Schlussrechnung", "Rechnung"):
                        frappe.db.sql("update `tabPH Beleg Position` set rechnung_menge = greatest(ifnull(rechnung_menge, 0) - %s, 0) where name = %s", (p.menge, p.ab_position))
                for z in ab.zahlungsplan:
                    if z.rechnung == re.name:
                        frappe.db.set_value("PH Zahlungsplan", z.name, {"rechnung": None, "status": "Offen", "bezahlt_cent": 0}, update_modified=False)
                ab.reload()
                if ab.status == "Abgerechnet":
                    ab.status_setzen("Geliefert")
                ab.stand_aktualisieren(speichern=True)
            if cint(re.bezahlt_cent) > 0 and self.erstattung_art == "Keine (Kulanz ohne Zahlung)":
                frappe.msgprint(_("Rechnung war mit {0} Cent bezahlt – Rückzahlung oder Verrechnung erforderlich.").format(re.bezahlt_cent), indicator="orange")
        elif self.erstattung_art == "Verrechnung mit offener Rechnung" and cint(re.offen_cent) > 0:
            betrag = min(cint(self.brutto_cent), cint(re.offen_cent))
            zahlung.zahlung_auf_rechnung(re, betrag, "Verrechnung", self.datum, zahlung_name=None, hinweis=_("Gutschrift {0}").format(self.name))
            self.db_set({"status": "Verrechnet", "erstattet_cent": betrag}, update_modified=False)
        if not frappe.flags.in_test:
            versand.pdf_fixieren(self)

    def before_cancel(self):
        frappe.throw(_("Gebuchte Gutschriften werden nicht storniert."))

    def on_trash(self):
        if self.docstatus == 1 or self.nummer:
            frappe.throw(_("Gestellte Gutschriften können nicht gelöscht werden."))

    @frappe.whitelist()
    def stellen(self):
        self.check_permission("submit")
        if self.docstatus != 0:
            frappe.throw(_("Bereits gestellt."))
        self.save()
        self.submit()
        return self.name

    @frappe.whitelist()
    def erstatten(self, kanal="Ueberweisung", datum=None, betrag_cent=None):
        """Button „Erstatten“: Rückzahlung als PH Zahlung (Art Erstattung) buchen."""
        self.check_permission("write")
        if self.docstatus != 1:
            frappe.throw(_("Zuerst stellen."))
        betrag = cint(betrag_cent) or (cint(self.brutto_cent) - cint(self.erstattet_cent))
        if betrag <= 0:
            frappe.throw(_("Nichts zu erstatten."))
        name = zahlung.buche("Erstattung", kanal, betrag, "PH Gutschrift", self.name, zeitpunkt=datum, kontakt=self.kontakt, zahlungsreferenz=self.nummer, notiz=self.grund)
        self.db_set({"erstattung": name, "erstattet_cent": cint(self.erstattet_cent) + betrag, "status": "Erstattet"}, update_modified=True)
        journal.schreibe("Zahlung", self, -betrag, f"Erstattung {name} über {kanal}")
        return name

    @frappe.whitelist()
    def als_gesendet_markieren(self, kanal="Post"):
        """Versand außerhalb des Systems (Post, persönlich, Portal) dokumentieren (Konzept 10-faktura §12 Nr. 5)."""
        self.check_permission("write")
        self.db_set({"gesendet_am": now_datetime(), "versandkanal": kanal})
        self.add_comment("Info", _("Als gesendet markiert ({0})").format(kanal))
        return True

    @frappe.whitelist()
    def senden(self, empfaenger, betreff=None, nachricht=None):
        self.check_permission("email")
        if self.docstatus != 1:
            frappe.throw(_("Bitte zuerst stellen."))
        return versand.senden(self, empfaenger, betreff, nachricht)
