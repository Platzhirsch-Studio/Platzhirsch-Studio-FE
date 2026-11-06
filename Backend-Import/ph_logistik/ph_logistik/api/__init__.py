"""Whitelisted Methoden von ph_logistik für die Website (Token des Benutzers website@platzhirsch.studio).

Ersetzt den heutigen Direktaufruf von LetMeShip aus der Website (src/lib/commerce/shipping/index.js versandTarif):
  get_shipping_quote(zeilen, ziel, warenwert_cent)   → Antwortform wie versandTarif(): {ok, cent, quelle, dienst{id,carrier,name,tage},
                                                        versichert, zerbrechlich, tarifId, ablauf, pakete} | {ok: false, fehler}
  create_shipment(bestellung | lieferschein, tarif_id) → Lieferschein (falls nötig) + Sendung buchen → {sendung, tracking_nr, etikett, status}
  get_tracking(referenz)                              → Bestätigungsseite: Status, Carrier, Tracking-Link (keine personenbezogenen Daten)
  portal_deliveries(kontakt, kunde_token)             → Kundenportal: Lieferungen des Kontakts
Interne Methoden (Desk, Client Scripts anderer Apps): lieferschein_aus_bestellung, lieferschein_aus_auftrag, retourenlabel.
Fehlercodes wie Website: invalid 400, not_found 404, conflict 409, unavailable 503 (CONVENTIONS.md 11).
"""

import json

import frappe
from frappe import _
from frappe.utils import add_to_date, now_datetime

from ph_core.api import ApiFehler, pflicht, ph_api

from ph_logistik.letmeship import ShippingError
from ph_logistik.letmeship.tarife import pakete_pruefen, tarife_normalisieren, waehle_dienst
from ph_logistik.ph_logistik.helfer import absender, einstellungen, naechster_werktag


def _liste(v):
    if isinstance(v, str):
        v = json.loads(v or "[]")
    return v or []


def _dict(v):
    if isinstance(v, str):
        v = json.loads(v or "{}")
    return v or {}


@frappe.whitelist(allow_guest=False, methods=["POST"])
@ph_api(idempotent=False, limit_pro_minute=120)
def get_shipping_quote(zeilen=None, ziel=None, warenwert_cent=0, **_rest):
    """zeilen: [{slug, name, menge, gewichtG, laengeCm, breiteCm, hoeheCm, zerbrechlich, kategorie, paketprofil}] – Maße aus
    Website-Paketprofil (paketeOf) oder PH Paketprofil-Key; ziel: {land, plz, ort, strasse?, hausnr?, name?}."""
    zeilen, ziel = _liste(zeilen), _dict(ziel)
    if not zeilen:
        return {"ok": False, "fehler": "leer"}
    pflicht(ziel, "land", "plz", "ort")
    e = einstellungen()
    land = str(ziel["land"]).upper()
    laender = [x.strip().upper() for x in str(e.get("laender_versand") or "AT\nDE").splitlines() if x.strip()]
    if land not in laender:
        return {"ok": False, "fehler": "land_ch" if land == "CH" else "land"}
    from ph_logistik.ph_logistik.doctype.ph_paketprofil.ph_paketprofil import profile_map

    profile = profile_map(nur_aktiv=False)
    modus = "test" if (e.get("letmeship_testmodus") or not e.get("letmeship_konfiguriert")) else "live"
    pakete, fehlend, gesperrt = [], [], []
    versichert = zerbrechlich = kerze = False
    for z in zeilen:
        pr = profile.get(z.get("paketprofil")) if z.get("paketprofil") else None
        if pr and pr.get("versand_gesperrt"):
            gesperrt.append(z.get("paketprofil"))
            fehlend.append(z.get("kategorie") or z.get("paketprofil"))
            continue
        if pr and not pr.get("geprueft") and modus != "test":
            pr = None  # Schätzung gilt nur im Testmodus (paketprofile.js GATE)
        p = {
            "laenge_cm": z.get("laengeCm") or (pr or {}).get("laenge_cm"),
            "breite_cm": z.get("breiteCm") or (pr or {}).get("breite_cm"),
            "hoehe_cm": z.get("hoeheCm") or (pr or {}).get("hoehe_cm"),
            "gewicht_g": z.get("gewichtG") or (pr or {}).get("gewicht_g"),
            "menge": int(z.get("menge") or 1),
            "inhalt": str(z.get("name") or "")[:35],
        }
        if pakete_pruefen([p]):
            fehlend.append(z.get("kategorie") or z.get("slug") or "?")
        pakete.append(p)
        zb = bool(z.get("zerbrechlich")) or bool((pr or {}).get("zerbrechlich") or (pr or {}).get("glas"))
        zerbrechlich = zerbrechlich or zb
        kerze = kerze or bool((pr or {}).get("kerze"))
    versichert = zerbrechlich and bool(e.get("glas_immer_versichern", 1)) or (int(warenwert_cent or 0) >= int(e.get("versicherung_ab_cent") or 10**12))
    hinweise = {"versichert": versichert, "zerbrechlich": zerbrechlich, "kerze": kerze}
    if fehlend:
        return {"ok": False, "fehler": "profil_fehlt", "kategorien": sorted(set(fehlend)), "gesperrt": sorted(set(gesperrt)), **hinweise}
    from ph_logistik.letmeship.dienst import get_client

    client = get_client()
    z = {"land": land, "plz": ziel.get("plz"), "ort": ziel.get("ort"), "strasse": ziel.get("strasse"), "hausnr": ziel.get("hausnr"), "name": ziel.get("name") or "Kunde", "email": "", "telefon": ""}
    try:
        roh = client.verfuegbar(absender(), z, pakete, versichert, int(warenwert_cent or 0), str(naechster_werktag(e.get("abholung_tage") or 1)))
        tarife = tarife_normalisieren(roh.get("serviceList"), int(e.get("aufschlag_cent") or 0), int(e.get("versand_ust_promille") or 200))
        if not tarife:
            raise ShippingError("keine_tarife")
    except ShippingError as err:
        pausch = e.get(f"pauschale_{land.lower()}_cent")
        if pausch and err.code != "keine_tarife":
            return {"ok": True, "cent": int(pausch), "quelle": "pauschale", "dienst": None, "rueckfall": True, **hinweise}
        return {"ok": False, "fehler": "keine_tarife" if err.code == "keine_tarife" else "api", **hinweise}
    bevorzugt = [x for x in str(e.get("bevorzugte_carrier") or "").splitlines() if x.strip()]
    t = waehle_dienst(tarife, e.get("dienst_wahl") or "guenstigster", bevorzugt)
    ablauf = add_to_date(now_datetime(), minutes=int(e.get("quote_gueltig_min") or 30))
    tarif_id = f"q-{frappe.generate_hash(length=10)}"
    frappe.cache().set_value(f"ph_logistik:quote:{tarif_id}", {"tarif": {k: v for k, v in t.items() if k != "raw"}, "roh": t["raw"], "pakete": pakete, "ziel": z, "versichert": versichert, "warenwert_cent": int(warenwert_cent or 0)}, expires_in_sec=int(e.get("quote_gueltig_min") or 30) * 60)
    return {
        "ok": True,
        "cent": t["cent"],
        "quelle": "mock" if client.mock else "letmeship",
        "dienst": {"id": t["id"], "carrier": t["carrier"], "name": t["name"], "tage": t.get("tage")},
        "tarifId": tarif_id,
        "ablauf": ablauf.isoformat(),
        "pakete": pakete,
        **hinweise,
    }


@frappe.whitelist(allow_guest=False, methods=["POST"])
@ph_api(idempotent=True, referenz=lambda r: ("PH Sendung", r["sendung"]))
def create_shipment(bestellung=None, lieferschein=None, tarif_id=None, **_rest):
    """Sendung aus Bestellung (legt Lieferschein an) oder Lieferschein buchen. tarif_id = Service-ID oder Quote-ID (q-…)."""
    if not (bestellung or lieferschein):
        raise ApiFehler("invalid", 400, _("bestellung oder lieferschein nötig"))
    if lieferschein:
        if not frappe.db.exists("PH Lieferschein", lieferschein):
            raise ApiFehler("not_found", 404)
        ls = frappe.get_doc("PH Lieferschein", lieferschein)
    else:
        from ph_logistik.ph_logistik.doctype.ph_lieferschein.ph_lieferschein import lieferschein_aus_bestellung

        if not frappe.db.exists("PH Bestellung", bestellung):
            raise ApiFehler("not_found", 404)
        ls = lieferschein_aus_bestellung(bestellung)
    if ls.lieferart not in ("Versand", "Spedition"):
        raise ApiFehler("conflict", 409, _("Lieferart ist nicht Versand."))
    if frappe.db.exists("PH Sendung", {"lieferschein": ls.name, "richtung": "Ausgang", "status": ("in", ["Angelegt", "Etikett", "Unterwegs", "Zugestellt"])}):
        s = frappe.db.get_value("PH Sendung", {"lieferschein": ls.name, "richtung": "Ausgang", "status": ("in", ["Angelegt", "Etikett", "Unterwegs", "Zugestellt"])}, ["name", "status", "tracking_nr", "tracking_url", "etikett"], as_dict=True)
        return {"sendung": s.name, "status": s.status, "tracking_nr": s.tracking_nr, "tracking_url": s.tracking_url, "etikett": s.etikett}
    service_id = tarif_id
    if tarif_id and str(tarif_id).startswith("q-"):
        q = frappe.cache().get_value(f"ph_logistik:quote:{tarif_id}")
        if not q:
            raise ApiFehler("expired", 410, _("Tarif abgelaufen – bitte neu abfragen."))
        if not ls.pakete:
            for i, p in enumerate(q["pakete"], start=1):
                ls.append("pakete", {"paket_nr": i, **{k: p.get(k) for k in ("laenge_cm", "breite_cm", "hoehe_cm", "gewicht_g", "inhalt")}})
            ls.versichern = int(bool(q.get("versichert")))
            ls.versicherungswert_cent = q.get("warenwert_cent") if q.get("versichert") else 0
            ls.save(ignore_permissions=True)
        service_id = q["tarif"]["id"]
    if not ls.pakete:
        raise ApiFehler("invalid", 400, _("Lieferschein hat keine Pakete."))
    try:
        from ph_logistik.letmeship.dienst import tarife_fuer_lieferschein

        if not service_id:
            service_id = tarife_fuer_lieferschein(ls).get("empfehlung")
        else:
            tarife_fuer_lieferschein(ls)  # Cache füllen, damit Preis/Dienst in die Sendung kommen
        name = ls.etikett_erzeugen(service_id)
    except ShippingError as e:
        raise ApiFehler("unavailable", 503, _("Versanddienst nicht erreichbar ({0}).").format(e.code))
    s = frappe.db.get_value("PH Sendung", name, ["name", "status", "tracking_nr", "tracking_url", "etikett"], as_dict=True)
    return {"sendung": s.name, "status": s.status, "tracking_nr": s.tracking_nr, "tracking_url": s.tracking_url, "etikett": s.etikett}


@frappe.whitelist(allow_guest=False, methods=["GET", "POST"])
@ph_api(limit_pro_minute=120)
def get_tracking(referenz=None, **_rest):
    """referenz = Bestellnummer, Lieferschein oder Sendung. Ohne personenbezogene Daten."""
    if not referenz:
        raise ApiFehler("invalid", 400)
    filt = {"richtung": "Ausgang", "status": ("!=", "Storniert")}
    if frappe.db.exists("PH Sendung", referenz):
        name = referenz
    else:
        name = frappe.db.get_value("PH Sendung", {**filt, "bestellung": referenz}, "name", order_by="creation desc") or frappe.db.get_value("PH Sendung", {**filt, "lieferschein": referenz}, "name", order_by="creation desc")
    if not name:
        ls = frappe.db.get_value("PH Lieferschein", {"bestellung": referenz, "status": ("!=", "Storniert")}, ["name", "status", "lieferart", "zugestellt_am"], as_dict=True)
        if not ls:
            raise ApiFehler("not_found", 404)
        return {"referenz": referenz, "status": ls.status, "lieferart": ls.lieferart, "zugestellt_am": ls.zugestellt_am.isoformat() if ls.zugestellt_am else None, "tracking": None}
    s = frappe.get_doc("PH Sendung", name)
    return {
        "referenz": referenz,
        "status": s.status,
        "carrier": s.carrier,
        "dienst": s.service_name,
        "tracking_nr": s.tracking_nr,
        "tracking_url": s.tracking_url,
        "laufzeit_tage": s.laufzeit_tage,
        "gebucht_am": s.gebucht_am.isoformat() if s.gebucht_am else None,
        "zugestellt_am": s.zugestellt_am.isoformat() if s.zugestellt_am else None,
        "verlauf": [{"zeit": v.zeit.isoformat() if v.zeit else None, "status": v.status, "ort": v.ort, "text": v.text} for v in s.tracking_verlauf],
    }


@frappe.whitelist(allow_guest=False, methods=["GET", "POST"])
@ph_api(limit_pro_minute=60)
def portal_deliveries(kontakt=None, kunde_token=None, **_rest):
    """Kundenportal: Lieferungen des Kontakts (Token-Prüfung gegen PH Kontakt.portal_token_hash, CONVENTIONS 11)."""
    if not kontakt or not kunde_token:
        raise ApiFehler("invalid", 400)
    import hashlib

    if not frappe.db.exists("DocType", "PH Kontakt") or not frappe.get_meta("PH Kontakt").has_field("portal_token_hash"):
        raise ApiFehler("unavailable", 503)
    soll = frappe.db.get_value("PH Kontakt", kontakt, "portal_token_hash")
    if not soll or hashlib.sha256(str(kunde_token).encode()).hexdigest() != soll:
        raise ApiFehler("invalid_token", 404)
    rows = frappe.get_all("PH Lieferschein", {"kontakt": kontakt, "status": ("!=", "Storniert")}, ["name", "status", "lieferart", "datum", "wunschtermin", "zugestellt_am", "bestellung", "auftrag"], order_by="datum desc", limit=100)
    out = []
    for r in rows:
        s = frappe.db.get_value("PH Sendung", {"lieferschein": r.name, "richtung": "Ausgang", "status": ("!=", "Storniert")}, ["carrier", "tracking_nr", "tracking_url", "status"], as_dict=True)
        out.append({"id": r.name, "status": r.status, "lieferart": r.lieferart, "datum": str(r.datum), "wunschtermin": str(r.wunschtermin) if r.wunschtermin else None, "zugestellt_am": r.zugestellt_am.isoformat() if r.zugestellt_am else None, "bestellung": r.bestellung, "auftrag": r.auftrag, "sendung": s})
    return {"lieferungen": out}


# ── Intern (Desk / Client Scripts anderer Apps) ───────────────────────────

@frappe.whitelist()
def lieferschein_aus_bestellung(bestellung, lieferart=None):
    from ph_logistik.ph_logistik.doctype.ph_lieferschein.ph_lieferschein import lieferschein_aus_bestellung as f

    frappe.has_permission("PH Lieferschein", "create", throw=True)
    return f(bestellung, lieferart=lieferart).name


@frappe.whitelist()
def lieferschein_aus_auftrag(auftrag, positionen=None, lieferart="Eigenlieferung"):
    from ph_logistik.ph_logistik.doctype.ph_lieferschein.ph_lieferschein import lieferschein_aus_auftrag as f

    frappe.has_permission("PH Lieferschein", "create", throw=True)
    if isinstance(positionen, str):
        positionen = json.loads(positionen or "null")
    return f(auftrag, positionen=positionen, lieferart=lieferart).name


@frappe.whitelist()
def retourenlabel(retoure):
    from ph_logistik.ph_logistik.doctype.ph_sendung.ph_sendung import retourenlabel_fuer_retoure

    frappe.has_permission("PH Sendung", "create", throw=True)
    return retourenlabel_fuer_retoure(retoure).name


@frappe.whitelist(allow_guest=False, methods=["GET", "POST"])
@ph_api(limit_pro_minute=60)
def get_ausstellungsstuecke(lagerort=None, marke=None, **_rest):
    """Website „Abverkauf/Ausstellungsstücke“: verfügbare Ausstellungsstücke ohne EK, Preis nur als Abverkaufspreis
    (vk_cent_ausstellung; 0 → amount null, „auf Anfrage“). Reservierte Stücke erscheinen mit reserviert=true."""
    filt = {"ausstellungsstueck": 1, "status": ("in", ["Verfuegbar", "Reserviert"]), "gesperrt": 0}
    if lagerort:
        filt["lagerort"] = lagerort
    if marke:
        filt["marke"] = marke
    rows = frappe.get_all("PH Lagerbestand", filt, ["name", "produkt", "produkt_name", "marke", "zustand", "lagerort", "vk_cent_ausstellung", "waehrung", "status", "eingang_am"], order_by="eingang_am desc", limit=500)
    from ph_logistik.ph_logistik.helfer import produkt_info

    aus = []
    for r in rows:
        info = produkt_info(r.produkt)
        cent = int(r.vk_cent_ausstellung or 0)
        aus.append({
            "id": r.name, "produkt": r.produkt, "slug": info.get("slug") or r.produkt, "name": r.produkt_name, "marke": r.marke, "zustand": r.zustand,
            "standort": r.lagerort, "bild": info.get("bild"), "amount": cent or None, "currency": r.waehrung or "EUR", "amountNote": None if cent else "auf Anfrage",
            "reserviert": r.status == "Reserviert",
        })
    return {"ausstellungsstuecke": aus, "anzahl": len(aus)}


@frappe.whitelist()
def speditionsauftrag_aus_herstellerbestellung(herstellerbestellung, richtung="Hersteller an Lager"):
    """Button an PH Herstellerbestellung (ph_sortiment, Client-Script dort oder hier): Abholung beim Hersteller beauftragen."""
    from ph_logistik.ph_logistik.doctype.ph_speditionsauftrag.ph_speditionsauftrag import aus_herstellerbestellung

    return aus_herstellerbestellung(herstellerbestellung, richtung)


@frappe.whitelist()
def warenruecknahme_aus_lieferschein(lieferschein):
    from ph_logistik.ph_logistik.doctype.ph_warenruecknahme.ph_warenruecknahme import aus_lieferschein

    return aus_lieferschein(lieferschein)
