"""Whitelisted Methoden von ph_shop für die Website (Token des Benutzers website@platzhirsch.studio).

Feldnamen und Ereignistypen sind die der Website, damit sie ohne Umbau anbinden kann:
  create_order(record)            Datensatz aus src/lib/shop/handlers.js (id, token, status, lieferart, zahlung,
                                  kunde{}, adresse{}, zeilen[], summen{}, versand{}, locale, angelegt) → {referenz, status}
  attach_session(referenz, session, payment_intent)
  get_order(referenz, token)      Bestätigungsseite (orderView): ohne Personendaten außer Vorname
  order_event(referenz, typ, …)   Website-Webhook spiegelt Statuswechsel (bis Migrationsschritt M6)
  get_pickup_status(referenz, abholcode)
  create_voucher_order(record)    src/lib/payments/voucherOrder.js newVoucherOrder → {referenz, status}
  get_voucher(code)               nur Status/Restwert (Hash-Vergleich)
  redeem_voucher(code, betrag_cent, kanal, beleg)      Gutscheinregister „einloesen“
  block_voucher(code, grund) / replace_voucher(code)   Register „sperren“ / „ersetzen“
  create_deposit(record) / get_deposit(id|auftrag|kunde)   src/lib/payments/deposit.js
  payment_event(event)            Ereignisschema v1 aus src/lib/payments/backoffice.js
  request_withdrawal(…)           Widerrufsformulare api/shop/widerruf und api/payments/widerruf
Fehlercodes (body.code): invalid 400, forbidden 403, not_found 404, conflict 409, expired 410, unavailable 503.
"""

import json
import re
from zoneinfo import ZoneInfo

import frappe
from frappe.utils import cint, get_datetime, get_system_timezone, now_datetime

from ph_core.api import ApiFehler, ip_hash, pflicht, ph_api, text
from ph_shop import gutschein_code as gc
from ph_shop.ph_shop import status as st

BESTELLNUMMER_RE = re.compile(r"^PH-S-\d{6}-[A-F0-9]{6}$")
GUTSCHEIN_BESTELLUNG_RE = re.compile(r"^G-[A-Z0-9]{4}-[A-Z0-9]{4}$")
ANZAHLUNG_RE = re.compile(r"^AZ-[A-Z0-9]{4}-[A-Z0-9]{4}$")


def _dict(wert):
    if isinstance(wert, str):
        try:
            return json.loads(wert)
        except ValueError:
            raise ApiFehler("invalid", 400, "Ungültiges JSON.")
    return wert or {}


def _text_lokal(wert, sprache="de"):
    """varianteName kann String oder {de,en,fr,it} sein (katalog/schema.js textOf)."""
    if isinstance(wert, dict):
        return str(wert.get(sprache) or wert.get("de") or next(iter(wert.values()), "") or "")
    return str(wert or "")


def _zeit(wert):
    """ISO 8601 der Website (meist UTC mit Z) → naive Datetime in Site-Zeitzone; leer → jetzt."""
    if not wert:
        return now_datetime()
    dt = get_datetime(wert)
    if dt.tzinfo:
        dt = dt.astimezone(ZoneInfo(get_system_timezone())).replace(tzinfo=None)
    return dt


# ─────────────────────────────── Bestellungen ───────────────────────────────

def _bestellung_aus_record(r):
    from ph_shop.ph_shop.doctype.ph_bestellung.ph_bestellung import pakete_json, token_hash

    kunde = r.get("kunde") or {}
    adresse = r.get("adresse") or {}
    summen = r.get("summen") or {}
    versand = r.get("versand") or {}
    dienst = versand.get("dienst") or {}
    sprache = (r.get("locale") or r.get("sprache") or "de")[:2]
    zeilen = r.get("zeilen") or r.get("positionen") or []
    if not zeilen:
        raise ApiFehler("invalid", 400, "Positionen fehlen.", {"field": "zeilen"})
    if len(zeilen) > 50:
        raise ApiFehler("invalid", 400, "Zu viele Positionen.")
    positionen = []
    for z in zeilen:
        positionen.append(
            {
                "slug": text(z.get("slug"), 140),
                "variante": text(z.get("variante"), 64),
                "variante_name": text(_text_lokal(z.get("varianteName") or z.get("variante_name"), sprache), 140),
                "bezeichnung": text(z.get("name") or z.get("bezeichnung"), 140),
                "marke": text(z.get("markeName") or z.get("marke"), 100),
                "kategorie": text(z.get("kategorie"), 60),
                "menge": cint(z.get("menge")) or 1,
                "einzel_cent": cint(z.get("einzelCent") if "einzelCent" in z else z.get("einzel_cent")),
                "summe_cent": cint(z.get("summeCent") if "summeCent" in z else z.get("summe_cent")),
                "preis_stand": z.get("preisStand") or z.get("preis_stand") or None,
                "ust_klasse": z.get("ustKlasse") or z.get("ust_klasse") or None,
                "zerbrechlich": 1 if z.get("zerbrechlich") else 0,
                "test": 1 if z.get("test") else 0,
                "bild": text(z.get("bild"), 300),
            }
        )
    status = r.get("status") or ("reserviert" if r.get("zahlung") == "vorort" else "offen")
    if status not in ("offen", "reserviert", "zahlung_ausstehend", "checkout_fehler"):
        raise ApiFehler("invalid", 400, "Neue Bestellungen nur mit Status offen/reserviert.", {"field": "status"})
    return {
        "doctype": "PH Bestellung",
        "bestellnummer": text(r.get("id") or r.get("bestellnummer") or r.get("referenz"), 40).upper() or None,
        "status": status,
        "modus": "live" if (r.get("modus") == "live" or r.get("testmodus") is False) else "test",
        "lieferart": r.get("lieferart"),
        "zahlung": r.get("zahlung") or "online",
        "sprache": sprache if sprache in ("de", "en", "fr", "it") else "de",
        "angelegt": _zeit(r.get("angelegt")),
        "kunde_name": text(kunde.get("name") or r.get("kunde_name"), 140),
        "kunde_email": text(kunde.get("email") or r.get("kunde_email"), 254),
        "kunde_telefon": text(kunde.get("telefon") or r.get("kunde_telefon"), 40),
        "adresse_land": text(adresse.get("land"), 2).upper() or None,
        "adresse_plz": text(adresse.get("plz"), 12),
        "adresse_ort": text(adresse.get("ort"), 80),
        "adresse_strasse": text(adresse.get("strasse"), 120),
        "adresse_hausnr": text(adresse.get("hausnr"), 20),
        "adresse_zusatz": text(adresse.get("zusatz"), 80),
        "positionen": positionen,
        "versand_cent": cint(summen.get("versandCent") if summen else versand.get("cent")),
        "tarif_id": text(versand.get("tarifId"), 60),
        "quelle_tarif": versand.get("quelle") if versand.get("quelle") in ("letmeship", "pauschale", "mock") else None,
        "carrier": text(dienst.get("carrier"), 60),
        "dienst": text(dienst.get("name") or versand.get("service"), 100),
        "laufzeit_tage": cint(dienst.get("tage")) or None,
        "versichert": 1 if versand.get("versichert") else 0,
        "zerbrechlich": 1 if versand.get("zerbrechlich") else 0,
        "kerze": 1 if versand.get("kerze") else 0,
        "pakete_json": pakete_json(versand.get("pakete")),
        "stripe_session": text(r.get("session"), 120) or None,
        "kunden_token_hash": token_hash(r.get("token")),
        "quelle": "website",
        "ip_hash": ip_hash(),
    }


@frappe.whitelist(allow_guest=False, methods=["POST"])
@ph_api(idempotent=True, referenz=lambda r: ("PH Bestellung", r["referenz"]))
def create_order(record=None, **d):
    r = _dict(record) if record else d
    pflicht(r, "lieferart")
    kunde = r.get("kunde") or {}
    if not (kunde.get("email") or r.get("kunde_email")):
        raise ApiFehler("invalid", 400, "Pflichtfeld fehlt: kunde.email", {"field": "kunde.email"})
    werte = _bestellung_aus_record(r)
    if werte["bestellnummer"] and frappe.db.exists("PH Bestellung", werte["bestellnummer"]):
        alt = frappe.get_doc("PH Bestellung", werte["bestellnummer"])
        return {"referenz": alt.name, "status": alt.status, "bereits_vorhanden": True}
    doc = frappe.get_doc(werte)
    doc.insert()
    summen = r.get("summen") or {}
    if summen.get("gesamtCent") is not None and cint(summen.get("gesamtCent")) != cint(doc.gesamt_cent):
        doc.add_comment("Info", f"Website-Summe {cint(summen.get('gesamtCent'))} Cent ≠ berechnet {doc.gesamt_cent} Cent – prüfen (USt-Regeln/Preise).")
    return {"referenz": doc.name, "status": doc.status}


@frappe.whitelist(allow_guest=False, methods=["POST"])
@ph_api(referenz=lambda r: ("PH Bestellung", r["referenz"]))
def attach_session(referenz, session=None, payment_intent=None, status=None):
    doc = _bestellung(referenz)
    werte = {}
    if session:
        werte["stripe_session"] = text(session, 120)
    if payment_intent:
        werte["payment_intent"] = text(payment_intent, 120)
    if status == "checkout_fehler" and doc.status == "offen":
        st.setzen(doc, "checkout_fehler", "Checkout konnte nicht erzeugt werden", "website", werte)
    elif werte:
        doc.db_set(werte, update_modified=False)
    return {"referenz": doc.name, "status": doc.status}


@frappe.whitelist(allow_guest=False, methods=["GET", "POST"])
@ph_api(limit_pro_minute=240)
def get_order(referenz, token=None):
    from ph_shop.ph_shop.doctype.ph_bestellung.ph_bestellung import token_hash

    doc = _bestellung(referenz)
    if doc.kunden_token_hash and token_hash(token) != doc.kunden_token_hash:
        raise ApiFehler("not_found", 404, "Bestellung nicht gefunden.")
    return doc.oeffentliche_sicht()


@frappe.whitelist(allow_guest=False, methods=["POST"])
@ph_api(idempotent=True, referenz=lambda r: ("PH Bestellung", r["referenz"]))
def order_event(referenz, typ=None, status=None, zeit=None, payment_intent=None, session=None, livemode=None, betrag_bezahlt_cent=None, erstattet_cent=None, sendung=None, **_rest):
    """Website-Webhook (src/lib/shop/webhook.js) spiegelt einen Statuswechsel. typ = Stripe-Event oder Status."""
    doc = _bestellung(referenz)
    doc.flags.ignore_permissions = True
    ziel = status or {"checkout.session.completed": "bezahlt", "checkout.session.async_payment_succeeded": "bezahlt", "checkout.session.async_payment_failed": "fehlgeschlagen", "checkout.session.expired": "abgelaufen", "charge.refunded": "erstattet"}.get(typ, typ)
    pseudo = {"id": session or doc.stripe_session, "payment_intent": payment_intent or doc.payment_intent, "amount_total": cint(betrag_bezahlt_cent) or doc.gesamt_cent, "currency": "eur", "payment_status": "paid"}
    live = bool(cint(livemode)) if livemode is not None else doc.modus == "live"
    if ziel == "bezahlt":
        ergebnis = doc.zahlung_eingegangen(pseudo, live)
    elif ziel == "zahlung_ausstehend":
        ergebnis = doc.zahlung_ausstehend(pseudo)
    elif ziel == "fehlgeschlagen":
        ergebnis = doc.zahlung_fehlgeschlagen(pseudo, live)
    elif ziel == "abgelaufen":
        ergebnis = doc.session_abgelaufen(pseudo)
    elif ziel in ("erstattet", "teilerstattet"):
        from ph_shop import zahlung as z

        betrag = cint(erstattet_cent)
        name = z.finde(bezug_doctype="PH Bestellung", bezug=doc.name)
        if name and betrag:
            zdoc = frappe.get_doc("PH Zahlung", name)
            delta = betrag - cint(zdoc.erstattet_cent)
            if delta > 0:
                z.erstatte(zdoc, delta, "Website: charge.refunded", stripe_refund=f"website:{doc.name}:{betrag}", quelle="website", von="website")
        ergebnis = doc.erstattung_vermerken(doc.payment_intent, betrag, ziel == "erstattet")
    elif ziel == "versandbereit":
        s = _dict(sendung) if sendung else {}
        st.setzen(doc, "versandbereit", "Sendung angelegt (Website)", "website", {"shipment_id": text(s.get("shipmentId"), 80), "awb": text(s.get("awb"), 80), "carrier": text(s.get("carrier"), 60) or doc.carrier})
        ergebnis = "versandbereit"
    elif ziel == "widerruf_eingegangen":
        st.verlauf(doc, doc.status, "Widerruf eingegangen (Website)", "website")
        ergebnis = "vermerkt"
    else:
        raise ApiFehler("invalid", 400, f"Unbekannter Ereignistyp: {typ or status}")
    return {"referenz": doc.name, "status": frappe.db.get_value("PH Bestellung", doc.name, "status"), "ergebnis": ergebnis}


@frappe.whitelist(allow_guest=False, methods=["GET", "POST"])
@ph_api(limit_pro_minute=60)
def get_pickup_status(referenz, abholcode):
    doc = _bestellung(referenz)
    if not doc.abholcode or gc.normalisiere_abhol(abholcode) != doc.abholcode:
        raise ApiFehler("not_found", 404, "Abholcode passt nicht.")
    return {"referenz": doc.name, "status": doc.status, "abholung_bis": str(doc.abholung_bis) if doc.abholung_bis else None, "positionen": sum(cint(p.menge) for p in doc.positionen), "bezahlt": bool(doc.bezahlt_am)}


def _bestellung(referenz):
    name = text(referenz, 40).upper()
    if not name or not frappe.db.exists("PH Bestellung", name):
        raise ApiFehler("not_found", 404, "Bestellung nicht gefunden.")
    return frappe.get_doc("PH Bestellung", name)


# ─────────────────────────────── Gutscheine ───────────────────────────────

@frappe.whitelist(allow_guest=False, methods=["POST"])
@ph_api(idempotent=True, referenz=lambda r: ("PH Gutschein Bestellung", r["referenz"]))
def create_voucher_order(record=None, **d):
    """newVoucherOrder (voucherOrder.js): id, betrag_cent, anzahl, motiv, empfaenger, grusstext, kaeufer{name,email,firma}, zustimmung{bedingungen,widerruf,zeit}."""
    r = _dict(record) if record else d
    kaeufer = r.get("kaeufer") or {}
    if not (kaeufer.get("email") or r.get("kaeufer_email")):
        raise ApiFehler("invalid", 400, "Pflichtfeld fehlt: kaeufer.email", {"field": "kaeufer.email"})
    betrag = cint(r.get("betrag_cent")) or cint(r.get("betrag")) * 100
    if betrag <= 0:
        raise ApiFehler("invalid", 400, "Betrag fehlt.", {"field": "betrag_cent"})
    nummer = text(r.get("id") or r.get("bestellnummer"), 20).upper() or None
    if nummer and frappe.db.exists("PH Gutschein Bestellung", nummer):
        alt = frappe.get_doc("PH Gutschein Bestellung", nummer)
        return {"referenz": alt.name, "status": alt.status, "bereits_vorhanden": True}
    zustimmung = r.get("zustimmung") or {}
    doc = frappe.get_doc(
        {
            "doctype": "PH Gutschein Bestellung",
            "bestellnummer": nummer,
            "status": "offen",
            "erstellt": _zeit(r.get("erstellt")),
            "betrag_cent": betrag,
            "anzahl": cint(r.get("anzahl")) or 1,
            "waehrung": (r.get("waehrung") or "EUR").upper(),
            "motiv": r.get("motiv") if r.get("motiv") in ("schlicht", "seelicht", "geweih") else "schlicht",
            "empfaenger": text(r.get("empfaenger"), 120),
            "grusstext": text(r.get("grusstext"), 300),
            "kaeufer_name": text(kaeufer.get("name") or r.get("kaeufer_name"), 200),
            "kaeufer_email": text(kaeufer.get("email") or r.get("kaeufer_email"), 254),
            "kaeufer_firma": text(kaeufer.get("firma") or r.get("kaeufer_firma"), 200),
            "zustimmung_bedingungen_stand": zustimmung.get("bedingungen") or None,
            "zustimmung_widerruf_stand": zustimmung.get("widerruf") or None,
            "zustimmung_zeit": _zeit(zustimmung.get("zeit")),
            "stripe_session": text(r.get("session"), 120) or None,
            "quelle": "website",
            "ip_hash": ip_hash(),
        }
    )
    doc.insert()
    return {"referenz": doc.name, "status": doc.status}


@frappe.whitelist(allow_guest=False, methods=["GET", "POST"])
@ph_api(limit_pro_minute=60)
def get_voucher(code):
    gs = _gutschein(code)
    return gs.oeffentliche_sicht()


@frappe.whitelist(allow_guest=False, methods=["POST"])
@ph_api(idempotent=True, referenz=lambda r: ("PH Gutschein", r["gutschein"]))
def redeem_voucher(code, betrag_cent, kanal="Showroom", beleg=None, beleg_doctype=None, hinweis=None):
    gs = _gutschein(code)
    gs.flags.ignore_permissions = True
    if kanal not in ("Showroom", "Online", "Kassa"):
        kanal = "Showroom"
    if cint(betrag_cent) > cint(gs.rest_cent):
        raise ApiFehler("conflict", 409, "Betrag übersteigt den Restwert.", {"rest_cent": gs.rest_cent})
    if gs.status not in ("Aktiv", "Teilweise eingeloest"):
        raise ApiFehler("expired" if gs.status in ("Abgelaufen", "Eingeloest") else "conflict", 410 if gs.status in ("Abgelaufen", "Eingeloest") else 409, f"Gutschein ist {gs.status}.")
    r = gs.einloesen(betrag_cent, kanal=kanal, beleg_doctype=beleg_doctype, beleg=text(beleg, 140) or None, hinweis=hinweis)
    return {"gutschein": gs.name, "rest_cent": r["rest_cent"], "status": r["status"]}


@frappe.whitelist(allow_guest=False, methods=["POST"])
@ph_api(referenz=lambda r: ("PH Gutschein", r["gutschein"]))
def block_voucher(code, grund="gesperrt"):
    gs = _gutschein(code)
    gs.flags.ignore_permissions = True
    gs.sperren(text(grund, 140))
    return {"gutschein": gs.name, "status": "Gesperrt"}


@frappe.whitelist(allow_guest=False, methods=["POST"])
@ph_api(idempotent=True, referenz=lambda r: ("PH Gutschein", r["gutschein"]))
def replace_voucher(code):
    gs = _gutschein(code)
    gs.flags.ignore_permissions = True
    r = gs.ersetzen()
    return {"gutschein": r["gutschein"], "code": r["code"], "rest_cent": frappe.db.get_value("PH Gutschein", r["gutschein"], "rest_cent")}


def _gutschein(code):
    from ph_shop.ph_shop.doctype.ph_gutschein.ph_gutschein import finde_nach_code

    if not gc.normalisiere(code):
        raise ApiFehler("invalid", 400, "Code hat kein gültiges Format.")
    gs = finde_nach_code(code)
    if not gs:
        raise ApiFehler("not_found", 404, "Gutschein nicht gefunden.")
    return gs


# ─────────────────────────────── Anzahlungen ───────────────────────────────

@frappe.whitelist(allow_guest=False, methods=["POST"])
@ph_api(idempotent=True, referenz=lambda r: ("PH Anzahlung", r["referenz"]))
def create_deposit(record=None, **d):
    """newDeposit (deposit.js): id, auftrag, betrag_cent, beschreibung, email, kunde, gueltig_bis."""
    r = _dict(record) if record else d
    pflicht(r, "auftrag")
    betrag = cint(r.get("betrag_cent")) or cint(r.get("betrag"))
    if betrag < 100:
        raise ApiFehler("invalid", 400, "Betrag fehlt oder unter 1 €.", {"field": "betrag_cent"})
    nummer = text(r.get("id") or r.get("anzahlung_id"), 20).upper() or None
    if nummer and frappe.db.exists("PH Anzahlung", nummer):
        alt = frappe.get_doc("PH Anzahlung", nummer)
        return {"referenz": alt.name, "status": alt.status, "bereits_vorhanden": True}
    doc = frappe.get_doc(
        {
            "doctype": "PH Anzahlung",
            "anzahlung_id": nummer,
            "auftrag_referenz": text(r.get("auftrag"), 40),
            "betrag_cent": betrag,
            "beschreibung": text(r.get("beschreibung"), 200),
            "kunde_email": text(r.get("email"), 254) or None,
            "kunde_id": text(r.get("kunde"), 64) or None,
            "erstellt": _zeit(r.get("erstellt")),
            "link_gueltig_bis": _zeit(r.get("gueltig_bis")) if r.get("gueltig_bis") else None,
            "quelle": "website",
            "ip_hash": ip_hash(),
        }
    )
    doc.insert()
    return {"referenz": doc.name, "status": doc.status, **doc.oeffentliche_sicht()}


@frappe.whitelist(allow_guest=False, methods=["GET", "POST"])
@ph_api(limit_pro_minute=120)
def get_deposit(id=None, auftrag=None, kunde=None):  # noqa: A002 – Parametername der Website
    if id:
        name = text(id, 20).upper()
        if not frappe.db.exists("PH Anzahlung", name):
            raise ApiFehler("not_found", 404, "Anzahlung nicht gefunden.")
        return frappe.get_doc("PH Anzahlung", name).oeffentliche_sicht()
    filters = {"auftrag_referenz": text(auftrag, 40)} if auftrag else ({"kunde_id": text(kunde, 64)} if kunde else None)
    if not filters:
        raise ApiFehler("invalid", 400, "id, auftrag oder kunde angeben.")
    return {"anzahlungen": [frappe.get_doc("PH Anzahlung", n).oeffentliche_sicht() for n in frappe.get_all("PH Anzahlung", filters, pluck="name", order_by="erstellt desc", limit=50)]}


# ─────────────────────────────── payment_event v1 ───────────────────────────────

@frappe.whitelist(allow_guest=False, methods=["POST"])
@ph_api(idempotent=True, referenz=lambda r: (r.get("doctype"), r.get("referenz")))
def payment_event(event=None, **d):
    """Ereignisschema v1 (backoffice.js paymentEvent): {v, typ, zeit, referenz, art, betrag_cent, waehrung,
    zahlungsstatus, stripe{session, payment_intent, livemode}, beleg?}. Idempotent über (typ, referenz, payment_intent)."""
    from ph_shop import zahlung as z

    e = _dict(event) if event else d
    if cint(e.get("v") or 1) != 1:
        raise ApiFehler("invalid", 400, "Nur Ereignisschema v1.")
    pflicht(e, "typ", "referenz", "art")
    typ, art, referenz = text(e.get("typ"), 60), text(e.get("art"), 20), text(e.get("referenz"), 60).upper()
    stripe = e.get("stripe") or {}
    beleg = e.get("beleg") or {}
    betrag = cint(e.get("betrag_cent"))
    livemode = bool(stripe.get("livemode"))
    pi = text(stripe.get("payment_intent"), 120) or None
    sid = text(stripe.get("session"), 120) or None
    zeit = _zeit(e.get("zeit"))
    zstatus = text(e.get("zahlungsstatus"), 40)
    idem = f"pe:{typ}:{referenz}:{pi or sid or zeit}"
    if frappe.db.exists("PH Stripe Ereignis", idem):
        return {"doctype": None, "referenz": referenz, "ergebnis": "wiederholt"}

    if art == "gutschein":
        doc = _gutschein_bestellung_finden_oder_anlegen(referenz, e, beleg, livemode)
        dt = "PH Gutschein Bestellung"
    elif art == "anzahlung":
        doc = _anzahlung_finden_oder_anlegen(referenz, e, beleg, livemode)
        dt = "PH Anzahlung"
    else:
        raise ApiFehler("invalid", 400, f"Unbekannte Art: {art}")
    doc.flags.ignore_permissions = True

    ergebnis = typ
    if zstatus in ("bezahlt", "pruefen") or typ.endswith(".bezahlt"):
        if pi or sid:
            zahlung = z.buche(kanal="Stripe Checkout", betrag_cent=betrag or cint(doc.get("summe_cent") or doc.get("betrag_cent")), bezug_doctype=dt, bezug=doc.name, stripe_payment_intent=pi, stripe_session=sid, livemode=livemode, zeitpunkt=zeit, quelle="website", zahlungsreferenz=doc.get("auftrag_referenz"), notiz=f"payment_event {typ}")
        else:
            zahlung = None
        if doc.status not in ("bezahlt", "erstattet", "teilerstattet"):
            extra = {"bezahlt_am": zeit, "payment_intent": pi, "stripe_session": sid, "livemode": 1 if livemode else 0, "zahlung": zahlung.name if zahlung else None}
            if dt == "PH Anzahlung":
                extra["bezahlt_session"] = sid
            st.setzen(doc, "pruefen" if zstatus == "pruefen" else "bezahlt", f"payment_event {typ}", "website", extra)
        ergebnis = "bezahlt"
    elif zstatus == "fehlgeschlagen":
        if doc.status not in ("bezahlt",):
            st.setzen(doc, "fehlgeschlagen", f"payment_event {typ}", "website", {"stripe_session": sid})
        ergebnis = "fehlgeschlagen"
    elif zstatus in ("doppelt_bezahlt",):
        zahlung = z.buche(kanal="Stripe Checkout", betrag_cent=betrag, bezug_doctype=dt, bezug=doc.name, stripe_payment_intent=pi, stripe_session=sid, livemode=livemode, zeitpunkt=zeit, quelle="website", notiz="Doppelte Zahlung – zu erstatten") if (pi or sid) else None
        if not any(x.session == sid for x in doc.doppelt):
            zeile = doc.append("doppelt", {"session": sid, "payment_intent": pi, "betrag_cent": betrag, "zeit": zeit, "zahlung": zahlung.name if zahlung else None})
            zeile.db_insert()
        st.setzen(doc, "doppelt", "payment_event anzahlung.doppelt", "website")
        ergebnis = "doppelt"
    elif zstatus in ("doppelt_erstattet",):
        doc.erstattung_vermerken(pi, betrag, True)
        ergebnis = "doppelt_erstattet"
    elif zstatus.startswith(("erstattet", "teilerstattet")):
        name = z.finde(bezug_doctype=dt, bezug=doc.name) or (z.finde(stripe_payment_intent=pi) if pi else None)
        if name and betrag:
            zdoc = frappe.get_doc("PH Zahlung", name)
            delta = betrag - cint(zdoc.erstattet_cent)
            if delta > 0:
                z.erstatte(zdoc, delta, f"payment_event {typ}", stripe_refund=f"website:{referenz}:{betrag}", quelle="website", von="website")
        doc.erstattung_vermerken(pi, betrag, zstatus.startswith("erstattet"))
        if zstatus.endswith("_pruefen"):
            from ph_shop.ph_shop.mails import aufgabe

            aufgabe(f"{dt} {doc.name}: erstattet trotz Einlösung – prüfen.", dt, doc.name)
        ergebnis = zstatus
    elif zstatus == "widerruf_eingegangen":
        st.setzen(doc, "widerrufen", "payment_event gutschein.widerruf", "website")
        ergebnis = "widerrufen"
    else:
        st.verlauf(doc, doc.status, f"payment_event {typ} ({zstatus})", "website")

    # Idempotenz-Anker im Ereignisprotokoll (Quelle website, nicht Stripe).
    frappe.get_doc({"doctype": "PH Stripe Ereignis", "event_id": idem[:140], "typ": f"website:{typ}", "titel": f"{typ} · {art} · {referenz}", "status": "verarbeitet", "livemode": 1 if livemode else 0, "empfangen_am": now_datetime(), "verarbeitet_am": now_datetime(), "art": art, "bezug_doctype": dt, "bezug": doc.name, "ergebnis": ergebnis, "payload_json": json.dumps(e, ensure_ascii=False)[:20000]}).insert(ignore_permissions=True)
    return {"doctype": dt, "referenz": doc.name, "status": frappe.db.get_value(dt, doc.name, "status"), "ergebnis": ergebnis}


def _gutschein_bestellung_finden_oder_anlegen(referenz, e, beleg, livemode):
    if frappe.db.exists("PH Gutschein Bestellung", referenz):
        return frappe.get_doc("PH Gutschein Bestellung", referenz)
    anzahl = cint(beleg.get("anzahl")) or 1
    einzel = cint(beleg.get("einzelwert_cent")) or (cint(e.get("betrag_cent")) // anzahl if anzahl else 0)
    doc = frappe.get_doc({"doctype": "PH Gutschein Bestellung", "bestellnummer": referenz, "status": "offen", "erstellt": _zeit(e.get("zeit")), "betrag_cent": einzel or 2500, "anzahl": anzahl, "kaeufer_name": text(beleg.get("name"), 200) or "(Website)", "kaeufer_email": "unbekannt@platzhirsch.invalid", "kaeufer_firma": text(beleg.get("firma"), 200), "rechnung_name": text(beleg.get("name"), 200), "rechnung_adresse": _adresse_text(beleg.get("adresse")), "rechnung_uid": text(beleg.get("uid"), 40), "livemode": 1 if livemode else 0, "quelle": "website"})
    doc.flags.ignore_mandatory = True
    doc.insert(ignore_permissions=True)
    if beleg.get("codes_ende"):
        doc.add_comment("Info", "Gutscheine wurden von der Website ausgestellt (Codes-Ende: " + ", ".join(map(str, beleg["codes_ende"])) + "); Register bis M6 auf der Website.")
    return doc


def _anzahlung_finden_oder_anlegen(referenz, e, beleg, livemode):
    aid = text(beleg.get("anzahlung_id"), 20).upper()
    if aid and frappe.db.exists("PH Anzahlung", aid):
        return frappe.get_doc("PH Anzahlung", aid)
    name = frappe.db.get_value("PH Anzahlung", {"auftrag_referenz": referenz}, "name", order_by="erstellt desc")
    if name and not aid:
        return frappe.get_doc("PH Anzahlung", name)
    doc = frappe.get_doc({"doctype": "PH Anzahlung", "anzahlung_id": aid or None, "auftrag_referenz": referenz, "betrag_cent": cint(e.get("betrag_cent")) or 100, "erstellt": _zeit(e.get("zeit")), "kunde_id": text(beleg.get("kunde"), 64) or None, "livemode": 1 if livemode else 0, "quelle": "website"})
    doc.insert(ignore_permissions=True)
    return doc


def _adresse_text(a):
    if not a or not isinstance(a, dict):
        return None
    return ", ".join(x for x in (a.get("line1"), a.get("line2"), f"{a.get('postal_code') or ''} {a.get('city') or ''}".strip(), a.get("country")) if x)


# ─────────────────────────────── Widerruf ───────────────────────────────

@frappe.whitelist(allow_guest=False, methods=["POST"])
@ph_api(idempotent=True, referenz=lambda r: ("PH Widerruf", r["referenz"]))
def request_withdrawal(name, email, bestellung=None, nachricht=None, anschrift=None, artikel=None, bestelltAm=None, erhaltenAm=None, id=None, zeit=None, bestaetigung_senden=0, **_rest):  # noqa: A002,N803 – Feldnamen der Website
    """Widerrufsformulare (shopWiderrufSchema / withdrawalSchema). Zuordnung nur bei passender E-Mail; die Antwort ist
    immer gleich (keine Auskunft über fremde Bestellungen). Eingangsbestätigung sendet bis M6 die Website
    (bestaetigung_senden=0); danach 1."""
    from ph_shop.ph_shop.doctype.ph_gutschein.ph_gutschein import finde_nach_code

    email_n = text(email, 254).lower()
    angabe = text(bestellung, 40).upper()
    werte = {"doctype": "PH Widerruf", "kanal": "Formular", "eingegangen_am": _zeit(zeit), "eingangsnummer": text(id, 20).upper() or None, "kunde_name": text(name, 200), "kunde_email": email_n, "anschrift": text(anschrift, 400), "artikel": text(artikel, 1500), "nachricht": text(nachricht, 1000), "bestellt_am": bestelltAm or None, "erhalten_am": erhaltenAm or None, "angabe": angabe or None, "quelle": "website", "ip_hash": ip_hash()}
    if werte["eingangsnummer"] and frappe.db.exists("PH Widerruf", {"eingangsnummer": werte["eingangsnummer"]}):
        alt = frappe.db.get_value("PH Widerruf", {"eingangsnummer": werte["eingangsnummer"]}, ["name", "eingegangen_am", "zugeordnet"], as_dict=True)
        return {"referenz": alt.name, "id": werte["eingangsnummer"], "zeit": get_datetime(alt.eingegangen_am).isoformat(), "zugeordnet": bool(alt.zugeordnet)}
    if BESTELLNUMMER_RE.match(angabe) and frappe.db.exists("PH Bestellung", angabe):
        if (frappe.db.get_value("PH Bestellung", angabe, "kunde_email") or "").lower() == email_n:
            werte["bestellung"] = angabe
    elif GUTSCHEIN_BESTELLUNG_RE.match(angabe) and frappe.db.exists("PH Gutschein Bestellung", angabe):
        if (frappe.db.get_value("PH Gutschein Bestellung", angabe, "kaeufer_email") or "").lower() == email_n:
            werte["gutschein_bestellung"] = angabe
    elif gc.normalisiere(angabe):
        gs = finde_nach_code(angabe)
        if gs and gs.gutschein_bestellung and (frappe.db.get_value("PH Gutschein Bestellung", gs.gutschein_bestellung, "kaeufer_email") or "").lower() == email_n:
            werte["gutschein_bestellung"] = gs.gutschein_bestellung
    if not werte["eingangsnummer"]:
        werte["eingangsnummer"] = gc.bestellnummer("WS" if werte.get("bestellung") or BESTELLNUMMER_RE.match(angabe) else "W")
    doc = frappe.get_doc(werte)
    doc.flags.bestaetigung_senden = bool(cint(bestaetigung_senden))
    doc.insert()
    return {"referenz": doc.name, "id": doc.eingangsnummer, "zeit": get_datetime(doc.eingegangen_am).isoformat(), "zugeordnet": bool(doc.zugeordnet)}

