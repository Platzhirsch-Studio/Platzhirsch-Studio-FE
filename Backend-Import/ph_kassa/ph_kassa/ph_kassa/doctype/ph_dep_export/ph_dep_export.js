// PH DEP Export – Datei laden, Prüfsumme prüfen.
frappe.ui.form.on("PH DEP Export", {
	refresh(frm) {
		if (frm.is_new()) {
			frm.dashboard.set_headline_alert(__("DEP-Exporte werden über PH Kasse → „DEP exportieren“ erzeugt."), "blue");
			return;
		}
		if (frm.doc.datei) frm.add_custom_button(__("Datei öffnen"), () => window.open(frm.doc.datei, "_blank"), __("Aktionen"));
		frm.add_custom_button(__("Prüfsumme prüfen"), () => {
			frm.call({ method: "pruefsumme_pruefen", doc: frm.doc }).then((r) => {
				if (r.message) frappe.msgprint({ title: __("Prüfsumme"), indicator: r.message.ok ? "green" : "red", message: r.message.ok ? __("Datei unverändert.") : __("Datei weicht von der gespeicherten Prüfsumme ab!") });
			});
		}, __("Aktionen"));
	},
});
