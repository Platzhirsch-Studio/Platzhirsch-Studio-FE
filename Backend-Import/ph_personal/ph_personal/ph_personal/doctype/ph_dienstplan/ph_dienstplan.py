"""PH Dienstplan – Wochenplan je Kalenderwoche.

Prüfung (utils/dienstplan.py): Mindestbesetzung je Wochentag/Zeitfenster aus PH Personal Einstellungen
(Showroom-Öffnungszeiten), Schicht an Abwesenheits-/Krankenstandstag, Doppelschicht, Ruhezeit 11 h (AZG § 12;
Jugendliche 12 h, KJBG § 16), Tageshöchstgrenze (AZG § 9 / KJBG § 11), Wochenruhe 36 h (ARG § 3/§ 4).
Konflikte blockieren das Speichern nicht (Planung ist Entwurf), aber das Veröffentlichen bei Rechtsverstößen.
Kolleginnen/Kollegen sehen eigene Schichten über ph_personal.api.mein_dienstplan (Krankenstand nur „abwesend“).
"""

from datetime import timedelta

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import getdate, now_datetime

from ph_personal.utils.dienstplan import kalenderwoche, konflikte, min_text, uhrzeit_min, unterbesetzung, wochenstunden

TAGNAMEN = ("Mo", "Di", "Mi", "Do", "Fr", "Sa", "So")
WOCHENTAG_INDEX = {"Montag": 0, "Dienstag": 1, "Mittwoch": 2, "Donnerstag": 3, "Freitag": 4, "Samstag": 5, "Sonntag": 6}
RECHTSVERSTOSS = ("ruhezeit", "hoechstgrenze", "wochenruhe", "doppelt")


class PHDienstplan(Document):
    def before_insert(self):
        self._woche_setzen()

    def _woche_setzen(self):
        j, kw, montag, sonntag = kalenderwoche(getdate(self.woche_von))
        self.woche_von, self.woche_bis, self.jahr, self.kalenderwoche = montag, sonntag, j, kw
        self.kennung = f"{j}-KW{kw:02d}"

    def validate(self):
        self._woche_setzen()
        if not self.is_new() and self.has_value_changed("kennung"):
            frappe.throw(_("Die Woche eines bestehenden Plans kann nicht geändert werden – neuen Plan anlegen."))
        self.titel = _("Dienstplan KW {0}/{1} ({2} – {3})").format(self.kalenderwoche, self.jahr, getdate(self.woche_von).strftime("%d.%m."), getdate(self.woche_bis).strftime("%d.%m.%Y"))
        self._schichten_bereinigen()
        self.pruefen(speichern=False)

    def _schichten_bereinigen(self):
        von, bis = getdate(self.woche_von), getdate(self.woche_bis)
        vorlagen = {}
        for z in self.schichten or []:
            d = getdate(z.datum)
            if not von <= d <= bis:
                frappe.throw(_("Zeile {0}: {1} liegt nicht in KW {2}.").format(z.idx, frappe.format(d, {"fieldtype": "Date"}), self.kalenderwoche))
            if z.schicht and (not z.beginn or not z.ende):
                v = vorlagen.get(z.schicht) or frappe.get_cached_doc("PH Schicht", z.schicht)
                vorlagen[z.schicht] = v
                z.beginn = z.beginn or v.beginn
                z.ende = z.ende or v.ende
                z.pause_min = z.pause_min or v.pause_min
                z.bereich = z.bereich or v.bereich
            b, e = uhrzeit_min(z.beginn), uhrzeit_min(z.ende)
            if b is None or e is None or e <= b:
                frappe.throw(_("Zeile {0}: Beginn und Ende angeben, Ende nach Beginn.").format(z.idx))
            z.netto_min = max(0, e - b - int(z.pause_min or 0))
            z.wochentag = TAGNAMEN[d.weekday()]

    def _schichtliste(self):
        return [
            {"datum": getdate(z.datum), "mitarbeiter": z.mitarbeiter, "beginn_min": uhrzeit_min(z.beginn), "ende_min": uhrzeit_min(z.ende), "pause_min": int(z.pause_min or 0), "bereich": z.bereich}
            for z in self.schichten or []
            if z.beginn and z.ende
        ]

    def _abwesenheiten(self, mitarbeiter):
        von, bis = getdate(self.woche_von), getdate(self.woche_bis)
        out = {}
        for a in frappe.get_all("PH Abwesenheit", filters={"mitarbeiter": ("in", mitarbeiter), "status": ("in", ["Beantragt", "Genehmigt"]), "von": ("<=", bis), "bis": (">=", von)}, fields=["mitarbeiter", "von", "bis", "art", "status"]):
            out.setdefault(a.mitarbeiter, []).append((getdate(a.von), getdate(a.bis), f"{a.art} ({_(a.status)})"))
        if frappe.db.exists("DocType", "PH Krankmeldung"):
            for k in frappe.get_all("PH Krankmeldung", filters={"mitarbeiter": ("in", mitarbeiter), "status": ("in", ["Gemeldet", "Bestaetigt", "Beendet"]), "von": ("<=", bis)}, fields=["mitarbeiter", "von", "bis", "bis_voraussichtlich", "bis_offen"]):
                ende = getdate(k.bis or (k.bis_voraussichtlich if not k.bis_offen else None) or bis)
                if ende >= von:
                    out.setdefault(k.mitarbeiter, []).append((getdate(k.von), ende, _("abwesend")))
        return out

    @frappe.whitelist()
    def pruefen(self, speichern=True):
        """Button „Prüfen“: Unterbesetzung und Konflikte berechnen (Ergebnis im Feld Prüfergebnis)."""
        from ph_personal.utils.arbeitszeit import ist_jugendlich

        schichten = self._schichtliste()
        mitarbeiter = sorted({s["mitarbeiter"] for s in schichten})
        anforderungen = []
        for r in frappe.get_single("PH Personal Einstellungen").get("mindestbesetzung") or []:
            anforderungen.append({"wochentag": WOCHENTAG_INDEX.get(r.wochentag, 0), "von_min": uhrzeit_min(r.von), "bis_min": uhrzeit_min(r.bis), "anzahl": int(r.anzahl or 1), "bereich": r.bereich or ""})
        tage = [getdate(self.woche_von) + timedelta(days=i) for i in range(7)]
        from ph_personal.ph_personal.zeitkonto import freie_tage_zeitraum

        frei = freie_tage_zeitraum(tage[0], tage[-1])
        luecken = [l for l in unterbesetzung(schichten, anforderungen, tage) if l["datum"] not in frei]
        jugend = set()
        for ma in mitarbeiter:
            geb = frappe.db.get_value("PH Mitarbeiter", ma, "geburtsdatum")
            if geb and ist_jugendlich(geb, tage[0]):
                jugend.add(ma)
        k = konflikte(schichten, self._abwesenheiten(mitarbeiter) if mitarbeiter else {}, jugendliche=jugend)
        if jugend:  # KJBG § 16: 12 h Ruhezeit
            k += [x for x in konflikte([s for s in schichten if s["mitarbeiter"] in jugend], {}, ruhezeit_std=12) if x["art"] == "ruhezeit" and x not in k]
        namen = {ma: frappe.db.get_value("PH Mitarbeiter", ma, "titel") for ma in mitarbeiter}
        zeilen = [_("Unterbesetzung {0} {1}–{2}{3}: {4} von {5}").format(TAGNAMEN[l["datum"].weekday()], min_text(l["von_min"]), min_text(l["bis_min"]), f" ({l['bereich']})" if l["bereich"] else "", l["ist"], l["soll"]) for l in luecken]
        zeilen += [f"{namen.get(x['mitarbeiter'], x['mitarbeiter'])} {x['datum'].strftime('%d.%m.')}: {x['text']}" for x in k]
        stunden = wochenstunden(schichten)
        zeilen += [_("Geplant: {0} {1} h").format(namen.get(ma, ma), round(m / 60, 2)) for ma, m in sorted(stunden.items())]
        self.unterbesetzung_anzahl = len(luecken)
        self.konflikte_anzahl = len(k)
        self.pruefergebnis = "\n".join(zeilen) or _("Keine Befunde.")
        self.geprueft_am = now_datetime()
        if speichern and not self.is_new():
            self.db_update()
        return {"unterbesetzung": luecken, "konflikte": k, "wochenstunden": stunden, "rechtsverstoesse": [x for x in k if x["art"] in RECHTSVERSTOSS]}

    @frappe.whitelist()
    def veroeffentlichen(self):
        """Button „Veröffentlichen“ (Leitung): nur ohne Ruhezeit-/Höchstgrenzen-Verstoß; Unterbesetzung als Hinweis."""
        if "PH Personal Leitung" not in frappe.get_roles() and frappe.session.user != "Administrator":
            frappe.throw(_("Nur die Personal-Leitung veröffentlicht Dienstpläne."), frappe.PermissionError)
        ergebnis = self.pruefen(speichern=False)
        if ergebnis["rechtsverstoesse"]:
            frappe.throw(_("Nicht veröffentlicht – Verstöße gegen AZG/ARG/KJBG:<br>{0}").format("<br>".join(frappe.utils.escape_html(x["text"]) for x in ergebnis["rechtsverstoesse"][:10])))
        self.status = "Veroeffentlicht"
        self.veroeffentlicht_am = now_datetime()
        self.veroeffentlicht_von = frappe.session.user
        self.save()
        if self.unterbesetzung_anzahl:
            frappe.msgprint(_("Veröffentlicht mit {0} unterbesetzten Zeitfenstern.").format(self.unterbesetzung_anzahl), indicator="orange")
        return self.status

    @frappe.whitelist()
    def zurueck_auf_entwurf(self):
        if "PH Personal Leitung" not in frappe.get_roles() and frappe.session.user != "Administrator":
            frappe.throw(_("Nur die Personal-Leitung."), frappe.PermissionError)
        self.status = "Entwurf"
        self.save()
        return self.status

    @frappe.whitelist()
    def in_folgewoche_kopieren(self):
        """Button „In Folgewoche kopieren“: neuer Entwurf mit denselben Schichten (+7 Tage), ohne Ausgetretene."""
        self.check_permission("read")
        folge = getdate(self.woche_von) + timedelta(days=7)
        j, kw, _m, _s = kalenderwoche(folge)
        vorhanden = frappe.db.get_value("PH Dienstplan", {"kennung": f"{j}-KW{kw:02d}"}, "name")
        if vorhanden:
            frappe.throw(_("Für KW {0}/{1} gibt es bereits {2}.").format(kw, j, vorhanden))
        aktiv = set(frappe.get_all("PH Mitarbeiter", filters={"status": "Aktiv"}, pluck="name"))
        neu = frappe.get_doc(
            {
                "doctype": "PH Dienstplan",
                "woche_von": folge,
                "schichten": [
                    {"datum": getdate(z.datum) + timedelta(days=7), "mitarbeiter": z.mitarbeiter, "schicht": z.schicht, "beginn": z.beginn, "ende": z.ende, "pause_min": z.pause_min, "bereich": z.bereich, "notiz": z.notiz}
                    for z in self.schichten or []
                    if z.mitarbeiter in aktiv
                ],
            }
        ).insert()
        return neu.name
