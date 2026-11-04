"""PH Serviceeinsatz – Controller: Adresse/Kunde aus Servicefall oder Vertrag, Zeiten, Kosten, Statusbuttons,
Ersatzteil-Abgang beim Abschluss, Rückmeldung an den Servicefall (ereignisse.py)."""

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import cint, get_datetime, now_datetime, time_diff_in_seconds

from ph_service.ph_service import kommunikation as kom
from ph_service.ph_service.doctype.ph_service_einstellungen.ph_service_einstellungen import einstellungen

AKTIV = ("Geplant", "Bestaetigt", "Unterwegs", "In Arbeit")


class PHServiceeinsatz(Document):
    def before_insert(self):
        if not self.status:
            self.status = "Geplant"

    def validate(self):
        if not self.servicefall and not self.pflege_abo:
            frappe.throw(_("Einsatz braucht einen Servicefall oder einen Pflege-/Wartungsvertrag."))
        self._quelle_uebernehmen()
        if self.zeit_von and self.zeit_bis and str(self.zeit_bis) <= str(self.zeit_von):
            frappe.throw(_("Zeitfenster: „bis“ muss nach „von“ liegen."))
        if self.ankunft and self.abfahrt:
            if get_datetime(self.abfahrt) < get_datetime(self.ankunft):
                frappe.throw(_("Abfahrt liegt vor Ankunft."))
            if not self.zeit_arbeit_min:
                self.zeit_arbeit_min = int(time_diff_in_seconds(self.abfahrt, self.ankunft) // 60)
        if not self.zeit_anfahrt_min and self.anfahrt_min:
            self.zeit_anfahrt_min = cint(self.anfahrt_min) * 2
        self._kosten_berechnen()
        if self.status == "Erledigt" and not self.ergebnis:
            frappe.throw(_("Erledigt nur mit Ergebnis."))
        if self.status == "Erledigt" and self.ergebnis in ("Weiterer Einsatz noetig", "Ersatzteil noetig"):
            self.folgeeinsatz_noetig = 1
        self.titel = self.bilde_titel()

    def bilde_titel(self):
        teile = [_(self.art), self.kunde_name or self.kontakt or ""]
        if self.datum:
            teile.append(frappe.utils.formatdate(self.datum, "dd.MM.yyyy"))
        return " · ".join(t for t in teile if t)[:140]

    def _quelle_uebernehmen(self):
        quelle = None
        if self.servicefall:
            quelle = frappe.db.get_value("PH Servicefall", self.servicefall, ["kontakt", "kunde_name", "einsatz_strasse", "einsatz_plz", "einsatz_ort", "einsatz_land"], as_dict=True)
            if quelle:
                self.kontakt, self.kunde_name = quelle.kontakt, quelle.kunde_name
                if not self.strasse and not self.ort:
                    self.strasse, self.plz, self.ort, self.land = quelle.einsatz_strasse, quelle.einsatz_plz, quelle.einsatz_ort, quelle.einsatz_land or self.land
        elif self.pflege_abo:
            quelle = frappe.db.get_value("PH Pflege Abo", self.pflege_abo, ["kontakt", "kunde_name", "strasse", "plz", "ort", "land"], as_dict=True)
            if quelle:
                self.kontakt, self.kunde_name = quelle.kontakt, quelle.kunde_name
                if not self.strasse and not self.ort:
                    self.strasse, self.plz, self.ort, self.land = quelle.strasse, quelle.plz, quelle.ort, quelle.land or self.land

    def _kosten_berechnen(self):
        minuten = cint(self.zeit_arbeit_min) + cint(self.zeit_anfahrt_min)
        self.kosten_cent = int(round(minuten / 60 * cint(self.stundensatz_cent))) + cint(self.anfahrtspauschale_cent)

    # ── Buttons (Techniker, mobil) ──────────────────────────────────────────

    def _status(self, status, **werte):
        self.check_permission("write")
        werte["status"] = status
        self.db_set(werte)
        self.add_comment("Info", _("Status {0}").format(_(status)))
        if self.servicefall:
            sf = frappe.get_doc("PH Servicefall", self.servicefall)
            kom.verlauf(sf, "Einsatz", hinweis=_("Einsatz {0}: {1}").format(self.name, _(status)), speichern=True)
        return status

    @frappe.whitelist()
    def bestaetigen(self):
        return self._status("Bestaetigt", bestaetigt_kunde_am=now_datetime())

    @frappe.whitelist()
    def unterwegs(self):
        return self._status("Unterwegs")

    @frappe.whitelist()
    def starten(self):
        return self._status("In Arbeit", ankunft=now_datetime())

    @frappe.whitelist()
    def nicht_angetroffen(self, hinweis=None):
        self._status("Nicht angetroffen", abfahrt=now_datetime(), ergebnis="Nicht behoben", folgeeinsatz_noetig=1)
        if hinweis:
            self.add_comment("Comment", hinweis)
        return self.status

    @frappe.whitelist()
    def abschliessen(self, ergebnis, bericht=None, unterschrift=None, unterschrift_name=None, zufriedenheit=None):
        """Button „Einsatz abschließen“: Bericht, Ergebnis, Unterschrift; Ersatzteile abbuchen; Kosten in den Servicefall."""
        self.check_permission("write")
        self.ergebnis = ergebnis
        if bericht:
            self.bericht = bericht
        if not self.abfahrt:
            self.abfahrt = now_datetime()
        if not self.ankunft:
            self.ankunft = self.abfahrt
        if unterschrift:
            self.unterschrift_kunde = unterschrift
            self.unterschrift_name = unterschrift_name or self.kunde_name
            self.unterschrift_am = now_datetime()
        if zufriedenheit not in (None, ""):
            self.zufriedenheit = float(zufriedenheit)
        self.status = "Erledigt"
        self.save()
        self._ersatzteile_abbuchen()
        self._kosten_uebernehmen()
        if self.servicefall:
            sf = frappe.get_doc("PH Servicefall", self.servicefall)
            kom.verlauf(sf, "Einsatz", hinweis=_("Einsatz {0} erledigt: {1}").format(self.name, _(ergebnis)), speichern=True)
        if self.pflege_abo:
            self._protokoll_im_vertrag()
        return self.status

    @frappe.whitelist()
    def folgeeinsatz_anlegen(self, datum, zeit_von=None, zeit_bis=None):
        self.check_permission("write")
        if self.folgeeinsatz:
            return self.folgeeinsatz
        neu = frappe.get_doc(
            {
                "doctype": "PH Serviceeinsatz",
                "servicefall": self.servicefall,
                "pflege_abo": self.pflege_abo,
                "art": self.art,
                "techniker": self.techniker,
                "datum": datum,
                "zeit_von": zeit_von,
                "zeit_bis": zeit_bis,
                "hinweis_intern": _("Folgeeinsatz zu {0}: {1}").format(self.name, self.ergebnis or ""),
            }
        ).insert()
        self.db_set("folgeeinsatz", neu.name)
        return neu.name

    @frappe.whitelist()
    def termin_anlegen(self):
        """Kalendertermin in ph_crm (PH Termin) für den Techniker, wenn installiert."""
        self.check_permission("write")
        if self.termin:
            return self.termin
        if not frappe.db.exists("DocType", "PH Termin"):
            frappe.throw(_("DocType PH Termin ist nicht installiert (ph_crm)."))
        start = get_datetime(f"{self.datum} {self.zeit_von or '08:00:00'}")
        ende = get_datetime(f"{self.datum} {self.zeit_bis or '12:00:00'}")
        termin = frappe.get_doc(
            {
                "doctype": "PH Termin",
                "modus": "Vor Ort",
                "thema": _("Serviceeinsatz {0}").format(self.name),
                "start": start,
                "ende": ende,
                "dauer_min": int((ende - start).total_seconds() // 60),
                "berater": self.techniker,
                "kontakt": self.kontakt,
                "nachname": self.kunde_name or "Service",
                "quelle": "backoffice",
                "status": "Bestaetigt",
                "kundenmail": "backoffice",
            }
        )
        termin.flags.ignore_mandatory = True
        termin.insert()
        self.db_set("termin", termin.name)
        return termin.name

    # ── Nebenwirkungen ──────────────────────────────────────────────────────

    def _ersatzteile_abbuchen(self):
        if self.ersatzteile_gebucht or not einstellungen()["ersatzteil_bestand_fuehren"]:
            return
        from ph_service.ph_service.doctype.ph_ersatzteil.ph_ersatzteil import buchen

        for z in self.ersatzteile or []:
            if z.ersatzteil and z.aus_bestand and cint(z.menge) > 0:
                buchen(z.ersatzteil, "Verbrauch", cint(z.menge), self.doctype, self.name, _("Einsatz {0}").format(self.name))
        self.db_set("ersatzteile_gebucht", 1)
        if self.servicefall:
            for z in self.ersatzteile or []:
                if z.ersatzteil:
                    frappe.db.sql(
                        """update `tabPH Servicefall Ersatzteil` set status='Verbaut' where parent=%s and ersatzteil=%s and status in ('Benoetigt','Aus Bestand','Bestellt','Eingetroffen')""",
                        (self.servicefall, z.ersatzteil),
                    )

    def _kosten_uebernehmen(self):
        if self.kosten_gebucht or not self.servicefall:
            return
        sf = frappe.get_doc("PH Servicefall", self.servicefall)
        if cint(self.zeit_arbeit_min) + cint(self.zeit_anfahrt_min) > 0:
            arbeit = int(round(cint(self.zeit_arbeit_min) / 60 * cint(self.stundensatz_cent)))
            anfahrt = int(round(cint(self.zeit_anfahrt_min) / 60 * cint(self.stundensatz_cent))) + cint(self.anfahrtspauschale_cent)
            if arbeit:
                sf.append("kosten", {"datum": self.datum, "art": "Intern Arbeitszeit", "beschreibung": _("Einsatz {0}: {1} min").format(self.name, cint(self.zeit_arbeit_min)), "betrag_cent": arbeit, "einsatz": self.name, "regressfaehig": 1})
            if anfahrt:
                sf.append("kosten", {"datum": self.datum, "art": "Intern Anfahrt", "beschreibung": _("Einsatz {0}: {1} min / {2} km").format(self.name, cint(self.zeit_anfahrt_min), cint(self.anfahrt_km)), "betrag_cent": anfahrt, "einsatz": self.name, "regressfaehig": 0})
        for z in self.ersatzteile or []:
            if cint(z.ek_cent) and cint(z.menge):
                sf.append("kosten", {"datum": self.datum, "art": "Ersatzteil", "beschreibung": f"{z.bezeichnung or z.ersatzteil} × {z.menge}", "betrag_cent": cint(z.ek_cent) * cint(z.menge), "einsatz": self.name, "regressfaehig": 1})
        sf.flags.ignore_permissions = True
        sf.save()
        self.db_set("kosten_gebucht", 1)

    def _protokoll_im_vertrag(self):
        try:
            abo = frappe.get_doc("PH Pflege Abo", self.pflege_abo)
            if any(p.einsatz == self.name for p in abo.protokolle or []):
                return
            abo.append("protokolle", {"datum": self.datum, "einsatz": self.name, "durchgefuehrt_von": frappe.db.get_value("User", self.techniker, "full_name") or self.techniker, "leistungen": frappe.utils.strip_html(self.bericht or "")[:1000], "im_portal": 1})
            abo.flags.ignore_permissions = True
            abo.save()
        except Exception:  # noqa: BLE001
            frappe.log_error(title="PH Serviceeinsatz: Protokoll im Vertrag")
