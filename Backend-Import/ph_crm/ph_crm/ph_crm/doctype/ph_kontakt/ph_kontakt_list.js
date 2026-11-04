frappe.listview_settings["PH Kontakt"] = {
	add_fields: ["status", "kontaktart", "nicht_kontaktieren", "portal_aktiv"],
	filters: [["status", "in", ["Interessent", "Kunde"]]],
	get_indicator(doc) {
		const farben = { Interessent: "blue", Kunde: "green", Inaktiv: "gray", Gesperrt: "red" };
		return [__(doc.status), farben[doc.status] || "gray", `status,=,${doc.status}`];
	},
	formatters: {
		titel(value, df, doc) {
			const marker = doc.nicht_kontaktieren ? ' <span class="indicator-pill red" title="Nicht kontaktieren">⊘</span>' : "";
			return frappe.utils.escape_html(value || "") + marker;
		},
	},
};
