"""Optional (Einstellung kontakte_sync_aktiv): PH Kontakt → Outlook-Kontaktordner „Platzhirsch Kunden“ des
Team-Postfachs (kontakte_postfach, meist Shared Mailbox). Nur einseitig; Outlook-Änderungen werden beim
nächsten Abgleich überschrieben. Gesperrte/anonymisierte/gelöschte Kontakte werden in Outlook entfernt."""

import hashlib
import json
from urllib.parse import quote

import frappe
from frappe.utils import now_datetime

from ph_microsoft.graph.client import GraphFehler
from ph_microsoft.ph_microsoft.einstellungen import einstellungen
from ph_microsoft.ph_microsoft.graph_dienst import graph_client
from ph_microsoft.ph_microsoft.protokoll import eintrag, festschreiben

FELDER = ["name", "vorname", "nachname", "firma", "email", "telefon", "mobil", "strasse", "plz", "ort", "land", "status", "anonymisiert_am", "funktion"]


def _u(a):
    return f"/users/{quote(str(a), safe='@')}"


def ordner_id(postfach, name):
    key = f"ph_microsoft:kontaktordner:{postfach}:{name}"
    fid = frappe.cache().get_value(key)
    if fid:
        return fid
    g = graph_client()
    vorhanden = [f for f in g.seiten(f"{_u(postfach)}/contactFolders", params={"$select": "id,displayName"}) if f.get("displayName") == name]
    fid = vorhanden[0]["id"] if vorhanden else g.post(f"{_u(postfach)}/contactFolders", json={"displayName": name})["id"]
    frappe.cache().set_value(key, fid, expires_in_sec=24 * 3600)
    return fid


def outlook_kontakt(k):
    body = {
        "givenName": k.get("vorname") or "",
        "surname": k.get("nachname") or "",
        "companyName": k.get("firma") or "",
        "jobTitle": k.get("funktion") or "",
        "emailAddresses": [{"address": k["email"], "name": " ".join(x for x in (k.get("vorname"), k.get("nachname")) if x)}] if k.get("email") else [],
        "businessPhones": [k["telefon"]] if k.get("telefon") else [],
        "mobilePhone": k.get("mobil") or None,
        "businessAddress": {"street": k.get("strasse") or "", "postalCode": k.get("plz") or "", "city": k.get("ort") or "", "countryOrRegion": k.get("land") or ""},
        "categories": ["Platzhirsch"],
        "personalNotes": f"PH Kontakt {k['name']}",
    }
    return body


def _hash(body):
    return hashlib.sha256(json.dumps(body, sort_keys=True, ensure_ascii=False).encode()).hexdigest()[:32]


def kontakt_abgleichen(name):
    e = einstellungen()
    if not e["kontakte_sync_aktiv"] or not e["kontakte_postfach"] or not frappe.db.exists("DocType", "PH Kontakt"):
        return
    v = frappe.db.get_value("PH Graph Verknuepfung", {"art": "Kontakt", "referenz_doctype": "PH Kontakt", "referenz_name": name, "status": "Aktiv"}, ["name", "graph_id", "inhalt_hash", "outlook_adresse"], as_dict=True)
    k = frappe.db.get_value("PH Kontakt", name, FELDER, as_dict=True)
    g = graph_client()
    try:
        if not k or k.anonymisiert_am or k.status == "Gesperrt":
            if v:
                try:
                    g.delete(f"{_u(v.outlook_adresse)}/contacts/{quote(v.graph_id)}")
                except GraphFehler as f:
                    if f.status != 404:
                        raise
                frappe.db.set_value("PH Graph Verknuepfung", v.name, {"status": "Geloescht", "letzte_sync": now_datetime()})
            return
        body = outlook_kontakt(k)
        h = _hash(body)
        if v and v.inhalt_hash == h:
            return
        pf = e["kontakte_postfach"]
        res = None
        if v:
            try:
                res = g.patch(f"{_u(pf)}/contacts/{quote(v.graph_id)}", json=body)
            except GraphFehler as f:
                if f.status != 404:
                    raise
        if res is None:
            res = g.post(f"{_u(pf)}/contactFolders/{quote(ordner_id(pf, e['kontakte_ordner']))}/contacts", json=body)
        werte = {"titel": f"Outlook-Kontakt {name}"[:140], "art": "Kontakt", "referenz_doctype": "PH Kontakt", "referenz_name": name, "outlook_adresse": pf,
                 "graph_id": res.get("id"), "change_key": res.get("changeKey"), "inhalt_hash": h, "status": "Aktiv", "letzte_sync": now_datetime(), "letzter_fehler": None}
        if v:
            frappe.db.set_value("PH Graph Verknuepfung", v.name, werte)
        else:
            frappe.get_doc({"doctype": "PH Graph Verknuepfung", **werte}).insert(ignore_permissions=True)
    except GraphFehler as f:
        eintrag("Kontakte", "Outlook-Kontakt", "Fehler", f"Graph {f.status} {f.code}", "PH Kontakt", name, kontakt=name)
    festschreiben()


def vollabgleich():
    e = einstellungen()
    if not e["kontakte_sync_aktiv"] or not frappe.db.exists("DocType", "PH Kontakt"):
        return
    namen = frappe.get_all("PH Kontakt", filters={"status": ("in", ["Kunde", "Interessent"]), "anonymisiert_am": ("is", "not set")}, pluck="name", limit=5000)
    for n in namen:
        kontakt_abgleichen(n)
    eintrag("Kontakte", "Vollabgleich", "OK", None, anzahl=len(namen), commit=True)
