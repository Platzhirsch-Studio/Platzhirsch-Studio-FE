frappe.listview_settings["PH Event"] = {
	add_fields: ["status", "datum", "plaetze_belegt", "kapazitaet"],
	filters: [["status", "in", ["Geplant", "Offen", "Ausgebucht"]]],
	get_indicator(doc) {
		const farben = { Geplant: "gray", Offen: "green", Ausgebucht: "orange", Durchgefuehrt: "blue", Abgesagt: "red" };
		return [__(doc.status), farben[doc.status] || "gray", `status,=,${doc.status}`];
	},
};
