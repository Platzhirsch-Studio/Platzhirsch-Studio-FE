"""PH Projekte Einstellungen – fachliche Schalter; Abschnitt Kalkulation (Kostensätze, Ziel-DB, Gemeinkosten, Schwellen)
mit Validierung (utils.kalkulation.einstellungen_pruefen) und Änderungsprotokoll (PH Kalkulation Protokoll)."""

import frappe
from frappe import _
from frappe.model.document import Document

KALK_TABELLEN = {
    "kostensaetze": ("taetigkeit", "rolle", "mitarbeiter", "satz_cent", "gueltig_ab", "platzhalter"),
    "ziel_db": ("projektart", "ziel_db1", "ziel_db2", "ziel_db3", "ampel_gelb_unter", "ampel_rot_unter", "budget_gelb", "budget_rot", "gueltig_ab"),
    "gemeinkosten_regeln": ("projektart", "art", "prozent", "betrag_je_stunde_cent", "gueltig_ab"),
}
KALK_FELDER = ("budget_gelb_prozent", "budget_rot_prozent", "ampel_gelb_unter", "ampel_rot_unter", "abweichung_kommentar_prozent",
               "kalkulation_warnung_aktiv", "budget_bei_auftrag_vorbelegen", "montage_kostensatz_cent", "montage_richtwerte")


def tabelle(doc, feld):
    spalten = KALK_TABELLEN[feld]
    return [{k: (str(z.get(k)) if z.get(k) is not None else None) for k in spalten} for z in doc.get(feld) or []]


class PHProjekteEinstellungen(Document):
    def validate(self):
        if not self.meta.has_field("kostensaetze"):
            return
        from ph_projekte.ph_projekte.nachkalkulation import eingerichtet, projektarten
        from ph_projekte.utils.kalkulation import einstellungen_pruefen

        fehler = einstellungen_pruefen(self.kostensaetze, self.ziel_db, self.gemeinkosten_regeln, projektarten())
        for f in ("budget_gelb_prozent", "budget_rot_prozent", "abweichung_kommentar_prozent"):
            if not 0 <= float(self.get(f) or 0) <= 200:
                fehler.append(_("{0}: 0–200 %").format(self.meta.get_label(f)))
        if float(self.budget_gelb_prozent or 0) > float(self.budget_rot_prozent or 100):
            fehler.append(_("Budget gelb liegt über Budget rot."))
        if fehler:
            frappe.throw("<br>".join(frappe.utils.escape_html(x) for x in fehler), title=_("Kalkulation: Einstellungen prüfen"))
        for z in self.kostensaetze or []:
            if int(z.satz_cent or 0) > 0:
                z.platzhalter = 0
        self.kalkulation_eingerichtet = int(eingerichtet(self))
        vorher = self.get_doc_before_save()
        prot = []
        if vorher:
            for feld in KALK_TABELLEN:
                alt, neu = tabelle(vorher, feld), tabelle(self, feld)
                if alt != neu:
                    prot.append((feld, alt, neu))
            for f in KALK_FELDER:
                if f == "montage_richtwerte":
                    alt = [(r.kategorie, r.minuten_je_stueck) for r in vorher.get(f) or []]
                    neu = [(r.kategorie, r.minuten_je_stueck) for r in self.get(f) or []]
                else:
                    alt, neu = vorher.get(f), self.get(f)
                if str(alt) != str(neu):
                    prot.append((f, alt, neu))
        self.flags.kalk_protokoll = prot

    def on_update(self):
        if self.flags.kalk_protokoll:
            from ph_projekte.ph_projekte.nachkalkulation import protokoll

            for feld, alt, neu in self.flags.kalk_protokoll:
                protokoll("Einstellungen", self.doctype, self.name, feld, alt, neu, self.flags.kalk_begruendung)
            self.flags.kalk_protokoll = None
