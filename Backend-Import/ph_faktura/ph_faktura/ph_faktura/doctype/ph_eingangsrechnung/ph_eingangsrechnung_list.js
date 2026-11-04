frappe.listview_settings["PH Eingangsrechnung"] = {
	add_fields: ["status", "brutto_cent", "faellig", "zahllauf"],
	filters: [["status", "in", ["Erfasst", "Sachlich geprueft", "Freigegeben"]]],
	get_indicator(doc) {
		return [__(ph_faktura.status_label[doc.status] || doc.status), ph_faktura.farben[doc.status] || "gray", `status,=,${doc.status}`];
	},
	formatters: { brutto_cent: (v) => ph_faktura.betrag(v) },
};
