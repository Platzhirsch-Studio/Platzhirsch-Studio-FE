// Listenansicht PH Produkt: Statusfarben, Standardfilter „nicht ausgelaufen“.
frappe.listview_settings["PH Produkt"] = {
	add_fields: ["status", "bild_freigegeben", "preisstand_alt", "bild_hauptbild", "aktueller_preis_cent"],
	filters: [["status", "!=", "Ausgelaufen"]],
	get_indicator(doc) {
		const farben = { Entwurf: "gray", Geprueft: "blue", Aktiv: "green", Pausiert: "orange", Ausgelaufen: "red" };
		if (doc.status === "Aktiv" && doc.preisstand_alt) return [__("Aktiv · Preis veraltet"), "orange", "preisstand_alt,=,1"];
		return [__(doc.status), farben[doc.status] || "gray", `status,=,${doc.status}`];
	},
	formatters: {
		aktueller_preis_cent(v) {
			return v ? format_currency(v / 100, "EUR") : "";
		},
	},
};
