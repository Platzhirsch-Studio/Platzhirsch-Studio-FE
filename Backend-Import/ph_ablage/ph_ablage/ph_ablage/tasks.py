"""Scheduler und Hintergrundjobs der Ablage (hooks.py scheduler_events). Idempotent, commit je Einheit,
Fehler nur ins Error Log (CONVENTIONS 13)."""

import glob
import hashlib
import os
import tempfile
import time

import frappe
from frappe.utils import add_to_date, cint, getdate, now_datetime, nowdate

from ph_ablage import speicher
from ph_ablage.ph_ablage import dienste
from ph_ablage.ph_ablage.doctype.ph_ablage_einstellungen.ph_ablage_einstellungen import einstellungen
from ph_ablage.ph_ablage.doctype.ph_ablage_ereignis.ph_ablage_ereignis import protokoll
from ph_ablage.utils import regeln

MB = 1024 * 1024


def sperren_aufheben():
    for d in frappe.get_all("PH Datei", filters={"gesperrt_von": ("is", "set"), "gesperrt_bis": ("<", now_datetime())}, fields=["name", "gesperrt_von"], limit=500):
        frappe.db.set_value("PH Datei", d.name, {"gesperrt_von": None, "gesperrt_bis": None, "gesperrt_hinweis": None}, update_modified=False)
        protokoll("Entsperrt", datei=d.name, hinweis=f"Check-out von {d.gesperrt_von} abgelaufen", automatisch=True)
        frappe.db.commit()


def freigaben_ablaufen():
    betroffen = set()
    jetzt = now_datetime()
    for l in frappe.get_all("PH Datei Freigabelink", filters={"status": "Aktiv", "ablauf": ("<=", jetzt)}, fields=["name", "datei"], limit=1000):
        frappe.db.set_value("PH Datei Freigabelink", l.name, "status", "Abgelaufen", update_modified=False)
        betroffen.add(l.datei)
    for datei in betroffen:
        dienste.freigaben_zaehlen(datei)
    frappe.db.commit()


def uploads_aufraeumen():
    """Reservierte, nie abgeschlossene Uploads (Status „Hochladen“, keine Version) und alte Teil-Dateien entfernen."""
    stunden = cint(einstellungen().upload_token_stunden) or 24
    grenze = add_to_date(now_datetime(), hours=-(stunden + 1))
    for d in frappe.get_all("PH Datei", filters={"status": "Hochladen", "creation": ("<", grenze)}, fields=["name", "aktuelle_version"], limit=500):
        try:
            if cint(d.aktuelle_version) == 0:
                frappe.delete_doc("PH Datei", d.name, ignore_permissions=True, force=True)
                frappe.db.commit()
        except Exception:  # noqa: BLE001
            frappe.db.rollback()
            frappe.log_error(title=f"ph_ablage: verwaister Upload {d.name}")
    from ph_ablage.ph_ablage.upload import tmp_ordner

    alt = time.time() - (stunden + 1) * 3600
    for pfad in glob.glob(os.path.join(tmp_ordner(), "*.part")):
        try:
            if os.path.getmtime(pfad) < alt:
                os.unlink(pfad)
        except OSError:
            pass


def papierkorb_leeren():
    for d in frappe.get_all("PH Datei", filters={"status": "Papierkorb", "papierkorb_bis": ("<=", nowdate())}, pluck="name", limit=500):
        try:
            dienste.endgueltig_loeschen(frappe.get_doc("PH Datei", d), automatisch=True)
            frappe.db.commit()
        except Exception:  # noqa: BLE001 – z. B. Aufbewahrungssperre nach Klassenwechsel: bleibt im Papierkorb
            frappe.db.rollback()
            frappe.log_error(title=f"ph_ablage: Papierkorb {d} nicht geleert")


def portal_ablauf():
    from ph_ablage.ph_ablage.portal import portal_setzen, verfuegbar

    if not verfuegbar():
        return
    for d in frappe.get_all("PH Datei", filters={"portal_freigabe": 1, "portal_ablauf": ("<", nowdate())}, pluck="name", limit=500):
        try:
            portal_setzen(frappe.get_doc("PH Datei", d), 0)
            frappe.db.commit()
        except Exception:  # noqa: BLE001
            frappe.db.rollback()
            frappe.log_error(title=f"ph_ablage: Portal-Ablauf {d}")


def nachtragen(limit=200):
    """Fehlende Prüfsummen (Bestand, S3-Direkt-Upload) und hängende Vorschauen erneut einreihen."""
    from ph_ablage.ph_ablage.vorschau import einreihen

    gesehen = set()
    for v in frappe.get_all("PH Datei Version", filters={"parenttype": "PH Datei", "geprueft": 0}, fields=["parent", "version"], limit=limit):
        einreihen(v.parent, v.version, pruefsumme=True)
        gesehen.add(v.parent)
    grenze = add_to_date(now_datetime(), hours=-1)
    for d in frappe.get_all("PH Datei", filters={"status": "Aktiv", "vorschau_status": "Ausstehend", "modified": ("<", grenze)}, fields=["name", "aktuelle_version"], limit=limit):
        if d.name not in gesehen:
            einreihen(d.name, d.aktuelle_version)


# ── Speicher-Umzug (Anbieterwechsel) ────────────────────────────────────────────────────────────
def speicher_umziehen(ziel=None, limit=200, bestand_einbeziehen=0, alte_loeschen=0):
    """Versionen (und Vorschauen) aus anderen Adaptern in `ziel` kopieren, Prüfsumme verifizieren, Zeile umstellen.
    Schlüssel bleibt gleich (Schema unverändert); Bestand (frappe_datei) erhält einen Schema-Schlüssel.
    → {"kopiert", "fehler", "rest"}."""
    ziel = ziel or einstellungen().speicher_adapter or "lokal"
    z = speicher.speicher_fuer(ziel)
    quellen = [a for a in speicher.ADAPTER if a != ziel] + (["frappe_datei"] if cint(bestand_einbeziehen) else [])
    zeilen = frappe.get_all("PH Datei Version", filters={"parenttype": "PH Datei", "speicher": ("in", quellen)}, fields=["name", "parent", "version", "speicher", "schluessel", "sha256", "endung", "mime"], limit=cint(limit) or 200)
    kopiert = fehler = 0
    for v in zeilen:
        try:
            neu, sha, groesse = _kopieren(v, z)
            frappe.db.set_value("PH Datei Version", v.name, {"speicher": ziel, "schluessel": neu, "sha256": sha, "geprueft": 1, "groesse": groesse}, update_modified=False)
            if alte_loeschen and v.speicher not in speicher.NUR_LESEN:
                speicher.speicher_fuer(v.speicher).delete(v.schluessel)
            protokoll("Speicher umgezogen", datei=v.parent, version=v.version, hinweis=f"{v.speicher} → {ziel}", automatisch=True)
            frappe.db.commit()
            kopiert += 1
        except Exception:  # noqa: BLE001
            frappe.db.rollback()
            fehler += 1
            frappe.log_error(title=f"ph_ablage: Umzug {v.parent} v{v.version} ({v.speicher} → {ziel})")
    rest = frappe.db.count("PH Datei Version", {"parenttype": "PH Datei", "speicher": ("in", quellen)})
    return {"kopiert": kopiert, "fehler": fehler, "rest": rest, "ziel": ziel}


def _kopieren(v, ziel_adapter):
    quelle = speicher.speicher_fuer(v.speicher)
    h = hashlib.sha256()
    n = 0
    with tempfile.TemporaryFile() as tmp:
        f = quelle.get(v.schluessel)
        try:
            for teil in iter(lambda: f.read(8 * MB), b""):
                h.update(teil)
                tmp.write(teil)
                n += len(teil)
        finally:
            try:
                f.close()
            except Exception:  # noqa: BLE001
                pass
        sha = h.hexdigest()
        if v.sha256 and v.sha256 != sha:
            raise ValueError(f"Prüfsumme weicht ab ({v.parent} v{v.version})")
        if v.speicher == "frappe_datei" or not regeln.ist_gueltiger_schluessel(regeln.praefix_trennen(v.schluessel)[1] or ""):
            jahr = getdate(frappe.db.get_value("PH Datei", v.parent, "creation")).year
            neu = dienste.voller_schluessel(regeln.schluessel(jahr, v.parent, v.version, sha, v.endung))
        else:
            neu = v.schluessel
        tmp.seek(0)
        ziel_adapter.put(neu, tmp, v.mime or "application/octet-stream")
    return neu, sha, n
