frappe.ui.form.on("PH Datei Freigabelink", {
	refresh(frm) {
		if (frm.is_new() || frm.doc.status !== "Aktiv") return;
		frm.add_custom_button(__("Widerrufen"), () =>
			frappe.confirm(__("Link sofort ungültig machen?"), () =>
				frm.call({ method: "widerrufen", doc: frm.doc }).then(() => frm.reload_doc())), __("Aktionen"));
	},
});
