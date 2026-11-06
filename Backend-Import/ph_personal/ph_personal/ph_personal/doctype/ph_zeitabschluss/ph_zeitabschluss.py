"""PH Zeitabschluss – Monatsabschluss je Person (Fachkritik P4/B6/R7).

Abschließen friert die Monatsübersicht ein (Soll/Ist/Saldo, Vortrag, Lohnvorbereitungs-Spalten) und sperrt
PH Zeiterfassung, PH Abwesenheit und PH Krankmeldung des Monats (zeitkonto.sperre_pruefen). Korrektur nur
über „Wieder öffnen“ (Leitung, Pflichtgrund) und erneutes Abschließen – jede Änderung bleibt in der Version
sichtbar. Folgemonate übernehmen den kumulierten Saldo als Vortrag.
"""

import json

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import cint, now_datetime

from ph_personal.logik import minuten_text

FELDER = (
    "soll_min", "ist_min", "gutschrift_min", "za_verbrauch_min", "saldo_min", "saldo_vortrag_min", "saldo_kumuliert_min",
    "mehrarbeit_min", "kv_mehrstunden_min", "ueberstunden_min", "za_gutschrift_min", "ueberstunden_abgeltung",
    "feiertag_min", "unbezahlt_min", "urlaub_tage", "krank_tage", "arbeitsunfall_tage", "za_tage", "pflege_tage",
    "sonder_tage", "fortbildung_tage", "berufsschule_tage", "unbezahlt_tage", "ruhend_tage",
)


class PHZeitabschluss(Document):
    def before_insert(self):
        from ph_personal.ph_personal.zeitkonto import periode

        self.periode = periode(self.jahr, self.monat)

    def validate(self):
        if not 1 <= cint(self.monat) <= 12:
            frappe.throw(_("Monat muss zwischen 1 und 12 liegen."))
        name = self.mitarbeiter_name or frappe.db.get_value("PH Mitarbeiter", self.mitarbeiter, "titel")
        self.titel = f"{name} · {cint(self.monat):02d}/{self.jahr}"
        self.saldo_text = minuten_text(self.saldo_kumuliert_min or 0)

    def werte_uebernehmen(self, m):
        for f in FELDER:
            if f in m:
                self.set(f, m[f])
        fenster = m.get("fenster") or {}
        self.samstag_ab_13_min = fenster.get("samstag_ab_13", 0)
        self.sonntag_min = fenster.get("sonntag", 0)
        self.feiertag_arbeit_min = fenster.get("feiertag", 0)
        self.nacht_min = fenster.get("nacht", 0)
        from ph_personal.utils.azg import zusammenfassung

        z = zusammenfassung(m.get("azg") or [])
        self.azg_verstoesse, self.azg_hinweise, self.azg_befunde = z["verstoesse"], z["hinweise"], z["text"] or None
        self.details = json.dumps({"wochen": m.get("wochen"), "offen": m.get("offen"), "von": str(m.get("von")), "bis": str(m.get("bis"))}, default=str, ensure_ascii=False)

    @frappe.whitelist()
    def wieder_oeffnen(self, grund):
        """Button „Wieder öffnen“ (Leitung): Monat für Korrekturen freigeben – danach erneut abschließen."""
        if "PH Personal Leitung" not in frappe.get_roles() and frappe.session.user != "Administrator":
            frappe.throw(_("Nur die Personal-Leitung kann abgeschlossene Monate öffnen."), frappe.PermissionError)
        if not (grund or "").strip():
            frappe.throw(_("Bitte einen Grund angeben (Nachvollziehbarkeit AZG § 26)."))
        spaetere = frappe.get_all("PH Zeitabschluss", filters={"mitarbeiter": self.mitarbeiter, "status": "Abgeschlossen", "periode": (">", self.periode)}, pluck="name")
        if spaetere:
            frappe.throw(_("Zuerst die späteren Abschlüsse öffnen: {0}").format(", ".join(spaetere)))
        self.status = "Wieder geoeffnet"
        self.wieder_geoeffnet_grund = grund
        self.wieder_geoeffnet_von = frappe.session.user
        self.wieder_geoeffnet_am = now_datetime()
        self.save()
        self.add_comment("Info", _("Wieder geöffnet: {0}").format(grund))
        return self.status

    @frappe.whitelist()
    def zeitnachweis_uebermittelt(self, per="Selbstservice-Download"):
        """§ 26 Abs 8 AZG: monatliche, kostenlose Übermittlung der Aufzeichnungen auf Verlangen – Nachweis."""
        self.check_permission("read")
        self.db_set({"zeitnachweis_uebermittelt_am": now_datetime(), "zeitnachweis_uebermittelt_per": per[:140]}, update_modified=False)
        self.add_comment("Info", _("Zeitnachweis {0} übermittelt ({1})").format(self.periode, per))
        return self.zeitnachweis_uebermittelt_am

    @frappe.whitelist()
    def erneut_abschliessen(self):
        """Button „Erneut abschließen“: Werte neu berechnen, Sperre wieder setzen."""
        return abschliessen(self.mitarbeiter, self.jahr, self.monat).name


def abschliessen(mitarbeiter, jahr, monat):
    """Monat einer Person abschließen (idempotent: vorhandener Abschluss bleibt; wieder geöffneter wird neu
    berechnet). Offene Buchungen (ohne „Gehen“) oder offene Korrekturanträge verhindern den Abschluss."""
    from ph_personal.ph_personal.zeitkonto import monatsuebersicht, periode

    jahr, monat = cint(jahr), cint(monat)
    name = frappe.db.get_value("PH Zeitabschluss", {"mitarbeiter": mitarbeiter, "periode": periode(jahr, monat)}, "name")
    doc = frappe.get_doc("PH Zeitabschluss", name) if name else None
    if doc and doc.status == "Abgeschlossen":
        return doc
    m = monatsuebersicht(mitarbeiter, jahr, monat)
    if m["offen"]:
        frappe.throw(_("{0}: {1} Buchung(en) ohne „Gehen“ – bitte zuerst ergänzen.").format(m["name"], m["offen"]))
    if m["korrektur_offen"]:
        frappe.throw(_("{0}: {1} offene(r) Korrekturantrag/-anträge – bitte zuerst entscheiden.").format(m["name"], m["korrektur_offen"]))
    if not doc:
        doc = frappe.get_doc({"doctype": "PH Zeitabschluss", "mitarbeiter": mitarbeiter, "jahr": jahr, "monat": monat})
    doc.werte_uebernehmen(m)
    doc.status = "Abgeschlossen"
    if doc.azg_verstoesse:
        frappe.msgprint(_("{0}: {1} AZG/ARG-Verstoß/Verstöße im Monat – im Abschluss protokolliert.").format(m["name"], doc.azg_verstoesse), indicator="orange")
    doc.abgeschlossen_von = frappe.session.user
    doc.abgeschlossen_am = now_datetime()
    if doc.is_new():
        doc.insert()
    else:
        doc.save()
    return doc
