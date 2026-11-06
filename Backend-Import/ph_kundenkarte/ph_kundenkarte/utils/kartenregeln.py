"""Regeln für Kartenlebenszyklus – ohne Frappe-Import (unittest ohne Site).

Sperrgrund-Katalog, Ersatzkarte, Übertragung, Zusammenführen von Dubletten, Kassa-Antwortcodes,
Geburtstag als Teildatum, Stufenplan-Vorschau. Quelle: Marktresearch/digital/backoffice/10-konzept-kundenkarte.md
(§3.5 Dialog „Sperren“, §7.2 Kiosk, §8.2, §9) und Auftrag Backend-Lücken (Nr. 50).

Entscheidungen (README „Lebenszyklus“):
- Sperrgrund ist ein fester Katalog (Select `sperrgrund_art`) plus Freitext `sperrgrund`. Kein eigener DocType:
  die Gründe steuern Programmlogik (Ersatzkarte, Entsperrbarkeit, Kassa-Text) und dürfen nicht frei wachsen.
- Ersatzkarte (Verlust/Diebstahl/Beschädigung) und Übertragung erhalten eine **neue Nummer**: die alte Karte
  (Plastik, QR, Wallet-Pass) bleibt im Umlauf und darf nicht weiter funktionieren. Alte Karte → Status
  „Ersetzt“ bzw. „Uebertragen“ mit Verweis `nachfolger_karte`; Jahreslimits zählen über die Kette weiter.
- Zusammenführen: Zielkarte behält ihre Nummer; Einlösungen werden umgehängt, Ereignisse bleiben als
  unveränderliches Protokoll an der Quellkarte (Zeitleiste liest die Kette). Höhere Stufe bleibt.
"""

from datetime import date
import re

# ── Status ───────────────────────────────────────────────────────────────────

AKTIV = "Aktiv"
OFFENE_STATUS = ("Beantragt", AKTIV, "Gesperrt")  # höchstens eine solche Karte je Kontakt
END_STATUS = ("Gekuendigt", "Ersetzt", "Uebertragen", "Zusammengefuehrt")
ALLE_STATUS = OFFENE_STATUS + END_STATUS

# ── Sperrgrund-Katalog ───────────────────────────────────────────────────────
# schluessel: (label, ersatzkarte_vorschlagen, entsperrbar, kassa_text)
SPERRGRUENDE = {
    "Verlust": ("Verlust", True, True, "Karte als verloren gemeldet – bitte an die Beratung verweisen."),
    "Diebstahl": ("Diebstahl", True, False, "Karte als gestohlen gemeldet – nicht annehmen, Beratung informieren."),
    "Beschaedigt": ("Beschädigt / unlesbar", True, True, "Karte beschädigt – Ersatzkarte im Backoffice."),
    "Missbrauch": ("Missbrauch / Verdacht", False, True, "Karte gesperrt – bitte an die Leitung verweisen."),
    "Kundenwunsch": ("Kundenwunsch (vorübergehend)", False, True, "Karte auf Wunsch der Kundin/des Kunden gesperrt."),
    "Dublette": ("Dublette (zweite Karte)", False, False, "Doppelte Karte – bitte die Hauptkarte verwenden."),
    "Datenschutz": ("Datenschutz-Löschung", False, False, "Karte nicht mehr gültig."),
    "Verstorben": ("Inhaber verstorben", False, False, "Karte nicht mehr gültig."),
    "Sonstiges": ("Sonstiges (Freitext Pflicht)", False, True, "Karte gesperrt – bitte an die Beratung verweisen."),
}
SPERRGRUND_OPTIONEN = "\n".join(SPERRGRUENDE)


def sperrgrund_pruefen(art, freitext=None):
    """(ok, meldung). Katalogwert Pflicht; bei „Sonstiges“ zusätzlich Freitext."""
    if art not in SPERRGRUENDE:
        return False, "Bitte einen Sperrgrund aus dem Katalog wählen."
    if art == "Sonstiges" and not (freitext or "").strip():
        return False, "Bei „Sonstiges“ ist eine Beschreibung Pflicht."
    return True, ""


def sperrgrund_aus_text(text):
    """Ältere Aufrufer (`sperren(grund)`): Katalogschlüssel/-label im Text erkennen, sonst „Sonstiges“; leer → None."""
    t = (text or "").strip().lower()
    if not t:
        return None
    for schluessel, eintrag in SPERRGRUENDE.items():
        if t in (schluessel.lower(), eintrag[0].lower()):
            return schluessel
    return "Sonstiges"


def ersatzkarte_vorgesehen(art):
    return bool(SPERRGRUENDE.get(art, (None, False))[1])


def entsperrbar(art):
    """Diebstahl, Dublette, Datenschutz, Verstorben sind endgültig (Ersatz bzw. Kündigung statt Entsperren)."""
    eintrag = SPERRGRUENDE.get(art)
    return True if eintrag is None else bool(eintrag[2])


def kassa_text(art):
    eintrag = SPERRGRUENDE.get(art)
    return eintrag[3] if eintrag else "Karte gesperrt – bitte an die Beratung verweisen."


# ── Kassa / Packtisch ────────────────────────────────────────────────────────

def kassa_bewertung(status, sperrgrund_art=None, zusammengefuehrt_in=None):
    """Antwortcode für den Kiosk. → (code, weiter_zu, text)
    code: ok | card_pending | card_blocked | card_replaced | card_transferred | card_merged | card_cancelled.
    Nur bei Zusammenführung (gleiche Person) wird auf die Zielkarte weitergeleitet; bei Ersatz/Übertragung
    nicht (alte Karte könnte in fremder Hand sein)."""
    if status == AKTIV:
        return "ok", None, ""
    if status == "Beantragt":
        return "card_pending", None, "Noch nicht aktiv – Übergabe bestätigen (Karte übergeben)."
    if status == "Gesperrt":
        return "card_blocked", None, kassa_text(sperrgrund_art)
    if status == "Ersetzt":
        return "card_replaced", None, "Diese Karte wurde durch eine Ersatzkarte ersetzt – bitte die neue Karte verwenden."
    if status == "Uebertragen":
        return "card_transferred", None, "Diese Karte wurde auf eine andere Person übertragen und ist nicht mehr gültig."
    if status == "Zusammengefuehrt":
        return "card_merged", zusammengefuehrt_in, "Doppelte Karte – die Hauptkarte wird verwendet."
    return "card_cancelled", None, "Karte nicht mehr gültig."


# ── Zusammenführen ───────────────────────────────────────────────────────────

_STATUS_RANG = {AKTIV: 3, "Gesperrt": 2, "Beantragt": 1}


def ziel_waehlen(karten, stufen_rang):
    """Zielkarte unter offenen Karten derselben Person.
    karten: [{name, status, stufe, ausgestellt_am(date|str|None)}], stufen_rang: {stufe: reihenfolge}.
    Reihenfolge: Status (Aktiv > Gesperrt > Beantragt) → höhere Stufe → ältere Ausgabe → Name."""
    offen = [k for k in karten if k.get("status") in OFFENE_STATUS]
    if not offen:
        return None

    def schluessel(k):
        ausgabe = str(k.get("ausgestellt_am") or "9999-12-31")
        return (-_STATUS_RANG.get(k["status"], 0), -int(stufen_rang.get(k.get("stufe"), 0)), ausgabe, k["name"])

    return sorted(offen, key=schluessel)[0]["name"]


def _ts(wert):
    return str(wert or "")


def zusammenfuehren_plan(karten, stufen_rang):
    """Plan für das Zusammenführen aller offenen Karten einer Person.

    karten: dicts mit name, status, stufe, stufe_seit, stufe_manuell, ausgestellt_am, persoenlicher_berater,
    geburtstag, einwilligung_auswertung, einwilligung_am, einwilligung_widerrufen_am, einwilligung_textversion,
    sperrgrund_art.
    Rückgabe: {ziel, quellen[], werte{} (für Zielkarte), warnungen[]} oder None (nichts zu tun).
    Regeln: höchste Stufe bleibt (mit frühestem `stufe_seit` dieser Stufe; manuell, wenn eine Karte mit dieser
    Stufe manuell war); Einwilligung = jüngste Erklärung der Person (Erteilung oder Widerruf); leere Felder
    der Zielkarte (Berater, Geburtstag) aus Quellen ergänzen; Sperre wegen Missbrauch/Diebstahl wird nicht
    still aufgehoben → Warnung.
    """
    offen = [k for k in karten if k.get("status") in OFFENE_STATUS]
    if len(offen) < 2:
        return None
    ziel_name = ziel_waehlen(offen, stufen_rang)
    ziel = next(k for k in offen if k["name"] == ziel_name)
    quellen = [k for k in offen if k["name"] != ziel_name]
    werte = {}
    warnungen = []

    hoechster = max(int(stufen_rang.get(k.get("stufe"), 0)) for k in offen)
    mit_hoechster = [k for k in offen if int(stufen_rang.get(k.get("stufe"), 0)) == hoechster]
    if int(stufen_rang.get(ziel.get("stufe"), 0)) < hoechster:
        werte["stufe"] = mit_hoechster[0]["stufe"]
    seit = sorted(_ts(k.get("stufe_seit")) for k in mit_hoechster if k.get("stufe_seit"))
    if seit and seit[0] != _ts(ziel.get("stufe_seit")):
        werte["stufe_seit"] = seit[0]
    if any(int(k.get("stufe_manuell") or 0) for k in mit_hoechster) and not int(ziel.get("stufe_manuell") or 0):
        werte["stufe_manuell"] = 1

    # Einwilligung: jüngste Erklärung gewinnt
    def erklaerung(k):
        erteilt = _ts(k.get("einwilligung_am")) if int(k.get("einwilligung_auswertung") or 0) else ""
        widerruf = _ts(k.get("einwilligung_widerrufen_am"))
        if widerruf and widerruf >= erteilt:
            return (widerruf, 0, k)
        if erteilt:
            return (erteilt, 1, k)
        return ("", 0, k)

    juengste = max((erklaerung(k) for k in offen), key=lambda e: e[0])
    if juengste[0]:
        _zeit, an, quelle = juengste
        if bool(an) != bool(int(ziel.get("einwilligung_auswertung") or 0)) or (an and _ts(quelle.get("einwilligung_am")) != _ts(ziel.get("einwilligung_am"))):
            werte["einwilligung_auswertung"] = an
            if an:
                werte["einwilligung_am"] = quelle.get("einwilligung_am")
                werte["einwilligung_textversion"] = quelle.get("einwilligung_textversion")
                werte["einwilligung_widerrufen_am"] = None
            else:
                werte["einwilligung_widerrufen_am"] = quelle.get("einwilligung_widerrufen_am")

    for feld in ("persoenlicher_berater", "geburtstag", "geburtstag_tag_monat"):
        if not ziel.get(feld):
            wert = next((k.get(feld) for k in quellen if k.get(feld)), None)
            if wert:
                werte[feld] = wert

    for k in quellen:
        if k.get("status") == "Gesperrt" and k.get("sperrgrund_art") in ("Missbrauch", "Diebstahl") and ziel.get("status") == AKTIV:
            warnungen.append(f"{k['name']} war wegen {k['sperrgrund_art']} gesperrt – Zielkarte {ziel_name} prüfen.")
    if ziel.get("status") == "Beantragt" and any(k.get("status") == AKTIV for k in quellen):
        warnungen.append("Zielkarte ist nur beantragt.")  # tritt durch ziel_waehlen nicht auf, Schutz für Änderungen
    return {"ziel": ziel_name, "quellen": [k["name"] for k in quellen], "werte": werte, "warnungen": warnungen}


# ── Übertragung / Ersatz ─────────────────────────────────────────────────────

UEBERTRAGUNGSGRUENDE = ("Partner/Haushalt", "Erbe", "Firmennachfolge", "Sonstiges")


def uebertragung_pruefen(status, sperrgrund_art, alt_kontakt, ziel_kontakt, ziel_hat_karte, grund_art, freitext=None):
    """(ok, meldung) für „Karte übertragen“ (Leitung)."""
    if grund_art not in UEBERTRAGUNGSGRUENDE:
        return False, "Bitte einen Übertragungsgrund wählen."
    if grund_art == "Sonstiges" and not (freitext or "").strip():
        return False, "Bei „Sonstiges“ ist eine Beschreibung Pflicht."
    if status not in (AKTIV, "Gesperrt"):
        return False, "Nur aktive oder gesperrte Karten können übertragen werden."
    if status == "Gesperrt" and sperrgrund_art in ("Missbrauch", "Diebstahl", "Datenschutz", "Dublette"):
        return False, "Wegen des Sperrgrunds ist keine Übertragung möglich."
    if not ziel_kontakt or ziel_kontakt == alt_kontakt:
        return False, "Bitte einen anderen Kontakt als Empfänger wählen."
    if ziel_hat_karte:
        return False, "Der Empfänger hat bereits eine Kundenkarte – stattdessen zusammenführen oder kündigen."
    return True, ""


def ersatz_pruefen(status, sperrgrund_art):
    """(ok, meldung) für „Ersatzkarte ausstellen“: aktive Karte (Grund wird beim Ersatz gesetzt) oder gesperrt
    mit Verlust/Diebstahl/Beschädigung."""
    if status == AKTIV:
        return True, ""
    if status == "Gesperrt" and ersatzkarte_vorgesehen(sperrgrund_art):
        return True, ""
    return False, "Ersatzkarte nur für aktive Karten oder nach Sperre wegen Verlust, Diebstahl oder Beschädigung."


def kette(start, vorgaenger, max_tiefe=20):
    """Karte und alle Vorgänger: vorgaenger = {karte: vorgaenger_karte|None}. Schutz gegen Zyklen."""
    ergebnis, gesehen, aktuell = [], set(), start
    while aktuell and aktuell not in gesehen and len(ergebnis) < max_tiefe:
        ergebnis.append(aktuell)
        gesehen.add(aktuell)
        aktuell = vorgaenger.get(aktuell)
    return ergebnis


# ── Geburtstag ───────────────────────────────────────────────────────────────

_GEB_VOLL = re.compile(r"^(\d{4})-(\d{2})-(\d{2})$")
_GEB_TEIL = re.compile(r"^-{0,2}(\d{2})-(\d{2})$")
_GEB_DE = re.compile(r"^(\d{1,2})\.(\d{1,2})\.(\d{4})?$")


def geburtstag_parsen(wert):
    """'1980-05-12' → ('1980-05-12', '05-12'); '--05-12' / '05-12' / '12.5.' → (None, '05-12'); ungültig → (None, None).
    Website liefert das Jahr ggf. nicht (Konzept §9.1); Tag/Monat genügt für den Geburtstagsgruß."""
    s = str(wert or "").strip()
    if not s:
        return None, None
    m = _GEB_VOLL.match(s)
    if m:
        j, mo, t = (int(x) for x in m.groups())
        try:
            d = date(j, mo, t)
        except ValueError:
            return None, None
        if j < 1900 or d > date.today():
            return None, None
        return d.isoformat(), f"{mo:02d}-{t:02d}"
    m = _GEB_TEIL.match(s)
    if m:
        mo, t = int(m.group(1)), int(m.group(2))
    else:
        m = _GEB_DE.match(s)
        if not m:
            return None, None
        t, mo = int(m.group(1)), int(m.group(2))
        if m.group(3):
            return geburtstag_parsen(f"{int(m.group(3)):04d}-{mo:02d}-{t:02d}")
    try:
        date(2000, mo, t)  # Schaltjahr erlaubt 29.02.
    except ValueError:
        return None, None
    return None, f"{mo:02d}-{t:02d}"


def geburtstag_heute(tag_monat, heute):
    """True, wenn 'MM-DD' heute ist; 29.02. wird in Nicht-Schaltjahren am 28.02. gefeiert."""
    if not tag_monat:
        return False
    mo, t = (int(x) for x in tag_monat.split("-"))
    if (mo, t) == (heute.month, heute.day):
        return True
    schalt = heute.year % 4 == 0 and (heute.year % 100 != 0 or heute.year % 400 == 0)
    return (mo, t) == (2, 29) and not schalt and (heute.month, heute.day) == (2, 28)


# ── Stufenplan-Vorschau ──────────────────────────────────────────────────────

def stufenplan_vorschau(karten, stufen_neu):
    """Wirkung geänderter Schwellen (nur Aufstufung/Herabstufung nach Umsatz, ohne Haltefrist):
    karten: [{name, stufe, jahresumsatz_cent, stufe_manuell, einwilligung_auswertung}],
    stufen_neu: [{stufenname, reihenfolge, schwelle_jahresumsatz_cent, aktiv}].
    → {auf, ab, gleich, nicht_beurteilt, beispiele[{karte, alt, neu}]} (max. 20 Beispiele)."""
    aktiv = sorted((s for s in stufen_neu if int(s.get("aktiv", 1) or 0)), key=lambda s: int(s.get("reihenfolge") or 0))
    rang = {s["stufenname"]: int(s.get("reihenfolge") or 0) for s in aktiv}
    ergebnis = {"auf": 0, "ab": 0, "gleich": 0, "nicht_beurteilt": 0, "beispiele": []}
    for k in karten:
        if not int(k.get("einwilligung_auswertung") or 0) or int(k.get("stufe_manuell") or 0):
            ergebnis["nicht_beurteilt"] += 1
            continue
        umsatz = int(k.get("jahresumsatz_cent") or 0)
        neu = None
        for s in aktiv:
            if umsatz >= int(s.get("schwelle_jahresumsatz_cent") or 0):
                neu = s["stufenname"]
        alt = k.get("stufe")
        if neu is None or neu == alt:
            ergebnis["gleich"] += 1
            continue
        richtung = "auf" if rang.get(neu, 0) > rang.get(alt, 0) else "ab"
        ergebnis[richtung] += 1
        if len(ergebnis["beispiele"]) < 20:
            ergebnis["beispiele"].append({"karte": k.get("name"), "alt": alt, "neu": neu})
    return ergebnis


# ── Datenschutz ──────────────────────────────────────────────────────────────

ANONYM = "anonymisiert"


def anonymisierungsplan(karten, einloesungen, antraege, ereignisse_anzahl=0):
    """Plan für ph_kontakt_anonymisieren: Kundenkarten-Daten haben keinen Geldwert und keine BAO-Pflicht
    (Belege liegen in ph_kassa/ph_faktura) → anonymisieren statt löschen, damit Statistik/Limits stimmen.
    Antrag mit Einwilligungsnachweis: Personendaten entfernen, Zeitpunkt/Textversion bleiben (ohne Personenbezug).
    → [{doctype, name, aktion, grund, frist_bis}]"""
    plan = []
    for k in karten:
        plan.append({"doctype": "PH Kundenkarte", "name": k, "aktion": "anonymisieren", "grund": "Name, Geburtstag, Notizen, Wallet/QR entfernen; Karte gekündigt (Sperrgrund Datenschutz)", "frist_bis": None})
    for e in einloesungen:
        plan.append({"doctype": "PH Kundenkarte Einloesung", "name": e, "aktion": "anonymisieren", "grund": "Name und Kommentar entfernen; Einlösung bleibt für Nutzungsstatistik ohne Personenbezug", "frist_bis": None})
    for a in antraege:
        plan.append({"doctype": "PH Kundenkarte Antrag", "name": a, "aktion": "anonymisieren", "grund": "Kontaktdaten, Geburtstag, Nachricht, IP-Hash, Nachweis-Datei entfernen; Einwilligungs-Zeitpunkt/Textversion bleiben ohne Personenbezug", "frist_bis": None})
    if ereignisse_anzahl:
        plan.append({"doctype": "PH Kundenkarte Ereignis", "name": f"{ereignisse_anzahl} Einträge", "aktion": "anonymisieren", "grund": "Hinweistexte leeren; Protokoll (Art, Zeit, Stufe) bleibt", "frist_bis": None})
    return plan
