frappe.query_reports["PH Reaktionszeiten"] = {
	filters: [
		{ fieldname: "von", label: __("Von"), fieldtype: "Date", default: frappe.datetime.add_months(frappe.datetime.get_today(), -3), reqd: 1 },
		{ fieldname: "bis", label: __("Bis"), fieldtype: "Date", default: frappe.datetime.get_today(), reqd: 1 },
		{ fieldname: "nach", label: __("Gruppieren nach"), fieldtype: "Select", options: ["Woche", "Zuständig", "Quelle", "Art"], default: "Woche" },
		{ fieldname: "zugewiesen_an", label: __("Zuständig"), fieldtype: "Link", options: "User" },
		{ fieldname: "ziel_h", label: __("Ziel (Stunden)"), fieldtype: "Int", default: 24 },
	],
	formatter(value, row, column, data, default_formatter) {
		value = default_formatter(value, row, column, data);
		if (column.fieldname === "ueber_ziel" && data && data.ueber_ziel > 0) value = `<span style="color:#b91c1c;font-weight:600">${value}</span>`;
		if (column.fieldname === "reaktion_h" && data && data.reaktion_h != null) {
			const ziel = (frappe.query_report.get_filter_value("ziel_h") || 24);
			value = `<span style="color:${data.reaktion_h <= ziel ? "#15803d" : "#b45309"}">${value}</span>`;
		}
		return value;
	},
};
