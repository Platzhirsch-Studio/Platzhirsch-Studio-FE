frappe.query_reports["PH Anzahlungsstand"] = {
	filters: [
		{ fieldname: "status", label: __("Status"), fieldtype: "Select", options: "\nOffen\nIn Bestellung\nTeilgeliefert\nGeliefert\nAbgerechnet" },
		{ fieldname: "nur_offen", label: __("Nur mit offener Anzahlung"), fieldtype: "Check", default: 1 },
	],
};
