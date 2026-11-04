"""PH Export Lauf – Übergabe an den Steuerberater (BMD CSV / DATEV Buchungsstapel / CSV) mit Protokoll je Beleg.

Buchungszeilen: je Beleg und USt-Satz eine Zeile (Debitor an Erlöskonto je Satz; Eingangsrechnung:
Aufwand an Kreditor). Anzahlungsrechnungen laufen auf das Konto „Erhaltene Anzahlungen“; die
Schlussrechnung führt die verrechneten Anzahlungen als negative Zeilen auf dasselbe Konto zurück.
Exportierte Belege werden gesperrt (export_status = exportiert); eine spätere Gutschrift ist der
einzige Korrekturweg (export_status = korrigiert im Folgelauf).
"""

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import cint, getdate, now_datetime

from ph_faktura import einstellungen, journal
from ph_faktura.rechenwerk import export as E


class PHExportLauf(Document):
    def before_insert(self):
        self.status = "Entwurf"
        self.erstellt_von = frappe.session.user

    def validate(self):
        if getdate(self.zeitraum_von) > getdate(self.zeitraum_bis):
            frappe.throw(_("Zeitraum: „von“ liegt nach „bis“."))
        self.titel = f"{self.format} {frappe.utils.formatdate(self.zeitraum_von)}–{frappe.utils.formatdate(self.zeitraum_bis)}"[:140]

    # ── Zeilen sammeln ───────────────────────────────────────────────────────
    def zeilen_sammeln(self):
        e = einstellungen.faktura()
        zeilen = []
        konten = {2000: e.get("erloeskonto_20"), 1000: e.get("erloeskonto_10"), 1300: e.get("erloeskonto_13")}
        filt_export = {"export_status": "offen"} if self.nur_neue else {}
        if self.belegarten in ("Ausgangsrechnungen und Gutschriften", "Alle"):
            for r in frappe.get_all("PH Rechnung", filters={"docstatus": 1, "datum": ("between", [self.zeitraum_von, self.zeitraum_bis]), **filt_export}, fields=["name", "nummer", "art", "datum", "kunde_name", "kontakt", "ust_fall", "uid_empfaenger", "leistungsdatum", "status", "anzahlung_brutto_cent"]):
                debitor = debitor_nr(r.kontakt, e)
                for a in frappe.get_all("PH Beleg Steuer", filters={"parent": r.name, "parenttype": "PH Rechnung", "parentfield": "ust_aufteilung"}, fields=["ust_satz_promille", "netto_cent", "ust_cent", "brutto_cent"]):
                    konto = e.get("konto_anzahlungen_erhalten") if r.art == "Anzahlungsrechnung" else erloeskonto(r.ust_fall, a.ust_satz_promille, konten, e)
                    zeilen.append(_zeile("PH Rechnung", r, debitor, konto, a, "S", f"{r.art} {r.nummer} {r.kunde_name}", r.leistungsdatum, r.uid_empfaenger))
                for v in frappe.get_all("PH Rechnung Anzahlung", filters={"parent": r.name, "parenttype": "PH Rechnung"}, fields=["anzahlungsrechnung", "ust_satz_promille", "netto_cent", "ust_cent", "brutto_cent"]):
                    zeilen.append(_zeile("PH Rechnung", r, debitor, e.get("konto_anzahlungen_erhalten"), v, "H", f"Anzahlung {v.anzahlungsrechnung} verrechnet in {r.nummer}", r.leistungsdatum, r.uid_empfaenger))
            for g in frappe.get_all("PH Gutschrift", filters={"docstatus": 1, "datum": ("between", [self.zeitraum_von, self.zeitraum_bis]), **filt_export}, fields=["name", "nummer", "art", "datum", "kunde_name", "kontakt", "ust_fall", "uid_empfaenger", "rechnung"]):
                debitor = debitor_nr(g.kontakt, e)
                for a in frappe.get_all("PH Beleg Steuer", filters={"parent": g.name, "parenttype": "PH Gutschrift", "parentfield": "ust_aufteilung"}, fields=["ust_satz_promille", "netto_cent", "ust_cent", "brutto_cent"]):
                    zeilen.append(_zeile("PH Gutschrift", g, debitor, erloeskonto(g.ust_fall, a.ust_satz_promille, konten, e), a, "H", f"Gutschrift {g.nummer} zu {g.rechnung} {g.kunde_name}", None, g.uid_empfaenger))
        if self.belegarten in ("Eingangsrechnungen", "Alle"):
            for er in frappe.get_all("PH Eingangsrechnung", filters={"status": ("in", ("Freigegeben", "Bezahlt")), "datum": ("between", [self.zeitraum_von, self.zeitraum_bis]), **filt_export}, fields=["name", "rechnungsnummer_lieferant", "datum", "lieferant", "lieferant_name", "netto_cent", "ust_cent", "brutto_cent", "ust_fall", "uid_lieferant", "konto_aufwand", "leistungsdatum"]):
                satz = 2000 if er.ust_fall in ("Vorsteuer AT", "Reverse Charge EU", "Innergemeinschaftlicher Erwerb") and cint(er.netto_cent) else 0
                if er.ust_fall == "Vorsteuer AT" and cint(er.netto_cent) and cint(er.ust_cent):
                    satz = round(cint(er.ust_cent) * 10000 / cint(er.netto_cent) / 100) * 100
                a = frappe._dict(ust_satz_promille=satz, netto_cent=er.netto_cent, ust_cent=er.ust_cent, brutto_cent=er.brutto_cent)
                z = _zeile("PH Eingangsrechnung", frappe._dict(name=er.name, nummer=er.rechnungsnummer_lieferant, datum=er.datum, kunde_name=er.lieferant_name), kreditor_nr(er.lieferant, e), er.konto_aufwand, a, "H", f"ER {er.lieferant_name} {er.rechnungsnummer_lieferant}", er.leistungsdatum, er.uid_lieferant)
                z["steuercode"] = {"Reverse Charge EU": "RC", "Innergemeinschaftlicher Erwerb": "IGE", "Einfuhr Drittland": "EUST", "Keine Vorsteuer": "0"}.get(er.ust_fall)
                z["extbelegnr"] = er.rechnungsnummer_lieferant
                zeilen.append(z)
        return zeilen

    @frappe.whitelist()
    def erzeugen(self):
        """Button „Erzeugen“: Datei + Übergabeprotokoll bauen, Belege sperren."""
        self.check_permission("write")
        if self.status in ("Uebergeben", "Bestaetigt"):
            frappe.throw(_("Übergebene Läufe werden nicht neu erzeugt – neuen Lauf anlegen."))
        zeilen = self.zeilen_sammeln()
        if not zeilen:
            frappe.throw(_("Keine Belege im Zeitraum (oder alle bereits übergeben)."))
        e = einstellungen.faktura()
        if self.format == "DATEV Buchungsstapel":
            wj = getdate(f"{getdate(self.zeitraum_von).year}-{(e.get('wirtschaftsjahr_beginn') or '0101')[:2]}-{(e.get('wirtschaftsjahr_beginn') or '0101')[2:4]}")
            text, ps = E.datev_buchungsstapel(zeilen, e.get("berater_nr"), e.get("mandanten_nr"), getdate(self.zeitraum_von), getdate(self.zeitraum_bis), wj, e.get("sachkontenlaenge") or 4)
            endung = "csv"
        elif self.format == "BMD CSV":
            text, ps = E.bmd_csv(zeilen)
            endung = "csv"
        else:
            text, ps = E.csv_generisch(zeilen)
            endung = "csv"
        protokoll_text, protokoll = E.protokoll_csv(zeilen)
        datei = self._datei(f"{self.name}_{self.format.replace(' ', '_')}.{endung}", text)
        datei_protokoll = self._datei(f"{self.name}_Uebergabeprotokoll.csv", protokoll_text)
        self.set("belege", [])
        for p in protokoll:
            z = next(z for z in zeilen if z["beleg"] == p["beleg"])
            self.append("belege", {"beleg_doctype": p["beleg_doctype"], "beleg": p["beleg"], "nummer": p["nummer"], "datum": p["datum"], "kontakt_name": p["kontakt_name"], "konto": z["konto"], "gegenkonto": z["gegenkonto"],
                                   "steuercode": z.get("steuercode"), "netto_cent": p["netto_cent"], "ust_cent": p["ust_cent"], "brutto_cent": p["brutto_cent"], "status": "uebergeben", "pruefsumme": p["pruefsumme"]})
        self.anzahl = len(protokoll)
        self.summe_brutto_cent = sum(p["brutto_cent"] * (-1 if p["beleg_doctype"] == "PH Gutschrift" else 1) for p in protokoll)
        self.pruefsumme_gesamt = ps
        self.datei = datei
        self.datei_protokoll = datei_protokoll
        self.erzeugt_am = now_datetime()
        self.status = "Erzeugt"
        self.save()
        for p in protokoll:
            frappe.db.set_value(p["beleg_doctype"], p["beleg"], {"export_status": "exportiert", "export_lauf": self.name}, update_modified=False)
        journal.schreibe("Export", self, self.summe_brutto_cent, f"{self.format}: {self.anzahl} Belege, Prüfsumme {ps[:16]}")
        return {"anzahl": self.anzahl, "datei": self.datei}

    def _datei(self, name, text):
        f = frappe.get_doc({"doctype": "File", "file_name": name, "attached_to_doctype": self.doctype, "attached_to_name": self.name, "is_private": 1, "content": text.encode("utf-8-sig")})
        f.flags.ignore_permissions = True
        f.insert(ignore_permissions=True)
        return f.file_url

    @frappe.whitelist()
    def als_uebergeben(self, an=None):
        self.check_permission("write")
        if self.status != "Erzeugt":
            frappe.throw(_("Zuerst erzeugen."))
        self.db_set({"status": "Uebergeben", "uebergeben_am": now_datetime(), "uebergeben_an": an or self.uebergeben_an}, update_modified=True)
        return True

    @frappe.whitelist()
    def bestaetigen(self, datum=None):
        self.check_permission("write")
        self.db_set({"status": "Bestaetigt", "bestaetigt_von_kanzlei_am": datum or frappe.utils.nowdate()}, update_modified=True)
        return True

    @frappe.whitelist()
    def verwerfen(self):
        """Lauf im Status Erzeugt zurücknehmen: Belege wieder freigeben (nur vor Übergabe)."""
        self.check_permission("delete")
        if self.status != "Erzeugt":
            frappe.throw(_("Nur erzeugte, nicht übergebene Läufe können verworfen werden."))
        for b in self.belege:
            frappe.db.set_value(b.beleg_doctype, b.beleg, {"export_status": "offen", "export_lauf": None}, update_modified=False)
        self.db_set({"status": "Entwurf", "anzahl": 0, "pruefsumme_gesamt": None}, update_modified=True)
        self.set("belege", [])
        self.save()
        return True

    def on_trash(self):
        if self.status in ("Uebergeben", "Bestaetigt"):
            frappe.throw(_("Übergebene Export-Läufe können nicht gelöscht werden."))
        for b in self.belege:
            frappe.db.set_value(b.beleg_doctype, b.beleg, {"export_status": "offen", "export_lauf": None}, update_modified=False)


def _zeile(dt, r, konto, gegenkonto, a, sh, text, leistungsdatum, uid):
    return {"beleg_doctype": dt, "beleg": r.name, "nummer": r.get("nummer") or r.name, "datum": getdate(r.datum), "kontakt_name": r.get("kunde_name"), "konto": konto, "gegenkonto": gegenkonto,
            "steuercode": None, "satz_promille": cint(a.ust_satz_promille), "netto_cent": cint(a.netto_cent), "ust_cent": cint(a.ust_cent), "brutto_cent": cint(a.brutto_cent), "soll_haben": sh,
            "text": text, "leistungsdatum": getdate(leistungsdatum) if leistungsdatum else None, "uid": uid or ""}


def erloeskonto(ust_fall, satz, konten, e):
    return {"OSS": e.get("erloeskonto_oss"), "Innergemeinschaftlich steuerfrei": e.get("erloeskonto_ig"), "Reverse Charge": e.get("erloeskonto_rc"), "Ausfuhr": e.get("erloeskonto_ausfuhr")}.get(ust_fall) or konten.get(cint(satz)) or e.get("erloeskonto_20")


def debitor_nr(kontakt, e):
    """Debitorenkonto je Kontakt: Custom Field ph_faktura_debitor_nr (ph_crm PH Kontakt), sonst Sammeldebitor."""
    if not kontakt or not frappe.db.exists("DocType", "PH Kontakt") or not frappe.get_meta("PH Kontakt").has_field("ph_faktura_debitor_nr"):
        return str(e.get("debitoren_ab") or 200000)
    nr = frappe.db.get_value("PH Kontakt", kontakt, "ph_faktura_debitor_nr")
    if not nr:
        maximum = frappe.db.sql("select max(cast(ph_faktura_debitor_nr as unsigned)) from `tabPH Kontakt` where ph_faktura_debitor_nr regexp '^[0-9]+$'")[0][0]
        nr = str(max(cint(maximum) + 1, cint(e.get("debitoren_ab") or 200000)))
        frappe.db.set_value("PH Kontakt", kontakt, "ph_faktura_debitor_nr", nr, update_modified=False)
    return nr


def kreditor_nr(lieferant, e):
    if not lieferant or not frappe.db.exists("DocType", "PH Lieferant") or not frappe.get_meta("PH Lieferant").has_field("ph_faktura_kreditor_nr"):
        return str(e.get("kreditoren_ab") or 330000)
    nr = frappe.db.get_value("PH Lieferant", lieferant, "ph_faktura_kreditor_nr")
    if not nr:
        maximum = frappe.db.sql("select max(cast(ph_faktura_kreditor_nr as unsigned)) from `tabPH Lieferant` where ph_faktura_kreditor_nr regexp '^[0-9]+$'")[0][0]
        nr = str(max(cint(maximum) + 1, cint(e.get("kreditoren_ab") or 330000)))
        frappe.db.set_value("PH Lieferant", lieferant, "ph_faktura_kreditor_nr", nr, update_modified=False)
    return nr
