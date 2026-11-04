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
        self.verfuegbar = verfuegbar(self.menge, self.reserviert)
        if self.status not in ("Verkauft", "Ausgeschieden"):
            self.status = status_aus(self.menge, self.reserviert)
        teil = f"{self.produkt_name} · {self.lagerort}"
        if self.platz:
            teil += f" / {self.platz}"
        if self.seriennummer:
            teil += f" · SN {self.seriennummer}"
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
    def umlagern(self, lagerort_nach, platz_nach=None, menge=None):
        self.check_permission("write")
        from ph_logistik.ph_logistik.bestand import buche

        m = int(menge or self.verfuegbar or self.menge)
        b = buche("Umlagerung", self.produkt, m, lagerort_von=self.lagerort, lagerort_nach=lagerort_nach, ausfuehrung=self.ausfuehrung, seriennummer=self.seriennummer, platz_von=self.platz, platz_nach=platz_nach, lagerbestand=self.name, ausstellungsstueck=self.ausstellungsstueck, zustand=self.zustand, vk_cent_ausstellung=self.vk_cent_ausstellung)
        return b.name

    @frappe.whitelist()
    def reservieren(self, bezug_doctype, bezug, menge=1):
        self.check_permission("write")
        from ph_logistik.ph_logistik.bestand import buche

        return buche("Reservierung", self.produkt, int(menge), lagerort_von=self.lagerort, lagerbestand=self.name, bezug_doctype=bezug_doctype, bezug=bezug).name

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
        return {"name": self.name, "produkt_name": self.produkt_name, "lagerort": self.lagerort, "platz": self.platz, "seriennummer": self.seriennummer, "ean": self.ean, "qr": self.name}
