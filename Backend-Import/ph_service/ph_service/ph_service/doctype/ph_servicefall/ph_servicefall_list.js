// Listenansicht PH Servicefall: Statusfarben, Fristen-Hinweis, Standardfilter „offen“.
frappe.listview_settings["PH Servicefall"] = {
	add_fields: ["status", "art", "prioritaet", "fristen_status", "gewaehrleistung_bis", "frist_reaktion", "erstreaktion_am", "eskalationsstufe"],
	filters: [["status", "in", ["Gemeldet", "Geprueft", "Entscheidung", "In Bearbeitung", "Einsatz geplant"]]],
	get_indicator(doc) {
		const farben = { Gemeldet: "blue", Geprueft: "cyan", Entscheidung: "purple", "In Bearbeitung": "orange", "Einsatz geplant": "yellow", Erledigt: "green", Geschlossen: "gray", Abgelehnt: "red" };
		if (doc.status === "Gemeldet" && !doc.erstreaktion_am && doc.frist_reaktion && frappe.datetime.get_diff(doc.frist_reaktion, frappe.datetime.get_today()) < 0) {
			return [__("Reaktion überfällig"), "red", "status,=,Gemeldet"];
		}
		return [__(doc.status), farben[doc.status] || "gray", `status,=,${doc.status}`];
	},
	formatters: {
		fristen_status(value) {
			const f = { "Gewaehrleistung (Vermutung)": "green", Gewaehrleistung: "orange", Verjaehrungsfrist: "orange", "Nur Garantie": "orange", Abgelaufen: "red", Unbekannt: "gray" };
			return value ? `<span class="indicator-pill ${f[value] || "gray"}">${__(value)}</span>` : "";
		},
	},
	onload(listview) {
		listview.page.add_inner_button(__("Fehlerkatalog"), () => frappe.set_route("List", "PH Fehlercode"));
	},
};
