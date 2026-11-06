"""Inventurbewertung zum Stichtag (Frappe-Datenbeschaffung). Rechenregeln und Methodenbeschreibung: inventur_logik.py.

Quellen: PH Lagerbestand (heutige Menge, EK der Zeile, Zustand, Eingang, VK Ausstellung), PH Lagerbewegung (Rückrechnung zum
Stichtag, Zu-/Abgänge für den gleitenden Durchschnitt), PH Wareneingang → PH Herstellerbestellung Position `ek_cent`
(EK je Wareneingang), PH Produkt `einkaufspreis_cent`/`kategorie`/`abverkauf_preis_cent` (Rückfall, Warengruppe, Nettoerlös).
Zugriff nur PH Logistik Leitung, PH Geschäftsführung, PH Buchhaltung extern (+ Admin/System Manager).
"""

import frappe
from frappe import _
from frappe.utils import cint, getdate

from . import inventur_logik as IL

ROLLEN = {"PH Logistik Leitung", "PH Geschäftsführung", "PH Buchhaltung extern", "PH Backoffice-Admin", "System Manager"}

METHODE_TEXT = {
    "Gleitender Durchschnitt": "Gleitender Durchschnittspreis je Produkt/Ausführung über alle Lagerorte: jeder Wareneingang mit EK (Herstellerbestellung) mischt "
    "(Bestand vorher × Ø + Menge × EK) / (Bestand vorher + Menge); Abgänge ändern den Ø nicht; Zugänge ohne EK (Retoure, Inventurplus) zum Ø; "
    "Neubeginn, wenn der Bestand vor einem Eingang ≤ 0 war (UGB § 209 Abs 2, Durchschnittsverfahren).",
    "Letzter EK": "EK des letzten Wareneingangs mit bekanntem EK bis zum Stichtag je Produkt/Ausführung.",
}
RUECKFALL_TEXT = ("Ohne Wareneingang mit EK: EK der Bestandszeile, sonst gültiger EK des Produkts (+ Ausführungsaufpreis), sonst 0 (Hinweis „ohne EK“). "
                  "Niederstwert: Einzelwert = min(Einstandspreis × (1 − Abwertung), Nettoerlös aus VK Ausstellung/Abverkauf). Menge zum Stichtag = "
                  "heutige Menge − Bewegungen nach dem Stichtag (Rückrechnung). Anschaffungsnebenkosten (Fracht/Zoll) sind nicht enthalten.")


def pruefen_rechte():
    if not ROLLEN & set(frappe.get_roles()):
        frappe.throw(_("Inventurbewertung nur für Logistik-Leitung, Geschäftsführung und Buchhaltung."), frappe.PermissionError)


def staffel(e=None):
    e = e or frappe.get_single("PH Logistik Einstellungen")
    rows = [{"art": r.art, "ab_monate": cint(r.ab_monate), "abwertung_promille": cint(r.abwertung_promille)} for r in (e.get("abwertung_staffel") or [])]
    return rows or [dict(r) for r in IL.STANDARD_STAFFEL]


def _we_ek(we_namen):
    """{(wareneingang, produkt, ausfuehrung|None): ek_cent} aus der verknüpften Herstellerbestellung."""
    erg = {}
    if not we_namen or not frappe.db.exists("DocType", "PH Wareneingang"):
        return erg
    for we in frappe.get_all("PH Wareneingang", {"name": ("in", list(we_namen))}, ["name", "herstellerbestellung"]):
        if not we.herstellerbestellung:
            continue
        for p in frappe.get_all("PH Herstellerbestellung Position", {"parent": we.herstellerbestellung, "parenttype": "PH Herstellerbestellung"}, ["produkt", "ausfuehrung", "ek_cent", "ab_ek_cent"]):
            ek = p.ab_ek_cent if p.ab_ek_cent not in (None, 0) else p.ek_cent  # bestätigter AB-Preis vor Bestellpreis
            if ek is None:
                continue
            erg.setdefault((we.name, p.produkt, p.ausfuehrung), cint(ek))
            erg.setdefault((we.name, p.produkt, None), cint(ek))
    return erg


def _delta_gesamt(b):
    art, m = b.art, cint(b.menge)
    if art in IL.ZUGANG:
        return abs(m)
    if art in IL.ABGANG:
        return -abs(m)
    if art == "Inventur":
        return m
    return 0


def berechnen(stichtag, lagerort=None, methode=None):
    """→ dict {zeilen, summen{lagerort, warengruppe, marke, bewertungsart}, gesamt, hinweise, methode, methode_beschreibung, staffel, platzhalter}."""
    pruefen_rechte()
    s = getdate(stichtag)
    e = frappe.get_single("PH Logistik Einstellungen")
    methode = methode or e.get("bewertung_methode") or "Gleitender Durchschnitt"
    st = staffel(e)
    filt = {"lagerort": lagerort} if lagerort else {}
    zeilen_jetzt = frappe.get_all("PH Lagerbestand", filt, ["name", "produkt", "produkt_name", "ausfuehrung", "marke", "lagerort", "platz", "seriennummer", "ausstellungsstueck", "zustand",
                                                             "menge", "ek_cent", "vk_cent_ausstellung", "eingang_am", "gesperrt", "kommission"])
    namen = [z.name for z in zeilen_jetzt]
    danach = frappe.get_all("PH Lagerbewegung", {"datum": (">", f"{s} 23:59:59.999999")}, ["art", "menge", "lagerbestand", "lagerbestand_von"]) if namen else []
    mengen, unbekannt = IL.bestand_zum_stichtag({z.name: z.menge for z in zeilen_jetzt}, danach)

    produkte = {z.produkt for z in zeilen_jetzt if z.produkt and mengen.get(z.name, 0) > 0}
    # Chronologische Zu-/Abgänge je Produkt/Ausführung bis zum Stichtag (alle Lagerorte)
    bew = frappe.get_all("PH Lagerbewegung", {"produkt": ("in", list(produkte) or [""]), "datum": ("<=", f"{s} 23:59:59.999999")},
                         ["art", "menge", "produkt", "ausfuehrung", "bezug_doctype", "bezug", "datum", "creation"], order_by="datum asc, creation asc")
    we_ek = _we_ek({b.bezug for b in bew if b.art == "Wareneingang" and b.bezug_doctype == "PH Wareneingang" and b.bezug})
    ereignisse = {}
    for b in bew:
        d = _delta_gesamt(b)
        if not d:
            continue
        ek = we_ek.get((b.bezug, b.produkt, b.ausfuehrung), we_ek.get((b.bezug, b.produkt, None))) if b.art == "Wareneingang" else None
        ereignisse.setdefault((b.produkt, b.ausfuehrung or None), []).append({"delta": d, "ek_cent": ek})

    prod_info = {p.name: p for p in frappe.get_all("PH Produkt", {"name": ("in", list(produkte) or [""])}, ["name", "kategorie", "einkaufspreis_cent", "abverkauf", "abverkauf_preis_cent"])} if produkte else {}
    aufpreis = {a.name: cint(a.ek_aufpreis_cent) for a in frappe.get_all("PH Produkt Ausfuehrung", {"produkt": ("in", list(produkte) or [""])}, ["name", "ek_aufpreis_cent"])} if produkte else {}
    ust = cint(e.get("bewertung_ust_basispunkte") or 2000)
    kosten = cint(e.get("bewertung_vertriebskosten_promille"))

    zeilen, hinweise, ohne_ek, negativ = [], [], 0, 0
    preis_cache = {}
    for z in zeilen_jetzt:
        menge = mengen.get(z.name, 0)
        if menge < 0:
            negativ += 1
        if menge <= 0:
            continue
        p = prod_info.get(z.produkt) or frappe._dict()
        schluessel = (z.produkt, z.ausfuehrung or None)
        rueckfall = cint(z.ek_cent) or (cint(p.get("einkaufspreis_cent")) + aufpreis.get(z.ausfuehrung, 0) if p.get("einkaufspreis_cent") else 0)
        ev = ereignisse.get(schluessel) or ereignisse.get((z.produkt, None)) or []
        if (schluessel, rueckfall) not in preis_cache:
            preis_cache[(schluessel, rueckfall)] = IL.einstandspreis(methode, ev, rueckfall)
        ek, quelle = preis_cache[(schluessel, rueckfall)]
        art = IL.bewertungsart(z)
        alter = IL.alter_monate(z.eingang_am, s)
        abw = IL.abwertung_promille(art, alter, st)
        vk = z.vk_cent_ausstellung if art == "Ausstellungsstueck" else None
        if not vk and p.get("abverkauf") and art != "Lagerware":
            vk = p.get("abverkauf_preis_cent")
        ne = IL.nettoerloes(vk, ust, kosten)
        w = IL.bewerte(menge, ek, abw, ne)
        hinweis = []
        if quelle == "ohne EK":
            ohne_ek += 1
            hinweis.append(_("ohne EK"))
        if w["niederstwert"]:
            hinweis.append(_("Nettoerlös < Buchwert"))
        if z.gesperrt:
            hinweis.append(_("gesperrt"))
        if z.kommission:
            hinweis.append(_("Kommission {0}").format(z.kommission))
        zeilen.append({"lagerbestand": z.name, "produkt": z.produkt, "produkt_name": z.produkt_name, "ausfuehrung": z.ausfuehrung, "marke": z.marke, "warengruppe": p.get("kategorie"),
                       "lagerort": z.lagerort, "platz": z.platz, "seriennummer": z.seriennummer, "bewertungsart": art, "menge": menge, "einstandspreis_cent": ek, "ek_quelle": quelle,
                       "alter_monate": alter, "abwertung_promille": abw, "nettoerloes_cent": ne, "hinweis": ", ".join(hinweis), **{k: w[k] for k in ("einzelwert_cent", "wert_ak_cent", "abwertung_cent", "wert_cent")}})
    zeilen.sort(key=lambda x: (str(x["lagerort"]), str(x["platz"] or ""), str(x["produkt_name"] or "")))
    if ohne_ek:
        hinweise.append(_("{0} Positionen ohne EK (Wert 0) – EK am Produkt/Bestand pflegen.").format(ohne_ek))
    if unbekannt:
        hinweise.append(_("{0} Stück aus Umlagerungen ohne Quellzeile nach dem Stichtag – Mengen je Lagerort prüfen (Bewegungen vor 04.11.2026).").format(unbekannt))
    if negativ:
        hinweise.append(_("{0} Bestandszeilen wären zum Stichtag negativ – nicht bewertet, Bewegungen prüfen.").format(negativ))
    platzhalter = cint(e.get("abwertung_platzhalter") if e.get("abwertung_platzhalter") is not None else 1)
    if platzhalter:
        hinweise.append(_("Abwertungssätze sind Platzhalter – vom Steuerberater bestätigen lassen."))
    gesamt = {k: sum(cint(z[k]) for z in zeilen) for k in ("menge", "wert_ak_cent", "abwertung_cent", "wert_cent")}
    return {"stichtag": s, "lagerort": lagerort, "methode": methode, "methode_beschreibung": METHODE_TEXT[methode] + " " + RUECKFALL_TEXT, "staffel": st, "platzhalter": platzhalter,
            "zeilen": zeilen, "summen": {k: IL.summen(zeilen, k) for k in ("lagerort", "warengruppe", "marke", "bewertungsart")}, "gesamt": gesamt, "hinweise": hinweise, "ohne_ek": ohne_ek}


def staffel_text(st):
    return "\n".join(f"{r['art']} ab {r['ab_monate']} Monaten: {r['abwertung_promille'] / 10:g} %" for r in sorted(st, key=lambda r: (r["art"], r["ab_monate"])))


def euro(cent):
    v = cint(cent) / 100
    return f"{v:,.2f} €".replace(",", "X").replace(".", ",").replace("X", ".")
