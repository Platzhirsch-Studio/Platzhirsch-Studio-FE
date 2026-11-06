"""Aktivitätsstrom der Zentrale (backoffice/src/lib/backoffice/dashboard.js aktivitaet): letzte Änderungen über
PH-DocTypes aus `tabVersion`, `tabComment` und `tabCommunication` in einem Aufruf.

Datenschutz: Die Zusammenfassung nennt nur Feld-Labels, Kommentar-/Workflow-Art und Richtung einer E-Mail –
nie Feldwerte, Kommentartexte, Betreffzeilen oder Adressen Dritter. Rechte: DocType-Leserecht
(frappe.has_permission) und User Permissions (frappe.get_list auf die betroffenen Namen).

Antwortzeile: {"zeit" (ISO), "benutzer", "benutzer_name", "doctype", "name", "titel", "art", "zusammenfassung",
"href_hinweis", "bereich"}; art ∈ Angelegt, Geaendert, Kommentar, Workflow, Zugewiesen, Anhang, E-Mail, Geloescht.
"""

import json

import frappe
from frappe import _
from frappe.utils import get_fullname

from ph_core.api import liste, ph_api
from ph_core.api.suche import BEREICHE, SUCH_DOCTYPES, _meta, bereich_von, slug

LIMIT_MAX = 100
MAX_FELDER = 4
COMMENT_ARTEN = {"Comment": "Kommentar", "Workflow": "Workflow", "Assigned": "Zugewiesen", "Attachment": "Anhang", "Created": "Angelegt", "Deleted": "Geloescht"}


def _doctypes(bereiche):
    if not bereiche:
        return SUCH_DOCTYPES
    aus = []
    for b in liste(bereiche):
        aus.extend(BEREICHE.get(b, []))
    return aus


def _lesbar(doctypes):
    """{doctype: meta} für installierte DocTypes mit Leserecht."""
    aus = {}
    for dt in doctypes:
        meta = _meta(dt)
        if meta and not meta.istable and not meta.issingle and frappe.has_permission(dt, "read"):
            aus[dt] = meta
    return aus


def _version_zusammenfassung(meta, data):
    """Nur Labels geänderter Felder (keine Werte)."""
    try:
        d = json.loads(data or "{}")
    except ValueError:
        return _("Geändert")
    labels = []
    for eintrag in d.get("changed") or []:
        fn = eintrag[0] if isinstance(eintrag, (list, tuple)) and eintrag else None
        if not fn:
            continue
        df = meta.get_field(fn)
        labels.append(_(df.label) if df and df.label else fn)
    for eintrag in d.get("added") or []:
        fn = eintrag[0] if isinstance(eintrag, (list, tuple)) and eintrag else None
        if fn:
            df = meta.get_field(fn)
            labels.append(_("{0} ergänzt").format(_(df.label) if df and df.label else fn))
    for eintrag in d.get("removed") or []:
        fn = eintrag[0] if isinstance(eintrag, (list, tuple)) and eintrag else None
        if fn:
            df = meta.get_field(fn)
            labels.append(_("{0} entfernt").format(_(df.label) if df and df.label else fn))
    labels = [x for i, x in enumerate(labels) if x not in labels[:i]]
    if not labels:
        return _("Geändert")
    rest = len(labels) - MAX_FELDER
    return _("Geändert: {0}").format(", ".join(labels[:MAX_FELDER])) + (f" (+{rest})" if rest > 0 else "")


def _sammeln(metas, limit):
    dts = list(metas)
    roh = []
    versionen = frappe.get_all("Version", filters={"ref_doctype": ("in", dts)}, fields=["ref_doctype as doctype", "docname as name", "owner", "creation", "data"], order_by="creation desc", limit_page_length=limit)
    for v in versionen:
        roh.append({"zeit": v.creation, "benutzer": v.owner, "doctype": v.doctype, "name": v.name, "art": "Geaendert", "zusammenfassung": _version_zusammenfassung(metas[v.doctype], v.data)})
    kommentare = frappe.get_all(
        "Comment",
        filters={"reference_doctype": ("in", dts), "comment_type": ("in", list(COMMENT_ARTEN))},
        fields=["reference_doctype as doctype", "reference_name as name", "owner", "creation", "comment_type", "content"],
        order_by="creation desc",
        limit_page_length=limit,
    )
    for c in kommentare:
        art = COMMENT_ARTEN.get(c.comment_type, "Kommentar")
        if c.comment_type == "Workflow":
            text_ = _("Workflow: {0}").format(frappe.utils.strip_html(str(c.content or ""))[:60])
        elif c.comment_type == "Created":
            text_ = _("Angelegt")
        elif c.comment_type == "Deleted":
            text_ = _("Gelöscht")
        else:
            text_ = _(art)  # Kommentar-/Zuweisungstexte können Personendaten enthalten → nur die Art
        roh.append({"zeit": c.creation, "benutzer": c.owner, "doctype": c.doctype, "name": c.name, "art": art, "zusammenfassung": text_})
    mails = frappe.get_all(
        "Communication",
        filters={"reference_doctype": ("in", dts), "communication_type": "Communication"},
        fields=["reference_doctype as doctype", "reference_name as name", "owner", "creation", "sent_or_received"],
        order_by="creation desc",
        limit_page_length=limit,
    )
    for m in mails:
        roh.append({"zeit": m.creation, "benutzer": m.owner, "doctype": m.doctype, "name": m.name, "art": "E-Mail", "zusammenfassung": _("E-Mail gesendet") if m.sent_or_received == "Sent" else _("E-Mail empfangen")})
    return roh


def _titel_und_sichtbar(metas, eintraege):
    """Je DocType: sichtbare Namen (User Permissions) und Titel laden."""
    sichtbar = {}
    for dt, meta in metas.items():
        namen = sorted({e["name"] for e in eintraege if e["doctype"] == dt and e["name"]})
        if not namen:
            continue
        felder = ["name"] + ([meta.title_field] if meta.title_field and meta.has_field(meta.title_field) else [])
        try:
            for z in frappe.get_list(dt, filters={"name": ("in", namen)}, fields=felder, limit_page_length=len(namen)):
                sichtbar[(dt, z["name"])] = str(z.get(meta.title_field) or z["name"]) if meta.title_field else z["name"]
        except Exception:  # noqa: BLE001
            frappe.log_error(title=f"PH Aktivität {dt}")
    return sichtbar


def aktivitaet(limit=30, bereiche=None):
    """Kern ohne Decorator."""
    limit = max(1, min(int(limit or 30), LIMIT_MAX))
    metas = _lesbar(_doctypes(bereiche))
    if not metas:
        return []
    roh = _sammeln(metas, limit)
    roh.sort(key=lambda e: e["zeit"] or "", reverse=True)
    roh = roh[: limit * 2]
    sichtbar = _titel_und_sichtbar(metas, roh)
    namen_cache = {}
    aus = []
    for e in roh:
        schl = (e["doctype"], e["name"])
        if schl not in sichtbar:
            continue  # gelöscht oder durch User Permission verborgen
        if e["benutzer"] not in namen_cache:
            namen_cache[e["benutzer"]] = get_fullname(e["benutzer"]) if e["benutzer"] else ""
        aus.append(
            {
                "zeit": e["zeit"].isoformat() if e["zeit"] else None,
                "benutzer": e["benutzer"],
                "benutzer_name": namen_cache[e["benutzer"]],
                "doctype": e["doctype"],
                "name": e["name"],
                "titel": sichtbar[schl][:120],
                "art": e["art"],
                "zusammenfassung": e["zusammenfassung"],
                "href_hinweis": f"/d/{slug(e['doctype'])}/{e['name']}",
                "bereich": bereich_von(e["doctype"]),
            }
        )
        if len(aus) >= limit:
            break
    return aus


@frappe.whitelist(allow_guest=False, methods=["GET", "POST"])
@ph_api(intern=True, limit_pro_minute=60)
def recent_activity(limit=30, bereiche=None):
    """Aktivitätsstrom (Desk-Benutzer). limit ≤ 100; bereiche optional (Liste/JSON/kommagetrennt aus BEREICHE-Schlüsseln).
    Rückgabe Liste {"zeit", "benutzer", "benutzer_name", "doctype", "name", "titel", "art", "zusammenfassung", "href_hinweis", "bereich"}."""
    return aktivitaet(limit, bereiche)
