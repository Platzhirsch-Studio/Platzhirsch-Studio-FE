frappe.listview_settings["PH Montageauftrag"] = {
	add_fields: ["status", "start", "montageleiter", "projekt"],
	filters: [["status", "not in", ["Abgenommen", "Abgebrochen"]]],
	get_indicator(doc) {
		const farben = { Geplant: "blue", Unterwegs: "cyan", "In Arbeit": "orange", Erledigt: "green", Abgenommen: "green", Abgebrochen: "red" };
		return [__(doc.status), farben[doc.status] || "gray", `status,=,${doc.status}`];
	},
};
