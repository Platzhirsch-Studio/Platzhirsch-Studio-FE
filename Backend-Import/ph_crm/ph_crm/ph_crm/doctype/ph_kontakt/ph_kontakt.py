"""PH Kontakt – Stammdatensatz (Person/Firma).

Regeln: E-Mail eindeutig (wenn gesetzt), Geburtstag nur mit Einwilligung, Widerspruch (Art. 21 DSGVO)
mit Datum. Buttons (ph_kontakt.js): Portal-Zugang erzeugen/sperren, DSGVO-Auskunft (Report + Druck),
Termin/Aufgabe anlegen, Ähnliche Kontakte/Zusammenführen, Wiedervorlage, E-Mail senden, Zeitleiste,
Datenauskunft-Export, Löschplan/Anonymisieren (Leitung). Kundenportal-Token: nur SHA-256 im Datensatz; der Klartext wird genau einmal
dem Mitarbeiter angezeigt bzw. von der Website per Mail verschickt (lib/portal/mailer.js).
"""

import hashlib
import re
import secrets

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import getdate, now_datetime, nowdate

from ph_crm.utils import dubletten as dub
from ph_crm.utils.workflow import status_setzen, vor_speichern_abgleichen

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

# Vorgänge für Datenauskunft und Verknüpfungs-Dashboard: (DocType, Feld, Anzeigefelder). Fremde Apps
# werden zur Laufzeit auf Existenz geprüft (CONVENTIONS 10).
VORGAENGE = (
    ("PH Anfrage", "kontakt", ["name", "art", "status", "eingang"]),
    ("PH Termin", "kontakt", ["name", "terminart", "status", "start"]),
    ("PH Beratungsgespraech", "kontakt", ["name", "status", "datum"]),
    ("PH Projekt", "kontakt", ["name", "status"]),
    ("PH Bestellung", "kontakt", ["name", "status"]),
    ("PH Angebot", "kontakt", ["name", "status"]),
    ("PH Auftragsbestaetigung", "kontakt", ["name", "status"]),
    ("PH Rechnung", "kontakt", ["name", "status"]),
    ("PH Lieferschein", "kontakt", ["name", "status"]),
    ("PH Servicefall", "kontakt", ["name", "status"]),
    ("PH Newsletter Abo", "kontakt", ["name", "status"]),
    ("PH Einwilligung", "kontakt", ["name", "status"]),
    ("PH Bewerbung", "kontakt", ["name", "status"]),
)


def token_hash(token):
    return hashlib.sha256(str(token or "").encode()).hexdigest()


class PHKontakt(Document):
    def before_insert(self):
        if not self.status:
            self.status = "Interessent"

    def validate(self):
        self.email = (self.email or "").strip().lower() or None
        if self.email and not EMAIL_RE.match(self.email):
            frappe.throw(_("E-Mail-Adresse ist ungültig."))
        if self.email:
            doppelt = frappe.db.get_value("PH Kontakt", {"email": self.email, "name": ("!=", self.name or "")}, "name")
            if doppelt:
                frappe.throw(_("E-Mail {0} ist bereits bei Kontakt {1} hinterlegt.").format(self.email, doppelt))
        self.vorname = (self.vorname or "").strip()
        self.nachname = (self.nachname or "").strip()
        self.firma = (self.firma or "").strip()
        if self.kontaktart == "Privat":
            self.uid = None
        if not self.geburtstag_einwilligung:
            self.geburtstag = None
        if self.nicht_kontaktieren and not self.widerspruchshinweis_am:
            self.widerspruchshinweis_am = nowdate()
        if self.status == "Kunde" and not self.kunde_seit:
            self.kunde_seit = nowdate()
        if self.get("firma_kontakt") and self.firma_kontakt == self.name:
            frappe.throw(_("Ein Kontakt kann nicht zu sich selbst gehören."))
        if self.get("firma_kontakt") and not self.firma:
            self.firma = frappe.db.get_value("PH Kontakt", self.firma_kontakt, "firma") or self.firma
        self.telefon_norm = ", ".join(sorted(dub.telefone(self.as_dict()))) or None
        if self.get("anonymisiert_am") and not self.flags.ph_dsgvo and not self.is_new():
            frappe.throw(_("Anonymisierte Kontakte können nicht mehr bearbeitet werden."))
        self.titel = self.bilde_titel()
        vor_speichern_abgleichen(self)

    def bilde_titel(self):
        person = " ".join(x for x in (self.titel_akad, self.vorname, self.nachname) if x)
        if self.firma and self.kontaktart != "Privat":
            return f"{self.firma} – {person}"[:140] if person else self.firma[:140]
        if self.firma:
            return f"{person} ({self.firma})"[:140]
        return person[:140] or _("ohne Namen")

    def onload(self):
        """Hinweis „mögliche Dublette“ im Formular (Assistent nur für Leitung)."""
        try:
            if not self.is_new() and not self.get("anonymisiert_am"):
                self.set_onload("aehnliche", [k for k in self.aehnliche_kontakte(limit=3) if k["einstufung"] == "wahrscheinlich"])
        except Exception:  # noqa: BLE001
            frappe.log_error(title=f"PH Kontakt {self.name}: Dublettenhinweis fehlgeschlagen")

    def after_rename(self, alt, neu, merge=False):
        """Nach Zusammenführen (Desk „Mit bestehendem zusammenführen“ oder zusammenfuehren()): Hooks der Apps."""
        if not merge:
            return
        from ph_crm.ph_crm.kontakt360 import hooks_aufrufen

        hooks_aufrufen("ph_kontakt_zusammengefuehrt", alt, neu)

    def on_update(self):
        if self.has_value_changed("nicht_kontaktieren") and self.nicht_kontaktieren:
            try:
                self.add_comment("Info", _("Widerspruch gegen Kontaktaufnahme erfasst ({0}).").format(self.widerspruchshinweis_quelle or "–"))
            except Exception:  # noqa: BLE001
                frappe.log_error(title="PH Kontakt: Kommentar fehlgeschlagen")

    # ── Buttons (ph_kontakt.js) ─────────────────────────────────────────────

    @frappe.whitelist()
    def portal_zugang_erzeugen(self):
        """Neuen Portal-Token erzeugen; Rückgabe des Klartexts genau einmal (für Mail/Übergabe)."""
        self.check_permission("write")
        if self.status == "Gesperrt":
            frappe.throw(_("Gesperrte Kontakte erhalten keinen Portal-Zugang."))
        token = secrets.token_urlsafe(32)
        self.db_set({"portal_token_hash": token_hash(token), "portal_aktiv": 1, "portal_token_erzeugt_am": now_datetime()})
        self.add_comment("Info", _("Portal-Zugang erzeugt (Token-Hash erneuert)."))
        return {"token": token, "hinweis": _("Token wird nicht gespeichert – jetzt übergeben oder per Website-Mail senden.")}

    @frappe.whitelist()
    def portal_sperren(self):
        self.check_permission("write")
        self.db_set({"portal_token_hash": None, "portal_aktiv": 0})
        self.add_comment("Info", _("Portal-Zugang gesperrt."))
        return True

    @frappe.whitelist()
    def als_kunde_markieren(self, grund=None):
        """Wird von ph_faktura bei der ersten AB gerufen (oder händisch durch Leitung)."""
        self.check_permission("write")
        if self.status not in ("Interessent", "Inaktiv"):
            return self.status
        erstmals = self.status == "Interessent"
        status_setzen(self, "Kunde", _("Kunde seit {0} ({1})").format(nowdate(), grund or _("manuell")), kunde_seit=self.kunde_seit or nowdate())
        if erstmals:
            anfragen_gewonnen(self.name, grund)
        return "Kunde"

    @frappe.whitelist()
    def widerspruch_erfassen(self, quelle=None):
        self.check_permission("write")
        self.db_set({"nicht_kontaktieren": 1, "widerspruchshinweis_am": nowdate(), "widerspruchshinweis_quelle": quelle or ""})
        self.add_comment("Info", _("Widerspruch gegen Kontaktaufnahme erfasst ({0}).").format(quelle or "–"))
        return True

    # ── Dubletten / Zusammenführen ──────────────────────────────────────────

    @frappe.whitelist()
    def aehnliche_kontakte(self, limit=10):
        """Kandidaten mit Punkten und Gründen (E-Mail, Telefon normalisiert, Name + PLZ, Firma)."""
        self.check_permission("read")
        from ph_crm.ph_crm.dubletten import kandidaten

        return kandidaten(self.as_dict(), ausser=self.name, limit=limit)

    @frappe.whitelist()
    def zusammenfuehren(self, quelle, felder=None):
        """`quelle` in diesen Kontakt zusammenführen (Leitung). felder: aus der Quelle zu übernehmende Felder."""
        self.check_permission("write")
        from ph_crm.ph_crm.dubletten import zusammenfuehren

        return zusammenfuehren(self.name, quelle, felder)

    @frappe.whitelist()
    def keine_dublette(self, anderer):
        """Vorschlag verwerfen: beide Kontakte sind verschiedene Personen."""
        self.check_permission("write")
        from ph_crm.ph_crm.dubletten import keine_dublette

        return keine_dublette(self.name, anderer)

    # ── Wiedervorlage, Kommunikation, Zeitleiste ────────────────────────────

    @frappe.whitelist()
    def wiedervorlage_setzen(self, datum=None, notiz=None):
        """Wiedervorlage am Kontakt (Erinnerung R1 an den Berater; leer = entfernen)."""
        self.check_permission("write")
        self.db_set({"wiedervorlage": getdate(datum) if datum else None, "wiedervorlage_notiz": (notiz or "")[:140] or None})
        return self.wiedervorlage

    @frappe.whitelist()
    def mail_senden(self, betreff, nachricht, an=None, vertragsbezogen=0, email_template=None):
        """E-Mail an den Kontakt (Communication → Zeitleiste). Bei Widerspruch nur vertragsbezogen."""
        self.check_permission("email")
        if self.nicht_kontaktieren and not int(vertragsbezogen or 0):
            frappe.throw(_("Widerspruch gegen Kontaktaufnahme – nur vertragsbezogene Nachrichten (Haken setzen)."))
        an = an or self.email
        if not an:
            frappe.throw(_("Keine E-Mail-Adresse hinterlegt."))
        from frappe.core.doctype.communication.email import make

        from ph_crm.ph_crm.kontakt360 import letzter_kontakt_setzen

        r = make(doctype=self.doctype, name=self.name, subject=betreff, content=nachricht, recipients=an, send_email=True, email_template=email_template)
        letzter_kontakt_setzen(self.name, now_datetime(), "E-Mail")
        return r.get("name") if isinstance(r, dict) else r

    @frappe.whitelist()
    def zeitleiste(self, vor=None, limit=30):
        self.check_permission("read")
        from ph_crm.ph_crm.kontakt360 import zeitleiste

        return zeitleiste(self.name, vor=vor, limit=limit)

    # ── DSGVO ───────────────────────────────────────────────────────────────

    @frappe.whitelist()
    def datenauskunft_export(self):
        """Vollständige Auskunft aller Apps als private JSON-Datei am Kontakt (Art. 15/20)."""
        frappe.only_for(("System Manager", "PH CRM Leitung", "PH Backoffice-Admin", "PH Geschäftsführung"))
        from ph_crm.ph_crm.dsgvo import export

        return export(self.name)

    @frappe.whitelist()
    def loeschplan(self):
        """Vorschau: was gelöscht, anonymisiert, bis wann aufbewahrt wird (§ 132 BAO)."""
        frappe.only_for(("System Manager", "PH CRM Leitung", "PH Backoffice-Admin", "PH Geschäftsführung"))
        from ph_crm.ph_crm.dsgvo import plan

        return plan(self.name)

    @frappe.whitelist()
    def anonymisieren(self, bestaetigung=None):
        """Löschung nach Art. 17 DSGVO mit BAO-Aufbewahrung (Leitung, Bestätigung „ANONYMISIEREN“)."""
        from ph_crm.ph_crm.dsgvo import ausfuehren

        return ausfuehren(self.name, bestaetigung)

    def datenauskunft(self):
        """Alle gespeicherten Daten und Vorgänge (Art. 15 DSGVO) – für Druckformat und Report."""
        stamm = {}
        for df in self.meta.fields:
            if df.fieldtype in ("Section Break", "Column Break", "Tab Break", "Table", "HTML") or df.fieldname in ("naming_series", "portal_token_hash", "idempotency_key", "ip_hash", "notizen"):
                continue
            wert = self.get(df.fieldname)
            if wert not in (None, "", 0):
                stamm[df.label] = wert
        vorgaenge = []
        for dt, feld, felder in VORGAENGE:
            if not frappe.db.exists("DocType", dt):
                continue
            meta = frappe.get_meta(dt)
            if not meta.has_field(feld):
                continue
            felder_ok = [f for f in felder if f == "name" or meta.has_field(f)]
            zeilen = frappe.get_all(dt, filters={feld: self.name}, fields=felder_ok, order_by="creation desc", limit=500)
            if zeilen:
                vorgaenge.append({"doctype": dt, "anzahl": len(zeilen), "zeilen": zeilen, "felder": felder_ok})
        kommunikation = frappe.get_all(
            "Communication",
            filters={"reference_doctype": self.doctype, "reference_name": self.name},
            fields=["communication_date", "subject", "sent_or_received", "communication_medium"],
            order_by="communication_date desc",
            limit=500,
        )
        return {"stamm": stamm, "adressen": [a.as_dict() for a in self.adressen], "vorgaenge": vorgaenge, "kommunikation": kommunikation, "erstellt": now_datetime()}

    @frappe.whitelist()
    def datenauskunft_json(self):
        self.check_permission("read")
        return self.datenauskunft()


def anfragen_gewonnen(kontakt, grund=None):
    """R7 (Konzept CRM §8.2): erste AB → offene Anfragen des Kontakts im Status „Angebot“ → Gewonnen."""
    try:
        from ph_crm.ph_crm.doctype.ph_termin_einstellungen.ph_termin_einstellungen import einstellungen

        if not einstellungen().get("auto_gewonnen", 1):
            return 0
        n = 0
        for name in frappe.get_all("PH Anfrage", filters={"kontakt": kontakt, "status": "Angebot"}, pluck="name"):
            a = frappe.get_doc("PH Anfrage", name)
            status_setzen(a, "Gewonnen", _("Gewonnen: Auftrag erteilt ({0})").format(grund or _("Kunde")), gewonnen_am=now_datetime(), wahrscheinlichkeit_prozent=100, gewichtet_cent=int(a.wert_cent or 0))
            n += 1
        return n
    except Exception:  # noqa: BLE001
        frappe.log_error(title=f"PH Kontakt {kontakt}: Anfragen gewonnen fehlgeschlagen")
        return 0


def finde_oder_lege_an(daten, quelle="website"):
    """Kontakt per E-Mail finden, sonst anlegen (API, Anfrage, Termin). Gibt den Namen zurück."""
    email = (daten.get("email") or "").strip().lower()
    if email:
        name = frappe.db.get_value("PH Kontakt", {"email": email}, "name")
        if name:
            return name
    doc = frappe.get_doc(
        {
            "doctype": "PH Kontakt",
            "anrede": daten.get("anrede"),
            "vorname": daten.get("vorname"),
            "nachname": daten.get("nachname") or _("(ohne Nachname)"),
            "firma": daten.get("firma"),
            "kontaktart": "Geschaeft" if daten.get("firma") else "Privat",
            "email": email or None,
            "telefon": daten.get("telefon"),
            "plz": daten.get("plz"),
            "ort": daten.get("ort"),
            "land": daten.get("land") if daten.get("land") and frappe.db.exists("Country", daten.get("land")) else None,
            "sprache": (daten.get("sprache") or "de")[:2],
            "quelle": quelle,
            "utm_source": daten.get("utm_source"),
            "utm_medium": daten.get("utm_medium"),
            "utm_campaign": daten.get("utm_campaign"),
        }
    )
    doc.flags.ignore_permissions = True
    doc.insert()
    return doc.name


def plz_ort_teilen(plz_ort):
    """'6911 Lochau' → ('6911', 'Lochau'); ohne Zahl → ('', text)."""
    s = str(plz_ort or "").strip()
    m = re.match(r"^([A-Z]{1,2}-)?(\d{4,5})\s+(.+)$", s)
    if m:
        return m.group(2), m.group(3).strip()
    return "", s


def kunden_seit(von, bis):
    return frappe.db.count("PH Kontakt", {"status": "Kunde", "kunde_seit": ("between", [getdate(von), getdate(bis)])})
