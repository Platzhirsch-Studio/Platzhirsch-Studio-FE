"""Hook-Vertrag Kundenakte (ph_crm/README.md „Hook-Vertrag Kundenakte“).

Mails selbst zeigt ph_crm bereits (Communication + Timeline-Links); hier kommen nur die Exchange-/Outlook-
Ereignisse ohne Inhalt dazu: Outlook-Verschiebungen, Konflikte, aufgehobene Mail-Zuordnungen, gemerkte Adressen.
"""

import frappe

ARTEN = {"Zeit aus Outlook übernommen": "Outlook", "Konflikt": "Outlook", "In Outlook gelöscht": "Outlook", "Zuordnung aufgehoben": "E-Mail"}


def _iso(dt):
    return frappe.utils.get_datetime(dt).isoformat() if dt else None


def zeitleiste(kontakt, vor=None, limit=30):
    filt = {"kontakt": kontakt, "aktion": ("in", list(ARTEN))}
    if vor:
        filt["zeitpunkt"] = ("<", vor)
    aus = []
    for p in frappe.get_all("PH Sync Protokoll", filters=filt, fields=["name", "zeitpunkt", "aktion", "referenz_doctype", "referenz_name", "meldung"], order_by="zeitpunkt desc", limit=limit):
        aus.append({"zeit": _iso(p.zeitpunkt), "art": ARTEN.get(p.aktion, "Microsoft 365"), "doctype": p.referenz_doctype or "PH Sync Protokoll",
                    "name": p.referenz_name or p.name, "titel": p.aktion, "text": p.meldung or "", "app": "ph_microsoft"})
    for a in frappe.get_all("PH Mail Adresse", filters={"kontakt_doctype": "PH Kontakt", "kontakt_name": kontakt, "art": "Zuordnung"}, fields=["name", "creation", "adresse"], limit=limit):
        if not vor or a.creation < frappe.utils.get_datetime(vor):
            aus.append({"zeit": _iso(a.creation), "art": "E-Mail", "doctype": "PH Mail Adresse", "name": a.name, "titel": "Weitere E-Mail-Adresse zugeordnet", "text": a.adresse, "app": "ph_microsoft"})
    return sorted(aus, key=lambda x: x["zeit"] or "", reverse=True)[:limit]


def datenauskunft(kontakt):
    aus = []
    for a in frappe.get_all("PH Mail Adresse", filters={"kontakt_doctype": "PH Kontakt", "kontakt_name": kontakt}, fields=["name", "adresse", "art", "creation"]):
        aus.append({"abschnitt": "Weitere E-Mail-Adressen (Microsoft 365)", "doctype": "PH Mail Adresse", "name": a.name, "daten": {"adresse": a.adresse, "art": a.art, "seit": str(a.creation)}})
    for v in frappe.get_all("PH Graph Verknuepfung", filters={"art": "Kontakt", "referenz_doctype": "PH Kontakt", "referenz_name": kontakt}, fields=["name", "outlook_adresse", "status", "letzte_sync"]):
        aus.append({"abschnitt": "Outlook-Kontaktordner", "doctype": "PH Graph Verknuepfung", "name": v.name, "daten": {"postfach": v.outlook_adresse, "status": v.status, "letzte_sync": str(v.letzte_sync)}})
    return aus


def anonymisieren(kontakt, ausfuehren=False):
    zeilen = []
    for a in frappe.get_all("PH Mail Adresse", filters={"kontakt_doctype": "PH Kontakt", "kontakt_name": kontakt}, pluck="name"):
        zeilen.append({"doctype": "PH Mail Adresse", "name": a, "aktion": "loeschen", "grund": "Adresszuordnung ohne Aufbewahrungspflicht", "frist_bis": None})
        if ausfuehren:
            frappe.delete_doc("PH Mail Adresse", a, ignore_permissions=True, force=True)
    for v in frappe.get_all("PH Graph Verknuepfung", filters={"art": "Kontakt", "referenz_doctype": "PH Kontakt", "referenz_name": kontakt}, pluck="name"):
        zeilen.append({"doctype": "PH Graph Verknuepfung", "name": v, "aktion": "loeschen", "grund": "Outlook-Kontakt wird entfernt", "frist_bis": None})
        if ausfuehren:
            frappe.db.set_value("PH Graph Verknuepfung", v, "status", "Aktiv")  # Abgleich erkennt anonymisiert → löscht in Outlook
            frappe.enqueue("ph_microsoft.ph_microsoft.kontakte.kontakt_abgleichen", queue="short", name=kontakt, enqueue_after_commit=True)
    for p in frappe.get_all("PH Sync Protokoll", filters={"kontakt": kontakt}, pluck="name"):
        zeilen.append({"doctype": "PH Sync Protokoll", "name": p, "aktion": "anonymisieren", "grund": "Protokoll ohne Inhalt, Kontaktbezug entfällt", "frist_bis": None})
        if ausfuehren:
            frappe.db.set_value("PH Sync Protokoll", p, "kontakt", None, update_modified=False)
    return zeilen


def zusammengefuehrt(alt, neu):
    frappe.db.sql("update `tabPH Mail Adresse` set kontakt_name=%s where kontakt_doctype='PH Kontakt' and kontakt_name=%s", (neu, alt))
    frappe.db.sql("update `tabPH Sync Protokoll` set kontakt=%s where kontakt=%s", (neu, alt))
