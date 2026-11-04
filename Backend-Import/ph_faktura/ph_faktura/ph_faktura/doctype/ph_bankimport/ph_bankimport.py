"""PH Bankimport – CAMT.053-Datei einlesen, Umsätze anlegen (ohne Doppelte), Vorschläge, Auto-Zuordnung bei Referenztreffer."""

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import cint, now_datetime

from ph_faktura.rechenwerk import camt


class PHBankimport(Document):
    def before_insert(self):
        self.status = "Neu"

    def validate(self):
        self.titel = f"{self.konto} {self.zeitraum_von or ''}–{self.zeitraum_bis or ''}".strip()[:140]

    @frappe.whitelist()
    def importieren(self, auto_zuordnen=1):
        """Button „Importieren“: Datei parsen, PH Bankumsatz je Transaktion, Vorschläge berechnen,
        bei Trefferqualität 100 (Zahlungsreferenz) automatisch zuordnen."""
        self.check_permission("write")
        if self.status == "Importiert":
            frappe.throw(_("Diese Datei wurde bereits importiert."))
        datei = frappe.get_doc("File", {"file_url": self.datei})
        inhalt = datei.get_content()
        if isinstance(inhalt, bytes):
            inhalt = inhalt.decode("utf-8", errors="replace")
        try:
            e = camt.parse(inhalt)
        except Exception as ex:  # noqa: BLE001
            self.db_set({"status": "Fehler", "protokoll": f"Parser: {ex}"[:5000]})
            frappe.throw(_("CAMT.053 konnte nicht gelesen werden: {0}").format(ex))
        konto_iban = frappe.db.get_value("PH Bankkonto", self.konto, "iban") or ""
        protokoll = []
        if e["iban"] and konto_iban and e["iban"].replace(" ", "") != konto_iban.replace(" ", ""):
            protokoll.append(_("Achtung: IBAN der Datei ({0}) weicht vom Bankkonto ab ({1}).").format(e["iban"], konto_iban))
        neu = doppelt = vorschlag = zugeordnet = 0
        for u in e["umsaetze"]:
            if frappe.db.exists("PH Bankumsatz", {"camt_ref": u["camt_ref"]}):
                doppelt += 1
                continue
            doc = frappe.get_doc({"doctype": "PH Bankumsatz", "konto": self.konto, "import": self.name, "buchungsdatum": u["buchungsdatum"], "valuta": u["valuta"] or u["buchungsdatum"],
                                  "betrag_cent": u["betrag_cent"], "waehrung": u["waehrung"] or "EUR", "auftraggeber": u["auftraggeber"], "iban_gegen": u["iban_gegen"], "bic_gegen": u["bic_gegen"],
                                  "verwendungszweck": u["verwendungszweck"], "end_to_end_id": u["end_to_end_id"], "mandatsreferenz": u["mandatsreferenz"], "camt_ref": u["camt_ref"]})
            doc.insert(ignore_permissions=True)
            neu += 1
            if doc.vorschlag_beleg:
                vorschlag += 1
                if cint(auto_zuordnen) and cint(doc.vorschlag_sicherheit) >= 100:
                    try:
                        doc.zuordnen()
                        zugeordnet += 1
                    except Exception as ex:  # noqa: BLE001
                        protokoll.append(f"{doc.name}: automatische Zuordnung fehlgeschlagen ({ex})")
                        frappe.log_error(title=f"PH Bankimport {self.name}: Auto-Zuordnung {doc.name}")
        protokoll.insert(0, _("{0} Umsätze in Datei, {1} neu, {2} bereits vorhanden, {3} mit Vorschlag, {4} automatisch zugeordnet.").format(len(e["umsaetze"]), neu, doppelt, vorschlag, zugeordnet))
        self.db_set({
            "status": "Importiert", "zeitraum_von": e["von"], "zeitraum_bis": e["bis"], "saldo_start_cent": e["saldo_start_cent"] or 0, "saldo_ende_cent": e["saldo_ende_cent"] or 0,
            "anzahl": len(e["umsaetze"]), "anzahl_neu": neu, "anzahl_doppelt": doppelt, "anzahl_vorschlag": vorschlag, "anzahl_zugeordnet": zugeordnet, "importiert_am": now_datetime(),
            "protokoll": "\n".join(protokoll)[:20000], "titel": f"{self.konto} {e['von'] or ''}–{e['bis'] or ''}",
        })
        if e["saldo_ende_cent"] is not None:
            frappe.db.set_value("PH Bankkonto", self.konto, {"letzter_import": e["bis"], "saldo_cent": e["saldo_ende_cent"]}, update_modified=False)
        return {"neu": neu, "doppelt": doppelt, "vorschlag": vorschlag, "zugeordnet": zugeordnet}
