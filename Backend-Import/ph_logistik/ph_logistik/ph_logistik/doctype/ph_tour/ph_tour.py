"""PH Tour – Liefer-/Montagetour (Vorbild SHD mex: Reihenfolge, Zeitfenster, Navigation-Link, Fotos, Unterschrift, Lieferbestätigung)."""

from urllib.parse import quote

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import now_datetime

from ph_logistik.ph_logistik import tour_logik as tl
from ph_logistik.ph_logistik.helfer import einstellungen, mail_senden, setze_status

ENDE = ("erledigt", "nicht angetroffen", "verschoben")


def maps_link(adressen):
    """Google-Maps-Richtungslink: Start … Stopps in Reihenfolge (keine eingebaute Navigation)."""
    teile = [quote(a) for a in adressen if a]
    if len(teile) < 1:
        return None
    if len(teile) == 1:
        return f"https://www.google.com/maps/dir/?api=1&destination={teile[0]}"
    return f"https://www.google.com/maps/dir/?api=1&origin={teile[0]}&destination={teile[-1]}" + (f"&waypoints={'%7C'.join(teile[1:-1])}" if len(teile) > 2 else "")


def stopp_adresse(s):
    return ", ".join(x for x in ((s.adresse or "").replace("\n", ", "), f"{s.plz or ''} {s.ort or ''}".strip(), s.land or "") if x)


class PHTour(Document):
    def validate(self):
        self.stopps.sort(key=lambda s: (int(s.reihenfolge or 0), s.idx))
        for i, s in enumerate(self.stopps, start=1):
            s.reihenfolge = i
            if s.lieferschein and not (s.kunde_name and s.plz):
                ls = frappe.db.get_value("PH Lieferschein", s.lieferschein, ["kunde_name", "liefer_name", "liefer_strasse", "liefer_hausnr", "liefer_plz", "liefer_ort", "liefer_land", "liefer_telefon", "kontakt", "lieferhinweis"], as_dict=True)
                if ls:
                    s.kunde_name = s.kunde_name or ls.kunde_name or ls.liefer_name
                    s.adresse = s.adresse or f"{ls.liefer_strasse or ''} {ls.liefer_hausnr or ''}".strip()
                    s.plz, s.ort, s.land = s.plz or ls.liefer_plz, s.ort or ls.liefer_ort, s.land or ls.liefer_land
                    s.telefon = s.telefon or ls.liefer_telefon
                    s.kontakt = s.kontakt or ls.kontakt
                    s.notiz = s.notiz or ls.lieferhinweis
            s.navigation_url = maps_link([stopp_adresse(s)])
        start = self._startadresse()
        self.route_url = maps_link([start] + [stopp_adresse(s) for s in self.stopps]) if self.stopps else None
        self.anzahl_stopps = len(self.stopps)
        self.anzahl_erledigt = sum(1 for s in self.stopps if s.status in ENDE)
        self._eta_berechnen()
        fahrer = frappe.db.get_value("User", self.fahrer, "full_name") if self.fahrer else ""
        self.titel = f"Tour {frappe.utils.formatdate(self.datum)} {self.region or ''} {fahrer or ''} ({self.anzahl_stopps} Stopps)".replace("  ", " ")[:140]

    def _eta_berechnen(self):
        """Geplante Ankunft je Stopp aus Startzeit, Fahrzeit und Dauer (tour_logik.eta); Konflikt, wenn das Fenster nicht haltbar ist."""
        e = einstellungen()
        for s in self.stopps:
            if not tl.zeitfenster_ok(s.zeitfenster_von, s.zeitfenster_bis):
                frappe.throw(_("Stopp {0}: Zeitfenster „von“ muss vor „bis“ liegen.").format(s.reihenfolge))
        plan = tl.eta(self.start_zeit or "08:00", [s.as_dict() for s in self.stopps], int(e.get("fahrt_min_standard") or 30), int(e.get("stopp_dauer_min_standard") or 30))
        je = {p["reihenfolge"]: p for p in plan}
        konflikte = []
        for s in self.stopps:
            p = je.get(s.reihenfolge)
            if not p:
                continue
            s.eta = p["beginn"]
            s.zeitfenster_konflikt = int(not p["im_fenster"])
            if s.zeitfenster_konflikt and s.status not in ENDE:
                konflikte.append(str(s.reihenfolge))
        if konflikte:
            frappe.msgprint(_("Zeitfenster bei Stopp {0} voraussichtlich nicht haltbar – Reihenfolge oder Startzeit prüfen.").format(", ".join(konflikte)), indicator="orange", alert=True)

    def _verschiebung_melden(self):
        """Termin eines bereits avisierten Stopps verschoben (Tourdatum oder Zeitfenster) → Kunde mit Vorlage „Terminänderung“
        informieren (Einstellung avis_bei_verschiebung). Fehler nur protokollieren."""
        try:
            alt = self.get_doc_before_save()
            if not alt or not einstellungen().get("avis_bei_verschiebung") or self.status in ("Abgeschlossen", "Abgebrochen"):
                return
            alte = {s.name: s.as_dict() for s in alt.stopps}
            betroffen = [s.name for s in self.stopps if s.name in alte and s.avis_gesendet_am and s.status not in ENDE and tl.verschoben(alte[s.name], s.as_dict(), alt.datum, self.datum)]
            if betroffen:
                kanal = "beide" if einstellungen().get("avis_sms_aktiv") else "mail"
                r = self.avis_senden(kanal=kanal, stopps=betroffen, nur_neu=0, aenderung=1)
                self.add_comment("Info", _("Terminänderung an Kunden gemeldet: {0}").format(", ".join(f"Stopp {x['stopp']} ({x['kanal']}: {'ok' if x['ok'] else x.get('grund') or 'Fehler'})" for x in r)))
        except Exception:  # noqa: BLE001
            frappe.log_error(title=f"PH Tour {self.name}: Terminänderung melden")

    def _startadresse(self):
        e = einstellungen()
        if self.start_lagerort:
            lo = frappe.db.get_value("PH Lagerort", self.start_lagerort, ["strasse", "plz", "ort", "land"], as_dict=True)
            if lo and lo.plz:
                return f"{lo.strasse or ''}, {lo.plz} {lo.ort}, {lo.land or 'AT'}"
        return f"{e.get('absender_strasse') or ''} {e.get('absender_hausnr') or ''}, {e.get('absender_plz') or ''} {e.get('absender_ort') or ''}, {e.get('absender_land') or 'AT'}"

    def on_update(self):
        self._verschiebung_melden()
        for s in self.stopps:
            if s.lieferschein:
                try:
                    frappe.db.set_value("PH Lieferschein", s.lieferschein, "tour", self.name, update_modified=False)
                except Exception:  # noqa: BLE001
                    pass

    # ── Buttons ───────────────────────────────────────────────────────────
    @frappe.whitelist()
    def stopps_hinzufuegen(self, lieferscheine=None, datum_von=None, datum_bis=None, plz_prefix=None):
        """Lieferscheine (Eigenlieferung/Spedition, Gepackt, ohne Tour) als Stopps anhängen – per Liste oder Filter."""
        self.check_permission("write")
        if isinstance(lieferscheine, str):
            lieferscheine = frappe.parse_json(lieferscheine)
        if not lieferscheine:
            filt = {"lieferart": ("in", ["Eigenlieferung", "Spedition"]), "status": ("in", ["Gepackt", "Entwurf"]), "tour": ("is", "not set")}
            if datum_von and datum_bis:
                filt["wunschtermin"] = ("between", [datum_von, datum_bis])
            if plz_prefix:
                filt["liefer_plz"] = ("like", f"{plz_prefix}%")
            lieferscheine = frappe.get_all("PH Lieferschein", filt, pluck="name", order_by="liefer_plz")
        vorhanden = {s.lieferschein for s in self.stopps}
        n = 0
        for ls in lieferscheine:
            if ls in vorhanden:
                continue
            self.append("stopps", {"reihenfolge": len(self.stopps) + 1, "art": "Lieferung", "lieferschein": ls, "status": "offen"})
            n += 1
        self.save()
        return n

    @frappe.whitelist()
    def reihenfolge_optimieren(self):
        """Einfach: nach PLZ sortieren (keine Routenoptimierung eingebaut)."""
        self.check_permission("write")
        self.stopps.sort(key=lambda s: (str(s.plz or "99999"), s.zeitfenster_von or ""))
        for i, s in enumerate(self.stopps, start=1):
            s.reihenfolge = i
        self.save()
        return [s.lieferschein or s.kunde_name for s in self.stopps]

    @frappe.whitelist()
    def freigeben(self):
        self.check_permission("write")
        if not self.stopps:
            frappe.throw(_("Tour ohne Stopps kann nicht freigegeben werden."))
        if not self.fahrer:
            frappe.throw(_("Bitte Fahrer eintragen."))
        setze_status(self, "Freigegeben", freigegeben_von=frappe.session.user)
        return self.status

    @frappe.whitelist()
    def starten(self, km_start=None):
        self.check_permission("write")
        if self.status not in ("Geplant", "Freigegeben"):
            frappe.throw(_("Tour ist nicht freigegeben."))
        werte = {"gestartet_am": now_datetime()}
        if km_start is not None:
            werte["km_start"] = int(km_start)
        setze_status(self, "Unterwegs", **werte)
        for s in self.stopps:
            if s.lieferschein:
                ls = frappe.get_doc("PH Lieferschein", s.lieferschein)
                if ls.status == "Gepackt":
                    setze_status(ls, "Uebergeben", uebergeben_am=now_datetime(), uebergeben_an="Fahrer")
        return self.status

    @frappe.whitelist()
    def stopp_status(self, stopp, status, notiz=None, unterschrift=None, unterschrift_name=None, idempotency_key=None):
        """Mobil: Stopp-Status setzen (unterwegs/erledigt/nicht angetroffen/verschoben); erledigt → Lieferschein Zugestellt."""
        self.check_permission("write")
        if idempotency_key:
            from ph_logistik.ph_logistik.helfer import idempotent

            return idempotent(f"stopp:{self.name}:{idempotency_key}", lambda: self.stopp_status(stopp, status, notiz, unterschrift, unterschrift_name))
        for s in self.stopps:
            if s.name == stopp or str(s.reihenfolge) == str(stopp):
                jetzt = now_datetime()
                if status == "unterwegs":
                    s.ankunft = s.ankunft or jetzt
                if status in ENDE:
                    s.ankunft = s.ankunft or jetzt
                    s.abfahrt = jetzt
                s.status = status
                if notiz:
                    s.notiz = ((s.notiz or "") + "\n" + notiz).strip()
                if unterschrift:
                    s.unterschrift = unterschrift
                    s.unterschrift_name = unterschrift_name
                self.save()
                if status == "erledigt" and s.lieferschein:
                    ls = frappe.get_doc("PH Lieferschein", s.lieferschein)
                    if ls.status in ("Gepackt", "Uebergeben"):
                        ls.als_zugestellt(empfaenger_name=unterschrift_name, unterschrift=unterschrift)
                return {"status": s.status, "erledigt": self.anzahl_erledigt, "stopps": self.anzahl_stopps}
        frappe.throw(_("Stopp nicht gefunden."))

    @frappe.whitelist()
    def foto_hinzufuegen(self, stopp_nr, file_url, art="nachher", hinweis=None):
        self.check_permission("write")
        if any(int(f.stopp_nr or 0) == int(stopp_nr) and f.foto == file_url for f in self.fotos):
            return len(self.fotos)  # doppelte Übertragung (Offline-Puffer) ignorieren
        self.append("fotos", {"stopp_nr": int(stopp_nr), "foto": file_url, "art": art, "zeit": now_datetime(), "hinweis": hinweis})
        self.save()
        return len(self.fotos)

    @frappe.whitelist()
    def lieferbestaetigung_senden(self, stopp):
        self.check_permission("write")
        for s in self.stopps:
            if s.name == stopp or str(s.reihenfolge) == str(stopp):
                if not s.lieferschein:
                    frappe.throw(_("Stopp ohne Lieferschein."))
                ok = frappe.get_doc("PH Lieferschein", s.lieferschein).lieferbestaetigung_senden()
                if ok:
                    s.bestaetigung_gesendet_am = now_datetime()
                    self.save()
                return ok
        frappe.throw(_("Stopp nicht gefunden."))

    @frappe.whitelist()
    def stopp_entfernen(self, stopp):
        """Stopp aus der Tour nehmen; der Lieferschein verliert die Tour-Zuordnung (wieder planbar)."""
        self.check_permission("write")
        if self.status in ("Abgeschlossen", "Abgebrochen"):
            frappe.throw(_("Tour ist abgeschlossen."))
        for s in list(self.stopps):
            if s.name == stopp or str(s.reihenfolge) == str(stopp):
                if s.status in ENDE:
                    frappe.throw(_("Erledigte Stopps bleiben in der Tour."))
                ls = s.lieferschein
                self.remove(s)
                self.save()
                if ls and frappe.db.get_value("PH Lieferschein", ls, "tour") == self.name:
                    frappe.db.set_value("PH Lieferschein", ls, "tour", None, update_modified=False)
                return len(self.stopps)
        frappe.throw(_("Stopp nicht gefunden."))

    @frappe.whitelist()
    def avis_senden(self, kanal="mail", stopps=None, nur_neu=1, aenderung=0):
        """Kundeninfo vor der Lieferung (Avis): Zeitfenster bzw. geplante Ankunft ±1 h, Fahrzeug, Hinweise; de/en/fr/it.
        kanal mail|sms|beide. Mail über ph_core (Testmodus-Umleitung), SMS nur mit eingerichteten Frappe „SMS Settings“
        und Schalter avis_sms_aktiv – sonst wird der SMS-Text nur protokolliert. → [{stopp, kanal, ok, grund?, text}]"""
        self.check_permission("write")
        if kanal not in ("mail", "sms", "beide"):
            frappe.throw(_("Kanal: mail, sms oder beide."))
        if isinstance(stopps, str):
            stopps = frappe.parse_json(stopps)
        e = einstellungen()
        fahrzeug = ""
        if self.fahrzeug:
            fz = frappe.db.get_value("PH Fahrzeug", self.fahrzeug, ["bezeichnung", "kennzeichen"], as_dict=True) or {}
            fahrzeug = " ".join(x for x in (fz.get("bezeichnung"), fz.get("kennzeichen")) if x)
        telefon = e.get("absender_telefon") or ""
        ergebnis = []
        for s in self.stopps:
            if stopps and s.name not in stopps and str(s.reihenfolge) not in [str(x) for x in stopps]:
                continue
            if s.status in ENDE or (int(nur_neu or 0) and s.avis_gesendet_am):
                continue
            ls = frappe.db.get_value("PH Lieferschein", s.lieferschein, ["kunde_email", "liefer_email", "kunde_telefon", "liefer_telefon", "sprache", "name"], as_dict=True) if s.lieferschein else None
            ls = ls or {}
            sprache = ls.get("sprache") or "de"
            daten = {
                "name": s.kunde_name, "datum": tl.datum_text(self.datum, sprache), "von": str(s.zeitfenster_von or "")[:5] or None, "bis": str(s.zeitfenster_bis or "")[:5] or None,
                "eta": str(s.eta or "")[:5] or None, "art": s.art, "fahrzeug": fahrzeug, "telefon": telefon, "referenz": s.lieferschein,
            }
            t = tl.avis_text(sprache, daten, aenderung=bool(int(aenderung or 0)))
            gesendet = []
            if kanal in ("mail", "beide"):
                empf = ls.get("kunde_email") or ls.get("liefer_email")
                if not empf and s.kontakt and frappe.db.exists("DocType", "PH Kontakt"):
                    empf = frappe.db.get_value("PH Kontakt", s.kontakt, "email")
                if not empf:
                    ergebnis.append({"stopp": s.reihenfolge, "kanal": "mail", "ok": False, "grund": "keine E-Mail"})
                else:
                    from ph_logistik.ph_logistik.doctype.ph_lieferschein.ph_lieferschein import _vorlage

                    vorlage = e.get("avis_aenderung_vorlage") if int(aenderung or 0) else e.get("avis_vorlage")
                    html = (_vorlage(vorlage, frappe._dict({**daten, "stopp": s.as_dict(), "tour": self.name})) if vorlage else None) or t["html"]
                    ok = mail_senden(empf, t["betreff"], html, "PH Tour", self.name)
                    ergebnis.append({"stopp": s.reihenfolge, "kanal": "mail", "ok": ok, "text": t["text"]})
                    if ok:
                        gesendet.append("mail")
            if kanal in ("sms", "beide"):
                nr = tl.telefon_normalisieren(s.telefon or ls.get("kunde_telefon") or ls.get("liefer_telefon"))
                ok, grund = _sms(nr, t["sms"]) if e.get("avis_sms_aktiv") else (False, "SMS nicht aktiviert")
                ergebnis.append({"stopp": s.reihenfolge, "kanal": "sms", "ok": ok, "grund": grund, "text": t["sms"]})
                if ok:
                    gesendet.append("sms")
                else:
                    self.add_comment("Info", _("SMS-Avis Stopp {0} nicht gesendet ({1}): {2}").format(s.reihenfolge, grund, t["sms"]))
            if gesendet:
                # db_set statt save: avis_senden läuft auch aus on_update (Terminverschiebung) – keine Rekursion
                s.db_set({"avis_gesendet_am": now_datetime(), "avis_kanal": "+".join(gesendet) + (" (Änderung)" if int(aenderung or 0) else "")}, update_modified=False)
        return ergebnis

    @frappe.whitelist()
    def abschliessen(self, km_ende=None):
        self.check_permission("write")
        offen = [s.reihenfolge for s in self.stopps if s.status not in ENDE]
        if offen:
            frappe.throw(_("Offene Stopps: {0}").format(", ".join(map(str, offen))))
        werte = {"abgeschlossen_am": now_datetime()}
        if km_ende is not None:
            werte["km_ende"] = int(km_ende)
        setze_status(self, "Abgeschlossen", **werte)
        return self.status

    @frappe.whitelist()
    def abbrechen(self, grund=None):
        self.check_permission("write")
        setze_status(self, "Abgebrochen", notiz=((self.notiz or "") + "\n" + (grund or "")).strip())
        for s in self.stopps:
            if s.lieferschein:
                frappe.db.set_value("PH Lieferschein", s.lieferschein, "tour", None, update_modified=False)
        return self.status


def _sms(nummer, text):
    """SMS über Frappe „SMS Settings“ (Gateway des Betriebs). → (ok, grund). Kein eigener Anbieter im Repo."""
    if not nummer:
        return False, "keine Mobilnummer"
    try:
        if not frappe.db.get_single_value("SMS Settings", "sms_gateway_url"):
            return False, "SMS Settings nicht eingerichtet"
        from frappe.core.doctype.sms_settings.sms_settings import send_sms

        send_sms([nummer], text, success_msg=False)
        return True, None
    except Exception:  # noqa: BLE001
        frappe.log_error(title="ph_logistik: SMS-Avis")
        return False, "Versand fehlgeschlagen"


@frappe.whitelist()
def plantafel(von, bis):
    """Aggregat für die Plantafel (ein Aufruf statt n+1): Touren mit Stopps, Fahrzeuge, ungeplante Lieferscheine,
    Speditionsaufträge und Ressourcen-Doppelbelegungen (Fahrzeug/Fahrer am selben Tag)."""
    frappe.has_permission("PH Tour", "read", throw=True)
    touren = frappe.get_all("PH Tour", {"datum": ("between", [von, bis]), "status": ("!=", "Abgebrochen")}, ["name", "titel", "status", "datum", "fahrzeug", "fahrer", "region", "start_zeit", "anzahl_stopps", "anzahl_erledigt"], order_by="datum, start_zeit")
    stopps = frappe.get_all("PH Tour Stopp", {"parent": ("in", [t.name for t in touren] or ["-"]), "parenttype": "PH Tour"}, ["parent", "name", "reihenfolge", "art", "lieferschein", "kunde_name", "plz", "ort", "zeitfenster_von", "zeitfenster_bis", "eta", "zeitfenster_konflikt", "status", "avis_gesendet_am"], order_by="parent, reihenfolge")
    je = {}
    for s in stopps:
        je.setdefault(s.parent, []).append(s)
    belegung = []
    for t in touren:
        t["stopps"] = je.get(t.name, [])
        for res in (t.fahrzeug, t.fahrer):
            if res:
                belegung.append({"ref": t.name, "ressource": res, "datum": t.datum, "von": None, "bis": None})
    offen = frappe.get_all("PH Lieferschein", {"lieferart": ("in", ["Eigenlieferung", "Spedition"]), "status": ("in", ["Entwurf", "Gepackt"]), "tour": ("is", "not set")}, ["name", "titel", "status", "lieferart", "kunde_name", "liefer_plz", "liefer_ort", "wunschtermin", "gesamtgewicht_g", "kommission"], order_by="wunschtermin, liefer_plz", limit=300)
    spedition = frappe.get_all("PH Speditionsauftrag", {"status": ("not in", ["Storniert", "Zugestellt"]), "zustell_datum": ("between", [von, bis])}, ["name", "titel", "status", "richtung", "spediteur", "abhol_datum", "zustell_datum", "lademeter", "gewicht_g"], order_by="zustell_datum")
    fahrzeuge = frappe.get_all("PH Fahrzeug", {"aktiv": 1}, ["name", "bezeichnung", "art", "zuladung_kg", "ladevolumen_m3"])
    return {"touren": touren, "ungeplant": offen, "spedition": spedition, "fahrzeuge": fahrzeuge, "doppelbelegung": tl.ueberschneidungen(belegung)}


def _feiertage(von, bis):
    """Feiertage/Betriebsruhe aus ph_core (Site-Konfiguration); ohne ph_core leer."""
    try:
        from ph_core.utils.feiertage import feiertage_site

        tage = set()
        for jahr in range(von.year, bis.year + 1):
            tage |= set(feiertage_site(jahr).keys())
        return tage
    except Exception:  # noqa: BLE001
        return set()


@frappe.whitelist()
def liefertermine_vorschlagen(dauer_min, plz=None, ab=None, monteure=1, gewicht_g=0, volumen_m3=0, anzahl=5, montage_min=0):
    """Liefertermin-Generator über alle aktiven Fahrzeuge: Terminvorschläge (Datum, Fahrzeug, bestehende/neue Tour, Zeitfenster).
    dauer_min = Liefer-/Abladezeit, montage_min = Montagezeit (Wandzeit mit `monteure` Personen); ab = frühestes Datum
    (z. B. „Ware komplett“, Standard morgen). Beachtet Tageskapazität, Arbeitsbeginn, bestehende Stopps, Zuladung/Volumen,
    Feiertage (ph_core) und Wochenende. Logik: tour_logik.termine_vorschlagen."""
    frappe.has_permission("PH Tour", "read", throw=True)
    from frappe.utils import add_days, getdate, nowdate

    e = einstellungen()
    start = getdate(ab) if ab else getdate(add_days(nowdate(), 1))
    tage = int(e.get("vorschlag_tage_max") or 30)
    ende = getdate(add_days(start, tage))
    fahrzeuge = frappe.get_all("PH Fahrzeug", {"aktiv": 1}, ["name", "bezeichnung", "zuladung_kg", "ladevolumen_m3"])
    touren = frappe.get_all("PH Tour", {"datum": ("between", [start, ende]), "status": ("not in", ["Abgebrochen"])}, ["name", "datum", "fahrzeug", "status"])
    namen = [t.name for t in touren] or ["-"]
    stopps = frappe.get_all("PH Tour Stopp", {"parent": ("in", namen), "parenttype": "PH Tour"}, ["parent", "plz", "fahrt_min", "dauer_min", "montage_min", "lieferschein"])
    team = frappe.get_all("PH Tour Team", {"parent": ("in", namen), "parenttype": "PH Tour"}, ["parent"])
    ls_gewicht = {r.name: int(r.gesamtgewicht_g or 0) for r in frappe.get_all("PH Lieferschein", {"name": ("in", [s.lieferschein for s in stopps if s.lieferschein] or ["-"])}, ["name", "gesamtgewicht_g"])}
    for t in touren:
        t["stopps"] = [s for s in stopps if s.parent == t.name]
        t["team_anzahl"] = sum(1 for x in team if x.parent == t.name) or None
        t["gewicht_g"] = sum(ls_gewicht.get(s.lieferschein, 0) for s in t["stopps"])
    vorschlaege = tl.termine_vorschlagen(
        int(dauer_min or 0) + int(montage_min or 0), start, fahrzeuge, touren, feiertage=_feiertage(start, ende),
        tageskapazitaet_min=int(e.get("tageskapazitaet_min") or 480), arbeitsbeginn=str(e.get("arbeitsbeginn") or "07:30")[:5],
        plz=plz, monteure=int(monteure or 1), gewicht_g=int(gewicht_g or 0), volumen_m3=float(volumen_m3 or 0), anzahl=int(anzahl or 5),
        tage_max=tage, samstag=bool(e.get("tour_samstag")), fahrt_min_standard=int(e.get("fahrt_min_standard") or 30), dauer_min_standard=int(e.get("stopp_dauer_min_standard") or 30),
    )
    for v in vorschlaege:
        v["datum"] = str(v["datum"])
    return vorschlaege


@frappe.whitelist()
def stopp_einplanen(vorschlag, lieferschein=None, montage_referenz=None, art=None, dauer_min=None, montage_min=None, kunde_name=None, adresse=None, plz=None, ort=None, telefon=None, zeitfenster_von=None, zeitfenster_bis=None):
    """Vorschlag aus liefertermine_vorschlagen übernehmen: Stopp an bestehende Tour hängen oder neue Tour (Datum, Fahrzeug,
    Arbeitsbeginn) anlegen. Zeitfenster Standard = Vorschlag von/bis. → {tour, stopp, reihenfolge}"""
    frappe.has_permission("PH Tour", "write", throw=True)
    if isinstance(vorschlag, str):
        vorschlag = frappe.parse_json(vorschlag)
    if not (lieferschein or montage_referenz or (plz and ort)):
        frappe.throw(_("Lieferschein, Montage-Referenz oder Adresse (PLZ, Ort) angeben."))
    if vorschlag.get("tour"):
        t = frappe.get_doc("PH Tour", vorschlag["tour"])
        if t.status in ("Abgeschlossen", "Abgebrochen", "Unterwegs"):
            frappe.throw(_("Tour {0} ist nicht mehr planbar – bitte neue Vorschläge holen.").format(t.name))
    else:
        t = frappe.get_doc({"doctype": "PH Tour", "datum": vorschlag["datum"], "fahrzeug": vorschlag.get("fahrzeug"), "start_zeit": str(einstellungen().get("arbeitsbeginn") or "07:30")[:5]})
        if t.fahrzeug:
            t.fahrer = frappe.db.get_value("PH Fahrzeug", t.fahrzeug, "standard_fahrer")
    if lieferschein and any(s.lieferschein == lieferschein for s in t.stopps):
        frappe.throw(_("Lieferschein {0} ist bereits in dieser Tour.").format(lieferschein))
    t.append("stopps", {
        "reihenfolge": len(t.stopps) + 1, "art": art or ("Montage" if montage_min and not lieferschein else "Lieferung"), "lieferschein": lieferschein,
        "montage_referenz": montage_referenz, "kunde_name": kunde_name, "adresse": adresse, "plz": plz, "ort": ort, "telefon": telefon,
        "dauer_min": dauer_min, "montage_min": montage_min, "status": "offen",
        "zeitfenster_von": zeitfenster_von or vorschlag.get("von"), "zeitfenster_bis": zeitfenster_bis or vorschlag.get("bis"),
    })
    if t.is_new():
        t.insert()
    else:
        t.save()
    s = t.stopps[-1]
    return {"tour": t.name, "stopp": s.name, "reihenfolge": s.reihenfolge, "eta": str(s.eta or "")[:5]}
