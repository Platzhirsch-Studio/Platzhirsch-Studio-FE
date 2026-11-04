frappe.listview_settings["PH Terminart"] = {
	add_fields: ["aktiv", "modus", "bestaetigung"],
	get_indicator(doc) {
		return doc.aktiv ? [__("Aktiv"), "green", "aktiv,=,1"] : [__("Inaktiv"), "gray", "aktiv,=,0"];
	},
};
