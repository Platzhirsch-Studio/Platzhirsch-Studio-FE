"""Helfer für Site-Tests (FrappeTestCase) – nicht von `unittest discover` ohne Site geladen (kein test_-Präfix)."""

import base64
import hashlib

import frappe

from ph_ablage import speicher
from ph_ablage.install import einstellungen_anlegen

TESTORDNER = "Testordner Ablage (automatischer Test)"


def einstellungen_fuer_tests(**werte):
    einstellungen_anlegen()
    werte = {"speicher_adapter": "lokal", "speicher_praefix": "test", "duplikat_verhalten": "melden", "vorschau_aktiv": 0, "volltext_aktiv": 1, **werte}
    for k, v in werte.items():
        frappe.db.set_single_value("PH Ablage Einstellungen", k, v)
    frappe.cache().delete_value("ph_ablage:einstellungen")
    speicher.cache_leeren()


def testordner(titel=TESTORDNER, eltern=None, **werte):
    vorhanden = frappe.db.get_value("PH Ordner", {"titel": titel, "parent_ph_ordner": eltern or ("is", "not set")}, "name")
    if vorhanden:
        return vorhanden
    d = frappe.get_doc({"doctype": "PH Ordner", "titel": titel, "parent_ph_ordner": eltern, **werte})
    d.flags.ignore_permissions = True
    d.insert()
    return d.name


def hochladen(ordner, dateiname="notiz.txt", inhalt=b"Kueche Musterfrau - Testinhalt", datei=None, teil=8):
    """Upload über die Dienste (wie die API: start → chunk(s) → abschliessen) → Antwort von abschliessen."""
    from ph_ablage.ph_ablage import upload

    sha = hashlib.sha256(inhalt).hexdigest()
    s = upload.start(ordner=ordner, dateiname=dateiname, groesse=len(inhalt), sha256=sha, datei=datei)
    for offset in range(0, len(inhalt), teil):
        upload.chunk(s["token"], offset=offset, daten=base64.b64encode(inhalt[offset: offset + teil]).decode())
    return upload.abschliessen(s["token"], sha)


def aufraeumen():
    from ph_ablage.ph_ablage.dienste import endgueltig_loeschen

    wurzel = frappe.db.get_value("PH Ordner", {"titel": TESTORDNER}, ["lft", "rgt"], as_dict=True)
    if not wurzel:
        return
    ordner = frappe.get_all("PH Ordner", filters={"lft": (">=", wurzel.lft), "rgt": ("<=", wurzel.rgt)}, pluck="name")
    for d in frappe.get_all("PH Datei", filters={"ordner": ("in", ordner)}, pluck="name"):
        endgueltig_loeschen(frappe.get_doc("PH Datei", d), automatisch=True, pruefen=False)
