frappe.listview_settings["PH Lagerbestand"] = {
	add_fields: ["status", "lagerort", "menge", "verfuegbar", "ausstellungsstueck"],
	filters: [["status", "in", ["Verfuegbar", "Reserviert"]]],
	get_indicator(doc) {
		const farben = { Verfuegbar: "green", Reserviert: "orange", Verkauft: "blue", Ausgeschieden: "gray" };
		return [__(doc.status), farben[doc.status] || "gray", `status,=,${doc.status}`];
	},
};
