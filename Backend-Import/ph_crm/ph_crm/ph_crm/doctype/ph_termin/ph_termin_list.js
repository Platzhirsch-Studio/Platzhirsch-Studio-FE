frappe.listview_settings["PH Termin"] = {
	add_fields: ["status", "modus", "start", "berater", "email_verifiziert", "reserviert_bis"],
	filters: [["status", "in", ["Unbestaetigt", "Bestaetigt"]]],
	get_indicator(doc) {
		const farben = { Unbestaetigt: "orange", Bestaetigt: "green", Erledigt: "blue", Storniert: "gray", Abgelehnt: "red", "Nicht erschienen": "purple" };
		let label = __(doc.status);
		if (doc.status === "Unbestaetigt" && doc.email_verifiziert) label = __("Anfrage (E-Mail bestätigt)");
		return [label, farben[doc.status] || "gray", `status,=,${doc.status}`];
	},
	onload(listview) {
		listview.page.add_inner_button(__("Heute"), () => {
			listview.filter_area.clear().then(() => listview.filter_area.add([["PH Termin", "start", "Timespan", "today"], ["PH Termin", "status", "in", ["Unbestaetigt", "Bestaetigt"]]]));
		});
		listview.page.add_inner_button(__("Kalender"), () => frappe.set_route("List", "PH Termin", "Calendar", "default"));
	},
};
