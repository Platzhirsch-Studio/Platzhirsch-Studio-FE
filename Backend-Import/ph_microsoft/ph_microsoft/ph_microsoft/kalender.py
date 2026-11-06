"""Zwei-Wege-Abgleich PH Termin / PH Montageauftrag / PH Serviceeinsatz ↔ Outlook-Kalender der Mitarbeiter.

* Backoffice → Outlook: doc_events (on_update/on_trash) → Warteschlange → dokument_abgleichen(); je zugeordnetem
  Mitarbeiter mit aktiver PH Kalender Zuordnung ein Outlook-Ereignis (transactionId + Erweiterungseigenschaft
  „DocType|Name“), Verknüpfung in PH Graph Verknuepfung. Terminart Video → Teams-Besprechung (isOnlineMeeting),
  Link landet in PH Termin.meet_url, wenn dort leer.
* Outlook → Backoffice: Delta (calendarView/delta, alle 5 min + Webhook) → Konfliktregel logik/kalender_regeln.konflikt.
  Fremde Outlook-Termine des Mitarbeiters werden (Einstellung) als private Frappe-Events „Belegt (Outlook)“
  gespiegelt – ph_crm zählt Events der Berater bereits als belegt (kalender.event_belegungen), ohne Betreff/Inhalt.
* Frei/Belegt live: frei_belegt() über getSchedule; Hook `ph_crm_belegungen` (Angebot an ph_crm).
"""

from datetime import datetime, timedelta
from urllib.parse import quote

import frappe
from frappe import _
from frappe.utils import cint, get_datetime, now_datetime, nowdate

from ph_microsoft.graph.client import DeltaAbgelaufen, GraphFehler
from ph_microsoft.logik import kalender_regeln as R
from ph_microsoft.ph_microsoft.einstellungen import einstellungen, kalender_doctypes
from ph_microsoft.ph_microsoft.graph_dienst import PREFER_WIEN, graph_client
from ph_microsoft.ph_microsoft.protokoll import eintrag, festschreiben

PREFER_DELTA = {"Prefer": 'outlook.timezone="Europe/Vienna", odata.maxpagesize=50, IdType="ImmutableId"'}
BELEGT_TITEL = "Belegt (Outlook)"


def _u(adresse):
    return f"/users/{quote(str(adresse), safe='@')}"


def zuordnung(user):
    if not user:
        return None
    z = frappe.db.get_value("PH Kalender Zuordnung", {"user": user, "aktiv": 1}, ["name", "user", "outlook_adresse", "richtung", "belegt_spiegeln"], as_dict=True)
    return z if z and z.outlook_adresse else None


def _daten(doctype, name):
    doc = frappe.get_doc(doctype, name)
    d = doc.as_dict()
    return doc, d


def verknuepfungen(doctype, name, art="Kalender"):
    return frappe.get_all("PH Graph Verknuepfung", filters={"art": art, "referenz_doctype": doctype, "referenz_name": name, "status": ("!=", "Geloescht")}, fields=["*"])


def _verknuepfung_speichern(werte, name=None):
    if name:
        frappe.db.set_value("PH Graph Verknuepfung", name, werte, update_modified=True)
        return name
    doc = frappe.get_doc({"doctype": "PH Graph Verknuepfung", **werte})
    doc.insert(ignore_permissions=True)
    return doc.name


# ── Backoffice → Outlook ──────────────────────────────────────────────────────────────────────
def dokument_abgleichen(doctype, name):
    if doctype not in kalender_doctypes():
        return
    if not frappe.db.exists(doctype, name):
        return entfernen(doctype, name)
    e = einstellungen()
    doc, d = _daten(doctype, name)
    ev = R.ereignis(doctype, d, name)
    if ev and not e["teams_fuer_video"]:
        ev["online"] = False
    soll = set(R.benutzer(doctype, d)) if ev and not ev["abgesagt"] else set()
    vorhandene = {v.user: v for v in verknuepfungen(doctype, name)}
    for user, v in vorhandene.items():
        if user not in soll:
            _loeschen(v)
    for user in sorted(soll):
        z = zuordnung(user)
        if not z:
            continue
        try:
            _push(doctype, name, ev, user, z, vorhandene.get(user))
        except GraphFehler as f:
            eintrag("Kalender", "Übertragen nach Outlook", "Fehler", f"Graph {f.status} {f.code}", doctype, name, benutzer=user)
    festschreiben()


def _push(doctype, name, ev, user, z, v=None, erzwingen=False):
    g = graph_client()
    h = R.inhalt_hash(ev)
    titel = f"{doctype} {name} → {z.outlook_adresse}"[:140]
    if v and v.graph_id:
        gleich = v.inhalt_hash == h and v.start and v.ende and get_datetime(v.start) == ev["start"] and get_datetime(v.ende) == ev["ende"]
        if gleich and not erzwingen:
            return v.name
        try:
            res = g.patch(f"{_u(z.outlook_adresse)}/events/{quote(v.graph_id)}", json=R.graph_event(ev, doctype, name, user, neu=False), headers=PREFER_WIEN)
        except GraphFehler as f:
            if f.status != 404:
                raise
            res = None  # in Outlook gelöscht → neu anlegen (Backoffice gewinnt beim Inhalt)
        if res is not None:
            return _nach_push(doctype, name, ev, user, z, res, h, titel, v.name)
    res = g.post(f"{_u(z.outlook_adresse)}/calendar/events", json=R.graph_event(ev, doctype, name, user, neu=True), headers=PREFER_WIEN)
    return _nach_push(doctype, name, ev, user, z, res, h, titel, v.name if v else None)


def _nach_push(doctype, name, ev, user, z, res, h, titel, vname):
    join = ((res or {}).get("onlineMeeting") or {}).get("joinUrl")
    werte = {
        "titel": titel, "art": "Kalender", "referenz_doctype": doctype, "referenz_name": name, "user": user,
        "outlook_adresse": z.outlook_adresse, "graph_id": res.get("id"), "ical_uid": res.get("iCalUId"),
        "change_key": res.get("changeKey"), "inhalt_hash": h, "start": ev["start"], "ende": ev["ende"],
        "teams_link": join, "status": "Aktiv", "letzte_sync": now_datetime(), "letzter_fehler": None,
    }
    vname = _verknuepfung_speichern(werte, vname)
    if join and doctype == "PH Termin" and not frappe.db.get_value("PH Termin", name, "meet_url"):
        frappe.db.set_value("PH Termin", name, "meet_url", join, update_modified=False)
    eintrag("Kalender", "Übertragen nach Outlook", "OK", "Teams-Besprechung angelegt" if join else None, doctype, name, benutzer=user)
    return vname


def _loeschen(v, protokollieren=True):
    try:
        graph_client().delete(f"{_u(v.outlook_adresse)}/events/{quote(v.graph_id)}")
    except GraphFehler as f:
        if f.status != 404:
            frappe.db.set_value("PH Graph Verknuepfung", v.name, {"status": "Fehler", "letzter_fehler": f"Löschen: Graph {f.status} {f.code}"})
            return
    frappe.db.set_value("PH Graph Verknuepfung", v.name, {"status": "Geloescht", "letzte_sync": now_datetime()})
    if protokollieren:
        eintrag("Kalender", "In Outlook entfernt", "OK", None, v.referenz_doctype, v.referenz_name, benutzer=v.user)


def entfernen(doctype, name):
    for v in verknuepfungen(doctype, name):
        _loeschen(v)
    festschreiben()


# ── Outlook → Backoffice ──────────────────────────────────────────────────────────────────────
def _verknuepfung_zu(graph_id):
    if not graph_id:
        return None
    n = frappe.db.get_value("PH Graph Verknuepfung", {"graph_id": graph_id, "art": ("in", ["Kalender", "Belegt"])}, "name")
    return frappe.get_doc("PH Graph Verknuepfung", n) if n else None


def delta_abgleichen(zuordnung_name):
    e = einstellungen()
    if not e["kalender_sync_aktiv"]:
        return 0
    z = frappe.get_doc("PH Kalender Zuordnung", zuordnung_name)
    if not cint(z.aktiv):
        return 0
    g = graph_client()
    jetzt = datetime.now()
    params = {
        "startDateTime": (jetzt - timedelta(days=e["sync_tage_vergangenheit"])).strftime("%Y-%m-%dT00:00:00"),
        "endDateTime": (jetzt + timedelta(days=e["sync_tage_zukunft"])).strftime("%Y-%m-%dT23:59:59"),
    }
    fehler, anzahl = None, 0
    for _versuch in range(2):
        link = z.delta_link
        try:
            items, neu = g.delta(link or f"{_u(z.outlook_adresse)}/calendarView/delta", params=None if link else params, headers=PREFER_DELTA)
        except DeltaAbgelaufen:
            z.delta_link = None
            continue
        except GraphFehler as f:
            fehler, items, neu = f"Graph {f.status} {f.code}", [], z.delta_link
        for ev in items:
            try:
                anzahl += 1 if ereignis_verarbeiten(z, ev) else 0
            except Exception:  # noqa: BLE001
                frappe.log_error(title=f"PH Microsoft: Kalenderereignis für {z.user} nicht verarbeitet")
                fehler = "Verarbeitung fehlgeschlagen (Error Log)"
        z.db_set({"delta_link": neu, "letzte_sync": now_datetime(), "status": "Fehler" if fehler else "Aktiv", "letzter_fehler": fehler}, update_modified=False)
        break
    if anzahl or fehler:
        eintrag("Kalender", "Abgleich aus Outlook", "Fehler" if fehler else "OK", fehler, "PH Kalender Zuordnung", z.name, benutzer=z.user, anzahl=anzahl)
    festschreiben()
    return anzahl


def ereignis_verarbeiten(z, ev):
    """→ True, wenn etwas geändert wurde."""
    v = _verknuepfung_zu(ev.get("id"))
    if "@removed" in ev:
        if not v:
            return False
        if v.art == "Belegt":
            return _belegt_entfernen(v)
        if v.status == "Aktiv":
            v.db_set({"status": "Konflikt", "letzter_fehler": _("In Outlook gelöscht")})
            _rueckmeldung(v, _("Termin in Outlook gelöscht"), _("{0} hat den Outlook-Eintrag zu {1} gelöscht. Der Vorgang ist unverändert – bitte prüfen (absagen oder neu übertragen).").format(z.user, v.referenz_name))
            eintrag("Kalender", "In Outlook gelöscht", "Konflikt", None, v.referenz_doctype, v.referenz_name, benutzer=z.user)
            return True
        return False
    if v and v.art == "Kalender":
        return _eigenes_ereignis(z, v, ev)
    if not v and (R.EXT_PROP_ID in str(ev.get("singleValueExtendedProperties") or "") or R.KATEGORIE in (ev.get("categories") or [])):
        return False  # eigenes Ereignis, Verknüpfung (noch) unbekannt – nicht als fremd spiegeln
    if cint(z.belegt_spiegeln) and einstellungen()["belegt_als_event"]:
        return _belegt_spiegeln(z, ev, v)
    return False


def _eigenes_ereignis(z, v, ev):
    dt, name = v.referenz_doctype, v.referenz_name
    if not frappe.db.exists(dt, name):
        _loeschen(v)
        return True
    if z.richtung != "Zwei-Wege":
        return False
    _doc, d = _daten(dt, name)
    bo = R.zeitraum(dt, d)
    ol = (R.graph_zeit_lesen(ev.get("start")), R.graph_zeit_lesen(ev.get("end")))
    gesp = (get_datetime(v.start) if v.start else None, get_datetime(v.ende) if v.ende else None)
    regel = R.konflikt(gesp, bo, ol, R.outlook_inhalt_hash(ev), v.inhalt_hash)
    ev_soll = R.ereignis(dt, d, name)
    if ev_soll and not einstellungen()["teams_fuer_video"]:
        ev_soll["online"] = False
    if regel["aktion"] == "outlook_zeit_uebernehmen":
        if _zeit_uebernehmen(dt, name, ol):
            v.db_set({"start": ol[0], "ende": ol[1], "change_key": ev.get("changeKey"), "letzte_sync": now_datetime(), "status": "Aktiv"})
            if einstellungen()["aufgabe_bei_verschiebung"]:
                _rueckmeldung(v, _("Termin in Outlook verschoben"), _("{0} hat {1} {2} in Outlook auf {3}–{4} verschoben. Das Backoffice wurde angepasst – Kunde/Team informieren?").format(z.user, dt, name, ol[0].strftime("%d.%m.%Y %H:%M"), ol[1].strftime("%H:%M")))
            eintrag("Kalender", "Zeit aus Outlook übernommen", "OK", None, dt, name, benutzer=z.user, kontakt=d.get("kontakt"))
            if regel["inhalt_pushen"] and ev_soll:
                ev_soll["start"], ev_soll["ende"] = ol
                _push(dt, name, ev_soll, z.user, z, frappe.get_doc("PH Graph Verknuepfung", v.name), erzwingen=True)
            return True
        regel = {"aktion": "backoffice_pushen", "aufgabe": "nicht_uebernommen", "inhalt_pushen": True}
    if regel["aktion"] == "backoffice_pushen" or regel["inhalt_pushen"]:
        if ev_soll and not ev_soll["abgesagt"]:
            _push(dt, name, ev_soll, z.user, z, frappe.get_doc("PH Graph Verknuepfung", v.name), erzwingen=True)
        if regel["aufgabe"]:
            _rueckmeldung(v, _("Kalender-Konflikt"), _("Outlook-Änderung von {0} an {1} {2} wurde nicht übernommen (Backoffice gewinnt). Bitte klären.").format(z.user, dt, name))
            eintrag("Kalender", "Konflikt", "Konflikt", regel["aufgabe"], dt, name, benutzer=z.user, kontakt=d.get("kontakt"))
        return True
    return False


def _zeit_uebernehmen(doctype, name, ol):
    if not ol[0] or not ol[1]:
        return False
    frappe.db.savepoint("ph_ms_zeit")
    try:
        doc = frappe.get_doc(doctype, name)
        doc.update(R.zeit_felder(doctype, ol[0], ol[1]))
        doc.flags.ph_microsoft_sync = True
        doc.flags.ignore_permissions = True
        doc.save()
        return True
    except Exception:  # noqa: BLE001 – Validierung des Vorgangs (Kollision, Status) → Backoffice gewinnt
        frappe.db.rollback(save_point="ph_ms_zeit")
        frappe.log_error(title=f"PH Microsoft: Outlook-Zeit für {doctype} {name} nicht übernommen")
        return False


def _rueckmeldung(v, titel, text):
    """Rückmeldung als PH Aufgabe (ph_crm), sonst ToDo – an den Ersteller des Vorgangs, sonst den Mitarbeiter."""
    try:
        owner = frappe.db.get_value(v.referenz_doctype, v.referenz_name, "owner") if frappe.db.exists(v.referenz_doctype, v.referenz_name) else None
    except Exception:  # noqa: BLE001
        owner = None
    an = owner if owner and owner not in ("Administrator", "Guest", v.user) else v.user
    aufgabe(v.referenz_doctype, v.referenz_name, an, titel, text)


def aufgabe(doctype, name, an_user, titel, text):
    if frappe.db.exists("DocType", "PH Aufgabe"):
        try:
            werte = {"doctype": "PH Aufgabe", "titel": str(titel)[:140], "status": "Offen", "prioritaet": "Hoch", "faellig": nowdate(),
                     "zugewiesen_an": an_user, "referenz_doctype": doctype, "referenz_name": name, "quelle": "scheduler", "beschreibung": text}
            if doctype and frappe.db.exists(doctype, name) and frappe.get_meta(doctype).has_field("kontakt"):
                werte["kontakt"] = frappe.db.get_value(doctype, name, "kontakt")
            return frappe.get_doc(werte).insert(ignore_permissions=True).name
        except Exception:  # noqa: BLE001
            frappe.log_error(title="PH Microsoft: PH Aufgabe nicht angelegt – ToDo als Rückfall")
    return frappe.get_doc({"doctype": "ToDo", "description": f"{titel}\n{text}", "allocated_to": an_user, "reference_type": doctype, "reference_name": name, "priority": "High", "date": nowdate()}).insert(ignore_permissions=True).name


# ── Belegt-Spiegel (ohne Inhalt) ──────────────────────────────────────────────────────────────
def _belegt_spiegeln(z, ev, v=None):
    if not R.ist_fremd_belegt(ev):
        return _belegt_entfernen(v) if v else False
    s, e = R.graph_zeit_lesen(ev.get("start")), R.graph_zeit_lesen(ev.get("end"))
    if not s or not e:
        return False
    werte = {"starts_on": s, "ends_on": e, "all_day": 1 if ev.get("isAllDay") else 0}
    if v and v.frappe_event and frappe.db.exists("Event", v.frappe_event):
        frappe.db.set_value("Event", v.frappe_event, werte, update_modified=False)
        v.db_set({"start": s, "ende": e, "letzte_sync": now_datetime()})
        return True
    event = frappe.get_doc({"doctype": "Event", "subject": BELEGT_TITEL, "event_type": "Private", "status": "Open", "send_reminder": 0, **werte})
    event.flags.ignore_permissions = True
    event.insert(ignore_permissions=True)
    frappe.db.set_value("Event", event.name, "owner", z.user, update_modified=False)
    _verknuepfung_speichern({"titel": f"{BELEGT_TITEL} {z.user}"[:140], "art": "Belegt", "user": z.user, "outlook_adresse": z.outlook_adresse, "graph_id": ev.get("id"),
                             "frappe_event": event.name, "start": s, "ende": e, "status": "Aktiv", "letzte_sync": now_datetime(), "referenz_doctype": "Event", "referenz_name": event.name},
                            v.name if v else None)
    return True


def _belegt_entfernen(v):
    if v.frappe_event and frappe.db.exists("Event", v.frappe_event):
        frappe.delete_doc("Event", v.frappe_event, ignore_permissions=True, force=True)
    frappe.db.set_value("PH Graph Verknuepfung", v.name, {"status": "Geloescht", "frappe_event": None, "letzte_sync": now_datetime()})
    return True


# ── Frei/Belegt live ──────────────────────────────────────────────────────────────────────────
def frei_belegt(benutzer, von, bis):
    """benutzer: Liste Frappe-User → {user: [{start, ende, status}]} (nur Benutzer mit Kalender-Zuordnung)."""
    von, bis = get_datetime(von), get_datetime(bis)
    if not von or not bis or bis <= von or (bis - von).days > 62:
        from ph_core.api import ApiFehler

        raise ApiFehler("invalid", 400, _("Zeitraum ungültig (höchstens 62 Tage)."))
    upn = {}
    for u in benutzer:
        z = zuordnung(u)
        if z:
            upn[z.outlook_adresse.lower()] = u
    if not upn:
        return {}
    body = {"schedules": sorted(upn), "startTime": {"dateTime": von.strftime("%Y-%m-%dT%H:%M:%S"), "timeZone": R.ZEITZONE},
            "endTime": {"dateTime": bis.strftime("%Y-%m-%dT%H:%M:%S"), "timeZone": R.ZEITZONE}, "availabilityViewInterval": 30}
    res = graph_client().post(f"{_u(sorted(upn)[0])}/calendar/getSchedule", json=body, headers=PREFER_WIEN)
    aus = {}
    for adr, bloecke in R.belegt_bloecke(res).items():
        if adr in upn:
            aus[upn[adr]] = [{"start": a.isoformat(), "ende": b.isoformat(), "status": st} for a, b, st in bloecke]
    return aus


def crm_belegungen(von, bis, berater_liste):
    """Hook `ph_crm_belegungen` (Angebot an ph_crm.kalender.freie_slots): → [(user, (start, ende))].
    Mit aktivem Belegt-Spiegel liefert ph_crm die Events schon selbst → leer. Wirft nie; Cache 5 min."""
    try:
        e = einstellungen()
        if not e["kalender_sync_aktiv"] or e["belegt_als_event"]:
            return []
        key = f"ph_microsoft:belegt:{','.join(sorted(b for b in berater_liste if b))}:{von}:{bis}"
        daten = frappe.cache().get_value(key)
        if daten is None:
            daten = frei_belegt([b for b in berater_liste if b], von, bis)
            frappe.cache().set_value(key, daten, expires_in_sec=300)
        return [(u, (get_datetime(x["start"]), get_datetime(x["ende"]))) for u, liste_ in daten.items() for x in liste_]
    except Exception:  # noqa: BLE001
        frappe.log_error(title="PH Microsoft: Frei/Belegt für ph_crm nicht abrufbar")
        return []
