frappe.listview_settings["PH Newsletter Ausgabe"] = {
	add_fields: ["status", "versand_geplant", "versandbereit"],
	get_indicator(doc) {
		const farben = { Entwurf: "gray", Freigabe: "orange", Geplant: "blue", "Wird versendet": "purple", Versendet: "green", Abgebrochen: "red" };
		return [__(doc.status), farben[doc.status] || "gray", `status,=,${doc.status}`];
	},
};
