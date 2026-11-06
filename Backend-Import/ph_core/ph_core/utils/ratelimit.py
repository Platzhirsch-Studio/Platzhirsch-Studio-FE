"""Ratenbegrenzung je Client – reine Logik ohne Frappe (Tests: ph_core/tests/test_ratelimit.py).

Lücke ph_core 1 in Marktresearch/digital/backoffice/60-website-backend-umstellung.md: Der gesamte
Website-Verkehr lief über einen Benutzer (website@platzhirsch.studio) und teilte sich je Methode einen
Eimer. Jetzt zählt jeder Client einzeln:

  * Rolle PH Website Integration mit Header `X-PH-Client: <sha256(besucher-ip) hex>` → Client = Header
    (die Website kennt die Besucher-IP, Frappe sieht nur den Next-Server).
  * Gast (allow_guest-Methoden: Katalog, Karriere) → Client = IP-Hash der Anfrage. Ein Gast-Header wird
    ignoriert, sonst könnte man durch wechselnde Header die Grenze umgehen.
  * sonst (Desk-Benutzer, Website ohne Header) → Client = IP-Hash bzw. "-".

Zusätzlich eine Obergrenze je Methode und Benutzer über alle Clients (gegen gefälschte Kennungen).
"""

import re

CLIENT_RE = re.compile(r"^[0-9a-f]{16,64}$")
FENSTER_SEKUNDEN = 60


def normalisiere_client(wert):
    """Header-Wert → 32 Hex-Zeichen oder '' (ungültig/leer)."""
    s = str(wert or "").strip().lower()
    return s[:32] if CLIENT_RE.match(s) else ""


def client_kennung(ist_gast, ist_website, header=None, ip_h=None):
    """Kennung des Clients für den Zähler (siehe Modul-Docstring)."""
    if ist_website and not ist_gast:
        c = normalisiere_client(header)
        if c:
            return f"c:{c}"
    return f"ip:{ip_h}" if ip_h else "-"


def minute(zeit):
    return int(zeit // FENSTER_SEKUNDEN)


def schluessel(methode, benutzer, client, zeit):
    """Zähler je Methode, Benutzer und Client im aktuellen Minutenfenster."""
    return f"ph_api:rl:{methode}:{benutzer}:{client}:{minute(zeit)}"


def gesamt_schluessel(methode, benutzer, zeit):
    """Zähler je Methode und Benutzer über alle Clients (Obergrenze)."""
    return f"ph_api:rlg:{methode}:{benutzer}:{minute(zeit)}"


def erlaubt(zaehler, grenze):
    """grenze ≤ 0 = keine Begrenzung."""
    return not grenze or grenze <= 0 or zaehler <= grenze
