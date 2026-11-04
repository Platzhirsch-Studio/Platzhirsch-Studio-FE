frappe.listview_settings["PH Kassenabschluss"] = {
	add_fields: ["status", "kasse", "datum", "differenz_cent"],
	filters: [["status", "in", ["Offen", "Gezaehlt", "Korrigiert"]]],
	get_indicator(doc) {
		const farben = { Offen: "blue", Gezaehlt: "orange", Abgeschlossen: "green", Korrigiert: "purple" };
		return [__(doc.status), farben[doc.status] || "gray", `status,=,${doc.status}`];
	},
};
