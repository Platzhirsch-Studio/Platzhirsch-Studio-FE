frappe.listview_settings["PH Rendering"] = {
	add_fields: ["status", "variante", "version", "ki_generiert", "feedback_offen"],
	filters: [["status", "not in", ["Verworfen"]]],
	get_indicator(doc) {
		const farben = { Entwurf: "gray", Vorgelegt: "blue", "Feedback offen": "orange", Freigegeben: "green", Verworfen: "red" };
		return [__(doc.status), farben[doc.status] || "gray", `status,=,${doc.status}`];
	},
};
