// Listenansicht PH Bewerbung: Statusfarben, Standardfilter „offen“, Löschfrist-Markierung.
frappe.listview_settings["PH Bewerbung"] = {
	add_fields: ["status", "stelle", "eingang", "loeschfrist", "pseudonymisiert"],
	filters: [["status", "in", ["Eingegangen", "Gesichtet", "Gespraech", "Angebot"]]],
	get_indicator(doc) {
		const farben = { Eingegangen: "blue", Gesichtet: "cyan", Gespraech: "purple", Angebot: "orange", Eingestellt: "green", Abgesagt: "gray", Zurueckgezogen: "red" };
		const label = { Gespraech: "Gespräch", Zurueckgezogen: "Zurückgezogen" };
		if (doc.pseudonymisiert) return [__("Gelöscht"), "gray", "pseudonymisiert,=,1"];
		if (doc.loeschfrist && frappe.datetime.get_diff(doc.loeschfrist, frappe.datetime.get_today()) <= 0) return [__("Löschfrist fällig"), "red", "loeschfrist,<=,Today"];
		return [__(label[doc.status] || doc.status), farben[doc.status] || "gray", `status,=,${doc.status}`];
	},
};
