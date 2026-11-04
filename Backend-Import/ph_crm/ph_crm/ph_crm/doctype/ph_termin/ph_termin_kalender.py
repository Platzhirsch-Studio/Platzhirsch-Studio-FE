"""Datenquelle der Kalenderansicht (ph_termin_calendar.js)."""

import frappe
from frappe.desk.calendar import get_event_conditions

FARBEN = {"Unbestaetigt": "#b45309", "Bestaetigt": "#15803d", "Erledigt": "#1d4ed8", "Storniert": "#9ca3af", "Abgelehnt": "#b91c1c", "Nicht erschienen": "#7c3aed"}


@frappe.whitelist()
def get_events(start, end, filters=None):
    conditions = get_event_conditions("PH Termin", filters)
    zeilen = frappe.db.sql(
        f"""select name, titel, start, ende, status, modus, berater from `tabPH Termin`
            where start <= %(end)s and ende >= %(start)s and status not in ('Storniert', 'Abgelehnt') {conditions}
            order by start""",
        {"start": start, "end": end},
        as_dict=True,
    )
    for z in zeilen:
        z["color"] = FARBEN.get(z.status, "#30373e")
        z["allDay"] = 0
    return zeilen
