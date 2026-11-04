"""PH Montageauftrag – Montageeinsatz mit Team, Leistungen, Fotos vorher/nachher, Bericht, Unterschrift.

Status setzt der Workflow „PH Montageauftrag“ (Geplant → Unterwegs → In Arbeit → Erledigt → Abgenommen;
Abgebrochen). Die mobile Nutzung (Unterschrift, Fotos) läuft über die Dokument-Methoden unten.
"""

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import get_datetime, now_datetime

from ph_projekte.ph_projekte.helfer import projekt_kontakt


class PHMontageauftrag(Document):
    def before_insert(self):
        if not self.status:
            self.status = "Geplant"

    def validate(self):
        if not self.kontakt and self.projekt:
            self.kontakt = projekt_kontakt(self.projekt)
        if self.ende and get_datetime(self.ende) < get_datetime(self.start):
            frappe.throw(_("Ende liegt vor dem Beginn."))
        if self.status == "Abgebrochen" and not (self.abbruch_grund or "").strip():
            frappe.throw(_("Bitte den Grund des Abbruchs angeben."))
        if self.status == "Abgenommen" and not self.unterschrift_kunde:
            frappe.throw(_("Abnahme ohne Unterschrift des Kunden ist nicht möglich."))
        self.stunden_geplant = sum(float(z.dauer_h_geplant or 0) for z in self.leistungen)
        self.stunden_ist = sum(float(z.dauer_h_ist or 0) for z in self.leistungen) or sum(float(z.stunden_ist or 0) for z in self.team)
        if self.unterschrift_kunde and not self.unterschrift_am:
            self.unterschrift_am = now_datetime()
        vorher = self.get_doc_before_save()
        if vorher and vorher.status != self.status:
            if self.status == "In Arbeit" and not self.tatsaechlich_start:
                self.tatsaechlich_start = now_datetime()
            if self.status in ("Erledigt", "Abgenommen") and not self.tatsaechlich_ende:
                self.tatsaechlich_ende = now_datetime()
            if self.status == "Abgenommen" and not self.abgenommen_am:
                self.abgenommen_am = now_datetime()
        projekt_titel = frappe.db.get_value("PH Projekt", self.projekt, "titel") or self.projekt
        self.titel = f"Montage {frappe.utils.formatdate(get_datetime(self.start).date(), 'dd.MM.yyyy')}: {projekt_titel}"[:140]

    def on_update(self):
        # Projekt-Montagezeitraum nachführen (nie werfen).
        try:
            if self.projekt and self.status != "Abgebrochen":
                tag = get_datetime(self.start).date()
                p = frappe.db.get_value("PH Projekt", self.projekt, ["montage_von", "montage_bis"], as_dict=True)
                werte = {}
                if not p.montage_von or tag < p.montage_von:
                    werte["montage_von"] = tag
                if not p.montage_bis or tag > p.montage_bis:
                    werte["montage_bis"] = tag
                if werte:
                    frappe.db.set_value("PH Projekt", self.projekt, werte, update_modified=False)
        except Exception:  # noqa: BLE001
            frappe.log_error(title="PH Montageauftrag: Projekt-Termine fehlgeschlagen")

    # ── Buttons ─────────────────────────────────────────────────────────────

    @frappe.whitelist()
    def abnahme_anlegen(self):
        """Button „Abnahme anlegen“: PH Abnahme zum Projekt mit Bezug auf diesen Montageauftrag; offene Mängel dieses
        Auftrags werden als Positionen „Mangel“ ergänzt. Delegiert an PH Projekt.abnahme_anlegen."""
        self.check_permission("write")
        projekt = frappe.get_doc("PH Projekt", self.projekt)
        name = projekt.abnahme_anlegen(montageauftrag=self.name)
        try:
            abn = frappe.get_doc("PH Abnahme", name)
            vorhandene = {p.bezeichnung for p in abn.positionen}
            geaendert = False
            for m in self.maengel or []:
                if (m.get("status") or "") in ("Behoben", "Erledigt") or m.get("behoben_am"):
                    continue
                bez = (m.get("beschreibung") or _("Mangel"))[:140]
                if bez not in vorhandene:
                    abn.append("positionen", {"bezeichnung": bez, "zustand": "Mangel", "beschreibung": m.get("beschreibung"), "foto": m.get("foto"), "frist": m.get("frist")})
                    geaendert = True
            if geaendert:
                abn.save()
        except Exception:  # noqa: BLE001
            frappe.log_error(title=f"PH Montageauftrag {self.name}: Mängel in Abnahme übernehmen")
        return name

    @frappe.whitelist()
    def unterschrift_erfassen(self, unterschrift, name_kunde=None, monteur=None):
        """Mobil: Signature-Daten (data:image/png;base64,…) speichern."""
        self.check_permission("write")
        if not unterschrift or not str(unterschrift).startswith("data:image"):
            frappe.throw(_("Keine gültige Unterschrift."))
        werte = {"unterschrift_kunde": unterschrift, "unterschrift_am": now_datetime()}
        if name_kunde:
            werte["unterschrift_name"] = name_kunde[:140]
        if monteur:
            werte["unterschrift_monteur"] = monteur
        self.db_set(werte)
        return "ok"

    @frappe.whitelist()
    def foto_hinzufuegen(self, bild, art="nachher", hinweis=None, kunde_sichtbar=0):
        self.check_permission("write")
        self.append("fotos", {"art": art, "bild": bild, "hinweis": hinweis, "aufgenommen_am": now_datetime(), "kunde_sichtbar": int(kunde_sichtbar or 0)})
        self.save()
        return len(self.fotos)

    @frappe.whitelist()
    def mangel_an_service(self, zeile):
        """Button „Mängel → Servicefall“: legt PH Servicefall an, wenn ph_service installiert ist."""
        self.check_permission("write")
        if not frappe.db.exists("DocType", "PH Servicefall"):
            frappe.throw(_("DocType PH Servicefall ist noch nicht installiert (Arbeitspaket ph_service)."))
        m = next((x for x in self.maengel if x.name == zeile), None)
        if not m:
            frappe.throw(_("Mangelzeile nicht gefunden."))
        if m.servicefall_ref:
            return m.servicefall_ref
        sf = frappe.get_doc({"doctype": "PH Servicefall", "kontakt": self.kontakt, "projekt": self.projekt, "beschreibung": m.beschreibung, "quelle": "montage"})
        sf.flags.ignore_mandatory = True
        sf.insert()
        frappe.db.set_value("PH Montage Mangel", m.name, "servicefall_ref", sf.name, update_modified=False)
        return sf.name

    @frappe.whitelist()
    def bericht_als_dokument(self, print_format="PH Montagebericht"):
        """Bericht-PDF in die Auftragsmappe (PH Projekt Dokument, Kategorie Montagebericht) legen."""
        self.check_permission("write")
        from ph_projekte.ph_projekte.doctype.ph_projekt_dokument.ph_projekt_dokument import dokument_aus_beleg

        pdf = frappe.get_print(self.doctype, self.name, print_format, as_pdf=True)
        datei = frappe.get_doc({"doctype": "File", "file_name": f"{self.name}-Montagebericht.pdf", "is_private": 1, "content": pdf, "attached_to_doctype": self.doctype, "attached_to_name": self.name}).insert(ignore_permissions=True)
        dok = dokument_aus_beleg(self.projekt, f"Montagebericht {self.name}", "Montagebericht", datei.file_url, self.doctype, self.name, kunde_sichtbar=1)
        return dok.name

    @frappe.whitelist()
    def zeit_buchen(self, user, dauer_min, taetigkeit="Montage", beschreibung=None):
        self.check_permission("write")
        z = frappe.get_doc(
            {
                "doctype": "PH Projektzeit",
                "projekt": self.projekt,
                "montageauftrag": self.name,
                "user": user,
                "datum": get_datetime(self.start).date(),
                "dauer_min": int(dauer_min),
                "taetigkeit": taetigkeit,
                "beschreibung": beschreibung,
            }
        ).insert()
        return z.name


def offene_maengel_anzahl():
    return frappe.db.count("PH Montage Mangel", {"status": ("!=", "behoben"), "parenttype": "PH Montageauftrag"})
