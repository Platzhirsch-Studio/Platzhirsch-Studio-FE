frappe.listview_settings["PH Gutschein"] = {
	add_fields: ["status", "wert_cent", "rest_cent", "test", "code_letzte4"],
	filters: [["status", "in", ["Aktiv", "Teilweise eingeloest"]]],
	get_indicator(doc) {
		const farben = { Erstellt: "blue", Aktiv: "green", "Teilweise eingeloest": "orange", Eingeloest: "gray", Gesperrt: "red", Abgelaufen: "gray", Erstattet: "gray" };
		return [__(doc.status), farben[doc.status] || "gray", `status,=,${doc.status}`];
	},
	formatters: {
		rest_cent: (v) => format_currency((v || 0) / 100, "EUR"),
		wert_cent: (v) => format_currency((v || 0) / 100, "EUR"),
	},
};
