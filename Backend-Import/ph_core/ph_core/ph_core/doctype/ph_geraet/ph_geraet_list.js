// Listenansicht: Aktiv (grün), Gesperrt (rot), ohne Token (orange); Standardfilter aktiv.
frappe.listview_settings["PH Geraet"] = {
	add_fields: ["aktiv", "token_vorhanden", "zuletzt_gesehen", "typ"],
	filters: [["aktiv", "=", 1]],
	get_indicator(doc) {
		if (!doc.aktiv) return [__("Gesperrt"), "red", "aktiv,=,0"];
		if (!doc.token_vorhanden) return [__("Ohne Token"), "orange", "token_vorhanden,=,0"];
		return [__("Aktiv"), "green", "aktiv,=,1"];
	},
};
