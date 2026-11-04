frappe.listview_settings["PH Verfuegbarkeit"] = {
	add_fields: ["aktiv", "modus"],
	filters: [["aktiv", "=", 1]],
	get_indicator(doc) {
		return doc.aktiv ? [__("Aktiv"), "green", "aktiv,=,1"] : [__("Inaktiv"), "gray", "aktiv,=,0"];
	},
};
