"""CAMT.053-Parser (ISO 20022 BankToCustomerStatement) und Zuordnungsvorschlag.

Unterstützt camt.053.001.02 … .08 (Namespace wird erkannt). Je Eintrag (Ntry) wird ein Umsatz
erzeugt; bei mehreren Transaktionen in einem Eintrag (Batch) je TxDtls ein Umsatz.

Zuordnungsvorschlag (Reihenfolge, Trefferqualität):
  100  Zahlungsreferenz/Rechnungsnummer (RE-2026-00012) im Verwendungszweck oder End-to-End
   80  Betrag exakt = offener Betrag genau einer Rechnung desselben Kunden (Name ähnlich)
   60  Betrag exakt = offener Betrag genau einer offenen Rechnung
   40  Name ähnlich und Betrag ≤ offen (Teilzahlung)
"""

import hashlib
import re
import xml.etree.ElementTree as ET
from decimal import Decimal

NUMMER_RE = re.compile(r"\b(RE|GU|AB|AN|ER)[-\s]?(\d{4})[-\s]?(\d{4,6})\b", re.I)


def _lokal(tag):
    return tag.split("}", 1)[-1] if "}" in tag else tag


def _find(el, pfad):
    """Namespace-freies find über lokale Namen (Pfad mit '/')."""
    teile = pfad.split("/")
    akt = [el]
    for t in teile:
        naechste = []
        for a in akt:
            naechste.extend(ch for ch in a if _lokal(ch.tag) == t)
        akt = naechste
        if not akt:
            return None
    return akt[0]


def _findall(el, pfad):
    teile = pfad.split("/")
    akt = [el]
    for t in teile:
        naechste = []
        for a in akt:
            naechste.extend(ch for ch in a if _lokal(ch.tag) == t)
        akt = naechste
    return akt


def _text(el, pfad, default=""):
    f = _find(el, pfad)
    return (f.text or "").strip() if f is not None and f.text else default


def betrag_cent(text, cdtdbt):
    wert = Decimal(str(text or "0").replace(",", "."))
    cent = int((wert * 100).quantize(Decimal("1")))
    return -cent if cdtdbt == "DBIT" else cent


def parse(xml_text):
    """→ {iban, waehrung, von, bis, saldo_start_cent, saldo_ende_cent, umsaetze: [dict]}"""
    root = ET.fromstring(xml_text)
    stmts = _findall(root, "BkToCstmrStmt/Stmt")
    if not stmts:
        raise ValueError("Keine CAMT.053-Kontoauszüge (Stmt) gefunden.")
    ergebnis = {"iban": "", "waehrung": "EUR", "von": None, "bis": None, "saldo_start_cent": None, "saldo_ende_cent": None, "umsaetze": []}
    for stmt in stmts:
        ergebnis["iban"] = ergebnis["iban"] or _text(stmt, "Acct/Id/IBAN")
        ergebnis["waehrung"] = _text(stmt, "Acct/Ccy") or ergebnis["waehrung"]
        von = _text(stmt, "FrToDt/FrDtTm")[:10]
        bis = _text(stmt, "FrToDt/ToDtTm")[:10]
        ergebnis["von"] = min(filter(None, [ergebnis["von"], von])) if (ergebnis["von"] or von) else None
        ergebnis["bis"] = max(filter(None, [ergebnis["bis"], bis])) if (ergebnis["bis"] or bis) else None
        for bal in _findall(stmt, "Bal"):
            code = _text(bal, "Tp/CdOrPrtry/Cd")
            amt = _find(bal, "Amt")
            if amt is None:
                continue
            cent = betrag_cent(amt.text, _text(bal, "CdtDbtInd"))
            if code == "OPBD" and ergebnis["saldo_start_cent"] is None:
                ergebnis["saldo_start_cent"] = cent
            elif code == "CLBD":
                ergebnis["saldo_ende_cent"] = cent
        for ntry in _findall(stmt, "Ntry"):
            ergebnis["umsaetze"].extend(_eintrag(ntry, ergebnis["iban"]))
    if not ergebnis["von"] and ergebnis["umsaetze"]:
        daten = sorted(u["buchungsdatum"] for u in ergebnis["umsaetze"] if u["buchungsdatum"])
        if daten:
            ergebnis["von"], ergebnis["bis"] = daten[0], daten[-1]
    return ergebnis


def _eintrag(ntry, iban):
    amt = _find(ntry, "Amt")
    cdtdbt = _text(ntry, "CdtDbtInd")
    buchung = _text(ntry, "BookgDt/Dt") or _text(ntry, "BookgDt/DtTm")[:10]
    valuta = _text(ntry, "ValDt/Dt") or _text(ntry, "ValDt/DtTm")[:10] or buchung
    acct_ref = _text(ntry, "AcctSvcrRef")
    bank_ref = _text(ntry, "NtryRef")
    txs = _findall(ntry, "NtryDtls/TxDtls")
    basis = {"buchungsdatum": buchung, "valuta": valuta, "waehrung": (amt.get("Ccy") if amt is not None else "EUR") or "EUR", "bank_referenz": bank_ref}
    if not txs:
        cent = betrag_cent(amt.text if amt is not None else "0", cdtdbt)
        u = {**basis, "betrag_cent": cent, "auftraggeber": "", "iban_gegen": "", "bic_gegen": "", "verwendungszweck": _text(ntry, "AddtlNtryInf"), "end_to_end_id": "", "mandatsreferenz": ""}
        u["camt_ref"] = acct_ref or _hash(iban, u)
        return [u]
    liste = []
    for i, tx in enumerate(txs):
        tx_amt = _find(tx, "Amt") or _find(tx, "AmtDtls/TxAmt/Amt")
        tx_cd = _text(tx, "CdtDbtInd") or cdtdbt
        cent = betrag_cent(tx_amt.text if tx_amt is not None else (amt.text if amt is not None else "0"), tx_cd)
        eingang = cent > 0
        partei = "Dbtr" if eingang else "Cdtr"
        name = _text(tx, f"RltdPties/{partei}/Nm") or _text(tx, f"RltdPties/{partei}/Pty/Nm")
        iban_gegen = _text(tx, f"RltdPties/{'DbtrAcct' if eingang else 'CdtrAcct'}/Id/IBAN")
        bic_gegen = _text(tx, f"RltdAgts/{'DbtrAgt' if eingang else 'CdtrAgt'}/FinInstnId/BIC") or _text(tx, f"RltdAgts/{'DbtrAgt' if eingang else 'CdtrAgt'}/FinInstnId/BICFI")
        zweck_teile = [u.text.strip() for u in _findall(tx, "RmtInf/Ustrd") if u.text]
        strukturiert = _text(tx, "RmtInf/Strd/CdtrRefInf/Ref")
        if strukturiert:
            zweck_teile.append(strukturiert)
        zweck = " ".join(zweck_teile) or _text(ntry, "AddtlNtryInf")
        u = {
            **basis,
            "betrag_cent": cent,
            "auftraggeber": name,
            "iban_gegen": iban_gegen,
            "bic_gegen": bic_gegen,
            "verwendungszweck": zweck,
            "end_to_end_id": _text(tx, "Refs/EndToEndId"),
            "mandatsreferenz": _text(tx, "Refs/MndtId"),
        }
        tx_ref = _text(tx, "Refs/TxId") or _text(tx, "Refs/AcctSvcrRef")
        u["camt_ref"] = tx_ref or (f"{acct_ref}-{i + 1}" if acct_ref and len(txs) > 1 else acct_ref) or _hash(iban, u)
        liste.append(u)
    return liste


def _hash(iban, u):
    roh = "|".join(str(u.get(k) or "") for k in ("buchungsdatum", "betrag_cent", "auftraggeber", "verwendungszweck", "end_to_end_id"))
    return "H" + hashlib.sha256(f"{iban}|{roh}".encode()).hexdigest()[:24]


# ── Zuordnungsvorschlag ──────────────────────────────────────────────────────

def nummern_im_text(text):
    """Belegnummern (RE-2026-00012 u. ä.) in einem Text, normalisiert mit Bindestrichen."""
    treffer = []
    for m in NUMMER_RE.finditer(str(text or "")):
        treffer.append(f"{m.group(1).upper()}-{m.group(2)}-{m.group(3).zfill(5)}")
    return treffer


def _norm(s):
    return re.sub(r"[^a-z0-9]", "", str(s or "").lower())


def name_aehnlich(a, b):
    na, nb = _norm(a), _norm(b)
    if not na or not nb:
        return False
    if na in nb or nb in na:
        return True
    teile = [t for t in re.split(r"\s+", str(a or "").lower()) if len(t) > 2]
    return any(_norm(t) in nb for t in teile)


def vorschlag(umsatz, offene_belege):
    """umsatz: dict (betrag_cent, verwendungszweck, auftraggeber, end_to_end_id).
    offene_belege: [{doctype, name, nummer, kunde_name, offen_cent}] (Eingang: Rechnungen; Ausgang: Eingangsrechnungen).
    → {doctype, name, grund, sicherheit} oder None."""
    betrag = abs(int(umsatz.get("betrag_cent") or 0))
    text = f"{umsatz.get('verwendungszweck') or ''} {umsatz.get('end_to_end_id') or ''}"
    nummern = set(nummern_im_text(text))
    for b in offene_belege:
        if b.get("nummer") in nummern or b.get("name") in nummern or (b.get("zahlungsreferenz") and _norm(b["zahlungsreferenz"]) in _norm(text)):
            return {"doctype": b["doctype"], "name": b["name"], "grund": "Zahlungsreferenz im Verwendungszweck", "sicherheit": 100}
    exakt = [b for b in offene_belege if int(b.get("offen_cent") or 0) == betrag and betrag > 0]
    if exakt:
        mit_name = [b for b in exakt if name_aehnlich(b.get("kunde_name"), umsatz.get("auftraggeber"))]
        if len(mit_name) == 1:
            return {"doctype": mit_name[0]["doctype"], "name": mit_name[0]["name"], "grund": "Betrag und Name", "sicherheit": 80}
        if len(exakt) == 1:
            return {"doctype": exakt[0]["doctype"], "name": exakt[0]["name"], "grund": "Betrag exakt", "sicherheit": 60}
    teil = [b for b in offene_belege if name_aehnlich(b.get("kunde_name"), umsatz.get("auftraggeber")) and 0 < betrag <= int(b.get("offen_cent") or 0)]
    if len(teil) == 1:
        return {"doctype": teil[0]["doctype"], "name": teil[0]["name"], "grund": "Name, Teilbetrag", "sicherheit": 40}
    return None
