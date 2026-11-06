"""PH Ersatzteilbestellung – Controller: Summen, Senden (Mail an Lieferant), Wareneingang mit Bestandszugang."""

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import cint, getdate, now_datetime, nowdate

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
        self.ueberfaellig = int(
            self.status in ("Gesendet", "Bestaetigt", "Teilgeliefert")
            and bool(self.erwartet_am)
            and getdate(self.erwartet_am) < getdate(nowdate())
        )
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
    def wareneingang(self, mengen=None, alles=0):
        """Button „Wareneingang buchen“: {zeilen_name: menge} (Teileingang) oder alles=1 (Rest jeder Zeile) →
        Bestand Zugang (Lager), Servicefall-Zeile „Eingetroffen“ erst bei voller Menge; sobald alle Teile eines Falls
        da sind: ToDo „Einsatz planen“ an den Verantwortlichen."""
        self.check_permission("write")
        if self.status in ("Storniert", "Geliefert"):
            frappe.throw(_("Bestellung ist {0} – kein Wareneingang mehr möglich.").format(_(self.status)))
        if isinstance(mengen, str):
            mengen = frappe.parse_json(mengen)
        mengen = dict(mengen or {})
        if cint(alles):
            mengen = {p.name: cint(p.menge) - cint(p.menge_erhalten) for p in self.positionen}
        if not any(cint(v) > 0 for v in mengen.values()):
            frappe.throw(_("Keine Menge erfasst."))
        for p in self.positionen:
            if cint(mengen.get(p.name)) > cint(p.menge) - cint(p.menge_erhalten):
                frappe.throw(_("Zeile {0}: mehr erhalten als offen ({1}).").format(p.idx, cint(p.menge) - cint(p.menge_erhalten)))
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
            if p.servicefall_zeile and cint(p.menge_erhalten) >= cint(p.menge):
                frappe.db.set_value("PH Servicefall Ersatzteil", p.servicefall_zeile, "status", "Eingetroffen")
        if self.status in ("Entwurf",):
            self.status = "Gesendet"
        self.save()
        if self.servicefall:
            sf = frappe.get_doc("PH Servicefall", self.servicefall)
            kom.verlauf(sf, "Ersatzteil", hinweis=_("Wareneingang Ersatzteile {0} ({1})").format(self.name, _(self.status)), speichern=True)
            self._fall_benachrichtigen(sf)
        return self.status

    def _fall_benachrichtigen(self, sf):
        """Alle Ersatzteile des Falls eingetroffen → ToDo „Einsatz planen“ (einmal je Fall)."""
        try:
            offen = frappe.db.count("PH Servicefall Ersatzteil", {"parent": sf.name, "status": ("in", ["Benoetigt", "Bestellt"])})
            if offen:
                return
            sf = frappe.get_doc("PH Servicefall", sf.name)
            if sf.sla_pausiert_seit and sf.sla_pause_grund == "Ersatzteil":
                sf._sla_pause_beenden(automatisch=True)  # SLA läuft weiter, sobald alle Teile da sind
                sf.flags.ignore_permissions = True
                sf.save()
            from ph_service.ph_service.tasks import _leitung_benutzer, _todo, benachrichtigen

            empfaenger = sf.verantwortlich or _leitung_benutzer()[0]
            text = _("Ersatzteile eingetroffen – Einsatz planen: {0}").format(sf.titel)
            _todo(empfaenger, sf.doctype, sf.name, text, prioritaet="High", schluessel="Ersatzteile eingetroffen")
            benachrichtigen(empfaenger, sf.doctype, sf.name, text)
        except Exception:  # noqa: BLE001
            frappe.log_error(title=f"PH Ersatzteilbestellung {self.name}: Benachrichtigung")


    @frappe.whitelist()
    def stornieren(self, grund):
        self.check_permission("write")
        self.db_set("status", "Storniert")
        self.add_comment("Info", _("Storniert: {0}").format(grund))
        for p in self.positionen:
            if p.servicefall_zeile:
                frappe.db.set_value("PH Servicefall Ersatzteil", p.servicefall_zeile, {"status": "Benoetigt", "bestellung": None})
        return self.status
