"""PH Beratungsgespraech – Gesprächsprotokoll. Buttons: Aufgabe für nächsten Schritt, Planung beauftragen
(→ PH Projekt, wenn ph_projekte installiert, optional mit Planer), Angebot (→ ph_faktura), Abschließen,
Protokoll drucken / an Kunden senden (PDF per Mail), Vorlage je Raumtyp übernehmen (PH Beratungsvorlage)."""

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import add_days, now_datetime, nowdate


class PHBeratungsgespraech(Document):
    def validate(self):
        if not self.datum:
            self.datum = nowdate()
        self.budget_gesamt_cent = sum(int(z.budget_cent or 0) for z in self.raeume)
        if self.status == "Abgeschlossen":
            offen = [f.frage for f in self.get("fragen") or [] if f.pflicht and not (f.antwort or "").strip()]
            if offen:
                frappe.throw(_("Pflichtfragen der Vorlage offen: {0}").format(", ".join(offen[:5])))
            if not (self.zusammenfassung or self.raeume):
                frappe.throw(_("Zum Abschließen braucht das Protokoll eine Zusammenfassung oder mindestens einen Raum."))
            self.abgeschlossen_am = self.abgeschlossen_am or now_datetime()
        else:
            self.abgeschlossen_am = None
        kontakt = frappe.db.get_value("PH Kontakt", self.kontakt, "titel") if self.kontakt else ""
        self.titel = f"{frappe.utils.formatdate(self.datum, 'dd.MM.yyyy')} · {kontakt}"[:140]

    def onload(self):
        """R5: nächster Schritt eingetragen, aber keine offene Aufgabe → Band „Als Aufgabe übernehmen?“."""
        if self.naechster_schritt and not self.is_new():
            offen = frappe.db.exists("PH Aufgabe", {"referenz_doctype": self.doctype, "referenz_name": self.name, "status": ("in", ["Offen", "In Arbeit"])})
            self.set_onload("aufgabe_vorschlagen", not offen)

    def after_insert(self):
        from ph_crm.ph_crm.kontakt360 import letzter_kontakt_setzen

        letzter_kontakt_setzen(self.kontakt, now_datetime(), "Gespräch")

    def on_update(self):
        try:
            if self.termin and frappe.db.get_value("PH Termin", self.termin, "beratungsgespraech") != self.name:
                frappe.db.set_value("PH Termin", self.termin, "beratungsgespraech", self.name, update_modified=False)
        except Exception:  # noqa: BLE001
            frappe.log_error(title=f"PH Beratungsgespraech {self.name}: Termin-Verweis fehlgeschlagen")

    @frappe.whitelist()
    def status_setzen(self, status):
        self.check_permission("write")
        if status not in ("Offen", "Planung beauftragt", "Angebot", "Abgeschlossen"):
            frappe.throw(_("Unbekannter Status."))
        self.status = status
        self.save()
        return self.status

    @frappe.whitelist()
    def aufgabe_anlegen(self):
        """Nächsten Schritt als PH Aufgabe an den Berater."""
        self.check_permission("write")
        if not self.naechster_schritt:
            frappe.throw(_("Bitte zuerst den nächsten Schritt eintragen."))
        doc = frappe.get_doc(
            {
                "doctype": "PH Aufgabe",
                "titel": self.naechster_schritt[:140],
                "faellig": self.naechster_schritt_bis or add_days(nowdate(), 3),
                "zugewiesen_an": self.berater,
                "referenz_doctype": self.doctype,
                "referenz_name": self.name,
                "kontakt": self.kontakt,
            }
        ).insert()
        return doc.name

    @frappe.whitelist()
    def vorlage_anwenden(self, vorlage=None):
        """Fragen der PH Beratungsvorlage als Checkliste übernehmen (doppelte Fragen werden übersprungen) und
        je Raumtyp eine Raumzeile anlegen, falls noch keine existiert."""
        self.check_permission("write")
        vorlage = vorlage or self.vorlage
        if not vorlage:
            frappe.throw(_("Bitte eine Vorlage wählen."))
        v = frappe.get_doc("PH Beratungsvorlage", vorlage)
        if not v.aktiv:
            frappe.throw(_("Vorlage {0} ist nicht aktiv.").format(vorlage))
        vorhanden = {(f.raum, f.frage) for f in self.get("fragen") or []}
        raeume = {r.raum for r in self.raeume}
        n = 0
        for f in v.fragen:
            if (f.raum, f.frage) in vorhanden:
                continue
            self.append("fragen", {"raum": f.raum, "frage": f.frage, "pflicht": f.pflicht})
            n += 1
            if f.raum not in raeume:
                self.append("raeume", {"raum": f.raum, "wunsch": _("siehe Checkliste"), "prioritaet": "Normal"})
                raeume.add(f.raum)
        self.vorlage = vorlage
        self.save()
        return n

    @frappe.whitelist()
    def protokoll_senden(self, empfaenger=None, nachricht=None, betreff=None):
        """Protokoll als PDF (Druckformat „PH Beratungsgespraech Protokoll“) per Mail an den Kunden.
        Versand über die Frappe-Mail-Warteschlange (Communication → Zeitleiste der Kundenakte)."""
        self.check_permission("email")
        if not empfaenger:
            empfaenger = frappe.db.get_value("PH Kontakt", self.kontakt, "email") if self.kontakt else None
        if not empfaenger:
            frappe.throw(_("Keine E-Mail-Adresse beim Kunden – bitte Empfänger angeben."))
        from frappe.core.doctype.communication.email import make

        kontakt = frappe.db.get_value("PH Kontakt", self.kontakt, ["vorname", "nachname", "anrede"], as_dict=True) if self.kontakt else {}
        anrede = _("Guten Tag {0},").format(" ".join(x for x in ((kontakt or {}).get("vorname"), (kontakt or {}).get("nachname")) if x)).replace(" ,", ",")
        inhalt = nachricht or _("{0}<br><br>vielen Dank für das Gespräch. Im Anhang finden Sie unser Protokoll mit den besprochenen Wünschen und dem nächsten Schritt.<br><br>Freundliche Grüße<br>Platzhirsch Home Living").format(anrede)
        r = make(doctype=self.doctype, name=self.name, subject=betreff or _("Ihr Beratungsgespräch vom {0}").format(frappe.utils.formatdate(self.datum, "dd.MM.yyyy")), content=inhalt, recipients=empfaenger, send_email=True, print_format="PH Beratungsgespraech Protokoll", print_letterhead=False)
        self.db_set({"protokoll_gesendet_am": now_datetime(), "protokoll_gesendet_an": empfaenger[:140]})
        if self.kontakt:
            from ph_crm.ph_crm.kontakt360 import letzter_kontakt_setzen

            letzter_kontakt_setzen(self.kontakt, now_datetime(), "E-Mail")
        return r.get("name") if isinstance(r, dict) else r

    @frappe.whitelist()
    def planung_beauftragen(self, planer=None):
        """→ PH Projekt (ph_projekte), optional mit Planer (User). Ohne ph_projekte nur Statuswechsel + Hinweis."""
        self.check_permission("write")
        projekt = None
        if frappe.db.exists("DocType", "PH Projekt"):
            meta = frappe.get_meta("PH Projekt")
            werte = {"doctype": "PH Projekt", "kontakt": self.kontakt}
            for feld in ("planer", "zustaendig", "projektleiter"):
                if planer and meta.has_field(feld):
                    werte[feld] = planer
                    break
            if meta.has_field("beratungsgespraech"):
                werte["beratungsgespraech"] = self.name
            if meta.has_field("titel_kunde"):
                werte["titel_kunde"] = self.titel
            try:
                projekt = frappe.get_doc(werte).insert().name
                # Custom Field aus ph_projekte (CONVENTIONS 10): ph_projekte_projekt
                if self.meta.has_field("ph_projekte_projekt"):
                    self.db_set("ph_projekte_projekt", projekt)
            except Exception:  # noqa: BLE001
                frappe.log_error(title=f"PH Beratungsgespraech {self.name}: Projekt anlegen fehlgeschlagen")
                frappe.msgprint(_("Projekt konnte nicht automatisch angelegt werden – bitte in PH Projekte anlegen (Fehlerprotokoll)."))
        else:
            frappe.msgprint(_("ph_projekte ist nicht installiert – Status gesetzt, Projekt bitte später anlegen."))
        if planer and projekt is None:
            self.add_comment("Info", _("Planung beauftragt an {0}.").format(planer))
        self.status = "Planung beauftragt"
        self.save()
        return projekt
