"""PH Inventurbewertung – festgeschriebene Bewertung des Lagerbestands zum Stichtag (Jahresabschluss).

Entwurf: „Berechnen“ (bewertung.berechnen) füllt Positionen, Summen, Methodenbeschreibung und den Buchungsvorschlag
Bestandsveränderung (Differenz zur letzten festgeschriebenen Bewertung gleichen Umfangs; Konten aus PH Logistik Einstellungen,
Platzhalter). „Festschreiben“ (Leitung/Geschäftsführung) friert den Stand ein; danach nur noch Export (ph_faktura PH Export Lauf,
Belegarten „Alle“) und Druck „PH Inventurbewertung“ mit Unterschriftszeilen. CSV-Export als privater Anhang.
"""

import csv
import io

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import cint, formatdate, now_datetime

from ph_logistik.ph_logistik import bewertung as B
from ph_logistik.ph_logistik import inventur_logik as IL

FREIGABE = {"PH Logistik Leitung", "PH Geschäftsführung", "PH Backoffice-Admin", "System Manager"}
GESPERRT_NACH_FEST = ("stichtag", "lagerort", "methode")


class PHInventurbewertung(Document):
    def before_insert(self):
        self.status = "Entwurf"
        self.export_status = "offen"
        self.erstellt_von = frappe.session.user
        if not self.methode:
            self.methode = frappe.db.get_single_value("PH Logistik Einstellungen", "bewertung_methode") or "Gleitender Durchschnitt"

    def validate(self):
        B.pruefen_rechte()
        self.titel = f"Inventurbewertung {formatdate(self.stichtag)} · {self.lagerort or _('alle Lagerorte')}"[:140]
        alt = self.get_doc_before_save()
        if alt and alt.status == "Festgeschrieben":
            if any(alt.get(f) != self.get(f) for f in GESPERRT_NACH_FEST) or len(alt.positionen) != len(self.positionen):
                frappe.throw(_("Festgeschriebene Bewertungen sind unveränderlich – neue Bewertung anlegen."))

    def on_trash(self):
        if self.status == "Festgeschrieben":
            frappe.throw(_("Festgeschriebene Bewertungen werden nicht gelöscht (Aufbewahrung 7 Jahre, BAO § 132)."))

    # ── Buttons ───────────────────────────────────────────────────────────
    @frappe.whitelist()
    def berechnen(self):
        self.check_permission("write")
        if self.status != "Entwurf":
            frappe.throw(_("Nur Entwürfe werden neu berechnet."))
        r = B.berechnen(self.stichtag, self.lagerort, self.methode)
        self.set("positionen", [])
        for z in r["zeilen"]:
            self.append("positionen", z)
        g = r["gesamt"]
        self.anzahl_positionen = len(r["zeilen"])
        self.menge_gesamt, self.wert_ak_cent, self.abwertung_cent, self.wert_cent = g["menge"], g["wert_ak_cent"], g["abwertung_cent"], g["wert_cent"]
        self.ohne_ek = r["ohne_ek"]
        self.methode_beschreibung = r["methode_beschreibung"]
        self.abwertung_regeln = B.staffel_text(r["staffel"])
        self.abwertung_platzhalter = r["platzhalter"]
        self.hinweise = "\n".join(r["hinweise"])
        self.berechnet_am = now_datetime()
        self._buchungsvorschlag()
        self.save()
        return {"positionen": self.anzahl_positionen, "wert_cent": self.wert_cent}

    def _buchungsvorschlag(self):
        e = frappe.get_single("PH Logistik Einstellungen")
        self.konto_bestand = e.get("konto_handelswaren") or "1600"
        self.konto_bestandsveraenderung = e.get("konto_bestandsveraenderung") or "5010"
        vorher = frappe.get_all("PH Inventurbewertung", {"status": "Festgeschrieben", "stichtag": ("<", self.stichtag), "lagerort": self.lagerort or ("is", "not set"), "name": ("!=", self.name or "")},
                                ["name", "wert_cent"], order_by="stichtag desc", limit=1)
        self.vorherige_bewertung = vorher[0].name if vorher else None
        self.wert_vorher_cent = cint(vorher[0].wert_cent) if vorher else 0
        self.bestandsveraenderung_cent = cint(self.wert_cent) - cint(self.wert_vorher_cent)
        betrag, richtung = IL.bestandsveraenderung(self.wert_cent, self.wert_vorher_cent)
        if not richtung:
            self.buchungsvorschlag = _("Keine Bestandsveränderung.")
            return
        soll, haben = (self.konto_bestand, self.konto_bestandsveraenderung) if richtung == "Erhoehung" else (self.konto_bestandsveraenderung, self.konto_bestand)
        text = _("Bestands{0} {1}: Soll {2} an Haben {3} (Vorschlag, Konten Platzhalter – Kanzlei bestätigt).").format(
            _("erhöhung") if richtung == "Erhoehung" else _("minderung"), B.euro(betrag), soll, haben)
        if not vorher:
            text += " " + _("Keine frühere festgeschriebene Bewertung – Anfangsbestand laut Eröffnungsbilanz prüfen.")
        self.buchungsvorschlag = text

    @frappe.whitelist()
    def festschreiben(self):
        self.check_permission("write")
        if not FREIGABE & set(frappe.get_roles()):
            frappe.throw(_("Nur Logistik-Leitung oder Geschäftsführung schreiben fest."), frappe.PermissionError)
        if self.status != "Entwurf":
            frappe.throw(_("Nur Entwürfe werden festgeschrieben."))
        if not self.berechnet_am:
            frappe.throw(_("Zuerst berechnen."))
        self.db_set({"status": "Festgeschrieben", "festgeschrieben_von": frappe.session.user, "festgeschrieben_am": now_datetime()}, notify=True)
        self.add_comment("Info", _("Festgeschrieben: Bilanzwert {0}").format(B.euro(self.wert_cent)))
        return self.status

    @frappe.whitelist()
    def verwerfen(self):
        self.check_permission("write")
        if self.status != "Entwurf":
            frappe.throw(_("Nur Entwürfe werden verworfen."))
        self.db_set("status", "Verworfen", notify=True)
        return self.status

    @frappe.whitelist()
    def csv_exportieren(self):
        """CSV (Semikolon, Dezimalkomma, UTF-8 mit BOM) als privater Anhang; Buchhaltung extern darf lesen/exportieren."""
        self.check_permission("read")
        B.pruefen_rechte()
        text = csv_text(self)
        datei = frappe.get_doc({"doctype": "File", "file_name": f"{self.name}_Inventurbewertung.csv", "attached_to_doctype": self.doctype, "attached_to_name": self.name,
                                "is_private": 1, "content": text.encode("utf-8-sig")})
        datei.insert(ignore_permissions=True)
        self.db_set("csv_datei", datei.file_url, update_modified=False)
        return datei.file_url


def _eur(cent):
    return f"{cint(cent) / 100:.2f}".replace(".", ",")


def csv_text(doc):
    buf = io.StringIO()
    w = csv.writer(buf, delimiter=";", lineterminator="\r\n")
    w.writerow(["Inventurbewertung", doc.name, "Stichtag", formatdate(doc.stichtag, "dd.MM.yyyy"), "Methode", doc.methode, "Status", doc.status])
    w.writerow(["Lagerort", "Platz", "Bestand", "Produkt", "Bezeichnung", "Ausfuehrung", "Marke", "Warengruppe", "Seriennummer", "Bewertungsart", "Menge",
                "Einstandspreis", "EK-Quelle", "Alter Monate", "Abwertung %", "Nettoerloes", "Einzelwert", "Wert AK", "Abwertung", "Bilanzwert", "Hinweis"])
    for p in doc.positionen:
        w.writerow([p.lagerort, p.platz or "", p.lagerbestand, p.produkt, p.produkt_name, p.ausfuehrung or "", p.marke or "", p.warengruppe or "", p.seriennummer or "", p.bewertungsart,
                    p.menge, _eur(p.einstandspreis_cent), p.ek_quelle, p.alter_monate, f"{cint(p.abwertung_promille) / 10:g}".replace(".", ","),
                    _eur(p.nettoerloes_cent) if p.nettoerloes_cent is not None else "", _eur(p.einzelwert_cent), _eur(p.wert_ak_cent), _eur(p.abwertung_cent), _eur(p.wert_cent), p.hinweis or ""])
    w.writerow([])
    w.writerow(["Summe", "", "", "", "", "", "", "", "", "", doc.menge_gesamt, "", "", "", "", "", "", _eur(doc.wert_ak_cent), _eur(doc.abwertung_cent), _eur(doc.wert_cent), ""])
    for schluessel, titel in (("lagerort", "Lagerort"), ("warengruppe", "Warengruppe"), ("marke", "Marke")):
        w.writerow([])
        w.writerow([f"Summe je {titel}", "Positionen", "Menge", "Wert AK", "Abwertung", "Bilanzwert"])
        for s in IL.summen([p.as_dict() for p in doc.positionen], schluessel):
            w.writerow([s["gruppe"], s["positionen"], s["menge"], _eur(s["wert_ak_cent"]), _eur(s["abwertung_cent"]), _eur(s["wert_cent"])])
    w.writerow([])
    w.writerow(["Buchungsvorschlag", doc.buchungsvorschlag or ""])
    return buf.getvalue()


def summen_je(doc, schluessel):
    """Jinja-Helfer für das Druckformat (Summen je Lagerort/Warengruppe/Marke)."""
    return IL.summen([p.as_dict() for p in doc.positionen], schluessel)
