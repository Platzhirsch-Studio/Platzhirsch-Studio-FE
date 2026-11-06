"""PH Kampagne – Kanal, Zeitraum, Budget, Ziel, Auswertung. Status über Workflow; Kennzahlen in validate aggregiert."""

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import cint, getdate, nowdate


class PHKampagne(Document):
    def validate(self):
        self.titel = (self.titel or "").strip()
        if self.zeitraum_bis and self.zeitraum_von and getdate(self.zeitraum_bis) < getdate(self.zeitraum_von):
            frappe.throw(_("„Zeitraum bis“ liegt vor „Zeitraum von“."))
        if (self.budget_cent or 0) < 0:
            frappe.throw(_("Budget darf nicht negativ sein."))
        self.utm_campaign = (self.utm_campaign or "").strip().lower() or None
        self.aggregieren()

    def aggregieren(self):
        imp = kl = ko = manuell = 0
        for z in self.kennzahlen:
            imp += cint(z.impressionen)
            kl += cint(z.klicks)
            ko += cint(z.kosten_cent)
            manuell += cint(z.anfragen)
        self.impressionen_gesamt = imp
        self.klicks_gesamt = kl
        self.ausgaben_cent = ko
        self.klickrate_promille = round(1000 * kl / imp) if imp else 0
        auto = self.anfragen_aus_crm()
        self.anfragen_gesamt = auto if auto else manuell
        self.kosten_je_anfrage_cent = round(ko / self.anfragen_gesamt) if self.anfragen_gesamt else 0
        self.kosten_je_klick_cent = round(ko / kl) if kl else 0
        if self.budget_cent and ko > self.budget_cent:
            frappe.msgprint(_("Ausgaben ({0}) übersteigen das Budget ({1}).").format(ko, self.budget_cent), indicator="orange", alert=True)

    def anfragen_aus_crm(self):
        if self.is_new() or not frappe.db.exists("DocType", "PH Anfrage"):
            return 0
        if not frappe.db.has_column("PH Anfrage", "ph_marketing_kampagne"):
            return 0
        return frappe.db.count("PH Anfrage", {"ph_marketing_kampagne": self.name, "status": ("!=", "Spam")})

    # ── Buttons (ph_kampagne.js) ──────────────────────────────────────────
    @frappe.whitelist()
    def kennzahl_erfassen(self, datum=None, impressionen=0, klicks=0, kosten_cent=0, anfragen=0, notiz=None):
        self.check_permission("write")
        self.append("kennzahlen", {"datum": datum or nowdate(), "impressionen": cint(impressionen), "klicks": cint(klicks), "kosten_cent": cint(kosten_cent), "anfragen": cint(anfragen), "notiz": notiz})
        self.save()
        return self.ausgaben_cent

    @frappe.whitelist()
    def anfragen_zaehlen(self):
        """Button „Anfragen zählen“ und Aufruf aus ereignisse.py."""
        n = self.anfragen_aus_crm()
        self.db_set({"anfragen_gesamt": n, "kosten_je_anfrage_cent": round(cint(self.ausgaben_cent) / n) if n else 0}, update_modified=False)
        return n

    @frappe.whitelist()
    def attribution_berechnen(self):
        """Umsatz aus Aufträgen/Bestellungen über Kontaktpunkte (Modell First/Last/Linear), ROI, Zielfortschritt."""
        self.check_permission("read")
        from ph_marketing.ph_marketing import kampagnen

        return kampagnen.kampagne_aktualisieren(self)

    @frappe.whitelist()
    def kennzahlen_import(self, csv_text, vorschau=1):
        """CSV-Export von Meta/Google/Pinterest einlesen (Konzept L9). vorschau=1 → nur prüfen."""
        self.check_permission("write")
        from ph_marketing.utils.kennzahlen_csv import lesen

        zeilen, fehler = lesen(csv_text or "")
        if cint(vorschau) or fehler:
            return {"zeilen": zeilen[:50], "anzahl": len(zeilen), "fehler": fehler, "kosten_cent": sum(z["kosten_cent"] for z in zeilen)}
        vorhanden = {(str(z.datum), cint(z.impressionen), cint(z.klicks), cint(z.kosten_cent)) for z in self.kennzahlen}
        neu = 0
        for z in zeilen:
            if (z["datum"], z["impressionen"], z["klicks"], z["kosten_cent"]) in vorhanden:
                continue  # gleicher Export zweimal importiert
            self.append("kennzahlen", {**z, "notiz": "CSV-Import"})
            neu += 1
        self.save()
        return {"anzahl": len(zeilen), "neu": neu, "fehler": [], "ausgaben_cent": self.ausgaben_cent}

    @frappe.whitelist()
    def auswertung(self):
        """Daten für den Kampagnenbericht (Print Format) und den Dialog „Auswertung“."""
        self.check_permission("read")
        anfragen = []
        if frappe.db.exists("DocType", "PH Anfrage") and frappe.db.has_column("PH Anfrage", "ph_marketing_kampagne"):
            anfragen = frappe.get_all("PH Anfrage", filters={"ph_marketing_kampagne": self.name}, fields=["name", "titel", "status", "eingang", "art"], order_by="eingang desc", limit=200)
        return {
            "anfragen": anfragen,
            "gewonnen": sum(1 for a in anfragen if a.status == "Gewonnen"),
            "beitraege": frappe.db.count("PH Social Beitrag", {"kampagne": self.name}),
            "newsletter": frappe.db.count("PH Newsletter Ausgabe", {"kampagne": self.name, "status": "Versendet"}),
            "events": frappe.get_all("PH Event", filters={"kampagne": self.name}, fields=["name", "titel", "datum", "plaetze_belegt"]),
            "budget_rest_cent": cint(self.budget_cent) - cint(self.ausgaben_cent),
            "kontaktpunkte": frappe.db.count("PH Kampagne Kontaktpunkt", {"kampagne": self.name}),
            "umsatz_attribuiert_cent": cint(self.get("umsatz_attribuiert_cent")),
            "roi_promille": self.get("roi_promille"),
            "ziel_ist": cint(self.get("ziel_ist")),
        }
