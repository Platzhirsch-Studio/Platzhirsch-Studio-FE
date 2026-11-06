frappe.listview_settings["PH Wunschliste"] = {
	add_fields: ["status", "anzahl_reserviert"],
	filters: [["status", "=", "Aktiv"]],
	get_indicator(doc) {
		return doc.status === "Aktiv" ? [__("Aktiv"), "green", "status,=,Aktiv"] : [__("Widerrufen"), "gray", "status,=,Widerrufen"];
	},
};
