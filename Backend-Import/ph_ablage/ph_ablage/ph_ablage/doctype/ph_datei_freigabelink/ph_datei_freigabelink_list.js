frappe.listview_settings["PH Datei Freigabelink"] = {
	add_fields: ["status"],
	filters: [["status", "=", "Aktiv"]],
	get_indicator(doc) {
		const f = { Aktiv: "green", Abgelaufen: "gray", Aufgebraucht: "orange", Widerrufen: "red" };
		return [__(doc.status), f[doc.status] || "gray", "status,=," + doc.status];
	},
};
