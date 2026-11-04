frappe.query_reports["PH Offene Posten"] = {
	filters: [
		{ fieldname: "stichtag", label: __("Stichtag"), fieldtype: "Date", default: frappe.datetime.get_today(), reqd: 1 },
		{ fieldname: "kontakt", label: __("Kunde"), fieldtype: "Link", options: "PH Kontakt" },
		{ fieldname: "nur_ueberfaellig", label: __("Nur überfällig"), fieldtype: "Check", default: 0 },
	],
};
