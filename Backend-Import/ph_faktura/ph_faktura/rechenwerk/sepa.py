"""SEPA-Überweisungsdatei pain.001.001.03 (Zahllauf Eingangsrechnungen) und IBAN-Prüfung – ohne Frappe.

Österreichische Banken (ELBA, George Business, Raiffeisen/BusinessLine) nehmen pain.001.001.03 an; die Datei
wird im Banking hochgeladen und dort freigegeben – ph_faktura überweist nie selbst (keine Bankverbindung).
"""

from __future__ import annotations

import re
from datetime import date, datetime
from decimal import Decimal
from xml.sax.saxutils import escape

NS = "urn:iso:std:iso:20022:tech:xsd:pain.001.001.03"
# SEPA-Zeichensatz (EPC-Empfehlung): Buchstaben, Ziffern, / - ? : ( ) . , ' + Leerzeichen
_ERLAUBT = re.compile(r"[^A-Za-z0-9/\-?:().,'+ ]")
_UMLAUTE = str.maketrans({"ä": "ae", "ö": "oe", "ü": "ue", "Ä": "Ae", "Ö": "Oe", "Ü": "Ue", "ß": "ss", "&": "+"})


class SepaFehler(ValueError):
    pass


def iban_normal(iban: str) -> str:
    return re.sub(r"\s+", "", str(iban or "")).upper()


def iban_gueltig(iban: str) -> bool:
    """Prüfziffer nach ISO 13616 (Modulo 97)."""
    i = iban_normal(iban)
    if not re.fullmatch(r"[A-Z]{2}[0-9]{2}[A-Z0-9]{10,30}", i):
        return False
    umgestellt = i[4:] + i[:4]
    zahl = "".join(str(int(c, 36)) for c in umgestellt)
    return int(zahl) % 97 == 1


def sepa_text(text: str, laenge: int = 140) -> str:
    t = str(text or "").translate(_UMLAUTE)
    return _ERLAUBT.sub(" ", t).strip()[:laenge]


def _betrag(cent) -> str:
    return f"{Decimal(int(cent)) / Decimal(100):.2f}"


def pain001(auftraggeber: dict, zahlungen: list[dict], ausfuehrung: date, nachricht_id: str, erstellt: datetime | None = None) -> str:
    """auftraggeber: {name, iban, bic}; zahlungen: [{empfaenger, iban, bic?, betrag_cent, verwendungszweck, end_to_end_id}]."""
    if not zahlungen:
        raise SepaFehler("Keine Zahlungen im Zahllauf.")
    if not iban_gueltig(auftraggeber.get("iban")):
        raise SepaFehler("IBAN des Auftraggebers ist ungültig.")
    fehler = []
    for z in zahlungen:
        if not iban_gueltig(z.get("iban")):
            fehler.append(f"{z.get('empfaenger')}: IBAN ungültig")
        if int(z.get("betrag_cent") or 0) <= 0:
            fehler.append(f"{z.get('empfaenger')}: Betrag ≤ 0")
        if not (z.get("empfaenger") or "").strip():
            fehler.append("Empfängername fehlt")
    if fehler:
        raise SepaFehler("; ".join(fehler))
    erstellt = erstellt or datetime.now()
    summe = sum(int(z["betrag_cent"]) for z in zahlungen)
    n = len(zahlungen)
    msg = sepa_text(nachricht_id, 35)
    tx = []
    for z in zahlungen:
        bic = (z.get("bic") or "").replace(" ", "").upper()
        tx.append(
            "<CdtTrfTxInf>"
            f"<PmtId><EndToEndId>{escape(sepa_text(z.get('end_to_end_id') or 'NOTPROVIDED', 35))}</EndToEndId></PmtId>"
            f"<Amt><InstdAmt Ccy=\"EUR\">{_betrag(z['betrag_cent'])}</InstdAmt></Amt>"
            + (f"<CdtrAgt><FinInstnId><BIC>{escape(bic)}</BIC></FinInstnId></CdtrAgt>" if bic else "")
            + f"<Cdtr><Nm>{escape(sepa_text(z['empfaenger'], 70))}</Nm></Cdtr>"
            f"<CdtrAcct><Id><IBAN>{iban_normal(z['iban'])}</IBAN></Id></CdtrAcct>"
            f"<RmtInf><Ustrd>{escape(sepa_text(z.get('verwendungszweck'), 140))}</Ustrd></RmtInf>"
            "</CdtTrfTxInf>"
        )
    dbic = (auftraggeber.get("bic") or "").replace(" ", "").upper()
    agent = f"<DbtrAgt><FinInstnId><BIC>{escape(dbic)}</BIC></FinInstnId></DbtrAgt>" if dbic else "<DbtrAgt><FinInstnId><Othr><Id>NOTPROVIDED</Id></Othr></FinInstnId></DbtrAgt>"
    name = escape(sepa_text(auftraggeber.get("name"), 70))
    return (
        '<?xml version="1.0" encoding="UTF-8"?>'
        f'<Document xmlns="{NS}" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><CstmrCdtTrfInitn>'
        f"<GrpHdr><MsgId>{escape(msg)}</MsgId><CreDtTm>{erstellt:%Y-%m-%dT%H:%M:%S}</CreDtTm><NbOfTxs>{n}</NbOfTxs><CtrlSum>{_betrag(summe)}</CtrlSum><InitgPty><Nm>{name}</Nm></InitgPty></GrpHdr>"
        f"<PmtInf><PmtInfId>{escape(msg)}-1</PmtInfId><PmtMtd>TRF</PmtMtd><BtchBookg>true</BtchBookg><NbOfTxs>{n}</NbOfTxs><CtrlSum>{_betrag(summe)}</CtrlSum>"
        "<PmtTpInf><SvcLvl><Cd>SEPA</Cd></SvcLvl></PmtTpInf>"
        f"<ReqdExctnDt>{ausfuehrung:%Y-%m-%d}</ReqdExctnDt>"
        f"<Dbtr><Nm>{name}</Nm></Dbtr><DbtrAcct><Id><IBAN>{iban_normal(auftraggeber['iban'])}</IBAN></Id></DbtrAcct>{agent}<ChrgBr>SLEV</ChrgBr>"
        f"{''.join(tx)}"
        "</PmtInf></CstmrCdtTrfInitn></Document>"
    )
