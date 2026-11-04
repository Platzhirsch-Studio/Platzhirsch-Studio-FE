"""Verarbeitung von Stripe-Ereignissen (Webhook-Logik ohne HTTP, testbar).

Ablauf (wie src/lib/payments/webhook.js + src/lib/shop/webhook.js, ein Endpunkt für alles):
  1. ``api/stripe.py`` liest den Rohbody, prüft die Signatur (stripe_signatur.pruefe, Toleranz 300 s) → 400.
  2. ``verarbeite(event)``: PH Stripe Ereignis anlegen (event_id eindeutig). Ist es schon „verarbeitet“ oder
     „ignoriert“ → Ergebnis „wiederholt“, nichts wird ein zweites Mal gebucht. Nach „fehler“ wird erneut versucht.
  3. Zuordnung über metadata.art (shop | gutschein | anzahlung | kassa | …) + order_id/deposit_id;
     Erweiterung durch andere Apps über hooks ``ph_stripe_art_handler = {"kassa": "ph_kassa.…"}``.
  4. Ergebnis im Ereignis; Fehler → Ereignis „fehler“ + Ausnahme → HTTP 500, Stripe wiederholt.
Zustellreihenfolge ist nicht garantiert: nie von „bezahlt“ zurück auf einen früheren Status.
"""

import json

import frappe
from frappe import _
from frappe.utils import cint, now_datetime

from ph_shop import stripe_client

ERGEBNIS_FERTIG = ("verarbeitet", "ignoriert")


def verarbeite(event, roh=None):
    """event: dict (Stripe-Event). Rückgabe: (ergebnis_kurz, PH Stripe Ereignis-Name)."""
    event_id = str(event.get("id") or "")
    typ = str(event.get("type") or "")
    if not event_id or not typ:
        frappe.throw(_("Ungültiges Ereignis (id/type fehlt)."), frappe.ValidationError)
    einst = stripe_client.einstellungen()
    livemode = bool(event.get("livemode"))
    obj = (event.get("data") or {}).get("object") or {}
    meta = obj.get("metadata") or {}
    art = str(meta.get("art") or "")

    vorhanden = frappe.db.get_value("PH Stripe Ereignis", event_id, ["name", "status", "versuche"], as_dict=True)
    if vorhanden and vorhanden.status in ERGEBNIS_FERTIG:
        frappe.db.set_value("PH Stripe Ereignis", event_id, {"versuche": cint(vorhanden.versuche) + 1}, update_modified=False)
        return "wiederholt", event_id
    if vorhanden:
        ereignis = frappe.get_doc("PH Stripe Ereignis", event_id)
        ereignis.db_set({"versuche": cint(vorhanden.versuche) + 1, "status": "empfangen", "fehler": None})
    else:
        ereignis = frappe.get_doc(
            {
                "doctype": "PH Stripe Ereignis",
                "event_id": event_id,
                "typ": typ,
                "titel": f"{typ} · {art or '–'}",
                "status": "empfangen",
                "livemode": 1 if livemode else 0,
                "empfangen_am": now_datetime(),
                "api_version": str(event.get("api_version") or "")[:40],
                "art": art[:40],
                "payload_json": (json.dumps(event, ensure_ascii=False) if roh is None else (roh.decode("utf-8", "replace") if isinstance(roh, bytes) else str(roh)))[: einst["payload_max_zeichen"]],
            }
        )
        ereignis.insert(ignore_permissions=True)
    frappe.db.commit()  # Ereignis ist da, auch wenn die Verarbeitung scheitert (Idempotenz-Anker)

    if einst["testmodus"] and livemode:
        _abschluss(ereignis, "ignoriert", "livemode im Testmodus abgewiesen")
        return "ignoriert", event_id
    if typ not in einst["ereignistypen"]:
        _abschluss(ereignis, "ignoriert", "typ nicht konfiguriert")
        return "ignoriert", event_id

    try:
        ergebnis = _dispatch(typ, obj, art, livemode, ereignis)
        if ergebnis in ("ignoriert", "unbekannt"):
            _abschluss(ereignis, "ignoriert", ergebnis)
        else:
            _abschluss(ereignis, "verarbeitet", ergebnis)
        return ergebnis, event_id
    except Exception as e:  # noqa: BLE001 – protokollieren, dann weiterreichen → 500
        frappe.db.rollback()
        frappe.log_error(title=f"Stripe-Webhook {typ} {event_id}")
        frappe.db.set_value("PH Stripe Ereignis", event_id, {"status": "fehler", "fehler": str(e)[:1000], "verarbeitet_am": now_datetime()}, update_modified=False)
        frappe.db.commit()
        raise


def _abschluss(ereignis, status, ergebnis):
    ereignis.db_set({"status": status, "ergebnis": str(ergebnis)[:140], "verarbeitet_am": now_datetime()}, update_modified=False)
    frappe.db.commit()


# ─────────────────────────────── Zuordnung ───────────────────────────────

def _ziel(obj, art, meta=None):
    """→ (doctype, name, art) oder None. metadata.art + order_id/deposit_id wie heute (client_reference_id)."""
    m = meta if meta is not None else (obj.get("metadata") or {})
    art = art or str(m.get("art") or "")
    if art == "shop" and m.get("order_id") and frappe.db.exists("PH Bestellung", m["order_id"]):
        return ("PH Bestellung", m["order_id"], art)
    if art == "gutschein" and m.get("order_id") and frappe.db.exists("PH Gutschein Bestellung", m["order_id"]):
        return ("PH Gutschein Bestellung", m["order_id"], art)
    if art == "anzahlung" and m.get("deposit_id") and frappe.db.exists("PH Anzahlung", m["deposit_id"]):
        return ("PH Anzahlung", m["deposit_id"], art)
    cref = obj.get("client_reference_id")
    if cref:
        for dt in ("PH Bestellung", "PH Gutschein Bestellung", "PH Anzahlung"):
            if frappe.db.exists(dt, cref):
                return (dt, cref, art)
    return None


def _ziel_nach_payment_intent(pi):
    if not pi:
        return None
    for dt in ("PH Bestellung", "PH Gutschein Bestellung", "PH Anzahlung"):
        n = frappe.db.get_value(dt, {"payment_intent": pi}, "name")
        if n:
            return (dt, n, {"PH Bestellung": "shop", "PH Gutschein Bestellung": "gutschein", "PH Anzahlung": "anzahlung"}[dt])
    return None


def _fremd_handler(art):
    """Andere Apps (ph_kassa: art „kassa“) registrieren sich über hooks.ph_stripe_art_handler."""
    for eintrag in frappe.get_hooks("ph_stripe_art_handler") or []:
        if isinstance(eintrag, dict) and art in eintrag:
            return frappe.get_attr(eintrag[art])
    return None


def _dispatch(typ, obj, art, livemode, ereignis):
    fremd = _fremd_handler(art) if art else None
    if fremd:
        r = fremd(typ=typ, obj=obj, livemode=livemode, ereignis=ereignis.name)
        return r or "verarbeitet"

    if typ in ("checkout.session.completed", "checkout.session.async_payment_succeeded"):
        return _session_abgeschlossen(obj, art, livemode, ereignis)
    if typ == "checkout.session.async_payment_failed":
        return _mit_ziel(obj, art, ereignis, lambda doc: doc.zahlung_fehlgeschlagen(obj, livemode, ereignis.name))
    if typ == "checkout.session.expired":
        return _mit_ziel(obj, art, ereignis, lambda doc: doc.session_abgelaufen(obj, ereignis.name))
    if typ == "charge.refunded":
        return _erstattet(obj, livemode, ereignis)
    if typ in ("payment_intent.succeeded", "payment_intent.payment_failed"):
        # Checkout-Zahlungen werden über die Session-Ereignisse gebucht; ohne fremden Handler (Terminal/Kassa) nichts tun.
        return "ignoriert"
    if typ.startswith("payout."):
        return _auszahlung(typ, obj, livemode, ereignis)
    if typ == "charge.dispute.created":
        return _dispute(obj, ereignis)
    return "ignoriert"


def _mit_ziel(obj, art, ereignis, fn):
    ziel = _ziel(obj, art)
    if not ziel:
        return "ignoriert"
    ereignis.db_set({"bezug_doctype": ziel[0], "bezug": ziel[1]}, update_modified=False)
    doc = frappe.get_doc(ziel[0], ziel[1])
    doc.flags.ignore_permissions = True
    return fn(doc) or "verarbeitet"


def _session_abgeschlossen(obj, art, livemode, ereignis):
    bezahlt = obj.get("payment_status") in ("paid", "no_payment_required")
    if bezahlt:
        return _mit_ziel(obj, art, ereignis, lambda doc: doc.zahlung_eingegangen(obj, livemode, ereignis.name))
    return _mit_ziel(obj, art, ereignis, lambda doc: doc.zahlung_ausstehend(obj, ereignis.name))


def _erstattet(charge, livemode, ereignis):
    from ph_shop import zahlung as z

    pi = charge.get("payment_intent")
    if not pi:
        return "ignoriert"
    ziel = _ziel(charge, None) or _ziel_nach_payment_intent(pi)
    voll = bool(charge.get("refunded")) or cint(charge.get("amount_refunded")) >= cint(charge.get("amount"))
    gesamt_erstattet = cint(charge.get("amount_refunded"))
    # Gegenbuchung je neuem Refund (Liste in charge.refunds.data; sonst Delta zum bisherigen Stand).
    name = z.finde(stripe_payment_intent=pi)
    if name:
        zdoc = frappe.get_doc("PH Zahlung", name)
        refunds = ((charge.get("refunds") or {}).get("data")) or []
        if refunds:
            for r in refunds:
                if r.get("status") in (None, "succeeded", "pending"):
                    z.erstatte(zdoc, cint(r.get("amount")), r.get("reason") or "Stripe-Refund", stripe_refund=r.get("id"), stripe_ereignis=ereignis.name, quelle="stripe", von="Stripe")
                    zdoc.reload()
        else:
            delta = gesamt_erstattet - cint(zdoc.erstattet_cent)
            if delta > 0:
                z.erstatte(zdoc, delta, "Stripe-Refund", stripe_refund=f"charge:{charge.get('id')}:{gesamt_erstattet}", stripe_ereignis=ereignis.name, quelle="stripe", von="Stripe")
    if not ziel:
        return "unbekannt"
    ereignis.db_set({"bezug_doctype": ziel[0], "bezug": ziel[1]}, update_modified=False)
    doc = frappe.get_doc(ziel[0], ziel[1])
    doc.flags.ignore_permissions = True
    return doc.erstattung_vermerken(pi, gesamt_erstattet, voll, ereignis.name) or ("erstattet" if voll else "teilerstattet")


def _auszahlung(typ, obj, livemode, ereignis):
    from frappe.utils import getdate
    import datetime

    payout_id = obj.get("id")
    if not payout_id:
        return "ignoriert"
    status_map = {"paid": "bezahlt", "in_transit": "unterwegs", "pending": "angekuendigt", "failed": "fehlgeschlagen", "canceled": "storniert"}
    werte = {
        "betrag_cent": cint(obj.get("amount")),
        "waehrung": str(obj.get("currency") or "eur").upper(),
        "livemode": 1 if livemode else 0,
        "status": status_map.get(obj.get("status"), "angekuendigt"),
        "datum_erwartet": getdate(datetime.datetime.utcfromtimestamp(cint(obj.get("arrival_date")))) if obj.get("arrival_date") else None,
        "titel": f"Payout {payout_id} · {cint(obj.get('amount')) / 100:.2f} {str(obj.get('currency') or 'eur').upper()}",
    }
    if frappe.db.exists("PH Stripe Auszahlung", payout_id):
        doc = frappe.get_doc("PH Stripe Auszahlung", payout_id)
        if doc.status != "abgeglichen":
            doc.db_set(werte, update_modified=True)
    else:
        doc = frappe.get_doc({"doctype": "PH Stripe Auszahlung", "payout_id": payout_id, **werte})
        doc.insert(ignore_permissions=True)
    ereignis.db_set({"bezug_doctype": "PH Stripe Auszahlung", "bezug": payout_id}, update_modified=False)
    return werte["status"]


def _dispute(obj, ereignis):
    from ph_shop import zahlung as z
    from ph_shop.ph_shop.mails import aufgabe

    pi = obj.get("payment_intent")
    name = z.finde(stripe_payment_intent=pi) if pi else None
    text = _("Stripe-Rückbuchung (Dispute) {0} über {1} Cent – Grund: {2}. Im Stripe-Dashboard reagieren.").format(obj.get("id"), cint(obj.get("amount")), obj.get("reason") or "–")
    if name:
        frappe.get_doc("PH Zahlung", name).add_comment("Info", text)
        ereignis.db_set({"bezug_doctype": "PH Zahlung", "bezug": name}, update_modified=False)
    aufgabe(text, "PH Zahlung" if name else "PH Stripe Ereignis", name or ereignis.name)
    return "dispute"
