"""PH Projekt Nachkalkulation – eingefrorener Snapshot bei Projektabschluss (nachkalkulation.nachkalkulation_erstellen).

Entwurf: Zahlen neu berechnen, Kommentare je Kostenart erfassen (Pflicht ab Abweichung > Schwelle, Standard 10 %).
Abschließen: Kommentarpflicht prüfen, danach unveränderlich (nur Fazit). Lernwerte → PH Montage Richtwert.
Satzänderungen in den Einstellungen rechnen abgeschlossene Nachkalkulationen nicht neu.
"""

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import cint, now_datetime

from ph_projekte.ph_projekte import nachkalkulation as nk

EDITIERBAR_NACH_ABSCHLUSS = ("fazit",)
OHNE_WERT = ("Section Break", "Column Break", "Tab Break", "Table", "HTML")


class PHProjektNachkalkulation(Document):
    def validate(self):
        titel = frappe.db.get_value("PH Projekt", self.projekt, "titel") or self.projekt
        self.titel = _("Nachkalkulation {0}").format(titel)[:140]
        vorher = self.get_doc_before_save()
        if vorher and vorher.status == "Abgeschlossen" and not self.flags.ph_system:
            for f in self.meta.fields:
                if f.fieldname in EDITIERBAR_NACH_ABSCHLUSS or f.fieldtype in OHNE_WERT:
                    continue
                if str(vorher.get(f.fieldname) or "") != str(self.get(f.fieldname) or ""):
                    frappe.throw(_("Abgeschlossene Nachkalkulation ist eingefroren ({0}).").format(f.label or f.fieldname))
            alt = {z.name: (z.kommentar or "") for z in vorher.kostenarten}
            if any(alt.get(z.name, "") != (z.kommentar or "") for z in self.kostenarten):
                frappe.throw(_("Abgeschlossene Nachkalkulation ist eingefroren (Kommentare)."))

    def fehlende_kommentare(self):
        return [z.kostenart for z in self.kostenarten if cint(z.kommentar_pflicht) and not (z.kommentar or "").strip()]

    @frappe.whitelist()
    def neu_berechnen(self):
        self.check_permission("write")
        if self.status != "Entwurf":
            frappe.throw(_("Nur Entwürfe werden neu berechnet."))
        return nk.nachkalkulation_erstellen(self.projekt, neu_berechnen=1)

    @frappe.whitelist()
    def abschliessen(self):
        self.check_permission("write")
        if self.status == "Abgeschlossen":
            return self.name
        fehlt = self.fehlende_kommentare()
        if fehlt:
            frappe.throw(_("Bitte die Abweichung begründen (über {0} %): {1}").format(self.schwelle_prozent, ", ".join(fehlt)))
        self.status = "Abgeschlossen"
        self.abgeschlossen_von = frappe.session.user
        self.abgeschlossen_am = now_datetime()
        self.save()
        nk.protokoll("Nachkalkulation", self.doctype, self.name, "status", "Entwurf", "Abgeschlossen", projekt=self.projekt)
        return self.name

    @frappe.whitelist()
    def richtwerte_uebernehmen(self):
        """Markierte Lernwerte als Montage-Richtwert (Minuten je Stück) in PH Projekte Einstellungen übernehmen."""
        self.check_permission("write")
        nk.pruefe_leitung()
        auswahl = [z for z in self.lernwerte if cint(z.uebernehmen) and cint(z.min_je_stueck) > 0]
        if not auswahl:
            frappe.throw(_("Bitte mindestens einen Lernwert mit „In Richtwerte übernehmen“ markieren."))
        e = frappe.get_single("PH Projekte Einstellungen")
        alt = {r.kategorie: cint(r.minuten_je_stueck) for r in e.montage_richtwerte}
        for z in auswahl:
            zeile = next((r for r in e.montage_richtwerte if r.kategorie == z.kategorie), None)
            if zeile:
                zeile.minuten_je_stueck = cint(z.min_je_stueck)
                zeile.notiz = _("aus {0}").format(self.name)[:140]
            else:
                e.append("montage_richtwerte", {"kategorie": z.kategorie, "minuten_je_stueck": cint(z.min_je_stueck), "notiz": _("aus {0}").format(self.name)[:140]})
        e.save(ignore_permissions=True)
        neu = {z.kategorie: cint(z.min_je_stueck) for z in auswahl}
        nk.protokoll("Einstellungen", "PH Projekte Einstellungen", "PH Projekte Einstellungen", "montage_richtwerte", {k: alt.get(k) for k in neu}, neu,
                     _("Lernwerte aus {0}").format(self.name), projekt=self.projekt)
        self.db_set("richtwerte_uebernommen", 1)
        return neu
