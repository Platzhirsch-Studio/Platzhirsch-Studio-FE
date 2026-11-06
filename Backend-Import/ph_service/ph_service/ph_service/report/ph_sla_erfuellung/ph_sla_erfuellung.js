frappe.query_reports["PH SLA Erfuellung"] = {
	filters: [
		{ fieldname: "von", label: __("Von"), fieldtype: "Date", default: frappe.datetime.add_months(frappe.datetime.get_today(), -6) },
		{ fieldname: "bis", label: __("Bis"), fieldtype: "Date", default: frappe.datetime.get_today() },
		{ fieldname: "prioritaet", label: __("Priorität"), fieldtype: "Select", options: ["", "Niedrig", "Normal", "Hoch", "Dringend"] },
		{ fieldname: "verantwortlich", label: __("Verantwortlich"), fieldtype: "Link", options: "User" },
	],
	formatter(value, row, column, data, default_formatter) {
		value = default_formatter(value, row, column, data);
		if (["reaktion_quote", "loesung_quote"].includes(column.fieldname) && data && data[column.fieldname] !== null && data[column.fieldname] !== undefined) {
			const farbe = data[column.fieldname] >= 90 ? "#15803d" : data[column.fieldname] >= 75 ? "#b45309" : "#b91c1c";
			value = `<span style="color:${farbe};font-weight:600">${value}</span>`;
		}
		return value;
	},
};
