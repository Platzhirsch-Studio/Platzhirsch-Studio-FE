import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import now_datetime, nowdate


class PHServiceauftrag(Document):
    def validate(self):
        if self.kontakt and frappe.db.exists("DocType", "PH Kontakt"):
            try:
                k = frappe.db.get_value("PH Kontakt", self.kontakt, ["vorname", "nachname", "firma", "strasse", "plz", "ort", "land"], as_dict=True)
            except Exception:  # noqa: BLE001
                k = None
            if k:
                self.kunde_name = (" ".join(x for x in (k.vorname, k.nachname) if x) or k.firma or self.kontakt)[:140]
                if not self.strasse and not self.ort:
                    self.strasse, self.plz, self.ort, self.land = k.strasse, k.plz, k.ort, k.land or self.land
        if self.status in ("Abgeholt", "Eingelagert") and not self.positionen:
            frappe.throw(_("Übernahmeliste (Stücke) ist leer."))
        if self.has_value_changed("status"):
            if self.status == "Eingelagert":
                self.einlagerung_von = self.einlagerung_von or nowdate()
                if self.art == "Winterlager" and not self.lagerort:
                    frappe.msgprint(_("Lagerort für das Winterlager fehlt."), indicator="orange")
            if self.status == "Zurueckgebracht":
                self.einlagerung_bis = self.einlagerung_bis or nowdate()
        if self.uebernahme_unterschrift and not self.uebernahme_am:
            self.uebernahme_am = now_datetime()
        if self.rueckgabe_unterschrift and not self.rueckgabe_am_unterschrift:
            self.rueckgabe_am_unterschrift = now_datetime()
        self.titel = f"{_(self.art)}: {self.kunde_name or self.kontakt} ({len(self.positionen or [])} Stk.)"[:140]

    # ── Übernahme/Rückgabe (iPad, Konzept S8) ───────────────────────────────

    def _zeilen_uebernehmen(self, positionen, feld_zustand, feld_foto):
        if isinstance(positionen, str):
            positionen = frappe.parse_json(positionen)
        je_name = {p.name: p for p in self.positionen or []}
        for z in positionen or []:
            ziel = je_name.get(z.get("name"))
            if not ziel:
                ziel = self.append("positionen", {"bezeichnung": z.get("bezeichnung"), "marke": z.get("marke"), "menge": z.get("menge") or 1})
            if z.get("zustand"):
                ziel.set(feld_zustand, z.get("zustand"))
            if z.get("foto"):
                ziel.set(feld_foto, z.get("foto"))
            if z.get("lagerplatz"):
                ziel.lagerplatz = z.get("lagerplatz")
            if z.get("hinweis"):
                ziel.hinweis = str(z.get("hinweis"))[:140]

    def _workflow(self, status, zustand):
        self.status = status
        if self.meta.has_field("workflow_state"):
            self.workflow_state = zustand

    @frappe.whitelist()
    def uebernahme_erfassen(self, positionen=None, unterschrift=None, name_bestaetigt=None, lagerort=None):
        """Übernahme beim Kunden: Zustand/Foto je Stück, Unterschrift (oder Name bestätigt), Status Abgeholt – ein Aufruf."""
        self.check_permission("write")
        if self.status not in ("Beauftragt", "Angeboten"):
            frappe.throw(_("Übernahme nur aus „Beauftragt“."))
        self._zeilen_uebernehmen(positionen, "zustand_uebernahme", "foto_uebernahme")
        if not self.positionen:
            frappe.throw(_("Übernahmeliste (Stücke) ist leer."))
        if not unterschrift and not (name_bestaetigt or "").strip():
            frappe.throw(_("Unterschrift oder bestätigten Namen des Kunden erfassen."))
        self.uebernahme_unterschrift = unterschrift or self.uebernahme_unterschrift
        self.uebernahme_am = now_datetime()
        if name_bestaetigt:
            self.notizen = ((self.notizen or "") + "\n" + _("Übernahme bestätigt durch {0}").format(name_bestaetigt[:140])).strip()
        if lagerort:
            self.lagerort = lagerort
        self.abholung_am = self.abholung_am or nowdate()
        self._workflow("Abgeholt", "PH Abgeholt")
        self.save()
        return self.status

    @frappe.whitelist()
    def rueckgabe_erfassen(self, positionen=None, unterschrift=None, name_bestaetigt=None):
        """Rückgabe: Zustand/Foto je Stück, Unterschrift, Status Zurückgebracht – Abweichungen (Beschädigt) als Hinweis."""
        self.check_permission("write")
        if self.status not in ("Eingelagert", "In Arbeit", "Abgeholt"):
            frappe.throw(_("Rückgabe nur aus „Eingelagert“ oder „In Arbeit“."))
        self._zeilen_uebernehmen(positionen, "zustand_rueckgabe", "foto_rueckgabe")
        if not unterschrift and not (name_bestaetigt or "").strip():
            frappe.throw(_("Unterschrift oder bestätigten Namen des Kunden erfassen."))
        self.rueckgabe_unterschrift = unterschrift or self.rueckgabe_unterschrift
        self.rueckgabe_am_unterschrift = now_datetime()
        if name_bestaetigt:
            self.notizen = ((self.notizen or "") + "\n" + _("Rückgabe bestätigt durch {0}").format(name_bestaetigt[:140])).strip()
        self.rueckgabe_am = self.rueckgabe_am or nowdate()
        self._workflow("Zurueckgebracht", "PH Zurueckgebracht")
        self.save()
        schaeden = [p.bezeichnung for p in self.positionen if p.zustand_rueckgabe == "Beschaedigt" and p.zustand_uebernahme != "Beschaedigt"]
        if schaeden:
            self.add_comment("Comment", _("Achtung: Bei Rückgabe beschädigt, bei Übernahme nicht: {0}").format(", ".join(schaeden)))
        return {"status": self.status, "neue_schaeden": schaeden}
