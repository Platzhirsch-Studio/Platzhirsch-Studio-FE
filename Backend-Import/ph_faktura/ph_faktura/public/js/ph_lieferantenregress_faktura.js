// ph_faktura (doctype_js – ph_service wird nach ph_faktura installiert): Lieferanten-Gutschrift (Eingangsseite) zum Regress erfassen (Integration Runde 3)
frappe.ui.form.on("PH Lieferantenregress", {
	refresh(frm) {
		if (frm.is_new()) return;
		if (frm.doc.eingangsrechnung) frm.add_custom_button(__("Lieferanten-Gutschrift öffnen"), () => frappe.set_route("Form", "PH Eingangsrechnung", frm.doc.eingangsrechnung), __("Faktura"));
		if (["Gemeldet", "Anerkannt"].includes(frm.doc.status)) {
			frm.add_custom_button(__("Lieferanten-Gutschrift erfassen"), () => frappe.new_doc("PH Eingangsrechnung", { belegart: "Gutschrift", lieferant: frm.doc.lieferant, lieferantenregress: frm.doc.name, rechnungsnummer_lieferant: frm.doc.gutschrift_nummer || "" }), __("Faktura"));
		}
	},
});
