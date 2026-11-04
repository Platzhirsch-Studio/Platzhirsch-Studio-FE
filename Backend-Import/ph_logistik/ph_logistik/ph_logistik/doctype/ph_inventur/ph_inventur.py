"""PH Inventur – Zählliste aus Bestand, Zählung, Freigabe (Leitung) erzeugt Inventur-Bewegungen."""

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import now_datetime

from ph_logistik.ph_logistik.bestand_logik import inventur_differenzen
from ph_logistik.ph_logistik.helfer import setze_status


class PHInventur(Document):
    def validate(self):
        self.titel = f"Inventur {self.lagerort} {frappe.utils.formatdate(self.datum)}"[:140]
        for p in self.positionen:
            p.differenz = (int(p.ist or 0) - int(p.soll or 0)) if p.gezaehlt else 0
            if p.gezaehlt and p.differenz and not p.grund:
                p.grund = "Sonstiges"
        n, gez, diff, summe, _bew = inventur_differenzen([p.as_dict() for p in self.positionen])
        self.anzahl_positionen, self.anzahl_gezaehlt, self.differenz_positionen, self.differenz_summe = n, gez, diff, summe

    # ── Buttons ───────────────────────────────────────────────────────────
    @frappe.whitelist()
    def zaehlliste_erzeugen(self):
        """Soll-Mengen aus PH Lagerbestand des Lagerorts (nur Geplant)."""
        self.check_permission("write")
        if self.status != "Geplant":
            frappe.throw(_("Zählliste nur im Status Geplant erzeugen."))
        filt = {"lagerort": self.lagerort, "status": ("!=", "Ausgeschieden")}
        if self.nur_ausstellungsstuecke:
            filt["ausstellungsstueck"] = 1
        rows = frappe.get_all("PH Lagerbestand", filt, ["name", "produkt", "produkt_name", "platz", "seriennummer", "menge"], order_by="platz, produkt_name")
        self.set("positionen", [])
        for r in rows:
            self.append("positionen", {"lagerbestand": r.name, "produkt": r.produkt, "produkt_name": r.produkt_name, "platz": r.platz, "seriennummer": r.seriennummer, "soll": r.menge, "ist": 0, "gezaehlt": 0})
        self.save()
        return len(rows)

    @frappe.whitelist()
    def starten(self):
        self.check_permission("write")
        if not self.positionen:
            self.zaehlliste_erzeugen()
        if not self.gezaehlt_von:
            self.db_set("gezaehlt_von", frappe.session.user)
        setze_status(self, "Laufend")
        return self.status

    @frappe.whitelist()
    def zaehlen(self, lagerbestand, ist):
        """Eine Zeile zählen (auch mobil per Scan des Bestand-QR)."""
        self.check_permission("write")
        if self.status != "Laufend":
            frappe.throw(_("Inventur läuft nicht."))
        for p in self.positionen:
            if p.lagerbestand == lagerbestand:
                p.ist = int(ist)
                p.gezaehlt = 1
                self.save()
                return p.differenz
        frappe.throw(_("Bestand {0} ist nicht in dieser Zählliste.").format(lagerbestand))

    @frappe.whitelist()
    def freigeben(self):
        """Leitung: Differenzen als Inventur-Bewegungen buchen, Status Abgeschlossen."""
        self.check_permission("write")
        rollen = frappe.get_roles()
        if not ({"PH Logistik Leitung", "System Manager", "PH Backoffice-Admin"} & set(rollen)):
            frappe.throw(_("Nur die Leitung gibt eine Inventur frei."))
        if self.status != "Laufend":
            frappe.throw(_("Nur laufende Inventuren können freigegeben werden."))
        from ph_logistik.ph_logistik.bestand import buche

        _n, _gez, _diff, _summe, bew = inventur_differenzen([p.as_dict() for p in self.positionen])
        gebucht = 0
        for b in bew:
            buche("Inventur", b["produkt"], b["menge"], lagerort_nach=self.lagerort, lagerbestand=b["lagerbestand"], bezug_doctype="PH Inventur", bezug=self.name, grund=b.get("grund"), idempotency_key=f"inv:{self.name}:{b['lagerbestand']}", negativ_erlaubt=True)
            gebucht += 1
        # Auch Zeilen ohne Differenz erhalten das Inventurdatum
        for p in self.positionen:
            if p.gezaehlt and p.lagerbestand:
                frappe.db.set_value("PH Lagerbestand", p.lagerbestand, "inventur_am", self.datum, update_modified=False)
        self.db_set({"freigegeben_von": frappe.session.user, "freigegeben_am": now_datetime()})
        setze_status(self, "Abgeschlossen")
        return gebucht

    @frappe.whitelist()
    def verwerfen(self):
        self.check_permission("write")
        if self.status == "Abgeschlossen":
            frappe.throw(_("Abgeschlossene Inventuren bleiben bestehen."))
        setze_status(self, "Verworfen")
        return self.status
