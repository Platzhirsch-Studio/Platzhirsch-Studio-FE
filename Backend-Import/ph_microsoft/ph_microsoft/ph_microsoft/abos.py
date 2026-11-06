"""Graph-Subscriptions (Webhooks) für Postfächer und Kalender: anlegen, erneuern, Benachrichtigungen annehmen.

Ohne `webhook_basis_url` (öffentlich erreichbare HTTPS-Adresse des Frappe-Servers) gibt es keine Abos –
dann arbeitet nur der Delta-Abgleich alle 5 min (Rückfall, Auftrag Punkt 3).
"""

from datetime import datetime, timezone
from urllib.parse import quote

import frappe
from frappe.utils import cint, get_datetime, now_datetime

from ph_microsoft.graph.client import GraphFehler
from ph_microsoft.logik import webhook as W
from ph_microsoft.ph_microsoft.einstellungen import einstellungen, status_setzen
from ph_microsoft.ph_microsoft.graph_dienst import graph_client
from ph_microsoft.ph_microsoft.protokoll import eintrag, festschreiben

WEBHOOK_PFAD = "/api/method/ph_microsoft.api.graph_webhook"


def _jetzt_utc():
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _utc(wert):
    """Graph expirationDateTime '2026-11-07T10:00:00.0000000Z' → naive UTC."""
    try:
        return datetime.strptime(str(wert)[:19], "%Y-%m-%dT%H:%M:%S")
    except (TypeError, ValueError):
        return None


def soll_abos():
    """→ [(art, ressource, change_type, postfach|None, kalender_zuordnung|None)]"""
    e = einstellungen()
    aus = []
    if e["mail_sync_aktiv"]:
        for pf in frappe.get_all("PH Postfach", filters={"aktiv": 1, "abo_aktiv": 1}, fields=["name", "adresse", "richtung"]):
            ordner = ["Inbox"] if pf.richtung != "Ausgang" else []
            ordner += ["SentItems"] if pf.richtung in ("Beide", "Ausgang") else []
            for o in ordner:
                aus.append(("Mail", f"users/{quote(pf.adresse, safe='@')}/mailFolders('{o}')/messages", "created", pf.name, None))
    if e["kalender_sync_aktiv"]:
        for z in frappe.get_all("PH Kalender Zuordnung", filters={"aktiv": 1, "richtung": "Zwei-Wege"}, fields=["name", "outlook_adresse"]):
            aus.append(("Kalender", f"users/{quote(z.outlook_adresse, safe='@')}/events", "created,updated,deleted", None, z.name))
    return aus


def anlegen(art, ressource, change_type, postfach=None, kalender_zuordnung=None):
    e = einstellungen()
    url = e["webhook_basis_url"] + WEBHOOK_PFAD
    geheim = W.neues_client_state()
    ablauf = W.ablauf_neu(_jetzt_utc())
    res = graph_client().post("/subscriptions", json={
        "changeType": change_type, "notificationUrl": url, "lifecycleNotificationUrl": url, "resource": ressource,
        "expirationDateTime": W.iso_utc(ablauf), "clientState": geheim, "latestSupportedTlsVersion": "v1_2",
    })
    doc = frappe.get_doc({
        "doctype": "PH Graph Abo", "titel": f"{art}: {ressource}"[:140], "subscription_id": res["id"], "art": art, "ressource": ressource,
        "change_type": change_type, "postfach": postfach, "kalender_zuordnung": kalender_zuordnung,
        "ablauf": _utc(res.get("expirationDateTime")) or ablauf, "status": "Aktiv", "client_state_hash": W.client_state_hash(geheim),
        "erstellt_am": now_datetime(),
    })
    doc.insert(ignore_permissions=True)
    eintrag("Abo", "Angelegt", "OK", None, "PH Graph Abo", doc.name)
    return doc.name


def erneuern(abo_name):
    a = frappe.get_doc("PH Graph Abo", abo_name)
    ablauf = W.ablauf_neu(_jetzt_utc())
    try:
        res = graph_client().patch(f"/subscriptions/{quote(a.subscription_id)}", json={"expirationDateTime": W.iso_utc(ablauf)})
    except GraphFehler as f:
        a.db_set({"status": "Abgelaufen" if f.status == 404 else "Fehler", "letzter_fehler": f"Graph {f.status} {f.code}"})
        eintrag("Abo", "Erneuern", "Fehler", f"Graph {f.status} {f.code}", "PH Graph Abo", a.name)
        return False
    a.db_set({"ablauf": _utc(res.get("expirationDateTime")) or ablauf, "erneuert_am": now_datetime(), "status": "Aktiv", "letzter_fehler": None})
    return True


def loeschen(abo_name):
    a = frappe.get_doc("PH Graph Abo", abo_name)
    try:
        graph_client().delete(f"/subscriptions/{quote(a.subscription_id)}")
    except GraphFehler as f:
        if f.status != 404:
            a.db_set({"letzter_fehler": f"Löschen: Graph {f.status} {f.code}"})
            return False
    a.db_set({"status": "Geloescht"})
    return True


def pruefen():
    """Stündlich: fehlende Abos anlegen, bald ablaufende erneuern, überzählige löschen."""
    e = einstellungen()
    if not e["webhook_basis_url"].startswith("https://"):
        return
    jetzt = _jetzt_utc()
    vorhanden = {(a.ressource, a.change_type): a for a in frappe.get_all("PH Graph Abo", filters={"status": ("in", ["Aktiv", "Fehler"])}, fields=["name", "ressource", "change_type", "ablauf", "status"])}
    soll = soll_abos()
    soll_keys = {(r, c) for _a, r, c, _p, _k in soll}
    for art, r, c, pf, kz in soll:
        a = vorhanden.get((r, c))
        try:
            if not a:
                anlegen(art, r, c, pf, kz)
            elif a.status == "Fehler" or W.erneuern_noetig(get_datetime(a.ablauf) if a.ablauf else None, jetzt):
                if not erneuern(a.name):
                    anlegen(art, r, c, pf, kz)
        except GraphFehler as f:
            eintrag("Abo", "Anlegen", "Fehler", f"Graph {f.status} {f.code}")
        festschreiben()
    for key, a in vorhanden.items():
        if key not in soll_keys:
            loeschen(a.name)
    frappe.db.sql("update `tabPH Graph Abo` set status='Abgelaufen' where status='Aktiv' and ablauf < %s", (jetzt,))
    status_setzen(letzte_abo_pruefung=now_datetime())
    festschreiben()


def benachrichtigungen_verarbeiten(gueltig):
    """Webhook → je Abo höchstens ein Abhol-Auftrag in der Warteschlange (Delta macht den Rest)."""
    for n in gueltig:
        a = frappe.db.get_value("PH Graph Abo", {"subscription_id": n["subscription_id"]}, ["name", "art", "postfach", "kalender_zuordnung", "benachrichtigungen"], as_dict=True)
        if not a:
            continue
        frappe.db.set_value("PH Graph Abo", a.name, {"letzte_benachrichtigung": now_datetime(), "benachrichtigungen": cint(a.benachrichtigungen) + 1}, update_modified=False)
        if n["lifecycle"] in ("reauthorizationrequired", "subscriptionremoved"):
            frappe.enqueue("ph_microsoft.ph_microsoft.abos.pruefen", queue="short", job_id="ph_ms_abos_pruefen", deduplicate=True, enqueue_after_commit=True)
        if a.art == "Mail" and a.postfach:
            frappe.enqueue("ph_microsoft.ph_microsoft.mail.abholen", queue="long", postfach_name=a.postfach, job_id=f"ph_ms_mail_{a.postfach}", deduplicate=True, enqueue_after_commit=True)
        elif a.art == "Kalender" and a.kalender_zuordnung:
            frappe.enqueue("ph_microsoft.ph_microsoft.kalender.delta_abgleichen", queue="long", zuordnung_name=a.kalender_zuordnung, job_id=f"ph_ms_kal_{a.kalender_zuordnung}", deduplicate=True, enqueue_after_commit=True)
    festschreiben()
