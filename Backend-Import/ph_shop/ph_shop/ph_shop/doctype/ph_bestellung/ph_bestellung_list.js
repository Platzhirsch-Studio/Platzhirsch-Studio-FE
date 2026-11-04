// Listenansicht PH Bestellung: Statusfarben, Standardfilter „offen“.
frappe.listview_settings["PH Bestellung"] = {
	add_fields: ["status", "lieferart", "zahlung", "gesamt_cent", "modus", "angelegt"],
	filters: [["status", "in", ["offen", "zahlung_ausstehend", "bezahlt", "versandbereit", "reserviert", "abholbereit", "pruefen"]]],
	get_indicator(doc) {
		const farben = { offen: "blue", zahlung_ausstehend: "orange", bezahlt: "green", versandbereit: "cyan", versendet: "purple", reserviert: "yellow", abholbereit: "cyan", abgeholt: "green", abgeschlossen: "gray", fehlgeschlagen: "red", abgelaufen: "gray", storniert: "red", widerrufen: "red", erstattet: "gray", teilerstattet: "orange", checkout_fehler: "red", pruefen: "pink" };
		return [__(doc.status), farben[doc.status] || "gray", `status,=,${doc.status}`];
	},
	formatters: {
		gesamt_cent(value) {
			return format_currency((value || 0) / 100, "EUR");
		},
	},
};
