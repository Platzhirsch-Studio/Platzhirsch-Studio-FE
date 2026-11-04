"""Verifikation einer Belegkette – Simulation der BMF-Belegcheck-Prüfung (ohne FinanzOnline).

Prüft je Beleg: Codeformat, Signatur (ES256 gegen Zertifikat), Verkettung (Sig Vorbeleg = Hash des
JWS des Vorbelegs bzw. der Kassen-ID beim Startbeleg), Zählerstand (entschlüsselt; TRA/STO ohne Zähler),
Belegnummern lückenlos aufsteigend. Ersetzt NICHT die Prüfung mit der BMF-App (Startbeleg, Jahresbeleg).

Kein Frappe-Import.
"""

from .beleg import CODE_RE, b64url_decode, hash_startbeleg, hash_vorbeleg, ist_ausfall_jws, zerlege_code
from .counter import ZaehlerFehler, entschluessele, ist_kennwort
from .signer import verifiziere


def pruefe_kette(jws_liste, zertifikat_oder_pubkey, aes_key=None, kassen_id=None, erwarteter_start=True):
    """jws_liste: chronologisch. Liefert dict {ok, fehler:[(index, text)], belege:[dict]}.

    zertifikat_oder_pubkey: x509-Zertifikat oder öffentlicher Schlüssel – oder dict {seriennummer_hex: zert}
    bei Zertifikatswechsel. aes_key: 32 Byte zum Entschlüsseln der Zähler (optional).
    """
    fehler = []
    belege = []
    vorheriger_jws = None
    vorherige_nummer = None
    zaehler_erwartet = None

    for i, jws in enumerate(jws_liste):
        teile = jws.split(".")
        try:
            code = b64url_decode(teile[1]).decode("utf-8")
        except Exception:  # noqa: BLE001
            fehler.append((i, "JWS nicht lesbar"))
            continue
        if not CODE_RE.match(code):
            fehler.append((i, "Code entspricht nicht der Spezifikation"))
            continue
        d = zerlege_code(code)
        d["jws"] = jws
        d["ausfall"] = ist_ausfall_jws(jws)
        if kassen_id and d["kassen_id"] != kassen_id:
            fehler.append((i, f"Kassen-ID {d['kassen_id']} ≠ {kassen_id}"))

        # Verkettung
        if i == 0 and erwarteter_start:
            erwartet = hash_startbeleg(d["kassen_id"])
            d["startbeleg"] = d["sig_vorbeleg"] == erwartet
            if not d["startbeleg"]:
                fehler.append((i, "erster Beleg ist kein Startbeleg (Verkettung auf Kassen-ID fehlt)"))
        elif vorheriger_jws is not None:
            if d["sig_vorbeleg"] != hash_vorbeleg(vorheriger_jws):
                fehler.append((i, "Verkettung gebrochen: Sig Vorbeleg passt nicht zum Vorbeleg"))

        # Belegnummern (nur, wenn numerisch)
        if d["belegnummer"].isdigit() and vorherige_nummer is not None:
            if int(d["belegnummer"]) != vorherige_nummer + 1:
                fehler.append((i, f"Belegnummer {d['belegnummer']} nicht lückenlos nach {vorherige_nummer}"))
        if d["belegnummer"].isdigit():
            vorherige_nummer = int(d["belegnummer"])

        # Signatur
        zert = zertifikat_oder_pubkey
        if isinstance(zert, dict):
            zert = zert.get(d["zertifikat_seriennummer"].lower()) or zert.get(d["zertifikat_seriennummer"])
        if d["ausfall"]:
            d["signatur_ok"] = None
        elif zert is None:
            d["signatur_ok"] = None
            fehler.append((i, f"kein Zertifikat für Seriennummer {d['zertifikat_seriennummer']}"))
        else:
            d["signatur_ok"] = verifiziere(jws, zert)
            if not d["signatur_ok"]:
                fehler.append((i, "Signatur ungültig"))

        # Zähler
        d["zaehler_cent"] = None
        if aes_key is not None and not ist_kennwort(d["zaehler_feld"]):
            try:
                d["zaehler_cent"] = entschluessele(d["zaehler_feld"], aes_key, d["kassen_id"], d["belegnummer"])
            except ZaehlerFehler as e:
                fehler.append((i, f"Zähler nicht entschlüsselbar: {e}"))
            else:
                gesamt = sum(d["betraege_cent"].values())
                if zaehler_erwartet is None:
                    if i == 0 and erwarteter_start and d["zaehler_cent"] != 0:
                        fehler.append((i, "Startbeleg muss Zähler 0 tragen"))
                    zaehler_erwartet = d["zaehler_cent"]
                else:
                    soll = zaehler_erwartet + gesamt
                    if d["zaehler_cent"] != soll:
                        fehler.append((i, f"Zählerstand {d['zaehler_cent']} ≠ erwartet {soll}"))
                    zaehler_erwartet = d["zaehler_cent"]
        belege.append(d)
        vorheriger_jws = jws

    return {"ok": not fehler, "fehler": fehler, "belege": belege, "anzahl": len(belege)}


def pruefe_einzelbeleg(jws, zertifikat_oder_pubkey, vorbeleg_jws=None, aes_key=None):
    """Ein Beleg: Signatur + (optional) Verkettung zum angegebenen Vorbeleg. Liefert dict wie pruefe_kette."""
    liste = [vorbeleg_jws, jws] if vorbeleg_jws else [jws]
    erg = pruefe_kette(liste, zertifikat_oder_pubkey, aes_key=aes_key, erwarteter_start=False)
    if vorbeleg_jws:
        erg["fehler"] = [(i, t) for i, t in erg["fehler"] if i == 1]
        erg["ok"] = not erg["fehler"]
        erg["belege"] = erg["belege"][-1:]
    return erg
