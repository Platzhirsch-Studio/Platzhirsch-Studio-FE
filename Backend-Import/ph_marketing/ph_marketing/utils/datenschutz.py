"""DSGVO-Regeln des Marketings ohne Frappe: Zusammenführen von Kontakten, Löschplan (Art. 17) mit Ausnahmen.

Einwilligungen gehören zur E-Mail-Adresse, nicht zum Kontakt: beim Zusammenführen wird nie eine Einwilligung von
einer Adresse auf eine andere übertragen. Widerruf hat Vorrang: liegt beim alten Kontakt ein Widerruf vor, der
jünger ist als die Bestätigung beim neuen, wird die neue Einwilligung desselben Zwecks ebenfalls widerrufen.

Löschen (Art. 17): Personendaten weg, ausgenommen
  - Einwilligungs-/Widerrufsnachweis (Art. 7 Abs. 1 DSGVO; Strafbarkeitsverjährung § 174 TKG iVm § 31 VStG
    3 Jahre) → aufbewahren, minimiert, Frist 3 Jahre ab letztem Ereignis.
  - Empfehlungen mit ausgegebenem Gutschein (Buchungsbezug, § 132 BAO 7 Jahre) → aufbewahren bis Jahresende + 7.
  - Kampagnen-Kontaktpunkte, Versandprotokolle, Event-Anmeldungen → anonymisieren (Zahlen bleiben, Person nicht).
"""

from __future__ import annotations

from datetime import date, datetime

NACHWEIS_JAHRE = 3
BAO_JAHRE = 7
ANONYM_EMAIL = "geloescht@platzhirsch.invalid"
ANONYM_NAME = "gelöscht"


def _dt(x):
    if not x:
        return None
    if isinstance(x, datetime):
        return x
    if isinstance(x, date):
        return datetime(x.year, x.month, x.day)
    return datetime.fromisoformat(str(x).replace("Z", "")[:19])


# A14 (32-marktfunktionen-nachtrag.md): Löschfrist je Datenkategorie, gleichlautend im Verarbeitungsverzeichnis.
# kategorie: (doctype, frist_tage, aktion, bezugsfeld, grundlage). Gesetzliche Aufbewahrung (A13, § 132 BAO) geht vor.
LOESCHFRISTEN = {
    "newsletter_unbestaetigt": ("PH Newsletter Abo", 30, "loeschen", "angemeldet_am", "DOI nicht bestätigt – keine Einwilligung (Art. 5 Abs. 1 lit. e)"),
    "newsletter_beendet": ("PH Newsletter Abo", 3 * 365, "loeschen", "abgemeldet_am", "Sperrvermerk gegen erneuten Versand, danach Löschung (Art. 17)"),
    "einwilligung_widerrufen": ("PH Einwilligung", 3 * 365, "loeschen", "widerrufen_am", "Nachweis Art. 7 Abs. 1 DSGVO / § 174 TKG iVm § 31 VStG"),
    "einwilligung_offen": ("PH Einwilligung", 30, "abgelaufen", "zeitpunkt", "nie bestätigt"),
    "event_anmeldung": ("PH Event", 90, "anonymisieren", "datum", "Teilnahme abgewickelt (Art. 6 Abs. 1 lit. b)"),
    "newsletter_versand": ("PH Newsletter Versand", 2 * 365, "anonymisieren", "gesendet_am", "Zustellnachweis, danach nur Statistik"),
    "reise_versand": ("PH Reise Versand", 2 * 365, "anonymisieren", "gesendet_am", "Doppelversand-/Frequenzschutz, danach nur Statistik"),
    "kampagne_kontaktpunkt": ("PH Kampagne Kontaktpunkt", 25 * 30, "anonymisieren", "zeit", "Attribution 180 Tage + Jahresvergleich"),
    "mail_ereignis": ("PH Mail Ereignis", 180, "loeschen", "empfangen_am", "technisches Zustellprotokoll"),
    "empfehlung_ohne_gutschein": ("PH Empfehlung", 3 * 365, "loeschen", "creation", "Programm abgewickelt; mit Gutschein § 132 BAO 7 Jahre"),
    # Website src/lib/ideenboard/config.js RETENTION_MONTHS = 12 (nach der letzten Änderung); Lauf über expiresAt
    "ideenboard": ("PH Ideenboard", 365, "loeschen", "aktualisiert_am", "Geteiltes Ideenboard ohne Personendaten, 12 Monate nach der letzten Änderung (Art. 5 Abs. 1 lit. e)"),
    # Direkte Rückmeldung ohne Veröffentlichung: nach 2 Jahren ohne Person (Text/Sterne bleiben für die Statistik)
    "bewertung_direkt": ("PH Bewertung", 2 * 365, "anonymisieren", "eingang", "Rückmeldung bearbeitet (Art. 6 Abs. 1 lit. f), danach ohne Personenbezug"),
}


def einwilligungen_abgleichen(alt, neu):
    """alt/neu: [dict(name, zweck, status, doi_bestaetigt_am, widerrufen_am)].
    → [(name, 'widerrufen', grund)]. Nie Bestätigung oder Übertrag."""
    widerrufe = {}
    for e in alt:
        if e.get("status") == "Widerrufen" and e.get("widerrufen_am"):
            t = _dt(e["widerrufen_am"])
            if e["zweck"] not in widerrufe or t > widerrufe[e["zweck"]]:
                widerrufe[e["zweck"]] = t
    aktionen = []
    for e in neu:
        if e.get("status") not in ("Bestaetigt", "Offen"):
            continue
        w = widerrufe.get(e["zweck"])
        if w and (not e.get("doi_bestaetigt_am") or w > _dt(e["doi_bestaetigt_am"])):
            aktionen.append((e["name"], "widerrufen", "Zusammenführung: jüngerer Widerruf beim zusammengeführten Kontakt"))
    return aktionen


def _plus_jahre(d, jahre):
    d = _dt(d) or datetime.now()
    try:
        return d.replace(year=d.year + jahre).date()
    except ValueError:  # 29.02.
        return d.replace(year=d.year + jahre, day=28).date()


def plan_einwilligung(e):
    """→ dict(aktion, grund, frist_bis)."""
    if e.get("status") in ("Offen", "Abgelaufen"):
        return {"aktion": "loeschen", "grund": "nie wirksam geworden – kein Nachweisbedarf", "frist_bis": None}
    letzt = e.get("widerrufen_am") or e.get("doi_bestaetigt_am") or e.get("zeitpunkt")
    return {
        "aktion": "aufbewahren",
        "grund": "Nachweis Einwilligung/Widerruf (Art. 7 Abs. 1 DSGVO, § 174 TKG); minimiert und widerrufen",
        "frist_bis": _plus_jahre(letzt, NACHWEIS_JAHRE).isoformat(),
    }


def plan_empfehlung(e):
    if e.get("gutschein_ausgegeben_am"):
        d = _dt(e["gutschein_ausgegeben_am"])
        return {"aktion": "aufbewahren", "grund": "Gutschein ausgegeben – Buchungsbezug (§ 132 BAO 7 Jahre)", "frist_bis": date(d.year + BAO_JAHRE, 12, 31).isoformat()}
    return {"aktion": "loeschen", "grund": "kein Buchungsbezug", "frist_bis": None}


def frist_abgelaufen(frist_bis, heute=None):
    if not frist_bis:
        return True
    heute = heute or date.today()
    return date.fromisoformat(str(frist_bis)[:10]) < heute
