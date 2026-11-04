"""Zeitgesteuerte Jobs von ph_personal (hooks.scheduler_events). Idempotent, Fehler nur protokolliert."""

import frappe
from frappe import _
from frappe.utils import add_days, getdate, nowdate


def loeschfristen_ausfuehren():
    """Täglich 03:15: Bewerbungen mit abgelaufener Löschfrist – Unterlagen löschen, pseudonymisieren.
    Nur abgeschlossene Bewerbungen (Abgesagt/Zurueckgezogen), nie offene oder eingestellte."""
    from ph_personal.ph_personal.doctype.ph_bewerbung.ph_bewerbung import unterlagen_entfernen

    faellig = frappe.get_all(
        "PH Bewerbung",
        filters={"loeschfrist": ("<=", nowdate()), "pseudonymisiert": 0, "status": ("in", ["Abgesagt", "Zurueckgezogen"])},
        pluck="name",
    )
    anzahl = 0
    for name in faellig:
        try:
            doc = frappe.get_doc("PH Bewerbung", name)
            if doc.einwilligung_evidenz and doc.einwilligung_evidenz_bis and getdate(doc.einwilligung_evidenz_bis) > getdate(nowdate()):
                continue
            unterlagen_entfernen(doc, grund=_("Löschfrist {0}").format(frappe.format(doc.loeschfrist, {"fieldtype": "Date"})))
            frappe.db.commit()
            anzahl += 1
        except Exception:  # noqa: BLE001
            frappe.db.rollback()
            frappe.log_error(title=f"PH Personal: Löschlauf {name} fehlgeschlagen")
    return anzahl


def abgelaufene_stellen():
    """Täglich 04:00: Aktive Stellen mit gueltig_bis < heute → Pausiert (Website nimmt sie ohnehin nicht mehr),
    Kommentar, Website-Cache erneuern."""
    from ph_personal.ph_personal.website import revalidate_career

    abgelaufen = frappe.get_all("PH Stelle", filters={"status": "Aktiv", "gueltig_bis": ("<", nowdate())}, pluck="name")
    for name in abgelaufen:
        try:
            frappe.db.set_value("PH Stelle", name, {"status": "Pausiert", "workflow_state": "PH Pausiert"})
            frappe.get_doc("PH Stelle", name).add_comment("Info", _("Gültigkeit abgelaufen – automatisch pausiert. Zum erneuten Veröffentlichen „Gültig bis“ verlängern und wieder aktivieren."))
            frappe.db.commit()
        except Exception:  # noqa: BLE001
            frappe.db.rollback()
            frappe.log_error(title=f"PH Personal: Stelle {name} konnte nicht pausiert werden")
    if abgelaufen:
        try:
            revalidate_career(grund="abgelaufene Stellen")
        except Exception:  # noqa: BLE001
            frappe.log_error(title="PH Personal: Revalidate nach Ablauf fehlgeschlagen")
    return len(abgelaufen)


def loeschfrist_vorwarnung():
    """Montags 07:00: ToDo an die Leitung für Bewerbungen, deren Löschfrist in den nächsten 14 Tagen fällt
    (Gelegenheit, eine Einwilligung zur Evidenzhaltung einzuholen)."""
    bald = frappe.get_all(
        "PH Bewerbung",
        filters={"loeschfrist": ("between", [nowdate(), add_days(nowdate(), 14)]), "pseudonymisiert": 0, "einwilligung_evidenz": 0},
        fields=["name", "titel", "loeschfrist"],
    )
    if not bald:
        return 0
    leitung = frappe.get_all("Has Role", filters={"role": "PH Personal Leitung", "parenttype": "User"}, pluck="parent")
    leitung = [u for u in leitung if frappe.db.get_value("User", u, "enabled")]
    if not leitung:
        return 0
    beschreibung = _("Löschfrist in den nächsten 14 Tagen:") + "\n" + "\n".join(f"- {b.name} {b.titel} ({b.loeschfrist})" for b in bald)
    try:
        from frappe.desk.form.assign_to import add

        add({"assign_to": leitung[:3], "doctype": "Report", "name": "PH Loeschfristen", "description": beschreibung[:2000], "date": nowdate()})
        frappe.db.commit()
    except Exception:  # noqa: BLE001
        frappe.log_error(title="PH Personal: Vorwarnung Löschfrist fehlgeschlagen")
    return len(bald)


def offene_zeitbuchungen_hinweis():
    """Täglich 23:30: offene Buchungen (nur Kommen) des Tages kommentieren – Mitarbeiter trägt „Gehen“ nach."""
    offen = frappe.get_all("PH Zeiterfassung", filters={"status": "Offen", "datum": ("<=", nowdate())}, pluck="name")
    for name in offen:
        try:
            frappe.get_doc("PH Zeiterfassung", name).add_comment("Info", _("Buchung ohne „Gehen“ – bitte ergänzen."))
        except Exception:  # noqa: BLE001
            pass
    frappe.db.commit()
    return len(offen)
