"""Mobile Zählung (iPhone/iPad-Zählmodus der Backoffice-Oberfläche, ohne Desk) – Konzept 10-konzept-logistik.md § 8.1.

Methoden (alle `ph_logistik.ph_logistik.inventur_mobil.<name>`, angemeldet, Rolle Logistik/Admin):
  inventur_offen()                                  Geplante/laufende Inventuren mit Fortschritt
  inventur(name, nur_offen, bereich)                Kopf + Zählliste (Soll ausgeblendet bei Blindzählung)
  naechste_position(inventur, nach, bereich)        nächste ungezählte Position (Reihenfolge Platz, Bezeichnung)
  starten(inventur)                                 Zählliste erzeugen + Laufend
  scan(inventur, code)                              Code → Positionen (Bestand-QR, Seriennummer, EAN, Platz-QR „Lagerort/Platz“)
  zaehlen(inventur, lagerbestand, ist, idempotency_key)        absolute Zählung (Offline-Puffer: letzter Wert gewinnt)
  zaehlen_plus(inventur, code, anzahl, idempotency_key)        Stückscan atomar (+n/−n), Wiederholung liefert erste Antwort
  fund(inventur, lagerbestand|produkt, ist, platz, seriennummer, bemerkung, idempotency_key)
  fortschritt(inventur)
Idempotenz: Antworten je Schlüssel 24 h im Cache (`ph_logistik:inv_idem:<schlüssel>`).
"""

import json

import frappe
from frappe import _
from frappe.utils import cint

from . import inventur_logik as IL
from .bestand_logik import platz_aus_code
from .helfer import einstellungen

ROLLEN = {"PH Logistik Mitarbeiter", "PH Logistik Leitung", "PH Backoffice-Admin", "System Manager"}
LEITUNG = {"PH Logistik Leitung", "PH Backoffice-Admin", "System Manager", "PH Geschäftsführung"}
POS_FELDER = ("name", "idx", "lagerbestand", "produkt", "produkt_name", "platz", "seriennummer", "ean", "fund", "soll", "ist", "gezaehlt", "differenz", "grund", "bemerkung")


def _pruefen():
    if not ROLLEN & set(frappe.get_roles()):
        frappe.throw(_("Keine Berechtigung für den Zählmodus."), frappe.PermissionError)


def _blind():
    return bool(cint(einstellungen().get("inventur_soll_ausblenden"))) and not (LEITUNG & set(frappe.get_roles()))


def _pos(p, blind=None):
    blind = _blind() if blind is None else blind
    d = {k: p.get(k) for k in POS_FELDER}
    d["platz_anzeige"] = p.get("platz") or IL.OHNE_PLATZ
    if blind:
        d["soll"] = None
        d["differenz"] = None
    return d


def _doc(name, recht="read"):
    _pruefen()
    inv = frappe.get_doc("PH Inventur", name)
    inv.check_permission(recht)
    return inv


def _idem(key, fn):
    if not key:
        return fn()
    ck = f"ph_logistik:inv_idem:{str(key)[:120]}"
    alt = frappe.cache().get_value(ck)
    if alt is not None:
        erg = json.loads(alt)
        erg["wiederholt"] = 1
        return erg
    erg = fn()
    frappe.cache().set_value(ck, json.dumps(erg, default=str), expires_in_sec=86400)
    return erg


def _sortiert(inv, bereich=None):
    pos = list(inv.positionen)
    if bereich:
        b = str(bereich).strip().lower()
        pos = [p for p in pos if str(p.platz or IL.OHNE_PLATZ).lower().startswith(b.rstrip("*"))]
    return sorted(pos, key=lambda p: (str(p.platz or "~"), str(p.produkt_name or ""), cint(p.idx)))


def _fortschritt(inv):
    n = len(inv.positionen)
    gez = sum(1 for p in inv.positionen if p.gezaehlt)
    return {"inventur": inv.name, "status": inv.status, "positionen": n, "gezaehlt": gez, "offen": n - gez, "fortschritt_promille": round(gez * 1000 / n) if n else 0,
            "differenz_positionen": None if _blind() else inv.differenz_positionen}


@frappe.whitelist()
def inventur_offen():
    """Geplante und laufende Inventuren (neueste zuerst) mit Fortschritt – Startseite des Zählmodus."""
    _pruefen()
    rows = frappe.get_list("PH Inventur", {"status": ("in", ["Geplant", "Laufend"])}, ["name", "titel", "lagerort", "datum", "status", "inventur_art", "anlass", "nur_ausstellungsstuecke",
                                                                                      "gezaehlt_von", "anzahl_positionen", "anzahl_gezaehlt"], order_by="datum desc, creation desc", limit=50)
    for r in rows:
        n = cint(r.anzahl_positionen)
        r["fortschritt_promille"] = round(cint(r.anzahl_gezaehlt) * 1000 / n) if n else 0
        r["inventur_art"] = r.inventur_art or "Stichtag"
    return rows


@frappe.whitelist()
def inventur(name, nur_offen=0, bereich=None):
    inv = _doc(name)
    blind = _blind()
    pos = [p for p in _sortiert(inv, bereich) if not (cint(nur_offen) and p.gezaehlt)]
    kopf = {k: inv.get(k) for k in ("name", "titel", "lagerort", "datum", "status", "inventur_art", "anlass", "plaetze", "nur_ausstellungsstuecke", "gezaehlt_von")}
    return {"kopf": kopf, "fortschritt": _fortschritt(inv), "soll_ausgeblendet": int(blind), "positionen": [_pos(p, blind) for p in pos]}


@frappe.whitelist()
def naechste_position(inventur, nach=None, bereich=None):
    """Nächste ungezählte Position nach `nach` (Positionsname), sonst die erste ungezählte; am Ende wieder von vorn.
    → {position|None, fertig, fortschritt}."""
    inv = _doc(inventur)
    pos = _sortiert(inv, bereich)
    offen = [p for p in pos if not p.gezaehlt]
    if not offen:
        return {"position": None, "fertig": 1, "fortschritt": _fortschritt(inv)}
    if nach:
        namen = [p.name for p in pos]
        if nach in namen:
            i = namen.index(nach)
            danach = [p for p in pos[i + 1:] if not p.gezaehlt]
            if danach:
                return {"position": _pos(danach[0]), "fertig": 0, "fortschritt": _fortschritt(inv)}
    return {"position": _pos(offen[0]), "fertig": 0, "fortschritt": _fortschritt(inv)}


@frappe.whitelist(methods=["POST"])
def starten(inventur):
    inv = _doc(inventur, "write")
    if inv.status == "Geplant":
        inv.starten()
        inv.reload()
    return _fortschritt(inv)


@frappe.whitelist()
def scan(inventur, code):
    """Code auflösen: Bestand-QR/Seriennummer/EAN → passende Positionen; Platz-QR „Lagerort/Platz“ → Positionen am Platz.
    → {art: position|platz|unbekannt, positionen[]}."""
    inv = _doc(inventur)
    k = str(code or "").strip()
    if not k:
        frappe.throw(_("Kein Code."))
    kl = k.lower()
    treffer = [p for p in inv.positionen if kl in (str(p.lagerbestand or "").lower(), str(p.seriennummer or "").lower(), str(p.ean or "").lower())]
    if treffer:
        return {"art": "position", "positionen": [_pos(p) for p in treffer]}
    ort, platz = platz_aus_code(k)
    if ort == inv.lagerort:
        am = [p for p in _sortiert(inv) if (p.platz or IL.OHNE_PLATZ) == (platz or IL.OHNE_PLATZ)]
        return {"art": "platz", "platz": platz or IL.OHNE_PLATZ, "positionen": [_pos(p) for p in am]}
    return {"art": "unbekannt", "positionen": [], "hinweis": _("Unbekannter Code – „Als Fund erfassen“.")}


@frappe.whitelist(methods=["POST"])
def zaehlen(inventur, lagerbestand, ist, idempotency_key=None):
    def tun():
        inv = _doc(inventur, "write")
        d = inv.zaehlen(lagerbestand, cint(ist))
        inv.reload()
        p = next(x for x in inv.positionen if x.lagerbestand == lagerbestand)
        return {"position": _pos(p), "differenz": None if _blind() else d, "fortschritt": _fortschritt(inv)}

    return _idem(idempotency_key, tun)


@frappe.whitelist(methods=["POST"])
def zaehlen_plus(inventur, code, anzahl=1, idempotency_key=None):
    def tun():
        inv = _doc(inventur, "write")
        r = inv.zaehlen_plus(code, cint(anzahl) or 1)
        inv.reload()
        p = next(x for x in inv.positionen if x.name == r["position"])
        return {"position": _pos(p), "ist": r["ist"], "soll": None if _blind() else r["soll"], "differenz": None if _blind() else r["differenz"], "fortschritt": _fortschritt(inv)}

    return _idem(idempotency_key, tun)


@frappe.whitelist(methods=["POST"])
def fund(inventur, lagerbestand=None, produkt=None, ist=1, platz=None, seriennummer=None, bemerkung=None, idempotency_key=None):
    def tun():
        inv = _doc(inventur, "write")
        name = inv.position_hinzufuegen(lagerbestand=lagerbestand, produkt=produkt, ist=cint(ist), platz=platz, seriennummer=seriennummer, bemerkung=bemerkung)
        inv.reload()
        p = next(x for x in inv.positionen if x.lagerbestand == name)
        return {"lagerbestand": name, "position": _pos(p), "fortschritt": _fortschritt(inv)}

    return _idem(idempotency_key, tun)


@frappe.whitelist()
def fortschritt(inventur):
    return _fortschritt(_doc(inventur))
