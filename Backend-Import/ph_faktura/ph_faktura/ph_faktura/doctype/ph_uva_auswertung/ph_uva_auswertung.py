"""PH UVA Auswertung – Zuarbeit zur Umsatzsteuervoranmeldung (keine Abgabe).

Methode (Steuerberater bestätigt): Soll-Versteuerung für Rechnungen/Gutschriften nach Belegdatum;
Anzahlungen nach Vereinnahmung (Ist): je Zahlung auf eine Anzahlungsrechnung im Zeitraum wird der
Zahlungsanteil auf die USt-Sätze der Rechnung verteilt. Schlussrechnungen zählen mit dem Rest nach
Anzahlungsverrechnung (Gesamt minus verrechnete Anzahlungen je Satz), damit nichts doppelt fällig wird.
Eingangsrechnungen: Vorsteuer/RC/igE nach Rechnungsdatum (Status Freigegeben/Bezahlt).
berechne(von, bis) wird auch vom Report „PH UVA Zuarbeit“ genutzt.
"""

import calendar
import datetime as dt
from decimal import Decimal

import frappe
from frappe import _

from ph_faktura import einstellungen
from ph_faktura.rechenwerk import uva as UV
from frappe.model.document import Document
from frappe.utils import cint, getdate, now_datetime

from ph_faktura.rechenwerk.steuer import rund

KOPF = "Beleg\tArt\tDatum\tKunde/Lieferant\tUSt-Fall\tBrutto"


class PHUVAAuswertung(Document):
    def before_insert(self):
        self.status = "Entwurf"

    def validate(self):
        self.zeitraum_setzen()
        self.titel = f"UVA {self.jahr}-{cint(self.periode):02d}" if self.zeitraum_art == "Monat" else f"UVA {self.jahr} Q{self.periode}"
        if frappe.db.exists("PH UVA Auswertung", {"jahr": self.jahr, "periode": self.periode, "zeitraum_art": self.zeitraum_art, "name": ("!=", self.name)}):
            frappe.throw(_("Für diesen Zeitraum gibt es bereits eine Auswertung."))

    def zeitraum_setzen(self):
        j, p = cint(self.jahr), cint(self.periode)
        if self.zeitraum_art == "Monat":
            if not 1 <= p <= 12:
                frappe.throw(_("Monat 1–12."))
            self.zeitraum_von = dt.date(j, p, 1)
            self.zeitraum_bis = dt.date(j, p, calendar.monthrange(j, p)[1])
        else:
            if not 1 <= p <= 4:
                frappe.throw(_("Quartal 1–4."))
            m = (p - 1) * 3 + 1
            self.zeitraum_von = dt.date(j, m, 1)
            self.zeitraum_bis = dt.date(j, m + 2, calendar.monthrange(j, m + 2)[1])

    @frappe.whitelist()
    def berechnen(self):
        """Button „Berechnen“: Kennzahlen aus Belegen des Zeitraums."""
        self.check_permission("write")
        felder, zeilen, belege = berechne(self.zeitraum_von, self.zeitraum_bis)
        self.update(felder)
        self.set("zeilen", [])
        for z in zeilen:
            self.append("zeilen", z)
        self.belegliste = KOPF + "\n" + "\n".join(belege)
        self.berechnet_am = now_datetime()
        self.status = "Berechnet"
        self.save()
        return felder

    @frappe.whitelist()
    def als_uebergeben(self):
        self.check_permission("write")
        if self.status != "Berechnet":
            frappe.throw(_("Zuerst berechnen."))
        self.db_set("status", "Uebergeben")
        return True


def berechne(zeitraum_von, zeitraum_bis):
    """Kennzahlen eines Zeitraums → (felder, zeilen, belege)."""
    von, bis = getdate(zeitraum_von), getdate(zeitraum_bis)
    kz = {k: 0 for k in ("kz000", "kz011", "kz017", "kz021", "kz022", "kz022_ust", "kz029", "kz029_ust", "kz006", "kz006_ust", "kz070", "kz072", "kz057", "kz060", "kz065", "kz066", "anz_brutto", "anz_ust", "oss_netto", "oss_ust")}
    oss = {}
    belege = []

    def erfasse(fall, satz, netto, ust, oss_land=None):
        if fall == "OSS":
            kz["oss_netto"] += netto
            kz["oss_ust"] += ust
            o = oss.setdefault((oss_land or "?", satz), {"netto": 0, "ust": 0, "n": 0})
            o["netto"] += netto
            o["ust"] += ust
            o["n"] += 1
            return  # OSS-Umsätze sind nicht Teil der österreichischen UVA
        kz["kz000"] += netto
        if fall == "Steuerpflichtig AT":
            key = {2000: "kz022", 1000: "kz029", 1300: "kz006"}.get(satz)
            if key:
                kz[key] += netto
                kz[key + "_ust"] += ust
        elif fall == "Innergemeinschaftlich steuerfrei":
            kz["kz017"] += netto
        elif fall == "Reverse Charge":
            kz["kz021"] += netto
        elif fall == "Ausfuhr":
            kz["kz011"] += netto

    def aufteilung(parenttype, parent):
        return frappe.get_all("PH Beleg Steuer", filters={"parent": parent, "parenttype": parenttype, "parentfield": "ust_aufteilung"}, fields=["ust_satz_promille", "netto_cent", "ust_cent"])

    # Rechnungen (Soll) außer Anzahlungsrechnungen – Rest nach Anzahlungsverrechnung
    for r in frappe.get_all("PH Rechnung", filters={"docstatus": 1, "art": ("!=", "Anzahlungsrechnung"), "datum": ("between", [von, bis])}, fields=["name", "nummer", "art", "datum", "ust_fall", "oss_land", "brutto_cent", "kunde_name", "kassenbeleg"]):
        if r.kassenbeleg:
            # Barverkaufsrechnung zu einem Kassenbeleg: Umsatz kommt aus der Kassa (unten), nicht doppelt
            belege.append(f"{r.nummer}\tBarverkauf zu Kassenbeleg {r.kassenbeleg} (Umsatz über Kassa)\t{r.datum}\t{r.kunde_name}\t{r.ust_fall}\t0.00")
            continue
        verrechnet = {}
        for v in frappe.get_all("PH Rechnung Anzahlung", filters={"parent": r.name, "parenttype": "PH Rechnung"}, fields=["ust_satz_promille", "netto_cent", "ust_cent"]):
            e = verrechnet.setdefault(cint(v.ust_satz_promille), {"netto_cent": 0, "ust_cent": 0})
            e["netto_cent"] += cint(v.netto_cent)
            e["ust_cent"] += cint(v.ust_cent)
        for a in aufteilung("PH Rechnung", r.name):
            v = verrechnet.get(cint(a.ust_satz_promille), {"netto_cent": 0, "ust_cent": 0})
            erfasse(r.ust_fall, cint(a.ust_satz_promille), cint(a.netto_cent) - v["netto_cent"], cint(a.ust_cent) - v["ust_cent"], r.oss_land)
        belege.append(f"{r.nummer}\t{r.art}\t{r.datum}\t{r.kunde_name}\t{r.ust_fall}\t{cint(r.brutto_cent) / 100:.2f}")
    # Gutschriften (negativ)
    for g in frappe.get_all("PH Gutschrift", filters={"docstatus": 1, "datum": ("between", [von, bis])}, fields=["name", "nummer", "datum", "ust_fall", "brutto_cent", "kunde_name", "rechnung"]):
        oss_land = frappe.db.get_value("PH Rechnung", g.rechnung, "oss_land") if g.ust_fall == "OSS" else None
        for a in aufteilung("PH Gutschrift", g.name):
            erfasse(g.ust_fall, cint(a.ust_satz_promille), -cint(a.netto_cent), -cint(a.ust_cent), oss_land)
        belege.append(f"{g.nummer}\tGutschrift\t{g.datum}\t{g.kunde_name}\t{g.ust_fall}\t-{cint(g.brutto_cent) / 100:.2f}")
    # Anzahlungen (Ist): Zahlungen auf Anzahlungsrechnungen im Zeitraum
    zahlungen = frappe.db.sql(
        """select z.parent, z.betrag_cent, z.datum from `tabPH Rechnung Zahlung` z join `tabPH Rechnung` r on r.name = z.parent
           where r.docstatus = 1 and r.art = 'Anzahlungsrechnung' and z.datum between %s and %s""", (von, bis), as_dict=True)
    for z in zahlungen:
        r = frappe.db.get_value("PH Rechnung", z.parent, ["nummer", "brutto_cent", "ust_fall", "oss_land", "kunde_name"], as_dict=True)
        if not r or not cint(r.brutto_cent):
            continue
        anteil = Decimal(cint(z.betrag_cent)) / Decimal(cint(r.brutto_cent))
        for a in aufteilung("PH Rechnung", z.parent):
            netto = rund(Decimal(cint(a.netto_cent)) * anteil)
            ust = rund(Decimal(cint(a.ust_cent)) * anteil)
            erfasse(r.ust_fall, cint(a.ust_satz_promille), netto, ust, r.oss_land)
            kz["anz_ust"] += ust
        kz["anz_brutto"] += cint(z.betrag_cent)
        belege.append(f"{r.nummer}\tAnzahlung vereinnahmt\t{z.datum}\t{r.kunde_name}\t{r.ust_fall}\t{cint(z.betrag_cent) / 100:.2f}")
    # Skonto (Entgeltsminderung § 16 UStG) im Monat der Zahlung, aufgeteilt nach Sätzen der Rechnung
    for z in frappe.db.sql(
        """select z.parent, z.betrag_cent, z.datum from `tabPH Rechnung Zahlung` z join `tabPH Rechnung` r on r.name = z.parent
           where r.docstatus = 1 and r.art != 'Anzahlungsrechnung' and z.kanal = 'Skonto' and z.datum between %s and %s""", (von, bis), as_dict=True):
        r = frappe.db.get_value("PH Rechnung", z.parent, ["nummer", "ust_fall", "oss_land", "kunde_name"], as_dict=True)
        aufteilung = [{"ust_satz_promille": a.ust_satz_promille, "brutto_cent": cint(a.netto_cent) + cint(a.ust_cent)} for a in aufteilung("PH Rechnung", z.parent)]
        for t in UV.skonto_aufteilen(cint(z.betrag_cent), aufteilung):
            erfasse(r.ust_fall, t["ust_satz_promille"], -t["netto_cent"], -t["ust_cent"], r.oss_land)
        belege.append(f"{r.nummer}\tSkonto\t{z.datum}\t{r.kunde_name}\t{r.ust_fall}\t-{cint(z.betrag_cent) / 100:.2f}")
    # Kassa (ph_kassa): Umsätze je Satz, ohne Zahlungen auf Rechnungen, ohne Anzahlungen auf Anzahlungsrechnungen
    # (dort oben als Ist erfasst), ohne Mehrzweck-Gutscheinverkauf – Regel in rechenwerk/uva.py
    if einstellungen.faktura().get("kassa_in_uva", 1) and frappe.db.exists("DocType", "PH Kassenbeleg"):
        k = UV.kassa_umsaetze(kassenbelege(von, bis), ar_kassenbelege())
        for satz, w in sorted(k["je_satz"].items()):
            erfasse("Steuerpflichtig AT", satz, w["netto_cent"], w["ust_cent"])
            belege.append(f"Kassa\tKassenumsatz {satz / 100:g} %\t{von}–{bis}\t{w['anzahl']} Positionen\tSteuerpflichtig AT\t{w['brutto_cent'] / 100:.2f}")
        kz["anz_brutto"] += k["anzahlungen_ist"]["brutto_cent"]
        kz["anz_ust"] += k["anzahlungen_ist"]["ust_cent"]
        for grund, brutto in k["nicht_umsatz"].items():
            belege.append(f"Kassa\tnicht in UVA: {UV.GRUENDE.get(grund, grund)}\t{von}–{bis}\t\t\t{brutto / 100:.2f}")
    # Eingangsrechnungen
    for er in frappe.get_all("PH Eingangsrechnung", filters={"status": ("in", ("Freigegeben", "Bezahlt")), "datum": ("between", [von, bis])}, fields=["name", "rechnungsnummer_lieferant", "datum", "lieferant_name", "ust_fall", "netto_cent", "vorsteuer_cent", "rc_steuer_cent", "brutto_cent", "belegart"]):
        from ph_faktura.rechenwerk.integration import er_vorzeichen

        v = er_vorzeichen(er.belegart)  # Lieferanten-Gutschrift: Vorsteuerkorrektur (§ 16 UStG)
        if er.ust_fall in ("Vorsteuer AT", "Einfuhr Drittland"):
            kz["kz060"] += v * cint(er.vorsteuer_cent)
        elif er.ust_fall == "Reverse Charge EU":
            kz["kz057"] += v * cint(er.rc_steuer_cent)
            kz["kz066"] += v * cint(er.vorsteuer_cent)
        elif er.ust_fall == "Innergemeinschaftlicher Erwerb":
            kz["kz070"] += v * cint(er.netto_cent)
            kz["kz072"] += v * cint(er.rc_steuer_cent)
            kz["kz065"] += v * cint(er.vorsteuer_cent)
        belege.append(f"{er.rechnungsnummer_lieferant}\tEingangsrechnung\t{er.datum}\t{er.lieferant_name}\t{er.ust_fall}\t{cint(er.brutto_cent) / 100:.2f}")

    schuld = kz["kz022_ust"] + kz["kz029_ust"] + kz["kz006_ust"] + kz["kz072"] + kz["kz057"]
    vorsteuer = kz["kz060"] + kz["kz065"] + kz["kz066"]
    felder = {f"{k}_cent": v for k, v in kz.items() if not k.startswith(("anz_", "oss_"))}
    felder.update({"anzahlungen_vereinnahmt_cent": kz["anz_brutto"], "anzahlungen_ust_cent": kz["anz_ust"], "oss_umsatz_cent": kz["oss_netto"], "oss_ust_cent": kz["oss_ust"], "zahllast_cent": schuld - vorsteuer})
    zeilen = []
    for k, b, bem, st in [
        ("000", "Lieferungen, sonstige Leistungen (ohne OSS)", kz["kz000"], 0), ("011", "Ausfuhrlieferungen", kz["kz011"], 0), ("017", "Innergemeinschaftliche Lieferungen", kz["kz017"], 0),
        ("021", "Reverse Charge (Leistungsort Ausland)", kz["kz021"], 0), ("022", "20 % Normalsteuersatz", kz["kz022"], kz["kz022_ust"]), ("029", "10 % ermäßigt", kz["kz029"], kz["kz029_ust"]),
        ("006", "13 % ermäßigt", kz["kz006"], kz["kz006_ust"]), ("070", "Innergemeinschaftliche Erwerbe", kz["kz070"], kz["kz072"]), ("057", "Steuerschuld Reverse Charge (Empfänger)", 0, kz["kz057"]),
        ("060", "Vorsteuer", 0, kz["kz060"]), ("065", "Vorsteuer igE", 0, kz["kz065"]), ("066", "Vorsteuer Reverse Charge", 0, kz["kz066"]),
        ("—", "Anzahlungen vereinnahmt (in 022/029/006 enthalten)", kz["anz_brutto"] - kz["anz_ust"], kz["anz_ust"]),
    ]:
        zeilen.append({"kennzahl": k, "bezeichnung": b, "bemessung_cent": bem, "steuer_cent": st})
    for (land, satz), o in sorted(oss.items()):
        zeilen.append({"kennzahl": "OSS", "bezeichnung": _("OSS {0} {1}").format(land, f"{satz / 100:g} %"), "land": land, "satz_promille": satz, "bemessung_cent": o["netto"], "steuer_cent": o["ust"], "anzahl_belege": o["n"]})
    return felder, zeilen, belege


def kassenbelege(von, bis):
    """Signierte Kassenbelege eines Zeitraums als flache dicts für rechenwerk.uva (ph_kassa ist optional)."""
    belege = frappe.get_all("PH Kassenbeleg", filters={"docstatus": 1, "datum_uhrzeit": ("between", [f"{von} 00:00:00", f"{bis} 23:59:59"])}, fields=["name", "belegart", "trainings", "rechnung", "auftrag", "storno_von"])
    if not belege:
        return []
    meta = frappe.get_meta("PH Kassenbeleg Position")
    felder = ["parent", "art", "steuersatz", "netto_cent", "ust_cent", "brutto_cent"] + (["ursprungsart"] if meta.has_field("ursprungsart") else [])
    pos = {}
    for p in frappe.get_all("PH Kassenbeleg Position", filters={"parent": ("in", [b.name for b in belege]), "parenttype": "PH Kassenbeleg"}, fields=felder):
        pos.setdefault(p.parent, []).append(p)
    return [{**b, "positionen": pos.get(b.name, [])} for b in belege]


def ar_kassenbelege():
    """Kassenbelege, deren Zahlung auf einer Anzahlungsrechnung verbucht ist (Hinweis „Kassenbeleg X“ / „KB:X“ oder
    PH Zahlung mit Bezug Kassenbeleg) – deren USt erfasst die UVA über die Anzahlungsrechnung (Ist)."""
    out = set()
    for z in frappe.db.sql(
        """select z.hinweis, z.zahlung from `tabPH Rechnung Zahlung` z join `tabPH Rechnung` r on r.name = z.parent
           where r.docstatus = 1 and r.art = 'Anzahlungsrechnung'""", as_dict=True):
        h = z.hinweis or ""
        for praefix in ("Kassenbeleg ", "KB:", "KB-Storno:"):
            if h.startswith(praefix):
                out.add(h[len(praefix):].strip())
        if z.zahlung and frappe.db.exists("DocType", "PH Zahlung"):
            bezug = frappe.db.get_value("PH Zahlung", z.zahlung, ["bezug_doctype", "bezug"], as_dict=True)
            if bezug and bezug.bezug_doctype == "PH Kassenbeleg":
                out.add(bezug.bezug)
    return out
