frappe.query_reports["PH Abwesenheiten"] = {
	filters: [
		{ fieldname: "jahr", label: __("Jahr"), fieldtype: "Int", default: new Date().getFullYear(), reqd: 1 },
		{ fieldname: "mitarbeiter", label: __("Mitarbeiter"), fieldtype: "Link", options: "PH Mitarbeiter" },
		{ fieldname: "mit_ausgetretenen", label: __("Ausgetretene einbeziehen"), fieldtype: "Check", default: 0 },
	],
	formatter(value, row, column, data, default_formatter) {
		value = default_formatter(value, row, column, data);
		if (column.fieldname === "rest" && data) value = `<span class="indicator-pill ${data.rest < 0 ? "red" : data.rest <= 5 ? "orange" : "green"}">${value}</span>`;
		return value;
	},
};
