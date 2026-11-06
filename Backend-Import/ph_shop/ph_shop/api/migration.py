"""Migration M6 (PLAN.md §4): lokaler Speicher der Website → ph_shop.

  import_local_store(bestellungen=[], gutschein_bestellungen=[], gutscheine=[], anzahlungen=[], widerrufe=[], probelauf=0)
    → {probelauf, angelegt{art: n}, uebersprungen{art: n}, fehler[{art, id, code, meldung}]}

Quellen (Sammlungen der Website, JSON-Dateien unter .data/):
  bestellungen           src/lib/shop/handlers.js „bestellungen“ (gleicher Datensatz wie create_order, plus
                         status/bezahlt/payment_intent/livemode/betrag_bezahlt_cent/erstattet_cent/sendung aus webhook.js)
  gutschein_bestellungen src/lib/payments „orders“ (newVoucherOrder, plus status/bezahlt/session/payment_intent/livemode)
  gutscheine             src/lib/payments „register“ (hash, ende, bestellung, wert_cent, rest_cent, status, test,
                         ausgestellt, einloesungen[{zeit, cent, beleg}], grund, gesperrt) – Hash wie codes.js codeHash,
                         also identisch mit PH Gutschein.code_hash; der Klartext-Code erreicht das Backend nie.
  anzahlungen            src/lib/payments „deposits“ (newDeposit, plus status/bezahlt/payment_intent)
  widerrufe              src/lib/shop „widerrufe“ und src/lib/payments „withdrawals“ (id, zeit, name, email, angabe|bestellung, …)

Idempotent je Eintrag über die Website-Kennung (Bestellnummer, G-/AZ-Nummer, Code-Hash, Eingangsnummer): vorhanden →
übersprungen, nie überschrieben. Nebenwirkungen aus: keine Kundenmails (bestaetigung_unterdruecken, bestaetigung_senden=0),
keine Zahlungsbuchung (PH Zahlung kommt aus dem Stripe-Backfill, PLAN §4 M6). Fehler einzelner Einträge brechen den Lauf
nicht ab (Savepoint je Eintrag). Schalter: PH Shop Einstellungen.import_local_store_aktiv (Standard 0) – der Import legt
einlösbare Gutscheine an und ist deshalb nur für den Migrationslauf offen.
"""

import json

import frappe
from frappe.utils import cint

from ph_core.api import ApiFehler, ph_api, text

ARTEN = ("bestellungen", "gutschein_bestellungen", "gutscheine", "anzahlungen", "widerrufe")
MAX_EINTRAEGE = 500
BESTELLUNG_STATUS = (
    "offen", "zahlung_ausstehend", "bezahlt", "versandbereit", "versendet", "reserviert", "abholbereit", "abgeholt",
    "abgeschlossen", "fehlgeschlagen", "abgelaufen", "storniert", "widerrufen", "erstattet", "teilerstattet", "checkout_fehler", "pruefen",
)


def _liste(wert, art):
    if wert in (None, ""):
        return []
    if isinstance(wert, str):
        try:
            wert = json.loads(wert)
        except ValueError:
            raise ApiFehler("invalid", 400, f"{art}: ungültiges JSON.", {"field": art})
    if isinstance(wert, dict):  # Sammlungsdatei {id: eintrag}
        wert = list(wert.values())
    if not isinstance(wert, list) or not all(isinstance(x, dict) for x in wert):
        raise ApiFehler("invalid", 400, f"{art}: Liste von Objekten erwartet.", {"field": art})
    return wert


def _roh(fn):
    """Whitelisted Methode ohne ph_api-Hülle (kein zweites Protokoll/Commit je Eintrag)."""
    return getattr(fn, "__wrapped__", fn)


def _nachtrag(dt, name, werte):
    werte = {k: v for k, v in werte.items() if v is not None and frappe.get_meta(dt).has_field(k)}
    if werte:
        frappe.db.set_value(dt, name, werte, update_modified=False)


def _zahlungsfelder(r, zeit):
    return {
        "bezahlt_am": zeit(r["bezahlt"]) if r.get("bezahlt") else None,
        "stripe_session": text(r.get("session"), 120) or None,
        "payment_intent": text(r.get("payment_intent"), 120) or None,
        "livemode": (1 if r.get("livemode") else 0) if r.get("livemode") is not None else None,
        "erstattet_cent": cint(r["erstattet_cent"]) if r.get("erstattet_cent") is not None else None,
    }


def _status_setzen(dt, name, status):
    """Website-Status übernehmen, wenn die DocType ihn kennt (Select-Optionen), sonst „pruefen“."""
    from ph_shop.ph_shop import status as st

    erlaubt = (frappe.get_meta(dt).get_field("status").options or "").splitlines()
    doc = frappe.get_doc(dt, name)
    ziel = status if status in erlaubt else "pruefen"
    if ziel != doc.status:
        doc.flags.ignore_permissions = True
        st.setzen(doc, ziel, "Import M6" + ("" if ziel == status else f" (Website-Status {status})"), "import")


# ── je Art: → "angelegt" | "uebersprungen" ──────────────────────────────────

def _bestellung(r):
    from ph_shop.api import _bestellung_aus_record, _zeit

    nummer = text(r.get("id") or r.get("bestellnummer"), 40).upper()
    if not nummer:
        raise ApiFehler("invalid", 400, "id fehlt.", {"field": "id"})
    if frappe.db.exists("PH Bestellung", nummer):
        return "uebersprungen"
    ziel = text(r.get("status"), 40) or "offen"
    werte = _bestellung_aus_record({**r, "status": "offen"})
    werte.update(status=ziel if ziel in BESTELLUNG_STATUS else "pruefen", quelle="import", ip_hash=None, bestaetigung_unterdruecken=1)
    werte.update({k: v for k, v in _zahlungsfelder(r, _zeit).items() if v is not None})
    if r.get("betrag_bezahlt_cent") is not None:
        werte["betrag_bezahlt_cent"] = cint(r["betrag_bezahlt_cent"])
    sendung = r.get("sendung") or {}
    if isinstance(sendung, dict) and sendung.get("awb"):
        werte.update(shipment_id=text(sendung.get("shipmentId"), 80), awb=text(sendung.get("awb"), 80), carrier=text(sendung.get("carrier"), 60) or werte.get("carrier"))
    doc = frappe.get_doc(werte)
    doc.flags.ignore_permissions = True
    doc.insert()
    hinweis = "Import aus dem lokalen Website-Speicher (M6)."
    if ziel not in BESTELLUNG_STATUS:
        hinweis += f" Unbekannter Website-Status {ziel!r} → pruefen."
    summen = r.get("summen") or {}
    if summen.get("gesamtCent") is not None and cint(summen["gesamtCent"]) != cint(doc.gesamt_cent):
        hinweis += f" Website-Summe {cint(summen['gesamtCent'])} Cent ≠ berechnet {doc.gesamt_cent} Cent – prüfen."
    doc.add_comment("Info", hinweis)
    return "angelegt"


def _gutschein_bestellung(r):
    from ph_shop.api import _zeit, create_voucher_order

    nummer = text(r.get("id") or r.get("bestellnummer"), 20).upper()
    if not nummer:
        raise ApiFehler("invalid", 400, "id fehlt.", {"field": "id"})
    if frappe.db.exists("PH Gutschein Bestellung", nummer):
        return "uebersprungen"
    _roh(create_voucher_order)(record={**r, "id": nummer})
    _nachtrag("PH Gutschein Bestellung", nummer, {**_zahlungsfelder(r, _zeit), "quelle": "import", "ip_hash": ""})
    _status_setzen("PH Gutschein Bestellung", nummer, text(r.get("status"), 40) or "offen")
    return "angelegt"


def _anzahlung(r):
    from ph_shop.api import _zeit, create_deposit

    nummer = text(r.get("id") or r.get("anzahlung_id"), 20).upper()
    if not nummer:
        raise ApiFehler("invalid", 400, "id fehlt.", {"field": "id"})
    if frappe.db.exists("PH Anzahlung", nummer):
        return "uebersprungen"
    _roh(create_deposit)(record={**r, "id": nummer})
    _nachtrag("PH Anzahlung", nummer, {**_zahlungsfelder(r, _zeit), "quelle": "import", "ip_hash": ""})
    _status_setzen("PH Anzahlung", nummer, text(r.get("status"), 40) or "offen")
    return "angelegt"


def gutschein_werte(e):
    """Registereintrag (payments/register.js) → Felder von PH Gutschein (ohne Frappe-Zugriffe außer cint)."""
    import re

    h = str(e.get("hash") or "").lower()
    if not re.match(r"^[a-f0-9]{64}$", h):
        raise ApiFehler("invalid", 400, "hash fehlt oder ist kein sha256.", {"field": "hash"})
    wert, rest = cint(e.get("wert_cent")), cint(e.get("rest_cent"))
    if wert <= 0 or rest < 0 or rest > wert:
        raise ApiFehler("invalid", 400, "wert_cent/rest_cent ungültig.", {"field": "rest_cent"})
    status = str(e.get("status") or "aktiv")
    test = bool(e.get("test")) or status == "test"
    nach_rest = "Eingeloest" if rest == 0 else ("Teilweise eingeloest" if rest < wert else "Aktiv")
    sperre = {}
    if status in ("aktiv", "test"):
        ziel = nach_rest
    elif status == "eingeloest":
        ziel = "Eingeloest"
    elif status in ("gesperrt", "ersetzt"):
        ziel = "Gesperrt"
        sperre = {"sperrgrund": text(e.get("grund") or status, 140), "sperrgrund_art": "Ersetzt" if status == "ersetzt" else "Sonstiges"}
    else:
        raise ApiFehler("invalid", 400, f"Unbekannter Registerstatus {status!r}.", {"field": "status"})
    return {"code_hash": h, "code_letzte4": text(e.get("ende"), 4).upper(), "wert_cent": wert, "rest_cent": rest, "test": 1 if test else 0, "livemode": 0 if test else 1, "status": ziel, **sperre}


def _gutschein(e):
    from ph_shop.api import _zeit
    from ph_shop import gutschein_code as gc

    w = gutschein_werte(e)
    if frappe.db.exists("PH Gutschein", {"code_hash": w["code_hash"]}):
        return "uebersprungen"
    if w.get("sperrgrund_art") and not gc.sperrgrund_gueltig(w["sperrgrund_art"]):
        w["sperrgrund_art"] = None
    gb = text(e.get("bestellung"), 20).upper()
    gb = gb if gb and frappe.db.exists("PH Gutschein Bestellung", gb) else None
    kaeufer = frappe.db.get_value("PH Gutschein Bestellung", gb, ["kaeufer_name", "kaeufer_email", "kaeufer_firma", "motiv", "empfaenger", "grusstext"], as_dict=True) if gb else {}
    doc = frappe.get_doc({"doctype": "PH Gutschein", **w, "ausgegeben_am": _zeit(e.get("ausgestellt")), "kanal_ausgabe": "Ersatz" if e.get("ersetzt") else "Online", "gutschein_bestellung": gb, "quelle": "import", **(kaeufer or {})})
    if w["status"] == "Gesperrt":
        doc.gesperrt_am = _zeit(e.get("gesperrt")) if e.get("gesperrt") else None
    rest = w["wert_cent"]
    for z in e.get("einloesungen") or []:
        cent = cint(z.get("cent"))
        rest -= cent
        doc.append("einloesungen", {"datum": _zeit(z.get("zeit")), "betrag_cent": cent, "rest_danach_cent": rest, "kanal": "Showroom", "hinweis": text(f"Import M6 · {z.get('beleg') or ''}", 140)})
    doc.flags.ignore_permissions = True
    doc.insert(ignore_permissions=True)
    if gb and not frappe.db.exists("PH Gutschein Bestellung Code", {"parent": gb, "gutschein": doc.name}):
        gbdoc = frappe.get_doc("PH Gutschein Bestellung", gb)
        gbdoc.append("gutscheine", {"gutschein": doc.name, "code_letzte4": doc.code_letzte4, "status": doc.status}).db_insert()
    doc.add_comment("Info", "Import aus dem Gutscheinregister der Website (M6)." + (f" Bestellung {e.get('bestellung')} nicht gefunden." if e.get("bestellung") and not gb else ""))
    return "angelegt"


def _widerruf(r):
    from ph_shop.api import request_withdrawal

    nummer = text(r.get("id"), 20).upper()
    if not nummer:
        raise ApiFehler("invalid", 400, "id fehlt.", {"field": "id"})
    if frappe.db.exists("PH Widerruf", {"eingangsnummer": nummer}):
        return "uebersprungen"
    if not (r.get("name") and r.get("email")):
        raise ApiFehler("invalid", 400, "name/email fehlen.", {"field": "email"})
    ergebnis = _roh(request_withdrawal)(
        name=r.get("name"), email=r.get("email"), bestellung=r.get("angabe") or r.get("bestellung"), nachricht=r.get("nachricht"),
        anschrift=r.get("anschrift"), artikel=r.get("artikel"), bestelltAm=r.get("bestelltAm"), erhaltenAm=r.get("erhaltenAm"),
        id=nummer, zeit=r.get("zeit"), bestaetigung_senden=0,
    )
    _nachtrag("PH Widerruf", ergebnis["referenz"], {"quelle": "import", "ip_hash": ""})
    return "angelegt"


VERARBEITUNG = {"bestellungen": _bestellung, "gutschein_bestellungen": _gutschein_bestellung, "gutscheine": _gutschein, "anzahlungen": _anzahlung, "widerrufe": _widerruf}


@frappe.whitelist(allow_guest=False, methods=["POST"])
@ph_api(idempotent=True, limit_pro_minute=10)
def import_local_store(bestellungen=None, gutschein_bestellungen=None, gutscheine=None, anzahlungen=None, widerrufe=None, probelauf=0, **_rest):
    if not cint(frappe.db.get_single_value("PH Shop Einstellungen", "import_local_store_aktiv")):
        raise ApiFehler("forbidden", 403, "Import ist abgeschaltet (PH Shop Einstellungen → Migration).")
    daten = {"bestellungen": bestellungen, "gutschein_bestellungen": gutschein_bestellungen, "gutscheine": gutscheine, "anzahlungen": anzahlungen, "widerrufe": widerrufe}
    listen = {art: _liste(daten[art], art) for art in ARTEN}
    if sum(len(v) for v in listen.values()) > MAX_EINTRAEGE:
        raise ApiFehler("invalid", 400, f"Höchstens {MAX_EINTRAEGE} Einträge je Aufruf – in Teilen senden.")
    angelegt = {art: 0 for art in ARTEN}
    uebersprungen = {art: 0 for art in ARTEN}
    fehler = []
    # Reihenfolge: Gutschein-Bestellungen vor dem Register (Verknüpfung), Bestellungen vor Widerrufen (Zuordnung).
    for art in ("bestellungen", "gutschein_bestellungen", "gutscheine", "anzahlungen", "widerrufe"):
        for i, eintrag in enumerate(listen[art]):
            kennung = text(eintrag.get("id") or eintrag.get("ende") or i, 40)
            sp = f"ph_import_{art[:8]}_{i}"
            frappe.db.savepoint(sp)
            try:
                ergebnis = VERARBEITUNG[art](eintrag)
                (angelegt if ergebnis == "angelegt" else uebersprungen)[art] += 1
            except ApiFehler as e:
                frappe.db.rollback(save_point=sp)
                fehler.append({"art": art, "id": kennung, "code": e.code, "meldung": str(e.meldung)[:200]})
            except Exception as e:  # noqa: BLE001 – einzelner Eintrag, Lauf geht weiter
                frappe.db.rollback(save_point=sp)
                fehler.append({"art": art, "id": kennung, "code": "invalid" if isinstance(e, frappe.ValidationError) else "internal", "meldung": str(e)[:200]})
    if cint(probelauf):
        frappe.db.rollback()
    return {"probelauf": bool(cint(probelauf)), "angelegt": angelegt, "uebersprungen": uebersprungen, "fehler": fehler}
