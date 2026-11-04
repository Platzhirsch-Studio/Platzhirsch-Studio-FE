frappe.query_reports["PH Offene Maengel"] = {
	filters: [
		{ fieldname: "projekt", label: __("Projekt"), fieldtype: "Link", options: "PH Projekt" },
		{ fieldname: "nur_ueberfaellig", label: __("Nur überfällige"), fieldtype: "Check", default: 0 },
	],
	formatter(value, row, column, data, default_formatter) {
		value = default_formatter(value, row, column, data);
		if (column.fieldname === "frist" && data && data.ueberfaellig) value = `<span style="color:#b91c1c;font-weight:600">${value}</span>`;
		return value;
	},
};
