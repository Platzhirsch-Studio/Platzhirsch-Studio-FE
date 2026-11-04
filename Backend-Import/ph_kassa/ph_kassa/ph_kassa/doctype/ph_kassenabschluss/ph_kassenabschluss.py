"""PH Kassenabschluss – Tagesabschluss (WP10b).

Ablauf: oeffnen_oder_holen(kasse, datum) → Soll aus PH Kassenbeleg (WP10a, docstatus 1) und PH Kassenbuch
→ zaehlen(zaehlprotokoll) → abschliessen(grund, unterschrift) [Leitung]: Differenzbuchung ins Kassenbuch,
optional Nullbeleg (WP10a), PH Kasse.aktiver_abschluss leeren, Sperre → oeffnen() [Leitung]: Status Korrigiert.
Die Sperre prüft `sperre_pruefen(doc)` als doc_events-Hook auf PH Kassenbeleg.before_submit (hooks.py, WP10b-Block)
und zusätzlich die Kassa-Page vor dem Buchen.
"""

import json

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import getdate, now_datetime, nowdate

from ph_kassa.logik import abschluss as logik
from ph_kassa.logik.betraege import STUECKELUNG_CENT, KassenFehler, format_betrag

STUECK_LABEL = {50000: "500 €", 20000: "200 €", 10000: "100 €", 5000: "50 €", 2000: "20 €", 1000: "10 €", 500: "5 €", 200: "2 €", 100: "1 €", 50: "50 ct", 20: "20 ct", 10: "10 ct", 5: "5 ct", 2: "2 ct", 1: "1 ct"}
LEITUNG = ("PH Kassa Leitung", "System Manager")


class PHKassenabschluss(Document):
    def before_insert(self):
        self.eroeffnet_am = self.eroeffnet_am or now_datetime()
        self.status = self.status or "Offen"
        if not self.zaehlprotokoll:
            for s in STUECKELUNG_CENT:
                self.append("zaehlprotokoll", {"stueckelung_cent": s, "bezeichnung": STUECK_LABEL[s], "anzahl": 0, "summe_cent": 0})
        if self.bargeld_anfang_cent is None:
            from ph_kassa.ph_kassa.doctype.ph_kassenbuch.ph_kassenbuch import letzter_bestand

            self.bargeld_anfang_cent = letzter_bestand(self.kasse)

    def validate(self):
        self.datum = getdate(self.datum or nowdate())
        if self.is_new() and frappe.db.exists("PH Kassenabschluss", {"kasse": self.kasse, "datum": self.datum, "status": ("in", ("Offen", "Gezaehlt", "Korrigiert"))}):
            frappe.throw(_("Für {0} am {1} ist bereits ein Abschluss offen.").format(self.kasse, frappe.utils.formatdate(self.datum)))
        if self.status == "Abgeschlossen" and not self.is_new():
            alt = self.get_doc_before_save()
            if alt and alt.status == "Abgeschlossen":
                frappe.throw(_("Abgeschlossene Tagesabschlüsse sind unveränderlich. Leitung: „Öffnen“."))
        for z in self.zaehlprotokoll:
            z.bezeichnung = STUECK_LABEL.get(int(z.stueckelung_cent or 0), z.bezeichnung)
            z.summe_cent = int(z.stueckelung_cent or 0) * int(z.anzahl or 0)
        try:
            self.bargeld_ist_cent = logik.zaehlprotokoll_summe([z.as_dict() for z in self.zaehlprotokoll])
        except KassenFehler as e:
            frappe.throw(str(e))
        self.soll_berechnen(speichern=False)
        self.differenz_cent = logik.differenz(self.bargeld_ist_cent, self.bargeld_soll_cent)
        self.titel = f"{self.kasse} · {frappe.utils.formatdate(self.datum)} · {_(self.status)}"[:140]

    def on_trash(self):
        if self.status != "Offen":
            frappe.throw(_("Nur offene Abschlüsse ohne Zählung dürfen gelöscht werden."))

    # ── Rechnen ────────────────────────────────────────────────────────────

    def soll_berechnen(self, speichern=True):
        """Soll aus signierten Belegen des Tages + Kassenbuch-Bewegungen."""
        from ph_kassa.ph_kassa.doctype.ph_kassenbuch.ph_kassenbuch import tagesbewegungen

        belege = belege_des_tages(self.kasse, self.datum)
        s = logik.soll_aus_belegen(belege)
        kb = tagesbewegungen(self.kasse, self.datum)
        self.update(
            {
                "bar_einnahmen_cent": s["bar_einnahmen_cent"],
                "bar_ausgaben_cent": s["bar_ausgaben_cent"],
                "einlagen_cent": kb["einlagen_cent"],
                "entnahmen_cent": kb["entnahmen_cent"],
                "karten_cent": s["karten_cent"],
                "gutschein_cent": s["gutschein_cent"],
                "ueberweisung_cent": s["ueberweisung_cent"],
                "umsatz_cent": s["umsatz_cent"],
                "anzahlungen_cent": s["anzahlungen_cent"],
                "gutschein_verkauf_cent": s["gutschein_verkauf_cent"],
                "gutschein_einloesung_cent": s["gutschein_einloesung_cent"],
                "belege_anzahl": s["belege_anzahl"],
                "stornos_anzahl": s["stornos_anzahl"],
                "trainings_anzahl": s["trainings_anzahl"],
            }
        )
        self.bargeld_soll_cent = logik.bargeld_soll(self.bargeld_anfang_cent or 0, self.bar_einnahmen_cent, self.bar_ausgaben_cent, self.einlagen_cent, self.entnahmen_cent)
        self.set("umsatz_je_satz", [])
        for satz, w in sorted(s["je_satz"].items()):
            self.append("umsatz_je_satz", {"steuersatz": satz, **w})
        if speichern:
            self.differenz_cent = logik.differenz(self.bargeld_ist_cent or 0, self.bargeld_soll_cent)
            self.db_update()
            for row in self.umsatz_je_satz:
                row.db_update() if row.name else row.db_insert()
        return s

    # ── Buttons / Page ─────────────────────────────────────────────────────

    @frappe.whitelist()
    def zaehlen(self, zaehlprotokoll=None, bargeld_anfang_cent=None, unterschrift=None, unterschrift_name=None):
        """Zählprotokoll übernehmen (Mitarbeiter): Status Gezaehlt, Ist/Differenz berechnen."""
        self.check_permission("write")
        try:
            self.status = logik.naechster_status(self.status, "zaehlen")
        except KassenFehler as e:
            frappe.throw(str(e))
        if isinstance(zaehlprotokoll, str):
            zaehlprotokoll = json.loads(zaehlprotokoll)
        if zaehlprotokoll:
            mengen = {int(z.get("stueckelung_cent")): int(z.get("anzahl") or 0) for z in zaehlprotokoll}
            for row in self.zaehlprotokoll:
                row.anzahl = mengen.get(int(row.stueckelung_cent), 0)
        if bargeld_anfang_cent is not None:
            self.bargeld_anfang_cent = int(bargeld_anfang_cent)
        if unterschrift:
            self.unterschrift = unterschrift
        if unterschrift_name:
            self.unterschrift_name = unterschrift_name
        self.von_user = frappe.session.user
        self.save()
        return self.zusammenfassung()

    @frappe.whitelist()
    def abschliessen(self, differenz_grund=None, unterschrift=None, unterschrift_name=None):
        """Abschluss (Leitung): Differenzbuchung ins Kassenbuch, Nullbeleg, Sperre, PDF-Anhang."""
        self.check_permission("write")
        if not set(frappe.get_roles()) & set(LEITUNG):
            frappe.throw(_("Nur die Kassa-Leitung schließt den Tag ab."))
        from ph_kassa.ph_kassa.doctype.ph_kassa_einstellungen.ph_kassa_einstellungen import einstellungen

        einst = einstellungen()
        try:
            neu = logik.naechster_status(self.status, "abschliessen")
        except KassenFehler as e:
            frappe.throw(str(e))
        if differenz_grund:
            self.differenz_grund = differenz_grund
        if unterschrift:
            self.unterschrift = unterschrift
        if unterschrift_name:
            self.unterschrift_name = unterschrift_name
        self.soll_berechnen(speichern=False)
        self.differenz_cent = logik.differenz(self.bargeld_ist_cent or 0, self.bargeld_soll_cent)
        if logik.differenz_grund_pflichtig(self.differenz_cent, einst["differenz_toleranz_cent"]) and not (self.differenz_grund or "").strip():
            frappe.throw(_("Differenz von {0} braucht einen Grund.").format(format_betrag(self.differenz_cent)))
        if einst["abschluss_unterschrift_pflicht"] and not self.unterschrift:
            frappe.throw(_("Unterschrift fehlt."))

        if self.differenz_cent and not self.differenz_buchung:
            from ph_kassa.ph_kassa.doctype.ph_kassenbuch.ph_kassenbuch import buchen

            kb = buchen(self.kasse, "Differenz", self.differenz_cent, _("Kassendifferenz Tagesabschluss {0}: {1}").format(self.name, self.differenz_grund or ""), quelle="abschluss", kassenabschluss=self.name, idempotency_key=f"diff:{self.name}")
            self.differenz_buchung = kb.name
        if einst["abschluss_nullbeleg_automatisch"] and not self.nullbeleg:
            try:
                from ph_kassa.schnittstellen import nullbeleg

                self.nullbeleg = nullbeleg(self.kasse, bediener=frappe.session.user).name
            except Exception:  # noqa: BLE001 – Nullbeleg ist Empfehlung, kein Abschlusshindernis
                frappe.log_error(title="PH Kassenabschluss: Nullbeleg nicht erzeugt")
        self.status = neu
        self.geschlossen_am = now_datetime()
        self.freigegeben_von = frappe.session.user
        self.save()
        _belege_zuordnen(self)
        _kasse_abschluss_setzen(self.kasse, None)
        self.add_comment("Info", _("Tag abgeschlossen. Differenz {0}.").format(format_betrag(self.differenz_cent)))
        return self.zusammenfassung()

    @frappe.whitelist()
    def oeffnen(self, grund):
        """Leitung: abgeschlossenen Tag wieder öffnen (Status Korrigiert, Sperre aufgehoben)."""
        self.check_permission("write")
        if not set(frappe.get_roles()) & set(LEITUNG):
            frappe.throw(_("Nur die Kassa-Leitung öffnet einen Abschluss."))
        try:
            neu = logik.naechster_status(self.status, "oeffnen")
        except KassenFehler as e:
            frappe.throw(str(e))
        self.db_set({"status": neu, "notiz": ((self.notiz or "") + f"\n{now_datetime():%d.%m.%Y %H:%M} geöffnet von {frappe.session.user}: {grund}").strip()})
        _kasse_abschluss_setzen(self.kasse, self.name)
        self.add_comment("Info", _("Wieder geöffnet: {0}").format(grund))
        return neu

    @frappe.whitelist()
    def neu_berechnen(self):
        self.check_permission("write")
        if self.status == "Abgeschlossen":
            frappe.throw(_("Abgeschlossen – zuerst öffnen."))
        self.soll_berechnen(speichern=True)
        return self.zusammenfassung()

    def zusammenfassung(self) -> dict:
        return {
            "name": self.name,
            "status": self.status,
            "bargeld_anfang_cent": self.bargeld_anfang_cent,
            "bargeld_soll_cent": self.bargeld_soll_cent,
            "bargeld_ist_cent": self.bargeld_ist_cent,
            "differenz_cent": self.differenz_cent,
            "bar_einnahmen_cent": self.bar_einnahmen_cent,
            "bar_ausgaben_cent": self.bar_ausgaben_cent,
            "einlagen_cent": self.einlagen_cent,
            "entnahmen_cent": self.entnahmen_cent,
            "karten_cent": self.karten_cent,
            "gutschein_cent": self.gutschein_cent,
            "ueberweisung_cent": self.ueberweisung_cent,
            "umsatz_cent": self.umsatz_cent,
            "belege_anzahl": self.belege_anzahl,
            "stornos_anzahl": self.stornos_anzahl,
            "trainings_anzahl": self.trainings_anzahl,
            "zaehlprotokoll": [{"stueckelung_cent": z.stueckelung_cent, "bezeichnung": z.bezeichnung, "anzahl": z.anzahl, "summe_cent": z.summe_cent} for z in self.zaehlprotokoll],
            "umsatz_je_satz": [{"steuersatz": s.steuersatz, "anzahl": s.anzahl, "netto_cent": s.netto_cent, "ust_cent": s.ust_cent, "brutto_cent": s.brutto_cent} for s in self.umsatz_je_satz],
            "nullbeleg": self.nullbeleg,
            "differenz_buchung": self.differenz_buchung,
        }


# ── Modulfunktionen (Page, Hooks, Reports) ─────────────────────────────────

def belege_des_tages(kasse: str, datum) -> list[dict]:
    """Signierte Belege (PH Kassenbeleg, WP10a) einer Kasse an einem Tag als flache dicts für logik.abschluss."""
    if not frappe.db.exists("DocType", "PH Kassenbeleg"):
        return []
    datum = getdate(datum)
    von = f"{datum} 00:00:00"
    bis = f"{datum} 23:59:59"
    felder = ["name", "belegart", "trainings", "gesamt_cent", "bediener"]
    meta = frappe.get_meta("PH Kassenbeleg")
    felder = [f for f in felder if f == "name" or meta.has_field(f)]
    belege = frappe.get_all("PH Kassenbeleg", filters={"kasse": kasse, "docstatus": 1, "datum_uhrzeit": ("between", [von, bis])}, fields=felder)
    if not belege:
        return []
    namen = [b.name for b in belege]
    zahl = frappe.get_all("PH Kassenbeleg Zahlung", filters={"parent": ("in", namen)}, fields=["parent", "zahlart", "betrag_cent"]) if frappe.db.exists("DocType", "PH Kassenbeleg Zahlung") else []
    pos = frappe.get_all("PH Kassenbeleg Position", filters={"parent": ("in", namen)}, fields=["parent", "art", "steuersatz", "netto_cent", "ust_cent", "brutto_cent"]) if frappe.db.exists("DocType", "PH Kassenbeleg Position") else []
    z_map, p_map = {}, {}
    for z in zahl:
        z_map.setdefault(z.parent, []).append(z)
    for p in pos:
        p_map.setdefault(p.parent, []).append(p)
    return [{**b, "zahlarten": z_map.get(b.name, []), "positionen": p_map.get(b.name, [])} for b in belege]


def oeffnen_oder_holen(kasse: str, datum=None, quelle="kassa"):
    """Offenen Abschluss für Kasse+Tag holen oder anlegen (Kassa-Page „Tagesabschluss“)."""
    datum = getdate(datum or nowdate())
    name = frappe.db.get_value("PH Kassenabschluss", {"kasse": kasse, "datum": datum, "status": ("in", ("Offen", "Gezaehlt", "Korrigiert"))}, "name")
    if name:
        doc = frappe.get_doc("PH Kassenabschluss", name)
    else:
        doc = frappe.get_doc({"doctype": "PH Kassenabschluss", "kasse": kasse, "datum": datum, "quelle": quelle}).insert()
        _kasse_abschluss_setzen(kasse, doc.name)
    doc.soll_berechnen(speichern=True)
    return doc


def abschluesse_des_tages(kasse: str, datum) -> list[dict]:
    return frappe.get_all("PH Kassenabschluss", filters={"kasse": kasse, "datum": getdate(datum)}, fields=["name", "status", "geschlossen_am"])


def ist_gesperrt(kasse: str, datum=None) -> bool:
    return logik.buchung_gesperrt(abschluesse_des_tages(kasse, datum or nowdate()))


def sperre_pruefen(doc, method=None):
    """doc_events-Hook PH Kassenbeleg.before_submit (hooks.py WP10b): keine Belege nach Tagesabschluss."""
    datum = getdate(doc.get("datum_uhrzeit") or nowdate())
    if ist_gesperrt(doc.kasse, datum):
        frappe.throw(_("Kasse {0} ist für den {1} abgeschlossen. Die Leitung muss den Abschluss öffnen, bevor Belege gebucht werden.").format(doc.kasse, frappe.utils.formatdate(datum)))


def _belege_zuordnen(abschluss):
    try:
        if frappe.db.exists("DocType", "PH Kassenbeleg") and frappe.get_meta("PH Kassenbeleg").has_field("kassenabschluss"):
            for b in belege_des_tages(abschluss.kasse, abschluss.datum):
                frappe.db.set_value("PH Kassenbeleg", b["name"], "kassenabschluss", abschluss.name, update_modified=False)
    except Exception:  # noqa: BLE001
        frappe.log_error(title="PH Kassenabschluss: Belege konnten nicht zugeordnet werden")


def _kasse_abschluss_setzen(kasse, wert):
    try:
        if frappe.db.exists("DocType", "PH Kasse") and frappe.get_meta("PH Kasse").has_field("aktiver_abschluss"):
            frappe.db.set_value("PH Kasse", kasse, "aktiver_abschluss", wert, update_modified=False)
    except Exception:  # noqa: BLE001
        frappe.log_error(title="PH Kassenabschluss: PH Kasse.aktiver_abschluss nicht gesetzt")
