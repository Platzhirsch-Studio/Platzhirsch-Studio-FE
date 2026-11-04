frappe.query_reports["PH Nummernluecken"] = {
	filters: [
		{ fieldname: "jahr", label: __("Jahr"), fieldtype: "Int", default: new Date().getFullYear() },
	],
};
