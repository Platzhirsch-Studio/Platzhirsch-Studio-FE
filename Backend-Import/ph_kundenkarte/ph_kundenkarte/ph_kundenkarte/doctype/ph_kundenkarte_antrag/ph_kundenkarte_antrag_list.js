frappe.listview_settings["PH Kundenkarte Antrag"] = {
	add_fields: ["status", "quelle", "doi_noetig"],
	filters: [["status", "in", ["Neu", "Bestaetigt"]]],
	get_indicator(doc) {
		const f = { Neu: "blue", Bestaetigt: "cyan", Angenommen: "green", Abgelehnt: "red", Doppelt: "gray" };
		return [__(doc.status), f[doc.status] || "gray", `status,=,${doc.status}`];
	},
};
