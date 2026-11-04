// Listenansicht PH Abwesenheit: Statusfarben, Standardfilter „offen oder künftig“.
frappe.listview_settings["PH Abwesenheit"] = {
	add_fields: ["status", "art", "von", "bis", "tage"],
	filters: [["status", "in", ["Beantragt", "Genehmigt"]]],
	get_indicator(doc) {
		const farben = { Beantragt: "orange", Genehmigt: "green", Abgelehnt: "red", Storniert: "gray" };
		return [__(doc.status), farben[doc.status] || "gray", `status,=,${doc.status}`];
	},
};
