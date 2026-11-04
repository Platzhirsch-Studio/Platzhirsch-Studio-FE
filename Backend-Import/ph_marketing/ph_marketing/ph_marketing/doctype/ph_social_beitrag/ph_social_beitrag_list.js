frappe.listview_settings["PH Social Beitrag"] = {
	add_fields: ["status", "kanal", "datum_geplant", "bildquelle_freigabe"],
	filters: [["status", "not in", ["Veroeffentlicht", "Verworfen"]]],
	get_indicator(doc) {
		const farben = { Idee: "gray", Entwurf: "blue", Freigegeben: "cyan", Geplant: "purple", Veroeffentlicht: "green", Verworfen: "red" };
		return [__(doc.status), farben[doc.status] || "gray", `status,=,${doc.status}`];
	},
};
