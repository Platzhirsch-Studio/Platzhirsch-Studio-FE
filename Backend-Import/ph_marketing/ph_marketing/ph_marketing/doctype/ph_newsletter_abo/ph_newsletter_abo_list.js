frappe.listview_settings["PH Newsletter Abo"] = {
	add_fields: ["status", "quelle", "angemeldet_am", "altbestand_ohne_doi"],
	filters: [["status", "in", ["Angemeldet unbestaetigt", "Aktiv"]]],
	get_indicator(doc) {
		const farben = { "Angemeldet unbestaetigt": "orange", Aktiv: "green", Abgemeldet: "gray", Bounce: "red", Beschwerde: "red" };
		return [__(doc.status), farben[doc.status] || "gray", `status,=,${doc.status}`];
	},
};
