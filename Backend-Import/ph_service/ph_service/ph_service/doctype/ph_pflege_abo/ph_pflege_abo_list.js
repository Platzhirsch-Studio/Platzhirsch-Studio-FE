frappe.listview_settings["PH Pflege Abo"] = {
	add_fields: ["status", "naechster_termin", "ueberfaellig", "art", "bereich"],
	filters: [["status", "in", ["Angefragt", "Angeboten", "Aktiv", "Pausiert"]]],
	get_indicator(doc) {
		if (doc.ueberfaellig) return [__("Überfällig"), "red", "ueberfaellig,=,1"];
		const f = { Angefragt: "blue", Angeboten: "orange", Aktiv: "green", Pausiert: "yellow", Gekuendigt: "red", Beendet: "gray" };
		return [__(doc.status), f[doc.status] || "gray", `status,=,${doc.status}`];
	},
};
