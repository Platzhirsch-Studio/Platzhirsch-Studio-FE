"""Scheduler-Funktionen von ph_crm (hooks.py scheduler_events). Idempotent, Fehler nur ins Protokoll.

  termin_erinnerungen           stündlich: Erinnerungsmail n Stunden vor bestätigten Terminen
  reservierungen_freigeben      alle 10 min: unbestätigte Website-Buchungen 24 h nach Ablauf → Abgelehnt
  unbeantwortete_anfragen       07:30 Mo–Fr: PH Anfrage „Neu“ älter als n Stunden → PH Aufgabe an Leitung
  aufgaben_erinnerungen         07:00 täglich: fällige/überfällige PH Aufgaben → Benachrichtigung
  meet_raum_anlegen / loeschen  Frappe Meet (optional, Schalter in PH Termin Einstellungen)
  Automationen (Konzept CRM §8.2, Schalter in PH Termin Einstellungen): wiedervorlagen_faellig (R1),
  ruhende_anfragen (R2), termine_ohne_abschluss (R3), vortagesuebersicht (R6), dsgvo_fristen (DSGVO/BAO)
"""

import frappe
from frappe import _
from frappe.utils import add_to_date, now_datetime, nowdate

from ph_crm.ph_crm.doctype.ph_termin_einstellungen.ph_termin_einstellungen import einstellungen


def termin_erinnerungen():
    e = einstellungen()
    if not e["erinnerung_aktiv"]:
        return 0
    from ph_crm.ph_crm.doctype.ph_termin.ph_termin import erinnerung_faellig

    n = 0
    for name in erinnerung_faellig(e["erinnerung_stunden"]):
        try:
            doc = frappe.get_doc("PH Termin", name)
            if doc.mail_senden(e["vorlage_erinnerung"], erzwingen=True):
                doc.db_set("erinnerung_gesendet", now_datetime(), update_modified=False)
                n += 1
            frappe.db.commit()
        except Exception:  # noqa: BLE001
            frappe.db.rollback()
            frappe.log_error(title=f"PH Termin {name}: Erinnerung fehlgeschlagen")
    return n


def reservierungen_freigeben():
    """Unbestätigte Website-Buchungen, deren Reservierung seit > 24 h abgelaufen ist → Abgelehnt
    (Slot ist ab reserviert_bis ohnehin frei; der Datensatz bleibt für verify_termin noch einen Tag)."""
    from ph_crm.utils.workflow import status_setzen

    grenze = add_to_date(now_datetime(), hours=-24)
    namen = frappe.get_all("PH Termin", filters={"status": "Unbestaetigt", "email_verifiziert": 0, "reserviert_bis": ("<", grenze)}, pluck="name")
    for name in namen:
        try:
            doc = frappe.get_doc("PH Termin", name)
            status_setzen(doc, "Abgelehnt", _("Reservierung abgelaufen – E-Mail nicht bestätigt."), storno_grund=_("E-Mail nicht bestätigt"))
            frappe.db.commit()
        except Exception:  # noqa: BLE001
            frappe.db.rollback()
            frappe.log_error(title=f"PH Termin {name}: Freigabe fehlgeschlagen")
    return len(namen)


def unbeantwortete_anfragen():
    e = einstellungen()
    grenze = add_to_date(now_datetime(), hours=-e["anfragen_erinnerung_stunden"])
    offen = frappe.get_all("PH Anfrage", filters={"status": "Neu", "eingang": ("<", grenze)}, fields=["name", "titel", "zugewiesen_an"])
    n = 0
    for a in offen:
        if frappe.db.exists("PH Aufgabe", {"referenz_doctype": "PH Anfrage", "referenz_name": a.name, "status": ("in", ["Offen", "In Arbeit"])}):
            continue
        try:
            frappe.get_doc(
                {
                    "doctype": "PH Aufgabe",
                    "titel": _("Anfrage ohne Reaktion: {0}").format(a.titel or a.name),
                    "beschreibung": _("Die Anfrage ist seit mehr als {0} Stunden unbeantwortet.").format(e["anfragen_erinnerung_stunden"]),
                    "faellig": nowdate(),
                    "prioritaet": "Hoch",
                    "zugewiesen_an": a.zugewiesen_an or e["leitung_user"],
                    "referenz_doctype": "PH Anfrage",
                    "referenz_name": a.name,
                    "quelle": "scheduler",
                }
            ).insert(ignore_permissions=True)
            frappe.db.commit()
            n += 1
        except Exception:  # noqa: BLE001
            frappe.db.rollback()
            frappe.log_error(title=f"PH Anfrage {a.name}: Aufgabe fehlgeschlagen")
    return n


def aufgaben_erinnerungen():
    """Fällige Aufgaben als Desk-Benachrichtigung an die zugewiesene Person (einmal je Tag)."""
    from frappe.desk.doctype.notification_log.notification_log import enqueue_create_notification

    faellig = frappe.get_all("PH Aufgabe", filters={"status": ("in", ["Offen", "In Arbeit"]), "faellig": ("<=", nowdate()), "zugewiesen_an": ("is", "set"), "erinnert_am": ("!=", nowdate())}, fields=["name", "titel", "zugewiesen_an", "faellig"])
    for a in faellig:
        try:
            enqueue_create_notification([a.zugewiesen_an], {"type": "Alert", "document_type": "PH Aufgabe", "document_name": a.name, "subject": _("Aufgabe fällig: {0}").format(a.titel), "from_user": "Administrator"})
            frappe.db.set_value("PH Aufgabe", a.name, "erinnert_am", nowdate(), update_modified=False)
            frappe.db.commit()
        except Exception:  # noqa: BLE001
            frappe.db.rollback()
            frappe.log_error(title=f"PH Aufgabe {a.name}: Erinnerung fehlgeschlagen")
    return len(faellig)


# ── Frappe Meet (Spec B4) – optional ─────────────────────────────────────────


def _meet_zugang():
    e = einstellungen()
    if not e["meet_aktiv"] or not e["meet_basis_url"]:
        return None, None
    token = frappe.conf.get(e["meet_schluesselname"])
    if not token:
        frappe.log_error(title="PH Termin: Meet-Schlüssel fehlt in site_config")
        return None, None
    return e["meet_basis_url"], token


def meet_raum_anlegen(termin):
    """Raum auf der Meet-Site anlegen; Titel ohne Kundenname (öffentliche Vorschau). Gibt meet_url zurück."""
    basis, token = _meet_zugang()
    doc = frappe.get_doc("PH Termin", termin)
    if doc.meet_url:
        return doc.meet_url
    if not basis:
        return None
    try:
        from frappe.integrations.utils import make_post_request

        antwort = make_post_request(
            f"{basis}/api/method/suite.meet.api.meeting.create",
            headers={"Authorization": f"token {token}", "Accept": "application/json"},
            data={"meeting_type": "restricted", "allow_guest": 1, "title": f"Platzhirsch Beratung {doc.referenz}"},
        )
        m = antwort.get("message") if isinstance(antwort, dict) else None
        raum = (m or {}).get("name") or (m or {}).get("id") or (m or {}).get("room")
        if not raum:
            raise ValueError("Meet-Antwort ohne Raum-ID")
        url = f"{basis}/meet/{raum}"
        doc.db_set({"meet_url": url, "meet_raum_id": raum}, notify=True, update_modified=False)
        doc.add_comment("Info", _("Meet-Raum angelegt."))
        frappe.db.commit()
        return url
    except Exception:  # noqa: BLE001
        frappe.log_error(title=f"PH Termin {termin}: Meet-Raum fehlgeschlagen")
        return None


def meet_raum_loeschen(termin):
    basis, token = _meet_zugang()
    doc = frappe.get_doc("PH Termin", termin)
    if not basis or not doc.meet_raum_id:
        return False
    try:
        from frappe.integrations.utils import make_post_request

        make_post_request(f"{basis}/api/method/frappe.client.delete", headers={"Authorization": f"token {token}"}, data={"doctype": "Meet Room", "name": doc.meet_raum_id})
        doc.db_set({"meet_url": None, "meet_raum_id": None}, update_modified=False)
        frappe.db.commit()
        return True
    except Exception:  # noqa: BLE001
        frappe.log_error(title=f"PH Termin {termin}: Meet-Raum löschen fehlgeschlagen")
        return False


def meet_raeume_aufraeumen():
    """Täglich: Räume erledigter/vergangener Videotermine löschen (ende + 2 h, Spec B4 Nr. 4)."""
    grenze = add_to_date(now_datetime(), hours=-2)
    for name in frappe.get_all("PH Termin", filters={"meet_raum_id": ("is", "set"), "ende": ("<", grenze)}, pluck="name"):
        meet_raum_loeschen(name)


# ── Automationen R1–R8 (Konzept CRM §8.2) ───────────────────────────────────


def _melden(user, doctype, name, betreff):
    from frappe.desk.doctype.notification_log.notification_log import enqueue_create_notification

    if user:
        enqueue_create_notification([user], {"type": "Alert", "document_type": doctype, "document_name": name, "subject": betreff, "from_user": "Administrator"})


def wiedervorlagen_faellig():
    """R1: Wiedervorlagen an PH Anfrage (offen) und PH Kontakt → Benachrichtigung (einmal je Tag)."""
    e = einstellungen()
    if not e.get("auto_wiedervorlage", 1):
        return 0
    n = 0
    for a in frappe.get_all("PH Anfrage", filters={"wiedervorlage": ("<=", nowdate()), "status": ("in", ["Neu", "Qualifiziert", "Termin vereinbart", "Angebot"])}, fields=["name", "titel", "zugewiesen_an", "wiedervorlage_notiz", "wiedervorlage_erinnert_am"]):
        if str(a.wiedervorlage_erinnert_am or "") == nowdate():
            continue
        try:
            zusatz = f" – {a.wiedervorlage_notiz}" if a.wiedervorlage_notiz else ""
            _melden(a.zugewiesen_an or e["leitung_user"], "PH Anfrage", a.name, _("Wiedervorlage: {0}").format(a.titel) + zusatz)
            frappe.db.set_value("PH Anfrage", a.name, "wiedervorlage_erinnert_am", nowdate(), update_modified=False)
            frappe.db.commit()
            n += 1
        except Exception:  # noqa: BLE001
            frappe.db.rollback()
            frappe.log_error(title=f"PH Anfrage {a.name}: Wiedervorlage fehlgeschlagen")
    for k in frappe.get_all("PH Kontakt", filters={"wiedervorlage": nowdate()}, fields=["name", "titel", "berater", "wiedervorlage_notiz"]):
        try:
            zusatz = f" – {k.wiedervorlage_notiz}" if k.wiedervorlage_notiz else ""
            _melden(k.berater or e["leitung_user"], "PH Kontakt", k.name, _("Wiedervorlage: {0}").format(k.titel) + zusatz)
            frappe.db.commit()
            n += 1
        except Exception:  # noqa: BLE001
            frappe.db.rollback()
            frappe.log_error(title=f"PH Kontakt {k.name}: Wiedervorlage fehlgeschlagen")
    return n


def ruhende_anfragen():
    """R2: Anfrage länger als Schwelle im selben Status → Aufgabe „Nachfassen“ (Neu deckt
    unbeantwortete_anfragen ab). Merker `ruhend_erinnert` = Status, für den schon erinnert wurde."""
    from frappe.utils import date_diff

    from ph_crm.utils.pipeline import ruhend

    e = einstellungen()
    if not e.get("auto_ruhend", 1):
        return 0
    n = 0
    for a in frappe.get_all("PH Anfrage", filters={"status": ("in", ["Qualifiziert", "Termin vereinbart", "Angebot"])}, fields=["name", "titel", "status", "modified", "zugewiesen_an", "ruhend_erinnert", "kontakt"]):
        if a.ruhend_erinnert == a.status or not ruhend(a.status, date_diff(nowdate(), a.modified), e["ruhe_schwellen"]):
            continue
        try:
            frappe.get_doc({"doctype": "PH Aufgabe", "titel": _("Nachfassen ({0}): {1}").format(_(a.status), a.titel)[:140], "faellig": nowdate(), "prioritaet": "Normal", "zugewiesen_an": a.zugewiesen_an or e["leitung_user"], "referenz_doctype": "PH Anfrage", "referenz_name": a.name, "kontakt": a.kontakt, "quelle": "scheduler"}).insert(ignore_permissions=True)
            frappe.db.set_value("PH Anfrage", a.name, "ruhend_erinnert", a.status, update_modified=False)
            frappe.db.commit()
            n += 1
        except Exception:  # noqa: BLE001
            frappe.db.rollback()
            frappe.log_error(title=f"PH Anfrage {a.name}: Nachfassen fehlgeschlagen")
    return n


def termine_ohne_abschluss():
    """R3: bestätigt, Ende seit > 2 h vorbei, kein Abschluss → Benachrichtigung (einmal je Termin)."""
    e = einstellungen()
    if not e.get("auto_termin_abschluss", 1):
        return 0
    grenze = add_to_date(now_datetime(), hours=-2)
    namen = frappe.get_all("PH Termin", filters={"status": "Bestaetigt", "ende": ("<", grenze), "abschluss_erinnert": ("is", "not set")}, fields=["name", "titel", "berater"])
    for t in namen:
        try:
            _melden(t.berater or e["leitung_user"], "PH Termin", t.name, _("Termin erledigt? Protokoll anlegen: {0}").format(t.titel))
            frappe.db.set_value("PH Termin", t.name, "abschluss_erinnert", now_datetime(), update_modified=False)
            frappe.db.commit()
        except Exception:  # noqa: BLE001
            frappe.db.rollback()
            frappe.log_error(title=f"PH Termin {t.name}: Abschluss-Erinnerung fehlgeschlagen")
    return len(namen)


def vortagesuebersicht():
    """R6: je Berater eine Benachrichtigung über die Termine des nächsten Tages."""
    from frappe.utils import add_days, getdate

    e = einstellungen()
    if not e.get("auto_vortag", 1):
        return 0
    morgen = getdate(add_days(nowdate(), 1))
    termine = frappe.get_all("PH Termin", filters={"status": ("in", ["Unbestaetigt", "Bestaetigt"]), "start": ("between", [f"{morgen} 00:00:00", f"{morgen} 23:59:59"])}, fields=["name", "berater", "modus", "telefon", "plz_ort", "start"], order_by="start asc")
    je = {}
    for t in termine:
        je.setdefault(t.berater or e["leitung_user"], []).append(t)
    for user, liste in je.items():
        if not user:
            continue
        ohne_tel = sum(1 for t in liste if not t.telefon)
        orte = sorted({t.plz_ort for t in liste if t.modus == "Vor Ort" and t.plz_ort})
        teile = [_("Morgen {0} Termine").format(len(liste))]
        if ohne_tel:
            teile.append(_("{0} ohne Telefon").format(ohne_tel))
        if orte:
            teile.append(_("Vor Ort: {0}").format(", ".join(orte)[:80]))
        try:
            _melden(user, "PH Termin", liste[0].name, " – ".join(teile))
        except Exception:  # noqa: BLE001
            frappe.log_error(title=f"PH CRM Vortagesübersicht {user} fehlgeschlagen")
    frappe.db.commit()
    return len(je)


def dsgvo_fristen():
    """Datenschutzanfragen mit Frist ≤ 7 Tage → Leitung; nach Ende der BAO-Aufbewahrung Rest anonymisieren."""
    from frappe.utils import add_days

    from ph_crm.ph_crm.dsgvo import BESTAETIGUNG, ausfuehren

    e = einstellungen()
    for a in frappe.get_all("PH Datenschutzanfrage", filters={"status": ("in", ["Offen", "In Arbeit"]), "frist": ("<=", add_days(nowdate(), 7))}, fields=["name", "titel", "frist", "zugewiesen_an"]):
        try:
            _melden(a.zugewiesen_an or e["leitung_user"], "PH Datenschutzanfrage", a.name, _("DSGVO-Frist {0}: {1}").format(a.frist, a.titel))
        except Exception:  # noqa: BLE001
            frappe.log_error(title=f"PH Datenschutzanfrage {a.name}: Fristhinweis fehlgeschlagen")
    n = 0
    for k in frappe.get_all("PH Kontakt", filters={"anonymisiert_am": ("is", "set"), "aufbewahren_bis": ("<", nowdate())}, pluck="name"):
        try:
            frappe.set_user("Administrator")
            ausfuehren(k, BESTAETIGUNG)
            frappe.db.commit()
            n += 1
        except Exception:  # noqa: BLE001
            frappe.db.rollback()
            frappe.log_error(title=f"PH Kontakt {k}: Nach-Anonymisierung fehlgeschlagen")
    frappe.db.commit()
    return n
