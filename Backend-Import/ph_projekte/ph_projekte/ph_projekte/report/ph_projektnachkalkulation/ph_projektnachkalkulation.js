frappe.query_reports["PH Projektnachkalkulation"] = {
	filters: [
		{ fieldname: "projekt", label: __("Projekt"), fieldtype: "Link", options: "PH Projekt" },
		{ fieldname: "status", label: __("Phase (leer = laufend)"), fieldtype: "Select", options: ["", "Auftrag", "Bestellung", "Lieferung", "Montage", "Uebergabe", "Abgeschlossen"] },
		{ fieldname: "projektart", label: __("Projektart"), fieldtype: "Select", options: ["", "Wohnung", "Haus", "Kueche", "Bad", "Hotel", "Objekt", "Yacht", "Outdoor", "Sonstiges"] },
		{ fieldname: "berater", label: __("Berater"), fieldtype: "Link", options: "User" },
		{ fieldname: "basis", label: __("DB-Basis"), fieldtype: "Select", options: ["Prognose", "Ist"], default: "Prognose" },
		{ fieldname: "nur_rot", label: __("Nur rote Projekte"), fieldtype: "Check" },
	],
	formatter(value, row, column, data, default_formatter) {
		value = default_formatter(value, row, column, data);
		if (column.fieldname === "ampel" && data) {
			const f = { "grün": "#15803d", gelb: "#b45309", rot: "#b91c1c" }[data.ampel];
			if (f) value = `<span style="color:${f};font-weight:600">${value}</span>`;
		}
		return value;
	},
};
