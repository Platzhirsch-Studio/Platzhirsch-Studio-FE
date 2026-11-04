frappe.listview_settings["PH Herstellerbestellung"] = {
	add_fields: ["status", "abweichungen_offen", "bestaetigter_termin", "lieferant"],
	filters: [["status", "not in", ["Abgeschlossen", "Storniert"]]],
	get_indicator(doc) {
		const farben = { Entwurf: "gray", Gesendet: "blue", "AB erhalten": "cyan", "AB geprueft": "purple", Teilgeliefert: "orange", Geliefert: "green", Abgeschlossen: "green", Storniert: "red" };
		if (doc.abweichungen_offen && ["AB erhalten", "AB geprueft"].includes(doc.status)) return [__("{0} · {1} Abweichungen", [__(doc.status), doc.abweichungen_offen]), "orange", "abweichungen_offen,>,0"];
		return [__(doc.status), farben[doc.status] || "gray", `status,=,${doc.status}`];
	},
};
