"""PH Wareneingang – Eingang je Lieferung; verbucht Mengen in der Herstellerbestellung."""

import frappe
from frappe import _
from frappe.model.document import Document

from ph_sortiment.logik.abgleich import wareneingang_status


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
        self.status = wareneingang_status([z.as_dict() for z in self.positionen])
        self.reklamation = 1 if self.status == "Reklamiert" else 0
        self.titel = f"{self.herstellerbestellung} · {self.lieferant or hb.lieferant} · {frappe.utils.formatdate(self.datum)}"[:140]

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
