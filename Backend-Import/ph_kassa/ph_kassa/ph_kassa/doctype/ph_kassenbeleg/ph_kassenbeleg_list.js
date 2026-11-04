// Listenansicht PH Kassenbeleg: Statusfarben, Standardfilter heute.
frappe.listview_settings["PH Kassenbeleg"] = {
	add_fields: ["status", "belegart", "trainings", "see_ausgefallen", "gesamt_cent"],
	filters: [["datum_uhrzeit", ">=", frappe.datetime.add_days(frappe.datetime.get_today(), -7)]],
	get_indicator(doc) {
		const farben = { Entwurf: "gray", Signiert: "green", Ausfall: "orange", Nachsigniert: "blue", Storniert: "red" };
		const text = doc.trainings ? __("Training") : __(doc.status);
		return [text, doc.trainings ? "orange" : farben[doc.status] || "gray", `status,=,${doc.status}`];
	},
	formatters: {
		gesamt_cent(v) {
			return format_currency((v || 0) / 100, "EUR");
		},
	},
};
