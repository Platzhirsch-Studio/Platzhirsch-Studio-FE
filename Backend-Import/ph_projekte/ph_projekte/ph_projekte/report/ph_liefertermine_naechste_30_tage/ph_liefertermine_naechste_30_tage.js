frappe.query_reports["PH Liefertermine naechste 30 Tage"] = {
	filters: [
		{ fieldname: "von", label: __("Von"), fieldtype: "Date", default: frappe.datetime.get_today(), reqd: 1 },
		{ fieldname: "bis", label: __("Bis"), fieldtype: "Date", default: frappe.datetime.add_days(frappe.datetime.get_today(), 30), reqd: 1 },
		{ fieldname: "projekt", label: __("Projekt"), fieldtype: "Link", options: "PH Projekt" },
	],
	formatter(value, row, column, data, default_formatter) {
		value = default_formatter(value, row, column, data);
		if (column.fieldname === "art" && data) {
			const farbe = { Lieferung: "#1d4ed8", Montage: "#b45309", Wareneingang: "#15803d" }[data.art] || "#8a7a66";
			value = `<span style="color:${farbe};font-weight:600">${value}</span>`;
		}
		return value;
	},
};
