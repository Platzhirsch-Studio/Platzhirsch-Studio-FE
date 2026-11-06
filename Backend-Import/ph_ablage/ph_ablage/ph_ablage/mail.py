"""Hook `ph_microsoft_anhang_ablegen` (ph_microsoft/ph_microsoft/mail.py anhaenge_speichern):
Anhänge zugeordneter Kundenmails landen im Ordner „00 Mail-Anhänge“ des Bezugs (Kontakt/Projekt/Servicefall/
Lieferant; andere Vorgänge → Ordner des Kontakts). Verlinkt (Adapter „frappe_datei“, kein zweites Objekt) – die
private Datei an der Communication bleibt das Original; wird sie gelöscht, übernimmt ereignisse.file_geloescht den
Inhalt. Duplikat-Erkennung per sha256 innerhalb desselben Bezugs (gleicher Anhang in mehreren Mails nur einmal)."""

import hashlib

import frappe
from frappe.utils import cint

from ph_ablage.ph_ablage import bestand, dienste
from ph_ablage.ph_ablage.doctype.ph_ablage_einstellungen.ph_ablage_einstellungen import einstellungen
from ph_ablage.ph_ablage.doctype.ph_ablage_ereignis.ph_ablage_ereignis import protokoll
from ph_ablage.utils import regeln

MAIL_ORDNER = "00 Mail-Anhänge"
MAX_BYTES = 100 * 1024 * 1024


def anhang_ablegen(datei, bezug_doctype=None, bezug_name=None, kontakt=None, quelle="exchange"):
    """→ Name der PH Datei (neu oder vorhandenes Duplikat) oder None (kein passender Bezug / Dateityp gesperrt)."""
    if bezug_doctype in regeln.ERLAUBTE_BEZUEGE and bezug_name:
        dt, name = bezug_doctype, bezug_name
    elif kontakt:
        dt, name = "PH Kontakt", kontakt
    else:
        return None
    f = frappe.db.get_value("File", datei, ["name", "file_name", "file_size", "attached_to_name", "creation", "owner", "is_private", "file_url"], as_dict=True)
    if not f or cint(f.file_size) > MAX_BYTES:
        return None
    e = einstellungen()
    ok, _grund = regeln.endung_erlaubt(regeln.endung(f.file_name), set(e.erlaubt) or None, set(e.gesperrt))
    if not ok:
        return None
    inhalt = frappe.get_doc("File", datei).get_content()
    sha = hashlib.sha256(inhalt if isinstance(inhalt, bytes) else str(inhalt).encode()).hexdigest()
    gleich = frappe.get_all("PH Datei", filters={"sha256": sha, "bezug_doctype": dt, "bezug_name": name, "status": ("in", ("Aktiv", "Papierkorb"))}, pluck="name", limit=1)
    if gleich:
        return gleich[0]
    wurzel = dienste.wurzel_fuer_bezug(dt, name)
    if not wurzel:
        return None
    ziel = wurzel if dt == "PH Mitarbeiter" else bestand._unterordner(wurzel, MAIL_ORDNER)
    neu = bestand.verlinken(f, ziel, beschreibung=frappe._("Mail-Anhang ({0})").format(quelle or "Mail"))
    doc = frappe.get_doc("PH Datei", neu)
    v = doc.versionen[0]
    frappe.db.set_value("PH Datei Version", v.name, {"sha256": sha, "geprueft": 1}, update_modified=False)
    frappe.db.set_value("PH Datei", neu, {"sha256": sha, "quelle": "system"}, update_modified=False)
    protokoll("Upload", datei=neu, ordner=ziel, version=1, bezug_doctype=dt, bezug_name=name, hinweis=f"Mail-Anhang ({quelle})", automatisch=True)
    try:
        from ph_ablage.ph_ablage.vorschau import einreihen

        einreihen(neu, 1)
    except Exception:  # noqa: BLE001
        frappe.log_error(title=f"ph_ablage: Vorschau Mail-Anhang {neu}")
    return neu
