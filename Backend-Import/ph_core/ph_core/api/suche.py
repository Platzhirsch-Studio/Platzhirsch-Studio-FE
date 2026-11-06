"""Globale Suche für die Befehlspalette des Backoffice (backoffice/src/lib/backoffice/suche.js).

Ein Aufruf statt n getList-Aufrufen: sucht über die wichtigsten PH-DocTypes nach `name`, `title_field`
und `search_fields` (like), achtet Rechte (frappe.has_permission + frappe.get_list mit User Permissions),
dedupliziert und gibt höchstens `limit` (≤ 50) Treffer zurück, neueste zuerst.

Antwortzeile: {"doctype", "name", "titel", "status", "geaendert" (ISO), "href_hinweis", "bereich"} –
href_hinweis = "/d/<slug>/<name>" nach backoffice/src/lib/backoffice/format.js doctypeSlug.
"""

import frappe
from frappe import _

from ph_core.api import ApiFehler, liste, ph_api, text

# Bereich → DocTypes (Namen wie in backoffice/src/lib/backoffice/bereiche.js). Nur installierte
# DocTypes werden durchsucht; die Liste ist bewusst eine Konstante (keine Site-Einstellung).
BEREICHE = {
    "zentrale": ["PH Aufgabe", "PH Geraet"],
    "crm": ["PH Anfrage", "PH Kontakt", "PH Termin", "PH Beratungsgespraech"],
    "sortiment": ["PH Produkt", "PH Marke", "PH Herstellerbestellung", "PH Wareneingang"],
    "projekte": ["PH Projekt", "PH Montageauftrag", "PH Planung", "PH Rendering", "PH Produktpass"],
    "shop": ["PH Bestellung", "PH Zahlung", "PH Gutschein", "PH Retoure", "PH Widerruf"],
    "faktura": ["PH Angebot", "PH Auftragsbestaetigung", "PH Rechnung", "PH Gutschrift", "PH Mahnung", "PH Eingangsrechnung"],
    "logistik": ["PH Lieferschein", "PH Sendung", "PH Tour", "PH Lagerbestand"],
    "service": ["PH Servicefall", "PH Serviceeinsatz", "PH Serviceauftrag", "PH Pflege Abo"],
    "marketing": ["PH Kampagne", "PH Newsletter Ausgabe", "PH Social Beitrag"],
    "kassa": ["PH Kassenbeleg", "PH Kassenabschluss", "PH Kasse"],
    "kundenkarte": ["PH Kundenkarte", "PH Kundenkarte Antrag", "PH Kundenkarte Einloesung"],
    # personal (PH Bewerbung, PH Mitarbeiter): bewusst nicht in der globalen Suche – nur über den Bereich selbst.
}
SUCH_DOCTYPES = [dt for dts in BEREICHE.values() for dt in dts]
JE_DOCTYPE = 5
LIMIT_MAX = 50
Q_MIN = 2
Q_MAX = 60


def slug(doctype):
    """„PH Auftragsbestaetigung“ → „ph-auftragsbestaetigung“ (format.js doctypeSlug)."""
    s = str(doctype or "").strip().lower()
    for a, b in (("ä", "ae"), ("ö", "oe"), ("ü", "ue"), ("ß", "ss")):
        s = s.replace(a, b)
    return "-".join(t for t in s.replace("_", " ").split() if t)


def bereich_von(doctype):
    for b, dts in BEREICHE.items():
        if doctype in dts:
            return b
    return None


def _meta(doctype):
    """Meta oder None, wenn die DocType auf dieser Site nicht existiert (App nicht installiert)."""
    if not frappe.db.exists("DocType", doctype):
        return None
    try:
        return frappe.get_meta(doctype)
    except Exception:  # noqa: BLE001
        return None


def _suchfelder(meta):
    felder = ["name"]
    if meta.title_field and meta.has_field(meta.title_field):
        felder.append(meta.title_field)
    for f in (meta.search_fields or "").split(","):
        f = f.strip()
        if f and meta.has_field(f) and f not in felder:
            df = meta.get_field(f)
            if df.fieldtype in ("Data", "Link", "Select", "Small Text", "Text", "Long Text", "Dynamic Link", "Read Only", "Phone"):
                felder.append(f)
    return felder


def _zeile(meta, z):
    titel = z.get(meta.title_field) if meta.title_field else None
    return {
        "doctype": meta.name,
        "name": z["name"],
        "titel": str(titel or z["name"])[:120],
        "status": z.get("status"),
        "geaendert": z["modified"].isoformat() if z.get("modified") else None,
        "href_hinweis": f"/d/{slug(meta.name)}/{z['name']}",
        "bereich": bereich_von(meta.name),
    }


def suchen(q, limit=20, doctypes=None):
    """Kern ohne Decorator (für Tests und andere Apps)."""
    q = text(q, Q_MAX)
    if len(q) < Q_MIN:
        return []
    limit = max(1, min(int(limit or 20), LIMIT_MAX))
    gewuenscht = [d for d in liste(doctypes) if d in SUCH_DOCTYPES] if doctypes else SUCH_DOCTYPES
    muster = f"%{q}%"
    treffer, gesehen = [], set()
    for dt in gewuenscht:
        meta = _meta(dt)
        if not meta or meta.istable or meta.issingle or not frappe.has_permission(dt, "read"):
            continue
        felder = _suchfelder(meta)
        spalten = ["name", "modified"]
        if meta.title_field and meta.has_field(meta.title_field):
            spalten.append(meta.title_field)
        if meta.has_field("status"):
            spalten.append("status")
        try:
            zeilen = frappe.get_list(dt, fields=spalten, or_filters=[[dt, f, "like", muster] for f in felder], order_by="modified desc", limit_page_length=JE_DOCTYPE)
        except Exception:  # noqa: BLE001 – eine fehlende Spalte darf die Suche nicht stoppen
            frappe.log_error(title=f"PH Suche {dt}")
            continue
        for z in zeilen:
            schl = (dt, z["name"])
            if schl in gesehen:
                continue
            gesehen.add(schl)
            treffer.append(_zeile(meta, z))
    treffer.sort(key=lambda t: t["geaendert"] or "", reverse=True)
    return treffer[:limit]


@frappe.whitelist(allow_guest=False, methods=["GET", "POST"])
@ph_api(intern=True, limit_pro_minute=120)
def global_search(q, limit=20, doctypes=None):
    """Palette-Suche (Desk-Benutzer). q ≥ 2 Zeichen, limit ≤ 50, doctypes optional (Liste/JSON/kommagetrennt, Teilmenge von SUCH_DOCTYPES).
    Rückgabe Liste {"doctype", "name", "titel", "status", "geaendert", "href_hinweis", "bereich"}."""
    if q is None:
        raise ApiFehler("invalid", 400, _("Pflichtfeld fehlt: q"), {"field": "q"})
    return suchen(q, limit, doctypes)
