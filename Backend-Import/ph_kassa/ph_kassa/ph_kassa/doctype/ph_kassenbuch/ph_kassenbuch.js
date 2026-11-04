// PH Kassenbuch – unveränderliche Buchung; Storno per Gegenbuchung (Leitung).
frappe.ui.form.on("PH Kassenbuch", {
	refresh(frm) {
		frm.page.clear_indicator();
		if (frm.doc.status) frm.page.set_indicator(__(frm.doc.status), frm.doc.status === "Gebucht" ? "green" : "gray");
		if (frm.is_new()) return;
		frm.disable_form && frm.doc.status === "Storniert" && frm.disable_form();
		if (frm.doc.status === "Gebucht" && frappe.user.has_role("PH Kassa Leitung")) {
			frm.add_custom_button(__("Stornieren"), () => {
				frappe.prompt([{ fieldname: "grund", fieldtype: "Small Text", label: __("Grund"), reqd: 1 }], (v) => {
					frappe.confirm(__("Gegenbuchung über {0} anlegen?", [format_currency(frm.doc.betrag_cent / 100, "EUR")]), () => {
						frm.call({ method: "stornieren", doc: frm.doc, args: { grund: v.grund } }).then(() => frm.reload_doc());
					});
				}, __("Kassenbuch-Buchung stornieren"));
			}, __("Aktionen"));
		}
		if (frm.doc.beleg) frm.add_custom_button(__("Beleg öffnen"), () => frappe.set_route("Form", "PH Kassenbeleg", frm.doc.beleg));
		if (frm.doc.kassenabschluss) frm.add_custom_button(__("Abschluss öffnen"), () => frappe.set_route("Form", "PH Kassenabschluss", frm.doc.kassenabschluss));
	},
});
