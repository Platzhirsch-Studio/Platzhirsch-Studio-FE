// Kalenderansicht PH Abwesenheit (Teamkalender): Farbe nach Status/Art.
frappe.views.calendar["PH Abwesenheit"] = {
	field_map: { start: "von", end: "bis", id: "name", title: "titel", allDay: "allDay", color: "color" },
	options: { header: { left: "prev,next today", center: "title", right: "month,agendaWeek" } },
	get_events_method: "ph_personal.api.abwesenheiten_kalender",
};
