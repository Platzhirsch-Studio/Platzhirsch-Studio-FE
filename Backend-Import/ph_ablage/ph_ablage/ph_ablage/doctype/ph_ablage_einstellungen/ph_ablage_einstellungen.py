"""PH Ablage Einstellungen (Single). Zugangsdaten nie hier, nur in site_config.json (CONVENTIONS 14).

`einstellungen()` liefert ein gecachtes dict (inkl. Ordnervorlagen und Endungsmengen) für API, Jobs und Hooks.
"""

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import cint

from ph_ablage import speicher
from ph_ablage.utils import regeln

CACHE = "ph_ablage:einstellungen"

STANDARD = {
    "speicher_adapter": "lokal",
    "speicher_praefix": "",
    "presign_sekunden": 300,
    "upload_token_stunden": 24,
    "chunk_mb": 8,
    "max_groesse_mb": 2048,
    "s3_pruefsumme_nachrechnen": 1,
    "erlaubte_endungen": "",
    "gesperrte_endungen": ", ".join(regeln.STANDARD_GESPERRT),
    "duplikat_verhalten": "melden",
    "automatische_ordner": 1,
    "papierkorb_tage": 30,
    "sperre_stunden": 8,
    "vorschau_aktiv": 1,
    "vorschau_px": 512,
    "office_vorschau": 0,
    "soffice_pfad": "soffice",
    "video_poster": 0,
    "volltext_aktiv": 1,
    "volltext_max_mb": 50,
    "freigabe_basis_url": "",
    "freigabe_standard_tage": 7,
    "freigabe_max_tage": 90,
    "freigabe_passwort_pflicht": 0,
}
GRENZEN = {"presign_sekunden": (30, 3600), "upload_token_stunden": (1, 168), "chunk_mb": (1, 64), "max_groesse_mb": (1, 51200), "papierkorb_tage": (1, 365), "sperre_stunden": (1, 168), "vorschau_px": (128, 2048), "volltext_max_mb": (1, 500), "freigabe_standard_tage": (1, 365), "freigabe_max_tage": (1, 365)}


class PHAblageEinstellungen(Document):
    def validate(self):
        for feld, (lo, hi) in GRENZEN.items():
            wert = cint(self.get(feld)) or STANDARD[feld]
            self.set(feld, min(max(wert, lo), hi))
        if cint(self.freigabe_standard_tage) > cint(self.freigabe_max_tage):
            self.freigabe_standard_tage = self.freigabe_max_tage
        if self.speicher_praefix:
            try:
                regeln.mit_praefix(self.speicher_praefix, "x")
            except ValueError:
                frappe.throw(_("Schlüssel-Präfix: nur Buchstaben, Ziffern, Punkt, Bindestrich, Unterstrich und „/“."))
        self.erlaubte_endungen = ", ".join(sorted(regeln.endungen_liste(self.erlaubte_endungen)))
        self.gesperrte_endungen = ", ".join(sorted(regeln.endungen_liste(self.gesperrte_endungen)))
        for z in self.ordnervorlagen or []:
            if z.bezug_doctype not in regeln.ERLAUBTE_BEZUEGE:
                frappe.throw(_("Ordnervorlage Zeile {0}: Bezugsart {1} ist nicht vorgesehen ({2}).").format(z.idx, z.bezug_doctype, ", ".join(regeln.ERLAUBTE_BEZUEGE)))
            try:
                z.pfad = " > ".join(regeln.pfad_teile(z.pfad))
            except ValueError:
                frappe.throw(_("Ordnervorlage Zeile {0}: Ordnername fehlt.").format(z.idx))
        if self.freigabe_basis_url and not str(self.freigabe_basis_url).startswith("https://"):
            frappe.throw(_("Basis-URL der Freigabeseite muss mit https:// beginnen."))
        self.konfig_status = konfig_text(self.speicher_adapter)

    def on_update(self):
        frappe.cache().delete_value(CACHE)
        speicher.cache_leeren()

    @frappe.whitelist()
    def speicher_pruefen(self):
        """Verbindungstest des eingestellten Adapters (Desk-Button). Gibt nie Zugangsdaten aus."""
        self.check_permission("write")
        try:
            ergebnis = speicher.speicher_fuer(self.speicher_adapter).pruefen()
        except speicher.NichtKonfiguriert as e:
            ergebnis = {"ok": False, "meldung": str(e)}
        self.db_set("konfig_status", konfig_text(self.speicher_adapter), update_modified=False)
        return ergebnis

    @frappe.whitelist()
    def vorlagen_zuruecksetzen(self):
        """Ordnervorlagen auf den Standard (utils/regeln.py STANDARD_VORLAGEN) setzen."""
        self.check_permission("write")
        self.set("ordnervorlagen", [])
        for z in standard_vorlagen_zeilen():
            self.append("ordnervorlagen", z)
        self.save()
        return len(self.ordnervorlagen)


def standard_vorlagen_zeilen():
    zeilen = []
    for dt, liste in regeln.STANDARD_VORLAGEN.items():
        for i, z in enumerate(liste, 1):
            zeilen.append({"bezug_doctype": dt, "pfad": z["pfad"], "rechte_modus": z.get("modus") or "", "aufbewahrungsklasse": z.get("aufbewahrung") or "", "farbe": z.get("farbe") or "", "reihenfolge": i * 10})
    return zeilen


def konfig_text(adapter):
    status = speicher.konfig_status(adapter, frappe.conf)
    if not status:
        return _("Adapter „{0}“ braucht keine site_config-Schlüssel.").format(adapter)
    return "\n".join(f"{k}: {_('gesetzt') if v else _('fehlt')}" for k, v in status.items())


def einstellungen():
    """Gecachtes dict aller Einstellungen + 'vorlagen' {bezug_doctype: [zeilen]} + Endungsmengen."""
    werte = frappe.cache().get_value(CACHE)
    if werte:
        return frappe._dict(werte)
    werte = dict(STANDARD)
    try:
        doc = frappe.get_cached_doc("PH Ablage Einstellungen")
        for k in STANDARD:
            v = doc.get(k)
            if v not in (None, ""):
                werte[k] = v
        vorlagen = {}
        for z in doc.get("ordnervorlagen") or []:
            vorlagen.setdefault(z.bezug_doctype, []).append({"pfad": z.pfad, "modus": z.rechte_modus, "aufbewahrung": z.aufbewahrungsklasse, "farbe": z.farbe, "reihenfolge": z.reihenfolge})
        werte["vorlagen"] = vorlagen
    except Exception:  # noqa: BLE001 – vor Migration (Single noch leer)
        werte["vorlagen"] = {}
    werte["erlaubt"] = sorted(regeln.endungen_liste(werte.get("erlaubte_endungen")))
    werte["gesperrt"] = sorted(regeln.endungen_liste(werte.get("gesperrte_endungen")))
    frappe.cache().set_value(CACHE, werte, expires_in_sec=600)
    return frappe._dict(werte)
