// PH Dienstplan – Prüfen, Veröffentlichen (Leitung), In Folgewoche kopieren; Schichtvorlage füllt Zeiten.
frappe.ui.form.on("PH Dienstplan", {
	refresh(frm) {
		const farben = { Entwurf: "orange", Veroeffentlicht: "green" };
		if (frm.doc.status) frm.page.set_indicator(__(frm.doc.status), farben[frm.doc.status] || "gray");
		if (frm.doc.konflikte_anzahl) frm.dashboard.set_headline_alert(__("{0} Konflikte, {1} unterbesetzte Zeitfenster – siehe Prüfergebnis.", [frm.doc.konflikte_anzahl, frm.doc.unterbesetzung_anzahl]), "orange");
		if (frm.is_new()) return;
		frm.add_custom_button(__("Prüfen"), () => frm.call({ method: "pruefen", doc: frm.doc }).then(() => frm.reload_doc()), __("Aktionen"));
		frm.add_custom_button(__("In Folgewoche kopieren"), () => frm.call({ method: "in_folgewoche_kopieren", doc: frm.doc }).then((r) => r.message && frappe.set_route("Form", "PH Dienstplan", r.message)), __("Aktionen"));
		if (frappe.user.has_role("PH Personal Leitung")) {
			if (frm.doc.status === "Entwurf") frm.add_custom_button(__("Veröffentlichen"), () => frm.call({ method: "veroeffentlichen", doc: frm.doc }).then(() => frm.reload_doc()), __("Aktionen"));
			else frm.add_custom_button(__("Zurück auf Entwurf"), () => frm.call({ method: "zurueck_auf_entwurf", doc: frm.doc }).then(() => frm.reload_doc()), __("Aktionen"));
		}
	},
});

frappe.ui.form.on("PH Dienstplan Schicht", {
	schicht(frm, cdt, cdn) {
		const z = locals[cdt][cdn];
		if (!z.schicht) return;
		frappe.db.get_value("PH Schicht", z.schicht, ["beginn", "ende", "pause_min", "bereich"]).then((r) => {
			const v = r.message || {};
			frappe.model.set_value(cdt, cdn, { beginn: v.beginn, ende: v.ende, pause_min: v.pause_min, bereich: v.bereich });
		});
	},
});
