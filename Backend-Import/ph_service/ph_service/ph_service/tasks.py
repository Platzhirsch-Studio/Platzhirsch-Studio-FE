"""Scheduler (hooks.py, Europe/Vienna): Fristenwarnung, Reaktionsfrist, Eskalation, SLA, Wartungserinnerungen,
automatische Wartungseinsätze, überfällige Ersatzteile, Wochenübersicht.
Alle Funktionen idempotent, commit je Einheit, Fehler nur protokolliert (CONVENTIONS 13)."""

import frappe
from frappe import _
from frappe.utils import add_days, getdate, now_datetime, nowdate, today

from ph_service.ph_service import fristen as fr
from ph_service.ph_service import kommunikation as kom
from ph_service.ph_service import pflege_logik as logik
from ph_service.ph_service.doctype.ph_service_einstellungen.ph_service_einstellungen import einstellungen, feiertage
from ph_service.utils import sla
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


def benachrichtigen(user, doctype, name, text):
    """Glocke im Desk/Backoffice (Notification Log, Frappe-Standard); still, wenn nicht verfügbar."""
    try:
        if not user or user == "Guest":
            return
        frappe.get_doc({"doctype": "Notification Log", "for_user": user, "type": "Alert", "document_type": doctype, "document_name": name, "subject": text[:140], "email_content": text}).insert(ignore_permissions=True)
    except Exception:  # noqa: BLE001
        frappe.log_error(title="ph_service: Benachrichtigung")


def _gf_benutzer():
    rows = frappe.get_all("Has Role", filters={"role": "PH Geschäftsführung", "parenttype": "User"}, fields=["parent"])
    return [r.parent for r in rows if r.parent not in ("Administrator", "Guest") and frappe.db.get_value("User", r.parent, "enabled")]


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


# ── SLA ─────────────────────────────────────────────────────────────────────


def sla_pruefen():
    """Täglich: SLA-Zustand aller offenen Fälle neu bewerten (Zeit vergeht ohne Speichern) und nach Lösungsfrist eskalieren.
    Stufe 1 → Leitung (+ Verantwortlicher), ab Stufe „sla_gf_ab_stufe“ zusätzlich Geschäftsführung. Je Stufe genau einmal."""
    einst = einstellungen()
    heute = getdate(nowdate())
    ft = feiertage()
    leitung = _leitung_benutzer()
    gf_ab = int(einst.get("sla_gf_ab_stufe") or 2)
    faelle = frappe.get_all(
        "PH Servicefall",
        filters={"status": ("in", OFFEN)},
        fields=["name", "titel", "verantwortlich", "frist_reaktion", "frist_loesung", "erstreaktion_am", "sla_status", "sla_eskalationsstufe", "status", "sla_pausiert_seit"],
    )
    for f in faelle:
        try:
            pause = getdate(f.sla_pausiert_seit) if f.sla_pausiert_seit else None
            st = sla.status(heute, f.frist_reaktion, f.frist_loesung, getdate(f.erstreaktion_am) if f.erstreaktion_am else None, None, int(einst["sla_warn_werktage"]), ft, pausiert_seit=pause)
            # pausiert („wartet auf Hersteller/Ersatzteil/Kunde“): keine Eskalation nach Lösungsfrist
            stufe = 0 if pause else sla.eskalationsstufe(heute, f.frist_loesung, feiertage=ft)
            werte = {"sla_status": st["status"], "sla_reaktion_verletzt": int(st["reaktion_verletzt"]), "sla_loesung_verletzt": int(st["loesung_verletzt"])}
            if stufe > int(f.sla_eskalationsstufe or 0):
                werte["sla_eskalationsstufe"] = stufe
                text = _("SLA-Eskalation Stufe {0}: Lösungsfrist {1} überschritten – {2}").format(stufe, frappe.utils.formatdate(f.frist_loesung), f.titel)
                empfaenger = set(leitung)
                if f.verantwortlich:
                    empfaenger.add(f.verantwortlich)
                if stufe >= gf_ab:
                    empfaenger.update(_gf_benutzer())
                for u in empfaenger:
                    _todo(u, "PH Servicefall", f.name, text, prioritaet="High", schluessel=f"SLA-Eskalation Stufe {stufe}")
                    benachrichtigen(u, "PH Servicefall", f.name, text)
                idx = frappe.db.count("PH Servicefall Verlauf", {"parent": f.name}) + 1
                frappe.get_doc({"doctype": "PH Servicefall Verlauf", "parent": f.name, "parenttype": "PH Servicefall", "parentfield": "verlauf", "idx": idx, "zeit": now_datetime(), "ereignis": "SLA", "status": f.status, "von": "Scheduler", "hinweis": text[:300]}).insert(ignore_permissions=True)
            frappe.db.set_value("PH Servicefall", f.name, werte, update_modified=False)
            frappe.db.commit()
        except Exception:  # noqa: BLE001
            frappe.db.rollback()
            frappe.log_error(title=f"ph_service.sla_pruefen {f.name}")


# ── Regress: Gutschrift- und Abholfristen ───────────────────────────────────


def regress_mahnungen():
    """Täglich: Gutschriftfrist (Belastungsanzeige) bzw. Abholfrist (Rücksendung) überschritten → „Mahnung fällig“ + ToDo
    an die Leitung mit Stufe. Versand der Mahnung bewusst per Knopf (keine automatische Post an Hersteller)."""
    from ph_service.utils import regress as rg

    einst = einstellungen()
    heute = getdate(nowdate())
    leitung = _leitung_benutzer()
    abstand, maximal = int(einst.get("regress_mahnabstand_tage") or 14), int(einst.get("regress_max_mahnstufe") or 3)
    for r in frappe.get_all("PH Lieferantenregress", filters={"status": ("in", ["Gemeldet", "Anerkannt"])}, fields=["name", "titel", "zahlungsfrist_bis", "letzte_mahnung", "mahnstufe", "mahnung_faellig", "abgleich_status", "ruecksendung_noetig", "abholung_frist", "abholung_mahnstufe", "abgeholt_am"]):
        try:
            if r.abgleich_status not in ("Ausgeglichen", "Ueberdeckung", "Ausgebucht"):
                stufe = rg.mahnung_faellig(heute, getdate(r.zahlungsfrist_bis) if r.zahlungsfrist_bis else None, getdate(r.letzte_mahnung) if r.letzte_mahnung else None, r.mahnstufe, abstand, maximal)
                if stufe and not r.mahnung_faellig:
                    frappe.db.set_value("PH Lieferantenregress", r.name, "mahnung_faellig", 1, update_modified=False)
                if stufe:
                    for u in leitung:
                        _todo(u, "PH Lieferantenregress", r.name, _("Regress: {0}. Mahnung fällig (Gutschrift bis {1}) – {2}").format(stufe, frappe.utils.formatdate(r.zahlungsfrist_bis), r.titel), prioritaet="High", schluessel=f"Regress-Mahnung {stufe}")
            if r.ruecksendung_noetig and not r.abgeholt_am and r.abholung_frist and heute > getdate(r.abholung_frist):
                for u in leitung:
                    _todo(u, "PH Lieferantenregress", r.name, _("Abholung durch Hersteller überfällig ({0}) – Abholung anmahnen: {1}").format(frappe.utils.formatdate(r.abholung_frist), r.titel), schluessel=f"Abholung {int(r.abholung_mahnstufe or 0) + 1}")
            frappe.db.commit()
        except Exception:  # noqa: BLE001
            frappe.db.rollback()
            frappe.log_error(title=f"ph_service.regress_mahnungen {r.name}")


# ── Ersatzteile ─────────────────────────────────────────────────────────────


def ersatzteile_ueberfaellig():
    """Täglich: Ersatzteilbestellungen über dem erwarteten Liefertermin (+ Toleranz) → Kennzeichen + ToDo „beim Lieferanten nachfragen“."""
    einst = einstellungen()
    heute = getdate(nowdate())
    grenze = add_days(heute, -int(einst.get("ersatzteil_ueberfaellig_tage") or 0))
    for b in frappe.get_all("PH Ersatzteilbestellung", filters={"status": ("in", ["Gesendet", "Bestaetigt", "Teilgeliefert"]), "erwartet_am": ("<", grenze)}, fields=["name", "titel", "servicefall", "owner", "erwartet_am", "ueberfaellig"]):
        try:
            if not b.ueberfaellig:
                frappe.db.set_value("PH Ersatzteilbestellung", b.name, "ueberfaellig", 1, update_modified=False)
            verantwortlich = frappe.db.get_value("PH Servicefall", b.servicefall, "verantwortlich") if b.servicefall else None
            text = _("Ersatzteile überfällig seit {0} – beim Lieferanten nachfragen: {1}").format(frappe.utils.formatdate(b.erwartet_am), b.titel)
            _todo(verantwortlich or b.owner or _leitung_benutzer()[0], "PH Ersatzteilbestellung", b.name, text, prioritaet="High", schluessel="Ersatzteile überfällig")
            frappe.db.commit()
        except Exception:  # noqa: BLE001
            frappe.db.rollback()
            frappe.log_error(title=f"ph_service.ersatzteile_ueberfaellig {b.name}")


# ── Wartung / Pflege ────────────────────────────────────────────────────────


def wartungseinsaetze_erzeugen():
    """Täglich: Wartungs-/Jahresverträge mit Fälligkeit im Vorlauf → PH Serviceeinsatz (Geplant) automatisch anlegen.
    Idempotent über PH Serviceeinsatz.planschluessel (unique) = wartung:<Vertrag>:<Fälligkeit>; Einsatztag = nächster Werktag."""
    einst = einstellungen()
    if not int(einst.get("wartung_automatisch") or 0):
        return
    heute = getdate(nowdate())
    ft = feiertage()
    vorlauf = int(einst.get("wartung_vorlauf_tage") or 28)
    for row in frappe.get_all("PH Pflege Abo", filters={"status": "Aktiv", "art": ("in", ["Wartungsvertrag", "Pflege Jahres-Abo"]), "naechster_termin": ("is", "set")}, fields=["name", "naechster_termin", "automatisch_einplanen", "vertragsende", "kuendigung_zum"]):
        try:
            faellig = getdate(row.naechster_termin)
            ende = getdate(row.kuendigung_zum or row.vertragsende) if (row.kuendigung_zum or row.vertragsende) else None
            if ende and faellig > ende:
                continue  # Vertrag endet vorher
            schluessel = logik.planschluessel(row.name, faellig)
            schon = bool(frappe.db.exists("PH Serviceeinsatz", {"planschluessel": schluessel})) or bool(
                frappe.db.exists("PH Serviceeinsatz", {"pflege_abo": row.name, "status": ("not in", ["Abgebrochen", "Nicht angetroffen"]), "datum": ("between", [add_days(faellig, -vorlauf), add_days(faellig, vorlauf)])})
            )  # manuell geplanter Einsatz zählt
            if not logik.einsatz_faellig(heute, faellig, vorlauf, schon_geplant=schon, automatisch=bool(int(row.automatisch_einplanen if row.automatisch_einplanen is not None else 1))):
                continue
            abo = frappe.get_doc("PH Pflege Abo", row.name)
            tag = logik.plantag(max(faellig, heute), ft)
            name = abo.einsatz_planen(str(tag), planschluessel=schluessel)
            frappe.db.set_value("PH Pflege Abo", abo.name, "naechster_einsatz", name, update_modified=False)
            ziel = abo.techniker or abo.berater or _leitung_benutzer()[0]
            _todo(ziel, "PH Serviceeinsatz", name, _("Wartungseinsatz automatisch geplant für {0} – Termin mit Kunde bestätigen: {1}").format(frappe.utils.formatdate(tag), abo.titel), datum=add_days(tag, -7), schluessel=schluessel)
            frappe.db.commit()
        except Exception:  # noqa: BLE001
            frappe.db.rollback()
            frappe.log_error(title=f"ph_service.wartungseinsaetze_erzeugen {row.name}")



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
