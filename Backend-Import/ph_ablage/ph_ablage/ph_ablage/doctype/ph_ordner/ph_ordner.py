"""PH Ordner – Baum (Nested Set) der Ablage. Bezug und wirksamer Rechte-Modus werden vom Elternordner geerbt
und auf Unterordner/Dateien übertragen (denormalisiert für Desk-Listen und schnelle Prüfungen)."""

import frappe
from frappe import _
from frappe.utils.nestedset import NestedSet

from ph_ablage.utils import regeln


class PHOrdner(NestedSet):
    nsm_parent_field = "parent_ph_ordner"

    def validate(self):
        self.titel = " ".join(str(self.titel or "").replace("/", "-").replace(">", "-").split())[:140]
        if not self.titel:
            frappe.throw(_("Ordnername fehlt."))
        self.is_group = 1
        if self.rechte_modus and self.rechte_modus not in regeln.MODI:
            frappe.throw(_("Rechte-Modus {0} ist unbekannt.").format(self.rechte_modus))
        eltern = frappe.db.get_value("PH Ordner", self.parent_ph_ordner, ["name", "bezug_doctype", "bezug_name", "effektiver_modus", "pfad"], as_dict=True) if self.parent_ph_ordner else None
        if self.parent_ph_ordner and not eltern:
            frappe.throw(_("Übergeordneter Ordner {0} existiert nicht.").format(self.parent_ph_ordner))
        self._bezug_pruefen(eltern)
        self.effektiver_modus = regeln.effektiver_modus([eltern.effektiver_modus if eltern else None, self.rechte_modus])
        self.pfad = (f"{eltern.pfad or ''} / {self.titel}" if eltern else self.titel).strip(" /")[:500]
        if self.bezug_name and (not self.bezug_titel or self.has_value_changed("bezug_name")):
            from ph_ablage.ph_ablage.dienste import bezug_titel

            self.bezug_titel = bezug_titel(self.bezug_doctype, self.bezug_name)
        self._namensgleichheit()
        alt = self.get_doc_before_save()
        if alt and alt.geschuetzt and (alt.titel != self.titel or alt.parent_ph_ordner != self.parent_ph_ordner) and not self.flags.ph_system:
            from ph_ablage.ph_ablage.rechte import ist_leitung

            if not ist_leitung(self.bezug_doctype):
                frappe.throw(_("Vorlagenordner dürfen nur von der Leitung umbenannt oder verschoben werden."))

    def _bezug_pruefen(self, eltern):
        if self.bezug_doctype and self.bezug_doctype not in regeln.ERLAUBTE_BEZUEGE:
            frappe.throw(_("Bezug {0} ist nicht vorgesehen ({1}).").format(self.bezug_doctype, ", ".join(regeln.ERLAUBTE_BEZUEGE)))
        if not self.bezug_doctype:
            self.bezug_name = None
        if eltern and eltern.bezug_doctype:
            # Unterordner erben den Bezug; kein Mischen innerhalb eines Bezugs-Baums
            if self.bezug_doctype and self.bezug_doctype != eltern.bezug_doctype:
                frappe.throw(_("Unterordner gehören zum Bezug {0} des Elternordners.").format(eltern.bezug_doctype))
            self.bezug_doctype = eltern.bezug_doctype
            if eltern.bezug_name:
                if self.bezug_name and self.bezug_name != eltern.bezug_name and not self.flags.ph_system:
                    frappe.throw(_("Unterordner gehören zu {0} {1}.").format(eltern.bezug_doctype, eltern.bezug_name))
                self.bezug_name = eltern.bezug_name
        if self.bezug_name and frappe.db.exists("DocType", self.bezug_doctype) and not frappe.db.exists(self.bezug_doctype, self.bezug_name):
            frappe.throw(_("{0} {1} existiert nicht.").format(self.bezug_doctype, self.bezug_name))

    def _namensgleichheit(self):
        filters = {"titel": self.titel, "name": ("!=", self.name or "")}
        filters["parent_ph_ordner"] = self.parent_ph_ordner if self.parent_ph_ordner else ("is", "not set")
        if not self.parent_ph_ordner:
            filters["bezug_doctype"] = self.bezug_doctype or ("is", "not set")
            filters["bezug_name"] = self.bezug_name or ("is", "not set")
        if frappe.db.exists("PH Ordner", filters):
            frappe.throw(_("Im Zielordner gibt es bereits einen Ordner „{0}“.").format(self.titel), frappe.DuplicateEntryError)

    def on_update(self):
        super().on_update()
        alt = self.get_doc_before_save()
        if alt and (alt.effektiver_modus != self.effektiver_modus or alt.bezug_name != self.bezug_name or alt.bezug_doctype != self.bezug_doctype or alt.pfad != self.pfad):
            try:
                from ph_ablage.ph_ablage.dienste import unterbaum_aktualisieren

                unterbaum_aktualisieren(self.name)
            except Exception:  # noqa: BLE001 – Nebenwirkung, nie Fehler
                frappe.log_error(title=f"PH Ordner {self.name}: Unterbaum nicht aktualisiert")

    def on_trash(self):
        if frappe.db.exists("PH Datei", {"ordner": self.name}):
            frappe.throw(_("Der Ordner enthält Dateien (auch im Papierkorb) und kann nicht gelöscht werden."))
        if self.geschuetzt and not self.flags.ph_system:
            from ph_ablage.ph_ablage.rechte import ist_leitung

            if not ist_leitung(self.bezug_doctype):
                frappe.throw(_("Vorlagenordner dürfen nur von der Leitung gelöscht werden."))
        super().on_trash(allow_root_deletion=True)
