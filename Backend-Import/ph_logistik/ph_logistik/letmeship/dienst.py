"""Frappe-Glue für LetMeShip: Client wählen, Tarife je Lieferschein, Buchung, Etikett, Tracking, Storno.

Ablauf „Etikett erzeugen“ (Packtisch / Button am Lieferschein):
  1. tarife_fuer_lieferschein(ls)   POST available  → Liste Tarife (Cent brutto inkl. Aufschlag), 30 min im Cache
  2. sendung_anlegen(ls, tarif_id)  PH Sendung (Angelegt) mit Empfänger-Snapshot, Paketen, Versicherung
  3. buchen(sendung)                POST shipments → shipmentId; GET shipments/{id} → AWB;
                                    GET documents?types=LABEL → PDF als privater Anhang; Status Etikett
  4. Scheduler tracking_abgleich    GET tracking → Status-Verlauf, Unterwegs/Zugestellt/Problem
  5. stornieren(sendung)            DELETE shipments/{id} (nur vor Abholung) → Storniert
Echte Aufrufe nur, wenn PH Logistik Einstellungen.letmeship_testmodus = 0 UND Zugangsdaten in site_config.
"""

import json

import frappe
from frappe import _
from frappe.utils import now_datetime

from ph_logistik.ph_logistik.helfer import absender, einstellungen, naechster_werktag, setze_status

from . import ShippingError
from .mock import MockClient
from .status import naechster_status, status_aus_tracking
from .tarife import tarife_normalisieren, tracking_link, waehle_dienst

_MOCK = None


def get_client(erzwinge_mock=False):
    """Mock, solange Testmodus oder keine Zugangsdaten; sonst echter Client mit Umgebung aus site_config."""
    global _MOCK
    e = einstellungen()
    if erzwinge_mock or e.get("letmeship_testmodus") or not e.get("letmeship_konfiguriert") or frappe.flags.in_test:
        if _MOCK is None or getattr(frappe.flags, "ph_logistik_mock_reset", False):
            _MOCK = MockClient()
            frappe.flags.ph_logistik_mock_reset = False
        return _MOCK
    from .client import LetMeShipClient

    return LetMeShipClient(frappe.conf.get("ph_letmeship_api_id"), frappe.conf.get("ph_letmeship_api_password"), frappe.conf.get("ph_letmeship_env") or "test")


def mock_zuruecksetzen():
    frappe.flags.ph_logistik_mock_reset = True


def ziel_aus_lieferschein(ls):
    return {
        "name": ls.liefer_name or ls.kunde_name or "",
        "firma": ls.liefer_firma or "",
        "strasse": ls.liefer_strasse or "",
        "hausnr": ls.liefer_hausnr or "",
        "zusatz": ls.liefer_zusatz or "",
        "plz": ls.liefer_plz or "",
        "ort": ls.liefer_ort or "",
        "land": (ls.liefer_land or "AT").upper(),
        "email": ls.liefer_email or ls.kunde_email or "",
        "telefon": ls.liefer_telefon or ls.kunde_telefon or "",
    }


def pakete_aus_lieferschein(ls):
    return [
        {"laenge_cm": p.laenge_cm, "breite_cm": p.breite_cm, "hoehe_cm": p.hoehe_cm, "gewicht_g": p.gewicht_g, "menge": 1, "inhalt": p.inhalt or "Wohnaccessoires"}
        for p in ls.pakete
    ]


def _cache_key(name):
    return f"ph_logistik:tarife:{name}"


def tarife_fuer_lieferschein(ls, neu=False):
    """→ {"tarife": [...], "empfehlung": id, "env": …, "gueltig_bis": iso}. Fehler → ShippingError."""
    e = einstellungen()
    if not neu:
        alt = frappe.cache().get_value(_cache_key(ls.name))
        if alt:
            return alt
    ziel = ziel_aus_lieferschein(ls)
    laender = [x.strip().upper() for x in str(e.get("laender_versand") or "AT\nDE").splitlines() if x.strip()]
    if ziel["land"] not in laender:
        raise ShippingError("land", ziel["land"])
    pakete = pakete_aus_lieferschein(ls)
    if not pakete:
        raise ShippingError("keine_pakete")
    client = get_client()
    roh = client.verfuegbar(absender(), ziel, pakete, bool(ls.versichern), int(ls.versicherungswert_cent or ls.warenwert_cent or 0), str(naechster_werktag(e.get("abholung_tage") or 1)))
    tarife = tarife_normalisieren(roh.get("serviceList"), int(e.get("aufschlag_cent") or 0), int(e.get("versand_ust_promille") or 200))
    if not tarife:
        raise ShippingError("keine_tarife")
    bevorzugt = [x for x in str(e.get("bevorzugte_carrier") or "").splitlines() if x.strip()]
    empf = waehle_dienst(tarife, e.get("dienst_wahl") or "guenstigster", bevorzugt)
    gueltig = int(e.get("quote_gueltig_min") or 30) * 60
    ergebnis = {
        "tarife": [{k: v for k, v in t.items() if k != "raw"} for t in tarife],
        "roh": {t["id"]: t["raw"] for t in tarife},
        "empfehlung": empf["id"] if empf else None,
        "env": client.umgebung,
        "gueltig_bis": frappe.utils.add_to_date(now_datetime(), seconds=gueltig).isoformat(),
    }
    frappe.cache().set_value(_cache_key(ls.name), ergebnis, expires_in_sec=gueltig)
    return ergebnis


def sendung_anlegen(ls, tarif_id=None, richtung="Ausgang", retoure=None):
    """PH Sendung aus Lieferschein (Angelegt). Bei tarif_id werden Dienst und Preis aus dem Tarif-Cache übernommen."""
    angebot = frappe.cache().get_value(_cache_key(ls.name)) or {}
    tarif = next((t for t in angebot.get("tarife", []) if t["id"] == tarif_id), None) if tarif_id else None
    if tarif_id and not tarif:
        # Angebot abgelaufen → neu abfragen (Preis kann abweichen; Nutzer sieht ihn in der Sendung)
        angebot = tarife_fuer_lieferschein(ls, neu=True)
        tarif = next((t for t in angebot.get("tarife", []) if t["id"] == tarif_id), None)
        if not tarif:
            raise ShippingError("tarif_abgelaufen", tarif_id)
    ziel = ziel_aus_lieferschein(ls)
    berechnet = None
    if ls.bestellung and frappe.db.exists("DocType", "PH Bestellung") and frappe.get_meta("PH Bestellung").has_field("versand_cent"):
        berechnet = frappe.db.get_value("PH Bestellung", ls.bestellung, "versand_cent")
    s = frappe.get_doc(
        {
            "doctype": "PH Sendung",
            "richtung": richtung,
            "dienstleister": "LetMeShip",
            "lieferschein": ls.name,
            "retoure": retoure,
            "bestellung": ls.bestellung,
            "kontakt": ls.kontakt,
            "carrier": tarif["carrier"] if tarif else None,
            "service_id": tarif["id"] if tarif else None,
            "service_name": tarif["name"] if tarif else None,
            "laufzeit_tage": tarif.get("tage") if tarif else None,
            "preis_netto_cent": tarif.get("netto_cent") if tarif else None,
            "preis_brutto_cent": tarif["cent"] if tarif else None,
            "berechnet_cent": berechnet,
            "versicherung": int(bool(ls.versichern)),
            "versicherungswert_cent": ls.versicherungswert_cent if ls.versichern else 0,
            "warenwert_cent": ls.warenwert_cent,
            "anzahl_pakete": len(ls.pakete) or 1,
            "gewicht_g": ls.gesamtgewicht_g,
            "abholdatum": naechster_werktag(einstellungen().get("abholung_tage") or 1),
            "referenz": (ls.bestellung or ls.auftrag or ls.name)[:35],
            "env": angebot.get("env") or get_client().umgebung,
            "tarife_json": json.dumps(angebot.get("tarife") or [], ensure_ascii=False, default=str) if angebot else None,
            "quelle": "packtisch",
            **{f"empf_{k}": v for k, v in ziel.items() if k != "name"},
            "empf_name": ziel["name"],
        }
    )
    if richtung == "Retoure":
        # Retourenlabel: Adressen getauscht – Empfänger = Absender (Showroom); Abholung beim Kunden
        a = absender()
        s.update({f"empf_{k}": v for k, v in a.items() if k != "name"})
        s.empf_name = a["name"]
    s.flags.service_roh = (angebot.get("roh") or {}).get(tarif_id) if tarif else None
    s.insert()
    for p in ls.pakete:
        if not p.sendung:
            frappe.db.set_value("PH Lieferschein Paket", p.name, "sendung", s.name, update_modified=False)
    return s


def buchen(sendung, service_roh=None):
    """POST shipments → AWB → Etikett als privater Anhang. Status Etikett."""
    if sendung.status not in ("Angelegt", "Problem"):
        frappe.throw(_("Sendung ist bereits gebucht oder storniert."))
    if sendung.dienstleister != "LetMeShip":
        frappe.throw(_("Nur LetMeShip-Sendungen werden automatisch gebucht."))
    client = get_client()
    ls = frappe.get_doc("PH Lieferschein", sendung.lieferschein) if sendung.lieferschein else None
    pakete = getattr(sendung.flags, "pakete", None) or (pakete_aus_lieferschein(ls) if ls else None) or [{"laenge_cm": 30, "breite_cm": 20, "hoehe_cm": 15, "gewicht_g": sendung.gewicht_g or 1000, "menge": sendung.anzahl_pakete or 1, "inhalt": sendung.inhalt}]
    ziel = {
        "name": sendung.empf_name, "firma": sendung.empf_firma, "strasse": sendung.empf_strasse, "hausnr": sendung.empf_hausnr, "zusatz": sendung.empf_zusatz,
        "plz": sendung.empf_plz, "ort": sendung.empf_ort, "land": sendung.empf_land or "AT", "email": sendung.empf_email, "telefon": sendung.empf_telefon,
    }
    von, nach = (absender(), ziel)
    if sendung.richtung == "Retoure":
        # Abholung beim Kunden (Lieferadresse des Lieferscheins), Zustellung an uns
        if ls:
            von = ziel_aus_lieferschein(ls)
        nach = ziel
    service = service_roh or getattr(sendung.flags, "service_roh", None) or {"baseServiceDetails": {"id": sendung.service_id, "carrier": sendung.carrier, "name": sendung.service_name}}
    try:
        created = client.sendung_anlegen(von, nach, pakete, bool(sendung.versicherung), int(sendung.versicherungswert_cent or sendung.warenwert_cent or 0), str(sendung.abholdatum or naechster_werktag()), service, sendung.referenz or sendung.name)
        sid = str(created.get("shipmentId"))
        detail = client.sendung_details(sid)
        awb = ((detail or {}).get("trackingData") or {}).get("awbNumber")
        carrier = (((created.get("service") or {}).get("baseServiceDetails") or {}).get("carrier")) or sendung.carrier
        pdf = client.etikett(sid)
    except ShippingError as e:
        sendung.db_set({"fehler": f"{e.code}: {e.detail or ''}"[:300]})
        frappe.throw(_("LetMeShip-Buchung fehlgeschlagen ({0}).").format(e.code))
    datei = frappe.get_doc(
        {"doctype": "File", "file_name": f"Etikett-{sendung.name}.pdf", "attached_to_doctype": "PH Sendung", "attached_to_name": sendung.name, "attached_to_field": "etikett", "is_private": 1, "content": pdf}
    ).insert(ignore_permissions=True)
    jetzt = now_datetime()
    sendung.db_set(
        {
            "shipment_id": sid,
            "tracking_nr": awb,
            "carrier": carrier,
            "tracking_url": tracking_link(carrier, awb),
            "etikett": datei.file_url,
            "etikett_abgerufen_am": jetzt,
            "gebucht_am": jetzt,
            "env": client.umgebung,
            "fehler": None,
        }
    )
    sendung.append("tracking_verlauf", {"zeit": jetzt, "status": "Etikett", "code": "BOOKED", "ort": "", "text": _("Gebucht, Etikett abgerufen")})
    sendung.flags.ignore_validate_update_after_submit = True
    sendung.save(ignore_permissions=True)
    setze_status(sendung, "Etikett")
    return sendung


def tracking_abgleich(sendung):
    """GET tracking → Verlauf ergänzen, Status vorwärts setzen. Gibt neuen Status zurück. Fehler → Feld `fehler`, kein Wurf."""
    if not sendung.shipment_id or sendung.status in ("Zugestellt", "Storniert"):
        return sendung.status
    try:
        d = get_client().tracking(sendung.shipment_id)
    except ShippingError as e:
        sendung.db_set({"fehler": f"tracking {e.code}"[:300], "letzter_abgleich": now_datetime()})
        return sendung.status
    code = d.get("lmsTrackingStatus")
    neu = status_aus_tracking(code)
    ziel = naechster_status(sendung.status, neu)
    jetzt = now_datetime()
    werte = {"letzter_abgleich": jetzt, "fehler": None}
    if d.get("awbNumber") and not sendung.tracking_nr:
        werte["tracking_nr"] = d["awbNumber"]
        werte["tracking_url"] = tracking_link(d.get("carrier") or sendung.carrier, d["awbNumber"])
    letzter = sendung.tracking_verlauf[-1].code if sendung.tracking_verlauf else None
    if code and code != letzter:
        ev = (d.get("events") or [{}])[-1]
        sendung.append("tracking_verlauf", {"zeit": jetzt, "status": ziel, "code": str(code)[:60], "ort": str(ev.get("location") or "")[:120], "text": str(ev.get("text") or "")[:140]})
        sendung.save(ignore_permissions=True)
    if ziel != sendung.status:
        if ziel == "Unterwegs":
            werte["unterwegs_seit"] = jetzt
        if ziel == "Zugestellt":
            werte["zugestellt_am"] = jetzt
        sendung.db_set(werte)
        setze_status(sendung, ziel)
        _lieferschein_nachziehen(sendung, ziel)
    else:
        sendung.db_set(werte)
    return ziel


def _lieferschein_nachziehen(sendung, status):
    """Ausgangssendung zugestellt → Lieferschein Zugestellt; unterwegs → Uebergeben."""
    if sendung.richtung != "Ausgang" or not sendung.lieferschein:
        return
    try:
        ls = frappe.get_doc("PH Lieferschein", sendung.lieferschein)
        if status == "Unterwegs" and ls.status == "Gepackt":
            setze_status(ls, "Uebergeben", uebergeben_am=now_datetime(), uebergeben_an="Dienstleister")
        elif status == "Zugestellt" and ls.status in ("Gepackt", "Uebergeben"):
            setze_status(ls, "Zugestellt", zugestellt_am=now_datetime())
    except Exception:  # noqa: BLE001
        frappe.log_error(title="ph_logistik: Lieferschein-Status aus Tracking")


def stornieren(sendung, grund=None):
    if sendung.status in ("Zugestellt", "Storniert"):
        frappe.throw(_("Sendung kann nicht mehr storniert werden."))
    if sendung.shipment_id and sendung.dienstleister == "LetMeShip":
        try:
            get_client().stornieren(sendung.shipment_id)
        except ShippingError as e:
            frappe.throw(_("Storno beim Dienstleister fehlgeschlagen ({0}). Bitte telefonisch stornieren.").format(e.code))
    sendung.db_set({"storniert_am": now_datetime(), "storno_grund": grund})
    setze_status(sendung, "Storniert")
    if sendung.lieferschein:
        for p in frappe.get_all("PH Lieferschein Paket", {"parent": sendung.lieferschein, "sendung": sendung.name}, pluck="name"):
            frappe.db.set_value("PH Lieferschein Paket", p, "sendung", None, update_modified=False)
    return sendung


# ── Retourenlabel zu Lieferschein / Warenrücknahme (Integration Runde 3) ─────

def tarife_fuer_retoure(ls, pakete):
    """Tarife für die Rücksendung: Abholung beim Kunden → Absender. → {"tarife", "roh", "empfehlung", "env"}"""
    from .retoure import retoure_plan

    e = einstellungen()
    laender = [x.strip().upper() for x in str(e.get("laender_versand") or "AT\nDE").splitlines() if x.strip()]
    plan = retoure_plan(ziel_aus_lieferschein(ls), absender(), pakete, laender, ls.name)
    client = get_client()
    roh = client.verfuegbar(plan["von"], plan["nach"], plan["pakete"], False, 0, str(naechster_werktag(e.get("abholung_tage") or 1)))
    tarife = tarife_normalisieren(roh.get("serviceList"), int(e.get("aufschlag_cent") or 0), int(e.get("versand_ust_promille") or 200))
    if not tarife:
        raise ShippingError("keine_tarife")
    bevorzugt = [x for x in str(e.get("bevorzugte_carrier") or "").splitlines() if x.strip()]
    empf = waehle_dienst(tarife, e.get("dienst_wahl") or "guenstigster", bevorzugt)
    return {"tarife": [{k: v for k, v in t.items() if k != "raw"} for t in tarife], "roh": {t["id"]: t["raw"] for t in tarife}, "empfehlung": empf["id"] if empf else None, "env": client.umgebung, "plan": plan}


def retourenlabel_erzeugen(ls, warenruecknahme=None, menge_zurueck=None, tarif_id=None):
    """PH Sendung (richtung Retoure) zum Lieferschein anlegen und buchen – Etikett als privater Anhang (Mock ohne Netz,
    solange Testmodus/keine Zugangsdaten). Idempotent: offene Retoure-Sendung zu Lieferschein/Warenrücknahme wird
    zurückgegeben. → PH Sendung"""
    from .retoure import retoure_pakete

    filt = {"lieferschein": ls.name, "richtung": "Retoure", "status": ("not in", ("Storniert",))}
    if warenruecknahme and frappe.get_meta("PH Sendung").has_field("warenruecknahme"):
        filt["warenruecknahme"] = warenruecknahme
    vorhanden = frappe.db.get_value("PH Sendung", filt, "name")
    if vorhanden:
        s = frappe.get_doc("PH Sendung", vorhanden)
        if s.status in ("Angelegt", "Problem"):
            buchen(s)
            s.reload()
        return s
    menge_gesamt = sum(int(p.menge or 0) for p in ls.positionen) or None
    pakete = retoure_pakete(pakete_aus_lieferschein(ls), menge_gesamt, menge_zurueck)
    t = tarife_fuer_retoure(ls, pakete)
    tarif = next((x for x in t["tarife"] if x["id"] == (tarif_id or t["empfehlung"])), None)
    plan = t["plan"]
    s = frappe.get_doc({
        "doctype": "PH Sendung", "richtung": "Retoure", "dienstleister": "LetMeShip", "lieferschein": ls.name, "bestellung": ls.bestellung, "kontakt": ls.kontakt,
        "warenruecknahme": warenruecknahme, "carrier": tarif["carrier"] if tarif else None, "service_id": tarif["id"] if tarif else None, "service_name": tarif["name"] if tarif else None,
        "laufzeit_tage": tarif.get("tage") if tarif else None, "preis_netto_cent": tarif.get("netto_cent") if tarif else None, "preis_brutto_cent": tarif["cent"] if tarif else None,
        "anzahl_pakete": len(pakete), "gewicht_g": sum(int(p.get("gewicht_g") or 0) for p in pakete), "inhalt": "Retoure", "abholdatum": naechster_werktag(einstellungen().get("abholung_tage") or 1),
        "referenz": plan["referenz"], "env": t["env"], "tarife_json": json.dumps(t["tarife"], ensure_ascii=False, default=str), "quelle": "backoffice",
        **{f"empf_{k}": v for k, v in plan["nach"].items() if k != "name"}, "empf_name": plan["nach"].get("name"),
    })
    s.flags.service_roh = t["roh"].get(tarif["id"]) if tarif else None
    s.insert()
    s.flags.pakete = pakete
    s.flags.service_roh = t["roh"].get(tarif["id"]) if tarif else None
    buchen(s, s.flags.service_roh)
    s.reload()
    return s
