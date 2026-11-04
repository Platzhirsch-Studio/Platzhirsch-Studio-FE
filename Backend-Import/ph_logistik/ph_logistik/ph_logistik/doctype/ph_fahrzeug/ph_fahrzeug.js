frappe.ui.form.on("PH Fahrzeug", {
	refresh(frm) {
		if (frm.is_new()) return;
		frm.add_custom_button(__("Touren dieses Fahrzeugs"), () => frappe.set_route("List", "PH Tour", { fahrzeug: frm.doc.name }), __("Aktionen"));
		frm.add_custom_button(__("Neue Tour"), () => frappe.new_doc("PH Tour", { fahrzeug: frm.doc.name, fahrer: frm.doc.standard_fahrer, datum: frappe.datetime.get_today() }), __("Aktionen"));
	},
});
