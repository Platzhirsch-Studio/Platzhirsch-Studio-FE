"""Kontakt-Zeitleiste: Ereignisse aller Apps vereinen, sortieren, seitenweise ausgeben – ohne Frappe.

Ereignis-Format (Hook-Vertrag `ph_kontakt_zeitleiste`, README):
  {"zeit": ISO 8601, "art": str, "doctype": str, "name": str, "titel": str, "text": str, "app": str}
Cursor: `vor` = ISO-Zeit des letzten Eintrags der vorigen Seite (exklusiv).
"""

from datetime import datetime, timezone

PFLICHT = ("zeit", "art", "doctype", "name")


def _dt(wert):
    """ISO-String/datetime → aware datetime (naive = Site-Zeit, zum Vergleich als UTC behandelt)."""
    if isinstance(wert, datetime):
        d = wert
    else:
        s = str(wert or "").strip().replace(" ", "T", 1)
        if not s:
            return None
        if s.endswith("Z"):
            s = s[:-1] + "+00:00"
        try:
            d = datetime.fromisoformat(s)
        except ValueError:
            try:
                d = datetime.fromisoformat(s[:19])
            except ValueError:
                return None
    return d if d.tzinfo else d.replace(tzinfo=timezone.utc)


def normalisiere(e, app=None):
    if not isinstance(e, dict) or any(not e.get(k) for k in PFLICHT):
        return None
    zeit = _dt(e["zeit"])
    if not zeit:
        return None
    return {
        "zeit": e["zeit"] if isinstance(e["zeit"], str) else e["zeit"].isoformat(),
        "art": str(e["art"]),
        "doctype": str(e["doctype"]),
        "name": str(e["name"]),
        "titel": str(e.get("titel") or e["name"])[:200],
        "text": str(e.get("text") or "")[:500],
        "app": str(e.get("app") or app or ""),
        "_t": zeit,
    }


def zusammenfuehren(listen, vor=None, limit=30):
    """listen: Iterable von Ereignislisten. → {"eintraege": [...], "weiter": cursor|None}."""
    limit = max(1, min(int(limit or 30), 200))
    grenze = _dt(vor) if vor else None
    gesehen, alle = set(), []
    for liste in listen:
        for roh in liste or []:
            e = normalisiere(roh)
            if not e:
                continue
            if grenze and e["_t"] >= grenze:
                continue
            k = (e["doctype"], e["name"], e["art"], e["_t"])
            if k in gesehen:
                continue
            gesehen.add(k)
            alle.append(e)
    alle.sort(key=lambda e: (e["_t"], e["doctype"], e["name"]), reverse=True)
    seite = alle[:limit]
    weiter = seite[-1]["zeit"] if len(alle) > limit else None
    for e in seite:
        e.pop("_t", None)
    return {"eintraege": seite, "weiter": weiter}


def letzter_kontakt(ereignisse, arten=("E-Mail", "Termin", "Gespräch", "Anruf")):
    """Jüngstes Ereignis mit Kundenberührung → (zeit_iso, art) oder (None, None)."""
    beste = None
    for roh in ereignisse:
        e = normalisiere(roh)
        if e and e["art"] in arten and (beste is None or e["_t"] > beste["_t"]):
            beste = e
    return (beste["zeit"], beste["art"]) if beste else (None, None)
