// Listenansicht: Statusfarben und Standardfilter „offen“.
frappe.listview_settings["PH Anfrage"] = {
	add_fields: ["status", "art", "eingang", "prioritaet"],
	filters: [["status", "in", ["Neu", "Qualifiziert", "Termin vereinbart", "Angebot"]]],
	get_indicator(doc) {
		const farben = { Neu: "blue", Qualifiziert: "cyan", "Termin vereinbart": "purple", Angebot: "orange", Gewonnen: "green", Verloren: "gray", Spam: "red" };
		return [__(doc.status), farben[doc.status] || "gray", `status,=,${doc.status}`];
	},
};
