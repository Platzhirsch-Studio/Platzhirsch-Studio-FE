"""Frappe-Dienste der Kassa für die Backend-Lücken (50-backend-luecken-kassa-faktura.md).

Die Desk-Page (page/ph_kassa/ph_kassa.py) und die Next-Kassa rufen diese Funktionen über ihre whitelisted
Wrapper auf. Reine Regeln liegen in ph_kassa/logik/ (ohne Frappe, unit-getestet).
"""

from __future__ import annotations

import frappe
from frappe import _
from frappe.utils import cint, get_datetime, getdate, now_datetime

LEITUNG = ("PH Kassa Leitung", "System Manager")


# ── Leitungsfreigabe per PIN (ph_core Bediener/Geräte) ─────────────────────────

def freigabe_pruefen(freigabe, gruende: list[str]) -> str | None:
    """Leitungsfreigabe für `gruende` (Codes aus logik.regeln). Ist der angemeldete Benutzer selbst Leitung, gilt er
    als Freigeber. Sonst: freigabe = {"email", "pin", "geraet_token"} → PIN gegen User.ph_core_pin_hash (PBKDF2,
    ph_core.utils.geraete.pin_passt), Gerät muss registriert und aktiv sein, Freigeber muss Rolle PH Kassa Leitung
    haben. Fehlversuche zählt ph_core.api.bediener.verify_pin (Next nutzt diesen Endpunkt vorab für die Rückmeldung).
    → Name des freigebenden Users oder None (keine Freigabe nötig)."""
    if not gruende:
        return None
    if set(frappe.get_roles()) & set(LEITUNG):
        return frappe.session.user
    if isinstance(freigabe, str):
        freigabe = frappe.parse_json(freigabe) if freigabe else None
    texte = ", ".join(gruende)
    if not freigabe or not freigabe.get("email") or not freigabe.get("pin"):
        frappe.throw(_("Leitungsfreigabe nötig: {0}").format(texte), frappe.PermissionError, title="freigabe_noetig")
    try:
        from ph_core.utils.geraete import pin_passt
    except ImportError:
        frappe.throw(_("PIN-Prüfung (ph_core) nicht verfügbar."))
    if freigabe.get("geraet_token"):
        try:
            from ph_core.api.geraete import _geraet_aktiv

            _geraet_aktiv(freigabe["geraet_token"])
        except Exception:  # noqa: BLE001 – ApiFehler oder fehlendes Modul
            frappe.throw(_("Gerät nicht registriert oder gesperrt – Freigabe nicht möglich."), frappe.PermissionError)
    user = frappe.db.get_value("User", {"name": freigabe["email"], "enabled": 1}, ["name", "ph_core_pin_hash"], as_dict=True)
    if not user or not user.ph_core_pin_hash or not pin_passt(str(freigabe["pin"]), user.ph_core_pin_hash):
        frappe.throw(_("PIN der Leitung stimmt nicht."), frappe.PermissionError)
    if not set(frappe.get_roles(user.name)) & set(LEITUNG):
        frappe.throw(_("{0} hat keine Kassa-Leitungsrolle.").format(user.name), frappe.PermissionError)
    return user.name


# ── Terminal-Vorgänge ─────────────────────────────────────────────────────────

def vorgang_merken(payment_intent, **werte):
    """PH Terminal Vorgang je PaymentIntent anlegen/fortschreiben (nie Ausnahme)."""
    if not payment_intent or not frappe.db.exists("DocType", "PH Terminal Vorgang"):
        return None
    try:
        name = frappe.db.get_value("PH Terminal Vorgang", {"payment_intent": payment_intent}, "name")
        if name:
            doc = frappe.get_doc("PH Terminal Vorgang", name)
            doc.update({k: v for k, v in werte.items() if v is not None})
            doc.flags.ignore_permissions = True
            doc.save()
        else:
            doc = frappe.get_doc({"doctype": "PH Terminal Vorgang", "payment_intent": payment_intent, "gestartet_am": now_datetime(), "bediener": frappe.session.user, **werte})
            doc.insert(ignore_permissions=True)
        return doc.name
    except Exception:  # noqa: BLE001
        frappe.log_error(title=f"PH Kassa: Terminal-Vorgang {payment_intent}")
        return None


STRIPE_STATUS = {"succeeded": "Bezahlt", "canceled": "Abgebrochen", "failed": "Fehlgeschlagen", "requires_payment_method": "Fehlgeschlagen"}


def vorgang_status(payment_intent, stripe_status):
    alt = frappe.db.get_value("PH Terminal Vorgang", {"payment_intent": payment_intent}, ["name", "status"], as_dict=True) if frappe.db.exists("DocType", "PH Terminal Vorgang") else None
    if alt and alt.status in ("Verbucht", "Erstattet"):
        return
    neu = STRIPE_STATUS.get(stripe_status)
    vorgang_merken(payment_intent, stripe_status=stripe_status, status=neu, beendet_am=now_datetime() if neu else None)


def vorgang_alter(payment_intent):
    if not frappe.db.exists("DocType", "PH Terminal Vorgang"):
        return None
    return frappe.db.get_value("PH Terminal Vorgang", {"payment_intent": payment_intent}, "gestartet_am")


def offene_kartenzahlungen(kasse):
    """Bezahlte Terminal-Zahlungen ohne Beleg (Netz fiel zwischen „bezahlt“ und Buchen aus) – Band beim Kassenstart."""
    if not frappe.db.exists("DocType", "PH Terminal Vorgang"):
        return []
    return frappe.get_all("PH Terminal Vorgang", filters={"kasse": kasse, "status": "Bezahlt", "beleg": ("is", "not set")}, fields=["name", "payment_intent", "betrag_cent", "gestartet_am", "bediener"], order_by="gestartet_am desc", limit=20)


# ── Kunde anlegen (Rechnungsempfänger, § 11 UStG) ──────────────────────────────

def kunde_anlegen(name=None, vorname=None, nachname=None, firma=None, strasse=None, plz=None, ort=None, land="AT", uid=None, email=None, telefon=None):
    """Schnellanlage PH Kontakt aus der Kassa (Fachkritik 21 P4). Zweck: Rechnung. Keine Werbe-Einwilligung.

    Integration Runde 3: Anlage über ph_crm `api.create_kontakt` (Dublettenschutz: E-Mail, Telefon normalisiert,
    Name+PLZ, Firma). Hat der Kassa-Benutzer kein Anlegerecht auf PH Kontakt, läuft dieselbe Dublettenprüfung über die
    interne Funktion dahinter (`ph_crm.ph_crm.dubletten.kandidaten`) und die Anlage mit ignore_permissions.
    → {"kontakt", "neu", "bestehend"}"""
    if not frappe.db.exists("DocType", "PH Kontakt"):
        frappe.throw(_("PH Kontakt (ph_crm) ist nicht installiert."))
    if not (firma or nachname or name):
        frappe.throw(_("Name oder Firma angeben."))
    if not (strasse and plz and ort):
        frappe.throw(_("Anschrift (Straße, PLZ, Ort) ist für die Rechnung Pflicht."))
    if not (vorname or nachname) and name and not firma:
        teile = name.strip().split(" ", 1)
        vorname, nachname = (teile[0], teile[1]) if len(teile) == 2 else (None, teile[0])
    nachname = nachname or (name if not firma else None) or firma
    email = (email or "").strip().lower() or None
    land_name = _land(land)
    try:
        from ph_crm.api import create_kontakt
        from ph_crm.ph_crm import dubletten
    except ImportError:
        create_kontakt = dubletten = None
    if create_kontakt and frappe.has_permission("PH Kontakt", "create"):
        r = create_kontakt(nachname=nachname, vorname=vorname, firma=firma, email=email, telefon=telefon, strasse=strasse, plz=plz, ort=ort, uid=uid, land=land_name, quelle="showroom")
        if not r.get("bestehend"):
            _kassa_kennzeichen(r["kontakt"])
        return {"kontakt": r["kontakt"], "neu": not r.get("bestehend"), "bestehend": bool(r.get("bestehend"))}
    if dubletten:
        treffer = [k for k in dubletten.kandidaten({"vorname": vorname, "nachname": nachname, "firma": firma, "email": email, "telefon": telefon, "plz": plz}, limit=3) if k.get("einstufung") == "wahrscheinlich"]
        if treffer:
            return {"kontakt": treffer[0]["name"], "neu": False, "bestehend": True}
    elif email:
        vorhanden = frappe.db.get_value("PH Kontakt", {"email": email}, "name")
        if vorhanden:
            return {"kontakt": vorhanden, "neu": False, "bestehend": True}
    meta = frappe.get_meta("PH Kontakt")
    werte = {"vorname": vorname, "nachname": nachname, "firma": firma, "strasse": strasse, "plz": plz, "ort": ort, "land": land_name, "uid": uid, "email": email, "telefon": telefon,
             "kontaktart": "Geschaeft" if (firma or uid) else "Privat", "status": "Kunde", "quelle": "showroom", "einwilligung_hinweis": _("Angelegt an der Kassa für die Rechnung – keine Werbeeinwilligung.")}
    doc = frappe.get_doc({"doctype": "PH Kontakt", **{k: v for k, v in werte.items() if v not in (None, "") and meta.has_field(k)}})
    doc.insert(ignore_permissions=True)
    return {"kontakt": doc.name, "neu": True, "bestehend": False}


LAND_ISO = {"AT": "Austria", "DE": "Germany", "CH": "Switzerland", "IT": "Italy", "LI": "Liechtenstein", "FR": "France", "SI": "Slovenia", "HU": "Hungary", "CZ": "Czech Republic", "SK": "Slovakia", "NL": "Netherlands"}


def _land(land):
    """ISO-Kürzel der Kassa → Country (PH Kontakt.land ist Link Country); unbekannt → None."""
    if not land:
        return None
    for kandidat in (land, LAND_ISO.get(str(land).upper())):
        if kandidat and frappe.db.exists("Country", kandidat):
            return kandidat
    return None


def _kassa_kennzeichen(kontakt):
    """Status Kunde + Hinweis „keine Werbeeinwilligung“ an einer über ph_crm neu angelegten Kassen-Schnellanlage."""
    try:
        meta = frappe.get_meta("PH Kontakt")
        werte = {k: v for k, v in {"status": "Kunde", "einwilligung_hinweis": _("Angelegt an der Kassa für die Rechnung – keine Werbeeinwilligung.")}.items() if meta.has_field(k)}
        if werte:
            frappe.db.set_value("PH Kontakt", kontakt, werte, update_modified=False)
    except Exception:  # noqa: BLE001
        frappe.log_error(title=f"PH Kassa: Kennzeichen Kontakt {kontakt}")


# ── Retoure ──────────────────────────────────────────────────────────────────

def retoure_daten(beleg):
    """Originalbeleg + bereits zurückgenommene Mengen (aus Retoure-Positionen anderer Belege)."""
    from ph_kassa.logik.retoure import ruecknehmbar

    doc = frappe.get_doc("PH Kassenbeleg", beleg)
    if doc.docstatus != 1 or doc.belegart != "Standard":
        frappe.throw(_("Rücknahme nur zu gebuchten Standardbelegen."))
    if doc.get("storniert_durch"):
        frappe.throw(_("Beleg ist storniert."))
    bisher = frappe.get_all("PH Kassenbeleg Position", filters={"parenttype": "PH Kassenbeleg", "art": "Retoure", "bezug": beleg}, fields=["bezug_zeile", "menge", "parent"])
    gueltig = {b.name for b in frappe.get_all("PH Kassenbeleg", filters={"name": ("in", list({x.parent for x in bisher}) or [""]), "docstatus": 1, "storniert_durch": ("is", "not set")}, fields=["name"])}
    bisher = [x for x in bisher if x.parent in gueltig]
    zeilen = ruecknehmbar([p.as_dict() for p in doc.positionen], bisher)
    return doc, zeilen


# ── Notbetrieb ───────────────────────────────────────────────────────────────

def notbelege_einspielen(kasse, belege, geraet_token=None, bediener=None):
    """Nacherfassung (RKSV § 17): je Notbeleg ein eigener signierter Standardbeleg, Kennzeichnung + Ereignis."""
    from ph_kassa.logik.betraege import KassenFehler
    from ph_kassa.logik.notbetrieb import QUELLE, pruefe_notbelege
    from ph_kassa.rksv.buchung import _ereignis, erzeuge_beleg

    limit = None
    if geraet_token:
        try:
            from ph_core.api.geraete import _geraet_aktiv

            g = _geraet_aktiv(geraet_token)
            werte = frappe.db.get_value("PH Geraet", g["name"], ["ph_kassa_offline_erlaubt", "ph_kassa_offline_limit_cent"], as_dict=True) or {}
            if not cint(werte.get("ph_kassa_offline_erlaubt")):
                frappe.throw(_("Gerät ist für Offline-Notbelege nicht freigegeben."))
            limit = cint(werte.get("ph_kassa_offline_limit_cent")) or None
        except frappe.ValidationError:
            raise
        except Exception:  # noqa: BLE001
            frappe.throw(_("Gerät nicht registriert oder gesperrt."))
    bereits = set(frappe.get_all("PH Kassenbeleg", filters={"kasse": kasse, "notbeleg_nr": ("is", "set")}, pluck="notbeleg_nr"))
    try:
        geprueft = pruefe_notbelege(belege, now_datetime(), bereits, limit)
    except KassenFehler as e:
        frappe.throw(str(e))
    out = []
    for b in geprueft:
        doc = erzeuge_beleg(kasse, positionen=b["positionen"], zahlarten=b["zahlarten"], kontakt=b.get("kontakt"), bediener=b.get("bediener") or bediener or frappe.session.user, quelle=QUELLE, idempotency_key=f"notbeleg:{kasse}:{b['notbeleg_nr']}", zusatz={"notbeleg_nr": b["notbeleg_nr"], "notbeleg_zeitpunkt": b["zeitpunkt"]})
        out.append({"notbeleg_nr": b["notbeleg_nr"], "beleg": doc.name, "gesamt_cent": doc.gesamt_cent})
    if out:
        _ereignis(kasse, "Nacherfassung Notbelege", anzahl=len(out), status="Erledigt", notiz=_("Notbelege {0}–{1} nacherfasst (je Notbeleg ein Standardbeleg, Papierdurchschriften 7 Jahre aufbewahren).").format(out[0]["notbeleg_nr"], out[-1]["notbeleg_nr"]), automatisch=False)
    return out


# ── DSGVO: Kontakt an Kassenbelegen entkoppeln (Fachkritik 21 P14) ────────────

@frappe.whitelist()
def kontakt_anonymisieren(kontakt):
    """Löschbegehren (Art. 17 DSGVO) vs. Aufbewahrung (§ 132 BAO): Belege bleiben, Personenbezug wird entfernt –
    `kontakt` leer, `kunde_name` auf Initialen, `kundenbeleg_email` leer; Protokollkommentar je Beleg.
    Aufruf durch ph_crm (Anonymisierung) oder Leitung/Admin."""
    if not set(frappe.get_roles()) & {"PH Kassa Leitung", "PH Backoffice-Admin", "System Manager", "PH CRM Leitung"}:
        frappe.throw(_("Keine Berechtigung."), frappe.PermissionError)
    n = 0
    for b in frappe.get_all("PH Kassenbeleg", filters={"kontakt": kontakt}, fields=["name", "kunde_name"]):
        init = "".join(t[0].upper() + "." for t in (b.kunde_name or "").split() if t)[:10] or None
        frappe.db.set_value("PH Kassenbeleg", b.name, {"kontakt": None, "kunde_name": init, "kundenbeleg_email": None}, update_modified=False)
        frappe.get_doc("PH Kassenbeleg", b.name).add_comment("Info", _("DSGVO-Anonymisierung am {0}: Kontaktbezug entfernt (Beleg bleibt nach § 132 BAO).").format(frappe.utils.formatdate(getdate())))
        n += 1
    return {"belege": n}


def zeitpunkt(x):
    return get_datetime(x) if x else None
