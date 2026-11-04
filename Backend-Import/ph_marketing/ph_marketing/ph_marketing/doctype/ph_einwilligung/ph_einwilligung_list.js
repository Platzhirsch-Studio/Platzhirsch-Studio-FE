frappe.listview_settings["PH Einwilligung"] = {
	add_fields: ["status", "zweck", "zeitpunkt"],
	get_indicator(doc) {
		const farben = { Offen: "orange", Bestaetigt: "green", Widerrufen: "gray", Abgelaufen: "red" };
		return [__(doc.status), farben[doc.status] || "gray", `status,=,${doc.status}`];
	},
};
