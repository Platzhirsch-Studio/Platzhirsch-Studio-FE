"""PH Tour – Liefer-/Montagetour (Vorbild SHD mex: Reihenfolge, Zeitfenster, Navigation-Link, Fotos, Unterschrift, Lieferbestätigung)."""

from urllib.parse import quote

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import now_datetime

from ph_logistik.ph_logistik.helfer import einstellungen, setze_status

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
        fahrer = frappe.db.get_value("User", self.fahrer, "full_name") if self.fahrer else ""
        self.titel = f"Tour {frappe.utils.formatdate(self.datum)} {self.region or ''} {fahrer or ''} ({self.anzahl_stopps} Stopps)".replace("  ", " ")[:140]

    def _startadresse(self):
        e = einstellungen()
        if self.start_lagerort:
            lo = frappe.db.get_value("PH Lagerort", self.start_lagerort, ["strasse", "plz", "ort", "land"], as_dict=True)
            if lo and lo.plz:
                return f"{lo.strasse or ''}, {lo.plz} {lo.ort}, {lo.land or 'AT'}"
        return f"{e.get('absender_strasse') or ''} {e.get('absender_hausnr') or ''}, {e.get('absender_plz') or ''} {e.get('absender_ort') or ''}, {e.get('absender_land') or 'AT'}"

    def on_update(self):
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
    def stopp_status(self, stopp, status, notiz=None, unterschrift=None, unterschrift_name=None):
        """Mobil: Stopp-Status setzen (unterwegs/erledigt/nicht angetroffen/verschoben); erledigt → Lieferschein Zugestellt."""
        self.check_permission("write")
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
