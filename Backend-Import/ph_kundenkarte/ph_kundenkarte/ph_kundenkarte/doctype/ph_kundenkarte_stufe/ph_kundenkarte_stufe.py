"""PH Kundenkarte Stufe – Stammdaten. Schwellen steigen mit der Reihenfolge; Texte ohne Euro-/Prozentversprechen."""

import re

import frappe
from frappe import _
from frappe.model.document import Document

GELD_RE = re.compile(r"(\d\s?%|\d\s?€|\bEUR\b|Euro|Prozent|Rabatt|Bonus|Guthaben|Punkte)", re.IGNORECASE)
SUPERLATIV_RE = re.compile(r"\b(beste[rsn]?|exklusivste|größte|einzigartig|unschlagbar|billigste|günstigste)\b", re.IGNORECASE)


def texte_pruefen(*texte):
    """Wirft, wenn ein Kundentext Geldwert-Versprechen oder Superlative enthält (rechtliche Leitplanke)."""
    for t in texte:
        if not t:
            continue
        m = GELD_RE.search(t)
        if m:
            frappe.throw(_("Kundentexte der Kundenkarte dürfen keine Rabatte, Guthaben oder Punkte versprechen („{0}“). Stufe 1 kennt nur Leistungsvorteile.").format(m.group(0)))
        m = SUPERLATIV_RE.search(t)
        if m:
            frappe.throw(_("Bitte ohne Superlative formulieren („{0}“).").format(m.group(0)))


class PHKundenkarteStufe(Document):
    def validate(self):
        self.stufenname = (self.stufenname or "").strip()
        if not self.stufenname:
            frappe.throw(_("Stufenname fehlt."))
        if int(self.reihenfolge or 0) <= 0:
            frappe.throw(_("Reihenfolge muss 1 oder größer sein."))
        if int(self.schwelle_jahresumsatz_cent or 0) < 0:
            frappe.throw(_("Schwelle darf nicht negativ sein."))
        texte_pruefen(self.beschreibung_kunde)
        for z in self.vorteile or []:
            texte_pruefen(z.hinweis)
        self._reihenfolge_pruefen()
        gesehen = set()
        for z in self.vorteile or []:
            if z.vorteil in gesehen:
                frappe.throw(_("Vorteil {0} ist doppelt zugeordnet.").format(z.vorteil))
            gesehen.add(z.vorteil)

    def _reihenfolge_pruefen(self):
        """Schwellen müssen monoton mit der Reihenfolge steigen (sonst ist die Einstufung mehrdeutig)."""
        andere = frappe.get_all("PH Kundenkarte Stufe", filters={"name": ("!=", self.name or ""), "aktiv": 1}, fields=["name", "reihenfolge", "schwelle_jahresumsatz_cent"])
        for a in andere:
            if int(a.reihenfolge) == int(self.reihenfolge):
                frappe.throw(_("Reihenfolge {0} ist bereits durch {1} belegt.").format(self.reihenfolge, a.name))
            if int(a.reihenfolge) < int(self.reihenfolge) and int(a.schwelle_jahresumsatz_cent or 0) > int(self.schwelle_jahresumsatz_cent or 0):
                frappe.throw(_("Schwelle muss höher sein als die der niedrigeren Stufe {0}.").format(a.name))
            if int(a.reihenfolge) > int(self.reihenfolge) and int(a.schwelle_jahresumsatz_cent or 0) < int(self.schwelle_jahresumsatz_cent or 0):
                frappe.throw(_("Schwelle muss niedriger sein als die der höheren Stufe {0}.").format(a.name))

    def on_update(self):
        frappe.cache().delete_value("ph_kundenkarte:stufen")


def stufen_liste():
    """Aktive Stufen als Liste von dicts (für utils.stufen), gecacht."""
    liste = frappe.cache().get_value("ph_kundenkarte:stufen")
    if liste is None:
        liste = frappe.get_all("PH Kundenkarte Stufe", filters={"aktiv": 1}, fields=["name", "reihenfolge", "schwelle_jahresumsatz_cent", "farbe", "beschreibung_kunde"], order_by="reihenfolge asc")
        liste = [dict(s) for s in liste]
        frappe.cache().set_value("ph_kundenkarte:stufen", liste)
    return liste


def stufen_vorteile():
    """Alle Stufe→Vorteil-Zuordnungen aktiver Vorteile: [{stufe, vorteil, hinweis, titel, art, beschreibung_kunde, einloesbar_pro_jahr, gilt_ab_stufe}]."""
    zeilen = frappe.get_all("PH Kundenkarte Stufe Vorteil", fields=["parent", "vorteil", "hinweis", "idx"], order_by="idx asc")
    vorteile = {v.name: v for v in frappe.get_all("PH Kundenkarte Vorteil", filters={"aktiv": 1}, fields=["name", "titel", "art", "beschreibung_kunde", "einloesbar_pro_jahr", "gilt_ab_stufe", "reihenfolge"])}
    out = []
    for z in zeilen:
        v = vorteile.get(z.vorteil)
        if not v:
            continue
        out.append({"stufe": z.parent, "vorteil": z.vorteil, "hinweis": z.hinweis, "titel": v.titel, "art": v.art, "beschreibung_kunde": v.beschreibung_kunde, "einloesbar_pro_jahr": int(v.einloesbar_pro_jahr or 0), "gilt_ab_stufe": v.gilt_ab_stufe, "reihenfolge": int(v.reihenfolge or 0)})
    return out
