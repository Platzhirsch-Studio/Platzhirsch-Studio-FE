import frappe
from frappe.model.document import Document

CACHE = "ph_service:einstellungen"

STANDARD = {
    "gewaehrleistung_monate": 24,
    "verjaehrung_monate": 3,
    "fristwarnung_tage": 60,
    "vermutung_verbraucher_monate": 12,
    "vermutung_unternehmer_monate": 6,
    "regress_monate": 2,
    "reaktion_werktage": 2,
    "eskalation_tage": 5,
    "eskalation_an": None,
    "kulanz_schwelle_cent": 50000,
    "standard_prioritaet": "Normal",
    "techniker_standard": None,
    "ersatzteil_bestand_fuehren": 1,
    "ersatzteil_lagerort": None,
    "mindestbestand_warnung": 1,
    "vorlage_eingang": "PH Service Eingangsbestätigung",
    "vorlage_termin": "PH Service Terminvorschlag",
    "vorlage_abschluss": "PH Service Abschluss",
    "vorlage_wartung": "PH Service Wartungserinnerung",
    "vorlage_regress": "PH Service Regressmeldung",
    "mail_automatisch": 0,
    "erinnerung_tage_vorher": 42,
    "wartung_karenz_tage": 14,
    "nachkauf_tage_nach": 14,
    "portal_sichtbar_standard": 1,
    "portal_fotos_max": 8,
    "portal_foto_max_mb": 10,
    "portal_videos_max": 2,
    "portal_video_max_mb": 50,
    # SLA je Priorität (Werktage) – ph_service/utils/sla.py
    "sla_reaktion_niedrig": 3,
    "sla_reaktion_normal": 2,
    "sla_reaktion_hoch": 1,
    "sla_reaktion_dringend": 0,
    "sla_loesung_niedrig": 30,
    "sla_loesung_normal": 20,
    "sla_loesung_hoch": 10,
    "sla_loesung_dringend": 3,
    "sla_warn_werktage": 2,
    "sla_gf_ab_stufe": 2,
    "telefon_ist_erstreaktion": 1,
    "ersatzteil_ueberfaellig_tage": 3,
    "vorlage_ablehnung": "PH Service Ablehnung",
    "vorlage_frei": "PH Service Nachricht",
    "vorlage_servicebericht": "PH Service Servicebericht",
    "wartung_automatisch": 1,
    "wartung_vorlauf_tage": 28,
    "einsatz_takt_min": 15,
    "einsatz_puffer_min": 30,
    "techniker_tag_von": "08:00:00",
    "techniker_tag_bis": "17:00:00",
    "regress_toleranz_cent": 100,
    "sla_pause_bei_ersatzteil": 1,
    "regress_mahnabstand_tage": 14,
    "regress_max_mahnstufe": 3,
    "abholung_frist_tage": 14,
}

PRIO_FELD = {"Niedrig": "niedrig", "Normal": "normal", "Hoch": "hoch", "Dringend": "dringend"}


def sla_tabellen(einst=None):
    """→ (reaktion, loesung) als dict Priorität → Werktage (für ph_service.utils.sla.fristen)."""
    einst = einst or einstellungen()
    reaktion = {p: int(einst.get(f"sla_reaktion_{k}") if einst.get(f"sla_reaktion_{k}") is not None else STANDARD[f"sla_reaktion_{k}"]) for p, k in PRIO_FELD.items()}
    loesung = {p: int(einst.get(f"sla_loesung_{k}") or STANDARD[f"sla_loesung_{k}"]) for p, k in PRIO_FELD.items()}
    return reaktion, loesung


def feiertage(jahre=None):
    """Feiertage/Betriebsurlaub als Menge von date: PH Termin Einstellungen (ph_crm, Tabelle feiertage),
    Rückfall gesetzliche Feiertage AT aus ph_crm/utils/feiertage.py; gecacht je Tag."""
    from datetime import date

    from frappe.utils import getdate

    schluessel = "ph_service:feiertage"
    werte = frappe.cache().get_value(schluessel)
    if werte is None:
        menge = set()
        heute = date.today()
        for jahr in jahre or (heute.year - 1, heute.year, heute.year + 1):
            try:
                from ph_crm.utils.feiertage import feiertage_at

                menge.update(feiertage_at(jahr).keys())
            except Exception:  # noqa: BLE001 – ph_crm fehlt: nur Wochenenden
                pass
        try:
            if frappe.db.exists("DocType", "PH Termin Feiertag"):
                for d in frappe.get_all("PH Termin Feiertag", filters={"parenttype": "PH Termin Einstellungen"}, pluck="datum"):
                    if d:
                        menge.add(getdate(d))
        except Exception:  # noqa: BLE001
            pass
        werte = sorted(str(d) for d in menge)
        frappe.cache().set_value(schluessel, werte, expires_in_sec=6 * 3600)
    return {getdate(d) for d in werte}


class PHServiceEinstellungen(Document):
    def validate(self):
        for feld in ("gewaehrleistung_monate", "fristwarnung_tage", "reaktion_werktage", "eskalation_tage", "erinnerung_tage_vorher"):
            if (self.get(feld) or 0) < 0:
                self.set(feld, STANDARD[feld])
        self.verjaehrung_monate = 3
        self.regress_monate = 2

    def on_update(self):
        frappe.cache().delete_value(CACHE)
        frappe.cache().delete_value("ph_service:feiertage")


def einstellungen():
    """Alle Einstellungen als dict (gecacht), mit Standardwerten vor der ersten Speicherung."""
    werte = frappe.cache().get_value(CACHE)
    if werte is None:
        werte = dict(STANDARD)
        try:
            doc = frappe.get_single("PH Service Einstellungen")
            for k in STANDARD:
                v = doc.get(k)
                if v not in (None, ""):
                    werte[k] = v
        except Exception:  # noqa: BLE001 – vor Migration noch keine Tabelle
            pass
        frappe.cache().set_value(CACHE, werte)
    return werte
