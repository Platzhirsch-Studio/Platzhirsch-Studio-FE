"""Scheduler-Funktionen von ph_shop (hooks.scheduler_events, Zeiten Europe/Vienna). Idempotent, Commit je Einheit,
Fehler ins Error Log statt Ausnahme."""

import time

import frappe
from frappe import _
from frappe.utils import add_days, add_to_date, cint, get_datetime, getdate, now_datetime, nowdate

from ph_shop import stripe_client
from ph_shop.ph_shop import mails, status as st


def _sicher(fn, *args):
    try:
        fn(*args)
        frappe.db.commit()
    except Exception:  # noqa: BLE001
        frappe.db.rollback()
        frappe.log_error(title=f"ph_shop Scheduler {fn.__name__}")


def offene_checkouts_pruefen():
    """Stündlich: offene Bestellungen/Gutschein-Bestellungen ohne Webhook nach session_frist_stunden prüfen.
    Ohne Simulation: Session bei Stripe nachlesen (bezahlt → erfüllen); sonst/unbezahlt → abgelaufen."""
    stunden = cint(frappe.get_cached_value("PH Shop Einstellungen", None, "session_frist_stunden")) or 24
    grenze = add_to_date(now_datetime(), hours=-stunden)
    for dt, feld in (("PH Bestellung", "angelegt"), ("PH Gutschein Bestellung", "erstellt")):
        for name in frappe.get_all(dt, {"status": ("in", ("offen", "zahlung_ausstehend")), feld: ("<", grenze), "zahlung": ("!=", "vorort")} if dt == "PH Bestellung" else {"status": ("in", ("offen", "zahlung_ausstehend")), feld: ("<", grenze)}, pluck="name", limit=200):
            _sicher(_checkout_pruefen, dt, name)


def _checkout_pruefen(dt, name):
    doc = frappe.get_doc(dt, name)
    doc.flags.ignore_permissions = True
    session = stripe_client.session_abrufen(doc.stripe_session) if doc.stripe_session else None
    if session and session.get("payment_status") in ("paid", "no_payment_required"):
        doc.zahlung_eingegangen(dict(session), bool(session.get("livemode")))
        return
    if doc.status == "zahlung_ausstehend" and not session:
        return  # Lastschrift kann länger dauern – nur Stripe weiß mehr
    st.setzen(doc, "abgelaufen", _("ohne Zahlung nach {0} h (Scheduler)").format(cint(frappe.get_cached_value("PH Shop Einstellungen", None, "session_frist_stunden")) or 24), "System")


def fristen_pruefen():
    """Täglich 06:00: Reservierungen und Abholfristen ablaufen lassen, Gutschein-Ablauf."""
    heute = getdate(nowdate())
    for name in frappe.get_all("PH Bestellung", {"status": "reserviert", "abholung_bis": ("<", heute)}, pluck="name", limit=200):
        _sicher(_reservierung_abgelaufen, name)
    for name in frappe.get_all("PH Bestellung", {"status": "abholbereit", "abholung_bis": ("<", heute)}, pluck="name", limit=200):
        _sicher(_abholfrist_abgelaufen, name)
    for name in frappe.get_all("PH Gutschein", {"status": ("in", ("Aktiv", "Teilweise eingeloest")), "gueltig_bis": ("<", heute)}, pluck="name", limit=500):
        _sicher(_gutschein_abgelaufen, name)


def _reservierung_abgelaufen(name):
    doc = frappe.get_doc("PH Bestellung", name)
    if doc.bezahlt_am:
        return
    st.setzen(doc, "abgelaufen", _("Reservierungsfrist {0} verstrichen").format(doc.abholung_bis), "System")
    mails.senden("reservierung_abgelaufen", doc.kunde_email, {"doc": doc}, referenz_doctype=doc.doctype, referenz_name=doc.name)


def _abholfrist_abgelaufen(name):
    doc = frappe.get_doc("PH Bestellung", name)
    if frappe.db.exists("ToDo", {"reference_type": "PH Bestellung", "reference_name": name, "status": "Open"}):
        return
    mails.aufgabe(_("Bestellung {0}: Abholfrist {1} verstrichen – Kunde kontaktieren oder stornieren.").format(name, doc.abholung_bis), "PH Bestellung", name, rolle="PH Shop Mitarbeiter", prioritaet="Medium")


def _gutschein_abgelaufen(name):
    doc = frappe.get_doc("PH Gutschein", name)
    st.setzen(doc, "Abgelaufen", _("gueltig_bis {0}").format(doc.gueltig_bis), "System")


def stripe_abgleich():
    """Täglich 05:00: Payouts der letzten Tage abgleichen (PH Stripe Auszahlung.abgleichen), fehlende Payouts
    nachladen (ohne Simulation), Zahlungen ohne Auszahlung > 7 Tage melden."""
    einst = stripe_client.einstellungen()
    tage = einst["auszahlung_abgleich_tage"]
    if not stripe_client.simulation():
        _sicher(_payouts_nachladen, tage + 2)
    for name in frappe.get_all("PH Stripe Auszahlung", {"status": ("in", ("bezahlt", "unterwegs")), "datum_erwartet": (">=", add_days(nowdate(), -(tage + 7)))}, pluck="name", limit=100):
        _sicher(lambda n: frappe.get_doc("PH Stripe Auszahlung", n).abgleichen(), name)
    offen = frappe.db.count("PH Zahlung", {"docstatus": 1, "kanal": ("like", "Stripe%"), "stripe_auszahlung": ("in", ("", None)), "zeitpunkt": ("<", add_days(nowdate(), -7)), "livemode": 1})
    if offen:
        mails.aufgabe(_("Stripe-Abgleich: {0} Live-Zahlungen älter als 7 Tage ohne zugeordnete Auszahlung (Report „PH Stripe Abgleich“).").format(offen), rolle="PH Shop Leitung", prioritaet="Medium")
    frappe.db.set_single_value("PH Stripe Einstellungen", "letzter_abgleich", now_datetime())
    frappe.db.commit()


def _payouts_nachladen(tage):
    from ph_shop.stripe_webhook import _auszahlung

    bis = int(time.time())
    von = bis - tage * 86400
    for p in stripe_client.payouts(von, bis):
        _auszahlung("payout.sync", dict(p), bool(p.get("livemode")), frappe._dict(name=None, db_set=lambda *a, **k: None))


def ereignisse_aufraeumen():
    from ph_shop.ph_shop.doctype.ph_stripe_ereignis.ph_stripe_ereignis import payload_kuerzen

    _sicher(payload_kuerzen)
