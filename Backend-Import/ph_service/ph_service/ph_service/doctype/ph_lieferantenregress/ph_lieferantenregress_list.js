frappe.listview_settings["PH Lieferantenregress"] = {
	add_fields: ["status", "frist_bis", "betrag_gefordert_cent"],
	filters: [["status", "in", ["Offen", "Gemeldet", "Anerkannt"]]],
	get_indicator(doc) {
		const f = { Offen: "blue", Gemeldet: "orange", Anerkannt: "cyan", Abgelehnt: "red", Verrechnet: "green" };
		return [__(doc.status), f[doc.status] || "gray", `status,=,${doc.status}`];
	},
};
