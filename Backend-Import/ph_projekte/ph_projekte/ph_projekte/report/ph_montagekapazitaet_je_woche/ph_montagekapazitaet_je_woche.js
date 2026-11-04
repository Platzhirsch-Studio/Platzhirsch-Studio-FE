frappe.query_reports["PH Montagekapazitaet je Woche"] = {
	filters: [
		{ fieldname: "von", label: __("Von"), fieldtype: "Date", default: frappe.datetime.get_today(), reqd: 1 },
		{ fieldname: "bis", label: __("Bis"), fieldtype: "Date", default: frappe.datetime.add_days(frappe.datetime.get_today(), 56), reqd: 1 },
		{ fieldname: "monteure", label: __("Monteure (Kapazität)"), fieldtype: "Int", default: 2 },
	],
	formatter(value, row, column, data, default_formatter) {
		value = default_formatter(value, row, column, data);
		if (column.fieldname === "auslastung" && data) {
			const farbe = data.auslastung > 100 ? "#b91c1c" : data.auslastung > 80 ? "#b45309" : "#15803d";
			value = `<span style="color:${farbe};font-weight:600">${value}</span>`;
		}
		return value;
	},
};
