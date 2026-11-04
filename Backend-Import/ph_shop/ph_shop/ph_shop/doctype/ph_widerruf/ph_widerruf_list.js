frappe.listview_settings["PH Widerruf"] = {
	add_fields: ["status", "zugeordnet", "erstattung_bis", "eingegangen_am"],
	filters: [["status", "in", ["Eingegangen", "Bestaetigt", "Ware erwartet", "Ware erhalten"]]],
	get_indicator(doc) {
		const farben = { Eingegangen: "blue", Bestaetigt: "cyan", "Ware erwartet": "orange", "Ware erhalten": "purple", Erstattet: "green", Abgelehnt: "red" };
		return [__(doc.status), farben[doc.status] || "gray", `status,=,${doc.status}`];
	},
};
