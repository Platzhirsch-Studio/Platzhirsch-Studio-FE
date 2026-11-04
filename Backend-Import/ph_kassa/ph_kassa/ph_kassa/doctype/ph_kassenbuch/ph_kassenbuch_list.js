frappe.listview_settings["PH Kassenbuch"] = {
	add_fields: ["status", "art", "bewegung_cent", "bestand_danach_cent"],
	filters: [["status", "=", "Gebucht"]],
	get_indicator(doc) {
		if (doc.status === "Storniert") return [__("Storniert"), "gray", "status,=,Storniert"];
		const farben = { Einlage: "green", Entnahme: "orange", Bareinnahme: "green", Barausgabe: "orange", Differenz: "red", Anfangsbestand: "blue" };
		return [__(doc.art), farben[doc.art] || "gray", `art,=,${doc.art}`];
	},
};
