frappe.listview_settings["PH Projekt Aufgabe"] = {
	add_fields: ["status", "faellig", "prioritaet"],
	filters: [["status", "in", ["Offen", "In Arbeit"]]],
	get_indicator(doc) {
		const farben = { Offen: "blue", "In Arbeit": "orange", Erledigt: "green", Verworfen: "gray" };
		return [__(doc.status), farben[doc.status] || "gray", `status,=,${doc.status}`];
	},
};
