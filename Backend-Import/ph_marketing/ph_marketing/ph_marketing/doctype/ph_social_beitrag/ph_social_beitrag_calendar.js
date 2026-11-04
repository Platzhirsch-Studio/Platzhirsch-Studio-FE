// Kalenderansicht (Workspace-Shortcut „Social-Kalender“): Plandatum je Beitrag, Farbe nach Status.
frappe.views.calendar["PH Social Beitrag"] = {
	field_map: { start: "datum_geplant", end: "datum_geplant", id: "name", title: "titel", allDay: "allDay", color: "color" },
	get_events_method: "frappe.desk.calendar.get_events",
	filters: [{ fieldtype: "Select", fieldname: "kanal", options: "Pinterest\nInstagram\nLinkedIn\nYouTube\nFacebook", label: __("Kanal") }],
	style_map: { Idee: "info", Entwurf: "info", Freigegeben: "warning", Geplant: "warning", Veroeffentlicht: "success", Verworfen: "danger" },
	get_css_class(data) {
		return this.style_map[data.status] || "info";
	},
};
