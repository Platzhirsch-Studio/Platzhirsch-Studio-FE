"""Gemeinsame Buchungsfunktion für PH Zahlung – wird von ph_shop (Webhook, Buttons), ph_faktura
(Bankimport, Rechnungszahlung) und ph_kassa (Bon, Terminal) aufgerufen. Signatur: README.md, Abschnitt
„Zahlungen buchen“. Regeln: Beträge in Cent (int), nie Float; Idempotenz über stripe_payment_intent,
stripe_refund oder idempotency_key; „Bezahlt“ = submitted; Storno nur per Gegenbuchung (erstatte).
"""

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import cint, now_datetime

STRIPE_KANAELE = ("Stripe Checkout", "Stripe Terminal", "Stripe Link")
BEZAHLT_STATUS = ("Bezahlt", "Teilerstattet", "Erstattet")


def buche(
    *,
    kanal,
    betrag_cent,
    art="Eingang",
    bezug_doctype=None,
    bezug=None,
    waehrung="EUR",
    status="Bezahlt",
    zeitpunkt=None,
    kontakt=None,
    stripe_payment_intent=None,
    stripe_charge=None,
    stripe_session=None,
    stripe_balance_transaction=None,
    stripe_gebuehr_cent=0,
    stripe_ereignis=None,
    stripe_refund=None,
    livemode=None,
    zahlungsreferenz=None,
    bank_referenz=None,
    gutschein=None,
    notiz=None,
    ursprung=None,
    idempotency_key=None,
    quelle="backoffice",
    submit=None,
):
    """Legt eine PH Zahlung an (und bucht sie, wenn status == "Bezahlt").

    Rückgabe: das PH-Zahlung-Dokument. War die Zahlung schon gebucht (gleicher Payment Intent, gleicher
    Refund oder gleicher idempotency_key), kommt das vorhandene Dokument zurück und
    ``doc.flags.bereits_gebucht`` ist True – der Aufrufer bucht dann nichts doppelt.

    kanal: Stripe Checkout | Stripe Terminal | Stripe Link | Bar | Karte extern | Ueberweisung | Gutschein | Verrechnung
    art:   Eingang | Ausgang | Erstattung (Erstattungen bitte über erstatte() anlegen)
    status: Angekuendigt | Bezahlt | Fehlgeschlagen
    submit: None = automatisch (Bezahlt → submit), True/False erzwingt.
    """
    betrag_cent = cint(betrag_cent)
    if betrag_cent <= 0:
        frappe.throw(_("Betrag muss größer als 0 Cent sein."))
    if art not in ("Eingang", "Ausgang", "Erstattung"):
        frappe.throw(_("Unbekannte Zahlungsart: {0}").format(art))

    vorhanden = _vorhandene(art, stripe_payment_intent, stripe_refund, idempotency_key)
    if vorhanden:
        doc = frappe.get_doc("PH Zahlung", vorhanden)
        doc.flags.bereits_gebucht = True
        return doc

    if livemode is None:
        livemode = bool(frappe.conf.get("ph_stripe_livemode")) if kanal in STRIPE_KANAELE else True

    doc = frappe.get_doc(
        {
            "doctype": "PH Zahlung",
            "art": art,
            "kanal": kanal,
            "status": status,
            "betrag_cent": betrag_cent,
            "waehrung": waehrung or "EUR",
            "zeitpunkt": zeitpunkt or now_datetime(),
            "kontakt": kontakt if kontakt and frappe.db.exists("DocType", "PH Kontakt") else None,
            "bezug_doctype": bezug_doctype,
            "bezug": bezug,
            "ursprung": ursprung,
            "stripe_payment_intent": stripe_payment_intent or None,
            "stripe_charge": stripe_charge,
            "stripe_session": stripe_session,
            "stripe_balance_transaction": stripe_balance_transaction,
            "stripe_gebuehr_cent": cint(stripe_gebuehr_cent),
            "stripe_ereignis": stripe_ereignis,
            "stripe_refund": stripe_refund,
            "livemode": 1 if livemode else 0,
            "zahlungsreferenz": zahlungsreferenz,
            "bank_referenz": bank_referenz,
            "gutschein": gutschein,
            "notiz": notiz,
            "idempotency_key": (idempotency_key or None) and str(idempotency_key)[:140],
            "quelle": quelle,
        }
    )
    doc.flags.ignore_permissions = True  # Serverfunktion; Rechte prüft der Aufrufer (Button/API/Webhook)
    doc.insert(ignore_permissions=True)
    if submit is None:
        submit = status == "Bezahlt"
    if submit:
        doc.submit()
    doc.flags.bereits_gebucht = False
    return doc


def erstatte(zahlung, betrag_cent, grund, *, stripe_refund=None, von=None, zeitpunkt=None, stripe_ereignis=None, quelle="backoffice", notiz=None):
    """Teil- oder Vollerstattung einer gebuchten Zahlung: legt die Gegenbuchung (PH Zahlung, art Erstattung)
    an, trägt sie in `erstattungen` der Ursprungszahlung ein und setzt dort erstattet_cent/status.

    zahlung: Name oder Dokument der Ursprungszahlung (muss docstatus 1 haben).
    Idempotent über stripe_refund. Rückgabe: Gegenbuchung (flags.bereits_gebucht bei Wiederholung).
    Den eigentlichen Stripe-Refund löst der Aufrufer aus (stripe_client.refund_erstellen) – diese Funktion
    bucht nur; der Webhook charge.refunded ruft sie ebenfalls (dann mit stripe_refund aus Stripe).
    """
    doc = zahlung if isinstance(zahlung, Document) else frappe.get_doc("PH Zahlung", zahlung)
    betrag_cent = cint(betrag_cent)
    if doc.docstatus != 1 or doc.status not in BEZAHLT_STATUS:
        frappe.throw(_("Nur gebuchte Zahlungen (Bezahlt) können erstattet werden."))
    if doc.art != "Eingang":
        frappe.throw(_("Nur Eingänge können erstattet werden."))
    if betrag_cent <= 0:
        frappe.throw(_("Erstattungsbetrag muss größer als 0 Cent sein."))
    offen = cint(doc.betrag_cent) - cint(doc.erstattet_cent)
    if stripe_refund:
        alt = frappe.db.get_value("PH Zahlung", {"stripe_refund": stripe_refund, "art": "Erstattung"}, "name")
        if alt:
            gegen = frappe.get_doc("PH Zahlung", alt)
            gegen.flags.bereits_gebucht = True
            return gegen
    if betrag_cent > offen:
        frappe.throw(_("Erstattung ({0} Cent) übersteigt den offenen Betrag ({1} Cent).").format(betrag_cent, offen))

    gegen = buche(
        kanal=doc.kanal,
        betrag_cent=betrag_cent,
        art="Erstattung",
        bezug_doctype=doc.bezug_doctype,
        bezug=doc.bezug,
        waehrung=doc.waehrung,
        status="Bezahlt",
        zeitpunkt=zeitpunkt,
        kontakt=doc.kontakt,
        stripe_payment_intent=None,
        stripe_charge=doc.stripe_charge,
        stripe_session=doc.stripe_session,
        stripe_ereignis=stripe_ereignis,
        stripe_refund=stripe_refund,
        livemode=bool(doc.livemode),
        zahlungsreferenz=doc.zahlungsreferenz,
        gutschein=doc.gutschein,
        notiz=notiz or grund,
        ursprung=doc.name,
        quelle=quelle,
    )
    zeile = doc.append("erstattungen", {"zeitpunkt": gegen.zeitpunkt, "betrag_cent": betrag_cent, "grund": (grund or "")[:140], "stripe_refund": stripe_refund, "gegenbuchung": gegen.name, "von": von or frappe.session.user})
    zeile.db_insert()
    neu = cint(doc.erstattet_cent) + betrag_cent
    doc.db_set(
        {
            "erstattet_cent": neu,
            "status": "Erstattet" if neu >= cint(doc.betrag_cent) else "Teilerstattet",
            "erstattung_angefordert_cent": 0,
            "erstattung_grund": None,
            "erstattung_angefordert_von": None,
            "erstattung_angefordert_am": None,
        },
        update_modified=True,
    )
    doc.add_comment("Info", _("Erstattung {0} Cent gebucht ({1}), Grund: {2}").format(betrag_cent, gegen.name, grund or "–"))
    gegen.flags.bereits_gebucht = False
    return gegen


def storniere(zahlung, grund):
    """Angekündigte (noch nicht gebuchte) Zahlung stornieren. Gebuchte Zahlungen: erstatte()."""
    doc = zahlung if isinstance(zahlung, Document) else frappe.get_doc("PH Zahlung", zahlung)
    if doc.docstatus != 0:
        frappe.throw(_("Gebuchte Zahlungen werden nicht storniert, sondern erstattet (Gegenbuchung)."))
    doc.db_set({"status": "Storniert", "notiz": f"{doc.notiz or ''}\nStorno: {grund}".strip()})
    return doc


def finde(stripe_payment_intent=None, bezug_doctype=None, bezug=None, nur_eingang=True):
    """Name der (ersten) gebuchten Zahlung zu einem Payment Intent oder Bezug, sonst None."""
    filters = {"docstatus": 1}
    if nur_eingang:
        filters["art"] = "Eingang"
    if stripe_payment_intent:
        filters["stripe_payment_intent"] = stripe_payment_intent
    elif bezug_doctype and bezug:
        filters.update({"bezug_doctype": bezug_doctype, "bezug": bezug})
    else:
        return None
    return frappe.db.get_value("PH Zahlung", filters, "name", order_by="zeitpunkt desc")


def _vorhandene(art, stripe_payment_intent, stripe_refund, idempotency_key):
    if art == "Eingang" and stripe_payment_intent:
        n = frappe.db.get_value("PH Zahlung", {"stripe_payment_intent": stripe_payment_intent}, "name")
        if n:
            return n
    if art == "Erstattung" and stripe_refund:
        n = frappe.db.get_value("PH Zahlung", {"stripe_refund": stripe_refund, "art": "Erstattung"}, "name")
        if n:
            return n
    if idempotency_key:
        return frappe.db.get_value("PH Zahlung", {"idempotency_key": str(idempotency_key)[:140]}, "name")
    return None
