// Kalenderansicht der Termine (Liste → Kalender). Farbe nach Status.
frappe.views.calendar["PH Termin"] = {
	field_map: { start: "start", end: "ende", id: "name", title: "titel", allDay: "allDay", color: "color" },
	gantt: false,
	order_by: "start",
	get_events_method: "ph_crm.ph_crm.doctype.ph_termin.ph_termin_kalender.get_events",
	filters: [
		{ fieldtype: "Link", fieldname: "berater", options: "User", label: __("Berater") },
		{ fieldtype: "Select", fieldname: "modus", options: "\nShowroom\nVor Ort\nVideo\nTelefon", label: __("Modus") },
	],
};
