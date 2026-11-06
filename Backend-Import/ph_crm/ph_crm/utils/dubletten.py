"""Dublettenprüfung und Feldübernahme für PH Kontakt – reine Logik ohne Frappe.

Quelle: 10-konzept-crm.md §3 (Ähnliche Kontakte, A-CRM4 Zusammenführen), 30-marktfunktionen.md (CRM).
Regeln:
  - Abgleich über normalisierte E-Mail, Telefon/Mobil (E.164-ähnlich, AT-Standard +43), Name + PLZ.
  - Firma + Personen: zwei Personen derselben Firma sind KEINE Dublette (gleiche Firma zählt nur,
    wenn beide Datensätze reine Firmendatensätze ohne Personennamen sind).
  - Zusammenführen: Ziel behält seine Werte; leere Zielfelder werden aus der Quelle gefüllt;
    ausdrücklich gewählte Felder (`felder`) übernimmt das Ziel aus der Quelle. Sonderregeln für Status,
    Widerspruch (bleibt immer erhalten), Kunde-seit (früheres Datum), Notizen (angehängt).
"""

import re
import unicodedata

SCHWELLE_WAHRSCHEINLICH = 60
SCHWELLE_MOEGLICH = 30
TITEL_RE = re.compile(r"\b(dr|mag|ing|di|dipl|prof|med|bsc|msc|ba|ma|mba|arch)\b\.?", re.I)
STATUS_RANG = {"Gesperrt": 4, "Kunde": 3, "Interessent": 2, "Inaktiv": 1}
# Felder, die beim Zusammenführen nie automatisch übernommen werden (technisch/geheim/eindeutig)
NIE_UEBERNEHMEN = {"name", "naming_series", "titel", "portal_token_hash", "idempotency_key", "ip_hash", "telefon_norm"}


def _ascii(s):
    s = str(s or "").lower()
    for a, b in (("ä", "ae"), ("ö", "oe"), ("ü", "ue"), ("ß", "ss")):
        s = s.replace(a, b)
    return unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()


def norm_email(email):
    """Kleinschreibung, ohne +Zusatz im lokalen Teil (anna+shop@x.at → anna@x.at)."""
    e = str(email or "").strip().lower()
    if "@" not in e:
        return ""
    lokal, domain = e.rsplit("@", 1)
    return f"{lokal.split('+', 1)[0]}@{domain}"


def norm_telefon(nummer, vorwahl="43"):
    """'0664 12 34 567' → '+436641234567'; '0043…' → '+43…'; '+49 (0) 89 …' → '+4989…'. Zu kurz → ''."""
    s = str(nummer or "").strip()
    if not s:
        return ""
    plus = s.startswith("+")
    s = s.replace("(0)", "")
    ziffern = re.sub(r"\D", "", s)
    if plus:
        ergebnis = "+" + ziffern
    elif ziffern.startswith("00"):
        ergebnis = "+" + ziffern[2:]
    elif ziffern.startswith("0"):
        ergebnis = f"+{vorwahl}{ziffern[1:]}"
    else:
        ergebnis = f"+{vorwahl}{ziffern}"
    return ergebnis if len(ergebnis) >= 9 else ""


def norm_name(name):
    s = TITEL_RE.sub(" ", _ascii(name))
    return re.sub(r"[^a-z0-9]", "", s)


def telefone(k):
    return {t for t in (norm_telefon(k.get("telefon")), norm_telefon(k.get("mobil"))) if t}


def ist_person(k):
    return bool(norm_name(k.get("nachname")) and norm_name(k.get("nachname")) not in ("ohnenachname",))


def score(a, b):
    """Ähnlichkeit zweier Kontakte (dicts) → (punkte 0–100, gründe[])."""
    punkte, gruende = 0, []
    ea, eb = norm_email(a.get("email")), norm_email(b.get("email"))
    if ea and ea == eb:
        punkte += 60
        gruende.append("E-Mail gleich")
    if telefone(a) & telefone(b):
        punkte += 40
        gruende.append("Telefon gleich")
    na, nb = norm_name(a.get("nachname")), norm_name(b.get("nachname"))
    va, vb = norm_name(a.get("vorname")), norm_name(b.get("vorname"))
    if na and na == nb:
        pa, pb = str(a.get("plz") or "").strip(), str(b.get("plz") or "").strip()
        if pa and pa == pb:
            punkte += 30
            gruende.append("Nachname + PLZ gleich")
        if va and va == vb:
            punkte += 20
            gruende.append("Vor- und Nachname gleich")
        elif va and vb and va[0] == vb[0] and not (pa and pa == pb):
            punkte += 5
    fa, fb = norm_name(a.get("firma")), norm_name(b.get("firma"))
    if fa and fa == fb:
        if not ist_person(a) and not ist_person(b):
            punkte += 60
            gruende.append("Firmendatensatz gleich")
        elif na and na == nb:
            punkte += 10
            gruende.append("gleiche Firma")
    # Zwei verschiedene Personen derselben Firma mit gemeinsamer Zentrale (Telefon) sind keine Dublette
    if fa and fa == fb and na and nb and na != nb and "Telefon gleich" in gruende and "E-Mail gleich" not in gruende:
        punkte -= 40
        gruende.remove("Telefon gleich")
        gruende.append("Firmenzentrale (verschiedene Personen)")
    return max(0, min(100, punkte)), gruende


def einstufung(punkte):
    if punkte >= SCHWELLE_WAHRSCHEINLICH:
        return "wahrscheinlich"
    if punkte >= SCHWELLE_MOEGLICH:
        return "moeglich"
    return None


def schluessel(k):
    """Blocking-Schlüssel für die Kandidatensuche (verhindert n²-Vergleiche im Report)."""
    s = set()
    e = norm_email(k.get("email"))
    if e:
        s.add("e:" + e)
    for t in telefone(k):
        s.add("t:" + t)
    n = norm_name(k.get("nachname"))
    if n and k.get("plz"):
        s.add(f"n:{n}|{str(k.get('plz')).strip()}")
    if n and norm_name(k.get("vorname")):
        s.add(f"p:{norm_name(k.get('vorname'))}|{n}")
    f = norm_name(k.get("firma"))
    if f and not ist_person(k):
        s.add("f:" + f)
    return s


def paare(kontakte, ausgeschlossen=None):
    """Alle Kandidatenpaare (name_a, name_b, punkte, gründe) ab SCHWELLE_MOEGLICH, absteigend.
    `ausgeschlossen`: Menge frozenset({a, b}) bereits als „keine Dublette“ bestätigter Paare."""
    ausgeschlossen = ausgeschlossen or set()
    index = {}
    for k in kontakte:
        for s in schluessel(k):
            index.setdefault(s, []).append(k)
    gesehen, ergebnis = set(), []
    for gruppe in index.values():
        if len(gruppe) < 2 or len(gruppe) > 50:  # Riesengruppen (z. B. Sammelnummer) überspringen
            continue
        for i, a in enumerate(gruppe):
            for b in gruppe[i + 1:]:
                paar = frozenset((a["name"], b["name"]))
                if a["name"] == b["name"] or paar in gesehen or paar in ausgeschlossen:
                    continue
                gesehen.add(paar)
                p, g = score(a, b)
                if p >= SCHWELLE_MOEGLICH:
                    ergebnis.append((a["name"], b["name"], p, g))
    return sorted(ergebnis, key=lambda x: (-x[2], x[0], x[1]))


def leer(wert):
    return wert is None or wert == "" or wert == 0 or wert == [] or str(wert).strip() == ""


def feld_uebernahme(ziel, quelle, felder=None, datumsfelder=("kunde_seit",)):
    """Werte, die das Ziel beim Zusammenführen bekommt → dict(feld: wert).

    ziel/quelle: dicts der Stammfelder (ohne Kindtabellen). felder: Felder, die ausdrücklich aus der
    Quelle kommen sollen (Auswahl im Assistenten)."""
    felder = set(felder or ())
    neu = {}
    for feld, wert in quelle.items():
        if feld in NIE_UEBERNEHMEN or feld.startswith("_") or isinstance(wert, (list, dict)):
            continue
        if feld in ("status", "nicht_kontaktieren", "widerspruchshinweis_am", "widerspruchshinweis_quelle", "notizen", "geburtstag", "geburtstag_einwilligung", "email"):
            continue
        if feld in datumsfelder:
            a, b = ziel.get(feld), wert
            if not leer(b) and (leer(a) or str(b) < str(a)):
                neu[feld] = b
            continue
        if feld in felder and not leer(wert):
            neu[feld] = wert
        elif leer(ziel.get(feld)) and not leer(wert):
            neu[feld] = wert
    # E-Mail ist eindeutig: nur übernehmen, wenn das Ziel keine hat (Quelle wird danach gelöscht)
    if leer(ziel.get("email")) and not leer(quelle.get("email")):
        neu["email"] = quelle["email"]
    # Status: höherer Rang gewinnt (Gesperrt > Kunde > Interessent > Inaktiv)
    sz, sq = ziel.get("status") or "Interessent", quelle.get("status") or "Interessent"
    if STATUS_RANG.get(sq, 0) > STATUS_RANG.get(sz, 0):
        neu["status"] = sq
    # Widerspruch (Art. 21 DSGVO) bleibt erhalten, sobald ihn einer der beiden hat
    if quelle.get("nicht_kontaktieren") and not ziel.get("nicht_kontaktieren"):
        neu["nicht_kontaktieren"] = 1
        neu["widerspruchshinweis_am"] = quelle.get("widerspruchshinweis_am")
        neu["widerspruchshinweis_quelle"] = quelle.get("widerspruchshinweis_quelle")
    # Geburtstag nur zusammen mit der Einwilligung
    if leer(ziel.get("geburtstag")) and quelle.get("geburtstag") and quelle.get("geburtstag_einwilligung"):
        neu["geburtstag"] = quelle["geburtstag"]
        neu["geburtstag_einwilligung"] = 1
    if not leer(quelle.get("notizen")) and quelle.get("notizen") != ziel.get("notizen"):
        neu["notizen"] = ((ziel.get("notizen") or "") + "\n<hr>\n" + quelle["notizen"]).strip()
    return neu
