"""Stripe Terminal (server-gesteuerte Reader) als Dienst mit Mock – nur Schlüssel-NAMEN, keine echten Aufrufe in Tests.

Ablauf (Stripe „Server-driven integration“):
  1. PaymentIntent anlegen: payment_method_types=["card_present"], capture_method="automatic",
     amount in Cent, currency eur, metadata {art: "kassa", kasse, beleg_entwurf}.
  2. Reader anweisen: stripe.terminal.Reader.process_payment_intent(reader_id, payment_intent=pi)
     → Reader zeigt Betrag, Kunde zahlt; Reader-Status `action.status` = in_progress | succeeded | failed.
  3. Status abfragen: PaymentIntent.retrieve(pi).status: requires_payment_method → processing →
     requires_capture/succeeded (bei automatic capture: succeeded). Webhook `payment_intent.succeeded`
     landet zusätzlich in ph_shop (PLAN.md WP5), hier reicht Polling für die Kassa-Page.
  4. Abbruch: Reader.cancel_action(reader_id) + PaymentIntent.cancel(pi) (nur solange nicht succeeded).
  5. Testmodus: Reader.TestHelpers.present_payment_method(reader_id) simuliert das Tippen der Karte
     (nur mit Testschlüssel möglich – Stripe lehnt es live ab).

Konfiguration ausschließlich aus site_config.json (CONVENTIONS.md 14): `ph_stripe_secret_key`,
`ph_stripe_livemode`, `ph_stripe_terminal_location`. Hier stehen nur die Namen.
Ohne Schlüssel, ohne Paket `stripe` oder im Testmodus (PH Einstellungen / PH Kassa Einstellungen)
arbeitet `TerminalMock` – deterministisch, im Prozessspeicher, für Unit-Tests ohne Frappe geeignet.
"""

from __future__ import annotations

import itertools
import time

SCHLUESSEL_SECRET = "ph_stripe_secret_key"
SCHLUESSEL_LIVEMODE = "ph_stripe_livemode"
SCHLUESSEL_STANDORT = "ph_stripe_terminal_location"

PI_STATUS = ("requires_payment_method", "requires_confirmation", "processing", "requires_capture", "succeeded", "canceled", "failed")
ENDZUSTAENDE = ("succeeded", "canceled", "failed")


class TerminalFehler(Exception):
    def __init__(self, code: str, meldung: str | None = None):
        super().__init__(meldung or code)
        self.code = code
        self.meldung = meldung or code


class TerminalMock:
    """Simulation: Zahlung starten → „processing“ am Reader → `simuliere_zahlung()` → succeeded. Abbruch jederzeit vorher."""

    def __init__(self, reader_ids: list[str] | None = None):
        self._reader = {r: {"id": r, "status": "online", "label": f"Mock-Reader {r}", "action": None, "device_type": "simulated_wisepos_e", "serial_number": "SIM-0001"} for r in (reader_ids or ["tmr_mock_1"])}
        self._pi: dict[str, dict] = {}
        self._n = itertools.count(1)
        self.aufrufe: list[tuple] = []  # für Tests: (methode, args)

    # ── Reader ────────────────────────────────────────────────────────────

    def reader_liste(self, standort: str | None = None) -> list[dict]:
        self.aufrufe.append(("reader_liste", standort))
        return [dict(r) for r in self._reader.values()]

    def reader_status(self, reader_id: str) -> dict:
        self.aufrufe.append(("reader_status", reader_id))
        r = self._reader.get(reader_id)
        if not r:
            raise TerminalFehler("not_found", f"Reader {reader_id} unbekannt.")
        return dict(r)

    # ── Zahlung ───────────────────────────────────────────────────────────

    def zahlung_starten(self, reader_id: str, betrag_cent: int, beschreibung: str = "", metadata: dict | None = None) -> dict:
        self.aufrufe.append(("zahlung_starten", reader_id, betrag_cent))
        if int(betrag_cent) <= 0:
            raise TerminalFehler("invalid", "Betrag muss größer 0 sein.")
        r = self._reader.get(reader_id)
        if not r:
            raise TerminalFehler("not_found", f"Reader {reader_id} unbekannt.")
        if r["status"] != "online":
            raise TerminalFehler("reader_offline", "Reader ist offline.")
        if r["action"] and r["action"]["status"] == "in_progress":
            raise TerminalFehler("reader_busy", "Reader ist mit einer anderen Zahlung beschäftigt.")
        pi_id = f"pi_mock_{next(self._n):06d}"
        pi = {"id": pi_id, "amount": int(betrag_cent), "currency": "eur", "status": "requires_payment_method", "description": beschreibung, "metadata": dict(metadata or {}), "reader": reader_id, "created": int(time.time()), "charge": None, "livemode": False}
        self._pi[pi_id] = pi
        r["action"] = {"type": "process_payment_intent", "status": "in_progress", "payment_intent": pi_id}
        pi["status"] = "processing"
        return self.status(pi_id)

    def status(self, payment_intent_id: str) -> dict:
        self.aufrufe.append(("status", payment_intent_id))
        pi = self._pi.get(payment_intent_id)
        if not pi:
            raise TerminalFehler("not_found", "PaymentIntent unbekannt.")
        return {"payment_intent": pi["id"], "status": pi["status"], "betrag_cent": pi["amount"], "charge": pi["charge"], "reader": pi["reader"], "livemode": pi["livemode"], "fertig": pi["status"] in ENDZUSTAENDE, "bezahlt": pi["status"] == "succeeded"}

    def abbrechen(self, payment_intent_id: str, reader_id: str | None = None) -> dict:
        self.aufrufe.append(("abbrechen", payment_intent_id))
        pi = self._pi.get(payment_intent_id)
        if not pi:
            raise TerminalFehler("not_found", "PaymentIntent unbekannt.")
        if pi["status"] == "succeeded":
            raise TerminalFehler("conflict", "Zahlung ist bereits erfolgt – nur Rückerstattung möglich (ph_shop PH Zahlung).")
        pi["status"] = "canceled"
        r = self._reader.get(pi["reader"])
        if r and r["action"] and r["action"].get("payment_intent") == payment_intent_id:
            r["action"] = {"type": "process_payment_intent", "status": "failed", "payment_intent": payment_intent_id, "failure_code": "canceled"}
        return self.status(payment_intent_id)

    def simuliere_zahlung(self, reader_id: str, erfolgreich: bool = True) -> dict:
        """Testhilfe (entspricht Reader.TestHelpers.present_payment_method)."""
        self.aufrufe.append(("simuliere_zahlung", reader_id, erfolgreich))
        r = self._reader.get(reader_id)
        if not r or not r["action"] or r["action"]["status"] != "in_progress":
            raise TerminalFehler("conflict", "Keine laufende Zahlung am Reader.")
        pi = self._pi[r["action"]["payment_intent"]]
        if erfolgreich:
            pi["status"] = "succeeded"
            pi["charge"] = f"ch_mock_{pi['id'][-6:]}"
            r["action"]["status"] = "succeeded"
        else:
            pi["status"] = "requires_payment_method"
            r["action"] = {"type": "process_payment_intent", "status": "failed", "payment_intent": pi["id"], "failure_code": "card_declined"}
            pi["status"] = "failed"
        return self.status(pi["id"])

    def reader_offline_setzen(self, reader_id: str, offline: bool = True):
        self._reader[reader_id]["status"] = "offline" if offline else "online"


class StripeTerminalDienst:
    """Echte Anbindung über das Paket `stripe`. Wird nur mit Schlüssel aus site_config erzeugt (dienst())."""

    def __init__(self, secret_key: str, standort: str | None = None, livemode: bool = False):
        import stripe  # type: ignore

        self._stripe = stripe
        self._stripe.api_key = secret_key
        self.standort = standort
        self.livemode = livemode

    def reader_liste(self, standort: str | None = None) -> list[dict]:
        args = {"limit": 20}
        if standort or self.standort:
            args["location"] = standort or self.standort
        return [{"id": r.id, "status": r.status, "label": r.label, "action": _dict(r.get("action")), "device_type": r.device_type, "serial_number": r.serial_number} for r in self._stripe.terminal.Reader.list(**args).auto_paging_iter()]

    def reader_status(self, reader_id: str) -> dict:
        r = self._stripe.terminal.Reader.retrieve(reader_id)
        return {"id": r.id, "status": r.status, "label": r.label, "action": _dict(r.get("action")), "device_type": r.device_type, "serial_number": r.serial_number}

    def zahlung_starten(self, reader_id: str, betrag_cent: int, beschreibung: str = "", metadata: dict | None = None) -> dict:
        if int(betrag_cent) <= 0:
            raise TerminalFehler("invalid", "Betrag muss größer 0 sein.")
        pi = self._stripe.PaymentIntent.create(amount=int(betrag_cent), currency="eur", payment_method_types=["card_present"], capture_method="automatic", description=beschreibung[:200], metadata=metadata or {})
        try:
            self._stripe.terminal.Reader.process_payment_intent(reader_id, payment_intent=pi.id)
        except Exception as e:  # noqa: BLE001 – Reader offline/beschäftigt: PI wieder aufräumen
            try:
                self._stripe.PaymentIntent.cancel(pi.id)
            finally:
                raise TerminalFehler("reader_unavailable", str(e)[:200]) from e
        return self.status(pi.id)

    def status(self, payment_intent_id: str) -> dict:
        pi = self._stripe.PaymentIntent.retrieve(payment_intent_id)
        charge = pi.get("latest_charge")
        return {"payment_intent": pi.id, "status": pi.status, "betrag_cent": pi.amount, "charge": charge, "reader": None, "livemode": bool(pi.livemode), "fertig": pi.status in ENDZUSTAENDE, "bezahlt": pi.status == "succeeded"}

    def abbrechen(self, payment_intent_id: str, reader_id: str | None = None) -> dict:
        if reader_id:
            try:
                self._stripe.terminal.Reader.cancel_action(reader_id)
            except Exception:  # noqa: BLE001 – Aktion evtl. schon beendet
                pass
        pi = self._stripe.PaymentIntent.retrieve(payment_intent_id)
        if pi.status == "succeeded":
            raise TerminalFehler("conflict", "Zahlung ist bereits erfolgt – nur Rückerstattung möglich.")
        if pi.status not in ("canceled",):
            self._stripe.PaymentIntent.cancel(payment_intent_id)
        return self.status(payment_intent_id)

    def simuliere_zahlung(self, reader_id: str, erfolgreich: bool = True) -> dict:
        if self.livemode:
            raise TerminalFehler("forbidden", "Simulation nur im Testmodus.")
        r = self._stripe.terminal.Reader.TestHelpers.present_payment_method(reader_id)
        return self.status(r.action.process_payment_intent.payment_intent)


def _dict(x):
    try:
        return dict(x) if x else None
    except Exception:  # noqa: BLE001
        return None


_MOCK: TerminalMock | None = None


def mock() -> TerminalMock:
    """Prozessweiter Mock (Kassa-Page im Staging ohne Stripe-Schlüssel)."""
    global _MOCK
    if _MOCK is None:
        _MOCK = TerminalMock()
    return _MOCK


def dienst(erzwinge_mock: bool = False):
    """Factory: echter Dienst nur mit Schlüssel in site_config und installiertem Paket; sonst Mock.

    Im Testmodus (PH Einstellungen.testmodus oder PH Kassa Einstellungen.terminal_testmodus) wird
    der echte Dienst mit Testschlüssel verwendet, wenn vorhanden – sonst Mock.
    """
    if erzwinge_mock:
        return mock()
    try:
        import frappe
    except ImportError:
        return mock()
    key = frappe.conf.get(SCHLUESSEL_SECRET)
    if not key:
        return mock()
    try:
        import stripe  # noqa: F401
    except ImportError:
        frappe.log_error(title="PH Kassa: Paket stripe fehlt – Terminal im Mock-Betrieb")
        return mock()
    livemode = bool(frappe.conf.get(SCHLUESSEL_LIVEMODE))
    if livemode and _testmodus():
        # Sicherung: Testmodus der Site darf nie echte Zahlungen auslösen.
        return mock()
    return StripeTerminalDienst(key, standort=frappe.conf.get(SCHLUESSEL_STANDORT), livemode=livemode)


def _testmodus() -> bool:
    try:
        from ph_core.ph_core.doctype.ph_einstellungen.ph_einstellungen import einstellungen

        if einstellungen().get("testmodus"):
            return True
        from ph_kassa.ph_kassa.doctype.ph_kassa_einstellungen.ph_kassa_einstellungen import einstellungen as ke

        return bool(ke().get("terminal_testmodus"))
    except Exception:  # noqa: BLE001
        return True


# ── Webhook-Rückkanal (ph_shop.stripe_webhook → hooks.ph_stripe_art_handler = [{"kassa": "ph_kassa.terminal.stripe_ereignis"}]) ──

WEBHOOK_STATUS = {
    "payment_intent.succeeded": "succeeded",
    "payment_intent.payment_failed": "failed",
    "payment_intent.canceled": "canceled",
    "payment_intent.processing": "processing",
    "payment_intent.requires_action": "requires_payment_method",
}


def stripe_ereignis(typ, obj, livemode=None, ereignis=None):
    """Handler für Stripe-Ereignisse mit metadata.art == "kassa" (Terminal-PaymentIntents).

    Spiegelt nur Status (PH Terminal.letzte_zahlung_*, Kundendisplay, Kommentar am Kassenbeleg) – gebucht wird die
    PH Zahlung ausschließlich vom Kassenbeleg (on_submit, idempotent über Payment Intent). Rückgabe "verarbeitet"
    oder "ignoriert" (Vertrag von ph_shop.stripe_webhook._dispatch). Wirft nie.
    """
    import frappe

    status = WEBHOOK_STATUS.get(typ)
    if not status:
        return "ignoriert"
    obj = obj or {}
    if obj.get("object") == "charge":
        pi = obj.get("payment_intent")
    else:
        pi = obj.get("id")
    if not pi:
        return "ignoriert"
    meta = obj.get("metadata") or {}
    if (meta.get("art") or "") != "kassa":
        return "ignoriert"
    try:
        reader = meta.get("terminal")
        filters = {"reader_id": reader} if reader else {"letzte_zahlung_intent": pi}
        if frappe.db.exists("DocType", "PH Terminal"):
            for t in frappe.get_all("PH Terminal", filters=filters, fields=["name", "letzte_zahlung_intent", "letzte_zahlung_status"]):
                if t.letzte_zahlung_intent == pi and t.letzte_zahlung_status == status:
                    continue  # idempotent: gleicher Stand schon gespiegelt
                frappe.db.set_value("PH Terminal", t.name, {"letzte_zahlung_intent": pi, "letzte_zahlung_status": status, "letzter_kontakt": frappe.utils.now_datetime()}, update_modified=False)
        if meta.get("kasse"):
            frappe.publish_realtime(f"ph_kassa_display_{meta['kasse']}", {"zustand": "terminal", "payment_intent": pi, "status": status, "betrag_cent": obj.get("amount")}, after_commit=True)
        beleg = frappe.db.get_value("PH Kassenbeleg Zahlung", {"terminal_payment_intent": pi}, "parent") if frappe.db.exists("DocType", "PH Kassenbeleg Zahlung") else None
        if beleg:
            frappe.get_doc("PH Kassenbeleg", beleg).add_comment("Info", f"Stripe {typ} ({pi}) – Ereignis {ereignis or '-'}")
        elif status in ("failed", "canceled"):
            frappe.log_error(title=f"PH Kassa Terminal: {typ} ohne Kassenbeleg ({pi})")
    except Exception:  # noqa: BLE001 – Webhook darf nicht an der Spiegelung scheitern
        frappe.log_error(title=f"PH Kassa Terminal: Webhook {typ} {pi}")
    return "verarbeitet"
