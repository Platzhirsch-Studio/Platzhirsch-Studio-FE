"""Besucher-Einblicke: Tagesaggregat speichern (Upsert über Datum und Teil), src/lib/einblicke/frappe.server.js.

Body: { datum, schema, meta, teil?, seiten[], heatmaps[], pfade[], signale[], planer[] } – je Teil ≤ 1 MB.
Nur zusammengefasste Werte (mind. 5 Besuche je Seite laut Consent-Text), keine IP, keine Sitzungen.
"""

import json

import frappe
from frappe import _
from frappe.utils import getdate, now_datetime

from ph_core.api import ApiFehler

TEILE = ("seiten", "heatmaps", "pfade", "signale", "planer")
MAX_BYTES = 1024 * 1024


def _json(wert):
    if wert is None:
        return None
    if isinstance(wert, str):
        try:
            wert = json.loads(wert)
        except ValueError as e:
            raise ApiFehler("invalid", 400, _("Ungültiges JSON: {0}").format(e)) from e
    s = json.dumps(wert, ensure_ascii=False, separators=(",", ":"))
    if len(s.encode("utf-8")) > MAX_BYTES:
        raise ApiFehler("invalid", 413, _("Teil größer als 1 MB."))
    return s


def tag_speichern(datum, schema=None, meta=None, teil=None, **teile):
    try:
        d = getdate(datum)
    except Exception as e:  # noqa: BLE001
        raise ApiFehler("invalid", 400, _("datum fehlt oder ist ungültig.")) from e
    name = str(d)
    if teil and teil not in TEILE:
        raise ApiFehler("invalid", 400, _("Unbekannter Teil: {0}").format(teil))
    werte = {"empfangen_am": now_datetime()}
    if schema:
        werte["schema"] = str(schema)[:40]
    if meta is not None:
        werte["meta_json"] = _json(meta)
        try:
            m = json.loads(werte["meta_json"]) or {}
            werte["besuche"] = int(m.get("besuche") or m.get("visits") or 0)
        except (ValueError, TypeError):
            pass
    gesetzt = []
    for t in TEILE:
        if teil and t != teil:
            continue
        if t in teile and teile[t] is not None:
            werte[f"{t}_json"] = _json(teile[t])
            gesetzt.append(t)
    if frappe.db.exists("PH Einblick Tag", name):
        doc = frappe.get_doc("PH Einblick Tag", name)
        vorhanden = set((doc.teile_empfangen or "").split(",")) - {""}
        werte["teile_empfangen"] = ",".join(sorted(vorhanden | set(gesetzt)))
        doc.update(werte)
    else:
        werte["teile_empfangen"] = ",".join(sorted(gesetzt))
        doc = frappe.get_doc({"doctype": "PH Einblick Tag", "datum": d, **werte})
    doc.status = "Vollstaendig" if not teil or set(werte["teile_empfangen"].split(",")) >= set(TEILE) else "Teilweise"
    doc.flags.ignore_permissions = True
    doc.save() if not doc.is_new() else doc.insert()
    return {"datum": name, "teile": werte["teile_empfangen"], "status": doc.status}


def top_seiten(von, bis, limit=30):
    """Report: Seiten mit Besuchen/Scrolltiefe aus seiten_json (Felder pfad/besuche/scroll_median oder path/views)."""
    agg = {}
    for row in frappe.get_all("PH Einblick Tag", filters={"datum": ("between", [von, bis])}, fields=["datum", "seiten_json"]):
        try:
            seiten = json.loads(row.seiten_json or "[]")
        except ValueError:
            continue
        for s in seiten if isinstance(seiten, list) else []:
            pfad = s.get("pfad") or s.get("path") or s.get("seite") or "?"
            a = agg.setdefault(pfad, {"pfad": pfad, "besuche": 0, "tage": 0, "scroll_sum": 0.0, "scroll_n": 0, "ziele": 0})
            a["besuche"] += int(s.get("besuche") or s.get("views") or 0)
            a["tage"] += 1
            a["ziele"] += int(s.get("ziele") or s.get("goals") or 0)
            sc = s.get("scroll_median") or s.get("scroll")
            if sc is not None:
                a["scroll_sum"] += float(sc)
                a["scroll_n"] += 1
    out = []
    for a in sorted(agg.values(), key=lambda x: -x["besuche"])[:limit]:
        out.append({"pfad": a["pfad"], "besuche": a["besuche"], "tage": a["tage"], "scroll": round(a["scroll_sum"] / a["scroll_n"], 1) if a["scroll_n"] else None, "ziele": a["ziele"]})
    return out
