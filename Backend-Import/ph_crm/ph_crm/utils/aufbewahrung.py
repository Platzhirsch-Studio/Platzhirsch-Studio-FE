"""DSGVO-Löschung vs. Aufbewahrungspflicht – reine Logik ohne Frappe.

Rechtsgrundlagen (Prüfung durch Steuerberater/Datenschutz offen, s. README „Offene Punkte“):
  - Art. 17 Abs. 3 lit. b/e DSGVO: Löschung entfällt, solange eine gesetzliche Aufbewahrungspflicht besteht
    oder Daten zur Geltendmachung/Abwehr von Rechtsansprüchen nötig sind.
  - § 132 Abs. 1 BAO: Bücher, Aufzeichnungen, Belege und Geschäftspapiere 7 Jahre; die Frist läuft ab
    dem Schluss des Kalenderjahres, auf das sie sich beziehen (Beleg 2026 → aufbewahren bis 31.12.2033).
    Länger, solange sie für ein anhängiges Abgaben-/Gerichtsverfahren von Bedeutung sind (Feld `sperre`).
  - § 18 Abs. 10 UStG (Grundstücke) 22 Jahre – hier nicht relevant (kein Immobiliengeschäft im Sortiment).
  - Gewährleistung §§ 922 ff. ABGB (2 Jahre) + Verjährung 3 Jahre: Service-/Projektunterlagen werden
    mit `frist_jahre` der jeweiligen App bewertet (Hook liefert eigene frist_bis).
"""

from datetime import date, datetime

BAO_JAHRE = 7
# Buchungsrelevante Belege (BAO § 132) – Namensliste, ergänzt um is_submittable + docstatus 1 der Fremd-Apps
BUCHUNGSRELEVANT = {
    "PH Rechnung", "PH Gutschrift", "PH Anzahlungsrechnung", "PH Schlussrechnung", "PH Kassenbeleg",
    "PH Zahlung", "PH Anzahlung", "PH Eingangsrechnung", "PH Auftragsbestaetigung", "PH Bestellung",
    "PH Lieferschein", "PH Mahnung", "PH Widerruf", "PH Retoure", "PH Gutschein", "PH Gutschein Bestellung",
    "PH Kassenabschluss", "PH Stripe Auszahlung",
}
# Eigene CRM-Vorgänge ohne Aufbewahrungspflicht: löschen statt anonymisieren
CRM_LOESCHEN = {"PH Anfrage", "PH Termin", "PH Aufgabe", "PH Beratungsgespraech"}
AKTIONEN = ("anonymisieren", "aufbewahren", "loeschen")
# Nachweise der Rechenschaftspflicht (Art. 5 Abs. 2 DSGVO): 3 Jahre (Verjährung § 1489 ABGB) ab Eingang
NACHWEIS_JAHRE = {"PH Datenschutzanfrage": 3}

# Felder des PH Kontakt, die bei Aufbewahrung (Rechnungsempfänger) bleiben müssen: § 11 UStG Name/Anschrift/UID
BEHALTEN_BEI_AUFBEWAHRUNG = {"anrede", "titel_akad", "vorname", "nachname", "firma", "strasse", "plz", "ort", "land", "uid", "kontaktart", "status", "kunde_seit", "adressen"}
# Personenbezogene Felder des PH Kontakt (werden geleert bzw. ersetzt)
KONTAKT_PERSONENFELDER = {
    "anrede": None, "titel_akad": None, "vorname": None, "nachname": "Anonymisiert", "firma": None,
    "email": None, "telefon": None, "mobil": None, "strasse": None, "plz": None, "ort": None, "land": None,
    "uid": None, "geburtstag": None, "geburtstag_einwilligung": 0, "einwilligung_hinweis": None,
    "notizen": None, "portal_aktiv": 0, "portal_token_hash": None, "portal_token_erzeugt_am": None,
    "portal_letzter_login": None, "ip_hash": None, "berater": None, "funktion": None, "firma_kontakt": None,
    "wiedervorlage": None, "wiedervorlage_notiz": None, "telefon_norm": None, "utm_source": None,
    "utm_medium": None, "utm_campaign": None, "sync_quelle": None, "widerspruchshinweis_quelle": None,
}


def _datum(d):
    if isinstance(d, datetime):
        return d.date()
    if isinstance(d, date):
        return d
    s = str(d or "")[:10]
    return date.fromisoformat(s) if s else None


def frist_bis(belegdatum, jahre=BAO_JAHRE):
    """Ende der Aufbewahrungsfrist: 31.12. des (Belegjahr + jahre)."""
    d = _datum(belegdatum)
    return date(d.year + int(jahre), 12, 31) if d else None


def entscheide(doctype, belegdatum, heute, ist_submittable=False, docstatus=0, sperre=False, eigene_frist=None):
    """→ {"aktion", "grund", "frist_bis"} für einen Vorgang mit Kontaktbezug."""
    heute = _datum(heute)
    if sperre:
        return {"aktion": "aufbewahren", "grund": "Sperre: anhängiges Verfahren / Rechtsanspruch", "frist_bis": None}
    if eigene_frist:
        f = _datum(eigene_frist)
        if f and f >= heute:
            return {"aktion": "aufbewahren", "grund": "Frist der Fach-App (Gewährleistung/Vertrag)", "frist_bis": f.isoformat()}
    if doctype in NACHWEIS_JAHRE:
        f = frist_bis(belegdatum, NACHWEIS_JAHRE[doctype]) if belegdatum else None
        if f is None or f >= heute:
            return {"aktion": "aufbewahren", "grund": "Nachweis Art. 5 Abs. 2 DSGVO (3 Jahre)", "frist_bis": f.isoformat() if f else None}
        return {"aktion": "loeschen", "grund": "Nachweisfrist abgelaufen", "frist_bis": f.isoformat()}
    if doctype in BUCHUNGSRELEVANT or (ist_submittable and int(docstatus or 0) == 1):
        f = frist_bis(belegdatum) if belegdatum else None
        if f is None or f >= heute:
            return {"aktion": "aufbewahren", "grund": "§ 132 BAO: 7 Jahre ab Ende des Kalenderjahres", "frist_bis": f.isoformat() if f else None}
        return {"aktion": "loeschen", "grund": "Aufbewahrungsfrist abgelaufen", "frist_bis": f.isoformat()}
    if doctype in CRM_LOESCHEN:
        return {"aktion": "loeschen", "grund": "keine Aufbewahrungspflicht", "frist_bis": None}
    return {"aktion": "anonymisieren", "grund": "keine Aufbewahrungspflicht – Statistik bleibt ohne Personenbezug", "frist_bis": None}


def _belegzeilen(plan):
    """Aufbewahrte Zeilen, für die der Kontakt identifizierbar bleiben muss (nicht: eigene Nachweise,
    die den Namen im Titel tragen, und der Kontakt selbst)."""
    return [p for p in plan if p.get("aktion") == "aufbewahren" and p.get("doctype") not in NACHWEIS_JAHRE and p.get("doctype") != "PH Kontakt" and not p.get("ohne_kontaktbezug")]


def braucht_name(plan):
    return bool(_belegzeilen(plan))


def gesamtfrist(plan):
    """Spätestes frist_bis aller Aufbewahrungs-Zeilen (oder None)."""
    fristen = [p["frist_bis"] for p in _belegzeilen(plan) if p.get("frist_bis")]
    return max(fristen) if fristen else None


def kontakt_werte(aufbewahren):
    """Werte für PH Kontakt beim Anonymisieren. Bei laufender Aufbewahrung bleiben Rechnungsangaben."""
    if not aufbewahren:
        return dict(KONTAKT_PERSONENFELDER)
    return {k: v for k, v in KONTAKT_PERSONENFELDER.items() if k not in BEHALTEN_BEI_AUFBEWAHRUNG}


def kontakt_zeile(plan, heute):
    """Planzeile für den Kontakt selbst aus den übrigen Zeilen."""
    f = gesamtfrist(plan)
    if f or _belegzeilen(plan):
        return {"doctype": "PH Kontakt", "aktion": "anonymisieren", "grund": "teilweise: Name/Anschrift/UID bleiben für aufbewahrte Belege, Rest wird gelöscht", "frist_bis": f}
    return {"doctype": "PH Kontakt", "aktion": "anonymisieren", "grund": "vollständig (Datensatz bleibt als leere Hülle für Verknüpfungen)", "frist_bis": None}


def pruefe_plan(plan):
    """Validiert Hook-Antworten; unbekannte Aktionen → aufbewahren (sicherer Rückfall)."""
    sauber = []
    for p in plan or []:
        if not isinstance(p, dict) or not p.get("doctype") or not p.get("name"):
            continue
        q = dict(p)
        if q.get("aktion") not in AKTIONEN:
            q["aktion"] = "aufbewahren"
            q["grund"] = (q.get("grund") or "") + " (unbekannte Aktion – vorsichtshalber aufbewahren)"
        sauber.append(q)
    return sauber
