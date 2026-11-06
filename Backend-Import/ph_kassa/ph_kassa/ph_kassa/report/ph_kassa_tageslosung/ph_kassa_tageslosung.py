"""PH Kassa Tageslosung – Übergabe an den Steuerberater (Report-Export CSV für BMD/RZL/DATEV): je Tag und Kasse
Erlös je Steuersatz (UVA-Abgrenzung wie PH UVA Auswertung), Verrechnungen ohne Umsatz und Zahlungseingang je Zahlart.
Kassenbuch und DEP bleiben die Originalaufzeichnung (RKSV); diese Liste ist die Buchungsgrundlage „Kassa an Erlös“."""

from frappe import _

from ph_kassa.auswertung import belege_zeitraum, zeitraum_filter

SATZ = {2000: "20", 1000: "10", 1300: "13", 1900: "19", 0: "0"}


def execute(filters=None):
    from ph_faktura.rechenwerk import uva

    filters, von, bis = zeitraum_filter(filters)
    tage = {}
    for b in belege_zeitraum(von, bis, filters.get("kasse")):
        tage.setdefault((b["datum"], b["kasse"]), []).append(b)
    data = []
    for (tag, kasse), belege in sorted(tage.items()):
        k = uva.kassa_umsaetze(belege)
        for satz, w in sorted(k["je_satz"].items(), key=lambda x: -x[0]):
            data.append({"datum": tag, "kasse": kasse, "zeile": _("Erlös {0} %").format(SATZ.get(satz, satz / 100)), "satz": SATZ.get(satz), "netto_cent": w["netto_cent"], "ust_cent": w["ust_cent"], "brutto_cent": w["brutto_cent"]})
        for grund, brutto in k["nicht_umsatz"].items():
            data.append({"datum": tag, "kasse": kasse, "zeile": _("Verrechnung: {0}").format(uva.GRUENDE.get(grund, grund)), "brutto_cent": brutto})
        za = {}
        for b in belege:
            for z in b["zahlarten"]:
                za[z.zahlart] = za.get(z.zahlart, 0) + int(z.betrag_cent or 0)
        for art, betrag in sorted(za.items()):
            data.append({"datum": tag, "kasse": kasse, "zeile": _("Zahlung {0}").format(art), "brutto_cent": betrag})
    columns = [
        {"fieldname": "datum", "label": _("Datum"), "fieldtype": "Date", "width": 100},
        {"fieldname": "kasse", "label": _("Kasse"), "fieldtype": "Link", "options": "PH Kasse", "width": 110},
        {"fieldname": "zeile", "label": _("Zeile"), "fieldtype": "Data", "width": 320},
        {"fieldname": "satz", "label": _("USt %"), "fieldtype": "Data", "width": 70},
        {"fieldname": "netto_cent", "label": _("Netto (Cent)"), "fieldtype": "Int", "width": 120},
        {"fieldname": "ust_cent", "label": _("USt (Cent)"), "fieldtype": "Int", "width": 110},
        {"fieldname": "brutto_cent", "label": _("Brutto (Cent)"), "fieldtype": "Int", "width": 120},
    ]
    return columns, data, _("Konten je Zeile ordnet die Kanzlei zu (Kontenrahmen BMD/RZL/DATEV) – Steuercodes wie Faktura-Export.")
