frappe.listview_settings["PH Inventur"] = {
	add_fields: ["status", "lagerort", "datum", "differenz_positionen"],
	filters: [["status", "in", ["Geplant", "Laufend"]]],
	get_indicator(doc) {
		const farben = { Geplant: "blue", Laufend: "orange", Abgeschlossen: "green", Verworfen: "gray" };
		return [__(doc.status), farben[doc.status] || "gray", `status,=,${doc.status}`];
	},
};
