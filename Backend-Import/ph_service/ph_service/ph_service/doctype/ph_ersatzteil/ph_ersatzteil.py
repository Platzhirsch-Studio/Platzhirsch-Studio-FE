"""PH Ersatzteil – Bestand als Summe der Bewegungen (Zugang/Verbrauch/Korrektur/Retoure); buchen() ist der einzige Weg."""

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import cint, now_datetime

ARTEN = ("Zugang", "Verbrauch", "Korrektur", "Retoure", "Inventur")
VORZEICHEN = {"Zugang": 1, "Verbrauch": -1, "Korrektur": 1, "Retoure": 1, "Inventur": 1}


class PHErsatzteil(Document):
    def validate(self):
        self.bezeichnung = (self.bezeichnung or "").strip()
        self.hersteller_nr = (self.hersteller_nr or "").strip() or None
        self.titel = f"{self.bezeichnung}{' · ' + self.hersteller_nr if self.hersteller_nr else ''}{' · ' + self.marke if self.marke else ''}"[:140]
        self.bestand_neu_berechnen()

    def bestand_neu_berechnen(self):
        if not self.bestand_fuehren:
            self.bestand = self.reserviert = self.verfuegbar = 0
            return
        summe = 0
        for b in self.bewegungen or []:
            summe += VORZEICHEN.get(b.art, 1) * cint(b.menge)
        self.bestand = summe
        reserviert = 0
        if not self.is_new():
            reserviert = frappe.db.sql(
                """select coalesce(sum(z.menge),0) from `tabPH Servicefall Ersatzteil` z join `tabPH Servicefall` s on s.name=z.parent
                   where z.ersatzteil=%s and z.status='Aus Bestand' and s.status not in ('Erledigt','Geschlossen','Abgelehnt')""",
                self.name,
            )[0][0]
        self.reserviert = cint(reserviert)
        self.verfuegbar = self.bestand - self.reserviert
        if self.bestand < 0:
            frappe.throw(_("Bestand von {0} würde negativ ({1}).").format(self.bezeichnung, self.bestand))

    @frappe.whitelist()
    def bewegung_buchen(self, art, menge, hinweis=None, bezug_doctype=None, bezug=None):
        """Button „Bewegung buchen“ (Dialog). Inventur = Bestand auf `menge` setzen."""
        self.check_permission("write")
        return buchen(self.name, art, cint(menge), bezug_doctype, bezug, hinweis)

    def unter_mindestbestand(self):
        return bool(self.bestand_fuehren) and cint(self.mindestbestand) > 0 and cint(self.verfuegbar) < cint(self.mindestbestand)


def buchen(ersatzteil, art, menge, bezug_doctype=None, bezug=None, hinweis=None, von_user=None):
    """Bewegung an das Ersatzteil hängen und Bestand neu berechnen. Rückgabe: neuer Bestand."""
    if art not in ARTEN:
        frappe.throw(_("Unbekannte Bewegungsart {0}.").format(art))
    menge = cint(menge)
    doc = frappe.get_doc("PH Ersatzteil", ersatzteil)
    if not doc.bestand_fuehren:
        return doc.bestand
    if art == "Inventur":
        # Bestand auf Zählwert setzen: Differenz als Korrektur mit Vorzeichen.
        differenz = menge - cint(doc.bestand)
        if differenz == 0:
            return doc.bestand
        art, menge = "Korrektur", differenz
        hinweis = hinweis or _("Inventur: Zählwert {0}").format(menge + cint(doc.bestand))
    elif menge <= 0:
        frappe.throw(_("Menge muss größer 0 sein."))
    doc.append("bewegungen", {"zeit": now_datetime(), "art": art, "menge": menge, "bezug_doctype": bezug_doctype, "bezug": bezug, "hinweis": (hinweis or "")[:200], "von_user": von_user or frappe.session.user})
    doc.flags.ignore_permissions = True
    doc.save()
    if doc.unter_mindestbestand():
        frappe.msgprint(_("{0}: verfügbar {1} < Mindestbestand {2}.").format(doc.bezeichnung, doc.verfuegbar, doc.mindestbestand), indicator="orange", alert=True)
    return doc.bestand


def unter_mindestbestand():
    """Für Number Card und Report: Ersatzteile, deren verfügbarer Bestand unter dem Mindestbestand liegt."""
    rows = frappe.get_all("PH Ersatzteil", filters={"bestand_fuehren": 1, "status": ("!=", "Inaktiv"), "mindestbestand": (">", 0)}, fields=["name", "bezeichnung", "hersteller_nr", "marke", "lieferant", "bestand", "verfuegbar", "mindestbestand"], limit=1000)
    return [r for r in rows if cint(r.verfuegbar) < cint(r.mindestbestand)]
