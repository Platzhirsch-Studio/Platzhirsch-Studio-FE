"""Scheduler (hooks.py, Europe/Vienna): Fristenwarnung, Reaktionsfrist, Eskalation, Wartungserinnerungen, Wochenübersicht.
Alle Funktionen idempotent, commit je Einheit, Fehler nur protokolliert (CONVENTIONS 13)."""

import frappe
from frappe import _
from frappe.utils import add_days, getdate, now_datetime, nowdate, today

from ph_service.ph_service import fristen as fr
from ph_service.ph_service import kommunikation as kom
from ph_service.ph_service import pflege_logik as logik
from ph_service.ph_service.doctype.ph_service_einstellungen.ph_service_einstellungen import einstellungen
from ph_service.ph_service.doctype.ph_servicefall.ph_servicefall import OFFEN, ohne_bewegung, ueberfaellige_reaktion

MARKETING_APP = "ph_marketing"


# ── Helfer ──────────────────────────────────────────────────────────────────


def _leitung_benutzer():
    einst = einstellungen()
    if einst.get("eskalation_an"):
        return [einst["eskalation_an"]]
    rows = frappe.get_all("Has Role", filters={"role": "PH Service Leitung", "parenttype": "User"}, fields=["parent"])
    users = [r.parent for r in rows if r.parent not in ("Administrator", "Guest") and frappe.db.get_value("User", r.parent, "enabled")]
    return users or ["Administrator"]


def _todo(user, doctype, name, text, datum=None, prioritaet="Medium", schluessel=None):
    """ToDo nur einmal je Schlüssel (offen)."""
    schluessel = schluessel or text[:60]
    if frappe.db.exists("ToDo", {"reference_type": doctype, "reference_name": name, "status": "Open", "description": ("like", f"%{schluessel}%")}):
        return False
    frappe.get_doc({"doctype": "ToDo", "allocated_to": user, "reference_type": doctype, "reference_name": name, "description": text, "date": datum or today(), "priority": prioritaet}).insert(ignore_permissions=True)
    return True


# ── Fristen ─────────────────────────────────────────────────────────────────


def fristen_pruefen():
    """Täglich: Gewährleistung läuft ab (offene Fälle), Regressfrist, Reaktionsfrist überschritten."""
    einst = einstellungen()
    heute = getdate(nowdate())
    tage = int(einst["fristwarnung_tage"])
    leitung = _leitung_benutzer()

    # 1) Gewährleistung läuft in den nächsten N Tagen ab (offene Fälle) → ToDo an Verantwortlichen
    faelle = frappe.get_all("PH Servicefall", filters={"status": ("in", OFFEN), "gewaehrleistung_bis": ("between", [heute, add_days(heute, tage)]), "fristwarnung_gesendet": ("is", "not set")}, fields=["name", "titel", "verantwortlich", "gewaehrleistung_bis"])
    for f in faelle:
        try:
            rest = fr.tage_bis(f.gewaehrleistung_bis, heute)
            text = _("Fristwarnung: Gewährleistung endet in {0} Tagen ({1}) – Fall vorher abschließen oder Hemmung/Anerkenntnis dokumentieren: {2}").format(rest, frappe.utils.formatdate(f.gewaehrleistung_bis), f.titel)
            _todo(f.verantwortlich or leitung[0], "PH Servicefall", f.name, text, prioritaet="High", schluessel="Fristwarnung: Gewährleistung")
            doc = frappe.get_doc("PH Servicefall", f.name)
            kom.verlauf(doc, "Frist", hinweis=text[:300], speichern=True)
            frappe.db.set_value("PH Servicefall", f.name, "fristwarnung_gesendet", heute, update_modified=False)
            frappe.db.commit()
        except Exception:  # noqa: BLE001
            frappe.db.rollback()
            frappe.log_error(title=f"ph_service.fristen_pruefen {f.name}")

    # 2) Regress: offen (noch nicht gemeldet), Frist endet in ≤ 14 Tagen oder ist vorbei
    regresse = frappe.get_all("PH Lieferantenregress", filters={"status": "Offen", "frist_bis": ("<=", add_days(heute, 14))}, fields=["name", "titel", "frist_bis", "servicefall"])
    for r in regresse:
        try:
            rest = fr.tage_bis(r.frist_bis, heute)
            text = _("Regressfrist § 933b ABGB: {0} – {1}").format(_("abgelaufen") if rest < 0 else _("noch {0} Tage").format(rest), r.titel)
            for u in leitung:
                _todo(u, "PH Lieferantenregress", r.name, text, prioritaet="High", schluessel="Regressfrist § 933b")
            frappe.db.commit()
        except Exception:  # noqa: BLE001
            frappe.db.rollback()
            frappe.log_error(title=f"ph_service.fristen_pruefen Regress {r.name}")

    # 3) Reaktionsfrist überschritten (Status Gemeldet, keine Erstreaktion)
    for f in ueberfaellige_reaktion(heute):
        try:
            text = _("Reaktionsfrist {0} überschritten – Kunde noch nicht kontaktiert: {1}").format(frappe.utils.formatdate(f.frist_reaktion), f.titel)
            _todo(f.verantwortlich or leitung[0], "PH Servicefall", f.name, text, prioritaet="High", schluessel="Reaktionsfrist")
            frappe.db.commit()
        except Exception:  # noqa: BLE001
            frappe.db.rollback()
            frappe.log_error(title=f"ph_service.fristen_pruefen Reaktion {f.name}")


# ── Eskalation ──────────────────────────────────────────────────────────────


def eskalation():
    """Täglich: offene Fälle ohne Bewegung > N Tage → Stufe +1, Priorität hoch, ToDo an Leitung (einmal je Fenster)."""
    einst = einstellungen()
    tage = int(einst["eskalation_tage"])
    grenze = add_days(now_datetime(), -tage)
    leitung = _leitung_benutzer()
    for f in ohne_bewegung(tage):
        try:
            eskaliert_am = frappe.db.get_value("PH Servicefall", f.name, "eskaliert_am")
            if eskaliert_am and eskaliert_am > grenze:
                continue
            stufe = int(f.eskalationsstufe or 0) + 1
            prio = "Hoch" if stufe == 1 else "Dringend"
            text = _("Eskalation Stufe {0}: {1} Tage ohne Bewegung – {2}").format(stufe, tage, f.titel)
            frappe.db.set_value("PH Servicefall", f.name, {"eskalationsstufe": stufe, "eskaliert_am": now_datetime(), "prioritaet": prio}, update_modified=False)
            empfaenger = set(leitung)
            if f.verantwortlich:
                empfaenger.add(f.verantwortlich)
            for u in empfaenger:
                _todo(u, "PH Servicefall", f.name, text, prioritaet="High", schluessel=f"Eskalation Stufe {stufe}")
            # Verlaufszeile direkt einfügen – letzte_bewegung bleibt unverändert (Eskalation ist keine Bearbeitung).
            status = frappe.db.get_value("PH Servicefall", f.name, "status")
            idx = frappe.db.count("PH Servicefall Verlauf", {"parent": f.name}) + 1
            frappe.get_doc({"doctype": "PH Servicefall Verlauf", "parent": f.name, "parenttype": "PH Servicefall", "parentfield": "verlauf", "idx": idx, "zeit": now_datetime(), "ereignis": "Eskalation", "status": status, "von": "Scheduler", "hinweis": text[:300]}).insert(ignore_permissions=True)
            frappe.db.commit()
        except Exception:  # noqa: BLE001
            frappe.db.rollback()
            frappe.log_error(title=f"ph_service.eskalation {f.name}")


# ── Wartung / Pflege ────────────────────────────────────────────────────────


def _reise_aktiv(reise_id):
    if MARKETING_APP not in frappe.get_installed_apps() or not frappe.db.exists("DocType", "PH Kundenreise"):
        return None
    try:
        return frappe.db.get_value("PH Kundenreise", {"reise_id": reise_id, "aktiv": 1}, "name") or None
    except Exception:  # noqa: BLE001
        return None


def _vormerken(abo, art, datum, kontext):
    """Erinnerung über ph_marketing (PH Reise Versand), sonst Mail-Vorlage (nur Termin, Vertragserfüllung), sonst ToDo."""
    key = logik.schluessel(abo.name, art, getdate(datum))
    reise = _reise_aktiv("pflege_termin" if art == "termin" else "pflege_nachkauf")
    if reise and abo.kontakt_email and frappe.db.exists("DocType", "PH Reise Versand"):
        if frappe.db.exists("PH Reise Versand", {"schluessel": key}):
            return "schon_vorgemerkt"
        frappe.get_doc(
            {
                "doctype": "PH Reise Versand",
                "schluessel": key,
                "reise": reise,
                "empfaenger": abo.kontakt_email,
                "grundlage": "V" if art == "termin" else "E",
                "werbung": 0 if art == "termin" else 1,
                "status": "geplant",
                "referenz_doctype": "PH Pflege Abo",
                "referenz_name": abo.name,
                "kontext_json": frappe.as_json(kontext),
                "geplant_am": today(),
            }
        ).insert(ignore_permissions=True)
        return "versand"
    if art == "termin" and abo.kontakt_email:
        # Vertragserfüllung (kein Werbe-Charakter): direkte Erinnerung nach Vorlage.
        kom.sende_vorlage(abo, "wartung", abo.kontakt_email, ereignis="Kommunikation", termin=str(datum))
        return "mail"
    if abo.berater or abo.techniker:
        text = _("Wartungs-/Pflegetermin vereinbaren") if art == "termin" else _("Nachkauf-Hinweis Pflegemittel (Einwilligung liegt vor)")
        _todo(abo.berater or abo.techniker, "PH Pflege Abo", abo.name, f"{text}: {abo.titel or abo.name} ({key})", datum=datum, schluessel=key)
        return "todo"
    return "nichts"


def wartungserinnerungen():
    """Täglich: fällige Wartungs-/Pflegeerinnerungen, Überfällig-Kennzeichen, Nachkauf-Hinweise (nur mit Einwilligung)."""
    einst = einstellungen()
    heute = getdate(today())
    for row in frappe.get_all("PH Pflege Abo", filters={"status": "Aktiv"}, fields=["name"]):
        try:
            abo = frappe.get_doc("PH Pflege Abo", row.name)
            stuecke = [s.bezeichnung for s in abo.stuecke or []]
            naechster = getdate(abo.naechster_termin) if abo.naechster_termin else None
            letzte = getdate(abo.letzte_erinnerung) if abo.letzte_erinnerung else None
            if abo.art != "Pflege einmalig" and logik.erinnerung_faellig(heute, naechster, abo.erinnerung_tage_vorher, letzte):
                _vormerken(abo, "termin", naechster, {"termin": str(naechster), "stuecke": stuecke, "bereich": abo.bereich, "portal_url": "/de/portal/pflege"})
                frappe.db.set_value("PH Pflege Abo", abo.name, "letzte_erinnerung", heute, update_modified=False)
            ueber = int(bool(naechster) and logik.ueberfaellig(heute, naechster, einst["wartung_karenz_tage"]))
            if ueber != int(abo.ueberfaellig or 0):
                frappe.db.set_value("PH Pflege Abo", abo.name, "ueberfaellig", ueber, update_modified=False)
                if ueber:
                    _todo(abo.techniker or abo.berater or _leitung_benutzer()[0], "PH Pflege Abo", abo.name, _("Wartung überfällig seit {0}: {1}").format(frappe.utils.formatdate(naechster), abo.titel), prioritaet="High", schluessel="Wartung überfällig")

            letztes = abo.letztes_protokoll_datum()
            empfohlen = ""
            if letztes:
                zeile = max((p for p in abo.protokolle if p.datum), key=lambda p: getdate(p.datum))
                empfohlen = zeile.empfohlene_produkte or ""
            hinweis = getdate(abo.letzter_nachkauf_hinweis) if abo.letzter_nachkauf_hinweis else None
            if logik.nachkauf_faellig(heute, letztes, empfohlen, bool(abo.nachkauf_einwilligung), bool(abo.nachkauf_widerrufen_am), hinweis, int(einst["nachkauf_tage_nach"])):
                ergebnis = _vormerken(abo, "nachkauf", heute, {"produkte": empfohlen, "stuecke": stuecke, "hinweis": "Preis auf Anfrage"})
                if ergebnis != "nichts":
                    frappe.db.set_value("PH Pflege Abo", abo.name, "letzter_nachkauf_hinweis", heute, update_modified=False)
            frappe.db.commit()
        except Exception:  # noqa: BLE001
            frappe.db.rollback()
            frappe.log_error(title=f"ph_service.wartungserinnerungen {row.name}")


# ── Wochenübersicht ─────────────────────────────────────────────────────────


def wochenuebersicht():
    """Montag 07:00: Einsätze der Woche je Techniker und offene Fälle je Status an das Team-Postfach."""
    try:
        from ph_core.ph_core.doctype.ph_einstellungen.ph_einstellungen import einstellungen as core
        from ph_core.utils.mail import sende

        heute = getdate(today())
        ende = add_days(heute, 6)
        einsaetze = frappe.get_all("PH Serviceeinsatz", filters={"datum": ("between", [heute, ende]), "status": ("in", ["Geplant", "Bestaetigt"])}, fields=["name", "datum", "zeit_von", "techniker", "kunde_name", "ort", "art"], order_by="techniker, datum, zeit_von")
        offene = frappe.db.sql("select status, count(*) n from `tabPH Servicefall` where status in %(s)s group by status", {"s": OFFEN}, as_dict=True)
        zeilen = "".join(f"<tr><td>{frappe.utils.formatdate(e.datum)} {str(e.zeit_von or '')[:5]}</td><td>{frappe.utils.escape_html(e.techniker or '')}</td><td>{frappe.utils.escape_html(e.kunde_name or '')}, {frappe.utils.escape_html(e.ort or '')}</td><td>{e.art}</td><td>{e.name}</td></tr>" for e in einsaetze) or "<tr><td colspan=5>–</td></tr>"
        status = ", ".join(f"{o.status}: {o.n}" for o in offene) or "keine"
        html = f"<h3>Service – Woche ab {frappe.utils.formatdate(heute)}</h3><p>Offene Servicefälle: {status}</p><table border=1 cellpadding=4 cellspacing=0><tr><th>Termin</th><th>Techniker</th><th>Kunde</th><th>Art</th><th>Einsatz</th></tr>{zeilen}</table>"
        sende(core()["team_email"], _("Service-Wochenübersicht {0}").format(frappe.utils.formatdate(heute)), html)
        frappe.db.commit()
    except Exception:  # noqa: BLE001
        frappe.log_error(title="ph_service.wochenuebersicht")
