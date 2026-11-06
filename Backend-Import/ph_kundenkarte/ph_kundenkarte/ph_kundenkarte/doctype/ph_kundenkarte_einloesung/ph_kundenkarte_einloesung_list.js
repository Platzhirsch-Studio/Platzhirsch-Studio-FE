frappe.listview_settings["PH Kundenkarte Einloesung"] = {
	add_fields: ["status", "vorteil", "ort"],
	get_indicator(doc) {
		return [__(doc.status), doc.status === "Eingeloest" ? "green" : "red", `status,=,${doc.status}`];
	},
};
