"""Buchungsjournal: je buchungsrelevantem Vorgang eine unveränderliche Zeile mit verketteter Prüfsumme.

schreibe("Gestellt", rechnung, betrag_cent=rechnung.brutto_cent, details="…")
Fehler im Journal dürfen den Fachvorgang nie verhindern (frappe.log_error).
"""

import hashlib

import frappe
from frappe.utils import now_datetime


def schreibe(vorgang, doc, betrag_cent=0, details=""):
    try:
        vorherige = frappe.db.get_value("PH Buchungsjournal", {}, "pruefsumme", order_by="zeitpunkt desc, creation desc") or ""
        zeit = now_datetime()
        nummer = getattr(doc, "nummer", None) or doc.name
        roh = f"{vorherige}|{vorgang}|{doc.doctype}|{doc.name}|{nummer}|{int(betrag_cent or 0)}|{zeit.isoformat()}|{frappe.session.user}"
        eintrag = frappe.get_doc(
            {
                "doctype": "PH Buchungsjournal",
                "titel": f"{vorgang}: {nummer}",
                "zeitpunkt": zeit,
                "vorgang": vorgang,
                "beleg_doctype": doc.doctype,
                "beleg": doc.name,
                "nummer": nummer,
                "betrag_cent": int(betrag_cent or 0),
                "benutzer": frappe.session.user,
                "details": (details or "")[:1000],
                "pruefsumme": hashlib.sha256(roh.encode()).hexdigest(),
            }
        )
        eintrag.flags.ignore_permissions = True
        eintrag.insert(ignore_permissions=True)
        return eintrag.name
    except Exception:  # noqa: BLE001
        frappe.log_error(title="PH Buchungsjournal: Eintrag fehlgeschlagen")
        return None


def kette_pruefen(limit=5000):
    """Prüft die Verkettung der Prüfsummen (Report PH Export-Abgleich). → Liste gebrochener Einträge."""
    rows = frappe.get_all("PH Buchungsjournal", fields=["name", "vorgang", "beleg_doctype", "beleg", "nummer", "betrag_cent", "zeitpunkt", "benutzer", "pruefsumme"], order_by="zeitpunkt asc, creation asc", limit=limit)
    gebrochen = []
    vorherige = ""
    for r in rows:
        roh = f"{vorherige}|{r.vorgang}|{r.beleg_doctype}|{r.beleg}|{r.nummer}|{int(r.betrag_cent or 0)}|{r.zeitpunkt.isoformat()}|{r.benutzer}"
        if hashlib.sha256(roh.encode()).hexdigest() != r.pruefsumme:
            gebrochen.append(r.name)
        vorherige = r.pruefsumme
    return gebrochen
