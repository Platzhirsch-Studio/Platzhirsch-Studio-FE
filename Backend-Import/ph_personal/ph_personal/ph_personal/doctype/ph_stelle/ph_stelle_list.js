// Listenansicht PH Stelle: Statusfarben, Standardfilter „offen“, Warnung ohne Entgelt.
frappe.listview_settings["PH Stelle"] = {
	add_fields: ["status", "entgelt_vollstaendig", "gueltig_bis", "kategorie"],
	filters: [["status", "in", ["Entwurf", "Aktiv", "Pausiert"]]],
	get_indicator(doc) {
		const farben = { Entwurf: "gray", Aktiv: "green", Pausiert: "orange", Besetzt: "blue", Archiviert: "purple" };
		if (doc.status === "Aktiv" && !doc.entgelt_vollstaendig) return [__("Aktiv ohne Entgelt"), "red", "entgelt_vollstaendig,=,0"];
		return [__(doc.status), farben[doc.status] || "gray", `status,=,${doc.status}`];
	},
	formatters: {
		entgelt_vollstaendig(value) {
			return value ? `<span class="indicator-pill green">${__("GlBG ok")}</span>` : `<span class="indicator-pill red">${__("Entgelt fehlt")}</span>`;
		},
	},
};
