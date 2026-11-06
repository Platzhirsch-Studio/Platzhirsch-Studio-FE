frappe.query_reports["PH Kontakt Dubletten"] = {
	filters: [
		{ fieldname: "min_punkte", label: __("Mindestpunkte"), fieldtype: "Int", default: 30 },
		{ fieldname: "limit", label: __("Höchstens Paare"), fieldtype: "Int", default: 500 },
	],
	formatter(value, row, column, data, default_formatter) {
		value = default_formatter(value, row, column, data);
		if (column.fieldname === "punkte" && data) value = `<span class="indicator-pill ${data.punkte >= 60 ? "red" : "orange"}">${value}</span>`;
		return value;
	},
};
