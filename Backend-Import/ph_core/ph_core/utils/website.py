"""Website-Cache (Next.js) nach Datenänderungen erneuern – gemeinsamer Helfer aller PH-Apps.

    from ph_core.utils.website import revalidate
    revalidate("produkte")                      # ein Pfad
    revalidate(["produkte", "marken"])          # mehrere Pfade, je Pfad gedrosselt
    revalidate("karriere", sofort=True)         # synchron (Button „Website aktualisieren“)

Website-Seite: POST <ph_website_revalidate_url>/revalidate/<pfad>, Header `X-Revalidate-Secret`
(src/lib/revalidateAuth.js, src/app/revalidate/<pfad>/route.js). Kein Body nötig; die Route kennt
ihre Tags selbst. Gültige Pfade (Stand 04.11.2026): karriere, marken, news, produkte, team.
Andere Header-Varianten (Bearer, JSON-Body {tag}) prüft die Website NICHT.

Konfiguration:
  site_config.json: ph_website_revalidate_url (Basis-URL der Website, ohne /revalidate),
                    Geheimnis unter dem Schlüsselnamen aus PH Einstellungen
                    (website_revalidate_secret_name, Standard ph_website_revalidate_secret).
  PH Einstellungen: website_revalidate_aktiv (Schalter), website_revalidate_drossel_sekunden
                    (Standard 30: höchstens ein Aufruf je Pfad in diesem Fenster).

Verhalten: Aufruf wird nach Commit per frappe.enqueue (queue short) gesendet; während Installation,
Migration, Import und Tests wird nichts gesendet; Fehler landen im Error Log, nie beim Benutzer.
"""

import frappe

PFADE = ("karriere", "marken", "news", "produkte", "team")
HEADER = "X-Revalidate-Secret"
SCHLUESSEL_URL = "ph_website_revalidate_url"
SCHLUESSEL_SECRET_STANDARD = "ph_website_revalidate_secret"


def revalidate(pfad, sofort=False, grund=""):
    """Website-Cache für einen Pfad oder eine Liste von Pfaden erneuern. Rückgabe: dict je Pfad."""
    pfade = [pfad] if isinstance(pfad, str) else list(pfad or [])
    pfade = [p.strip().strip("/").lower() for p in pfade if p and str(p).strip()]
    if not pfade:
        return {}
    einst = _einstellungen()
    ergebnis = {}
    for p in dict.fromkeys(pfade):  # Reihenfolge behalten, Dubletten entfernen
        ergebnis[p] = _planen(p, einst, sofort=sofort, grund=grund)
    return ergebnis


def _planen(pfad, einst, sofort=False, grund=""):
    if pfad not in PFADE:
        frappe.log_error(title=f"ph_core revalidate: unbekannter Pfad {pfad}", message=f"Erlaubt: {', '.join(PFADE)} ({grund})")
        return {"ok": False, "grund": "unbekannter Pfad"}
    if not einst.get("website_revalidate_aktiv", 1):
        return {"ok": False, "grund": "deaktiviert"}
    flags = frappe.flags
    if flags.in_install or flags.in_migrate or flags.in_import or flags.in_patch or flags.in_test:
        return {"ok": False, "grund": "unterdrückt (Installation/Migration/Import/Test)"}
    if not frappe.conf.get(SCHLUESSEL_URL):
        return {"ok": False, "grund": f"{SCHLUESSEL_URL} fehlt in site_config.json"}
    if sofort:
        return senden(pfad, grund=grund)
    drossel = int(einst.get("website_revalidate_drossel_sekunden") or 30)
    schluessel = f"ph_core:revalidate:{pfad}"
    cache = frappe.cache()
    if cache.get_value(schluessel):
        return {"ok": True, "grund": "bereits geplant"}
    cache.set_value(schluessel, 1, expires_in_sec=max(drossel, 1))
    frappe.enqueue("ph_core.utils.website.senden", queue="short", enqueue_after_commit=True, pfad=pfad, grund=grund)
    return {"ok": True, "grund": "geplant"}


def senden(pfad, grund=""):
    """Synchroner POST an die Website (wird normalerweise aus der Queue aufgerufen)."""
    url = (frappe.conf.get(SCHLUESSEL_URL) or "").rstrip("/")
    secret = frappe.conf.get(_einstellungen().get("website_revalidate_secret_name") or SCHLUESSEL_SECRET_STANDARD)
    if not url or not secret:
        return {"ok": False, "grund": "URL oder Geheimnis fehlen in site_config.json"}
    try:
        import requests

        antwort = requests.post(f"{url}/revalidate/{pfad}", headers={HEADER: secret}, timeout=10)
        ok = antwort.status_code < 300
        if not ok:
            frappe.log_error(title=f"ph_core revalidate {pfad}: HTTP {antwort.status_code}", message=f"{antwort.text[:500]} ({grund})")
        return {"ok": ok, "status": antwort.status_code}
    except Exception:  # noqa: BLE001 – Website nicht erreichbar darf den Beleg nicht blockieren
        frappe.log_error(title=f"ph_core revalidate {pfad}: nicht erreichbar", message=grund)
        return {"ok": False, "grund": "nicht erreichbar"}


def _einstellungen():
    try:
        from ph_core.ph_core.doctype.ph_einstellungen.ph_einstellungen import einstellungen

        return einstellungen()
    except Exception:  # noqa: BLE001 – vor Migration der neuen Felder
        return {"website_revalidate_aktiv": 1, "website_revalidate_drossel_sekunden": 30, "website_revalidate_secret_name": SCHLUESSEL_SECRET_STANDARD}
