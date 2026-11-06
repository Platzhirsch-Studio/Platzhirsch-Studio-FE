frappe.ui.form.on("PH Kundenkarte Stufe", {
	refresh(frm) {
		if (frm.is_new()) return;
		frm.add_custom_button(__("Vorteilsübersicht drucken"), () => frm.print_doc("PH Kundenkarte Vorteilsuebersicht"), __("Drucken"));
		if (frm.doc.schwelle_jahresumsatz_cent) frm.dashboard.add_comment(__("Schwelle: {0} im Bewertungszeitraum", [format_currency(frm.doc.schwelle_jahresumsatz_cent / 100, "EUR")]), "blue", true);
	},
});
