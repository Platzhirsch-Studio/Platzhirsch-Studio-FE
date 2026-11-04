"""PH Anfrage – Controller (Muster für alle PH-DocTypes).

Aufbau, der in jeder DocType wiederkehrt:
  validate()      Daten bereinigen, Titel bilden, fachliche Regeln prüfen (frappe.throw).
  before_insert() Werte setzen, die nur beim Anlegen gelten (Eingang, Status).
  on_update()     Nebenwirkungen nach dem Speichern (Kennzahlen, Benachrichtigungen), nie Fehler werfen.
  Whitelisted Dokument-Methoden (@frappe.whitelist()) für die Buttons im .js.
"""

import re

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import now_datetime, strip_html

from ph_crm.utils.workflow import status_setzen, vor_speichern_abgleichen

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
OFFEN = ("Neu", "Qualifiziert", "Termin vereinbart", "Angebot")


class PHAnfrage(Document):
    def before_insert(self):
        if not self.eingang:
            self.eingang = now_datetime()
        if not self.status:
            self.status = "Neu"

    def validate(self):
        self.email = (self.email or "").strip().lower() or None
        if self.email and not EMAIL_RE.match(self.email):
            frappe.throw(_("E-Mail-Adresse ist ungültig."))
        if not self.email and not self.telefon:
            frappe.throw(_("Mindestens E-Mail oder Telefon ist nötig."))
        self.vorname = (self.vorname or "").strip()
        self.nachname = (self.nachname or "").strip()
        self.titel = self.bilde_titel()
        if self.status in ("Verloren", "Spam") and not self.verloren_grund:
            self.verloren_grund = "Spam" if self.status == "Spam" else "Sonstiges"
        if self.has_value_changed("status") and self.get_doc_before_save() and self.get_doc_before_save().status == "Neu" and not self.erstreaktion_am:
            self.erstreaktion_am = now_datetime()
        if self.upload_anzahl and self.upload_status != "eingegangen":
            self.upload_status = "eingegangen"
        vor_speichern_abgleichen(self)

    def bilde_titel(self):
        name = " ".join(x for x in (self.vorname, self.nachname) if x) or self.firma or self.email or "ohne Namen"
        return f"{self.art}: {name}"[:140]

    def on_update(self):
        # Kennzahlen-Cache der Number Cards ist zeitgesteuert; hier nur Zuweisung spiegeln.
        if self.zugewiesen_an and self.has_value_changed("zugewiesen_an"):
            try:
                from frappe.desk.form.assign_to import add, clear

                clear(self.doctype, self.name)
                add({"assign_to": [self.zugewiesen_an], "doctype": self.doctype, "name": self.name, "description": self.titel})
            except Exception:  # noqa: BLE001 – Zuweisung darf das Speichern nie verhindern
                frappe.log_error(title="PH Anfrage: Zuweisung fehlgeschlagen")

    # ── Buttons (ph_anfrage.js) ─────────────────────────────────────────────

    @frappe.whitelist()
    def kontakt_anlegen(self):
        """Button „Kontakt anlegen“: PH Kontakt aus den Personendaten (oder vorhandenen per E-Mail verknüpfen)."""
        self.check_permission("write")
        if self.kontakt:
            return self.kontakt
        from ph_crm.ph_crm.doctype.ph_kontakt.ph_kontakt import finde_oder_lege_an, plz_ort_teilen

        plz, ort = plz_ort_teilen(self.plz_ort)
        name = finde_oder_lege_an(
            {"anrede": self.anrede, "vorname": self.vorname, "nachname": self.nachname, "firma": self.firma, "email": self.email, "telefon": self.telefon, "plz": plz, "ort": ort, "land": self.land, "sprache": self.sprache},
            quelle=self.quelle if self.quelle in ("website", "agent", "telefon", "showroom", "email", "empfehlung", "messe", "sonstige") else "website",
        )
        self.db_set("kontakt", name)
        self.add_comment("Info", _("Kontakt {0} verknüpft").format(name))
        return name

    @frappe.whitelist()
    def termin_vorschlagen(self, start, dauer_min=60, modus="Showroom", terminart=None):
        """Button „Termin anlegen“: PH Termin aus der Anfrage (Backoffice-Termin, sofort bestätigt),
        Anfrage → „Termin vereinbart“."""
        self.check_permission("write")
        terminart = terminart or passende_terminart(modus)
        if not terminart:
            frappe.throw(_("Keine aktive Terminart für Modus {0} – bitte in PH Terminart anlegen.").format(modus))
        termin = frappe.get_doc(
            {
                "doctype": "PH Termin",
                "terminart": terminart,
                "anfrage": self.name,
                "kontakt": self.kontakt,
                "anrede": self.anrede,
                "vorname": self.vorname,
                "nachname": self.nachname,
                "email": self.email,
                "telefon": self.telefon,
                "plz_ort": self.plz_ort,
                "sprache": self.sprache,
                "start": start,
                "dauer_min": int(dauer_min),
                "modus": modus,
                "quelle": "backoffice",
                "kundenmail": "backoffice",
                "status": "Bestaetigt",
                "email_verifiziert": 1,
                "berater": self.zugewiesen_an,
            }
        ).insert()
        self.db_set({"folgedokument_doctype": "PH Termin", "folgedokument": termin.name})
        if self.status in ("Neu", "Qualifiziert"):
            status_setzen(self, "Termin vereinbart", _("Termin {0} angelegt").format(termin.referenz), erstreaktion_am=self.erstreaktion_am or now_datetime())
        return termin.name

    @frappe.whitelist()
    def als_spam(self):
        self.check_permission("write")
        status_setzen(self, "Spam", _("Als Spam markiert"), verloren_grund="Spam")
        return "Spam"

    @frappe.whitelist()
    def aufgabe_anlegen(self, titel=None, faellig=None):
        self.check_permission("write")
        from frappe.utils import add_days, nowdate

        doc = frappe.get_doc(
            {
                "doctype": "PH Aufgabe",
                "titel": (titel or _("Anfrage {0} nachfassen").format(self.name))[:140],
                "faellig": faellig or add_days(nowdate(), 2),
                "zugewiesen_an": self.zugewiesen_an or frappe.session.user,
                "referenz_doctype": self.doctype,
                "referenz_name": self.name,
                "kontakt": self.kontakt,
            }
        ).insert()
        return doc.name


def passende_terminart(modus):
    """Aktive Terminart mit festem Modus (z. B. Showroom → studio), sonst eine mit erlaubtem Modus."""
    name = frappe.db.get_value("PH Terminart", {"aktiv": 1, "modus": modus}, "name", order_by="sortierung asc")
    if name:
        return name
    for art in frappe.get_all("PH Terminart", filters={"aktiv": 1, "modus": ""}, fields=["name", "modi_erlaubt"], order_by="sortierung asc"):
        if modus in [m.strip() for m in (art.modi_erlaubt or "").split(",")]:
            return art.name
    return None


# ── Kennzahlen für Report/Workspace ─────────────────────────────────────────

def offene_anzahl():
    return frappe.db.count("PH Anfrage", {"status": ("in", OFFEN)})


def kurztext(doc, laenge=160):
    return strip_html(doc.anliegen or "")[:laenge]
