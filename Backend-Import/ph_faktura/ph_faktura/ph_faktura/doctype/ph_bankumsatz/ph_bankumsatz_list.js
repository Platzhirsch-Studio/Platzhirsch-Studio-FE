frappe.listview_settings["PH Bankumsatz"] = {
	add_fields: ["status", "betrag_cent", "richtung", "vorschlag_beleg"],
	filters: [["status", "in", ["Offen", "Teilweise"]]],
	get_indicator(doc) {
		return [__(doc.status), ph_faktura.farben[doc.status] || "gray", `status,=,${doc.status}`];
	},
	formatters: { betrag_cent: (v) => `<span style="color:${v < 0 ? "#b91c1c" : "#15803d"}">${ph_faktura.betrag(v)}</span>` },
};
