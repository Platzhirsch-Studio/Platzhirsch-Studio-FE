frappe.query_reports["PH Vertriebscockpit"] = {
	filters: [
		{ fieldname: "von", label: __("Von"), fieldtype: "Date", default: frappe.datetime.year_start(), reqd: 1 },
		{ fieldname: "bis", label: __("Bis"), fieldtype: "Date", default: frappe.datetime.get_today(), reqd: 1 },
		{ fieldname: "intervall", label: __("Intervall"), fieldtype: "Select", options: ["Monat", "Woche", "Quartal"], default: "Monat" },
		{ fieldname: "berater", label: __("Berater / Zuständig"), fieldtype: "Link", options: "User" },
	],
	formatter(value, row, column, data, default_formatter) {
		value = default_formatter(value, row, column, data);
		if (["umsatz_cent", "angebote_offen_cent", "anzahlung_offen_cent"].includes(column.fieldname) && data && data[column.fieldname] != null) {
			value = format_currency(data[column.fieldname] / 100, "EUR");
		}
		return value;
	},
};
