"""Fachregeln ohne Frappe-Import: Rechtsgrundlagen der Kundenreisen, Versandfenster, Newsletter-Blöcke.

Spiegel von src/lib/kundenbetreuung/rechtsgrundlagen.js (pruefeReise, FREQUENZ, SPERRTAGE, VERSANDFENSTER)
und src/lib/kundenbetreuung/newsletter/newsletter.js (blockSichtbar, versandbereit). Änderungen an beiden Stellen.
"""

from datetime import date

ZWECKE = ("newsletter", "einladungen", "merkliste_erinnerung", "planer_erinnerung", "rueckmeldung", "pflege_nachkauf", "whatsapp", "foto_referenz")
ZWECK_TEXT = {
    "newsletter": "unseren Newsletter „Post aus Lochau“",
    "einladungen": "Einladungen zu Abenden im Showroom",
    "merkliste_erinnerung": "die Erinnerung an Ihre Merkliste",
    "planer_erinnerung": "die Erinnerung an Ihren Planer-Stand",
    "rueckmeldung": "eine Bitte um Ihre Rückmeldung",
    "pflege_nachkauf": "Pflegehinweise zu Ihren Stücken",
    "whatsapp": "den Kontakt per WhatsApp",
    "foto_referenz": "die Verwendung von Fotos aus Ihrem Projekt als Referenz",
}
# Zwecke, die per Mail-Link bestätigt werden (E-Mail-Werbung). whatsapp/foto_referenz werden
# schriftlich bzw. im Portal/Showroom eingeholt und ohne DOI protokolliert (kanal ≠ website).
DOI_ZWECKE = ("newsletter", "einladungen", "merkliste_erinnerung", "planer_erinnerung", "rueckmeldung", "pflege_nachkauf")
WERBEWOERTER = ("gutschein", "angebot", "rabatt", "neu im showroom", "einladung")
ANREIZWOERTER = ("gutschein", "empfehl", "gewinn", "belohn")
SPERRTAGE = ("12-24", "12-25", "12-26", "12-31", "01-01")
WERBUNG_WOCHENTAGE = (2, 3, 4)  # Di–Do
WERBUNG_PRO_30_TAGE = 2
FUSSZEILE_FUER = {"V": "V", "B": "B", "E": "A"}


def _get(obj, feld, standard=None):
    if isinstance(obj, dict):
        return obj.get(feld, standard)
    return getattr(obj, feld, standard)


def grundlagen(reise):
    """reise: dict/Document mit grundlage_v/b/e → Teilmenge von ['V','B','E']."""
    return [k for k, feld in (("V", "grundlage_v"), ("B", "grundlage_b"), ("E", "grundlage_e")) if int(_get(reise, feld) or 0)]


def pruefe_reise(reise, vorlage_html=""):
    """Fehlerliste (leer = ok). reise: dict oder Document; vorlage_html: HTML der Mail-Vorlage."""
    f = []
    g = grundlagen(reise)
    werbung = int(_get(reise, "werbung") or 0)
    reise_id = _get(reise, "reise_id") or ""
    if not g:
        f.append("keine Rechtsgrundlage")
    if werbung and "V" in g:
        f.append("Werbung kann nicht auf Vertrag/Service (V) gestützt werden")
    if not werbung and any(k != "V" for k in g):
        f.append("Service-Mail braucht nur V; B/E nur für Werbung")
    if "B" in g and not (_get(reise, "aehnliche_produkte") or "").strip():
        f.append("B ohne Begründung eigene, ähnliche Produkte")
    if "E" in g and (_get(reise, "zweck") or "") not in ZWECKE:
        f.append("E ohne gültigen Zweck")
    if reise_id == "merkliste" and g != ["E"]:
        f.append("Merkliste/Planer nur mit Einwilligung (E)")
    if reise_id == "bewertung" and g != ["E"]:
        f.append("Bewertungsbitte bis zur Klärung durch die Kanzlei nur mit Einwilligung (E)")
    html = (vorlage_html or "").lower()
    if html:
        if not werbung and any(w in html for w in WERBEWOERTER):
            f.append("Service-Vorlage enthält Werbewörter (Gutschein/Angebot/Rabatt/Neu/Einladung)")
        if werbung and "abmelde_url" not in html and "fusszeile_html" not in html:
            f.append("Werbung ohne Abmeldelink in der Vorlage")
        if reise_id == "bewertung" and any(w in html for w in ANREIZWOERTER):
            f.append("Bewertungsbitte darf keinen Anreiz und keine Empfehlung enthalten")
    if not _get(reise, "trigger"):
        f.append("kein Auslöser")
    return f


def werbung_heute_erlaubt(tag, wochentage=WERBUNG_WOCHENTAGE, sperrtage=SPERRTAGE):
    """Werbliche Mails nur Di–Do und nie an Sperrtagen; tag: date."""
    if not isinstance(tag, date):
        return False
    return tag.strftime("%m-%d") not in set(sperrtage) and tag.isoweekday() in {int(w) for w in wochentage}


def sperrtag(tag, sperrtage=SPERRTAGE):
    return isinstance(tag, date) and tag.strftime("%m-%d") in set(sperrtage)


def liste_aus_text(text, standard=()):
    teile = [t.strip() for t in str(text or "").split(",") if t.strip()]
    return teile or list(standard)


# ── Newsletter-Blöcke (newsletter.js) ───────────────────────────────────────
SLOT_TYPEN = ("neueStuecke", "skizze")
INHALT_TYPEN = ("neueStuecke", "skizze", "termine", "gutZuWissen")
BLOCK_NAMEN = {"neueStuecke": "neue Stücke in der Ausstellung", "skizze": "Haralds Skizze des Monats", "termine": "Termine", "gutZuWissen": "ein Tipp"}


def _text(v):
    return bool(str(v or "").strip())


def block_sichtbar(block):
    """Nur Blöcke mit echtem Inhalt; Slot-Bilder nur „eigen“ (Design-Bibel §7)."""
    typ = _get(block, "typ")
    titel, text, bild, quelle = _get(block, "titel"), _get(block, "text"), _get(block, "bild"), _get(block, "bildquelle")
    if typ == "brief":
        return _text(text)
    if typ in SLOT_TYPEN:
        return _text(text) and _text(bild) and quelle == "eigen" and _text(_get(block, "bild_alt"))
    if typ == "termine":
        return _text(titel) and (_text(_get(block, "event")) or _text(text))
    if typ in ("gutZuWissen", "arbeitsweise"):
        return _text(titel) and _text(text)
    return False


def versandbereit(bloecke):
    sichtbar = [b for b in bloecke if block_sichtbar(b)]
    inhalt = [b for b in sichtbar if _get(b, "typ") in INHALT_TYPEN]
    return any(_get(b, "typ") == "brief" for b in sichtbar) and any(_get(b, "typ") in SLOT_TYPEN for b in inhalt) and len(inhalt) >= 2


def offene_slots(bloecke):
    return [_get(b, "typ") for b in bloecke if _get(b, "typ") in SLOT_TYPEN and not block_sichtbar(b)]


def inhalt_zeile(bloecke):
    teile = [BLOCK_NAMEN[_get(b, "typ")] for b in bloecke if block_sichtbar(b) and _get(b, "typ") in BLOCK_NAMEN]
    if not teile:
        return ""
    liste = teile[0] if len(teile) == 1 else f"{', '.join(teile[:-1])} und {teile[-1]}"
    return f"In diesem Brief: {liste}."


def preheader(bloecke):
    z = inhalt_zeile(bloecke).replace("In diesem Brief: ", "", 1)
    return z[:1].upper() + z[1:] if z else ""
