"""Zustell-Ereignisse des Mailanbieters verarbeiten (Resend-Webhook → PH Mail Ereignis → Versandprotokoll/Abo).

Ablauf je Ereignis (idempotent über svix-id = PH Mail Ereignis.ereignis_id):
  1. Protokoll anlegen (ohne Rohbody, nur Typ/Adresse/Nachrichten-ID).
  2. Versandzeile finden: PH Newsletter Versand über nachricht_id, sonst jüngste Zeile der Adresse (≤ 14 Tage).
     Status nur „stärker“ überschreiben (utils/mail_ereignis.status_uebernehmen).
  3. Abo-Folgen: Hard-Bounce/Beschwerde → Abo gesperrt (newsletter.bounce_verarbeiten), Widerruf der Einwilligung.
Gilt auch für Kundenreise-Mails (PH Reise Versand hat keine Nachrichten-ID → nur Abo-/Einwilligungsfolge).
"""

import frappe
from frappe.utils import add_days, now_datetime

from ph_marketing.ph_marketing import newsletter
from ph_marketing.ph_marketing.einstellungen import einstellungen
from ph_marketing.utils.mail_ereignis import status_uebernehmen, versand_status
from ph_marketing.utils.token import email_normalisieren

DT = "PH Mail Ereignis"


def _versandzeile(email, nachricht_id):
    if nachricht_id:
        n = frappe.db.get_value("PH Newsletter Versand", {"nachricht_id": nachricht_id}, ["name", "status"], as_dict=True)
        if n:
            return n
    return frappe.db.get_value(
        "PH Newsletter Versand",
        {"email": email, "gesendet_am": (">", add_days(now_datetime(), -14))},
        ["name", "status"],
        as_dict=True,
        order_by="gesendet_am desc",
    )


def verarbeiten(ereignis_id, e):
    """e = utils.mail_ereignis.ereignis_abbilden(payload). → Ergebnis-Text."""
    if frappe.db.exists(DT, {"ereignis_id": ereignis_id}):
        return "doppelt"
    ergebnisse = []
    versand_name = None
    for email in e["emails"] or [None]:
        email = email_normalisieren(email) if email else None
        if e["art"] in ("ignoriert", "unbekannt") or not email:
            ergebnisse.append(e["art"])
            continue
        zeile = _versandzeile(email, e.get("nachricht_id"))
        neu = versand_status(e["art"], e.get("bounce_typ"))
        if zeile:
            versand_name = zeile.name
            status = status_uebernehmen(zeile.status, neu)
            werte = {"ereignis_letztes": e["typ"], "ereignis_am": now_datetime()}
            if status != zeile.status:
                werte["status"] = status
            if e["art"] == "zugestellt":
                werte["zugestellt_am"] = now_datetime()
            if e["art"] == "bounce":
                werte["bounce_typ"] = e.get("bounce_typ")
                werte["grund"] = (e.get("grund") or "")[:140] or None
            frappe.db.set_value("PH Newsletter Versand", zeile.name, werte, update_modified=False)
        if e["art"] in ("bounce", "beschwerde"):
            folge = newsletter.bounce_verarbeiten(email, e["art"], e.get("bounce_typ"), e.get("grund"))
            if e["art"] == "beschwerde":
                # Beschwerde = Widerspruch für jede werbliche Mail, nicht nur Newsletter (TKG § 174 Abs. 5)
                from ph_marketing.ph_marketing import einwilligung as ew

                for zweck in ("einladungen", "rueckmeldung", "pflege_nachkauf", "merkliste_erinnerung", "planer_erinnerung"):
                    ew.widerrufen(email, zweck, kanal="beschwerde", grund="Spam-Meldung beim Empfänger")
            ergebnisse.append(f"{e['art']}:{folge or 'gezaehlt'}")
        else:
            ergebnisse.append(e["art"])
    ergebnis = ",".join(ergebnisse)[:140]
    frappe.get_doc({
        "doctype": DT,
        "ereignis_id": str(ereignis_id)[:140],
        "typ": e["typ"][:80],
        "art": e["art"] if e["art"] in ("gesendet", "zugestellt", "verzoegert", "bounce", "beschwerde", "fehler", "abgemeldet", "ignoriert") else "unbekannt",
        "bounce_typ": e.get("bounce_typ"),
        "email": (e["emails"] or [None])[0],
        "nachricht_id": (e.get("nachricht_id") or "")[:140] or None,
        "empfangen_am": now_datetime(),
        "ergebnis": ergebnis,
        "versand": versand_name,
        "grund": (e.get("grund") or "")[:140] or None,
    }).insert(ignore_permissions=True)
    return ergebnis


def aufraeumen():
    """Täglich: Mail-Ereignisse nach N Tagen löschen (Datenminimierung; Folgen stehen am Abo/Versand)."""
    grenze = add_days(now_datetime(), -einstellungen()["mail_ereignis_aufbewahren_tage"])
    namen = frappe.get_all(DT, filters={"empfangen_am": ("<", grenze)}, pluck="name", limit=5000)
    for n in namen:
        frappe.delete_doc(DT, n, ignore_permissions=True, force=True)
    frappe.db.commit()
    return len(namen)
