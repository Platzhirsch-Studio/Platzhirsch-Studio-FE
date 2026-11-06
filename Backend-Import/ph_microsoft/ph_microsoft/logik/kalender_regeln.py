"""Kalender-Abgleich (ohne Frappe): Backoffice-Vorgang → Outlook-Ereignis, Konfliktregel, Frei/Belegt.

Quellen (Feldnamen aus den DocType-JSONs):
  PH Termin (ph_crm)          berater · start/ende · status Storniert/Abgelehnt = abgesagt · modus „Video“ → Teams
  PH Montageauftrag (ph_projekte) montageleiter + team[].user · start/ende · Abgebrochen = abgesagt
  PH Serviceeinsatz (ph_service)  techniker, techniker_2 · datum + zeit_von/zeit_bis · Abgebrochen = abgesagt

Konfliktregel (Auftrag Punkt 4): Backoffice gewinnt beim Inhalt (Betreff, Ort, Text, Teams); Outlook gewinnt bei
einer Zeitverschiebung durch den Mitarbeiter (nur Outlook geändert) – dann Rückmeldung als Aufgabe. Wurden
Zeiten auf beiden Seiten unterschiedlich geändert, gewinnt das Backoffice und es entsteht eine Konflikt-Aufgabe.
"""

import hashlib
import json
from datetime import date, datetime, time, timedelta

ZEITZONE = "Europe/Vienna"
# Erweiterte Eigenschaft (singleValueExtendedProperty) mit „DocType|Name“ am Outlook-Ereignis.
EXT_PROP_GUID = "{8b7f5a2e-3c1d-4e6f-9a0b-5d2c7e1f4a36}"
EXT_PROP_ID = f"String {EXT_PROP_GUID} Name PHReferenz"
KATEGORIE = "Platzhirsch"
TOLERANZ = timedelta(minutes=1)

QUELLEN = {
    "PH Termin": {"benutzer": ("berater",), "team": None, "abgesagt": {"Storniert", "Abgelehnt"}, "app": "ph_crm"},
    "PH Montageauftrag": {"benutzer": ("montageleiter",), "team": "team", "abgesagt": {"Abgebrochen"}, "app": "ph_projekte"},
    "PH Serviceeinsatz": {"benutzer": ("techniker", "techniker_2"), "team": None, "abgesagt": {"Abgebrochen"}, "app": "ph_service"},
}


def _dt(wert):
    if wert is None or wert == "":
        return None
    if isinstance(wert, datetime):
        return wert.replace(tzinfo=None, microsecond=0)
    if isinstance(wert, date):
        return datetime.combine(wert, time(0, 0))
    s = str(wert).strip().replace("T", " ").split(".")[0].rstrip("Z")
    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M", "%Y-%m-%d"):
        try:
            return datetime.strptime(s[:19], fmt)
        except ValueError:
            continue
    return None


def _zeit(wert, standard):
    if wert in (None, ""):
        return standard
    if isinstance(wert, time):
        return wert
    if isinstance(wert, timedelta):  # MariaDB TIME → timedelta
        sek = int(wert.total_seconds())
        return time(sek // 3600 % 24, sek // 60 % 60)
    teile = str(wert).split(":")
    try:
        return time(int(teile[0]) % 24, int(teile[1]) if len(teile) > 1 else 0)
    except ValueError:
        return standard


def zeitraum(doctype, d):
    """→ (start, ende) als naive datetimes (Site-Zeit) oder (None, None)."""
    if doctype == "PH Serviceeinsatz":
        tag = _dt(d.get("datum"))
        if not tag:
            return None, None
        von = _zeit(d.get("zeit_von"), time(8, 0))
        bis = _zeit(d.get("zeit_bis"), None)
        start = datetime.combine(tag.date(), von)
        ende = datetime.combine(tag.date(), bis) if bis else start + timedelta(hours=2)
    else:
        start, ende = _dt(d.get("start")), _dt(d.get("ende"))
        if start and not ende:
            ende = start + timedelta(minutes=int(d.get("dauer_min") or 60))
    if start and ende and ende <= start:
        ende = start + timedelta(minutes=30)
    return start, ende


def zeit_felder(doctype, start, ende):
    """Umkehrung von zeitraum(): Werte zum Zurückschreiben einer Outlook-Verschiebung."""
    if doctype == "PH Serviceeinsatz":
        return {"datum": start.date().isoformat(), "zeit_von": start.strftime("%H:%M:%S"), "zeit_bis": ende.strftime("%H:%M:%S")}
    werte = {"start": start.strftime("%Y-%m-%d %H:%M:%S"), "ende": ende.strftime("%Y-%m-%d %H:%M:%S")}
    if doctype == "PH Termin":
        werte["dauer_min"] = int((ende - start).total_seconds() // 60)
    return werte


def benutzer(doctype, d, team=None):
    q = QUELLEN.get(doctype) or {}
    aus = [d.get(f) for f in q.get("benutzer", ())]
    if q.get("team"):
        aus += [z.get("user") for z in (team if team is not None else d.get(q["team"]) or [])]
    return sorted({u for u in aus if u and u not in ("Administrator", "Guest")})


def ist_video(doctype, d):
    return doctype == "PH Termin" and (str(d.get("modus") or "").lower() == "video" or str(d.get("terminart") or "").lower() == "video")


def ereignis(doctype, d, name=None):
    """→ {betreff, start, ende, ort, text, online, abgesagt} oder None (ohne Zeit)."""
    start, ende = zeitraum(doctype, d)
    if not start:
        return None
    name = name or d.get("name")
    titel = str(d.get("titel") or name or "").strip()
    ort = ", ".join(x for x in (str(d.get("strasse") or "").strip(), " ".join(x for x in (str(d.get("plz") or "").strip(), str(d.get("ort") or "").strip()) if x)) if x)
    if doctype == "PH Termin":
        betreff = f"{d.get('modus') or 'Termin'}: {titel}"
        ort = ort or {"Showroom": "Platzhirsch Studio", "Video": "Microsoft Teams", "Telefon": "Telefon"}.get(d.get("modus") or "", d.get("plz_ort") or "")
        text = f"{name} · {d.get('thema') or ''}".strip(" ·")
    elif doctype == "PH Montageauftrag":
        betreff = f"Montage: {titel}"
        text = f"{name} · Projekt {d.get('projekt') or '–'}"
    else:
        betreff = f"Service ({d.get('art') or 'Einsatz'}): {titel}"
        text = f"{name} · Servicefall {d.get('servicefall') or '–'}"
    abgesagt = str(d.get("status") or "") in (QUELLEN.get(doctype) or {}).get("abgesagt", set())
    return {"betreff": betreff[:255], "start": start, "ende": ende, "ort": ort[:255], "text": text[:1000], "online": ist_video(doctype, d), "abgesagt": abgesagt}


def inhalt_hash(ev):
    """Hash nur über den Inhalt (nicht die Zeiten) – Backoffice gewinnt beim Inhalt."""
    roh = json.dumps([ev.get("betreff"), ev.get("ort"), ev.get("text"), bool(ev.get("online"))], ensure_ascii=False)
    return hashlib.sha256(roh.encode()).hexdigest()[:32]


def transaction_id(doctype, name, user):
    """Deterministische transactionId (Graph verwirft doppelte Anlagen mit gleicher ID)."""
    h = hashlib.sha256(f"ph:{doctype}|{name}|{user}".encode()).hexdigest()
    return f"{h[:8]}-{h[8:12]}-{h[12:16]}-{h[16:20]}-{h[20:32]}"


def referenz_wert(doctype, name):
    return f"{doctype}|{name}"


def _graph_zeit(dt_wert):
    return {"dateTime": dt_wert.strftime("%Y-%m-%dT%H:%M:%S"), "timeZone": ZEITZONE}


def graph_event(ev, doctype, name, user=None, neu=True):
    """Outlook-Ereignis (Graph event resource). Bei neu=True mit transactionId und Erweiterungseigenschaft."""
    body = {
        "subject": ev["betreff"],
        "body": {"contentType": "text", "content": ev.get("text") or ""},
        "start": _graph_zeit(ev["start"]),
        "end": _graph_zeit(ev["ende"]),
        "location": {"displayName": ev.get("ort") or ""},
        "categories": [KATEGORIE],
        "showAs": "busy",
        "isReminderOn": True,
        "reminderMinutesBeforeStart": 15,
    }
    if ev.get("online"):
        body["isOnlineMeeting"] = True
        body["onlineMeetingProvider"] = "teamsForBusiness"
    if neu:
        body["transactionId"] = transaction_id(doctype, name, user)
        body["singleValueExtendedProperties"] = [{"id": EXT_PROP_ID, "value": referenz_wert(doctype, name)}]
    return body


def graph_zeit_lesen(obj):
    """Graph dateTimeTimeZone → naive datetime. Wir fordern Europe/Vienna an (Prefer: outlook.timezone);
    kommt UTC zurück, wird umgerechnet (zoneinfo, auf Linux-Servern vorhanden)."""
    if not obj:
        return None
    wert = _dt(obj.get("dateTime"))
    tz = str(obj.get("timeZone") or ZEITZONE)
    if wert is None or tz in (ZEITZONE, "W. Europe Standard Time"):
        return wert
    try:
        from zoneinfo import ZoneInfo

        quelle = ZoneInfo("UTC" if tz.upper() in ("UTC", "Z", "COORDINATED UNIVERSAL TIME") else tz)
        return wert.replace(tzinfo=quelle).astimezone(ZoneInfo(ZEITZONE)).replace(tzinfo=None)
    except Exception:  # noqa: BLE001
        return wert


def _gleich(a, b):
    if a is None or b is None:
        return a is b
    return abs(a - b) <= TOLERANZ


def konflikt(gespeichert, backoffice, outlook, outlook_inhalt_hash=None, gespeichert_inhalt_hash=None):
    """Zeiten als (start, ende): gespeichert = Stand des letzten Abgleichs, backoffice = Vorgang jetzt,
    outlook = Ereignis jetzt. → {"aktion": nichts|outlook_zeit_uebernehmen|backoffice_pushen,
    "aufgabe": None|"verschoben"|"konflikt", "inhalt_pushen": bool}"""
    ol_zeit = not (_gleich(outlook[0], gespeichert[0]) and _gleich(outlook[1], gespeichert[1]))
    bo_zeit = not (_gleich(backoffice[0], gespeichert[0]) and _gleich(backoffice[1], gespeichert[1]))
    inhalt = bool(outlook_inhalt_hash and gespeichert_inhalt_hash and outlook_inhalt_hash != gespeichert_inhalt_hash)
    if not ol_zeit and not bo_zeit:
        return {"aktion": "nichts", "aufgabe": None, "inhalt_pushen": inhalt}
    if ol_zeit and not bo_zeit:
        return {"aktion": "outlook_zeit_uebernehmen", "aufgabe": "verschoben", "inhalt_pushen": inhalt}
    if bo_zeit and not ol_zeit:
        return {"aktion": "backoffice_pushen", "aufgabe": None, "inhalt_pushen": True}
    if _gleich(outlook[0], backoffice[0]) and _gleich(outlook[1], backoffice[1]):
        return {"aktion": "nichts", "aufgabe": None, "inhalt_pushen": inhalt}
    return {"aktion": "backoffice_pushen", "aufgabe": "konflikt", "inhalt_pushen": True}


def outlook_inhalt_hash(event):
    """Gleiche Hash-Bildung wie inhalt_hash() aus einem Graph-Ereignis (Text nur, wenn als text geliefert)."""
    body = event.get("body") or {}
    text = body.get("content") if body.get("contentType") == "text" else None
    if text is None:
        return None  # HTML-Körper nicht vergleichbar → kein Inhaltskonflikt ableiten
    return inhalt_hash({"betreff": event.get("subject"), "ort": (event.get("location") or {}).get("displayName"), "text": text.strip(), "online": bool(event.get("isOnlineMeeting"))})


BELEGT_STATUS = {"busy", "oof", "tentative", "workingelsewhere"}


def belegt_bloecke(antwort, nur=("busy", "oof", "tentative")):
    """getSchedule-Antwort → {adresse_klein: [(start, ende, status)]}."""
    aus = {}
    for s in (antwort or {}).get("value", []) or []:
        adr = str(s.get("scheduleId") or "").lower()
        liste = aus.setdefault(adr, [])
        for it in s.get("scheduleItems") or []:
            st = str(it.get("status") or "").lower()
            if st in nur:
                a, b = graph_zeit_lesen(it.get("start")), graph_zeit_lesen(it.get("end"))
                if a and b:
                    liste.append((a, b, st))
    return aus


def ist_fremd_belegt(event):
    """Outlook-Ereignis eines Mitarbeiters, das als „belegt“ gespiegelt wird (nicht abgesagt, nicht frei)."""
    return not event.get("isCancelled") and str(event.get("showAs") or "busy").lower() in BELEGT_STATUS
