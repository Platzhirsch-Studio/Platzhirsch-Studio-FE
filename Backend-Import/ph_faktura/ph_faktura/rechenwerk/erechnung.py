"""E-Rechnung als Exportdatei – ebInterface 6.1 (Österreich, e-rechnung.gv.at) und UN/CEFACT CII
(ZUGFeRD 2.x Profil EN 16931 bzw. XRechnung 3.0, Deutschland) – ohne Frappe.

Eingabe ist ein neutrales dict (Rechnung.erechnung_daten() bildet es):
  {art: "Rechnung"|"Gutschrift", nummer, datum (date), faellig (date), leistungsdatum (date|None),
   leistung_von/bis (date|None), waehrung, ust_fall, ust_hinweistext, bestellreferenz, leitweg_id,
   verkaeufer: {name, strasse, plz, ort, land, uid, iban, bic, email},
   kaeufer: {name, strasse, plz, ort, land, uid, email},
   positionen: [{pos, bezeichnung, menge, einheit, einzel_netto_cent, netto_cent, ust_satz_promille}],
   steuer: [{ust_satz_promille, netto_cent, ust_cent}], netto_cent, ust_cent, brutto_cent,
   anzahlung_brutto_cent, zahlbar_cent, skonto_promille, skonto_bis, zahlungsreferenz}
Beträge in Cent (Int) → Dezimaltext mit Punkt und 2 Stellen. Vor Produktivnutzung je Format mit dem offiziellen
Validator prüfen (ebInterface: e-rechnung.gv.at Prüfservice / XSD 6.1; XRechnung: KoSIT-Validator).
ZUGFeRD als Hybrid-PDF (PDF/A-3 mit eingebettetem XML) entsteht im Controller nur, wenn das Paket `facturx`
installiert ist; sonst wird die XML-Datei allein angehängt (XRechnung ist ohnehin reines XML).
"""

from __future__ import annotations

from decimal import Decimal
from xml.sax.saxutils import escape

EBI_NS = "http://www.ebinterface.at/schema/6p1/"
CII_NS = {
    "rsm": "urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100",
    "ram": "urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100",
    "qdt": "urn:un:unece:uncefact:data:standard:QualifiedDataType:100",
    "udt": "urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100",
}
PROFILE = {
    "ZUGFeRD EN16931": "urn:cen.eu:en16931:2017",
    "XRechnung": "urn:cen.eu:en16931:2017#compliant#urn:xeinkauf.de:kosit:xrechnung_3.0",
}
# USt-Fall (ph_faktura) → UNCL 5305 Steuerkategorie
KATEGORIE = {
    "Steuerpflichtig AT": "S",
    "OSS": "S",
    "Innergemeinschaftlich steuerfrei": "K",
    "Reverse Charge": "AE",
    "Ausfuhr": "G",
    "Kleinunternehmer": "E",
}
# PH Beleg Position.einheit → UN/ECE Rec 20
EINHEIT = {"Stk": "C62", "Std": "HUR", "Pausch": "LS", "m": "MTR", "m²": "MTK", "m2": "MTK", "lfm": "MTR", "Set": "SET", "Tag": "DAY"}


class ERechnungFehler(ValueError):
    pass


def betrag(cent) -> str:
    return f"{Decimal(int(cent or 0)) / Decimal(100):.2f}"


def prozent(satz_promille) -> str:
    return f"{Decimal(int(satz_promille or 0)) / Decimal(100):.2f}"


def menge_text(menge) -> str:
    return f"{Decimal(str(menge or 0)).normalize():f}"


def _ust(netto_cent, satz_promille) -> int:
    """USt einer Zeile, kaufmännisch gerundet (auch negativ symmetrisch)."""
    from decimal import ROUND_HALF_UP

    return int((Decimal(int(netto_cent or 0)) * Decimal(int(satz_promille or 0)) / Decimal(10000)).quantize(Decimal(1), ROUND_HALF_UP))


def _e(text) -> str:
    return escape(str(text or ""))


def pruefen(d: dict, format_name: str) -> list[str]:
    """Pflichtangaben je Format (EN 16931 Kern + ebInterface-Pflichten)."""
    fehlt = []
    for k in ("nummer", "datum", "waehrung"):
        if not d.get(k):
            fehlt.append(k)
    v, k_ = d.get("verkaeufer") or {}, d.get("kaeufer") or {}
    for feld in ("name", "strasse", "plz", "ort", "land", "uid"):
        if not v.get(feld):
            fehlt.append(f"verkaeufer.{feld}")
    for feld in ("name", "ort", "land"):
        if not k_.get(feld):
            fehlt.append(f"kaeufer.{feld}")
    if not d.get("positionen"):
        fehlt.append("positionen")
    if format_name == "XRechnung" and not d.get("leitweg_id"):
        fehlt.append("leitweg_id (BuyerReference)")
    if format_name == "ebInterface 6.1" and d.get("bund"):
        # e-rechnung.gv.at: Lieferantennummer und Auftragsreferenz Pflicht; 10-stellige Bestellnummer → Positionsnummer je Zeile
        if not d.get("lieferantennummer"):
            fehlt.append("lieferantennummer (Bund)")
        if not d.get("bestellreferenz"):
            fehlt.append("bestellreferenz/Auftragsreferenz (Bund)")
        elif len(str(d["bestellreferenz"])) == 10 and str(d["bestellreferenz"]).isdigit() and not all(p.get("bestellposition") for p in d.get("positionen") or []):
            fehlt.append("bestellposition je Zeile (10-stellige Bestellnummer des Bundes)")
    if d.get("ust_fall") in ("Innergemeinschaftlich steuerfrei", "Reverse Charge") and not k_.get("uid"):
        fehlt.append("kaeufer.uid")
    if d.get("ust_fall") in ("Innergemeinschaftlich steuerfrei", "Reverse Charge", "Ausfuhr", "Kleinunternehmer") and not d.get("ust_hinweistext"):
        fehlt.append("ust_hinweistext (Befreiungsgrund)")
    return fehlt


# ── ebInterface 6.1 ────────────────────────────────────────────────────────────

def _ebi_adresse(p: dict) -> str:
    return (
        "<Address>"
        f"<Name>{_e(p.get('name'))}</Name>"
        f"<Street>{_e(p.get('strasse'))}</Street>"
        f"<Town>{_e(p.get('ort'))}</Town>"
        f"<ZIP>{_e(p.get('plz'))}</ZIP>"
        f"<Country CountryCode=\"{_e(p.get('land') or 'AT')}\">{_e(p.get('land') or 'AT')}</Country>"
        + (f"<Email>{_e(p.get('email'))}</Email>" if p.get("email") else "")
        + "</Address>"
    )


def ebinterface(d: dict) -> str:
    """ebInterface 6.1 Invoice/CreditMemo als XML-Text (UTF-8)."""
    fehlt = pruefen(d, "ebInterface 6.1")
    if fehlt:
        raise ERechnungFehler("ebInterface: Pflichtangaben fehlen: " + ", ".join(fehlt))
    kat = KATEGORIE.get(d.get("ust_fall") or "Steuerpflichtig AT", "S")
    typ = "CreditMemo" if d.get("art") == "Gutschrift" else "Invoice"
    v, k = d["verkaeufer"], d["kaeufer"]
    if d.get("leistungsdatum"):
        delivery = f"<Delivery><Date>{d['leistungsdatum']:%Y-%m-%d}</Date></Delivery>"
    elif d.get("leistung_von") and d.get("leistung_bis"):
        delivery = f"<Delivery><Period><FromDate>{d['leistung_von']:%Y-%m-%d}</FromDate><ToDate>{d['leistung_bis']:%Y-%m-%d}</ToDate></Period></Delivery>"
    else:
        delivery = f"<Delivery><Date>{d['datum']:%Y-%m-%d}</Date></Delivery>"
    zeilen = []
    for p in d["positionen"]:
        zeilen.append(
            "<ListLineItem>"
            f"<PositionNumber>{int(p.get('pos') or len(zeilen) + 1)}</PositionNumber>"
            f"<Description>{_e(p.get('bezeichnung'))}</Description>"
            + (f"<InvoiceRecipientsOrderReference><OrderID>{_e(d.get('bestellreferenz'))}</OrderID><OrderPositionNumber>{_e(p.get('bestellposition'))}</OrderPositionNumber></InvoiceRecipientsOrderReference>" if p.get("bestellposition") and d.get("bestellreferenz") else "")
            + f"<Quantity Unit=\"{EINHEIT.get(p.get('einheit') or 'Stk', 'C62')}\">{menge_text(p.get('menge'))}</Quantity>"
            f"<UnitPrice>{betrag(p.get('einzel_netto_cent'))}</UnitPrice>"
            f"<TaxItem><TaxableAmount>{betrag(p.get('netto_cent'))}</TaxableAmount><TaxPercent TaxCategoryCode=\"{kat}\">{prozent(p.get('ust_satz_promille'))}</TaxPercent><TaxAmount>{betrag(_ust(p.get('netto_cent'), p.get('ust_satz_promille')))}</TaxAmount></TaxItem>"
            f"<LineItemAmount>{betrag(p.get('netto_cent'))}</LineItemAmount>"
            "</ListLineItem>"
        )
    steuer = "".join(
        f"<TaxItem><TaxableAmount>{betrag(s['netto_cent'])}</TaxableAmount><TaxPercent TaxCategoryCode=\"{kat}\">{prozent(s['ust_satz_promille'])}</TaxPercent><TaxAmount>{betrag(s['ust_cent'])}</TaxAmount></TaxItem>"
        for s in d.get("steuer") or []
    )
    prepaid = int(d.get("anzahlung_brutto_cent") or 0)
    zahlung = ""
    if v.get("iban"):
        zahlung = (
            "<PaymentMethod><Comment>Überweisung</Comment><UniversalBankTransaction>"
            + (f"<BeneficiaryAccount>" + (f"<BIC>{_e(v.get('bic'))}</BIC>" if v.get("bic") else "") + f"<IBAN>{_e(v['iban'].replace(' ', ''))}</IBAN><BankAccountOwner>{_e(v.get('name'))}</BankAccountOwner></BeneficiaryAccount>")
            + (f"<PaymentReference>{_e(d.get('zahlungsreferenz'))}</PaymentReference>" if d.get("zahlungsreferenz") else "")
            + "</UniversalBankTransaction></PaymentMethod>"
        )
    bedingungen = ""
    if d.get("faellig"):
        bedingungen = f"<PaymentConditions><DueDate>{d['faellig']:%Y-%m-%d}</DueDate>"
        if d.get("skonto_bis") and int(d.get("skonto_promille") or 0):
            bedingungen += f"<Discount><PaymentDate>{d['skonto_bis']:%Y-%m-%d}</PaymentDate><Percentage>{Decimal(int(d['skonto_promille'])) / Decimal(10):.2f}</Percentage></Discount>"
        bedingungen += "</PaymentConditions>"
    kommentar = f"<Comment>{_e(d.get('ust_hinweistext'))}</Comment>" if d.get("ust_hinweistext") else ""
    return (
        '<?xml version="1.0" encoding="UTF-8"?>'
        f'<Invoice xmlns="{EBI_NS}" GeneratingSystem="Platzhirsch ph_faktura" DocumentType="{typ}" InvoiceCurrency="{_e(d["waehrung"])}" DocumentTitle="{_e(d.get("art") or "Rechnung")} {_e(d["nummer"])}" Language="ger">'
        f"<InvoiceNumber>{_e(d['nummer'])}</InvoiceNumber>"
        f"<InvoiceDate>{d['datum']:%Y-%m-%d}</InvoiceDate>"
        f"{delivery}"
        f"<Biller><VATIdentificationNumber>{_e(v['uid'])}</VATIdentificationNumber>"
        + (f"<InvoiceRecipientsBillerID>{_e(d.get('lieferantennummer'))}</InvoiceRecipientsBillerID>" if d.get("lieferantennummer") else "")
        + f"{_ebi_adresse(v)}</Biller>"
        f"<InvoiceRecipient><VATIdentificationNumber>{_e(k.get('uid') or '00000000')}</VATIdentificationNumber>"
        + (f"<OrderReference><OrderID>{_e(d.get('bestellreferenz'))}</OrderID></OrderReference>" if d.get("bestellreferenz") else "")
        + f"{_ebi_adresse(k)}</InvoiceRecipient>"
        f"<Details><ItemList>{''.join(zeilen)}</ItemList></Details>"
        f"<Tax>{steuer}</Tax>"
        f"<TotalGrossAmount>{betrag(d['brutto_cent'])}</TotalGrossAmount>"
        + (f"<PrepaidAmount>{betrag(prepaid)}</PrepaidAmount>" if prepaid else "")
        + f"<PayableAmount>{betrag(d.get('zahlbar_cent', d['brutto_cent']))}</PayableAmount>"
        f"{zahlung}{bedingungen}{kommentar}"
        "</Invoice>"
    )


# ── UN/CEFACT CII (ZUGFeRD EN 16931 / XRechnung) ───────────────────────────────

def _cii_partei(tag: str, p: dict) -> str:
    return (
        f"<ram:{tag}><ram:Name>{_e(p.get('name'))}</ram:Name>"
        "<ram:PostalTradeAddress>"
        f"<ram:PostcodeCode>{_e(p.get('plz'))}</ram:PostcodeCode><ram:LineOne>{_e(p.get('strasse'))}</ram:LineOne>"
        f"<ram:CityName>{_e(p.get('ort'))}</ram:CityName><ram:CountryID>{_e(p.get('land') or 'AT')}</ram:CountryID>"
        "</ram:PostalTradeAddress>"
        + (f"<ram:URIUniversalCommunication><ram:URIID schemeID=\"EM\">{_e(p.get('email'))}</ram:URIID></ram:URIUniversalCommunication>" if p.get("email") else "")
        + (f"<ram:SpecifiedTaxRegistration><ram:ID schemeID=\"VA\">{_e(p.get('uid'))}</ram:ID></ram:SpecifiedTaxRegistration>" if p.get("uid") else "")
        + f"</ram:{tag}>"
    )


def _datum102(d) -> str:
    return f'<udt:DateTimeString format="102">{d:%Y%m%d}</udt:DateTimeString>'


def cii(d: dict, profil: str = "ZUGFeRD EN16931") -> str:
    """CrossIndustryInvoice D16B (ZUGFeRD 2.x EN 16931 / XRechnung 3.0 CII-Syntax)."""
    if profil not in PROFILE:
        raise ERechnungFehler(f"Unbekanntes Profil {profil!r}.")
    fehlt = pruefen(d, profil)
    if fehlt:
        raise ERechnungFehler(f"{profil}: Pflichtangaben fehlen: " + ", ".join(fehlt))
    kat = KATEGORIE.get(d.get("ust_fall") or "Steuerpflichtig AT", "S")
    typcode = "381" if d.get("art") == "Gutschrift" else "380"
    w = _e(d["waehrung"])
    zeilen = []
    for i, p in enumerate(d["positionen"], 1):
        zeilen.append(
            "<ram:IncludedSupplyChainTradeLineItem>"
            f"<ram:AssociatedDocumentLineDocument><ram:LineID>{int(p.get('pos') or i)}</ram:LineID></ram:AssociatedDocumentLineDocument>"
            f"<ram:SpecifiedTradeProduct><ram:Name>{_e(p.get('bezeichnung'))}</ram:Name></ram:SpecifiedTradeProduct>"
            f"<ram:SpecifiedLineTradeAgreement><ram:NetPriceProductTradePrice><ram:ChargeAmount>{betrag(p.get('einzel_netto_cent'))}</ram:ChargeAmount></ram:NetPriceProductTradePrice></ram:SpecifiedLineTradeAgreement>"
            f"<ram:SpecifiedLineTradeDelivery><ram:BilledQuantity unitCode=\"{EINHEIT.get(p.get('einheit') or 'Stk', 'C62')}\">{menge_text(p.get('menge'))}</ram:BilledQuantity></ram:SpecifiedLineTradeDelivery>"
            "<ram:SpecifiedLineTradeSettlement>"
            f"<ram:ApplicableTradeTax><ram:TypeCode>VAT</ram:TypeCode><ram:CategoryCode>{kat}</ram:CategoryCode><ram:RateApplicablePercent>{prozent(p.get('ust_satz_promille'))}</ram:RateApplicablePercent></ram:ApplicableTradeTax>"
            f"<ram:SpecifiedTradeSettlementLineMonetarySummation><ram:LineTotalAmount>{betrag(p.get('netto_cent'))}</ram:LineTotalAmount></ram:SpecifiedTradeSettlementLineMonetarySummation>"
            "</ram:SpecifiedLineTradeSettlement>"
            "</ram:IncludedSupplyChainTradeLineItem>"
        )
    befreiung = f"<ram:ExemptionReason>{_e(d.get('ust_hinweistext'))}</ram:ExemptionReason>" if kat != "S" and d.get("ust_hinweistext") else ""
    steuer = "".join(
        f"<ram:ApplicableTradeTax><ram:CalculatedAmount>{betrag(s['ust_cent'])}</ram:CalculatedAmount><ram:TypeCode>VAT</ram:TypeCode>{befreiung}"
        f"<ram:BasisAmount>{betrag(s['netto_cent'])}</ram:BasisAmount><ram:CategoryCode>{kat}</ram:CategoryCode><ram:RateApplicablePercent>{prozent(s['ust_satz_promille'])}</ram:RateApplicablePercent></ram:ApplicableTradeTax>"
        for s in d.get("steuer") or []
    )
    v, k = d["verkaeufer"], d["kaeufer"]
    lieferung = d.get("leistungsdatum") or d.get("leistung_bis") or d["datum"]
    zahlmittel = ""
    if v.get("iban"):
        zahlmittel = (
            "<ram:SpecifiedTradeSettlementPaymentMeans><ram:TypeCode>58</ram:TypeCode>"
            f"<ram:PayeePartyCreditorFinancialAccount><ram:IBANID>{_e(v['iban'].replace(' ', ''))}</ram:IBANID></ram:PayeePartyCreditorFinancialAccount>"
            "</ram:SpecifiedTradeSettlementPaymentMeans>"
        )
    bedingungen = ""
    if d.get("faellig"):
        text = ""
        if d.get("skonto_bis") and int(d.get("skonto_promille") or 0):
            tage = (d["skonto_bis"] - d["datum"]).days
            text = f"<ram:Description>#SKONTO#TAGE={tage}#PROZENT={Decimal(int(d['skonto_promille'])) / Decimal(10):.2f}#\n</ram:Description>"
        bedingungen = f"<ram:SpecifiedTradePaymentTerms>{text}<ram:DueDateDateTime>{_datum102(d['faellig'])}</ram:DueDateDateTime></ram:SpecifiedTradePaymentTerms>"
    prepaid = int(d.get("anzahlung_brutto_cent") or 0)
    ns = " ".join(f'xmlns:{k_}="{v_}"' for k_, v_ in CII_NS.items())
    return (
        '<?xml version="1.0" encoding="UTF-8"?>'
        f"<rsm:CrossIndustryInvoice {ns}>"
        f"<rsm:ExchangedDocumentContext><ram:GuidelineSpecifiedDocumentContextParameter><ram:ID>{PROFILE[profil]}</ram:ID></ram:GuidelineSpecifiedDocumentContextParameter></rsm:ExchangedDocumentContext>"
        f"<rsm:ExchangedDocument><ram:ID>{_e(d['nummer'])}</ram:ID><ram:TypeCode>{typcode}</ram:TypeCode><ram:IssueDateTime>{_datum102(d['datum'])}</ram:IssueDateTime>"
        + (f"<ram:IncludedNote><ram:Content>{_e(d.get('ust_hinweistext'))}</ram:Content></ram:IncludedNote>" if d.get("ust_hinweistext") else "")
        + "</rsm:ExchangedDocument>"
        "<rsm:SupplyChainTradeTransaction>"
        f"{''.join(zeilen)}"
        "<ram:ApplicableHeaderTradeAgreement>"
        + (f"<ram:BuyerReference>{_e(d.get('leitweg_id'))}</ram:BuyerReference>" if d.get("leitweg_id") else "")
        + _cii_partei("SellerTradeParty", v)
        + _cii_partei("BuyerTradeParty", k)
        + (f"<ram:BuyerOrderReferencedDocument><ram:IssuerAssignedID>{_e(d.get('bestellreferenz'))}</ram:IssuerAssignedID></ram:BuyerOrderReferencedDocument>" if d.get("bestellreferenz") else "")
        + "</ram:ApplicableHeaderTradeAgreement>"
        f"<ram:ApplicableHeaderTradeDelivery><ram:ActualDeliverySupplyChainEvent><ram:OccurrenceDateTime>{_datum102(lieferung)}</ram:OccurrenceDateTime></ram:ActualDeliverySupplyChainEvent></ram:ApplicableHeaderTradeDelivery>"
        "<ram:ApplicableHeaderTradeSettlement>"
        + (f"<ram:PaymentReference>{_e(d.get('zahlungsreferenz'))}</ram:PaymentReference>" if d.get("zahlungsreferenz") else "")
        + f"<ram:InvoiceCurrencyCode>{w}</ram:InvoiceCurrencyCode>"
        f"{zahlmittel}{steuer}{bedingungen}"
        "<ram:SpecifiedTradeSettlementHeaderMonetarySummation>"
        f"<ram:LineTotalAmount>{betrag(d['netto_cent'])}</ram:LineTotalAmount>"
        f"<ram:TaxBasisTotalAmount>{betrag(d['netto_cent'])}</ram:TaxBasisTotalAmount>"
        f"<ram:TaxTotalAmount currencyID=\"{w}\">{betrag(d['ust_cent'])}</ram:TaxTotalAmount>"
        f"<ram:GrandTotalAmount>{betrag(d['brutto_cent'])}</ram:GrandTotalAmount>"
        + (f"<ram:TotalPrepaidAmount>{betrag(prepaid)}</ram:TotalPrepaidAmount>" if prepaid else "")
        + f"<ram:DuePayableAmount>{betrag(d.get('zahlbar_cent', d['brutto_cent']))}</ram:DuePayableAmount>"
        "</ram:SpecifiedTradeSettlementHeaderMonetarySummation>"
        "</ram:ApplicableHeaderTradeSettlement>"
        "</rsm:SupplyChainTradeTransaction>"
        "</rsm:CrossIndustryInvoice>"
    )


FORMATE = ("ebInterface 6.1", "ZUGFeRD EN16931", "XRechnung")


def erzeuge(format_name: str, d: dict) -> tuple[str, str]:
    """→ (dateiname, xml_text)."""
    nr = str(d.get("nummer") or "beleg").replace("/", "-")
    if format_name == "ebInterface 6.1":
        return f"{nr}-ebInterface61.xml", ebinterface(d)
    if format_name in ("ZUGFeRD EN16931", "XRechnung"):
        suffix = "xrechnung" if format_name == "XRechnung" else "factur-x"
        return f"{nr}-{suffix}.xml", cii(d, format_name)
    raise ERechnungFehler(f"Unbekanntes Format {format_name!r} – erlaubt: {', '.join(FORMATE)}")
