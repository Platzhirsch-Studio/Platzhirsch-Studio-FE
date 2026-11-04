frappe.query_reports["PH Monatsstunden"] = {
	filters: [
		{ fieldname: "jahr", label: __("Jahr"), fieldtype: "Int", default: new Date().getFullYear(), reqd: 1 },
		{ fieldname: "monat", label: __("Monat"), fieldtype: "Select", options: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"], default: String(new Date().getMonth() + 1), reqd: 1 },
		{ fieldname: "mitarbeiter", label: __("Mitarbeiter"), fieldtype: "Link", options: "PH Mitarbeiter" },
		{ fieldname: "mit_ausgetretenen", label: __("Ausgetretene einbeziehen"), fieldtype: "Check", default: 0 },
	],
	formatter(value, row, column, data, default_formatter) {
		value = default_formatter(value, row, column, data);
		if (column.fieldname === "saldo_text" && data) value = `<span class="indicator-pill ${data.saldo_h >= 0 ? "green" : "red"}">${value}</span>`;
		if (column.fieldname === "offen" && data && data.offen > 0) value = `<span class="indicator-pill orange">${value}</span>`;
		return value;
	},
};
