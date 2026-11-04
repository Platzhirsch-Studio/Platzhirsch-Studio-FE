frappe.query_reports["PH Loeschfristen"] = {
	filters: [
		{ fieldname: "ansicht", label: __("Ansicht"), fieldtype: "Select", options: ["Offen", "Evidenz", "Gelöscht", "Alle"], default: "Offen", reqd: 1 },
		{ fieldname: "tage", label: __("Horizont (Tage)"), fieldtype: "Int", default: 30 },
	],
	formatter(value, row, column, data, default_formatter) {
		value = default_formatter(value, row, column, data);
		if (column.fieldname === "zustand" && data) {
			if (data.zustand === __("Fällig")) value = `<span class="indicator-pill red">${value}</span>`;
			else if (String(data.zustand).startsWith(__("Fällig in"))) value = `<span class="indicator-pill orange">${value}</span>`;
			else if (data.zustand === __("Gelöscht")) value = `<span class="indicator-pill gray">${value}</span>`;
		}
		return value;
	},
};
