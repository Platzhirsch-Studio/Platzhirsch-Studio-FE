"""Mail-Zuordnung (ohne Frappe): Adressen, Massenmail-Filter, Entscheidung automatisch/manuell, Vorgangsnummern.

Verbindliche Regeln des Inhabers (04.11.2026, Präzisierung zu Entscheidung Nr. 52):
  1. Automatisch nur, wenn die Gegenadresse(n) eindeutig einem bestehenden PH Kontakt / Lieferanten gehören
     (Haupt-E-Mail oder weitere hinterlegte Adressen = PH Mail Adresse „Zuordnung“).
  2. Alles andere bleibt in Outlook – kein Speichern (keine Kopie, kein Betreff). Höchstens eine flüchtige
     Liste „nicht zugeordnet“ (live per Graph).
  3. Manuelle Zuordnung durch den Postfach-Benutzer; „Adresse merken“, „neuer Kontakt“, „nie zuordnen“ (Sperre).
  4. Sensitivity private/confidential → nie automatisch, nur manuell.
  5. Mehrdeutige Adresse (mehrere Kontakte) → nicht automatisch, Zuordnungsliste mit Vorschlägen.
Zusätzlich: interne Mails (nur eigene Domains/Postfächer) und Newsletter/Automaten-Mails werden ignoriert.
"""

import re

AUTO = "automatisch"
MANUELL = "manuell"
IGNORIEREN = "ignorieren"

VERTRAULICH = {"private", "confidential"}
AUTOMATEN_LOKALTEILE = re.compile(
    r"^(no-?reply|do-?not-?reply|donotreply|noreply[-.].*|mailer-daemon|postmaster|bounce[s]?([-+.].*)?|newsletter|news|marketing|notifications?|benachrichtigung(en)?|info-?mail)$"
)
ADRESSE_RE = re.compile(r"^[^@\s<>\"]+@[^@\s<>\"]+\.[^@\s<>\"]+$")


def normalisiere(adresse):
    """'Max <MAX@Beispiel.AT>' / 'mailto:max@…' → 'max@beispiel.at'; ungültig → ''."""
    s = str(adresse or "").strip()
    m = re.search(r"<([^>]+)>", s)
    if m:
        s = m.group(1)
    s = s.strip().strip("<>").strip()
    if s.lower().startswith("mailto:"):
        s = s[7:]
    s = s.split("?")[0].strip().lower()
    return s if ADRESSE_RE.match(s) else ""


def domain(adresse):
    a = normalisiere(adresse)
    return a.rsplit("@", 1)[1] if a else ""


def domains_liste(text):
    """'platzhirsch.studio, @mw-immo.at' → {'platzhirsch.studio', 'mw-immo.at'}."""
    return {d.strip().lstrip("@").lower() for d in re.split(r"[\s,;]+", str(text or "")) if d.strip().lstrip("@")}


def ist_intern(adresse, interne_domains, eigene_adressen=()):
    a = normalisiere(adresse)
    if not a:
        return True  # unbrauchbare Adresse nie zuordnen
    d = a.rsplit("@", 1)[1]
    return a in {normalisiere(x) for x in eigene_adressen} or any(d == i or d.endswith("." + i) for i in interne_domains)


def kopfzeilen_dict(liste):
    """Graph internetMessageHeaders [{name, value}] → {name_klein: value}."""
    aus = {}
    for h in liste or []:
        if isinstance(h, dict) and h.get("name"):
            aus[str(h["name"]).strip().lower()] = str(h.get("value") or "")
    return aus


def ist_massenmail(kopfzeilen=None, absender=None, absender_bekannt=False):
    """Newsletter, Verteiler, Abwesenheitsnotizen, Bounces. Lokalteil-Regel nur für unbekannte Absender
    (eine bekannte no-reply-Adresse eines Lieferanten, z. B. AB-System, bleibt zuordenbar)."""
    k = {str(a).lower(): str(b).lower() for a, b in (kopfzeilen or {}).items()}
    if k.get("list-unsubscribe") or k.get("list-id") or k.get("list-post"):
        return True
    if k.get("precedence", "").strip() in ("bulk", "list", "junk"):
        return True
    if k.get("auto-submitted", "no").strip() not in ("", "no"):
        return True
    if k.get("x-autoreply") or k.get("x-autorespond"):
        return True
    a = normalisiere(absender)
    if a and not absender_bekannt and AUTOMATEN_LOKALTEILE.match(a.split("@", 1)[0]):
        return True
    return False


def gegenadressen(mail):
    """Externe Seite einer Mail: Eingang → Absender, Ausgang → An + Cc."""
    if mail.get("richtung") == "ausgang":
        roh = list(mail.get("an") or []) + list(mail.get("cc") or [])
    else:
        roh = [mail.get("absender")]
    aus = []
    for r in roh:
        a = normalisiere(r)
        if a and a not in aus:
            aus.append(a)
    return aus


def entscheiden(mail, treffer, interne_domains=(), eigene_adressen=(), gesperrt=()):
    """mail: {richtung, absender, an, cc, sensitivity, kopfzeilen?}; treffer(adresse) → [(doctype, name), …].
    → {"aktion": automatisch|manuell|ignorieren, "kontakte": [(dt, name)], "vorschlaege": [(dt, name)],
       "grund": str, "adressen": [externe Adressen]}"""
    gesperrt = {normalisiere(g) for g in gesperrt}
    alle = gegenadressen(mail)
    extern = [a for a in alle if not ist_intern(a, interne_domains, eigene_adressen)]
    ergebnis = {"aktion": IGNORIEREN, "kontakte": [], "vorschlaege": [], "grund": "", "adressen": extern}
    if not extern:
        ergebnis["grund"] = "intern"
        return ergebnis
    offen = [a for a in extern if a not in gesperrt]
    if not offen:
        ergebnis["grund"] = "gesperrt"
        return ergebnis
    je_adresse = {a: _eindeutig(treffer(a)) for a in offen}
    bekannt = any(je_adresse.values())
    if ist_massenmail(mail.get("kopfzeilen"), mail.get("absender"), absender_bekannt=bool(je_adresse.get(normalisiere(mail.get("absender"))))):
        ergebnis["grund"] = "massenmail"
        return ergebnis
    vorschlaege = _eindeutig([t for a in offen for t in je_adresse[a]])
    ergebnis["vorschlaege"] = vorschlaege
    if str(mail.get("sensitivity") or "").lower() in VERTRAULICH:
        ergebnis.update(aktion=MANUELL, grund="vertraulich")
        return ergebnis
    if any(len(t) > 1 for t in je_adresse.values()):
        ergebnis.update(aktion=MANUELL, grund="mehrdeutig")
        return ergebnis
    if not bekannt:
        ergebnis.update(aktion=MANUELL, grund="unbekannt")
        return ergebnis
    ergebnis.update(aktion=AUTO, kontakte=vorschlaege, grund="eindeutig")
    return ergebnis


def _eindeutig(liste):
    aus = []
    for x in liste or []:
        x = tuple(x)
        if x not in aus:
            aus.append(x)
    return aus


# ── Vorgangsnummern ────────────────────────────────────────────────────────────────────────────
# DocTypes, deren Nummer im Betreff/Text erkannt wird (Muster aus ph_core NUMMERNKREISE).
REFERENZ_DOCTYPES = (
    "PH Anfrage", "PH Projekt", "PH Servicefall", "PH Termin", "PH Angebot", "PH Auftragsbestaetigung",
    "PH Rechnung", "PH Montageauftrag", "PH Serviceeinsatz", "PH Bestellung", "PH Herstellerbestellung",
    "PH Lieferschein", "PH Gutschrift", "PH Mahnung", "PH Nachtrag", "PH Ersatzteilbestellung",
)
_TOKEN = {"YYYY": r"\d{4}", "YY": r"\d{2}", "MM": r"\d{2}", "DD": r"\d{2}"}


def serie_zu_regex(serie):
    """'PH-ANF-.YYYY.-.#####' → r'PH-ANF-\\d{4}-\\d{5}' (Frappe naming_series-Syntax)."""
    teile = []
    for t in str(serie or "").split("."):
        if not t:
            continue
        if t in _TOKEN:
            teile.append(_TOKEN[t])
        elif set(t) == {"#"}:
            teile.append(r"\d{%d}" % len(t))
        else:
            teile.append(re.escape(t))
    return "".join(teile)


def referenz_muster(serien, doctypes=REFERENZ_DOCTYPES):
    """{doctype: serie} → [(doctype, compiled)] – längste Muster zuerst, mit Wortgrenzen."""
    muster = []
    for dt in doctypes:
        s = serien.get(dt)
        if s and "#" in s:
            muster.append((dt, re.compile(r"(?<![A-Za-z0-9-])(" + serie_zu_regex(s) + r")(?![0-9])", re.I)))
    return sorted(muster, key=lambda m: -len(m[1].pattern))


def referenzen_erkennen(text, muster):
    """→ [(doctype, nummer)] in Reihenfolge des Auftretens, ohne Doppelte."""
    text = str(text or "")[:20000]
    funde = []
    belegt = []
    for dt, rx in muster:
        for m in rx.finditer(text):
            if any(m.start() < e and s < m.end() for s, e in belegt):
                continue
            belegt.append((m.start(), m.end()))
            funde.append((m.start(), dt, m.group(1).upper()))
    aus = []
    for _, dt, nr in sorted(funde):
        if (dt, nr) not in aus:
            aus.append((dt, nr))
    return aus


# ── Graph-Nachricht → einfache Form ───────────────────────────────────────────────────────────
def _adr(obj):
    return normalisiere(((obj or {}).get("emailAddress") or {}).get("address"))


def graph_mail(msg, postfach_adresse, ordner=None):
    """Graph message → {id, internet_id, richtung, absender, absender_name, an, cc, betreff, datum, sensitivity, kopfzeilen, anhaenge}."""
    absender = _adr(msg.get("from")) or _adr(msg.get("sender"))
    pf = normalisiere(postfach_adresse)
    ausgang = (ordner or "").lower() in ("sentitems", "gesendete elemente") or (absender and absender == pf)
    return {
        "id": msg.get("id"),
        "internet_id": msg.get("internetMessageId"),
        "richtung": "ausgang" if ausgang else "eingang",
        "absender": absender,
        "absender_name": (((msg.get("from") or {}).get("emailAddress") or {}).get("name") or "")[:140],
        "an": [a for a in (_adr(x) for x in msg.get("toRecipients") or []) if a],
        "cc": [a for a in (_adr(x) for x in msg.get("ccRecipients") or []) if a],
        "betreff": str(msg.get("subject") or "")[:500],
        "datum": msg.get("sentDateTime") if ausgang else (msg.get("receivedDateTime") or msg.get("sentDateTime")),
        "sensitivity": str(msg.get("sensitivity") or "normal").lower(),
        "kopfzeilen": kopfzeilen_dict(msg.get("internetMessageHeaders")),
        "anhaenge": bool(msg.get("hasAttachments")),
        "entwurf": bool(msg.get("isDraft")),
    }


def name_teilen(anzeigename, adresse=""):
    """'Muster, Max' / 'Max Muster' → (vorname, nachname); leer → aus dem Lokalteil."""
    n = re.sub(r"[\"'()]", "", str(anzeigename or "")).strip()
    if not n or "@" in n:
        lokal = normalisiere(adresse).split("@")[0] if normalisiere(adresse) else ""
        teile = [t.capitalize() for t in re.split(r"[._-]+", lokal) if t]
        return (teile[0] if len(teile) > 1 else "", teile[-1] if teile else "")
    if "," in n:
        nach, vor = [t.strip() for t in n.split(",", 1)]
        return vor, nach
    teile = n.split()
    return (" ".join(teile[:-1]), teile[-1]) if len(teile) > 1 else ("", teile[0])
