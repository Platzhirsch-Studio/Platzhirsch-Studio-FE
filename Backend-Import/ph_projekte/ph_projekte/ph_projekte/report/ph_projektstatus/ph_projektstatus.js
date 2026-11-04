frappe.query_reports["PH Projektstatus"] = {
	filters: [
		{ fieldname: "status", label: __("Phase"), fieldtype: "Select", options: ["", "Anfrage", "Planung", "Angebot", "Auftrag", "Bestellung", "Lieferung", "Montage", "Uebergabe", "Abgeschlossen", "Abgebrochen"] },
		{ fieldname: "projektart", label: __("Projektart"), fieldtype: "Select", options: ["", "Wohnung", "Haus", "Kueche", "Bad", "Hotel", "Objekt", "Yacht", "Outdoor", "Sonstiges"] },
		{ fieldname: "berater", label: __("Berater"), fieldtype: "Link", options: "User" },
		{ fieldname: "mit_abgeschlossenen", label: __("Abgeschlossene einbeziehen"), fieldtype: "Check", default: 0 },
	],
	formatter(value, row, column, data, default_formatter) {
		value = default_formatter(value, row, column, data);
		if (column.fieldname === "maengel_offen" && data && data.maengel_offen > 0) value = `<span style="color:#b91c1c;font-weight:600">${value}</span>`;
		if (column.fieldname === "feedback_offen" && data && data.feedback_offen > 0) value = `<span style="color:#b45309;font-weight:600">${value}</span>`;
		return value;
	},
};
