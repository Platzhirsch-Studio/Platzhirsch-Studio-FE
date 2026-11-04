frappe.listview_settings["PH Kampagne"] = {
	add_fields: ["status", "kanal", "zeitraum_von", "zeitraum_bis"],
	filters: [["status", "in", ["Entwurf", "Aktiv", "Pausiert"]]],
	get_indicator(doc) {
		const farben = { Entwurf: "gray", Aktiv: "green", Pausiert: "orange", Beendet: "blue" };
		return [__(doc.status), farben[doc.status] || "gray", `status,=,${doc.status}`];
	},
};
