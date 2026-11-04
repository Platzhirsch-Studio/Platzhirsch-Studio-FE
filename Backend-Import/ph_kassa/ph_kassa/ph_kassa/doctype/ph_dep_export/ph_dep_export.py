"""PH DEP Export – DEP7-Datei erzeugen, anhängen, archivieren (WP10a).

    exportiere(kasse, von, bis, art) → PH DEP Export (Datei privat, Kopie unter private/files/dep/)
"""

import os

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import add_days, get_datetime, getdate, now_datetime

from ph_kassa.rksv import dep as dep_modul
from ph_kassa.rksv.see import zertifikat_b64_fuer_dep

UNVERAENDERLICH = ("kasse", "art", "zeitraum_von", "zeitraum_bis", "anzahl_belege", "datei", "pruefsumme_sha256", "erste_belegnummer", "letzte_belegnummer")


class PHDEPExport(Document):
    def validate(self):
        if getdate(self.zeitraum_von) > getdate(self.zeitraum_bis):
            frappe.throw(_("Zeitraum von liegt nach bis."))
        self.titel = f"DEP7 {self.kasse} {self.zeitraum_von} – {self.zeitraum_bis} ({self.anzahl_belege or 0} Belege)"
        if not self.is_new():
            alt = self.get_doc_before_save()
            if alt and any(str(alt.get(f) or "") != str(self.get(f) or "") for f in UNVERAENDERLICH):
                frappe.throw(_("DEP-Export ist unveränderlich – neuen Export erstellen."))

    def on_trash(self):
        if self.archiviert and not frappe.flags.in_test:
            frappe.throw(_("Archivierte DEP-Exporte können nicht gelöscht werden (7 Jahre Aufbewahrung)."))

    @frappe.whitelist()
    def pruefsumme_pruefen(self):
        """Vergleicht die angehängte Datei mit der gespeicherten Prüfsumme."""
        self.check_permission("read")
        if not self.datei:
            frappe.throw(_("Keine Datei angehängt."))
        inhalt = frappe.get_doc("File", {"file_url": self.datei}).get_content()
        ist = dep_modul.pruefsumme(inhalt)
        return {"ok": ist == self.pruefsumme_sha256, "gespeichert": self.pruefsumme_sha256, "datei": ist}


def exportiere(kasse, von=None, bis=None, art="Zeitraum", erstellt_von=None):
    """DEP7-Export für eine Kasse. von/bis = Datum (inkl.); Vollstaendig = alle Belege."""
    kasse_doc = frappe.get_doc("PH Kasse", kasse)
    if art == "Vollstaendig" or not von:
        erster = frappe.db.get_value("PH Kassenbeleg", {"kasse": kasse, "docstatus": 1}, "min(datum_uhrzeit)")
        von = getdate(erster) if erster else getdate()
    if art == "Vollstaendig" or not bis:
        bis = getdate()
    von, bis = getdate(von), getdate(bis)
    belege = frappe.get_all(
        "PH Kassenbeleg",
        {"kasse": kasse, "docstatus": 1, "datum_uhrzeit": ("between", [str(von), str(add_days(bis, 1))])},
        ["name", "belegnummer", "jws_compact", "zertifikat_seriennummer", "datum_uhrzeit"],
        order_by="belegnummer asc",
    )
    belege = [b for b in belege if get_datetime(b.datum_uhrzeit).date() <= bis]
    if not belege:
        frappe.throw(_("Keine Belege im Zeitraum {0} – {1}.").format(von, bis))

    zert_b64, kette = zertifikat_b64_fuer_dep(kasse_doc.see) if kasse_doc.see else ("", [])
    if not zert_b64:
        frappe.throw(_("SEE-Zertifikat fehlt – in PH Signatureinheit „Zertifikat abrufen“, sonst ist der DEP-Export unvollständig."))
    struktur = dep_modul.baue([{"jws": b.jws_compact} for b in belege], zert_b64, kette)
    fehler = dep_modul.pruefe_struktur(struktur)
    text = dep_modul.als_json(struktur)
    summe = dep_modul.pruefsumme(text)
    dateiname = dep_modul.dateiname(kasse_doc.kassen_id, von, bis)

    doc = frappe.get_doc(
        {
            "doctype": "PH DEP Export",
            "kasse": kasse,
            "art": art,
            "zeitraum_von": von,
            "zeitraum_bis": bis,
            "anzahl_belege": len(belege),
            "erste_belegnummer": belege[0].belegnummer,
            "letzte_belegnummer": belege[-1].belegnummer,
            "erster_beleg": belege[0].name,
            "letzter_beleg": belege[-1].name,
            "dateiname": dateiname,
            "pruefsumme_sha256": summe,
            "pruefung_struktur": _("OK") if not fehler else "\n".join(fehler),
            "erstellt_von": erstellt_von or frappe.session.user,
            "erstellt_am": now_datetime(),
        }
    ).insert()

    datei = frappe.get_doc(
        {"doctype": "File", "file_name": dateiname, "attached_to_doctype": "PH DEP Export", "attached_to_name": doc.name, "attached_to_field": "datei", "is_private": 1, "content": text}
    ).insert(ignore_permissions=True)
    archiv_pfad = None
    try:
        ordner = frappe.get_site_path("private", "files", "dep")
        os.makedirs(ordner, exist_ok=True)
        archiv_pfad = os.path.join(ordner, f"{doc.name}_{dateiname}")
        with open(archiv_pfad, "w", encoding="utf-8") as f:
            f.write(text)
    except OSError:
        frappe.log_error(title="PH DEP Export: Archivkopie nicht geschrieben")
    doc.db_set({"datei": datei.file_url, "archiviert": 1 if archiv_pfad else 0, "archiv_pfad": archiv_pfad, "status": "Archiviert" if archiv_pfad else "Erstellt"}, update_modified=False)

    for b in belege:
        frappe.db.set_value("PH Kassenbeleg", b.name, {"dep_exportiert": 1, "dep_export": doc.name}, update_modified=False)
    frappe.db.set_value("PH Kasse", kasse, "dep_export_letzter", now_datetime(), update_modified=False)
    return doc
