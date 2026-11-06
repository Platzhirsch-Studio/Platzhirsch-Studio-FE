"""PH Wareneingang – Eingang je Lieferung; verbucht Mengen in der Herstellerbestellung."""

import frappe
from frappe import _
from frappe.model.document import Document

from ph_sortiment.logik.abgleich import mengen_abgleich, wareneingang_status


class PHWareneingang(Document):
    def before_insert(self):
        self.erfasst_von = frappe.session.user

    def validate(self):
        if not self.positionen:
            frappe.throw(_("Mindestens eine Position ist nötig."))
        hb = frappe.get_doc("PH Herstellerbestellung", self.herstellerbestellung)
        if hb.status in ("Entwurf", "Storniert"):
            frappe.throw(_("Wareneingang nur zu gesendeten Bestellungen (Status {0}).").format(hb.status))
        nach_idx = {p.idx: p for p in hb.positionen}
        for z in self.positionen:
            if (z.menge_erhalten or 0) < 0:
                frappe.throw(_("Position {0}: Menge darf nicht negativ sein.").format(z.idx))
            if z.zustand in ("Transportschaden", "beschaedigt", "falsch") and not (z.foto or z.hinweis or self.reklamation_text):
                frappe.throw(_("Position {0}: Zustand „{1}“ braucht Foto oder Hinweis (Nachweis für den Lieferanten).").format(z.idx, z.zustand))
            if z.position and z.position in nach_idx and not z.produkt:
                z.produkt, z.bezeichnung = nach_idx[z.position].produkt, nach_idx[z.position].bezeichnung
            z.differenz, z.mengen_abweichung = mengen_abgleich(z.menge_erwartet, z.menge_erhalten)
        self.unterlieferung = sum(1 for z in self.positionen if z.mengen_abweichung == "Unterlieferung")
        self.ueberlieferung = sum(1 for z in self.positionen if z.mengen_abweichung == "Ueberlieferung")
        if not self.lieferant:
            self.lieferant = hb.lieferant
        if not self.kommission and hb.kommission:
            self.kommission = hb.kommission
        self.bezug_uebernehmen(hb)
        self.status = wareneingang_status([z.as_dict() for z in self.positionen])
        self.reklamation = 1 if self.status == "Reklamiert" else 0
        self.titel = f"{self.herstellerbestellung} · {self.lieferant or hb.lieferant} · {frappe.utils.formatdate(self.datum)}"[:140]

    def bezug_uebernehmen(self, hb):
        """Kunde/Projekt aus dem Bezug der Bestellung (PH Projekt/PH Auftragsbestaetigung/PH Bestellung) – für Servicefall und Kommission."""
        if self.kontakt and self.projekt:
            return
        dt, name = hb.bezug_doctype, hb.bezug_name
        if not (dt and name) or not frappe.db.exists("DocType", dt):
            return
        if dt == "PH Projekt":
            self.projekt = self.projekt or name
        elif dt == "PH Auftragsbestaetigung" and not self.projekt:
            self.projekt = frappe.db.get_value(dt, name, "projekt") if frappe.get_meta(dt).has_field("projekt") else None
        if not self.kontakt and frappe.get_meta(dt).has_field("kontakt"):
            self.kontakt = frappe.db.get_value(dt, name, "kontakt")

    def after_insert(self):
        self.verbuchen()

    def verbuchen(self):
        """Erhaltene Mengen (nur ok/beschaedigt zählen als erhalten; fehlt/falsch nicht) an die Bestellung."""
        mengen = {}
        for z in self.positionen:
            if z.position and z.zustand not in ("fehlt", "falsch") and (z.menge_erhalten or 0) > 0:
                mengen[z.position] = mengen.get(z.position, 0) + int(z.menge_erhalten)
        if not mengen:
            return
        try:
            hb = frappe.get_doc("PH Herstellerbestellung", self.herstellerbestellung)
            hb.lieferung_verbuchen(mengen, self.datum)
        except Exception:  # noqa: BLE001
            frappe.log_error(title=f"PH Wareneingang {self.name}: Verbuchung fehlgeschlagen")
            frappe.msgprint(_("Mengen konnten nicht in die Bestellung übernommen werden (siehe Fehlerprotokoll)."), indicator="red")

    def on_trash(self):
        if any((z.menge_erhalten or 0) > 0 for z in self.positionen):
            frappe.throw(_("Wareneingänge mit verbuchten Mengen können nicht gelöscht werden – Korrektur-Wareneingang anlegen."))

    @frappe.whitelist()
    def reklamation_melden(self):
        """Button „Reklamation an Lieferant“: Mail mit Positionen/Fotos (Servicefall folgt mit ph_service)."""
        self.check_permission("write")
        from ph_core.utils.mail import sende

        email = frappe.db.get_value("PH Lieferant", self.lieferant, "bestell_email")
        if not email:
            frappe.throw(_("Keine E-Mail beim Lieferanten."))
        zeilen = [f"- Pos. {z.position or z.idx}: {z.bezeichnung} – {z.zustand} ({z.menge_erhalten} erhalten){' – ' + z.hinweis if z.hinweis else ''}" for z in self.positionen if z.zustand != "ok"]
        text = _("Sehr geehrte Damen und Herren,\n\nzu Ihrer Lieferung {0} (unsere Bestellung {1}) melden wir folgende Abweichungen:\n{2}\n\n{3}\n\nBitte bestätigen Sie den Eingang dieser Meldung und nennen Sie uns das weitere Vorgehen.\n\nMit freundlichen Grüßen\nPlatzhirsch Home Living").format(self.lieferschein_nr_lieferant or self.name, self.herstellerbestellung, "\n".join(zeilen), self.reklamation_text or "")
        anhaenge = [{"file_url": z.foto} for z in self.positionen if z.foto] + [{"file_url": f.bild} for f in self.fotos]
        sende([email], _("Reklamation zu Lieferung {0}").format(self.herstellerbestellung), text.replace("\n", "<br>"), text=text, anhaenge=anhaenge, referenz_doctype=self.doctype, referenz_name=self.name)
        self.add_comment("Info", _("Reklamation an {0} gesendet").format(email))
        return email

    @frappe.whitelist()
    def schaden_melden(self, beschreibung=None, regress=0):
        """Button „Schaden → Servicefall“: PH Servicefall (ph_service, art Transportschaden, Lieferant aus Bestellung) mit allen
        Fotos des Wareneingangs; regress=1 legt zusätzlich den PH Lieferantenregress an. Ohne ph_service oder ohne Kunde
        (Lagerware): Reklamation an den Lieferanten + ToDo an die Leitung."""
        self.check_permission("write")
        schaeden = [z for z in self.positionen if z.zustand in ("Transportschaden", "beschaedigt", "falsch", "fehlt")]
        if not schaeden:
            frappe.throw(_("Keine Position mit Schaden/Fehlmenge."))
        if self.servicefall_ref:
            return {"servicefall": self.servicefall_ref, "regress": self.regress_ref}
        text = beschreibung or "\n".join(f"Pos. {z.position or z.idx} {z.bezeichnung or ''}: {z.zustand} ({z.menge_erhalten or 0}/{z.menge_erwartet or 0}){' – ' + z.hinweis if z.hinweis else ''}" for z in schaeden)
        art = "Transportschaden" if any(z.zustand == "Transportschaden" for z in schaeden) else "Mangel"
        if not frappe.db.exists("DocType", "PH Servicefall") or not self.kontakt:
            grund = _("ph_service nicht installiert") if not frappe.db.exists("DocType", "PH Servicefall") else _("kein Kunde (Lagerware)")
            frappe.get_doc({"doctype": "ToDo", "allocated_to": self.erfasst_von or frappe.session.user, "reference_type": self.doctype, "reference_name": self.name, "description": _("Schaden im Wareneingang {0} klären ({1}): {2}").format(self.name, grund, text)[:1000]}).insert(ignore_permissions=True)
            self.add_comment("Info", _("Schaden gemeldet ohne Servicefall: {0}").format(grund))
            return {"servicefall": None, "regress": None, "hinweis": grund}
        aus_dokument = frappe.get_attr("ph_service.ph_service.doctype.ph_servicefall.ph_servicefall.aus_dokument")
        produkt = next((z.produkt for z in schaeden if z.produkt), None)
        sf = aus_dokument(self.doctype, self.name, beschreibung=text, art=art, produkt=produkt)
        dateien = [z.foto for z in self.positionen if z.foto] + [f.bild for f in self.fotos if f.bild]
        for url in dict.fromkeys(dateien):
            try:
                frappe.get_doc({"doctype": "File", "file_url": url, "attached_to_doctype": "PH Servicefall", "attached_to_name": sf, "is_private": 1}).insert(ignore_permissions=True)
            except Exception:  # noqa: BLE001 – Foto-Verknüpfung ist Nebensache
                frappe.log_error(title=f"PH Wareneingang {self.name}: Foto an Servicefall")
        werte = {"servicefall_ref": sf, "servicefall_hinweis": _("Servicefall {0}").format(sf)}
        if frappe.utils.cint(regress):
            werte["regress_ref"] = frappe.get_doc("PH Servicefall", sf).regress_anlegen()
        self.db_set(werte)
        self.add_comment("Info", _("Servicefall {0} angelegt{1}").format(sf, _(" mit Regress {0}").format(werte["regress_ref"]) if werte.get("regress_ref") else ""))
        return {"servicefall": sf, "regress": werte.get("regress_ref")}
