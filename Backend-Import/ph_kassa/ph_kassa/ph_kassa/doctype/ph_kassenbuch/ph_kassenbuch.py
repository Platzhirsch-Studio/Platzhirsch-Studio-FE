"""PH Kassenbuch – Bargeldbewegungen je Kasse mit fortlaufendem Bestand.

Regeln: Betrag positiv, Vorzeichen aus Art (logik/abschluss.py); Grund bei Einlage/Entnahme/Differenz
Pflicht; keine Änderung nach Buchung (nur Gegenbuchung durch Leitung); Bestand = Bestand der letzten
Buchung dieser Kasse + Bewegung.
"""

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import getdate, now_datetime

from ph_kassa.logik.abschluss import bewegung_cent
from ph_kassa.logik.betraege import KassenFehler, format_betrag

GRUND_PFLICHT = ("Einlage", "Entnahme", "Differenz")
GESCHUETZT = ("kasse", "art", "betrag_cent", "zeitpunkt", "bewegung_cent", "bestand_danach_cent")


class PHKassenbuch(Document):
    def before_insert(self):
        if not self.zeitpunkt:
            self.zeitpunkt = now_datetime()
        self.bediener = self.bediener or frappe.session.user
        self.status = self.status or "Gebucht"

    def validate(self):
        try:
            self.bewegung_cent = bewegung_cent(self.art, int(self.betrag_cent or 0))
        except KassenFehler as e:
            frappe.throw(str(e))
        if self.art in GRUND_PFLICHT and not (self.grund or "").strip():
            frappe.throw(_("Bitte einen Grund angeben ({0}).").format(_(self.art)))
        if self.art != "Differenz" and int(self.betrag_cent or 0) == 0:
            frappe.throw(_("Betrag 0 ist nur für Differenzbuchungen erlaubt."))
        self.datum = getdate(self.zeitpunkt)
        if not self.is_new():
            alt = self.get_doc_before_save()
            if alt:
                for f in GESCHUETZT:
                    if (alt.get(f) or 0) != (self.get(f) or 0):
                        frappe.throw(_("Kassenbuch-Buchungen sind unveränderlich – bitte Gegenbuchung („Stornieren“)."))
        else:
            self.waehrung = self.waehrung or "EUR"
            self.bestand_danach_cent = letzter_bestand(self.kasse, self.waehrung) + int(self.bewegung_cent)
        self.titel = f"{_(self.art)} {format_betrag(self.betrag_cent)} · {self.kasse}"[:140]

    def on_trash(self):
        frappe.throw(_("Kassenbuch-Buchungen werden nicht gelöscht, sondern storniert."))

    @frappe.whitelist()
    def stornieren(self, grund):
        """Button „Stornieren“ (Leitung): Gegenbuchung mit umgekehrter Art."""
        self.check_permission("write")
        if "PH Kassa Leitung" not in frappe.get_roles() and "System Manager" not in frappe.get_roles():
            frappe.throw(_("Nur die Kassa-Leitung storniert Kassenbuch-Buchungen."))
        if self.status == "Storniert":
            frappe.throw(_("Bereits storniert."))
        gegen_art = {"Einlage": "Entnahme", "Entnahme": "Einlage", "Bareinnahme": "Barausgabe", "Barausgabe": "Bareinnahme", "Anfangsbestand": "Entnahme", "Differenz": "Differenz"}[self.art]
        betrag = -int(self.betrag_cent) if self.art == "Differenz" else int(self.betrag_cent)
        gegen = buchen(self.kasse, gegen_art, betrag, _("Storno {0}: {1}").format(self.name, grund), quelle="manuell", storno_von=self.name, waehrung=self.waehrung or "EUR")
        self.db_set({"status": "Storniert", "storniert_durch": gegen.name})
        self.add_comment("Info", _("Storniert durch {0}").format(gegen.name))
        return gegen.name


def _waehrung_filter(waehrung):
    # Altdaten ohne Währung zählen als EUR
    return ["waehrung", "in", ["EUR", "", None]] if (waehrung or "EUR") == "EUR" else ["waehrung", "=", waehrung]


def letzter_bestand(kasse: str, waehrung: str = "EUR") -> int:
    """Bestand laut Kassenbuch = Bargeld in der Lade (seit P2 enthält das Kassenbuch jeden Bar-Beleg)."""
    row = frappe.get_all("PH Kassenbuch", filters=[["kasse", "=", kasse], _waehrung_filter(waehrung)], fields=["bestand_danach_cent"], order_by="creation desc", limit=1)
    return int(row[0].bestand_danach_cent or 0) if row else 0


def bestand_vor(kasse: str, zeitpunkt, waehrung: str = "EUR") -> int:
    """Bestand unmittelbar vor einem Zeitpunkt (Beginn des Geschäftstags) – Grundlage des Anfangsbestands (P3)."""
    row = frappe.get_all("PH Kassenbuch", filters=[["kasse", "=", kasse], ["zeitpunkt", "<", zeitpunkt], _waehrung_filter(waehrung)], fields=["bestand_danach_cent"], order_by="zeitpunkt desc, creation desc", limit=1)
    return int(row[0].bestand_danach_cent or 0) if row else 0


def buchen(kasse, art, betrag_cent, grund=None, quelle="kassa", beleg=None, kassenabschluss=None, storno_von=None, idempotency_key=None, zeitpunkt=None, waehrung="EUR", ignore_permissions=False):
    """Zentrale Buchungsfunktion (Page, Tagesabschluss, Belegsummen). ignore_permissions nur für Systembuchungen
    (Bar-Beleg aus PH Kassenbeleg.on_submit, Differenz aus dem Abschluss)."""
    if idempotency_key:
        alt = frappe.db.get_value("PH Kassenbuch", {"idempotency_key": idempotency_key}, "name")
        if alt:
            return frappe.get_doc("PH Kassenbuch", alt)
    doc = frappe.get_doc(
        {
            "doctype": "PH Kassenbuch",
            "kasse": kasse,
            "art": art,
            "betrag_cent": int(betrag_cent),
            "grund": grund,
            "quelle": quelle,
            "beleg": beleg,
            "kassenabschluss": kassenabschluss,
            "storno_von": storno_von,
            "idempotency_key": idempotency_key,
            "zeitpunkt": zeitpunkt or now_datetime(),
            "waehrung": waehrung or "EUR",
        }
    )
    doc.insert(ignore_permissions=ignore_permissions)
    if art in ("Einlage", "Entnahme") and (waehrung or "EUR") == "EUR":
        # Nebenbuchung in ph_shop PH Zahlung (Verrechnung), falls die Funktion schon vorhanden ist.
        from ph_kassa.schnittstellen import zahlung_buchen

        z = zahlung_buchen(art="Eingang" if art == "Einlage" else "Ausgang", kanal="Bar", betrag_cent=int(betrag_cent), bezug_doctype="PH Kassenbuch", bezug=doc.name, notiz=grund)
        if z is not None and getattr(z, "name", None):
            doc.db_set("zahlung", z.name, update_modified=False)
    return doc


def tagesbewegungen(kasse: str, datum, waehrung: str = "EUR", von=None, bis=None) -> dict:
    """Einlagen/Entnahmen/Differenz eines Tages (für den Tagesabschluss); von/bis = Geschäftstag (Tageswechsel)."""
    filters = [["kasse", "=", kasse], ["status", "=", "Gebucht"], _waehrung_filter(waehrung)]
    if von and bis:
        filters.append(["zeitpunkt", "between", [von, bis]])
    else:
        filters.append(["datum", "=", getdate(datum)])
    rows = frappe.get_all("PH Kassenbuch", filters=filters, fields=["art", "betrag_cent", "bewegung_cent", "kassenabschluss"])
    out = {"einlagen_cent": 0, "entnahmen_cent": 0, "differenz_cent": 0, "anfangsbestand_cent": 0}
    for r in rows:
        if r.art == "Einlage":
            out["einlagen_cent"] += int(r.betrag_cent)
        elif r.art == "Entnahme":
            out["entnahmen_cent"] += int(r.betrag_cent)
        elif r.art == "Differenz":
            out["differenz_cent"] += int(r.bewegung_cent)
        elif r.art == "Anfangsbestand":
            out["anfangsbestand_cent"] += int(r.betrag_cent)
        if r.art == "Differenz" and r.kassenabschluss:
            out.setdefault("differenz_je_abschluss", {})
            out["differenz_je_abschluss"][r.kassenabschluss] = out["differenz_je_abschluss"].get(r.kassenabschluss, 0) + int(r.bewegung_cent)
    return out
