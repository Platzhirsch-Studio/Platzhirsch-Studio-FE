"""PH Abwesenheit – Urlaub/Abwesenheit mit Genehmigung (Workflow „PH Abwesenheit“).

Tage nach Arbeitszeitmodell und Feiertagskalender (zeitkonto.abwesenheitstage, Fachkritik R4/P5/P6),
Urlaubskonto nach UrlG (urlaubskonto.konto: Urlaubsjahr, Aliquotierung, FIFO, Verjährung – P8/R2),
Krankenstand nicht hier, sondern PH Krankmeldung (R1/R3); § 5 UrlG-Unterbrechung über Felder unterbrechung_*.
Genehmigung: niemand genehmigt den eigenen Antrag (Antragsteller = PH Mitarbeiter.user, nicht owner – P12);
Anträge der Leitung genehmigt PH Personal Einstellungen.genehmiger_fuer_leitung bzw. die Geschäftsführung.
"""

from datetime import date

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import cint, flt, getdate, now_datetime, nowdate

from ph_personal.logik import ueberschneidung

WORKFLOW_STATE = {"Beantragt": "PH Beantragt", "Genehmigt": "PH Genehmigt", "Abgelehnt": "PH Abgelehnt", "Storniert": "PH Storniert"}
BLOCKIEREND = ("Beantragt", "Genehmigt")
OEFFENTLICHE_ARTEN = ("Urlaub", "Fortbildung", "Berufsschule")  # Teamkalender: andere Arten nur „abwesend“ (Art. 9 DSGVO)


class PHAbwesenheit(Document):
    def before_insert(self):
        self.beantragt_von = frappe.session.user
        self.beantragt_am = now_datetime()

    def validate(self):
        from ph_personal.ph_personal.zeitkonto import abwesenheitstage, sperre_pruefen

        von, bis = getdate(self.von), getdate(self.bis)
        if bis < von:
            frappe.throw(_("„Bis“ liegt vor „Von“."))
        if self.halbtags and von != bis:
            frappe.throw(_("Halber Tag nur bei einem einzelnen Tag."))
        if self.vertretung == self.mitarbeiter:
            frappe.throw(_("Vertretung kann nicht die Person selbst sein."))
        if self.art == "Krankenstand":
            frappe.throw(_("Krankenstand bitte als PH Krankmeldung erfassen (keine Genehmigung, Gesundheitsdatum)."))
        tage = abwesenheitstage(self.mitarbeiter, von, bis, bool(self.halbtags))
        if self.unterbrechung_von:
            u_von, u_bis = getdate(self.unterbrechung_von), getdate(self.unterbrechung_bis or self.unterbrechung_von)
            tage = [(d, m) for d, m in tage if not u_von <= d <= u_bis]
        self._tage_liste = tage
        self.tage = sum(m for _, m in tage)
        if self.tage <= 0 and not self.unterbrechung_von:
            frappe.throw(_("Der Zeitraum enthält keinen Arbeitstag laut Arbeitszeitmodell (Feiertage zählen nicht)."))
        if self.stunden and flt(self.stunden) < 0:
            frappe.throw(_("Stunden können nicht negativ sein."))
        if not self.flags.ph_unterbrechung and (self.is_new() or self.has_value_changed("von") or self.has_value_changed("bis") or self.has_value_changed("status")):
            sperre_pruefen(self.mitarbeiter, von, bis)
        self._ueberschneidung_pruefen(von, bis)
        self._entscheidung()
        self._urlaubskonto()
        self._pflegefreistellung()
        name = self.mitarbeiter_name or frappe.db.get_value("PH Mitarbeiter", self.mitarbeiter, "titel")
        zeitraum = frappe.format(von, {"fieldtype": "Date"}) if von == bis else f"{frappe.format(von, {'fieldtype': 'Date'})} – {frappe.format(bis, {'fieldtype': 'Date'})}"
        self.titel = f"{name} · {self.art} · {zeitraum}"[:140]

    def _ueberschneidung_pruefen(self, von, bis):
        if self.status not in BLOCKIEREND:
            return
        andere = frappe.get_all(
            "PH Abwesenheit",
            filters={"name": ("!=", self.name or ""), "mitarbeiter": self.mitarbeiter, "status": ("in", BLOCKIEREND), "von": ("<=", bis), "bis": (">=", von)},
            fields=["name", "art", "von", "bis"],
            limit=1,
        )
        for a in andere:
            if ueberschneidung(von, bis, getdate(a.von), getdate(a.bis)):
                frappe.throw(_("Überschneidung mit {0} ({1}, {2}–{3}).").format(a.name, a.art, frappe.format(a.von, {"fieldtype": "Date"}), frappe.format(a.bis, {"fieldtype": "Date"})))

    def antragsteller_user(self):
        return frappe.db.get_value("PH Mitarbeiter", self.mitarbeiter, "user")

    def _entscheidung(self):
        alt = self.get_doc_before_save()
        if alt and alt.status != self.status and self.status in ("Genehmigt", "Abgelehnt"):
            if frappe.session.user != "Administrator" and frappe.session.user == self.antragsteller_user():
                frappe.throw(_("Eigene Anträge kann niemand selbst genehmigen oder ablehnen."), frappe.PermissionError)
            self.genehmigt_von = frappe.session.user
            self.genehmigt_am = now_datetime()
            if self.status == "Abgelehnt" and not (self.ablehnungsgrund or "").strip():
                frappe.throw(_("Bitte einen Ablehnungsgrund angeben."))
        if alt and alt.status in ("Genehmigt", "Abgelehnt") and self.status == "Beantragt":
            self.genehmigt_von = None
            self.genehmigt_am = None

    def _urlaubskonto(self):
        if self.art != "Urlaub":
            self.urlaub_anspruch = self.urlaub_genommen = self.urlaub_beantragt = self.urlaub_rest = self.urlaub_verfuegbar = 0
            self.urlaub_verjaehrung = None
            self.tage_je_urlaubsjahr = None
            return
        from ph_personal.ph_personal.urlaubskonto import konto
        from ph_personal.utils.urlaub import tage_aufteilen

        k = konto(self.mitarbeiter, getdate(self.von), ausser=self.name)
        self.urlaub_anspruch = k["anspruch"]
        self.urlaub_verfuegbar = k["verfuegbar"]
        self.urlaub_genommen = k["genommen"]
        self.urlaub_beantragt = k["beantragt"]
        self.urlaub_verjaehrung = k["naechste_verjaehrung"]
        eigener = self.tage if self.status in BLOCKIEREND else 0
        self.urlaub_rest = round(k["rest_nach_antraegen"] - eigener, 2)
        jahre = [(getdate(j["von"]), getdate(j["bis"])) for j in k["jahre"]]
        aufteilung = tage_aufteilen(getattr(self, "_tage_liste", []), jahre) if jahre else {}
        teile = [f"{v.strftime('%d.%m.%Y')}–{b.strftime('%d.%m.%Y')}: {t:g}" for (v, b), t in aufteilung.items() if t]
        self.tage_je_urlaubsjahr = "\n".join(teile) or None
        if self.urlaub_rest < 0 and self.status in BLOCKIEREND:
            if self.status == "Genehmigt" and not self.vorgriff_vereinbart:
                frappe.throw(_("Der Urlaub übersteigt den entstandenen Anspruch um {0} Tage – „Urlaubsvorgriff vereinbart“ setzen.").format(abs(self.urlaub_rest)))
            frappe.msgprint(_("Hinweis: Urlaubskonto wird um {0} Tage überschritten (Vorgriff).").format(abs(self.urlaub_rest)), indicator="orange")

    def _pflegefreistellung(self):
        """§ 16 UrlG: eine Woche Normalarbeitszeit je Arbeitsjahr – Hinweis bei Überschreitung (zweite Woche nur
        unter den Voraussetzungen des § 16 Abs 2, Entscheidung Leitung)."""
        if self.art != "Pflegefreistellung" or self.status not in BLOCKIEREND:
            return
        from ph_personal.ph_personal.zeitkonto import tagessoll

        stunden = flt(self.stunden) or sum(tagessoll(self.mitarbeiter, d) * m / 60 for d, m in getattr(self, "_tage_liste", []))
        kontingent = frappe.db.get_value(
            "PH Urlaubsanspruch",
            {"mitarbeiter": self.mitarbeiter, "urlaubsjahr_von": ("<=", self.von), "urlaubsjahr_bis": (">=", self.von)},
            ["pflegefreistellung_std", "pflegefreistellung_genommen_std"],
            as_dict=True,
        )
        if kontingent and flt(kontingent.pflegefreistellung_genommen_std) + stunden > flt(kontingent.pflegefreistellung_std):
            frappe.msgprint(_("Hinweis: Pflegefreistellung über dem Kontingent einer Woche (§ 16 UrlG) – zweite Woche nur bei Erkrankung eines Kindes unter 12 Jahren."), indicator="orange")

    def on_update(self):
        alt = self.get_doc_before_save()
        if alt and alt.status != self.status and self.status in ("Genehmigt", "Abgelehnt") and self.beantragt_von and self.beantragt_von != frappe.session.user:
            try:
                frappe.share.add_docshare(self.doctype, self.name, self.beantragt_von, read=1, flags={"ignore_share_permission": True})
                self.add_comment("Info", _("{0} durch {1}").format(_(self.status), frappe.session.user))
            except Exception:  # noqa: BLE001
                pass
        if self.art in ("Urlaub", "Pflegefreistellung") and (not alt or alt.status != self.status or alt.tage != self.tage):
            try:
                from ph_personal.ph_personal.doctype.ph_urlaubsanspruch.ph_urlaubsanspruch import stand_schreiben

                stand_schreiben(self.mitarbeiter)
            except Exception:  # noqa: BLE001
                frappe.log_error(title=f"PH Abwesenheit {self.name}: Urlaubsstand nicht aktualisiert")
        if self.flags.in_insert or (alt and alt.status != self.status and self.status == "Beantragt"):
            self._genehmiger_informieren()

    def _genehmiger_informieren(self):
        """ToDo an die zuständige Person: Leitung (nicht die antragstellende) bzw. Genehmiger für die Leitung."""
        if self.status != "Beantragt":
            return
        try:
            from frappe.desk.form.assign_to import add

            from ph_personal.ph_personal.doctype.ph_personal_einstellungen.ph_personal_einstellungen import einstellungen

            antragsteller = self.antragsteller_user()
            leitung = [u for u in frappe.get_all("Has Role", filters={"role": "PH Personal Leitung", "parenttype": "User"}, pluck="parent") if u not in (antragsteller, "Administrator") and frappe.db.get_value("User", u, "enabled")]
            if not leitung and einstellungen().get("genehmiger_fuer_leitung"):
                leitung = [einstellungen()["genehmiger_fuer_leitung"]]
            if leitung:
                add({"assign_to": leitung[:2], "doctype": self.doctype, "name": self.name, "description": _("Abwesenheit genehmigen: {0}").format(self.titel), "date": nowdate()})
        except Exception:  # noqa: BLE001
            frappe.log_error(title=f"PH Abwesenheit {self.name}: Genehmiger nicht informiert")

    # ── Buttons (ph_abwesenheit.js) ─────────────────────────────────────────

    @frappe.whitelist()
    def stornieren(self):
        """Button „Stornieren“: Antragsteller vor Beginn (auch genehmigt, Workflow-Bedingung), danach nur Leitung."""
        self.check_permission("write")
        if self.status in ("Storniert", "Abgelehnt"):
            return self.status
        if getdate(self.von) <= getdate(nowdate()) and "PH Personal Leitung" not in frappe.get_roles() and frappe.session.user != "Administrator":
            frappe.throw(_("Bereits begonnene Abwesenheiten kann nur die Leitung stornieren – „Früher zurück“ nutzen."))
        self.status = "Storniert"
        self.workflow_state = WORKFLOW_STATE["Storniert"]
        self.save()
        self.add_comment("Info", _("Storniert durch {0}").format(frappe.session.user))
        return self.status

    @frappe.whitelist()
    def verkuerzen(self, neues_bis):
        """Button „Früher zurück …“ (Leitung): Ende vorziehen, auch nach Beginn (vorzeitige Rückkehr)."""
        if "PH Personal Leitung" not in frappe.get_roles() and frappe.session.user != "Administrator":
            frappe.throw(_("Nur die Personal-Leitung kann Abwesenheiten verkürzen."), frappe.PermissionError)
        neues_bis = getdate(neues_bis)
        if neues_bis < getdate(self.von) or neues_bis >= getdate(self.bis):
            frappe.throw(_("Das neue Ende muss zwischen Beginn und bisherigem Ende liegen."))
        self.verkuerzt_von = self.verkuerzt_von or self.bis
        alt_tage = self.tage
        self.bis = neues_bis
        self.save()
        self.add_comment("Info", _("Verkürzt auf {0} ({1} → {2} Tage)").format(frappe.format(neues_bis, {"fieldtype": "Date"}), alt_tage, self.tage))
        return self.tage


def urlaubskonto(mitarbeiter, jahr, ausser=None):
    """Kurzform für Berichte/Buttons: Anspruch des Urlaubsjahres am 1.1. (bzw. Eintritt), Urlaub mit Beginn im
    Kalenderjahr (genommen/beantragt) und Gesamt-Rest aller unverjährten Urlaubsjahre (UrlG)."""
    from ph_personal.ph_personal.urlaubskonto import konto

    ma = frappe.get_cached_doc("PH Mitarbeiter", mitarbeiter)
    stichtag = max(date(int(jahr), 1, 1), getdate(ma.eintritt)) if ma.eintritt else date(int(jahr), 1, 1)
    k = konto(mitarbeiter, stichtag if stichtag.year == int(jahr) else date(int(jahr), 12, 31), ausser=ausser)
    rows = frappe.get_all(
        "PH Abwesenheit",
        filters={"mitarbeiter": mitarbeiter, "art": "Urlaub", "status": ("in", BLOCKIEREND), "von": ("between", [date(int(jahr), 1, 1), date(int(jahr), 12, 31)]), "name": ("!=", ausser or "")},
        fields=["status", "tage"],
    )
    genommen = sum(flt(r.tage) for r in rows if r.status == "Genehmigt")
    beantragt = sum(flt(r.tage) for r in rows if r.status == "Beantragt")
    return {
        "mitarbeiter": mitarbeiter,
        "jahr": cint(jahr),
        "anspruch": k["anspruch"],
        "genommen": genommen,
        "beantragt": beantragt,
        "rest": k["rest_nach_antraegen"],
        "jahre": k["jahre"],
        "naechste_verjaehrung": k["naechste_verjaehrung"],
        "hinweis": k["hinweis"],
    }


def darf_art_sehen(user=None):
    """Leitung/Geschäftsführung sehen die Art jeder Abwesenheit; alle anderen nur öffentliche Arten."""
    rollen = set(frappe.get_roles(user))
    return bool(rollen & {"PH Personal Leitung", "PH Geschäftsführung", "System Manager"})


def art_oeffentlich(art, voll=False):
    return art if voll or art in OEFFENTLICHE_ARTEN else _("abwesend")


def heute_abwesend(datum=None):
    """Genehmigte Abwesenheiten und Krankmeldungen am Tag; Art nur für Leitung/GF (Fachkritik D3)."""
    datum = getdate(datum or nowdate())
    voll = darf_art_sehen()
    rows = frappe.get_all("PH Abwesenheit", filters={"status": "Genehmigt", "von": ("<=", datum), "bis": (">=", datum)}, fields=["mitarbeiter", "mitarbeiter_name", "art", "bis"])
    out = [{**r, "art": art_oeffentlich(r.art, voll)} for r in rows]
    if frappe.db.exists("DocType", "PH Krankmeldung"):
        for k in frappe.get_all("PH Krankmeldung", filters={"status": ("in", ["Gemeldet", "Bestaetigt", "Beendet"]), "von": ("<=", datum)}, fields=["mitarbeiter", "mitarbeiter_name", "bis", "bis_voraussichtlich", "bis_offen"]):
            ende = getdate(k.bis or (k.bis_voraussichtlich if not k.bis_offen else None) or datum)
            if ende >= datum:
                out.append({"mitarbeiter": k.mitarbeiter, "mitarbeiter_name": k.mitarbeiter_name, "art": art_oeffentlich("Krankenstand", voll), "bis": k.bis or k.bis_voraussichtlich})
    return out


def offene_antraege():
    return frappe.db.count("PH Abwesenheit", {"status": "Beantragt"})
