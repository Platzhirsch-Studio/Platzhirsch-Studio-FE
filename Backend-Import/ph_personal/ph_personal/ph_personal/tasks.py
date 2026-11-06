"""Zeitgesteuerte Jobs von ph_personal (hooks.scheduler_events). Idempotent, Fehler nur protokolliert."""

import frappe
from frappe import _
from frappe.utils import add_days, getdate, now_datetime, nowdate


def loeschfristen_ausfuehren():
    """Täglich 03:15: Bewerbungen mit abgelaufener Löschfrist – Unterlagen löschen, pseudonymisieren.
    Nur abgeschlossene Bewerbungen (Abgesagt/Zurueckgezogen), nie offene oder eingestellte."""
    from ph_personal.ph_personal.doctype.ph_bewerbung.ph_bewerbung import unterlagen_entfernen

    faellig = frappe.get_all(
        "PH Bewerbung",
        filters={"loeschfrist": ("<=", nowdate()), "pseudonymisiert": 0, "status": ("in", ["Abgesagt", "Zurueckgezogen"])},
        pluck="name",
    )
    anzahl = 0
    for name in faellig:
        try:
            doc = frappe.get_doc("PH Bewerbung", name)
            if doc.einwilligung_evidenz and doc.einwilligung_evidenz_bis and getdate(doc.einwilligung_evidenz_bis) > getdate(nowdate()):
                continue
            unterlagen_entfernen(doc, grund=_("Löschfrist {0}").format(frappe.format(doc.loeschfrist, {"fieldtype": "Date"})))
            frappe.db.commit()
            anzahl += 1
        except Exception:  # noqa: BLE001
            frappe.db.rollback()
            frappe.log_error(title=f"PH Personal: Löschlauf {name} fehlgeschlagen")
    return anzahl


def abgelaufene_stellen():
    """Täglich 04:00: Aktive Stellen mit gueltig_bis < heute → Pausiert (Website nimmt sie ohnehin nicht mehr),
    Kommentar, Website-Cache erneuern."""
    from ph_personal.ph_personal.website import revalidate_career

    abgelaufen = frappe.get_all("PH Stelle", filters={"status": "Aktiv", "gueltig_bis": ("<", nowdate())}, pluck="name")
    for name in abgelaufen:
        try:
            frappe.db.set_value("PH Stelle", name, {"status": "Pausiert", "workflow_state": "PH Pausiert"})
            frappe.get_doc("PH Stelle", name).add_comment("Info", _("Gültigkeit abgelaufen – automatisch pausiert. Zum erneuten Veröffentlichen „Gültig bis“ verlängern und wieder aktivieren."))
            frappe.db.commit()
        except Exception:  # noqa: BLE001
            frappe.db.rollback()
            frappe.log_error(title=f"PH Personal: Stelle {name} konnte nicht pausiert werden")
    if abgelaufen:
        try:
            revalidate_career(grund="abgelaufene Stellen")
        except Exception:  # noqa: BLE001
            frappe.log_error(title="PH Personal: Revalidate nach Ablauf fehlgeschlagen")
    return len(abgelaufen)


def loeschfrist_vorwarnung():
    """Montags 07:00: ToDo an die Leitung für Bewerbungen, deren Löschfrist in den nächsten 14 Tagen fällt
    (Gelegenheit, eine Einwilligung zur Evidenzhaltung einzuholen)."""
    bald = frappe.get_all(
        "PH Bewerbung",
        filters={"loeschfrist": ("between", [nowdate(), add_days(nowdate(), 14)]), "pseudonymisiert": 0, "einwilligung_evidenz": 0},
        fields=["name", "titel", "loeschfrist"],
    )
    from ph_personal.ph_personal.doctype.ph_personal_einstellungen.ph_personal_einstellungen import einstellungen

    warn_tage = einstellungen()["offene_bewerbung_warnung_tage"]
    alt = frappe.get_all(
        "PH Bewerbung",
        filters={"status": ("in", ["Eingegangen", "Gesichtet", "Gespraech", "Angebot"]), "eingang": ("<", add_days(nowdate(), -warn_tage)), "pseudonymisiert": 0},
        fields=["name", "titel", "eingang"],
    )
    if not bald and not alt:
        return 0
    leitung = frappe.get_all("Has Role", filters={"role": "PH Personal Leitung", "parenttype": "User"}, pluck="parent")
    leitung = [u for u in leitung if frappe.db.get_value("User", u, "enabled")]
    if not leitung:
        return 0
    beschreibung = _("Löschfrist in den nächsten 14 Tagen:") + "\n" + "\n".join(f"- {b.name} {b.titel} ({b.loeschfrist})" for b in bald)
    if alt:
        beschreibung += "\n" + _("Offen ohne Entscheidung seit über {0} Tagen (Datenminimierung):").format(warn_tage) + "\n" + "\n".join(f"- {b.name} {b.titel} ({getdate(b.eingang)})" for b in alt)
    try:
        from frappe.desk.form.assign_to import add

        add({"assign_to": leitung[:3], "doctype": "Report", "name": "PH Loeschfristen", "description": beschreibung[:2000], "date": nowdate()})
        frappe.db.commit()
    except Exception:  # noqa: BLE001
        frappe.log_error(title="PH Personal: Vorwarnung Löschfrist fehlgeschlagen")
    return len(bald) + len(alt)


def offene_zeitbuchungen_hinweis():
    """Täglich 23:30: offene Buchungen (nur Kommen) einmal kommentieren (Merker hinweis_gesendet_am, Fachkritik F19)."""
    offen = frappe.get_all("PH Zeiterfassung", filters={"status": "Offen", "datum": ("<=", nowdate()), "hinweis_gesendet_am": ("is", "not set")}, pluck="name")
    for name in offen:
        try:
            frappe.get_doc("PH Zeiterfassung", name).add_comment("Info", _("Buchung ohne „Gehen“ – bitte ergänzen."))
            frappe.db.set_value("PH Zeiterfassung", name, "hinweis_gesendet_am", now_datetime(), update_modified=False)
        except Exception:  # noqa: BLE001
            frappe.log_error(title=f"PH Personal: Hinweis offene Buchung {name}")
    frappe.db.commit()
    return len(offen)


def austritte_vollziehen():
    """Täglich 00:10: Austrittsdatum vorbei (Austritt < heute) → Status Ausgetreten, Zugang entziehen
    (User deaktivieren, Selbstservice/User Permission, Kassa-PIN, Sitzungen) – Fachkritik P10/R10."""
    from ph_personal.ph_personal.doctype.ph_mitarbeiter.ph_mitarbeiter import zugang_entziehen

    namen = frappe.get_all("PH Mitarbeiter", filters={"austritt": ("<", nowdate()), "zugang_entzogen_am": ("is", "not set")}, pluck="name")
    for name in namen:
        try:
            ma = frappe.get_doc("PH Mitarbeiter", name)
            if ma.status != "Ausgetreten":
                ma.status = "Ausgetreten"
                ma.save(ignore_permissions=True)  # on_update entzieht den Zugang
            else:
                zugang_entziehen(ma)
            frappe.db.commit()
        except Exception:  # noqa: BLE001
            frappe.db.rollback()
            frappe.log_error(title=f"PH Personal: Austritt {name} nicht vollzogen")
    return len(namen)


def urlaubsansprueche_pflegen():
    """Täglich 00:10: Urlaubsansprüche für das laufende Urlaubsjahr anlegen und Stand/Verjährung schreiben."""
    from ph_personal.ph_personal.doctype.ph_urlaubsanspruch.ph_urlaubsanspruch import stand_schreiben

    anzahl = 0
    for name in frappe.get_all("PH Mitarbeiter", filters={"status": ("!=", "Ausgetreten"), "eintritt": ("is", "set")}, pluck="name"):
        try:
            stand_schreiben(name)
            frappe.db.commit()
            anzahl += 1
        except Exception:  # noqa: BLE001
            frappe.db.rollback()
            frappe.log_error(title=f"PH Personal: Urlaubsanspruch {name}")
    return anzahl


def beschaeftigtendaten_bereinigen():
    """Täglich 02:30 (Fachkritik P16/B11, Art. 5 Abs 1 lit e DSGVO):
    - Austritt + n Tage: Notfallkontakt, private Kontaktdaten und vertrauliche Hinweise leeren;
    - Zeit-/Abwesenheits-/Krankmeldungs-/Abschlussdaten nach Ablauf der Aufbewahrung (31.12. Belegjahr + n Jahre) löschen;
    - ausgetretene PH Mitarbeiter danach auf Minimaldaten (Name, Eintritt, Austritt, Rolle – Dienstzeugnis) reduzieren."""
    from ph_personal.ph_personal.doctype.ph_personal_einstellungen.ph_personal_einstellungen import einstellungen

    e = einstellungen()
    heute = getdate(nowdate())
    grenze = add_days(heute, -int(e["notfallkontakt_loeschen_tage"]))
    for name in frappe.get_all("PH Mitarbeiter", filters={"status": "Ausgetreten", "austritt": ("<", grenze), "notfallkontakt_geloescht_am": ("is", "not set")}, pluck="name"):
        try:
            frappe.db.set_value(
                "PH Mitarbeiter", name,
                {"notfallkontakt_name": None, "notfallkontakt_telefon": None, "notfallkontakt_beziehung": None, "hinweise_vertraulich": None,
                 "telefon_privat": None, "email_privat": None, "notfallkontakt_geloescht_am": now_datetime()},
                update_modified=False,
            )
            frappe.db.commit()
        except Exception:  # noqa: BLE001
            frappe.db.rollback()
            frappe.log_error(title=f"PH Personal: Bereinigung {name}")
    jahre = int(e["aufbewahrung_zeiten_jahre"])
    stichjahr = heute.year - jahre - 1  # Belege bis 31.12. dieses Jahres: Aufbewahrung abgelaufen
    geloescht = 0
    for dt, feld, wert in (
        ("PH Zeiterfassung", "datum", f"{stichjahr}-12-31"),
        ("PH Abwesenheit", "bis", f"{stichjahr}-12-31"),
        ("PH Krankmeldung", "von", f"{stichjahr}-12-31"),
        ("PH Zeitabschluss", "periode", f"{stichjahr}-12"),
    ):
        if not frappe.db.exists("DocType", dt):
            continue
        for name in frappe.get_all(dt, filters={feld: ("<=", wert)}, pluck="name", limit=500):
            try:
                frappe.flags.ph_personal_abschluss_ignorieren = True
                frappe.delete_doc(dt, name, ignore_permissions=True, force=True, delete_permanently=True)
                geloescht += 1
            except Exception:  # noqa: BLE001
                frappe.log_error(title=f"PH Personal: Löschung {dt} {name}")
            finally:
                frappe.flags.ph_personal_abschluss_ignorieren = False
        frappe.db.commit()
    for name in frappe.get_all("PH Mitarbeiter", filters={"status": "Ausgetreten", "austritt": ("<=", f"{stichjahr}-12-31")}, pluck="name"):
        frappe.db.set_value("PH Mitarbeiter", name, {"privatadresse": None, "geburtsdatum": None, "lohnverrechnung_personalnummer": None}, update_modified=False)
    frappe.db.commit()
    return geloescht


def checkliste_faellig():
    """Täglich 07:00: fällige, nicht erledigte Checklisten-Aufgaben (ÖGK-Anmeldung vor Arbeitsantritt, Dienstzettel,
    ÖGK-Abmeldung binnen 7 Tagen …) als ToDo an die Personal-Leitung (eine Zuweisung je Person und Tag)."""
    zeilen = frappe.get_all(
        "PH Mitarbeiter Checkliste",
        filters={"parenttype": "PH Mitarbeiter", "erledigt": 0, "faellig_am": ("<=", add_days(nowdate(), 1))},
        fields=["parent", "aufgabe", "faellig_am", "pflicht"],
    )
    if not zeilen:
        return 0
    leitung = [u for u in frappe.get_all("Has Role", filters={"role": "PH Personal Leitung", "parenttype": "User"}, pluck="parent") if frappe.db.get_value("User", u, "enabled")]
    if not leitung:
        return 0
    from frappe.desk.form.assign_to import add

    je_ma = {}
    for z in zeilen:
        je_ma.setdefault(z.parent, []).append(z)
    for ma, liste in je_ma.items():
        if frappe.db.exists("ToDo", {"reference_type": "PH Mitarbeiter", "reference_name": ma, "status": "Open", "date": nowdate()}):
            continue
        text = _("Checkliste fällig:") + "\n" + "\n".join(f"- {z.aufgabe} ({z.faellig_am}){' – Pflicht' if z.pflicht else ''}" for z in liste)
        try:
            add({"assign_to": leitung[:2], "doctype": "PH Mitarbeiter", "name": ma, "description": text[:2000], "date": nowdate()})
            frappe.db.commit()
        except Exception:  # noqa: BLE001
            frappe.log_error(title=f"PH Personal: Checkliste {ma}")
    return len(je_ma)


def krank_bestaetigung_hinweis():
    """Täglich 07:00: Krankmeldungen ab Kalendertag n ohne AU-Bestätigung → Hinweis (einmal) für die Leitung.
    Ob die Bestätigung verlangt wird, entscheidet die Leitung (§ 8 Abs 8 AngG / § 4 EFZG)."""
    from ph_personal.ph_personal.doctype.ph_personal_einstellungen.ph_personal_einstellungen import einstellungen

    if not frappe.db.exists("DocType", "PH Krankmeldung"):
        return 0
    tage = einstellungen()["krank_bestaetigung_ab_tag"]
    namen = frappe.get_all(
        "PH Krankmeldung",
        filters={"status": "Gemeldet", "von": ("<=", add_days(nowdate(), -(tage - 1))), "bestaetigung_eingelangt_am": ("is", "not set"), "bestaetigung_angefordert_am": ("is", "not set")},
        pluck="name",
    )
    gemeldet = 0
    for name in namen:
        if frappe.db.exists("Comment", {"reference_doctype": "PH Krankmeldung", "reference_name": name, "content": ("like", "%ohne Arbeitsunfähigkeitsbestätigung%")}):
            continue
        frappe.get_doc("PH Krankmeldung", name).add_comment("Info", _("Krankenstand seit {0} Kalendertagen ohne Arbeitsunfähigkeitsbestätigung – bei Bedarf verlangen.").format(tage))
        gemeldet += 1
    frappe.db.commit()
    return gemeldet
