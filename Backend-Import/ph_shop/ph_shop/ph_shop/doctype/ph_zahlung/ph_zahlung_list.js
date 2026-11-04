frappe.listview_settings["PH Zahlung"] = {
	add_fields: ["status", "art", "kanal", "betrag_cent", "livemode", "zeitpunkt"],
	get_indicator(doc) {
		const farben = { Angekuendigt: "blue", Bezahlt: "green", Fehlgeschlagen: "red", Erstattet: "gray", Teilerstattet: "orange", Storniert: "gray", "Erstattung angefordert": "purple" };
		return [__(doc.status), farben[doc.status] || "gray", `status,=,${doc.status}`];
	},
	formatters: {
		betrag_cent(value, df, doc) {
			const s = format_currency((value || 0) / 100, "EUR");
			return doc.art === "Erstattung" ? `<span class="text-danger">−${s}</span>` : s;
		},
	},
};
