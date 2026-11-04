frappe.listview_settings["PH Beratungsgespraech"] = {
	add_fields: ["status", "datum", "berater", "budget_gesamt_cent"],
	filters: [["status", "!=", "Abgeschlossen"]],
	get_indicator(doc) {
		const farben = { Offen: "orange", "Planung beauftragt": "blue", Angebot: "purple", Abgeschlossen: "green" };
		return [__(doc.status), farben[doc.status] || "gray", `status,=,${doc.status}`];
	},
};
