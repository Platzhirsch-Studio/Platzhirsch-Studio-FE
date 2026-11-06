"""Dubletten finden und Kontakte zusammenführen (Frappe-Teil). Regeln: ph_crm/utils/dubletten.py.

Zusammenführen = Feldübernahme ins Ziel + Kindzeilen (Adressen, Rollen) kopieren + `frappe.rename_doc(merge=True)`.
Frappe biegt dabei ALLE Link-/Dynamic-Link-Felder aller Apps (inkl. Custom Fields, Kommentare, Mails,
Dateien, Zuweisungen, Versionen) auf das Ziel um und löscht die Quelle. Danach ruft PH Kontakt.after_rename
die Hooks `ph_kontakt_zusammengefuehrt(alt, neu)` (z. B. Kundenkarte zusammenführen, Einwilligungen bündeln).
"""

import frappe
from frappe import _
from frappe.utils import cint

from ph_crm.utils import dubletten as dub

FELDER = ["name", "titel", "vorname", "nachname", "firma", "email", "telefon", "mobil", "plz", "ort", "kontaktart", "status", "keine_dublette_mit", "letzter_kontakt"]
LEITUNG = ("System Manager", "PH CRM Leitung", "PH Backoffice-Admin")


def _ausgeschlossen(k):
    return {x.strip() for x in str(k.get("keine_dublette_mit") or "").split(",") if x.strip()}


def kandidaten(werte, ausser=None, limit=10):
    """Ähnliche Kontakte zu `werte` (dict mit email/telefon/mobil/vorname/nachname/plz/firma).
    → [{name, titel, punkte, einstufung, gruende, …}] absteigend."""
    gefunden = {}

    def holen(filters):
        if ausser:
            filters["name"] = ("!=", ausser)
        for r in frappe.get_all("PH Kontakt", filters=filters, fields=FELDER, limit=25):
            gefunden[r.name] = r

    email = dub.norm_email(werte.get("email"))
    if email:
        holen({"email": ("like", f"{email.split('@')[0]}%@{email.split('@')[1]}")})
    for t in dub.telefone(werte):
        holen({"telefon_norm": ("like", f"%{t}%")})
    nachname = (werte.get("nachname") or "").strip()
    if nachname and nachname not in ("(ohne Nachname)",):
        if werte.get("plz"):
            holen({"nachname": nachname, "plz": str(werte["plz"]).strip()})
        if werte.get("vorname"):
            holen({"nachname": nachname, "vorname": werte["vorname"].strip()})
    if werte.get("firma") and not nachname:
        holen({"firma": werte["firma"].strip()})
    eigen_aus = _ausgeschlossen(werte)
    erg = []
    for r in gefunden.values():
        if r.name in eigen_aus or (werte.get("name") and werte["name"] in _ausgeschlossen(r)):
            continue
        p, g = dub.score(werte, r)
        stufe = dub.einstufung(p)
        if stufe:
            erg.append({"name": r.name, "titel": r.titel, "status": r.status, "ort": r.ort, "email_maskiert": _maske(r.email), "letzter_kontakt": r.letzter_kontakt, "punkte": p, "einstufung": stufe, "gruende": g})
    return sorted(erg, key=lambda x: -x["punkte"])[: int(limit or 10)]


def _maske(email):
    if not email or "@" not in email:
        return None
    lokal, dom = email.split("@", 1)
    return f"{lokal[:1]}…@{dom}"


def zusammenfuehren(ziel, quelle, felder=None):
    """Quelle in Ziel zusammenführen (nur Leitung). → Name des Ziels."""
    frappe.only_for(LEITUNG)
    if ziel == quelle:
        frappe.throw(_("Ziel und Quelle sind derselbe Kontakt."))
    z = frappe.get_doc("PH Kontakt", ziel)
    q = frappe.get_doc("PH Kontakt", quelle)
    if q.get("anonymisiert_am") or z.get("anonymisiert_am"):
        frappe.throw(_("Anonymisierte Kontakte werden nicht zusammengeführt."))
    if isinstance(felder, str):
        felder = frappe.parse_json(felder) if felder.strip().startswith("[") else [f.strip() for f in felder.split(",") if f.strip()]
    stamm = lambda d: {df.fieldname: d.get(df.fieldname) for df in d.meta.fields if df.fieldtype not in ("Section Break", "Column Break", "Tab Break", "Table", "HTML")}  # noqa: E731
    neu = dub.feld_uebernahme(stamm(z), stamm(q), felder)
    if neu.get("email"):
        frappe.db.set_value("PH Kontakt", quelle, "email", None, update_modified=False)  # Eindeutigkeit
    neuer_status = neu.pop("status", None)  # Status nicht über den Workflow-Validator, sondern danach setzen
    z.update(neu)
    vorhanden = {(a.art, (a.strasse or "").strip().lower(), str(a.plz or "").strip()) for a in z.adressen}
    for a in q.adressen:
        if (a.art, (a.strasse or "").strip().lower(), str(a.plz or "").strip()) not in vorhanden:
            z.append("adressen", {k: a.get(k) for k in a.as_dict() if k not in ("name", "parent", "parentfield", "parenttype", "idx", "doctype", "creation", "modified", "owner", "modified_by", "docstatus")})
    rollen = {(r.rolle, r.bezug_doctype, r.bezug_name) for r in z.get("rollen") or []}
    for r in q.get("rollen") or []:
        if (r.rolle, r.bezug_doctype, r.bezug_name) not in rollen:
            z.append("rollen", {"rolle": r.rolle, "bezug_doctype": r.bezug_doctype, "bezug_name": r.bezug_name, "notiz": r.notiz})
    rest = (_ausgeschlossen(z) | _ausgeschlossen(q)) - {ziel, quelle}
    z.keine_dublette_mit = ", ".join(sorted(rest)) or None
    if z.get("firma_kontakt") == quelle:
        z.firma_kontakt = None
    z.flags.ph_zusammenfuehren = True
    z.save()
    if neuer_status:
        from ph_crm.utils.workflow import status_setzen

        status_setzen(z, neuer_status, None, kunde_seit=z.kunde_seit)
    z.add_comment("Info", _("Kontakt {0} ({1}) wurde hierher zusammengeführt.").format(quelle, q.titel))
    frappe.rename_doc("PH Kontakt", quelle, ziel, merge=True, force=True, show_alert=False)
    return ziel


def keine_dublette(a, b):
    """Paar als „verschiedene Personen“ bestätigen – wird nicht mehr vorgeschlagen."""
    for x, y in ((a, b), (b, a)):
        liste = _ausgeschlossen(frappe.db.get_value("PH Kontakt", x, ["keine_dublette_mit"], as_dict=True) or {}) | {y}
        frappe.db.set_value("PH Kontakt", x, "keine_dublette_mit", ", ".join(sorted(liste)), update_modified=False)
    return True


def alle_paare(min_punkte=30, limit=500):
    """Für Report „PH Kontakt Dubletten“: alle Kandidatenpaare (Blocking über Schlüssel)."""
    kontakte = frappe.get_all("PH Kontakt", filters={"anonymisiert_am": ("is", "not set")}, fields=FELDER, limit=50000)
    aus = set()
    for k in kontakte:
        for x in _ausgeschlossen(k):
            aus.add(frozenset((k.name, x)))
    paare = [p for p in dub.paare(kontakte, aus) if p[2] >= cint(min_punkte)]
    return paare[: int(limit)], {k.name: k for k in kontakte}
