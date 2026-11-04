"""PH Ersatzteilbestellung – Controller: Summen, Senden (Mail an Lieferant), Wareneingang mit Bestandszugang."""

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import cint, now_datetime, nowdate

from ph_service.ph_service import kommunikation as kom


class PHErsatzteilbestellung(Document):
    def before_insert(self):
        if not self.datum:
            self.datum = nowdate()
        if not self.status:
            self.status = "Entwurf"

    def validate(self):
        if not self.positionen:
            frappe.throw(_("Mindestens eine Position."))
        summe = 0
        for p in self.positionen:
            if cint(p.menge) <= 0:
                frappe.throw(_("Menge in Zeile {0} muss größer 0 sein.").format(p.idx))
            if cint(p.menge_erhalten) > cint(p.menge):
                frappe.throw(_("Zeile {0}: mehr erhalten als bestellt.").format(p.idx))
            summe += cint(p.ek_cent) * cint(p.menge)
        self.summe_ek_cent = summe
        self._lieferstatus()
        self.titel = f"{self.lieferant}: {len(self.positionen)} Pos.{' · ' + self.kommission if self.kommission else ''}"[:140]

    def _lieferstatus(self):
        if self.status in ("Entwurf", "Storniert"):
            return
        erhalten = sum(cint(p.menge_erhalten) for p in self.positionen)
        bestellt = sum(cint(p.menge) for p in self.positionen)
        if erhalten >= bestellt and bestellt > 0:
            self.status = "Geliefert"
            self.geliefert_am = self.geliefert_am or nowdate()
        elif erhalten > 0:
            self.status = "Teilgeliefert"

    @frappe.whitelist()
    def senden(self, empfaenger=None, text=None):
        """Button „Per E-Mail senden“: Bestellung (Druckformat) an bestell_email des Lieferanten."""
        self.check_permission("write")
        if not empfaenger and frappe.db.exists("DocType", "PH Lieferant"):
            try:
                empfaenger = frappe.db.get_value("PH Lieferant", self.lieferant, "bestell_email")
            except Exception:  # noqa: BLE001
                empfaenger = None
        if not empfaenger:
            frappe.throw(_("Keine Bestell-E-Mail bekannt."))
        from ph_core.utils.mail import sende

        zeilen = "".join(f"<tr><td>{frappe.utils.escape_html(p.hersteller_nr or '')}</td><td>{frappe.utils.escape_html(p.bezeichnung or p.ersatzteil or '')}</td><td style='text-align:right'>{p.menge}</td></tr>" for p in self.positionen)
        html = f"""<p>Sehr geehrte Damen und Herren,</p><p>wir bestellen folgende Ersatzteile{' (Kommission ' + frappe.utils.escape_html(self.kommission) + ')' if self.kommission else ''}:</p>
        <table border="1" cellpadding="4" cellspacing="0"><tr><th>Art.-Nr.</th><th>Bezeichnung</th><th>Menge</th></tr>{zeilen}</table>
        <p>Kostenträger: {frappe.utils.escape_html(self.kostentraeger or '')}{' – bitte kostenfrei im Rahmen der Gewährleistung/Garantie liefern.' if self.kostentraeger in ('Gewaehrleistung', 'Garantie') else ''}</p>
        <p>{frappe.utils.escape_html(text or self.notizen or '')}</p><p>Mit freundlichen Grüßen<br>Platzhirsch Home Living</p>"""
        anhaenge = []
        pdf = kom.pdf_anhang(self.doctype, self.name, "PH Ersatzteilbestellung", self.name)
        if pdf:
            anhaenge.append(pdf)
        sende(empfaenger, _("Ersatzteilbestellung {0}").format(self.name), html, anhaenge=anhaenge, referenz_doctype=self.doctype, referenz_name=self.name)
        self.db_set({"status": "Gesendet", "gesendet_am": now_datetime(), "gesendet_an": empfaenger, "bestellweg": "E-Mail"})
        self.add_comment("Info", _("Bestellung gesendet an {0}").format(empfaenger))
        return empfaenger

    @frappe.whitelist()
    def als_gesendet(self, bestellweg="Portal", referenz=None):
        self.check_permission("write")
        self.db_set({"status": "Gesendet", "gesendet_am": now_datetime(), "bestellweg": bestellweg, "lieferant_referenz": referenz or self.lieferant_referenz})
        return self.status

    @frappe.whitelist()
    def bestaetigen(self, referenz=None, erwartet_am=None):
        self.check_permission("write")
        self.db_set({"status": "Bestaetigt", "lieferant_referenz": referenz or self.lieferant_referenz, "erwartet_am": erwartet_am or self.erwartet_am})
        return self.status

    @frappe.whitelist()
    def wareneingang(self, mengen):
        """Button „Wareneingang buchen“: {zeilen_name: menge} → Bestand Zugang, Servicefall-Zeilen „Eingetroffen“."""
        self.check_permission("write")
        if isinstance(mengen, str):
            mengen = frappe.parse_json(mengen)
        from ph_service.ph_service.doctype.ph_ersatzteil.ph_ersatzteil import buchen
        from ph_service.ph_service.doctype.ph_service_einstellungen.ph_service_einstellungen import einstellungen

        bestand = einstellungen()["ersatzteil_bestand_fuehren"]
        for p in self.positionen:
            menge = cint(mengen.get(p.name))
            if menge <= 0:
                continue
            p.menge_erhalten = cint(p.menge_erhalten) + menge
            p.eingetroffen_am = nowdate()
            if p.ersatzteil and bestand and self.kostentraeger == "Lager":
                buchen(p.ersatzteil, "Zugang", menge, self.doctype, self.name, _("Wareneingang {0}").format(self.name))
            if p.servicefall_zeile:
                frappe.db.set_value("PH Servicefall Ersatzteil", p.servicefall_zeile, "status", "Eingetroffen")
        if self.status in ("Entwurf",):
            self.status = "Gesendet"
        self.save()
        if self.servicefall:
            sf = frappe.get_doc("PH Servicefall", self.servicefall)
            kom.verlauf(sf, "Ersatzteil", hinweis=_("Wareneingang Ersatzteile {0} ({1})").format(self.name, self.status), speichern=True)
        return self.status

    @frappe.whitelist()
    def stornieren(self, grund):
        self.check_permission("write")
        self.db_set("status", "Storniert")
        self.add_comment("Info", _("Storniert: {0}").format(grund))
        for p in self.positionen:
            if p.servicefall_zeile:
                frappe.db.set_value("PH Servicefall Ersatzteil", p.servicefall_zeile, {"status": "Benoetigt", "bestellung": None})
        return self.status
