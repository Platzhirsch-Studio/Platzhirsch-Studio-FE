"""PH Lagerbestand – Mengen ändern sich nur über PH Lagerbewegung (bestand.buche)."""

import frappe
from frappe import _
from frappe.model.document import Document

from ph_logistik.ph_logistik.bestand_logik import status_aus, verfuegbar
from ph_logistik.ph_logistik.helfer import produkt_info


class PHLagerbestand(Document):
    def before_insert(self):
        if not self.flags.ph_bestand_intern and int(self.menge or 0) > 0:
            # Anlage im Desk mit Menge → als Wareneingang verbuchen, damit das Journal stimmt
            self.flags.ph_eingang_buchen = int(self.menge)
            self.menge = 0

    def validate(self):
        info = produkt_info(self.produkt)
        self.produkt_name = info.get("beschreibung") or self.produkt
        self.marke = info.get("marke")
        if not self.ean:
            self.ean = info.get("ean")
        if self.ausstellungsstueck and not self.seriennummer:
            frappe.throw(_("Ausstellungsstücke brauchen eine Seriennummer (Standort-Verfolgung)."))
        if self.ausstellungsstueck and int(self.menge or 0) > 1:
            frappe.throw(_("Ein Ausstellungsstück ist genau ein Stück (eigene Zeile je Seriennummer)."))
        if self.ausstellungsstueck and self.zustand == "Neu":
            self.zustand = "Ausstellung"
        self.reserviert = max(int(self.reserviert or 0), 0)
        if self.gesperrt and not self.sperrgrund:
            frappe.throw(_("Bitte einen Sperrgrund angeben (z. B. Transportschaden, an Lieferant)."))
        self.verfuegbar = verfuegbar(self.menge, self.reserviert, self.gesperrt, self.kommission)
        if self.status not in ("Verkauft", "Ausgeschieden"):
            self.status = status_aus(self.menge, self.reserviert, gesperrt=self.gesperrt, kommission=self.kommission)
        teil = f"{self.produkt_name} · {self.lagerort}"
        if self.platz:
            teil += f" / {self.platz}"
        if self.seriennummer:
            teil += f" · SN {self.seriennummer}"
        if self.kommission:
            teil += f" · Kom. {self.kommission}"
        self.titel = teil[:140]

    def after_insert(self):
        menge = self.flags.get("ph_eingang_buchen")
        if menge:
            from ph_logistik.ph_logistik.bestand import buche

            buche("Wareneingang", self.produkt, menge, lagerort_nach=self.lagerort, ausfuehrung=self.ausfuehrung, seriennummer=self.seriennummer, platz_nach=self.platz, lagerbestand=self.name, grund=_("Erstanlage im Desk"))
            self.reload()

    def on_trash(self):
        if frappe.db.exists("PH Lagerbewegung", {"lagerbestand": self.name}):
            frappe.throw(_("Bestand mit Bewegungen kann nicht gelöscht werden – bitte ausbuchen."))

    # ── Buttons ───────────────────────────────────────────────────────────
    @frappe.whitelist()
    def umlagern(self, lagerort_nach=None, platz_nach=None, menge=None, platz_code=None):
        """Umlagern per Auswahl oder Scan des Platzetiketts (platz_code = '<Lagerort>/<Platz>')."""
        self.check_permission("write")
        from ph_logistik.ph_logistik.bestand import buche

        if platz_code:
            from ph_logistik.ph_logistik.lager import platz_aufloesen

            lagerort_nach, platz_nach = platz_aufloesen(platz_code)
        if not lagerort_nach:
            frappe.throw(_("Ziel-Lagerort fehlt."))
        if menge:
            m = int(menge)
        elif self.gesperrt or self.kommission:
            m = int(self.menge or 0)
        else:
            m = int(self.verfuegbar or self.menge or 0)
        b = buche("Umlagerung", self.produkt, m, lagerort_von=self.lagerort, lagerort_nach=lagerort_nach, ausfuehrung=self.ausfuehrung, seriennummer=self.seriennummer, platz_von=self.platz, platz_nach=platz_nach, lagerbestand=self.name, ausstellungsstueck=self.ausstellungsstueck, zustand=self.zustand, vk_cent_ausstellung=self.vk_cent_ausstellung, gesperrt=self.gesperrt, sperrgrund=self.sperrgrund, kommission=self.kommission)
        return b.name

    @frappe.whitelist()
    def reservieren(self, bezug_doctype, bezug, menge=1, bis=None, kontakt=None, kunde_name=None):
        """Reservierung mit Ablauf (Standard: PH Logistik Einstellungen.reservierung_tage_standard) und Kunde."""
        self.check_permission("write")
        if self.gesperrt or self.kommission:
            frappe.throw(_("Gesperrte oder Kommissionsware kann nicht reserviert werden."))
        from frappe.utils import add_days, nowdate

        from ph_logistik.ph_logistik.bestand import buche
        from ph_logistik.ph_logistik.helfer import einstellungen

        name = buche("Reservierung", self.produkt, int(menge), lagerort_von=self.lagerort, lagerbestand=self.name, bezug_doctype=bezug_doctype, bezug=bezug).name
        tage = int(einstellungen().get("reservierung_tage_standard") or 14)
        if kontakt and not kunde_name and frappe.db.exists("DocType", "PH Kontakt"):
            werte = frappe.db.get_value("PH Kontakt", kontakt, ["vorname", "nachname"]) or []
            kunde_name = " ".join(x for x in werte if x) or None
        self.db_set({"reserviert_bis": bis or add_days(nowdate(), tage), "reserviert_kontakt": kontakt, "reserviert_kunde_name": kunde_name})
        return name

    @frappe.whitelist()
    def sperren(self, grund):
        """Bestand sperren (Schaden, Rückgabe an Lieferant) – nicht verkäuflich, bleibt im Bestand."""
        self.check_permission("write")
        if not grund:
            frappe.throw(_("Bitte einen Sperrgrund angeben."))
        self.gesperrt, self.sperrgrund = 1, grund
        self.save()
        self.add_comment("Info", _("Gesperrt: {0}").format(grund))
        return self.status

    @frappe.whitelist()
    def entsperren(self):
        """Leitung: Sperre aufheben (z. B. Schaden behoben, Lieferant lehnt Rücknahme ab → B-Ware)."""
        self.check_permission("write")
        if not ({"PH Logistik Leitung", "System Manager", "PH Backoffice-Admin"} & set(frappe.get_roles())):
            frappe.throw(_("Entsperren darf nur die Leitung."))
        self.gesperrt, self.sperrgrund = 0, None
        self.save()
        return self.status

    @frappe.whitelist()
    def freigeben(self, menge=None):
        self.check_permission("write")
        from ph_logistik.ph_logistik.bestand import buche

        return buche("Freigabe", self.produkt, int(menge or self.reserviert or 1), lagerort_von=self.lagerort, lagerbestand=self.name).name

    @frappe.whitelist()
    def ausbuchen(self, grund, menge=None):
        self.check_permission("write")
        from ph_logistik.ph_logistik.bestand import buche

        return buche("Ausbuchung", self.produkt, int(menge or self.menge), lagerort_von=self.lagerort, lagerbestand=self.name, grund=grund).name

    @frappe.whitelist()
    def als_ausstellungsstueck_verkaufen(self, vk_cent=None):
        """→ Kassa (ph_kassa, später): Hier nur Verkauf buchen und Preis zurückgeben; Kassenbeleg legt ph_kassa an."""
        self.check_permission("write")
        from ph_logistik.ph_logistik.bestand import buche

        b = buche("Verkauf", self.produkt, 1, lagerort_von=self.lagerort, lagerbestand=self.name, grund=_("Verkauf Ausstellungsstück"))
        return {"bewegung": b.name, "vk_cent": int(vk_cent or self.vk_cent_ausstellung or 0), "produkt": self.produkt, "seriennummer": self.seriennummer}

    @frappe.whitelist()
    def etikett_daten(self):
        """Daten für das Lageretikett 62×29 mm (QR = Bestandsname)."""
        self.check_permission("read")
        return {"name": self.name, "produkt_name": self.produkt_name, "lagerort": self.lagerort, "platz": self.platz, "seriennummer": self.seriennummer, "ean": self.ean, "kommission": self.kommission, "qr": self.name}
