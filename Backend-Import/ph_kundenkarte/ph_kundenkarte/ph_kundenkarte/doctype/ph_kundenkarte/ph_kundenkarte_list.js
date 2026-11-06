frappe.listview_settings["PH Kundenkarte"] = {
	add_fields: ["status", "stufe", "einwilligung_auswertung"],
	filters: [["status", "in", ["Aktiv", "Gesperrt", "Beantragt"]]],
	get_indicator(doc) {
		const f = { Beantragt: "orange", Aktiv: "green", Gesperrt: "red", Gekuendigt: "gray" };
		return [__(doc.status), f[doc.status] || "gray", `status,=,${doc.status}`];
	},
};
