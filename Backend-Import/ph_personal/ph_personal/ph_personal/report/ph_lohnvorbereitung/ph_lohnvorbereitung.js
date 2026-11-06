frappe.query_reports["PH Lohnvorbereitung"] = {
	filters: [
		{ fieldname: "jahr", label: __("Jahr"), fieldtype: "Int", default: new Date().getFullYear(), reqd: 1 },
		{ fieldname: "monat", label: __("Monat"), fieldtype: "Select", options: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"], default: String(new Date().getMonth() || 12), reqd: 1 },
	],
};
