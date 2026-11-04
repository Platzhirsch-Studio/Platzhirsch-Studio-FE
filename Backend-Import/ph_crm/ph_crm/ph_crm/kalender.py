"""Kalender-Logik der Terminbuchung: freie Zeiten, Kollisionsprüfung mit Sperre, Event-Anbindung.

Gleiche Regeln wie die Website (src/lib/booking/slots.js), s. ph_crm.utils.slots. Hier nur der
Frappe-Teil: Terminarten, Verfügbarkeiten, bestehende PH Termine, Frappe-Events, Feiertage.
"""

from datetime import datetime, timedelta

import frappe
from frappe import _
from frappe.utils import get_datetime, getdate, now_datetime

from ph_core.api import ApiFehler
from ph_crm.ph_crm.doctype.ph_termin_einstellungen.ph_termin_einstellungen import einstellungen, ist_geschlossen, oeffnungsfenster
from ph_crm.ph_crm.doctype.ph_verfuegbarkeit.ph_verfuegbarkeit import berater_mit_verfuegbarkeit, fenster
from ph_crm.utils.slots import Terminregel, blockiert, freie_starts, start_erlaubt, ueberlappt

POOL = None  # „kein bestimmter Berater“ – Studio-Öffnungszeiten als Rückfall


def terminart_laden(key, aktiv_pflicht=True):
    if not key or not frappe.db.exists("PH Terminart", key):
        raise ApiFehler("not_found", 404, _("Terminart unbekannt."))
    doc = frappe.get_cached_doc("PH Terminart", key)
    if aktiv_pflicht and not doc.aktiv:
        raise ApiFehler("not_found", 404, _("Terminart nicht buchbar."))
    return doc


def kandidaten_berater(terminart, modus, gewuenscht=None):
    """Berater, die für diese Terminart in Frage kommen; [None] = Studio-Pool ohne Verfügbarkeiten."""
    liste = terminart.berater_liste() or berater_mit_verfuegbarkeit(modus)
    if gewuenscht:
        liste = [b for b in liste if b == gewuenscht]
    return liste or [POOL]


def _fenster(berater, tag, modus):
    if berater is POOL:
        return oeffnungsfenster(tag)
    return fenster(berater, tag, modus)


def belegungen(von, bis, ausser=None, for_update=False):
    """PH Termine im Zeitraum → Liste (berater, (block_von, block_bis)). berater None blockiert alle.
    for_update sperrt die Zeilen bis zum Commit (create_termin, reschedule)."""
    rand = timedelta(hours=4)  # Puffer/Anfahrt sind nie länger
    sql = """select name, start, ende, berater, status, email_verifiziert, reserviert_bis,
                    ifnull(anfahrt_min, 0) as anfahrt_min, ifnull(puffer_min, 0) as puffer_min
             from `tabPH Termin`
             where ende > %(von)s and start < %(bis)s and status not in ('Storniert', 'Abgelehnt')
               and name != %(ausser)s"""
    if for_update:
        sql += " for update"
    jetzt = now_datetime()
    out = []
    for t in frappe.db.sql(sql, {"von": von - rand, "bis": bis + rand, "ausser": ausser or ""}, as_dict=True):
        if not blockiert(t.status, t.email_verifiziert, get_datetime(t.reserviert_bis) if t.reserviert_bis else None, jetzt):
            continue
        block = (get_datetime(t.start) - timedelta(minutes=t.anfahrt_min), get_datetime(t.ende) + timedelta(minutes=t.puffer_min))
        out.append((t.berater, block))
    return out


def event_belegungen(von, bis, berater_liste):
    """Frappe-Events der Berater (Kalender „Busy“): status Open, nicht von PH Termin erzeugt."""
    user = [b for b in berater_liste if b]
    if not user:
        return []
    zeilen = frappe.get_all(
        "Event",
        filters={"owner": ("in", user), "status": "Open", "starts_on": ("<", bis), "ends_on": (">", von)},
        fields=["name", "owner", "starts_on", "ends_on", "all_day"],
    )
    out = []
    for z in zeilen:
        if frappe.db.exists("Event Participants", {"parent": z.name, "reference_doctype": "PH Termin"}):
            continue  # von PH Termin erzeugt – zählt bereits über belegungen()
        s, e = get_datetime(z.starts_on), get_datetime(z.ends_on or z.starts_on)
        if z.all_day:
            s = datetime.combine(s.date(), datetime.min.time())
            e = datetime.combine(e.date(), datetime.max.time())
        out.append((z.owner, (s, e)))
    return out


def _belegt_fuer(berater, alle):
    return [block for b, block in alle if b is None or berater is None or b == berater]


def freie_slots(terminart, modus, von_tag, bis_tag, berater=None, jetzt=None, ausser=None):
    """[{start, ende, berater:[…]}] in Site-Zeit (naive datetimes)."""
    jetzt = jetzt or now_datetime()
    regel = terminart.regel()
    e = einstellungen()
    von_tag, bis_tag = getdate(von_tag), getdate(bis_tag)
    horizont = jetzt.date() + timedelta(days=int(regel.max_tage_voraus or 60))
    if bis_tag > horizont:
        bis_tag = horizont
    if (bis_tag - von_tag).days > e["max_abfrage_tage"] or bis_tag < von_tag:
        raise ApiFehler("invalid", 400, _("Zeitraum zu groß oder ungültig."))
    kandidaten = kandidaten_berater(terminart, modus, berater)
    von_dt = datetime.combine(von_tag, datetime.min.time())
    bis_dt = datetime.combine(bis_tag, datetime.max.time())
    alle = belegungen(von_dt, bis_dt, ausser=ausser) + event_belegungen(von_dt, bis_dt, kandidaten)
    ergebnis = {}
    tag = von_tag
    while tag <= bis_tag:
        if not ist_geschlossen(tag):
            for b in kandidaten:
                for start in freie_starts(tag, _fenster(b, tag, modus), regel, _belegt_fuer(b, alle), jetzt):
                    ergebnis.setdefault(start, set())
                    if b:
                        ergebnis[start].add(b)
        tag += timedelta(days=1)
    return [{"start": s, "ende": s + regel.dauer, "berater": sorted(ergebnis[s])} for s in sorted(ergebnis)]


def slot_pruefen(terminart, modus, start, berater=None, ausser=None, for_update=False, jetzt=None):
    """Prüft einen Wunschtermin; gibt den freien Berater (oder None im Pool) zurück.
    Fehler: outside_window (422) wenn außerhalb Raster/Fenster/Vorlauf, slot_taken (409) bei Kollision."""
    jetzt = jetzt or now_datetime()
    regel: Terminregel = terminart.regel()
    if ist_geschlossen(start.date()) or start.date() > jetzt.date() + timedelta(days=int(regel.max_tage_voraus or 60)):
        raise ApiFehler("outside_window", 422, _("Zeitpunkt außerhalb des buchbaren Zeitraums."))
    kandidaten = kandidaten_berater(terminart, modus, berater)
    passend = [b for b in kandidaten if start_erlaubt(start, _fenster(b, start.date(), modus), regel, jetzt)]
    if not passend:
        raise ApiFehler("outside_window", 422, _("Zeitpunkt außerhalb der Verfügbarkeit."))
    block = regel.block(start)
    alle = belegungen(block[0], block[1], ausser=ausser, for_update=for_update) + event_belegungen(block[0], block[1], passend)
    for b in passend:
        if not any(ueberlappt(block, x) for x in _belegt_fuer(b, alle)):
            return b
    raise ApiFehler("slot_taken", 409, _("Dieser Zeitpunkt ist inzwischen vergeben."))
