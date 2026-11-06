frappe.listview_settings["PH Datei"] = {
	add_fields: ["status", "gesperrt_von", "portal_freigabe", "endung"],
	filters: [["status", "=", "Aktiv"]],
	get_indicator(doc) {
		if (doc.status === "Papierkorb") return [__("Papierkorb"), "gray", "status,=,Papierkorb"];
		if (doc.status === "Hochladen") return [__("Hochladen"), "orange", "status,=,Hochladen"];
		if (doc.gesperrt_von) return [__("Ausgecheckt"), "orange", "gesperrt_von,is,set"];
		if (doc.portal_freigabe) return [__("Im Portal"), "blue", "portal_freigabe,=,1"];
		return [__("Aktiv"), "green", "status,=,Aktiv"];
	},
};
