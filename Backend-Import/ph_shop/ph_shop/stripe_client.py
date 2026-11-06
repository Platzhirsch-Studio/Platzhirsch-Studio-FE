"""Dünne Hülle um das Python-Paket ``stripe`` (pyproject: stripe>=10,<13).

Regeln: Schlüssel nur aus site_config (ph_stripe_secret_key, ph_stripe_webhook_secret, ph_stripe_livemode);
in PH Stripe Einstellungen steht nur, OB sie vorhanden sind. Mit ``simulation`` (Staging-Standard) oder in
Tests (frappe.flags.in_test) wird nie ein Netzaufruf gemacht – die Funktionen liefern dann plausible,
als ``simuliert`` gekennzeichnete Antworten. So laufen Tests ohne Netz und das produktive Stripe-Konto
wird nie aus Versehen angesprochen.
"""

import frappe
from frappe import _
from frappe.utils import cint, now_datetime

CACHE_KEY = "ph_shop:stripe_einstellungen"


def einstellungen():
    data = frappe.cache().get_value(CACHE_KEY)
    if not data:
        doc = frappe.get_cached_doc("PH Stripe Einstellungen")
        data = {
            "testmodus": cint(doc.testmodus),
            "simulation": cint(doc.simulation),
            "webhook_toleranz_s": cint(doc.webhook_toleranz_s) or 300,
            "payload_max_zeichen": cint(doc.payload_max_zeichen) or 20000,
            "ereignistypen": [z.strip() for z in (doc.ereignistypen or "").splitlines() if z.strip()],
            "vier_augen_ab_cent": cint(doc.vier_augen_ab_cent) or 100000,
            "auszahlung_abgleich_tage": cint(doc.auszahlung_abgleich_tage) or 1,
        }
        frappe.cache().set_value(CACHE_KEY, data)
    return data


def webhook_secret():
    return frappe.conf.get("ph_stripe_webhook_secret")


def livemode_konfiguriert():
    return bool(frappe.conf.get("ph_stripe_livemode"))


def simulation():
    return bool(einstellungen()["simulation"]) or bool(getattr(frappe.flags, "in_test", False)) or bool(getattr(frappe.flags, "ph_stripe_simulation", False))


def api():
    """Das konfigurierte stripe-Modul (wirft, wenn Paket oder Schlüssel fehlen)."""
    try:
        import stripe  # noqa: WPS433 – optionale Abhängigkeit, nur bei echten Aufrufen nötig
    except ImportError:
        frappe.throw(_("Python-Paket „stripe“ ist nicht installiert (pyproject.toml von ph_shop)."))
    key = frappe.conf.get("ph_stripe_secret_key")
    if not key:
        frappe.throw(_("ph_stripe_secret_key fehlt in site_config.json."))
    stripe.api_key = key
    stripe.max_network_retries = 2
    return stripe


def _grund_stripe(grund):
    g = (grund or "").lower()
    if "doppelt" in g or "duplicate" in g:
        return "duplicate"
    if "betrug" in g or "fraud" in g:
        return "fraudulent"
    return "requested_by_customer"


def refund_erstellen(payment_intent, betrag_cent, grund, metadata=None, idempotency_key=None):
    """Refund bei Stripe anlegen → {"id", "status", "amount", "simuliert"}."""
    betrag_cent = cint(betrag_cent)
    if simulation():
        return {"id": f"re_sim_{frappe.generate_hash(length=14)}", "status": "succeeded", "amount": betrag_cent, "simuliert": True}
    s = api()
    r = s.Refund.create(
        payment_intent=payment_intent,
        amount=betrag_cent,
        reason=_grund_stripe(grund),
        metadata={"grund": (grund or "")[:450], **(metadata or {})},
        idempotency_key=idempotency_key or f"ph-refund-{payment_intent}-{betrag_cent}-{frappe.utils.nowdate()}",
    )
    return {"id": r["id"], "status": r["status"], "amount": cint(r["amount"]), "simuliert": False}


def checkout_session_erstellen(*, referenz, betrag_cent, waehrung="eur", beschreibung, email=None, stunden=24, metadata=None, erfolg_url=None, abbruch_url=None, sprache="de", idempotency_key=None):
    """Zahlungslink für eine Backoffice-/Telefonbestellung: Stripe Checkout Session (mode=payment, eine Zeile
    über den offenen Bruttobetrag). Der Webhook checkout.session.completed bucht wie bei Online-Bestellungen.
    → {"id", "url", "gueltig_bis" (naive Datetime Site-Zeit), "simuliert"}. Simulation/Tests: kein Netz."""
    from frappe.utils import add_to_date

    betrag_cent = cint(betrag_cent)
    if betrag_cent <= 0:
        frappe.throw(_("Betrag muss größer als 0 Cent sein."))
    stunden = min(max(cint(stunden) or 24, 1), 24)  # Stripe: expires_at 30 min … 24 h
    gueltig_bis = add_to_date(now_datetime(), hours=stunden)
    meta = {str(k): str(v)[:450] for k, v in (metadata or {}).items()}
    if simulation():
        sid = f"cs_sim_{frappe.generate_hash(length=16)}"
        return {"id": sid, "url": f"https://checkout.stripe.com/c/pay/{sid}#simuliert", "gueltig_bis": gueltig_bis, "simuliert": True}
    import time

    s = api()
    params = {
        "mode": "payment",
        "line_items": [{"quantity": 1, "price_data": {"currency": (waehrung or "eur").lower(), "unit_amount": betrag_cent, "product_data": {"name": (beschreibung or referenz)[:250]}}}],
        "client_reference_id": referenz,
        "metadata": meta,
        "payment_intent_data": {"metadata": meta, "description": (beschreibung or referenz)[:250]},
        "expires_at": int(time.time()) + stunden * 3600 - 60,
        "locale": sprache if sprache in ("de", "en", "fr", "it") else "auto",
    }
    if email:
        params["customer_email"] = email
    if erfolg_url:
        params["success_url"] = erfolg_url
    if abbruch_url:
        params["cancel_url"] = abbruch_url
    r = s.checkout.Session.create(**params, idempotency_key=idempotency_key or f"ph-link-{referenz}-{betrag_cent}-{frappe.generate_hash(length=8)}")
    return {"id": r["id"], "url": r["url"], "gueltig_bis": gueltig_bis, "simuliert": False}


def session_abrufen(session_id):
    """Checkout-Session nachlesen (Scheduler: offene Checkouts). Simulation → None (unbekannt)."""
    if simulation() or not session_id:
        return None
    s = api()
    return s.checkout.Session.retrieve(session_id)


def balance_transactions(von_ts, bis_ts, limit=100):
    """Alle Balance Transactions eines Zeitraums (Unix-Zeiten). Simulation → []."""
    if simulation():
        return []
    s = api()
    out = []
    params = {"created": {"gte": int(von_ts), "lte": int(bis_ts)}, "limit": limit, "expand": ["data.source"]}
    for tx in s.BalanceTransaction.list(**params).auto_paging_iter():
        out.append(tx)
    return out


def payouts(von_ts, bis_ts, limit=100):
    if simulation():
        return []
    s = api()
    return list(s.Payout.list(arrival_date={"gte": int(von_ts), "lte": int(bis_ts)}, limit=limit).auto_paging_iter())


def payout_transactions(payout_id, limit=100):
    if simulation():
        return []
    s = api()
    return list(s.BalanceTransaction.list(payout=payout_id, limit=limit, expand=["data.source"]).auto_paging_iter())


def einstellungen_aktualisieren():
    """Anzeige-Felder in PH Stripe Einstellungen nachführen (nur Ja/Nein, nie Werte)."""
    doc = frappe.get_single("PH Stripe Einstellungen")
    doc.db_set(
        {
            "schluessel_vorhanden": 1 if frappe.conf.get("ph_stripe_secret_key") else 0,
            "webhook_secret_vorhanden": 1 if frappe.conf.get("ph_stripe_webhook_secret") else 0,
            "livemode_konfiguriert": 1 if livemode_konfiguriert() else 0,
            "letzter_abgleich": doc.letzter_abgleich or None,
        },
        update_modified=False,
    )
    frappe.cache().delete_value(CACHE_KEY)
    return now_datetime()
