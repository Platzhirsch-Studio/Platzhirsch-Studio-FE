"""Rechte der Ablage: Bezug + Ordner-Modus (Regeln rein in utils/regeln.py).

Reihenfolge der Prüfung (zugriff_ordner):
  1. Administrator → ja. Ohne eine Ablage-/Bereichsrolle → nein.
  2. Leitung des Bezugs (allgemein: PH Ablage Leitung, Geschäftsführung, System Manager, Backoffice-Admin +
     Bereichsleitung; Personal: nur PH Personal Leitung, Geschäftsführung, System Manager) → ja.
  3. Personalordner (PH Mitarbeiter) → nein. Modus „leitung“ → nein.
  4. Leserecht auf den Bezug (frappe.has_permission auf PH Projekt/PH Kontakt …) – sonst nein.
  5. Modus „intern“ → ja; „team“ → Ersteller eines Ordners der Kette, Mitglied eines Ordners der Kette oder Team
     des Bezugs (Berater/Planer/Montageleiter/Projektteam, Kontakt-Berater, Servicefall-Verantwortlicher).

Desk-Listen (permission_query_conditions) bilden 1–3 und 5 ohne Bezugs-Team ab (Mitglied nur des direkten Ordners);
die API und Formulare (has_permission) prüfen vollständig.
"""

import frappe
from frappe import _

from ph_ablage.utils import regeln
from ph_core.api import ApiFehler

BASIS_ROLLEN = {"PH Ablage Mitarbeiter", "PH Ablage Leitung", "PH Geschäftsführung", "System Manager", "PH Backoffice-Admin", *regeln.BEREICHSROLLEN}
ORDNER_FELDER = ["name", "titel", "rechte_modus", "owner", "lft", "rgt", "bezug_doctype", "bezug_name", "parent_ph_ordner", "geschuetzt"]


def rollen(user=None):
    return set(frappe.get_roles(user or frappe.session.user))


def ist_leitung(bezug_doctype=None, user=None):
    user = user or frappe.session.user
    return regeln.ist_leitung(rollen(user), bezug_doctype, user)


def ordner_kette(ordner):
    """Ordner von der Wurzel bis `ordner` (inklusive) als Liste von dicts; [] wenn unbekannt."""
    if not ordner:
        return []
    o = frappe.db.get_value("PH Ordner", ordner, ["lft", "rgt"], as_dict=True)
    if not o:
        return []
    return frappe.get_all("PH Ordner", filters={"lft": ("<=", o.lft), "rgt": (">=", o.rgt)}, fields=ORDNER_FELDER, order_by="lft asc")


def mitglieder(ordner_namen):
    if not ordner_namen:
        return set()
    return set(frappe.get_all("PH Ordner Mitglied", filters={"parent": ("in", list(ordner_namen)), "parenttype": "PH Ordner"}, pluck="user"))


def team_des_bezugs(bezug_doctype, bezug_name):
    """Benutzer aus den Team-Feldern des Bezugs (nur wenn die App installiert ist und die Felder existieren)."""
    if not bezug_doctype or not bezug_name or bezug_doctype not in regeln.TEAM_FELDER:
        return set()
    if not frappe.db.exists("DocType", bezug_doctype):
        return set()
    felder, tabellen = regeln.TEAM_FELDER[bezug_doctype]
    meta = frappe.get_meta(bezug_doctype)
    einfache = [f for f in felder if meta.has_field(f)]
    werte = frappe.db.get_value(bezug_doctype, bezug_name, einfache, as_dict=True) if einfache else {}
    listen = {}
    for tabelle, userfeld in tabellen:
        df = meta.get_field(tabelle)
        if df and df.options and frappe.get_meta(df.options).has_field(userfeld):
            listen[tabelle] = frappe.get_all(df.options, filters={"parent": bezug_name, "parenttype": bezug_doctype, "parentfield": tabelle}, pluck=userfeld)
    return regeln.team_aus_werten(werte or {}, listen)


def bezug_lesbar(bezug_doctype, bezug_name, user):
    if not bezug_doctype or not bezug_name:
        return True
    if not frappe.db.exists("DocType", bezug_doctype):
        return True  # App entfernt: nur noch Ablage-Rechte
    try:
        return bool(frappe.has_permission(bezug_doctype, "read", doc=bezug_name, user=user))
    except frappe.DoesNotExistError:
        return False


def zugriff_ordner(ordner, user=None, kette=None):
    user = user or frappe.session.user
    if user == "Administrator":
        return True
    r = rollen(user)
    if not r & BASIS_ROLLEN:
        return False
    kette = kette if kette is not None else ordner_kette(ordner)
    if not kette:
        return False
    letzter = kette[-1]
    dt, name = letzter.get("bezug_doctype"), letzter.get("bezug_name")
    modus = regeln.effektiver_modus([k.get("rechte_modus") for k in kette])
    leitung = regeln.ist_leitung(r, dt, user)
    if leitung:
        return True
    if dt == "PH Mitarbeiter" or modus == "leitung":
        return False
    if not bezug_lesbar(dt, name, user):
        return False
    team = False
    if modus == "team":
        namen = [k["name"] for k in kette]
        team = user in ({k.get("owner") for k in kette} | mitglieder(namen) | team_des_bezugs(dt, name))
    return regeln.darf_zugreifen(modus, leitung, team, True, dt)


def pruefe_rolle(ptype="read", doctype="PH Datei"):
    """Rollenrecht auf den DocType (ohne Dokument) – z. B. Geschäftsführung: nur lesen."""
    if frappe.session.user == "Administrator":
        return
    if not frappe.has_permission(doctype, ptype):
        raise ApiFehler("forbidden", 403, _("Keine Berechtigung."))


def pruefe_ordner(ordner, ptype="read"):
    """→ Ordnerkette; ApiFehler not_found/forbidden."""
    if not ordner or not frappe.db.exists("PH Ordner", ordner):
        raise ApiFehler("not_found", 404, _("Ordner nicht gefunden."))
    pruefe_rolle(ptype, "PH Ordner" if ptype in ("create",) else "PH Datei")
    kette = ordner_kette(ordner)
    if not zugriff_ordner(ordner, kette=kette):
        raise ApiFehler("forbidden", 403, _("Keine Berechtigung für diesen Ordner."))
    return kette


def pruefe_datei(datei, ptype="read"):
    """→ PH Datei-Dokument; ApiFehler not_found/forbidden."""
    if not datei or not frappe.db.exists("PH Datei", datei):
        raise ApiFehler("not_found", 404, _("Datei nicht gefunden."))
    pruefe_rolle(ptype)
    doc = frappe.get_doc("PH Datei", datei)
    if not zugriff_ordner(doc.ordner):
        raise ApiFehler("forbidden", 403, _("Keine Berechtigung für diese Datei."))
    return doc


# ── Frappe-Hooks: has_permission ─────────────────────────────────────────────────────────────────
def ordner_hat_recht(doc, ptype=None, user=None, debug=False, **kw):
    if doc.is_new():
        return True if not doc.parent_ph_ordner else zugriff_ordner(doc.parent_ph_ordner, user)
    return zugriff_ordner(doc.name, user)


def datei_hat_recht(doc, ptype=None, user=None, debug=False, **kw):
    if not doc.ordner:
        return True
    return zugriff_ordner(doc.ordner, user)


def freigabelink_hat_recht(doc, ptype=None, user=None, debug=False, **kw):
    ordner = frappe.db.get_value("PH Datei", doc.datei, "ordner") if doc.datei else None
    return True if not ordner else zugriff_ordner(ordner, user)


# ── Frappe-Hooks: permission_query_conditions ────────────────────────────────────────────────────
def _bedingung(user, tabelle, ordner_spalte):
    user = user or frappe.session.user
    if user == "Administrator":
        return ""
    r = rollen(user)
    t = f"`tab{tabelle}`"
    personal = bool(r & set(regeln.PERSONAL_LEITUNG))
    kein_personal = f"coalesce({t}.bezug_doctype, '') != 'PH Mitarbeiter'"
    if r & set(regeln.ALLGEMEINE_LEITUNG):
        return "" if personal else f"({kein_personal})"
    u = frappe.db.escape(user)
    teile = [
        f"({t}.effektiver_modus = 'intern' and {kein_personal})",
        f"({t}.effektiver_modus = 'team' and {kein_personal} and ({t}.owner = {u} or {t}.{ordner_spalte} in (select m.parent from `tabPH Ordner Mitglied` m where m.user = {u} and m.parenttype = 'PH Ordner')))",
    ]
    for dt, leitung in regeln.BEZUG_LEITUNG.items():
        if r & set(leitung):
            teile.append(f"({t}.bezug_doctype = {frappe.db.escape(dt)})")
    if personal:
        teile.append(f"({t}.bezug_doctype = 'PH Mitarbeiter')")
    return "(" + " or ".join(teile) + ")"


def ordner_query(user=None, **kw):
    return _bedingung(user, "PH Ordner", "name")


def datei_query(user=None, **kw):
    return _bedingung(user, "PH Datei", "ordner")


def freigabelink_query(user=None, **kw):
    innen = _bedingung(user, "PH Datei", "ordner")
    if not innen:
        return ""
    return f"(`tabPH Datei Freigabelink`.datei in (select `tabPH Datei`.name from `tabPH Datei` where {innen}))"
