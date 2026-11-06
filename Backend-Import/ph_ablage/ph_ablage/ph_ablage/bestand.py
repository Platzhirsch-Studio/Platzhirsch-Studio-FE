"""Bestandsdateien in die Ablage **verlinken** (nicht kopieren): Frappe-Files an PH Kontakt/PH Projekt/PH Lieferant/
PH Mitarbeiter/PH Servicefall und an PH Projekt Dokument. Version mit Adapter „frappe_datei“ (Schlüssel = File-Name);
Prüfsumme, Vorschau und Volltext trägt der Hintergrundjob nach. Idempotent (quelle_doctype = "File", quelle_name).

Wird die Original-Datei später gelöscht, übernimmt ereignisse.file_geloescht den Inhalt vorher in den eingestellten
Speicher (bis 100 MB), damit die Ablage vollständig bleibt.
"""

import frappe
from frappe import _
from frappe.utils import cint, getdate

from ph_ablage.ph_ablage import dienste
from ph_ablage.ph_ablage.doctype.ph_ablage_ereignis.ph_ablage_ereignis import protokoll
from ph_ablage.utils import regeln

BESTAND_ORDNER = "00 Bestand"
# PH Projekt Dokument.kategorie → Vorlagenordner des Projekts
KATEGORIE_ORDNER = {
    "Plan": "02 Planung & Handzeichnung", "Rendering": "03 Renderings", "Angebot": "04 Angebote & Verträge",
    "Auftragsbestaetigung": "04 Angebote & Verträge", "Rechnung": "04 Angebote & Verträge", "Vertrag": "04 Angebote & Verträge",
    "Produktpass": "05 Herstellerunterlagen", "Lieferschein": "06 Montage & Abnahme", "Protokoll": "06 Montage & Abnahme",
    "Montagebericht": "06 Montage & Abnahme", "Abnahmeprotokoll": "06 Montage & Abnahme", "Foto": "07 Fotos",
}
BELEG_KATEGORIEN = ("Angebot", "Auftragsbestaetigung", "Rechnung", "Vertrag", "Lieferschein")


def _unterordner(wurzel, titel, anlegen=True):
    n = frappe.db.get_value("PH Ordner", {"parent_ph_ordner": wurzel, "titel": titel}, "name")
    if n or not anlegen:
        return n
    o = frappe.db.get_value("PH Ordner", wurzel, ["bezug_doctype", "bezug_name"], as_dict=True)
    try:
        return dienste._ordner_neu(titel, wurzel, o.bezug_doctype, o.bezug_name, quelle="bestand", vorlage="bestand").name
    except frappe.DuplicateEntryError:
        return frappe.db.get_value("PH Ordner", {"parent_ph_ordner": wurzel, "titel": titel}, "name")


def bereits_verlinkt(file_name):
    return bool(frappe.db.exists("PH Datei", {"quelle_doctype": "File", "quelle_name": file_name}))


def verlinken(f, ordner, aufbewahrung=None, beschreibung=None):
    """Eine File-Zeile (dict) als PH Datei mit Version „frappe_datei“ anlegen → Name."""
    try:
        name = regeln.dateiname_bereinigen(f.file_name or f.name)
    except ValueError:
        name = f.name
    end = regeln.endung(name)
    doc = frappe.get_doc({
        "doctype": "PH Datei", "dateiname": name, "ordner": ordner, "status": "Hochladen", "mime": regeln.mime_fuer(name),
        "quelle": "bestand", "quelle_doctype": "File", "quelle_name": f.name, "hochgeladen_von": f.owner, "hochgeladen_am": f.creation,
        "belegdatum": getdate(f.creation), "aufbewahrungsklasse": aufbewahrung or "Allgemein", "beschreibung": beschreibung,
    })
    doc.flags.ignore_permissions = True
    doc.flags.ph_api = True
    doc.insert()
    dienste.version_anhaengen(doc, {"version": 1, "schluessel": f.name, "speicher": "frappe_datei", "groesse": cint(f.file_size), "sha256": None, "geprueft": 0, "mime": doc.mime, "endung": end, "hochgeladen_von": f.owner, "hochgeladen_am": f.creation, "kommentar": _("Bestand verlinkt ({0})").format("privat" if cint(f.is_private) else "öffentlich"), "dateiname_damals": name})
    protokoll("Bestand verlinkt", datei=doc.name, ordner=ordner, version=1, bezug_doctype=doc.bezug_doctype, bezug_name=doc.bezug_name, hinweis=f.name, automatisch=True)
    return doc.name


def bestand_uebernehmen(bezug_doctype=None, limit=500):
    """→ {"verlinkt", "uebersprungen", "fehler", "je_bezug": {...}}. Commit je 50 Dateien."""
    from ph_ablage.ph_ablage.vorschau import einreihen

    zaehler = {"verlinkt": 0, "uebersprungen": 0, "fehler": 0, "je_bezug": {}}
    arten = [bezug_doctype] if bezug_doctype else list(regeln.ERLAUBTE_BEZUEGE)
    felder = ["name", "file_name", "file_size", "attached_to_name", "creation", "owner", "is_private", "file_url"]
    neue = []
    verlinkt = set(frappe.get_all("PH Datei", filters={"quelle_doctype": "File"}, pluck="quelle_name"))
    for dt in arten:
        if dt not in regeln.ERLAUBTE_BEZUEGE or not frappe.db.exists("DocType", dt):
            continue
        for f in frappe.get_all("File", filters={"attached_to_doctype": dt, "is_folder": 0}, fields=felder, order_by="creation asc"):
            if len(neue) >= cint(limit or 500):
                break
            if f.name in verlinkt or not f.attached_to_name:
                zaehler["uebersprungen"] += 1
                continue
            try:
                wurzel = dienste.wurzel_fuer_bezug(dt, f.attached_to_name)
                if not wurzel:
                    zaehler["uebersprungen"] += 1
                    continue
                ziel = wurzel if dt == "PH Mitarbeiter" else _unterordner(wurzel, BESTAND_ORDNER)
                neue.append(verlinken(f, ziel, aufbewahrung="Personal" if dt == "PH Mitarbeiter" else None))
                verlinkt.add(f.name)
                zaehler["je_bezug"][dt] = zaehler["je_bezug"].get(dt, 0) + 1
            except Exception:  # noqa: BLE001
                frappe.db.rollback()
                zaehler["fehler"] += 1
                frappe.log_error(title=f"ph_ablage: Bestand {f.name} nicht verlinkt")
            if len(neue) % 50 == 0:
                frappe.db.commit()
    if (not bezug_doctype or bezug_doctype == "PH Projekt") and frappe.db.exists("DocType", "PH Projekt Dokument"):
        for d in frappe.get_all("PH Projekt Dokument", filters={"datei": ("is", "set")}, fields=["name", "projekt", "datei", "kategorie", "titel", "referenz_doctype", "beschreibung"], order_by="creation asc"):
            if len(neue) >= cint(limit or 500):
                break
            if d.referenz_doctype == "PH Datei":
                continue  # Portal-Kopie aus der Ablage selbst
            f = frappe.db.get_value("File", {"file_url": d.datei}, felder, as_dict=True)
            if not f or f.name in verlinkt or not d.projekt:
                zaehler["uebersprungen"] += 1
                continue
            try:
                wurzel = dienste.wurzel_fuer_bezug("PH Projekt", d.projekt)
                if not wurzel:
                    continue
                ziel = _unterordner(wurzel, KATEGORIE_ORDNER.get(d.kategorie, BESTAND_ORDNER), anlegen=False) or _unterordner(wurzel, BESTAND_ORDNER)
                if d.titel and regeln.endung(d.titel) != regeln.endung(f.file_name or ""):
                    f.file_name = f"{d.titel}.{regeln.endung(f.file_name or '') or 'bin'}"
                neue.append(verlinken(f, ziel, aufbewahrung="Beleg" if d.kategorie in BELEG_KATEGORIEN else "Projekt", beschreibung=_("Aus PH Projekt Dokument {0}").format(d.name)))
                verlinkt.add(f.name)
                zaehler["je_bezug"]["PH Projekt Dokument"] = zaehler["je_bezug"].get("PH Projekt Dokument", 0) + 1
            except Exception:  # noqa: BLE001
                frappe.db.rollback()
                zaehler["fehler"] += 1
                frappe.log_error(title=f"ph_ablage: Projektdokument {d.name} nicht verlinkt")
    frappe.db.commit()
    for n in neue:
        einreihen(n, 1, pruefsumme=True)
    zaehler["verlinkt"] = len(neue)
    return zaehler
