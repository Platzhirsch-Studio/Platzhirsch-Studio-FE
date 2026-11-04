frappe.query_reports["PH Termine je Berater"] = {
	filters: [
		{ fieldname: "von", label: __("Von"), fieldtype: "Date", default: frappe.datetime.add_months(frappe.datetime.get_today(), -3), reqd: 1 },
		{ fieldname: "bis", label: __("Bis"), fieldtype: "Date", default: frappe.datetime.get_today(), reqd: 1 },
		{ fieldname: "berater", label: __("Berater"), fieldtype: "Link", options: "User" },
		{ fieldname: "modus", label: __("Modus"), fieldtype: "Select", options: ["", "Showroom", "Vor Ort", "Video", "Telefon"] },
	],
	formatter(value, row, column, data, default_formatter) {
		value = default_formatter(value, row, column, data);
		if (column.fieldname === "no_show_quote" && data && data.no_show_quote > 15) value = `<span style="color:#b91c1c;font-weight:600">${value}</span>`;
		return value;
	},
};
