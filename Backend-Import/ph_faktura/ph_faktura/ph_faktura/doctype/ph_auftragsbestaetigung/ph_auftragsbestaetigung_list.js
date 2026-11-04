frappe.listview_settings["PH Auftragsbestaetigung"] = {
	add_fields: ["status", "auftragswert_cent", "offen_cent", "liefertermin_geplant"],
	filters: [["status", "in", ["Offen", "In Bestellung", "Teilgeliefert", "Geliefert"]]],
	get_indicator(doc) {
		return [__(doc.status), ph_faktura.farben[doc.status] || "gray", `status,=,${doc.status}`];
	},
	formatters: { auftragswert_cent: (v) => ph_faktura.betrag(v), offen_cent: (v) => ph_faktura.betrag(v) },
};
