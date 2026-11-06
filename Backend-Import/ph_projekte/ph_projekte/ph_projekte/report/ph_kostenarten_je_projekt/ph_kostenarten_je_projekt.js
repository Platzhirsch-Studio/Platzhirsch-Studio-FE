frappe.query_reports["PH Kostenarten je Projekt"] = {
	filters: [
		{ fieldname: "projekt", label: __("Projekt"), fieldtype: "Link", options: "PH Projekt" },
		{ fieldname: "kostenart", label: __("Kostenart"), fieldtype: "Link", options: "PH Kostenart" },
		{ fieldname: "status", label: __("Phase (leer = laufend)"), fieldtype: "Select", options: ["", "Auftrag", "Bestellung", "Lieferung", "Montage", "Uebergabe", "Abgeschlossen"] },
		{ fieldname: "projektart", label: __("Projektart"), fieldtype: "Select", options: ["", "Wohnung", "Haus", "Kueche", "Bad", "Hotel", "Objekt", "Yacht", "Outdoor", "Sonstiges"] },
	],
	formatter(value, row, column, data, default_formatter) {
		value = default_formatter(value, row, column, data);
		if (column.fieldname === "ampel" && data) {
			const f = { gruen: "#15803d", gelb: "#b45309", rot: "#b91c1c" }[(data.ampel || "").toLowerCase()];
			if (f) value = `<span style="color:${f};font-weight:600">${value}</span>`;
		}
		return value;
	},
};
