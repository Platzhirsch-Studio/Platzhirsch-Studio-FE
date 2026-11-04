frappe.ui.form.on("PH Lagerort", {
	refresh(frm) {
		if (frm.is_new()) return;
		frm.add_custom_button(__("Bestand anzeigen"), () => frappe.set_route("List", "PH Lagerbestand", { lagerort: frm.doc.name }), __("Aktionen"));
		frm.add_custom_button(__("Inventur anlegen"), () => frappe.new_doc("PH Inventur", { lagerort: frm.doc.name, datum: frappe.datetime.get_today() }), __("Aktionen"));
		frm.add_custom_button(__("Bestandsliste (Report)"), () => frappe.set_route("query-report", "PH Bestandsliste", { lagerort: frm.doc.name }), __("Aktionen"));
	},
});
