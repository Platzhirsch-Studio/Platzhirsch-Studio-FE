"""AWS Signature Version 4 – eigene Implementierung (hashlib/hmac), ohne boto3. Getestet gegen die
veröffentlichten AWS-Testvektoren (tests/test_sigv4.py: Signierschlüssel-Beispiel, get-vanilla, S3 GET mit
Range-Header, S3 Presigned-URL-Beispiel).

Quelle: AWS General Reference „Signature Version 4 signing process“ und S3 API Reference „Authenticating
Requests: Using Query Parameters“. Gilt für alle S3-kompatiblen Anbieter (Region frei wählbar, Pfad-Stil).
"""

import hashlib
import hmac
from datetime import datetime, timezone
from urllib.parse import quote, urlsplit

ALGORITHMUS = "AWS4-HMAC-SHA256"
LEER_SHA256 = hashlib.sha256(b"").hexdigest()
UNSIGNED = "UNSIGNED-PAYLOAD"


def _hmac(schluessel, text):
    return hmac.new(schluessel, text.encode("utf-8"), hashlib.sha256).digest()


def signierschluessel(secret, datum, region, service):
    """kSigning = HMAC(HMAC(HMAC(HMAC("AWS4"+secret, datum), region), service), "aws4_request")."""
    k = _hmac(("AWS4" + secret).encode("utf-8"), datum)
    k = _hmac(k, region)
    k = _hmac(k, service)
    return _hmac(k, "aws4_request")


def uri_kodieren(text, pfad=False):
    """RFC 3986, unreservierte Zeichen bleiben; im Pfad bleibt '/'."""
    return quote(text, safe="-_.~/" if pfad else "-_.~")


def kanonischer_pfad(pfad, service="s3"):
    pfad = pfad or "/"
    if service == "s3":
        # S3: Pfad genau einmal kodieren, keine Normalisierung
        return uri_kodieren(pfad, pfad=True)
    # übrige Dienste: Segmente normalisieren und kodieren
    teile = []
    for seg in pfad.split("/"):
        if seg == "..":
            if teile:
                teile.pop()
        elif seg not in ("", "."):
            teile.append(uri_kodieren(seg))
    ergebnis = "/" + "/".join(teile)
    if pfad.endswith("/") and ergebnis != "/":
        ergebnis += "/"
    return ergebnis


def kanonische_query(params):
    """params: Liste von (name, wert) oder dict → sortierte, kodierte Query."""
    paare = list(params.items()) if isinstance(params, dict) else list(params or [])
    kodiert = sorted((uri_kodieren(str(k)), uri_kodieren(str(v))) for k, v in paare)
    return "&".join(f"{k}={v}" for k, v in kodiert)


def _kopf_wert(v):
    return " ".join(str(v).strip().split())


def kanonische_header(headers):
    """→ (kanonischer Header-Block, signierte Header-Liste)."""
    norm = {}
    for k, v in headers.items():
        norm.setdefault(k.strip().lower(), []).append(_kopf_wert(v))
    namen = sorted(norm)
    block = "".join(f"{n}:{','.join(norm[n])}\n" for n in namen)
    return block, ";".join(namen)


def kanonische_anfrage(methode, pfad, query, headers, payload_hash, service="s3"):
    block, signiert = kanonische_header(headers)
    return "\n".join([methode.upper(), kanonischer_pfad(pfad, service), kanonische_query(query), block, signiert, payload_hash]), signiert


def zeitstempel(zeit=None):
    zeit = zeit or datetime.now(timezone.utc)
    if zeit.tzinfo is None:
        zeit = zeit.replace(tzinfo=timezone.utc)
    zeit = zeit.astimezone(timezone.utc)
    return zeit.strftime("%Y%m%dT%H%M%SZ"), zeit.strftime("%Y%m%d")


def string_to_sign(amz_datum, scope, kanonisch):
    return "\n".join([ALGORITHMUS, amz_datum, scope, hashlib.sha256(kanonisch.encode("utf-8")).hexdigest()])


def signiere_header(methode, url, region, service, key_id, secret, headers=None, payload_hash=LEER_SHA256, zeit=None, query=None, sitzungstoken=None):
    """Header-Signatur. Gibt die vollständigen Header (inkl. Authorization, x-amz-date, Host) zurück.

    query: optionale Liste (name, wert); sonst aus der URL. payload_hash: sha256-Hex des Körpers oder UNSIGNED.
    """
    teile = urlsplit(url)
    amz_datum, datum = zeitstempel(zeit)
    h = {k: v for k, v in (headers or {}).items()}
    if not any(k.lower() == "host" for k in h):
        h["host"] = teile.netloc
    h["x-amz-date"] = amz_datum
    if service == "s3" and not any(k.lower() == "x-amz-content-sha256" for k in h):
        h["x-amz-content-sha256"] = payload_hash
    if sitzungstoken:
        h["x-amz-security-token"] = sitzungstoken
    if query is None:
        query = _query_aus_url(teile.query)
    kanonisch, signiert = kanonische_anfrage(methode, teile.path, query, h, payload_hash, service)
    scope = f"{datum}/{region}/{service}/aws4_request"
    sts = string_to_sign(amz_datum, scope, kanonisch)
    signatur = hmac.new(signierschluessel(secret, datum, region, service), sts.encode("utf-8"), hashlib.sha256).hexdigest()
    h["Authorization"] = f"{ALGORITHMUS} Credential={key_id}/{scope}, SignedHeaders={signiert}, Signature={signatur}"
    return h


def presign(methode, url, region, key_id, secret, sekunden=300, zeit=None, service="s3", signierte_header=None, extra_query=None, sitzungstoken=None):
    """Vorsignierte URL (Query-Parameter). signierte_header: zusätzliche Header, die der Aufrufer senden MUSS
    (z. B. content-type, x-amz-checksum-sha256). → vollständige URL."""
    if not 1 <= int(sekunden) <= 604800:
        raise ValueError("sekunden")
    teile = urlsplit(url)
    amz_datum, datum = zeitstempel(zeit)
    scope = f"{datum}/{region}/{service}/aws4_request"
    h = {"host": teile.netloc}
    for k, v in (signierte_header or {}).items():
        h[k.lower()] = v
    _block, signiert = kanonische_header(h)
    query = _query_aus_url(teile.query) + list((extra_query or {}).items())
    query += [
        ("X-Amz-Algorithm", ALGORITHMUS),
        ("X-Amz-Credential", f"{key_id}/{scope}"),
        ("X-Amz-Date", amz_datum),
        ("X-Amz-Expires", str(int(sekunden))),
        ("X-Amz-SignedHeaders", signiert),
    ]
    if sitzungstoken:
        query.append(("X-Amz-Security-Token", sitzungstoken))
    kanonisch, _ = kanonische_anfrage(methode, teile.path, query, h, UNSIGNED, service)
    sts = string_to_sign(amz_datum, scope, kanonisch)
    signatur = hmac.new(signierschluessel(secret, datum, region, service), sts.encode("utf-8"), hashlib.sha256).hexdigest()
    return f"{teile.scheme}://{teile.netloc}{kanonischer_pfad(teile.path, service)}?{kanonische_query(query)}&X-Amz-Signature={signatur}"


def _query_aus_url(q):
    from urllib.parse import parse_qsl

    return parse_qsl(q, keep_blank_values=True) if q else []
