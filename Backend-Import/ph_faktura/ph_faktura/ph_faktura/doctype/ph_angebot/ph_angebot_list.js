frappe.listview_settings["PH Angebot"] = {
	add_fields: ["status", "brutto_cent", "gueltig_bis"],
	filters: [["status", "in", ["Entwurf", "Gesendet"]]],
	get_indicator(doc) {
		return [__(doc.status), ph_faktura.farben[doc.status] || "gray", `status,=,${doc.status}`];
	},
	formatters: { brutto_cent: (v) => ph_faktura.betrag(v) },
};
