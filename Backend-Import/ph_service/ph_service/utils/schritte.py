"""„Nächster Schritt“ je Servicefall (Konzept 10-konzept-service.md §3.4, Aggregat §12 Priorität 2) – reine Logik.

Eingabe: flaches dict mit Feldern des Falls plus Zählern aus Kindtabellen/Einsätzen
(ersatzteile_offen, ersatzteile_eingetroffen, einsaetze_offen, regress_offen). Ausgabe: dict(schritt, aktion, faellig, rang),
rang = sortierbar (kleiner = dringender).
"""

from datetime import date


def _d(wert):
    if not wert:
        return None
    if isinstance(wert, date):
        return wert if not hasattr(wert, "date") else wert.date()
    return date.fromisoformat(str(wert)[:10])


def naechster_schritt(fall, heute=None):
    heute = _d(heute) or date.today()
    st = fall.get("status")
    faellig = None
    if st == "Gemeldet" and not fall.get("erstreaktion_am"):
        schritt, aktion, faellig = "Kunde kontaktieren (Erstreaktion)", "erstreaktion_erfassen", _d(fall.get("frist_reaktion"))
    elif st == "Gemeldet":
        schritt, aktion = ("Fehlercode zuordnen und prüfen", "pruefen") if not fall.get("fehlercode") else ("Prüfung abschließen", "pruefen")
    elif st == "Geprueft":
        schritt, aktion = "Entscheidung treffen", "entscheiden"
    elif st == "Entscheidung" and fall.get("kulanz_freigabe_status") == "Angefordert":
        schritt, aktion = "Kulanz-Freigabe der Leitung abwarten", "kulanz_freigeben"
    elif st in ("Entscheidung", "In Bearbeitung") and int(fall.get("ersatzteile_benoetigt") or 0):
        schritt, aktion = "Ersatzteile bestellen", "ersatzteile_bestellen"
    elif st in ("Entscheidung", "In Bearbeitung") and int(fall.get("ersatzteile_offen") or 0):
        schritt, aktion, faellig = "Ersatzteile erwartet", "ersatzteile_verfolgen", _d(fall.get("ersatzteile_erwartet_am"))
    elif st in ("Entscheidung", "In Bearbeitung") and not int(fall.get("einsaetze_offen") or 0) and fall.get("entscheidung") in ("Verbesserung", "Austausch"):
        schritt, aktion = "Einsatz planen", "einsatz_anlegen"
    elif st == "Einsatz geplant":
        schritt, aktion, faellig = "Einsatz durchführen", "einsatz", _d(fall.get("naechster_einsatz"))
    elif st == "In Bearbeitung":
        schritt, aktion = "Abschlussbericht und Erledigt melden", "erledigt_melden"
    elif st == "Erledigt" and fall.get("lieferantenrelevant") and not int(fall.get("regress_vorhanden") or 0):
        schritt, aktion, faellig = "Lieferant informieren (Regress)", "lieferant_informieren", _d(fall.get("regress_frist_bis"))
    elif st == "Erledigt" and not (fall.get("kunde_informiert_am") or fall.get("abnahme_bestaetigt")):
        schritt, aktion = "Kunde informieren, dann schließen", "kunde_informieren"
    elif st == "Erledigt":
        schritt, aktion = "Schließen", "schliessen"
    else:
        schritt, aktion = "–", None
    if faellig is None and st not in ("Erledigt", "Geschlossen", "Abgelehnt"):
        faellig = _d(fall.get("frist_loesung"))
    if aktion is None:
        rang = 99999
    elif faellig is None:
        rang = 5000
    else:
        rang = (faellig - heute).days + 1000
    return {"schritt": schritt, "aktion": aktion, "faellig": faellig.isoformat() if faellig else None, "rang": rang}
