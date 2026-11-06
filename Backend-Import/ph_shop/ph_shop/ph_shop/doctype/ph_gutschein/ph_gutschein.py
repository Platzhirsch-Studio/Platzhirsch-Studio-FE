"""PH Gutschein – Wertgutschein (Mehrzweck), Code nur als Hash (wie src/lib/payments/codes.js, register).

ausstellen(...)        legt einen Gutschein an und gibt (doc, code_klartext) zurück – der Klartext erscheint
                       genau einmal (Dialog/PDF/Mail) und wird nirgends gespeichert.
finde_nach_code(code)  Eingabe normalisieren → Hash → Dokument (oder None).
doc.einloesen(...)     Teilbetrag abbuchen (Kindtabelle Einlösungen), optional PH Zahlung (Kanal Gutschein).
Status automatisch: Aktiv → Teilweise eingeloest → Eingeloest; Gesperrt/Erstattet nur Leitung (Workflow + Buttons).
"""

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import add_years, cint, getdate, now_datetime, nowdate

from ph_shop import gutschein_code as gc
from ph_shop.ph_shop import mails, status as st

EINLOESBAR = ("Aktiv", "Teilweise eingeloest")


class PHGutschein(Document):
    def before_insert(self):
        einst = frappe.get_cached_doc("PH Shop Einstellungen")
        if not self.code_hash:
            # Anlage im Desk ohne ausstellen(): Code hier erzeugen und einmalig anzeigen.
            code = gc.neuer_code(test=bool(self.test))
            self.code_hash = gc.code_hash(gc.normalisiere(code))
            self.code_letzte4 = gc.letzte4(code)
            self.code_klartext = code
            frappe.msgprint(_("Gutscheincode (nur jetzt sichtbar): <b>{0}</b>").format(code), title=_("Gutschein ausgestellt"), indicator="green")
        if self.rest_cent is None or self.rest_cent == "":
            self.rest_cent = self.wert_cent
        self.ausgegeben_am = self.ausgegeben_am or now_datetime()
        self.bedingungen_stand = self.bedingungen_stand or einst.gutschein_bedingungen_stand
        self.art = self.art or einst.gutschein_art_standard or "Mehrzweck"
        jahre = cint(einst.gutschein_gueltig_jahre)
        if jahre and not self.gueltig_bis:
            self.gueltig_bis = add_years(getdate(self.ausgegeben_am), jahre)
        if self.status in (None, "", "Erstellt") and self.flags.aktiv is not False:
            self.status = "Aktiv"
        self.workflow_state = None

    def validate(self):
        if cint(self.wert_cent) <= 0:
            frappe.throw(_("Wert muss größer als 0 Cent sein."))
        if self.is_new() and (self.rest_cent is None or self.rest_cent == ""):
            self.rest_cent = self.wert_cent
        if cint(self.rest_cent) > cint(self.wert_cent):
            frappe.throw(_("Restwert kann den Wert nicht übersteigen."))
        self.wert_eur = cint(self.wert_cent) / 100
        self.rest_eur = cint(self.rest_cent) / 100
        self.kaeufer_email = (self.kaeufer_email or "").strip().lower() or None
        if self.art not in gc.ARTEN:
            frappe.throw(_("Unbekannte Gutscheinart {0}.").format(self.art))
        if self.art == "Einzweck":
            try:
                gc.steuer(self.art, self.ust_satz_promille)
            except gc.GutscheinSteuerFehler:
                frappe.throw(_("Einzweckgutschein: USt-Satz ist Pflicht (z. B. 2000 = 20 %, 1000 = 10 %)."))
        else:
            self.ust_satz_promille = None
        self.titel = f"…{self.code_letzte4 or '????'} · {cint(self.wert_cent) / 100:.0f} € · Rest {cint(self.rest_cent) / 100:.2f} €"[:140]

    def after_insert(self):
        ws = st.workflow_state_fuer(self.doctype, self.status)
        if ws and self.meta.has_field("workflow_state"):
            self.db_set("workflow_state", ws, update_modified=False)

    # ── Fachlogik ───────────────────────────────────────────────────────────
    def pruefe_einloesbar(self, betrag_cent):
        if self.status not in EINLOESBAR:
            frappe.throw(_("Gutschein ist {0} und nicht einlösbar.").format(self.status))
        if self.test and frappe.get_cached_value("PH Shop Einstellungen", None, "shop_modus") == "live":
            frappe.throw(_("Testgutschein ist nicht einlösbar."))
        if self.gueltig_bis and getdate(self.gueltig_bis) < getdate(nowdate()):
            frappe.throw(_("Gutschein ist seit {0} abgelaufen.").format(frappe.format(self.gueltig_bis, "Date")))
        if cint(betrag_cent) <= 0:
            frappe.throw(_("Betrag muss größer als 0 Cent sein."))
        if cint(betrag_cent) > cint(self.rest_cent):
            frappe.throw(_("Betrag ({0} Cent) übersteigt den Restwert ({1} Cent).").format(cint(betrag_cent), self.rest_cent))

    @frappe.whitelist()
    def einloesen(self, betrag_cent, kanal="Showroom", beleg_doctype=None, beleg=None, hinweis=None, zahlung_buchen=False, kontakt=None):
        """Teilbetrag einlösen. Rückgabe {"rest_cent", "status", "zahlung"}."""
        if not self.flags.ignore_permissions:
            self.check_permission("write")
        betrag_cent = cint(betrag_cent)
        self.pruefe_einloesbar(betrag_cent)
        if self.art == "Rabatt" and cint(zahlung_buchen):
            frappe.throw(_("Rabattgutschein ist kein Zahlungsmittel – als Preisnachlass (Entgeltminderung) erfassen, nicht als Zahlung."))
        rest = cint(self.rest_cent) - betrag_cent
        zahlung_name = None
        if cint(zahlung_buchen):
            from ph_shop import zahlung as z

            zahlung_name = z.buche(kanal="Gutschein", betrag_cent=betrag_cent, bezug_doctype=beleg_doctype, bezug=beleg, gutschein=self.name, kontakt=kontakt or self.kaeufer_kontakt, livemode=not self.test, quelle="kassa" if kanal == "Kassa" else "backoffice", notiz=hinweis).name
        zeile = self.append("einloesungen", {"datum": now_datetime(), "betrag_cent": betrag_cent, "rest_danach_cent": rest, "kanal": kanal, "beleg_doctype": beleg_doctype if beleg_doctype and frappe.db.exists("DocType", beleg_doctype) else None, "beleg": beleg if beleg_doctype and frappe.db.exists("DocType", beleg_doctype) else None, "mitarbeiter": frappe.session.user, "zahlung": zahlung_name, "hinweis": (hinweis or "")[:140]})
        zeile.db_insert()
        neu = "Eingeloest" if rest <= 0 else "Teilweise eingeloest"
        st.setzen(self, neu, _("{0} Cent über {1}").format(betrag_cent, kanal), None, {"rest_cent": rest, "rest_eur": rest / 100, "titel": self.titel})
        self.add_comment("Info", _("Einlösung {0} Cent ({1}), Rest {2} Cent").format(betrag_cent, kanal, rest))
        return {"rest_cent": rest, "status": neu, "zahlung": zahlung_name}

    @frappe.whitelist()
    def sperren(self, grund="gesperrt", sperrgrund_art=None):
        """Sperren (jede Shop-Rolle darf – Sicherheitsmaßnahme). sperrgrund_art aus gutschein_code.SPERRGRUENDE."""
        if not self.flags.ignore_permissions:
            self.check_permission("write")
        if self.status in ("Gesperrt", "Erstattet"):
            return self.status
        art = sperrgrund_art if gc.sperrgrund_gueltig(sperrgrund_art) else ("Ersetzt" if str(grund or "").startswith(("ersetzt", "Ersetzt")) else "Sonstiges")
        st.setzen(self, "Gesperrt", f"{art}: {grund}" if grund else art, None, {"gesperrt_am": now_datetime(), "sperrgrund": (grund or art)[:140], "sperrgrund_art": art})
        return "Gesperrt"

    @frappe.whitelist()
    def entsperren(self, grund=None):
        """Nur Leitung, mit Begründung (Kommentar). Ersetzte Gutscheine bleiben gesperrt."""
        self.check_permission("write")
        if not _leitung():
            frappe.throw(_("Entsperren darf nur die Shop-Leitung."), frappe.PermissionError)
        if self.status != "Gesperrt":
            frappe.throw(_("Nur gesperrte Gutscheine können entsperrt werden."))
        if self.ersetzt_durch or self.sperrgrund_art in ("Ersetzt", "Verkauf storniert"):
            frappe.throw(_("Ersetzte oder stornierte Gutscheine können nicht entsperrt werden."))
        neu = "Eingeloest" if cint(self.rest_cent) <= 0 else ("Teilweise eingeloest" if cint(self.rest_cent) < cint(self.wert_cent) else "Aktiv")
        st.setzen(self, neu, _("entsperrt: {0}").format(grund or "–"), None, {"gesperrt_am": None, "sperrgrund": None, "sperrgrund_art": None})
        self.add_comment("Info", _("Entsperrt durch {0}: {1}").format(frappe.session.user, grund or "–"))
        return neu

    def gutschreiben(self, betrag_cent, grund=None, beleg_doctype=None, beleg=None):
        """Teilbetrag zurück auf den Gutschein (Teilerstattung/Storno einer Bestellung, Kassa-Retoure).
        Gegenzeile (negativer Betrag) in Einlösungen; Restwert höchstens Wert. Serverfunktion (Aufrufer prüft Rechte)."""
        betrag_cent = cint(betrag_cent)
        if betrag_cent <= 0:
            frappe.throw(_("Betrag muss größer als 0 Cent sein."))
        if self.status in ("Gesperrt", "Erstattet"):
            frappe.throw(_("Gutschein ist {0} – keine Gutschrift möglich.").format(self.status))
        rest = cint(self.rest_cent) + betrag_cent
        if rest > cint(self.wert_cent):
            frappe.throw(_("Gutschrift ({0} Cent) übersteigt den eingelösten Betrag.").format(betrag_cent))
        ok_dt = beleg_doctype if beleg_doctype and frappe.db.exists("DocType", beleg_doctype) else None
        zeile = self.append("einloesungen", {"datum": now_datetime(), "betrag_cent": -betrag_cent, "rest_danach_cent": rest, "kanal": "Online" if beleg_doctype == "PH Bestellung" else "Kassa", "beleg_doctype": ok_dt, "beleg": beleg if ok_dt else None, "mitarbeiter": frappe.session.user, "hinweis": f"GUTSCHRIFT {grund or ''}"[:140]})
        zeile.db_insert()
        neu = "Aktiv" if rest >= cint(self.wert_cent) else "Teilweise eingeloest"
        st.setzen(self, neu, _("Gutschrift {0} Cent ({1})").format(betrag_cent, beleg or grund or "–"), None, {"rest_cent": rest, "rest_eur": rest / 100})
        return {"gutschein": self.name, "rest_cent": rest, "status": neu}

    def erstattet_markieren(self, grund="erstattet"):
        """Nach Stripe-Erstattung: ungenutzt → Erstattet (Rest 0); teilweise eingelöst → nur Hinweis (Team entscheidet)."""
        if cint(self.rest_cent) < cint(self.wert_cent):
            self.db_set({"hinweis": _("erstattet trotz Einlösung, prüfen")})
            return False
        st.setzen(self, "Erstattet", grund, "Stripe", {"rest_cent": 0, "rest_eur": 0, "gesperrt_am": now_datetime(), "sperrgrund": grund})
        return True

    @frappe.whitelist()
    def ersetzen(self):
        """Ersatzgutschein über den Restwert (verlorener Code, Website-Register „ersetzen“). Alter Code wird gesperrt."""
        self.check_permission("write")
        if self.status not in EINLOESBAR:
            frappe.throw(_("Nur aktive Gutscheine können ersetzt werden."))
        neu, code = ausstellen(cint(self.rest_cent), test=bool(self.test), kanal="Ersatz", motiv=self.motiv, empfaenger=self.empfaenger, grusstext=self.grusstext, kaeufer={"name": self.kaeufer_name, "email": self.kaeufer_email, "firma": self.kaeufer_firma, "kontakt": self.kaeufer_kontakt}, gutschein_bestellung=self.gutschein_bestellung, zahlung=self.zahlung, livemode=bool(self.livemode), quelle="backoffice", art=self.art, ust_satz_promille=self.ust_satz_promille)
        self.sperren(_("ersetzt durch {0}").format(neu.name), sperrgrund_art="Ersetzt")
        self.db_set({"ersetzt_durch": neu.name, "rest_cent": 0, "rest_eur": 0})
        return {"gutschein": neu.name, "code": code}

    # ── PDF und Versand ──────────────────────────────────────────────────────
    def pdf_erzeugen(self, code_klartext=None):
        """PDF über Print Format „PH Gutschein“ (Wortmarke, Motiv, Code, Bedingungen-Stand) als private Datei."""
        from frappe.utils.file_manager import save_file

        self.code_klartext = code_klartext or getattr(self, "code_klartext", None) or f"…{self.code_letzte4}"
        try:
            pdf = frappe.get_print(self.doctype, self.name, "PH Gutschein", doc=self, as_pdf=True, no_letterhead=1)
        except Exception:  # noqa: BLE001 – ohne wkhtmltopdf (Tests) kein PDF, aber kein Abbruch
            frappe.log_error(title=f"PH Gutschein {self.name}: PDF konnte nicht erzeugt werden")
            return None
        f = save_file(f"Gutschein-{self.name}.pdf", pdf, self.doctype, self.name, is_private=1)
        self.db_set("pdf", f.file_url, update_modified=False)
        return f.file_url

    @frappe.whitelist()
    def pdf_senden(self, empfaenger=None, code_klartext=None):
        """Gutschein-PDF per Mail (Vorlage „PH Gutschein Versand“). Ohne Klartext nur die gespeicherte PDF."""
        if not self.flags.ignore_permissions:
            self.check_permission("email")
        an = empfaenger or self.kaeufer_email
        if not an:
            frappe.throw(_("Keine Empfängeradresse."))
        anhaenge = []
        if not self.pdf and code_klartext:
            self.pdf_erzeugen(code_klartext)
        if self.pdf:
            fdoc = frappe.get_doc("File", {"file_url": self.pdf})
            anhaenge.append({"fname": f"Gutschein-{self.name}.pdf", "fcontent": fdoc.get_content()})
        ok = mails.senden("gutschein", an, {"doc": self, "gutscheine": [self], "codes": [code_klartext] if code_klartext else [], "bestellung": None}, anhaenge=anhaenge, referenz_doctype=self.doctype, referenz_name=self.name)
        if ok:
            self.db_set("mail_gesendet_am", now_datetime(), update_modified=False)
        return ok

    def steuer(self):
        """Steuer beim Verkauf (Kassa): Mehrzweck → Satz Null (kein Umsatz), Einzweck → gespeicherter Satz,
        Rabatt → mindert Entgelt (kein Satz, nicht verkäuflich)."""
        try:
            return gc.steuer(self.art, self.ust_satz_promille)
        except gc.GutscheinSteuerFehler:
            frappe.throw(_("Gutschein {0}: Einzweck ohne USt-Satz – bitte Satz nachtragen.").format(self.name))

    def oeffentliche_sicht(self):
        """get_voucher: nur Status/Restwert (kein Käufer, kein Code)."""
        return {"status": self.status, "einloesbar": self.status in EINLOESBAR and not (self.gueltig_bis and getdate(self.gueltig_bis) < getdate(nowdate())), "wert_cent": self.wert_cent, "rest_cent": self.rest_cent, "waehrung": self.waehrung, "gueltig_bis": str(self.gueltig_bis) if self.gueltig_bis else None, "test": bool(self.test), "ende": self.code_letzte4}


# ─────────────────────────── Modulfunktionen ───────────────────────────

def finde_nach_code(code):
    norm = gc.normalisiere(code)
    if not norm:
        return None
    name = frappe.db.get_value("PH Gutschein", {"code_hash": gc.code_hash(norm)}, "name")
    return frappe.get_doc("PH Gutschein", name) if name else None


def ausstellen(wert_cent, *, test=False, kanal="Showroom", motiv="schlicht", empfaenger=None, grusstext=None, kaeufer=None, gutschein_bestellung=None, zahlung=None, livemode=None, quelle="backoffice", art=None, aktiv=True, idempotency_key=None, ausgabe_beleg_doctype=None, ausgabe_beleg=None, ust_satz_promille=None):
    """Neuen Gutschein anlegen → (doc, code_klartext). Bis zu 5 Versuche für einen freien Hash.
    Idempotent über idempotency_key: gleicher Schlüssel → derselbe Gutschein, Klartext None (nur beim ersten Mal)."""
    if idempotency_key:
        vorhanden = frappe.db.get_value("PH Gutschein", {"idempotency_key": idempotency_key}, "name")
        if vorhanden:
            doc = frappe.get_doc("PH Gutschein", vorhanden)
            doc.flags.bereits_ausgestellt = True
            return doc, None
    kaeufer = kaeufer or {}
    for _versuch in range(5):
        code = gc.neuer_code(test=bool(test))
        h = gc.code_hash(gc.normalisiere(code))
        if frappe.db.exists("PH Gutschein", {"code_hash": h}):
            continue
        doc = frappe.get_doc(
            {
                "doctype": "PH Gutschein",
                "wert_cent": cint(wert_cent),
                "rest_cent": cint(wert_cent),
                "test": 1 if test else 0,
                "kanal_ausgabe": kanal,
                "motiv": motiv or "schlicht",
                "empfaenger": empfaenger,
                "grusstext": grusstext,
                "kaeufer_name": kaeufer.get("name"),
                "kaeufer_email": kaeufer.get("email"),
                "kaeufer_firma": kaeufer.get("firma"),
                "kaeufer_kontakt": kaeufer.get("kontakt") if frappe.db.exists("DocType", "PH Kontakt") else None,
                "gutschein_bestellung": gutschein_bestellung,
                "zahlung": zahlung,
                "livemode": 1 if (livemode if livemode is not None else not test) else 0,
                "code_hash": h,
                "code_letzte4": gc.letzte4(code),
                "status": "Aktiv" if aktiv else "Erstellt",
                "art": art,
                "quelle": quelle,
                "idempotency_key": idempotency_key,
                "ausgabe_beleg_doctype": ausgabe_beleg_doctype if ausgabe_beleg_doctype and frappe.db.exists("DocType", ausgabe_beleg_doctype) else None,
                "ausgabe_beleg": ausgabe_beleg if ausgabe_beleg_doctype and frappe.db.exists("DocType", ausgabe_beleg_doctype) else None,
                "ust_satz_promille": cint(ust_satz_promille) or None,
            }
        )
        doc.flags.aktiv = aktiv
        doc.code_klartext = code
        doc.insert(ignore_permissions=True)
        return doc, code
    frappe.throw(_("Kein eindeutiger Gutscheincode (5 Versuche)."))


def _leitung(user=None):
    rollen = set(frappe.get_roles(user or frappe.session.user))
    return bool(rollen & {"PH Shop Leitung", "PH Geschäftsführung", "System Manager"}) or frappe.session.user == "Administrator"


def restwert_gesamt_cent(test=False):
    """Verbindlichkeit aus offenen Gutscheinen (Report PH Gutschein Bestand, Number Card)."""
    rows = frappe.get_all("PH Gutschein", {"status": ("in", EINLOESBAR), "test": 1 if test else 0}, ["sum(rest_cent) as rest"])
    return cint(rows[0].rest) if rows else 0
