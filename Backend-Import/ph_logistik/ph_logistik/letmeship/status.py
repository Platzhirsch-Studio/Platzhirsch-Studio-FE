"""Reine Logik: Tracking-Status des Dienstleisters → PH-Sendungsstatus (kein Frappe-Import).

LetMeShip liefert `lmsTrackingStatus` (Großbuchstaben, englisch). Die Codes sind aus der
erpnext-shipping-Integration und üblichen Carrier-Zuständen übernommen; unbekannte Codes
lassen den Status unverändert (kein Raten). VOR LIVEGANG mit der offiziellen Doku abgleichen.
"""

ZUGESTELLT = {"DELIVERED", "ZUGESTELLT", "DELIVERED_TO_NEIGHBOUR", "DELIVERED_PARCELSHOP", "PICKED_UP_BY_RECEIVER"}
UNTERWEGS = {"IN_TRANSIT", "TRANSIT", "PICKED_UP", "PICKUP", "OUT_FOR_DELIVERY", "SHIPMENT_PICKED_UP", "IN_DELIVERY", "ARRIVED_AT_HUB", "DEPARTED_HUB", "CUSTOMS"}
PROBLEM = {"EXCEPTION", "PROBLEM", "FAILED_DELIVERY", "DELIVERY_FAILED", "RETURNED", "RETURN_TO_SENDER", "LOST", "DAMAGED", "REFUSED", "NOT_DELIVERED", "ADDRESS_ERROR", "CANCELLED_BY_CARRIER"}
ETIKETT = {"REGISTERED", "LABEL_CREATED", "BOOKED", "ORDERED", "PRE_TRANSIT", "INFO_RECEIVED", "MOCK"}

TEXTE = {
    "Etikett": "Etikett erstellt, Sendung angemeldet",
    "Unterwegs": "Sendung unterwegs",
    "Zugestellt": "Zugestellt",
    "Problem": "Problem bei der Zustellung",
}


def status_aus_tracking(code):
    """→ 'Etikett' | 'Unterwegs' | 'Zugestellt' | 'Problem' | None (unbekannt)."""
    c = str(code or "").strip().upper().replace(" ", "_").replace("-", "_")
    if not c:
        return None
    if c in ZUGESTELLT or c.startswith("DELIVERED"):
        return "Zugestellt"
    if c in PROBLEM or c.startswith("EXCEPTION") or c.startswith("RETURN"):
        return "Problem"
    if c in UNTERWEGS or "TRANSIT" in c or "DELIVERY" in c or "PICKED" in c:
        return "Unterwegs"
    if c in ETIKETT:
        return "Etikett"
    return None


RANG = {"Angelegt": 0, "Etikett": 1, "Unterwegs": 2, "Zugestellt": 3, "Problem": 3, "Storniert": 9}


def naechster_status(aktuell, neu):
    """Status nur vorwärts bewegen (Zugestellt/Storniert sind endgültig; Problem darf zu Zugestellt werden)."""
    if not neu or aktuell == neu:
        return aktuell
    if aktuell in ("Storniert", "Zugestellt"):
        return aktuell
    if aktuell == "Problem" and neu != "Zugestellt":
        return aktuell
    if RANG.get(neu, 0) < RANG.get(aktuell, 0):
        return aktuell
    return neu


def laufzeit_tage(gebucht_am, zugestellt_am):
    """Laufzeit in Tagen (float) oder None – für Report „Laufzeiten“ und Chart „Zustellzeit Ø“."""
    if not gebucht_am or not zugestellt_am:
        return None
    delta = zugestellt_am - gebucht_am
    return round(delta.total_seconds() / 86400, 2)
