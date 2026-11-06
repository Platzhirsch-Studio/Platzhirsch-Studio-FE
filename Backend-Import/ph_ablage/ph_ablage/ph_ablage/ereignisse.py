"""doc_events der Ablage (hooks.py). Nie Ausnahmen nach außen – Fehler nur ins Error Log (CONVENTIONS 13)."""

import frappe
from frappe.utils import cint

from ph_ablage.ph_ablage import dienste
from ph_ablage.ph_ablage.doctype.ph_ablage_einstellungen.ph_ablage_einstellungen import einstellungen
from ph_ablage.utils import regeln


def bezug_angelegt(doc, method=None):
    """Neuer Kontakt/Projekt/Lieferant/Mitarbeiter/Servicefall → Ordner nach Vorlage (im Hintergrund, idempotent)."""
    try:
        if doc.doctype not in regeln.ERLAUBTE_BEZUEGE or not cint(einstellungen().automatische_ordner):
            return
        if frappe.flags.in_install or frappe.flags.in_migrate:
            return
        frappe.enqueue("ph_ablage.ph_ablage.ereignisse.ordner_anlegen", queue="short", enqueue_after_commit=True, bezug_doctype=doc.doctype, bezug_name=doc.name, now=bool(frappe.flags.in_test))
    except Exception:  # noqa: BLE001
        frappe.log_error(title=f"ph_ablage: Ordner für {doc.doctype} {doc.name} nicht eingereiht")


def ordner_anlegen(bezug_doctype, bezug_name):
    try:
        dienste.wurzel_fuer_bezug(bezug_doctype, bezug_name)
        frappe.db.commit()
    except Exception:  # noqa: BLE001
        frappe.db.rollback()
        frappe.log_error(title=f"ph_ablage: Ordner für {bezug_doctype} {bezug_name} nicht angelegt")


def bezug_geaendert(doc, method=None):
    """Titel des Bezugs geändert → Stammordner umbenennen (Pfade/Bezugstitel im Unterbaum folgen)."""
    try:
        if doc.doctype not in regeln.ERLAUBTE_BEZUEGE:
            return
        wurzel = frappe.db.get_value("PH Ordner", {"bezug_doctype": doc.doctype, "bezug_name": doc.name, "ist_bezugswurzel": 1}, ["name", "bezug_titel"], as_dict=True)
        if not wurzel:
            return
        neu = dienste.bezug_titel(doc.doctype, doc.name)
        if neu == wurzel.bezug_titel:
            return
        o = frappe.get_doc("PH Ordner", wurzel.name)
        o.titel = neu
        o.bezug_titel = neu
        o.flags.ignore_permissions = True
        o.flags.ph_system = True
        o.save()
    except Exception:  # noqa: BLE001
        frappe.log_error(title=f"ph_ablage: Stammordner {doc.doctype} {doc.name} nicht umbenannt")


def bezug_geloescht(doc, method=None):
    """Bezug wird gelöscht: leere Ordner entfernen. Mit Dateien bleibt alles stehen – Frappe verhindert dann das
    Löschen über den Dynamic Link (PH Datei.bezug_name), die Dateien müssen zuerst verschoben/gelöscht werden."""
    try:
        if doc.doctype not in regeln.ERLAUBTE_BEZUEGE:
            return
        if frappe.db.exists("PH Datei", {"bezug_doctype": doc.doctype, "bezug_name": doc.name}):
            return
        namen = frappe.get_all("PH Ordner", filters={"bezug_doctype": doc.doctype, "bezug_name": doc.name}, fields=["name", "lft"], order_by="lft desc")
        for o in namen:
            d = frappe.get_doc("PH Ordner", o.name)
            d.flags.ph_system = True
            d.flags.ignore_permissions = True
            d.delete(ignore_permissions=True)
    except Exception:  # noqa: BLE001
        frappe.log_error(title=f"ph_ablage: Ordner zu {doc.doctype} {doc.name} nicht entfernt")


MAX_UEBERNAHME = 100 * 1024 * 1024


def file_geloescht(doc, method=None):
    """Original einer verlinkten Bestandsdatei wird gelöscht → Inhalt vorher in den eingestellten Speicher kopieren
    (bis 100 MB), Version zeigt danach auf das neue Objekt. Größere Dateien: Hinweis im Error Log."""
    try:
        zeilen = frappe.get_all("PH Datei Version", filters={"speicher": "frappe_datei", "schluessel": doc.name, "parenttype": "PH Datei"}, fields=["name", "parent", "version", "endung", "mime"])
        if not zeilen:
            return
        if cint(doc.file_size) > MAX_UEBERNAHME:
            frappe.log_error(title=f"ph_ablage: Bestandsdatei {doc.name} zu groß für automatische Übernahme", message=", ".join(z.parent for z in zeilen))
            return
        import hashlib

        from frappe.utils import getdate

        from ph_ablage import speicher
        from ph_ablage.ph_ablage.doctype.ph_ablage_ereignis.ph_ablage_ereignis import protokoll

        inhalt = doc.get_content()
        inhalt = inhalt if isinstance(inhalt, bytes) else str(inhalt).encode()
        sha = hashlib.sha256(inhalt).hexdigest()
        ziel = einstellungen().speicher_adapter or "lokal"
        for z in zeilen:
            jahr = getdate(frappe.db.get_value("PH Datei", z.parent, "creation")).year
            schluessel = dienste.voller_schluessel(regeln.schluessel(jahr, z.parent, z.version, sha, z.endung))
            speicher.speicher_fuer(ziel).put(schluessel, inhalt, z.mime or "application/octet-stream")
            frappe.db.set_value("PH Datei Version", z.name, {"speicher": ziel, "schluessel": schluessel, "sha256": sha, "geprueft": 1, "groesse": len(inhalt)}, update_modified=False)
            if cint(frappe.db.get_value("PH Datei", z.parent, "aktuelle_version")) == cint(z.version):
                frappe.db.set_value("PH Datei", z.parent, {"sha256": sha, "groesse": len(inhalt)}, update_modified=False)
            protokoll("Speicher umgezogen", datei=z.parent, version=z.version, hinweis=f"Original {doc.name} gelöscht → {ziel}", automatisch=True)
    except Exception:  # noqa: BLE001
        frappe.log_error(title=f"ph_ablage: Bestandsdatei {doc.name} nicht übernommen")
