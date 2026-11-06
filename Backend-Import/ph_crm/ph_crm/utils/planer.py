"""Planer-Konfiguration an einer Anfrage – reine Logik ohne Frappe (Tests: ph_crm/tests/test_planer.py).

Die Website-Planer (Sofaplaner, Dreiländer-Rechner, Küchenplaner …) übergeben ihr Ergebnis heute nur als
Text und Kontext-Parameter (src/lib/forms/beratungContext.js `planer=…`, Sofaplaner ResultPanel.js
planText + shareUrl, Dreiländer PriceCalculator.js `land`/`wert`). ph_projekte (PH Planung) ist für die
Website nicht freigegeben – deshalb nimmt ph_crm.api.create_anfrage die Konfiguration als JSON an und legt
sie an der PH Anfrage ab (Feld + privater Anhang). Lücke 26/25 in
Marktresearch/digital/backoffice/60-website-backend-umstellung.md.
"""

import json
import re

# Werte wie beratungContext.js (`?planer=`), zusätzlich „sofaplaner“-Varianten
PLANER = {
    "sofaplaner": "Sofaplaner",
    "dreilaender": "Dreiländer-Rechner",
    "kuechenplaner": "Küchenplaner",
    "ezarri": "Ezarri-Konfigurator",
    "3d": "3D-Planer",
    "stil-finder": "Stil-Finder",
    "yacht": "Yacht-Planer",
    "bodensee-licht": "Bodensee-Licht",
}
MAX_BYTES = 64 * 1024
MAX_TIEFE = 12
LINK_RE = re.compile(r"^https://([a-z0-9-]+\.)*platzhirsch\.studio(/[^\s]*)?$", re.I)


class PlanerFehler(ValueError):
    def __init__(self, feld, meldung):
        super().__init__(meldung)
        self.feld = feld
        self.meldung = meldung


def _tiefe(wert, n=0):
    if n > MAX_TIEFE:
        return n
    if isinstance(wert, dict):
        return max([_tiefe(v, n + 1) for v in wert.values()] or [n + 1])
    if isinstance(wert, list):
        return max([_tiefe(v, n + 1) for v in wert] or [n + 1])
    return n


def planer_pruefen(planer=None, konfiguration=None, link=None):
    """→ None (nichts übergeben) oder {planer, label, json, link, zusammenfassung}.

    planer:        Schlüssel aus PLANER (Pflicht, sobald Konfiguration oder Link kommt)
    konfiguration: dict oder JSON-Text eines Objekts, höchstens 64 KB, Tiefe ≤ 12
    link:          optionaler Teilen-Link (https, *.platzhirsch.studio), z. B. Sofaplaner shareUrl
    Fehler: PlanerFehler(feld, meldung).
    """
    planer = str(planer or "").strip().lower()
    if not planer and konfiguration in (None, "", {}) and not link:
        return None
    if planer not in PLANER:
        raise PlanerFehler("planer", "Unbekannter Planer.")
    if isinstance(konfiguration, str):
        s = konfiguration.strip()
        if s:
            if len(s.encode()) > MAX_BYTES:
                raise PlanerFehler("planer_konfiguration", "Planer-Konfiguration zu groß.")
            try:
                konfiguration = json.loads(s)
            except ValueError as e:
                raise PlanerFehler("planer_konfiguration", "Planer-Konfiguration ist kein JSON.") from e
        else:
            konfiguration = None
    if konfiguration is not None and not isinstance(konfiguration, dict):
        raise PlanerFehler("planer_konfiguration", "Planer-Konfiguration muss ein Objekt sein.")
    text = None
    if konfiguration:
        if _tiefe(konfiguration) > MAX_TIEFE:
            raise PlanerFehler("planer_konfiguration", "Planer-Konfiguration zu tief verschachtelt.")
        text = json.dumps(konfiguration, ensure_ascii=False, sort_keys=True, indent=1)
        if len(text.encode()) > MAX_BYTES:
            raise PlanerFehler("planer_konfiguration", "Planer-Konfiguration zu groß.")
    link = str(link or "").strip()
    if link and (len(link) > 500 or not LINK_RE.match(link)):
        raise PlanerFehler("planer_link", "Planer-Link ungültig.")
    return {"planer": planer, "label": PLANER[planer], "json": text, "link": link or None, "zusammenfassung": zusammenfassung(planer, konfiguration or {})}


def zusammenfassung(planer, k):
    """Eine Zeile für das Anliegen (nur unkritische Eckdaten, keine Personendaten)."""
    teile = []
    if planer == "sofaplaner":
        if k.get("family"):
            teile.append(f"Modell {str(k['family'])[:64]}")
        raum = k.get("room") or {}
        if raum.get("w") and raum.get("d"):
            teile.append(f"Raum {raum['w']} × {raum['d']} cm")
        if isinstance(k.get("items"), list):
            teile.append(f"{len(k['items'])} Elemente")
    elif planer == "dreilaender":
        for feld, label in (("land", "Land"), ("wert", "Warenwert"), ("lieferart", "Lieferart")):
            if k.get(feld) not in (None, ""):
                teile.append(f"{label} {str(k[feld])[:40]}")
    return ", ".join(teile)
