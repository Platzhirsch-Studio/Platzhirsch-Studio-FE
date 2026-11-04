"""Reine Tarif-Logik (kein Frappe-Import). Quelle: src/lib/commerce/shipping/letmeship.js
(kundenCent, pickService, shipmentDetails, party, trackingLink)."""

import math
import re

# Dienstwahl wie config.js DIENST_WAHL; „bevorzugt“ zusätzlich (PH Logistik Einstellungen).
DIENST_WAHL = ("guenstigster", "schnellster", "bevorzugt")


def kunden_cent(price_info, aufschlag_cent=0, ust_promille=200):
    """Kundenpreis eines Tarifs in Cent: totalPrice (brutto) falls vorhanden, sonst netPrice + USt;
    plus Aufschlag. Kein Schätzen: ohne Preisfeld → None."""
    price_info = price_info or {}
    total = _zahl(price_info.get("totalPrice"))
    net = _zahl(price_info.get("netPrice"))
    if total and total > 0:
        cent = round(total * 100)
    elif net and net > 0:
        cent = round(net * 100 * (1 + ust_promille / 1000))
    else:
        return None
    return cent + int(aufschlag_cent or 0)


def netto_cent(price_info):
    net = _zahl((price_info or {}).get("netPrice"))
    return round(net * 100) if net and net > 0 else None


def tarife_normalisieren(service_list, aufschlag_cent=0, ust_promille=200):
    """serviceList[] der LetMeShip-Antwort → Liste {id, carrier, name, cent, netto_cent, tage, raw}; ohne Preis verworfen."""
    out = []
    for s in service_list or []:
        b = (s or {}).get("baseServiceDetails") or {}
        cent = kunden_cent(b.get("priceInfo"), aufschlag_cent, ust_promille)
        if not cent:
            continue
        tage = _zahl(b.get("transferTime"))
        if tage is None:
            tage = _zahl(((s or {}).get("serviceInfo") or {}).get("transferTime"))
        out.append(
            {
                "id": str(b.get("id") or ""),
                "carrier": str(b.get("carrier") or ""),
                "name": str(b.get("name") or ""),
                "cent": cent,
                "netto_cent": netto_cent(b.get("priceInfo")),
                "tage": int(tage) if tage is not None else None,
                "raw": s,
            }
        )
    return out


def waehle_dienst(tarife, wahl="guenstigster", bevorzugte_carrier=None):
    """Tarif nach Regel wählen. guenstigster: Preis; schnellster: Laufzeit, dann Preis;
    bevorzugt: erster Carrier der Liste, der angeboten wird (günstigster davon), sonst günstigster."""
    liste = [t for t in tarife or [] if t.get("cent")]
    if not liste:
        return None
    if wahl == "schnellster" and any(t.get("tage") is not None for t in liste):
        return sorted(liste, key=lambda t: (t.get("tage") if t.get("tage") is not None else 99, t["cent"]))[0]
    if wahl == "bevorzugt":
        for c in bevorzugte_carrier or []:
            c = str(c).strip().lower()
            if not c:
                continue
            passend = [t for t in liste if c in t["carrier"].lower()]
            if passend:
                return sorted(passend, key=lambda t: t["cent"])[0]
    return sorted(liste, key=lambda t: t["cent"])[0]


def adresse(a):
    return {
        "countryCode": a.get("land") or "AT",
        "zip": a.get("plz") or "",
        "city": a.get("ort") or "",
        "street": a.get("strasse") or "",
        "houseNo": a.get("hausnr") or "",
        "addressInfo1": a.get("zusatz") or "",
    }


def telefon_teile(tel):
    """'+43 5574 46255' → prefix '+43', number '557446255' (wie letmeship.js party)."""
    t = re.sub(r"[^\d+]", "", str(tel or ""))
    return t[:3], t[3:]


def party(a):
    name = str(a.get("name") or a.get("firma") or "").strip()
    teile = name.split()
    vorname = teile[0] if teile else ""
    nachname = " ".join(teile[1:]) or vorname
    prefix, nummer = telefon_teile(a.get("telefon"))
    return {
        "address": adresse(a),
        "company": str(a.get("firma") or "")[:30],
        "person": {"firstname": vorname, "lastname": nachname},
        "phone": {"phoneNumber": nummer, "phoneNumberPrefix": prefix},
        "email": a.get("email") or "",
    }


def shipment_details(pakete, versichern, warenwert_cent, datum, inhalt="Wohnaccessoires"):
    """shipmentDetails für available/shipments (Gewicht kg, Maße cm, Menge je Paketzeile)."""
    return {
        "contentDescription": inhalt,
        "shipmentType": "PARCEL",
        "shipmentSettings": {
            "saturdayDelivery": False,
            "ddp": False,
            "insurance": bool(versichern),
            "pickupOrder": False,
            "pickupTailLift": False,
            "deliveryTailLift": False,
            "holidayDelivery": False,
        },
        "goodsValue": round(int(warenwert_cent or 0)) / 100,
        "parcelList": [
            {
                "height": math.ceil(float(p.get("hoehe_cm") or 0)),
                "width": math.ceil(float(p.get("breite_cm") or 0)),
                "length": math.ceil(float(p.get("laenge_cm") or 0)),
                "weight": round(int(p.get("gewicht_g") or 0)) / 1000,
                "quantity": int(p.get("menge") or 1),
                "contentDescription": str(p.get("inhalt") or "")[:35],
            }
            for p in pakete or []
        ],
        "pickupInterval": {"date": datum},
    }


def pakete_pruefen(pakete):
    """Jedes Paket braucht Maße > 0 und Gewicht > 0 (sonst nicht versandfähig, config.js profilVollstaendig)."""
    fehlend = []
    for i, p in enumerate(pakete or [], start=1):
        if not all(float(p.get(k) or 0) > 0 for k in ("laenge_cm", "breite_cm", "hoehe_cm", "gewicht_g")):
            fehlend.append(i)
    return fehlend


def volumengewicht_g(p, divisor=5000):
    """Volumengewicht in g (UPS-Regel: L×B×H/5000, auf volle kg aufgerundet) – Plausibilität, paketprofile.js."""
    kg = (float(p.get("laenge_cm") or 0) * float(p.get("breite_cm") or 0) * float(p.get("hoehe_cm") or 0)) / divisor
    return int(math.ceil(kg) * 1000)


def abrechnungsgewicht_g(p):
    return max(int(p.get("gewicht_g") or 0), volumengewicht_g(p))


_TRACKING = [
    (re.compile(r"dhl", re.I), "https://www.dhl.com/at-de/home/tracking.html?tracking-id={n}"),
    (re.compile(r"dpd", re.I), "https://tracking.dpd.de/status/de_DE/parcel/{n}"),
    (re.compile(r"ups", re.I), "https://www.ups.com/track?tracknum={n}"),
    (re.compile(r"gls", re.I), "https://gls-group.com/AT/de/paketverfolgung?match={n}"),
    (re.compile(r"post", re.I), "https://www.post.at/s/sendungssuche?snr={n}"),
]


def tracking_link(carrier, awb):
    """Öffentliche Sendungsverfolgung des Carriers (Muster wie letmeship.js; vor Livegang je Dienst prüfen)."""
    if not awb:
        return None
    from urllib.parse import quote

    n = quote(str(awb))
    for re_, url in _TRACKING:
        if re_.search(str(carrier or "")):
            return url.format(n=n)
    return None


def _zahl(v):
    try:
        if v is None or v == "":
            return None
        return float(v)
    except (TypeError, ValueError):
        return None
