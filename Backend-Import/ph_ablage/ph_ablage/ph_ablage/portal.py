"""Kundenportal-Anbindung über ph_projekte (keine eigene Portal-Logik):

Freigeben legt bzw. aktualisiert ein **PH Projekt Dokument** (referenz_doctype = "PH Datei", referenz_name = Datei)
mit `kunde_sichtbar = 1` an. Das Portal (ph_projekte.api.portal_documents / portal_file) liest nur Frappe-Files,
die an PH Projekt Dokument hängen – deshalb erhält das Dokument eine private Kopie der freigegebenen Version
(höchstens 25 MB = ph_projekte MAX_DATEI_BYTES). Neue Version → PH Projekt Dokument.neue_version + Freigabe
(Versionierung von ph_projekte), Zurückziehen → PH Projekt Dokument.portal_freigeben(0).
Offene Anfrage an ph_projekte: Hook statt Kopie (portal_file liest dann direkt aus der Ablage).
"""

import frappe
from frappe import _
from frappe.utils import cint, now_datetime

from ph_ablage.ph_ablage import dienste
from ph_ablage.ph_ablage.doctype.ph_ablage_ereignis.ph_ablage_ereignis import protokoll
from ph_core.api import ApiFehler

MAX_PORTAL_BYTES = 25 * 1024 * 1024
KATEGORIEN = ("Plan", "Rendering", "Angebot", "Auftragsbestaetigung", "Rechnung", "Lieferschein", "Foto", "Protokoll", "Montagebericht", "Abnahmeprotokoll", "Produktpass", "Vertrag", "Sonstiges")
KATEGORIE_AUS_ENDUNG = {"pdf": "Sonstiges", "dwg": "Plan", "dxf": "Plan", "jpg": "Foto", "jpeg": "Foto", "png": "Foto", "heic": "Foto", "webp": "Foto"}


def verfuegbar():
    return bool(frappe.db.exists("DocType", "PH Projekt Dokument"))


def projekt_der_datei(doc):
    return doc.bezug_name if doc.bezug_doctype == "PH Projekt" else None


def _kopie(doc):
    v = dienste.version_zeile(doc)
    try:
        inhalt = dienste.inhalt_lesen(v.speicher, v.schluessel, max_bytes=MAX_PORTAL_BYTES)
    except ValueError:
        raise ApiFehler("too_large", 413, _("Für das Kundenportal höchstens 25 MB – bitte eine verkleinerte Fassung (z. B. PDF) freigeben."), {"max_bytes": MAX_PORTAL_BYTES})
    f = frappe.get_doc({"doctype": "File", "file_name": doc.dateiname, "is_private": 1, "content": inhalt, "attached_to_doctype": "PH Datei", "attached_to_name": doc.name})
    f.flags.ignore_permissions = True
    f.insert()
    return f


def _anhaengen(file_doc, dokument):
    frappe.db.set_value("File", file_doc.name, {"attached_to_doctype": "PH Projekt Dokument", "attached_to_name": dokument}, update_modified=False)


def portal_setzen(doc, freigeben=1, projekt=None, kategorie=None, titel=None, bis=None):
    """→ {"portal_freigabe", "portal_dokument", "portal_ablauf"}. Rechte an der Datei prüft der Aufrufer."""
    if not verfuegbar():
        raise ApiFehler("unavailable", 503, _("Kundenportal (ph_projekte) ist nicht installiert."))
    if cint(freigeben):
        if doc.status != "Aktiv":
            raise ApiFehler("conflict", 409, _("Nur aktive Dateien können ins Portal."))
        projekt = projekt or projekt_der_datei(doc)
        if not projekt or not frappe.db.exists("PH Projekt", projekt):
            raise ApiFehler("invalid", 400, _("Die Datei liegt nicht in einem Projektordner – Projekt angeben."), {"field": "projekt"})
        if not frappe.has_permission("PH Projekt Dokument", "create"):
            raise ApiFehler("forbidden", 403, _("Keine Berechtigung für Projektdokumente."))
        kategorie = kategorie if kategorie in KATEGORIEN else KATEGORIE_AUS_ENDUNG.get(doc.endung, "Sonstiges")
        alt = doc.portal_dokument if doc.portal_dokument and frappe.db.exists("PH Projekt Dokument", doc.portal_dokument) else None
        if alt and frappe.db.get_value("PH Projekt Dokument", alt, "status") != "Archiviert":
            if cint(doc.portal_version) == cint(doc.aktuelle_version):
                if not cint(frappe.db.get_value("PH Projekt Dokument", alt, "kunde_sichtbar")):
                    frappe.get_doc("PH Projekt Dokument", alt).portal_freigeben(1)
                name = alt
            else:
                # neue Ablage-Version → Versionierung von ph_projekte (Vorgänger wird archiviert)
                f = _kopie(doc)
                name = frappe.get_doc("PH Projekt Dokument", alt).neue_version(f.file_url)
                _anhaengen(f, name)
                frappe.get_doc("PH Projekt Dokument", name).portal_freigeben(1)
        else:
            f = _kopie(doc)
            neu = frappe.get_doc({"doctype": "PH Projekt Dokument", "projekt": projekt, "titel": (titel or doc.dateiname)[:140], "kategorie": kategorie, "datei": f.file_url, "referenz_doctype": "PH Datei", "referenz_name": doc.name, "kunde_sichtbar": 1, "quelle": "system", "beschreibung": doc.beschreibung})
            neu.insert(ignore_permissions=True)
            _anhaengen(f, neu.name)
            name = neu.name
        doc.db_set({"portal_freigabe": 1, "portal_dokument": name, "portal_version": cint(doc.aktuelle_version), "portal_ablauf": bis or doc.portal_ablauf})
        protokoll("Portal freigegeben", datei=doc.name, version=doc.aktuelle_version, bezug_doctype=doc.bezug_doctype, bezug_name=doc.bezug_name, hinweis=name)
    else:
        if doc.portal_dokument and frappe.db.exists("PH Projekt Dokument", doc.portal_dokument):
            frappe.get_doc("PH Projekt Dokument", doc.portal_dokument).portal_freigeben(0)
        doc.db_set({"portal_freigabe": 0, "portal_ablauf": None})
        protokoll("Portal zurueckgezogen", datei=doc.name, bezug_doctype=doc.bezug_doctype, bezug_name=doc.bezug_name, hinweis=doc.portal_dokument)
    return {"portal_freigabe": cint(doc.portal_freigabe), "portal_dokument": doc.portal_dokument, "portal_ablauf": str(doc.portal_ablauf) if doc.portal_ablauf else None, "zeit": dienste.iso(now_datetime())}

